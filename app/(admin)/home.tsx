import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
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
  fetchTeachersApi,
  createTeacherApi,
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

  const handleCreateTeacher = async (teacherPayload: any) => {
    const res = await createTeacherApi(teacherPayload);
    if (res) {
      setTeachers((prev) => [res, ...prev]);
    }
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
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7E57C2" />
            <Text style={styles.loadingText}>Loading Admin Workspace...</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
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
                onCreateStudent={handleCreateStudent}
              />
            )}

            {activeTab === 'teachers' && (
              <AdminTeachersView
                teachers={teachers}
                departments={config.departments || []}
                onCreateTeacher={handleCreateTeacher}
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

        {/* Workspace Bottom Navigation Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('dashboard')}>
            <MaterialCommunityIcons name="view-dashboard-outline" size={22} color={activeTab === 'dashboard' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('institution')}>
            <MaterialCommunityIcons name="office-building" size={22} color={activeTab === 'institution' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'institution' && styles.tabLabelActive]}>Institution</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('students')}>
            <MaterialCommunityIcons name="account-school-outline" size={22} color={activeTab === 'students' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'students' && styles.tabLabelActive]}>Students</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('teachers')}>
            <MaterialCommunityIcons name="human-male-board" size={22} color={activeTab === 'teachers' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'teachers' && styles.tabLabelActive]}>Teachers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('users')}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color={activeTab === 'users' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'users' && styles.tabLabelActive]}>Users</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('academics')}>
            <MaterialCommunityIcons name="school-outline" size={22} color={activeTab === 'academics' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'academics' && styles.tabLabelActive]}>Academics</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
            <MaterialCommunityIcons name="account-circle-outline" size={22} color={activeTab === 'profile' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600', color: '#7E57C2' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 6,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  tabLabel: { fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: 3 },
  tabLabelActive: { color: '#7E57C2', fontWeight: '700' },
});
