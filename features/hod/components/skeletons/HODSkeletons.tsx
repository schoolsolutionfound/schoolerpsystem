import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerProvider, ShimmerSkeleton } from '../../../student/components/ShimmerSkeleton';

const ListRow = () => (
  <View style={styles.rowCard}>
    <ShimmerSkeleton width={38} height={38} borderRadius={19} />
    <View style={styles.rowLines}>
      <ShimmerSkeleton width="60%" height={12} borderRadius={4} />
      <ShimmerSkeleton width="40%" height={9} borderRadius={3} />
    </View>
    <ShimmerSkeleton width={54} height={22} borderRadius={5} />
  </View>
);

const HODDashboardSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <View style={styles.headerRow}>
      <View style={{ flex: 1, gap: 8 }}>
        <ShimmerSkeleton width="55%" height={20} borderRadius={5} />
        <ShimmerSkeleton width="35%" height={11} borderRadius={4} />
      </View>
      <ShimmerSkeleton width={44} height={44} borderRadius={22} />
    </View>

    <View style={styles.kpiGrid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.kpiCard}>
          <ShimmerSkeleton width={26} height={26} borderRadius={8} />
          <ShimmerSkeleton width="55%" height={18} borderRadius={4} />
          <ShimmerSkeleton width="70%" height={9} borderRadius={3} />
        </View>
      ))}
    </View>

    <ShimmerSkeleton width="40%" height={13} borderRadius={4} />
    {[0, 1, 2].map((i) => (
      <ListRow key={i} />
    ))}

    <View style={styles.panelRow}>
      {[0, 1].map((i) => (
        <View key={i} style={styles.panelCard}>
          <ShimmerSkeleton width="60%" height={13} borderRadius={4} />
          {[0, 1, 2].map((r) => (
            <View key={r} style={styles.panelRowInner}>
              <ShimmerSkeleton width="55%" height={10} borderRadius={3} />
              <ShimmerSkeleton width="25%" height={10} borderRadius={3} />
            </View>
          ))}
        </View>
      ))}
    </View>
  </View>
);

const HODTabSkeletonBase: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <View style={styles.page}>
    <ShimmerSkeleton width="50%" height={18} borderRadius={4} />
    <ShimmerSkeleton width="100%" height={42} borderRadius={8} />
    <View style={styles.chipRow}>
      {[74, 88, 66].map((w, i) => (
        <ShimmerSkeleton key={i} width={w} height={28} borderRadius={14} />
      ))}
    </View>
    {Array.from({ length: rows }).map((_, i) => (
      <ListRow key={i} />
    ))}
  </View>
);

export const HODDashboardSkeleton: React.FC = () => (
  <ShimmerProvider>
    <HODDashboardSkeletonBase />
  </ShimmerProvider>
);

export const HODTabSkeleton: React.FC<{ rows?: number }> = (props) => (
  <ShimmerProvider>
    <HODTabSkeletonBase {...props} />
  </ShimmerProvider>
);

export const HODPageSkeleton: React.FC<{ tab?: string }> = ({ tab = 'dashboard' }) =>
  tab === 'dashboard' ? <HODDashboardSkeleton /> : <HODTabSkeleton />;

const styles = StyleSheet.create({
  page: { padding: 16, gap: 14, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
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
  panelRow: { flexDirection: 'row', gap: 10 },
  panelCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 12,
  },
  panelRowInner: { flexDirection: 'row', justifyContent: 'space-between' },
});
