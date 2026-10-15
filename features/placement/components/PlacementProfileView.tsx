import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { useUserStore } from '../../../store/useUserStore';
import { useRouter } from 'expo-router';

export function PlacementProfileView() {
  const fullName = useUserStore((state) => state.fullName);
  const email = useUserStore((state) => state.email);
  const resetUser = useUserStore((state) => state.resetUser);
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try { await signOut(auth); } catch {}
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{fullName?.[0] || 'P'}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.role}>Placement Officer</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 24, fontFamily: FontFamily.bold, color: '#111827' },
  content: { flex: 1, padding: 16, alignItems: 'center' },
  card: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontFamily: FontFamily.bold, color: '#3B82F6' },
  name: { fontSize: 20, fontFamily: FontFamily.bold, color: '#111827', marginBottom: 4 },
  email: { fontSize: 14, fontFamily: FontFamily.regular, color: '#6B7280', marginBottom: 12 },
  role: { fontSize: 14, fontFamily: FontFamily.medium, color: '#3B82F6', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, gap: 8 },
  logoutText: { fontSize: 16, fontFamily: FontFamily.semibold, color: '#EF4444' }
});
