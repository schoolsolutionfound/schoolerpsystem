import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { getHomeRouteForRole } from '../../features/shared/utils/routeGuards';

export default function AccountantHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName);
  const institutionName = useUserStore((state) => state.institutionName);
  const roles = useUserStore((state) => state.roles || []);
  const switchRole = useUserStore((state) => state.switchRole);

  const hasAdmissionRole = roles.includes('admission_officer') || roles.includes('admin');

  const handleSwitchToAdmissions = () => {
    switchRole('admission_officer');
    router.replace('/(admin)/admissions');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Accountant & Finance</Text>
            <Text style={styles.headerSubtitle}>{institutionName || 'School Finance Portal'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(accountant)/profile')} style={styles.profileBtn}>
            <MaterialCommunityIcons name="account-circle-outline" size={28} color="#0284C7" />
          </TouchableOpacity>
        </View>

        {/* Multi-role Switcher Banner */}
        {hasAdmissionRole && (
          <TouchableOpacity
            style={styles.roleBanner}
            onPress={handleSwitchToAdmissions}
            activeOpacity={0.85}
          >
            <View style={styles.roleBannerLeft}>
              <MaterialCommunityIcons name="account-switch-outline" size={24} color="#0284C7" />
              <View>
                <Text style={styles.roleBannerTitle}>Dual-Role Active: Admission Officer</Text>
                <Text style={styles.roleBannerSub}>Tap to open Admissions Workspace & manage applicants</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#0284C7" />
          </TouchableOpacity>
        )}

        <View style={styles.content}>
          <View style={styles.card}>
            <MaterialCommunityIcons name="calculator-variant-outline" size={48} color="#0284C7" />
            <Text style={styles.cardTitle}>Welcome, {fullName || 'Accountant'}</Text>
            <Text style={styles.cardSub}>
              You have access to fee management, transaction auditing, and financial records.
            </Text>

            {hasAdmissionRole && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleSwitchToAdmissions}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="clipboard-text-clock-outline" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Go to Admissions Portal</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  profileBtn: { padding: 4 },
  roleBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  roleBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  roleBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  roleBannerSub: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 2,
  },
  content: { flex: 1, padding: 16, justifyContent: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
