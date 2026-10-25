import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TeacherShimmerSkeleton } from '../common/TeacherShimmer';

export const TeacherHomeSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 1. Greeting Skeleton */}
      <TeacherShimmerSkeleton width={180} height={24} borderRadius={5} style={{ marginVertical: 4 }} />

      {/* 2. Today's Time Table Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TeacherShimmerSkeleton width={140} height={16} borderRadius={5} />
          <TeacherShimmerSkeleton width={60} height={14} borderRadius={5} />
        </View>
        <View style={styles.divider} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.periodRow}>
            <View style={styles.periodCol}>
              <TeacherShimmerSkeleton width={38} height={16} borderRadius={5} />
              <TeacherShimmerSkeleton width={42} height={12} borderRadius={5} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.timeCol}>
              <TeacherShimmerSkeleton width={74} height={15} borderRadius={5} />
              <TeacherShimmerSkeleton width={74} height={12} borderRadius={5} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.subjectCol}>
              <TeacherShimmerSkeleton width="80%" height={16} borderRadius={5} />
              <TeacherShimmerSkeleton width="60%" height={12} borderRadius={5} style={{ marginTop: 4 }} />
            </View>
            <TeacherShimmerSkeleton width={62} height={32} borderRadius={5} />
          </View>
        ))}
      </View>

      {/* 3. Progress Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <TeacherShimmerSkeleton width={130} height={16} borderRadius={5} />
            <TeacherShimmerSkeleton width={100} height={12} borderRadius={5} style={{ marginTop: 4 }} />
          </View>
          <TeacherShimmerSkeleton width={48} height={24} borderRadius={5} />
        </View>
        <View style={styles.donutsRow}>
          <View style={styles.donutCol}>
            <TeacherShimmerSkeleton width={110} height={110} borderRadius={55} />
            <TeacherShimmerSkeleton width={70} height={14} borderRadius={5} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.donutCol}>
            <TeacherShimmerSkeleton width={110} height={110} borderRadius={55} />
            <TeacherShimmerSkeleton width={70} height={14} borderRadius={5} style={{ marginTop: 8 }} />
          </View>
        </View>
      </View>

      {/* 4. Weekly Chart Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TeacherShimmerSkeleton width={130} height={16} borderRadius={5} />
          <TeacherShimmerSkeleton width={50} height={20} borderRadius={5} />
        </View>
        <View style={styles.barsRow}>
          {[40, 70, 50, 85, 60].map((h, idx) => (
            <View key={idx} style={styles.barCol}>
              <TeacherShimmerSkeleton width={32} height={h} borderRadius={5} />
              <TeacherShimmerSkeleton width={24} height={10} borderRadius={5} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  periodCol: {
    width: 44,
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E8E5DC',
  },
  timeCol: {
    width: 76,
  },
  subjectCol: {
    flex: 1,
  },
  donutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  donutCol: {
    alignItems: 'center',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: 8,
  },
  barCol: {
    alignItems: 'center',
  },
});
