import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '../common/Icons';
import { StudentProfile, Book, BookCopy, Loan, Fine, LibrarySettings } from '../../types';

export interface IssueBookViewProps {
  students: StudentProfile[];
  books: Book[];
  copies: BookCopy[];
  loans: Loan[];
  fines: Fine[];
  settings: LibrarySettings;
  onIssueSuccess: (newLoan: Loan, copyId: string) => void;
  onReturnSuccess: (loanId: string, copyId: string, newFine?: Fine) => void;
  onRenewSuccess: (loanId: string, newDueDate: string) => void;
  commonStyles?: any;
}

export const IssueBookView: React.FC<IssueBookViewProps> = ({
  students,
  books,
  copies,
  loans,
  fines,
  settings,
  onIssueSuccess,
  onReturnSuccess,
  onRenewSuccess,
}) => {
  const [activeSubMode, setActiveSubMode] = useState<'ISSUE' | 'RETURN'>('ISSUE');

  // Issue Mode State
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [bookQuery, setBookQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
  const [customDays, setCustomDays] = useState(String(settings.loanPeriodDays || 14));
  const [submitting, setSubmitting] = useState(false);

  // Return Mode State
  const [loanSearch, setLoanSearch] = useState('');

  // Active Loans calculation
  const activeLoansList = useMemo(() => {
    return loans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');
  }, [loans]);

  const filteredActiveLoans = useMemo(() => {
    if (!loanSearch.trim()) return activeLoansList;
    return activeLoansList.filter((l) => {
      const std = students.find((s) => s.id === l.studentId);
      const bk = books.find((b) => b.id === l.bookId);
      const cpy = copies.find((c) => c.id === l.copyId);
      const q = loanSearch.toLowerCase();
      return (
        (std && (std.fullName.toLowerCase().includes(q) || std.admissionNo.toLowerCase().includes(q))) ||
        (bk && bk.title.toLowerCase().includes(q)) ||
        (cpy && (cpy.accessionNumber.toLowerCase().includes(q) || (cpy.barcode || '').toLowerCase().includes(q)))
      );
    });
  }, [activeLoansList, loanSearch, students, books, copies]);

  // Filtered Member Options
  const filteredStudents = useMemo(() => {
    if (!memberQuery.trim()) return students.slice(0, 5);
    const q = memberQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        (s.classSection || '').toLowerCase().includes(q)
    );
  }, [students, memberQuery]);

  // Filtered Book Options
  const filteredBooks = useMemo(() => {
    if (!bookQuery.trim()) return books.slice(0, 5);
    const q = bookQuery.toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        (b.subject && b.subject.toLowerCase().includes(q))
    );
  }, [books, bookQuery]);

  // Copies for selected book
  const availableCopies = useMemo(() => {
    if (!selectedBook) return [];
    return copies.filter((c) => c.bookId === selectedBook.id && c.status === 'AVAILABLE');
  }, [selectedBook, copies]);

  // Selected student's active borrowing metrics
  const studentActiveLoansCount = useMemo(() => {
    if (!selectedStudent) return 0;
    return loans.filter((l) => l.studentId === selectedStudent.id && (l.status === 'ACTIVE' || l.status === 'OVERDUE')).length;
  }, [selectedStudent, loans]);

  const studentUnpaidFines = useMemo(() => {
    if (!selectedStudent) return 0;
    return fines
      .filter((f) => f.studentId === selectedStudent.id && f.status === 'UNPAID')
      .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
  }, [selectedStudent, fines]);

  // Calculate Due Date string
  const calculatedDueDate = useMemo(() => {
    const days = parseInt(customDays, 10) || settings.loanPeriodDays || 14;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }, [customDays, settings]);

  const handleIssueBook = () => {
    if (!selectedStudent) {
      Alert.alert('Required Selection', 'Please select a registered library member.');
      return;
    }
    if (!selectedBook) {
      Alert.alert('Required Selection', 'Please select a book from the catalog.');
      return;
    }
    if (!selectedCopy) {
      Alert.alert('Required Selection', 'Please select an available physical copy.');
      return;
    }

    if (studentActiveLoansCount >= settings.borrowingLimit) {
      Alert.alert(
        'Borrowing Limit Reached',
        `Member ${selectedStudent.fullName} has already reached maximum limit of ${settings.borrowingLimit} active loans.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const issueDate = new Date().toISOString().split('T')[0];
      const newLoan: Loan = {
        id: `loan-${Date.now()}`,
        copyId: selectedCopy.id,
        bookId: selectedBook.id,
        studentId: selectedStudent.id,
        issuedBy: 'lib-user',
        issueDate,
        dueDate: calculatedDueDate,
        status: 'ACTIVE',
        renewalCount: 0,
        createdAt: issueDate,
      };

      onIssueSuccess(newLoan, selectedCopy.id);

      setSelectedStudent(null);
      setSelectedBook(null);
      setSelectedCopy(null);
      setMemberQuery('');
      setBookQuery('');
    } catch {
      Alert.alert('Error', 'Failed to issue book.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnBook = (loan: Loan) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dueDate = new Date(loan.dueDate);
    const today = new Date();

    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let createdFine: Fine | undefined = undefined;
    if (diffDays > (settings.gracePeriodDays || 2)) {
      const overdueDays = diffDays - (settings.gracePeriodDays || 2);
      const finePerDayVal = typeof settings.finePerDay === 'number' ? settings.finePerDay : parseFloat(String(settings.finePerDay || 1.0));
      const maxFineVal = typeof settings.maxFine === 'number' ? settings.maxFine : parseFloat(String(settings.maxFine || 100.0));
      const fineAmount = Math.min(overdueDays * finePerDayVal, maxFineVal);

      createdFine = {
        id: `fine-${Date.now()}`,
        loanId: loan.id,
        studentId: loan.studentId,
        fineType: 'OVERDUE',
        amount: fineAmount,
        paidAmount: 0,
        status: 'UNPAID',
        createdAt: todayStr,
        updatedAt: todayStr,
      };
    }

    Alert.alert(
      'Confirm Return',
      `Mark book as returned? ${createdFine ? `\n\nNotice: An overdue fine of $${createdFine.amount.toFixed(2)} will be generated.` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Return',
          onPress: () => onReturnSuccess(loan.id, loan.copyId, createdFine),
        },
      ]
    );
  };

  const handleRenewLoan = (loan: Loan) => {
    const currentRenewals = loan.renewalCount || 0;
    if (currentRenewals >= (settings.renewalLimit || 2)) {
      Alert.alert('Renewal Limit Reached', `This loan has reached maximum limit of ${settings.renewalLimit} renewals.`);
      return;
    }

    const currentDue = new Date(loan.dueDate);
    currentDue.setDate(currentDue.getDate() + (settings.loanPeriodDays || 14));
    const newDueDateStr = currentDue.toISOString().split('T')[0];

    Alert.alert(
      'Confirm Renewal',
      `Extend loan due date to ${newDueDateStr}? (Renewal ${currentRenewals + 1} of ${settings.renewalLimit})`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Renew Loan', onPress: () => onRenewSuccess(loan.id, newDueDateStr) },
      ]
    );
  };

  return (
    <ScrollView style={styles.viewBody} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionHeader}>Circulation & Loan Operations</Text>

      {/* Mode Switcher Tabs */}
      <View style={circStyles.tabRow}>
        <TouchableOpacity
          style={[circStyles.tabBtn, activeSubMode === 'ISSUE' && circStyles.tabBtnActive]}
          onPress={() => setActiveSubMode('ISSUE')}
        >
          <MaterialCommunityIcons name="book-arrow-up-outline" size={18} color={activeSubMode === 'ISSUE' ? '#121316' : '#6B7280'} />
          <Text style={[circStyles.tabText, activeSubMode === 'ISSUE' && circStyles.tabTextActive]} numberOfLines={1}>
            Issue Book (Outward Loan)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[circStyles.tabBtn, activeSubMode === 'RETURN' && circStyles.tabBtnActive]}
          onPress={() => setActiveSubMode('RETURN')}
        >
          <MaterialCommunityIcons name="book-arrow-down-outline" size={18} color={activeSubMode === 'RETURN' ? '#121316' : '#6B7280'} />
          <Text style={[circStyles.tabText, activeSubMode === 'RETURN' && circStyles.tabTextActive]} numberOfLines={1}>
            Active Loans & Returns ({activeLoansList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ISSUE BOOK MODE */}
      {activeSubMode === 'ISSUE' && (
        <View style={{ gap: 16, marginTop: 12 }}>
          {/* STEP 1: MEMBER SELECTION */}
          <View style={circStyles.cardBox}>
            <Text style={circStyles.cardTitle}>1. Select Library Member</Text>
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search student by name, admission no, or class..."
                value={memberQuery}
                onChangeText={setMemberQuery}
              />
            </View>

            {selectedStudent ? (
              <View style={circStyles.selectedMemberCard}>
                <View style={{ flex: 1 }}>
                  <Text style={circStyles.memberTitle}>{selectedStudent.fullName}</Text>
                  <Text style={circStyles.memberSub}>{selectedStudent.admissionNo} • {selectedStudent.classSection}</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: studentActiveLoansCount >= settings.borrowingLimit ? '#DC2626' : '#059669' }}>
                      Active Borrowed: {studentActiveLoansCount} / {settings.borrowingLimit} Max
                    </Text>
                    {studentUnpaidFines > 0 && (
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>
                        ⚠️ Unpaid Fine: ${studentUnpaidFines.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedStudent(null)} style={{ padding: 4 }}>
                  <Feather name="x-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 6, marginTop: 8 }}>
                {filteredStudents.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={circStyles.optionRow}
                    onPress={() => setSelectedStudent(s)}
                  >
                    <MaterialCommunityIcons name="account-outline" size={20} color="#EAB308" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{s.fullName}</Text>
                      <Text style={{ fontSize: 11, color: '#6B7280' }}>{s.admissionNo} • {s.classSection}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* STEP 2: BOOK & PHYSICAL COPY SELECTION */}
          <View style={circStyles.cardBox}>
            <Text style={circStyles.cardTitle}>2. Select Book & Physical Copy</Text>
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search catalog by title, ISBN, or subject..."
                value={bookQuery}
                onChangeText={setBookQuery}
              />
            </View>

            {selectedBook ? (
              <View style={{ gap: 10, marginTop: 10 }}>
                <View style={circStyles.selectedMemberCard}>
                  <Image source={{ uri: selectedBook.coverImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=200' }} style={circStyles.bookThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={circStyles.memberTitle}>{selectedBook.title}</Text>
                    <Text style={circStyles.memberSub}>ISBN: {selectedBook.isbn} • {selectedBook.language}</Text>
                    <Text style={{ fontSize: 11, color: '#EAB308', fontWeight: '700', marginTop: 2 }}>
                      {availableCopies.length} Available Physical Copies
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => { setSelectedBook(null); setSelectedCopy(null); }} style={{ padding: 4 }}>
                    <Feather name="x-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Copy Selection */}
                <Text style={styles.formLabel}>Select Physical Copy Tag:</Text>
                {availableCopies.length === 0 ? (
                  <Text style={{ fontSize: 12, color: '#DC2626', fontStyle: 'italic' }}>No physical copy currently available for loan.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {availableCopies.map((c) => {
                      const isSelected = selectedCopy?.id === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[circStyles.copyChip, isSelected && circStyles.copyChipActive]}
                          onPress={() => setSelectedCopy(c)}
                        >
                          <Text style={[circStyles.copyChipAcc, isSelected && circStyles.copyChipAccActive]}>{c.accessionNumber}</Text>
                          <Text style={[circStyles.copyChipLoc, isSelected && circStyles.copyChipLocActive]}>{c.rack}, {c.shelf}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            ) : (
              <View style={{ gap: 6, marginTop: 8 }}>
                {filteredBooks.map((b) => {
                  const availCount = copies.filter((c) => c.bookId === b.id && c.status === 'AVAILABLE').length;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={circStyles.optionRow}
                      onPress={() => { setSelectedBook(b); setSelectedCopy(null); }}
                    >
                      <Image source={{ uri: b.coverImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=100' }} style={circStyles.bookThumb} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{b.title}</Text>
                        <Text style={{ fontSize: 11, color: '#6B7280' }}>ISBN: {b.isbn} • {availCount} Available</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* STEP 3: LOAN TERMS & CONFIRMATION */}
          <View style={circStyles.cardBox}>
            <Text style={circStyles.cardTitle}>3. Loan Terms & Schedule</Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Loan Duration (Days)</Text>
                <TextInput
                  style={styles.formInput}
                  value={customDays}
                  onChangeText={setCustomDays}
                  keyboardType="numeric"
                  placeholder="14"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Calculated Due Date</Text>
                <View style={[styles.formInput, { backgroundColor: '#F3F4F6', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>{calculatedDueDate}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleIssueBook} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#121316" /> : <Text style={styles.primaryBtnText}>Issue Book Now</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* RETURN & RENEWAL MODE */}
      {activeSubMode === 'RETURN' && (
        <View style={{ gap: 12, marginTop: 12 }}>
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search active loan by student name, book title, or barcode..."
              value={loanSearch}
              onChangeText={setLoanSearch}
            />
          </View>

          {filteredActiveLoans.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <MaterialCommunityIcons name="book-check-outline" size={32} color="#9CA3AF" />
              <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 6, fontWeight: '600' }}>No active loans match your search criteria.</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {filteredActiveLoans.map((loan) => {
                const std = students.find((s) => s.id === loan.studentId);
                const bk = books.find((b) => b.id === loan.bookId);
                const cpy = copies.find((c) => c.id === loan.copyId);

                const dueDateObj = new Date(loan.dueDate);
                const todayObj = new Date();
                const diffTime = todayObj.getTime() - dueDateObj.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isOverdue = diffDays > 0;
                const overdueChargeDays = Math.max(0, diffDays - (settings.gracePeriodDays || 2));
                const finePerDayVal = typeof settings.finePerDay === 'number' ? settings.finePerDay : parseFloat(String(settings.finePerDay || 1.0));
                const maxFineVal = typeof settings.maxFine === 'number' ? settings.maxFine : parseFloat(String(settings.maxFine || 100.0));
                const estFine = Math.min(overdueChargeDays * finePerDayVal, maxFineVal);

                return (
                  <View key={loan.id} style={circStyles.loanCard}>
                    <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
                      <Image source={{ uri: bk?.coverImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=100' }} style={circStyles.bookThumb} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }} numberOfLines={1}>
                          {bk?.title || 'Unknown Title'}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#4B5563', fontWeight: '600' }}>
                          Member: {std?.fullName} ({std?.admissionNo})
                        </Text>
                        <Text style={{ fontSize: 11, color: '#6B7280' }}>
                          Accession: {cpy?.accessionNumber || loan.copyId} • Barcode: {cpy?.barcode || 'N/A'}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#6B7280' }}>
                          Issued: {loan.issueDate} • <Text style={{ fontWeight: '800', color: isOverdue ? '#DC2626' : '#111827' }}>Due: {loan.dueDate}</Text>
                        </Text>

                        {isOverdue && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <View style={circStyles.overdueBadge}>
                              <Text style={circStyles.overdueBadgeText}>⚠️ Overdue by {diffDays} days</Text>
                            </View>
                            {estFine > 0 && (
                              <Text style={{ fontSize: 11, fontWeight: '800', color: '#DC2626' }}>
                                Est. Fine: ${estFine.toFixed(2)}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Return / Renew Action Buttons */}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 }}>
                      <TouchableOpacity style={circStyles.btnRenew} onPress={() => handleRenewLoan(loan)}>
                        <Feather name="refresh-cw" size={13} color="#121316" />
                        <Text style={circStyles.btnRenewText}>Renew Loan ({loan.renewalCount || 0}/{settings.renewalLimit || 2})</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={circStyles.btnReturn} onPress={() => handleReturnBook(loan)}>
                        <MaterialCommunityIcons name="keyboard-return" size={15} color="#121316" />
                        <Text style={circStyles.btnReturnText}>Return Book</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  viewBody: { flex: 1, padding: 16 },
  sectionHeader: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB', gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#111827', paddingVertical: 0 },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 12, fontWeight: '700', color: '#374151' },
  formInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#111827' },
  primaryBtn: { backgroundColor: '#EAB308', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  primaryBtnText: { color: '#121316', fontSize: 14, fontWeight: '900' },
});

const circStyles = StyleSheet.create({
  tabRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, gap: 4, marginTop: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  tabBtn: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#FEF08A' },
  tabText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  tabTextActive: { color: '#121316', fontWeight: '800' },
  cardBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F3F4F6', gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 2 },
  selectedMemberCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFDF7', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FEF08A' },
  memberTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },
  memberSub: { fontSize: 11, color: '#6B7280' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  bookThumb: { width: 30, height: 42, borderRadius: 4, backgroundColor: '#E5E7EB' },
  copyChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  copyChipActive: { backgroundColor: '#FEF08A', borderColor: '#FDE047' },
  copyChipAcc: { fontSize: 12, fontWeight: '800', color: '#374151' },
  copyChipAccActive: { color: '#121316' },
  copyChipLoc: { fontSize: 10, color: '#6B7280' },
  copyChipLocActive: { color: '#4B5563' },
  loanCard: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', gap: 4 },
  overdueBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  overdueBadgeText: { fontSize: 10, fontWeight: '800', color: '#DC2626' },
  btnRenew: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingVertical: 8, borderRadius: 8 },
  btnRenewText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  btnReturn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF08A', paddingVertical: 8, borderRadius: 8 },
  btnReturnText: { fontSize: 12, fontWeight: '800', color: '#121316' },
});
