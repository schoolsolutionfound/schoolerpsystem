import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
import { BorderRadius } from '../../constants/theme';

export default function StudentProfileScreen() {
  const router = useRouter();
  const fullName = useUserStore((s) => s.fullName) || 'Student';
  const email = useUserStore((s) => s.email) || '';
  const rollNoOrUSN = useUserStore((s) => s.rollNoOrUSN) || '';
  const institutionName = useUserStore((s) => s.institutionName) || '';
  const institutionCode = useUserStore((s) => s.institutionCode) || '';
  const institutionType = useUserStore((s) => s.institutionType) || 'college';
  const phone = useUserStore((s) => s.phone) || '';
  const parentPhone = useUserStore((s) => s.parentPhone) || '';
  const tenthPercentage = useUserStore((s) => s.tenthPercentage) || '';
  const twelfthPercentage = useUserStore((s) => s.twelfthPercentage) || '';
  const resetUser = useUserStore((s) => s.resetUser);

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
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{fullName.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nameText}>{fullName}</Text>
                <Text style={styles.emailText}>{email}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>Student</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Academic Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>USN / Roll No</Text>
              <Text style={styles.infoValue}>{rollNoOrUSN || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{phone || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Parent Phone</Text>
              <Text style={styles.infoValue}>{parentPhone || '—'}</Text>
            </View>
            {institutionType === 'college' && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>10th %</Text>
                  <Text style={styles.infoValue}>{tenthPercentage || '—'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>12th %</Text>
                  <Text style={styles.infoValue}>{twelfthPercentage || '—'}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Institution</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{institutionName || institutionCode || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Code</Text>
              <Text style={styles.infoValue}>{institutionCode || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{institutionType === 'college' ? 'College' : 'School'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/change-password')}>
              <MaterialCommunityIcons name="lock-reset" size={20} color="#7E57C2" />
              <Text style={styles.menuText}>Change Password</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={20} color="#DC3545" />
              <Text style={[styles.menuText, { color: '#DC3545' }]}>Logout</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A202C' },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#EDE7F6', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#7E57C2' },
  nameText: { fontSize: 18, fontWeight: '800', color: '#1A202C' },
  emailText: { fontSize: 13, color: '#718096', marginTop: 2 },
  badgeRow: { marginTop: 6 },
  roleBadge: { backgroundColor: '#EDE7F6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.chip, alignSelf: 'flex-start' },
  roleBadgeText: { fontSize: 11, fontWeight: '800', color: '#7E57C2' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A202C' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 28 },
  infoLabel: { fontSize: 13, color: '#718096', fontWeight: '500', flexShrink: 1 },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#1A202C', flexShrink: 1, textAlign: 'right' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuText: { fontSize: 14, fontWeight: '600', color: '#1A202C' },
});
