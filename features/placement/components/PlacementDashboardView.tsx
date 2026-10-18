import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getPlacementStats, listDrives, PlacementStats, PlacementDrive } from '../../../api/placement';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';

export function PlacementDashboardView() {
  const router = useRouter();
  const [stats, setStats] = useState<PlacementStats | null>(null);
  const [recentDrives, setRecentDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [s, d] = await Promise.all([
        getPlacementStats().catch(() => null),
        listDrives().catch(() => []),
      ]);
      setStats(s);
      setRecentDrives((d || []).slice(0, 5));
    } catch (err) {
      console.warn('Dashboard load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const hiredCount = stats?.hiredCount ?? 0;
  const totalApps = stats?.totalApplications ?? 0;
  const placementRate = totalApps > 0 ? Math.round((hiredCount / totalApps) * 100) : 0;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1A1B1C"
          colors={['#1A1B1C']}
          progressBackgroundColor="#FFFFFF"
        />
      }
    >
      {/* Dark Hero Metric Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroPrimary}>
          <Text style={styles.heroRate}>{placementRate}%</Text>
          <Text style={styles.heroLabel} numberOfLines={1}>Conversion Rate</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={[styles.heroStatVal, { color: '#16A34A' }]}>{hiredCount}</Text>
            <Text style={styles.heroStatLbl} numberOfLines={1} adjustsFontSizeToFit>Placed</Text>
          </View>
          <View style={styles.heroStatItem}>
            <Text style={[styles.heroStatVal, { color: '#F4C430' }]}>{stats?.activeDrives ?? 0}</Text>
            <Text style={styles.heroStatLbl} numberOfLines={1} adjustsFontSizeToFit>Active</Text>
          </View>
        </View>
      </View>

      {/* 2x2 Metric Grid */}
      <View style={styles.grid}>
        <View style={styles.gridCard}>
          <MaterialCommunityIcons name="briefcase-check" size={22} color="#F4C430" />
          <Text style={styles.gridNum}>{stats?.totalDrives ?? 0}</Text>
          <Text style={styles.gridLabel}>Total Drives</Text>
        </View>
        <View style={styles.gridCard}>
          <MaterialCommunityIcons name="file-document-multiple" size={22} color="#16A34A" />
          <Text style={styles.gridNum}>{totalApps}</Text>
          <Text style={styles.gridLabel}>Applications</Text>
        </View>
        <View style={styles.gridCard}>
          <MaterialCommunityIcons name="account-group" size={22} color="#3B82F6" />
          <Text style={styles.gridNum}>{stats?.totalStudents ?? 0}</Text>
          <Text style={styles.gridLabel}>Eligible Students</Text>
        </View>
        <View style={styles.gridCard}>
          <MaterialCommunityIcons name="account-tie" size={22} color="#D97706" />
          <Text style={styles.gridNum}>{stats?.totalMembers ?? 0}</Text>
          <Text style={styles.gridLabel}>Placement Staff</Text>
        </View>
      </View>

      {/* Recent Drives Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>RECENT CAMPUS DRIVES</Text>
        <TouchableOpacity
          onPress={() => router.push('/(placement)/create')}
          style={styles.addBtn}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={14} color="#1A1B1C" />
          <Text style={styles.addBtnText}>New Drive</Text>
        </TouchableOpacity>
      </View>

      {recentDrives.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="briefcase-outline" size={32} color="#6B6B6B" />
          <Text style={styles.emptyTitle}>No Placement Drives Yet</Text>
          <Text style={styles.emptySub}>Create your first drive to start campus recruitment.</Text>
        </View>
      ) : (
        recentDrives.map((d) => (
          <TouchableOpacity
            key={d.id}
            style={styles.driveRow}
            onPress={() => router.push(`/(placement)/${d.id}` as any)}
            activeOpacity={0.7}
          >
            <View style={styles.driveAvatar}>
              <Text style={styles.driveAvatarText}>
                {d.companyName ? d.companyName.substring(0, 2).toUpperCase() : 'CO'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driveTitle}>{d.title}</Text>
              <Text style={styles.driveCompany}>{d.companyName} • {d.location || 'Remote'}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#6B6B6B" />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, paddingBottom: 60, gap: 12 },
  heroCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: BorderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  heroPrimary: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
    paddingHorizontal: 4,
  },
  heroDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#2D2E30',
    marginHorizontal: 4,
  },
  heroRate: { fontSize: 28, fontWeight: '900', color: '#F4C430', lineHeight: 32 },
  heroLabel: { fontSize: 9.5, color: '#8A8A8A', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2, textAlign: 'center' },
  heroStats: { flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  heroStatItem: { flex: 1, alignItems: 'center', minWidth: 0, paddingHorizontal: 2 },
  heroStatVal: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  heroStatLbl: { fontSize: 9.5, color: '#8A8A8A', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2, textAlign: 'center' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 4,
  },
  gridNum: { fontSize: 20, fontWeight: '900', color: '#171717', marginTop: 4 },
  gridLabel: { fontSize: 11, fontWeight: '700', color: '#6B6B6B' },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF4C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addBtnText: { fontSize: 11, fontWeight: '800', color: '#1A1B1C' },

  driveRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driveAvatar: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driveAvatarText: { fontSize: 12, fontWeight: '800', color: '#1A1B1C' },
  driveTitle: { fontSize: 13, fontWeight: '800', color: '#171717' },
  driveCompany: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: '#171717', marginTop: 8 },
  emptySub: { fontSize: 11, color: '#6B6B6B', textAlign: 'center', marginTop: 2 },
});
