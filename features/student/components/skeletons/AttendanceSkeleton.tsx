import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from '../ShimmerSkeleton';

export const AttendanceSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={{ gap: 6, marginBottom: 4 }}>
        <ShimmerSkeleton width={150} height={22} borderRadius={4} />
        <ShimmerSkeleton width="85%" height={12} borderRadius={4} />
      </View>

      {/* Term Selector */}
      <View style={styles.termSelector}>
        <ShimmerSkeleton width="65%" height={14} borderRadius={4} />
        <ShimmerSkeleton width={18} height={18} borderRadius={9} />
      </View>

      {/* Overall Card */}
      <View style={styles.overallCard}>
        <View style={styles.overallLeft}>
          <ShimmerSkeleton width={120} height={12} borderRadius={4} />
          <ShimmerSkeleton width={95} height={28} borderRadius={6} />
          <ShimmerSkeleton width={140} height={11} borderRadius={4} />
        </View>
        <ShimmerSkeleton width={76} height={76} borderRadius={38} />
      </View>

      {/* Toggle Row */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleBtn}>
          <ShimmerSkeleton width="70%" height={14} borderRadius={4} />
        </View>
        <View style={styles.toggleBtn}>
          <ShimmerSkeleton width="70%" height={14} borderRadius={4} />
        </View>
      </View>

      {/* Subject Cards */}
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.subjectCard}>
          <View style={styles.subjectLeft}>
            <ShimmerSkeleton width={45} height={10} borderRadius={3} />
            <ShimmerSkeleton width={130} height={14} borderRadius={4} />
            <ShimmerSkeleton width={90} height={11} borderRadius={3} />
          </View>
          <View style={styles.subjectRight}>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <ShimmerSkeleton width={42} height={14} borderRadius={4} />
              <ShimmerSkeleton width={70} height={5} borderRadius={3} />
            </View>
            <ShimmerSkeleton width={16} height={16} borderRadius={8} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    backgroundColor: '#FAF8F5',
    gap: 12,
  },
  termSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  overallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  overallLeft: {
    flex: 1,
    gap: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    height: 42,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectLeft: {
    flex: 1,
    gap: 4,
  },
  subjectRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
