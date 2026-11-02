import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { UnifiedHeader } from '../../features/shared/components/layout/UnifiedHeader';
import { FloatingFooter } from '../../features/shared/components/layout/FloatingFooter';
import { useDebugTab } from '../../features/shared/hooks/useDebugTab';
import { AdmissionDrawer } from '../../features/admission/components/AdmissionDrawer';
import { AdmissionLiveTrackingView } from '../../features/admission/components/AdmissionLiveTrackingView';
import { AdmissionSeatTrackingView } from '../../features/admission/components/AdmissionSeatTrackingView';
import { AdmissionStudentsView } from '../../features/admission/components/AdmissionStudentsView';
import { AdmissionProfileView } from '../../features/admission/components/AdmissionProfileView';
import { AdmissionStudentFormModal } from '../../features/admission/components/AdmissionStudentFormModal';
import { AdmissionCourse, getAdmissionCourses } from '../../api/admission';
import { TransportManagementView } from '../../features/shared/transport/TransportManagementView';
import { FontFamily } from '../../constants/fonts';

type Tab = 'students' | 'tracking' | 'transport' | 'profile';

export default function AdmissionHomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>((params.tab as Tab) || 'students');
  useDebugTab('admission', activeTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [trackingMode, setTrackingMode] = useState<'map' | 'seats'>('map');

  // Filter pass-through from tracking tab
  const [targetBranchId, setTargetBranchId] = useState<string | undefined>(undefined);
  const [targetStatus, setTargetStatus] = useState<string | undefined>(undefined);

  // New Student Modal (+)
  const [intakeModalVisible, setIntakeModalVisible] = useState(false);
  const [courses, setCourses] = useState<AdmissionCourse[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fullName = useUserStore((state) => state.fullName) || 'Admission Officer';
  const profilePic = useUserStore((state) => state.profilePic);
  const email = useUserStore((state) => state.email) || '';
  const institutionName = useUserStore((state) => state.institutionName) || '';

  const tabs = [
    { key: 'students' as Tab, label: 'Registry', icon: 'account-group-outline', iconFilled: 'account-group' },
    { key: 'tracking' as Tab, label: 'Tracking', icon: 'view-dashboard-outline', iconFilled: 'view-dashboard' },
    { key: 'transport' as Tab, label: 'Transport', icon: 'bus', iconFilled: 'bus' },
    { key: 'profile' as Tab, label: 'Profile', icon: 'account-circle-outline', iconFilled: 'account-circle' },
  ];

  useEffect(() => {
    if (params.tab && ['students', 'tracking', 'transport', 'profile'].includes(params.tab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(params.tab as Tab);
    }
  }, [params.tab]);

  useEffect(() => {
    getAdmissionCourses()
      .then((c) => setCourses(c))
      .catch(() => {});
  }, [refreshKey]);

  const handleNavigateToStudents = (branchId?: string, status?: string) => {
    setTargetBranchId(branchId);
    setTargetStatus(status);
    setActiveTab('students');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'students':
        return (
          <AdmissionStudentsView
            key={`students_${refreshKey}_${targetBranchId}_${targetStatus}`}
            initialBranchId={targetBranchId}
            initialStatus={targetStatus}
          />
        );
      case 'tracking':
        return (
          <View style={styles.trackingContainer}>
            <View style={styles.trackingToggle}>
              <TouchableOpacity
                style={[
                  styles.trackingToggleBtn,
                  trackingMode === 'map' && styles.trackingToggleBtnActive,
                ]}
                onPress={() => setTrackingMode('map')}
                activeOpacity={0.8}
              >
                <Feather
                  name="map"
                  size={14}
                  color={trackingMode === 'map' ? '#1A1B1C' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.trackingToggleText,
                    trackingMode === 'map' && styles.trackingToggleTextActive,
                  ]}
                >
                  Live Map
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.trackingToggleBtn,
                  trackingMode === 'seats' && styles.trackingToggleBtnActive,
                ]}
                onPress={() => setTrackingMode('seats')}
                activeOpacity={0.8}
              >
                <Feather
                  name="layers"
                  size={14}
                  color={trackingMode === 'seats' ? '#1A1B1C' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.trackingToggleText,
                    trackingMode === 'seats' && styles.trackingToggleTextActive,
                  ]}
                >
                  Seat Matrix
                </Text>
              </TouchableOpacity>
            </View>
            {trackingMode === 'map' ? (
              <AdmissionLiveTrackingView />
            ) : (
              <AdmissionSeatTrackingView
                key={`tracking_${refreshKey}`}
                onNavigateToStudents={handleNavigateToStudents}
              />
            )}
          </View>
        );
      case 'transport':
        return <TransportManagementView roleLabel="Admissions transport desk" />;
      case 'profile':
        return <AdmissionProfileView />;
      default:
        return (
          <AdmissionStudentsView
            key={`students_${refreshKey}_${targetBranchId}_${targetStatus}`}
            initialBranchId={targetBranchId}
            initialStatus={targetStatus}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {/* Unified Kivquo Header with Drawer Menu */}
        <UnifiedHeader
          userName={fullName}
          profilePic={profilePic}
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => setActiveTab('profile')}
          showProfile={activeTab !== 'profile'}
        />

        {/* Tab Content View */}
        <View style={styles.content}>{renderContent()}</View>

        {/* Floating Add Student Action Button (+) - Available ONLY for Registry */}
        {activeTab === 'students' && (
          <TouchableOpacity
            style={styles.floatingAddBtn}
            onPress={() => setIntakeModalVisible(true)}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={24} color="#1A1B1C" />
          </TouchableOpacity>
        )}

        <FloatingFooter
          tabs={tabs}
          activeKey={activeTab}
          onTabPress={(key) => {
            if (key !== 'students') {
              setTargetBranchId(undefined);
              setTargetStatus(undefined);
            }
            setActiveTab(key);
          }}
        />
      </SafeAreaView>

      {/* Side Drawer Modal */}
      <AdmissionDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fullName={fullName}
        email={email}
        profilePic={profilePic}
        institutionName={institutionName}
        activeTab={activeTab}
        onTabSwitch={(tab) => {
          setActiveTab(tab);
          setDrawerOpen(false);
        }}
      />

      {/* Dynamic Admission Intake Modal (+) */}
      <AdmissionStudentFormModal
        visible={intakeModalVisible}
        onClose={() => setIntakeModalVisible(false)}
        courses={courses}
        activeBatch="2026-2027"
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  safe: { flex: 1 },
  content: { flex: 1 },

  trackingContainer: { flex: 1, backgroundColor: '#FAF8F5' },
  trackingToggle: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 12,
    marginTop: 10,
    padding: 4,
    borderRadius: 10,
    backgroundColor: '#F1EFE9',
  },
  trackingToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackingToggleBtnActive: { backgroundColor: '#F4C430' },
  trackingToggleText: { fontSize: 12, fontFamily: FontFamily.medium, color: '#6B7280' },
  trackingToggleTextActive: { color: '#1A1B1C', fontFamily: FontFamily.bold },

  // Floating (+) Intake Button
  floatingAddBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 104 : 88,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 99,
  },

  // Bottom Tab Bar
  tabBarBg: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  tabLabel: {
    fontSize: 10,
    color: '#8A8A8A',
    fontWeight: '600',
    marginTop: 2,
    fontFamily: FontFamily.medium,
  },
  tabLabelActive: {
    color: '#1A1B1C',
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
});
