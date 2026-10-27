/**
 * @file ExpenseManagementView.tsx
 * @description Expenditures & Accounts Payable management panel for the School Finance portal.
 *
 * Features:
 *  - Category filter dropdown (All / Salaries / Bus Fuel / Bus Maintenance / Hostel / Utilities)
 *  - Full-text search by title, vendor/payee name, department, or vehicle
 *  - "Record Expense" slide-up modal form with validation
 *  - "Edit / Update Payment" modal to update voucher status, amount, method, or date
 *  - Official Payment Voucher / Invoice viewer (fade modal)
 *  - Delete expense record action
 *  - Zero-overlap responsive card layout
 */

import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  ExpenseCategory,
  ExpenseRecord,
  PaymentMethod,
  PaymentStatus,
  PayrollFrequency,
  PayrollStaff,
} from '../types/finance';
import {
  getExpenseCategoryLabel,
  getExpenseCategoryColor,
  formatINR,
} from '../utils/financeUtils';
import { showAlert } from '../../shared/utils/showAlert';
import { sharedFinanceStyles } from './financeStyles';
import {
  capitalize,
  WEEKDAYS,
  FREQUENCY_OPTIONS,
  payrollFrequencyLabel,
} from '../utils/payrollUtils';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  upi: 'UPI',
  cash: 'Cash',
  card: 'Card',
};

const methodLabel = (m: PaymentMethod) => METHOD_LABELS[m] || m.toUpperCase();

export const ExpenseManagementView: React.FC = () => {
  // Store selectors
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);
  const addExpense = useFinanceStore((s) => s.addExpense);
  const updateExpenseRecord = useFinanceStore((s) => s.updateExpenseRecord);
  const deleteExpense = useFinanceStore((s) => s.deleteExpense);
  const payrollSchedules = useFinanceStore((s) => s.payrollSchedules);
  const loadPayrolls = useFinanceStore((s) => s.loadPayrolls);
  const loadPayrollStaff = useFinanceStore((s) => s.loadPayrollStaff);
  const createPayrollSchedules = useFinanceStore((s) => s.createPayrollSchedules);

  const router = useRouter();

  // Filter & search state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

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

  // Salary builder state (recurring payroll schedules)
  const [staffList, setStaffList] = useState<PayrollStaff[]>([]);
  const [salRole, setSalRole] = useState('');
  const [salRoleOpen, setSalRoleOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [salFrequency, setSalFrequency] = useState<PayrollFrequency>('monthly');
  const [freqOpen, setFreqOpen] = useState(false);
  const [dayOfMonth, setDayOfMonth] = useState(String(new Date().getDate()));
  const [weekday, setWeekday] = useState(String(new Date().getDay()));
  const [daysOfMonth, setDaysOfMonth] = useState<string[]>(['1']);
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  // Edit / Update Payment Modal State
  const [editingItem, setEditingItem] = useState<ExpenseRecord | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editStatus, setEditStatus] = useState<PaymentStatus>('paid');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('bank_transfer');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Invoice modal state
  const [selectedInvoice, setSelectedInvoice] = useState<ExpenseRecord | null>(null);

  // Category filter options (dropdown)
  const categories: { label: string; value: string }[] = [
    { label: 'All Expenses', value: 'all' },
    { label: 'Staff Salaries', value: 'salary' },
    { label: 'Bus Fuel', value: 'bus_fuel' },
    { label: 'Bus Maintenance', value: 'bus_maintenance' },
    { label: 'Hostel Ops', value: 'hostel_expense' },
    { label: 'Campus Utilities', value: 'utility' },
    { label: 'Maintenance', value: 'maintenance' },
  ];
  const filterLabel = categories.find((c) => c.value === selectedCategory)?.label || 'All Expenses';

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

  // Summary strip values
  const totalDisbursed = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
  const paidTotal = expenseRecords.filter((r) => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0);
  const pendingRecords = expenseRecords.filter((r) => r.status !== 'paid');
  const pendingTotal = pendingRecords.reduce((sum, r) => sum + r.amount, 0);

  // Keep schedules + freshly-due salary rows in sync whenever this view mounts.
  useEffect(() => {
    void loadPayrolls();
  }, [loadPayrolls]);

  const roleOptions = Array.from(new Set(staffList.map((s) => s.role).filter(Boolean))).sort();
  const filteredStaff = staffList.filter((person) => {
    if (salRole && person.role !== salRole) return false;
    if (staffSearch.trim()) {
      const q = staffSearch.toLowerCase();
      if (!person.fullName.toLowerCase().includes(q) && !(person.role || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleOpenAdd = () => {
    setIsAddModalOpen(true);
    if (staffList.length === 0) {
      loadPayrollStaff()
        .then((list) => setStaffList(list || []))
        .catch(() => {});
    }
  };

  const handlePickRole = (role: string) => {
    setSalRole(role);
    setSalRoleOpen(false);
  };

  const handleToggleStaff = (id: string) => {
    setSelectedStaff((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleToggleDay = (day: string) => {
    setDaysOfMonth((prev) => (prev.includes(day) ? prev.filter((x) => x !== day) : [...prev, day]));
  };

  const resetSalaryForm = () => {
    setSalRole('');
    setSelectedStaff([]);
    setStaffSearch('');
    setSalFrequency('monthly');
    setDayOfMonth(String(new Date().getDate()));
    setWeekday(String(new Date().getDay()));
    setDaysOfMonth(['1']);
    setAmount('');
  };

  const handlePayrollSubmit = async () => {
    if (selectedStaff.length === 0) {
      showAlert('Select Staff', 'Pick at least one staff member for this payroll schedule.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid positive number for the amount.');
      return;
    }
    if (salFrequency === 'days_of_month' && daysOfMonth.length === 0) {
      showAlert('Select Days', 'Pick at least one day of the month.');
      return;
    }

    setSubmittingSchedule(true);
    try {
      const result = await createPayrollSchedules({
        userIds: selectedStaff,
        amount: numAmount,
        frequency: salFrequency,
        dayOfMonth: salFrequency === 'monthly' ? parseInt(dayOfMonth, 10) : undefined,
        weekday: salFrequency === 'weekly' ? parseInt(weekday, 10) : undefined,
        daysOfMonth:
          salFrequency === 'days_of_month'
            ? [...new Set(daysOfMonth.map((d) => parseInt(d, 10)))].sort((a, b) => a - b)
            : undefined,
      });
      resetSalaryForm();
      setIsAddModalOpen(false);
      const skippedNote = result.skipped > 0 ? ` · ${result.skipped} skipped (already on payroll)` : '';
      showAlert(
        'Payroll Scheduled',
        `${result.created} schedule(s) created${skippedNote}. Due periods are added to Pending automatically.`,
      );
    } catch (err: any) {
      showAlert('Failed to Create Schedule', err?.message || 'Please try again.');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleOpenEdit = (item: ExpenseRecord) => {
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
      await updateExpenseRecord(editingItem.id, {
        amount: numAmount,
        status: editStatus,
        paymentMethod: editMethod,
        paymentDate: editDate,
        notes: editNotes,
      });
      showAlert('Expense Updated', `Payment statement for ${editingItem.payeeName} has been updated.`);
      setEditingItem(null);
    } catch (err: any) {
      showAlert('Update Failed', err?.message || 'Could not save the expense updates.');
    }
  };

  const handleAddSubmit = async () => {
    if (!title.trim() || !payeeName.trim() || !amount.trim()) {
      showAlert('Missing Fields', 'Please fill in all required fields (Title, Payee/Vendor, Amount).');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid positive number for the amount.');
      return;
    }

    try {
      await addExpense({
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
    } catch (err: any) {
      showAlert('Failed to Record Expense', err?.message || 'Please try again.');
      return;
    }

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
      <View style={sharedFinanceStyles.pageHeader}>
        <Text style={sharedFinanceStyles.pageTitle}>Expense Ledger</Text>
        <Text style={sharedFinanceStyles.pageSubtitle}>Record and track school expenses.</Text>
      </View>

      {/* Summary Strip */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryNum}>{formatINR(totalDisbursed)}</Text>
          <Text style={styles.summaryLabel}>TOTAL</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryNum, { color: '#16A34A' }]}>{formatINR(paidTotal)}</Text>
          <Text style={styles.summaryLabel}>PAID</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryNum, { color: '#D97706' }]}>{formatINR(pendingTotal)}</Text>
          <Text style={styles.summaryLabel}>
            PENDING{pendingRecords.length ? ` · ${pendingRecords.length}` : ''}
          </Text>
        </View>
      </View>

      {/* Top Actions Bar (Search + Record CTA) */}
      <View style={sharedFinanceStyles.actionsBar}>
        <View style={sharedFinanceStyles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6B6B6B" />
          <TextInput
            style={sharedFinanceStyles.searchInput}
            placeholder="Search by title, vendor, department..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9A9A9A"
          />
        </View>

        <TouchableOpacity
          style={[sharedFinanceStyles.addBtn, styles.addBtnExpense]}
          onPress={handleOpenAdd}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#171717" />
          <Text style={sharedFinanceStyles.addBtnText}>Record Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Dropdown + Result Count */}
      <View style={styles.filterRow}>
        <View style={styles.dropdownWrap}>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setFilterOpen((o) => !o)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="filter-variant" size={16} color="#171717" />
            <Text style={styles.dropdownText} numberOfLines={1}>
              {filterLabel}
            </Text>
            <MaterialCommunityIcons
              name={filterOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#6B6B6B"
            />
          </TouchableOpacity>

          {filterOpen && (
            <View style={styles.dropdownMenu}>
              {categories.map((cat) => {
                const active = selectedCategory === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                    onPress={() => {
                      setSelectedCategory(cat.value);
                      setFilterOpen(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>
                      {cat.label}
                    </Text>
                    {active && <MaterialCommunityIcons name="check" size={14} color="#B8860B" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <Text style={styles.resultCount}>
          {filteredRecords.length} {filteredRecords.length === 1 ? 'voucher' : 'vouchers'}
        </Text>
      </View>

      {/* Expense Records List */}
      <ScrollView style={sharedFinanceStyles.listContainer} showsVerticalScrollIndicator={false}>
        {/* Recurring payroll schedules (tap → person payroll page) */}
        {payrollSchedules.length > 0 &&
          (selectedCategory === 'all' || selectedCategory === 'salary') && (
            <View style={styles.payrollSection}>
              <Text style={styles.sectionLabel}>
                RECURRING PAYROLL · {payrollSchedules.length}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.payrollStrip}
              >
                {payrollSchedules.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.payrollCard}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/(accountant)/payroll/${s.id}` as any)}
                  >
                    <View style={styles.payrollCardTop}>
                      <View style={styles.payrollAvatar}>
                        <Text style={styles.payrollAvatarText}>
                          {s.payeeName.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.miniChip,
                          { backgroundColor: s.active ? '#DCFCE7' : '#F3F4F6' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.miniChipText,
                            { color: s.active ? '#16A34A' : '#6B6B6B' },
                          ]}
                        >
                          {s.active ? 'ACTIVE' : 'PAUSED'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.payrollName} numberOfLines={1}>
                      {s.payeeName}
                    </Text>
                    <Text style={styles.payrollRole} numberOfLines={1}>
                      {capitalize(s.role) || 'Staff'} · {payrollFrequencyLabel(s)}
                    </Text>
                    <Text style={styles.payrollAmount}>{formatINR(s.amount)}</Text>
                    <Text style={styles.payrollDue}>
                      {s.pendingAmount > 0 ? `Due ${formatINR(s.pendingAmount)}` : 'All cleared'}
                      {s.nextDue ? ` · ${s.nextDue}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

        {filteredRecords.length === 0 ? (
          <View style={sharedFinanceStyles.emptyState}>
            <MaterialCommunityIcons name="credit-card-off-outline" size={48} color="#9A9A9A" />
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
                  Date: {item.paymentDate} • Mode: {methodLabel(item.paymentMethod)} • Voucher: {item.invoiceNo}
                </Text>

                {/* Action Footer */}
                <View style={sharedFinanceStyles.cardFooterRow}>
                  <View style={[sharedFinanceStyles.statusTag, isPaid ? sharedFinanceStyles.statusPaid : sharedFinanceStyles.statusPending]}>
                    <Text style={[sharedFinanceStyles.statusText, isPaid ? sharedFinanceStyles.statusTextPaid : sharedFinanceStyles.statusTextPending]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>

                  <View style={sharedFinanceStyles.actionIconsGroup}>
                    {item.scheduleId ? (
                      <TouchableOpacity
                        style={sharedFinanceStyles.actionIconBtn}
                        onPress={() => router.push(`/(accountant)/payroll/${item.scheduleId}` as any)}
                      >
                        <MaterialCommunityIcons name="account-cash-outline" size={14} color="#B8860B" />
                        <Text style={[sharedFinanceStyles.actionIconBtnText, { color: '#B8860B' }]}>
                          Payroll
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={sharedFinanceStyles.actionIconBtn}
                      onPress={() => handleOpenEdit(item)}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={14} color="#171717" />
                      <Text style={[sharedFinanceStyles.actionIconBtnText, { color: '#171717' }]}>Update</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={sharedFinanceStyles.actionIconBtn}
                      onPress={() => setSelectedInvoice(item)}
                    >
                      <MaterialCommunityIcons name="file-document-outline" size={14} color="#B8860B" />
                      <Text style={[sharedFinanceStyles.actionIconBtnText, { color: '#B8860B' }]}>Voucher</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={sharedFinanceStyles.actionIconBtn}
                      onPress={() => deleteExpense(item.id).catch(() => {})}
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
                  <MaterialCommunityIcons name="close" size={24} color="#6B6B6B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={sharedFinanceStyles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={sharedFinanceStyles.label}>Payee / Vendor</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, backgroundColor: '#FFFDF7', color: '#6B6B6B' }]}>
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
              <Text style={sharedFinanceStyles.modalTitle}>
                {category === 'salary' ? 'Create Payroll Schedule' : 'Record Expense Voucher'}
              </Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={sharedFinanceStyles.modalBody} showsVerticalScrollIndicator={false}>
              {category !== 'salary' && (
                <>
                  <Text style={sharedFinanceStyles.label}>Expense Title / Description *</Text>
                  <TextInput
                    style={sharedFinanceStyles.input}
                    placeholder="e.g. Bus #2 Tyre Replacement"
                    value={title}
                    onChangeText={setTitle}
                  />
                </>
              )}

              <Text style={sharedFinanceStyles.label}>Category *</Text>
              <View style={styles.dropdownWrap}>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setCatOpen((o) => !o)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="tag-outline" size={16} color="#6B6B6B" />
                  <Text style={styles.dropdownText} numberOfLines={1}>
                    {getExpenseCategoryLabel(category)}
                  </Text>
                  <MaterialCommunityIcons
                    name={catOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#6B6B6B"
                  />
                </TouchableOpacity>

                {catOpen && (
                  <View style={styles.dropdownMenu}>
                    {(
                      [
                        'salary',
                        'bus_fuel',
                        'bus_maintenance',
                        'hostel_expense',
                        'utility',
                        'maintenance',
                      ] as ExpenseCategory[]
                    ).map((cat) => {
                      const active = category === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                          onPress={() => {
                            setCategory(cat);
                            setCatOpen(false);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>
                            {getExpenseCategoryLabel(cat)}
                          </Text>
                          {active && <MaterialCommunityIcons name="check" size={14} color="#B8860B" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {category === 'salary' ? (
                <>
                  <Text style={sharedFinanceStyles.label}>Staff Role</Text>
                  <View style={styles.dropdownWrap}>
                    <TouchableOpacity
                      style={styles.dropdownBtn}
                      onPress={() => setSalRoleOpen((o) => !o)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="account-tie-outline" size={16} color="#6B6B6B" />
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {salRole ? capitalize(salRole) : 'All Staff'}
                      </Text>
                      <MaterialCommunityIcons
                        name={salRoleOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#6B6B6B"
                      />
                    </TouchableOpacity>
                    {salRoleOpen && (
                      <View style={styles.dropdownMenu}>
                        {[
                          { label: 'All Staff', value: '' },
                          ...roleOptions.map((r) => ({ label: capitalize(r), value: r })),
                        ].map((opt) => {
                          const active = salRole === opt.value;
                          return (
                            <TouchableOpacity
                              key={opt.value || 'all-staff'}
                              style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                              onPress={() => handlePickRole(opt.value)}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}
                              >
                                {opt.label}
                              </Text>
                              {active && <MaterialCommunityIcons name="check" size={14} color="#B8860B" />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  <Text style={sharedFinanceStyles.label}>
                    Select Staff{selectedStaff.length ? ` (${selectedStaff.length} selected)` : ''} *
                  </Text>
                  <View style={styles.staffSearchBox}>
                    <MaterialCommunityIcons name="magnify" size={16} color="#6B6B6B" />
                    <TextInput
                      style={styles.staffSearchInput}
                      placeholder="Search staff by name or role..."
                      value={staffSearch}
                      onChangeText={setStaffSearch}
                      placeholderTextColor="#9A9A9A"
                    />
                  </View>
                  <View style={styles.staffList}>
                    <ScrollView
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                    >
                      {filteredStaff.length === 0 ? (
                        <Text style={styles.staffEmpty}>
                          {staffList.length === 0
                            ? 'Loading staff…'
                            : 'No staff match this filter.'}
                        </Text>
                      ) : (
                        filteredStaff.map((person) => {
                          const checked = selectedStaff.includes(person.id);
                          return (
                            <TouchableOpacity
                              key={person.id}
                              style={styles.staffRow}
                              activeOpacity={0.75}
                              onPress={() => handleToggleStaff(person.id)}
                            >
                              <View style={styles.staffAvatar}>
                                <Text style={styles.staffAvatarText}>
                                  {person.fullName.substring(0, 2).toUpperCase()}
                                </Text>
                              </View>
                              <View style={styles.staffInfo}>
                                <Text style={styles.staffName} numberOfLines={1}>
                                  {person.fullName}
                                </Text>
                                <Text style={styles.staffRole} numberOfLines={1}>
                                  {capitalize(person.role) || 'Staff'}
                                </Text>
                              </View>
                              <View style={[styles.staffCheck, checked && styles.staffCheckActive]}>
                                {checked && (
                                  <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </ScrollView>
                  </View>

                  <Text style={sharedFinanceStyles.label}>
                    {salFrequency === 'daily' ? 'Amount per Day (₹) *' : 'Salary Amount (₹) *'}
                  </Text>
                  <TextInput
                    style={sharedFinanceStyles.input}
                    placeholder="e.g. 25000"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />

                  <Text style={sharedFinanceStyles.label}>Frequency *</Text>
                  <View style={styles.dropdownWrap}>
                    <TouchableOpacity
                      style={styles.dropdownBtn}
                      onPress={() => setFreqOpen((o) => !o)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name="calendar-sync-outline"
                        size={16}
                        color="#6B6B6B"
                      />
                      <Text style={styles.dropdownText} numberOfLines={1}>
                        {FREQUENCY_OPTIONS.find((f) => f.value === salFrequency)?.label || 'Monthly'}
                      </Text>
                      <MaterialCommunityIcons
                        name={freqOpen ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#6B6B6B"
                      />
                    </TouchableOpacity>
                    {freqOpen && (
                      <View style={styles.dropdownMenu}>
                        {FREQUENCY_OPTIONS.map((opt) => {
                          const active = salFrequency === opt.value;
                          return (
                            <TouchableOpacity
                              key={opt.value}
                              style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                              onPress={() => {
                                setSalFrequency(opt.value);
                                setFreqOpen(false);
                              }}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}
                              >
                                {opt.label}
                              </Text>
                              {active && <MaterialCommunityIcons name="check" size={14} color="#B8860B" />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {salFrequency === 'monthly' && (
                    <>
                      <Text style={sharedFinanceStyles.label}>Pay Day of Month</Text>
                      <View style={styles.chipWrap}>
                        {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((dd) => {
                          const active = dayOfMonth === dd;
                          return (
                            <TouchableOpacity
                              key={dd}
                              style={[styles.dayChip, active && styles.dayChipActive]}
                              onPress={() => setDayOfMonth(dd)}
                              activeOpacity={0.75}
                            >
                              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                                {dd}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {salFrequency === 'weekly' && (
                    <>
                      <Text style={sharedFinanceStyles.label}>Pay Day of Week</Text>
                      <View style={styles.chipWrap}>
                        {WEEKDAYS.map((w) => {
                          const active = weekday === String(w.value);
                          return (
                            <TouchableOpacity
                              key={w.label}
                              style={[styles.dayChip, active && styles.dayChipActive]}
                              onPress={() => setWeekday(String(w.value))}
                              activeOpacity={0.75}
                            >
                              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                                {w.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}

                  {salFrequency === 'days_of_month' && (
                    <>
                      <Text style={sharedFinanceStyles.label}>Days of Month (tap to toggle)</Text>
                      <View style={styles.chipWrap}>
                        {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((dd) => {
                          const active = daysOfMonth.includes(dd);
                          return (
                            <TouchableOpacity
                              key={dd}
                              style={[styles.dayChip, active && styles.dayChipActive]}
                              onPress={() => handleToggleDay(dd)}
                              activeOpacity={0.75}
                            >
                              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                                {dd}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}

                  <Text style={styles.hintText}>
                    {salFrequency === 'daily'
                      ? 'A pending salary row is added every day starting today.'
                      : 'Starts today · due periods appear in Pending automatically (day 31 clamps to shorter months).'}
                  </Text>
                </>
              ) : (
                <>
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
                </>
              )}
            </ScrollView>

            <View style={sharedFinanceStyles.modalFooter}>
              <TouchableOpacity style={sharedFinanceStyles.cancelBtn} onPress={() => setIsAddModalOpen(false)}>
                <Text style={sharedFinanceStyles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  sharedFinanceStyles.submitBtn,
                  styles.submitBtnExpense,
                  submittingSchedule && { opacity: 0.6 },
                ]}
                disabled={submittingSchedule}
                onPress={category === 'salary' ? handlePayrollSubmit : handleAddSubmit}
              >
                <Text style={sharedFinanceStyles.submitBtnText}>
                  {submittingSchedule
                    ? 'Creating…'
                    : category === 'salary'
                      ? 'Create Schedule'
                      : 'Save Expense'}
                </Text>
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
                <MaterialCommunityIcons name="file-document-outline" size={32} color="#171717" />
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
                  <Text style={sharedFinanceStyles.documentVal}>{methodLabel(selectedInvoice.paymentMethod)}</Text>
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
  addBtnExpense: { backgroundColor: '#F4C430' },
  expenseAmount: { color: '#DC3545' },
  submitBtnExpense: { backgroundColor: '#171717' },
  radioBtnActiveExpense: { backgroundColor: '#171717', borderColor: '#171717' },
  radioBtnActivePending: { backgroundColor: '#D97706', borderColor: '#D97706' },
  invoiceTotalBox: { backgroundColor: '#FEE2E2' },
  invoiceTotalVal: { color: '#DC3545' },
  closeInvoiceBtn: { backgroundColor: '#171717' },

  // Summary strip
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingVertical: 14,
    marginBottom: 12,
  },
  summaryCell: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  summaryNum: { fontSize: 14, fontWeight: '800', color: '#171717' },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B6B6B',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  summaryDivider: { width: 1, height: 28, backgroundColor: '#E8E5DC' },

  // Category filter dropdown
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

  // Recurring payroll strip
  payrollSection: { marginBottom: 12 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B6B6B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  payrollStrip: { gap: 8, paddingRight: 4 },
  payrollCard: {
    width: 178,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 12,
    gap: 3,
  },
  payrollCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  payrollAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payrollAvatarText: { fontSize: 11, fontWeight: '800', color: '#171717' },
  miniChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  miniChipText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  payrollName: { fontSize: 13, fontWeight: '800', color: '#171717' },
  payrollRole: { fontSize: 10, color: '#6B6B6B', fontWeight: '600' },
  payrollAmount: { fontSize: 15, fontWeight: '800', color: '#171717', marginTop: 4 },
  payrollDue: { fontSize: 10, color: '#D97706', fontWeight: '700' },

  // Salary builder — staff multi-select
  staffSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 8,
  },
  staffSearchInput: { flex: 1, fontSize: 13, color: '#171717', paddingVertical: 0 },
  staffList: {
    maxHeight: 180,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    marginBottom: 12,
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFDF7',
  },
  staffAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffAvatarText: { fontSize: 11, fontWeight: '800', color: '#6B6B6B' },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 13, fontWeight: '700', color: '#171717' },
  staffRole: { fontSize: 10, color: '#6B6B6B', fontWeight: '600', marginTop: 1 },
  staffCheck: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#C9C5BA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffCheckActive: { backgroundColor: '#171717', borderColor: '#171717' },
  staffEmpty: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B6B6B',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },

  // Salary builder — day pickers
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  dayChip: {
    minWidth: 38,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  dayChipActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  dayChipText: { fontSize: 12, fontWeight: '700', color: '#171717' },
  dayChipTextActive: { color: '#171717' },
  hintText: {
    fontSize: 11,
    color: '#6B6B6B',
    lineHeight: 16,
    backgroundColor: '#FFF4C7',
    borderRadius: 5,
    padding: 10,
  },
});
