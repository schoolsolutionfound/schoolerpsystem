/**
 * @file StudentFeesView.tsx
 * @description Dedicated Student Fee Management screen: Paid vs Unpaid student fees, class dropdown filter, 1-tap collection & parent reminders.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinanceStore } from '../store/useFinanceStore';
import { IncomeRecord, PaymentMethod, PaymentStatus } from '../types/finance';
import { formatINR } from '../utils/financeUtils';
import { showAlert } from '../../shared/utils/showAlert';
import { sharedFinanceStyles } from './financeStyles';
import { fetchClassSectionsApi } from '../../../api/academics';
import { useUserStore } from '../../../store/useUserStore';
import { generateStudentFeeReceiptPdf } from '../utils/financePdfGenerator';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  upi: 'UPI',
  cash: 'Cash',
  card: 'Card',
  unknown: 'Not recorded',
};

const methodLabel = (m: PaymentMethod) => METHOD_LABELS[m] || m.toUpperCase();

export const StudentFeesView: React.FC = () => {
  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const collectStudentFee = useFinanceStore((s) => s.collectStudentFee);
  const updateIncomeRecord = useFinanceStore((s) => s.updateIncomeRecord);
  const deleteIncome = useFinanceStore((s) => s.deleteIncome);

  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [classOpen, setClassOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [classes, setClasses] = useState<string[]>(['all']);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    fetchClassSectionsApi().then((sections) => {
      const names = sections.map((s: any) => s.name || s.label).filter(Boolean);
      setClasses(['all', ...names]);
    }).catch(() => {});
  }, []);

  // Collect / Pay Modal
  const [collectItem, setCollectItem] = useState<IncomeRecord | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<IncomeRecord | null>(null);

  const handleDownloadReceiptPdf = async () => {
    if (!selectedReceipt || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await generateStudentFeeReceiptPdf(selectedReceipt);
    } catch (err: any) {
      Alert.alert('Download Failed', err?.message || 'Could not generate fee receipt PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Edit Statement Modal
  const [editingItem, setEditingItem] = useState<IncomeRecord | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editStatus, setEditStatus] = useState<PaymentStatus>('paid');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('upi');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Only student fees & bus fees for students
  const studentRecords = incomeRecords.filter(
    (r) => r.category === 'student_fee' || r.category === 'bus_fee' || r.category === 'hostel_fee'
  );

  const filtered = studentRecords.filter((item) => {
    if (statusFilter === 'paid' && item.status !== 'paid') return false;
    if (statusFilter === 'unpaid' && item.status === 'paid') return false;
    if (classFilter !== 'all' && item.classSection !== classFilter) return false;

    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.payerName.toLowerCase().includes(q) ||
      (item.studentId && item.studentId.toLowerCase().includes(q))
    );
  });

  const totalCollected = studentRecords
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalUnpaid = studentRecords
    .filter((r) => r.status !== 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleConfirmCollect = async () => {
    if (!collectItem) return;
    try {
      await collectStudentFee(collectItem.id, selectedMethod);
      showAlert('Fee Collected', `₹${collectItem.amount.toLocaleString('en-IN')} collected from ${collectItem.payerName} via ${methodLabel(selectedMethod)}.`);
    } catch {
      showAlert('Collection Failed', 'Could not record payment. Please try again.');
    }
    setCollectItem(null);
  };

  const handleSendReminder = (item: IncomeRecord) => {
    showAlert(
      'Reminder Unavailable',
      `No parent-recipient delivery workflow is configured for ${item.payerName}.`
    );
  };

  const handleOpenEdit = (item: IncomeRecord) => {
    setEditingItem(item);
    setEditAmount(item.amount.toString());
    setEditStatus(item.status);
    setEditMethod(item.paymentMethod);
    setEditDate(item.paymentDate);
    setEditNotes(item.notes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    try {
      await updateIncomeRecord(editingItem.id, {
        amount: numAmount,
        status: editStatus,
        paymentMethod: editMethod,
        paymentDate: editDate,
        notes: editNotes,
      });
      showAlert('Fee Updated', `Payment record for ${editingItem.payerName} updated.`);
    } catch {
      showAlert('Update Failed', 'Could not update fee record.');
    }
    setEditingItem(null);
  };

  return (
    <View style={sharedFinanceStyles.container}>
      <View style={sharedFinanceStyles.pageHeader}>
        <Text style={sharedFinanceStyles.pageTitle}>Student Fees</Text>
      </View>

      {/* KPI Banner */}
      <View style={styles.kpiBanner}>
        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>Collected Fees</Text>
          <Text style={[styles.kpiVal, { color: '#B8860B' }]}>{formatINR(totalCollected)}</Text>
          <Text style={styles.kpiSub}>{studentRecords.filter((r) => r.status === 'paid').length} Paid Invoices</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>Unpaid / Overdue</Text>
          <Text style={[styles.kpiVal, { color: '#DC3545' }]}>{formatINR(totalUnpaid)}</Text>
          <Text style={styles.kpiSub}>{studentRecords.filter((r) => r.status !== 'paid').length} Students Pending</Text>
        </View>
      </View>

      {/* Main Status Toggle (Unpaid vs Paid vs All) */}
      <View style={styles.tabToggleRow}>
        <TouchableOpacity
          style={[styles.tabToggleBtn, statusFilter === 'unpaid' && styles.tabToggleActiveUnpaid]}
          onPress={() => setStatusFilter('unpaid')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="clock-alert-outline"
            size={15}
            color={statusFilter === 'unpaid' ? '#171717' : '#6B6B6B'}
          />
          <Text
            numberOfLines={1}
            style={[styles.tabToggleText, statusFilter === 'unpaid' && styles.tabToggleTextActive]}
          >
            Unpaid ({studentRecords.filter((r) => r.status !== 'paid').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabToggleBtn, statusFilter === 'paid' && styles.tabToggleActivePaid]}
          onPress={() => setStatusFilter('paid')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={15}
            color={statusFilter === 'paid' ? '#171717' : '#6B6B6B'}
          />
          <Text
            numberOfLines={1}
            style={[styles.tabToggleText, statusFilter === 'paid' && styles.tabToggleTextActive]}
          >
            Paid ({studentRecords.filter((r) => r.status === 'paid').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabToggleBtn, statusFilter === 'all' && styles.tabToggleActiveAll]}
          onPress={() => setStatusFilter('all')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={15}
            color={statusFilter === 'all' ? '#171717' : '#6B6B6B'}
          />
          <Text
            numberOfLines={1}
            style={[styles.tabToggleText, statusFilter === 'all' && styles.tabToggleTextActive]}
          >
            All ({studentRecords.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={18} color="#6B6B6B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search student name, roll no, or fee title..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9A9A9A"
        />
      </View>

      {/* Class Section Dropdown + Result Count */}
      <View style={styles.filterRow}>
        <View style={styles.dropdownWrap}>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setClassOpen((o) => !o)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="school-outline" size={16} color="#171717" />
            <Text style={styles.dropdownText} numberOfLines={1}>
              {classFilter === 'all' ? 'All Classes' : classFilter}
            </Text>
            <MaterialCommunityIcons
              name={classOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#6B6B6B"
            />
          </TouchableOpacity>

          {classOpen && (
            <View style={styles.dropdownMenu}>
              {classes.map((cls) => {
                const active = classFilter === cls;
                return (
                  <TouchableOpacity
                    key={cls}
                    style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                    onPress={() => {
                      setClassFilter(cls);
                      setClassOpen(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>
                      {cls === 'all' ? 'All Classes' : cls}
                    </Text>
                    {active && <MaterialCommunityIcons name="check" size={14} color="#B8860B" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <Text style={styles.resultCount}>
          {filtered.length} {filtered.length === 1 ? 'invoice' : 'invoices'}
        </Text>
      </View>

      {/* List */}
      <ScrollView style={sharedFinanceStyles.listContainer} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={sharedFinanceStyles.emptyState}>
            <MaterialCommunityIcons name="school" size={48} color="#9A9A9A" />
            <Text style={sharedFinanceStyles.emptyTitle}>No Student Records Found</Text>
            <Text style={sharedFinanceStyles.emptySubtitle}>No fees match the selected filter criteria.</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const isPaid = item.status === 'paid';

            return (
              <View key={item.id} style={styles.feeCard}>
                {/* Header: Title + student | Amount + status */}
                <View style={styles.feeHeaderRow}>
                  <View style={styles.feeHeaderLeft}>
                    <Text style={styles.feeTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.feeSub} numberOfLines={1}>
                      Student: <Text style={styles.feeSubBold}>{item.payerName}</Text>
                      {item.studentId ? ` (${item.studentId})` : ''}
                      {item.classSection ? ` • ${item.classSection}` : ''}
                    </Text>
                  </View>
                  <View style={styles.feeHeaderRight}>
                    <Text
                      style={[styles.feeAmount, isPaid ? styles.feeAmountPaid : styles.feeAmountDue]}
                    >
                      {formatINR(item.amount)}
                    </Text>
                    <View
                      style={[styles.feeStatusBadge, isPaid ? styles.feeBadgeGreen : styles.feeBadgeRed]}
                    >
                      <Text
                        style={[
                          styles.feeStatusText,
                          isPaid ? styles.feeStatusTextGreen : styles.feeStatusTextRed,
                        ]}
                      >
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Meta row with icons */}
                <View style={styles.feeMetaRow}>
                  <View style={styles.feeMetaItem}>
                    <MaterialCommunityIcons name="calendar-outline" size={13} color="#6B7280" />
                    <Text style={styles.feeMetaText}>
                      {isPaid ? item.paymentDate : `Due ${item.paymentDate}`}
                    </Text>
                  </View>
                  <View style={styles.feeMetaItem}>
                    <MaterialCommunityIcons name="cash-multiple" size={13} color="#6B7280" />
                    <Text style={styles.feeMetaText}>
                      {isPaid ? methodLabel(item.paymentMethod) : 'Unpaid'}
                    </Text>
                  </View>
                  <View style={styles.feeMetaItem}>
                    <MaterialCommunityIcons name="file-document-outline" size={13} color="#6B7280" />
                    <Text style={styles.feeMetaText}>{item.receiptNo || '—'}</Text>
                  </View>
                </View>

                {/* Action footer */}
                <View style={styles.feeActionRow}>
                  {!isPaid && (
                    <>
                      <TouchableOpacity
                        style={styles.feeCollectBtn}
                        onPress={() => setCollectItem(item)}
                      >
                        <MaterialCommunityIcons name="cash-check" size={14} color="#FFFFFF" />
                        <Text style={styles.feeCollectBtnText}>Collect</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.feeActionBtn}
                        onPress={() => handleSendReminder(item)}
                      >
                        <MaterialCommunityIcons name="bell-ring-outline" size={15} color="#171717" />
                        <Text style={styles.feeActionBtnText}>Remind</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {isPaid && item.receiptNo && item.paymentDate && item.paymentMethod !== 'unknown' && (
                    <TouchableOpacity
                      style={styles.feeActionBtn}
                      onPress={() => setSelectedReceipt(item)}
                    >
                      <MaterialCommunityIcons name="file-document-outline" size={15} color="#171717" />
                      <Text style={styles.feeActionBtnText}>Receipt</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.feeActionBtn} onPress={() => handleOpenEdit(item)}>
                    <MaterialCommunityIcons name="pencil-outline" size={15} color="#171717" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.feeActionBtn, styles.feeActionBtnDanger]}
                    onPress={() => deleteIncome(item.id)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={15} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Collect Fee Modal ── */}
      {collectItem && (
        <Modal visible={!!collectItem} animationType="slide" transparent>
          <View style={sharedFinanceStyles.modalOverlay}>
            <View style={sharedFinanceStyles.modalContent}>
              <View style={sharedFinanceStyles.modalHeader}>
                <Text style={sharedFinanceStyles.modalTitle}>Collect Student Fee</Text>
                <TouchableOpacity onPress={() => setCollectItem(null)}>
                  <MaterialCommunityIcons name="close" size={24} color="#6B6B6B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={sharedFinanceStyles.modalBody}>
                <Text style={sharedFinanceStyles.label}>Student Name</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, backgroundColor: '#F7F5EE' }]}>
                  {collectItem.payerName} ({collectItem.classSection || 'General'})
                </Text>

                <Text style={sharedFinanceStyles.label}>Fee Head</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, backgroundColor: '#F7F5EE' }]}>
                  {collectItem.title}
                </Text>

                <Text style={sharedFinanceStyles.label}>Amount to Collect (₹)</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, fontSize: 18, fontWeight: '800', color: '#16A34A', backgroundColor: '#DCFCE7' }]}>
                  {formatINR(collectItem.amount)}
                </Text>

                <Text style={sharedFinanceStyles.label}>Payment Channel</Text>
                <View style={sharedFinanceStyles.radioRow}>
                  {(['upi', 'cash', 'card', 'bank_transfer', 'cheque'] as PaymentMethod[]).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        sharedFinanceStyles.radioBtn,
                        selectedMethod === m && { backgroundColor: '#171717', borderColor: '#171717' },
                      ]}
                      onPress={() => setSelectedMethod(m)}
                    >
                      <Text style={[sharedFinanceStyles.radioText, selectedMethod === m && sharedFinanceStyles.radioTextActive]}>
                        {m === 'bank_transfer' ? 'Bank' : m.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={sharedFinanceStyles.modalFooter}>
                <TouchableOpacity style={sharedFinanceStyles.cancelBtn} onPress={() => setCollectItem(null)}>
                  <Text style={sharedFinanceStyles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sharedFinanceStyles.submitBtn, { backgroundColor: '#171717' }]} onPress={handleConfirmCollect}>
                  <Text style={sharedFinanceStyles.submitBtnText}>Confirm Collection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Official Fee Receipt Modal ── */}
      {selectedReceipt && (
        <Modal visible={!!selectedReceipt} transparent animationType="fade">
          <View style={sharedFinanceStyles.modalOverlay}>
            <View style={sharedFinanceStyles.documentContent}>
              <View style={sharedFinanceStyles.documentHeader}>
                <MaterialCommunityIcons name="school" size={32} color="#F4C430" />
                <Text style={sharedFinanceStyles.documentSchoolName}>{useUserStore.getState().institutionName || 'School'}</Text>
                <Text style={sharedFinanceStyles.documentSubHeader}>Official Fee Receipt</Text>
              </View>

              <View style={sharedFinanceStyles.documentDivider} />

              <View style={sharedFinanceStyles.documentBody}>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Receipt No:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedReceipt.receiptNo || '—'}</Text>
                </View>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Payer / Student:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedReceipt.payerName}</Text>
                </View>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Class & Section:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedReceipt.classSection || 'General'}</Text>
                </View>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Date Paid:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedReceipt.paymentDate}</Text>
                </View>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Payment Method:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{methodLabel(selectedReceipt.paymentMethod)}</Text>
                </View>

                <View style={[sharedFinanceStyles.documentTotalBox, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={sharedFinanceStyles.documentTotalLabel}>Total Paid Amount</Text>
                  <Text style={[sharedFinanceStyles.documentTotalVal, { color: '#16A34A' }]}>
                    {formatINR(selectedReceipt.amount)}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={[sharedFinanceStyles.closeDocumentBtn, { flex: 1, backgroundColor: '#16A34A', opacity: isGeneratingPdf ? 0.7 : 1 }]}
                  onPress={handleDownloadReceiptPdf}
                  disabled={isGeneratingPdf}
                >
                  {isGeneratingPdf ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialCommunityIcons name="download" size={16} color="#FFFFFF" />
                  )}
                  <Text style={sharedFinanceStyles.closeDocumentBtnText}>
                    {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[sharedFinanceStyles.closeDocumentBtn, { flex: 1, backgroundColor: '#F4C430' }]} onPress={() => setSelectedReceipt(null)}>
                  <Text style={sharedFinanceStyles.closeDocumentBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Edit Statement Modal ── */}
      {editingItem && (
        <Modal visible={!!editingItem} animationType="slide" transparent>
          <View style={sharedFinanceStyles.modalOverlay}>
            <View style={sharedFinanceStyles.modalContent}>
              <View style={sharedFinanceStyles.modalHeader}>
                <Text style={sharedFinanceStyles.modalTitle}>Update Fee Statement</Text>
                <TouchableOpacity onPress={() => setEditingItem(null)}>
                  <MaterialCommunityIcons name="close" size={24} color="#6B6B6B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={sharedFinanceStyles.modalBody}>
                <Text style={sharedFinanceStyles.label}>Student</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, backgroundColor: '#F7F5EE' }]}>
                  {editingItem.payerName}
                </Text>

                <Text style={sharedFinanceStyles.label}>Amount (₹) *</Text>
                <TextInput
                  style={sharedFinanceStyles.input}
                  keyboardType="numeric"
                  value={editAmount}
                  onChangeText={setEditAmount}
                />

                <Text style={sharedFinanceStyles.label}>Payment Status</Text>
                <View style={sharedFinanceStyles.radioRow}>
                  {(['paid', 'pending'] as PaymentStatus[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        sharedFinanceStyles.radioBtn,
                        editStatus === s && { backgroundColor: s === 'paid' ? '#171717' : '#D97706', borderColor: s === 'paid' ? '#171717' : '#D97706' },
                      ]}
                      onPress={() => setEditStatus(s)}
                    >
                      <Text style={[sharedFinanceStyles.radioText, editStatus === s && sharedFinanceStyles.radioTextActive]}>
                        {s.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={sharedFinanceStyles.label}>Payment Method</Text>
                <View style={sharedFinanceStyles.radioRow}>
                  {(['upi', 'cash', 'card', 'bank_transfer', 'cheque'] as PaymentMethod[]).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        sharedFinanceStyles.radioBtn,
                        editMethod === m && { backgroundColor: '#171717', borderColor: '#171717' },
                      ]}
                      onPress={() => setEditMethod(m)}
                    >
                      <Text style={[sharedFinanceStyles.radioText, editMethod === m && sharedFinanceStyles.radioTextActive]}>
                        {m === 'bank_transfer' ? 'Bank' : m.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={sharedFinanceStyles.modalFooter}>
                <TouchableOpacity style={sharedFinanceStyles.cancelBtn} onPress={() => setEditingItem(null)}>
                  <Text style={sharedFinanceStyles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sharedFinanceStyles.submitBtn, { backgroundColor: '#171717' }]} onPress={handleSaveEdit}>
                  <Text style={sharedFinanceStyles.submitBtnText}>Save Updates</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  kpiBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    marginBottom: 12,
  },
  kpiCol: { flex: 1, alignItems: 'center' },
  kpiDivider: { width: 1, backgroundColor: '#E8E5DC', marginVertical: 2 },
  kpiLabel: { fontSize: 10, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' },
  kpiVal: { fontSize: 18, fontWeight: '800', marginVertical: 3 },
  kpiSub: { fontSize: 10, color: '#9CA3AF' },

  tabToggleRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tabToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 4,
    overflow: 'hidden',
  },
  tabToggleActiveUnpaid: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  tabToggleActivePaid: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  tabToggleActiveAll: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  tabToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B6B6B',
    flexShrink: 1,
  },
  tabToggleTextActive: { color: '#171717' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    height: 42,
    marginBottom: 10,
  },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 12, color: '#171717' },

  // Class filter dropdown
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dropdownWrap: { flex: 1, position: 'relative', zIndex: 20 },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  dropdownText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#171717' },
  dropdownMenu: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 10,
    paddingVertical: 4,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 30,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemActive: { backgroundColor: '#FFF4C7' },
  dropdownItemText: { fontSize: 13, fontWeight: '600', color: '#171717' },
  dropdownItemTextActive: { fontWeight: '800', color: '#171717' },
  resultCount: { fontSize: 11, fontWeight: '700', color: '#6B6B6B' },

  // Fee list card (librarian list-card language)
  feeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  feeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  feeHeaderLeft: { flex: 1, gap: 2 },
  feeHeaderRight: { alignItems: 'flex-end', gap: 4 },
  feeTitle: { fontSize: 14, fontWeight: '800', color: '#171717' },
  feeSub: { fontSize: 11, color: '#6B7280' },
  feeSubBold: { fontWeight: '700', color: '#171717' },
  feeAmount: { fontSize: 18, fontWeight: '800' },
  feeAmountPaid: { color: '#16A34A' },
  feeAmountDue: { color: '#DC3545' },
  feeStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  feeBadgeGreen: { backgroundColor: '#D1FAE5', borderColor: '#026440' },
  feeBadgeRed: { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  feeStatusText: { fontSize: 10, fontWeight: '800' },
  feeStatusTextGreen: { color: '#026440' },
  feeStatusTextRed: { color: '#DC2626' },
  feeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    paddingTop: 4,
  },
  feeMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feeMetaText: { fontSize: 11, color: '#6B7280' },
  feeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  feeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  feeActionBtnText: { fontSize: 12, fontWeight: '700', color: '#171717' },
  feeActionBtnDanger: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  feeCollectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 5,
    backgroundColor: '#026440',
    shadowColor: '#026440',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  feeCollectBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
});
