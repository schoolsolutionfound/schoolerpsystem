import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

interface AdminDashboardViewProps {
  fullName: string;
  institutionName: string;
  institutionCode: string;
  studentCount: number;
  teacherCount: number;
  onNavigateTab: (tab: 'dashboard' | 'institution' | 'students' | 'teachers' | 'profile') => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  fullName,
  institutionName,
  institutionCode,
  studentCount,
  teacherCount,
  onNavigateTab,
}) => {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.banner}>
        <View style={styles.brandBadge}>
          <MaterialCommunityIcons name="office-building" size={20} color="#7E57C2" />
          <Text style={styles.brandBadgeText}>{institutionCode || 'INSTITUTION'}</Text>
        </View>
        <Text style={styles.welcomeText}>Welcome back, {fullName}</Text>
        <Text style={styles.subText}>{institutionName} Administrative Workspace</Text>
      </View>

      {/* High-Level Stat Cards */}
      <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#EDE7F6' }]}>
              <MaterialCommunityIcons name="account-school" size={22} color="#7E57C2" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>{studentCount}</Text>
              <Text style={styles.statLabel} numberOfLines={2}>Enrolled Students</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="human-male-board" size={22} color="#0284C7" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>{teacherCount}</Text>
              <Text style={styles.statLabel} numberOfLines={2}>Active Teachers</Text>
            </View>
          </View>
      </View>

      {/* Quick Action Shortcuts */}
      <Text style={styles.sectionTitle}>Onboarding Shortcuts</Text>

      <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateTab('institution')}>
        <View style={[styles.actionIconCircle, { backgroundColor: '#EDE7F6' }]}>
          <MaterialCommunityIcons name="sitemap" size={24} color="#7E57C2" />
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>1. Academic Structure Setup</Text>
          <Text style={styles.actionSubtitle}>Configure Departments, Academic Years, Courses, and Sections</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateTab('students')}>
        <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
          <MaterialCommunityIcons name="account-plus" size={24} color="#16A34A" />
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>2. Onboard Students</Text>
          <Text style={styles.actionSubtitle}>Manually register students and assign USN, Department, & Year</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateTab('teachers')}>
        <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
          <MaterialCommunityIcons name="account-tie" size={24} color="#D97706" />
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>3. Onboard Teachers</Text>
          <Text style={styles.actionSubtitle}>Register faculty members with Employee ID and Department</Text>
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
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE7F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.chip,
    marginBottom: 10,
  },
  brandBadgeText: { fontSize: 11, fontWeight: '800', color: '#7E57C2' },
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
