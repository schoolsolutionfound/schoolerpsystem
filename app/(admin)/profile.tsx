import React from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { performLogout } from '../../utils/logout';
import { useUserStore } from '../../store/useUserStore';
import { AdminProfileView } from '../../features/admin/components/AdminProfileView';
import { updateMyProfileApi } from '../../api/users';

export default function AdminProfileScreen() {
  const router = useRouter();
  const fullName = useUserStore((s) => s.fullName) || 'Admin';
  const email = useUserStore((s) => s.email) || '';
  const institutionName = useUserStore((s) => s.institutionName) || '';
  const institutionCode = useUserStore((s) => s.institutionCode) || '';
  const designation = useUserStore((s) => s.designation) || '';
  const phone = useUserStore((s) => s.phone) || '';
  const setUserProfile = useUserStore((s) => s.setUserProfile);
  const resetUser = useUserStore((s) => s.resetUser);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
          await performLogout();
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  const handleUpdateProfile = async (patch: {
    fullName?: string;
    phone?: string;
    designation?: string;
    address?: string;
  }): Promise<boolean> => {
    try {
      const res: any = await updateMyProfileApi(patch);
      const updated = res?.data ?? res;
      const nextName = updated?.fullName ?? patch.fullName;
      const nextPhone = updated?.phone ?? patch.phone;
      const nextDesignation = updated?.designation ?? patch.designation;
      if (nextName || nextPhone || nextDesignation) {
        setUserProfile({
          ...(nextName ? { fullName: nextName } : {}),
          ...(nextPhone ? { phone: nextPhone } : {}),
          ...(nextDesignation ? { designation: nextDesignation } : {}),
        });
      }
      Alert.alert('Profile Updated', 'Your profile has been saved.');
      return true;
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not save profile. Please try again.');
      return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <AdminProfileView
        fullName={fullName}
        email={email}
        institutionName={institutionName}
        institutionCode={institutionCode}
        roleName="Institution Administrator"
        designation={designation}
        phone={phone}
        onChangePassword={() => router.push('/change-password')}
        onLogout={handleLogout}
        onSaveProfile={handleUpdateProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E8E5DC', backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#171717' },
});
