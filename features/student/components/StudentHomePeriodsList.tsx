import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { ShimmerSkeleton } from './ShimmerSkeleton';

interface StudentHomePeriodsListProps {
  loading?: boolean;
  slots?: any[];
  onSchedulePress?: () => void;
  onPeriodPress?: (slot: any) => void;
}

function formatRoom(room?: string, teacher?: string): string {
  if (room) {
    const clean = room.trim();
    if (clean.toLowerCase().startsWith('room')) {
      return clean.replace(/^(room\s*)+/i, 'Room ');
    }
    return `Room ${clean}`;
  }
  return teacher ? teacher : 'Room 100';
}

function periodLabel(slot: any, index: number): string {
  if (slot?.period?.label) return slot.period.label;
  return `Period ${index + 1}`;
}

export const StudentHomePeriodsList: React.FC<StudentHomePeriodsListProps> = ({
  loading,
  slots = [],
  onSchedulePress,
  onPeriodPress,
}) => {
  return (
    <View style={styles.periodsSection}>
      <TouchableOpacity
        style={styles.sectionHeaderRow}
        onPress={onSchedulePress}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeaderLeft}>
          
          <Text style={styles.sectionHeaderTitle}>Today&apos;s Periods</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#111827" />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.periodCard}>
              <View style={styles.periodCol}>
                <ShimmerSkeleton width={56} height={16} borderRadius={4} />
              </View>
              <View style={styles.timeWrap}>
                <ShimmerSkeleton width={44} height={14} borderRadius={4} />
                <ShimmerSkeleton width={36} height={12} borderRadius={4} />
              </View>
              <View style={[styles.subjectWrap, { gap: 6 }]}>
                <ShimmerSkeleton width="75%" height={14} borderRadius={4} />
                <ShimmerSkeleton width="50%" height={12} borderRadius={4} />
              </View>
              <ShimmerSkeleton width={16} height={16} borderRadius={8} />
            </View>
          ))}
        </View>
      ) : slots.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyCard}
          activeOpacity={0.8}
          onPress={onSchedulePress}
        >
          <View style={styles.emptyIconCircle}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={30} color="#211e1cff" />
          </View>
          <Text style={styles.emptyTitle}>No classes scheduled for today</Text>
          <Text style={styles.emptySub}>Tap here to view your complete weekly timetable &amp; schedule.</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.periodsList}>
          {slots.map((slot, i) => {
            const startTime = slot?.period?.startTime || '09:00';
            const endTime = slot?.period?.endTime || '10:00';
            const subjectName = slot?.subject?.name || 'Class';
            const roomText = formatRoom(slot?.room, slot?.teacher?.fullName);

            return (
              <TouchableOpacity
                key={slot.id || i}
                style={styles.periodCard}
                activeOpacity={0.7}
                onPress={() => (onPeriodPress ? onPeriodPress(slot) : onSchedulePress?.())}
              >
                <View style={styles.periodCol}>
                  <Text style={styles.periodBadgeText} numberOfLines={1}>
                    {periodLabel(slot, i)}
                  </Text>
                </View>

                <View style={styles.timeWrap}>
                  <Text style={styles.timeStart}>{startTime}</Text>
                  <Text style={styles.timeEnd}>{endTime}</Text>
                </View>

                <View style={styles.subjectWrap}>
                  <Text style={styles.subjectName} numberOfLines={1}>
                    {subjectName}
                  </Text>
                  <Text style={styles.roomText} numberOfLines={1}>
                    {roomText}
                  </Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  periodsSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  skeletonList: {
    gap: 10,
  },
  periodsList: {
    gap: 10,
  },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
    borderWidth: 1,
    borderColor: '#F3EFE8',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  periodCol: {
    width: 62,
    justifyContent: 'center',
  },
  periodBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#111827',
  },
  timeWrap: {
    width: 54,
    justifyContent: 'center',
  },
  timeStart: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  timeEnd: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1,
  },
  subjectWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  subjectName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  roomText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3EFE8',
    gap: 8,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
