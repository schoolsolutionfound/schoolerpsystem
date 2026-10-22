import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Feather } from '../common/Icons';
import { Book, BookCopy, Loan, Fine, Reservation, StudentProfile } from '../../types';
import { FontFamily } from '../../../../constants/fonts';

export const LibraryStudentsView = ({
  students,
  loans,
  copies,
  books,
  fines,
  reservations,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  commonStyles,
  onRefresh,
  isRefreshing,
}: {
  students: StudentProfile[];
  loans: Loan[];
  copies: BookCopy[];
  books: Book[];
  fines: Fine[];
  reservations: Reservation[];
  onAddStudent: () => void;
  onEditStudent: (s: StudentProfile) => void;
  onDeleteStudent: (id: string) => void;
  commonStyles: any;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        (s.classSection || '').toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [students, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const startRange = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endRange = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  const styles = commonStyles;

  return (
    <View style={styles.viewBodyContainer}>
      {/* Header & Search Bar */}
      <View style={{ gap: 10, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={styles.sectionHeader}>Members Directory</Text>
            
          </View>
          <TouchableOpacity style={memStyles.addBtnHeader} onPress={onAddStudent}>
            <Text style={memStyles.addBtnHeaderText}>Register Member</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members by name, admission no, or class..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={paginatedStudents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80, gap: 10 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!isRefreshing}
              onRefresh={onRefresh}
              colors={['#000000']}
              tintColor="#000000"
            />
          ) : undefined
        }
        renderItem={({ item }) => {
          const activeLoans = loans.filter((l) => l.studentId === item.id && (l.status === 'ACTIVE' || l.status === 'OVERDUE'));
          const unpaidFines = fines.filter((f) => f.studentId === item.id && f.status === 'UNPAID');
          const unpaidTotal = unpaidFines.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);

          return (
            <View style={memStyles.card}>
              <View style={memStyles.avatarCircle}>
                <Text style={memStyles.avatarLetter}>{item.fullName.charAt(0).toUpperCase()}</Text>
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={memStyles.name}>{item.fullName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity onPress={() => onEditStudent(item)} style={{ padding: 4 }}>
                      <Feather name="edit-2" size={15} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDeleteStudent(item.id)} style={{ padding: 4 }}>
                      <Feather name="trash-2" size={15} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={memStyles.subText}>{item.admissionNo} • {item.classSection}</Text>
                {item.email ? <Text style={memStyles.contactText}>✉️ {item.email}</Text> : null}
                {item.phone ? <Text style={memStyles.contactText}>📞 {item.phone}</Text> : null}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <View style={[styles.statusBadge, activeLoans.length > 0 ? styles.badgeGreen : { backgroundColor: '#F3F4F6' }]}>
                    <Text style={[styles.badgeText, activeLoans.length > 0 ? styles.badgeTextGreen : { color: '#6B7280' }]}>
                      {activeLoans.length} Active Loans
                    </Text>
                  </View>

                  {unpaidTotal > 0 && (
                    <View style={[styles.statusBadge, styles.badgeRed]}>
                      <Text style={[styles.badgeText, styles.badgeTextRed]}>
                        Fine: ₹{unpaidTotal.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          filtered.length > 0 ? (
            <View style={memStyles.paginationContainer}>
              <Text style={memStyles.paginationInfo}>
                Showing {startRange}-{endRange} of {filtered.length} members
              </Text>
              <View style={memStyles.paginationBtnRow}>
                <TouchableOpacity
                  style={[
                    memStyles.paginationBtn,
                    currentPage === 1 && memStyles.paginationBtnDisabled,
                  ]}
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  activeOpacity={0.8}
                >
                  <Feather name="chevron-left" size={16} color={currentPage === 1 ? '#9CA3AF' : '#171717'} />
                  <Text
                    style={[
                      memStyles.paginationBtnText,
                      currentPage === 1 && memStyles.paginationBtnTextDisabled,
                    ]}
                  >
                    Prev
                  </Text>
                </TouchableOpacity>

                <View style={memStyles.paginationIndicator}>
                  <Text style={memStyles.paginationIndicatorText}>
                    {currentPage} / {totalPages}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    memStyles.paginationBtn,
                    currentPage === totalPages && memStyles.paginationBtnDisabled,
                  ]}
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      memStyles.paginationBtnText,
                      currentPage === totalPages && memStyles.paginationBtnTextDisabled,
                    ]}
                  >
                    Next
                  </Text>
                  <Feather name="chevron-right" size={16} color={currentPage === totalPages ? '#9CA3AF' : '#171717'} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const memStyles = StyleSheet.create({
  addBtnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F4C430', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5 },
  addBtnHeaderText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#171717' },
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E8E5DC', gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#D97706' },
  name: { fontSize: 14, fontFamily: FontFamily.bold, color: '#111827' },
  subText: { fontSize: 12, color: '#4B5563', fontFamily: FontFamily.semibold },
  contactText: { fontSize: 11, color: '#6B7280', fontFamily: FontFamily.regular },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    flexWrap: 'wrap',
    gap: 10,
  },
  paginationInfo: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  paginationBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  paginationBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  paginationBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  paginationBtnTextDisabled: {
    color: '#9CA3AF',
  },
  paginationIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  paginationIndicatorText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
});
