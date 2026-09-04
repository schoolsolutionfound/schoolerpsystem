/**
 * @file ExpenseManagementView.tsx
 * @description Expenditures & Accounts Payable management panel for the School Finance portal.
 *
 * Features:
 *  - Category filter chips (All / Salaries / Bus Fuel / Bus Repairs / Hostel Ops / Utilities)
 *  - Full-text search by title, vendor/payee name, department, or vehicle
 *  - "Record Expense" slide-up modal form with validation
 *  - "Edit / Update Payment" modal to update voucher status, amount, method, or date
 *  - Official Payment Voucher / Invoice viewer (fade modal)
 *  - Delete expense record action
 *  - Zero-overlap responsive card layout
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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { useFinanceStore } from '../store/useFinanceStore';
import { ExpenseCategory, ExpenseRecord, PaymentMethod, PaymentStatus } from '../types/finance';
import {
  getExpenseCategoryLabel,
  getExpenseCategoryColor,
  formatINR,
} from '../utils/financeUtils';
import { showAlert } from '../../shared/utils/showAlert';
import { sharedFinanceStyles } from './financeStyles';

export const ExpenseManagementView: React.FC = () => {
  // Store selectors
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);
  const addExpense = useFinanceStore((s) => s.addExpense);
  const updateExpenseRecord = useFinanceStore((s) => s.updateExpenseRecord);
  const deleteExpense = useFinanceStore((s) => s.deleteExpense);

  // Filter & search state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('salary');
  const [payeeName, setPayeeName] = useState('');
  const [department, setDepartment] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [notes, setNotes] = useState('');

  // Edit / Update Payment Modal State
  const [editingItem, setEditingItem] = useState<ExpenseRecord | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editStatus, setEditStatus] = useState<PaymentStatus>('paid');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('bank_transfer');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Invoice modal state
  const [selectedInvoice, setSelectedInvoice] = useState<ExpenseRecord | null>(null);

  // Category filter chips
  const categories: { label: string; value: string }[] = [
    { label: 'All Expenses', value: 'all' },
    { label: 'Staff Salaries', value: 'salary' },
    { label: 'Bus Fuel', value: 'bus_fuel' },
    { label: 'Bus Maintenance', value: 'bus_maintenance' },
    { label: 'Hostel Ops', value: 'hostel_expense' },
    { label: 'Campus Utilities', value: 'utility' },
  ];

  // Filter logic
  const filteredRecords = expenseRecords.filter((item) => {
    let matchesCategory = false;
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory === 'bus_maintenance') {
      matchesCategory = item.category === 'bus_maintenance' || item.category === 'bus_expense';
    } else {
      matchesCategory = item.category === selectedCategory;
    }

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      item.payeeName.toLowerCase().includes(q) ||
      (item.department && item.department.toLowerCase().includes(q)) ||
      (item.vehicleNo && item.vehicleNo.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

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

    showAlert('Expense Updated', `Payment statement for ${editingItem.payeeName} has been updated.`);
    setEditingItem(null);
  };

  const handleAddSubmit = () => {
    if (!title.trim() || !payeeName.trim() || !amount.trim()) {
      showAlert('Missing Fields', 'Please fill in all required fields (Title, Payee/Vendor, Amount).');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid positive number for the amount.');
      return;
    }

    addExpense({
      title: title.trim(),
      category,
      payeeName: payeeName.trim(),
      department: department.trim() || undefined,
      vehicleNo: vehicleNo.trim() || undefined,
      amount: numAmount,
      paymentMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      status,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setTitle('');
    setCategory('salary');
    setPayeeName('');
    setDepartment('');
    setVehicleNo('');
    setAmount('');
    setPaymentMethod('bank_transfer');
    setStatus('paid');
    setNotes('');
    setIsAddModalOpen(false);

    showAlert('Success', 'Expense disbursement recorded successfully.');
  };

  return (
    <View style={sharedFinanceStyles.container}>
      {/* Top Actions Bar (Search + Record CTA) */}
      <View style={sharedFinanceStyles.actionsBar}>
        <View style={sharedFinanceStyles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#718096" />
          <TextInput
            style={sharedFinanceStyles.searchInput}
            placeholder="Search by title, vendor, department..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#A0AEC0"
          />
        </View>

        <TouchableOpacity
          style={[sharedFinanceStyles.addBtn, styles.addBtnExpense]}
          onPress={() => setIsAddModalOpen(true)}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={sharedFinanceStyles.addBtnText}>Record Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={sharedFinanceStyles.chipScrollView}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              sharedFinanceStyles.chip,
              selectedCategory === cat.value && styles.chipActiveExpense,
            ]}
            onPress={() => setSelectedCategory(cat.value)}
          >
            <Text
              style={[
                sharedFinanceStyles.chipText,
                selectedCategory === cat.value && sharedFinanceStyles.chipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Expense Records List */}
      <ScrollView style={sharedFinanceStyles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredRecords.length === 0 ? (
          <View style={sharedFinanceStyles.emptyState}>
            <MaterialCommunityIcons name="credit-card-off-outline" size={48} color="#CBD5E1" />
            <Text style={sharedFinanceStyles.emptyTitle}>No Expenses Found</Text>
            <Text style={sharedFinanceStyles.emptySubtitle}>
              Try adjusting your search query or record a new expense voucher above.
            </Text>
          </View>
        ) : (
          filteredRecords.map((item) => {
            const catBadge = getExpenseCategoryColor(item.category);
            const isPaid = item.status === 'paid';

            return (
              <View key={item.id} style={sharedFinanceStyles.cardItem}>
                {/* Header: Icon + Category Badge + Amount */}
                <View style={sharedFinanceStyles.cardHeaderRow}>
                  <View style={sharedFinanceStyles.cardHeaderLeft}>
                    <View style={[sharedFinanceStyles.iconBox, { backgroundColor: catBadge.bg }]}>
                      <MaterialCommunityIcons
                        name={
                          item.category === 'salary'
                            ? 'account-cash'
                            : item.category === 'bus_fuel'
                              ? 'gas-station'
                              : item.category === 'bus_maintenance' || item.category === 'bus_expense'
                                ? 'wrench'
                                : item.category === 'hostel_expense'
                                  ? 'food-variant'
                                  : 'lightning-bolt'
                        }
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

                  <Text style={[sharedFinanceStyles.itemAmount, styles.expenseAmount]}>
                    -{formatINR(item.amount)}
                  </Text>
                </View>

                {/* Title */}
                <Text style={sharedFinanceStyles.cardTitle}>{item.title}</Text>

                {/* Payee / Vendor Info */}
                <Text style={sharedFinanceStyles.payerRow}>
                  Payee: <Text style={sharedFinanceStyles.boldPayer}>{item.payeeName}</Text>
                  {item.department ? ` • ${item.department}` : ''}
                  {item.vehicleNo ? ` • ${item.vehicleNo}` : ''}
                </Text>

                {/* Meta details */}
                <Text style={sharedFinanceStyles.metaRow}>
                  Date: {item.paymentDate} • Mode: {item.paymentMethod.toUpperCase()} • Voucher: {item.invoiceNo}
                </Text>

                {/* Action Footer */}
                <View style={sharedFinanceStyles.cardFooterRow}>
                  <View style={[sharedFinanceStyles.statusTag, isPaid ? sharedFinanceStyles.statusPaid : sharedFinanceStyles.statusPending]}>
                    <Text style={[sharedFinanceStyles.statusText, isPaid ? sharedFinanceStyles.statusTextPaid : sharedFinanceStyles.statusTextPending]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>

                  <View style={sharedFinanceStyles.actionIconsGroup}>
                    <TouchableOpacity
                      style={sharedFinanceStyles.actionIconBtn}
                      onPress={() => handleOpenEdit(item)}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={14} color="#0284C7" />
                      <Text style={[sharedFinanceStyles.actionIconBtnText, { color: '#0284C7' }]}>Update</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={sharedFinanceStyles.actionIconBtn}
                      onPress={() => setSelectedInvoice(item)}
                    >
                      <MaterialCommunityIcons name="file-document-outline" size={14} color="#DC3545" />
                      <Text style={[sharedFinanceStyles.actionIconBtnText, { color: '#DC3545' }]}>Voucher</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={sharedFinanceStyles.actionIconBtn}
                      onPress={() => deleteExpense(item.id)}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={14} color="#DC3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Edit / Update Expense Modal ── */}
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

              <ScrollView style={sharedFinanceStyles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={sharedFinanceStyles.label}>Payee / Vendor</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, backgroundColor: '#F1F5F9', color: '#475569' }]}>
                  {editingItem.payeeName} {editingItem.department ? `(${editingItem.department})` : ''}
                </Text>

                <Text style={sharedFinanceStyles.label}>Disbursement Amount (₹) *</Text>
                <TextInput
                  style={sharedFinanceStyles.input}
                  keyboardType="numeric"
                  value={editAmount}
                  onChangeText={setEditAmount}
                />

                <Text style={sharedFinanceStyles.label}>Voucher Status *</Text>
                <View style={sharedFinanceStyles.radioRow}>
                  {(['paid', 'pending'] as PaymentStatus[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        sharedFinanceStyles.radioBtn,
                        editStatus === s && (s === 'paid' ? styles.radioBtnActiveExpense : styles.radioBtnActivePending),
                      ]}
                      onPress={() => setEditStatus(s)}
                    >
                      <Text style={[sharedFinanceStyles.radioText, editStatus === s && sharedFinanceStyles.radioTextActive]}>
                        {s.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={sharedFinanceStyles.label}>Payment Channel</Text>
                <View style={sharedFinanceStyles.radioRow}>
                  {(['bank_transfer', 'cheque', 'upi', 'cash', 'card'] as PaymentMethod[]).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        sharedFinanceStyles.radioBtn,
                        editMethod === m && styles.radioBtnActiveExpense,
                      ]}
                      onPress={() => setEditMethod(m)}
                    >
                      <Text style={[sharedFinanceStyles.radioText, editMethod === m && sharedFinanceStyles.radioTextActive]}>
                        {m === 'bank_transfer' ? 'NEFT / Bank' : m.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={sharedFinanceStyles.label}>Payment Date</Text>
                <TextInput
                  style={sharedFinanceStyles.input}
                  value={editDate}
                  onChangeText={setEditDate}
                />

                <Text style={sharedFinanceStyles.label}>Notes / Voucher Remarks</Text>
                <TextInput
                  style={sharedFinanceStyles.input}
                  placeholder="e.g. Approved by Principal / Accounts audit"
                  value={editNotes}
                  onChangeText={setEditNotes}
                />
              </ScrollView>

              <View style={sharedFinanceStyles.modalFooter}>
                <TouchableOpacity style={sharedFinanceStyles.cancelBtn} onPress={() => setEditingItem(null)}>
                  <Text style={sharedFinanceStyles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sharedFinanceStyles.submitBtn, styles.submitBtnExpense]} onPress={handleSaveEdit}>
                  <Text style={sharedFinanceStyles.submitBtnText}>Save Updates</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Record Expense Modal ── */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={sharedFinanceStyles.modalOverlay}>
          <View style={sharedFinanceStyles.modalContent}>
            <View style={sharedFinanceStyles.modalHeader}>
              <Text style={sharedFinanceStyles.modalTitle}>Record Expense Voucher</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            <ScrollView style={sharedFinanceStyles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={sharedFinanceStyles.label}>Expense Title / Description *</Text>
              <TextInput
                style={sharedFinanceStyles.input}
                placeholder="e.g. Bus #2 Tyre Replacement"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={sharedFinanceStyles.label}>Category *</Text>
              <View style={sharedFinanceStyles.radioRow}>
                {(['salary', 'bus_fuel', 'bus_maintenance', 'hostel_expense', 'utility', 'maintenance'] as ExpenseCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      sharedFinanceStyles.radioBtn,
                      category === cat && styles.radioBtnActiveExpense,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[sharedFinanceStyles.radioText, category === cat && sharedFinanceStyles.radioTextActive]}>
                      {getExpenseCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={sharedFinanceStyles.label}>Payee / Vendor Name *</Text>
              <TextInput
                style={sharedFinanceStyles.input}
                placeholder="e.g. MRF Commercial Tyres"
                value={payeeName}
                onChangeText={setPayeeName}
              />

              <View style={sharedFinanceStyles.formRow}>
                <View style={sharedFinanceStyles.formCol}>
                  <Text style={sharedFinanceStyles.label}>Department</Text>
                  <TextInput
                    style={sharedFinanceStyles.input}
                    placeholder="e.g. Transport"
                    value={department}
                    onChangeText={setDepartment}
                  />
                </View>
                <View style={sharedFinanceStyles.formCol}>
                  <Text style={sharedFinanceStyles.label}>Vehicle No (if transport)</Text>
                  <TextInput
                    style={sharedFinanceStyles.input}
                    placeholder="e.g. Bus #2"
                    value={vehicleNo}
                    onChangeText={setVehicleNo}
                  />
                </View>
              </View>

              <Text style={sharedFinanceStyles.label}>Amount (₹) *</Text>
              <TextInput
                style={sharedFinanceStyles.input}
                placeholder="e.g. 18500"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={sharedFinanceStyles.label}>Payment Method</Text>
              <View style={sharedFinanceStyles.radioRow}>
                {(['bank_transfer', 'cheque', 'upi', 'cash', 'card'] as PaymentMethod[]).map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      sharedFinanceStyles.radioBtn,
                      paymentMethod === method && styles.radioBtnActiveExpense,
                    ]}
                    onPress={() => setPaymentMethod(method)}
                  >
                    <Text style={[sharedFinanceStyles.radioText, paymentMethod === method && sharedFinanceStyles.radioTextActive]}>
                      {method === 'bank_transfer' ? 'Bank' : method.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={sharedFinanceStyles.modalFooter}>
              <TouchableOpacity style={sharedFinanceStyles.cancelBtn} onPress={() => setIsAddModalOpen(false)}>
                <Text style={sharedFinanceStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[sharedFinanceStyles.submitBtn, styles.submitBtnExpense]} onPress={handleAddSubmit}>
                <Text style={sharedFinanceStyles.submitBtnText}>Save Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Payment Voucher / Invoice Modal ── */}
      {selectedInvoice && (
        <Modal visible={!!selectedInvoice} transparent animationType="fade">
          <View style={sharedFinanceStyles.modalOverlay}>
            <View style={sharedFinanceStyles.documentContent}>
              <View style={sharedFinanceStyles.documentHeader}>
                <MaterialCommunityIcons name="file-document-outline" size={32} color="#DC3545" />
                <Text style={sharedFinanceStyles.documentSchoolName}>SchoolHub Academy</Text>
                <Text style={sharedFinanceStyles.documentSubHeader}>Payment Voucher</Text>
              </View>

              <View style={sharedFinanceStyles.documentDivider} />

              <View style={sharedFinanceStyles.documentBody}>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Voucher No:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedInvoice.invoiceNo}</Text>
                </View>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Date:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedInvoice.paymentDate}</Text>
                </View>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Payee / Vendor:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedInvoice.payeeName}</Text>
                </View>
                {selectedInvoice.department && (
                  <View style={sharedFinanceStyles.documentRow}>
                    <Text style={sharedFinanceStyles.documentLabel}>Department:</Text>
                    <Text style={sharedFinanceStyles.documentVal}>{selectedInvoice.department}</Text>
                  </View>
                )}
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Category:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{getExpenseCategoryLabel(selectedInvoice.category)}</Text>
                </View>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Payment Method:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedInvoice.paymentMethod.toUpperCase()}</Text>
                </View>

                <View style={[sharedFinanceStyles.documentTotalBox, styles.invoiceTotalBox]}>
                  <Text style={sharedFinanceStyles.documentTotalLabel}>Total Disbursed</Text>
                  <Text style={[sharedFinanceStyles.documentTotalVal, styles.invoiceTotalVal]}>
                    {formatINR(selectedInvoice.amount)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={[sharedFinanceStyles.closeDocumentBtn, styles.closeInvoiceBtn]} onPress={() => setSelectedInvoice(null)}>
                <Text style={sharedFinanceStyles.closeDocumentBtnText}>Close Voucher</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  addBtnExpense: { backgroundColor: '#DC3545' },
  chipActiveExpense: { backgroundColor: '#DC3545', borderColor: '#DC3545' },
  expenseAmount: { color: '#DC3545' },
  submitBtnExpense: { backgroundColor: '#DC3545' },
  radioBtnActiveExpense: { backgroundColor: '#DC3545', borderColor: '#DC3545' },
  radioBtnActivePending: { backgroundColor: '#D97706', borderColor: '#D97706' },
  invoiceTotalBox: { backgroundColor: '#FEE2E2' },
  invoiceTotalVal: { color: '#DC3545' },
  closeInvoiceBtn: { backgroundColor: '#DC3545' },
});
