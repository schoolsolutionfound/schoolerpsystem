import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { PlacementHomeHeader } from '../../features/placement/components/PlacementHomeHeader';
import { PlacementDrawer } from '../../features/placement/components/PlacementDrawer';
import { PlacementDrivesView } from '../../features/placement/components/PlacementDrivesView';
import { PlacementStudentsView } from '../../features/placement/components/PlacementStudentsView';
import { PlacementTeamView } from '../../features/placement/components/PlacementTeamView';
import { PlacementProfileView } from '../../features/placement/components/PlacementProfileView';
import { FontFamily } from '../../constants/fonts';

type Tab = 'drives' | 'students' | 'team' | 'profile';

const TABS: { key: Tab; label: string; icon: string; iconFilled: string }[] = [
  { key: 'drives', label: 'Drives', icon: 'briefcase-outline', iconFilled: 'briefcase' },
  { key: 'students', label: 'Students', icon: 'account-group-outline', iconFilled: 'account-group' },
  { key: 'team', label: 'Team', icon: 'account-multiple-outline', iconFilled: 'account-multiple' },
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline', iconFilled: 'account-circle' },
];

export default function PlacementHomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>((params.tab as Tab) || 'drives');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fullName = useUserStore((state) => state.fullName) || 'Placement Officer';
  const profilePic = useUserStore((state) => state.profilePic);
  const email = useUserStore((state) => state.email) || '';
  const institutionName = useUserStore((state) => state.institutionName) || '';
  const placementAccess = useUserStore((state) => state.placementAccess);

  useEffect(() => {
    if (params.tab && ['drives', 'students', 'team', 'profile'].includes(params.tab)) {
      setActiveTab(params.tab as Tab);
    }
  }, [params.tab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'drives':
        return <PlacementDrivesView />;
      case 'students':
        return <PlacementStudentsView />;
      case 'team':
        return <PlacementTeamView />;
      case 'profile':
        return <PlacementProfileView />;
      default:
        return <PlacementDrivesView />;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {/* Unified Kivquo Header with Drawer Menu Trigger */}
        <PlacementHomeHeader
          fullName={fullName}
          profilePic={profilePic}
          institutionName={institutionName}
          accessLevel={placementAccess}
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => setActiveTab('profile')}
        />

        {/* Tab Content View */}
        <View style={styles.content}>
          {renderContent()}
        </View>

        {/* Bottom Tab Bar with Kivquo Styling */}
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
                      size={20}
                      color={isActive ? '#1A1B1C' : '#8A8A8A'}
                    />
                  </View>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      {/* Side Drawer Modal */}
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
    width: 44,
    height: 30,
    borderRadius: 15,
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
