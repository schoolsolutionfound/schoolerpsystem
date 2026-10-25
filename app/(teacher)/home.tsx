import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '../../features/teacher/components/common/Icons';
import { useUserStore } from '../../store/useUserStore';
import { fetchTeacherTimetableApi, fetchAttendanceForSlotApi } from '../../api/academics';
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
import { TeacherReportsView } from '../../features/teacher/components/TeacherReportsView';
import { TeacherDrawer } from '../../features/teacher/components/TeacherDrawer';
import { TeacherProfileView } from '../../features/teacher/components/profile/TeacherProfileView';
import { TeacherAttendanceView } from '../../features/teacher/components/TeacherAttendanceView';
import { TeacherLeaveView } from '../../features/teacher/components/TeacherLeaveView';
import { TeacherLibraryView } from '../../features/teacher/components/TeacherLibraryView';
import { TeacherSettingsView } from '../../features/teacher/components/TeacherSettingsView';
import { TeacherShimmerProvider } from '../../features/teacher/components/common/TeacherShimmer';
import { TeacherHomeSkeleton } from '../../features/teacher/components/skeletons/TeacherHomeSkeleton';
import { FontFamily } from '../../constants/fonts';
import { AdminAnnouncementsView, UserAnnouncementFeedView } from '../../features/announcements';
import { useAttendanceStore } from '../../features/teacher/services/attendanceStore';

type Tab = 'home' | 'schedule' | 'attendance' | 'marks' | 'reports' | 'homework' | 'library' | 'chat' | 'locate' | 'announcements' | 'announcements-manage' | 'profile' | 'leave' | 'teacher-attendance' | 'settings';

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
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline', iconFilled: 'account-circle' },
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
  const [activeSlot, setActiveSlot] = useState<{
    slotId: string;
    subjectName: string;
    className?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [todaySlots, setTodaySlots] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [weekData, setWeekData] = useState<number[]>([0, 0, 0, 0, 0]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    const utcDay = now.getUTCDay();

    try {
      const weekDates = getWeekDates();
      const results = await Promise.allSettled(
        weekDates.map((d) => fetchTeacherTimetableApi(d))
      );

      const todayIndex = weekDates.indexOf(today);
      const todayRes =
        todayIndex >= 0 && results[todayIndex]?.status === 'fulfilled'
          ? (results[todayIndex] as PromiseFulfilledResult<any>).value
          : results[0]?.status === 'fulfilled'
          ? results[0].value
          : null;

      const rawPeriods = todayRes?.periods || [];

      // Check real attendance status if periods exist
      let markedCount = 0;
      if (rawPeriods.length > 0) {
        try {
          const checks = await Promise.allSettled(
            rawPeriods.map((s: any) => fetchAttendanceForSlotApi(s.id, today))
          );
          const apiMarked = checks.filter(
            (c) => c.status === 'fulfilled' && (c.value as any)?.record
          ).length;
          const storeMarked = rawPeriods.filter((s: any) =>
            useAttendanceStore
              .getState()
              .isPeriodMarked(
                s.id,
                today,
                s.classSectionName || s.classSection?.name,
                s.subject?.name || s.subjectName
              )
          ).length;
          markedCount = Math.max(apiMarked, storeMarked);
        } catch {
          markedCount = rawPeriods.filter((s: any) =>
            useAttendanceStore
              .getState()
              .isPeriodMarked(
                s.id,
                today,
                s.classSectionName || s.classSection?.name,
                s.subject?.name || s.subjectName
              )
          ).length;
        }
      }

      const wData = results.map((r) =>
        r.status === 'fulfilled' ? (r.value?.periods?.length || 0) : 0
      );

      if (rawPeriods.length > 0 || wData.some((v) => v > 0)) {
        setTodaySlots(rawPeriods);
        setTodayCount(rawPeriods.length);
        setCompletedCount((prev) => Math.max(prev, markedCount));
        setWeekData(wData);
      } else {
        // Fallback demo schedule so dashboard is dynamic and interactive
        const fallback = [
          {
            id: 'demo-slot-1',
            dayOfWeek: utcDay || 1,
            period: { label: '1st Period', startTime: '08:30 AM', endTime: '09:20 AM' },
            subject: { name: 'Maths' },
            classSectionName: 'Class 10-A',
            room: '204',
          },
          {
            id: 'demo-slot-2',
            dayOfWeek: utcDay || 1,
            period: { label: '2nd Period', startTime: '09:30 AM', endTime: '10:20 AM' },
            subject: { name: 'Physics' },
            classSectionName: 'Class 11-B',
            room: 'Lab 1',
          },
          {
            id: 'demo-slot-3',
            dayOfWeek: utcDay || 1,
            period: { label: '3rd Period', startTime: '10:45 AM', endTime: '11:35 AM' },
            subject: { name: 'Algebra' },
            classSectionName: 'Class 9-C',
            room: '105',
          },
          {
            id: 'demo-slot-4',
            dayOfWeek: utcDay || 1,
            period: { label: '4th Period', startTime: '11:45 AM', endTime: '12:35 PM' },
            subject: { name: 'Geometry' },
            classSectionName: 'Class 10-B',
            room: 'Hall B',
          },
          {
            id: 'demo-slot-5',
            dayOfWeek: utcDay || 1,
            period: { label: '5th Period', startTime: '01:30 PM', endTime: '02:20 PM' },
            subject: { name: 'Chemistry' },
            classSectionName: 'Class 12-A',
            room: '302',
          },
        ];

        const fallbackMarked = fallback.filter((s: any) =>
          useAttendanceStore
            .getState()
            .isPeriodMarked(s.id, today, s.classSectionName, s.subject?.name)
        ).length;

        setTodaySlots(fallback);
        setTodayCount(fallback.length);
        setCompletedCount(fallbackMarked);
        setWeekData([5, 4, 6, 5, 4]);
      }
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

  const currentSlot = findCurrentSlot(todaySlots);

  const openSlot = (slotOrId: any, subjectName?: string, className?: string) => {
    if (typeof slotOrId === 'object' && slotOrId !== null) {
      const sId = slotOrId.id || 'demo-slot';
      const rawSubject =
        slotOrId.subject?.name ||
        slotOrId.subject?.shortName ||
        slotOrId.subjectName ||
        subjectName ||
        'Subject';
      const cls =
        slotOrId.classSectionName ||
        slotOrId.classSection?.name ||
        className ||
        'Class 10-A';
      setActiveSlot({ slotId: sId, subjectName: rawSubject, className: cls });
    } else {
      setActiveSlot({
        slotId: String(slotOrId),
        subjectName: subjectName || 'Subject',
        className,
      });
    }
    setActiveTab('attendance');
  };

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
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            {loading && todaySlots.length === 0 ? (
              <TeacherHomeSkeleton />
            ) : (
              <>
                {/* 1. Dashboard Top Greeting: Hello, Name */}
                <View style={styles.greetingSection}>
                  <Text style={styles.greetingTitle}>Hello, {fullName}</Text>
                </View>

                {/* 2. Today's Time Table */}
                <TeacherHomePeriodsList
                  loading={loading}
                  slots={todaySlots}
                  onMarkAttendance={openSlot}
                  onViewFull={() => setActiveTab('schedule')}
                />

                {/* 4. Today's Progress */}
                <TeacherDonutCard
                  completed={completedCount}
                  total={todayCount}
                  loading={loading}
                />

                {/* 5. Weekly Overview */}
                <TeacherWeeklyBarCard weekData={weekData} loading={loading} />
              </>
            )}
          </ScrollView>
        );
      case 'announcements':
      case 'announcements-manage':
        return <AdminAnnouncementsView />;
      case 'schedule':
        return <TeacherTimetableView onOpenAttendance={openSlot} />;
      case 'attendance':
        return (
          <AttendanceMarkingView
            slotId={activeSlot?.slotId}
            subjectName={activeSlot?.subjectName}
            className={activeSlot?.className}
            onBack={() => {
              setActiveSlot(null);
              setActiveTab('home');
            }}
            onSaved={() => {
              setActiveSlot(null);
              fetchAll();
            }}
          />
        );
      case 'marks':
        return <TeacherMarksView />;
      case 'homework':
        return <TeacherHomeworkView />;
      case 'library':
        return <TeacherLibraryView onBack={() => setActiveTab('home')} />;
      case 'chat':
        return <TeacherChatView />;
      case 'locate':
        return <TeacherLocateStudentsView />;
      case 'reports':
        return <TeacherReportsView />;
      case 'leave':
        return <TeacherLeaveView onBack={() => setActiveTab('home')} />;
      case 'teacher-attendance':
        return <TeacherLeaveView onBack={() => setActiveTab('home')} />;
      case 'profile':
        return <TeacherProfileView showBackBtn={false} />;
      case 'settings':
        return <TeacherSettingsView onBack={() => setActiveTab('home')} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <TeacherHomeHeader
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => router.push('/notifications')}
        />

        <TeacherShimmerProvider>
          <View style={styles.content}>
            {renderTabContent()}
          </View>
        </TeacherShimmerProvider>

        {/* Bottom Floating Pill Tab Bar matching Librarian Theme */}
        <View style={styles.tabBarBg}>
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => {
                    if (tab.key === 'attendance' || tab.key === 'schedule') {
                      setActiveSlot(null);
                    }
                    setActiveTab(tab.key);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabIconBg, isActive && styles.tabIconBgActive]}>
                    <MaterialCommunityIcons
                      name={isActive ? (tab.iconFilled as any) : (tab.icon as any)}
                      size={20}
                      color={isActive ? '#1A1B1C' : '#9CA3AF'}
                    />
                  </View>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  safe: { flex: 1 },
  content: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 16,
    paddingBottom: 95,
  },
  greetingSection: {
    paddingTop: 4,
    paddingBottom: 2,
  },
  greetingTitle: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
  },

  // Floating pill tab bar matching Librarian Theme
  tabBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 14 : 8,
    paddingTop: 4,
    backgroundColor: 'transparent',
    zIndex: 99,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: 16,
    width: '94%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    minWidth: 54,
  },
  tabIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBgActive: {
    backgroundColor: '#F4C430',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },
});
