import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  AdmissionApplication,
  AdmissionCourse,
  getAdmissionApplications,
  getAdmissionCourses,
  unallocateAdmissionSeat,
  confirmAdmissionSeat,
  cancelAdmissionApplication,
} from '../../../api/admission';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { AdmissionStudentDetailModal } from './AdmissionStudentDetailModal';
import { AdmissionAllocationModal } from './AdmissionAllocationModal';

type StatusTab = 'waiting_list' | 'allocated' | 'confirmed';

interface AdmissionStudentsViewProps {
  initialBranchId?: string;
  initialStatus?: string;
}

export function AdmissionStudentsView({
  initialBranchId,
  initialStatus,
}: AdmissionStudentsViewProps) {
  const [activeTab, setActiveTab] = useState<StatusTab>(
    (initialStatus as StatusTab) || 'waiting_list'
  );
  const [students, setStudents] = useState<AdmissionApplication[]>([]);
  const [courses, setCourses] = useState<AdmissionCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>(initialBranchId || 'all');
  const [selectedQuota, setSelectedQuota] = useState<string>('all');

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<AdmissionApplication | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [allocationModalVisible, setAllocationModalVisible] = useState(false);
  const [studentToAllocate, setStudentToAllocate] = useState<AdmissionApplication | null>(null);

  const loadData = async () => {
    try {
      const [apps, crs] = await Promise.all([
        getAdmissionApplications({
          status: 'all',
        }).catch(() => []),
        getAdmissionCourses().catch(() => []),
      ]);
      setStudents(apps);
      setCourses(crs);
    } catch (err) {
      console.warn('Failed to load students:', err);
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

  // Extract unique batches for filtering
  const batches = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.academicYear) set.add(s.academicYear.trim());
    });
    return Array.from(set).sort().reverse();
  }, [students]);

  // Extract unique quotas for filtering
  const quotas = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      (c.quotas || []).forEach((q) => set.add(q.quotaName));
    });
    return Array.from(set).sort();
  }, [courses]);

  // Tab counts
  const waitingCount = useMemo(() => students.filter((s) => s.status === 'waiting_list').length, [students]);
  const allocatedCount = useMemo(() => students.filter((s) => s.status === 'allocated').length, [students]);
  const confirmedCount = useMemo(() => students.filter((s) => s.status === 'confirmed').length, [students]);

  // Filtered List based on tab and active filters
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Status Tab
      if (s.status !== activeTab) return false;

      // 2. Batch Filter
      if (selectedBatch !== 'all' && s.academicYear !== selectedBatch) return false;

      // 3. Branch Filter
      if (selectedBranch !== 'all') {
        if (activeTab === 'waiting_list') {
          if (s.preferredCourseId !== selectedBranch) return false;
        } else {
          if (s.allocatedCourseId !== selectedBranch) return false;
        }
      }

      // 4. Quota Filter
      if (selectedQuota !== 'all') {
        if ((s.allocatedQuota || '').toLowerCase() !== selectedQuota.toLowerCase()) return false;
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.fullName.toLowerCase().includes(q);
        const matchesAppNo = s.applicationNumber.toLowerCase().includes(q);
        const matchesPhone = s.parentPhone.toLowerCase().includes(q);
        const matchesFather = s.fatherName && s.fatherName.toLowerCase().includes(q);
        if (!matchesName && !matchesAppNo && !matchesPhone && !matchesFather) return false;
      }

      return true;
    });
  }, [students, activeTab, selectedBatch, selectedBranch, selectedQuota, searchQuery]);

  const activeFilterCount = (selectedBatch !== 'all' ? 1 : 0) +
    (selectedBranch !== 'all' ? 1 : 0) +
    (selectedQuota !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSelectedBatch('all');
    setSelectedBranch('all');
    setSelectedQuota('all');
    setSearchQuery('');
  };

  // Actions
  const handleUnallocate = (student: AdmissionApplication) => {
    Alert.alert(
      'Unallocate Seat',
      `Are you sure you want to unallocate ${student.fullName}? The seat will be returned to the branch pool and the student will return to the Waiting List.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unallocate',
          style: 'destructive',
          onPress: async () => {
            try {
              await unallocateAdmissionSeat(student.id);
              Alert.alert('Unallocated', `${student.fullName} moved back to Waiting List.`);
              setDetailModalVisible(false);
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not unallocate seat');
            }
          },
        },
      ]
    );
  };

  const handleConfirmAdmission = (student: AdmissionApplication) => {
    Alert.alert(
      'Confirm Admission',
      `Confirm admission for ${student.fullName}? This permanently locks the seat in ${student.allocatedCourseName || 'the branch'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Admission',
          onPress: async () => {
            try {
              await confirmAdmissionSeat(student.id);
              Alert.alert('Confirmed', `Admission finalized for ${student.fullName}!`);
              setDetailModalVisible(false);
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not confirm admission');
            }
          },
        },
      ]
    );
  };

  const handleCancelApplication = (student: AdmissionApplication) => {
    Alert.alert(
      'Discard Application',
      `Cancel application for ${student.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAdmissionApplication(student.id);
              setDetailModalVisible(false);
              loadData();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not cancel application');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top 3-State Filter Tabs */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'waiting_list' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('waiting_list')}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'waiting_list' && styles.segmentBtnTextActive]}>
            Waiting List <Text style={styles.segmentCountText}>({waitingCount})</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'allocated' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('allocated')}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'allocated' && styles.segmentBtnTextActive]}>
            Allocated <Text style={styles.segmentCountText}>({allocatedCount})</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'confirmed' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('confirmed')}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentBtnText, activeTab === 'confirmed' && styles.segmentBtnTextActive]}>
            Confirmed <Text style={styles.segmentCountText}>({confirmedCount})</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#8A8A8A" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name, phone, application ID..."
            placeholderTextColor="#8A8A8A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Feather name="x" size={16} color="#8A8A8A" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
          {/* Batch Filter Chip */}
          {batches.length > 0 && (
            <TouchableOpacity
              style={[styles.chip, selectedBatch !== 'all' && styles.chipActive]}
              onPress={() => {
                // cycle batches
                const allOptions = ['all', ...batches];
                const nextIdx = (allOptions.indexOf(selectedBatch) + 1) % allOptions.length;
                setSelectedBatch(allOptions[nextIdx]);
              }}
            >
              <Text style={[styles.chipText, selectedBatch !== 'all' && styles.chipTextActive]}>
                Batch: {selectedBatch === 'all' ? 'All' : selectedBatch}
              </Text>
            </TouchableOpacity>
          )}

          {/* Branch Filter Chip */}
          <TouchableOpacity
            style={[styles.chip, selectedBranch !== 'all' && styles.chipActive]}
            onPress={() => {
              const allBranchIds = ['all', ...courses.map((c) => c.id)];
              const nextIdx = (allBranchIds.indexOf(selectedBranch) + 1) % allBranchIds.length;
              setSelectedBranch(allBranchIds[nextIdx]);
            }}
          >
            <Text style={[styles.chipText, selectedBranch !== 'all' && styles.chipTextActive]}>
              Branch: {selectedBranch === 'all' ? 'All' : courses.find((c) => c.id === selectedBranch)?.courseCode || 'Branch'}
            </Text>
          </TouchableOpacity>

          {/* Quota Filter Chip (relevant for Allocated / Confirmed) */}
          {activeTab !== 'waiting_list' && quotas.length > 0 && (
            <TouchableOpacity
              style={[styles.chip, selectedQuota !== 'all' && styles.chipActive]}
              onPress={() => {
                const allQuotas = ['all', ...quotas];
                const nextIdx = (allQuotas.indexOf(selectedQuota) + 1) % allQuotas.length;
                setSelectedQuota(allQuotas[nextIdx]);
              }}
            >
              <Text style={[styles.chipText, selectedQuota !== 'all' && styles.chipTextActive]}>
                Quota: {selectedQuota === 'all' ? 'All' : selectedQuota}
              </Text>
            </TouchableOpacity>
          )}

          {activeFilterCount > 0 && (
            <TouchableOpacity style={styles.clearFiltersBtn} onPress={resetFilters}>
              <Text style={styles.clearFiltersText}>Clear ({activeFilterCount}) ✕</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Candidate Count Header */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {filteredStudents.length} candidate{filteredStudents.length === 1 ? '' : 's'} in{' '}
          {activeTab === 'waiting_list' ? 'Waiting List' : activeTab === 'allocated' ? 'Allocated State' : 'Confirmed Admissions'}
        </Text>
      </View>

      {/* Students Scroll List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
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
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-search-outline" size={38} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No Candidates Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery || activeFilterCount > 0
                ? 'Try adjusting your search query or filter chips.'
                : activeTab === 'waiting_list'
                ? 'No students currently in the Waiting List. Click (+) to register a new applicant.'
                : activeTab === 'allocated'
                ? 'No students currently holding provisionally allocated seats.'
                : 'No admissions confirmed yet.'}
            </Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity style={styles.emptyResetBtn} onPress={resetFilters}>
                <Text style={styles.emptyResetBtnText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredStudents.map((student) => {
            const initials = student.fullName
              ? student.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'ST';

            return (
              <TouchableOpacity
                key={student.id}
                style={styles.studentCard}
                onPress={() => {
                  setSelectedStudent(student);
                  setDetailModalVisible(true);
                }}
                activeOpacity={0.75}
              >
                {/* Top Row: Avatar, Name, App ID, Status Badge */}
                <View style={styles.cardTopRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>

                  <View style={styles.nameMetaCol}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {student.fullName}
                    </Text>
                    <Text style={styles.studentSubMeta}>
                      {student.applicationNumber} • Batch {student.academicYear}
                    </Text>
                  </View>

                  <Text style={styles.cardStatusText}>
                    {activeTab === 'waiting_list'
                      ? 'Waiting'
                      : activeTab === 'allocated'
                      ? 'Allocated'
                      : 'Confirmed'}
                  </Text>
                </View>

                {/* Middle Info Row: Clean key-value without icon clutter */}
                <View style={styles.cardInfoRow}>
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>
                      {activeTab === 'waiting_list' ? 'Preferred Branch' : 'Allocated Branch'}
                    </Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {activeTab === 'waiting_list'
                        ? student.preferredCourseName || 'Not specified'
                        : student.allocatedCourseName || 'Branch'}
                    </Text>
                  </View>

                  {activeTab !== 'waiting_list' && student.allocatedQuota ? (
                    <View style={styles.infoBlock}>
                      <Text style={styles.infoLabel}>Quota</Text>
                      <Text style={[styles.infoValue, { color: '#171717', fontWeight: '700' }]}>
                        {student.allocatedQuota}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.infoBlock}>
                      <Text style={styles.infoLabel}>Parent Mobile</Text>
                      <Text style={styles.infoValue}>{student.parentPhone || '—'}</Text>
                    </View>
                  )}
                </View>

                {/* Card Action Bar */}
                <View style={styles.cardActionRow}>
                  <TouchableOpacity
                    style={styles.viewDetailBtn}
                    onPress={() => {
                      setSelectedStudent(student);
                      setDetailModalVisible(true);
                    }}
                  >
                    <Text style={styles.viewDetailText}>View Details</Text>
                  </TouchableOpacity>

                  {activeTab === 'waiting_list' && (
                    <TouchableOpacity
                      style={styles.allocateActionBtn}
                      onPress={() => {
                        setStudentToAllocate(student);
                        setAllocationModalVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.allocateActionBtnText}>Allocate Seat</Text>
                    </TouchableOpacity>
                  )}

                  {activeTab === 'allocated' && (
                    <View style={styles.allocatedActionGroup}>
                      <TouchableOpacity
                        style={styles.unallocateActionBtn}
                        onPress={() => handleUnallocate(student)}
                      >
                        <Text style={styles.unallocateActionBtnText}>Unallocate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.confirmInlineBtn}
                        onPress={() => handleConfirmAdmission(student)}
                      >
                        <Text style={styles.confirmInlineBtnText}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {activeTab === 'confirmed' && (
                    <View style={styles.confirmedLockedTag}>
                      <Feather name="check" size={13} color="#1A1B1C" />
                      <Text style={styles.confirmedLockedTagText}>Seat Locked</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Student Detail Modal */}
      <AdmissionStudentDetailModal
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        application={selectedStudent}
        onAllocatePress={(student) => {
          setDetailModalVisible(false);
          setStudentToAllocate(student);
          setAllocationModalVisible(true);
        }}
        onUnallocatePress={handleUnallocate}
        onConfirmPress={handleConfirmAdmission}
        onCancelPress={handleCancelApplication}
      />

      {/* Allocation Modal */}
      <AdmissionAllocationModal
        visible={allocationModalVisible}
        onClose={() => setAllocationModalVisible(false)}
        application={studentToAllocate}
        courses={courses}
        onSuccess={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // 3-Segmented Pill Switcher
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 5,
  },
  segmentBtnActive: {
    backgroundColor: '#F4C430',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
  },
  segmentBtnTextActive: {
    color: '#1A1B1C',
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  segmentCountText: {
    color: '#1A1B1C',
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },

  // Search & Filters
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#1A1B1C',
    padding: 0,
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipActive: {
    backgroundColor: '#FFF4C7',
    borderColor: '#F4C430',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  chipTextActive: {
    color: '#1A1B1C',
    fontWeight: '800',
  },
  clearFiltersBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  clearFiltersText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },

  summaryBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  summaryText: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
    gap: 10,
  },

  // Student Card
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  nameMetaCol: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  studentSubMeta: {
    fontSize: 11,
    color: '#8A8A8A',
    marginTop: 1,
  },
  cardStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B6B6B',
  },

  cardInfoRow: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderRadius: 5,
    padding: 8,
    gap: 10,
  },
  infoBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#8A8A8A',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1A1B1C',
    marginTop: 2,
  },

  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  viewDetailBtn: {
    paddingVertical: 4,
  },
  viewDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  allocateActionBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  allocateActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  allocatedActionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  unallocateActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  unallocateActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  confirmInlineBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 5,
  },
  confirmInlineBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  confirmedLockedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  confirmedLockedTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1B1C',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
  },
  emptySub: {
    fontSize: 11.5,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyResetBtn: {
    backgroundColor: '#FFF4C7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 5,
    marginTop: 6,
  },
  emptyResetBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1B1C',
  },
});
