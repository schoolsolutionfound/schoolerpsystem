import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { performLogout } from '../../utils/logout';
import { useUserStore } from '../../store/useUserStore';
import { DeveloperDashboardContent } from '../../features/developer/components/DeveloperDashboardContent';
import { InstitutionListScreen } from '../../features/developer/screens/InstitutionListScreen';
import { DeveloperAdminsContent } from '../../features/developer/components/DeveloperAdminsContent';
import { DeveloperProfileContent } from '../../features/developer/components/DeveloperProfileContent';
import { DeveloperMenuDrawer } from '../../features/developer/components/DeveloperMenuDrawer';
import { UnifiedHeader } from '../../features/shared/components/layout/UnifiedHeader';
import { FloatingFooter } from '../../features/shared/components/layout/FloatingFooter';
import { useDebugTab } from '../../features/shared/hooks/useDebugTab';
import { updateMyProfileApi } from '../../api/users';

type DevTab = 'home' | 'institutions' | 'admins' | 'profile';

const TABS: { key: DevTab; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { key: 'home', label: 'Home', icon: 'home-variant-outline' },
  { key: 'institutions', label: 'Institutions', icon: 'domain' },
  { key: 'admins', label: 'Admins', icon: 'account-group-outline' },
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline' },
];

export default function DeveloperHomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DevTab>('home');
  useDebugTab('developer', activeTab);
  const [menuOpen, setMenuOpen] = useState(false);
  const fullName = useUserStore((state) => state.fullName) || 'Super Admin';
  const email = useUserStore((state) => state.email) || '';
  const phone = useUserStore((state) => state.phone) || '';
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const resetUser = useUserStore((state) => state.resetUser);

  const handleUpdateProfile = async (patch: { fullName?: string; phone?: string }): Promise<boolean> => {
    try {
      const res: any = await updateMyProfileApi(patch);
      const updated = res?.data ?? res;
      const nextName = updated?.fullName ?? patch.fullName;
      const nextPhone = updated?.phone ?? patch.phone;
      if (nextName || nextPhone) {
        setUserProfile({
          ...(nextName ? { fullName: nextName } : {}),
          ...(nextPhone ? { phone: nextPhone } : {}),
        });
      }
      Alert.alert('Profile Updated', 'Your profile has been saved.');
      return true;
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not save profile. Please try again.');
      return false;
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of Developer Panel?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await performLogout();
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <UnifiedHeader
          onMenuPress={() => setMenuOpen(true)}
          onNotificationsPress={() => router.push('/notifications')}
        />

        <View style={{ flex: 1 }}>
          {activeTab === 'home' && <DeveloperDashboardContent />}
          {activeTab === 'institutions' && <InstitutionListScreen />}
          {activeTab === 'admins' && <DeveloperAdminsContent />}
          {activeTab === 'profile' && (
            <DeveloperProfileContent
              fullName={fullName}
              email={email}
              phone={phone}
              onChangePassword={() => router.push('/change-password')}
              onLogout={handleLogout}
              onSaveProfile={handleUpdateProfile}
            />
          )}
        </View>

        <FloatingFooter
          tabs={TABS}
          activeKey={activeTab}
          onTabPress={setActiveTab}
        />
      </SafeAreaView>

      <DeveloperMenuDrawer
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab as DevTab)}
        fullName={fullName}
        email={email}
        onLogout={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    paddingVertical: 6,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  tabLabel: { fontSize: 10, fontWeight: '500', color: '#6B6B6B', marginTop: 3 },
  tabLabelActive: { color: '#F4C430', fontWeight: '700' },
});
