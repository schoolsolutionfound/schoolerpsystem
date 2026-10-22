import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

export interface AdminDashboardStats {
  institutionCode: string;
  institutionName: string;
  institutionType: string;
  subscriptionStatus: string;
  students: number;
  teachers: number;
  totalUsers: number;
  classSections: number;
  subjects: number;
  attendanceSessions: number;
}

type AdminTab = 'dashboard' | 'institution' | 'students' | 'teachers' | 'users' | 'academics' | 'timetable' | 'attendance' | 'announcements' | 'admissions' | 'profile';

interface AdminDashboardViewProps {
  fullName: string;
  stats: AdminDashboardStats | null;
  onNavigateTab: (tab: AdminTab) => void;
  onAddRole?: (role: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ fullName, stats, onNavigateTab, onAddRole, refreshing = false, onRefresh }) => {
  const institutionCode = stats?.institutionCode || 'INST';
  const institutionName = stats?.institutionName || 'My Institution';

  const statItems = [
    { label: 'Students', value: stats?.students ?? 0 },
    { label: 'Teachers', value: stats?.teachers ?? 0 },
    { label: 'Classes', value: stats?.classSections ?? 0 },
    { label: 'Subjects', value: stats?.subjects ?? 0 },
    { label: 'Users', value: stats?.totalUsers ?? 0 },
    { label: 'Sessions', value: stats?.attendanceSessions ?? 0 },
  ];

  const isCollege = stats?.institutionType === 'college';
  const quickAddRoles: { key: string; label: string }[] = isCollege
    ? [
        { key: 'student', label: '+ Student' },
        { key: 'teacher', label: '+ Teacher' },
        { key: 'hod', label: '+ HOD' },
        { key: 'admission_officer', label: '+ Admission Officer' },
        { key: 'parent', label: '+ Parent' },
        { key: 'accountant', label: '+ Accountant' },
        { key: 'librarian', label: '+ Librarian' },
        { key: 'driver', label: '+ Driver' },
      ]
    : [
        { key: 'student', label: '+ Student' },
        { key: 'teacher', label: '+ Teacher' },
        { key: 'principal', label: '+ Principal' },
        { key: 'admin', label: '+ Admin' },
        { key: 'admission_officer', label: '+ Admission Officer' },
        { key: 'parent', label: '+ Parent' },
        { key: 'accountant', label: '+ Accountant' },
        { key: 'librarian', label: '+ Librarian' },
        { key: 'driver', label: '+ Driver' },
      ];

  return (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} />}
    >
      {/* Stats Strip */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionLabel}>OVERVIEW</Text>
        <View style={styles.statsGrid}>
          {statItems.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionsRow}>
          {quickAddRoles.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={styles.actionBtn}
              activeOpacity={0.7}
              onPress={() => (onAddRole ? onAddRole(r.key) : onNavigateTab(r.key === 'principal' || r.key === 'hod' ? 'users' : (r.key as AdminTab)))}
            >
              <Text style={styles.actionText}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Setup Checklist */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SETUP CHECKLIST</Text>
        <View style={styles.checkGrid}>
          {[
            { step: 1, title: 'Academic Structure', sub: 'Departments, years, sections', done: (stats?.classSections ?? 0) > 0, tab: 'institution' as AdminTab },
            { step: 2, title: 'Add Students', sub: 'Register with USN & class', done: (stats?.students ?? 0) > 0, tab: 'students' as AdminTab },
            { step: 3, title: 'Add Teachers', sub: 'Faculty with departments', done: (stats?.teachers ?? 0) > 0, tab: 'teachers' as AdminTab },
            { step: 4, title: 'Build Timetable', sub: 'Classes, subjects & periods', done: false, tab: 'academics' as AdminTab },
          ].map((item) => (
            <TouchableOpacity
              key={item.step}
              style={[styles.checkCard, item.done && styles.checkCardDone]}
              activeOpacity={0.7}
              onPress={() => onNavigateTab(item.tab)}
            >
              <View style={styles.checkCardTop}>
                <View style={[styles.checkNum, item.done && styles.checkNumDone]}>
                  {item.done ? (
                    <MaterialCommunityIcons name="check" size={14} color="#F4C430" />
                  ) : (
                    <Text style={styles.checkNumText}>{item.step}</Text>
                  )}
                </View>
              </View>
              <Text style={[styles.checkCardTitle, item.done && styles.checkCardTextDone]}>{item.title}</Text>
              <Text style={[styles.checkCardSub, item.done && styles.checkCardTextDone]}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollArea: { flex: 1 },
  container: { flexGrow: 1, backgroundColor: '#FFFEFE', paddingBottom: 40 },

  // Sections
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B6B6B',
    letterSpacing: 1.2,
    marginBottom: 12,
    paddingHorizontal: 20,
  },

  // Stats
  statsSection: { marginTop: 24 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
  },
  statCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.extrabold },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#1A1B1C', marginTop: 2, fontFamily: FontFamily.semibold },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    borderColor: '#F4C430',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontSize: 13, fontWeight: '700', color: '#1A1B1C', fontFamily: FontFamily.bold },

  // Checklist
  checkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  checkCard: {
    width: '48%',
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.card,
    padding: 14,
  },
  checkCardDone: {
    backgroundColor: '#1A1B1C',
  },
  checkCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkNum: {
    width: 26,
    height: 26,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1A1B1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkNumText: { fontSize: 12, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  checkNumDone: { borderColor: '#F4C430' },
  checkCardTitle: { fontSize: 13, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.bold },
  checkCardSub: { fontSize: 11, color: '#1A1B1C', marginTop: 3, fontFamily: FontFamily.medium, opacity: 0.7 },
  checkCardTextDone: { color: '#FFFEFE' },
});