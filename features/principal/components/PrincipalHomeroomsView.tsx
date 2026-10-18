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
import { HomeroomSection } from '../types/principal.types';

interface PrincipalHomeroomsViewProps {
  homerooms: HomeroomSection[];
  refreshing: boolean;
  onRefresh: () => void;
  onAssignTeacher: (section: HomeroomSection) => void;
}

type WingFilterType = 'all' | 'primary' | 'middle' | 'secondary' | 'unassigned' | 'unclassified';

function detectWing(sec: HomeroomSection): 'primary' | 'middle' | 'secondary' | 'unclassified' {
  const text = `${sec.grade || ''} ${sec.name || ''}`.toLowerCase();

  // Roman numerals check
  if (/\b(ix|x|xi|xii)\b/.test(text)) return 'secondary';
  if (/\b(vi|vii|viii)\b/.test(text)) return 'middle';
  if (/\b(i|ii|iii|iv|v)\b/.test(text)) return 'primary';

  const digits = (sec.grade || sec.name || '').replace(/[^0-9]/g, '');
  const num = parseInt(digits, 10);
  if (!isNaN(num)) {
    if (num >= 1 && num <= 5) return 'primary';
    if (num >= 6 && num <= 8) return 'middle';
    if (num >= 9 && num <= 12) return 'secondary';
  }
  return 'unclassified';
}

export const PrincipalHomeroomsView: React.FC<PrincipalHomeroomsViewProps> = ({
  homerooms,
  refreshing,
  onRefresh,
  onAssignTeacher,
}) => {
  const [search, setSearch] = useState('');
  const [wingFilter, setWingFilter] = useState<WingFilterType>('all');

  const totalSections = homerooms.length;
  const unassignedCount = homerooms.filter((h) => !h.homeroomTeacherId).length;
  const assignedCount = totalSections - unassignedCount;
  const coveragePct = totalSections > 0 ? Math.round((assignedCount / totalSections) * 100) : 100;

  const filteredHomerooms = homerooms.filter((sec) => {
    const q = search.toLowerCase();
    const matchesSearch =
      sec.name.toLowerCase().includes(q) ||
      (sec.homeroomTeacherName && sec.homeroomTeacherName.toLowerCase().includes(q)) ||
      (sec.roomNumber && sec.roomNumber.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (wingFilter === 'unassigned') return !sec.homeroomTeacherId;
    if (wingFilter === 'all') return true;

    return detectWing(sec) === wingFilter;
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F4C430']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Attendance-Theme Obsidian Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="google-classroom" size={15} color="#F4C430" />
              <Text style={styles.heroBadgeText}>HOMEROOM & CLASS MANAGEMENT</Text>
            </View>
            <View style={styles.coveragePill}>
              <Text style={styles.coveragePillText}>{coveragePct}% Assigned</Text>
            </View>
          </View>

          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>{totalSections}</Text>
              <Text style={styles.heroMetricLabel}>Total Cohorts</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetric}>
              <Text style={[styles.heroMetricValue, { color: '#10B981' }]}>{assignedCount}</Text>
              <Text style={styles.heroMetricLabel}>Staff Assigned</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetric}>
              <Text style={[styles.heroMetricValue, unassignedCount > 0 && { color: '#F4C430' }]}>
                {unassignedCount}
              </Text>
              <Text style={styles.heroMetricLabel}>Unassigned</Text>
            </View>
          </View>

          {/* Coverage Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${coveragePct}%` }]} />
          </View>
        </View>

        {/* Search & Wing Filter Section */}
        <View style={styles.searchBlock}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cohort, teacher, or room..."
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

          {/* Wing Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {(
              [
                { key: 'all' as const, label: `All Sections (${totalSections})` },
                ...(unassignedCount > 0
                  ? [{ key: 'unassigned' as const, label: `⚠️ Unassigned (${unassignedCount})` }]
                  : []),
                { key: 'primary' as const, label: 'Primary (Gr 1-5)' },
                { key: 'middle' as const, label: 'Middle (Gr 6-8)' },
                { key: 'secondary' as const, label: 'Secondary (Gr 9-12)' },
                { key: 'unclassified' as const, label: 'Unclassified' },
              ]
            ).map((item) => {
              const active = wingFilter === item.key;
              const isUnassignedChip = item.key === 'unassigned';
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.filterChip,
                    active && styles.filterChipActive,
                    isUnassignedChip && !active && styles.filterChipWarn,
                    isUnassignedChip && active && styles.filterChipWarnActive,
                  ]}
                  onPress={() => setWingFilter(item.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                      isUnassignedChip && !active && styles.filterChipWarnText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Unassigned Advisory Banner if needed */}
        {unassignedCount > 0 && wingFilter !== 'unassigned' && (
          <TouchableOpacity
            style={styles.advisoryBanner}
            onPress={() => setWingFilter('unassigned')}
            activeOpacity={0.8}
          >
            <View style={styles.advisoryIconWrap}>
              <MaterialCommunityIcons name="alert" size={16} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.advisoryTitle}>Action Required</Text>
              <Text style={styles.advisoryText}>
                {unassignedCount} section{unassignedCount > 1 ? 's do' : ' does'} not have an assigned Homeroom Teacher. Tap to review.
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#D97706" />
          </TouchableOpacity>
        )}

        {/* Cards Roster */}
        <View style={styles.cardsContainer}>
          {filteredHomerooms.map((sec) => {
            const hasTeacher = !!sec.homeroomTeacherId;
            const rate = sec.attendanceRate || 0;
            const isRateGood = rate >= 92;

            return (
              <View key={sec.id} style={styles.card}>
                {/* Responsive Header Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.headerTags}>
                    <View style={styles.gradeBadge}>
                      <Text style={styles.gradeBadgeText}>{sec.name}</Text>
                    </View>
                    <View style={styles.roomBadge}>
                      <MaterialCommunityIcons name="door" size={13} color="#6B6B6B" />
                      <Text style={styles.roomText}>{sec.roomNumber || 'Room N/A'}</Text>
                    </View>
                  </View>

                  {/* Attendance Rate Pill */}
                  <View style={[styles.rateBadge, isRateGood ? styles.rateBadgeGood : styles.rateBadgeLow]}>
                    <MaterialCommunityIcons
                      name={isRateGood ? 'check-circle' : 'alert-circle'}
                      size={13}
                      color={isRateGood ? '#15803D' : '#D97706'}
                    />
                    <Text style={[styles.rateBadgeText, isRateGood ? styles.rateTextGood : styles.rateTextLow]}>
                      {rate.toFixed(1)}% Present
                    </Text>
                  </View>
                </View>

                {/* Class Teacher Info Inset */}
                <View style={[styles.teacherBlock, !hasTeacher && styles.teacherBlockUnassigned]}>
                  <View style={[styles.teacherIconBox, !hasTeacher && styles.teacherIconBoxUnassigned]}>
                    <MaterialCommunityIcons
                      name={hasTeacher ? 'account-tie' : 'account-alert-outline'}
                      size={20}
                      color={hasTeacher ? '#1A1B1C' : '#D97706'}
                    />
                  </View>

                  <View style={styles.teacherMeta}>
                    <Text style={styles.teacherRoleLabel}>HOMEROOM / CLASS TEACHER</Text>
                    <Text style={[styles.teacherName, !hasTeacher && styles.teacherNameMissing]}>
                      {hasTeacher ? sec.homeroomTeacherName : 'Unassigned (Action Required)'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.assignBtn, !hasTeacher && styles.assignBtnUrgent]}
                    onPress={() => onAssignTeacher(sec)}
                    activeOpacity={0.8}
                  >
                    {!hasTeacher && <Feather name="plus" size={13} color="#F4C430" style={{ marginRight: 2 }} />}
                    <Text style={[styles.assignBtnText, !hasTeacher && styles.assignBtnTextUrgent]}>
                      {hasTeacher ? 'Reassign' : 'Assign Teacher'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Cohort Stats Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {sec.presentCount} <Text style={styles.statValueSub}>/ {sec.studentCount}</Text>
                    </Text>
                    <Text style={styles.statLabel}>Students Present</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, !sec.classRepName && styles.statValueEmpty]} numberOfLines={1}>
                      {sec.classRepName || 'Not Appointed'}
                    </Text>
                    <Text style={styles.statLabel}>Class Rep</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <View style={styles.statusPill}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusPillText}>Roll-Call Done</Text>
                    </View>
                    <Text style={styles.statLabel}>Morning Status</Text>
                  </View>
                </View>
              </View>
            );
          })}

          {filteredHomerooms.length === 0 && (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="google-classroom" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No matching classes found</Text>
              <Text style={styles.emptySub}>Adjust search filters to view cohorts</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 40,
  },

  // Obsidian Hero Card (Attendance Style)
  heroCard: {
    backgroundColor: '#1A1B1C',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: BorderRadius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2A2B2D',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#F4C430',
    fontFamily: FontFamily.bold,
  },
  coveragePill: {
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.3)',
  },
  coveragePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F4C430',
    fontFamily: FontFamily.semibold,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroMetric: {
    flex: 1,
    alignItems: 'center',
  },
  heroMetricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFDF7',
    fontFamily: FontFamily.extrabold,
  },
  heroMetricLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#2A2B2D',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#2A2B2D',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F4C430',
    borderRadius: 3,
  },

  // Search & Filters
  searchBlock: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    height: 42,
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
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#1A1B1C',
    borderColor: '#1A1B1C',
  },
  filterChipWarn: {
    backgroundColor: 'rgba(244, 196, 48, 0.12)',
    borderColor: 'rgba(244, 196, 48, 0.4)',
  },
  filterChipWarnActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  filterChipWarnText: {
    color: '#B45309',
    fontWeight: '700',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: FontFamily.semibold,
  },
  filterChipTextActive: {
    color: '#F4C430',
  },

  // Advisory Banner
  advisoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(244, 196, 48, 0.14)',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.35)',
  },
  advisoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    fontFamily: FontFamily.bold,
  },
  advisoryText: {
    fontSize: 11,
    color: '#78350F',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },

  // Cards List
  cardsContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  gradeBadge: {
    backgroundColor: '#1A1B1C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeBadgeText: {
    fontSize: 13,
    color: '#F4C430',
    fontFamily: FontFamily.bold,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roomText: {
    fontSize: 11,
    color: '#4B5563',
    fontFamily: FontFamily.medium,
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rateBadgeGood: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
  },
  rateBadgeLow: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
  },
  rateBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  rateTextGood: {
    color: '#15803D',
  },
  rateTextLow: {
    color: '#B45309',
  },

  // Teacher Inset Box
  teacherBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 10,
    gap: 10,
  },
  teacherBlockUnassigned: {
    backgroundColor: 'rgba(244, 196, 48, 0.06)',
    borderColor: 'rgba(244, 196, 48, 0.3)',
  },
  teacherIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherIconBoxUnassigned: {
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    borderColor: 'rgba(244, 196, 48, 0.4)',
  },
  teacherMeta: {
    flex: 1,
  },
  teacherRoleLabel: {
    fontSize: 9,
    color: '#8A8A8A',
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
  teacherName: {
    fontSize: 13,
    color: '#171717',
    fontFamily: FontFamily.bold,
    marginTop: 1,
  },
  teacherNameMissing: {
    color: '#B45309',
    fontFamily: FontFamily.bold,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  assignBtnUrgent: {
    backgroundColor: '#1A1B1C',
    borderWidth: 1,
    borderColor: '#F4C430',
  },
  assignBtnText: {
    fontSize: 11,
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  assignBtnTextUrgent: {
    color: '#F4C430',
  },

  // Footer Stats
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  statValueSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  statValueEmpty: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  statLabel: {
    fontSize: 10,
    color: '#8A8A8A',
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E8E5DC',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    fontFamily: FontFamily.bold,
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
