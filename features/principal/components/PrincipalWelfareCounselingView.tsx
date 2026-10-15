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
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import {
  CounselingRecord,
  CONCERN_LABELS,
} from '../types/principal.types';

interface PrincipalWelfareCounselingViewProps {
  records: CounselingRecord[];
  refreshing: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onToggleStatus: (id: string, currentStatus: CounselingRecord['status']) => void;
}

export const PrincipalWelfareCounselingView: React.FC<PrincipalWelfareCounselingViewProps> = ({
  records,
  refreshing,
  onRefresh,
  onOpenCreateModal,
  onToggleStatus,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'in_progress' | 'resolved' | 'high_priority'>('all');

  const filteredRecords = records.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      r.studentName.toLowerCase().includes(q) ||
      r.gradeSection.toLowerCase().includes(q) ||
      r.counselorName.toLowerCase().includes(q) ||
      r.actionPlan.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'high_priority') return r.severity === 'high' && r.status !== 'resolved';
    return r.status === statusFilter;
  });

  const activeCasesCount = records.filter((r) => r.status !== 'resolved').length;
  const attendanceCasesCount = records.filter((r) => r.concernCategory === 'attendance_issue' && r.status !== 'resolved').length;

  return (
    <View style={styles.container}>
      {/* Top Header & Search */}
      <View style={styles.headerBlock}>
        <View style={styles.topActionRow}>
          <View>
            <Text style={styles.sectionTitle}>Student Guidance & Pastoral Care</Text>
            <Text style={styles.sectionSub}>Wellbeing interventions & chronic absenteeism monitoring</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={onOpenCreateModal} activeOpacity={0.8}>
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Log Case</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search student, grade, or counselor notes..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(
            [
              { key: 'all', label: `All Records (${records.length})` },
              { key: 'high_priority', label: '⚠️ Urgent Attention' },
              { key: 'active', label: 'Active' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'resolved', label: 'Resolved' },
            ] as const
          ).map((item) => {
            const active = statusFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(item.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Pastoral Metrics Strip */}
      <View style={styles.metricsStrip}>
        <View style={styles.metricCard}>
          <Text style={styles.metricNumber}>{activeCasesCount}</Text>
          <Text style={styles.metricLabel}>Open Cases</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: '#DC2626' }]}>{attendanceCasesCount}</Text>
          <Text style={styles.metricLabel}>Attendance Alerts</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: '#16A34A' }]}>
            {records.filter((r) => r.parentContacted).length}
          </Text>
          <Text style={styles.metricLabel}>Parents Contacted</Text>
        </View>
      </View>

      {/* Case Logs List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#9D174D']} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredRecords.map((item) => {
          const isResolved = item.status === 'resolved';
          const sevColors = {
            low: { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
            medium: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
            high: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
          }[item.severity];

          return (
            <View key={item.id} style={[styles.card, isResolved && styles.cardResolved]}>
              <View style={styles.cardHeader}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{item.studentName}</Text>
                  <Text style={styles.gradeSection}>{item.gradeSection}</Text>
                </View>

                <View style={[styles.severityBadge, { backgroundColor: sevColors.bg, borderColor: sevColors.border }]}>
                  <Text style={[styles.severityBadgeText, { color: sevColors.text }]}>
                    {item.severity.toUpperCase()} PRIORITY
                  </Text>
                </View>
              </View>

              {/* Concern Category Badge */}
              <View style={styles.domainRow}>
                <View style={styles.domainPill}>
                  <MaterialCommunityIcons name="tag-outline" size={12} color="#9D174D" />
                  <Text style={styles.domainPillText}>
                    {CONCERN_LABELS[item.concernCategory] || item.concernCategory}
                  </Text>
                </View>

                {item.parentContacted ? (
                  <View style={styles.parentPill}>
                    <MaterialCommunityIcons name="account-check" size={12} color="#166534" />
                    <Text style={styles.parentPillText}>Parent Notified</Text>
                  </View>
                ) : (
                  <View style={[styles.parentPill, styles.parentPending]}>
                    <MaterialCommunityIcons name="account-alert" size={12} color="#B45309" />
                    <Text style={[styles.parentPillText, { color: '#B45309' }]}>Parent Pending</Text>
                  </View>
                )}
              </View>

              {/* Action Plan Text */}
              <View style={styles.actionPlanBox}>
                <Text style={styles.actionPlanLabel}>INTERVENTION & PASTORAL NOTES</Text>
                <Text style={styles.actionPlanText}>{item.actionPlan}</Text>
              </View>

              {/* Footer with Counselor & Resolution toggle */}
              <View style={styles.cardFooter}>
                <View style={styles.counselorMeta}>
                  <MaterialCommunityIcons name="account-tie" size={14} color="#6B6B6B" />
                  <Text style={styles.counselorName}>{item.counselorName}</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.statusToggleBtn, isResolved && styles.statusToggleBtnResolved]}
                  onPress={() => onToggleStatus(item.id, item.status)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={isResolved ? 'check-circle' : 'progress-clock'}
                    size={14}
                    color={isResolved ? '#166534' : '#D97706'}
                  />
                  <Text style={[styles.statusToggleText, isResolved && styles.statusToggleTextResolved]}>
                    {isResolved ? 'Resolved' : item.status === 'in_progress' ? 'In Progress' : 'Active Case'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {filteredRecords.length === 0 && (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="heart-pulse" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No guidance records found</Text>
            <Text style={styles.emptySub}>All student pastoral cases are resolved or matching query is clear</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerBlock: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.extrabold,
  },
  sectionSub: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#9D174D',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.button,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#171717',
    fontFamily: FontFamily.regular,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#9D174D',
    borderColor: '#9D174D',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: FontFamily.semibold,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.extrabold,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardResolved: {
    opacity: 0.75,
    backgroundColor: '#F9FAFB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  gradeSection: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
    marginTop: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  domainRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  domainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  domainPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9D174D',
    fontFamily: FontFamily.semibold,
  },
  parentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  parentPending: {
    backgroundColor: '#FEF3C7',
  },
  parentPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
    fontFamily: FontFamily.semibold,
  },
  actionPlanBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  actionPlanLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
  actionPlanText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
    fontFamily: FontFamily.regular,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  counselorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  counselorName: {
    fontSize: 11,
    color: '#4B5563',
    fontFamily: FontFamily.medium,
  },
  dotSeparator: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusToggleBtnResolved: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    fontFamily: FontFamily.bold,
  },
  statusToggleTextResolved: {
    color: '#166534',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  emptySub: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
  },
});
