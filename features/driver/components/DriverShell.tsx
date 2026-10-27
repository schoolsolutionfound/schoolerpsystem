import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../../store/useUserStore';
import { performLogout } from '../../../utils/logout';
import { UnifiedHeader } from '../../shared/components/layout/UnifiedHeader';
import { DriverDrawer } from './DriverDrawer';
import { DriverBottomNav, DriverTab } from './DriverBottomNav';

const ROUTES: Record<DriverTab, string> = {
  trips: '/(driver)/home',
  announcements: '/(driver)/announcements',
  profile: '/(driver)/profile',
};

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
          onNotificationsPress={() => {}}
        />

        <View style={styles.content}>{children}</View>

        <DriverBottomNav activeTab={activeTab} />
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
  content: { flex: 1, paddingBottom: 76 },
});
