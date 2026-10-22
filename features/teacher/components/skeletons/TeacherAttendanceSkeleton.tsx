import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TeacherShimmerSkeleton } from '../common/TeacherShimmer';

export const TeacherAttendanceSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 1. Header Metrics Skeleton */}
      <View style={styles.metricsCard}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.metricCol}>
            <TeacherShimmerSkeleton width={38} height={20} borderRadius={5} />
            <TeacherShimmerSkeleton width={48} height={10} borderRadius={5} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* 2. Search & Filter Bar Skeleton */}
      <View style={styles.filterRow}>
        <TeacherShimmerSkeleton width="65%" height={38} borderRadius={5} />
        <TeacherShimmerSkeleton width="30%" height={38} borderRadius={5} />
      </View>

      {/* 3. Student Roster Rows Skeleton */}
      <View style={styles.rosterCard}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.studentRow}>
            <TeacherShimmerSkeleton width={36} height={36} borderRadius={18} />
            <View style={styles.studentMeta}>
              <TeacherShimmerSkeleton width={50} height={12} borderRadius={5} />
              <TeacherShimmerSkeleton width="70%" height={14} borderRadius={5} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.statusButtonsRow}>
              <TeacherShimmerSkeleton width={32} height={28} borderRadius={5} />
              <TeacherShimmerSkeleton width={32} height={28} borderRadius={5} />
              <TeacherShimmerSkeleton width={32} height={28} borderRadius={5} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricCol: {
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rosterCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 12,
    gap: 12,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  studentMeta: {
    flex: 1,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
});
