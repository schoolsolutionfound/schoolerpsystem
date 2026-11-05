import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../../store/useUserStore';
import { performLogout } from '../../../utils/logout';
import { UnifiedHeader } from '../../shared/components/layout/UnifiedHeader';
import { DriverDrawer } from './DriverDrawer';
import type { DriverTab } from './DriverDrawer';
import { FloatingFooter } from '../../shared/components/layout/FloatingFooter';

const ROUTES: Record<DriverTab, string> = {
  trips: '/(driver)/home',
  announcements: '/(driver)/announcements',
  profile: '/(driver)/profile',
};

const TABS: { key: DriverTab; label: string; icon: string; iconFilled: string }[] = [
  { key: 'trips', label: 'My Trips', icon: 'bus', iconFilled: 'bus-clock' },
  { key: 'announcements', label: 'Announcements', icon: 'bullhorn-outline', iconFilled: 'bullhorn' },
  { key: 'profile', label: 'Profile', icon: 'account-outline', iconFilled: 'account' },
];

export const DriverShell: React.FC<{ activeTab: DriverTab; children: React.ReactNode }> = ({
  activeTab,
  children,
}) => {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Driver';
  const profilePic = useUserStore((state) => state.profilePic);
  const email = useUserStore((state) => state.email) || '';
  const institutionName = useUserStore((state) => state.institutionName) || '';
  const resetUser = useUserStore((state) => state.resetUser);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    setTimeout(async () => {
      try {
        await performLogout();
      } catch {}
      resetUser();
      router.replace('/auth');
    }, 120);
  };

  const handleNavigate = (tab: DriverTab) => {
    router.replace(ROUTES[tab] as any);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <UnifiedHeader
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => router.push('/notifications')}
        />

        <View style={styles.content}>{children}</View>

        <FloatingFooter tabs={TABS} activeKey={activeTab} onTabPress={handleNavigate} />
      </SafeAreaView>

      <DriverDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fullName={fullName}
        email={email}
        profilePic={profilePic}
        institutionName={institutionName}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onChangePassword={() => router.push('/change-password')}
        onLogout={handleLogout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  safe: { flex: 1 },
  content: { flex: 1 },
});
