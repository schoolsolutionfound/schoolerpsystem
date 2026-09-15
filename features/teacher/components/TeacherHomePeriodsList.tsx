import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { ShimmerSkeleton } from '../../student/components/ShimmerSkeleton';

interface TeacherHomePeriodsListProps {
  loading?: boolean;
  slots?: any[];
  onMarkAttendance?: (slotId: string, subjectName: string) => void;
}

function toMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const suffix = (m[3] || '').toUpperCase();
  if (suffix === 'PM' && h < 12) h += 12;
  if (suffix === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

function isNowWithin(start?: string, end?: string): boolean {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s === null || e === null) return false;
  return nowMin >= s && nowMin < e;
}

function periodLabel(slot: any, index: number): string {
  const label = slot?.period?.label;
  if (label) return label;
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  return ordinals[index] || `${index + 1}th`;
}

export const TeacherHomePeriodsList: React.FC<TeacherHomePeriodsListProps> = ({
  loading,
  slots = [],
  onMarkAttendance,
}) => {
  return (
    <View style={styles.periodsSection}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionIconWrap}>
          <MaterialCommunityIcons name="calendar-month-outline" size={16} color="#1A1B1C" />
        </View>
        <Text style={styles.sectionHeaderTitle}>Today&apos;s Periods</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{slots.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.periodsListCard}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.periodRow}>
              <ShimmerSkeleton width={44} height={28} borderRadius={6} />
              <ShimmerSkeleton width={60} height={24} borderRadius={6} />
              <View style={{ flex: 1, gap: 6 }}>
                <ShimmerSkeleton width="80%" height={12} borderRadius={4} />
                <ShimmerSkeleton width="50%" height={10} borderRadius={4} />
              </View>
              <ShimmerSkeleton width={52} height={28} borderRadius={6} />
            </View>
          ))}
        </View>
      ) : slots.length === 0 ? (
        <View style={styles.periodsListCard}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={28} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No classes today</Text>
            <Text style={styles.emptySub}>Your schedule will appear here.</Text>
          </View>
        </View>
      ) : (
        <View style={styles.periodsListCard}>
          {slots.map((slot, i) => {
            const active = isNowWithin(slot?.period?.startTime, slot?.period?.endTime);
            return (
              <View key={slot.id || i}>
                {i > 0 && <View style={styles.divider} />}
                <View style={[styles.periodRow, active && styles.activePeriodRow]}>
                  <View style={[styles.periodBadge, active && styles.activePeriodBadge]}>
                    <Text style={[styles.periodBadgeNum, active && styles.periodBadgeNumActive]}>
                      {periodLabel(slot, i)}
                    </Text>
                  </View>
                  <View style={styles.timeWrap}>
                    <Text style={[styles.timeText, active && styles.timeTextActive]}>
                      {slot?.period?.startTime || ''}
                    </Text>
                    <Text style={styles.timeSubText}>{slot?.period?.endTime || ''}</Text>
                  </View>
                  <View style={styles.iconSubjectWrap}>
                    <View style={[styles.subjectIconCircle, active && styles.subjectIconCircleActive]}>
                      <MaterialCommunityIcons
                        name="book-open-page-variant-outline"
                        size={18}
                        color="#1A1B1C"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectName}>{slot?.subject?.name || 'Subject'}</Text>
                      <Text style={styles.roomName}>
                        {slot?.classSectionName || 'Class'}
                        {slot?.room ? ` · Room ${slot.room}` : ''}
                      </Text>
                    </View>
                  </View>
                  {onMarkAttendance ? (
                    <TouchableOpacity
                      style={styles.markBtn}
                      onPress={() => onMarkAttendance(slot.id, slot?.subject?.name || 'Subject')}
                    >
                      <MaterialCommunityIcons name="check-circle-outline" size={14} color="#FFFFFF" />
                      <Text style={styles.markBtnText}>Mark</Text>
                    </TouchableOpacity>
                  ) : active ? (
                    <View style={styles.nowChip}>
                      <Text style={styles.nowChipText}>Now</Text>
                    </View>
                  ) : (
                    <View style={{ width: 52 }} />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  periodsSection: { gap: 10 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderTitle: { flex: 1, fontSize: 15, fontFamily: FontFamily.extrabold, color: '#171717' },
  countBadge: {
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countBadgeText: { fontSize: 11, fontWeight: '700', color: '#D4A418' },
  periodsListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  activePeriodRow: { backgroundColor: '#FFF4C7' },
  periodBadge: {
    width: 52,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#1A1B1C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePeriodBadge: {
    backgroundColor: '#F4C430',
  },
  periodBadgeNum: { fontSize: 9, fontFamily: FontFamily.extrabold, color: '#F4C430' },
  periodBadgeNumActive: { color: '#FFFFFF' },
  timeWrap: { width: 70 },
  timeText: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#171717' },
  timeTextActive: { color: '#F4C430' },
  timeSubText: { fontSize: 10, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  iconSubjectWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  subjectIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectIconCircleActive: {
    backgroundColor: '#F4C430',
  },
  subjectName: { fontSize: 13, fontFamily: FontFamily.semibold, color: '#171717' },
  roomName: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  markBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.chip,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  nowChip: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.chip,
  },
  nowChipText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  divider: { height: 1, backgroundColor: '#FFFEFE' },
  emptyCard: { padding: 24, alignItems: 'center', gap: 6 },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFDF7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#171717' },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', lineHeight: 16 },
});
