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
  const institutionCode = useUserStore((state) => state.institutionCode || state.institutionId) || 'DEFAULT';
  const institutionType = useUserStore((state) => state.institutionType) || 'school';
  const profilePic = useUserStore((state) => state.profilePic);
  const resetUser = useUserStore((state) => state.resetUser);

  // Screen UI state
  const [activeTab, setActiveTab] = useState<PrincipalTab>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Load all principal data
  const loadData = useCallback(async () => {
    try {
      const [kpisData, homeroomsData, staffData, counselingData, noticesData] =
        await Promise.all([
          fetchPrincipalKPIsApi(institutionCode),
          fetchPrincipalHomeroomsApi(institutionCode),
          fetchPrincipalStaffDirectoryApi(institutionCode),
          fetchCounselingRecordsApi(institutionCode),
          fetchSchoolNoticesApi(institutionCode),
        ]);

      setKpis(kpisData);
      setHomerooms(homeroomsData);
      setStaffList(staffData);
      setCounseling(counselingData);
      setNotices(noticesData);
    } catch (err: any) {
      console.warn('Principal data load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [institutionCode]);

  useEffect(() => {
    loadData();
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
    await assignHomeroomTeacherApi(sectionId, teacherId, teacherName);
    setHomerooms((prev) =>
      prev.map((h) =>
        h.id === sectionId
          ? { ...h, homeroomTeacherId: teacherId, homeroomTeacherName: teacherName }
          : h
      )
    );
    // Also update staff directory assignedClass
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === teacherId) {
          return {
            ...s,
            designation: 'homeroom_teacher',
            assignedClass: selectedSection?.name,
          };
        }
        return s;
      })
    );
    Alert.alert('Homeroom Assigned', `${teacherName} is now the assigned Class Teacher.`);
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
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => setActiveTab('notices')}
          onProfilePress={() => router.push('/(principal)/profile')}
        />

        {/* Active View Container */}
        <View style={styles.content}>
          {loading ? (
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
