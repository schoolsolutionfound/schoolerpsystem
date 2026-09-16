import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

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

type AdminTab = 'dashboard' | 'institution' | 'students' | 'teachers' | 'users' | 'academics' | 'timetable' | 'attendance' | 'profile';

interface AdminDashboardViewProps {
  fullName: string;
  stats: AdminDashboardStats | null;
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ fullName, stats, onNavigateTab }) => {
  const institutionCode = stats?.institutionCode || 'INSTITUTION';
  const institutionName = stats?.institutionName || 'My Institution';

  const modules: { key: AdminTab | 'finance'; icon: keyof typeof MaterialCommunityIcons.glyphMap; name: string; sub: string; bg: string; color: string }[] = [
    { key: 'students', icon: 'account-school', name: 'Students', sub: `${stats?.students ?? 0} enrolled`, bg: '#EDE9F6', color: '#7E57C2' },
    { key: 'teachers', icon: 'account-tie', name: 'Teachers', sub: `${stats?.teachers ?? 0} faculty`, bg: '#DCFCE7', color: '#16A34A' },
    { key: 'finance' as any, icon: 'finance', name: 'Finance & Fees', sub: 'Tally, Incomes & Expenses', bg: '#DCFCE7', color: '#16A34A' },
    { key: 'users', icon: 'account-group', name: 'Users', sub: `${stats?.totalUsers ?? 0} accounts`, bg: '#E0F2FE', color: '#0284C7' },
    { key: 'academics', icon: 'school', name: 'Academics', sub: `${stats?.classSections ?? 0} classes`, bg: '#FEF3C7', color: '#D97706' },
    { key: 'timetable', icon: 'timetable', name: 'Timetable', sub: 'Build weekly schedules', bg: '#F3E8FF', color: '#7E57C2' },
    { key: 'attendance', icon: 'calendar-check', name: 'Attendance', sub: 'Track & view classes', bg: '#DCFCE7', color: '#16A34A' },
    { key: 'institution', icon: 'office-building', name: 'Institution', sub: 'Config & structure', bg: '#FCE7F3', color: '#DB2777' },
    { key: 'profile', icon: 'account-circle', name: 'Profile', sub: 'Account settings', bg: '#F3E8FF', color: '#7E57C2' },
  ];

  const openModule = (key: AdminTab | 'finance') => {
    if (key === 'finance') {
      const router = require('expo-router').router;
      router.push('/(accountant)/home');
      return;
    }
    if (key === 'timetable' || key === 'attendance') {
      onNavigateTab('academics');
      return;
    }
    onNavigateTab(key);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.banner}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <MaterialCommunityIcons name="office-building" size={16} color="#7E57C2" />
            <Text style={styles.brandBadgeText}>{institutionCode}</Text>
          </View>
          <View style={styles.subsBadge}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#16A34A" />
            <Text style={styles.subsBadgeText}>{stats?.subscriptionStatus || 'active'}</Text>
          </View>
        </View>
        <Text style={styles.welcomeText}>Welcome back, {fullName}</Text>
        <Text style={styles.subText}>{institutionName} · Maintainer Dashboard</Text>
      </View>

      {/* Live Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#EDE7F6' }]}>
            <MaterialCommunityIcons name="account-school" size={22} color="#7E57C2" />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{stats?.students ?? 0}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="account-tie" size={22} color="#16A34A" />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{stats?.teachers ?? 0}</Text>
            <Text style={styles.statLabel}>Teachers</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
            <MaterialCommunityIcons name="school" size={22} color="#0284C7" />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{stats?.classSections ?? 0}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="book-open-variant" size={22} color="#D97706" />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{stats?.subjects ?? 0}</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#FCE7F3' }]}>
            <MaterialCommunityIcons name="account-group" size={22} color="#DB2777" />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{stats?.totalUsers ?? 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#E8EAF6' }]}>
            <MaterialCommunityIcons name="calendar-check" size={22} color="#3949AB" />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{stats?.attendanceSessions ?? 0}</Text>
            <Text style={styles.statLabel}>Attendance</Text>
          </View>
        </View>
      </View>

      {/* Management Modules */}
      <Text style={styles.sectionTitle}>Management Modules</Text>
      <View style={styles.modulesGrid}>
        {modules.map((m) => (
          <TouchableOpacity key={m.key} style={styles.moduleItem} activeOpacity={0.8} onPress={() => openModule(m.key)}>
            <View style={[styles.moduleIconBox, { backgroundColor: m.bg }]}>
              <MaterialCommunityIcons name={m.icon} size={24} color={m.color} />
            </View>
            <View style={styles.moduleTextContainer}>
              <Text style={styles.moduleName}>{m.name}</Text>
              <Text style={styles.moduleCount} numberOfLines={1}>{m.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Onboarding Shortcuts */}
      <Text style={styles.sectionTitle}>Setup Progress</Text>
      <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateTab('institution')}>
        <View style={[styles.actionIconCircle, { backgroundColor: '#EDE7F6' }]}>
          <MaterialCommunityIcons name="sitemap" size={24} color="#7E57C2" />
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>1. Academic Structure</Text>
          <Text style={styles.actionSubtitle}>Departments, Years, Courses, Sections</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateTab('students')}>
        <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
          <MaterialCommunityIcons name="account-plus" size={24} color="#16A34A" />
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>2. Onboard Students</Text>
          <Text style={styles.actionSubtitle}>Register students with USN, Department & Year</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateTab('teachers')}>
        <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
          <MaterialCommunityIcons name="account-tie" size={24} color="#D97706" />
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>3. Onboard Teachers</Text>
          <Text style={styles.actionSubtitle}>Register faculty with Employee ID & Department</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateTab('academics')}>
        <View style={[styles.actionIconCircle, { backgroundColor: '#E0F2FE' }]}>
          <MaterialCommunityIcons name="calendar-range" size={24} color="#0284C7" />
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>4. Build Timetable</Text>
          <Text style={styles.actionSubtitle}>Classes, Subjects, Periods, Timetable & Attendance</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14, paddingBottom: 40 },
  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE7F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.chip,
  },
  brandBadgeText: { fontSize: 11, fontWeight: '800', color: '#7E57C2' },
  subsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.chip,
  },
  subsBadgeText: { fontSize: 11, fontWeight: '700', color: '#16A34A', textTransform: 'capitalize' },
  welcomeText: { fontSize: 20, fontWeight: '800', color: '#1A202C' },
  subText: { fontSize: 13, color: '#718096', marginTop: 4, lineHeight: 18 },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextContainer: { flexShrink: 1 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1A202C' },
  statLabel: { fontSize: 11, color: '#718096', fontWeight: '500', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A202C', marginTop: 6 },
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moduleIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleTextContainer: { flex: 1 },
  moduleName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  moduleCount: { fontSize: 12, color: '#64748B', marginTop: 2 },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextContainer: { flex: 1, gap: 2 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  actionSubtitle: { fontSize: 12, color: '#718096', lineHeight: 16 },
});