import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { useFinanceStore } from '../store/useFinanceStore';
import { ExpenseCategory, ExpenseRecord, PaymentMethod, PaymentStatus } from '../types/finance';

export const ExpenseManagementView: React.FC = () => {
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);
  const addExpense = useFinanceStore((s) => s.addExpense);
  const deleteExpense = useFinanceStore((s) => s.deleteExpense);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ExpenseRecord | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('salary');
  const [payeeName, setPayeeName] = useState('');
  const [department, setDepartment] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [notes, setNotes] = useState('');

  const filteredRecords = expenseRecords.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.payeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.department && item.department.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddSubmit = () => {
    if (!title.trim() || !payeeName.trim() || !amount.trim()) {
      if (Platform.OS === 'web') {
        alert('Please fill out Title, Payee Name, and Amount.');
      } else {
        Alert.alert('Required Fields', 'Please fill out Title, Payee Name, and Amount.');
      }
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      if (Platform.OS === 'web') {
        alert('Please enter a valid amount.');
      } else {
        Alert.alert('Invalid Amount', 'Please enter a valid numeric amount.');
      }
      return;
    }

    addExpense({
      title: title.trim(),
      category,
      payeeName: payeeName.trim(),
      department: department.trim() || undefined,
      amount: numAmount,
      paymentMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      status,
      notes: notes.trim() || undefined,
    });

    // Reset Form
    setTitle('');
    setPayeeName('');
    setDepartment('');
    setAmount('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const getCategoryLabel = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'salary':
        return 'Payroll & Salary';
      case 'bus_expense':
        return 'Bus & Transport';
      case 'hostel_expense':
        return 'Hostel Ops';
      case 'utility':
        return 'Utilities';
      case 'maintenance':
        return 'Maintenance';
      case 'other':
        return 'Other Expense';
    }
  };

  const getCategoryColor = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'salary':
        return { bg: '#FEE2E2', text: '#991B1B' };
      case 'bus_expense':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'hostel_expense':
        return { bg: '#FCE7F3', text: '#9D174D' };
      case 'utility':
        return { bg: '#E0F2FE', text: '#075985' };
      case 'maintenance':
        return { bg: '#F3E8FF', text: '#6B21A8' };
      case 'other':
        return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header & Actions Bar */}
      <View style={styles.actionsBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#718096" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by expense, payee, or department..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalOpen(true)}>
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Record Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
        {[
          { key: 'all', label: 'All Expenses' },
          { key: 'salary', label: 'Salaries' },
          { key: 'bus_expense', label: 'Bus & Transport' },
          { key: 'hostel_expense', label: 'Hostel Ops' },
          { key: 'utility', label: 'Utilities' },
          { key: 'maintenance', label: 'Maintenance' },
        ].map((chip) => {
          const isSelected = selectedCategory === chip.key;
          return (
            <TouchableOpacity
              key={chip.key}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => setSelectedCategory(chip.key)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Expense Records List */}
      <ScrollView style={styles.listContainer}>
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="credit-card-off-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Expense Records Found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query or category filter.</Text>
          </View>
        ) : (
          filteredRecords.map((item) => {
            const catBadge = getCategoryColor(item.category);
            const isPaid = item.status === 'paid';
            return (
              <View key={item.id} style={styles.cardItem}>
                <View style={styles.cardRowMain}>
                  <View style={[styles.iconBox, { backgroundColor: catBadge.bg }]}>
                    <MaterialCommunityIcons
                      name={
                        item.category === 'salary'
                          ? 'account-cash'
                          : item.category === 'bus_expense'
                          ? 'bus-clock'
                          : item.category === 'hostel_expense'
                          ? 'food'
                          : item.category === 'utility'
                          ? 'lightning-bolt'
                          : 'wrench'
                      }
                      size={24}
                      color={catBadge.text}
                    />
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <View style={[styles.catChip, { backgroundColor: catBadge.bg }]}>
                        <Text style={[styles.catChipText, { color: catBadge.text }]}>
                          {getCategoryLabel(item.category)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.itemPayee}>
                      Payee: <Text style={styles.itemPayeeBold}>{item.payeeName}</Text>
                      {item.department ? ` • ${item.department}` : ''}
                    </Text>

                    <Text style={styles.itemMeta}>
                      Date: {item.paymentDate} • Mode: {item.paymentMethod.toUpperCase()} • Invoice: {item.invoiceNo}
                    </Text>
                  </View>

                  <View style={styles.cardRight}>
                    <Text style={styles.itemAmount}>-₹{item.amount.toLocaleString('en-IN')}</Text>

                    <View style={[styles.statusTag, isPaid ? styles.statusPaid : styles.statusPending]}>
                      <Text style={[styles.statusText, isPaid ? styles.statusTextPaid : styles.statusTextPending]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.itemActionRow}>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => setSelectedInvoice(item)}
                      >
                        <MaterialCommunityIcons name="file-document-outline" size={18} color="#7E57C2" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => deleteExpense(item.id)}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC3545" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Record Expense Modal */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record School Expense</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Expense Category</Text>
              <View style={styles.radioRow}>
                {[
                  { key: 'salary', label: 'Salary' },
                  { key: 'bus_expense', label: 'Bus / Transport' },
                  { key: 'hostel_expense', label: 'Hostel' },
                  { key: 'utility', label: 'Utility' },
                  { key: 'maintenance', label: 'Maintenance' },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.radioBtn, category === c.key && styles.radioBtnActive]}
                    onPress={() => setCategory(c.key as ExpenseCategory)}
                  >
                    <Text style={[styles.radioText, category === c.key && styles.radioTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Expense Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Bus Fleet Diesel Fill-up"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Payee / Vendor Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Indian Oil / Teacher Payroll"
                value={payeeName}
                onChangeText={setPayeeName}
              />

              <Text style={styles.label}>Department / Section</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Transport / Academics / Hostel"
                value={department}
                onChangeText={setDepartment}
              />

              <Text style={styles.label}>Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 25000"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.label}>Payment Method</Text>
              <View style={styles.radioRow}>
                {[
                  { key: 'bank_transfer', label: 'Bank' },
                  { key: 'upi', label: 'UPI' },
                  { key: 'card', label: 'Card' },
                  { key: 'cheque', label: 'Cheque' },
                  { key: 'cash', label: 'Cash' },
                ].map((m) => (
                  <TouchableOpacity
                    key={m.key}
                    style={[styles.radioBtn, paymentMethod === m.key && styles.radioBtnActive]}
                    onPress={() => setPaymentMethod(m.key as PaymentMethod)}
                  >
                    <Text style={[styles.radioText, paymentMethod === m.key && styles.radioTextActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Status</Text>
              <View style={styles.radioRow}>
                <TouchableOpacity
                  style={[styles.radioBtn, status === 'paid' && styles.radioBtnActive]}
                  onPress={() => setStatus('paid')}
                >
                  <Text style={[styles.radioText, status === 'paid' && styles.radioTextActive]}>Paid</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioBtn, status === 'pending' && styles.radioBtnActive]}
                  onPress={() => setStatus('pending')}
                >
                  <Text style={[styles.radioText, status === 'pending' && styles.radioTextActive]}>
                    Pending
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="Additional invoice remarks or details..."
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddSubmit}>
                <Text style={styles.submitBtnText}>Save Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <Modal visible={!!selectedInvoice} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.invoiceContent}>
              <View style={styles.invoiceHeader}>
                <MaterialCommunityIcons name="file-document-outline" size={32} color="#DC3545" />
                <Text style={styles.invoiceSchoolName}>SchoolHub ERP</Text>
                <Text style={styles.invoiceSubHeader}>Expense Voucher & Invoice</Text>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptBody}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Invoice No:</Text>
                  <Text style={styles.receiptVal}>{selectedInvoice.invoiceNo}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Date:</Text>
                  <Text style={styles.receiptVal}>{selectedInvoice.paymentDate}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payee / Vendor:</Text>
                  <Text style={styles.receiptVal}>{selectedInvoice.payeeName}</Text>
                </View>
                {selectedInvoice.department && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Department:</Text>
                    <Text style={styles.receiptVal}>{selectedInvoice.department}</Text>
                  </View>
                )}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Category:</Text>
                  <Text style={styles.receiptVal}>{getCategoryLabel(selectedInvoice.category)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Mode:</Text>
                  <Text style={styles.receiptVal}>{selectedInvoice.paymentMethod.toUpperCase()}</Text>
                </View>

                <View style={styles.invoiceTotalBox}>
                  <Text style={styles.invoiceTotalLabel}>Total Paid Out</Text>
                  <Text style={styles.invoiceTotalVal}>₹{selectedInvoice.amount.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeInvoiceBtn}
                onPress={() => setSelectedInvoice(null)}
              >
                <Text style={styles.closeInvoiceBtnText}>Close Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  actionsBar: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 42,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#1A202C' },
  addBtn: {
    backgroundColor: '#DC3545',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: BorderRadius.button,
    height: 42,
    gap: 6,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  chipScrollView: { flexDirection: 'row', marginBottom: 12, maxHeight: 36 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#DC3545' },
  chipText: { fontSize: 13, color: '#4A5568', fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  listContainer: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardRowMain: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  catChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  catChipText: { fontSize: 10, fontWeight: '700' },
  itemPayee: { fontSize: 13, color: '#4A5568', marginTop: 3 },
  itemPayeeBold: { fontWeight: '700', color: '#2D3748' },
  itemMeta: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  itemAmount: { fontSize: 16, fontWeight: '800', color: '#DC3545' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 4 },
  statusPaid: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 10, fontWeight: '800' },
  statusTextPaid: { color: '#16A34A' },
  statusTextPending: { color: '#D97706' },
  itemActionRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionIconBtn: { padding: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: Platform.OS === 'web' ? 520 : '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.modal,
    padding: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  modalBody: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700', color: '#4A5568', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
    color: '#1A202C',
  },
  radioRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radioBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  radioBtnActive: { backgroundColor: '#DC3545', borderColor: '#DC3545' },
  radioText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  radioTextActive: { color: '#FFFFFF' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: BorderRadius.button, backgroundColor: '#EDF2F7' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#4A5568' },
  submitBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: BorderRadius.button, backgroundColor: '#DC3545' },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  invoiceContent: {
    width: Platform.OS === 'web' ? 400 : '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.modal,
    padding: 24,
  },
  invoiceHeader: { alignItems: 'center' },
  invoiceSchoolName: { fontSize: 20, fontWeight: '800', color: '#1A202C', marginTop: 6 },
  invoiceSubHeader: { fontSize: 12, color: '#718096', textTransform: 'uppercase', letterSpacing: 1 },
  receiptDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 16 },
  receiptBody: { gap: 8 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between' },
  receiptLabel: { fontSize: 13, color: '#64748B' },
  receiptVal: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  invoiceTotalBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  invoiceTotalLabel: { fontSize: 12, color: '#64748B', textTransform: 'uppercase' },
  invoiceTotalVal: { fontSize: 22, fontWeight: '800', color: '#DC3545', marginTop: 2 },
  closeInvoiceBtn: { backgroundColor: '#DC3545', paddingVertical: 10, borderRadius: BorderRadius.button, alignItems: 'center', marginTop: 20 },
  closeInvoiceBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
