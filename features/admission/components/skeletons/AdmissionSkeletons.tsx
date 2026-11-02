import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerProvider, ShimmerSkeleton } from '../../../student/components/ShimmerSkeleton';

const StudentRow = () => (
  <View style={styles.card}>
    <ShimmerSkeleton width={44} height={44} borderRadius={22} />
    <View style={styles.cardLines}>
      <ShimmerSkeleton width="55%" height={13} borderRadius={4} />
      <ShimmerSkeleton width="75%" height={10} borderRadius={3} />
      <ShimmerSkeleton width="40%" height={9} borderRadius={3} />
    </View>
    <ShimmerSkeleton width={62} height={26} borderRadius={5} />
  </View>
);

const AdmissionStudentsSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <View style={styles.segmentRow}>
      {[110, 100, 90].map((w, i) => (
        <ShimmerSkeleton key={i} width={w} height={34} borderRadius={17} />
      ))}
    </View>
    <View style={styles.searchBox}>
      <ShimmerSkeleton width="55%" height={13} borderRadius={4} />
    </View>
    <View style={styles.chipRow}>
      {[70, 85, 60].map((w, i) => (
        <ShimmerSkeleton key={i} width={w} height={28} borderRadius={14} />
      ))}
    </View>
    <ShimmerSkeleton width="40%" height={11} borderRadius={3} />
    {[0, 1, 2, 3, 4].map((i) => (
      <StudentRow key={i} />
    ))}
  </View>
);

export const AdmissionStudentsSkeleton: React.FC = () => (
  <ShimmerProvider>
    <AdmissionStudentsSkeletonBase />
  </ShimmerProvider>
);

const AdmissionSeatMatrixSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <ShimmerSkeleton width={90} height={9} borderRadius={3} />
    <View style={styles.chipRow}>
      {[92, 92, 92].map((w, i) => (
        <ShimmerSkeleton key={i} width={w} height={30} borderRadius={15} />
      ))}
    </View>
    <View style={styles.overviewCard}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.overviewCell}>
          <ShimmerSkeleton width={34} height={18} borderRadius={4} />
          <ShimmerSkeleton width={48} height={9} borderRadius={3} />
        </View>
      ))}
    </View>
    <ShimmerSkeleton width={180} height={11} borderRadius={3} />
    {[0, 1, 2].map((i) => (
      <View key={i} style={styles.branchCard}>
        <View style={styles.branchHeader}>
          <View style={{ flex: 1, gap: 6 }}>
            <ShimmerSkeleton width="60%" height={14} borderRadius={4} />
            <ShimmerSkeleton width="40%" height={10} borderRadius={3} />
          </View>
          <ShimmerSkeleton width={64} height={26} borderRadius={5} />
        </View>
        {[0, 1, 2].map((r) => (
          <View key={r} style={styles.quotaRow}>
            <ShimmerSkeleton width="35%" height={10} borderRadius={3} />
            <ShimmerSkeleton width="20%" height={10} borderRadius={3} />
            <ShimmerSkeleton width="20%" height={10} borderRadius={3} />
          </View>
        ))}
      </View>
    ))}
  </View>
);

export const AdmissionSeatMatrixSkeleton: React.FC = () => (
  <ShimmerProvider>
    <AdmissionSeatMatrixSkeletonBase />
  </ShimmerProvider>
);

const AdmissionLiveTrackingSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <View style={styles.chipRow}>
      {[96, 96, 96].map((w, i) => (
        <ShimmerSkeleton key={i} width={w} height={32} borderRadius={16} />
      ))}
    </View>
    <ShimmerSkeleton width="100%" height={300} borderRadius={12} />
    <View style={styles.infoCard}>
      <View style={styles.branchHeader}>
        <ShimmerSkeleton width="45%" height={14} borderRadius={4} />
        <ShimmerSkeleton width={60} height={22} borderRadius={11} />
      </View>
      <ShimmerSkeleton width="70%" height={11} borderRadius={3} />
      <ShimmerSkeleton width="55%" height={11} borderRadius={3} />
    </View>
    {[0, 1, 2].map((i) => (
      <StudentRow key={i} />
    ))}
  </View>
);

export const AdmissionLiveTrackingSkeleton: React.FC = () => (
  <ShimmerProvider>
    <AdmissionLiveTrackingSkeletonBase />
  </ShimmerProvider>
);

export const AdmissionPageSkeleton: React.FC<{
  variant: 'students' | 'seats' | 'live';
}> = ({ variant }) => {
  if (variant === 'students') return <AdmissionStudentsSkeleton />;
  if (variant === 'live') return <AdmissionLiveTrackingSkeleton />;
  return <AdmissionSeatMatrixSkeleton />;
};

const styles = StyleSheet.create({
  page: { padding: 16, gap: 14, paddingBottom: 40 },
  segmentRow: { flexDirection: 'row', gap: 8 },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  chipRow: { flexDirection: 'row', gap: 8 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardLines: { flex: 1, gap: 6 },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewCell: { alignItems: 'center', gap: 6, flex: 1 },
  branchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 12,
  },
  branchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  quotaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 10,
  },
});
