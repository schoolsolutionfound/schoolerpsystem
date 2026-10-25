import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from '../ShimmerSkeleton';

export const HomeTabSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.gridRow}>
        <View style={styles.attendanceCard}>
          <ShimmerSkeleton width="45%" height={12} borderRadius={4} />
          <View style={styles.metricRow}>
            <ShimmerSkeleton width={64} height={34} borderRadius={6} />
            <ShimmerSkeleton width={44} height={44} borderRadius={22} />
          </View>
          <ShimmerSkeleton width="70%" height={12} borderRadius={4} />
        </View>

        <View style={styles.periodCard}>
          <ShimmerSkeleton width="55%" height={12} borderRadius={4} />
          <View style={styles.metricRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <ShimmerSkeleton width="85%" height={18} borderRadius={4} />
              <ShimmerSkeleton width="60%" height={12} borderRadius={4} />
            </View>
            <ShimmerSkeleton width={44} height={44} borderRadius={22} />
          </View>
        </View>
      </View>

      <View style={styles.announcementCard}>
        <ShimmerSkeleton width={50} height={50} borderRadius={25} />
        <View style={styles.announcementContent}>
          <ShimmerSkeleton width="50%" height={14} borderRadius={4} />
          <ShimmerSkeleton width="90%" height={12} borderRadius={4} />
          <ShimmerSkeleton width="70%" height={10} borderRadius={4} />
        </View>
        <ShimmerSkeleton width={16} height={16} borderRadius={8} />
      </View>

      <View style={styles.periodsSection}>
        <View style={styles.periodsHeader}>
          <ShimmerSkeleton width={22} height={22} borderRadius={6} />
          <ShimmerSkeleton width="40%" height={16} borderRadius={4} />
        </View>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.periodCardRow}>
            <ShimmerSkeleton width={64} height={30} borderRadius={8} />
            <View style={styles.timeWrap}>
              <ShimmerSkeleton width={44} height={14} borderRadius={4} />
              <ShimmerSkeleton width={36} height={12} borderRadius={4} />
            </View>
            <ShimmerSkeleton width={38} height={38} borderRadius={19} />
            <View style={{ flex: 1, gap: 6, marginLeft: 10 }}>
              <ShimmerSkeleton width="75%" height={14} borderRadius={4} />
              <ShimmerSkeleton width="50%" height={12} borderRadius={4} />
            </View>
            <ShimmerSkeleton width={16} height={16} borderRadius={8} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  gridRow: { flexDirection: 'row', gap: 12 },
  attendanceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3EFE8',
    gap: 8,
    minHeight: 126,
    justifyContent: 'space-between',
  },
  periodCard: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8,
    minHeight: 126,
    justifyContent: 'space-between',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3EFE8',
    gap: 14,
    alignItems: 'center',
  },
  announcementContent: { flex: 1, gap: 6 },
  periodsSection: { gap: 10 },
  periodsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  periodCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F3EFE8',
  },
  timeWrap: { width: 58, marginLeft: 12, gap: 4 },
});
