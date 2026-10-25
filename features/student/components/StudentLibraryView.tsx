import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { useUserStore } from '../../../store/useUserStore';
import { StudentLibrarySkeleton } from './skeletons';

export interface StudentLibraryViewProps {
  onBack?: () => void;
}

export type LibraryBlock = 'received' | 'fines';

export interface ReceivedBookItem {
  id: string;
  accessionNo: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  shelfLocation: string;
  issuedDate: string;
  dueDate: string;
  returnedDate?: string;
  status: 'IN_HAND' | 'DUE_SOON' | 'OVERDUE' | 'RETURNED';
  renewCount: number;
  maxRenewals: number;
}

export interface LibraryFineItem {
  id: string;
  fineId: string;
  bookTitle: string;
  accessionNo: string;
  reason: string;
  amount: number;
  status: 'UNPAID' | 'PAID';
  assessedDate: string;
  paidDate?: string;
  receiptNo?: string;
  paymentMode?: string;
}

const INITIAL_RECEIVED_BOOKS: ReceivedBookItem[] = [
  {
    id: 'rec-1',
    accessionNo: 'ACC-84920',
    title: 'Advanced Engineering Mathematics',
    author: 'Erwin Kreyszig',
    category: 'Mathematics',
    isbn: '978-0470458365',
    shelfLocation: 'Rack M-12 · Shelf 3',
    issuedDate: '05 Oct 2026',
    dueDate: '05 Nov 2026',
    status: 'IN_HAND',
    renewCount: 0,
    maxRenewals: 2,
  },
  {
    id: 'rec-2',
    accessionNo: 'ACC-12048',
    title: 'NCERT Exemplar Problems - Class 10 Maths',
    author: 'NCERT Editorial Team',
    category: 'Academics',
    isbn: '978-9350071922',
    shelfLocation: 'Rack E-01 · Shelf 2',
    issuedDate: '22 Sep 2026',
    dueDate: '24 Oct 2026',
    status: 'DUE_SOON',
    renewCount: 1,
    maxRenewals: 2,
  },
  {
    id: 'rec-3',
    accessionNo: 'ACC-33190',
    title: 'Concepts of Physics (Vol 1 & 2)',
    author: 'H.C. Verma',
    category: 'Science',
    isbn: '978-8177091878',
    shelfLocation: 'Rack P-04 · Shelf 1',
    issuedDate: '15 Sep 2026',
    dueDate: '15 Oct 2026',
    status: 'OVERDUE',
    renewCount: 2,
    maxRenewals: 2,
  },
  {
    id: 'rec-4',
    accessionNo: 'ACC-67124',
    title: 'Higher Algebra: Classical & Abstract',
    author: 'Hall & Knight',
    category: 'Mathematics',
    isbn: '978-9351762560',
    shelfLocation: 'Rack M-08 · Shelf 2',
    issuedDate: '01 Aug 2026',
    dueDate: '01 Sep 2026',
    returnedDate: '28 Aug 2026',
    status: 'RETURNED',
    renewCount: 0,
    maxRenewals: 2,
  },
  {
    id: 'rec-5',
    accessionNo: 'ACC-90214',
    title: 'Teaching Pedagogy & Modern Education',
    author: 'Dr. Anita Woolfolk',
    category: 'Pedagogy',
    isbn: '978-0134013527',
    shelfLocation: 'Rack T-03 · Shelf 1',
    issuedDate: '10 Jul 2026',
    dueDate: '10 Aug 2026',
    returnedDate: '08 Aug 2026',
    status: 'RETURNED',
    renewCount: 0,
    maxRenewals: 2,
  },
];

const INITIAL_FINES: LibraryFineItem[] = [
  {
    id: 'fin-1',
    fineId: 'FIN-2026-104',
    bookTitle: 'Concepts of Physics (Vol 1 & 2)',
    accessionNo: 'ACC-33190',
    reason: 'Overdue penalty (7 days overdue @ ₹10/day)',
    amount: 70,
    status: 'UNPAID',
    assessedDate: '22 Oct 2026',
  },
  {
    id: 'fin-3',
    fineId: 'FIN-2026-039',
    bookTitle: 'Higher Algebra: Classical & Abstract',
    accessionNo: 'ACC-67124',
    reason: 'Damaged barcode sticker re-issuance fee',
    amount: 30,
    status: 'PAID',
    assessedDate: '28 Aug 2026',
    paidDate: '28 Aug 2026',
    receiptNo: 'REC-LIB-55421',
    paymentMode: 'UPI Digital Pay',
  },
];

export const StudentLibraryView: React.FC<StudentLibraryViewProps> = ({ onBack }) => {
  const studentName = useUserStore((s) => s.fullName) || 'Student';
  const rollNoOrUSN = useUserStore((s) => s.rollNoOrUSN) || 'C6A-001';

  const [activeBlock, setActiveBlock] = useState<LibraryBlock>('received');
  const [refreshing, setRefreshing] = useState(false);

  // Received Books State
  const [receivedBooks, setReceivedBooks] = useState<ReceivedBookItem[]>(INITIAL_RECEIVED_BOOKS);
  const [bookSearch, setBookSearch] = useState('');

  // Fines State
  const [fines, setFines] = useState<LibraryFineItem[]>(INITIAL_FINES);
  const [fineFilter, setFineFilter] = useState<'ALL' | 'UNPAID' | 'PAID'>('ALL');

  // Payment & Receipt Modals
  const [payingFine, setPayingFine] = useState<LibraryFineItem | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<LibraryFineItem | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // Filtered Received Books (Search by Book name or Book ID)
  const filteredBooks = useMemo(() => {
    let list = receivedBooks;
    if (bookSearch.trim()) {
      const q = bookSearch.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.accessionNo.toLowerCase().includes(q)
      );
    }
    return list;
  }, [receivedBooks, bookSearch]);

  // Filtered Fines
  const filteredFines = useMemo(() => {
    let list = fines;
    if (fineFilter !== 'ALL') {
      list = list.filter((f) => f.status === fineFilter);
    }
    return list;
  }, [fines, fineFilter]);

  // Renewal Handler
  const handleRequestRenewal = (book: ReceivedBookItem) => {
    Alert.alert(
      'Confirm Book Renewal',
      `Extend return due date for "${book.title}" (${book.accessionNo}) by 14 days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Renewal',
          onPress: () => {
            const newDue = '19 Nov 2026';
            setReceivedBooks((prev) =>
              prev.map((b) =>
                b.id === book.id
                  ? {
                      ...b,
                      renewCount: b.renewCount + 1,
                      dueDate: newDue,
                      status: 'IN_HAND',
                    }
                  : b
              )
            );
            Alert.alert(
              'Renewal Confirmed',
              `"${book.title}" has been successfully renewed. New due date is ${newDue}.`
            );
          },
        },
      ]
    );
  };

  // Fine Payment Handler
  const handleConfirmPayFine = (fine: LibraryFineItem) => {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const receiptCode = `REC-LIB-${Math.floor(10000 + Math.random() * 90000)}`;

    setFines((prev) =>
      prev.map((f) =>
        f.id === fine.id
          ? {
              ...f,
              status: 'PAID',
              paidDate: todayStr,
              receiptNo: receiptCode,
              paymentMode: 'Online ERP Settlement',
            }
          : f
      )
    );
    setPayingFine(null);
    Alert.alert(
      'Payment Successful',
      `Fine of ₹${fine.amount} for "${fine.bookTitle}" has been cleared.`
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={20} color="#000000" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Library</Text>
          </View>
        </View>

        <View>
          <Text style={styles.headerBadgeText}>{rollNoOrUSN}</Text>
        </View>
      </View>

      {/* 2. Main 2-Block Switcher (1st: Received Books, 2nd: Fines) with ROUND counts */}
      <View style={styles.blockSwitcherWrap}>
        <View style={styles.blockSwitcher}>
          {/* Block 1: Received Books */}
          <TouchableOpacity
            style={[styles.blockTabBtn, activeBlock === 'received' && styles.blockTabBtnActive]}
            onPress={() => setActiveBlock('received')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.blockTabText,
                activeBlock === 'received' && styles.blockTabTextActive,
              ]}
            >
              Received Books
            </Text>
            <View
              style={[
                styles.roundBadge,
                activeBlock === 'received' ? styles.roundBadgeActive : styles.roundBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.roundBadgeText,
                  activeBlock === 'received' ? styles.roundBadgeTextActive : styles.roundBadgeTextInactive,
                ]}
              >
                {receivedBooks.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Block 2: Fines */}
          <TouchableOpacity
            style={[styles.blockTabBtn, activeBlock === 'fines' && styles.blockTabBtnActive]}
            onPress={() => setActiveBlock('fines')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.blockTabText,
                activeBlock === 'fines' && styles.blockTabTextActive,
              ]}
            >
              Fines
            </Text>
            <View
              style={[
                styles.roundBadge,
                activeBlock === 'fines' ? styles.roundBadgeActive : styles.roundBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.roundBadgeText,
                  activeBlock === 'fines' ? styles.roundBadgeTextActive : styles.roundBadgeTextInactive,
                ]}
              >
                {fines.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      >
        {refreshing ? (
          <StudentLibrarySkeleton />
        ) : (
          <>
            {/* ======================================================== */}
            {/* BLOCK 1: RECEIVED BOOKS                                   */}
            {/* ======================================================== */}
            {activeBlock === 'received' && (
              <View style={styles.blockContainer}>
                {/* Search Input Bar */}
                <View style={styles.searchRow}>
                  <View style={styles.searchBox}>
                    <Feather name="search" size={16} color="#6B7280" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search by book name or Book ID..."
                      placeholderTextColor="#9CA3AF"
                      value={bookSearch}
                      onChangeText={setBookSearch}
                      returnKeyType="search"
                    />
                    {bookSearch.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setBookSearch('')}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="x" size={15} color="#9CA3AF" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Received Books List */}
                <View style={styles.listContainer}>
                  {filteredBooks.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <MaterialCommunityIcons name="book-open-page-variant-outline" size={40} color="#9CA3AF" />
                      <Text style={styles.emptyTitle}>No Received Books</Text>
                      <Text style={styles.emptySub}>No books match your search criteria.</Text>
                    </View>
                  ) : (
                    filteredBooks.map((book) => (
                      <View key={book.id} style={styles.card}>
                        {/* Book Name */}
                        <Text style={styles.bookTitle}>{book.title}</Text>

                        {/* Book ID */}
                        <View style={styles.bookMetaRow}>
                          <Text style={styles.bookMetaText}>
                            <Text style={styles.bookMetaLabel}>Book ID: </Text>
                            <Text style={styles.bookMetaVal}>{book.accessionNo}</Text>
                          </Text>
                        </View>

                        {/* Action Row */}
                        <View style={styles.cardFooterRow}>
                          <Text style={styles.bookMetaText}>
                            <Text style={styles.bookMetaLabel}>Due Date: </Text>
                            <Text style={styles.bookMetaVal}>{book.dueDate}</Text>
                          </Text>

                          <TouchableOpacity
                            style={styles.payBtn}
                            onPress={() => handleRequestRenewal(book)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.payBtnText}>Renewal</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}

            {/* ======================================================== */}
            {/* BLOCK 2: FINES                                           */}
            {/* ======================================================== */}
            {activeBlock === 'fines' && (
              <View style={styles.blockContainer}>
                {/* Filter Pills for Fines */}
                <View style={styles.filterRow}>
                  <TouchableOpacity
                    style={[styles.filterChip, fineFilter === 'ALL' && styles.filterChipActive]}
                    onPress={() => setFineFilter('ALL')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, fineFilter === 'ALL' && styles.filterChipTextActive]}>
                      All ({fines.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterChip, fineFilter === 'UNPAID' && styles.filterChipActive]}
                    onPress={() => setFineFilter('UNPAID')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, fineFilter === 'UNPAID' && styles.filterChipTextActive]}>
                      Unpaid ({fines.filter((f) => f.status === 'UNPAID').length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterChip, fineFilter === 'PAID' && styles.filterChipActive]}
                    onPress={() => setFineFilter('PAID')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, fineFilter === 'PAID' && styles.filterChipTextActive]}>
                      Paid ({fines.filter((f) => f.status === 'PAID').length})
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Fines List */}
                <View style={styles.listContainer}>
                  {filteredFines.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <MaterialCommunityIcons name="cash-check" size={40} color="#9CA3AF" />
                      <Text style={styles.emptyTitle}>No Fines Found</Text>
                      <Text style={styles.emptySub}>No fine records under this filter.</Text>
                    </View>
                  ) : (
                    filteredFines.map((fine) => {
                      const isUnpaid = fine.status === 'UNPAID';

                      return (
                        <View key={fine.id} style={styles.card}>
                          {/* Top Fine Row */}
                          <View style={styles.cardHeaderRow}>
                            <Text style={styles.fineIdText}>{fine.fineId}</Text>
                            <Text style={styles.statusText}>{isUnpaid ? 'UNPAID' : 'PAID'}</Text>
                          </View>

                          {/* Fine Details */}
                          <View style={styles.fineDetailCol}>
                            <Text style={styles.cardTitle}>{fine.bookTitle}</Text>
                            <Text style={styles.cardAuthor}>Book ID: {fine.accessionNo}</Text>
                            <Text style={styles.fineReasonText}>{fine.reason}</Text>
                          </View>

                          {/* Dates Grid */}
                          <View style={styles.datesGrid}>
                            <View style={styles.dateCol}>
                              <Text style={styles.dateLbl}>DATE</Text>
                              <Text style={styles.dateVal}>{fine.assessedDate}</Text>
                            </View>

                            {fine.paidDate ? (
                              <View style={styles.dateCol}>
                                <Text style={styles.dateLbl}>PAID DATE</Text>
                                <Text style={styles.dateVal}>{fine.paidDate}</Text>
                              </View>
                            ) : null}

                            {fine.paymentMode ? (
                              <View style={styles.dateCol}>
                                <Text style={styles.dateLbl}>MODE</Text>
                                <Text style={styles.dateVal}>{fine.paymentMode}</Text>
                              </View>
                            ) : null}
                          </View>

                          {/* Fine Action Row */}
                          <View style={styles.cardFooterRow}>
                            <Text style={styles.isbnText}>
                              {fine.receiptNo ? `Receipt: ${fine.receiptNo}` : 'Penalty Active'}
                            </Text>

                            {isUnpaid ? (
                              <TouchableOpacity
                                style={styles.payBtn}
                                onPress={() => setPayingFine(fine)}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.payBtnText}>Pay Fine</Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={styles.receiptBtn}
                                onPress={() => setSelectedReceipt(fine)}
                                activeOpacity={0.8}
                              >
                                <Feather name="file-text" size={13} color="#000000" />
                                <Text style={styles.receiptBtnText}>View Receipt</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* MODAL 1: PAY FINE CONFIRMATION                            */}
      {/* ======================================================== */}
      {payingFine && (
        <Modal transparent animationType="fade" visible={!!payingFine} onRequestClose={() => setPayingFine(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Clear Library Fine</Text>
                <TouchableOpacity onPress={() => setPayingFine(null)} hitSlop={10}>
                  <Feather name="x" size={20} color="#000000" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalSummaryBox}>
                <Text style={styles.modalSummaryLabel}>FINE ID</Text>
                <Text style={styles.modalSummaryVal}>{payingFine.fineId}</Text>

                <View style={styles.modalDivider} />

                <Text style={styles.modalSummaryLabel}>BOOK TITLE</Text>
                <Text style={styles.modalSummaryVal}>{payingFine.bookTitle}</Text>

                <View style={styles.modalDivider} />

                <Text style={styles.modalSummaryLabel}>REASON</Text>
                <Text style={styles.modalSummaryVal}>{payingFine.reason}</Text>

                <View style={styles.modalDivider} />

                <View style={styles.modalAmountRow}>
                  <Text style={styles.modalAmountTotalLabel}>Total Amount Due</Text>
                  <Text style={styles.modalAmountTotalVal}>₹{payingFine.amount}</Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setPayingFine(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalPayBtn}
                  onPress={() => handleConfirmPayFine(payingFine)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalPayText}>Confirm Payment (₹{payingFine.amount})</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: RECEIPT DETAILS                                  */}
      {/* ======================================================== */}
      {selectedReceipt && (
        <Modal
          transparent
          animationType="fade"
          visible={!!selectedReceipt}
          onRequestClose={() => setSelectedReceipt(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.receiptHeaderLeft}>
                  <MaterialCommunityIcons name="check-decagram" size={20} color="#15803D" />
                  <Text style={styles.modalTitle}>Library Fine Receipt</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedReceipt(null)} hitSlop={10}>
                  <Feather name="x" size={20} color="#000000" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalSummaryBox}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Receipt Number</Text>
                  <Text style={styles.receiptVal}>{selectedReceipt.receiptNo || 'N/A'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Date</Text>
                  <Text style={styles.receiptVal}>{selectedReceipt.paidDate || 'N/A'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Student Name</Text>
                  <Text style={styles.receiptVal}>{studentName}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Roll No / USN</Text>
                  <Text style={styles.receiptVal}>{rollNoOrUSN}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Book Title</Text>
                  <Text style={styles.receiptVal} numberOfLines={1}>
                    {selectedReceipt.bookTitle}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Mode</Text>
                  <Text style={styles.receiptVal}>{selectedReceipt.paymentMode || 'Online'}</Text>
                </View>

                <View style={styles.modalDivider} />

                <View style={styles.modalAmountRow}>
                  <Text style={styles.modalAmountTotalLabel}>Amount Paid</Text>
                  <Text style={[styles.modalAmountTotalVal, { color: '#15803D' }]}>
                    ₹{selectedReceipt.amount}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalCloseReceiptBtn}
                onPress={() => setSelectedReceipt(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseReceiptText}>Close Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#000000',
    letterSpacing: -0.3,
  },
  headerBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#111827',
  },

  /* 2-Block Switcher */
  blockSwitcherWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  blockSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  blockTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  blockTabBtnActive: {
    backgroundColor: '#F4C430',
  },
  blockTabText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: '#6B7280',
  },
  blockTabTextActive: {
    color: '#000000',
    fontFamily: FontFamily.bold,
  },

  /* Round Badges for Tab Counts */
  roundBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundBadgeActive: {
    backgroundColor: '#000000',
  },
  roundBadgeInactive: {
    backgroundColor: '#E5E7EB',
  },
  roundBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    includeFontPadding: false,
  },
  roundBadgeTextActive: {
    color: '#FFFFFF',
  },
  roundBadgeTextInactive: {
    color: '#374151',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  blockContainer: {
    gap: 12,
  },

  /* Search */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#000000',
  },

  /* Filter Pills */
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },

  /* Cards */
  listContainer: {
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bookTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#000000',
    lineHeight: 20,
  },
  bookMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  bookMetaText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#000000',
  },
  bookMetaLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  bookMetaVal: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#000000',
  },

  /* Fine Specific Styles */
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fineIdText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  statusText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#000000',
    letterSpacing: 0.4,
  },

  cardTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#000000',
    lineHeight: 20,
  },
  cardAuthor: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#000000',
  },

  fineDetailCol: {
    gap: 2,
  },
  fineReasonText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#000000',
    marginTop: 2,
  },
  datesGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  dateCol: {
    flex: 1,
  },
  dateLbl: {
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    color: '#000000',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  dateVal: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#000000',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  isbnText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#000000',
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  payBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  receiptBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: '#000000',
  },

  /* Empty State */
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  modalSummaryBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 8,
  },
  modalSummaryLabel: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  modalSummaryVal: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  modalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  modalAmountTotalLabel: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  modalAmountTotalVal: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#DC2626',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: '#4B5563',
  },
  modalPayBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F4C430',
    alignItems: 'center',
  },
  modalPayText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  receiptLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  receiptVal: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#111827',
  },
  modalCloseReceiptBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  modalCloseReceiptText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});
