import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { Fine, StudentProfile, BookCopy, Book, DamageType, CopyCondition, CopyStatus, Loan } from '../../types';
import { apiClient } from '../../../../api/client';

export const DamageFineModal = ({
  visible,
  students,
  copies,
  books,
  loans = [],
  defaultPenalty,
  defaultDueRate = 10,
  onClose,
  onSaveDamageFine,
  modalStyles,
  commonStyles,
  fineStyles,
}: {
  visible: boolean;
  students: StudentProfile[];
  copies: BookCopy[];
  books: Book[];
  loans?: Loan[];
  defaultPenalty: number;
  defaultDueRate?: number;
  onClose: () => void;
  onSaveDamageFine: (newFine: Fine, updatedCopy?: BookCopy) => void;
  modalStyles: any;
  commonStyles: any;
  fineStyles: any;
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCopyId, setSelectedCopyId] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [damageCategory, setDamageCategory] = useState<'Damage' | 'Due' | 'Lost Book'>('Damage');
  const [damageNotes, setDamageNotes] = useState('');
  const [copyCondition, setCopyCondition] = useState<CopyCondition>('DAMAGED');
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('UNDER_REPAIR');
  const [submitting, setSubmitting] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [copySearch, setCopySearch] = useState('');

  // Dynamic Fine Calculation State
  const [dueRate, setDueRate] = useState(String(defaultDueRate || 10));
  const [overdueDays, setOverdueDays] = useState('7');
  const [bookPrice, setBookPrice] = useState('500');
  const [damagePercentage, setDamagePercentage] = useState('25');

  // Dropdown states
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false);
  const [isDamageTypeDropdownOpen, setIsDamageTypeDropdownOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedStudentId(students[0]?.id || '');
      setSelectedCopyId('');
      setSelectedLoanId('');
      setDamageCategory('Damage');
      setDamageNotes('');
      setCopyCondition('DAMAGED');
      setCopyStatus('UNDER_REPAIR');
      setMemberSearch('');
      setCopySearch('');
      setIsMemberDropdownOpen(false);
      setIsBookDropdownOpen(false);
      setIsDamageTypeDropdownOpen(false);
      setDueRate(String(defaultDueRate || 10));
      setOverdueDays('7');
      setBookPrice('500');
      setDamagePercentage('25');
    }
  }, [visible, students, defaultDueRate]);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return students;
    const q = memberSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        (s.classSection || '').toLowerCase().includes(q)
    );
  }, [students, memberSearch]);

  const studentLoans = useMemo(() => {
    if (!selectedStudentId) return [];
    return (loans || []).filter(
      (l) => l.studentId === selectedStudentId && (l.status === 'ACTIVE' || l.status === 'OVERDUE')
    );
  }, [loans, selectedStudentId]);

  const filteredBorrowedBooks = useMemo(() => {
    return studentLoans.filter((l) => {
      const c = copies.find((cp) => cp.id === l.copyId || cp.id === (l as any).bookCopyId);
      const b = books.find((bk) => bk.id === l.bookId || (c && bk.id === c.bookId));
      if (!copySearch.trim()) return true;
      const q = copySearch.toLowerCase();
      return (
        (b && b.title.toLowerCase().includes(q)) ||
        (c && c.accessionNumber.toLowerCase().includes(q)) ||
        (c?.barcode && c.barcode.toLowerCase().includes(q)) ||
        l.status.toLowerCase().includes(q)
      );
    });
  }, [studentLoans, copies, books, copySearch]);

  const filteredCopies = useMemo(() => {
    return copies.filter((c) => {
      const bk = books.find((b) => b.id === c.bookId);
      if (!copySearch.trim()) return true;
      const q = copySearch.toLowerCase();
      return (
        c.accessionNumber.toLowerCase().includes(q) ||
        (c.barcode || '').toLowerCase().includes(q) ||
        (bk && bk.title.toLowerCase().includes(q))
      );
    });
  }, [copies, books, copySearch]);

  const selectedMember = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId]
  );

  const selectedCopy = useMemo(
    () => copies.find((c) => c.id === selectedCopyId),
    [copies, selectedCopyId]
  );

  const selectedLoan = useMemo(
    () => (loans || []).find((l) => l.id === selectedLoanId),
    [loans, selectedLoanId]
  );

  const selectedBook = useMemo(() => {
    if (selectedCopy) {
      return books.find((b) => b.id === selectedCopy.bookId);
    }
    if (selectedLoan) {
      return books.find((b) => b.id === selectedLoan.bookId);
    }
    return undefined;
  }, [books, selectedCopy, selectedLoan]);

  // Synchronize Book Price and Loan Overdue Days when book/loan selections change
  useEffect(() => {
    if (selectedBook?.price) {
      const parsed = parseFloat(String(selectedBook.price));
      if (!isNaN(parsed) && parsed > 0) {
        setBookPrice(String(parsed));
      }
    }
  }, [selectedBook]);

  useEffect(() => {
    if (selectedLoan?.dueDate) {
      const diffTime = new Date().getTime() - new Date(selectedLoan.dueDate).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setOverdueDays(String(diffDays));
      } else {
        setOverdueDays('7');
      }
    }
  }, [selectedLoan]);

  // Dynamic Fine Calculation:
  // Due: overdueDays * dueRate
  // Damage: (bookPrice * damagePercentage) / 100
  // Lost: (bookPrice * damagePercentage) / 100
  const calculatedFineAmount = useMemo(() => {
    if (damageCategory === 'Due') {
      const days = Math.max(0, parseInt(overdueDays, 10) || 0);
      const rate = Math.max(0, parseFloat(dueRate) || 0);
      return days * rate;
    } else {
      const price = Math.max(0, parseFloat(bookPrice) || 0);
      const pct = Math.max(0, parseFloat(damagePercentage) || 0);
      return (price * pct) / 100;
    }
  }, [damageCategory, overdueDays, dueRate, bookPrice, damagePercentage]);

  const handleSave = () => {
    if (!selectedStudentId) {
      Alert.alert('Required Field', 'Please select a library member.');
      return;
    }

    if (damageCategory === 'Due') {
      const days = parseInt(overdueDays, 10);
      const rate = parseFloat(dueRate);
      if (isNaN(days) || days <= 0) {
        Alert.alert('Required Field', 'Please enter valid overdue days (at least 1 day).');
        return;
      }
      if (isNaN(rate) || rate < 0) {
        Alert.alert('Required Field', 'Please enter a valid due rate per day.');
        return;
      }
    } else {
      const p = parseFloat(bookPrice);
      const pct = parseFloat(damagePercentage);
      if (isNaN(p) || p <= 0) {
        Alert.alert('Required Field', 'Please enter a valid book price in rupees.');
        return;
      }
      if (isNaN(pct) || pct <= 0) {
        Alert.alert('Required Field', 'Please enter a valid damage percentage.');
        return;
      }
    }

    if (!damageNotes.trim()) {
      Alert.alert('Required Field', 'Please enter a brief description.');
      return;
    }

    setSubmitting(true);
    const amt = calculatedFineAmount;
    const isLost = damageCategory === 'Lost Book';
    const isDue = damageCategory === 'Due';

    const calculationDetails = isDue
      ? `${overdueDays} days @ ₹${dueRate}/day = ₹${amt.toFixed(2)}`
      : `Book Price: ₹${bookPrice} @ ${damagePercentage}% = ₹${amt.toFixed(2)}`;

    const newFine: Fine = {
      id: `fine-${isLost ? 'lost' : isDue ? 'due' : 'dmg'}-${Math.floor(100000 + Math.random() * 900000)}`,
      studentId: selectedStudentId,
      bookCopyId: selectedCopyId || undefined,
      loanId: selectedLoanId || undefined,
      fineType: isLost ? 'LOST_BOOK' : isDue ? 'OVERDUE' : 'DAMAGED_BOOK',
      damageType: isLost ? 'TOTAL_DESTRUCTION' : isDue ? 'GENERAL_WEAR' : 'TORN_PAGES',
      damageNotes: `[${damageCategory}] ${damageNotes.trim()} (${calculationDetails})`,
      amount: amt,
      paidAmount: 0,
      status: 'UNPAID',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      paymentTransactions: [],
    };

    let updatedCopy: BookCopy | undefined;
    if (selectedCopy) {
      updatedCopy = {
        ...selectedCopy,
        condition: isLost ? 'BAD' : copyCondition,
        status: isLost ? 'LOST' : isDue ? selectedCopy.status : copyStatus,
        updatedAt: new Date().toISOString().split('T')[0],
      };
    }

    // Save to backend database API (silent offline fallback)
    apiClient('/library/fines/damage', {
      method: 'POST',
      body: JSON.stringify({ fine: newFine, copy: updatedCopy }),
    }).catch(() => { });

    setSubmitting(false);
    onSaveDamageFine(newFine, updatedCopy);
  };

  const styles = commonStyles;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%', maxWidth: 540 }}
        >
          <View style={[modalStyles.modalContainer, { maxHeight: '94%' }]}>
            <View style={modalStyles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={modalStyles.headerTitle}>Book Fine</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
            {/* Step 1: Member Selection Dropdown */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>1. Enter Name or USN *</Text>
              <TouchableOpacity
                style={[
                  styles.formInput,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 10,
                    borderRadius: 5,
                  },
                ]}
                onPress={() => {
                  setIsMemberDropdownOpen(!isMemberDropdownOpen);
                  setIsBookDropdownOpen(false);
                  setIsDamageTypeDropdownOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: selectedMember ? '#171717' : '#94A3B8',
                    fontWeight: selectedMember ? '600' : '400',
                  }}
                  numberOfLines={1}
                >
                  {selectedMember
                    ? `${selectedMember.fullName} (${selectedMember.admissionNo})`
                    : 'Select member / USN...'}
                </Text>
                <Feather
                  name={isMemberDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#64748B"
                />
              </TouchableOpacity>

              {isMemberDropdownOpen && (
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    marginTop: 4,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 4,
                    overflow: 'hidden',
                  }}
                >
                  <TextInput
                    style={[styles.formInput, { fontSize: 12, margin: 8, borderRadius: 5 }]}
                    placeholder="🔍 Filter student by name or admission no..."
                    placeholderTextColor="#475569"
                    value={memberSearch}
                    onChangeText={setMemberSearch}
                  />
                  <ScrollView
                    style={{ maxHeight: 160 }}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredMembers.length === 0 ? (
                      <View style={{ padding: 12, alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: '#94A3B8' }}>No matching members</Text>
                      </View>
                    ) : (
                      filteredMembers.map((s) => {
                        const isSelected = selectedStudentId === s.id;
                        return (
                          <TouchableOpacity
                            key={s.id}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 9,
                              backgroundColor: isSelected ? '#FFF4C7' : '#FFFFFF',
                              borderBottomWidth: 1,
                              borderBottomColor: '#F1F5F9',
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                            onPress={() => {
                              setSelectedStudentId(s.id);
                              setSelectedCopyId('');
                              setSelectedLoanId('');
                              setIsMemberDropdownOpen(false);
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontWeight: isSelected ? '700' : '500',
                                  color: '#171717',
                                }}
                              >
                                {s.fullName}
                              </Text>
                              <Text style={{ fontSize: 11, color: '#64748B' }}>
                                {s.admissionNo} {s.classSection ? `• ${s.classSection}` : ''}
                              </Text>
                            </View>
                            {isSelected && <Feather name="check" size={16} color="#D97706" />}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Step 2: Book Copy Selection Dropdown */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>2. Enter Book Name</Text>
              <TouchableOpacity
                style={[
                  styles.formInput,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 10,
                    borderRadius: 5,
                  },
                ]}
                onPress={() => {
                  setIsBookDropdownOpen(!isBookDropdownOpen);
                  setIsMemberDropdownOpen(false);
                  setIsDamageTypeDropdownOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: selectedCopy || selectedBook ? '#171717' : '#94A3B8',
                    fontWeight: selectedCopy || selectedBook ? '600' : '400',
                  }}
                  numberOfLines={1}
                >
                  {selectedBook
                    ? `${selectedBook.title}${selectedCopy ? ` (${selectedCopy.accessionNumber})` : ''}`
                    : selectedCopy
                    ? `Copy: ${selectedCopy.accessionNumber}`
                    : studentLoans.length > 0
                    ? `Select from ${studentLoans.length} borrowed book(s)...`
                    : 'Select book...'}
                </Text>
                <Feather
                  name={isBookDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#64748B"
                />
              </TouchableOpacity>

              {isBookDropdownOpen && (
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    marginTop: 4,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 4,
                    overflow: 'hidden',
                  }}
                >
                  <TextInput
                    style={[styles.formInput, { fontSize: 12, margin: 8, borderRadius: 5 }]}
                    placeholder="🔍 Filter borrowed books..."
                    placeholderTextColor="#475569"
                    value={copySearch}
                    onChangeText={setCopySearch}
                  />
                  <ScrollView
                    style={{ maxHeight: 180 }}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        backgroundColor: !selectedCopyId && !selectedLoanId ? '#FFF4C7' : '#FFFFFF',
                        borderBottomWidth: 1,
                        borderBottomColor: '#F1F5F9',
                      }}
                      onPress={() => {
                        setSelectedCopyId('');
                        setSelectedLoanId('');
                        setIsBookDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: !selectedCopyId && !selectedLoanId ? '700' : '400',
                          color: '#171717',
                        }}
                      >
                        None / General Book
                      </Text>
                    </TouchableOpacity>

                    {studentLoans.length > 0 ? (
                      filteredBorrowedBooks.length === 0 ? (
                        <View style={{ padding: 12, alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, color: '#94A3B8' }}>No matching borrowed books</Text>
                        </View>
                      ) : (
                        filteredBorrowedBooks.map((loan) => {
                          const cp = copies.find((c) => c.id === loan.copyId || c.id === (loan as any).bookCopyId);
                          const bk = books.find((b) => b.id === loan.bookId || (cp && b.id === cp.bookId));
                          const isSelected = selectedLoanId === loan.id || (selectedCopyId && cp && selectedCopyId === cp.id);
                          const isOverdue = loan.status === 'OVERDUE';
                          return (
                            <TouchableOpacity
                              key={loan.id}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 9,
                                backgroundColor: isSelected ? '#FFF4C7' : '#FFFFFF',
                                borderBottomWidth: 1,
                                borderBottomColor: '#F1F5F9',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                              onPress={() => {
                                setSelectedCopyId(cp?.id || '');
                                setSelectedLoanId(loan.id);
                                setIsBookDropdownOpen(false);
                              }}
                            >
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontSize: 13,
                                    fontWeight: isSelected ? '700' : '500',
                                    color: '#171717',
                                  }}
                                  numberOfLines={1}
                                >
                                  {bk?.title || 'Borrowed Book'}
                                </Text>
                                <Text style={{ fontSize: 11, color: isOverdue ? '#DC2626' : '#64748B' }}>
                                  {cp?.accessionNumber ? `Acc: ${cp.accessionNumber} • ` : ''}Due: {loan.dueDate} [{loan.status}]
                                </Text>
                              </View>
                              {isSelected && <Feather name="check" size={16} color="#D97706" />}
                            </TouchableOpacity>
                          );
                        })
                      )
                    ) : (
                      <>
                        <View style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F8FAFC' }}>
                          <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>
                            {selectedMember
                              ? `No active loans for ${selectedMember.fullName}. Select from library catalog copies:`
                              : 'Select from library catalog copies:'}
                          </Text>
                        </View>
                        {filteredCopies.map((c) => {
                          const bk = books.find((b) => b.id === c.bookId);
                          const isSelected = selectedCopyId === c.id;
                          return (
                            <TouchableOpacity
                              key={c.id}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 9,
                                backgroundColor: isSelected ? '#FFF4C7' : '#FFFFFF',
                                borderBottomWidth: 1,
                                borderBottomColor: '#F1F5F9',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                              onPress={() => {
                                setSelectedCopyId(c.id);
                                setSelectedLoanId('');
                                setIsBookDropdownOpen(false);
                              }}
                            >
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontSize: 13,
                                    fontWeight: isSelected ? '700' : '500',
                                    color: '#171717',
                                  }}
                                  numberOfLines={1}
                                >
                                  {bk?.title || 'Book'}
                                </Text>
                                <Text style={{ fontSize: 11, color: '#64748B' }}>
                                  Acc: {c.accessionNumber} {c.condition ? `• ${c.condition}` : ''}
                                </Text>
                              </View>
                              {isSelected && <Feather name="check" size={16} color="#D97706" />}
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Step 3: Damage Type Dropdown (2 options: Damage and Due) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>3. Damage Type *</Text>
              <TouchableOpacity
                style={[
                  styles.formInput,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 10,
                    borderRadius: 5,
                  },
                ]}
                onPress={() => {
                  setIsDamageTypeDropdownOpen(!isDamageTypeDropdownOpen);
                  setIsMemberDropdownOpen(false);
                  setIsBookDropdownOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 13, color: '#171717', fontWeight: '700' }}>
                  {damageCategory}
                </Text>
                <Feather
                  name={isDamageTypeDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#64748B"
                />
              </TouchableOpacity>

              {isDamageTypeDropdownOpen && (
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    marginTop: 4,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 4,
                    overflow: 'hidden',
                  }}
                >
                  {(['Damage', 'Due', 'Lost Book'] as const).map((typeOpt) => {
                    const isSelected = damageCategory === typeOpt;
                    return (
                      <TouchableOpacity
                        key={typeOpt}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          backgroundColor: isSelected ? '#FFF4C7' : '#FFFFFF',
                          borderBottomWidth: 1,
                          borderBottomColor: '#F1F5F9',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                        onPress={() => {
                          setDamageCategory(typeOpt);
                          if (typeOpt === 'Lost Book') {
                            setDamagePercentage('100');
                          } else if (typeOpt === 'Damage' && damagePercentage === '100') {
                            setDamagePercentage('25');
                          }
                          setIsDamageTypeDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: isSelected ? '700' : '400',
                            color: isSelected ? '#171717' : '#334155',
                          }}
                        >
                          {typeOpt}
                        </Text>
                        {isSelected && <Feather name="check" size={16} color="#D97706" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Dynamic Calculation Controls: Due (days * rate) or Damage/Lost (book price * %) */}
            {damageCategory === 'Due' ? (
              <View style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Overdue Days *</Text>
                    <TextInput
                      style={[styles.formInput, { borderRadius: 5, fontWeight: '700' }]}
                      value={overdueDays}
                      onChangeText={setOverdueDays}
                      keyboardType="numeric"
                      placeholder="7"
                      placeholderTextColor="#475569"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Due Rate (₹ / Day) *</Text>
                    <TextInput
                      style={[styles.formInput, { borderRadius: 5, fontWeight: '700' }]}
                      value={dueRate}
                      onChangeText={setDueRate}
                      keyboardType="numeric"
                      placeholder="10"
                      placeholderTextColor="#475569"
                    />
                  </View>
                </View>

                {/* Calculation Summary Card */}
                <View
                  style={{
                    backgroundColor: '#FFFDF5',
                    borderColor: '#FDE68A',
                    borderWidth: 1,
                    borderRadius: 5,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#854D0E' }}>Due Fine Amount:</Text>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#B45309' }}>₹{calculatedFineAmount.toFixed(2)}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#92400E', marginTop: 4 }}>
                    {overdueDays || 0} days overdue × ₹{dueRate || 0}/day = ₹{calculatedFineAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.formGroup, { flex: 1.2 }]}>
                    <Text style={styles.formLabel}>Book Price (₹) *</Text>
                    <TextInput
                      style={[styles.formInput, { borderRadius: 5, fontWeight: '700' }]}
                      value={bookPrice}
                      onChangeText={setBookPrice}
                      keyboardType="numeric"
                      placeholder="e.g. 500"
                      placeholderTextColor="#475569"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Damage % *</Text>
                    <TextInput
                      style={[styles.formInput, { borderRadius: 5, fontWeight: '700' }]}
                      value={damagePercentage}
                      onChangeText={setDamagePercentage}
                      keyboardType="numeric"
                      placeholder="25"
                      placeholderTextColor="#475569"
                    />
                  </View>
                </View>

                {damageCategory === 'Damage' && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 6 }}>
                      Quick Damage Severity Presets:
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Minor (25%)', val: '25' },
                        { label: 'Moderate (50%)', val: '50' },
                        { label: 'Severe (75%)', val: '75' },
                        { label: 'Total (100%)', val: '100' },
                      ].map((preset) => (
                        <TouchableOpacity
                          key={preset.val}
                          style={[
                            styles.chip,
                            { borderRadius: 5, paddingHorizontal: 10, paddingVertical: 5 },
                            damagePercentage === preset.val && styles.chipActive,
                          ]}
                          onPress={() => setDamagePercentage(preset.val)}
                        >
                          <Text style={[styles.chipText, damagePercentage === preset.val && styles.chipTextActive, { fontSize: 11.5 }]}>
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Calculation Summary Card */}
                <View
                  style={{
                    backgroundColor: '#FFFDF5',
                    borderColor: '#FDE68A',
                    borderWidth: 1,
                    borderRadius: 5,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#854D0E' }}>
                      {damageCategory === 'Lost Book' ? 'Lost Book Fine Amount:' : 'Damage Fine Amount:'}
                    </Text>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#B45309' }}>₹{calculatedFineAmount.toFixed(2)}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#92400E', marginTop: 4 }}>
                    Book Price ₹{(parseFloat(bookPrice) || 0).toFixed(2)} × {damagePercentage || 0}% = ₹{calculatedFineAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* Condition updater if copy selected */}
            {selectedCopy && (
              <View style={[styles.formGroup, { marginTop: 4 }]}>
                <Text style={styles.formLabel}>Update Copy Condition</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['DAMAGED', 'BAD'] as CopyCondition[]).map((cond) => (
                    <TouchableOpacity
                      key={cond}
                      style={[
                        styles.chip,
                        { flex: 1, alignItems: 'center', borderRadius: 5 },
                        copyCondition === cond && styles.chipActive,
                      ]}
                      onPress={() => setCopyCondition(cond)}
                    >
                      <Text style={[styles.chipText, copyCondition === cond && styles.chipTextActive]}>
                        {cond}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Step 4: Damage Description & Remarks */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>4. Description *</Text>
              <TextInput
                style={[styles.formInput, { height: 75, borderRadius: 5 }]}
                value={damageNotes}
                onChangeText={setDamageNotes}
                multiline
                placeholder="Describe exact condition, page numbers affected, torn cover, water spill, or due notes..."
                placeholderTextColor="#475569"
              />
            </View>

            {/* Action Buttons: Cancel and Transparent Green Accept Button */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#FEF2F2',
                  borderWidth: 1,
                  borderColor: '#FECACA',
                  paddingVertical: 12,
                  borderRadius: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={onClose}
                disabled={submitting}
              >
                <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '800' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1.8,
                  backgroundColor: '#026440',
                  paddingVertical: 12,
                  borderRadius: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#026440',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3,
                  elevation: 3,
                }}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>Accept</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
