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

        {/* Candidate Count */}
        <View style={styles.candidateCountRow}>
          <Text style={styles.candidateCountText}>
            {filteredStudents.length} candidate{filteredStudents.length === 1 ? '' : 's'}
          </Text>
        </View>

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

                  {/* Info Column */}
                  <View style={styles.studentInfoCol}>
                    <View style={styles.studentNameRow}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {st.fullName}
                      </Text>
                      <Text style={styles.cgpaCleanText}>
                        <Text style={styles.cgpaCleanLabel}>CGPA </Text>
                        {cgpa}
                      </Text>
                    </View>

                    {/* Metadata lines with clean spacing */}
                    <View style={styles.metaLineRow}>
                      {st.rollNoOrUSN ? (
                        <Text style={styles.rollText} numberOfLines={1}>
                          {st.rollNoOrUSN}
                        </Text>
                      ) : null}
                      {st.rollNoOrUSN && st.branch ? (
                        <Text style={styles.dotSeparator}>•</Text>
                      ) : null}
                      {st.branch ? (
                        <Text style={styles.branchText} numberOfLines={1}>
                          {st.branch}
                        </Text>
                      ) : null}
                    </View>

                    {st.academicYear ? (
                      <Text style={styles.yearText} numberOfLines={1}>
                        {st.academicYear}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Bottom details & resume CTA */}
                <View style={styles.studentBottomRow}>
                  <Text
                    style={[
                      styles.backlogCleanText,
                      hasBacklogs ? styles.backlogTextAlert : styles.backlogTextClear,
                    ]}
                  >
                    {hasBacklogs
                      ? `${st.activeBacklogs} backlog${st.activeBacklogs > 1 ? 's' : ''}`
                      : '0 backlogs'}
                  </Text>

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
                    <Text style={styles.noResumeText}>No Resume</Text>
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

  // Candidate Count
  candidateCountRow: {
    paddingHorizontal: 2,
    marginTop: 2,
    marginBottom: 2,
  },
  candidateCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B6B',
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
    padding: 14,
  },
  studentTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    flexShrink: 0,
    marginTop: 1,
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#1A1B1C' },
  studentInfoCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  studentName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  metaLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 1,
  },
  rollText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '700',
  },
  dotSeparator: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  branchText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  yearText: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '500',
    marginTop: 1,
  },

  cgpaCleanText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1B1C',
    flexShrink: 0,
  },
  cgpaCleanLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  divider: { height: 1, backgroundColor: '#F3F1EA', marginVertical: 10 },

  studentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  backlogCleanText: {
    fontSize: 12,
    fontWeight: '600',
  },
  backlogTextClear: {
    color: '#6B7280',
  },
  backlogTextAlert: {
    color: '#DC2626',
    fontWeight: '700',
  },

  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 6,
    flexShrink: 0,
  },
  resumeBtnText: { fontSize: 11.5, fontWeight: '700', color: '#1A1B1C' },
  noResumeText: { fontSize: 11.5, color: '#9CA3AF', fontStyle: 'italic' },

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
