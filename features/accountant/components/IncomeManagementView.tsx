/**
 * @file IncomeManagementView.tsx
 * @description Fee & Income management panel for the School Finance portal.
 *
 * Features:
 *  - Category filter chips (All / Student Fees / Bus Transport / Hostel Fees / Misc)
 *  - Full-text search by title, payer name, or student ID
 *  - "Record Income" slide-up modal form with validation
 *  - "Edit / Update Payment" modal to update payment status, amount, method, or date
 *  - Official Fee Receipt viewer (fade modal)
 *  - Delete income record action
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
import { IncomeCategory, IncomeRecord, PaymentMethod, PaymentStatus } from '../types/finance';
import {
  getIncomeCategoryLabel,
  getIncomeCategoryColor,
  formatINR,
} from '../utils/financeUtils';
import { showAlert } from '../../shared/utils/showAlert';
import { sharedFinanceStyles } from './financeStyles';

export const IncomeManagementView: React.FC = () => {
  // Store selectors
  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const addIncome = useFinanceStore((s) => s.addIncome);
  const updateIncomeRecord = useFinanceStore((s) => s.updateIncomeRecord);
  const deleteIncome = useFinanceStore((s) => s.deleteIncome);

  // Filter & search state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('student_fee');
  const [payerName, setPayerName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [classSection, setClassSection] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [notes, setNotes] = useState('');

  // Edit / Update Payment Modal State
  const [editingItem, setEditingItem] = useState<IncomeRecord | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editStatus, setEditStatus] = useState<PaymentStatus>('paid');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('upi');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<IncomeRecord | null>(null);

  // Category filter chips
  const categories: { label: string; value: string }[] = [
    { label: 'All Incomes', value: 'all' },
    { label: 'Student Fees', value: 'student_fee' },
    { label: 'Bus Transport', value: 'bus_fee' },
    { label: 'Hostel Fees', value: 'hostel_fee' },
    { label: 'Miscellaneous', value: 'misc' },
  ];

  // Filter logic
  const filteredRecords = incomeRecords.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      item.payerName.toLowerCase().includes(q) ||
      (item.studentId && item.studentId.toLowerCase().includes(q)) ||
      (item.classSection && item.classSection.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

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

    showAlert('Payment Updated', `Payment statement for ${editingItem.payerName} has been updated.`);
    setEditingItem(null);
  };

  const handleAddSubmit = () => {
    if (!title.trim() || !payerName.trim() || !amount.trim()) {
      showAlert('Missing Fields', 'Please fill in all required fields (Title, Payer Name, Amount).');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert('Invalid Amount', 'Please enter a valid positive number for the amount.');
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

    // Reset form
    setTitle('');
    setCategory('student_fee');
    setPayerName('');
    setStudentId('');
    setClassSection('');
    setAmount('');
    setPaymentMethod('upi');
    setStatus('paid');
    setNotes('');
    setIsAddModalOpen(false);

    showAlert('Success', 'Income payment statement recorded successfully.');
  };

  return (
    <View style={sharedFinanceStyles.container}>
      {/* Top Actions Bar (Search + Record CTA) */}
      <View style={sharedFinanceStyles.actionsBar}>
        <View style={sharedFinanceStyles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#718096" />
          <TextInput
            style={sharedFinanceStyles.searchInput}
            placeholder="Search by fee title, student, or ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#A0AEC0"
          />
        </View>

        <TouchableOpacity
          style={[sharedFinanceStyles.addBtn, styles.addBtnIncome]}
          onPress={() => setIsAddModalOpen(true)}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={sharedFinanceStyles.addBtnText}>Record Income</Text>
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
              selectedCategory === cat.value && styles.chipActiveIncome,
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

      {/* Income Records List */}
      <ScrollView style={sharedFinanceStyles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredRecords.length === 0 ? (
          <View style={sharedFinanceStyles.emptyState}>
            <MaterialCommunityIcons name="cash-remove" size={48} color="#CBD5E1" />
            <Text style={sharedFinanceStyles.emptyTitle}>No Incomes Found</Text>
            <Text style={sharedFinanceStyles.emptySubtitle}>
              Try adjusting your search query or record a new income above.
            </Text>
          </View>
        ) : (
          filteredRecords.map((item) => {
            const catBadge = getIncomeCategoryColor(item.category);
            const isPaid = item.status === 'paid';

            return (
              <View key={item.id} style={sharedFinanceStyles.cardItem}>
                {/* Header: Icon + Category Badge + Amount */}
                <View style={sharedFinanceStyles.cardHeaderRow}>
                  <View style={sharedFinanceStyles.cardHeaderLeft}>
                    <View style={[sharedFinanceStyles.iconBox, { backgroundColor: catBadge.bg }]}>
                      <MaterialCommunityIcons
                        name={
                          item.category === 'student_fee'
                            ? 'school'
                            : item.category === 'bus_fee'
                              ? 'bus'
                              : item.category === 'hostel_fee'
                                ? 'home-city'
                                : 'cash-multiple'
                        }
                        size={18}
                        color={catBadge.text}
                      />
                    </View>
                    <View style={[sharedFinanceStyles.catChip, { backgroundColor: catBadge.bg }]}>
                      <Text style={[sharedFinanceStyles.catChipText, { color: catBadge.text }]}>
                        {getIncomeCategoryLabel(item.category)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[sharedFinanceStyles.itemAmount, styles.incomeAmount]}>
                    +{formatINR(item.amount)}
                  </Text>
                </View>

                {/* Title */}
                <Text style={sharedFinanceStyles.cardTitle}>{item.title}</Text>

                {/* Payer Info */}
                <Text style={sharedFinanceStyles.payerRow}>
                  Payer: <Text style={sharedFinanceStyles.boldPayer}>{item.payerName}</Text>
                  {item.studentId ? ` (${item.studentId})` : ''}
                  {item.classSection ? ` • ${item.classSection}` : ''}
                </Text>

                {/* Meta details */}
                <Text style={sharedFinanceStyles.metaRow}>
                  Date: {item.paymentDate} • Mode: {item.paymentMethod.toUpperCase()} • Receipt: {item.receiptNo}
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
                      onPress={() => setSelectedReceipt(item)}
                    >
                      <MaterialCommunityIcons name="file-document-outline" size={14} color="#7E57C2" />
                      <Text style={[sharedFinanceStyles.actionIconBtnText, { color: '#7E57C2' }]}>Receipt</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={sharedFinanceStyles.actionIconBtn}
                      onPress={() => deleteIncome(item.id)}
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

      {/* ── Edit / Update Payment Modal ── */}
      {editingItem && (
        <Modal visible={!!editingItem} animationType="slide" transparent>
          <View style={sharedFinanceStyles.modalOverlay}>
            <View style={sharedFinanceStyles.modalContent}>
              <View style={sharedFinanceStyles.modalHeader}>
                <Text style={sharedFinanceStyles.modalTitle}>Update Payment Statement</Text>
                <TouchableOpacity onPress={() => setEditingItem(null)}>
                  <MaterialCommunityIcons name="close" size={24} color="#718096" />
                </TouchableOpacity>
              </View>

              <ScrollView style={sharedFinanceStyles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={sharedFinanceStyles.label}>Payer / Student</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, backgroundColor: '#F1F5F9', color: '#475569' }]}>
                  {editingItem.payerName} ({editingItem.classSection || 'General'})
                </Text>

                <Text style={sharedFinanceStyles.label}>Amount (₹) *</Text>
                <TextInput
                  style={sharedFinanceStyles.input}
                  keyboardType="numeric"
                  value={editAmount}
                  onChangeText={setEditAmount}
                />

                <Text style={sharedFinanceStyles.label}>Payment Status *</Text>
                <View style={sharedFinanceStyles.radioRow}>
                  {(['paid', 'pending'] as PaymentStatus[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        sharedFinanceStyles.radioBtn,
                        editStatus === s && (s === 'paid' ? styles.radioBtnActiveIncome : styles.radioBtnActivePending),
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
                        editMethod === m && styles.radioBtnActiveIncome,
                      ]}
                      onPress={() => setEditMethod(m)}
                    >
                      <Text style={[sharedFinanceStyles.radioText, editMethod === m && sharedFinanceStyles.radioTextActive]}>
                        {m === 'bank_transfer' ? 'Bank' : m.toUpperCase()}
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

                <Text style={sharedFinanceStyles.label}>Notes / Remarks</Text>
                <TextInput
                  style={sharedFinanceStyles.input}
                  placeholder="e.g. Paid via PhonePe / cash at counter"
                  value={editNotes}
                  onChangeText={setEditNotes}
                />
              </ScrollView>

              <View style={sharedFinanceStyles.modalFooter}>
                <TouchableOpacity style={sharedFinanceStyles.cancelBtn} onPress={() => setEditingItem(null)}>
                  <Text style={sharedFinanceStyles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[sharedFinanceStyles.submitBtn, styles.submitBtnIncome]} onPress={handleSaveEdit}>
                  <Text style={sharedFinanceStyles.submitBtnText}>Save Updates</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── Record Income Modal ── */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent>
        <View style={sharedFinanceStyles.modalOverlay}>
          <View style={sharedFinanceStyles.modalContent}>
            <View style={sharedFinanceStyles.modalHeader}>
              <Text style={sharedFinanceStyles.modalTitle}>Record Fee / Income</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            <ScrollView style={sharedFinanceStyles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={sharedFinanceStyles.label}>Fee Title / Description *</Text>
              <TextInput
                style={sharedFinanceStyles.input}
                placeholder="e.g. Term 2 Tuition Fee"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={sharedFinanceStyles.label}>Category *</Text>
              <View style={sharedFinanceStyles.radioRow}>
                {(['student_fee', 'bus_fee', 'hostel_fee', 'misc'] as IncomeCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      sharedFinanceStyles.radioBtn,
                      category === cat && styles.radioBtnActiveIncome,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[sharedFinanceStyles.radioText, category === cat && sharedFinanceStyles.radioTextActive]}>
                      {getIncomeCategoryLabel(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={sharedFinanceStyles.label}>Payer / Student Name *</Text>
              <TextInput
                style={sharedFinanceStyles.input}
                placeholder="e.g. Priya Verma"
                value={payerName}
                onChangeText={setPayerName}
              />

              <View style={sharedFinanceStyles.formRow}>
                <View style={sharedFinanceStyles.formCol}>
                  <Text style={sharedFinanceStyles.label}>Student ID</Text>
                  <TextInput
                    style={sharedFinanceStyles.input}
                    placeholder="e.g. STU-2026-001"
                    value={studentId}
                    onChangeText={setStudentId}
                  />
                </View>
                <View style={sharedFinanceStyles.formCol}>
                  <Text style={sharedFinanceStyles.label}>Class / Section</Text>
                  <TextInput
                    style={sharedFinanceStyles.input}
                    placeholder="e.g. Grade 10-A"
                    value={classSection}
                    onChangeText={setClassSection}
                  />
                </View>
              </View>

              <Text style={sharedFinanceStyles.label}>Amount (₹) *</Text>
              <TextInput
                style={sharedFinanceStyles.input}
                placeholder="e.g. 24500"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={sharedFinanceStyles.label}>Payment Method</Text>
              <View style={sharedFinanceStyles.radioRow}>
                {(['upi', 'cash', 'card', 'bank_transfer', 'cheque'] as PaymentMethod[]).map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      sharedFinanceStyles.radioBtn,
                      paymentMethod === method && styles.radioBtnActiveIncome,
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
              <TouchableOpacity style={[sharedFinanceStyles.submitBtn, styles.submitBtnIncome]} onPress={handleAddSubmit}>
                <Text style={sharedFinanceStyles.submitBtnText}>Save Income</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                  <Text style={sharedFinanceStyles.documentLabel}>Date:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedReceipt.paymentDate}</Text>
                </View>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Payer / Student:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedReceipt.payerName}</Text>
                </View>
                {selectedReceipt.classSection && (
                  <View style={sharedFinanceStyles.documentRow}>
                    <Text style={sharedFinanceStyles.documentLabel}>Class:</Text>
                    <Text style={sharedFinanceStyles.documentVal}>{selectedReceipt.classSection}</Text>
                  </View>
                )}
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Category:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{getIncomeCategoryLabel(selectedReceipt.category)}</Text>
                </View>
                <View style={sharedFinanceStyles.documentRow}>
                  <Text style={sharedFinanceStyles.documentLabel}>Payment Method:</Text>
                  <Text style={sharedFinanceStyles.documentVal}>{selectedReceipt.paymentMethod.toUpperCase()}</Text>
                </View>

                <View style={[sharedFinanceStyles.documentTotalBox, styles.receiptTotalBox]}>
                  <Text style={sharedFinanceStyles.documentTotalLabel}>Total Paid Amount</Text>
                  <Text style={[sharedFinanceStyles.documentTotalVal, styles.receiptTotalVal]}>
                    {formatINR(selectedReceipt.amount)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={[sharedFinanceStyles.closeDocumentBtn, styles.closeReceiptBtn]} onPress={() => setSelectedReceipt(null)}>
                <Text style={sharedFinanceStyles.closeDocumentBtnText}>Close Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  addBtnIncome: { backgroundColor: '#16A34A' },
  chipActiveIncome: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  incomeAmount: { color: '#16A34A' },
  submitBtnIncome: { backgroundColor: '#16A34A' },
  radioBtnActiveIncome: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  radioBtnActivePending: { backgroundColor: '#D97706', borderColor: '#D97706' },
  receiptTotalBox: { backgroundColor: '#DCFCE7' },
  receiptTotalVal: { color: '#16A34A' },
  closeReceiptBtn: { backgroundColor: '#16A34A' },
});
