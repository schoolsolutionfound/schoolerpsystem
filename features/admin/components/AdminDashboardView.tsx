import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
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

type AdminTab = 'dashboard' | 'institution' | 'students' | 'teachers' | 'users' | 'academics' | 'timetable' | 'attendance' | 'profile';

interface AdminDashboardViewProps {
  fullName: string;
  stats: AdminDashboardStats | null;
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ fullName, stats, onNavigateTab }) => {
  const institutionCode = stats?.institutionCode || 'INST';
  const institutionName = stats?.institutionName || 'My Institution';

  const statItems = [
    { label: 'Students', value: stats?.students ?? 0, icon: 'account-school' as const, accent: '#F4C430', bg: '#FFF8E1' },
    { label: 'Teachers', value: stats?.teachers ?? 0, icon: 'human-male-board' as const, accent: '#16A34A', bg: '#ECFDF5' },
    { label: 'Classes', value: stats?.classSections ?? 0, icon: 'google-classroom' as const, accent: '#6366F1', bg: '#EEF2FF' },
    { label: 'Subjects', value: stats?.subjects ?? 0, icon: 'book-open-page-variant' as const, accent: '#D97706', bg: '#FFFBEB' },
    { label: 'Users', value: stats?.totalUsers ?? 0, icon: 'account-group' as const, accent: '#DB2777', bg: '#FDF2F8' },
    { label: 'Sessions', value: stats?.attendanceSessions ?? 0, icon: 'calendar-check' as const, accent: '#0891B2', bg: '#ECFEFF' },
  ];

  const modules: { key: AdminTab; icon: keyof typeof MaterialCommunityIcons.glyphMap; name: string; count: string; accent: string; bg: string }[] = [
    { key: 'students', icon: 'account-school', name: 'Students', count: `${stats?.students ?? 0} enrolled`, accent: '#F4C430', bg: '#FFF8E1' },
    { key: 'teachers', icon: 'human-male-board', name: 'Teachers', count: `${stats?.teachers ?? 0} faculty`, accent: '#16A34A', bg: '#ECFDF5' },
    { key: 'users', icon: 'account-group', name: 'Users', count: `${stats?.totalUsers ?? 0} accounts`, accent: '#DB2777', bg: '#FDF2F8' },
    { key: 'academics', icon: 'school', name: 'Academics', count: `${stats?.classSections ?? 0} classes`, accent: '#6366F1', bg: '#EEF2FF' },
    { key: 'timetable', icon: 'timetable', name: 'Timetable', count: 'Weekly schedule', accent: '#D97706', bg: '#FFFBEB' },
    { key: 'attendance', icon: 'calendar-check', name: 'Attendance', count: 'Track & report', accent: '#0891B2', bg: '#ECFEFF' },
    { key: 'institution', icon: 'office-building', name: 'Institution', count: 'Config & setup', accent: '#8B5CF6', bg: '#F5F3FF' },
    { key: 'profile', icon: 'cog', name: 'Settings', count: 'Account & prefs', accent: '#6B7280', bg: '#F9FAFB' },
  ];

  const openModule = (key: AdminTab) => {
    if (key === 'timetable' || key === 'attendance') {
      onNavigateTab('academics');
      return;
    }
    onNavigateTab(key);
  };

  return (
    <ScrollView style={styles.scrollArea} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Stats Strip */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionLabel}>OVERVIEW</Text>
        <View style={styles.statsGrid}>
          {statItems.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statAccent, { backgroundColor: s.accent }]} />
              <View style={[styles.statIconWrap, { backgroundColor: s.bg }]}>
                <MaterialCommunityIcons name={s.icon} size={18} color={s.accent} />
              </View>
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
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => onNavigateTab('students')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FFF8E1' }]}>
              <MaterialCommunityIcons name="account-plus" size={20} color="#F4C430" />
            </View>
            <Text style={styles.actionText}>Add Student</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => onNavigateTab('teachers')}>
            <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
              <MaterialCommunityIcons name="account-plus" size={20} color="#16A34A" />
            </View>
            <Text style={styles.actionText}>Add Teacher</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => onNavigateTab('academics')}>
            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
              <MaterialCommunityIcons name="calendar-plus" size={20} color="#6366F1" />
            </View>
            <Text style={styles.actionText}>Timetable</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7} onPress={() => onNavigateTab('institution')}>
            <View style={[styles.actionIcon, { backgroundColor: '#F5F3FF' }]}>
              <MaterialCommunityIcons name="cog" size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.actionText}>Setup</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modules Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>MODULES</Text>
        <View style={styles.modulesGrid}>
          {modules.map((m) => (
            <TouchableOpacity key={m.key} style={styles.moduleCard} activeOpacity={0.7} onPress={() => openModule(m.key)}>
              <View style={[styles.moduleIconWrap, { backgroundColor: m.bg }]}>
                <MaterialCommunityIcons name={m.icon} size={22} color={m.accent} />
              </View>
              <Text style={styles.moduleName}>{m.name}</Text>
              <Text style={styles.moduleCount}>{m.count}</Text>
              <View style={[styles.moduleAccentLine, { backgroundColor: m.accent }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Setup Checklist */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SETUP CHECKLIST</Text>
        <View style={styles.checklistCard}>
          {[
            { step: '1', title: 'Academic Structure', sub: 'Departments, years, sections', done: (stats?.classSections ?? 0) > 0, tab: 'institution' as AdminTab, accent: '#F4C430' },
            { step: '2', title: 'Add Students', sub: 'Register with USN & class', done: (stats?.students ?? 0) > 0, tab: 'students' as AdminTab, accent: '#16A34A' },
            { step: '3', title: 'Add Teachers', sub: 'Faculty with departments', done: (stats?.teachers ?? 0) > 0, tab: 'teachers' as AdminTab, accent: '#6366F1' },
            { step: '4', title: 'Build Timetable', sub: 'Classes, subjects & periods', done: false, tab: 'academics' as AdminTab, accent: '#D97706' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.checkItem} activeOpacity={0.7} onPress={() => onNavigateTab(item.tab)}>
              <View style={[styles.checkStep, item.done ? { backgroundColor: item.accent } : { borderColor: '#D1D5DB' }]}>
                {item.done ? (
                  <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.checkStepNum, { color: '#9CA3AF' }]}>{item.step}</Text>
                )}
              </View>
              <View style={styles.checkTextWrap}>
                <Text style={[styles.checkTitle, item.done && { color: '#6B7280' }]}>{item.title}</Text>
                <Text style={styles.checkSub}>{item.sub}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#D1D5DB" />
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
  statAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    height: '100%',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.extrabold },
  statLabel: { fontSize: 11, color: '#6B6B6B', marginTop: 2, fontFamily: FontFamily.medium },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontSize: 11, fontWeight: '600', color: '#1A1B1C', fontFamily: FontFamily.semibold },

  // Modules
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moduleCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  moduleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  moduleName: { fontSize: 14, fontWeight: '700', color: '#1A1B1C', fontFamily: FontFamily.bold },
  moduleCount: { fontSize: 12, color: '#6B6B6B', marginTop: 3, fontFamily: FontFamily.regular },
  moduleAccentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 3,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },

  // Checklist
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F1EA',
  },
  checkStep: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkStepNum: { fontSize: 12, fontWeight: '700', fontFamily: FontFamily.bold, color: '#9CA3AF' },
  checkTextWrap: { flex: 1 },
  checkTitle: { fontSize: 14, fontWeight: '600', color: '#1A1B1C', fontFamily: FontFamily.semibold },
  checkSub: { fontSize: 12, color: '#6B6B6B', marginTop: 2, fontFamily: FontFamily.regular },
});
