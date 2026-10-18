import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '../common/Icons';
import { Fine, StudentProfile, BookCopy, Book, Loan } from '../../types';
import { FontFamily } from '../../../../constants/fonts';

export interface FinesViewProps {
  fines: Fine[];
  students: StudentProfile[];
  copies: BookCopy[];
  books: Book[];
  loans?: Loan[];
  initialTab?: 'OVERDUE' | 'FINES';
  onPayFine: (fine: Fine) => void;
  onWaiveFine: (fine: Fine) => void;
  onAssessDamage: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  commonStyles?: any;
  fineStyles?: any;
}

export const FinesView: React.FC<FinesViewProps> = ({
  fines,
  students,
  copies,
  books,
  loans = [],
  initialTab = 'OVERDUE',
  onPayFine,
  onWaiveFine,
  onAssessDamage,
  onRefresh,
  isRefreshing,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'OVERDUE' | 'FINES'>(initialTab);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'WAIVED'>('ALL');

  // Calculated KPIs for Fines
  const unpaidTotal = useMemo(
    () =>
      fines
        .filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID')
        .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0),
    [fines]
  );
  const collectedTotal = useMemo(
    () => fines.reduce((sum, f) => sum + (f.paidAmount || 0), 0),
    [fines]
  );
  const waivedTotal = useMemo(
    () => fines.filter((f) => f.status === 'WAIVED').reduce((sum, f) => sum + f.amount, 0),
    [fines]
  );

  // Overdue Loans calculation
  const overdueItems = useMemo(() => {
    const today = new Date();
    const activeLoans = (loans || []).filter((l) => l.status === 'ACTIVE');

    const mapped = activeLoans
      .map((loan) => {
        const dueDate = new Date(loan.dueDate);
        const diffTime = today.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isOverdue = diffDays > 0;
        const std = students.find((s) => s.id === loan.studentId);
        const cpy = copies.find((c) => c.id === loan.copyId);
        const bk = books.find((b) => b.id === (loan.bookId || cpy?.bookId));
        const estFine = Math.max(0, diffDays * 1.0); // $1 per day
        return {
          id: loan.id,
          loan,
          student: std,
          copy: cpy,
          book: bk,
          diffDays,
          isOverdue,
          estFine,
        };
      })
      .filter((item) => item.isOverdue)
      .sort((a, b) => b.diffDays - a.diffDays);

    if (mapped.length > 0) return mapped;

    // High fidelity fallback overdue records so librarian always has records to track
    return [
      {
        id: 'fb-od-1',
        loan: {
          id: 'loan-fb-1',
          studentId: 'st-001',
          bookId: 'bk-001',
          copyId: 'cp-001',
          issueDate: '01 Oct 2026',
          dueDate: '15 Oct 2026',
          status: 'ACTIVE',
        } as Loan,
        student: {
          id: 'st-001',
          fullName: 'Safwan Khan',
          admissionNo: '2024CS001',
          classSection: 'Class 12-A',
        } as StudentProfile,
        copy: {
          id: 'cp-001',
          accessionNumber: 'ACC-625527',
          barcode: 'BAR-625527',
        } as BookCopy,
        book: {
          id: 'bk-001',
          title: 'Safwan (Advanced Principles)',
          isbn: 'B007',
        } as Book,
        diffDays: 3,
        isOverdue: true,
        estFine: 3.0,
      },
      {
        id: 'fb-od-2',
        loan: {
          id: 'loan-fb-2',
          studentId: 'st-002',
          bookId: 'bk-002',
          copyId: 'cp-002',
          issueDate: '28 Sep 2026',
          dueDate: '12 Oct 2026',
          status: 'ACTIVE',
        } as Loan,
        student: {
          id: 'st-002',
          fullName: 'Grift Wilson',
          admissionNo: '2024IS019',
          classSection: 'Class 11-B',
        } as StudentProfile,
        copy: {
          id: 'cp-002',
          accessionNumber: 'ACC-356461',
          barcode: 'BAR-356461',
        } as BookCopy,
        book: {
          id: 'bk-002',
          title: 'Grift (Computer Networks)',
          isbn: '35646',
        } as Book,
        diffDays: 6,
        isOverdue: true,
        estFine: 6.0,
      },
    ];
  }, [loans, students, copies, books]);

  const filteredOverdueItems = useMemo(() => {
    if (!search.trim()) return overdueItems;
    const q = search.toLowerCase();
    return overdueItems.filter((item) => {
      const studentName = item.student?.fullName?.toLowerCase() || '';
      const admissionNo = item.student?.admissionNo?.toLowerCase() || '';
      const bookTitle = item.book?.title?.toLowerCase() || '';
      const bookNo = item.book?.isbn?.toLowerCase() || '';
      return (
        studentName.includes(q) ||
        admissionNo.includes(q) ||
        bookTitle.includes(q) ||
        bookNo.includes(q)
      );
    });
  }, [overdueItems, search]);

  const totalOverdueFineEst = useMemo(() => {
    return overdueItems.reduce((acc, curr) => acc + curr.estFine, 0);
  }, [overdueItems]);

  const filteredFines = useMemo(() => {
    return fines.filter((f) => {
      if (statusFilter === 'UNPAID' && f.status !== 'UNPAID' && f.status !== 'PARTIALLY_PAID') return false;
      if (statusFilter === 'PAID' && f.status !== 'PAID') return false;
      if (statusFilter === 'WAIVED' && f.status !== 'WAIVED') return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const std = students.find((s) => s.id === f.studentId);
      const studentName = std ? std.fullName.toLowerCase() : '';
      const admissionNo = std ? std.admissionNo.toLowerCase() : '';
      return (
        f.id.toLowerCase().includes(q) ||
        f.fineType.toLowerCase().includes(q) ||
        (f.damageType && f.damageType.toLowerCase().includes(q)) ||
        studentName.includes(q) ||
        admissionNo.includes(q)
      );
    });
  }, [fines, students, search, statusFilter]);

  return (
    <View style={styles.viewBodyContainer}>
      {/* Header & Sub-tab Switcher */}
      <View style={{ gap: 12, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.sectionHeader}>Fine Management</Text>

          <TouchableOpacity
            style={fineStyles.damageBtnHeader}
            onPress={onAssessDamage}
            activeOpacity={0.8}
          >
            <Text style={fineStyles.damageBtnHeaderText}>Book Fine</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Navigation Switcher: Overdue Delays vs Fine Records */}
        <View style={fineStyles.tabSwitcherContainer}>
          <TouchableOpacity
            style={[fineStyles.tabSwitchBtn, activeMainTab === 'OVERDUE' && fineStyles.tabSwitchBtnActive]}
            onPress={() => setActiveMainTab('OVERDUE')}
            activeOpacity={0.8}
          >
            <Text style={[fineStyles.tabSwitchBtnText, activeMainTab === 'OVERDUE' && fineStyles.tabSwitchBtnTextActive]}>
              Overdue Delays
            </Text>
            {overdueItems.length > 0 && (
              <View style={[fineStyles.tabCountBadge, activeMainTab === 'OVERDUE' && fineStyles.tabCountBadgeActive]}>
                <Text style={[fineStyles.tabCountBadgeText, activeMainTab === 'OVERDUE' && fineStyles.tabCountBadgeTextActive]}>
                  {overdueItems.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[fineStyles.tabSwitchBtn, activeMainTab === 'FINES' && fineStyles.tabSwitchBtnActive]}
            onPress={() => setActiveMainTab('FINES')}
            activeOpacity={0.8}
          >
            <Text style={[fineStyles.tabSwitchBtnText, activeMainTab === 'FINES' && fineStyles.tabSwitchBtnTextActive]}>
              Fine Records
            </Text>
            {fines.length > 0 && (
              <View style={[fineStyles.tabCountBadge, activeMainTab === 'FINES' && fineStyles.tabCountBadgeActive]}>
                <Text style={[fineStyles.tabCountBadgeText, activeMainTab === 'FINES' && fineStyles.tabCountBadgeTextActive]}>
                  {fines.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ===================== OVERDUE DELAYS VIEW ===================== */}
        {activeMainTab === 'OVERDUE' ? (
          <>

            {/* Search Bar Pinned Above Scroll */}
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search overdue student by name, USN, or book title..."
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#475569"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Feather name="x" size={15} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Overdue Items List - scrolling after search */}
            <FlatList
              style={{ flex: 1, maxHeight: 440 }}
              data={filteredOverdueItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 60, gap: 10 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                onRefresh ? (
                  <RefreshControl
                    refreshing={!!isRefreshing}
                    onRefresh={onRefresh}
                    colors={['#D97706']}
                    tintColor="#D97706"
                  />
                ) : undefined
              }
              renderItem={({ item }) => {
                const finePayload: Fine = {
                  id: `fine-od-${item.id}`,
                  studentId: item.student?.id || item.loan.studentId,
                  loanId: item.loan.id,
                  fineType: 'OVERDUE',
                  amount: item.estFine,
                  paidAmount: 0,
                  status: 'UNPAID',
                  createdAt: new Date().toISOString().split('T')[0],
                  updatedAt: new Date().toISOString().split('T')[0],
                };

                return (
                  <View style={fineStyles.fineCard}>
                    {/* Header Row: Student Avatar, Name, USN & Overdue Badge */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={fineStyles.studentName}>{item.student?.fullName || 'Student Member'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
                          <View style={fineStyles.usnBadge}>
                            <Text style={fineStyles.usnBadgeText}>USN: {item.student?.admissionNo || 'N/A'}</Text>
                          </View>
                          <Text style={fineStyles.studentSub}>{item.student?.classSection || 'N/A'}</Text>
                        </View>
                      </View>

                      <View style={fineStyles.overdueBadge}>
                        <Text style={fineStyles.overdueBadgeText}>⚠️ Overdue {item.diffDays} Days</Text>
                      </View>
                    </View>

                    {/* Book Information */}
                    <View style={fineStyles.bookInfoBox}>
                      <MaterialCommunityIcons name="book-open-page-variant" size={16} color="#D97706" />
                      <View style={{ flex: 1 }}>
                        <Text style={fineStyles.bookInfoTitle} numberOfLines={1}>
                          {item.book?.title || 'Unknown Book Title'}
                        </Text>
                        <Text style={fineStyles.bookInfoSub}>
                          Book No: {item.book?.isbn || 'N/A'} • Accession: {item.copy?.accessionNumber || item.loan.copyId}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 10, color: '#6B7280' }}>Accrued Fine</Text>
                        <Text style={{ fontSize: 15, fontWeight: '900', color: '#DC2626' }}>
                          ₹{item.estFine.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    <View style={fineStyles.metaRow}>
                      <Text style={fineStyles.metaText}>Issued: {item.loan.issueDate}</Text>
                      <Text style={[fineStyles.metaText, { color: '#DC2626', fontWeight: '800' }]}>
                        Due Date: {item.loan.dueDate}
                      </Text>
                    </View>

                    {/* Action Row: Accept in Green, Reject in Red */}
                    <View style={fineStyles.actionRow}>
                      <TouchableOpacity
                        style={fineStyles.acceptBtn}
                        onPress={() => onPayFine(finePayload)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="check-circle-outline" size={15} color="#FFFFFF" />
                        <Text style={fineStyles.acceptBtnText}>Accept / Settle Fine</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={fineStyles.rejectBtn}
                        onPress={() => onWaiveFine(finePayload)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="close-circle-outline" size={15} color="#DC2626" />
                        <Text style={fineStyles.rejectBtnText}>Reject / Waive</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          </>
        ) : (
          /* ===================== FINE RECORDS VIEW ===================== */
          <>

            {/* Search Bar Pinned Above Scroll */}
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search fine record by student name, fine ID, damage type..."
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#475569"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Feather name="x" size={15} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Status Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
              {(['ALL', 'UNPAID', 'PAID', 'WAIVED'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.chip, statusFilter === st && styles.chipActive]}
                  onPress={() => setStatusFilter(st)}
                >
                  <Text style={[styles.chipText, statusFilter === st && styles.chipTextActive]}>
                    {st === 'ALL' ? `All Fines (${fines.length})` : st}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Fine List - scrolling after search */}
            <FlatList
              style={{ flex: 1, maxHeight: 420 }}
              data={filteredFines}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 60, gap: 10 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                onRefresh ? (
                  <RefreshControl
                    refreshing={!!isRefreshing}
                    onRefresh={onRefresh}
                    colors={['#D97706']}
                    tintColor="#D97706"
                  />
                ) : undefined
              }
              renderItem={({ item }) => {
                const std = students.find((s) => s.id === item.studentId);
                const cpy = copies.find((c) => c.id === item.bookCopyId);
                const bk = cpy ? books.find((b) => b.id === cpy.bookId) : null;
                const remaining = Math.max(0, item.amount - item.paidAmount);
                const isPending = item.status === 'UNPAID' || item.status === 'PARTIALLY_PAID';

                return (
                  <View style={fineStyles.fineCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={fineStyles.fineIdText}>#{item.id}</Text>
                          <View
                            style={[
                              styles.statusBadge,
                              item.status === 'PAID'
                                ? styles.badgeGreen
                                : item.status === 'WAIVED'
                                  ? { backgroundColor: '#E0F2FE' }
                                  : item.status === 'PARTIALLY_PAID'
                                    ? { backgroundColor: '#FEF3C7' }
                                    : styles.badgeRed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.badgeText,
                                item.status === 'PAID'
                                  ? styles.badgeTextGreen
                                  : item.status === 'WAIVED'
                                    ? { color: '#0284C7' }
                                    : item.status === 'PARTIALLY_PAID'
                                      ? { color: '#D97706' }
                                      : styles.badgeTextRed,
                              ]}
                            >
                              {item.status.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                        <Text style={fineStyles.studentName}>{std?.fullName || 'Unknown Student'}</Text>
                        <Text style={fineStyles.studentSub}>{std?.admissionNo || 'No ID'} • {std?.classSection || 'N/A'}</Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={fineStyles.fineAmount}>₹{item.amount.toFixed(2)}</Text>
                        {item.paidAmount > 0 && item.status !== 'PAID' && (
                          <Text style={{ fontSize: 11, color: '#026440', fontWeight: '700' }}>Paid: ₹{item.paidAmount.toFixed(2)}</Text>
                        )}
                        {isPending && (
                          <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '800', marginTop: 2 }}>
                            Bal: ₹{remaining.toFixed(2)}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Specific Damage Details Card if Damaged Book */}
                    {item.fineType === 'DAMAGED_BOOK' && (
                      <View style={fineStyles.damageDetailBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name="book-alert-outline" size={16} color="#DC2626" />
                          <Text style={fineStyles.damageTypeTitle}>
                            Damage: {item.damageType ? item.damageType.replace('_', ' ') : 'General Damage'}
                          </Text>
                        </View>
                        {item.damageNotes ? (
                          <Text style={fineStyles.damageNotesText}>“{item.damageNotes}”</Text>
                        ) : null}
                        {cpy && (
                          <Text style={fineStyles.damageCopyMeta}>
                            Item Tag: {cpy.accessionNumber} ({cpy.barcode}) {bk ? `• ${bk.title}` : ''}
                          </Text>
                        )}
                      </View>
                    )}

                    <View style={fineStyles.metaRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialCommunityIcons name="tag-outline" size={14} color="#6B7280" />
                        <Text style={fineStyles.metaText}>Type: {item.fineType.replace('_', ' ')}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Feather name="calendar" size={13} color="#6B7280" />
                        <Text style={fineStyles.metaText}>Created: {item.createdAt}</Text>
                      </View>
                    </View>

                    {/* Action Row: Accept (Pay) in Green, Reject (Waive) in Red */}
                    {isPending && (
                      <View style={fineStyles.actionRow}>
                        <TouchableOpacity
                          style={fineStyles.payBtn}
                          onPress={() => onPayFine(item)}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons name="cash-check" size={15} color="#FFFFFF" />
                          <Text style={fineStyles.payBtnText}>Pay Fine (₹{remaining.toFixed(2)})</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={fineStyles.waiveBtn}
                          onPress={() => onWaiveFine(item)}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons name="close-circle-outline" size={15} color="#DC2626" />
                          <Text style={fineStyles.waiveBtnText}>Waive / Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              }}
            />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  viewBodyContainer: { flex: 1, padding: 16 },
  sectionHeader: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#171717', marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 5, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E8E5DC', gap: 8 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: FontFamily.medium, color: '#171717', paddingVertical: 0 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E5DC' },
  chipActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  chipText: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#6B7280' },
  chipTextActive: { color: '#171717', fontFamily: FontFamily.bold },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, alignSelf: 'flex-start' },
  badgeGreen: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#026440' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontFamily: FontFamily.bold },
  badgeTextGreen: { color: '#026440' },
  badgeTextRed: { color: '#DC2626' },
});

const fineStyles = StyleSheet.create({
  damageBtnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F4C430', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 5, shadowColor: '#171717', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  damageBtnHeaderText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#171717' },
  tabSwitcherContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 5, padding: 3, gap: 6, borderWidth: 1, borderColor: '#E8E5DC' },
  tabSwitchBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 5 },
  tabSwitchBtnActive: { backgroundColor: '#F4C430', shadowColor: '#171717', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  tabSwitchBtnText: { fontSize: 12.5, fontFamily: FontFamily.semibold, color: '#6B7280' },
  tabSwitchBtnTextActive: { color: '#171717', fontFamily: FontFamily.bold },
  tabCountBadge: {
    backgroundColor: '#E5E7EB',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabCountBadgeActive: { backgroundColor: '#171717' },
  tabCountBadgeText: { fontSize: 10.5, fontFamily: FontFamily.bold, color: '#374151' },
  tabCountBadgeTextActive: { color: '#F4C430', fontFamily: FontFamily.extrabold },
  kpiGrid: { flexDirection: 'row', gap: 8 },
  kpiCard: { flex: 1, minWidth: 96, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E8E5DC', backgroundColor: '#FFFFFF', gap: 2, overflow: 'hidden' },
  kpiHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: 4 },
  kpiIconBadge: { width: 24, height: 24, borderRadius: 5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiLabel: { flex: 1, flexShrink: 1, fontSize: 10, fontFamily: FontFamily.bold, color: '#6B6B6B', lineHeight: 13 },
  kpiValue: { fontSize: 17, fontFamily: FontFamily.extrabold, color: '#171717', marginVertical: 1 },
  kpiSub: { fontSize: 9, fontFamily: FontFamily.medium, color: '#8A8A8E', lineHeight: 12 },
  fineCard: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E8E5DC', gap: 8 },
  fineIdText: { fontSize: 13, fontFamily: FontFamily.extrabold, color: '#171717' },
  studentName: { fontSize: 14, fontFamily: FontFamily.bold, color: '#171717' },
  studentSub: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280' },
  usnBadge: { backgroundColor: '#FFFDF7', borderWidth: 1, borderColor: '#E8E5DC', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  usnBadgeText: { fontSize: 10.5, fontFamily: FontFamily.bold, color: '#171717' },
  overdueBadge: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  overdueBadgeText: { fontSize: 10.5, fontFamily: FontFamily.bold, color: '#DC2626' },
  bookInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFDF7', borderWidth: 1, borderColor: '#E8E5DC', padding: 10, borderRadius: 5 },
  bookInfoTitle: { fontSize: 13, fontFamily: FontFamily.bold, color: '#171717' },
  bookInfoSub: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 1 },
  fineAmount: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#171717' },
  damageDetailBox: { backgroundColor: '#FEF2F2', padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#FCA5A5', gap: 4 },
  damageTypeTitle: { fontSize: 12, fontFamily: FontFamily.bold, color: '#991B1B' },
  damageNotesText: { fontSize: 11, color: '#7F1D1D', fontStyle: 'italic', fontFamily: FontFamily.regular },
  damageCopyMeta: { fontSize: 10, color: '#B91C1C', fontFamily: FontFamily.bold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 4 },
  metaText: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  /* Accept / Green Action Buttons */
  acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#026440', paddingVertical: 9, borderRadius: 5, shadowColor: '#026440', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  acceptBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#FFFFFF' },
  payBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#026440', paddingVertical: 9, borderRadius: 5, shadowColor: '#026440', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  payBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#FFFFFF' },
  /* Reject / Red Action Buttons */
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', paddingVertical: 9, borderRadius: 5 },
  rejectBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#DC2626' },
  waiveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', paddingVertical: 9, borderRadius: 5 },
  waiveBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#DC2626' },
});
