import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useDeveloperStatsQuery,
  useInstitutionsQuery,
  useAdminsQuery,
} from '../../features/developer/hooks/useDeveloperQueries';
import { CreateInstitutionModal } from '../../features/developer/components/CreateInstitutionModal';
import { AppCard } from '../../features/shared/components/AppCard';
import { AppBadge } from '../../features/shared/components/AppBadge';
import { Colors, BorderRadius } from '../../constants/theme';

export default function DeveloperHomeScreen() {
  const router = useRouter();
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDeveloperStatsQuery();
  const { data: institutions = [], isLoading: instLoading, refetch: refetchInst } = useInstitutionsQuery();
  const { data: admins = [], isLoading: adminsLoading, refetch: refetchAdmins } = useAdminsQuery();

  const isRefreshing = statsLoading || instLoading || adminsLoading;

  const onRefresh = () => {
    refetchStats();
    refetchInst();
    refetchAdmins();
  };

  const recentInstitutions = institutions.slice(0, 3);
  const recentAdmins = admins.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.light.primary]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.crownContainer}>
              <MaterialCommunityIcons name="crown" size={24} color={Colors.light.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Developer Dashboard</Text>
              <Text style={styles.headerSubtitle}>Welcome back, Super Admin 👋</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialCommunityIcons name="bell-outline" size={22} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* Purple Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Overview</Text>
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>This Month</Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="office-building" size={22} color={Colors.light.primary} />
              </View>
              <Text style={styles.statValue}>{stats?.totalInstitutions ?? institutions.length}</Text>
              <Text style={styles.statLabel}>Institutions</Text>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="check-circle-outline" size={22} color={Colors.light.success} />
              </View>
              <Text style={styles.statValue}>{stats?.activeInstitutions ?? institutions.filter(i => i.subscriptionStatus === 'active').length}</Text>
              <Text style={styles.statLabel}>Active Institutions</Text>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="account-group-outline" size={22} color={Colors.light.secondary} />
              </View>
              <Text style={styles.statValue}>{stats?.institutionAdmins ?? admins.length}</Text>
              <Text style={styles.statLabel}>Institution Admins</Text>
            </View>

            <View style={styles.statBox}>
              <View style={styles.statIconContainer}>
                <MaterialCommunityIcons name="currency-inr" size={22} color={Colors.light.warning} />
              </View>
              <Text style={styles.statValue}>
                ₹{(stats?.monthlyRevenue ?? (stats?.activeInstitutions ?? 0) * 5000).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => setCreateModalVisible(true)}>
            <View style={styles.quickActionIconContainer}>
              <MaterialCommunityIcons name="domain-plus" size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.quickActionText}>Create Institution</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/(developer)/admins' as any)}>
            <View style={styles.quickActionIconContainer}>
              <MaterialCommunityIcons name="account-plus-outline" size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.quickActionText}>Create Admin</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Institutions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Institutions</Text>
          <TouchableOpacity onPress={() => router.push('/(developer)/institutions' as any)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentInstitutions.map((item) => (
          <AppCard key={item.id} style={styles.feedCard}>
            <View style={styles.feedRow}>
              <View style={styles.feedIconContainer}>
                <MaterialCommunityIcons name="office-building" size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.feedInfo}>
                <Text style={styles.feedTitle} numberOfLines={1}>{item.institutionName}</Text>
                <Text style={styles.feedSubtitle}>{item.institutionCode} • {item.institutionType.toUpperCase()}</Text>
              </View>
              <AppBadge
                label={item.subscriptionStatus || 'Active'}
                type={item.subscriptionStatus === 'inactive' ? 'inactive' : 'active'}
              />
            </View>
          </AppCard>
        ))}

        {/* Recent Admins */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Admins</Text>
          <TouchableOpacity onPress={() => router.push('/(developer)/admins' as any)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentAdmins.map((admin) => (
          <AppCard key={admin.id} style={styles.feedCard}>
            <View style={styles.feedRow}>
              <View style={styles.feedIconContainer}>
                <MaterialCommunityIcons name="account-tie" size={20} color={Colors.light.primary} />
              </View>
              <View style={styles.feedInfo}>
                <Text style={styles.feedTitle} numberOfLines={1}>{admin.fullName}</Text>
                <Text style={styles.feedSubtitle}>{admin.title} • {admin.institutionName}</Text>
              </View>
              <AppBadge label="Active" type="active" />
            </View>
          </AppCard>
        ))}
      </ScrollView>

      {/* Create Institution Modal */}
      <CreateInstitutionModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={async () => {
          refetchInst();
          refetchStats();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crownContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  iconButton: {
    padding: 6,
  },
  overviewCard: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.card,
    padding: 16,
    marginBottom: 24,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.chip,
  },
  monthBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginRight: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    color: Colors.light.text,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  viewAllText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quickActionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  feedCard: {
    marginBottom: 8,
    padding: 12,
    borderRadius: BorderRadius.card,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  feedInfo: {
    flex: 1,
  },
  feedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  feedSubtitle: {
    fontSize: 12,
    color: Colors.light.muted,
  },
});
