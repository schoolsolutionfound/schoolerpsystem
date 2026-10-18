import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import {
  listDrives,
  getDriveApplicationsForStaff,
  updateApplicationStatusForStaff,
  DriveApplication,
  PlacementDrive,
} from '../../api/placement';
import { FontFamily } from '../../constants/fonts';
import { BorderRadius } from '../../constants/theme';
import { ShimmerProvider } from '../../features/student/components/ShimmerSkeleton';
import { PlacementStudentsSkeleton } from '../../features/placement/components/PlacementSkeleton';
import { safeGoBack } from '../../features/shared/utils/safeNavigation';

export default function PlacementAdminApplicantsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [drive, setDrive] = useState<PlacementDrive | null>(null);
  const [applications, setApplications] = useState<DriveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const fetchData = async () => {
    try {
      if (!id) return;
      const [appsData, drivesData] = await Promise.all([
        getDriveApplicationsForStaff(id as string),
        listDrives(),
      ]);
      setApplications(appsData || []);
      const found = drivesData?.find((d) => d.id === id);
      setDrive(found || null);
    } catch (err) {
      console.warn('Failed to load applicants:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleUpdateStatus = async (appId: string, newStatus: string, currentRoundIndex?: number) => {
    try {
      await updateApplicationStatusForStaff(id as string, appId, newStatus, currentRoundIndex);
      // Optimistically update
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? {
                ...a,
                status: newStatus as any,
                currentRoundIndex: currentRoundIndex ?? a.currentRoundIndex,
              }
            : a
        )
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update status.');
    }
  };

  const totalRounds = drive?.rounds?.length || 0;

  const getStatusOptions = (app: DriveApplication) => {
    if (app.status === 'withdrawn') return [];

    const options: { label: string; action: string; roundIndex?: number; color: string }[] = [];

    // Shortlisting logic
    if (
      app.status === 'applied' ||
      (app.status === 'shortlisted' && (app.currentRoundIndex || 0) < totalRounds)
    ) {
      const nextRound = app.status === 'applied' ? 1 : (app.currentRoundIndex || 0) + 1;
      const roundName = drive?.rounds?.[nextRound - 1]?.name;
      options.push({
        label: roundName ? `Shortlist R${nextRound} (${roundName})` : `Shortlist R${nextRound}`,
        action: 'shortlisted',
        roundIndex: nextRound,
        color: '#F4C430',
      });
    }

    if (app.status !== 'hired') {
      options.push({ label: 'Hire Candidate', action: 'hired', color: '#16A34A' });
    }
    if (app.status !== 'rejected') {
      options.push({ label: 'Reject', action: 'rejected', color: '#DC2626' });
    }
    if (app.status === 'hired' || app.status === 'rejected') {
      options.push({ label: 'Reset to Applied', action: 'applied', color: '#6B6B6B' });
    }

    return options;
  };

  const branches = useMemo(() => {
    const b = new Set<string>();
    applications.forEach((a) => {
      if (a.student?.branch) b.add(a.student.branch);
    });
    return Array.from(b);
  }, [applications]);

  const filteredApps = useMemo(() => {
    return applications.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (branchFilter !== 'all' && a.student?.branch !== branchFilter) return false;
      return true;
    });
  }, [applications, statusFilter, branchFilter]);

  const stats = useMemo(() => {
    const s = { total: applications.length, applied: 0, shortlisted: 0, hired: 0, rejected: 0 };
    applications.forEach((a) => {
      if (a.status === 'applied') s.applied++;
      if (a.status === 'shortlisted') s.shortlisted++;
      if (a.status === 'hired') s.hired++;
      if (a.status === 'rejected') s.rejected++;
    });
    return s;
  }, [applications]);

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
          <Text style={styles.headerTitle}>Drive Applicants</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ShimmerProvider>
            <PlacementStudentsSkeleton />
          </ShimmerProvider>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#171717" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {drive?.title || 'Drive Applicants'}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {drive?.companyName || 'Placement Drive'}
          </Text>
        </View>
        {drive?.status && (
          <View
            style={[
              styles.statusTag,
              drive.status === 'published'
                ? styles.tagPublished
                : drive.status === 'draft'
                ? styles.tagDraft
                : styles.tagClosed,
            ]}
          >
            <Text
              style={[
                styles.statusTagText,
                drive.status === 'published'
                  ? styles.tagTextPublished
                  : drive.status === 'draft'
                  ? styles.tagTextDraft
                  : styles.tagTextClosed,
              ]}
            >
              {drive.status === 'published' ? 'Published' : drive.status === 'draft' ? 'Draft' : 'Closed'}
            </Text>
          </View>
        )}
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
        {/* Dark Pipeline Overview Card */}
        <View style={styles.overallCard}>
          <View style={styles.heroSection}>
            <Text style={styles.heroValue}>{stats.total}</Text>
            <Text style={styles.heroLabel} numberOfLines={1}>Applicants</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.statsSection}>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: '#FFFFFF' }]}>{stats.applied}</Text>
              <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Applied</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: '#F4C430' }]}>{stats.shortlisted}</Text>
              <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Shortlist</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: '#16A34A' }]}>{stats.hired}</Text>
              <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>Hired</Text>
            </View>
          </View>
        </View>

        {/* Status Filter Pills */}
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: `All (${applications.length})` },
            { key: 'applied', label: `Applied (${stats.applied})` },
            { key: 'shortlisted', label: `Shortlisted (${stats.shortlisted})` },
            { key: 'hired', label: `Hired (${stats.hired})` },
            { key: 'rejected', label: `Rejected (${stats.rejected})` },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterBtn, isActive && styles.filterBtnActive]}
                onPress={() => setStatusFilter(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Branch Filter Pills */}
        {branches.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.branchFilterScroll}
          >
            <TouchableOpacity
              style={[styles.branchPill, branchFilter === 'all' && styles.branchPillActive]}
              onPress={() => setBranchFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.branchText, branchFilter === 'all' && styles.branchTextActive]}>
                All Branches
              </Text>
            </TouchableOpacity>
            {branches.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.branchPill, branchFilter === b && styles.branchPillActive]}
                onPress={() => setBranchFilter(b)}
                activeOpacity={0.7}
              >
                <Text style={[styles.branchText, branchFilter === b && styles.branchTextActive]}>
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Applicants List */}
        {filteredApps.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-search-outline" size={40} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No Applicants Found</Text>
            <Text style={styles.emptySub}>
              No candidates match your current filter settings for this drive.
            </Text>
          </View>
        ) : (
          filteredApps.map((app) => {
            const isHired = app.status === 'hired';
            const isShortlisted = app.status === 'shortlisted';
            const isRejected = app.status === 'rejected';

            const statusBg = isHired
              ? 'rgba(22, 163, 74, 0.15)'
              : isShortlisted
              ? 'rgba(244, 196, 48, 0.15)'
              : isRejected
              ? 'rgba(220, 38, 38, 0.12)'
              : '#F3F1EA';
            const statusTextColor = isHired
              ? '#16A34A'
              : isShortlisted
              ? '#D97706'
              : isRejected
              ? '#DC2626'
              : '#6B6B6B';
            const statusLabel = isShortlisted
              ? `Round ${app.currentRoundIndex || 1}`
              : app.status.toUpperCase();

            const options = getStatusOptions(app);

            return (
              <View key={app.id} style={styles.appCard}>
                {/* Top row */}
                <View style={styles.appCardHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {app.student?.fullName
                        ? app.student.fullName.substring(0, 2).toUpperCase()
                        : 'ST'}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{app.student?.fullName || 'Student'}</Text>
                    <Text style={styles.studentMeta}>
                      {app.student?.branch || 'General'} • {app.student?.year || 'Candidate'}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusPillText, { color: statusTextColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Academic & contact info */}
                <View style={styles.academicRow}>
                  <View style={styles.academicCol}>
                    <Text style={styles.academicLabel}>10th Score</Text>
                    <Text style={styles.academicVal}>{app.student?.tenthPercentage || 'N/A'}</Text>
                  </View>
                  <View style={styles.academicCol}>
                    <Text style={styles.academicLabel}>12th / Diploma</Text>
                    <Text style={styles.academicVal}>{app.student?.twelfthPercentage || 'N/A'}</Text>
                  </View>
                  {app.resumeUrl ? (
                    <TouchableOpacity
                      style={styles.resumeBtn}
                      onPress={() => Linking.openURL(app.resumeUrl)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="file-pdf-box" size={16} color="#DC2626" />
                      <Text style={styles.resumeBtnText}>Resume</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.noResumeBadge}>
                      <Text style={styles.noResumeText}>No Resume</Text>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Pipeline Actions */}
                <View style={styles.pipelineActions}>
                  <Text style={styles.actionPrompt}>Advance Candidate:</Text>
                  <View style={styles.actionsWrap}>
                    {options.map((opt, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.actionBtn,
                          opt.action === 'hired' && styles.actionBtnHired,
                          opt.action === 'rejected' && styles.actionBtnRejected,
                          opt.action === 'shortlisted' && styles.actionBtnShortlisted,
                        ]}
                        onPress={() =>
                          handleUpdateStatus(app.id, opt.action, opt.roundIndex)
                        }
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.actionBtnText,
                            opt.action === 'hired' && styles.actionTextHired,
                            opt.action === 'rejected' && styles.actionTextRejected,
                            opt.action === 'shortlisted' && styles.actionTextShortlisted,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
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
  statusTag: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagPublished: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  tagDraft: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  tagClosed: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotPublished: {
    backgroundColor: '#16A34A',
  },
  dotDraft: {
    backgroundColor: '#D97706',
  },
  dotClosed: {
    backgroundColor: '#6B7280',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  tagTextPublished: {
    color: '#15803D',
  },
  tagTextDraft: {
    color: '#B45309',
  },
  tagTextClosed: {
    color: '#4B5563',
  },

  scroll: { padding: 14, paddingBottom: 60, gap: 12 },

  // Dark Overview Card
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

  // Filters
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F3F1EA',
  },
  filterBtnActive: {
    backgroundColor: '#1A1B1C',
  },
  filterText: { fontSize: 11, fontWeight: '700', color: '#6B6B6B' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '800' },

  branchFilterScroll: { gap: 6, paddingVertical: 2 },
  branchPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  branchPillActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  branchText: { fontSize: 11, fontWeight: '700', color: '#6B6B6B' },
  branchTextActive: { color: '#1A1B1C', fontWeight: '800' },

  // Applicant Card
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
  },
  appCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F4C430',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#1A1B1C' },
  studentName: { fontSize: 14, fontWeight: '800', color: '#171717' },
  studentMeta: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  academicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  academicCol: { flex: 1 },
  academicLabel: { fontSize: 10, color: '#8A8A8A', fontWeight: '700' },
  academicVal: { fontSize: 13, fontWeight: '800', color: '#171717', marginTop: 2 },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF4C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  resumeBtnText: { fontSize: 12, fontWeight: '800', color: '#1A1B1C' },
  noResumeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  noResumeText: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' },

  divider: { height: 1, backgroundColor: '#F3F1EA', marginVertical: 12 },

  // Actions
  pipelineActions: { gap: 8 },
  actionPrompt: { fontSize: 10, color: '#8A8A8A', fontWeight: '800', textTransform: 'uppercase' },
  actionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F1EA',
  },
  actionBtnHired: { backgroundColor: 'rgba(22, 163, 74, 0.15)' },
  actionBtnRejected: { backgroundColor: 'rgba(220, 38, 38, 0.12)' },
  actionBtnShortlisted: { backgroundColor: '#FFF4C7', borderWidth: 1, borderColor: '#F4C430' },
  actionBtnText: { fontSize: 11, fontWeight: '800', color: '#171717' },
  actionTextHired: { color: '#16A34A' },
  actionTextRejected: { color: '#DC2626' },
  actionTextShortlisted: { color: '#1A1B1C' },

  // Empty
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
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 4 },
});
