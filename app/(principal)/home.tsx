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
  PrincipalTab,
  PrincipalKPIs,
  HomeroomSection,
  PrincipalStaffMember,
  CounselingRecord,
  SchoolNotice,
} from '../../features/principal/types/principal.types';
import {
  fetchPrincipalKPIsApi,
  fetchPrincipalHomeroomsApi,
  fetchPrincipalStaffDirectoryApi,
  fetchCounselingRecordsApi,
  fetchSchoolNoticesApi,
  assignHomeroomTeacherApi,
  createCounselingRecordApi,
  updateCounselingStatusApi,
  createSchoolNoticeApi,
} from '../../api/principal';
import { PrincipalHeader } from '../../features/principal/components/PrincipalHeader';
import { PrincipalDrawer } from '../../features/principal/components/PrincipalDrawer';
import { PrincipalDashboardView } from '../../features/principal/components/PrincipalDashboardView';
import { PrincipalHomeroomsView } from '../../features/principal/components/PrincipalHomeroomsView';
import { PrincipalStaffDirectoryView } from '../../features/principal/components/PrincipalStaffDirectoryView';
import { PrincipalWelfareCounselingView } from '../../features/principal/components/PrincipalWelfareCounselingView';
import { PrincipalNoticesView } from '../../features/principal/components/PrincipalNoticesView';
import { AttendanceReportsView } from '../../features/shared/components/AttendanceReportsView';
import { AssignHomeroomModal } from '../../features/principal/components/modals/AssignHomeroomModal';
import { AddCounselingNoteModal } from '../../features/principal/components/modals/AddCounselingNoteModal';
import { CreateNoticeModal } from '../../features/principal/components/modals/CreateNoticeModal';
import { CampusDossierModal } from '../../features/principal/components/modals/CampusDossierModal';

const BOTTOM_TABS: {
  key: PrincipalTab;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconActive: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { key: 'dashboard', label: 'Cockpit', icon: 'view-dashboard-outline', iconActive: 'view-dashboard' },
  { key: 'homerooms', label: 'Homeroom', icon: 'google-classroom', iconActive: 'google-classroom' },
  { key: 'staff', label: 'Faculty', icon: 'human-male-board', iconActive: 'human-male-board' },
  { key: 'counseling', label: 'Guidance', icon: 'heart-pulse', iconActive: 'heart-pulse' },
  { key: 'notices', label: 'Circulars', icon: 'bullhorn-outline', iconActive: 'bullhorn' },
];

export default function PrincipalHomeScreen() {
  const router = useRouter();

  // User store selectors
  const fullName = useUserStore((state) => state.fullName) || 'Principal';
  const institutionName = useUserStore((state) => state.institutionName) || 'My Institution';
  const institutionType = useUserStore((state) => state.institutionType) || 'school';
  const profilePic = useUserStore((state) => state.profilePic);
  const resetUser = useUserStore((state) => state.resetUser);

  // Screen UI state
  const [activeTab, setActiveTab] = useState<PrincipalTab>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  // Data states
  const [kpis, setKpis] = useState<PrincipalKPIs>({
    totalStudents: 0,
    presentStudents: 0,
    studentAttendancePct: 0,
    totalFaculty: 0,
    presentFaculty: 0,
    facultyAttendancePct: 0,
    activeSections: 0,
    counselingCasesActive: 0,
    unassignedHomerooms: 0,
    periodCoveragePct: 0,
  });
  const [homerooms, setHomerooms] = useState<HomeroomSection[]>([]);
  const [staffList, setStaffList] = useState<PrincipalStaffMember[]>([]);
  const [counseling, setCounseling] = useState<CounselingRecord[]>([]);
  const [notices, setNotices] = useState<SchoolNotice[]>([]);

  // Modals state
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState<HomeroomSection | null>(null);
  const [counselingModalVisible, setCounselingModalVisible] = useState(false);
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [dossierModalVisible, setDossierModalVisible] = useState(false);

  // Load all principal data
  const loadData = useCallback(async () => {
    setErrorMessage(null); // Clear previous error
    try {
      const results = await Promise.allSettled([
        fetchPrincipalKPIsApi(),
        fetchPrincipalHomeroomsApi(),
        fetchPrincipalStaffDirectoryApi(),
        fetchCounselingRecordsApi(),
        fetchSchoolNoticesApi(),
      ]);

      if (!isMountedRef.current) return;
      if (results[0].status === 'fulfilled' && results[0].value) setKpis(results[0].value);
      if (results[1].status === 'fulfilled' && results[1].value) setHomerooms(results[1].value);
      if (results[2].status === 'fulfilled' && results[2].value) setStaffList(results[2].value);
      if (results[3].status === 'fulfilled' && results[3].value) setCounseling(results[3].value);
      if (results[4].status === 'fulfilled' && results[4].value) setNotices(results[4].value);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.warn('Principal data load error:', err);
      setErrorMessage(err?.message || 'Failed to load school data. Check server connection.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

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

  // Actions
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
      Alert.alert('Assignment Failed', err.message || 'Failed to update homeroom assignment.');
    }
  };

  const handleCreateCounselingCase = async (record: Omit<CounselingRecord, 'id'>) => {
    const created = await createCounselingRecordApi(record);
    setCounseling((prev) => [created, ...prev]);
    setKpis((prev) => ({
      ...prev,
      counselingCasesActive: prev.counselingCasesActive + 1,
    }));
    Alert.alert('Pastoral Record Saved', `Counseling case for ${record.studentName} logged.`);
  };

  const handleToggleCounselingStatus = async (
    id: string,
    currentStatus: CounselingRecord['status']
  ) => {
    const nextStatus =
      currentStatus === 'active'
        ? 'in_progress'
        : currentStatus === 'in_progress'
        ? 'resolved'
        : 'active';

    await updateCounselingStatusApi(id, nextStatus);
    setCounseling((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
    );
  };

  const handlePublishNotice = async (
    notice: Omit<SchoolNotice, 'id' | 'publishedDate' | 'acknowledgedCount'>
  ) => {
    const created = await createSchoolNoticeApi(notice);
    setNotices((prev) => [created, ...prev]);
    Alert.alert('Circular Broadcasted', `"${notice.title}" has been published.`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      resetUser();
      router.replace('/auth');
    } catch (e: any) {
      Alert.alert('Logout Error', e.message || 'Failed to sign out');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Principal Executive Header */}
        <PrincipalHeader
          fullName={fullName}
          institutionName={institutionName}
          institutionType={institutionType}
          profilePic={profilePic}
          activeTab={activeTab}
          noticeBadgeCount={notices.filter((n) => n.priority === 'urgent' || n.priority === 'important').length}
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => setActiveTab('notices')}
          onProfilePress={() => router.push('/(principal)/profile')}
          onBackToDashboard={() => setActiveTab('dashboard')}
          onSwitchToTeacher={() => {
            useUserStore.getState().switchRole('teacher');
            router.replace('/(teacher)/home');
          }}
        />

        {/* Active View Container */}
        <View style={styles.content}>
          {errorMessage && !loading ? (
            <View style={styles.errorWrap}>
              <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#DC2626" />
              <Text style={styles.errorTitle}>Unable to load school records</Text>
              <Text style={styles.errorSubtitle}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadData} activeOpacity={0.8}>
                <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.retryText}>Retry Connection</Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#D97706" />
              <Text style={styles.loaderText}>Loading Principal Cockpit...</Text>
            </View>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <PrincipalDashboardView
                  kpis={kpis}
                  homerooms={homerooms}
                  notices={notices}
                  counseling={counseling}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  onNavigateTab={(tab) => {
                    if (tab === 'profile') router.push('/(principal)/profile');
                    else setActiveTab(tab);
                  }}
                  onOpenAssignModal={handleOpenAssignModal}
                  onOpenNoticeModal={() => setNoticeModalVisible(true)}
                  onOpenDossierModal={() => setDossierModalVisible(true)}
                  onNavigateToTeacherTimetable={() => router.push('/teacher-timetable')}
                  onNavigateToTeacherAttendance={() => router.push('/teacher-attendance')}
                  onSwitchToTeacherPortal={() => {
                    useUserStore.getState().switchRole('teacher');
                    router.replace('/(teacher)/home');
                  }}
                />
              )}

              {activeTab === 'homerooms' && (
                <PrincipalHomeroomsView
                  homerooms={homerooms}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  onAssignTeacher={handleOpenAssignModal}
                />
              )}

              {activeTab === 'staff' && (
                <PrincipalStaffDirectoryView
                  staffList={staffList}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              )}

              {activeTab === 'counseling' && (
                <PrincipalWelfareCounselingView
                  records={counseling}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  onOpenCreateModal={() => setCounselingModalVisible(true)}
                  onToggleStatus={handleToggleCounselingStatus}
                />
              )}

              {activeTab === 'notices' && (
                <PrincipalNoticesView
                  notices={notices}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  onOpenCreateModal={() => setNoticeModalVisible(true)}
                />
              )}

              {activeTab === 'attendance' && (
                <AttendanceReportsView mode="institution" />
              )}
            </>
          )}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.bottomBar}>
          {BOTTOM_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabBtn}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={active ? tab.iconActive : tab.icon}
                  size={24}
                  color={active ? '#D97706' : '#9CA3AF'}
                />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      {/* Slide-out Drawer */}
      <PrincipalDrawer
        visible={drawerOpen}
        activeTab={activeTab}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(tab) => {
          if (tab === 'profile') router.push('/(principal)/profile');
          else setActiveTab(tab);
        }}
        onLogout={handleLogout}
      />

      {/* Modals */}
      <AssignHomeroomModal
        visible={assignModalVisible}
        section={selectedSection}
        staffList={staffList}
        onClose={() => {
          setAssignModalVisible(false);
          setSelectedSection(null);
        }}
        onAssign={handleConfirmAssign}
      />

      <AddCounselingNoteModal
        visible={counselingModalVisible}
        onClose={() => setCounselingModalVisible(false)}
        onSubmit={handleCreateCounselingCase}
      />

      <CreateNoticeModal
        visible={noticeModalVisible}
        onClose={() => setNoticeModalVisible(false)}
        onSubmit={handlePublishNotice}
      />

      <CampusDossierModal
        visible={dossierModalVisible}
        onClose={() => setDossierModalVisible(false)}
        kpis={kpis}
        homerooms={homerooms}
        staff={staffList}
        counseling={counseling}
        notices={notices}
        institutionName={institutionName}
        onRefresh={loadData}
      />
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
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    color: '#111827',
    fontFamily: FontFamily.bold,
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
    backgroundColor: '#D97706',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  retryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: FontFamily.semibold,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: FontFamily.semibold,
  },
  tabLabelActive: {
    color: '#D97706',
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
});
