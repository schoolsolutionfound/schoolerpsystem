import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLibraryStore } from '../../librarian/store/useLibraryStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  studentName?: string;
}

export const StudentLibraryModal: React.FC<Props> = ({
  visible,
  onClose,
  studentName = 'Rohan Verma',
}) => {
  const books = useLibraryStore((s) => s.books);
  const loans = useLibraryStore((s) => s.loans);
  const finePerDay = useLibraryStore((s) => s.finePerDay);
  const reserveBook = useLibraryStore((s) => s.reserveBook);
  const reservations = useLibraryStore((s) => s.reservations);
  const inAppReminders = useLibraryStore((s) => s.inAppReminders);

  const [activeTab, setActiveTab] = useState<'my_books' | 'explore' | 'notifications'>('my_books');
  const [searchQuery, setSearchQuery] = useState('');

  // Find loans for this student
  const myLoans = loans.filter((l) =>
    l.borrowerName.toLowerCase().includes(studentName.toLowerCase())
  );

  // Student specific notifications
  const myReminders = inAppReminders.filter(
    (r) =>
      r.recipientName.toLowerCase().includes(studentName.toLowerCase()) ||
      r.recipientId.toLowerCase().includes('std')
  );

  const filteredBooks = books.filter((b) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.rackLocation.toLowerCase().includes(q)
    );
  });

  const handleReserveBook = (bookId: string, title: string) => {
    const alreadyReserved = reservations.some(
      (r) =>
        r.bookId === bookId &&
        r.studentName.toLowerCase().includes(studentName.toLowerCase()) &&
        (r.status === 'waiting' || r.status === 'available')
    );

    if (alreadyReserved) {
      Alert.alert('Already on Hold Queue', `You are already in queue for "${title}". We will notify you in-app as soon as a copy is returned.`);
      return;
    }

    try {
      reserveBook({
        bookId,
        studentId: 'std-1082',
        studentName,
        className: 'Class 10-A',
      });
      Alert.alert(
        'Hold Placed Successfully! 📚',
        `You have reserved "${title}". An automated in-app reminder will alert you the moment a copy is returned to the circulation desk.`
      );
    } catch (err: any) {
      Alert.alert('Reservation Failed', err.message);
    }
  };

  const handleReadEBook = (title: string, author: string) => {
    Alert.alert(
      'Digital E-Book Reader',
      `Opening digital reader for "${title}" by ${author}.\n\n✓ Full text searchable\n✓ Offline chapter caching\n✓ Highlight & notes enabled`
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <MaterialCommunityIcons name="book-open-variant" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.title}>School Central Library</Text>
                <Text style={styles.subtitle}>Digital Reading & Borrowing Portal</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'my_books' && styles.tabBtnActive]}
              onPress={() => setActiveTab('my_books')}
            >
              <Text
                style={[styles.tabText, activeTab === 'my_books' && styles.tabTextActive]}
              >
                My Loans ({myLoans.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'explore' && styles.tabBtnActive]}
              onPress={() => setActiveTab('explore')}
            >
              <Text
                style={[styles.tabText, activeTab === 'explore' && styles.tabTextActive]}
              >
                Catalogue ({books.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'notifications' && styles.tabBtnActive]}
              onPress={() => setActiveTab('notifications')}
            >
              <Text
                style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}
              >
                App Alerts ({myReminders.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: My Loans */}
          {activeTab === 'my_books' && (
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {myLoans.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="book-open-outline" size={40} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Active Borrowed Books</Text>
                  <Text style={styles.emptySub}>
                    Visit the library desk or browse the catalogue tab to issue or reserve books.
                  </Text>
                </View>
              ) : (
                myLoans.map((loan) => {
                  const isOverdue = loan.status === 'overdue';
                  const isReturned = loan.status === 'returned';
                  return (
                    <View key={loan.id} style={styles.loanCard}>
                      <View style={styles.loanTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.loanTitle}>{loan.bookTitle}</Text>
                          <Text style={styles.accText}>Acc No: {loan.accessionNumber}</Text>
                        </View>

                        <View
                          style={[
                            styles.badge,
                            isOverdue
                              ? styles.badgeOverdue
                              : isReturned
                              ? styles.badgeReturned
                              : styles.badgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              isOverdue
                                ? { color: '#DC2626' }
                                : isReturned
                                ? { color: '#059669' }
                                : { color: '#4F46E5' },
                            ]}
                          >
                            {isOverdue ? 'Overdue' : isReturned ? 'Returned' : 'Active Loan'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.datesRow}>
                        <View>
                          <Text style={styles.dateLabel}>Issued Date</Text>
                          <Text style={styles.dateVal}>{loan.issueDate}</Text>
                        </View>
                        <View>
                          <Text style={styles.dateLabel}>Due Date</Text>
                          <Text
                            style={[
                              styles.dateVal,
                              isOverdue && { color: '#DC2626', fontWeight: '800' },
                            ]}
                          >
                            {loan.dueDate}
                          </Text>
                        </View>
                      </View>

                      {isOverdue && (
                        <View style={styles.fineBanner}>
                          <MaterialCommunityIcons name="alert-octagon" size={16} color="#DC2626" />
                          <Text style={styles.fineBannerText}>
                            Overdue! Accrued Fine: ₹{loan.fineAmount || 15} (@ ₹{finePerDay}/day)
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Tab 2: Catalogue & Holds */}
          {activeTab === 'explore' && (
            <View style={{ flex: 1 }}>
              <View style={styles.searchBox}>
                <MaterialCommunityIcons name="magnify" size={18} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search book title, author, category, rack..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
                {filteredBooks.map((book) => {
                  const isAvailable = book.availableCopies > 0;
                  const isReservedByMe = reservations.some(
                    (r) =>
                      r.bookId === book.id &&
                      r.studentName.toLowerCase().includes(studentName.toLowerCase()) &&
                      r.status === 'waiting'
                  );

                  return (
                    <View key={book.id} style={styles.bookCard}>
                      <View style={styles.bookTop}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.catalogBookTitle}>{book.title}</Text>
                            {book.isEBook && (
                              <View style={styles.ebookPill}>
                                <MaterialCommunityIcons name="tablet-cellphone" size={11} color="#0284C7" />
                                <Text style={styles.ebookPillText}>E-Book</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.catalogAuthor}>by {book.author}</Text>
                        </View>
                        <View
                          style={[
                            styles.stockTag,
                            { backgroundColor: isAvailable ? '#ECFDF5' : '#FEF2F2' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.stockTagText,
                              { color: isAvailable ? '#059669' : '#DC2626' },
                            ]}
                          >
                            {isAvailable ? `${book.availableCopies} available` : '0 left'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.rackRow}>
                        <MaterialCommunityIcons name="map-marker" size={12} color="#D97706" />
                        <Text style={styles.rackLocationText}>{book.rackLocation}</Text>
                        <Text style={styles.catText}>
                          • {book.category.toUpperCase().replace('_', ' ')}
                        </Text>
                      </View>

                      {/* Action Row: E-Book read or Hold queue */}
                      <View style={styles.catalogActionRow}>
                        {book.isEBook && (
                          <TouchableOpacity
                            style={styles.readEbookBtn}
                            onPress={() => handleReadEBook(book.title, book.author)}
                            activeOpacity={0.8}
                          >
                            <MaterialCommunityIcons name="book-open-page-variant" size={14} color="#0284C7" />
                            <Text style={styles.readEbookText}>Read E-Book</Text>
                          </TouchableOpacity>
                        )}

                        {!isAvailable && (
                          <TouchableOpacity
                            style={[styles.holdBtn, isReservedByMe && styles.holdBtnReserved]}
                            onPress={() => handleReserveBook(book.id, book.title)}
                            activeOpacity={0.8}
                          >
                            <MaterialCommunityIcons
                              name={isReservedByMe ? 'clock-check' : 'bookmark-plus'}
                              size={14}
                              color={isReservedByMe ? '#059669' : '#FFFFFF'}
                            />
                            <Text
                              style={[
                                styles.holdBtnText,
                                isReservedByMe && { color: '#059669', fontWeight: '800' },
                              ]}
                            >
                              {isReservedByMe ? 'Hold Active (In Queue)' : 'Hold / Reserve Book'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Tab 3: In-App Library Notifications */}
          {activeTab === 'notifications' && (
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {myReminders.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="bell-check" size={40} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>All Caught Up!</Text>
                  <Text style={styles.emptySub}>
                    No pending library notifications or fine reminders for your account.
                  </Text>
                </View>
              ) : (
                myReminders.map((rem) => {
                  const isOverdue = rem.type === 'overdue_fine';
                  const isAvailable = rem.type === 'book_available';
                  return (
                    <View key={rem.id} style={styles.reminderCard}>
                      <View style={styles.remIconWrap}>
                        <MaterialCommunityIcons
                          name={
                            isOverdue
                              ? 'alert-circle'
                              : isAvailable
                              ? 'book-check'
                              : 'bell-ring'
                          }
                          size={20}
                          color={
                            isOverdue
                              ? '#DC2626'
                              : isAvailable
                              ? '#059669'
                              : '#4F46E5'
                          }
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.remHeader}>
                          <Text style={styles.remTitle}>{rem.title}</Text>
                          <Text style={styles.remDate}>{rem.date}</Text>
                        </View>
                        <Text style={styles.remMsg}>{rem.message}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '88%',
    minHeight: '65%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 11, color: '#64748B' },
  closeBtn: { padding: 4 },
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tabBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#D97706' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '800' },
  scrollBody: { flex: 1, paddingBottom: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, maxWidth: 240 },
  loanCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  loanTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  loanTitle: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  accText: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeOverdue: { backgroundColor: '#FEE2E2' },
  badgeReturned: { backgroundColor: '#ECFDF5' },
  badgeActive: { backgroundColor: '#EEF2FF' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  dateLabel: { fontSize: 10, color: '#94A3B8' },
  dateVal: { fontSize: 11, fontWeight: '700', color: '#334155', marginTop: 1 },
  fineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    padding: 6,
    marginTop: 8,
    gap: 6,
  },
  fineBannerText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 12, color: '#0F172A' },
  bookCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  bookTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  catalogBookTitle: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  catalogAuthor: { fontSize: 11, color: '#64748B', marginTop: 1 },
  stockTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stockTagText: { fontSize: 10, fontWeight: '700' },
  rackRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  rackLocationText: { fontSize: 11, fontWeight: '600', color: '#D97706' },
  catText: { fontSize: 10, color: '#94A3B8' },
  ebookPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    gap: 2,
  },
  ebookPillText: { fontSize: 9, fontWeight: '800', color: '#0369A1' },
  catalogActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  readEbookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  readEbookText: { fontSize: 11, fontWeight: '700', color: '#0284C7' },
  holdBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  holdBtnReserved: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  holdBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  reminderCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  remIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remTitle: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
  remDate: { fontSize: 10, color: '#94A3B8' },
  remMsg: { fontSize: 11, color: '#475569', marginTop: 4, lineHeight: 15 },
});

