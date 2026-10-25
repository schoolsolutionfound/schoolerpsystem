import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { performLogout } from '../../utils/logout';
import { useUserStore } from '../../store/useUserStore';
import { updateMyProfileApi } from '../../api/users';
import {
  StaffProfileView,
  StaffProfilePatch,
} from '../../features/shared/components/StaffProfileView';

export default function HODProfileScreen() {
  const router = useRouter();
  const fullName = useUserStore((s) => s.fullName) || 'HOD';
  const email = useUserStore((s) => s.email) || '';
  const institutionName = useUserStore((s) => s.institutionName) || '';
  const institutionCode = useUserStore((s) => s.institutionCode) || '';
  const phone = useUserStore((s) => s.phone) || '';
  const department = useUserStore((s) => s.department) || '';
  const employeeId = useUserStore((s) => s.employeeId) || '';
  const designation = useUserStore((s) => s.designation) || 'Head of Department';
  const profilePic = useUserStore((s) => s.profilePic) || '';
  const setUserProfile = useUserStore((s) => s.setUserProfile);
  const resetUser = useUserStore((s) => s.resetUser);

  const handleSaveProfile = async (patch: StaffProfilePatch): Promise<boolean> => {
    try {
      await updateMyProfileApi(patch);
      setUserProfile({
        ...(patch.fullName !== undefined ? { fullName: patch.fullName } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
        ...(patch.designation !== undefined ? { designation: patch.designation } : {}),
        ...(patch.profilePicUrl ? { profilePic: patch.profilePicUrl } : {}),
      });
      Alert.alert('Profile Updated', 'Your profile information has been saved successfully.');
      return true;
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not update your profile. Please try again.');
      return false;
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
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
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#171717" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Department Profile</Text>
        </View>

        <StaffProfileView
          roleLabel="HOD"
          fullName={fullName}
          email={email}
          phone={phone}
          designation={designation}
          institutionName={institutionName}
          institutionCode={institutionCode}
          profilePic={profilePic}
          accent="#D97706"
          accentSoft="#FEF3C7"
          accentText="#92400E"
          avatarBg="#FEF3C7"
          avatarTextColor="#D97706"
          buttonTextColor="#FFFFFF"
          details={[
            { id: 'email', icon: 'email-outline', label: 'Official Email', value: email },
            { id: 'phone', icon: 'phone-outline', label: 'Contact Phone', value: phone },
            { id: 'department', icon: 'domain', label: 'Department', value: department },
            {
              id: 'employeeId',
              icon: 'badge-account-outline',
              label: 'Employee ID',
              value: employeeId,
            },
            {
              id: 'institution',
              icon: 'office-building-outline',
              label: 'Institution',
              value: institutionName || institutionCode,
            },
            {
              id: 'institutionCode',
              icon: 'identifier',
              label: 'Institution Code',
              value: institutionCode,
            },
          ]}
          onSaveProfile={handleSaveProfile}
          onChangePassword={() => router.push('/change-password')}
          onLogout={handleLogout}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#171717' },
});
