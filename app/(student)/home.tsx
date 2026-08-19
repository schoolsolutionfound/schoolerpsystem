import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { fetchMyTimetableApi, fetchStudentAttendanceHistoryApi } from '../../api/academics';
import { StudentHomeHeader } from '../../features/student/components/StudentHomeHeader';
import { StudentHomeAttendanceCard } from '../../features/student/components/StudentHomeAttendanceCard';
import { StudentHomeAnnouncements } from '../../features/student/components/StudentHomeAnnouncements';
import { StudentHomePeriodsList } from '../../features/student/components/StudentHomePeriodsList';
import { StudentTimetableView } from '../../features/student/components/StudentTimetableView';
import { StudentAttendanceView } from '../../features/student/components/StudentAttendanceView';

function toMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const suffix = (m[3] || '').toUpperCase();
  if (suffix === 'PM' && h < 12) h += 12;
  if (suffix === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function findCurrentSlot(slots: any[]): any | undefined {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return slots.find((s) => {
    const start = toMinutes(s?.period?.startTime);
    const end = toMinutes(s?.period?.endTime);
    return start !== null && end !== null && nowMin >= start && nowMin < end;
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Student';
  const profilePic = useUserStore((state) => state.profilePic);

  const [activeTab, setActiveTab] = useState<'home' | 'attendance' | 'schedule' | 'reports'>('home');

  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [overall, setOverall] = useState<{ present: number; total: number; percentage: number } | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [todaySlots, setTodaySlots] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    fetchStudentAttendanceHistoryApi()
      .then((res) => {
        if (mounted) setOverall(res?.overall || null);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setAttendanceLoading(false);
      });

    const today = new Date().toISOString().slice(0, 10);
    const utcDay = new Date(`${today}T00:00:00Z`).getUTCDay();

    fetchMyTimetableApi(today)
      .then((res) => {
        if (mounted) {
          const all = res?.slots || [];
          setTodaySlots(all.filter((s: any) => s.dayOfWeek === utcDay));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setSlotsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const currentSlot = findCurrentSlot(todaySlots);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <StudentHomeHeader
          fullName={fullName}
          profilePic={profilePic}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => router.push('/(student)/profile')}
        />

        {activeTab === 'home' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <StudentHomeAttendanceCard loading={attendanceLoading || slotsLoading} overall={overall} currentSlot={currentSlot} />
            <StudentHomeAnnouncements />
            <StudentHomePeriodsList loading={slotsLoading} slots={todaySlots} />
          </ScrollView>
        )}

        {activeTab === 'schedule' && <StudentTimetableView />}
        {activeTab === 'attendance' && <StudentAttendanceView />}
        {activeTab === 'reports' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <StudentHomeAnnouncements />
          </ScrollView>
        )}

        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
            <MaterialCommunityIcons name="home" size={22} color={activeTab === 'home' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('attendance')}>
            <MaterialCommunityIcons name="account-outline" size={22} color={activeTab === 'attendance' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'attendance' && styles.tabLabelActive]}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('schedule')}>
            <MaterialCommunityIcons name="calendar-outline" size={22} color={activeTab === 'schedule' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'schedule' && styles.tabLabelActive]}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('reports')}>
            <MaterialCommunityIcons name="chart-bar" size={22} color={activeTab === 'reports' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'reports' && styles.tabLabelActive]}>Reports</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 16 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: 2 },
  tabLabelActive: { color: '#7E57C2', fontWeight: '700' },
});
