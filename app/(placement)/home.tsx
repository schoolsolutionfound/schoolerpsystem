import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '../../store/useUserStore';
import { UnifiedHeader } from '../../features/shared/components/layout/UnifiedHeader';
import { FloatingFooter } from '../../features/shared/components/layout/FloatingFooter';
import { useDebugTab } from '../../features/shared/hooks/useDebugTab';
import { PlacementDrawer } from '../../features/placement/components/PlacementDrawer';
import { PlacementDrivesView } from '../../features/placement/components/PlacementDrivesView';
import { PlacementStudentsView } from '../../features/placement/components/PlacementStudentsView';
import { PlacementTeamView } from '../../features/placement/components/PlacementTeamView';
import { PlacementProfileView } from '../../features/placement/components/PlacementProfileView';
import { PlacementResultsView } from '../../features/placement/components/PlacementResultsView';
import { TeacherDrawer } from '../../features/teacher/components/TeacherDrawer';
import { FontFamily } from '../../constants/fonts';

type Tab = 'drives' | 'students' | 'team' | 'results' | 'profile';

export default function PlacementHomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>((params.tab as Tab) || 'drives');
  useDebugTab('placement', activeTab);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fullName = useUserStore((state) => state.fullName) || 'Placement Officer';
  const profilePic = useUserStore((state) => state.profilePic);
  const email = useUserStore((state) => state.email) || '';
  const institutionName = useUserStore((state) => state.institutionName) || '';
  const placementAccess = useUserStore((state) => state.placementAccess);
  const userRole = useUserStore((state) => state.userRole);

  const isTeacher = userRole === 'teacher';
  const showTeamTab =
    !isTeacher &&
    (placementAccess === 'head' || userRole === 'admin' || (userRole as string) === 'placement_officer');

  const tabs = [
    { key: 'drives' as Tab, label: 'Drives', icon: 'briefcase-outline', iconFilled: 'briefcase' },
    { key: 'students' as Tab, label: 'Students', icon: 'account-group-outline', iconFilled: 'account-group' },
    { key: 'results' as Tab, label: 'Results', icon: 'clipboard-list-outline', iconFilled: 'clipboard-list' },
    ...(showTeamTab
      ? [{ key: 'team' as Tab, label: 'Team', icon: 'account-multiple-outline', iconFilled: 'account-multiple' }]
      : []),
    { key: 'profile' as Tab, label: 'Profile', icon: 'account-circle-outline', iconFilled: 'account-circle' },
  ];

  useEffect(() => {
    if (params.tab && ['drives', 'students', 'team', 'results', 'profile'].includes(params.tab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(params.tab as Tab);
    }
  }, [params.tab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'drives':
        return <PlacementDrivesView />;
      case 'students':
        return <PlacementStudentsView />;
      case 'results':
        return <PlacementResultsView />;
      case 'team':
        return showTeamTab ? <PlacementTeamView /> : <PlacementResultsView />;
      case 'profile':
        return <PlacementProfileView />;
      default:
        return <PlacementDrivesView />;
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
        <View style={styles.content}>
          {renderContent()}
        </View>

        <FloatingFooter
          tabs={tabs}
          activeKey={activeTab}
          onTabPress={setActiveTab}
        />
      </SafeAreaView>

      {/* Side Drawer Modal: TeacherDrawer for teachers, PlacementDrawer for placement officers */}
      {isTeacher ? (
        <TeacherDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          fullName={fullName}
          email={email}
          profilePic={profilePic}
          institutionName={institutionName}
          activeTab="placement"
          onTabSwitch={(tab) => {
            setDrawerOpen(false);
            setTimeout(() => {
              router.replace({ pathname: '/(teacher)/home', params: { tab } } as any);
            }, 120);
          }}
        />
      ) : (
        <PlacementDrawer
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  content: { flex: 1 },

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
