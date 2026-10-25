import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  DepartmentNotice,
} from '../../features/hod/types/hod.types';
import {
  fetchHODKPIsApi,
  fetchHODFacultyApi,
  fetchDepartmentCoursesApi,
  fetchDepartmentNoticesApi,
  createDepartmentNoticeApi,
  updateDepartmentNoticeApi,
  deleteDepartmentNoticeApi,
} from '../../api/hod';
import {
  fetchPrincipalHomeroomsApi,
  assignHomeroomTeacherApi,
} from '../../api/principal';
import { HODHeader } from '../../features/hod/components/HODHeader';
import { HODDrawer } from '../../features/hod/components/HODDrawer';
import { HODDashboardView } from '../../features/hod/components/HODDashboardView';
import { PrincipalStaffDirectoryView } from '../../features/principal/components/PrincipalStaffDirectoryView';
import { PrincipalHomeroomsView } from '../../features/principal/components/PrincipalHomeroomsView';
import { PrincipalNoticesView } from '../../features/principal/components/PrincipalNoticesView';
import { AdminAttendanceView } from '../../features/admin/components/AdminAttendanceView';
import { AdminTimetableView } from '../../features/admin/components/AdminTimetableView';
import { StudentFeedbackReviewManagerView } from '../../features/shared/components/StudentFeedbackReviewManagerView';
import { AcademicCalendarEventsView } from '../../features/shared/components/AcademicCalendarEventsView';
import { LeaveApprovalView } from '../../features/shared/components/LeaveApprovalView';
import { DocumentRequestsManagerView } from '../../features/shared/components/DocumentRequestsManagerView';
import { AccessRestrictedModuleCard } from '../../features/shared/components/AccessRestrictedModuleCard';
import { AssignHomeroomModal } from '../../features/principal/components/modals/AssignHomeroomModal';
import { CreateNoticeModal } from '../../features/principal/components/modals/CreateNoticeModal';
import { TeacherTimetableView } from '../../features/teacher/components/TeacherTimetableView';
import { AttendanceMarkingView } from '../../features/teacher/components/AttendanceMarkingView';
import { TeacherMarksView } from '../../features/teacher/components/TeacherMarksView';
import { TeacherHomeworkView } from '../../features/teacher/components/TeacherHomeworkView';
import {
  HomeroomSection,
  PrincipalStaffMember,
  StaffDesignation,
  SchoolNotice,
} from '../../features/principal/types/principal.types';

const BOTTOM_TABS: {
  key: HODTab;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconActive: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home-outline', iconActive: 'home' },
  { key: 'homerooms', label: 'Students', icon: 'account-group-outline', iconActive: 'account-group' },
  { key: 'timetable', label: 'Timetable', icon: 'calendar-clock-outline', iconActive: 'calendar-clock' },
  { key: 'staff', label: 'Faculty', icon: 'account-tie-outline', iconActive: 'account-tie' },
  { key: 'profile', label: 'Account', icon: 'account-outline', iconActive: 'account' },
];

function toSchoolNotice(notice: DepartmentNotice): SchoolNotice {
  const rawAudience = String(notice.targetAudience || 'all');
  const targetAudience: SchoolNotice['targetAudience'] =
    rawAudience === 'faculty' || rawAudience === 'teachers'
      ? 'teachers'
      : rawAudience === 'lab_assistants' || rawAudience === 'staff'
      ? 'staff'
      : rawAudience === 'parents'
      ? 'parents'
      : rawAudience === 'students'
      ? 'students'
      : 'all';

  return {
    id: notice.id,
    title: notice.title,
    content: notice.content,
    priority: notice.priority,
    targetAudience,
    department: notice.department,
    publishedDate: notice.publishedDate,
    author: notice.authorName,
    acknowledgedCount: 0,
  };
}

function toDepartmentAudience(
  audience: SchoolNotice['targetAudience']
): DepartmentNotice['targetAudience'] {
  if (audience === 'teachers' || audience === 'staff') return 'faculty';
  if (audience === 'parents') return 'all';
  return audience;
}

export default function HODHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // User store
  const rawFullName = useUserStore((state) => state.fullName);
  const fullName = rawFullName?.trim() && rawFullName !== 'Head of Department'
    ? rawFullName.trim()
    : 'Head of Department';
  const rawDepartment = useUserStore((state) => state.department);
  const department = rawDepartment?.trim() && rawDepartment !== 'Department not set'
    ? rawDepartment.trim()
    : '';
  const departmentLabel = department || 'Department';
  const rawInstName = useUserStore((state) => state.institutionName);
  const institutionName = rawInstName?.trim() && rawInstName !== 'Institution not set'
    ? rawInstName.trim()
    : 'Institution';
  const profilePic = useUserStore((state) => state.profilePic);
  const resetUser = useUserStore((state) => state.resetUser);
  const hasModuleAccess = useUserStore((state) => state.hasModuleAccess);
  const grantModuleAccess = useUserStore((state) => state.grantModuleAccess);

  // Tab & drawer navigation
  const [activeTab, setActiveTab] = useState<HODTab>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabLoadingTitle, setTabLoadingTitle] = useState('Loading Department...');
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  // Tab transition loader helper
  const getHODTabTitle = (tab: HODTab): string => {
    switch (tab) {
      case 'dashboard': return 'Loading Department Dashboard...';
      case 'homerooms':
      case 'students': return 'Loading Department Classes...';
      case 'timetable': return 'Loading Department Timetable...';
      case 'staff':
      case 'faculty': return 'Loading Department Faculty...';
      case 'reviews': return 'Loading Student Feedback & Reviews...';
      case 'notices': return 'Loading Department Announcements...';
      case 'attendance': return 'Loading Attendance Desk...';
      case 'events': return 'Loading Academic Calendar...';
      case 'leaves': return 'Loading Leave Approvals Desk...';
      case 'document_requests': return 'Loading Document Desk...';
      case 'schedule': return 'Loading Teaching Schedule...';
      case 'mark_attendance': return 'Loading Attendance Marking...';
      case 'marks': return 'Loading Student Marks...';
      case 'homework': return 'Loading Assignments & Homework...';
      default: return 'Loading View...';
    }
  };

  const switchTab = useCallback((targetTab: HODTab) => {
    if (targetTab === activeTab) return;
    setTabLoadingTitle(getHODTabTitle(targetTab));
    setTabLoading(true);
    setActiveTab(targetTab);
    setTimeout(() => {
      if (isMountedRef.current) {
        setTabLoading(false);
      }
    }, 180);
  }, [activeTab]);

  // Departmental data loaded from backend
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
  const [notices, setNotices] = useState<SchoolNotice[]>([]);
  const [homerooms, setHomerooms] = useState<HomeroomSection[]>([]);

  // Modals state (matching Principal)
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState<HomeroomSection | null>(null);
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ slotId?: string; subjectName?: string } | null>(null);

  // Homerooms restricted to HOD's department
  const deptHomerooms: HomeroomSection[] = useMemo(() => {
    const depKey = department.toLowerCase();
    if (!depKey) return homerooms;
    return homerooms.filter((sec) => {
      const secDept = (sec.department || '').toLowerCase();
      const secName = (sec.name || '').toLowerCase();
      if (depKey.includes('computer') || depKey.includes('cse')) {
        return secDept.includes('computer') || secDept.includes('cse') || secName.includes('cse');
      }
      if (depKey.includes('electronic') || depKey.includes('ece')) {
        return secDept.includes('electronic') || secDept.includes('ece') || secName.includes('ece');
      }
      if (depKey.includes('mech')) {
        return secDept.includes('mech') || secName.includes('mech');
      }
      if (depKey.includes('civil')) {
        return secDept.includes('civil') || secName.includes('civil');
      }
      if (depKey.includes('ai') || depKey.includes('aiml')) {
        return secDept.includes('ai') || secName.includes('ai');
      }
      return secDept.includes(depKey);
    });
  }, [department, homerooms]);

  // Faculty formatted for PrincipalStaffDirectoryView
  const deptStaffList: PrincipalStaffMember[] = useMemo(() => {
    return faculty.map((f, idx) => {
      let desig: StaffDesignation = 'subject_teacher';
      const rank = (f.rank || '').toLowerCase();
      if (rank === 'professor') {
        desig = idx === 0 || f.email?.includes('hod') ? 'hod' : 'academic_coordinator';
      } else if (rank === 'associate_professor') {
        desig = 'homeroom_teacher';
      } else if (rank === 'assistant_professor') {
        desig = 'subject_teacher';
      } else if (rank === 'lab_instructor') {
        desig = 'lab_instructor';
      }

      return {
        id: f.id || `fac-${idx}`,
        fullName: f.name,
        employeeId: f.employeeId,
        cabinNumber: f.cabinNumber,
        email: f.email,
        phone: f.phone,
        department: f.department || department,
        designation: desig,
        assignedClass: deptHomerooms.find((sec) => sec.homeroomTeacherName === f.name)?.name,
        assignedSubjects: f.assignedCourses,
        attendanceToday:
          f.status === 'absent'
            ? 'absent'
            : f.status === 'on_leave'
            ? 'on_leave'
            : 'present',
      };
    });
  }, [faculty, department, deptHomerooms]);

  // Dynamic KPIs calculated live from departmental classes and faculty
  const dynamicKPIs: HODKPIs = useMemo(() => {
    const totalStudents =
      deptHomerooms.reduce((acc, h) => acc + (h.studentCount || 0), 0) || kpis.totalStudents;
    const totalFaculty = faculty.length || kpis.totalFaculty;
    const facultyOnDuty =
      faculty.filter(
        (f) => f.status === 'present' || f.status === 'in_lecture' || f.status === 'in_lab'
      ).length || kpis.facultyOnDuty;
    const activeCourses = courses.length || kpis.activeCourses;
    const practicalLabsCount =
      courses.filter(
        (c) => c.type === 'practical_lab' || (c.name || '').toLowerCase().includes('lab')
      ).length || kpis.practicalLabsCount;
    const averageSyllabusProgress =
      courses.length > 0
        ? Math.round(
            courses.reduce((acc, c) => acc + (c.syllabusProgressPct || 0), 0) / courses.length
          )
        : kpis.averageSyllabusProgress;

    return {
      ...kpis,
      totalStudents,
      totalFaculty,
      facultyOnDuty,
      activeCourses,
      practicalLabsCount,
      averageSyllabusProgress,
    };
  }, [deptHomerooms, faculty, courses, kpis]);

  // Load HOD Data
  const loadData = useCallback(async () => {
    try {
      const targetDept = department || undefined;
      const results = await Promise.allSettled([
        fetchHODKPIsApi(targetDept),
        fetchHODFacultyApi(targetDept),
        fetchDepartmentCoursesApi(targetDept),
        fetchDepartmentNoticesApi(targetDept),
        fetchPrincipalHomeroomsApi(),
      ]);

      if (!isMountedRef.current) return;
      if (results[0].status === 'fulfilled' && results[0].value) {
        setKpis(results[0].value);
      }
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
        setFaculty(results[1].value);
      }
      if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
        setCourses(results[2].value);
      }
      if (results[3].status === 'fulfilled' && Array.isArray(results[3].value)) {
        setNotices(results[3].value.map(toSchoolNotice));
      }
      if (results[4].status === 'fulfilled' && Array.isArray(results[4].value)) {
        setHomerooms(results[4].value);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.warn('HOD data load error:', err);
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

  // Assign homeroom teacher
  const handleOpenAssignModal = (section: HomeroomSection) => {
    setSelectedSection(section);
    setAssignModalVisible(true);
  };

  const handleConfirmAssign = async (sectionId: string, teacherId: string, teacherName: string) => {
    try {
      await assignHomeroomTeacherApi(sectionId, teacherId, teacherName);
      await loadData();
      if (teacherId) {
        Alert.alert('Homeroom Assigned', `${teacherName} is now the assigned Class Teacher.`);
      } else {
        Alert.alert('Homeroom Unassigned', `Class teacher assignment cleared for ${selectedSection?.name || 'this class'}.`);
      }
    } catch (err: any) {
      Alert.alert('Assignment Failed', err?.message || 'Failed to update homeroom assignment.');
    }
  };

  // Notice handlers
  const handlePublishNotice = async (
    notice: Omit<SchoolNotice, 'id' | 'publishedDate' | 'acknowledgedCount'>
  ) => {
    try {
      const result = await createDepartmentNoticeApi({
        title: notice.title,
        content: notice.content,
        department: notice.department || department,
        priority: notice.priority,
        targetAudience: toDepartmentAudience(notice.targetAudience),
        authorName: fullName,
        authorRole: 'hod',
      });
      setNotices((prev) => [toSchoolNotice(result.notice), ...prev]);
      Alert.alert('Announcement Broadcasted', `"${notice.title}" has been published.`);
    } catch (err: any) {
      Alert.alert('Publish Failed', err?.message || 'Failed to publish announcement.');
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await deleteDepartmentNoticeApi(id);
      setNotices((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      Alert.alert('Delete Failed', err?.message || 'Failed to delete announcement.');
    }
  };

  const handleUpdateNotice = async (updatedNotice: SchoolNotice) => {
    try {
      const result = await updateDepartmentNoticeApi(updatedNotice.id, {
        title: updatedNotice.title,
        content: updatedNotice.content,
        department: updatedNotice.department || department,
        priority: updatedNotice.priority,
        targetAudience: toDepartmentAudience(updatedNotice.targetAudience),
      });
      setNotices((prev) =>
        prev.map((n) => (n.id === updatedNotice.id ? toSchoolNotice(result.notice) : n))
      );
      Alert.alert('Announcement Updated', `"${updatedNotice.title}" has been updated.`);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Failed to update announcement.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F4C430" />
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
          department={departmentLabel}
          institutionName={institutionName}
          profilePic={profilePic}
          activeTab={activeTab}
          noticeBadgeCount={unreadNoticeCount}
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => switchTab('notices')}
          onProfilePress={() => router.push('/(hod)/profile')}
          onBackToDashboard={() => switchTab('dashboard')}
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
            {tabLoading ? (
              <View style={styles.tabLoaderWrap}>
                <ActivityIndicator size="large" color="#F4C430" />
                <Text style={styles.tabLoaderText}>{tabLoadingTitle}</Text>
              </View>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <HODDashboardView
                    fullName={fullName}
                    department={departmentLabel}
                    kpis={dynamicKPIs}
                    homerooms={deptHomerooms}
                    staffList={deptStaffList}
                    courses={courses}
                    notices={notices}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    onNavigateTab={(tab) => {
                      if (tab === 'profile') router.push('/(hod)/profile');
                      else switchTab(tab);
                    }}
                    onOpenNoticeModal={() => setNoticeModalVisible(true)}
                    onNavigateToTeacherTimetable={() => switchTab('schedule')}
                    onNavigateToTeacherAttendance={() => switchTab('mark_attendance')}
                  />
                )}

                {(activeTab === 'homerooms' || activeTab === 'students') && (
                  <PrincipalHomeroomsView
                    homerooms={deptHomerooms}
                    title="Department Classes"
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    onAssignTeacher={handleOpenAssignModal}
                  />
                )}

                {(activeTab === 'staff' || activeTab === 'faculty') && (
                  <PrincipalStaffDirectoryView
                    staffList={deptStaffList}
                    restrictDepartment={department || undefined}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                  />
                )}

                {activeTab === 'reviews' && (
                  <StudentFeedbackReviewManagerView
                    userRole="hod"
                    userDepartment={department || undefined}
                    currentUserName={fullName}
                  />
                )}

                {activeTab === 'notices' && (
                  <PrincipalNoticesView
                    notices={notices}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    onOpenCreateModal={() => setNoticeModalVisible(true)}
                    onDeleteNotice={handleDeleteNotice}
                    onUpdateNotice={handleUpdateNotice}
                  />
                )}

                {activeTab === 'timetable' && (
                  <AdminTimetableView
                    classSections={deptHomerooms}
                  />
                )}

                {activeTab === 'attendance' && (
                  <AdminAttendanceView
                    classSections={deptHomerooms}
                  />
                )}

                {activeTab === 'events' && (
                  <AcademicCalendarEventsView
                    userRole="hod"
                    userDepartment={department || undefined}
                    canManageAll={false}
                    canManageDeptOnly={true}
                  />
                )}

                {activeTab === 'leaves' && (
                  !hasModuleAccess('leaves') ? (
                    <AccessRestrictedModuleCard
                      moduleTitle="Department Leave Approvals Desk"
                      moduleDescription="Department Leave Approvals is an optional workflow. Access is granted to department authorities."
                      moduleKey="leaves"
                      onGrantAccess={() => grantModuleAccess('leaves')}
                      onBack={() => switchTab('dashboard')}
                    />
                  ) : (
                    <LeaveApprovalView
                      userRole="hod"
                      userDepartment={department || undefined}
                      reviewerName={fullName}
                    />
                  )
                )}

                {activeTab === 'document_requests' && (
                  !hasModuleAccess('document_requests') ? (
                    <AccessRestrictedModuleCard
                      moduleTitle="Document Desk"
                      moduleDescription="Document Desk is an optional service for departmental certificates and document verifications."
                      moduleKey="document_requests"
                      onGrantAccess={() => grantModuleAccess('document_requests')}
                      onBack={() => switchTab('dashboard')}
                    />
                  ) : (
                    <DocumentRequestsManagerView
                      userRole="hod"
                      userDepartment={department || undefined}
                      institutionName={institutionName}
                    />
                  )
                )}

                {/* Teaching & Classroom Operations (from Principal codebase) */}
                {activeTab === 'schedule' && (
                  <TeacherTimetableView
                    onOpenAttendance={(slotId, subjectName) => {
                      setActiveSlot({ slotId, subjectName });
                      switchTab('mark_attendance');
                    }}
                  />
                )}

                {activeTab === 'mark_attendance' && (
                  <AttendanceMarkingView
                    slotId={activeSlot?.slotId}
                    subjectName={activeSlot?.subjectName}
                    onSaved={() => {
                      setActiveSlot(null);
                      handleRefresh();
                    }}
                    onBack={() => {
                      setActiveSlot(null);
                      switchTab('dashboard');
                    }}
                  />
                )}

                {activeTab === 'marks' && (
                  <TeacherMarksView />
                )}

                {activeTab === 'homework' && (
                  <TeacherHomeworkView />
                )}
              </>
            )}
          </View>
        )}

        {/* Floating Oval Pill Bottom Tab Bar (matching Principal) */}
        <View
          style={[
            styles.ovalBottomBar,
            { marginBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          {BOTTOM_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabBtn}
                onPress={() => {
                  if (tab.key === 'profile') {
                    router.push('/(hod)/profile');
                  } else {
                    switchTab(tab.key);
                  }
                }}
                activeOpacity={0.7}
              >
                {active ? (
                  <View style={styles.activeIconCircle}>
                    <MaterialCommunityIcons
                      name={tab.iconActive}
                      size={20}
                      color="#000000"
                    />
                  </View>
                ) : (
                  <View style={styles.inactiveIconWrap}>
                    <MaterialCommunityIcons
                      name={tab.icon}
                      size={20}
                      color="#9CA3AF"
                    />
                  </View>
                )}
                <Text
                  style={[
                    styles.tabLabel,
                    active && styles.tabLabelActive,
                  ]}
                  numberOfLines={1}
                >
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
            if (t === 'profile') router.push('/(hod)/profile');
            else switchTab(t);
            setDrawerOpen(false);
          }}
          onLogout={handleLogout}
        />

        {/* Modals matching Principal */}
        <AssignHomeroomModal
          visible={assignModalVisible}
          section={selectedSection}
          staffList={deptStaffList}
          onClose={() => {
            setAssignModalVisible(false);
            setSelectedSection(null);
          }}
          onAssign={handleConfirmAssign}
        />

        <CreateNoticeModal
          visible={noticeModalVisible}
          onClose={() => setNoticeModalVisible(false)}
          onSubmit={handlePublishNotice}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
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
    fontFamily: FontFamily.regular,
  },
  body: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  tabLoaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  tabLoaderText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
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
    fontFamily: FontFamily.bold,
    color: '#111827',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4C430',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  retryText: {
    color: '#111827',
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  ovalBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 12,
    maxWidth: 620,
    width: '94%',
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 8,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  activeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFD026',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: '#FFD026',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  inactiveIconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: FontFamily.medium,
  },
  tabLabelActive: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
});
