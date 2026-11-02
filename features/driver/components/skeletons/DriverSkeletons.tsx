import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerProvider, ShimmerSkeleton } from '../../../student/components/ShimmerSkeleton';

const DriverTripsSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <View style={styles.heroCard}>
      <View style={styles.heroRow}>
        <View style={{ flex: 1, gap: 8 }}>
          <ShimmerSkeleton width="45%" height={10} borderRadius={3} />
          <ShimmerSkeleton width="70%" height={18} borderRadius={4} />
        </View>
        <ShimmerSkeleton width={90} height={28} borderRadius={14} />
      </View>
      <View style={styles.metricRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.metricTile}>
            <ShimmerSkeleton width={26} height={26} borderRadius={13} />
            <ShimmerSkeleton width="70%" height={9} borderRadius={3} />
            <ShimmerSkeleton width="45%" height={13} borderRadius={3} />
          </View>
        ))}
      </View>
    </View>

    <ShimmerSkeleton width="100%" height={54} borderRadius={12} />

    <View style={styles.card}>
      <View style={styles.heroRow}>
        <ShimmerSkeleton width="40%" height={13} borderRadius={4} />
        <ShimmerSkeleton width={44} height={24} borderRadius={12} />
      </View>
      <View style={styles.metricRow}>
        <ShimmerSkeleton width="30%" height={12} borderRadius={3} />
        <ShimmerSkeleton width="30%" height={12} borderRadius={3} />
      </View>
      <ShimmerSkeleton width="100%" height={44} borderRadius={8} />
    </View>

    <ShimmerSkeleton width="45%" height={13} borderRadius={4} />
    {[0, 1, 2, 3].map((i) => (
      <View key={i} style={styles.stopRow}>
        <ShimmerSkeleton width={14} height={14} borderRadius={7} />
        <View style={styles.stopLines}>
          <ShimmerSkeleton width="60%" height={12} borderRadius={3} />
          <ShimmerSkeleton width="40%" height={9} borderRadius={3} />
        </View>
        <ShimmerSkeleton width={54} height={22} borderRadius={4} />
      </View>
    ))}

    <ShimmerSkeleton width="100%" height={200} borderRadius={12} />
  </View>
);

export const DriverTripsSkeleton: React.FC = () => (
  <ShimmerProvider>
    <DriverTripsSkeletonBase />
  </ShimmerProvider>
);

const styles = StyleSheet.create({
  page: { padding: 16, gap: 14, paddingBottom: 40 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    gap: 14,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  metricRow: { flexDirection: 'row', gap: 10 },
  metricTile: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 12,
  },
  stopRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stopLines: { flex: 1, gap: 6 },
});
