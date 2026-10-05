import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
import { FontFamily } from '../../constants/fonts';
import {
  HODTab,
  HODKPIs,
  HODFacultyMember,
  DepartmentCourse,
  ExamEligibilityRecord,
  DepartmentNotice,
} from '../../features/hod/types/hod.types';
import {
  fetchHODKPIsApi,
  fetchHODFacultyApi,
  fetchDepartmentCoursesApi,
  fetchExamEligibilityApi,
  fetchDepartmentNoticesApi,
  assignCourseInstructorApi,
  updateHallTicketStatusApi,
  createDepartmentNoticeApi,
} from '../../api/hod';
import { HODHeader } from '../../features/hod/components/HODHeader';
import { HODDrawer } from '../../features/hod/components/HODDrawer';
import { HODDashboardView } from '../../features/hod/components/HODDashboardView';
import { HODCoursesView } from '../../features/hod/components/HODCoursesView';
import { HODFacultyWorkloadView } from '../../features/hod/components/HODFacultyWorkloadView';
import { HODDetentionEligibilityView } from '../../features/hod/components/HODDetentionEligibilityView';
import { HODNoticesView } from '../../features/hod/components/HODNoticesView';
import { AttendanceReportsView } from '../../features/shared/components/AttendanceReportsView';
import { AssignCourseInstructorModal } from '../../features/hod/components/modals/AssignCourseInstructorModal';
import { ReviewHallTicketModal } from '../../features/hod/components/modals/ReviewHallTicketModal';
import { CreateDeptNoticeModal } from '../../features/hod/components/modals/CreateDeptNoticeModal';

const BOTTOM_TABS: {
  key: HODTab;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconActive: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { key: 'dashboard', label: 'Overview', icon: 'view-dashboard-outline', iconActive: 'view-dashboard' },
  { key: 'courses', label: 'Courses', icon: 'book-open-outline', iconActive: 'book-open' },
  { key: 'faculty', label: 'Faculty', icon: 'human-male-board', iconActive: 'human-male-board' },
  { key: 'eligibility', label: 'Detentions', icon: 'card-account-details-outline', iconActive: 'card-account-details' },
  { key: 'notices', label: 'Memos', icon: 'bullhorn-outline', iconActive: 'bullhorn' },
];

export default function HODHomeScreen() {
  const router = useRouter();

  // User store
  const fullName = useUserStore((state) => state.fullName) || 'Head of Department';
  const department = useUserStore((state) => state.department) || 'Computer Science & Engineering';
  const institutionName = useUserStore((state) => state.institutionName) || 'College of Engineering';
  const profilePic = useUserStore((state) => state.profilePic);
  const resetUser = useUserStore((state) => state.resetUser);

  // Tab & drawer navigation
  const [activeTab, setActiveTab] = useState<HODTab>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Departmental Data
  const [kpis, setKpis] = useState<HODKPIs>({
    totalStudents: 0,
    facultyOnDuty: 0,
    totalFaculty: 0,
    activeCourses: 0,
    practicalLabsCount: 0,
    averageSyllabusProgress: 0,
    detentionAlertsCount: 0,
    unassignedCoursesCount: 0,
    todayLabSessions: 0,
  });
  const [faculty, setFaculty] = useState<HODFacultyMember[]>([]);
  const [courses, setCourses] = useState<DepartmentCourse[]>([]);
  const [eligibility, setEligibility] = useState<ExamEligibilityRecord[]>([]);
  const [notices, setNotices] = useState<DepartmentNotice[]>([]);

  // Modals state
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<DepartmentCourse | null>(null);
  const [eligibilityModalVisible, setEligibilityModalVisible] = useState(false);
  const [selectedEligibilityRecord, setSelectedEligibilityRecord] = useState<ExamEligibilityRecord | null>(null);
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);

  // Load department data
  const loadData = useCallback(async () => {
    try {
      const [kpisRes, facultyRes, coursesRes, elgRes, noticesRes] = await Promise.all([
        fetchHODKPIsApi(department),
        fetchHODFacultyApi(department),
        fetchDepartmentCoursesApi(department),
        fetchExamEligibilityApi(department),
        fetchDepartmentNoticesApi(department),
      ]);
      setKpis(kpisRes);
      setFaculty(facultyRes);
      setCourses(coursesRes);
      setEligibility(elgRes);
      setNotices(noticesRes);
    } catch {
      // offline / mock fallback will already handle
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [department]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Sign out handler
  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of the HOD Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch {}
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  // Assign course instructor
  const handleAssignCourse = async (courseId: string, facultyId: string, facultyName: string) => {
    try {
      const res = await assignCourseInstructorApi(courseId, facultyId, facultyName);
      if (res.success) {
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? res.course : c))
        );
        // Refresh faculty workload
        const updatedFaculty = await fetchHODFacultyApi(department);
        setFaculty(updatedFaculty);
        const updatedKpis = await fetchHODKPIsApi(department);
        setKpis(updatedKpis);
      }
    } catch {
      Alert.alert('Assignment Error', 'Could not assign faculty instructor.');
    }
  };

  // Update exam eligibility / hall ticket status
  const handleUpdateHallTicketStatus = async (
    recordId: string,
    status: ExamEligibilityRecord['hallTicketStatus'],
    note?: string
  ) => {
    try {
      const res = await updateHallTicketStatusApi(recordId, status, note);
      if (res.success) {
        setEligibility((prev) =>
          prev.map((r) => (r.id === recordId ? res.record : r))
        );
        const updatedKpis = await fetchHODKPIsApi(department);
        setKpis(updatedKpis);
      }
    } catch {
      Alert.alert('Update Error', 'Could not update hall ticket clearance decision.');
    }
  };

  // Create departmental notice
  const handleCreateNotice = async (noticeData: Omit<DepartmentNotice, 'id' | 'publishedDate'>) => {
    try {
      const res = await createDepartmentNoticeApi(noticeData);
      if (res.success) {
        setNotices((prev) => [res.notice, ...prev]);
      }
    } catch {
      Alert.alert('Posting Error', 'Could not publish department memo.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA580C" />
        <Text style={styles.loadingText}>Loading Department Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <HODHeader
          fullName={fullName}
          department={department}
          institutionName={institutionName}
          profilePic={profilePic}
          activeTab={activeTab}
          noticeBadgeCount={notices.length}
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => setActiveTab('notices')}
          onProfilePress={() => router.push('/(hod)/profile')}
          onBackToDashboard={() => setActiveTab('dashboard')}
        />

        {/* View Switcher */}
        <View style={styles.body}>
          {activeTab === 'dashboard' && (
            <HODDashboardView
              kpis={kpis}
              courses={courses}
              eligibility={eligibility}
              notices={notices}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onNavigateTab={setActiveTab}
              onOpenAssignModal={(c) => {
                setSelectedCourse(c);
                setAssignModalVisible(true);
              }}
              onOpenEligibilityModal={(rec) => {
                setSelectedEligibilityRecord(rec);
                setEligibilityModalVisible(true);
              }}
              onOpenNoticeModal={() => setNoticeModalVisible(true)}
            />
          )}

          {activeTab === 'courses' && (
            <HODCoursesView
              courses={courses}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onAssignCourse={(c) => {
                setSelectedCourse(c);
                setAssignModalVisible(true);
              }}
            />
          )}

          {activeTab === 'faculty' && (
            <HODFacultyWorkloadView
              faculty={faculty}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'eligibility' && (
            <HODDetentionEligibilityView
              records={eligibility}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onReviewRecord={(rec) => {
                setSelectedEligibilityRecord(rec);
                setEligibilityModalVisible(true);
              }}
            />
          )}

          {activeTab === 'notices' && (
            <HODNoticesView
              notices={notices}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onOpenCreateModal={() => setNoticeModalVisible(true)}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceReportsView mode="department" department={department || undefined} />
          )}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.bottomBar}>
          {BOTTOM_TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabBtn}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={isSelected ? tab.iconActive : tab.icon}
                  size={24}
                  color={isSelected ? '#EA580C' : '#9CA3AF'}
                />
                <Text style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Drawer */}
        <HODDrawer
          visible={drawerOpen}
          activeTab={activeTab}
          onClose={() => setDrawerOpen(false)}
          onNavigate={(t) => {
            setActiveTab(t);
            setDrawerOpen(false);
          }}
          onLogout={handleLogout}
        />

        {/* Modals */}
        <AssignCourseInstructorModal
          visible={assignModalVisible}
          course={selectedCourse}
          facultyList={faculty}
          onClose={() => {
            setAssignModalVisible(false);
            setSelectedCourse(null);
          }}
          onAssign={handleAssignCourse}
        />

        <ReviewHallTicketModal
          visible={eligibilityModalVisible}
          record={selectedEligibilityRecord}
          onClose={() => {
            setEligibilityModalVisible(false);
            setSelectedEligibilityRecord(null);
          }}
          onUpdateStatus={handleUpdateHallTicketStatus}
        />

        <CreateDeptNoticeModal
          visible={noticeModalVisible}
          department={department}
          authorName={fullName}
          onClose={() => setNoticeModalVisible(false)}
          onSubmit={handleCreateNotice}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safe: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFDF7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  body: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
    elevation: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
    fontFamily: FontFamily.poppins,
  },
  tabLabelSelected: {
    color: '#EA580C',
    fontWeight: '800',
  },
});
