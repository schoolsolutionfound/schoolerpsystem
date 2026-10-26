import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../constants/fonts';
import { performLogout } from '../../utils/logout';
import { useUserStore } from '../../store/useUserStore';
import { levelsForInstitution } from '../../features/shared/academicStructure';
import {
  fetchInstitutionConfigApi,
  updateInstitutionConfigApi,
  fetchDashboardStatsApi,
  fetchStudentsApi,
  createStudentApi,
  updateStudentApi,
  deleteStudentApi,
  promoteStudentsApi,
  graduateStudentsApi,
  fetchStudentDocumentsApi,
  uploadStudentDocumentApi,
  deleteStudentDocumentApi,
  fetchTeachersApi,
  createTeacherApi,
  updateTeacherApi,
  deleteTeacherApi,
  fetchUsersApi,
  createUserApi,
} from '../../api/admin';
import {
  fetchClassSectionsApi,
  fetchSubjectsApi,
  fetchSubjectTeachersApi,
  fetchPeriodsApi,
  fetchAcademicSessionsApi,
} from '../../api/academics';
import { updateMyProfileApi } from '../../api/users';
import { AdminDashboardView } from '../../features/admin/components/AdminDashboardView';
import type { AdminDashboardStats } from '../../features/admin/components/AdminDashboardView';
import { AdminInstitutionView } from '../../features/admin/components/AdminInstitutionView';
import { AdminStudentsView } from '../../features/admin/components/AdminStudentsView';
import { AdminTeachersView } from '../../features/admin/components/AdminTeachersView';
import { AdminUsersView } from '../../features/admin/components/AdminUsersView';
import { AdminParentsView } from '../../features/admin/components/AdminParentsView';
import { AdminProfileView } from '../../features/admin/components/AdminProfileView';
import { AdminSkeleton } from '../../features/admin/components/skeletons/AdminSkeletons';
import { AdminAcademicsView } from '../../features/admin/components/AdminAcademicsView';
import { AdminHeader } from '../../features/admin/components/AdminHeader';
import { AdminDrawer } from '../../features/admin/components/AdminDrawer';
import { AdminPaymentSettingsView } from '../../features/admin/components/AdminPaymentSettingsView';
import { AdminSettingsView } from '../../features/admin/components/AdminSettingsView';
import { AdminAnnouncementsView } from '../../features/announcements';

const TABS: { key: 'dashboard' | 'institution' | 'students' | 'teachers' | 'profile'; label: string; icon: string; iconFilled: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard-outline', iconFilled: 'view-dashboard' },
  { key: 'institution', label: 'Institution', icon: 'office-building', iconFilled: 'office-building' },
  { key: 'students', label: 'Students', icon: 'account-school-outline', iconFilled: 'account-school' },
  { key: 'teachers', label: 'Teachers', icon: 'human-male-board', iconFilled: 'human-male-board' },
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline', iconFilled: 'account-circle' },
];

export default function AdminHomeScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ tab?: string }>();
  const fullName = useUserStore((state) => state.fullName) || 'Institution Admin';
  const email = useUserStore((state) => state.email) || 'admin@school.com';
  const institutionName = useUserStore((state) => state.institutionName) || 'My Institution';
  const institutionCode = useUserStore((state) => state.institutionCode || state.institutionId) || 'DEFAULT';
  const designation = useUserStore((state) => state.designation) || '';
  const phone = useUserStore((state) => state.phone) || '';
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const resetUser = useUserStore((state) => state.resetUser);

  const normalizeUser = (u: any) => {
    let scope: any = u.scope;
    if (typeof scope === 'string') {
      try { scope = JSON.parse(scope); } catch { scope = {}; }
    }
    return {
      ...u,
      department: u.department || scope?.department || '',
      academicYear: u.academicYear || scope?.academicYear || '',
      section: u.section || scope?.section || '',
      employeeId: u.employeeId || scope?.employeeId || '',
    };
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'institution' | 'students' | 'teachers' | 'users' | 'parents' | 'academics' | 'timetable' | 'attendance' | 'announcements' | 'payments' | 'settings' | 'profile'>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCreateRole, setPendingCreateRole] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.tab) {
      const tab = searchParams.tab as any;
      if (['dashboard', 'institution', 'students', 'teachers', 'users', 'parents', 'academics', 'timetable', 'attendance', 'announcements', 'payments', 'settings', 'profile'].includes(tab)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveTab(tab);
      }
    }
  }, [searchParams.tab]);

  // Server State
  const [config, setConfig] = useState<any>({
    institutionCode,
    institutionName,
    institutionType: useUserStore.getState().institutionType || 'school',
      departments: [],
      academicYears: [],
      yearsOfStudy: [],
      courses: [],
    sections: [],
    classSubjects: {},
  });
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [classSections, setClassSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [academicSessions, setAcademicSessions] = useState<any[]>([]);

  // Server-side list pagination / search (students, teachers, users)
  const LIST_PAGE_SIZE = 50;
  const [studentsMeta, setStudentsMeta] = useState({ total: 0, limit: LIST_PAGE_SIZE, offset: 0 });
  const [teachersMeta, setTeachersMeta] = useState({ total: 0, limit: LIST_PAGE_SIZE, offset: 0 });
  const [usersMeta, setUsersMeta] = useState({ total: 0, limit: LIST_PAGE_SIZE, offset: 0 });
  const [studentsSearch, setStudentsSearch] = useState('');
  const [teachersSearch, setTeachersSearch] = useState('');
  const [usersSearch, setUsersSearch] = useState('');
  const studentsSearchRef = React.useRef('');
  const teachersSearchRef = React.useRef('');
  const usersSearchRef = React.useRef('');
  const studentsOffsetRef = React.useRef(0);
  const teachersOffsetRef = React.useRef(0);
  const usersOffsetRef = React.useRef(0);

  const extractList = (res: any) => {
    if (!res) return { rows: [], total: 0, limit: LIST_PAGE_SIZE, offset: 0 };
    if (Array.isArray(res)) return { rows: res, total: res.length, limit: LIST_PAGE_SIZE, offset: 0 };
    return {
      rows: res.data || [],
      total: Number(res.total ?? (res.data?.length ?? 0)),
      limit: Number(res.limit ?? LIST_PAGE_SIZE),
      offset: Number(res.offset ?? 0),
    };
  };

  const loadStudentsPage = useCallback(async (opts?: { search?: string; offset?: number; append?: boolean }) => {
    const search = (opts?.search ?? studentsSearchRef.current).trim();
    const offset = opts?.offset ?? 0;
    studentsSearchRef.current = search;
    studentsOffsetRef.current = offset;
    const res = await fetchStudentsApi({ search: search || undefined, limit: LIST_PAGE_SIZE, offset }).catch(() => null);
    const { rows, total, limit } = extractList(res);
    const mapped = rows.map(normalizeUser);
    setStudents((prev) => (opts?.append && offset > 0 ? [...prev, ...mapped] : mapped));
    setStudentsMeta({ total, limit, offset });
    setStudentsSearch(search);
  }, []);

  const loadTeachersPage = useCallback(async (opts?: { search?: string; offset?: number; append?: boolean }) => {
    const search = (opts?.search ?? teachersSearchRef.current).trim();
    const offset = opts?.offset ?? 0;
    teachersSearchRef.current = search;
    teachersOffsetRef.current = offset;
    const res = await fetchTeachersApi({ search: search || undefined, limit: LIST_PAGE_SIZE, offset }).catch(() => null);
    const { rows, total, limit } = extractList(res);
    setTeachers((prev) => (opts?.append && offset > 0 ? [...prev, ...rows.map(normalizeUser)] : rows.map(normalizeUser)));
    setTeachersMeta({ total, limit, offset });
    setTeachersSearch(search);
  }, []);

  const loadUsersPage = useCallback(async (opts?: { search?: string; offset?: number; append?: boolean }) => {
    const search = (opts?.search ?? usersSearchRef.current).trim();
    const offset = opts?.offset ?? 0;
    usersSearchRef.current = search;
    usersOffsetRef.current = offset;
    const res = await fetchUsersApi({ search: search || undefined, limit: LIST_PAGE_SIZE, offset }).catch(() => null);
    const { rows, total, limit } = extractList(res);
    setAllUsers((prev) => (opts?.append && offset > 0 ? [...prev, ...rows.map(normalizeUser)] : rows.map(normalizeUser)));
    setUsersMeta({ total, limit, offset });
    setUsersSearch(search);
  }, []);

  const studentsSearchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const teachersSearchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const usersSearchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStudentsSearch = useCallback((q: string) => {
    studentsSearchRef.current = q;
    setStudentsSearch(q);
    if (studentsSearchTimer.current) clearTimeout(studentsSearchTimer.current);
    studentsSearchTimer.current = setTimeout(() => { loadStudentsPage({ search: q, offset: 0 }); }, 300);
  }, [loadStudentsPage]);

  const handleTeachersSearch = useCallback((q: string) => {
    teachersSearchRef.current = q;
    setTeachersSearch(q);
    if (teachersSearchTimer.current) clearTimeout(teachersSearchTimer.current);
    teachersSearchTimer.current = setTimeout(() => { loadTeachersPage({ search: q, offset: 0 }); }, 300);
  }, [loadTeachersPage]);

  const handleUsersSearch = useCallback((q: string) => {
    usersSearchRef.current = q;
    setUsersSearch(q);
    if (usersSearchTimer.current) clearTimeout(usersSearchTimer.current);
    usersSearchTimer.current = setTimeout(() => { loadUsersPage({ search: q, offset: 0 }); }, 300);
  }, [loadUsersPage]);

  const handleLoadMoreStudents = useCallback(() => {
    if (students.length < studentsMeta.total) {
      loadStudentsPage({ offset: studentsOffsetRef.current + studentsMeta.limit, append: true });
    }
  }, [students.length, studentsMeta.total, studentsMeta.limit, loadStudentsPage]);

  const handleLoadMoreTeachers = useCallback(() => {
    if (teachers.length < teachersMeta.total) {
      loadTeachersPage({ offset: teachersOffsetRef.current + teachersMeta.limit, append: true });
    }
  }, [teachers.length, teachersMeta.total, teachersMeta.limit, loadTeachersPage]);

  const handleLoadMoreUsers = useCallback(() => {
    if (allUsers.length < usersMeta.total) {
      loadUsersPage({ offset: usersOffsetRef.current + usersMeta.limit, append: true });
    }
  }, [allUsers.length, usersMeta.total, usersMeta.limit, loadUsersPage]);

  const loadAllData = useCallback(async () => {
    try {
      const [configRes, statsRes, classesRes, subjectsRes, assignmentsRes, periodsRes, sessionsRes] = await Promise.all([
        fetchInstitutionConfigApi().catch(() => null),
        fetchDashboardStatsApi().catch(() => null),
        fetchClassSectionsApi().catch(() => null),
        fetchSubjectsApi().catch(() => null),
        fetchSubjectTeachersApi().catch(() => null),
        fetchPeriodsApi().catch(() => null),
        fetchAcademicSessionsApi().catch(() => null),
      ]);

      if (configRes) {
        setConfig(configRes);
      }
      if (statsRes) {
        setStats(statsRes);
      }
      await Promise.all([
        loadStudentsPage({ search: studentsSearchRef.current, offset: 0 }),
        loadTeachersPage({ search: teachersSearchRef.current, offset: 0 }),
        loadUsersPage({ search: usersSearchRef.current, offset: 0 }),
      ]);
      if (classesRes && Array.isArray(classesRes)) {
        setClassSections(classesRes);
      }
      if (subjectsRes && Array.isArray(subjectsRes)) {
        setSubjects(subjectsRes);
      }
      if (assignmentsRes && Array.isArray(assignmentsRes)) {
        setSubjectTeachers(assignmentsRes);
      }
      if (periodsRes && Array.isArray(periodsRes)) {
        setPeriods(periodsRes);
      }
      if (sessionsRes && Array.isArray(sessionsRes)) {
        setAcademicSessions(sessionsRes);
      }
    } catch (err: any) {
      console.warn('[Admin Data Load Warning]', err.message);
    } finally {
      setDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Standard data-fetching pattern; loadAllData updates state asynchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllData();
  }, [loadAllData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [loadAllData]);

  const handleUpdateMyProfile = useCallback(async (patch: {
    fullName?: string;
    phone?: string;
    designation?: string;
    address?: string;
  }): Promise<boolean> => {
    try {
      const res: any = await updateMyProfileApi(patch);
      const updated = res?.data ?? res;
      const nextName = updated?.fullName ?? patch.fullName;
      const nextPhone = updated?.phone ?? patch.phone;
      const nextDesignation = updated?.designation ?? patch.designation;
      if (nextName || nextPhone || nextDesignation) {
        setUserProfile({
          ...(nextName ? { fullName: nextName } : {}),
          ...(nextPhone ? { phone: nextPhone } : {}),
          ...(nextDesignation ? { designation: nextDesignation } : {}),
        });
      }
      Alert.alert('Profile Updated', 'Your profile has been saved.');
      return true;
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not save profile. Please try again.');
      return false;
    }
  }, [setUserProfile]);

  const handleSaveConfig = async (updated: {
    departments: string[];
    academicYears?: string[];
    yearsOfStudy?: string[];
    courses: string[];
    sections: string[];
    classSubjects?: Record<string, string[]>;
    terms?: { academicYear: string; terms: string[] }[];
    defaultTempPassword?: string;
  }) => {
    const res = await updateInstitutionConfigApi(updated);
    if (res) {
      setConfig(res);
    }
  };

  const handleCreateStudent = async (studentPayload: any) => {
    const res = await createStudentApi(studentPayload);
    if (res) {
      const { tempPassword, ...user } = res as any;
      setStudents((prev) => [user, ...prev]);
    }
    return res;
  };

  const handleUpdateStudent = async (id: string, payload: any) => {
    const res = await updateStudentApi(id, payload);
    if (res) {
      setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...res } : s)));
    }
  };

  const handleDeleteStudent = async (id: string) => {
    await deleteStudentApi(id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const handlePromoteStudents = async (studentIds: string[], targetClassSectionId: string, academicYear: string) => {
    await promoteStudentsApi(studentIds, targetClassSectionId, academicYear);
    // Refresh students list to reflect new scope
    await loadStudentsPage({ search: studentsSearchRef.current, offset: 0 });
  };

  const handleGraduateStudents = async (studentIds: string[]) => {
    await graduateStudentsApi(studentIds);
    // Update local state to mark as graduated
    setStudents((prev) =>
      prev.map((s) => (studentIds.includes(s.id) ? { ...s, graduatedAt: new Date().toISOString() } : s))
    );
  };

  const handleFetchDocuments = async (studentId: string) => {
    const res = await fetchStudentDocumentsApi(studentId);
    return (res as any)?.data || [];
  };

  const handleAddDocument = async (studentId: string, payload: { documentType: string; fileName: string; fileUrl: string }) => {
    await uploadStudentDocumentApi(studentId, payload);
  };

  const handleDeleteDocument = async (studentId: string, docId: string) => {
    await deleteStudentDocumentApi(studentId, docId);
  };

  const handleCreateTeacher = async (teacherPayload: any) => {
    const res = await createTeacherApi(teacherPayload);
    if (res) {
      const { tempPassword, ...teacher } = res as any;
      setTeachers((prev) => [teacher, ...prev]);
    }
    return res;
  };

  const handleUpdateTeacher = async (id: string, payload: any) => {
    const res = await updateTeacherApi(id, payload);
    if (res) {
      setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...res } : t)));
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    await deleteTeacherApi(id);
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreateUser = async (userPayload: any) => {
    const res = await createUserApi(userPayload);
    if (res) {
      const { tempPassword, inviteSent, inviteReason, ...user } = res as any;
      setAllUsers((prev) => [user, ...prev]);
      if (userPayload.role === 'student' && user.role === 'student') {
        setStudents((prev) => [user, ...prev]);
      }
      if (userPayload.role === 'teacher' && user.role === 'teacher') {
        setTeachers((prev) => [user, ...prev]);
      }
    }
    return res;
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await performLogout();
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <AdminHeader
          fullName={fullName}
          showGreeting={activeTab === 'dashboard'}
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => setActiveTab('profile')}
        />

        <View style={styles.content}>
          {!dataLoaded ? (
            <AdminSkeleton tab={activeTab} />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <AdminDashboardView
                  fullName={fullName}
                  stats={stats}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  onNavigateTab={(tab) => {
                    setActiveTab(tab as any);
                  }}
                  onAddRole={(role) => {
                    if (role === 'parent') {
                      setActiveTab('parents');
                      return;
                    }
                    if (role === 'student') {
                      setActiveTab('students');
                      return;
                    }
                    if (role === 'teacher') {
                      setActiveTab('teachers');
                      return;
                    }
                    setPendingCreateRole(role);
                    setActiveTab('users');
                  }}
                />
              )}

              {activeTab === 'institution' && (
                <AdminInstitutionView config={config} onSaveConfig={handleSaveConfig} refreshing={refreshing} onRefresh={handleRefresh} classSections={classSections} academicSessions={academicSessions} onDataChanged={loadAllData} />
              )}

              {activeTab === 'students' && (
                <AdminStudentsView
                  students={students}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  departments={config.departments || []}
                  academicYears={levelsForInstitution(config)}
                  sections={config.sections || []}
                  classSections={classSections}
                  institutionType={config.institutionType || 'school'}
                  onCreateStudent={handleCreateStudent}
                  onUpdateStudent={handleUpdateStudent}
                  onDeleteStudent={handleDeleteStudent}
                  onPromoteStudents={handlePromoteStudents}
                  onGraduateStudents={handleGraduateStudents}
                  onFetchDocuments={handleFetchDocuments}
                  onAddDocument={handleAddDocument}
                  onDeleteDocument={handleDeleteDocument}
                  academicSessions={academicSessions}
                  onSearchChange={handleStudentsSearch}
                  hasMore={students.length < studentsMeta.total}
                  onLoadMore={handleLoadMoreStudents}
                  totalCount={studentsMeta.total}
                />
              )}

              {activeTab === 'teachers' && (
                <AdminTeachersView
                  teachers={teachers}
                  departments={config.departments || []}
                  institutionType={config.institutionType || 'school'}
                  classSections={classSections || []}
                  courses={config.courses || []}
                  academicYears={levelsForInstitution(config)}
                  subjects={subjects}
                  onCreateTeacher={handleCreateTeacher}
                  onUpdateTeacher={handleUpdateTeacher}
                  onDeleteTeacher={handleDeleteTeacher}
                  onSearchChange={handleTeachersSearch}
                  hasMore={teachers.length < teachersMeta.total}
                  onLoadMore={handleLoadMoreTeachers}
                  totalCount={teachersMeta.total}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  onDataChange={loadAllData}
                />
              )}

              {activeTab === 'users' && (
                <AdminUsersView
                  users={allUsers}
                  institutionType={config.institutionType || 'school'}
                  classSections={classSections}
                  pendingCreateRole={pendingCreateRole}
                  onPendingCreateRoleConsumed={() => setPendingCreateRole(null)}
                  onCreateUser={handleCreateUser}
                  onSearchChange={handleUsersSearch}
                  hasMore={allUsers.length < usersMeta.total}
                  onLoadMore={handleLoadMoreUsers}
                  totalCount={usersMeta.total}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              )}

              {activeTab === 'parents' && (
                <AdminParentsView
                  parents={allUsers.filter((u: any) => (u.role || '').toLowerCase() === 'parent')}
                  onCreateParent={handleCreateUser}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              )}

              {activeTab === 'academics' && (
                <AdminAcademicsView
                  institutionType={config.institutionType || 'school'}
                  departments={config.departments || []}
                  academicYears={levelsForInstitution(config)}
                  sections={config.sections || []}
                  classSections={classSections}
                  subjects={subjects}
                  subjectTeachers={subjectTeachers}
                  periods={periods}
                  teachers={teachers}
                  terms={config.terms || []}
                  blockedDates={config.blockedDates || []}
                  academicSessions={academicSessions}
                  onDataChange={loadAllData}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              )}

              {activeTab === 'announcements' && (
                <AdminAnnouncementsView />
              )}

              {activeTab === 'payments' && (
                <AdminPaymentSettingsView refreshing={refreshing} onRefresh={handleRefresh} />
              )}

              {activeTab === 'settings' && <AdminSettingsView />}

              {activeTab === 'profile' && (
                <AdminProfileView
                  fullName={fullName}
                  email={email}
                  institutionName={config.institutionName || institutionName}
                  institutionCode={config.institutionCode || institutionCode}
                  roleName="Institution Administrator"
                  designation={designation}
                  phone={phone}
                  onChangePassword={() => router.push('/change-password')}
                  onLogout={handleLogout}
                  onSaveProfile={handleUpdateMyProfile}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              )}
            </>
          )}
        </View>

        {/* Floating Bottom Tab Bar */}
        <View style={styles.tabBarBg}>
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const isCenter = tab.key === 'students';
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

      <AdminDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onLogout={handleLogout}
        router={router}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  safe: { flex: 1 },
  content: { flex: 1 },

  // Floating tab bar
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
