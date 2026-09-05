/**
 * @file home.tsx
 * @description Student Portal Dashboard.
 *
 * Full-featured cockpit for students:
 *  - Live Attendance summary ring and stats
 *  - Today's Class Timetable with real-time period indicators
 *  - Homework & Assignments tracker with 1-tap submission
 *  - Student Fee Invoices, Receipts, and Online Payment simulation
 *  - Live Bus Route #4 Tracking & Driver Contact
 *  - School Notice Board & Examination Circulars
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { fetchMyTimetableApi, fetchStudentAttendanceHistoryApi } from '../../api/academics';
import { StudentHomeHeader } from '../../features/student/components/StudentHomeHeader';
import { StudentHomeAttendanceCard } from '../../features/student/components/StudentHomeAttendanceCard';
import { StudentHomeAnnouncements } from '../../features/student/components/StudentHomeAnnouncements';
import { StudentHomePeriodsList } from '../../features/student/components/StudentHomePeriodsList';
import { StudentHomeFeeSummary } from '../../features/student/components/StudentHomeFeeSummary';
import { StudentHomeBusTracker } from '../../features/student/components/StudentHomeBusTracker';
import { StudentHomeAssignments } from '../../features/student/components/StudentHomeAssignments';
import { StudentTimetableView } from '../../features/student/components/StudentTimetableView';
import { StudentAttendanceView } from '../../features/student/components/StudentAttendanceView';
import { StudentLibraryModal } from '../../features/student/components/StudentLibraryModal';
import { StudentPlacementModal } from '../../features/student/components/StudentPlacementModal';

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

export default function StudentHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Test Student';
  const profilePic = useUserStore((state) => state.profilePic);

  const [activeTab, setActiveTab] = useState<'home' | 'attendance' | 'schedule' | 'reports'>('home');
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showPlacementModal, setShowPlacementModal] = useState(false);

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
    const dayOfWeek = new Date().getDay() || 1; // 1-5 Mon-Fri, fallback to Mon if weekend

    fetchMyTimetableApi(today)
      .then((res) => {
        if (mounted) {
          const all = res?.slots || [];
          const matched = all.filter((s: any) => s.dayOfWeek === dayOfWeek);
          setTodaySlots(matched.length > 0 ? matched : all.filter((s: any) => s.dayOfWeek === 1));
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
            {/* Quick Action Navigation Strip */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('schedule')}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#EDE7F6' }]}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#7E57C2" />
                </View>
                <Text style={styles.quickActionTitle}>Timetable</Text>
                <Text style={styles.quickActionSub}>7 Periods</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('attendance')}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#DCFCE7' }]}>
                  <MaterialCommunityIcons name="chart-donut" size={20} color="#16A34A" />
                </View>
                <Text style={styles.quickActionTitle}>Attendance</Text>
                <Text style={styles.quickActionSub}>94.2% Present</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('reports')}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <MaterialCommunityIcons name="wallet-outline" size={20} color="#D97706" />
                </View>
                <Text style={styles.quickActionTitle}>Fee Dues</Text>
                <Text style={styles.quickActionSub}>Receipts</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/(student)/profile')}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#E0F2FE' }]}>
                  <MaterialCommunityIcons name="school-outline" size={20} color="#0284C7" />
                </View>
                <Text style={styles.quickActionTitle}>My Grade</Text>
                <Text style={styles.quickActionSub}>Grade 10-A</Text>
              </TouchableOpacity>
            </View>

            {/* Attendance Overview Card */}
            <StudentHomeAttendanceCard loading={attendanceLoading || slotsLoading} overall={overall} currentSlot={currentSlot} />

            {/* Today's Live Periods & Timetable */}
            <StudentHomePeriodsList loading={slotsLoading} slots={todaySlots} />

            {/* Homework & Assignments Tracker */}
            <StudentHomeAssignments />

            {/* Fee Statements & Online Pay */}
            <StudentHomeFeeSummary />

            {/* Live Bus Transport Tracker */}
            <StudentHomeBusTracker />

            {/* School Library & Borrowed Books Access Card */}
            <TouchableOpacity
              style={styles.libraryCard}
              onPress={() => setShowLibraryModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.libraryIconWrap}>
                <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.libraryCardTitle}>Central Library & Books</Text>
                <Text style={styles.libraryCardSub}>View borrowed books, return dates & explore catalog</Text>
              </View>
              <View style={styles.libraryArrowBtn}>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#D97706" />
              </View>
            </TouchableOpacity>

            {/* Career & Placements Hub Card */}
            <TouchableOpacity
              style={styles.careerCard}
              onPress={() => setShowPlacementModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.careerIconWrap}>
                <MaterialCommunityIcons name="briefcase-check" size={24} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.careerCardTitle}>Career & Placements Hub</Text>
                <Text style={styles.careerCardSub}>Browse hiring drives, 1-tap apply & interview tracker</Text>
              </View>
              <View style={styles.careerArrowBtn}>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#059669" />
              </View>
            </TouchableOpacity>

            {/* Announcements & Notice Board */}
            <StudentHomeAnnouncements />
          </ScrollView>
        )}

        {/* Student Library Modal */}
        <StudentLibraryModal
          visible={showLibraryModal}
          onClose={() => setShowLibraryModal(false)}
          studentName={fullName}
        />

        {/* Student Placement Modal */}
        <StudentPlacementModal
          visible={showPlacementModal}
          onClose={() => setShowPlacementModal(false)}
          studentName={fullName}
        />

        {activeTab === 'schedule' && <StudentTimetableView />}
        {activeTab === 'attendance' && <StudentAttendanceView />}
        {activeTab === 'reports' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <StudentHomeFeeSummary />
            <StudentHomeAnnouncements />
          </ScrollView>
        )}

        {/* Modern Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
            <MaterialCommunityIcons name="home-outline" size={22} color={activeTab === 'home' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('attendance')}>
            <MaterialCommunityIcons name="account-check-outline" size={22} color={activeTab === 'attendance' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'attendance' && styles.tabLabelActive]}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('schedule')}>
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color={activeTab === 'schedule' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'schedule' && styles.tabLabelActive]}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('reports')}>
            <MaterialCommunityIcons name="receipt-text-outline" size={22} color={activeTab === 'reports' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'reports' && styles.tabLabelActive]}>Fees & Dues</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 14 },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionTitle: { fontSize: 11, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  quickActionSub: { fontSize: 9, color: '#64748B', marginTop: 1, textAlign: 'center' },
  libraryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    gap: 12,
  },
  libraryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  libraryCardTitle: { fontSize: 14, fontWeight: '800', color: '#92400E' },
  libraryCardSub: { fontSize: 11, color: '#B45309', marginTop: 2 },
  libraryArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 14,
    gap: 12,
  },
  careerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careerCardTitle: { fontSize: 14, fontWeight: '800', color: '#065F46' },
  careerCardSub: { fontSize: 11, color: '#047857', marginTop: 2 },
  careerArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  tabLabelActive: { color: '#7E57C2', fontWeight: '800' },
});
