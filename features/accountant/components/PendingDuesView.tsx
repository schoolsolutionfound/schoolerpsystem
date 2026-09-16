/**
 * @file PendingDuesView.tsx
 * @description Dedicated management view for all Outstanding Financial Dues:
 *  1. Student Pending Fees (Tuition, Transport, Hostel) with 1-tap Fee Collection
 *  2. Pending Staff Salaries with 1-tap Payroll Disbursement
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinanceStore } from '../store/useFinanceStore';
import { IncomeRecord, ExpenseRecord, PaymentMethod } from '../types/finance';
import { formatINR } from '../utils/financeUtils';
import { showAlert } from '../../shared/utils/showAlert';
import { BorderRadius } from '../../../constants/theme';

export const PendingDuesView: React.FC = () => {
  const [subTab, setSubTab] = useState<'student_fees' | 'pending_salaries'>('student_fees');
  const [searchQuery, setSearchQuery] = useState('');

  // Store data & actions
  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);
  const collectStudentFee = useFinanceStore((s) => s.collectStudentFee);
  const disburseSalary = useFinanceStore((s) => s.disburseSalary);

  // Selected item for modal action
  const [selectedFee, setSelectedFee] = useState<IncomeRecord | null>(null);
  const [selectedSalary, setSelectedSalary] = useState<ExpenseRecord | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');

  // Filtered lists
  const pendingFees = incomeRecords.filter((r) => {
    const isPending = r.status !== 'paid';
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.payerName.toLowerCase().includes(q) ||
      (r.classSection && r.classSection.toLowerCase().includes(q)) ||
      (r.studentId && r.studentId.toLowerCase().includes(q)) ||
      r.title.toLowerCase().includes(q);
    return isPending && matchesSearch;
  });

  const pendingSalaries = expenseRecords.filter((r) => {
    const isPendingSalary = r.category === 'salary' && r.status !== 'paid';
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.payeeName.toLowerCase().includes(q) ||
      (r.employeeId && r.employeeId.toLowerCase().includes(q)) ||
      (r.department && r.department.toLowerCase().includes(q)) ||
      r.title.toLowerCase().includes(q);
    return isPendingSalary && matchesSearch;
  });

  const totalPendingFees = pendingFees.reduce((sum, r) => sum + r.amount, 0);
  const totalPendingSalaries = pendingSalaries.reduce((sum, r) => sum + r.amount, 0);

  // Handlers
  const handleConfirmCollectFee = () => {
    if (!selectedFee) return;
    collectStudentFee(selectedFee.id, payMethod);
    showAlert('Fee Collected', `Successfully collected ${formatINR(selectedFee.amount)} from ${selectedFee.payerName}.`);
    setSelectedFee(null);
  };

  const handleConfirmDisburseSalary = () => {
    if (!selectedSalary) return;
    disburseSalary(selectedSalary.id, payMethod);
    showAlert('Salary Disbursed', `Successfully disbursed ${formatINR(selectedSalary.amount)} to ${selectedSalary.payeeName}.`);
    setSelectedSalary(null);
  };

  const handleSendReminder = (fee: IncomeRecord) => {
    showAlert(
      'Reminder Sent',
      `Payment reminder SMS & WhatsApp notification sent to ${fee.parentPhone || 'registered parent mobile'} for ${fee.payerName} (${fee.classSection || 'Student'}).`
    );
  };

  return (
    <View style={styles.container}>
      {/* Sub-tab Pill Switcher */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'student_fees' && styles.subTabBtnActiveFee]}
          onPress={() => setSubTab('student_fees')}
        >
          <MaterialCommunityIcons
            name="account-clock-outline"
            size={18}
            color={subTab === 'student_fees' ? '#D97706' : '#64748B'}
          />
          <Text style={[styles.subTabBtnText, subTab === 'student_fees' && styles.subTabBtnTextActiveFee]}>
            Pending Fees ({pendingFees.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, subTab === 'pending_salaries' && styles.subTabBtnActiveSal]}
          onPress={() => setSubTab('pending_salaries')}
        >
          <MaterialCommunityIcons
            name="cash-clock"
            size={18}
            color={subTab === 'pending_salaries' ? '#DC3545' : '#64748B'}
          />
          <Text style={[styles.subTabBtnText, subTab === 'pending_salaries' && styles.subTabBtnTextActiveSal]}>
            Pending Salaries ({pendingSalaries.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary KPI Banner for Active Sub-tab */}
      <View style={[styles.summaryBanner, subTab === 'student_fees' ? styles.bannerFee : styles.bannerSal]}>
        <View style={styles.bannerInfo}>
          <Text style={styles.bannerSubtitle}>
            {subTab === 'student_fees' ? 'Total Outstanding Student Receivables' : 'Total Unpaid Staff Payroll Due'}
          </Text>
          <Text style={[styles.bannerAmount, subTab === 'student_fees' ? styles.bannerAmountFee : styles.bannerAmountSal]}>
            {formatINR(subTab === 'student_fees' ? totalPendingFees : totalPendingSalaries)}
          </Text>
        </View>
        <View style={[styles.bannerBadge, subTab === 'student_fees' ? styles.badgeFee : styles.badgeSal]}>
          <Text style={[styles.bannerBadgeText, subTab === 'student_fees' ? styles.badgeTextFee : styles.badgeTextSal]}>
            {subTab === 'student_fees' ? `${pendingFees.length} Students Due` : `${pendingSalaries.length} Staff Pending`}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color="#718096" />
        <TextInput
          style={styles.searchInput}
          placeholder={
            subTab === 'student_fees'
              ? 'Search by student name, roll no, class...'
              : 'Search by employee name, ID, department...'
          }
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Main List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {subTab === 'student_fees' ? (
          pendingFees.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="check-decagram-outline" size={54} color="#16A34A" />
              <Text style={styles.emptyTitle}>All Student Fees Cleared!</Text>
              <Text style={styles.emptySubtitle}>There are currently no outstanding student fee balances.</Text>
            </View>
          ) : (
            pendingFees.map((fee) => (
              <View key={fee.id} style={styles.duesCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.studentAvatar}>
                    <MaterialCommunityIcons name="school-outline" size={22} color="#D97706" />
                  </View>
                  <View style={styles.studentMainInfo}>
                    <Text style={styles.studentName}>{fee.payerName}</Text>
                    <Text style={styles.studentMeta}>
                      {fee.classSection || 'General'} • Roll: {fee.rollNo || 'N/A'} • ID: {fee.studentId || fee.receiptNo}
                    </Text>
                  </View>
                  <View style={styles.dueAmountBox}>
                    <Text style={styles.dueAmountVal}>{formatINR(fee.amount)}</Text>
                    <View style={styles.overdueTag}>
                      <Text style={styles.overdueTagText}>PENDING</Text>
                    </View>
                  </View>
                </View>

                {/* Details Row */}
                <View style={styles.detailsRow}>
                  <Text style={styles.feeTitle}>{fee.title}</Text>
                  <Text style={styles.dueDateText}>
                    Due by: <Text style={{ fontWeight: '700' }}>{fee.dueDate || fee.paymentDate}</Text>
                  </Text>
                </View>

                {fee.notes && (
                  <View style={styles.notesBox}>
                    <MaterialCommunityIcons name="information-outline" size={14} color="#64748B" />
                    <Text style={styles.notesText}>{fee.notes}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.reminderBtn}
                    onPress={() => handleSendReminder(fee)}
                  >
                    <MaterialCommunityIcons name="bell-ring-outline" size={16} color="#475569" />
                    <Text style={styles.reminderBtnText}>Remind Parent</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.collectBtn}
                    onPress={() => setSelectedFee(fee)}
                  >
                    <MaterialCommunityIcons name="cash-check" size={16} color="#FFFFFF" />
                    <Text style={styles.collectBtnText}>Collect Fee</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          pendingSalaries.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="check-decagram-outline" size={54} color="#16A34A" />
              <Text style={styles.emptyTitle}>All Staff Salaries Disbursed!</Text>
              <Text style={styles.emptySubtitle}>There are no pending salary disbursements queued.</Text>
            </View>
          ) : (
            pendingSalaries.map((sal) => (
              <View key={sal.id} style={styles.duesCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.studentAvatar, { backgroundColor: '#FEE2E2' }]}>
                    <MaterialCommunityIcons name="account-tie-outline" size={22} color="#DC3545" />
                  </View>
                  <View style={styles.studentMainInfo}>
                    <Text style={styles.studentName}>{sal.payeeName}</Text>
                    <Text style={styles.studentMeta}>
                      {sal.designation || sal.department || 'Staff'} • Emp ID: {sal.employeeId || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.dueAmountBox}>
                    <Text style={[styles.dueAmountVal, { color: '#DC3545' }]}>{formatINR(sal.amount)}</Text>
                    <View style={[styles.overdueTag, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[styles.overdueTagText, { color: '#991B1B' }]}>UNPAID</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.feeTitle}>{sal.title}</Text>
                  <Text style={styles.dueDateText}>
                    Scheduled: <Text style={{ fontWeight: '700' }}>{sal.dueDate || sal.paymentDate}</Text>
                  </Text>
                </View>

                {sal.notes && (
                  <View style={styles.notesBox}>
                    <MaterialCommunityIcons name="information-outline" size={14} color="#64748B" />
                    <Text style={styles.notesText}>{sal.notes}</Text>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.collectBtn, { backgroundColor: '#DC3545', flex: 1 }]}
                    onPress={() => setSelectedSalary(sal)}
                  >
                    <MaterialCommunityIcons name="send-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.collectBtnText}>Disburse Salary Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>

      {/* Collect Fee Modal */}
      {selectedFee && (
        <Modal visible={!!selectedFee} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Collect Student Fee</Text>
                <TouchableOpacity onPress={() => setSelectedFee(null)}>
                  <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Student:</Text>
                  <Text style={styles.modalVal}>{selectedFee.payerName} ({selectedFee.classSection})</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Fee Title:</Text>
                  <Text style={styles.modalVal}>{selectedFee.title}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Amount to Collect:</Text>
                  <Text style={[styles.modalVal, { color: '#16A34A', fontWeight: '800', fontSize: 18 }]}>
                    {formatINR(selectedFee.amount)}
                  </Text>
                </View>

                <Text style={[styles.modalLabel, { marginTop: 12, marginBottom: 8 }]}>Select Payment Mode:</Text>
                <View style={styles.methodSelectorRow}>
                  {[
                    { key: 'upi', label: 'UPI / QR' },
                    { key: 'cash', label: 'Cash' },
                    { key: 'card', label: 'Card' },
                    { key: 'bank_transfer', label: 'Net Banking' },
                  ].map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      style={[styles.methodBtn, payMethod === m.key && styles.methodBtnActive]}
                      onPress={() => setPayMethod(m.key as PaymentMethod)}
                    >
                      <Text style={[styles.methodBtnText, payMethod === m.key && styles.methodBtnTextActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedFee(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmCollectBtn} onPress={handleConfirmCollectFee}>
                  <Text style={styles.confirmCollectBtnText}>Confirm Payment</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Disburse Salary Modal */}
      {selectedSalary && (
        <Modal visible={!!selectedSalary} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Disburse Staff Salary</Text>
                <TouchableOpacity onPress={() => setSelectedSalary(null)}>
                  <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Staff / Beneficiary:</Text>
                  <Text style={styles.modalVal}>{selectedSalary.payeeName}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Designation:</Text>
                  <Text style={styles.modalVal}>{selectedSalary.designation || selectedSalary.department}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalLabel}>Disbursement Amount:</Text>
                  <Text style={[styles.modalVal, { color: '#DC3545', fontWeight: '800', fontSize: 18 }]}>
                    {formatINR(selectedSalary.amount)}
                  </Text>
                </View>

                <Text style={[styles.modalLabel, { marginTop: 12, marginBottom: 8 }]}>Disbursement Channel:</Text>
                <View style={styles.methodSelectorRow}>
                  {[
                    { key: 'bank_transfer', label: 'NEFT / Direct Bank' },
                    { key: 'cheque', label: 'Cheque' },
                    { key: 'upi', label: 'UPI' },
                    { key: 'cash', label: 'Cash' },
                  ].map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      style={[styles.methodBtn, payMethod === m.key && styles.methodBtnActiveSal]}
                      onPress={() => setPayMethod(m.key as PaymentMethod)}
                    >
                      <Text style={[styles.methodBtnText, payMethod === m.key && styles.methodBtnTextActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedSalary(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmCollectBtn, { backgroundColor: '#DC3545' }]} onPress={handleConfirmDisburseSalary}>
                  <Text style={styles.confirmCollectBtnText}>Confirm Disbursal</Text>
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
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 6 },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    gap: 6,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  subTabBtnActiveFee: { backgroundColor: '#FEF3C7' },
  subTabBtnActiveSal: { backgroundColor: '#FEE2E2' },
  subTabBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  subTabBtnTextActiveFee: { color: '#B45309', fontWeight: '700' },
  subTabBtnTextActiveSal: { color: '#991B1B', fontWeight: '700' },

  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    marginBottom: 10,
  },
  bannerFee: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  bannerSal: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  bannerInfo: { flex: 1 },
  bannerSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  bannerAmount: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  bannerAmountFee: { color: '#D97706' },
  bannerAmountSal: { color: '#DC3545' },
  bannerBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeFee: { backgroundColor: '#FDE68A' },
  badgeSal: { backgroundColor: '#FECACA' },
  bannerBadgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextFee: { color: '#92400E' },
  badgeTextSal: { color: '#991B1B' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1A202C' },

  listContainer: { flex: 1 },
  duesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentMainInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  studentMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  dueAmountBox: { alignItems: 'flex-end' },
  dueAmountVal: { fontSize: 16, fontWeight: '800', color: '#D97706' },
  overdueTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  overdueTagText: { fontSize: 9, fontWeight: '800', color: '#B45309' },

  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  feeTitle: { fontSize: 13, color: '#334155', fontWeight: '600' },
  dueDateText: { fontSize: 12, color: '#64748B' },

  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 4,
    marginTop: 6,
  },
  notesText: { fontSize: 11, color: '#64748B', flex: 1 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  reminderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  reminderBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  collectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  collectBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1A202C', marginTop: 12 },
  emptySubtitle: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A202C' },
  modalBody: { marginBottom: 16 },
  modalInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  modalLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  modalVal: { fontSize: 13, color: '#1A202C', fontWeight: '700' },
  methodSelectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  methodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  methodBtnActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  methodBtnActiveSal: { backgroundColor: '#DC3545', borderColor: '#DC3545' },
  methodBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  methodBtnTextActive: { color: '#FFFFFF', fontWeight: '700' },
  modalFooter: { flexDirection: 'row', gap: 8, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: { color: '#475569', fontWeight: '700' },
  confirmCollectBtn: {
    flex: 2,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#16A34A',
  },
  confirmCollectBtnText: { color: '#FFFFFF', fontWeight: '700' },
});
