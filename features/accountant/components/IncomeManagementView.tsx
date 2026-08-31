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
import { Colors, BorderRadius } from '../../../constants/theme';
import { useFinanceStore } from '../store/useFinanceStore';
import { IncomeCategory, IncomeRecord, PaymentMethod, PaymentStatus } from '../types/finance';

export const IncomeManagementView: React.FC = () => {
  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const addIncome = useFinanceStore((s) => s.addIncome);
  const deleteIncome = useFinanceStore((s) => s.deleteIncome);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<IncomeRecord | null>(null);

  // Add Income Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('student_fee');
  const [payerName, setPayerName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [classSection, setClassSection] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [notes, setNotes] = useState('');

  const filteredRecords = incomeRecords.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.payerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.studentId && item.studentId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddSubmit = () => {
    if (!title.trim() || !payerName.trim() || !amount.trim()) {
      if (Platform.OS === 'web') {
        alert('Please fill out Title, Payer Name, and Amount.');
      } else {
        Alert.alert('Required Fields', 'Please fill out Title, Payer Name, and Amount.');
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

    addIncome({
      title: title.trim(),
      category,
      payerName: payerName.trim(),
      studentId: studentId.trim() || undefined,
      classSection: classSection.trim() || undefined,
      amount: numAmount,
      paymentMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      status,
      notes: notes.trim() || undefined,
    });

    // Reset Form
    setTitle('');
    setPayerName('');
    setStudentId('');
    setClassSection('');
    setAmount('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const getCategoryLabel = (cat: IncomeCategory) => {
    switch (cat) {
      case 'student_fee':
        return 'Student Fee';
      case 'bus_fee':
        return 'Bus Fee';
      case 'hostel_fee':
        return 'Hostel Fee';
      case 'misc':
        return 'Misc Income';
    }
  };

  const getCategoryColor = (cat: IncomeCategory) => {
    switch (cat) {
      case 'student_fee':
        return { bg: '#E0E7FF', text: '#4338CA' };
      case 'bus_fee':
        return { bg: '#FEF3C7', text: '#B45309' };
      case 'hostel_fee':
        return { bg: '#FCE7F3', text: '#BE185D' };
      case 'misc':
        return { bg: '#E0F2FE', text: '#0369A1' };
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
            placeholder="Search by fee title, student, or ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalOpen(true)}>
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Record Income</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
        {[
          { key: 'all', label: 'All Incomes' },
          { key: 'student_fee', label: 'Student Fees' },
          { key: 'bus_fee', label: 'Bus Transport' },
          { key: 'hostel_fee', label: 'Hostel Fees' },
          { key: 'misc', label: 'Miscellaneous' },
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

      {/* Income Records List */}
      <ScrollView style={styles.listContainer}>
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cash-remove" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Income Records Found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query or filter chips.</Text>
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
                        item.category === 'student_fee'
                          ? 'school'
                          : item.category === 'bus_fee'
                          ? 'bus'
                          : item.category === 'hostel_fee'
                          ? 'home-city'
                          : 'cash-register'
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

                    <Text style={styles.itemPayer}>
                      Payer: <Text style={styles.itemPayerBold}>{item.payerName}</Text>
                      {item.studentId ? ` (${item.studentId})` : ''}
                      {item.classSection ? ` • ${item.classSection}` : ''}
                    </Text>

                    <Text style={styles.itemMeta}>
                      Date: {item.paymentDate} • Method: {item.paymentMethod.toUpperCase()} • Receipt: {item.receiptNo}
                    </Text>
                  </View>

                  <View style={styles.cardRight}>
                    <Text style={styles.itemAmount}>+₹{item.amount.toLocaleString('en-IN')}</Text>

                    <View style={[styles.statusTag, isPaid ? styles.statusPaid : styles.statusPending]}>
                      <Text style={[styles.statusText, isPaid ? styles.statusTextPaid : styles.statusTextPending]}>
                        {item.status.toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.itemActionRow}>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => setSelectedReceipt(item)}
                      >
                        <MaterialCommunityIcons name="file-document-outline" size={18} color="#7E57C2" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionIconBtn}
                        onPress={() => deleteIncome(item.id)}
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

      {/* Record Income Modal */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Fee & Income</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Income Category</Text>
              <View style={styles.radioRow}>
                {[
                  { key: 'student_fee', label: 'Student Fee' },
                  { key: 'bus_fee', label: 'Bus Fee' },
                  { key: 'hostel_fee', label: 'Hostel Fee' },
                  { key: 'misc', label: 'Misc' },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.radioBtn, category === c.key && styles.radioBtnActive]}
                    onPress={() => setCategory(c.key as IncomeCategory)}
                  >
                    <Text style={[styles.radioText, category === c.key && styles.radioTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Fee Title / Description *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Q2 Tuition & Exam Fee"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Payer / Student Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul Sharma"
                value={payerName}
                onChangeText={setPayerName}
              />

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.label}>Student ID (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. STU-2024-089"
                    value={studentId}
                    onChangeText={setStudentId}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.label}>Class / Section</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Class 10-A"
                    value={classSection}
                    onChangeText={setClassSection}
                  />
                </View>
              </View>

              <Text style={styles.label}>Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 15000"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.label}>Payment Method</Text>
              <View style={styles.radioRow}>
                {[
                  { key: 'upi', label: 'UPI' },
                  { key: 'cash', label: 'Cash' },
                  { key: 'card', label: 'Card' },
                  { key: 'bank_transfer', label: 'Bank' },
                  { key: 'cheque', label: 'Cheque' },
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

              <Text style={styles.label}>Payment Status</Text>
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
                placeholder="Additional payment notes or remarks..."
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
                <Text style={styles.submitBtnText}>Save Income</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt View Modal */}
      {selectedReceipt && (
        <Modal visible={!!selectedReceipt} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.receiptContent}>
              <View style={styles.receiptHeader}>
                <MaterialCommunityIcons name="school" size={32} color="#7E57C2" />
                <Text style={styles.receiptSchoolName}>SchoolHub ERP</Text>
                <Text style={styles.receiptSubHeader}>Official Fee Receipt</Text>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptBody}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Receipt No:</Text>
                  <Text style={styles.receiptVal}>{selectedReceipt.receiptNo}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Date:</Text>
                  <Text style={styles.receiptVal}>{selectedReceipt.paymentDate}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payer / Student:</Text>
                  <Text style={styles.receiptVal}>{selectedReceipt.payerName}</Text>
                </View>
                {selectedReceipt.studentId && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Student ID:</Text>
                    <Text style={styles.receiptVal}>{selectedReceipt.studentId}</Text>
                  </View>
                )}
                {selectedReceipt.classSection && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Class / Sec:</Text>
                    <Text style={styles.receiptVal}>{selectedReceipt.classSection}</Text>
                  </View>
                )}
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Category:</Text>
                  <Text style={styles.receiptVal}>{getCategoryLabel(selectedReceipt.category)}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Mode:</Text>
                  <Text style={styles.receiptVal}>{selectedReceipt.paymentMethod.toUpperCase()}</Text>
                </View>

                <View style={styles.receiptTotalBox}>
                  <Text style={styles.receiptTotalLabel}>Amount Received</Text>
                  <Text style={styles.receiptTotalVal}>₹{selectedReceipt.amount.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeReceiptBtn}
                onPress={() => setSelectedReceipt(null)}
              >
                <Text style={styles.closeReceiptBtnText}>Close Receipt</Text>
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
    backgroundColor: '#16A34A',
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
  chipActive: { backgroundColor: '#7E57C2' },
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
  itemPayer: { fontSize: 13, color: '#4A5568', marginTop: 3 },
  itemPayerBold: { fontWeight: '700', color: '#2D3748' },
  itemMeta: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  itemAmount: { fontSize: 16, fontWeight: '800', color: '#16A34A' },
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
  formRow: { flexDirection: 'row', gap: 10 },
  formCol: { flex: 1 },
  radioRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radioBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  radioBtnActive: { backgroundColor: '#7E57C2', borderColor: '#7E57C2' },
  radioText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  radioTextActive: { color: '#FFFFFF' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: BorderRadius.button, backgroundColor: '#EDF2F7' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#4A5568' },
  submitBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: BorderRadius.button, backgroundColor: '#16A34A' },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  receiptContent: {
    width: Platform.OS === 'web' ? 400 : '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.modal,
    padding: 24,
  },
  receiptHeader: { alignItems: 'center' },
  receiptSchoolName: { fontSize: 20, fontWeight: '800', color: '#1A202C', marginTop: 6 },
  receiptSubHeader: { fontSize: 12, color: '#718096', textTransform: 'uppercase', letterSpacing: 1 },
  receiptDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 16 },
  receiptBody: { gap: 8 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between' },
  receiptLabel: { fontSize: 13, color: '#64748B' },
  receiptVal: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  receiptTotalBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  receiptTotalLabel: { fontSize: 12, color: '#64748B', textTransform: 'uppercase' },
  receiptTotalVal: { fontSize: 22, fontWeight: '800', color: '#16A34A', marginTop: 2 },
  closeReceiptBtn: { backgroundColor: '#7E57C2', paddingVertical: 10, borderRadius: BorderRadius.button, alignItems: 'center', marginTop: 20 },
  closeReceiptBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
