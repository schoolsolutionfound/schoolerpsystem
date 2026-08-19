import React from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
import { AdminProfileView } from '../../features/admin/components/AdminProfileView';

export default function AdminProfileScreen() {
  const router = useRouter();
  const fullName = useUserStore((s) => s.fullName) || 'Admin';
  const email = useUserStore((s) => s.email) || '';
  const institutionName = useUserStore((s) => s.institutionName) || '';
  const institutionCode = useUserStore((s) => s.institutionCode) || '';
  const designation = useUserStore((s) => s.designation) || '';
  const resetUser = useUserStore((s) => s.resetUser);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
          try { await signOut(auth); } catch {}
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
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
        onChangePassword={() => router.push('/change-password')}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A202C' },
});
