import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Platform, RefreshControl } from 'react-native';
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
import { StudentMarksView } from '../../features/student/components/StudentMarksView';
import { StudentHomeworkView } from '../../features/student/components/StudentHomeworkView';
import { StudentDrawer } from '../../features/student/components/StudentDrawer';
import { StudentBusTrackingView } from '../../features/student/components/StudentBusTrackingView';
import { ShimmerProvider } from '../../features/student/components/ShimmerSkeleton';
import { FontFamily } from '../../constants/fonts';

type Tab = 'home' | 'attendance' | 'bus' | 'marks' | 'schedule' | 'homework';

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

const TABS: { key: Tab; label: string; icon: string; iconFilled: string }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconFilled: 'home' },
  { key: 'attendance', label: 'Attendance', icon: 'book-outline', iconFilled: 'book' },
  { key: 'bus', label: 'Bus', icon: 'bus', iconFilled: 'bus' },
  { key: 'marks', label: 'Marks', icon: 'certificate-outline', iconFilled: 'certificate' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar-outline', iconFilled: 'calendar' },
];

export default function HomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Student';
  const profilePic = useUserStore((state) => state.profilePic);
  const email = useUserStore((state) => state.email) || '';
  const institutionName = useUserStore((state) => state.institutionName) || '';
  const rollNoOrUSN = useUserStore((state) => state.rollNoOrUSN) || '';

  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [overall, setOverall] = useState<{ present: number; total: number; percentage: number } | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [todaySlots, setTodaySlots] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const utcDay = new Date(`${today}T00:00:00Z`).getUTCDay();

    const [attendanceRes, timetableRes] = await Promise.allSettled([
      fetchStudentAttendanceHistoryApi(),
      fetchMyTimetableApi(today),
    ]);

    if (attendanceRes.status === 'fulfilled') {
      setOverall(attendanceRes.value?.overall || null);
      setAttendanceLoading(false);
    } else {
      setAttendanceLoading(false);
    }
    if (timetableRes.status === 'fulfilled') {
      const all = timetableRes.value?.slots || [];
      setTodaySlots(all.filter((s: any) => s.dayOfWeek === utcDay));
      setSlotsLoading(false);
    } else {
      setSlotsLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setAttendanceLoading(true);
    setSlotsLoading(true);
    try {
      await fetchAll();
    } finally {
      setRefreshing(false);
    }
  }, [fetchAll]);

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

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#1A1B1C"
      colors={['#1A1B1C']}
      progressBackgroundColor="#FFFFFF"
    />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ShimmerProvider>
            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              refreshControl={refreshControl}
            >
              <StudentHomeAttendanceCard loading={attendanceLoading || slotsLoading} overall={overall} currentSlot={currentSlot} />
              <StudentHomeAnnouncements />
              <StudentHomePeriodsList loading={slotsLoading} slots={todaySlots} />
            </ScrollView>
          </ShimmerProvider>
        );
      case 'schedule':
        return <StudentTimetableView />;
      case 'attendance':
        return <StudentAttendanceView />;
      case 'marks':
        return <StudentMarksView />;
      case 'homework':
        return <StudentHomeworkView />;
      case 'bus':
        return <StudentBusTrackingView />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <StudentHomeHeader
          fullName={fullName}
          profilePic={profilePic}
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => router.push('/(student)/profile')}
        />

        <View style={styles.content}>
          {renderTabContent()}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.tabBarBg}>
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const isCenter = tab.key === 'bus';
              const isActive = activeTab === tab.key;

              if (isCenter) {
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={styles.centerBtnWrap}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.centerBtnRing, isActive && styles.centerBtnRingActive]}>
                      <View style={[styles.centerBtn, isActive && styles.centerBtnActive]}>
                          <MaterialCommunityIcons
                          name={tab.iconFilled as any}
                          size={26}
                          color={isActive ? '#F4C430' : '#E8E5DC'}
                        />
                      </View>
                    </View>
                    <Text style={[styles.centerLabel, isActive && styles.centerLabelActive]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabIconBg, isActive && styles.tabIconBgActive]}>
                    <MaterialCommunityIcons
                      name={isActive ? (tab.iconFilled as any) : (tab.icon as any)}
                      size={22}
                      color={isActive ? '#1A1B1C' : '#9CA3AF'}
                    />
                  </View>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      <StudentDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fullName={fullName}
        email={email}
        profilePic={profilePic}
        institutionName={institutionName}
        rollNoOrUSN={rollNoOrUSN}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEFE' },
  safe: { flex: 1 },
  content: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 16 },

  // Placeholder
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  placeholderTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: '#1A1B1C',
    marginTop: 12,
    marginBottom: 4,
  },
  placeholderSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Tab hero block (LeetCode-style dark)
  heroBlock: {
    backgroundColor: '#1A1B1C',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2B2C',
    gap: 6,
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    marginTop: 6,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#8A8A8A',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    marginTop: 14,
    backgroundColor: '#232425',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  statNum: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#8A8A8A', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#2F3031', marginVertical: 4 },

  // Tab bar
  tabBarBg: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  tabIconBg: {
    width: 44,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBgActive: {
    backgroundColor: '#F4C430',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },

  // Center floating button
  centerBtnWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
    marginTop: -28,
  },
  centerBtnRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  centerBtnRingActive: {
    borderColor: '#F4C430',
    shadowColor: '#F4C430',
    shadowOpacity: 0.35,
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtnActive: {
    backgroundColor: '#171717',
  },
  centerLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
    marginTop: 5,
  },
  centerLabelActive: {
    color: '#F4C430',
    fontFamily: FontFamily.bold,
  },
});
