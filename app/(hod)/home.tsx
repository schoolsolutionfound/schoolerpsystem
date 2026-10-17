import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { BorderRadius } from '../../constants/theme';
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
import { DepartmentDossierModal } from '../../features/hod/components/modals/DepartmentDossierModal';

const BOTTOM_TABS: {
  key: HODTab;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconActive: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home-outline', iconActive: 'home' },
  { key: 'courses', label: 'Courses', icon: 'book-open-outline', iconActive: 'book-open' },
  { key: 'faculty', label: 'Faculty', icon: 'account-outline', iconActive: 'account' },
  { key: 'eligibility', label: 'Detentions', icon: 'card-account-details-outline', iconActive: 'card-account-details' },
  { key: 'notices', label: 'Memos', icon: 'bullhorn-outline', iconActive: 'bullhorn' },
];

export default function HODHomeScreen() {
  const router = useRouter();

  // User store
  const fullName = useUserStore((state) => state.fullName) || 'Head of Department';
  const rawDepartment = useUserStore((state) => state.department);
  const department = rawDepartment?.trim() || 'Department not set';
  const rawInstName = useUserStore((state) => state.institutionName);
  const institutionName = rawInstName?.trim() || 'Institution not set';
  const profilePic = useUserStore((state) => state.profilePic);
  const resetUser = useUserStore((state) => state.resetUser);

  // Tab & drawer navigation
  const [activeTab, setActiveTab] = useState<HODTab>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMountedRef = useRef(true);

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
  const [deptDossierModalVisible, setDeptDossierModalVisible] = useState(false);

  // Load department data
  const loadData = useCallback(async () => {
    setErrorMessage(null); // Clear previous error on retry (E14)
    try {
      const targetDept = department === 'Department not set' ? undefined : department;
      const results = await Promise.allSettled([
        fetchHODKPIsApi(targetDept),
        fetchHODFacultyApi(targetDept),
        fetchDepartmentCoursesApi(targetDept),
        fetchExamEligibilityApi(targetDept),
        fetchDepartmentNoticesApi(targetDept),
      ]);

      if (!isMountedRef.current) return;
      if (results[0].status === 'fulfilled' && results[0].value) setKpis(results[0].value);
      if (results[1].status === 'fulfilled' && results[1].value) setFaculty(results[1].value);
      if (results[2].status === 'fulfilled' && results[2].value) setCourses(results[2].value);
      if (results[3].status === 'fulfilled' && results[3].value) setEligibility(results[3].value);
      if (results[4].status === 'fulfilled' && results[4].value) setNotices(results[4].value);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.warn('HOD data load error:', err);
      setErrorMessage(err?.message || 'Failed to load department records. Check server connection.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [department]);

  useEffect(() => {
    isMountedRef.current = true;
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
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
        await loadData();
      }
    } catch (err: any) {
      Alert.alert('Assignment Error', err?.message || 'Could not assign faculty instructor.');
      throw err;
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
        await loadData();
      }
    } catch (err: any) {
      Alert.alert('Update Error', err?.message || 'Could not update hall ticket clearance decision.');
      throw err;
    }
  };

  // Create departmental notice
  const handleCreateNotice = async (noticeData: Omit<DepartmentNotice, 'id' | 'publishedDate'>) => {
    try {
      const res = await createDepartmentNoticeApi(noticeData);
      if (res.success) {
        setNotices((prev) => [res.notice, ...prev]);
        await loadData();
      }
    } catch (err: any) {
      Alert.alert('Posting Error', err?.message || 'Could not publish department memo.');
      throw err;
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

  const unreadNoticeCount = notices.filter(
    (n) => n.priority === 'urgent' || n.priority === 'important'
  ).length;

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
          noticeBadgeCount={unreadNoticeCount}
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => setActiveTab('notices')}
          onProfilePress={() => router.push('/(hod)/profile')}
          onBackToDashboard={() => setActiveTab('dashboard')}
          onSwitchToTeacher={() => {
            useUserStore.getState().switchRole('teacher');
            router.replace('/(teacher)/home');
          }}
        />

        {/* View Switcher or Error Screen */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#DC2626" />
            <Text style={styles.errorTitle}>Unable to load department</Text>
            <Text style={styles.errorSubtitle}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData} activeOpacity={0.8}>
              <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.body}>
          {activeTab === 'dashboard' && (
            <HODDashboardView
              fullName={fullName}
              department={department}
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
              onOpenDeptDossierModal={() => setDeptDossierModalVisible(true)}
              onNavigateToTeacherTimetable={() => router.push('/teacher-timetable')}
              onNavigateToTeacherAttendance={() => router.push('/teacher-attendance')}
              onSwitchToTeacherPortal={() => {
                useUserStore.getState().switchRole('teacher');
                router.replace('/(teacher)/home');
              }}
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
        )}

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
                  color={isSelected ? '#111827' : '#9CA3AF'}
                />
                <Text style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}>
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.tabIndicator,
                    { backgroundColor: isSelected ? '#F59E0B' : 'transparent' },
                  ]}
                />
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

        <DepartmentDossierModal
          visible={deptDossierModalVisible}
          onClose={() => setDeptDossierModalVisible(false)}
          kpis={kpis}
          courses={courses}
          faculty={faculty}
          eligibility={eligibility}
          notices={notices}
          departmentName={department}
          institutionName={institutionName}
          onRefresh={loadData}
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EA580C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  tabLabelSelected: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  tabIndicator: {
    width: 24,
    height: 3,
    borderRadius: 2,
    marginTop: 3,
  },
});
