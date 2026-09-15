import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from '../ShimmerSkeleton';

export const TimetableSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.heroBlock}>
        <View style={styles.dateRow}>
          <ShimmerSkeleton width={32} height={32} borderRadius={6} />
          <View style={styles.dateCenter}>
            <ShimmerSkeleton width={120} height={14} borderRadius={4} />
            <ShimmerSkeleton width={80} height={8} borderRadius={3} />
          </View>
          <ShimmerSkeleton width={32} height={32} borderRadius={6} />
        </View>
        <View style={styles.viewRow}>
          <ShimmerSkeleton width={80} height={28} borderRadius={6} />
          <ShimmerSkeleton width={80} height={28} borderRadius={6} />
        </View>
      </View>

      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.slotCard}>
          <ShimmerSkeleton width={64} height={50} borderRadius={8} />
          <View style={styles.slotInfo}>
            <ShimmerSkeleton width="75%" height={13} borderRadius={4} />
            <ShimmerSkeleton width="50%" height={10} borderRadius={4} />
            <ShimmerSkeleton width={60} height={16} borderRadius={4} />
          </View>
          <ShimmerSkeleton width={18} height={18} borderRadius={4} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, gap: 12, backgroundColor: '#FFFEFE' },
  heroBlock: {
    backgroundColor: '#1A1B1C',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2B2C',
    gap: 10,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateCenter: { alignItems: 'center', gap: 4 },
  viewRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotInfo: { flex: 1, gap: 4 },
});
