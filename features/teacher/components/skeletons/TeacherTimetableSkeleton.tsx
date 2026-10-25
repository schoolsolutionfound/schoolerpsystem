import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TeacherShimmerSkeleton } from '../common/TeacherShimmer';

export const TeacherTimetableSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 1. Date Strip Carousel Skeleton */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeaderRow}>
          <TeacherShimmerSkeleton width={140} height={18} borderRadius={5} />
          <View style={styles.navRow}>
            <TeacherShimmerSkeleton width={32} height={32} borderRadius={5} />
            <TeacherShimmerSkeleton width={32} height={32} borderRadius={5} />
          </View>
        </View>

        <View style={styles.daysRow}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.dayCol}>
              <TeacherShimmerSkeleton width={38} height={52} borderRadius={5} />
            </View>
          ))}
        </View>
      </View>

      {/* 2. Schedule Periods List Skeleton */}
      <View style={styles.periodsList}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.periodCard}>
            <View style={styles.periodLeft}>
              <TeacherShimmerSkeleton width={68} height={20} borderRadius={5} />
              <TeacherShimmerSkeleton width={80} height={12} borderRadius={5} style={{ marginTop: 6 }} />
            </View>

            <View style={styles.divider} />

            <View style={styles.periodCenter}>
              <TeacherShimmerSkeleton width="75%" height={16} borderRadius={5} />
              <TeacherShimmerSkeleton width="50%" height={12} borderRadius={5} style={{ marginTop: 6 }} />
            </View>

            <TeacherShimmerSkeleton width={64} height={32} borderRadius={5} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 14,
    gap: 12,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navRow: {
    flexDirection: 'row',
    gap: 6,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
  },
  periodsList: {
    gap: 10,
  },
  periodCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  periodLeft: {
    width: 80,
  },
  divider: {
    width: 1,
    height: 38,
    backgroundColor: '#E8E5DC',
  },
  periodCenter: {
    flex: 1,
  },
});
