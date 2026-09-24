import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Feather } from '../common/Icons';
import { Book, BookCopy, Loan, Fine, Reservation, StudentProfile } from '../../types';

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
}) => {
  const [search, setSearch] = useState('');

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

  const styles = commonStyles;

  return (
    <View style={styles.viewBodyContainer}>
      {/* Header & Search Bar */}
      <View style={{ gap: 10, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={styles.sectionHeader}>Members Directory ({students.length})</Text>
            <Text style={{ fontSize: 11, color: '#6B7280', marginTop: -8 }}>
              Manage registered student profiles, borrowing history & fines
            </Text>
          </View>
          <TouchableOpacity style={memStyles.addBtnHeader} onPress={onAddStudent}>
            <Feather name="user-plus" size={14} color="#121316" />
            <Text style={memStyles.addBtnHeaderText}>Register Member</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members by name, admission no, or class..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80, gap: 10 }}
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
                        Fine: ${unpaidTotal.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={onAddStudent}>
        <Feather name="user-plus" size={24} color="#121316" />
      </TouchableOpacity>
    </View>
  );
};

const memStyles = StyleSheet.create({
  addBtnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF08A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnHeaderText: { fontSize: 12, fontWeight: '800', color: '#121316' },
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 18, fontWeight: '900', color: '#D97706' },
  name: { fontSize: 14, fontWeight: '800', color: '#111827' },
  subText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  contactText: { fontSize: 11, color: '#6B7280' },
});
