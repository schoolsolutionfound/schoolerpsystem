import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '../common/Icons';
import { Fine, StudentProfile, BookCopy, Book } from '../../types';

export interface FinesViewProps {
  fines: Fine[];
  students: StudentProfile[];
  copies: BookCopy[];
  books: Book[];
  onPayFine: (fine: Fine) => void;
  onWaiveFine: (fine: Fine) => void;
  onAssessDamage: () => void;
  commonStyles?: any;
  fineStyles?: any;
}

export const FinesView: React.FC<FinesViewProps> = ({
  fines,
  students,
  copies,
  books,
  onPayFine,
  onWaiveFine,
  onAssessDamage,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'WAIVED'>('ALL');

  // Calculated KPIs
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
      {/* Header & KPI Summary Cards */}
      <View style={{ gap: 12, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={styles.sectionHeader}>Fine Management & Receipts</Text>
            <Text style={{ fontSize: 11, color: '#6B7280', marginTop: -8 }}>
              Track overdue fines, damage penalties, waivers & receipts
            </Text>
          </View>
          <TouchableOpacity style={fineStyles.damageBtnHeader} onPress={onAssessDamage}>
            <MaterialCommunityIcons name="book-alert-outline" size={15} color="#FFFFFF" />
            <Text style={fineStyles.damageBtnHeaderText}>Record Book Damage Fine</Text>
          </TouchableOpacity>
        </View>

        <View style={fineStyles.kpiGrid}>
          <View style={[fineStyles.kpiCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[fineStyles.kpiLabel, { color: '#991B1B' }]}>Unpaid Balance</Text>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
            </View>
            <Text style={[fineStyles.kpiValue, { color: '#DC2626' }]}>${unpaidTotal.toFixed(2)}</Text>
            <Text style={fineStyles.kpiSub}>Pending member fines</Text>
          </View>

          <View style={[fineStyles.kpiCard, { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[fineStyles.kpiLabel, { color: '#065F46' }]}>Collected Total</Text>
              <MaterialCommunityIcons name="cash-check" size={18} color="#059669" />
            </View>
            <Text style={[fineStyles.kpiValue, { color: '#059669' }]}>${collectedTotal.toFixed(2)}</Text>
            <Text style={fineStyles.kpiSub}>Paid fine revenue</Text>
          </View>

          <View style={[fineStyles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[fineStyles.kpiLabel, { color: '#1E40AF' }]}>Waived Fines</Text>
              <MaterialCommunityIcons name="hand-heart-outline" size={18} color="#2563EB" />
            </View>
            <Text style={[fineStyles.kpiValue, { color: '#2563EB' }]}>${waivedTotal.toFixed(2)}</Text>
            <Text style={fineStyles.kpiSub}>Approved exemptions</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search fine record by student name, fine ID, damage type..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Status Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
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
      </View>

      {/* Fine List */}
      <FlatList
        data={filteredFines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80, gap: 10 }}
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
                  <Text style={fineStyles.fineAmount}>${item.amount.toFixed(2)}</Text>
                  {item.paidAmount > 0 && item.status !== 'PAID' && (
                    <Text style={{ fontSize: 11, color: '#059669', fontWeight: '700' }}>Paid: ${item.paidAmount.toFixed(2)}</Text>
                  )}
                  {isPending && (
                    <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '800', marginTop: 2 }}>
                      Bal: ${remaining.toFixed(2)}
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
                {item.paymentTransactions && item.paymentTransactions.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialCommunityIcons name="receipt" size={13} color="#059669" />
                    <Text style={[fineStyles.metaText, { color: '#059669', fontWeight: '700' }]}>
                      {item.paymentTransactions.length} Txn(s) Recorded
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons for Pending Fines */}
              {isPending && (
                <View style={fineStyles.actionRow}>
                  <TouchableOpacity style={fineStyles.payBtn} onPress={() => onPayFine(item)}>
                    <MaterialCommunityIcons name="cash-register" size={15} color="#121316" />
                    <Text style={fineStyles.payBtnText}>Pay Fine (${remaining.toFixed(2)})</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={fineStyles.waiveBtn} onPress={() => onWaiveFine(item)}>
                    <MaterialCommunityIcons name="hand-heart" size={15} color="#2563EB" />
                    <Text style={fineStyles.waiveBtnText}>Waive Fine</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  viewBodyContainer: { flex: 1, padding: 16 },
  sectionHeader: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB', gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#111827', paddingVertical: 0 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#FEF08A', borderColor: '#EAB308' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  chipTextActive: { color: '#121316', fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  badgeTextGreen: { color: '#059669' },
  badgeTextRed: { color: '#DC2626' },
});

const fineStyles = StyleSheet.create({
  damageBtnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  damageBtnHeaderText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { flex: 1, minWidth: 140, padding: 12, borderRadius: 10, borderWidth: 1 },
  kpiLabel: { fontSize: 11, fontWeight: '700' },
  kpiValue: { fontSize: 20, fontWeight: '900', marginVertical: 2 },
  kpiSub: { fontSize: 10, color: '#6B7280' },
  fineCard: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', gap: 8 },
  fineIdText: { fontSize: 13, fontWeight: '900', color: '#111827' },
  studentName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  studentSub: { fontSize: 11, color: '#6B7280' },
  fineAmount: { fontSize: 18, fontWeight: '900', color: '#111827' },
  damageDetailBox: { backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5', gap: 4 },
  damageTypeTitle: { fontSize: 12, fontWeight: '800', color: '#991B1B' },
  damageNotesText: { fontSize: 11, color: '#7F1D1D', fontStyle: 'italic' },
  damageCopyMeta: { fontSize: 10, color: '#B91C1C', fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 4 },
  metaText: { fontSize: 11, color: '#6B7280' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  payBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF08A', paddingVertical: 8, borderRadius: 8 },
  payBtnText: { fontSize: 12, fontWeight: '900', color: '#121316' },
  waiveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingVertical: 8, borderRadius: 8 },
  waiveBtnText: { fontSize: 12, fontWeight: '800', color: '#2563EB' },
});
