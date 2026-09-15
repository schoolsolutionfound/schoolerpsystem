import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from '../ShimmerSkeleton';

export const AttendanceSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.overallCard}>
        <View style={styles.overallLeft}>
          <ShimmerSkeleton width={70} height={70} borderRadius={35} />
        </View>
        <View style={styles.overallRight}>
          <ShimmerSkeleton width="60%" height={12} borderRadius={4} />
          <ShimmerSkeleton width="40%" height={10} borderRadius={4} />
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <ShimmerSkeleton width={30} height={18} borderRadius={4} />
              <ShimmerSkeleton width={40} height={8} borderRadius={3} />
            </View>
            <View style={styles.statItem}>
              <ShimmerSkeleton width={30} height={18} borderRadius={4} />
              <ShimmerSkeleton width={50} height={8} borderRadius={3} />
            </View>
          </View>
        </View>
      </View>

      <ShimmerSkeleton width="30%" height={10} borderRadius={3} style={{ marginTop: 8, paddingHorizontal: 4 }} />

      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.subjectCard}>
          <View style={styles.subjectHeader}>
            <ShimmerSkeleton width="55%" height={13} borderRadius={4} />
            <ShimmerSkeleton width={40} height={13} borderRadius={4} />
          </View>
          <ShimmerSkeleton width="100%" height={6} borderRadius={3} />
          <ShimmerSkeleton width="40%" height={10} borderRadius={4} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, paddingBottom: 40, gap: 12 },
  overallCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: 10,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  overallLeft: { alignItems: 'center' },
  overallRight: { flex: 1, gap: 6, marginLeft: 16 },
  statRow: { flexDirection: 'row', gap: 18, marginTop: 6 },
  statItem: { alignItems: 'center', gap: 4 },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 10,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
