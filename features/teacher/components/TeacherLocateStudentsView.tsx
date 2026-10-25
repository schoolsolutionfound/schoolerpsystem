import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { MaterialCommunityIcons, Feather } from './common/Icons';
import { TeacherLocateSkeleton } from './skeletons/TeacherLocateSkeleton';
import { FontFamily } from '../../../constants/fonts';

interface Student {
  id: string;
  name: string;
  usn: string;
  class: string;
  section: string;
  status: 'present' | 'absent' | 'late';
  lastSeen: string;
  parentPhone: string;
}

const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'Aarav Sharma', usn: 'C6A-001', class: 'Class 6', section: 'A', status: 'present', lastSeen: '8:30 AM', parentPhone: '+91 98765 43210' },
  { id: '2', name: 'Diya Kumar', usn: 'C6A-002', class: 'Class 6', section: 'A', status: 'present', lastSeen: '8:25 AM', parentPhone: '+91 98765 43211' },
  { id: '3', name: 'Vivaan Reddy', usn: 'C6A-003', class: 'Class 6', section: 'A', status: 'absent', lastSeen: 'Yesterday', parentPhone: '+91 98765 43212' },
  { id: '4', name: 'Ananya Patel', usn: 'C6A-004', class: 'Class 6', section: 'A', status: 'late', lastSeen: '9:10 AM', parentPhone: '+91 98765 43213' },
  { id: '5', name: 'Rohan Gupta', usn: 'C6B-001', class: 'Class 6', section: 'B', status: 'present', lastSeen: '8:28 AM', parentPhone: '+91 98765 43214' },
  { id: '6', name: 'Ishita Joshi', usn: 'C6B-002', class: 'Class 6', section: 'B', status: 'present', lastSeen: '8:30 AM', parentPhone: '+91 98765 43215' },
  { id: '7', name: 'Kabir Singh', usn: 'C6B-003', class: 'Class 6', section: 'B', status: 'absent', lastSeen: '3 days ago', parentPhone: '+91 98765 43216' },
  { id: '8', name: 'Meera Nair', usn: 'C6B-004', class: 'Class 6', section: 'B', status: 'present', lastSeen: '8:20 AM', parentPhone: '+91 98765 43217' },
];

export const TeacherLocateStudentsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const classes = ['All', 'Class 6 A', 'Class 6 B'];

  const filtered = MOCK_STUDENTS.filter((s) => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.usn.toLowerCase().includes(search.toLowerCase());
    const matchesClass = !selectedClass || selectedClass === 'All' || `${s.class} ${s.section}` === selectedClass;
    return matchesSearch && matchesClass;
  });

  const presentCount = filtered.filter((s) => s.status === 'present').length;
  const absentCount = filtered.filter((s) => s.status === 'absent').length;
  const lateCount = filtered.filter((s) => s.status === 'late').length;

  const statusMeta = (status: string) => {
    switch (status) {
      case 'present': return { color: '#026440', bg: '#D1FAE5', border: '#026440', label: 'Present' };
      case 'absent': return { color: '#DC2626', bg: '#FEE2E2', border: '#FECACA', label: 'Absent' };
      case 'late': return { color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', label: 'Late' };
      default: return { color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB', label: status };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Locate Students</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or USN..."
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classRow} contentContainerStyle={styles.classRowContent}>
        {classes.map((cls) => {
          const isActive = selectedClass === cls || (!selectedClass && cls === 'All');
          return (
            <TouchableOpacity
              key={cls}
              style={[styles.classChip, isActive && styles.classChipActive]}
              onPress={() => setSelectedClass(cls === 'All' ? null : cls)}
              activeOpacity={0.7}
            >
              <Text style={[styles.classChipText, isActive && styles.classChipTextActive]}>
                {cls}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.statsRow}>
        <View style={[styles.statPill, { backgroundColor: '#D1FAE5', borderColor: '#026440' }]}>
          <View style={[styles.statDot, { backgroundColor: '#026440' }]} />
          <Text style={[styles.statText, { color: '#026440' }]}>{presentCount} Present</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
          <View style={[styles.statDot, { backgroundColor: '#DC2626' }]} />
          <Text style={[styles.statText, { color: '#DC2626' }]}>{absentCount} Absent</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
          <View style={[styles.statDot, { backgroundColor: '#D97706' }]} />
          <Text style={[styles.statText, { color: '#D97706' }]}>{lateCount} Late</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
          />
        }
      >
        {refreshing ? (
          <TeacherLocateSkeleton />
        ) : (
          filtered.map((student) => {
            const meta = statusMeta(student.status);
            return (
              <View key={student.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={styles.cardAvatar}>
                    <MaterialCommunityIcons name="account" size={18} color="#1A1B1C" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{student.name}</Text>
                    <Text style={styles.cardMeta}>{student.usn} · {student.class} {student.section}</Text>
                    <View style={styles.cardStatusRow}>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                        <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
                        <Text style={[styles.statusText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                      <Text style={styles.lastSeenText}>Last seen {student.lastSeen}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                    <Feather name="phone" size={15} color="#026440" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                    <Feather name="message-square" size={15} color="#B45309" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  title: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#111827' },
  searchRow: { paddingHorizontal: 20, paddingTop: 12, marginBottom: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#111827',
  },
  classRow: { paddingHorizontal: 20, marginBottom: 10 },
  classRowContent: { gap: 8 },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  classChipActive: { backgroundColor: '#FEF08A', borderColor: '#EAB308' },
  classChipText: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#4B5563' },
  classChipTextActive: { color: '#121316', fontFamily: FontFamily.bold },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
  },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statText: { fontSize: 11, fontFamily: FontFamily.bold },
  list: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: 13, fontFamily: FontFamily.bold, color: '#111827' },
  cardMeta: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280' },
  cardStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 10, fontFamily: FontFamily.bold },
  lastSeenText: { fontSize: 10.5, fontFamily: FontFamily.regular, color: '#9CA3AF' },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 5,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
