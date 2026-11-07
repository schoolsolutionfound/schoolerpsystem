/**
 * @file IncomeManagementView.tsx
 * @description Fee & Income management panel for the School Finance portal.
 *
 * Features:
 *  - Summary strip (TOTAL / COLLECTED / PENDING)
 *  - Category filter dropdown (All / Student Fees / Bus Transport / Hostel Fees / Misc)
 *  - Full-text search by title, payer name, or student ID
 *  - "Record Income" slide-up modal form with category dropdown + validation
 *  - "Edit / Update Payment" modal to update payment status, amount, method, or date
 *  - Official Fee Receipt viewer (fade modal)
 *  - Delete income record action
 *  - Zero-overlap responsive card layout
 */

import React, { useMemo, useState } from 'react';
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
import { useFinanceStore } from '../store/useFinanceStore';
import { IncomeCategory, IncomeRecord, PaymentMethod, PaymentStatus } from '../types/finance';
import {
  getIncomeCategoryLabel,
  formatINR,
} from '../utils/financeUtils';
import { showAlert } from '../../shared/utils/showAlert';
import { sharedFinanceStyles } from './financeStyles';
import { useUserStore } from '../../../store/useUserStore';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  cheque: 'Cheque',
  upi: 'UPI',
  cash: 'Cash',
  card: 'Card',
  unknown: 'Not recorded',
};

const methodLabel = (m: PaymentMethod) => METHOD_LABELS[m] || m.toUpperCase();

export const IncomeManagementView: React.FC = () => {
  // Store selectors
  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const updateIncomeRecord = useFinanceStore((s) => s.updateIncomeRecord);
  const deleteIncome = useFinanceStore((s) => s.deleteIncome);
  const institutionName = useUserStore((s) => s.institutionName) || '';

  // Filter & search state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IncomeCategory | ''>('');
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

  // Category filter options derived from the records actually in this institution
  const categories = useMemo(() => {
    const seen = new Set<string>();
    incomeRecords.forEach((record) => {
      if (record.category) seen.add(record.category);
    });
    return [
      { label: 'All Incomes', value: 'all' },
      ...Array.from(seen).map((value) => ({
        label: getIncomeCategoryLabel(value),
        value,
      })),
    ];
  }, [incomeRecords]);
  const filterLabel = categories.find((c) => c.value === selectedCategory)?.label || 'All Incomes';

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

  // Summary strip values
  const totalCollected = incomeRecords.reduce((sum, r) => sum + r.amount, 0);
  const collectedTotal = incomeRecords
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const pendingRecords = incomeRecords.filter((r) => r.status !== 'paid');
  const pendingTotal = pendingRecords.reduce((sum, r) => sum + r.amount, 0);

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
    if (!category) {
      showAlert('Select Category', 'Choose an income category before continuing.');
      return;
    }
    setIsAddModalOpen(false);
    showAlert(
      'Income Recording Unavailable',
      'Miscellaneous income persistence is not configured. Use a student fee payment for fee collections.'
    );
  };

  return (
    <View style={sharedFinanceStyles.container}>
      <View style={sharedFinanceStyles.pageHeader}>
        <Text style={sharedFinanceStyles.pageTitle}>Income Ledger</Text>
      </View>

      {/* Summary Strip */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryNum}>{formatINR(totalCollected)}</Text>
          <Text style={styles.summaryLabel}>TOTAL</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCell}>
          <Text style={[styles.summaryNum, { color: '#16A34A' }]}>{formatINR(collectedTotal)}</Text>
          <Text style={styles.summaryLabel}>COLLECTED</Text>
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
            placeholder="Search by fee title, student, or ID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9A9A9A"
          />
        </View>

        <TouchableOpacity
          style={[sharedFinanceStyles.addBtn, styles.addBtnIncome]}
          onPress={() =>
            showAlert(
              'Income Recording Unavailable',
              'Miscellaneous income persistence is not configured. Use a student fee payment for fee collections.'
            )
          }
        >
          <Text style={sharedFinanceStyles.addBtnText}>Record Income</Text>
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
          {filteredRecords.length} {filteredRecords.length === 1 ? 'receipt' : 'receipts'}
        </Text>
      </View>

      {/* Income Records List */}
      <ScrollView style={sharedFinanceStyles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredRecords.length === 0 ? (
          <View style={sharedFinanceStyles.emptyState}>
            <MaterialCommunityIcons name="cash-remove" size={48} color="#9A9A9A" />
            <Text style={sharedFinanceStyles.emptyTitle}>No Incomes Found</Text>
            <Text style={sharedFinanceStyles.emptySubtitle}>
              Try adjusting your search query.
            </Text>
          </View>
        ) : (
          filteredRecords.map((item) => {
            const isPaid = item.status === 'paid';

            return (
              <View key={item.id} style={styles.incCard}>
                {/* Header: Title + status | Amount */}
                <View style={styles.incHeaderRow}>
                  <View style={styles.incHeaderLeft}>
                    <View style={styles.incTitleRow}>
                      <Text style={styles.incTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View
                        style={[
                          styles.incStatusBadge,
                          isPaid ? styles.incBadgeGreen : styles.incBadgeRed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.incStatusText,
                            isPaid ? styles.incStatusTextGreen : styles.incStatusTextRed,
                          ]}
                        >
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.incSub} numberOfLines={1}>
                      Payer: <Text style={styles.incSubBold}>{item.payerName}</Text>
                      {item.studentId ? ` • ${item.studentId}` : ''}
                      {item.classSection ? ` • ${item.classSection}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.incAmount}>+{formatINR(item.amount)}</Text>
                </View>

                {/* Meta row with icons */}
                <View style={styles.incMetaRow}>
                  <View style={styles.incMetaItem}>
                    <MaterialCommunityIcons name="calendar-outline" size={13} color="#6B7280" />
                    <Text style={styles.incMetaText}>{item.paymentDate}</Text>
                  </View>
                  <View style={styles.incMetaItem}>
                    <MaterialCommunityIcons name="cash-multiple" size={13} color="#6B7280" />
                    <Text style={styles.incMetaText}>{methodLabel(item.paymentMethod)}</Text>
                  </View>
                  <View style={styles.incMetaItem}>
                    <MaterialCommunityIcons name="file-document-outline" size={13} color="#6B7280" />
                    <Text style={styles.incMetaText}>{item.receiptNo || '—'}</Text>
                  </View>
                </View>

                {/* Action footer */}
                <View style={styles.incActionRow}>
                  <TouchableOpacity
                    style={styles.incActionBtn}
                    onPress={() => handleOpenEdit(item)}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={15} color="#171717" />
                    <Text style={styles.incActionBtnText}>Update</Text>
                  </TouchableOpacity>

                  {isPaid && item.receiptNo ? (
                    <TouchableOpacity
                      style={styles.incActionBtn}
                      onPress={() => setSelectedReceipt(item)}
                    >
                      <MaterialCommunityIcons name="file-document-outline" size={15} color="#171717" />
                      <Text style={styles.incActionBtnText}>Receipt</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.incActionBtn, styles.incActionBtnDanger]}
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

      {/* ── Edit / Update Payment Modal ── */}
      {editingItem && (
        <Modal visible={!!editingItem} animationType="slide" transparent>
          <View style={sharedFinanceStyles.modalOverlay}>
            <View style={sharedFinanceStyles.modalContent}>
              <View style={sharedFinanceStyles.modalHeader}>
                <Text style={sharedFinanceStyles.modalTitle}>Update Payment Statement</Text>
                <TouchableOpacity onPress={() => setEditingItem(null)}>
                  <MaterialCommunityIcons name="close" size={24} color="#6B6B6B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={sharedFinanceStyles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={sharedFinanceStyles.label}>Payer / Student</Text>
                <Text style={[sharedFinanceStyles.input, { lineHeight: 36, backgroundColor: '#FFFDF7', color: '#6B6B6B' }]}>
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
                <MaterialCommunityIcons name="close" size={24} color="#6B6B6B" />
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
              <View style={styles.dropdownWrap}>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setCatOpen((o) => !o)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="tag-outline" size={16} color="#6B6B6B" />
                  <Text style={styles.dropdownText} numberOfLines={1}>
                    {category ? getIncomeCategoryLabel(category) : 'Select category'}
                  </Text>
                  <MaterialCommunityIcons
                    name={catOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#6B6B6B"
                  />
                </TouchableOpacity>

                {catOpen && (
                  <View style={styles.dropdownMenu}>
                    {(['student_fee', 'bus_fee', 'hostel_fee', 'misc'] as IncomeCategory[]).map((cat) => {
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
                            {getIncomeCategoryLabel(cat)}
                          </Text>
                          {active && <MaterialCommunityIcons name="check" size={14} color="#B8860B" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
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
                <MaterialCommunityIcons name="school" size={32} color="#171717" />
                {institutionName ? (
                  <Text style={sharedFinanceStyles.documentSchoolName}>{institutionName}</Text>
                ) : null}
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
                  <Text style={sharedFinanceStyles.documentVal}>{methodLabel(selectedReceipt.paymentMethod)}</Text>
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
  addBtnIncome: { backgroundColor: '#F4C430' },
  submitBtnIncome: { backgroundColor: '#171717' },
  radioBtnActiveIncome: { backgroundColor: '#171717', borderColor: '#171717' },
  radioBtnActivePending: { backgroundColor: '#D97706', borderColor: '#D97706' },
  receiptTotalBox: { backgroundColor: '#DCFCE7' },
  receiptTotalVal: { color: '#16A34A' },
  closeReceiptBtn: { backgroundColor: '#171717' },

  // Income list card (librarian list-card language)
  incCard: {
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
  incHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  incHeaderLeft: { flex: 1, gap: 2 },
  incTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  incTitle: { fontSize: 14, fontWeight: '800', color: '#171717', flexShrink: 1 },
  incSub: { fontSize: 11, color: '#6B7280' },
  incSubBold: { fontWeight: '700', color: '#171717' },
  incAmount: { fontSize: 18, fontWeight: '800', color: '#16A34A' },
  incStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  incBadgeGreen: { backgroundColor: '#D1FAE5', borderColor: '#026440' },
  incBadgeRed: { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  incStatusText: { fontSize: 10, fontWeight: '800' },
  incStatusTextGreen: { color: '#026440' },
  incStatusTextRed: { color: '#DC2626' },
  incMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    paddingTop: 4,
  },
  incMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  incMetaText: { fontSize: 11, color: '#6B7280' },
  incActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  incActionBtn: {
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
  incActionBtnText: { fontSize: 12, fontWeight: '700', color: '#171717' },
  incActionBtnDanger: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },

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
});
