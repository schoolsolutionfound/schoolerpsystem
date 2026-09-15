import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from '../ShimmerSkeleton';

export const MarksSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.heroBlock}>
        <View style={styles.heroHeader}>
          <ShimmerSkeleton width={36} height={36} borderRadius={8} />
          <View style={{ gap: 6 }}>
            <ShimmerSkeleton width={140} height={16} borderRadius={4} />
            <ShimmerSkeleton width={180} height={10} borderRadius={4} />
          </View>
        </View>
        <View style={styles.statsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.statCell}>
              <ShimmerSkeleton width={50} height={18} borderRadius={4} />
              <ShimmerSkeleton width={40} height={8} borderRadius={3} />
            </View>
          ))}
        </View>
      </View>

      {[0, 1].map((i) => (
        <View key={i} style={styles.examCard}>
          <View style={styles.examHeader}>
            <View style={{ flex: 1, gap: 6 }}>
              <ShimmerSkeleton width="70%" height={14} borderRadius={4} />
              <ShimmerSkeleton width="50%" height={10} borderRadius={4} />
            </View>
            <ShimmerSkeleton width={50} height={26} borderRadius={4} />
          </View>
          <ShimmerSkeleton width="100%" height={6} borderRadius={3} />
          {[0, 1, 2].map((j) => (
            <View key={j} style={styles.subjectRow}>
              <ShimmerSkeleton width="40%" height={12} borderRadius={4} />
              <ShimmerSkeleton width={80} height={12} borderRadius={4} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, paddingBottom: 40, gap: 12 },
  heroBlock: {
    backgroundColor: '#1A1B1C',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2B2C',
    gap: 12,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#232425',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  examCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 10,
  },
  examHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F7F5EE',
    borderRadius: 6,
  },
});
