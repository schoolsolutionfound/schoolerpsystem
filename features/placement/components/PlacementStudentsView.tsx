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
  Modal,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { listPlacementStudents, PlacementStudent } from '../../../api/placement';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { ShimmerProvider } from '../../student/components/ShimmerSkeleton';
import { PlacementStudentsSkeleton } from './PlacementSkeleton';

type CgpaFilterOption = 'all' | 'less_7_5' | '7_5_to_8_0' | '8_0_to_8_5' | '8_5_plus';
type BacklogFilterOption = 'all' | 'zero' | 'has_backlogs';

const CGPA_OPTIONS: { key: CgpaFilterOption; label: string }[] = [
  { key: 'all', label: 'All CGPA' },
  { key: 'less_7_5', label: '< 7.5' },
  { key: '7_5_to_8_0', label: '7.5 - 8.0' },
  { key: '8_0_to_8_5', label: '8.0 - 8.5' },
  { key: '8_5_plus', label: '8.5+' },
];

export function PlacementStudentsView() {
  const [students, setStudents] = useState<PlacementStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedCgpa, setSelectedCgpa] = useState<CgpaFilterOption>('all');
  const [selectedBacklog, setSelectedBacklog] = useState<BacklogFilterOption>('all');

  // Filter Modal
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Candidate Details Modal
  const [selectedStudent, setSelectedStudent] = useState<PlacementStudent | null>(null);

  // Temporary filter state for modal before applying
  const [draftBranch, setDraftBranch] = useState<string>('all');
  const [draftBatch, setDraftBatch] = useState<string>('all');
  const [draftCgpa, setDraftCgpa] = useState<CgpaFilterOption>('all');
  const [draftBacklog, setDraftBacklog] = useState<BacklogFilterOption>('all');

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
      if (s.branch) set.add(s.branch.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // Extract unique batches (academic years)
  const batches = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.academicYear) set.add(s.academicYear.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedBranch !== 'all') count++;
    if (selectedBatch !== 'all') count++;
    if (selectedCgpa !== 'all') count++;
    if (selectedBacklog !== 'all') count++;
    return count;
  }, [selectedBranch, selectedBatch, selectedCgpa, selectedBacklog]);

  // Synchronize draft filters when modal opens
  const openFilterModal = () => {
    setDraftBranch(selectedBranch);
    setDraftBatch(selectedBatch);
    setDraftCgpa(selectedCgpa);
    setDraftBacklog(selectedBacklog);
    setFilterModalVisible(true);
  };

  const applyFilters = () => {
    setSelectedBranch(draftBranch);
    setSelectedBatch(draftBatch);
    setSelectedCgpa(draftCgpa);
    setSelectedBacklog(draftBacklog);
    setFilterModalVisible(false);
  };

  const resetAllFilters = () => {
    setDraftBranch('all');
    setDraftBatch('all');
    setDraftCgpa('all');
    setDraftBacklog('all');
    setSelectedBranch('all');
    setSelectedBatch('all');
    setSelectedCgpa('all');
    setSelectedBacklog('all');
    setFilterModalVisible(false);
  };

  // Filtered list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Branch
      if (selectedBranch !== 'all' && s.branch?.toLowerCase().trim() !== selectedBranch.toLowerCase().trim()) {
        return false;
      }

      // 2. Batch
      if (selectedBatch !== 'all' && s.academicYear?.toLowerCase().trim() !== selectedBatch.toLowerCase().trim()) {
        return false;
      }

      // 3. CGPA Range
      if (selectedCgpa !== 'all') {
        const val = s.cgpa;
        if (val === null || val === undefined) return false;
        if (selectedCgpa === 'less_7_5' && val >= 7.5) return false;
        if (selectedCgpa === '7_5_to_8_0' && (val < 7.5 || val > 8.0)) return false;
        if (selectedCgpa === '8_0_to_8_5' && (val < 8.0 || val > 8.5)) return false;
        if (selectedCgpa === '8_5_plus' && val < 8.5) return false;
      }

      // 4. Backlogs
      if (selectedBacklog !== 'all') {
        const backlogs = s.activeBacklogs || 0;
        if (selectedBacklog === 'zero' && backlogs > 0) return false;
        if (selectedBacklog === 'has_backlogs' && backlogs === 0) return false;
      }

      // 5. Search Query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          s.fullName?.toLowerCase().includes(q) ||
          s.rollNoOrUSN?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.branch?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [students, selectedBranch, selectedBatch, selectedCgpa, selectedBacklog, searchQuery]);

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
        {/* Search Bar & Professional Filter Trigger Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={18} color="#6B6B6B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search student, USN, roll no..."
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

          <TouchableOpacity
            style={[styles.filterActionBtn, activeFilterCount > 0 && styles.filterActionBtnActive]}
            onPress={openFilterModal}
            activeOpacity={0.7}
          >
            <Feather
              name="sliders"
              size={17}
              color={activeFilterCount > 0 ? '#1A1B1C' : '#171717'}
            />
            <Text
              style={[
                styles.filterActionBtnText,
                activeFilterCount > 0 && styles.filterActionBtnTextActive,
              ]}
            >
              Filter
            </Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Candidate Count */}
        <View style={styles.candidateCountRow}>
          <Text style={styles.candidateCountText}>
            {filteredStudents.length} candidate{filteredStudents.length === 1 ? '' : 's'}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={resetAllFilters} hitSlop={6}>
              <Text style={styles.clearFilterLink}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Student list */}
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-search-outline" size={40} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery || activeFilterCount > 0
                ? 'Try adjusting your search or filter settings.'
                : 'No student accounts found enrolled in this college.'}
            </Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity
                style={styles.emptyResetBtn}
                onPress={resetAllFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyResetBtnText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredStudents.map((st) => {
            const hasResume = !!st.resumeUrl;
            const hasBacklogs = (st.activeBacklogs || 0) > 0;
            const cgpa = st.cgpa !== null && st.cgpa !== undefined ? st.cgpa.toFixed(2) : 'N/A';

            return (
              <TouchableOpacity
                key={st.id}
                style={styles.studentCard}
                onPress={() => setSelectedStudent(st)}
                activeOpacity={0.75}
              >
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
                        <Text style={styles.studentMetaText}>{st.rollNoOrUSN} • </Text>
                      ) : null}
                      <Text style={styles.studentMetaText}>
                        {st.branch || 'General'}
                        {st.academicYear ? ` • ${st.academicYear}` : ''}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Academic Scores Row */}
                <View style={styles.scoreRow}>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreLabel}>10th Score</Text>
                    <Text style={styles.scoreValue}>
                      {st.tenthPercent != null ? `${st.tenthPercent}%` : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreLabel}>12th / Diploma</Text>
                    <Text style={styles.scoreValue}>
                      {st.twelfthPercent != null ? `${st.twelfthPercent}%` : 'N/A'}
                    </Text>
                  </View>

                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreLabel}>Active Backlogs</Text>
                    <Text style={[styles.scoreValue, hasBacklogs && styles.backlogAlertValue]}>
                      {st.activeBacklogs || 0}
                    </Text>
                  </View>
                </View>

                {/* Portfolio & External Profile Links */}
                {(st.githubUrl || st.linkedinUrl || st.portfolioUrl || st.leetcodeUrl) && (
                  <View style={styles.socialRow}>
                    {st.linkedinUrl ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          Linking.openURL(st.linkedinUrl!);
                        }}
                        hitSlop={6}
                      >
                        <MaterialCommunityIcons name="linkedin" size={17} color="#0A66C2" />
                      </TouchableOpacity>
                    ) : null}
                    {st.githubUrl ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          Linking.openURL(st.githubUrl!);
                        }}
                        hitSlop={6}
                      >
                        <MaterialCommunityIcons name="github" size={17} color="#171717" />
                      </TouchableOpacity>
                    ) : null}
                    {st.leetcodeUrl ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          Linking.openURL(st.leetcodeUrl!);
                        }}
                        hitSlop={6}
                      >
                        <MaterialCommunityIcons name="code-tags" size={17} color="#FFA116" />
                      </TouchableOpacity>
                    ) : null}
                    {st.portfolioUrl ? (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation?.();
                          Linking.openURL(st.portfolioUrl!);
                        }}
                        hitSlop={6}
                      >
                        <MaterialCommunityIcons name="web" size={17} color="#6B6B6B" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}

                <View style={styles.divider} />

                {/* Bottom Row: Backlog status text & Resume button */}
                <View style={styles.studentBottomRow}>
                  <Text
                    style={[
                      styles.backlogCleanText,
                      hasBacklogs ? styles.backlogTextAlert : styles.backlogTextClear,
                    ]}
                  >
                    {hasBacklogs ? `${st.activeBacklogs} backlogs` : '0 backlogs'}
                  </Text>

                  {hasResume ? (
                    <TouchableOpacity
                      style={styles.resumeBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleOpenResume(st.resumeUrl);
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="file-pdf-box" size={16} color="#DC2626" />
                      <Text style={styles.resumeBtnText}>View Resume</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.noResumeText}>No Resume</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Professional Filter Modal (Border Radius 5px) */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Feather name="sliders" size={18} color="#171717" />
                <Text style={styles.modalTitle}>Filter Students</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={18} color="#171717" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Section 1: CGPA Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>CGPA CRITERIA</Text>
                <View style={styles.chipGrid}>
                  {CGPA_OPTIONS.map((opt) => {
                    const isSelected = draftCgpa === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[styles.modalChip, isSelected && styles.modalChipActive]}
                        onPress={() => setDraftCgpa(opt.key)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.modalChipText,
                            isSelected && styles.modalChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Section 2: Batch (Academic Year) */}
              {batches.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>ACADEMIC BATCH</Text>
                  <View style={styles.chipGrid}>
                    <TouchableOpacity
                      style={[
                        styles.modalChip,
                        draftBatch === 'all' && styles.modalChipActive,
                      ]}
                      onPress={() => setDraftBatch('all')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.modalChipText,
                          draftBatch === 'all' && styles.modalChipTextActive,
                        ]}
                      >
                        All Batches
                      </Text>
                    </TouchableOpacity>

                    {batches.map((batch) => {
                      const isSelected = draftBatch.toLowerCase() === batch.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={batch}
                          style={[styles.modalChip, isSelected && styles.modalChipActive]}
                          onPress={() => setDraftBatch(batch)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.modalChipText,
                              isSelected && styles.modalChipTextActive,
                            ]}
                          >
                            {batch}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Section 3: Branch / Department */}
              {branches.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>BRANCH / DEPARTMENT</Text>
                  <View style={styles.chipGrid}>
                    <TouchableOpacity
                      style={[
                        styles.modalChip,
                        draftBranch === 'all' && styles.modalChipActive,
                      ]}
                      onPress={() => setDraftBranch('all')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.modalChipText,
                          draftBranch === 'all' && styles.modalChipTextActive,
                        ]}
                      >
                        All Branches
                      </Text>
                    </TouchableOpacity>

                    {branches.map((b) => {
                      const isSelected = draftBranch.toLowerCase() === b.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={b}
                          style={[styles.modalChip, isSelected && styles.modalChipActive]}
                          onPress={() => setDraftBranch(b)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.modalChipText,
                              isSelected && styles.modalChipTextActive,
                            ]}
                          >
                            {b}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Section 4: Backlog Status */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>BACKLOG STATUS</Text>
                <View style={styles.chipGrid}>
                  {[
                    { key: 'all' as BacklogFilterOption, label: 'All Students' },
                    { key: 'zero' as BacklogFilterOption, label: '0 Backlogs (Clear)' },
                    { key: 'has_backlogs' as BacklogFilterOption, label: 'Has Active Backlogs' },
                  ].map((opt) => {
                    const isSelected = draftBacklog === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[styles.modalChip, isSelected && styles.modalChipActive]}
                        onPress={() => setDraftBacklog(opt.key)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.modalChipText,
                            isSelected && styles.modalChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Footer Actions (Border Radius 5px) */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={resetAllFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.modalResetBtnText}>Reset All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={applyFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Candidate Details Modal (Matches View Applicants Modal) */}
      <Modal
        visible={!!selectedStudent}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStudent(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedStudent(null)}
        >
          <View
            style={styles.detailsModalCard}
            onStartShouldSetResponder={() => true}
          >
            {/* Modal Header */}
            <View style={styles.detailsModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailsModalHeaderTitle}>Student Details</Text>
                <Text style={styles.detailsModalHeaderSub}>Academic record & documents</Text>
              </View>
              <TouchableOpacity
                style={styles.detailsModalCloseBtn}
                onPress={() => setSelectedStudent(null)}
                hitSlop={8}
              >
                <Feather name="x" size={18} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailsModalScrollContent}
            >
              {selectedStudent && (
                <>
                  {/* Candidate Profile Header */}
                  <View style={styles.candidateProfileHeader}>
                    <View style={styles.avatarCircleLarge}>
                      <Text style={styles.avatarLargeText}>
                        {selectedStudent.fullName
                          ? selectedStudent.fullName.substring(0, 2).toUpperCase()
                          : 'ST'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.candidateName}>{selectedStudent.fullName || 'Student'}</Text>
                      <Text style={styles.candidateMeta}>
                        {selectedStudent.branch || 'General'}
                        {selectedStudent.academicYear ? ` • ${selectedStudent.academicYear}` : ''}
                      </Text>
                      {selectedStudent.rollNoOrUSN ? (
                        <View style={styles.candidateStatusRow}>
                          <Text style={styles.candidateStatusText}>
                            USN: {selectedStudent.rollNoOrUSN}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Academic Scores Grid (No pill slop, 5px radius cards) */}
                  <Text style={styles.modalSectionHeading}>ACADEMIC QUALIFICATIONS</Text>
                  <View style={styles.academicGrid}>
                    <View style={styles.academicGridCard}>
                      <Text style={styles.academicGridLabel}>CGPA</Text>
                      <Text style={styles.academicGridVal}>
                        {selectedStudent.cgpa != null
                          ? selectedStudent.cgpa.toFixed(2)
                          : 'N/A'}
                      </Text>
                      <Text style={styles.academicGridSub}>Scale 10.0</Text>
                    </View>

                    <View style={styles.academicGridCard}>
                      <Text style={styles.academicGridLabel}>Backlogs</Text>
                      <Text
                        style={[
                          styles.academicGridVal,
                          {
                            color:
                              (selectedStudent.activeBacklogs || 0) > 0
                                ? '#DC2626'
                                : '#16A34A',
                          },
                        ]}
                      >
                        {selectedStudent.activeBacklogs != null
                          ? selectedStudent.activeBacklogs
                          : '0'}
                      </Text>
                      <Text style={styles.academicGridSub}>Active Backlogs</Text>
                    </View>

                    <View style={styles.academicGridCard}>
                      <Text style={styles.academicGridLabel}>10th Score</Text>
                      <Text style={styles.academicGridVal}>
                        {selectedStudent.tenthPercent != null
                          ? `${selectedStudent.tenthPercent}%`
                          : 'N/A'}
                      </Text>
                      <Text style={styles.academicGridSub}>Secondary</Text>
                    </View>

                    <View style={styles.academicGridCard}>
                      <Text style={styles.academicGridLabel}>12th / Diploma</Text>
                      <Text style={styles.academicGridVal}>
                        {selectedStudent.twelfthPercent != null
                          ? `${selectedStudent.twelfthPercent}%`
                          : 'N/A'}
                      </Text>
                      <Text style={styles.academicGridSub}>Higher Secondary</Text>
                    </View>
                  </View>

                  {/* Contact Info */}
                  <Text style={styles.modalSectionHeading}>CONTACT DETAILS</Text>
                  <View style={styles.infoBoxCard}>
                    {selectedStudent.email ? (
                      <TouchableOpacity
                        style={styles.infoBoxRow}
                        onPress={() => Linking.openURL(`mailto:${selectedStudent.email}`)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="email-outline" size={18} color="#6B6B6B" />
                        <Text style={styles.infoBoxText}>{selectedStudent.email}</Text>
                        <Feather name="external-link" size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    ) : null}

                    {selectedStudent.phone ? (
                      <TouchableOpacity
                        style={[
                          styles.infoBoxRow,
                          selectedStudent.email ? { borderTopWidth: 1, borderTopColor: '#F3F1EA' } : {},
                        ]}
                        onPress={() => Linking.openURL(`tel:${selectedStudent.phone}`)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="phone-outline" size={18} color="#6B6B6B" />
                        <Text style={styles.infoBoxText}>{selectedStudent.phone}</Text>
                        <Feather name="external-link" size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Resume & Professional Links */}
                  <Text style={styles.modalSectionHeading}>DOCUMENTS & PROFILES</Text>
                  <View style={styles.infoBoxCard}>
                    {selectedStudent.resumeUrl ? (
                      <TouchableOpacity
                        style={styles.infoBoxRow}
                        onPress={() => handleOpenResume(selectedStudent.resumeUrl)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="file-pdf-box" size={20} color="#DC2626" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.linkMainText}>Resume (PDF)</Text>
                          <Text style={styles.linkSubText}>Tap to view uploaded resume</Text>
                        </View>
                        <Feather name="arrow-up-right" size={16} color="#1A1B1C" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.infoBoxRow}>
                        <MaterialCommunityIcons name="file-document-outline" size={20} color="#9CA3AF" />
                        <Text style={[styles.linkMainText, { color: '#9CA3AF', marginLeft: 8 }]}>No resume attached</Text>
                      </View>
                    )}

                    {selectedStudent.portfolioUrl ? (
                      <TouchableOpacity
                        style={[styles.infoBoxRow, { borderTopWidth: 1, borderTopColor: '#F3F1EA' }]}
                        onPress={() => Linking.openURL(selectedStudent.portfolioUrl!)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="web" size={20} color="#2563EB" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.linkMainText}>Portfolio Website</Text>
                          <Text style={styles.linkSubText} numberOfLines={1}>{selectedStudent.portfolioUrl}</Text>
                        </View>
                        <Feather name="arrow-up-right" size={16} color="#1A1B1C" />
                      </TouchableOpacity>
                    ) : null}

                    {selectedStudent.linkedinUrl ? (
                      <TouchableOpacity
                        style={[styles.infoBoxRow, { borderTopWidth: 1, borderTopColor: '#F3F1EA' }]}
                        onPress={() => Linking.openURL(selectedStudent.linkedinUrl!)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="linkedin" size={20} color="#0A66C2" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.linkMainText}>LinkedIn</Text>
                          <Text style={styles.linkSubText} numberOfLines={1}>{selectedStudent.linkedinUrl}</Text>
                        </View>
                        <Feather name="arrow-up-right" size={16} color="#1A1B1C" />
                      </TouchableOpacity>
                    ) : null}

                    {selectedStudent.githubUrl ? (
                      <TouchableOpacity
                        style={[styles.infoBoxRow, { borderTopWidth: 1, borderTopColor: '#F3F1EA' }]}
                        onPress={() => Linking.openURL(selectedStudent.githubUrl!)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="github" size={20} color="#171717" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.linkMainText}>GitHub</Text>
                          <Text style={styles.linkSubText} numberOfLines={1}>{selectedStudent.githubUrl}</Text>
                        </View>
                        <Feather name="arrow-up-right" size={16} color="#1A1B1C" />
                      </TouchableOpacity>
                    ) : null}

                    {selectedStudent.leetcodeUrl ? (
                      <TouchableOpacity
                        style={[styles.infoBoxRow, { borderTopWidth: 1, borderTopColor: '#F3F1EA' }]}
                        onPress={() => Linking.openURL(selectedStudent.leetcodeUrl!)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="code-tags" size={20} color="#FFA116" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.linkMainText}>LeetCode</Text>
                          <Text style={styles.linkSubText} numberOfLines={1}>{selectedStudent.leetcodeUrl}</Text>
                        </View>
                        <Feather name="arrow-up-right" size={16} color="#1A1B1C" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFDF7' },
  container: { padding: 14, paddingBottom: 60, gap: 12 },

  // Search & Filter Trigger Row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
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
  filterActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 5,
    height: 44,
    paddingHorizontal: 8,
    gap: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  filterActionBtnActive: {
    backgroundColor: '#FFF4C7',
  },
  filterActionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.medium,
  },
  filterActionBtnTextActive: {
    color: '#1A1B1C',
    fontWeight: '800',
  },
  filterBadge: {
    backgroundColor: '#1A1B1C',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Quick Horizontal Filter Chips (White background unselected, yellow active, 5px radius)
  quickFilterScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  quickFilterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  quickFilterChipActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  quickFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  quickFilterTextActive: {
    color: '#1A1B1C',
    fontWeight: '800',
  },

  // Candidate Count
  candidateCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: 2,
    marginBottom: 2,
  },
  candidateCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  clearFilterLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    textDecorationLine: 'underline',
  },

  // Student Card
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
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
    borderWidth: 1,
    borderColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  studentInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
    flex: 1,
    marginRight: 8,
  },
  metaLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  studentMetaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Scores
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FBF9F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 2,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171717',
    marginTop: 2,
  },
  backlogAlertValue: {
    color: '#DC2626',
  },

  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
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

  divider: { height: 1, backgroundColor: '#F3F1EA', marginVertical: 4 },

  studentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderRadius: 5,
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
  emptyResetBtn: {
    marginTop: 14,
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 5,
  },
  emptyResetBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1A1B1C',
  },

  // Modal Styles (borderRadius: 5)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 18,
  },
  filterSectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  modalChipActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  modalChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  modalChipTextActive: {
    color: '#1A1B1C',
    fontWeight: '800',
  },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    backgroundColor: '#FBF9F3',
  },
  modalResetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalResetBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  modalApplyBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  modalApplyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1B1C',
  },

  // Candidate Details Modal (Matches View Applicants Modal)
  detailsModalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  detailsModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F1EA',
  },
  detailsModalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  detailsModalHeaderSub: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
  },
  detailsModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#F3F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsModalScrollContent: {
    paddingVertical: 14,
    gap: 14,
  },
  candidateProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFDF7',
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F3F1EA',
  },
  avatarCircleLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
  },
  candidateMeta: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
  },
  candidateStatusRow: {
    marginTop: 4,
  },
  candidateStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  modalSectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  academicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  academicGridCard: {
    width: '48%',
    backgroundColor: '#FAFAFA',
    borderRadius: 5,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  academicGridLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8A8A',
    textTransform: 'uppercase',
  },
  academicGridVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
    marginTop: 4,
  },
  academicGridSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  infoBoxCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  infoBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  infoBoxText: {
    fontSize: 13,
    color: '#171717',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  linkMainText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
  },
  linkSubText: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 1,
  },
});
