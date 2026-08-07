import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useDeveloperStatsQuery,
  useInstitutionsQuery,
  useAdminsQuery,
  useCreateInstitutionMutation,
} from '../hooks/useDeveloperQueries';
import { CreateInstitutionModal } from './CreateInstitutionModal';
import { AppBadge } from '../../shared/components/AppBadge';
import { BorderRadius } from '../../../constants/theme';

const PURPLE = '#7E57C2';
const TEXT_PRIMARY = '#1A202C';
const TEXT_MUTED = '#718096';
const BORDER = '#E2E8F0';

export function DeveloperDashboardContent() {
  const router = useRouter();
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDeveloperStatsQuery();
  const { data: institutions = [], isLoading: instLoading, refetch: refetchInst } = useInstitutionsQuery();
  const { data: admins = [], isLoading: adminsLoading, refetch: refetchAdmins } = useAdminsQuery();
  const createMutation = useCreateInstitutionMutation();

  const isRefreshing = statsLoading || instLoading || adminsLoading;
  const onRefresh = () => { refetchStats(); refetchInst(); refetchAdmins(); };

  const recentInstitutions = institutions.slice(0, 3);
  const recentAdmins = admins.slice(0, 3);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[PURPLE]} />}
    >
      <View style={styles.banner}>
        <View style={styles.brandBadge}>
          <MaterialCommunityIcons name="crown" size={16} color={PURPLE} />
          <Text style={styles.brandBadgeText}>DEVELOPER CONSOLE</Text>
        </View>
        <Text style={styles.welcomeText}>Platform Administration</Text>
        <Text style={styles.subText}>Manage institutions, admins, and system configurations</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#EDE7F6' }]}>
            <MaterialCommunityIcons name="office-building" size={22} color={PURPLE} />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{stats?.totalInstitutions ?? institutions.length}</Text>
            <Text style={styles.statLabel} numberOfLines={2}>Total Institutions</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={22} color="#16A34A" />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{stats?.activeInstitutions ?? institutions.filter(i => i.subscriptionStatus === 'active').length}</Text>
            <Text style={styles.statLabel} numberOfLines={2}>Active Institutions</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#EDE7F6' }]}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color={PURPLE} />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>{stats?.institutionAdmins ?? admins.length}</Text>
            <Text style={styles.statLabel} numberOfLines={2}>Institution Admins</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="currency-inr" size={22} color="#D97706" />
          </View>
          <View style={styles.statTextContainer}>
            <Text style={styles.statValue}>
              ₹{(stats?.monthlyRevenue ?? (stats?.activeInstitutions ?? 0) * 5000).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.statLabel} numberOfLines={2}>Monthly Revenue</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Onboarding Shortcuts</Text>
      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickActionCard} onPress={() => setCreateModalVisible(true)}>
          <View style={[styles.quickIconCircle, { backgroundColor: '#EDE7F6' }]}>
            <MaterialCommunityIcons name="domain-plus" size={24} color={PURPLE} />
          </View>
          <Text style={styles.quickActionTitle}>Create Institution</Text>
          <Text style={styles.quickActionSub}>Register a new school or college</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard}>
          <View style={[styles.quickIconCircle, { backgroundColor: '#EDE7F6' }]}>
            <MaterialCommunityIcons name="account-plus-outline" size={24} color={PURPLE} />
          </View>
          <Text style={styles.quickActionTitle}>Create Admin</Text>
          <Text style={styles.quickActionSub}>Assign institution administrator</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Institutions</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentInstitutions.map((item) => (
        <View key={item.id} style={styles.feedCard}>
          <View style={styles.feedRow}>
            <View style={[styles.feedIconContainer, { backgroundColor: '#EDE7F6' }]}>
              <MaterialCommunityIcons name="office-building" size={20} color={PURPLE} />
            </View>
            <View style={styles.feedInfo}>
              <Text style={styles.feedTitle} numberOfLines={1}>{item.institutionName}</Text>
              <Text style={styles.feedSubtitle}>{item.institutionCode}  {item.institutionType.toUpperCase()}</Text>
            </View>
            <AppBadge label={item.subscriptionStatus || 'Active'} type={item.subscriptionStatus === 'inactive' ? 'inactive' : 'active'} />
          </View>
        </View>
      ))}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Admins</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {recentAdmins.map((admin) => (
        <View key={admin.id} style={styles.feedCard}>
          <View style={styles.feedRow}>
            <View style={[styles.feedIconContainer, { backgroundColor: '#EDE7F6' }]}>
              <MaterialCommunityIcons name="account-tie" size={20} color={PURPLE} />
            </View>
            <View style={styles.feedInfo}>
              <Text style={styles.feedTitle} numberOfLines={1}>{admin.fullName}</Text>
              <Text style={styles.feedSubtitle}>{admin.title}  {admin.institutionName}</Text>
            </View>
            <AppBadge label="Active" type="active" />
          </View>
        </View>
      ))}

      <View style={{ height: 24 }} />

      <CreateInstitutionModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={async (values) => {
          try {
            await createMutation.mutateAsync(values);
            refetchInst();
            refetchStats();
          } catch {}
        }}
        loading={createMutation.isPending}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 16 },
  banner: { backgroundColor: PURPLE, borderRadius: BorderRadius.card, padding: 20 },
  brandBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.chip, alignSelf: 'flex-start', marginBottom: 12 },
  brandBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  welcomeText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  subText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, lineHeight: 18 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: BORDER },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  statTextContainer: { flex: 1 },
  statValue: { fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY },
  statLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: '500', marginTop: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  viewAllText: { fontSize: 12, color: PURPLE, fontWeight: '600' },
  quickActionsRow: { flexDirection: 'row', gap: 12 },
  quickActionCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 16, borderWidth: 1, borderColor: BORDER, gap: 8 },
  quickIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickActionTitle: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
  quickActionSub: { fontSize: 11, color: TEXT_MUTED, lineHeight: 15 },
  feedCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 12, borderWidth: 1, borderColor: BORDER },
  feedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  feedIconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  feedInfo: { flex: 1 },
  feedTitle: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  feedSubtitle: { fontSize: 12, color: TEXT_MUTED, marginTop: 1 },
});
