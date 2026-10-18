import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listDrives, getStudentApplications, PlacementDrive, DriveApplication } from '../../../api/placement';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { ShimmerProvider } from '../../../features/student/components/ShimmerSkeleton';
import { PlacementDriveCardSkeleton } from '../../../features/placement/components/PlacementSkeleton';
import { safeGoBack } from '../../../features/shared/utils/safeNavigation';

type FilterType = 'all' | 'eligible' | 'applied';

export default function PlacementFeedScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [applications, setApplications] = useState<DriveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchFeed = async () => {
    try {
      const [drivesData, appsData] = await Promise.all([
        listDrives().catch(() => []),
        getStudentApplications().catch(() => []),
      ]);
      setDrives(drivesData || []);
      setApplications(appsData || []);
    } catch (err) {
      console.warn('Failed to load placement feed:', err);
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

  const getApplication = (driveId: string) => {
    return applications.find((a) => a.driveId === driveId && a.status !== 'withdrawn');
  };

  const filteredDrives = useMemo(() => {
    return drives.filter((d) => {
      const app = getApplication(d.id);
      if (filter === 'applied') return !!app;
      if (filter === 'eligible') return !!d.eligible && !app;
      return true;
    });
  }, [drives, applications, filter]);

  const handleBack = () => {
    safeGoBack(navigation, '/home');
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Feather name="arrow-left" size={22} color="#171717" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Campus Placements</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ShimmerProvider>
            <PlacementDriveCardSkeleton />
            <PlacementDriveCardSkeleton />
          </ShimmerProvider>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const appliedCount = applications.filter((a) => a.status !== 'withdrawn').length;
  const eligibleCount = drives.filter((d) => d.eligible).length;
  const shortlistedCount = applications.filter(
    (a) => a.status === 'shortlisted' || a.status === 'hired'
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#171717" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={styles.headerTitle}>Campus Placements</Text>
          <Text style={styles.headerSub}>Opportunities & Eligibility</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => router.push('/(student)/placement/profile')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="account-edit-outline" size={20} color="#1A1B1C" />
          <Text style={styles.profileBtnText}>My Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
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
        {/* Dark Summary Banner */}
        <View style={styles.overallCard}>
          <View style={styles.heroSection}>
            <Text style={styles.heroValue}>{drives.length}</Text>
            <Text style={styles.heroLabel} numberOfLines={1}>Drives Open</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.statsSection}>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: '#F4C430' }]}>{eligibleCount}</Text>
              <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Eligible</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{appliedCount}</Text>
              <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Applied</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: '#16A34A' }]}>{shortlistedCount}</Text>
              <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Progressed</Text>
            </View>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: `All Drives (${drives.length})` },
            { key: 'eligible', label: `Eligible for Me (${eligibleCount})` },
            { key: 'applied', label: `My Applications (${appliedCount})` },
          ].map((tab) => {
            const isActive = filter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterBtn, isActive && styles.filterBtnActive]}
                onPress={() => setFilter(tab.key as FilterType)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Drives List */}
        {filteredDrives.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="briefcase-off-outline" size={40} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No Placement Drives Available</Text>
            <Text style={styles.emptySub}>
              {filter === 'applied'
                ? "You haven't applied to any drives yet. Check the eligible tab!"
                : 'There are no active placement drives published for this filter.'}
            </Text>
          </View>
        ) : (
          filteredDrives.map((drive) => {
            const application = getApplication(drive.id);
            const isApplied = !!application;
            const isShortlisted = application?.status === 'shortlisted';
            const isHired = application?.status === 'hired';

            const statusBg = isHired
              ? 'rgba(22, 163, 74, 0.15)'
              : isShortlisted
              ? 'rgba(244, 196, 48, 0.2)'
              : isApplied
              ? '#F3F1EA'
              : drive.eligible
              ? 'rgba(244, 196, 48, 0.15)'
              : 'rgba(220, 38, 38, 0.1)';

            const statusColor = isHired
              ? '#16A34A'
              : isShortlisted
              ? '#D97706'
              : isApplied
              ? '#1A1B1C'
              : drive.eligible
              ? '#B45309'
              : '#DC2626';

            const statusLabel = isHired
              ? 'HIRED / OFFERED'
              : isShortlisted
              ? `ROUND ${application?.currentRoundIndex || 1}`
              : isApplied
              ? 'APPLIED'
              : drive.eligible
              ? 'ELIGIBLE'
              : 'INELIGIBLE';

            return (
              <TouchableOpacity
                key={drive.id}
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => router.push(`/(student)/placement/${drive.id}` as any)}
              >
                {/* Header row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.companyRow}>
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
                      <Text style={styles.companyName}>{drive.companyName}</Text>
                      <Text style={styles.driveTitle} numberOfLines={1}>{drive.title}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                </View>

                {/* Ineligibility Reason */}
                {!drive.eligible && drive.ineligibilityReason && !isApplied && (
                  <View style={styles.ineligibleBanner}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#DC2626" />
                    <Text style={styles.ineligibleText}>{drive.ineligibilityReason}</Text>
                  </View>
                )}

                {/* Details row */}
                <View style={styles.metaRow}>
                  {drive.location ? (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6B6B6B" />
                      <Text style={styles.metaText}>{drive.location}</Text>
                    </View>
                  ) : null}
                  {drive.ctcOrStipend ? (
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="cash" size={14} color="#F4C430" />
                      <Text style={styles.metaText}>{drive.ctcOrStipend}</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="calendar-clock" size={14} color="#6B6B6B" />
                    <Text style={styles.metaText}>
                      Deadline: {new Date(drive.applyDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Card footer */}
                <View style={styles.cardFooter}>
                  <Text style={styles.roundsText}>
                    {drive.rounds?.length || 0} Selection Rounds
                  </Text>
                  <View style={styles.viewDetailsRow}>
                    <Text style={styles.viewDetailsText}>
                      {isApplied ? 'View Application Status' : 'View Drive Details'}
                    </Text>
                    <Feather name="chevron-right" size={16} color="#1A1B1C" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#171717', fontFamily: FontFamily.bold },
  headerSub: { fontSize: 11, color: '#6B6B6B', marginTop: 1, fontFamily: FontFamily.regular },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF4C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F4C430',
  },
  profileBtnText: { fontSize: 11, fontWeight: '800', color: '#1A1B1C' },

  scroll: { padding: 14, paddingBottom: 60, gap: 12 },

  // Overview Card
  overallCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: BorderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
    paddingHorizontal: 4,
  },
  heroValue: { fontSize: 28, fontWeight: '900', color: '#F4C430', lineHeight: 32 },
  heroLabel: {
    fontSize: 9.5,
    color: '#8A8A8A',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#2D2E30',
    marginHorizontal: 4,
  },
  statsSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
    minWidth: 0,
  },
  statValue: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  statLabel: {
    fontSize: 9,
    color: '#8A8A8A',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '700',
    textAlign: 'center',
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
  },
  filterText: { fontSize: 11, fontWeight: '700', color: '#6B6B6B' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '800' },

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
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  logoImage: { width: 42, height: 42, borderRadius: 8, resizeMode: 'contain' },
  logoPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitial: { fontSize: 14, fontWeight: '800', color: '#F4C430' },
  companyName: { fontSize: 11, color: '#6B6B6B', fontWeight: '600' },
  driveTitle: { fontSize: 14, fontWeight: '800', color: '#171717', marginTop: 1 },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: '800' },

  ineligibleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
    padding: 8,
    marginTop: 10,
  },
  ineligibleText: { fontSize: 11, color: '#DC2626', flex: 1, fontWeight: '600' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#F3F1EA', marginVertical: 10 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundsText: { fontSize: 11, color: '#6B6B6B', fontWeight: '600' },
  viewDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetailsText: { fontSize: 12, fontWeight: '800', color: '#1A1B1C' },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#171717', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 4, lineHeight: 18 },
});
