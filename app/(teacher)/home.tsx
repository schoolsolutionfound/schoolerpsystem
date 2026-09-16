import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { fetchTeacherTimetableApi } from '../../api/academics';
import { TeacherHomeHeader } from '../../features/teacher/components/TeacherHomeHeader';
import { TeacherDonutCard } from '../../features/teacher/components/TeacherDonutCard';
import { TeacherWeeklyBarCard } from '../../features/teacher/components/TeacherWeeklyBarCard';
import { TeacherHomeAnnouncements } from '../../features/teacher/components/TeacherHomeAnnouncements';
import { TeacherHomePeriodsList } from '../../features/teacher/components/TeacherHomePeriodsList';
import { TeacherTimetableView } from '../../features/teacher/components/TeacherTimetableView';
import { AttendanceMarkingView } from '../../features/teacher/components/AttendanceMarkingView';
import { TeacherMarksView } from '../../features/teacher/components/TeacherMarksView';
import { TeacherHomeworkView } from '../../features/teacher/components/TeacherHomeworkView';
import { TeacherChatView } from '../../features/teacher/components/TeacherChatView';
import { TeacherLocateStudentsView } from '../../features/teacher/components/TeacherLocateStudentsView';
import { ClassAttendanceReport } from '../../features/teacher/components/ClassAttendanceReport';
import { TeacherDrawer } from '../../features/teacher/components/TeacherDrawer';
import { ShimmerProvider } from '../../features/student/components/ShimmerSkeleton';
import { FontFamily } from '../../constants/fonts';

type Tab = 'home' | 'schedule' | 'attendance' | 'marks' | 'reports' | 'homework' | 'chat' | 'locate' | 'profile';

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

function getWeekDates(): string[] {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const mondayOffset = utcDay === 0 ? -6 : 1 - utcDay;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + mondayOffset);
  return [0, 1, 2, 3, 4].map((i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const TABS: { key: Tab; label: string; icon: string; iconFilled: string }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconFilled: 'home' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar-outline', iconFilled: 'calendar' },
  { key: 'attendance', label: 'Attendance', icon: 'clipboard-check-outline', iconFilled: 'clipboard-check' },
  { key: 'marks', label: 'Marks', icon: 'certificate-outline', iconFilled: 'certificate' },
  { key: 'reports', label: 'Reports', icon: 'chart-bar', iconFilled: 'chart-bar' },
];

export default function TeacherHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Teacher';
  const profilePic = useUserStore((state) => state.profilePic);
  const email = useUserStore((state) => state.email) || '';
  const institutionName = useUserStore((state) => state.institutionName) || '';

  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>((tab as Tab) || 'home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ slotId: string; subjectName: string } | null>(null);

  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [todaySlots, setTodaySlots] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [weekData, setWeekData] = useState<number[]>([0, 0, 0, 0, 0]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const utcDay = new Date(`${today}T00:00:00Z`).getUTCDay();

    try {
      const weekDates = getWeekDates();
      const results = await Promise.allSettled(
        weekDates.map((d) => fetchTeacherTimetableApi(d))
      );

      const todayRes = results[0]?.status === 'fulfilled' ? results[0].value : null;
      const periods = todayRes?.periods || [];
      setTodayCount(periods.length);
      setTodaySlots(periods.filter((s: any) => s.dayOfWeek === utcDay));

      const wData = results.map((r) =>
        r.status === 'fulfilled' ? (r.value?.periods?.length || 0) : 0
      );
      setWeekData(wData);
    } catch (err: any) {
      console.warn('[Teacher Home] Could not load schedule:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      await fetchAll();
    } finally {
      setRefreshing(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (activeTab === 'home') {
      setCompletedCount(0);
    }
  }, [activeTab]);

  const currentSlot = findCurrentSlot(todaySlots);

  const openSlot = (slotId: string, subjectName: string) => {
    setActiveSlot({ slotId, subjectName });
    setActiveTab('attendance');
  };

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
              <TeacherDonutCard
                completed={completedCount}
                total={todayCount}
                loading={loading}
              />
              <TeacherWeeklyBarCard weekData={weekData} loading={loading} />
              <TeacherHomeAnnouncements />
              <TeacherHomePeriodsList
                loading={loading}
                slots={todaySlots}
                onMarkAttendance={openSlot}
              />
            </ScrollView>
          </ShimmerProvider>
        );
      case 'schedule':
        return <TeacherTimetableView onOpenAttendance={openSlot} />;
      case 'attendance':
        return activeSlot ? (
          <AttendanceMarkingView
            slotId={activeSlot.slotId}
            subjectName={activeSlot.subjectName}
            onSaved={() => {
              setCompletedCount((c) => c + 1);
              setActiveSlot(null);
              fetchAll();
            }}
          />
        ) : (
          <TeacherTimetableView onOpenAttendance={openSlot} />
        );
      case 'marks':
        return <TeacherMarksView />;
      case 'homework':
        return <TeacherHomeworkView />;
      case 'chat':
        return <TeacherChatView />;
      case 'locate':
        return <TeacherLocateStudentsView />;
      case 'reports':
        return <ClassAttendanceReport />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <TeacherHomeHeader
          fullName={fullName}
          profilePic={profilePic}
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => router.push('/(teacher)/profile')}
        />

        <View style={styles.content}>
          {renderTabContent()}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.tabBarBg}>
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const isCenter = tab.key === 'attendance';
              const isActive = activeTab === tab.key;

              if (isCenter) {
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={styles.centerBtnWrap}
                    onPress={() => {
                      setActiveSlot(null);
                      setActiveTab(tab.key);
                    }}
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
                  onPress={() => {
                    if (tab.key === 'schedule') setActiveSlot(null);
                    setActiveTab(tab.key);
                  }}
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

      <TeacherDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fullName={fullName}
        email={email}
        profilePic={profilePic}
        institutionName={institutionName}
        activeTab={activeTab}
        onTabSwitch={(tab: Tab) => {
          setDrawerOpen(false);
          setTimeout(() => {
            if (tab === 'schedule') setActiveSlot(null);
            setActiveTab(tab);
          }, 120);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEFE' },
  safe: { flex: 1 },
  content: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 16 },

  // Center box
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 40 },
  centerTitle: { fontSize: 17, fontWeight: '800', color: '#171717', marginTop: 4 },
  centerSub: { fontSize: 13, color: '#6B6B6B', textAlign: 'center', lineHeight: 18 },
  profileBtn: { alignItems: 'center', gap: 8 },
  profileBtnText: { fontSize: 14, fontWeight: '700', color: '#F4C430' },

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
