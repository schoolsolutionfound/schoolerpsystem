import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { DriverHomeHeader } from '../../features/driver/components/DriverHomeHeader';
import { DriverDrawer } from '../../features/driver/components/DriverDrawer';
import { DriverTripsView } from '../../features/driver/components/DriverTripsView';
import { DriverProfileTab } from '../../features/driver/components/DriverProfileTab';
import { FontFamily } from '../../constants/fonts';

type Tab = 'trips' | 'profile';

const TABS: { key: Tab; label: string; icon: string; iconFilled: string }[] = [
  { key: 'trips', label: 'My Trips', icon: 'bus', iconFilled: 'bus-clock' },
  { key: 'profile', label: 'Profile', icon: 'account-outline', iconFilled: 'account' },
];

export default function DriverHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Driver';
  const profilePic = useUserStore((state) => state.profilePic);
  const email = useUserStore((state) => state.email) || '';
  const institutionName = useUserStore((state) => state.institutionName) || '';

  const [activeTab, setActiveTab] = useState<Tab>('trips');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#1A1B1C"
      colors={['#1A1B1C']}
      progressBackgroundColor="#FFFFFF"
    />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trips':
        return (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            <DriverTripsView />
          </ScrollView>
        );
      case 'profile':
        return (
          <DriverProfileTab
            fullName={fullName}
            email={email}
            institutionName={institutionName}
            refreshControl={refreshControl}
            onLogout={() => router.replace('/auth')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <DriverHomeHeader
          fullName={fullName}
          profilePic={profilePic}
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => {}}
          onProfilePress={() => setActiveTab('profile')}
        />

        <View style={styles.content}>
          {renderTabContent()}
        </View>

        {/* Bottom Tab Bar */}
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
                      color={isActive ? '#FFFFFF' : '#9CA3AF'}
                    />
                  </View>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      <DriverDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fullName={fullName}
        email={email}
        profilePic={profilePic}
        institutionName={institutionName}
        onSelectTab={(tab) => setActiveTab(tab)}
        onSwitchToStudentView={() => {
          useUserStore.getState().setUserProfile({
            userRole: 'student',
            fullName: 'naseeb decor oondiye',
            email: 'alex.student@schoolerp.dev',
            rollNoOrUSN: 'YU2024001',
          });
          router.push('/(student)/home?tab=bus');
        }}
        onLogout={() => router.replace('/auth')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEFE' },
  safe: { flex: 1 },
  content: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 16 },
  // Tab bar
  tabBarBg: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingTop: 8,
    paddingBottom: 16,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
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
    backgroundColor: '#0EA5E9',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#0EA5E9',
    fontFamily: FontFamily.bold,
  },
});
