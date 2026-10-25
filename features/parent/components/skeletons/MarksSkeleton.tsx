import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from '../ShimmerSkeleton';

export const MarksSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Top Header Row Skeleton */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <ShimmerSkeleton width={28} height={28} borderRadius={14} />
          <ShimmerSkeleton width={80} height={22} borderRadius={5} />
        </View>
        <ShimmerSkeleton width={110} height={32} borderRadius={5} />
      </View>

      {/* Top 3-Metric Summary Card Skeleton */}
      <View style={styles.topSummaryCard}>
        <View style={styles.summaryCell}>
          <ShimmerSkeleton width={70} height={10} borderRadius={5} />
          <ShimmerSkeleton width={30} height={18} borderRadius={5} />
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCell}>
          <ShimmerSkeleton width={65} height={10} borderRadius={5} />
          <ShimmerSkeleton width={85} height={18} borderRadius={5} />
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCell}>
          <ShimmerSkeleton width={50} height={10} borderRadius={5} />
          <ShimmerSkeleton width={45} height={18} borderRadius={5} />
        </View>
      </View>

      {/* Exams Section Header Row Skeleton */}
      <View style={styles.examsHeaderRow}>
        <ShimmerSkeleton width={60} height={20} borderRadius={5} />
      </View>

      {/* Exam Cards Skeleton List */}
      <View style={{ gap: 10 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.examCard}>
            <View style={{ gap: 6, flex: 1 }}>
              <ShimmerSkeleton width={100 + (i % 3) * 20} height={16} borderRadius={5} />
              <ShimmerSkeleton width={80} height={12} borderRadius={5} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <ShimmerSkeleton width={60} height={14} borderRadius={5} />
                <ShimmerSkeleton width={40} height={12} borderRadius={5} />
              </View>
              <ShimmerSkeleton width={16} height={16} borderRadius={8} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#F6EEDB',
    borderRadius: 5,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#EFE7D8',
  },
  examsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7D8',
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
