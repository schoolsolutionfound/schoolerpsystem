import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { listPlacementStudents, PlacementStudent } from '../../../api/placement';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { ShimmerProvider } from '../../student/components/ShimmerSkeleton';
import { PlacementStudentsSkeleton } from './PlacementSkeleton';

export function PlacementStudentsView() {
  const [students, setStudents] = useState<PlacementStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  const loadStudents = async () => {
    try {
      const data = await listPlacementStudents();
      setStudents(data || []);
    } catch (err: any) {
      console.warn('Failed to load students:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
  };

  // Extract unique branches
  const branches = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.branch) set.add(s.branch);
    });
    return ['all', ...Array.from(set)];
  }, [students]);

  // Filtered list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesBranch = selectedBranch === 'all' || s.branch === selectedBranch;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.fullName?.toLowerCase().includes(q) ||
        s.rollNoOrUSN?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q);
      return matchesBranch && matchesSearch;
    });
  }, [students, selectedBranch, searchQuery]);

  const handleOpenResume = (url?: string) => {
    if (!url) {
      Alert.alert('No Resume', 'This student has not uploaded a resume yet.');
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open resume link.');
    });
  };

  if (loading && !refreshing) {
    return (
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ShimmerProvider>
          <PlacementStudentsSkeleton />
        </ShimmerProvider>
      </ScrollView>
    );
  }

  // Summary counts
  const totalStudents = students.length;
  const withResume = students.filter((s) => !!s.resumeUrl).length;
  const zeroBacklogs = students.filter((s) => (s.activeBacklogs || 0) === 0).length;

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
        {/* Dark Summary Banner */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryPrimary}>
            <Text style={styles.summaryBigNum}>{totalStudents}</Text>
            <Text style={styles.summaryLabel} numberOfLines={1}>Candidates</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.statNum, { color: '#16A34A' }]}>{withResume}</Text>
              <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>With Resume</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={[styles.statNum, { color: '#F4C430' }]}>{zeroBacklogs}</Text>
              <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>No Backlogs</Text>
            </View>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#6B6B6B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name, USN, roll no..."
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

        {/* Branch Filter Pills */}
        {branches.length > 2 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.branchFilterScroll}
          >
            {branches.map((b) => {
              const active = selectedBranch === b;
              return (
                <TouchableOpacity
                  key={b}
                  style={[styles.branchPill, active && styles.branchPillActive]}
                  onPress={() => setSelectedBranch(b)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.branchPillText, active && styles.branchPillTextActive]}>
                    {b === 'all' ? 'All Branches' : b}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Student list */}
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-search-outline" size={40} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'Try adjusting your search criteria.'
                : 'No student accounts found enrolled in this college.'}
            </Text>
          </View>
        ) : (
          filteredStudents.map((st) => {
            const hasResume = !!st.resumeUrl;
            const hasBacklogs = (st.activeBacklogs || 0) > 0;
            const cgpa = st.cgpa !== null && st.cgpa !== undefined ? st.cgpa.toFixed(2) : 'N/A';
            const cgpaColor =
              st.cgpa && st.cgpa >= 7.5 ? '#16A34A' : st.cgpa && st.cgpa >= 6.0 ? '#D97706' : '#6B6B6B';

            return (
              <View key={st.id} style={styles.studentCard}>
                <View style={styles.studentTopRow}>
                  {/* Initials Avatar */}
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {st.fullName ? st.fullName.substring(0, 2).toUpperCase() : 'ST'}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{st.fullName}</Text>
                    <View style={styles.rollBranchRow}>
                      {st.rollNoOrUSN ? <Text style={styles.rollText}>{st.rollNoOrUSN}</Text> : null}
                      <Text style={styles.branchText}>• {st.branch || 'General'}</Text>
                      {st.academicYear ? <Text style={styles.yearText}>({st.academicYear})</Text> : null}
                    </View>
                  </View>

                  {/* CGPA Spec Badge */}
                  <View style={styles.cgpaBadge}>
                    <Text style={styles.cgpaLabel}>CGPA</Text>
                    <Text style={styles.cgpaValue}>{cgpa}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Bottom details & resume CTA */}
                <View style={styles.studentBottomRow}>
                  <View style={styles.badgesRow}>
                    <View
                      style={[
                        styles.backlogTag,
                        hasBacklogs ? styles.backlogTagAlert : styles.backlogTagClear,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={hasBacklogs ? 'alert-circle-outline' : 'shield-check-outline'}
                        size={13}
                        color={hasBacklogs ? '#DC2626' : '#4B4B4B'}
                      />
                      <Text
                        style={[
                          styles.backlogText,
                          hasBacklogs && styles.backlogTextAlert,
                        ]}
                      >
                        {hasBacklogs ? `${st.activeBacklogs} Active Backlog${st.activeBacklogs > 1 ? 's' : ''}` : 'Zero Backlogs'}
                      </Text>
                    </View>
                  </View>

                  {hasResume ? (
                    <TouchableOpacity
                      style={styles.resumeBtn}
                      onPress={() => handleOpenResume(st.resumeUrl)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="file-pdf-box" size={16} color="#DC2626" />
                      <Text style={styles.resumeBtnText}>View Resume</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.noResumeChip}>
                      <Text style={styles.noResumeText}>No Resume</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFDF7' },
  container: { padding: 14, paddingBottom: 60, gap: 12 },

  // Summary Card
  summaryCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: BorderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  summaryPrimary: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
    paddingHorizontal: 4,
  },
  summaryBigNum: { fontSize: 28, fontWeight: '900', color: '#F4C430', lineHeight: 32 },
  summaryLabel: {
    fontSize: 9.5,
    color: '#8A8A8A',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
    textAlign: 'center',
  },
  cardDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#2D2E30',
    marginHorizontal: 4,
  },
  summaryStatsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
    minWidth: 0,
  },
  statNum: { fontSize: 18, fontWeight: '800', lineHeight: 22 },
  statLabel: {
    fontSize: 9,
    color: '#8A8A8A',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
    textAlign: 'center',
  },

  // Search
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

  // Branch Pills
  branchFilterScroll: { gap: 8, paddingVertical: 2 },
  branchPill: {
    backgroundColor: '#F3F1EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  branchPillActive: {
    backgroundColor: '#1A1B1C',
  },
  branchPillText: { fontSize: 11, fontWeight: '700', color: '#6B6B6B' },
  branchPillTextActive: { color: '#FFFFFF' },

  // Student Card
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
  },
  studentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F4C430',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#1A1B1C' },
  studentName: { fontSize: 14, fontWeight: '800', color: '#171717' },
  rollBranchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rollText: { fontSize: 11, color: '#F4C430', fontWeight: '800' },
  branchText: { fontSize: 11, color: '#6B6B6B', fontWeight: '600' },
  yearText: { fontSize: 11, color: '#8A8A8A' },

  cgpaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F7F6F2',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  cgpaLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#787878',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cgpaValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1A1B1C',
  },

  divider: { height: 1, backgroundColor: '#F3F1EA', marginVertical: 10 },

  studentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgesRow: { flexDirection: 'row', gap: 6 },
  backlogTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  backlogTagClear: {
    backgroundColor: '#F7F6F2',
    borderColor: '#E8E5DC',
  },
  backlogTagAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  backlogText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B4B4B',
  },
  backlogTextAlert: {
    color: '#DC2626',
    fontWeight: '800',
  },

  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#F4C430',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 6,
  },
  resumeBtnText: { fontSize: 11, fontWeight: '800', color: '#1A1B1C' },
  noResumeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  noResumeText: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' },

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
