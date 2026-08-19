import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { BorderRadius } from '../../constants/theme';
import { TeacherTimetableView } from '../../features/teacher/components/TeacherTimetableView';
import { AttendanceMarkingView } from '../../features/teacher/components/AttendanceMarkingView';
import { fetchTeacherTimetableApi } from '../../api/academics';

type Tab = 'home' | 'schedule' | 'attendance' | 'profile';

export default function TeacherHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Teacher';
  const institutionName = useUserStore((state) => state.institutionName) || '';
  const institutionCode = useUserStore((state) => state.institutionCode) || '';

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [activeSlot, setActiveSlot] = useState<{ slotId: string; subjectName: string } | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  const loadTodayCount = useCallback(async () => {
    setLoadingCount(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const res = await fetchTeacherTimetableApi(date);
      setTodayCount(res?.periods?.length || 0);
    } catch (err: any) {
      console.warn('[Teacher Home] Could not load today schedule:', err.message);
    } finally {
      setLoadingCount(false);
    }
  }, []);

  useEffect(() => {
    loadTodayCount();
  }, [loadTodayCount]);

  const openSlot = (slotId: string, subjectName: string) => {
    setActiveSlot({ slotId, subjectName });
    setActiveTab('attendance');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {activeTab === 'home' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Greeting Banner */}
            <View style={styles.banner}>
              <View>
                <Text style={styles.greeting}>Hello, {fullName}</Text>
                <Text style={styles.schoolName}>{institutionName || institutionCode || 'My Institution'}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(teacher)/profile')} style={styles.avatarBtn}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{fullName.substring(0, 2).toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Today stat */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                  <MaterialCommunityIcons name="calendar-check" size={22} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.statValue}>{loadingCount ? '—' : todayCount}</Text>
                  <Text style={styles.statLabel}>Classes Today</Text>
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.iconCircle, { backgroundColor: '#EDE7F6' }]}>
                  <MaterialCommunityIcons name="school" size={22} color="#7E57C2" />
                </View>
                <View>
                  <Text style={styles.statValue}>{institutionCode || '—'}</Text>
                  <Text style={styles.statLabel}>Institution</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('schedule')}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#EDE7F6' }]}>
                <MaterialCommunityIcons name="timetable" size={24} color="#7E57C2" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>My Schedule</Text>
                <Text style={styles.actionSubtitle}>View today&apos;s periods and upcoming classes</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => setActiveTab('attendance')}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons name="checkbox-marked-circle-plus-outline" size={24} color="#16A34A" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Mark Attendance</Text>
                <Text style={styles.actionSubtitle}>Take roll for your assigned classes</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/teacher-timetable')}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="calendar-edit" size={24} color="#D97706" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Build Timetable</Text>
                <Text style={styles.actionSubtitle}>Plan your class teacher&apos;s weekly timetable</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/notifications')}>
              <View style={[styles.actionIconCircle, { backgroundColor: '#FCE7F3' }]}>
                <MaterialCommunityIcons name="bell" size={24} color="#DB2777" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Notifications</Text>
                <Text style={styles.actionSubtitle}>School updates and announcements</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </ScrollView>
        )}

        {activeTab === 'schedule' && <TeacherTimetableView onOpenAttendance={openSlot} />}

        {activeTab === 'attendance' && (
          activeSlot ? (
            <AttendanceMarkingView
              slotId={activeSlot.slotId}
              subjectName={activeSlot.subjectName}
              onSaved={() => { setActiveSlot(null); loadTodayCount(); }}
            />
          ) : (
            <TeacherTimetableView onOpenAttendance={openSlot} />
          )
        )}

        {activeTab === 'profile' && (
          <View style={styles.centerBox}>
            <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(teacher)/profile')}>
              <MaterialCommunityIcons name="account-circle" size={48} color="#7E57C2" />
              <Text style={styles.profileBtnText}>Open Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
            <MaterialCommunityIcons name="home" size={22} color={activeTab === 'home' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveSlot(null); setActiveTab('schedule'); }}>
            <MaterialCommunityIcons name="calendar-outline" size={22} color={activeTab === 'schedule' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'schedule' && styles.tabLabelActive]}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('attendance')}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={22} color={activeTab === 'attendance' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'attendance' && styles.tabLabelActive]}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
            <MaterialCommunityIcons name="account-circle-outline" size={22} color={activeTab === 'profile' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 20, fontWeight: '800', color: '#1A202C' },
  schoolName: { fontSize: 13, color: '#718096', marginTop: 4 },
  avatarBtn: { padding: 4 },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#7E57C2' },
  statsRow: { flexDirection: 'row', gap: 10 },
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
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
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
  actionIconCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  actionTextContainer: { flex: 1, gap: 2 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  actionSubtitle: { fontSize: 12, color: '#718096', lineHeight: 16 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileBtn: { alignItems: 'center', gap: 8 },
  profileBtnText: { fontSize: 14, fontWeight: '700', color: '#7E57C2' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingBottom: 12,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: 2 },
  tabLabelActive: { color: '#7E57C2', fontWeight: '700' },
});