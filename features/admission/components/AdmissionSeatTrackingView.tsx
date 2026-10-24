import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  AdmissionCourse,
  AdmissionStats,
  getAdmissionCourses,
  getAdmissionStats,
} from '../../../api/admission';
import { FontFamily } from '../../../constants/fonts';
import { AdmissionBatchConfigModal } from './AdmissionBatchConfigModal';

interface AdmissionSeatTrackingViewProps {
  onNavigateToStudents?: (branchId?: string, status?: string) => void;
  onOpenIntakeForm?: () => void;
}

export function AdmissionSeatTrackingView({
  onNavigateToStudents,
}: AdmissionSeatTrackingViewProps) {
  const [stats, setStats] = useState<AdmissionStats | null>(null);
  const [courses, setCourses] = useState<AdmissionCourse[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('2026-2027');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<AdmissionCourse | null>(null);

  const loadData = async (batch: string) => {
    try {
      const [s, c] = await Promise.all([
        getAdmissionStats(batch).catch(() => null),
        getAdmissionCourses(batch).catch(() => []),
      ]);
      setStats(s);
      setCourses(c);
      if (s?.batches && s.batches.length > 0 && !s.batches.includes(batch)) {
        setSelectedBatch(s.batches[0]);
      }
    } catch (err) {
      console.warn('Seat tracking data load failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(selectedBatch);
  }, [selectedBatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(selectedBatch);
  };

  const totalSeats = stats?.totalSeats ?? 0;
  const availableSeats = stats?.availableSeats ?? 0;
  const waitingCount = stats?.waitingListCount ?? 0;

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
      {/* Top Bar: Intake Batch Tabs & Add Branch Action */}
      <View style={styles.topBar}>
        <View style={styles.batchSelector}>
          <Text style={styles.batchLabel}>INTAKE BATCH</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.batchPills}>
            {(stats?.batches || ['2026-2027', '2025-2026']).map((b) => {
              const isSelected = selectedBatch === b;
              return (
                <TouchableOpacity
                  key={b}
                  style={[styles.batchPill, isSelected && styles.batchPillActive]}
                  onPress={() => setSelectedBatch(b)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.batchPillText, isSelected && styles.batchPillTextActive]}>
                    {b}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.addBranchBtn}
          onPress={() => {
            setCourseToEdit(null);
            setConfigModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={13} color="#1A1B1C" />
          <Text style={styles.addBranchBtnText}>Add Branch Matrix</Text>
        </TouchableOpacity>
      </View>

      {/* Clean ERP Overview Stats Strip (Zero odd green, clean 5px border radius) */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewCell}>
          <Text style={styles.overviewVal}>{courses.length}</Text>
          <Text style={styles.overviewLabel}>Branches</Text>
        </View>

        <View style={styles.overviewDivider} />

        <View style={styles.overviewCell}>
          <Text style={styles.overviewVal}>{totalSeats}</Text>
          <Text style={styles.overviewLabel}>Capacity</Text>
        </View>

        <View style={styles.overviewDivider} />

        <View style={styles.overviewCell}>
          <Text style={styles.overviewVal}>{availableSeats}</Text>
          <Text style={styles.overviewLabel}>Vacant</Text>
        </View>

        <View style={styles.overviewDivider} />

        <TouchableOpacity
          style={styles.overviewCell}
          onPress={() => onNavigateToStudents && onNavigateToStudents(undefined, 'waiting_list')}
          activeOpacity={0.7}
        >
          <View style={styles.waitingCellRow}>
            <Text style={styles.overviewVal}>{waitingCount}</Text>
            <Feather name="arrow-up-right" size={11} color="#6B6B6B" style={{ marginTop: 2 }} />
          </View>
          <Text style={styles.overviewLabel}>Waiting List</Text>
        </TouchableOpacity>
      </View>

      {/* Section Heading */}
      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionHeading}>PROGRAM BRANCH SEAT MATRIX</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#1A1B1C" />
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="layers" size={32} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Branch Matrix Configured</Text>
          <Text style={styles.emptySub}>
            Configure your intake programs, total seat limits, and quota divisions (e.g. CS 120 seats: CET 80, Management 40).
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => {
              setCourseToEdit(null);
              setConfigModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyAddBtnText}>+ Add Branch Matrix</Text>
          </TouchableOpacity>
        </View>
      ) : (
        courses.map((course) => {
          const cTotal = course.totalSeats || 1;
          const cConfirmed = course.confirmedSeats || 0;
          const cAllocated = course.allocatedSeats || 0;
          const cAvailable = course.availableSeats || 0;

          const pctConfirmed = Math.min(100, Math.round((cConfirmed / cTotal) * 100));
          const pctAllocated = Math.min(100 - pctConfirmed, Math.round((cAllocated / cTotal) * 100));
          const pctAvailable = Math.max(0, 100 - (pctConfirmed + pctAllocated));

          return (
            <View key={course.id} style={styles.branchCard}>
              {/* Header Row: Branch Code Badge, Name, Status Typography (Zero odd green) */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.branchBadge}>
                  <Text style={styles.branchBadgeText}>{course.courseCode}</Text>
                </View>

                <View style={styles.branchTitleCol}>
                  <Text style={styles.branchNameText} numberOfLines={1}>
                    {course.courseName}
                  </Text>
                  <Text style={styles.branchProgramTag}>
                    {course.programType.toUpperCase()}
                  </Text>
                </View>

                {/* Clean Status Text - Neutral High-Contrast Typography */}
                <Text style={[styles.statusCleanText, cAvailable === 0 && styles.statusTextFull]}>
                  {cAvailable > 0 ? `${cAvailable} Seats Left` : 'Filled'}
                </Text>

                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => {
                    setCourseToEdit(course);
                    setConfigModalVisible(true);
                  }}
                  hitSlop={10}
                >
                  <Feather name="edit-2" size={13} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Hairline Divider */}
              <View style={styles.divider} />

              {/* 4-Column Seat Metrics */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>TOTAL</Text>
                  <Text style={styles.metricValue}>{course.totalSeats}</Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>VACANT</Text>
                  <Text style={styles.metricValue}>{cAvailable}</Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>ALLOCATED</Text>
                  <Text style={styles.metricValue}>{cAllocated}</Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>CONFIRMED</Text>
                  <Text style={styles.metricValue}>{cConfirmed}</Text>
                </View>
              </View>

              {/* Sleek Progress Track & Clean Legend */}
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  {pctConfirmed > 0 && (
                    <View style={[styles.segConfirmed, { flex: pctConfirmed }]} />
                  )}
                  {pctAllocated > 0 && (
                    <View style={[styles.segAllocated, { flex: pctAllocated }]} />
                  )}
                  {pctAvailable > 0 && (
                    <View style={[styles.segAvailable, { flex: pctAvailable }]} />
                  )}
                </View>

                <View style={styles.legendRow}>
                  <Text style={styles.legendText}>
                    {cConfirmed} confirmed  ·  {cAllocated} provisional  ·  {cAvailable} vacant
                  </Text>
                </View>
              </View>

              {/* Quota Distribution Breakdown (Clean Structured Table) */}
              {course.quotaSummaries && course.quotaSummaries.length > 0 ? (
                <View style={styles.quotaSection}>
                  <Text style={styles.quotaHeading}>QUOTA BREAKDOWN</Text>
                  <View style={styles.quotaTable}>
                    {course.quotaSummaries.map((q, idx) => {
                      const isFull = q.available <= 0;
                      return (
                        <View key={q.quotaName} style={[styles.quotaRow, idx > 0 && styles.quotaRowDivider]}>
                          <Text style={styles.quotaNameText}>{q.quotaName} Quota</Text>
                          <Text style={styles.quotaNumbersText}>
                            <Text style={[styles.quotaAvailNum, isFull && styles.quotaAvailNumFull]}>
                              {q.available} vacant
                            </Text>
                            <Text style={styles.quotaTotalText}> of {q.total} total</Text>
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* Card Footer: Fast Candidate Navigation */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.viewCandidatesBtn}
                  onPress={() => onNavigateToStudents && onNavigateToStudents(course.id, 'all')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewCandidatesText}>
                    View Candidates in {course.courseCode}
                  </Text>
                  <Feather name="arrow-right" size={13} color="#1A1B1C" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {/* Batch Config Modal */}
      <AdmissionBatchConfigModal
        visible={configModalVisible}
        onClose={() => setConfigModalVisible(false)}
        activeBatch={selectedBatch}
        courseToEdit={courseToEdit}
        onSuccess={() => loadData(selectedBatch)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  batchSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  batchLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8A8A8A',
    letterSpacing: 0.6,
  },
  batchPills: {
    flexDirection: 'row',
    gap: 6,
  },
  // White background with grey border for batch pills as requested
  batchPill: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 5,
  },
  batchPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E5DC',
    borderWidth: 1,
  },
  batchPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A8A8A',
  },
  batchPillTextActive: {
    color: '#1A1B1C',
    fontWeight: '800',
  },
  addBranchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 5,
  },
  addBranchBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1B1C',
  },

  // Overview Stats Card (5px border radius)
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  overviewVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  overviewLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#8A8A8A',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  overviewDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E8E5DC',
  },
  waitingCellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  // Section Heading
  sectionHeadingRow: {
    paddingHorizontal: 2,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  // Professional Branch Card (5px border radius)
  branchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  branchBadge: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 5,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1A1B1C',
    letterSpacing: 0.5,
  },
  branchTitleCol: {
    flex: 1,
  },
  branchNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  branchProgramTag: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#8A8A8A',
    letterSpacing: 0.5,
    marginTop: 1,
  },

  // Clean Typography Status (Neutral subtle text instead of odd green)
  statusCleanText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  statusTextFull: {
    color: '#DC2626',
    fontWeight: '700',
  },
  editBtn: {
    padding: 4,
    marginLeft: 2,
  },

  divider: {
    height: 1,
    backgroundColor: '#F3F1EA',
  },

  // 4-Column Seat Breakdown Row
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8A8A8A',
    letterSpacing: 0.4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1B1C',
    marginTop: 2,
    fontFamily: FontFamily.bold,
  },

  // Multi-Segment Progress Track
  progressSection: {
    gap: 6,
  },
  progressBar: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E5E7EB',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segConfirmed: {
    backgroundColor: '#1A1B1C',
  },
  segAllocated: {
    backgroundColor: '#F4C430',
  },
  segAvailable: {
    backgroundColor: '#E5E7EB',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  legendText: {
    fontSize: 11,
    color: '#6B6B6B',
    fontWeight: '600',
  },

  // Quota Breakdown (Clean table with 5px radius)
  quotaSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F1EA',
    paddingTop: 10,
    gap: 6,
  },
  quotaHeading: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8A8A8A',
    letterSpacing: 0.6,
  },
  quotaTable: {
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    overflow: 'hidden',
  },
  quotaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  quotaRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F3F1EA',
  },
  quotaNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171717',
  },
  quotaNumbersText: {
    fontSize: 11.5,
  },
  quotaAvailNum: {
    fontWeight: '700',
    color: '#171717',
  },
  quotaAvailNumFull: {
    color: '#DC2626',
    fontWeight: '700',
  },
  quotaTotalText: {
    color: '#8A8A8A',
    fontWeight: '600',
  },

  // Card Footer
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F1EA',
    paddingTop: 8,
  },
  viewCandidatesBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  viewCandidatesText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1B1C',
  },

  // Empty State (5px radius)
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 8,
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
  emptyAddBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 6,
  },
  emptyAddBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1B1C',
  },
});
