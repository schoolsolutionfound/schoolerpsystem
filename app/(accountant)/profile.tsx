import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { performLogout } from '../../utils/logout';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useUserStore } from '../../store/useUserStore';
import { ProfileCustomFields } from '../../features/shared/formFields/ProfileCustomFields';
import { useProfileCustomFields } from '../../features/shared/formFields/useProfileCustomFields';

export default function AccountantProfileScreen() {
  const router = useRouter();
  const fullName = useUserStore((s) => s.fullName) || 'Accountant';
  const email = useUserStore((s) => s.email) || '';
  const institutionName = useUserStore((s) => s.institutionName) || '';
  const institutionCode = useUserStore((s) => s.institutionCode) || '';
  const phone = useUserStore((s) => s.phone) || '';
  const employeeId = useUserStore((s) => s.employeeId) || '';
  const qualification = useUserStore((s) => s.qualification) || '';
  const resetUser = useUserStore((s) => s.resetUser);
  const { fields: roleFields, values: roleFieldValues, save: saveRoleFields } = useProfileCustomFields();

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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#171717" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{fullName.substring(0, 2).toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.nameText}>{fullName}</Text>
            <Text style={styles.emailText}>{email}</Text>
            <Text style={styles.roleText}>Accountant</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Contact Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{phone || '—'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Employment & Qualification</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Employee ID</Text>
              <Text style={styles.infoValue}>{employeeId || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Qualification</Text>
              <Text style={styles.infoValue}>{qualification || '—'}</Text>
            </View>
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
          </View>

          {roleFields.length > 0 && (
            <ProfileCustomFields fields={roleFields} values={roleFieldValues} onSave={saveRoleFields} />
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/change-password')}>
              <MaterialCommunityIcons name="lock-reset" size={20} color="#F4C430" />
              <Text style={styles.menuText}>Change Password</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#6B6B6B" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={20} color="#DC3545" />
              <Text style={[styles.menuText, { color: '#DC3545' }]}>Logout</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#6B6B6B" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFEFE',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#111827', textAlign: 'center' },
  headerSpacer: { width: 36 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 6,
  },
  avatarWrap: { alignSelf: 'center', marginBottom: 6 },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4C7',
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#171717' },
  nameText: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  emailText: { fontSize: 12, color: '#6B7280', marginTop: 2, textAlign: 'center' },
  roleText: { fontSize: 11, fontWeight: '700', color: '#B8860B', textAlign: 'center', marginTop: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 28 },
  infoLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500', flexShrink: 1 },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#111827', flexShrink: 1, textAlign: 'right' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuText: { fontSize: 14, fontWeight: '600', color: '#111827' },
});
