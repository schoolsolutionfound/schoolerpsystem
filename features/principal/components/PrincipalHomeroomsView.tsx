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
import { HomeroomSection } from '../types/principal.types';

interface PrincipalHomeroomsViewProps {
  homerooms: HomeroomSection[];
  refreshing: boolean;
  onRefresh: () => void;
  onAssignTeacher: (section: HomeroomSection) => void;
}

export const PrincipalHomeroomsView: React.FC<PrincipalHomeroomsViewProps> = ({
  homerooms,
  refreshing,
  onRefresh,
  onAssignTeacher,
}) => {
  const [search, setSearch] = useState('');
  const [wingFilter, setWingFilter] = useState<'all' | 'primary' | 'middle' | 'secondary'>('all');

  const filteredHomerooms = homerooms.filter((sec) => {
    const q = search.toLowerCase();
    const matchesSearch =
      sec.name.toLowerCase().includes(q) ||
      (sec.homeroomTeacherName && sec.homeroomTeacherName.toLowerCase().includes(q)) ||
      (sec.roomNumber && sec.roomNumber.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    const gradeNum = parseInt(sec.grade, 10);
    if (isNaN(gradeNum)) return true;

    if (wingFilter === 'primary') return gradeNum >= 1 && gradeNum <= 5;
    if (wingFilter === 'middle') return gradeNum >= 6 && gradeNum <= 8;
    if (wingFilter === 'secondary') return gradeNum >= 9;
    return true;
  });

  const unassignedCount = homerooms.filter((h) => !h.homeroomTeacherId).length;

  return (
    <View style={styles.container}>
      {/* Top Search & Filter Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search class, class teacher, or room..."
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

        {/* Wing Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(
            [
              { key: 'all', label: `All Sections (${homerooms.length})` },
              { key: 'primary', label: 'Primary (Gr 1-5)' },
              { key: 'middle', label: 'Middle (Gr 6-8)' },
              { key: 'secondary', label: 'Secondary (Gr 9-12)' },
            ] as const
          ).map((item) => {
            const active = wingFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setWingFilter(item.key)}
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

      {/* Unassigned Warning Strip */}
      {unassignedCount > 0 && (
        <View style={styles.warnStrip}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#B45309" />
          <Text style={styles.warnStripText}>
            {unassignedCount} section{unassignedCount > 1 ? 's do' : ' does'} not have an assigned Homeroom Teacher.
          </Text>
        </View>
      )}

      {/* Section Cards List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284C7']} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredHomerooms.map((sec) => {
          const hasTeacher = !!sec.homeroomTeacherId;
          const rate = sec.attendanceRate || 0;
          const isRateGood = rate >= 92;

          return (
            <View key={sec.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={styles.gradeBadge}>
                    <Text style={styles.gradeBadgeText}>{sec.name}</Text>
                  </View>
                  <Text style={styles.roomText}>{sec.roomNumber || 'Room N/A'}</Text>
                </View>

                {/* Live Attendance Tag */}
                <View style={[styles.rateBadge, isRateGood ? styles.rateBadgeGood : styles.rateBadgeLow]}>
                  <MaterialCommunityIcons
                    name={isRateGood ? 'check-circle' : 'alert-circle'}
                    size={13}
                    color={isRateGood ? '#166534' : '#991B1B'}
                  />
                  <Text style={[styles.rateBadgeText, isRateGood ? styles.rateTextGood : styles.rateTextLow]}>
                    {rate.toFixed(1)}% Attendance
                  </Text>
                </View>
              </View>

              {/* Class Teacher Info */}
              <View style={styles.teacherBlock}>
                <View style={styles.teacherIconBox}>
                  <MaterialCommunityIcons
                    name={hasTeacher ? 'account-tie' : 'account-question'}
                    size={22}
                    color={hasTeacher ? '#0284C7' : '#EF4444'}
                  />
                </View>
                <View style={styles.teacherMeta}>
                  <Text style={styles.teacherRoleLabel}>CLASS / HOMEROOM TEACHER</Text>
                  <Text style={[styles.teacherName, !hasTeacher && styles.teacherNameMissing]}>
                    {hasTeacher ? sec.homeroomTeacherName : 'Unassigned (Needs Action)'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.assignBtn, !hasTeacher && styles.assignBtnUrgent]}
                  onPress={() => onAssignTeacher(sec)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.assignBtnText, !hasTeacher && styles.assignBtnTextUrgent]}>
                    {hasTeacher ? 'Reassign' : 'Assign Teacher'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Cohort Stats Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {sec.presentCount} / {sec.studentCount}
                  </Text>
                  <Text style={styles.statLabel}>Students Present</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{sec.classRepName || 'Not Appointed'}</Text>
                  <Text style={styles.statLabel}>Class Representative</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.statItem}>
                  <Text style={styles.statValue}>Roll-Call Done</Text>
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
            <Text style={styles.emptySub}>Adjust search filters to view classes</Text>
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
  searchBarWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
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
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
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
  warnStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  warnStripText: {
    fontSize: 12,
    color: '#B45309',
    fontFamily: FontFamily.medium,
    flex: 1,
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
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gradeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  gradeBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3730A3',
    fontFamily: FontFamily.extrabold,
  },
  roomText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  rateBadgeGood: {
    backgroundColor: '#DCFCE7',
  },
  rateBadgeLow: {
    backgroundColor: '#FEE2E2',
  },
  rateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rateTextGood: {
    color: '#166534',
  },
  rateTextLow: {
    color: '#991B1B',
  },
  teacherBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.card,
    padding: 10,
    gap: 10,
  },
  teacherIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherMeta: {
    flex: 1,
  },
  teacherRoleLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
  teacherName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
    marginTop: 1,
  },
  teacherNameMissing: {
    color: '#DC2626',
  },
  assignBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  assignBtnUrgent: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  assignBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  assignBtnTextUrgent: {
    color: '#FFFFFF',
  },
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
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#F3F4F6',
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
