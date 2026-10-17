import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { listDrives, getPlacementStats, PlacementDrive, PlacementStats } from '../../../api/placement';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { ShimmerProvider } from '../../student/components/ShimmerSkeleton';
import { PlacementStatsSkeleton, PlacementDriveCardSkeleton } from './PlacementSkeleton';

type FilterTab = 'all' | 'published' | 'draft' | 'closed';

export function PlacementDrivesView() {
  const router = useRouter();
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [stats, setStats] = useState<PlacementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFeed = async () => {
    try {
      const [drivesData, statsData] = await Promise.all([
        listDrives().catch(() => []),
        getPlacementStats().catch(() => null),
      ]);
      setDrives(drivesData || []);
      if (statsData) {
        setStats(statsData);
      } else {
        // Fallback computation
        const published = (drivesData || []).filter((d) => d.status === 'published').length;
        const draft = (drivesData || []).filter((d) => d.status === 'draft').length;
        const closed = (drivesData || []).filter((d) => d.status === 'closed').length;
        setStats({
          totalDrives: drivesData?.length || 0,
          activeDrives: published,
          draftDrives: draft,
          closedDrives: closed,
          totalApplications: 0,
          hiredCount: 0,
          shortlistedCount: 0,
          totalMembers: 0,
          totalStudents: 0,
        });
      }
    } catch (err) {
      console.warn('Failed to load placement drives:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
  };

  const filteredDrives = useMemo(() => {
    return drives.filter((d) => {
      const matchesFilter = selectedFilter === 'all' || d.status === selectedFilter;
      const matchesSearch =
        d.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.location?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [drives, selectedFilter, searchQuery]);

  if (loading && !refreshing) {
    return (
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ShimmerProvider>
          <PlacementStatsSkeleton />
          <PlacementDriveCardSkeleton />
          <PlacementDriveCardSkeleton />
        </ShimmerProvider>
      </ScrollView>
    );
  }

  const activeDrivesCount = stats?.activeDrives ?? drives.filter((d) => d.status === 'published').length;
  const totalAppsCount = stats?.totalApplications ?? 0;
  const hiredCount = stats?.hiredCount ?? 0;
  const totalDrivesCount = stats?.totalDrives ?? drives.length;

  return (
    <View style={styles.root}>
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
        {/* Dark Overview Card - Matching Attendance Theme */}
        <View style={styles.overallCard}>
          <View style={styles.ring}>
            <Text style={styles.ringValue}>{activeDrivesCount}</Text>
            <Text style={styles.ringLabel}>Active Drives</Text>
          </View>
          <View style={styles.overallStats}>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: '#F4C430' }]}>{totalDrivesCount}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{totalAppsCount}</Text>
              <Text style={styles.statLabel}>Applied</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: '#16A34A' }]}>{hiredCount}</Text>
              <Text style={styles.statLabel}>Hired</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#6B6B6B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search company, job role, location..."
            placeholderTextColor="#9A9A9A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Feather name="x" size={16} color="#6B6B6B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {(['all', 'published', 'draft', 'closed'] as FilterTab[]).map((tab) => {
            const isActive = selectedFilter === tab;
            const labels: Record<FilterTab, string> = {
              all: `All (${drives.length})`,
              published: `Published (${drives.filter((d) => d.status === 'published').length})`,
              draft: `Draft (${drives.filter((d) => d.status === 'draft').length})`,
              closed: `Closed (${drives.filter((d) => d.status === 'closed').length})`,
            };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterBtn, isActive && styles.filterBtnActive]}
                onPress={() => setSelectedFilter(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Drives List */}
        {filteredDrives.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="briefcase-off-outline" size={44} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No Placement Drives Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'No drives match your search query. Try clearing filters.'
                : 'Create a new placement drive to begin campus recruitment.'}
            </Text>
            <TouchableOpacity
              style={styles.createEmptyBtn}
              onPress={() => router.push('/(placement)/create')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#1A1B1C" />
              <Text style={styles.createEmptyText}>Create Drive</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredDrives.map((drive) => {
            const isPublished = drive.status === 'published';
            const isDraft = drive.status === 'draft';
            const statusColor = isPublished ? '#16A34A' : isDraft ? '#D97706' : '#6B6B6B';
            const statusLabel = isPublished ? 'Published' : isDraft ? 'Draft' : 'Closed';

            return (
              <TouchableOpacity
                key={drive.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(`/(placement)/${drive.id}` as any)}
              >
                {/* Header row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.companyInfoRow}>
                    {drive.logoUrl ? (
                      <Image source={{ uri: drive.logoUrl }} style={styles.logoImage} />
                    ) : (
                      <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoInitial}>
                          {drive.companyName ? drive.companyName.substring(0, 2).toUpperCase() : 'CO'}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.companyName} numberOfLines={1}>{drive.companyName}</Text>
                      <Text style={styles.driveTitle} numberOfLines={1}>{drive.title}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: `${statusColor}18` }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>

                {/* Details row */}
                <View style={styles.metaWrap}>
                  {drive.location ? (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6B6B6B" />
                      <Text style={styles.metaText} numberOfLines={1}>{drive.location}</Text>
                    </View>
                  ) : null}
                  {drive.ctcOrStipend ? (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="cash" size={14} color="#F4C430" />
                      <Text style={styles.metaText} numberOfLines={1}>{drive.ctcOrStipend}</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#6B6B6B" />
                    <Text style={styles.metaText}>
                      Deadline: {new Date(drive.applyDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Card footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.roundsBadge}>
                    <MaterialCommunityIcons name="format-list-checks" size={14} color="#1A1B1C" />
                    <Text style={styles.roundsText}>
                      {drive.rounds?.length || 0} Stages / Rounds
                    </Text>
                  </View>

                  <View style={styles.viewApplicantsBtn}>
                    <Text style={styles.viewApplicantsText}>View Pipeline</Text>
                    <Feather name="chevron-right" size={16} color="#1A1B1C" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(placement)/create')}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#1A1B1C" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFDF7' },
  container: { padding: 14, paddingBottom: 90, gap: 12 },

  // Dark Overview Card
  overallCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: BorderRadius.card,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  ring: { alignItems: 'center' },
  ringValue: { fontSize: 32, fontWeight: '900', color: '#F4C430' },
  ringLabel: {
    fontSize: 10,
    color: '#8A8A8A',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  overallStats: { flexDirection: 'row', gap: 18 },
  statCol: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: {
    fontSize: 10,
    color: '#8A8A8A',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },

  // Search Box
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#171717',
    fontFamily: FontFamily.regular,
  },

  // Filter Row
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F1EA',
    borderRadius: 8,
    padding: 3,
    gap: 3,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  filterBtnActive: {
    backgroundColor: '#1A1B1C',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Drive Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  logoImage: { width: 44, height: 44, borderRadius: 8, resizeMode: 'contain' },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F4C430',
  },
  companyName: {
    fontSize: 12,
    color: '#6B6B6B',
    fontWeight: '600',
  },
  driveTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#F3F1EA',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F1EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roundsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1B1C',
  },
  viewApplicantsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewApplicantsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1B1C',
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 260,
  },
  createEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  createEmptyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1B1C',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});
