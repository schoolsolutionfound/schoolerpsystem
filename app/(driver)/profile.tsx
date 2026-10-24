import React, { useState } from 'react';
import { Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../store/useUserStore';
import { performLogout } from '../../utils/logout';
import { DriverShell } from '../../features/driver/components/DriverShell';
import { DriverProfileTab, DriverProfilePatch } from '../../features/driver/components/DriverProfileTab';
import { updateMyProfileApi } from '../../api/users';

export default function DriverProfileScreen() {
  const router = useRouter();
  const fullName = useUserStore((s) => s.fullName) || 'Driver';
  const email = useUserStore((s) => s.email) || '';
  const phone = useUserStore((s) => s.phone) || '';
  const designation = useUserStore((s) => s.designation) || '';
  const profilePic = useUserStore((s) => s.profilePic) || '';
  const institutionName = useUserStore((s) => s.institutionName) || '';
  const institutionCode = useUserStore((s) => s.institutionCode) || '';
  const setUserProfile = useUserStore((s) => s.setUserProfile);
  const resetUser = useUserStore((s) => s.resetUser);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleSaveProfile = async (patch: DriverProfilePatch): Promise<boolean> => {
    try {
      const profile: any = await updateMyProfileApi(patch);
      const nextName = profile?.fullName ?? patch.fullName;
      const nextPhone = profile?.phone ?? patch.phone;
      const nextDesignation = profile?.designation ?? patch.designation;
      const nextProfilePic = profile?.profilePicUrl ?? patch.profilePicUrl;

      setUserProfile({
        ...(nextName ? { fullName: nextName } : {}),
        ...(patch.phone !== undefined ? { phone: nextPhone || '' } : {}),
        ...(patch.designation !== undefined ? { designation: nextDesignation || '' } : {}),
        ...(nextProfilePic ? { profilePic: nextProfilePic } : {}),
      });

      Alert.alert('Profile Updated', 'Your profile details have been saved.');
      return true;
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not save your profile. Please try again.');
      return false;
    }
  };

  return (
    <DriverShell activeTab="profile">
      <DriverProfileTab
        fullName={fullName}
        email={email}
        phone={phone}
        institutionName={institutionName}
        institutionCode={institutionCode}
        designation={designation}
        profilePic={profilePic}
        onSaveProfile={handleSaveProfile}
        onChangePassword={() => router.push('/change-password')}
        onLogout={handleLogout}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 800);
            }}
            tintColor="#1A1B1C"
            colors={['#1A1B1C']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      />
    </DriverShell>
  );
}
