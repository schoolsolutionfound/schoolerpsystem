import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerProvider, ShimmerSkeleton } from '../../../student/components/ShimmerSkeleton';

const ListRow = () => (
  <View style={styles.rowCard}>
    <ShimmerSkeleton width={40} height={40} borderRadius={20} />
    <View style={styles.rowLines}>
      <ShimmerSkeleton width="58%" height={12} borderRadius={4} />
      <ShimmerSkeleton width="38%" height={9} borderRadius={3} />
    </View>
    <ShimmerSkeleton width={58} height={22} borderRadius={5} />
  </View>
);

const PrincipalDashboardSkeletonBase: React.FC = () => (
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

    <ShimmerSkeleton width="42%" height={13} borderRadius={4} />
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

const PrincipalTabSkeletonBase: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
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

const PrincipalNoticesSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <View style={styles.headerRow}>
      <ShimmerSkeleton width="45%" height={18} borderRadius={4} />
      <ShimmerSkeleton width={96} height={32} borderRadius={16} />
    </View>
    {[0, 1, 2, 3].map((i) => (
      <View key={i} style={styles.noticeCard}>
        <ShimmerSkeleton width="70%" height={13} borderRadius={4} />
        <ShimmerSkeleton width="100%" height={10} borderRadius={3} />
        <ShimmerSkeleton width="100%" height={10} borderRadius={3} />
        <View style={styles.noticeFooter}>
          <ShimmerSkeleton width={70} height={18} borderRadius={9} />
          <ShimmerSkeleton width={54} height={10} borderRadius={3} />
        </View>
      </View>
    ))}
  </View>
);

const PrincipalStaffSkeletonBase: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <View style={styles.page}>
    <ShimmerSkeleton width="55%" height={18} borderRadius={4} />
    <View style={styles.chipRow}>
      {[82, 70, 92, 64].map((w, i) => (
        <ShimmerSkeleton key={i} width={w} height={28} borderRadius={14} />
      ))}
    </View>
    {Array.from({ length: rows }).map((_, i) => (
      <ListRow key={i} />
    ))}
  </View>
);

const PrincipalStudentsSkeletonBase: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <View style={styles.page}>
    <ShimmerSkeleton width="100%" height={40} borderRadius={8} />
    <View style={styles.chipRow}>
      {[76, 64].map((w, i) => (
        <ShimmerSkeleton key={i} width={w} height={26} borderRadius={13} />
      ))}
    </View>
    {Array.from({ length: rows }).map((_, i) => (
      <ListRow key={i} />
    ))}
  </View>
);

export const PrincipalDashboardSkeleton: React.FC = () => (
  <ShimmerProvider>
    <PrincipalDashboardSkeletonBase />
  </ShimmerProvider>
);

export const PrincipalTabSkeleton: React.FC<{ rows?: number }> = (props) => (
  <ShimmerProvider>
    <PrincipalTabSkeletonBase {...props} />
  </ShimmerProvider>
);

export const PrincipalNoticesSkeleton: React.FC = () => (
  <ShimmerProvider>
    <PrincipalNoticesSkeletonBase />
  </ShimmerProvider>
);

export const PrincipalStaffSkeleton: React.FC<{ rows?: number }> = (props) => (
  <ShimmerProvider>
    <PrincipalStaffSkeletonBase {...props} />
  </ShimmerProvider>
);

export const PrincipalStudentsSkeleton: React.FC<{ rows?: number }> = (props) => (
  <ShimmerProvider>
    <PrincipalStudentsSkeletonBase {...props} />
  </ShimmerProvider>
);

export const PrincipalPageSkeleton: React.FC<{ tab?: string }> = ({ tab = 'dashboard' }) => {
  switch (tab) {
    case 'notices':
      return <PrincipalNoticesSkeleton />;
    case 'faculty':
      return <PrincipalStaffSkeleton />;
    case 'homerooms':
      return <PrincipalStudentsSkeleton />;
    case 'dashboard':
      return <PrincipalDashboardSkeleton />;
    default:
      return <PrincipalTabSkeleton />;
  }
};

const styles = StyleSheet.create({
  page: { padding: 16, gap: 14, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
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
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 8,
  },
  noticeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
});
