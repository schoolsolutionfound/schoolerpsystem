import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from '../ShimmerSkeleton';

export const BusTrackingSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.mapArea}>
        <ShimmerSkeleton width={48} height={48} borderRadius={24} />
        <ShimmerSkeleton width={100} height={14} borderRadius={4} />
        <ShimmerSkeleton width={160} height={10} borderRadius={4} />
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.infoTitleRow}>
            <ShimmerSkeleton width={20} height={20} borderRadius={4} />
            <ShimmerSkeleton width={110} height={16} borderRadius={4} />
          </View>
          <ShimmerSkeleton width={50} height={22} borderRadius={6} />
        </View>

        <View style={styles.statsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.statCell}>
              <ShimmerSkeleton width={50} height={18} borderRadius={4} />
              <ShimmerSkeleton width={40} height={8} borderRadius={3} />
            </View>
          ))}
        </View>

        <View style={styles.busInfoRow}>
          <ShimmerSkeleton width={90} height={14} borderRadius={4} />
          <ShimmerSkeleton width={80} height={14} borderRadius={4} />
        </View>

        <ShimmerSkeleton width="100%" height={44} borderRadius={8} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  mapArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderBottomWidth: 0,
    gap: 14,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  busInfoRow: {
    flexDirection: 'row',
    gap: 16,
  },
});
