import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ShimmerProvider, ShimmerSkeleton } from '../../student/components/ShimmerSkeleton';

const BusTrackingSkeletonBase: React.FC = () => (
  <View style={styles.root}>
    <ShimmerSkeleton width="100%" height={300} borderRadius={16} />

    <View style={styles.infoCard}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <ShimmerSkeleton width={20} height={20} borderRadius={10} />
          <ShimmerSkeleton width={92} height={16} borderRadius={4} />
        </View>
        <ShimmerSkeleton width={68} height={24} borderRadius={5} />
      </View>

      <View style={styles.statsRow}>
        {[0, 1, 2].map((i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={styles.statDivider} />}
            <View style={styles.statCell}>
              <ShimmerSkeleton width="70%" height={15} borderRadius={4} />
              <ShimmerSkeleton width="55%" height={9} borderRadius={3} />
            </View>
          </React.Fragment>
        ))}
      </View>

      <View style={styles.busInfoRow}>
        <ShimmerSkeleton width={120} height={12} borderRadius={3} />
        <ShimmerSkeleton width={140} height={12} borderRadius={3} />
      </View>

      <ShimmerSkeleton width="100%" height={44} borderRadius={5} />
    </View>
  </View>
);

export const BusTrackingSkeleton: React.FC = () => (
  <ShimmerProvider>
    <BusTrackingSkeletonBase />
  </ShimmerProvider>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF8F5', padding: 12, gap: 12 },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 5,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4 },
  statDivider: { width: 1, backgroundColor: '#E8E5DC', marginVertical: 4 },
  busInfoRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
});
