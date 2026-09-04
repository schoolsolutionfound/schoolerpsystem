/**
 * @file PayrollExpensesView.tsx
 * @description Dedicated Staff Payroll & Operational Expenses Screen.
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
import { ExpenseCategory, ExpenseRecord, PaymentMethod, PaymentStatus } from '../types/finance';
import { getExpenseCategoryLabel, getExpenseCategoryColor, formatINR } from '../utils/financeUtils';
import { showAlert } from '../../shared/utils/showAlert';
import { sharedFinanceStyles } from './financeStyles';

export const PayrollExpensesView: React.FC = () => {
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);
  const addExpense = useFinanceStore((s) => s.addExpense);
  const disburseSalary = useFinanceStore((s) => s.disburseSalary);
  const updateExpenseRecord = useFinanceStore((s) => s.updateExpenseRecord);
  const deleteExpense = useFinanceStore((s) => s.deleteExpense);

  const [activeSubTab, setActiveSubTab] = useState<'payroll' | 'vendors' | 'all'>('payroll');
  const [searchQuery, setSearchQuery] = useState('');

  // Disburse Modal
  const [disburseItem, setDisburseItem] = useState<ExpenseRecord | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bank_transfer');

  // Voucher Modal
  const [selectedVoucher, setSelectedVoucher] = useState<ExpenseRecord | null>(null);

  // Add Voucher Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('salary');
  const [payeeName, setPayeeName] = useState('');
  const [department, setDepartment] = useState('');
  const [amount, setAmount] = useState('');

  // Edit Statement Modal
  const [editingItem, setEditingItem] = useState<ExpenseRecord | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editStatus, setEditStatus] = useState<PaymentStatus>('paid');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('bank_transfer');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const filtered = expenseRecords.filter((item) => {
    if (activeSubTab === 'payroll' && item.category !== 'salary') return false;
    if (activeSubTab === 'vendors' && item.category === 'salary') return false;

    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.payeeName.toLowerCase().includes(q) ||
      (item.department && item.department.toLowerCase().includes(q))
    );
  });

  const totalPayrollPaid = expenseRecords
    .filter((r) => r.category === 'salary' && r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPayrollPending = expenseRecords
    .filter((r) => r.category === 'salary' && r.status !== 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleConfirmDisburse = () => {
    if (!disburseItem) return;
    disburseSalary(disburseItem.id, selectedMethod);
    showAlert('Salary Disbursed', `₹${disburseItem.amount.toLocaleString('en-IN')} disbursed to ${disburseItem.payeeName} via ${selectedMethod.toUpperCase()}.`);
    setDisburseItem(null);
  };

  const handleOpenEdit = (item: ExpenseRecord) => {
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

    updateExpenseRecord(editingItem.id, {
      amount: numAmount,
      status: editStatus,
      paymentMethod: editMethod,
      paymentDate: editDate,
      notes: editNotes,
    });

    showAlert('Voucher Updated', `Expense record for ${editingItem.payeeName} updated.`);
    setEditingItem(null);
  };

  const handleAddSubmit = () => {
    if (!title.trim() || !payeeName.trim() || !amount.trim()) {
      showAlert('Missing Fields', 'Please enter Title, Payee Name, and Amount.');
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    addExpense({
      title: title.trim(),
      category,
      payeeName: payeeName.trim(),
      department: department.trim() || undefined,
      amount: num,
      paymentMethod: 'bank_transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'paid',
    });

    setTitle('');
    setPayeeName('');
    setDepartment('');
    setAmount('');
    setIsAddModalOpen(false);
    showAlert('Success', 'Expense voucher saved.');
  };

  return (
    <View style={sharedFinanceStyles.container}>
      {/* KPI Banner */}
      <View style={styles.kpiBanner}>
        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>Disbursed Salaries</Text>
          <Text style={[styles.kpiVal, { color: '#16A34A' }]}>{formatINR(totalPayrollPaid)}</Text>
          <Text style={styles.kpiSub}>Staff Paid This Month</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCol}>
          <Text style={styles.kpiLabel}>Pending Disbursal</Text>
          <Text style={[styles.kpiVal, { color: '#DC2626' }]}>{formatINR(totalPayrollPending)}</Text>
          <Text style={styles.kpiSub}>{expenseRecords.filter((r) => r.category === 'salary' && r.status !== 'paid').length} Staff Queued</Text>
        </View>
      </View>

      {/* Sub Tabs */}
      <View style={styles.tabToggleRow}>
        <TouchableOpacity
          style={[styles.tabToggleBtn, activeSubTab === 'payroll' && styles.tabToggleActive]}
          onPress={() => setActiveSubTab('payroll')}
        >
          <MaterialCommunityIcons name="account-cash-outline" size={16} color={activeSubTab === 'payroll' ? '#7E57C2' : '#64748B'} />
          <Text style={[styles.tabToggleText, activeSubTab === 'payroll' && styles.tabToggleTextActive]}>
            Staff Payroll
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabToggleBtn, activeSubTab === 'vendors' && styles.tabToggleActive]}
          onPress={() => setActiveSubTab('vendors')}
        >
          <MaterialCommunityIcons name="domain" size={16} color={activeSubTab === 'vendors' ? '#7E57C2' : '#64748B'} />
          <Text style={[styles.tabToggleText, activeSubTab === 'vendors' && styles.tabToggleTextActive]}>
            Vendor Vouchers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabToggleBtn, activeSubTab === 'all' && styles.tabToggleActive]}
          onPress={() => setActiveSubTab('all')}
        >
          <Text style={[styles.tabToggleText, activeSubTab === 'all' && styles.tabToggleTextActive]}>
            All Expenses
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar + Record Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color="#718096" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff, vendor, department..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#A0AEC0"
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalOpen(true)}>
          <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView style={sharedFinanceStyles.listContainer} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={sharedFinanceStyles.emptyState}>
            <MaterialCommunityIcons name="cash-remove" size={48} color="#CBD5E1" />
            <Text style={sharedFinanceStyles.emptyTitle}>No Records Found</Text>
          </View>
        ) : (
          filtered.map((item) => {
            const catBadge = getExpenseCategoryColor(item.category);
            const isPaid = item.status === 'paid';

            return (
              <View key={item.id} style={sharedFinanceStyles.cardItem}>
                {/* Header: Icon + Category Badge + Amount */}
                <View style={sharedFinanceStyles.cardHeaderRow}>
                  <View style={sharedFinanceStyles.cardHeaderLeft}>
                    <View style={[sharedFinanceStyles.iconBox, { backgroundColor: catBadge.bg }]}>
                      <MaterialCommunityIcons
                        name={item.category === 'salary' ? 'account-cash' : 'file-document-outline'}
                        size={18}
                        color={catBadge.text}
                      />
                    </View>
                    <View style={[sharedFinanceStyles.catChip, { backgroundColor: catBadge.bg }]}>
                      <Text style={[sharedFinanceStyles.catChipText, { color: catBadge.text }]}>
                        {getExpenseCategoryLabel(item.category)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[sharedFinanceStyles.itemAmount, { color: '#DC2626' }]}>
                    -{formatINR(item.amount)}
                  </Text>
                </View>

                {/* Title */}
                <Text style={sharedFinanceStyles.cardTitle}>{item.title}</Text>

                {/* Payee Info */}
                <Text style={sharedFinanceStyles.payerRow}>
                  Payee: <Text style={sharedFinanceStyles.boldPayer}>{item.payeeName}</Text>
                  {item.department ? ` • ${item.department}` : ''}
                </Text>

                {/* Meta details */}
                <Text style={sharedFinanceStyles.metaRow}>
                  {isPaid ? `Paid: ${item.paymentDate} • Via: ${item.paymentMethod.toUpperCase()}` : `Due: ${item.paymentDate} • Pending Disbursal`}
                </Text>

                {/* Action Buttons */}
                <View style={sharedFinanceStyles.cardFooterRow}>
                  <View style={[sharedFinanceStyles.statusTag, isPaid ? sharedFinanceStyles.statusPaid : sharedFinanceStyles.statusPending]}>
                    <Text style={[sharedFinanceStyles.statusText, isPaid ? sharedFinanceStyles.statusTextPaid : sharedFinanceStyles.statusTextPending]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>

                  <View style={sharedFinanceStyles.actionIconsGroup}>
                    {!isPaid && item.category === 'salary' && (
                      <TouchableOpacity style={styles.disburseBtn} onPress={() => setDisburseItem(item)}>
                        <MaterialCommunityIcons name="send-outline" size={13} color="#FFFFFF" />
                        <Text style={styles.disburseBtnText}>Disburse Salary</Text>
                      </TouchableOpacity>
                    )}

                    {isPaid && (
                      <TouchableOpacity style={sharedFinanceStyles.actionIconBtn} onPress={() => setSelectedVoucher(item)}>
                        <MaterialCommunityIcons name="file-document-outline" size={14} color="#DC3545" />
                        <Text style={[sharedFinanceStyles.actionIconBtnText, { color: '#DC3545' }]}>Voucher</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity style={sharedFinanceStyles.actionIconBtn} onPress={() => handleOpenEdit(item)}>
                      <MaterialCommunityIcons name="pencil-outline" size={14} color="#0284C7" />
                    </TouchableOpacity>

                    <TouchableOpacity style={sharedFinanceStyles.actionIconBtn} onPress={() => deleteExpense(item.id)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={14} color="#DC3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Disburse Salary Modal ── */}
      {disburseItem && (
        <Modal visible={!!disburseItem} animationType="slide" transparent>
          <View style={sharedFinanceStyles.modalOverlay}>
            <View style={sharedFinanceStyles.modalContent}>
              <View style={sharedFinanceStyles.modalHeader}>
                <Text style={sharedFinanceStyles.modalTitle}>Disburse Staff Salary</Text>
                <TouchableOpacity onPress={() => setDisburseItem(null)}>
                  <MaterialCommunityIcons name="close" size={24} color="#718096" />
                </TouchableOpacity>
              </View>

              <ScrollView style={sharedFinanceStyles.modalBody}>
                <Text style={sharedFinanceStyles.label}>Staff Member</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, backgroundColor: '#F1F5F9' }]}>
                  {disburseItem.payeeName} ({disburseItem.department || 'Faculty'})
                </Text>

                <Text style={sharedFinanceStyles.label}>Net Pay Amount (₹)</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, fontSize: 18, fontWeight: '800', color: '#DC2626', backgroundColor: '#FEE2E2' }]}>
                  {formatINR(disburseItem.amount)}
                </Text>

                <Text style={sharedFinanceStyles.label}>Disbursement Channel</Text>
                <View style={sharedFinanceStyles.radioRow}>
                  {(['bank_transfer', 'cheque', 'upi', 'cash'] as PaymentMethod[]).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        sharedFinanceStyles.radioBtn,
                        selectedMethod === m && { backgroundColor: '#DC2626', borderColor: '#DC2626' },
                      ]}
                      onPress={() => setSelectedMethod(m)}
                    >
                      <Text style={[sharedFinanceStyles.radioText, selectedMethod === m && sharedFinanceStyles.radioTextActive]}>
                        {m === 'bank_transfer' ? 'NEFT / Direct Bank' : m.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={sharedFinanceStyles.modalFooter}>
                <TouchableOpacity style={sharedFinanceStyles.cancelBtn} onPress={() => setDisburseItem(null)}>
                  <Text style={sharedFinanceStyles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sharedFinanceStyles.submitBtn, { backgroundColor: '#DC2626' }]} onPress={handleConfirmDisburse}>
                  <Text style={sharedFinanceStyles.submitBtnText}>Confirm Disbursal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Voucher Modal ── */}
      {selectedVoucher && (
        <Modal visible={!!selectedVoucher} transparent animationType="fade">
          <View style={sharedFinanceStyles.modalOverlay}>
            <View style={sharedFinanceStyles.documentContent}>
              <View style={sharedFinanceStyles.documentHeader}>
                <MaterialCommunityIcons name="file-document-outline" size={32} color="#DC3545" />
                <Text style={sharedFinanceStyles.documentSchoolName}>SchoolHub Academy</Text>
                <Text style={sharedFinanceStyles.documentSubHeader}>Official Payment Voucher</Text>
              </View>

              <View style={sharedFinanceStyles.documentDivider} />

              <View style={sharedFinanceStyles.documentBody}>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Voucher No:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedVoucher.invoiceNo}</Text>
                </View>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Payee:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedVoucher.payeeName}</Text>
                </View>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Date Disbursed:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedVoucher.paymentDate}</Text>
                </View>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Payment Method:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedVoucher.paymentMethod.toUpperCase()}</Text>
                </View>

                <View style={[sharedFinanceStyles.documentTotalBox, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={sharedFinanceStyles.documentTotalLabel}>Total Disbursed</Text>
                  <Text style={[sharedFinanceStyles.documentTotalVal, { color: '#DC2626' }]}>
                    {formatINR(selectedVoucher.amount)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={[sharedFinanceStyles.closeDocumentBtn, { backgroundColor: '#DC3545' }]} onPress={() => setSelectedVoucher(null)}>
                <Text style={sharedFinanceStyles.closeDocumentBtnText}>Close Voucher</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Record Voucher Modal ── */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={sharedFinanceStyles.modalOverlay}>
          <View style={sharedFinanceStyles.modalContent}>
            <View style={sharedFinanceStyles.modalHeader}>
              <Text style={sharedFinanceStyles.modalTitle}>Record Expense Voucher</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            <ScrollView style={sharedFinanceStyles.modalBody}>
              <Text style={sharedFinanceStyles.label}>Title / Description *</Text>
              <TextInput style={sharedFinanceStyles.input} placeholder="e.g. Science Lab Equipment" value={title} onChangeText={setTitle} />

              <Text style={sharedFinanceStyles.label}>Category</Text>
              <View style={sharedFinanceStyles.radioRow}>
                {(['salary', 'utility', 'maintenance', 'misc'] as ExpenseCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[sharedFinanceStyles.radioBtn, category === cat && { backgroundColor: '#DC3545', borderColor: '#DC3545' }]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[sharedFinanceStyles.radioText, category === cat && sharedFinanceStyles.radioTextActive]}>
                      {getExpenseCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={sharedFinanceStyles.label}>Payee / Vendor Name *</Text>
              <TextInput style={sharedFinanceStyles.input} placeholder="e.g. Lab Supplies India" value={payeeName} onChangeText={setPayeeName} />

              <Text style={sharedFinanceStyles.label}>Amount (₹) *</Text>
              <TextInput style={sharedFinanceStyles.input} placeholder="e.g. 15000" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            </ScrollView>

            <View style={sharedFinanceStyles.modalFooter}>
              <TouchableOpacity style={sharedFinanceStyles.cancelBtn} onPress={() => setIsAddModalOpen(false)}>
                <Text style={sharedFinanceStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[sharedFinanceStyles.submitBtn, { backgroundColor: '#DC3545' }]} onPress={handleAddSubmit}>
                <Text style={sharedFinanceStyles.submitBtnText}>Save Voucher</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Edit Statement Modal ── */}
      {editingItem && (
        <Modal visible={!!editingItem} animationType="slide" transparent>
          <View style={sharedFinanceStyles.modalOverlay}>
            <View style={sharedFinanceStyles.modalContent}>
              <View style={sharedFinanceStyles.modalHeader}>
                <Text style={sharedFinanceStyles.modalTitle}>Update Expense Statement</Text>
                <TouchableOpacity onPress={() => setEditingItem(null)}>
                  <MaterialCommunityIcons name="close" size={24} color="#718096" />
                </TouchableOpacity>
              </View>

              <ScrollView style={sharedFinanceStyles.modalBody}>
                <Text style={sharedFinanceStyles.label}>Payee</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, backgroundColor: '#F1F5F9' }]}>{editingItem.payeeName}</Text>

                <Text style={sharedFinanceStyles.label}>Amount (₹) *</Text>
                <TextInput style={sharedFinanceStyles.input} keyboardType="numeric" value={editAmount} onChangeText={setEditAmount} />

                <Text style={sharedFinanceStyles.label}>Status</Text>
                <View style={sharedFinanceStyles.radioRow}>
                  {(['paid', 'pending'] as PaymentStatus[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[sharedFinanceStyles.radioBtn, editStatus === s && { backgroundColor: s === 'paid' ? '#16A34A' : '#DC3545', borderColor: s === 'paid' ? '#16A34A' : '#DC3545' }]}
                      onPress={() => setEditStatus(s)}
                    >
                      <Text style={[sharedFinanceStyles.radioText, editStatus === s && sharedFinanceStyles.radioTextActive]}>{s.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={sharedFinanceStyles.modalFooter}>
                <TouchableOpacity style={sharedFinanceStyles.cancelBtn} onPress={() => setEditingItem(null)}>
                  <Text style={sharedFinanceStyles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sharedFinanceStyles.submitBtn, { backgroundColor: '#DC3545' }]} onPress={handleSaveEdit}>
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
  tabToggleActive: { backgroundColor: '#EDE7F6', borderColor: '#7E57C2' },
  tabToggleText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabToggleTextActive: { color: '#7E57C2' },

  searchRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 38,
  },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 12, color: '#1A202C' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC3545',
    paddingHorizontal: 12,
    borderRadius: BorderRadius.button,
    height: 38,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },

  disburseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  disburseBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
