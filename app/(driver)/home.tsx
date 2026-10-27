import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { performLogout } from '../../utils/logout';
import { UnifiedHeader } from '../../features/shared/components/layout/UnifiedHeader';
import { FloatingFooter } from '../../features/shared/components/layout/FloatingFooter';
import { useDebugTab } from '../../features/shared/hooks/useDebugTab';
import { DriverDrawer } from '../../features/driver/components/DriverDrawer';
import { DriverTripsView } from '../../features/driver/components/DriverTripsView';
import { FontFamily } from '../../constants/fonts';
import { UserAnnouncementFeedView } from '../../features/announcements';

type Tab = 'trips' | 'announcements' | 'profile';

const TABS: { key: Tab; label: string; icon: string; iconFilled: string }[] = [
  { key: 'trips', label: 'My Trips', icon: 'bus', iconFilled: 'bus-clock' },
  { key: 'announcements', label: 'Announcements', icon: 'bullhorn-outline', iconFilled: 'bullhorn' },
  { key: 'profile', label: 'Profile', icon: 'account-outline', iconFilled: 'account' },
];

export default function DriverHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Driver';
  const profilePic = useUserStore((state) => state.profilePic);
  const email = useUserStore((state) => state.email) || '';
  const institutionName = useUserStore((state) => state.institutionName) || '';
  const resetUser = useUserStore((state) => state.resetUser);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await performLogout();
          } catch {}
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  const [activeTab, setActiveTab] = useState<Tab>('trips');
  useDebugTab('driver', activeTab);
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
      tintColor="#000000"
      colors={['#000000']}
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
      case 'announcements':
        return <UserAnnouncementFeedView />;
      case 'profile':
        return (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            <View style={styles.profileCard}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatarPlaceholder}>
                  <MaterialCommunityIcons name="bus" size={36} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.profileName}>{fullName}</Text>
              <Text style={styles.profileEmail}>{email}</Text>
              {institutionName ? (
                <View style={styles.instBadge}>
                  <MaterialCommunityIcons name="office-building" size={14} color="#0EA5E9" />
                  <Text style={styles.instText}>{institutionName}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={18} color="#DC3545" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <UnifiedHeader
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => {}}
        />

        <View style={styles.content}>
          {renderTabContent()}
        </View>

        <FloatingFooter
          tabs={TABS}
          activeKey={activeTab}
          onTabPress={setActiveTab}
        />
      </SafeAreaView>

      <DriverDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fullName={fullName}
        email={email}
        profilePic={profilePic}
        institutionName={institutionName}
        onLogout={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEFE' },
  safe: { flex: 1 },
  content: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 16 },

  profileCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2B2C',
    gap: 8,
  },
  avatarWrap: { marginBottom: 4 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  profileEmail: { fontSize: 13, color: '#8A8A8A' },
  instBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  instText: { fontSize: 12, fontWeight: '600', color: '#0EA5E9' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#DC3545' },

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
