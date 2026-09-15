import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
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

  const classes = ['All', 'Class 6 A', 'Class 6 B'];

  const filtered = MOCK_STUDENTS.filter((s) => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.usn.toLowerCase().includes(search.toLowerCase());
    const matchesClass = !selectedClass || selectedClass === 'All' || `${s.class} ${s.section}` === selectedClass;
    return matchesSearch && matchesClass;
  });

  const presentCount = filtered.filter((s) => s.status === 'present').length;
  const absentCount = filtered.filter((s) => s.status === 'absent').length;
  const lateCount = filtered.filter((s) => s.status === 'late').length;

  const statusColor = (status: string) => {
    switch (status) {
      case 'present': return '#16A34A';
      case 'absent': return '#DC3545';
      case 'late': return '#F97316';
      default: return '#9CA3AF';
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
            placeholder="Search by name or USN..."
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classRow} contentContainerStyle={styles.classRowContent}>
        {classes.map((cls) => (
          <TouchableOpacity
            key={cls}
            style={[styles.classChip, (selectedClass === cls || (!selectedClass && cls === 'All')) && styles.classChipActive]}
            onPress={() => setSelectedClass(cls === 'All' ? null : cls)}
          >
            <Text style={[styles.classChipText, (selectedClass === cls || (!selectedClass && cls === 'All')) && styles.classChipTextActive]}>
              {cls}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.statsRow}>
        <View style={[styles.statPill, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
          <View style={[styles.statDot, { backgroundColor: '#16A34A' }]} />
          <Text style={styles.statText}>{presentCount} Present</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: 'rgba(220, 53, 69, 0.1)' }]}>
          <View style={[styles.statDot, { backgroundColor: '#DC3545' }]} />
          <Text style={styles.statText}>{absentCount} Absent</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
          <View style={[styles.statDot, { backgroundColor: '#F97316' }]} />
          <Text style={styles.statText}>{lateCount} Late</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map((student) => (
          <View key={student.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.cardAvatar}>
                <MaterialCommunityIcons name="account" size={20} color="#1A1B1C" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{student.name}</Text>
                <Text style={styles.cardMeta}>{student.usn} · {student.class} {student.section}</Text>
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
              <TouchableOpacity style={styles.actionBtn}>
                <MaterialCommunityIcons name="phone" size={16} color="#16A34A" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <MaterialCommunityIcons name="message-text-outline" size={16} color="#F4C430" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEFE' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#171717' },
  searchRow: { paddingHorizontal: 20, marginBottom: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#171717',
  },
  classRow: { paddingHorizontal: 20, marginBottom: 10 },
  classRowContent: { gap: 8 },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  classChipActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  classChipText: { fontSize: 12, fontFamily: FontFamily.medium, color: '#6B6B6B' },
  classChipTextActive: { color: '#FFFFFF', fontFamily: FontFamily.bold },
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
    paddingVertical: 6,
    borderRadius: 99,
  },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#6B6B6B' },
  list: { paddingHorizontal: 20, paddingBottom: 20, gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: 13, fontFamily: FontFamily.bold, color: '#171717' },
  cardMeta: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  cardStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontFamily: FontFamily.bold },
  lastSeenText: { fontSize: 10, fontFamily: FontFamily.regular, color: '#9CA3AF' },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
