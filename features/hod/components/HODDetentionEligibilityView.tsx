import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { ExamEligibilityRecord, HallTicketStatus } from '../types/hod.types';

interface HODDetentionEligibilityViewProps {
  records: ExamEligibilityRecord[];
  refreshing: boolean;
  onRefresh: () => void;
  onReviewRecord: (record: ExamEligibilityRecord) => void;
}

export const HODDetentionEligibilityView: React.FC<HODDetentionEligibilityViewProps> = ({
  records,
  refreshing,
  onRefresh,
  onReviewRecord,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<HallTicketStatus | 'all'>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  const semesters = ['all', ...Array.from(new Set(records.map((r) => r.semester)))];

  const filteredRecords = records.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      r.studentName.toLowerCase().includes(q) ||
      r.usn.toLowerCase().includes(q) ||
      (r.condonationReason && r.condonationReason.toLowerCase().includes(q));

    const matchesStatus = selectedStatus === 'all' || r.hallTicketStatus === selectedStatus;
    const matchesSemester =
      selectedSemester === 'all' || r.semester.toLowerCase() === selectedSemester.toLowerCase();

    return matchesSearch && matchesStatus && matchesSemester;
  });

  const getStatusBadge = (status: HallTicketStatus) => {
    switch (status) {
      case 'eligible':
        return { label: 'Hall Ticket Cleared', bg: '#16A34A18', text: '#16A34A', icon: 'check-circle' };
      case 'condonation_needed':
        return { label: 'Condonation Review', bg: '#F59E0B18', text: '#D97706', icon: 'clock-alert-outline' };
      case 'detained':
        return { label: 'Detained from Exam', bg: '#DC262618', text: '#DC2626', icon: 'close-circle' };
    }
  };

  const detainedCount = records.filter((r) => r.hallTicketStatus === 'detained').length;
  const condonationCount = records.filter((r) => r.hallTicketStatus === 'condonation_needed').length;
  const clearedCount = records.filter((r) => r.hallTicketStatus === 'eligible').length;

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by USN / Roll number or Student name..."
            placeholderTextColor="#9E9E9E"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9E9E9E" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Summary KPI Strip */}
      <View style={styles.summaryStrip}>
        <TouchableOpacity
          style={[styles.stripCard, selectedStatus === 'detained' && styles.stripCardSelected]}
          onPress={() => setSelectedStatus(selectedStatus === 'detained' ? 'all' : 'detained')}
        >
          <Text style={[styles.stripValue, { color: '#DC2626' }]}>{detainedCount}</Text>
          <Text style={styles.stripLabel}>Detained</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stripCard, selectedStatus === 'condonation_needed' && styles.stripCardSelected]}
          onPress={() =>
            setSelectedStatus(selectedStatus === 'condonation_needed' ? 'all' : 'condonation_needed')
          }
        >
          <Text style={[styles.stripValue, { color: '#D97706' }]}>{condonationCount}</Text>
          <Text style={styles.stripLabel}>Under Review</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stripCard, selectedStatus === 'eligible' && styles.stripCardSelected]}
          onPress={() => setSelectedStatus(selectedStatus === 'eligible' ? 'all' : 'eligible')}
        >
          <Text style={[styles.stripValue, { color: '#16A34A' }]}>{clearedCount}</Text>
          <Text style={styles.stripLabel}>Cleared</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {semesters.map((sem) => {
            const isSelected = selectedSemester === sem;
            return (
              <TouchableOpacity
                key={sem}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedSemester(sem)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {sem === 'all' ? 'All Semesters' : sem}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Student List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>
            Showing <Text style={{ fontWeight: '800', color: '#171717' }}>{filteredRecords.length}</Text> Candidate Records
          </Text>
        </View>

        {filteredRecords.map((r) => {
          const status = getStatusBadge(r.hallTicketStatus);
          const isBelowThreshold = r.overallAttendancePct < 75;

          return (
            <View key={r.id} style={styles.recordCard}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.studentName}>{r.studentName}</Text>
                    <View style={styles.usnBadge}>
                      <Text style={styles.usnBadgeText}>{r.usn}</Text>
                    </View>
                  </View>
                  <Text style={styles.semText}>{r.semester}</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <MaterialCommunityIcons name={status.icon as any} size={14} color={status.text} />
                  <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                </View>
              </View>

              {/* Performance Metrics */}
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Attendance</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: isBelowThreshold ? '#DC2626' : '#16A34A' },
                    ]}
                  >
                    {r.overallAttendancePct}%
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Deficit Subjects</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: r.coursesBelowThreshold > 0 ? '#DC2626' : '#16A34A' },
                    ]}
                  >
                    {r.coursesBelowThreshold} Courses
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Internal Marks</Text>
                  <Text style={styles.metricValue}>
                    {r.internalAssessmentScore}
                    <Text style={{ fontSize: 10, color: '#6B6B6B' }}>/50</Text>
                  </Text>
                </View>
              </View>

              {/* Grounds / Reason If Present */}
              {r.condonationReason && (
                <View style={styles.reasonCard}>
                  <MaterialCommunityIcons name="note-text-outline" size={14} color="#B45309" />
                  <Text style={styles.reasonText} numberOfLines={2}>
                    <Text style={{ fontWeight: '700' }}>Grounds: </Text>
                    {r.condonationReason}
                  </Text>
                </View>
              )}

              {/* HOD Endorsement Note If Present */}
              {r.remarks && (
                <View style={styles.remarksCard}>
                  <MaterialCommunityIcons name="shield-check-outline" size={14} color="#065F46" />
                  <Text style={styles.remarksText} numberOfLines={2}>
                    <Text style={{ fontWeight: '700' }}>HOD Note: </Text>
                    {r.remarks}
                  </Text>
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity
                style={styles.reviewBtn}
                onPress={() => onReviewRecord(r)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="clipboard-check-outline" size={16} color="#EA580C" />
                <Text style={styles.reviewBtnText}>Review & Update Clearance</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {filteredRecords.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="card-account-details-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No student records found</Text>
            <Text style={styles.emptyStateSub}>All students may be in regular standing or query is unmatched.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  stripCard: {
    flex: 1,
    backgroundColor: '#FFFDF7',
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingVertical: 8,
    alignItems: 'center',
  },
  stripCardSelected: {
    borderColor: '#1A1B1C',
    backgroundColor: '#1A1B1C',
  },
  stripValue: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FontFamily.poppins,
  },
  stripLabel: {
    fontSize: 10,
    color: '#6B6B6B',
    marginTop: 1,
    fontFamily: FontFamily.poppins,
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  filterChipSelected: {
    backgroundColor: '#1A1B1C',
    borderColor: '#1A1B1C',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  filterChipTextSelected: {
    color: '#F4C430',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  listHeader: {
    marginBottom: 4,
  },
  listHeaderText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  usnBadge: {
    backgroundColor: '#FFF4C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  usnBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F4C430',
    fontFamily: FontFamily.poppins,
  },
  semText: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
    fontFamily: FontFamily.poppins,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FontFamily.poppins,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFDF7',
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 10,
    gap: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171717',
    marginTop: 2,
    fontFamily: FontFamily.poppins,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F59E0B18',
    padding: 8,
    borderRadius: BorderRadius.chip,
    gap: 6,
  },
  reasonText: {
    flex: 1,
    fontSize: 11,
    color: '#D97706',
    fontFamily: FontFamily.poppins,
    lineHeight: 16,
  },
  remarksCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#16A34A18',
    padding: 8,
    borderRadius: BorderRadius.chip,
    gap: 6,
  },
  remarksText: {
    flex: 1,
    fontSize: 11,
    color: '#16A34A',
    fontFamily: FontFamily.poppins,
    lineHeight: 16,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.button,
    backgroundColor: '#F4C430',
    gap: 6,
  },
  reviewBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1B1C',
    fontFamily: FontFamily.poppins,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
    fontFamily: FontFamily.poppins,
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: FontFamily.poppins,
  },
});
