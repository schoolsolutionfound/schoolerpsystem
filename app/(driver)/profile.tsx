import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { BorderRadius } from '../../constants/theme';

export default function DriverProfileScreen() {
  const router = useRouter();
  const fullName = useUserStore((s) => s.fullName) || 'Driver';
  const email = useUserStore((s) => s.email) || '';
  const phone = useUserStore((s) => s.phone) || '';
  const institutionName = useUserStore((s) => s.institutionName) || '';
  const resetUser = useUserStore((s) => s.resetUser);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

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
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} progressBackgroundColor="#FFFFFF" />
          }
        >
          <View style={styles.heroSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{fullName.substring(0, 2).toUpperCase()}</Text>
            </View>
            <Text style={styles.heroName}>{fullName}</Text>
            <Text style={styles.heroEmail}>{email}</Text>
            {institutionName ? <Text style={styles.heroInst}>{institutionName}</Text> : null}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="phone-outline" size={16} color="#0EA5E9" />
              <Text style={styles.sectionTitle}>Contact</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{phone || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email || '—'}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={17} color="#DC3545" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEFE' },
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },
  heroSection: {
    backgroundColor: '#1A1B1C',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2C',
    gap: 8,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  heroName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  heroEmail: { fontSize: 13, color: '#8A8A8A' },
  heroInst: { fontSize: 12, color: '#0EA5E9', fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    marginHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE9D6',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1A1B1C' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F1EA',
  },
  infoLabel: { fontSize: 12, color: '#8A8A8A', fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#1A1B1C' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#DC3545' },
});
