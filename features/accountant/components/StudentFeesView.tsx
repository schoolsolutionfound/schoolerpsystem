/**
 * @file StudentFeesView.tsx
 * @description Dedicated Student Fee Management screen: Paid vs Unpaid student fees, class filters, 1-tap collection & parent reminders.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { useFinanceStore } from '../store/useFinanceStore';
import { IncomeRecord, PaymentMethod, PaymentStatus } from '../types/finance';
import { formatINR } from '../utils/financeUtils';
import { showAlert } from '../../shared/utils/showAlert';
import { sharedFinanceStyles } from './financeStyles';

export const StudentFeesView: React.FC = () => {
  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const collectStudentFee = useFinanceStore((s) => s.collectStudentFee);
  const updateIncomeRecord = useFinanceStore((s) => s.updateIncomeRecord);
  const deleteIncome = useFinanceStore((s) => s.deleteIncome);

  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('unpaid');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect / Pay Modal
  const [collectItem, setCollectItem] = useState<IncomeRecord | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<IncomeRecord | null>(null);

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

  const classes = ['all', 'Grade 10-A', 'Grade 9-B', 'Grade 6-A', 'Grade 11-A', 'Grade 12-C'];

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

  const handleConfirmCollect = () => {
    if (!collectItem) return;
    collectStudentFee(collectItem.id, selectedMethod);
    showAlert('Fee Collected', `₹${collectItem.amount.toLocaleString('en-IN')} collected from ${collectItem.payerName} via ${selectedMethod.toUpperCase()}.`);
    setCollectItem(null);
  };

  const handleSendReminder = (item: IncomeRecord) => {
    showAlert(
      'Fee Reminder Sent',
      `SMS & WhatsApp payment reminder sent to parents of ${item.payerName} for ${item.title} (₹${item.amount.toLocaleString('en-IN')}).`
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

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    updateIncomeRecord(editingItem.id, {
      amount: numAmount,
      status: editStatus,
      paymentMethod: editMethod,
      paymentDate: editDate,
      notes: editNotes,
    });

    showAlert('Fee Updated', `Payment record for ${editingItem.payerName} updated.`);
    setEditingItem(null);
  };

  return (
    <View style={sharedFinanceStyles.container}>
      {/* KPI Banner */}
      <View style={styles.kpiBanner}>
        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>Collected Fees</Text>
          <Text style={[styles.kpiVal, { color: '#16A34A' }]}>{formatINR(totalCollected)}</Text>
          <Text style={styles.kpiSub}>{studentRecords.filter((r) => r.status === 'paid').length} Paid Invoices</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>Unpaid / Overdue</Text>
          <Text style={[styles.kpiVal, { color: '#DC2626' }]}>{formatINR(totalUnpaid)}</Text>
          <Text style={styles.kpiSub}>{studentRecords.filter((r) => r.status !== 'paid').length} Students Pending</Text>
        </View>
      </View>

      {/* Main Status Toggle (Unpaid vs Paid vs All) */}
      <View style={styles.tabToggleRow}>
        <TouchableOpacity
          style={[styles.tabToggleBtn, statusFilter === 'unpaid' && styles.tabToggleActiveUnpaid]}
          onPress={() => setStatusFilter('unpaid')}
        >
          <MaterialCommunityIcons name="clock-alert-outline" size={16} color={statusFilter === 'unpaid' ? '#B45309' : '#64748B'} />
          <Text style={[styles.tabToggleText, statusFilter === 'unpaid' && styles.tabToggleTextActiveUnpaid]}>
            Unpaid Dues ({studentRecords.filter((r) => r.status !== 'paid').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabToggleBtn, statusFilter === 'paid' && styles.tabToggleActivePaid]}
          onPress={() => setStatusFilter('paid')}
        >
          <MaterialCommunityIcons name="check-circle-outline" size={16} color={statusFilter === 'paid' ? '#15803D' : '#64748B'} />
          <Text style={[styles.tabToggleText, statusFilter === 'paid' && styles.tabToggleTextActivePaid]}>
            Paid Fees ({studentRecords.filter((r) => r.status === 'paid').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabToggleBtn, statusFilter === 'all' && styles.tabToggleActiveAll]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[styles.tabToggleText, statusFilter === 'all' && styles.tabToggleTextActiveAll]}>
            All ({studentRecords.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={18} color="#718096" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search student name, roll no, or fee title..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#A0AEC0"
        />
      </View>

      {/* Class Section Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classChipScroll}>
        {classes.map((cls) => (
          <TouchableOpacity
            key={cls}
            style={[styles.classChip, classFilter === cls && styles.classChipActive]}
            onPress={() => setClassFilter(cls)}
          >
            <Text style={[styles.classChipText, classFilter === cls && styles.classChipTextActive]}>
              {cls === 'all' ? 'All Classes' : cls}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView style={sharedFinanceStyles.listContainer} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={sharedFinanceStyles.emptyState}>
            <MaterialCommunityIcons name="school" size={48} color="#CBD5E1" />
            <Text style={sharedFinanceStyles.emptyTitle}>No Student Records Found</Text>
            <Text style={sharedFinanceStyles.emptySubtitle}>No fees match the selected filter criteria.</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const isPaid = item.status === 'paid';

            return (
              <View key={item.id} style={sharedFinanceStyles.cardItem}>
                {/* Header: Badge + Amount */}
                <View style={sharedFinanceStyles.cardHeaderRow}>
                  <View style={sharedFinanceStyles.cardHeaderLeft}>
                    <View
                      style={[
                        sharedFinanceStyles.iconBox,
                        { backgroundColor: item.category === 'bus_fee' ? '#FFEDD5' : '#EDE7F6' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.category === 'bus_fee' ? 'bus' : 'school'}
                        size={18}
                        color={item.category === 'bus_fee' ? '#EA580C' : '#7E57C2'}
                      />
                    </View>
                    <View
                      style={[
                        sharedFinanceStyles.catChip,
                        { backgroundColor: item.category === 'bus_fee' ? '#FFEDD5' : '#EDE7F6' },
                      ]}
                    >
                      <Text
                        style={[
                          sharedFinanceStyles.catChipText,
                          { color: item.category === 'bus_fee' ? '#C2410C' : '#7E57C2' },
                        ]}
                      >
                        {item.category === 'bus_fee' ? 'Bus Transport' : 'Tuition & Academic'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[sharedFinanceStyles.itemAmount, isPaid ? { color: '#16A34A' } : { color: '#DC2626' }]}>
                    {formatINR(item.amount)}
                  </Text>
                </View>

                {/* Title */}
                <Text style={sharedFinanceStyles.cardTitle}>{item.title}</Text>

                {/* Student Info */}
                <Text style={sharedFinanceStyles.payerRow}>
                  Student: <Text style={sharedFinanceStyles.boldPayer}>{item.payerName}</Text>
                  {item.studentId ? ` (${item.studentId})` : ''}
                  {item.classSection ? ` • ${item.classSection}` : ''}
                </Text>

                {/* Meta details */}
                <Text style={sharedFinanceStyles.metaRow}>
                  {isPaid ? `Paid: ${item.paymentDate} • Via: ${item.paymentMethod.toUpperCase()}` : `Due: ${item.paymentDate} • Overdue`}
                </Text>

                {/* Action Buttons */}
                <View style={sharedFinanceStyles.cardFooterRow}>
                  <View style={[sharedFinanceStyles.statusTag, isPaid ? sharedFinanceStyles.statusPaid : sharedFinanceStyles.statusPending]}>
                    <Text style={[sharedFinanceStyles.statusText, isPaid ? sharedFinanceStyles.statusTextPaid : sharedFinanceStyles.statusTextPending]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>

                  <View style={sharedFinanceStyles.actionIconsGroup}>
                    {!isPaid && (
                      <>
                        <TouchableOpacity style={[styles.actionCollectBtn, { backgroundColor: '#16A34A' }]} onPress={() => setCollectItem(item)}>
                          <MaterialCommunityIcons name="cash-check" size={13} color="#FFFFFF" />
                          <Text style={styles.actionCollectBtnText}>Collect</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.reminderBtn} onPress={() => handleSendReminder(item)}>
                          <MaterialCommunityIcons name="bell-ring-outline" size={13} color="#475569" />
                          <Text style={styles.reminderBtnText}>Remind</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {isPaid && (
                      <TouchableOpacity style={sharedFinanceStyles.actionIconBtn} onPress={() => setSelectedReceipt(item)}>
                        <MaterialCommunityIcons name="file-document-outline" size={14} color="#7E57C2" />
                        <Text style={[sharedFinanceStyles.actionIconBtnText, { color: '#7E57C2' }]}>Receipt</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity style={sharedFinanceStyles.actionIconBtn} onPress={() => handleOpenEdit(item)}>
                      <MaterialCommunityIcons name="pencil-outline" size={14} color="#0284C7" />
                    </TouchableOpacity>

                    <TouchableOpacity style={sharedFinanceStyles.actionIconBtn} onPress={() => deleteIncome(item.id)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={14} color="#DC3545" />
                    </TouchableOpacity>
                  </View>
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
                  <MaterialCommunityIcons name="close" size={24} color="#718096" />
                </TouchableOpacity>
              </View>

              <ScrollView style={sharedFinanceStyles.modalBody}>
                <Text style={sharedFinanceStyles.label}>Student Name</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, backgroundColor: '#F1F5F9' }]}>
                  {collectItem.payerName} ({collectItem.classSection || 'General'})
                </Text>

                <Text style={sharedFinanceStyles.label}>Fee Head</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, backgroundColor: '#F1F5F9' }]}>
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
                        selectedMethod === m && { backgroundColor: '#16A34A', borderColor: '#16A34A' },
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
                <TouchableOpacity style={[sharedFinanceStyles.submitBtn, { backgroundColor: '#16A34A' }]} onPress={handleConfirmCollect}>
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
                <MaterialCommunityIcons name="school" size={32} color="#7E57C2" />
                <Text style={sharedFinanceStyles.documentSchoolName}>SchoolHub Academy</Text>
                <Text style={sharedFinanceStyles.documentSubHeader}>Official Fee Receipt</Text>
              </View>

              <View style={sharedFinanceStyles.documentDivider} />

              <View style={sharedFinanceStyles.documentBody}>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Receipt No:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedReceipt.receiptNo}</Text>
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
                  <Text style={sharedFinanceStyles.documentVal}>{selectedReceipt.paymentMethod.toUpperCase()}</Text>
                </View>

                <View style={[sharedFinanceStyles.documentTotalBox, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={sharedFinanceStyles.documentTotalLabel}>Total Paid Amount</Text>
                  <Text style={[sharedFinanceStyles.documentTotalVal, { color: '#16A34A' }]}>
                    {formatINR(selectedReceipt.amount)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={[sharedFinanceStyles.closeDocumentBtn, { backgroundColor: '#7E57C2' }]} onPress={() => setSelectedReceipt(null)}>
                <Text style={sharedFinanceStyles.closeDocumentBtnText}>Close Receipt</Text>
              </TouchableOpacity>
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
                  <MaterialCommunityIcons name="close" size={24} color="#718096" />
                </TouchableOpacity>
              </View>

              <ScrollView style={sharedFinanceStyles.modalBody}>
                <Text style={sharedFinanceStyles.label}>Student</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, backgroundColor: '#F1F5F9' }]}>
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
                        editStatus === s && { backgroundColor: s === 'paid' ? '#16A34A' : '#D97706', borderColor: s === 'paid' ? '#16A34A' : '#D97706' },
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
                        editMethod === m && { backgroundColor: '#7E57C2', borderColor: '#7E57C2' },
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
                <TouchableOpacity style={[sharedFinanceStyles.submitBtn, { backgroundColor: '#7E57C2' }]} onPress={handleSaveEdit}>
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
    borderRadius: BorderRadius.card,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  kpiCol: { flex: 1, alignItems: 'center' },
  kpiDivider: { width: 1, backgroundColor: '#E2E8F0' },
  kpiLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  kpiVal: { fontSize: 18, fontWeight: '800', marginVertical: 2 },
  kpiSub: { fontSize: 10, color: '#94A3B8' },

  tabToggleRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tabToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  tabToggleActiveUnpaid: { backgroundColor: '#FEF3C7', borderColor: '#D97706' },
  tabToggleActivePaid: { backgroundColor: '#DCFCE7', borderColor: '#16A34A' },
  tabToggleActiveAll: { backgroundColor: '#EDE7F6', borderColor: '#7E57C2' },
  tabToggleText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabToggleTextActiveUnpaid: { color: '#B45309' },
  tabToggleTextActivePaid: { color: '#15803D' },
  tabToggleTextActiveAll: { color: '#7E57C2' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 38,
    marginBottom: 8,
  },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 12, color: '#1A202C' },
  classChipScroll: { flexDirection: 'row', marginBottom: 10, maxHeight: 32 },
  classChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  classChipActive: { backgroundColor: '#7E57C2' },
  classChipText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  classChipTextActive: { color: '#FFFFFF', fontWeight: '700' },

  actionCollectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  actionCollectBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  reminderBtnText: { fontSize: 11, fontWeight: '700', color: '#475569' },
});
