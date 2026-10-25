import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { fetchParentAttendanceApi, fetchParentTimetableApi } from '../../api/academics';
import { ParentHomeHeader } from '../../features/parent/components/ParentHomeHeader';
import { ParentHomeAttendanceCard } from '../../features/parent/components/ParentHomeAttendanceCard';
import { ParentHomeAnnouncements } from '../../features/parent/components/ParentHomeAnnouncements';
import { ParentHomePeriodsList } from '../../features/parent/components/ParentHomePeriodsList';
import { ParentTimetableView } from '../../features/parent/components/ParentTimetableView';
import { ParentAttendanceView } from '../../features/parent/components/ParentAttendanceView';
import { ParentMarksView } from '../../features/parent/components/ParentMarksView';
import { ParentHomeworkView } from '../../features/parent/components/ParentHomeworkView';
import { ParentDrawer } from '../../features/parent/components/ParentDrawer';
import { ParentBusTrackingView } from '../../features/parent/components/ParentBusTrackingView';
import { ParentHomeFeeSummary } from '../../features/parent/components/ParentHomeFeeSummary';
import { ShimmerProvider } from '../../features/parent/components/ShimmerSkeleton';
import { FontFamily } from '../../constants/fonts';
import { UserAnnouncementFeedView } from '../../features/announcements';

type Tab = 'home' | 'attendance' | 'bus' | 'marks' | 'schedule' | 'homework' | 'fees' | 'announcements';

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
  const fullName = useUserStore((state) => state.fullName) || 'Parent';
  const profilePic = useUserStore((state) => state.profilePic);
  const email = useUserStore((state) => state.email) || '';
  const institutionName = useUserStore((state) => state.institutionName) || '';
  const childName = useUserStore((state) => state.childName) || '';
  const linkedStudentUSN = useUserStore((state) => state.linkedStudentUSN) || '';

  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>((tab as Tab) || 'home');
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
      fetchParentAttendanceApi(),
      fetchParentTimetableApi(today),
    ]);

    if (attendanceRes.status === 'fulfilled') {
      const res = attendanceRes.value;
      setOverall(res?.overall || null);
      if (res?.childName) {
        useUserStore.getState().setUserProfile({
          childName: res.childName,
          childId: res.childId || '',
          linkedStudentUSN: res.childUSN || '',
          relation: res.relation || '',
        });
      }
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

    fetchParentAttendanceApi()
      .then((res) => {
        if (mounted) {
          setOverall(res?.overall || null);
          if (res?.childName) {
            useUserStore.getState().setUserProfile({
              childName: res.childName,
              childId: res.childId || '',
              linkedStudentUSN: res.childUSN || '',
              relation: res.relation || '',
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setAttendanceLoading(false);
      });

    const today = new Date().toISOString().slice(0, 10);
    const utcDay = new Date(`${today}T00:00:00Z`).getUTCDay();

    fetchParentTimetableApi(today)
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
      tintColor="#000000"
      colors={['#000000']}
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
              <ParentHomeAttendanceCard
                loading={attendanceLoading || slotsLoading}
                overall={overall}
                currentSlot={currentSlot}
                childName={childName}
              />
              <ParentHomeAnnouncements onPress={() => router.push('/notifications')} />
              <ParentHomePeriodsList
                loading={slotsLoading}
                slots={todaySlots}
                onSchedulePress={() => setActiveTab('schedule')}
              />
            </ScrollView>
          </ShimmerProvider>
        );
      case 'announcements':
        return <UserAnnouncementFeedView />;
      case 'schedule':
        return <ParentTimetableView />;
      case 'attendance':
        return <ParentAttendanceView />;
      case 'marks':
        return <ParentMarksView onBack={() => setActiveTab('home')} />;
      case 'homework':
        return <ParentHomeworkView />;
      case 'bus':
        return <ParentBusTrackingView />;
      case 'fees':
        return <ParentHomeFeeSummary onBack={() => setActiveTab('home')} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {activeTab !== 'marks' && activeTab !== 'fees' && (
          <ParentHomeHeader
            fullName={fullName}
            profilePic={profilePic}
            onMenuPress={() => setDrawerOpen(true)}
            onSettingsPress={() => router.push('/settings')}
            onNotificationsPress={() => router.push('/notifications')}
            onProfilePress={() => router.push('/(parent)/profile')}
            showProfile={activeTab === 'home'}
          />
        )}

        <View style={styles.content}>
          {renderTabContent()}
        </View>

        {/* Bottom Tab Bar matching student design */}
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
                    <View style={styles.centerBtnOuter}>
                      <MaterialCommunityIcons
                        name="bus"
                        size={28}
                        color="#111827"
                      />
                    </View>
                    <Text style={[styles.centerLabel, isActive && styles.centerLabelActive]}>
                      {tab.label}
                    </Text>
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
                      color={isActive ? '#111827' : '#9CA3AF'}
                    />
                  </View>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      <ParentDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSwitchTab={(tab: string) => setActiveTab(tab as Tab)}
        fullName={fullName}
        email={email}
        profilePic={profilePic}
        institutionName={institutionName}
        rollNoOrUSN={linkedStudentUSN}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  safe: { flex: 1 },
  content: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 20, gap: 16 },

  // Tab bar
  tabBarBg: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 14 : 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#F2EFE8',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  tabIconBg: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBgActive: {
    backgroundColor: '#FDC836',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  activeIndicator: {
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FDC836',
    marginTop: 3,
  },

  // Center floating button
  centerBtnWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
    marginTop: -26,
  },
  centerBtnOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FDC836',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  centerLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 4,
  },
  centerLabelActive: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
});
