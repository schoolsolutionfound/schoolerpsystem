import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { useFinanceStore } from '../../accountant/store/useFinanceStore';

interface FeeHead {
  id: string;
  title: string;
  term: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid';
  paidDate?: string;
  receiptNo?: string;
}

const INITIAL_FEES: FeeHead[] = [
  {
    id: 'f-1',
    title: 'Term 1 Tuition & Composite Fee',
    term: 'Term 1 (Apr - Sep 2026)',
    amount: 14500,
    dueDate: '15 Apr 2026',
    status: 'paid',
    paidDate: '12 Apr 2026',
    receiptNo: 'REC-2026-8821',
  },
  {
    id: 'f-2',
    title: 'Annual Lab & Activity Charges',
    term: 'Session 2026-27',
    amount: 3200,
    dueDate: '30 May 2026',
    status: 'paid',
    paidDate: '28 May 2026',
    receiptNo: 'REC-2026-9042',
  },
  {
    id: 'f-3',
    title: 'Term 2 Tuition & Composite Fee',
    term: 'Term 2 (Oct 2026 - Mar 2027)',
    amount: 14500,
    dueDate: '15 Oct 2026',
    status: 'unpaid',
  },
  {
    id: 'f-4',
    title: 'School Transport (Route #4)',
    term: 'Quarter 3 (Oct - Dec 2026)',
    amount: 3600,
    dueDate: '20 Oct 2026',
    status: 'unpaid',
  },
];

export const ParentFeesView: React.FC = () => {
  const [fees, setFees] = useState<FeeHead[]>(INITIAL_FEES);
  const [selectedFee, setSelectedFee] = useState<FeeHead | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<FeeHead | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const addIncome = useFinanceStore((s) => s.addIncome);

  const totalDue = fees
    .filter((f) => f.status === 'unpaid')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalPaid = fees
    .filter((f) => f.status === 'paid')
    .reduce((sum, f) => sum + f.amount, 0);

  const handleOpenPay = (fee: FeeHead) => {
    setSelectedFee(fee);
    setPaymentSuccess(false);
    setShowPayModal(true);
  };

  const handleProcessPayment = () => {
    if (!selectedFee) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);

      const updatedReceiptNo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const updatedFees = fees.map((f) =>
        f.id === selectedFee.id
          ? {
              ...f,
              status: 'paid' as const,
              paidDate: new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
              receiptNo: updatedReceiptNo,
            }
          : f
      );
      setFees(updatedFees);

      // Reactively sync into accountant income ledger
      addIncome({
        title: `Parent Fee: Rohan Verma (${selectedFee.title})`,
        amount: selectedFee.amount,
        category: 'student_fee',
        payerName: 'Rohan Verma',
        studentId: 'SCH-2024-1082',
        classSection: '10-A',
        rollNo: '14',
        paymentMethod: 'upi',
        paymentDate: new Date().toISOString().slice(0, 10),
        status: 'paid',
      });
    }, 1200);
  };

  const handleOpenReceipt = (fee: FeeHead) => {
    setViewingReceipt(fee);
    setShowReceiptModal(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Balance Summary Header Card */}
      <View style={styles.heroBalanceCard}>
        <View style={styles.heroBalanceTop}>
          <View>
            <Text style={styles.heroBalanceLabel}>PENDING DUES</Text>
            <Text style={styles.heroBalanceAmount}>₹{totalDue.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.paidBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
            <Text style={styles.paidBadgeText}>₹{totalPaid.toLocaleString('en-IN')} Paid</Text>
          </View>
        </View>
        <Text style={styles.heroBalanceSub}>
          Next due date: 15 Oct 2026 • 2 Installments Pending
        </Text>
      </View>

      {/* Fee Statement List */}
      <Text style={styles.sectionTitle}>Fee Breakdown & Invoices</Text>
      {fees.map((fee) => {
        const isPaid = fee.status === 'paid';
        return (
          <View key={fee.id} style={styles.feeCard}>
            <View style={styles.feeCardTop}>
              <View style={styles.feeTitleGroup}>
                <View
                  style={[
                    styles.feeIconCircle,
                    { backgroundColor: isPaid ? '#ECFDF5' : '#FEF3C7' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isPaid ? 'receipt-text-check' : 'receipt-text-outline'}
                    size={20}
                    color={isPaid ? '#059669' : '#D97706'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.feeTitle}>{fee.title}</Text>
                  <Text style={styles.feeTerm}>{fee.term}</Text>
                </View>
              </View>
              <Text style={styles.feeAmount}>₹{fee.amount.toLocaleString('en-IN')}</Text>
            </View>

            <View style={styles.feeDivider} />

            <View style={styles.feeCardBottom}>
              <View>
                <Text style={styles.feeDateLabel}>
                  {isPaid ? `Paid on ${fee.paidDate}` : `Due by ${fee.dueDate}`}
                </Text>
                {isPaid && <Text style={styles.receiptTag}>Rec #{fee.receiptNo}</Text>}
              </View>

              {isPaid ? (
                <TouchableOpacity
                  style={styles.receiptBtn}
                  onPress={() => handleOpenReceipt(fee)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="download" size={14} color="#4F46E5" />
                  <Text style={styles.receiptBtnText}>Receipt</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.payNowBtn}
                  onPress={() => handleOpenPay(fee)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="lightning-bolt" size={14} color="#FFFFFF" />
                  <Text style={styles.payNowBtnText}>Pay Now</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      {/* Payment Gateway Modal */}
      <Modal visible={showPayModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <MaterialCommunityIcons name="shield-lock-outline" size={22} color="#4F46E5" />
                <Text style={styles.modalTitle}>SchoolHub Secure Pay</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPayModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {paymentSuccess ? (
              <View style={styles.successBox}>
                <View style={styles.successIconCircle}>
                  <MaterialCommunityIcons name="check" size={32} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <Text style={styles.successSub}>
                  ₹{selectedFee?.amount.toLocaleString('en-IN')} paid for {selectedFee?.title}.
                </Text>
                <Text style={styles.successRef}>
                  Txn ID: UPI-{Date.now().toString().slice(-8)}
                </Text>
                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={() => setShowPayModal(false)}
                >
                  <Text style={styles.modalDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.billBreakdown}>
                  <Text style={styles.billLabel}>Paying for</Text>
                  <Text style={styles.billItem}>{selectedFee?.title}</Text>
                  <Text style={styles.billSub}>{selectedFee?.term}</Text>

                  <View style={styles.billDivider} />
                  <View style={styles.billRow}>
                    <Text style={styles.billTotalText}>Total Payable</Text>
                    <Text style={styles.billTotalAmount}>
                      ₹{selectedFee?.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.upiOptionTitle}>Instant Payment Option</Text>
                <View style={styles.upiOptionCard}>
                  <MaterialCommunityIcons name="qrcode-scan" size={24} color="#4F46E5" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.upiCardTitle}>Instant UPI / QR / Net Banking</Text>
                    <Text style={styles.upiCardSub}>GPay, PhonePe, Paytm or Debit Card</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.confirmPayBtn}
                  onPress={handleProcessPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="lock-check" size={18} color="#FFFFFF" />
                      <Text style={styles.confirmPayBtnText}>
                        Pay ₹{selectedFee?.amount.toLocaleString('en-IN')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Official Receipt Modal */}
      <Modal visible={showReceiptModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptModalCard}>
            <View style={styles.receiptTopRow}>
              <View style={styles.receiptBadge}>
                <MaterialCommunityIcons name="school" size={24} color="#4F46E5" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.receiptSchoolName}>DPS International</Text>
                  <Text style={styles.receiptSubtext}>Official Fee Receipt</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptMeta}>
              <View>
                <Text style={styles.receiptMetaLabel}>Receipt No</Text>
                <Text style={styles.receiptMetaVal}>{viewingReceipt?.receiptNo}</Text>
              </View>
              <View>
                <Text style={styles.receiptMetaLabel}>Date of Payment</Text>
                <Text style={styles.receiptMetaVal}>{viewingReceipt?.paidDate}</Text>
              </View>
            </View>

            <View style={styles.receiptStudentInfo}>
              <Text style={styles.receiptStudentName}>Student: Rohan Verma</Text>
              <Text style={styles.receiptStudentRoll}>Class: 10-A • Roll No: 14</Text>
            </View>

            <View style={styles.receiptLineItem}>
              <Text style={styles.receiptLineTitle}>{viewingReceipt?.title}</Text>
              <Text style={styles.receiptLineAmount}>
                ₹{viewingReceipt?.amount.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>Amount Received</Text>
              <Text style={styles.receiptTotalVal}>
                ₹{viewingReceipt?.amount.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.receiptFooter}>
              <Text style={styles.receiptVerified}>
                ✓ Verified by Institution Accounts Dept.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.downloadPdfBtn}
              onPress={() => {
                Alert.alert('Receipt Downloaded', 'Official receipt PDF saved to device storage.');
                setShowReceiptModal(false);
              }}
            >
              <MaterialCommunityIcons name="download" size={18} color="#FFFFFF" />
              <Text style={styles.downloadPdfBtnText}>Save / Download PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  heroBalanceCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.card,
    padding: 20,
    marginBottom: 20,
  },
  heroBalanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroBalanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  heroBalanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  paidBadgeText: { fontSize: 12, fontWeight: '700', color: '#10B981' },
  heroBalanceSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  feeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  feeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  feeTitleGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  feeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  feeTerm: { fontSize: 12, color: '#64748B', marginTop: 2 },
  feeAmount: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginLeft: 8 },
  feeDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
  feeCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeDateLabel: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  receiptTag: { fontSize: 10, color: '#059669', fontWeight: '700', marginTop: 2 },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  payNowBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  receiptBtnText: { color: '#4F46E5', fontSize: 12, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  billBreakdown: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  billLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  billItem: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginTop: 4 },
  billSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  billDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billTotalText: { fontSize: 13, fontWeight: '700', color: '#334155' },
  billTotalAmount: { fontSize: 18, fontWeight: '900', color: '#4F46E5' },
  upiOptionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  upiOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 16,
  },
  upiCardTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  upiCardSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  confirmPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  confirmPayBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  successBox: { alignItems: 'center', paddingVertical: 16 },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#065F46' },
  successSub: { fontSize: 13, color: '#475569', textAlign: 'center', marginTop: 6 },
  successRef: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  modalDoneBtn: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 18,
  },
  modalDoneBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  receiptModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  receiptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptBadge: { flexDirection: 'row', alignItems: 'center' },
  receiptSchoolName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  receiptSubtext: { fontSize: 11, color: '#64748B' },
  receiptMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  receiptMetaLabel: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  receiptMetaVal: { fontSize: 12, fontWeight: '700', color: '#1E293B', marginTop: 2 },
  receiptStudentInfo: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  receiptStudentName: { fontSize: 13, fontWeight: '800', color: '#3730A3' },
  receiptStudentRoll: { fontSize: 11, color: '#4F46E5', marginTop: 2 },
  receiptLineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  receiptLineTitle: { fontSize: 13, fontWeight: '600', color: '#334155' },
  receiptLineAmount: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#0F172A',
  },
  receiptTotalLabel: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  receiptTotalVal: { fontSize: 16, fontWeight: '900', color: '#059669' },
  receiptFooter: { alignItems: 'center', marginVertical: 14 },
  receiptVerified: { fontSize: 11, color: '#059669', fontWeight: '600' },
  downloadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  downloadPdfBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
