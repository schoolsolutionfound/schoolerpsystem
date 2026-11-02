import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerProvider, ShimmerSkeleton } from '../../../student/components/ShimmerSkeleton';

const ListRow = () => (
  <View style={styles.rowCard}>
    <ShimmerSkeleton width={44} height={44} borderRadius={12} />
    <View style={styles.rowLines}>
      <ShimmerSkeleton width="55%" height={13} borderRadius={4} />
      <ShimmerSkeleton width="75%" height={10} borderRadius={3} />
      <ShimmerSkeleton width="35%" height={9} borderRadius={3} />
    </View>
    <ShimmerSkeleton width={60} height={24} borderRadius={5} />
  </View>
);

const DeveloperDashboardSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <ShimmerSkeleton width="100%" height={92} borderRadius={12} />
    <View style={styles.statsRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.statCard}>
          <ShimmerSkeleton width={34} height={34} borderRadius={17} />
          <ShimmerSkeleton width="55%" height={16} borderRadius={4} />
          <ShimmerSkeleton width="80%" height={9} borderRadius={3} />
        </View>
      ))}
    </View>
    <ShimmerSkeleton width="45%" height={13} borderRadius={4} />
    {[0, 1, 2].map((i) => (
      <ListRow key={i} />
    ))}
    <ShimmerSkeleton width="40%" height={13} borderRadius={4} />
    {[0, 1, 2].map((i) => (
      <ListRow key={`a${i}`} />
    ))}
  </View>
);

export const DeveloperDashboardSkeleton: React.FC = () => (
  <ShimmerProvider>
    <DeveloperDashboardSkeletonBase />
  </ShimmerProvider>
);

const DeveloperListSkeletonBase: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <View style={styles.page}>
    <View style={styles.headerRow}>
      <ShimmerSkeleton width="45%" height={18} borderRadius={4} />
      <ShimmerSkeleton width={90} height={34} borderRadius={17} />
    </View>
    <ShimmerSkeleton width="100%" height={44} borderRadius={8} />
    <View style={styles.chipRow}>
      {[72, 86, 64].map((w, i) => (
        <ShimmerSkeleton key={i} width={w} height={28} borderRadius={14} />
      ))}
    </View>
    {Array.from({ length: rows }).map((_, i) => (
      <ListRow key={i} />
    ))}
  </View>
);

export const DeveloperListSkeleton: React.FC<{ rows?: number }> = (props) => (
  <ShimmerProvider>
    <DeveloperListSkeletonBase {...props} />
  </ShimmerProvider>
);

const DeveloperDetailSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <View style={styles.headerRow}>
      <ShimmerSkeleton width={36} height={36} borderRadius={18} />
      <ShimmerSkeleton width="55%" height={18} borderRadius={4} />
    </View>
    <View style={styles.panelCard}>
      <View style={styles.headerRow}>
        <ShimmerSkeleton width={54} height={54} borderRadius={14} />
        <View style={{ flex: 1, gap: 8 }}>
          <ShimmerSkeleton width="65%" height={15} borderRadius={4} />
          <ShimmerSkeleton width="45%" height={10} borderRadius={3} />
        </View>
        <ShimmerSkeleton width={64} height={24} borderRadius={5} />
      </View>
      {[0, 1, 2, 3].map((r) => (
        <View key={r} style={styles.detailRow}>
          <ShimmerSkeleton width="35%" height={10} borderRadius={3} />
          <ShimmerSkeleton width="50%" height={10} borderRadius={3} />
        </View>
      ))}
    </View>
    <View style={styles.panelCard}>
      <ShimmerSkeleton width="40%" height={13} borderRadius={4} />
      {[0, 1, 2].map((r) => (
        <View key={r} style={styles.detailRow}>
          <ShimmerSkeleton width="45%" height={10} borderRadius={3} />
          <ShimmerSkeleton width="30%" height={10} borderRadius={3} />
        </View>
      ))}
    </View>
  </View>
);

export const DeveloperDetailSkeleton: React.FC = () => (
  <ShimmerProvider>
    <DeveloperDetailSkeletonBase />
  </ShimmerProvider>
);

const styles = StyleSheet.create({
  page: { padding: 16, gap: 14, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    gap: 8,
  },
  rowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLines: { flex: 1, gap: 6 },
  chipRow: { flexDirection: 'row', gap: 8 },
  panelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 12,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
