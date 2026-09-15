import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from '../ShimmerSkeleton';
import { BorderRadius } from '../../../../constants/theme';

export const HomeTabSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.gridRow}>
        <View style={[styles.gridCard, styles.attendanceCard]}>
          <ShimmerSkeleton width="50%" height={12} borderRadius={4} />
          <View style={styles.metricRow}>
            <ShimmerSkeleton width={60} height={32} borderRadius={4} />
            <ShimmerSkeleton width={40} height={40} borderRadius={20} />
          </View>
          <ShimmerSkeleton width="70%" height={10} borderRadius={4} />
        </View>
        <View style={[styles.gridCard, styles.periodCard]}>
          <ShimmerSkeleton width="60%" height={12} borderRadius={4} />
          <ShimmerSkeleton width="80%" height={18} borderRadius={4} />
          <ShimmerSkeleton width="50%" height={10} borderRadius={4} />
        </View>
      </View>

      <View style={styles.announcementCard}>
        <ShimmerSkeleton width={42} height={42} borderRadius={21} />
        <View style={styles.announcementContent}>
          <ShimmerSkeleton width="60%" height={12} borderRadius={4} />
          <ShimmerSkeleton width="90%" height={10} borderRadius={4} />
          <ShimmerSkeleton width="70%" height={10} borderRadius={4} />
        </View>
      </View>

      <View style={styles.periodsCard}>
        <View style={styles.periodsHeader}>
          <ShimmerSkeleton width={20} height={20} borderRadius={10} />
          <ShimmerSkeleton width="40%" height={14} borderRadius={4} />
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.periodRow}>
            <ShimmerSkeleton width={52} height={30} borderRadius={6} />
            <ShimmerSkeleton width={70} height={28} borderRadius={6} />
            <View style={styles.periodInfo}>
              <ShimmerSkeleton width="80%" height={12} borderRadius={4} />
              <ShimmerSkeleton width="50%" height={10} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  gridRow: { flexDirection: 'row', gap: 12 },
  gridCard: {
    flex: 1,
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  attendanceCard: { backgroundColor: '#1A1B1C', borderColor: '#2A2B2C' },
  periodCard: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
    alignItems: 'flex-start',
  },
  announcementContent: { flex: 1, gap: 6 },
  periodsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  periodsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFFEFE',
  },
  periodInfo: { flex: 1, gap: 6 },
});
