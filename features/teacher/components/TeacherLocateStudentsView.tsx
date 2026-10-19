import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

interface Student {
  id: string;
  name: string;
  usn: string;
  department: string;
  academicYear: string;
  section: string;
  status: 'present' | 'absent' | 'late';
  lastSeen: string;
  parentPhone: string;
}

const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'Aarav Sharma', usn: '1VM26CS001', department: 'Computer Science', academicYear: '1st Year', section: 'A', status: 'present', lastSeen: '8:30 AM', parentPhone: '+91 98765 43210' },
  { id: '2', name: 'Diya Kumar', usn: '1VM26CS002', department: 'Computer Science', academicYear: '1st Year', section: 'A', status: 'present', lastSeen: '8:25 AM', parentPhone: '+91 98765 43211' },
  { id: '3', name: 'Vivaan Reddy', usn: '1VM26EC003', department: 'Electronics & Comm', academicYear: '1st Year', section: 'A', status: 'absent', lastSeen: 'Yesterday', parentPhone: '+91 98765 43212' },
  { id: '4', name: 'Ananya Patel', usn: '1VM26AI004', department: 'AIML', academicYear: '2nd Year', section: 'B', status: 'late', lastSeen: '9:10 AM', parentPhone: '+91 98765 43213' },
  { id: '5', name: 'Rohan Gupta', usn: '1VM26ME005', department: 'Mechanical Eng', academicYear: '2nd Year', section: 'A', status: 'present', lastSeen: '8:28 AM', parentPhone: '+91 98765 43214' },
  { id: '6', name: 'Ishita Joshi', usn: '1VM26CV006', department: 'Civil Eng', academicYear: '3rd Year', section: 'A', status: 'present', lastSeen: '8:30 AM', parentPhone: '+91 98765 43215' },
  { id: '7', name: 'Kabir Singh', usn: '1VM26CS007', department: 'Computer Science', academicYear: '2nd Year', section: 'B', status: 'absent', lastSeen: '3 days ago', parentPhone: '+91 98765 43216' },
  { id: '8', name: 'Meera Nair', usn: '1VM26EC008', department: 'Electronics & Comm', academicYear: '2nd Year', section: 'B', status: 'present', lastSeen: '8:20 AM', parentPhone: '+91 98765 43217' },
  { id: '9', name: 'Tanmay Kulkarni', usn: '1VM26AI009', department: 'AIML', academicYear: '1st Year', section: 'A', status: 'present', lastSeen: '8:35 AM', parentPhone: '+91 98765 43218' },
  { id: '10', name: 'Sneha Deshmukh', usn: '1VM26CM010', department: 'Commerce & Mgmt', academicYear: '1st Year', section: 'A', status: 'late', lastSeen: '9:05 AM', parentPhone: '+91 98765 43219' },
];

const CLASSES = [
  'All',
  'CSE 1st Year',
  'ECE 1st Year',
  'AIML 2nd Year',
  'Mechanical 2nd Year',
  'Civil 3rd Year',
];

export const TeacherLocateStudentsView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const filtered = MOCK_STUDENTS.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.usn.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (!selectedClass || selectedClass === 'All') return true;

    if (selectedClass === 'CSE 1st Year') return s.department === 'Computer Science' && s.academicYear === '1st Year';
    if (selectedClass === 'ECE 1st Year') return s.department === 'Electronics & Comm' && s.academicYear === '1st Year';
    if (selectedClass === 'AIML 2nd Year') return s.department === 'AIML' && s.academicYear === '2nd Year';
    if (selectedClass === 'Mechanical 2nd Year') return s.department === 'Mechanical Eng' && s.academicYear === '2nd Year';
    if (selectedClass === 'Civil 3rd Year') return s.department === 'Civil Eng' && s.academicYear === '3rd Year';

    return true;
  });

  const presentCount = filtered.filter((s) => s.status === 'present').length;
  const absentCount = filtered.filter((s) => s.status === 'absent').length;
  const lateCount = filtered.filter((s) => s.status === 'late').length;

  const statusColor = (status: string) => {
    switch (status) {
      case 'present': return '#16A34A';
      case 'absent': return '#DC2626';
      case 'late': return '#D97706';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Locate Students</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by student name or USN..."
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classRow} contentContainerStyle={styles.classRowContent}>
        {CLASSES.map((cls) => {
          const active = (selectedClass === cls || (!selectedClass && cls === 'All'));
          return (
            <TouchableOpacity
              key={cls}
              style={[styles.classChip, active && styles.classChipActive]}
              onPress={() => setSelectedClass(cls === 'All' ? null : cls)}
              activeOpacity={0.7}
            >
              <Text style={[styles.classChipText, active && styles.classChipTextActive]}>
                {cls}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.statsRow}>
        <View style={[styles.statPill, { backgroundColor: 'rgba(22, 163, 74, 0.08)' }]}>
          <View style={[styles.statDot, { backgroundColor: '#16A34A' }]} />
          <Text style={[styles.statText, { color: '#16A34A' }]}>{presentCount} Present</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: 'rgba(220, 38, 38, 0.08)' }]}>
          <View style={[styles.statDot, { backgroundColor: '#DC2626' }]} />
          <Text style={[styles.statText, { color: '#DC2626' }]}>{absentCount} Absent</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: 'rgba(217, 119, 6, 0.08)' }]}>
          <View style={[styles.statDot, { backgroundColor: '#D97706' }]} />
          <Text style={[styles.statText, { color: '#D97706' }]}>{lateCount} Late</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map((student) => (
          <View key={student.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.cardAvatar}>
                <MaterialCommunityIcons name="account" size={20} color="#374151" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{student.name}</Text>
                <Text style={styles.cardMeta}>
                  {student.usn} · {student.department} · {student.academicYear} (Sec {student.section})
                </Text>
                <View style={styles.cardStatusRow}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor(student.status) }]} />
                  <Text style={[styles.statusText, { color: statusColor(student.status) }]}>
                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                  </Text>
                  <Text style={styles.lastSeenText}>· Last seen {student.lastSeen}</Text>
                </View>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                <MaterialCommunityIcons name="phone" size={16} color="#16A34A" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                <MaterialCommunityIcons name="message-text-outline" size={16} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  title: { fontSize: 18, fontFamily: FontFamily.bold, color: '#111827' },
  searchRow: { paddingHorizontal: 16, marginBottom: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 7,
    paddingHorizontal: 10,
    height: 38,
    backgroundColor: '#F9FAFB',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#111827',
    paddingVertical: 0,
  },
  classRow: { paddingHorizontal: 16, marginBottom: 10 },
  classRowContent: { gap: 6 },
  classChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  classChipActive: { backgroundColor: '#111827', borderColor: '#111827' },
  classChipText: { fontSize: 11.5, fontFamily: FontFamily.medium, color: '#4B5563' },
  classChipTextActive: { color: '#FFFFFF', fontFamily: FontFamily.bold },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statText: { fontSize: 11, fontFamily: FontFamily.bold },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cardAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: 13, fontFamily: FontFamily.bold, color: '#111827' },
  cardMeta: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280' },
  cardStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10.5, fontFamily: FontFamily.bold },
  lastSeenText: { fontSize: 10.5, fontFamily: FontFamily.regular, color: '#9CA3AF' },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
