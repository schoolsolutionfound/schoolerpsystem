import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
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
} from '../../api/academics';
import { AdminDashboardView } from '../../features/admin/components/AdminDashboardView';
import type { AdminDashboardStats } from '../../features/admin/components/AdminDashboardView';
import { AdminInstitutionView } from '../../features/admin/components/AdminInstitutionView';
import { AdminStudentsView } from '../../features/admin/components/AdminStudentsView';
import { AdminTeachersView } from '../../features/admin/components/AdminTeachersView';
import { AdminUsersView } from '../../features/admin/components/AdminUsersView';
import { AdminProfileView } from '../../features/admin/components/AdminProfileView';
import { AdminAcademicsView } from '../../features/admin/components/AdminAcademicsView';
import { AdminHeader } from '../../features/admin/components/AdminHeader';
import { AdminDrawer } from '../../features/admin/components/AdminDrawer';

const TABS: { key: 'dashboard' | 'institution' | 'students' | 'teachers' | 'profile'; label: string; icon: string; iconFilled: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard-outline', iconFilled: 'view-dashboard' },
  { key: 'institution', label: 'Institution', icon: 'office-building', iconFilled: 'office-building' },
  { key: 'students', label: 'Students', icon: 'account-school-outline', iconFilled: 'account-school' },
  { key: 'teachers', label: 'Teachers', icon: 'human-male-board', iconFilled: 'human-male-board' },
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline', iconFilled: 'account-circle' },
];

export default function AdminHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Institution Admin';
  const email = useUserStore((state) => state.email) || 'admin@school.com';
  const institutionName = useUserStore((state) => state.institutionName) || 'My Institution';
  const institutionCode = useUserStore((state) => state.institutionCode || state.institutionId) || 'DEFAULT';
  const designation = useUserStore((state) => state.designation) || '';
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'institution' | 'students' | 'teachers' | 'users' | 'academics' | 'timetable' | 'attendance' | 'profile'>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Server State
  const [config, setConfig] = useState<any>({
    institutionCode,
    institutionName,
    institutionType: useUserStore.getState().institutionType || 'college',
    departments: [],
    academicYears: [],
    courses: [],
    sections: [],
  });
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [classSections, setClassSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [configRes, statsRes, studentsRes, teachersRes, usersRes, classesRes, subjectsRes, assignmentsRes, periodsRes] = await Promise.all([
        fetchInstitutionConfigApi().catch(() => null),
        fetchDashboardStatsApi().catch(() => null),
        fetchStudentsApi().catch(() => null),
        fetchTeachersApi().catch(() => null),
        fetchUsersApi().catch(() => null),
        fetchClassSectionsApi().catch(() => null),
        fetchSubjectsApi().catch(() => null),
        fetchSubjectTeachersApi().catch(() => null),
        fetchPeriodsApi().catch(() => null),
      ]);

      if (configRes) {
        setConfig(configRes);
      }
      if (statsRes) {
        setStats(statsRes);
      }
      if (studentsRes) {
        setStudents((Array.isArray(studentsRes) ? studentsRes : (studentsRes as any)?.data || []).map(normalizeUser));
      }
      if (teachersRes) {
        setTeachers((Array.isArray(teachersRes) ? teachersRes : (teachersRes as any)?.data || []).map(normalizeUser));
      }
      if (usersRes) {
        setAllUsers((Array.isArray(usersRes) ? usersRes : (usersRes as any)?.data || []).map(normalizeUser));
      }
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
    } catch (err: any) {
      console.warn('[Admin Data Load Warning]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSaveConfig = async (updated: {
    departments: string[];
    academicYears: string[];
    courses: string[];
    sections: string[];
  }) => {
    const res = await updateInstitutionConfigApi(updated);
    if (res) {
      setConfig(res);
    }
  };

  const handleCreateStudent = async (studentPayload: any) => {
    const res = await createStudentApi(studentPayload);
    if (res) {
      setStudents((prev) => [res, ...prev]);
    }
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
    const studentsRes = await fetchStudentsApi().catch(() => null);
    if (studentsRes) {
      setStudents((Array.isArray(studentsRes) ? studentsRes : (studentsRes as any)?.data || []).map(normalizeUser));
    }
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
      setTeachers((prev) => [res, ...prev]);
    }
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
      setAllUsers((prev) => [res, ...prev]);
      if (userPayload.role === 'student' && res.role === 'student') {
        setStudents((prev) => [res, ...prev]);
      }
      if (userPayload.role === 'teacher' && res.role === 'teacher') {
        setTeachers((prev) => [res, ...prev]);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try { await signOut(auth); } catch {}
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
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => setActiveTab('profile')}
        />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#F4C430" />
            <Text style={styles.loadingText}>Loading Admin Workspace...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {activeTab === 'dashboard' && (
              <AdminDashboardView
                fullName={fullName}
                stats={stats}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'institution' && (
              <AdminInstitutionView config={config} onSaveConfig={handleSaveConfig} />
            )}

            {activeTab === 'students' && (
              <AdminStudentsView
                students={students}
                departments={config.departments || []}
                academicYears={config.academicYears || []}
                sections={config.sections || []}
                classSections={classSections}
                institutionType={config.institutionType || 'college'}
                onCreateStudent={handleCreateStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onPromoteStudents={handlePromoteStudents}
                onGraduateStudents={handleGraduateStudents}
                onFetchDocuments={handleFetchDocuments}
                onAddDocument={handleAddDocument}
                onDeleteDocument={handleDeleteDocument}
              />
            )}

            {activeTab === 'teachers' && (
              <AdminTeachersView
                teachers={teachers}
                departments={config.departments || []}
                onCreateTeacher={handleCreateTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteTeacher={handleDeleteTeacher}
              />
            )}

            {activeTab === 'users' && (
              <AdminUsersView
                users={allUsers}
                institutionType={config.institutionType || 'college'}
                departments={config.departments || []}
                academicYears={config.academicYears || []}
                sections={config.sections || []}
                onCreateUser={handleCreateUser}
              />
            )}

            {activeTab === 'academics' && (
              <AdminAcademicsView
                institutionType={config.institutionType || 'college'}
                departments={config.departments || []}
                academicYears={config.academicYears || []}
                sections={config.sections || []}
                classSections={classSections}
                subjects={subjects}
                subjectTeachers={subjectTeachers}
                periods={periods}
                teachers={teachers}
                terms={config.terms || []}
                blockedDates={config.blockedDates || []}
                onDataChange={loadAllData}
              />
            )}

            {activeTab === 'profile' && (
              <AdminProfileView
                fullName={fullName}
                email={email}
                institutionName={config.institutionName || institutionName}
                institutionCode={config.institutionCode || institutionCode}
                roleName="Institution Administrator"
                designation={designation}
                onChangePassword={() => router.push('/change-password')}
                onLogout={handleLogout}
              />
            )}
          </View>
        )}

        {/* Floating Bottom Tab Bar */}
        <View style={styles.tabBarBg}>
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  content: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600', color: '#F4C430' },

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
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#9CA3AF',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#1A1B1C',
    fontWeight: '700',
  },
});
