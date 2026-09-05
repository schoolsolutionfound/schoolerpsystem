import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { useLibraryStore } from '../store/useLibraryStore';
import { BorrowedBook } from '../types/library';

export const BorrowingRegisterView: React.FC = () => {
  const books = useLibraryStore((s) => s.books);
  const loans = useLibraryStore((s) => s.loans);
  const issueBook = useLibraryStore((s) => s.issueBook);
  const returnBook = useLibraryStore((s) => s.returnBook);
  const renewLoan = useLibraryStore((s) => s.renewLoan);
  const finePerDay = useLibraryStore((s) => s.finePerDay);

  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<BorrowedBook | null>(null);

  // Issue Form State
  const [selectedBookId, setSelectedBookId] = useState(books[0]?.id || '');
  const [borrowerName, setBorrowerName] = useState('Rohan Verma');
  const [borrowerRole, setBorrowerRole] = useState<'student' | 'teacher'>('student');
  const [borrowerClass, setBorrowerClass] = useState('Class 10-A');
  const [borrowerPhone, setBorrowerPhone] = useState('+91 98765 43210');
  const [dueDays, setDueDays] = useState('14');

  // Return & Fine Form State
  const [returnPaymentMethod, setReturnPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [waiveReason, setWaiveReason] = useState('');
  const [isWaiving, setIsWaiving] = useState(false);

  const filteredLoans = loans.filter((l) => {
    if (activeFilter === 'active' && (l.status === 'returned')) return false;
    if (activeFilter === 'overdue' && l.status !== 'overdue') return false;
    if (activeFilter === 'returned' && l.status !== 'returned') return false;

    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      l.bookTitle.toLowerCase().includes(q) ||
      l.borrowerName.toLowerCase().includes(q) ||
      (l.borrowerClass && l.borrowerClass.toLowerCase().includes(q)) ||
      l.accessionNumber.toLowerCase().includes(q)
    );
  });

  const handleOpenIssue = () => {
    setShowIssueModal(true);
  };

  const handleConfirmIssue = () => {
    if (!selectedBookId) {
      Alert.alert('Select Book', 'Please select a book from inventory.');
      return;
    }
    if (!borrowerName.trim()) {
      Alert.alert('Borrower Required', 'Please enter the borrower name.');
      return;
    }

    try {
      issueBook({
        bookId: selectedBookId,
        borrowerId: `std-${Math.floor(1000 + Math.random() * 9000)}`,
        borrowerName: borrowerName.trim(),
        borrowerRole,
        borrowerClass: borrowerClass.trim(),
        borrowerPhone: borrowerPhone.trim(),
        dueDays: parseInt(dueDays, 10) || 14,
      });

      Alert.alert('Book Issued', `Book issued successfully to ${borrowerName}.`);
      setShowIssueModal(false);
    } catch (err: any) {
      Alert.alert('Issue Failed', err.message);
    }
  };

  const handleOpenReturn = (loan: BorrowedBook) => {
    setSelectedLoan(loan);
    setIsWaiving(false);
    setWaiveReason('');
    setShowReturnModal(true);
  };

  const calculateLateDays = (loan: BorrowedBook) => {
    const today = new Date();
    const due = new Date(loan.dueDate);
    if (today <= due) return 0;
    const diff = today.getTime() - due.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleConfirmReturn = (paidNow: boolean) => {
    if (!selectedLoan) return;

    returnBook(selectedLoan.id, {
      paidFineImmediately: paidNow && !isWaiving,
      paymentMethod: returnPaymentMethod,
      waiveFine: isWaiving,
      waiveReason: isWaiving ? waiveReason : undefined,
    });

    Alert.alert(
      'Book Returned',
      `"${selectedLoan.bookTitle}" returned by ${selectedLoan.borrowerName}. Stock copy restored.`
    );
    setShowReturnModal(false);
  };

  const handleRenew = (loan: BorrowedBook) => {
    Alert.alert(
      'Renew Loan',
      `Extend loan for "${loan.bookTitle}" by 14 additional days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Renew',
          onPress: () => {
            renewLoan(loan.id, 14);
            Alert.alert('Loan Renewed', 'New due date set to 14 days from today.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Search & Issue Action Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search borrower, book, accession #..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity style={styles.issueBtn} onPress={handleOpenIssue} activeOpacity={0.8}>
          <MaterialCommunityIcons name="book-plus" size={18} color="#FFFFFF" />
          <Text style={styles.issueBtnText}>Issue Book</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { label: 'All Loans', value: 'all', count: loans.length },
          {
            label: 'Active',
            value: 'active',
            count: loans.filter((l) => l.status === 'borrowed' || l.status === 'overdue').length,
          },
          {
            label: 'Overdue',
            value: 'overdue',
            count: loans.filter((l) => l.status === 'overdue').length,
          },
          {
            label: 'Returned',
            value: 'returned',
            count: loans.filter((l) => l.status === 'returned').length,
          },
        ].map((f) => {
          const isSelected = activeFilter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterTab, isSelected && styles.filterTabActive]}
              onPress={() => setActiveFilter(f.value as any)}
            >
              <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                {f.label} ({f.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Loans List */}
      <ScrollView contentContainerStyle={styles.loansList} showsVerticalScrollIndicator={false}>
        {filteredLoans.map((loan) => {
          const isOverdue = loan.status === 'overdue';
          const isReturned = loan.status === 'returned';
          const lateDays = isReturned ? 0 : calculateLateDays(loan);
          const computedFine = isReturned ? loan.fineAmount : lateDays * finePerDay;

          return (
            <View key={loan.id} style={styles.loanCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.loanBookTitle}>{loan.bookTitle}</Text>
                  <Text style={styles.accessionText}>Acc No: {loan.accessionNumber}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isOverdue
                      ? styles.badgeOverdue
                      : isReturned
                      ? styles.badgeReturned
                      : styles.badgeActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      isOverdue
                        ? 'alert-circle'
                        : isReturned
                        ? 'check-circle'
                        : 'progress-clock'
                    }
                    size={12}
                    color={
                      isOverdue ? '#DC2626' : isReturned ? '#059669' : '#4F46E5'
                    }
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isOverdue
                        ? { color: '#DC2626' }
                        : isReturned
                        ? { color: '#059669' }
                        : { color: '#4F46E5' },
                    ]}
                  >
                    {isOverdue ? 'Overdue' : isReturned ? 'Returned' : 'Active'}
                  </Text>
                </View>
              </View>

              {/* Borrower Info Row */}
              <View style={styles.borrowerInfoRow}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarLetter}>{loan.borrowerName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.borrowerNameText}>{loan.borrowerName}</Text>
                  <Text style={styles.borrowerSub}>
                    {loan.borrowerClass || loan.borrowerRole.toUpperCase()} • {loan.borrowerPhone || 'No Phone'}
                  </Text>
                </View>
              </View>

              {/* Dates Row */}
              <View style={styles.datesBox}>
                <View style={styles.dateCol}>
                  <Text style={styles.dateLabel}>Issue Date</Text>
                  <Text style={styles.dateVal}>{loan.issueDate}</Text>
                </View>
                <View style={styles.dateDivider} />
                <View style={styles.dateCol}>
                  <Text style={styles.dateLabel}>Due Date</Text>
                  <Text style={[styles.dateVal, isOverdue && { color: '#DC2626', fontWeight: '800' }]}>
                    {loan.dueDate}
                  </Text>
                </View>
                {isReturned && (
                  <>
                    <View style={styles.dateDivider} />
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>Return Date</Text>
                      <Text style={styles.dateVal}>{loan.returnDate}</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Fine details if applicable */}
              {(isOverdue || loan.fineAmount > 0) && (
                <View style={styles.fineBox}>
                  <MaterialCommunityIcons name="cash" size={16} color="#DC2626" />
                  <Text style={styles.fineBoxText}>
                    {isReturned
                      ? `Fine: ₹${loan.fineAmount} (${loan.fineStatus.toUpperCase()})`
                      : `${lateDays} days late • Accrued Fine: ₹${computedFine}`}
                  </Text>
                </View>
              )}

              {/* Action Buttons for Active / Overdue Loans */}
              {!isReturned && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.renewBtn}
                    onPress={() => handleRenew(loan)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="autorenew" size={16} color="#4F46E5" />
                    <Text style={styles.renewBtnText}>Renew (+14d)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.returnActionBtn}
                    onPress={() => handleOpenReturn(loan)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="book-check" size={16} color="#FFFFFF" />
                    <Text style={styles.returnActionText}>Return Book</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Issue Book Modal */}
      <Modal visible={showIssueModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Issue Book to Member</Text>
              <TouchableOpacity onPress={() => setShowIssueModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Select Book from Inventory *</Text>
              {books.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.bookSelectOption,
                    selectedBookId === b.id && styles.bookSelectActive,
                    b.availableCopies <= 0 && { opacity: 0.5 },
                  ]}
                  onPress={() => b.availableCopies > 0 && setSelectedBookId(b.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookSelectTitle}>{b.title}</Text>
                    <Text style={styles.bookSelectSub}>
                      {b.author} • {b.rackLocation}
                    </Text>
                  </View>
                  <Text style={styles.bookSelectAvail}>
                    {b.availableCopies} avail
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={styles.inputLabel}>Borrower Role</Text>
              <View style={styles.roleToggleRow}>
                <TouchableOpacity
                  style={[styles.roleBtn, borrowerRole === 'student' && styles.roleBtnActive]}
                  onPress={() => setBorrowerRole('student')}
                >
                  <Text style={[styles.roleBtnText, borrowerRole === 'student' && styles.roleBtnTextActive]}>
                    Student
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleBtn, borrowerRole === 'teacher' && styles.roleBtnActive]}
                  onPress={() => setBorrowerRole('teacher')}
                >
                  <Text style={[styles.roleBtnText, borrowerRole === 'teacher' && styles.roleBtnTextActive]}>
                    Teacher / Faculty
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Borrower Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Student / Teacher Name"
                placeholderTextColor="#94A3B8"
                value={borrowerName}
                onChangeText={setBorrowerName}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Class / Department</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Class 10-A"
                    placeholderTextColor="#94A3B8"
                    value={borrowerClass}
                    onChangeText={setBorrowerClass}
                  />
                </View>
                <View style={{ width: 100, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Loan Days</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="14"
                    keyboardType="numeric"
                    placeholderTextColor="#94A3B8"
                    value={dueDays}
                    onChangeText={setDueDays}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="+91 98765 43210"
                placeholderTextColor="#94A3B8"
                value={borrowerPhone}
                onChangeText={setBorrowerPhone}
              />
            </ScrollView>

            <TouchableOpacity style={styles.confirmIssueBtn} onPress={handleConfirmIssue} activeOpacity={0.8}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" />
              <Text style={styles.confirmIssueBtnText}>Confirm & Issue Book</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Return Book Modal with Automatic Fine Calculation */}
      <Modal visible={showReturnModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Process Book Return</Text>
              <TouchableOpacity onPress={() => setShowReturnModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedLoan && (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <View style={styles.returnSummaryBox}>
                  <Text style={styles.returnBookTitle}>{selectedLoan.bookTitle}</Text>
                  <Text style={styles.returnBorrower}>
                    Borrower: {selectedLoan.borrowerName} ({selectedLoan.borrowerClass || selectedLoan.borrowerRole})
                  </Text>
                  <Text style={styles.returnDates}>
                    Issued: {selectedLoan.issueDate} • Due: {selectedLoan.dueDate}
                  </Text>
                </View>

                {(() => {
                  const lateDays = calculateLateDays(selectedLoan);
                  const fine = lateDays * finePerDay;

                  if (lateDays > 0) {
                    return (
                      <View style={styles.fineNoticeCard}>
                        <View style={styles.fineNoticeHeader}>
                          <MaterialCommunityIcons name="alert-octagon" size={22} color="#DC2626" />
                          <View style={{ marginLeft: 8 }}>
                            <Text style={styles.fineNoticeTitle}>Overdue Return Detected</Text>
                            <Text style={styles.fineNoticeSub}>
                              {lateDays} days late @ ₹{finePerDay}/day = <Text style={{ fontWeight: '900', color: '#DC2626' }}>₹{fine}</Text> Fine
                            </Text>
                          </View>
                        </View>

                        <View style={styles.fineOptionRow}>
                          <TouchableOpacity
                            style={[styles.fineOptionBtn, !isWaiving && styles.fineOptionActive]}
                            onPress={() => setIsWaiving(false)}
                          >
                            <Text style={[styles.fineOptionText, !isWaiving && styles.fineOptionTextActive]}>
                              Collect Fine
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.fineOptionBtn, isWaiving && styles.fineOptionActive]}
                            onPress={() => setIsWaiving(true)}
                          >
                            <Text style={[styles.fineOptionText, isWaiving && styles.fineOptionTextActive]}>
                              Waive Fine
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {isWaiving ? (
                          <View style={{ marginTop: 10 }}>
                            <Text style={styles.inputLabel}>Reason for Fine Waiver</Text>
                            <TextInput
                              style={styles.modalInput}
                              placeholder="Medical emergency / Principal approval..."
                              placeholderTextColor="#94A3B8"
                              value={waiveReason}
                              onChangeText={setWaiveReason}
                            />
                          </View>
                        ) : (
                          <View style={{ marginTop: 10 }}>
                            <Text style={styles.inputLabel}>Payment Mode</Text>
                            <View style={styles.roleToggleRow}>
                              <TouchableOpacity
                                style={[styles.roleBtn, returnPaymentMethod === 'upi' && styles.roleBtnActive]}
                                onPress={() => setReturnPaymentMethod('upi')}
                              >
                                <Text style={[styles.roleBtnText, returnPaymentMethod === 'upi' && styles.roleBtnTextActive]}>
                                  UPI / QR (Instant)
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.roleBtn, returnPaymentMethod === 'cash' && styles.roleBtnActive]}
                                onPress={() => setReturnPaymentMethod('cash')}
                              >
                                <Text style={[styles.roleBtnText, returnPaymentMethod === 'cash' && styles.roleBtnTextActive]}>
                                  Cash Desk
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  } else {
                    return (
                      <View style={styles.onTimeCard}>
                        <MaterialCommunityIcons name="check-decagram" size={24} color="#059669" />
                        <Text style={styles.onTimeText}>Returned On Time • No Fines Accrued</Text>
                      </View>
                    );
                  }
                })()}

                <View style={styles.returnModalActions}>
                  <TouchableOpacity
                    style={styles.confirmReturnBtn}
                    onPress={() => handleConfirmReturn(true)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="check-all" size={18} color="#FFFFFF" />
                    <Text style={styles.confirmReturnBtnText}>
                      {calculateLateDays(selectedLoan) > 0 && !isWaiving
                        ? `Collect ₹${calculateLateDays(selectedLoan) * finePerDay} & Complete Return`
                        : 'Complete Return & Restore Stock'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  issueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    gap: 4,
  },
  issueBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  filterTabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  loansList: { paddingHorizontal: 16, paddingBottom: 40 },
  loanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  loanBookTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  accessionText: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeOverdue: { backgroundColor: '#FEE2E2' },
  badgeReturned: { backgroundColor: '#ECFDF5' },
  badgeActive: { backgroundColor: '#EEF2FF' },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  borrowerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    gap: 10,
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 14, fontWeight: '800', color: '#4F46E5' },
  borrowerNameText: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  borrowerSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  datesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  dateCol: { flex: 1, alignItems: 'center' },
  dateDivider: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
  dateLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  dateVal: { fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 2 },
  fineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  fineBoxText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    marginTop: 10,
    paddingTop: 10,
  },
  renewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingVertical: 8,
    gap: 4,
  },
  renewBtnText: { color: '#4F46E5', fontSize: 12, fontWeight: '700' },
  returnActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 8,
    paddingVertical: 8,
    gap: 4,
  },
  returnActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  formRow: { flexDirection: 'row' },
  bookSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 6,
  },
  bookSelectActive: { borderColor: '#D97706', backgroundColor: '#FEF3C7' },
  bookSelectTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  bookSelectSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  bookSelectAvail: { fontSize: 11, fontWeight: '700', color: '#059669', marginLeft: 8 },
  roleToggleRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  roleBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  roleBtnActive: { backgroundColor: '#D97706' },
  roleBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  roleBtnTextActive: { color: '#FFFFFF' },
  confirmIssueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    gap: 6,
  },
  confirmIssueBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  returnSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  returnBookTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  returnBorrower: { fontSize: 12, color: '#64748B', marginTop: 3 },
  returnDates: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  fineNoticeCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    marginBottom: 12,
  },
  fineNoticeHeader: { flexDirection: 'row', alignItems: 'center' },
  fineNoticeTitle: { fontSize: 13, fontWeight: '800', color: '#991B1B' },
  fineNoticeSub: { fontSize: 12, color: '#7F1D1D', marginTop: 2 },
  fineOptionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  fineOptionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  fineOptionActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  fineOptionText: { fontSize: 11, fontWeight: '700', color: '#991B1B' },
  fineOptionTextActive: { color: '#FFFFFF' },
  onTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  onTimeText: { fontSize: 13, fontWeight: '700', color: '#065F46' },
  returnModalActions: { marginTop: 12 },
  confirmReturnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  confirmReturnBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
