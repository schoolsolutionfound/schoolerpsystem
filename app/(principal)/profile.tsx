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

export default function PrincipalProfileScreen() {
  const router = useRouter();
  const fullName = useUserStore((s) => s.fullName) || 'Principal';
  const email = useUserStore((s) => s.email) || '';
  const institutionName = useUserStore((s) => s.institutionName) || '';
  const institutionCode = useUserStore((s) => s.institutionCode) || '';
  const phone = useUserStore((s) => s.phone) || '';
  const designation = useUserStore((s) => s.designation) || 'Principal';
  const qualification = useUserStore((s) => s.qualification) || '';
  const experience = useUserStore((s) => s.experience) || '';
  const institutionType = useUserStore((s) => s.institutionType) || 'school';
  const profilePic = useUserStore((s) => s.profilePic) || '';
  const setUserProfile = useUserStore((s) => s.setUserProfile);
  const resetUser = useUserStore((s) => s.resetUser);

  const handleSaveProfile = async (patch: StaffProfilePatch): Promise<boolean> => {
    const expNum = Number(patch.experience);
    if (patch.experience?.trim() && (Number.isNaN(expNum) || expNum < 0 || expNum > 60)) {
      Alert.alert('Invalid Experience', 'Experience must be a number between 0 and 60 years.');
      return false;
    }

    try {
      await updateMyProfileApi(patch);
      setUserProfile({
        ...(patch.fullName !== undefined ? { fullName: patch.fullName } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
        ...(patch.designation !== undefined ? { designation: patch.designation } : {}),
        ...(patch.qualification !== undefined ? { qualification: patch.qualification } : {}),
        ...(patch.experience !== undefined ? { experience: patch.experience } : {}),
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
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#171717" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Principal Profile</Text>
        </View>

        <StaffProfileView
          roleLabel="Principal"
          fullName={fullName}
          email={email}
          phone={phone}
          designation={designation}
          institutionName={institutionName}
          institutionCode={institutionCode}
          profilePic={profilePic}
          accent="#F4C430"
          accentSoft="#FFF4C7"
          accentText="#92400E"
          avatarBg="#FFF4C7"
          avatarTextColor="#B45309"
          buttonTextColor="#171717"
          details={[
            { id: 'email', icon: 'email-outline', label: 'Official Email', value: email },
            { id: 'phone', icon: 'phone-outline', label: 'Contact Phone', value: phone },
            {
              id: 'qualification',
              icon: 'school-outline',
              label: 'Qualification',
              value: qualification,
            },
            {
              id: 'experience',
              icon: 'briefcase-outline',
              label: 'Experience',
              value: experience ? `${experience} years` : '',
            },
            {
              id: 'institution',
              icon: 'office-building-outline',
              label: 'Institution',
              value: institutionName || institutionCode,
            },
            {
              id: 'institutionType',
              icon: 'domain',
              label: 'Institution Type',
              value: institutionType.toUpperCase(),
            },
          ]}
          extraFields={[
            {
              key: 'qualification',
              label: 'Qualification',
              placeholder: 'e.g. M.Ed, Ph.D in Educational Leadership',
            },
            {
              key: 'experience',
              label: 'Experience (Years)',
              placeholder: 'Years of experience',
              keyboardType: 'numeric',
            },
          ]}
          extraValues={{ qualification, experience }}
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
