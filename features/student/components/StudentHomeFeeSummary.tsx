/**
 * @file StudentHomeFeeSummary.tsx
 * @description Student Fees & Dues View with Payment, Fee Structure, and Pay History.
 * Designed matching the user-provided design with all icons removed except payment method icons.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { useUserStore } from '../../../store/useUserStore';
import { generateStudentFeeReceiptPdf } from '../utils/receiptPdfGenerator';
import { useFinanceStore } from '../../accountant/store/useFinanceStore';

export interface StudentHomeFeeSummaryProps {
  onBack?: () => void;
}

type TabType = 'payment' | 'structure' | 'history';
type PaymentMethodType = 'upi' | 'debit' | 'credit' | 'netbanking';

interface FeeStructureItem {
  slNo: number;
  particulars: string;
  amount: number;
}

interface FeeTypeItem {
  id: string;
  name: string;
  total: number;
  paid: number;
  pending: number;
}

interface PaymentHistoryItem {
  id: string;
  date: string;
  particulars: string;
  amount: number;
  status: 'Paid';
  receiptNo: string;
  method: string;
}

const DEFAULT_FEE_STRUCTURE: FeeStructureItem[] = [
  { slNo: 1, particulars: 'Admission Fee', amount: 10000 },
  { slNo: 2, particulars: 'Tuition Fee', amount: 20000 },
  { slNo: 3, particulars: 'Exam Fee', amount: 5000 },
  { slNo: 4, particulars: 'Bus Fee', amount: 10000 },
  { slNo: 5, particulars: 'Hostel Fee', amount: 5000 },
];

const INITIAL_FEE_TYPES: FeeTypeItem[] = [
  { id: 'tuition', name: 'Tuition Fee', total: 20000, paid: 10000, pending: 10000 },
  { id: 'admission', name: 'Admission Fee', total: 10000, paid: 10000, pending: 0 },
  { id: 'exam', name: 'Exam Fee', total: 5000, paid: 0, pending: 5000 },
  { id: 'bus', name: 'Bus Fee', total: 10000, paid: 5000, pending: 5000 },
  { id: 'hostel', name: 'Hostel Fee', total: 5000, paid: 5000, pending: 0 },
];

const INITIAL_PAY_HISTORY: PaymentHistoryItem[] = [
  {
    id: 'pay-1',
    date: '01 Apr 2026',
    particulars: 'Admission Fee',
    amount: 10000,
    status: 'Paid',
    receiptNo: 'REC-2026-0401',
    method: 'UPI Online',
  },
  {
    id: 'pay-2',
    date: '01 Jun 2026',
    particulars: 'Tuition Fee',
    amount: 20000,
    status: 'Paid',
    receiptNo: 'REC-2026-0601',
    method: 'Debit Card',
  },
];

export const StudentHomeFeeSummary: React.FC<StudentHomeFeeSummaryProps> = ({ onBack }) => {
  const fullName = useUserStore((s) => s.fullName) || 'Student';
  const rollNoOrUSN = useUserStore((s) => s.rollNoOrUSN) || 'C6A-001';

  // State
  const [activeTab, setActiveTab] = useState<TabType>('payment');
  const [feeTypes, setFeeTypes] = useState<FeeTypeItem[]>(INITIAL_FEE_TYPES);
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState<string>('tuition');
  const [showFeeTypeModal, setShowFeeTypeModal] = useState<boolean>(false);

  const [enteredAmount, setEnteredAmount] = useState<string>('');
  const [isEditingAmount, setIsEditingAmount] = useState<boolean>(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('upi');
  const [historyList, setHistoryList] = useState<PaymentHistoryItem[]>(INITIAL_PAY_HISTORY);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentHistoryItem | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const financeIncome = useFinanceStore((s) => s.incomeRecords);

  // Dynamically merge finance store income records for this student into pay history
  const dynamicHistoryList = useMemo(() => {
    const combined = [...historyList];
    const studentRecords = financeIncome.filter(
      (r) =>
        r.status === 'paid' &&
        (r.rollNo === rollNoOrUSN || r.studentId === rollNoOrUSN || r.payerName === fullName)
    );
    studentRecords.forEach((sr) => {
      if (!combined.some((h) => h.receiptNo === sr.receiptNo)) {
        combined.unshift({
          id: sr.id,
          date: sr.paymentDate || 'Recently Paid',
          particulars: sr.title.replace(/^.*?\((.*?)\)$/, '$1') || 'Academic Fee',
          amount: sr.amount,
          status: 'Paid',
          receiptNo: sr.receiptNo,
          method: (sr.paymentMethod || 'UPI').toUpperCase(),
        });
      }
    });
    return combined;
  }, [historyList, financeIncome, rollNoOrUSN, fullName]);

  // Pull down refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // Handle receipt download as PDF
  const handleDownloadReceipt = async (item: PaymentHistoryItem) => {
    try {
      setDownloadingId(item.id);
      await generateStudentFeeReceiptPdf({
        id: item.id,
        receiptNo: item.receiptNo,
        date: item.date,
        particulars: item.particulars,
        amount: item.amount,
        method: item.method,
        studentName: fullName,
        rollNo: rollNoOrUSN,
      });
    } catch (err: any) {
      Alert.alert('Download Error', err?.message || 'Failed to download receipt');
    } finally {
      setDownloadingId(null);
    }
  };

  // Active selected fee type
  const activeFeeType = useMemo(() => {
    return feeTypes.find((f) => f.id === selectedFeeTypeId) || feeTypes[0];
  }, [feeTypes, selectedFeeTypeId]);

  // Overall totals across all fee types
  const overallTotals = useMemo(() => {
    const total = feeTypes.reduce((sum, item) => sum + item.total, 0);
    const paid = feeTypes.reduce((sum, item) => sum + item.paid, 0);
    const pending = feeTypes.reduce((sum, item) => sum + item.pending, 0);
    return { total, paid, pending };
  }, [feeTypes]);

  // Structure Total
  const structureTotal = useMemo(() => {
    return DEFAULT_FEE_STRUCTURE.reduce((sum, item) => sum + item.amount, 0);
  }, []);

  // Handle Pay Full Amount
  const handlePayFullAmount = () => {
    if (activeFeeType.pending > 0) {
      setEnteredAmount(String(activeFeeType.pending));
      setIsEditingAmount(false);
    }
  };

  // Handle Proceed to Pay
  const handleProceedToPay = () => {
    const amountNum = enteredAmount ? parseFloat(enteredAmount) : activeFeeType.pending;
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('No Amount Due', 'There is no pending amount due for this fee type.');
      return;
    }
    if (amountNum > activeFeeType.pending) {
      Alert.alert(
        'Amount Exceeds Pending',
        `The entered amount (₹${amountNum.toLocaleString('en-IN')}) cannot exceed the pending amount of ₹${activeFeeType.pending.toLocaleString('en-IN')}.`
      );
      return;
    }

    const methodNameMap: Record<PaymentMethodType, string> = {
      upi: 'UPI',
      debit: 'Debit Card',
      credit: 'Credit Card',
      netbanking: 'Net Banking',
    };

    Alert.alert(
      'Confirm Payment',
      `Proceed to pay ₹${amountNum.toLocaleString('en-IN')} for ${activeFeeType.name} via ${methodNameMap[selectedMethod]}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Pay',
          onPress: () => {
            const todayStr = new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
            const newReceiptNo = `REC-${Math.floor(100000 + Math.random() * 900000)}`;

            // Update fee types
            setFeeTypes((prev) =>
              prev.map((f) => {
                if (f.id === activeFeeType.id) {
                  const newPaid = f.paid + amountNum;
                  const newPending = Math.max(0, f.total - newPaid);
                  return { ...f, paid: newPaid, pending: newPending };
                }
                return f;
              })
            );

            // Add to history
            const newHistoryItem: PaymentHistoryItem = {
              id: `pay-${Date.now()}`,
              date: todayStr,
              particulars: activeFeeType.name,
              amount: amountNum,
              status: 'Paid',
              receiptNo: newReceiptNo,
              method: methodNameMap[selectedMethod],
            };

            setHistoryList([newHistoryItem, ...historyList]);
            setEnteredAmount('');

            const financeMethodMap: Record<PaymentMethodType, 'upi' | 'card' | 'bank_transfer'> = {
              upi: 'upi',
              debit: 'card',
              credit: 'card',
              netbanking: 'bank_transfer',
            };

            // Dynamically record to centralized finance store
            useFinanceStore.getState().addIncome({
              title: `Student Fee: ${fullName} (${activeFeeType.name})`,
              amount: amountNum,
              category: 'student_fee',
              payerName: fullName,
              studentId: rollNoOrUSN,
              rollNo: rollNoOrUSN,
              paymentMethod: financeMethodMap[selectedMethod],
              paymentDate: new Date().toISOString().slice(0, 10),
              status: 'paid',
            });

            Alert.alert(
              'Payment Successful!',
              `Receipt ${newReceiptNo} has been generated for ₹${amountNum.toLocaleString('en-IN')}.`,
              [
                {
                  text: 'View Pay History',
                  onPress: () => setActiveTab('history'),
                },
                { text: 'OK' },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Soft warm decor in top right matching student theme */}
      <View style={styles.decorCircle} pointerEvents="none" />

      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="chevron-left" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Fees</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      >
        {/* ─── Top 3-Metrics Card (NO ICONS) ───────────────────────────────── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Total Fees</Text>
            <Text style={styles.summaryValue}>₹{overallTotals.total.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={styles.summaryValue}>₹{overallTotals.paid.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>₹{overallTotals.pending.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* ─── Navigation Tabs Bar (3 Tabs) ───────────────────────────────── */}
        <View style={styles.tabsBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'payment' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('payment')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'payment' && styles.tabBtnTextActive]}>
              Payment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'structure' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('structure')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'structure' && styles.tabBtnTextActive]}>
              Fee Structure
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
              Pay History
            </Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: PAYMENT VIEW (Image 3)
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'payment' && (
          <View style={styles.cardContainer}>
            {/* Header: Make a Payment (NO ICON) */}
            <Text style={styles.cardHeaderTitle}>Make a Payment</Text>

            {/* Select Fee Type Dropdown */}
            <Text style={styles.inputSectionLabel}>Select Fee Type</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              activeOpacity={0.75}
              onPress={() => setShowFeeTypeModal(true)}
            >
              <Text style={styles.dropdownInputText}>{activeFeeType.name}</Text>
              <Feather name="chevron-down" size={20} color="#6B7280" />
            </TouchableOpacity>

            {/* Amount to Pay Card (Matching Uploaded Image) */}
            <View style={styles.amountToPayCard}>
              <View style={styles.amountToPayLeft}>
                <Text style={styles.amountToPayLabel}>Amount to Pay</Text>
                {isEditingAmount ? (
                  <View style={styles.editAmountRow}>
                    <Text style={styles.editAmountCurrency}>₹</Text>
                    <TextInput
                      style={styles.editAmountInput}
                      keyboardType="numeric"
                      value={enteredAmount}
                      onChangeText={setEnteredAmount}
                      autoFocus
                      onBlur={() => setIsEditingAmount(false)}
                      placeholder={String(activeFeeType.pending)}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      if (!enteredAmount) setEnteredAmount(String(activeFeeType.pending));
                      setIsEditingAmount(true);
                    }}
                  >
                    <Text style={styles.amountToPayValue}>
                      ₹{(enteredAmount && !isNaN(Number(enteredAmount)) ? Number(enteredAmount) : activeFeeType.pending).toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.payFullAmountBtn}
                activeOpacity={0.85}
                onPress={() => {
                  setEnteredAmount(String(activeFeeType.pending));
                  setIsEditingAmount(false);
                }}
              >
                <Text style={styles.payFullAmountBtnText}>Pay Full Amount</Text>
              </TouchableOpacity>
            </View>

            {/* Payment Method Section (NO ICONS) */}
            <Text style={[styles.inputSectionLabel, { marginTop: 18 }]}>Payment Method</Text>
            <View style={styles.methodsGrid}>
              {/* UPI */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  selectedMethod === 'upi' && styles.methodCardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedMethod('upi')}
              >
                <View style={styles.methodCardTop}>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedMethod === 'upi' && styles.radioCircleSelected,
                    ]}
                  >
                    {selectedMethod === 'upi' && <View style={styles.radioDot} />}
                  </View>
                </View>
                <Text style={styles.methodLabel}>UPI</Text>
              </TouchableOpacity>

              {/* Debit Card */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  selectedMethod === 'debit' && styles.methodCardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedMethod('debit')}
              >
                <View style={styles.methodCardTop}>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedMethod === 'debit' && styles.radioCircleSelected,
                    ]}
                  >
                    {selectedMethod === 'debit' && <View style={styles.radioDot} />}
                  </View>
                </View>
                <Text style={styles.methodLabel}>Debit Card</Text>
              </TouchableOpacity>

              {/* Credit Card */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  selectedMethod === 'credit' && styles.methodCardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedMethod('credit')}
              >
                <View style={styles.methodCardTop}>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedMethod === 'credit' && styles.radioCircleSelected,
                    ]}
                  >
                    {selectedMethod === 'credit' && <View style={styles.radioDot} />}
                  </View>
                </View>
                <Text style={styles.methodLabel}>Credit Card</Text>
              </TouchableOpacity>

              {/* Net Banking */}
              <TouchableOpacity
                style={[
                  styles.methodCard,
                  selectedMethod === 'netbanking' && styles.methodCardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedMethod('netbanking')}
              >
                <View style={styles.methodCardTop}>
                  <View
                    style={[
                      styles.radioCircle,
                      selectedMethod === 'netbanking' && styles.radioCircleSelected,
                    ]}
                  >
                    {selectedMethod === 'netbanking' && <View style={styles.radioDot} />}
                  </View>
                </View>
                <Text style={styles.methodLabel}>Net Banking</Text>
              </TouchableOpacity>
            </View>

            {/* Proceed to Pay Button */}
            <TouchableOpacity
              style={styles.proceedBtn}
              activeOpacity={0.85}
              onPress={handleProceedToPay}
            >
              <Text style={styles.proceedBtnText}>Proceed to Pay</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: FEE STRUCTURE TABLE (Image 1)
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'structure' && (
          <View style={styles.cardContainer}>
            {/* Header: Fee Structure (NO ICON) */}
            <Text style={styles.cardHeaderTitle}>Fee Structure</Text>

            {/* Table */}
            <View style={styles.tableBox}>
              {/* Table Header Row */}
              <View style={styles.tableHeaderRow}>
                <View style={[styles.tableCol, { width: 60 }]}>
                  <Text style={styles.tableColHeader}>Sl No.</Text>
                </View>
                <View style={styles.tableDividerVertical} />
                <View style={[styles.tableCol, { flex: 2, alignItems: 'flex-start', paddingLeft: 12 }]}>
                  <Text style={styles.tableColHeader}>Particulars</Text>
                </View>
                <View style={styles.tableDividerVertical} />
                <View style={[styles.tableCol, { flex: 1.3, alignItems: 'flex-end', paddingRight: 12 }]}>
                  <Text style={styles.tableColHeader}>Amount (₹)</Text>
                </View>
              </View>

              {/* Table Rows */}
              {DEFAULT_FEE_STRUCTURE.map((item, index) => (
                <View key={item.slNo}>
                  <View style={styles.tableDividerHorizontal} />
                  <View style={styles.tableBodyRow}>
                    <View style={[styles.tableCol, { width: 60 }]}>
                      <Text style={styles.tableBodyText}>{item.slNo}</Text>
                    </View>
                    <View style={styles.tableDividerVertical} />
                    <View style={[styles.tableCol, { flex: 2, alignItems: 'flex-start', paddingLeft: 12 }]}>
                      <Text style={styles.tableBodyParticularsText}>{item.particulars}</Text>
                    </View>
                    <View style={styles.tableDividerVertical} />
                    <View style={[styles.tableCol, { flex: 1.3, alignItems: 'flex-end', paddingRight: 12 }]}>
                      <Text style={styles.tableBodyAmountText}>
                        {item.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Table Total Row */}
              <View style={styles.tableDividerHorizontal} />
              <View style={[styles.tableBodyRow, styles.tableTotalRow]}>
                <View style={[styles.tableCol, { flex: 2.8, alignItems: 'flex-start', paddingLeft: 14 }]}>
                  <Text style={styles.tableTotalLabel}>Total</Text>
                </View>
                <View style={styles.tableDividerVertical} />
                <View style={[styles.tableCol, { flex: 1.3, alignItems: 'flex-end', paddingRight: 12 }]}>
                  <Text style={styles.tableTotalAmount}>
                    {structureTotal.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3: PAY HISTORY TABLE (Image 2)
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <View style={styles.cardContainer}>
            {/* Header: Pay History (NO ICON) */}
            <Text style={styles.cardHeaderTitle}>Pay History</Text>

            {/* Table */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: '100%' }}>
              <View style={[styles.tableBox, { minWidth: 480 }]}>
                {/* Header Row */}
                <View style={styles.tableHeaderRow}>
                  <View style={[styles.tableCol, { width: 95, alignItems: 'flex-start', paddingLeft: 10 }]}>
                    <Text style={styles.tableColHeader}>Date</Text>
                  </View>
                  <View style={styles.tableDividerVertical} />
                  <View style={[styles.tableCol, { width: 130, alignItems: 'flex-start', paddingLeft: 10 }]}>
                    <Text style={styles.tableColHeader}>Particulars</Text>
                  </View>
                  <View style={styles.tableDividerVertical} />
                  <View style={[styles.tableCol, { width: 95, alignItems: 'flex-end', paddingRight: 10 }]}>
                    <Text style={styles.tableColHeader}>Amount (₹)</Text>
                  </View>
                  <View style={styles.tableDividerVertical} />
                  <View style={[styles.tableCol, { width: 65 }]}>
                    <Text style={styles.tableColHeader}>Status</Text>
                  </View>
                  <View style={styles.tableDividerVertical} />
                  <View style={[styles.tableCol, { width: 95 }]}>
                    <Text style={styles.tableColHeader}>Receipt</Text>
                  </View>
                </View>

                {/* Rows */}
                {dynamicHistoryList.map((item) => (
                  <View key={item.id}>
                    <View style={styles.tableDividerHorizontal} />
                    <View style={styles.tableBodyRow}>
                      <View style={[styles.tableCol, { width: 95, alignItems: 'flex-start', paddingLeft: 10 }]}>
                        <Text style={styles.tableBodyDateText}>{item.date}</Text>
                      </View>
                      <View style={styles.tableDividerVertical} />
                      <View style={[styles.tableCol, { width: 130, alignItems: 'flex-start', paddingLeft: 10 }]}>
                        <Text style={styles.tableBodyParticularsText}>{item.particulars}</Text>
                      </View>
                      <View style={styles.tableDividerVertical} />
                      <View style={[styles.tableCol, { width: 95, alignItems: 'flex-end', paddingRight: 10 }]}>
                        <Text style={styles.tableBodyAmountText}>
                          {item.amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.tableDividerVertical} />
                      <View style={[styles.tableCol, { width: 65 }]}>
                        <Text style={styles.paidPlainText}>Paid</Text>
                      </View>
                      <View style={styles.tableDividerVertical} />
                      <View style={[styles.tableCol, { width: 95 }]}>
                        <TouchableOpacity
                          style={styles.downloadActionBtn}
                          activeOpacity={0.7}
                          onPress={() => handleDownloadReceipt(item)}
                          disabled={downloadingId === item.id}
                        >
                          <Text style={styles.downloadActionText}>
                            {downloadingId === item.id ? 'Saving...' : 'Download'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ─── Fee Type Selection Modal ─────────────────────────────────────── */}
      <Modal
        visible={showFeeTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFeeTypeModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFeeTypeModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Fee Type</Text>
              <TouchableOpacity onPress={() => setShowFeeTypeModal(false)}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {feeTypes.map((item) => {
              const isSelected = selectedFeeTypeId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.modalItem, isSelected && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedFeeTypeId(item.id);
                    setShowFeeTypeModal(false);
                    setEnteredAmount('');
                    setIsEditingAmount(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.modalItemText,
                        isSelected && styles.modalItemTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.modalItemSub}>
                      Total: ₹{item.total.toLocaleString('en-IN')} • Pending: ₹
                      {item.pending.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  {isSelected && <Feather name="check" size={18} color="#111827" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* ─── Receipt Details Modal ────────────────────────────────────────── */}
      <Modal
        visible={selectedReceipt !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedReceipt(null)}>
          <View style={styles.receiptModalCard}>
            <View style={styles.receiptModalHeader}>
              <Text style={styles.receiptModalTitle}>Payment Receipt</Text>
              <TouchableOpacity onPress={() => setSelectedReceipt(null)}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedReceipt && (
              <View style={styles.receiptBody}>
                <View style={styles.receiptHeaderBox}>
                  <Text style={styles.receiptAmountText}>
                    ₹{selectedReceipt.amount.toLocaleString('en-IN')}
                  </Text>
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>Payment Successful</Text>
                  </View>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Receipt Number</Text>
                  <Text style={styles.receiptValue}>{selectedReceipt.receiptNo}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Date & Time</Text>
                  <Text style={styles.receiptValue}>{selectedReceipt.date}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Particulars</Text>
                  <Text style={styles.receiptValue}>{selectedReceipt.particulars}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Student Name</Text>
                  <Text style={styles.receiptValue}>{fullName}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Roll No / USN</Text>
                  <Text style={styles.receiptValue}>{rollNoOrUSN}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Method</Text>
                  <Text style={styles.receiptValue}>{selectedReceipt.method}</Text>
                </View>

                <TouchableOpacity
                  style={styles.modalDownloadReceiptBtn}
                  activeOpacity={0.8}
                  onPress={() => selectedReceipt && handleDownloadReceipt(selectedReceipt)}
                  disabled={downloadingId === selectedReceipt.id}
                >
                  <MaterialCommunityIcons name="download" size={18} color="#000000" />
                  <Text style={styles.modalDownloadReceiptText}>
                    {downloadingId === selectedReceipt.id ? 'Saving...' : 'Download Receipt PDF'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeReceiptBtn}
                  activeOpacity={0.8}
                  onPress={() => setSelectedReceipt(null)}
                >
                  <Text style={styles.closeReceiptBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  decorCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FEF3C7',
    opacity: 0.6,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topHeaderTitle: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 40,
  },

  /* ─── Top 3-Metrics Summary Card ───────────────────────────────────── */
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F3EFE8',
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#EFE7D8',
  },

  /* ─── Navigation Tabs Bar ─────────────────────────────────────────── */
  tabsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F3EFE8',
    padding: 3,
    marginTop: 14,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  tabBtnActive: {
    backgroundColor: '#FDC836',
  },
  tabBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  tabBtnTextActive: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  /* ─── Main White Card Container ───────────────────────────────────── */
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F3EFE8',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginBottom: 14,
  },

  /* ─── Dropdown Input ──────────────────────────────────────────────── */
  inputSectionLabel: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginBottom: 6,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
  },
  dropdownInputText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },

  /* ─── Amount to Pay Card (Matching Uploaded Image) ───────────────── */
  amountToPayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#F6EEDB',
    borderRadius: 5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
  },
  amountToPayLeft: {
    flex: 1,
  },
  amountToPayLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginBottom: 3,
  },
  amountToPayValue: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  editAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editAmountCurrency: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#000000',
    marginRight: 2,
  },
  editAmountInput: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#000000',
    padding: 0,
    minWidth: 80,
  },
  payFullAmountBtn: {
    backgroundColor: '#FDC836',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payFullAmountBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  /* ─── Payment Methods ─────────────────────────────────────────────── */
  methodsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  methodCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    padding: 8,
    justifyContent: 'space-between',
    minHeight: 68,
  },
  methodCardSelected: {
    borderColor: '#FDC836',
    backgroundColor: '#FFFDF0',
  },
  methodCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#111827',
    marginTop: 8,
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#FDC836',
  },
  radioDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FDC836',
  },

  /* ─── Custom UPI Emblem Slants ────────────────────────────────────── */
  upiIconContainer: {
    width: 20,
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiSlantOrange: {
    width: 6,
    height: 15,
    backgroundColor: '#EA580C',
    transform: [{ skewX: '-25deg' }],
    marginRight: 2,
    borderRadius: 1,
  },
  upiSlantGreen: {
    width: 6,
    height: 15,
    backgroundColor: '#16A34A',
    transform: [{ skewX: '-25deg' }],
    borderRadius: 1,
  },

  /* ─── Proceed to Pay Button ───────────────────────────────────────── */
  proceedBtn: {
    backgroundColor: '#FDC836',
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  proceedBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  /* ─── Table Box (Fee Structure & Pay History) ──────────────────────── */
  tableBox: {
    borderWidth: 1,
    borderColor: '#F3EFE8',
    borderRadius: 5,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFDF0',
    paddingVertical: 12,
  },
  tableBodyRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
  },
  tableTotalRow: {
    backgroundColor: '#FFFDF0',
    paddingVertical: 13,
  },
  tableCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableColHeader: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  tableBodyText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#000000',
  },
  tableBodyParticularsText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#000000',
  },
  tableBodyAmountText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#000000',
  },
  tableBodyDateText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#000000',
  },
  tableTotalLabel: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  tableTotalAmount: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  tableDividerVertical: {
    width: 1,
    backgroundColor: '#F3EFE8',
  },
  tableDividerHorizontal: {
    height: 1,
    backgroundColor: '#F3EFE8',
  },

  /* ─── Status & Action Badges ──────────────────────────────────────── */
  paidBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  paidBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#15803D',
  },
  paidPlainText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#15803D',
    textAlign: 'center',
  },
  downloadActionBtn: {
    backgroundColor: '#FDC836',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadActionText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },

  /* ─── Modals ──────────────────────────────────────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE8',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  modalItemActive: {
    backgroundColor: '#FFFDF0',
  },
  modalItemText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },
  modalItemTextActive: {
    fontFamily: FontFamily.bold,
  },
  modalItemSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
  },

  /* ─── Receipt Modal ───────────────────────────────────────────────── */
  receiptModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 18,
  },
  receiptModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE8',
  },
  receiptModalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  receiptBody: {
    paddingTop: 12,
    gap: 10,
  },
  receiptHeaderBox: {
    alignItems: 'center',
    gap: 6,
    paddingBottom: 8,
  },
  receiptAmountText: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  receiptValue: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  modalDownloadReceiptBtn: {
    backgroundColor: '#FDC836',
    borderRadius: 5,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  modalDownloadReceiptText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  closeReceiptBtn: {
    backgroundColor: '#F3EFE8',
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  closeReceiptBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
});
