import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
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

  const [activeTab, setActiveTab] = useState<'my_books' | 'explore'>('my_books');
  const [searchQuery, setSearchQuery] = useState('');

  // Find loans for this student
  const myLoans = loans.filter((l) =>
    l.borrowerName.toLowerCase().includes(studentName.toLowerCase())
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
                My Borrowed Books ({myLoans.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'explore' && styles.tabBtnActive]}
              onPress={() => setActiveTab('explore')}
            >
              <Text
                style={[styles.tabText, activeTab === 'explore' && styles.tabTextActive]}
              >
                Explore Catalogue ({books.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'my_books' ? (
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {myLoans.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="book-open-outline" size={40} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Active Borrowed Books</Text>
                  <Text style={styles.emptySub}>
                    Visit the library desk or browse catalogue to issue a book.
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
                            {isOverdue ? 'Overdue' : isReturned ? 'Returned' : 'Due Soon'}
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
          ) : (
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
                  return (
                    <View key={book.id} style={styles.bookCard}>
                      <View style={styles.bookTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.catalogBookTitle}>{book.title}</Text>
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
                            {isAvailable ? `${book.availableCopies} in stock` : 'All issued'}
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
                    </View>
                  );
                })}
              </ScrollView>
            </View>
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
    maxHeight: '85%',
    minHeight: '60%',
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
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#D97706' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
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
});
