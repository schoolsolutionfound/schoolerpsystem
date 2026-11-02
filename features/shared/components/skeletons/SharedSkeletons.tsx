import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerProvider, ShimmerSkeleton } from '../../../student/components/ShimmerSkeleton';
import { BorderRadius } from '../../../../constants/theme';

const NotificationCard = () => (
  <View style={styles.card}>
    <View style={styles.rowBetween}>
      <ShimmerSkeleton width={70} height={10} borderRadius={3} />
      <ShimmerSkeleton width={48} height={9} borderRadius={3} />
    </View>
    <ShimmerSkeleton width="70%" height={14} borderRadius={4} />
    <ShimmerSkeleton width="100%" height={10} borderRadius={3} />
    <ShimmerSkeleton width="85%" height={10} borderRadius={3} />
  </View>
);

const NotificationsSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <View style={styles.chipRow}>
      {[46, 58, 72, 64, 52].map((w, i) => (
        <ShimmerSkeleton key={i} width={w} height={30} borderRadius={BorderRadius.chip} />
      ))}
    </View>
    {[0, 1, 2, 3, 4].map((i) => (
      <NotificationCard key={i} />
    ))}
  </View>
);

export const NotificationsSkeleton: React.FC = () => (
  <ShimmerProvider>
    <NotificationsSkeletonBase />
  </ShimmerProvider>
);

const FeeSummarySkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <View style={styles.summaryCard}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.summaryCol}>
          <ShimmerSkeleton width={52} height={10} borderRadius={3} />
          <ShimmerSkeleton width={70} height={16} borderRadius={4} />
        </View>
      ))}
    </View>
    <View style={styles.tabBar}>
      {[0, 1, 2].map((i) => (
        <ShimmerSkeleton key={i} width="30%" height={34} borderRadius={5} />
      ))}
    </View>
    <View style={styles.card}>
      <ShimmerSkeleton width="45%" height={16} borderRadius={4} />
      <ShimmerSkeleton width="100%" height={42} borderRadius={5} />
      <ShimmerSkeleton width="100%" height={64} borderRadius={5} />
      <View style={styles.gridRow}>
        {[0, 1, 2, 3].map((i) => (
          <ShimmerSkeleton key={i} width="22%" height={60} borderRadius={5} />
        ))}
      </View>
      <ShimmerSkeleton width="100%" height={44} borderRadius={5} />
    </View>
  </View>
);

export const FeeSummarySkeleton: React.FC = () => (
  <ShimmerProvider>
    <FeeSummarySkeletonBase />
  </ShimmerProvider>
);

const FeedbackSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <ShimmerSkeleton width="100%" height={52} borderRadius={5} />
    {[0, 1, 2, 3].map((i) => (
      <View key={i} style={styles.subjectRow}>
        <View style={styles.flexGap}>
          <ShimmerSkeleton width="55%" height={15} borderRadius={4} />
          <ShimmerSkeleton width="75%" height={10} borderRadius={3} />
        </View>
        <ShimmerSkeleton width={22} height={22} borderRadius={11} />
      </View>
    ))}
    <ShimmerSkeleton width="100%" height={46} borderRadius={5} />
  </View>
);

export const FeedbackSkeleton: React.FC = () => (
  <ShimmerProvider>
    <FeedbackSkeletonBase />
  </ShimmerProvider>
);

const PlacementResultCard = () => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <ShimmerSkeleton width={42} height={42} borderRadius={21} />
      <View style={styles.flexGap}>
        <ShimmerSkeleton width="55%" height={14} borderRadius={4} />
        <ShimmerSkeleton width="45%" height={10} borderRadius={3} />
      </View>
    </View>
    <ShimmerSkeleton width="85%" height={12} borderRadius={3} />
    <ShimmerSkeleton width="50%" height={11} borderRadius={3} />
    <ShimmerSkeleton width="100%" height={1} borderRadius={0} />
    <View style={styles.rowBetween}>
      <ShimmerSkeleton width={120} height={10} borderRadius={3} />
      <ShimmerSkeleton width={70} height={10} borderRadius={3} />
    </View>
  </View>
);

const PlacementResultsSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <ShimmerSkeleton width="100%" height={44} borderRadius={BorderRadius.input} />
    <ShimmerSkeleton width="100%" height={44} borderRadius={5} />
    <View style={styles.chipRow}>
      {[52, 84, 62, 58, 64].map((w, i) => (
        <ShimmerSkeleton key={i} width={w} height={30} borderRadius={5} />
      ))}
    </View>
    {[0, 1, 2, 3].map((i) => (
      <PlacementResultCard key={i} />
    ))}
  </View>
);

export const PlacementResultsSkeleton: React.FC = () => (
  <ShimmerProvider>
    <PlacementResultsSkeletonBase />
  </ShimmerProvider>
);

const PlacementTeamSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <ShimmerSkeleton width="55%" height={18} borderRadius={4} />
    <View style={styles.gridWrap}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.teamCard}>
          <ShimmerSkeleton width={46} height={46} borderRadius={23} />
          <ShimmerSkeleton width="70%" height={12} borderRadius={4} />
          <ShimmerSkeleton width="50%" height={9} borderRadius={3} />
        </View>
      ))}
    </View>
  </View>
);

export const PlacementTeamSkeleton: React.FC = () => (
  <ShimmerProvider>
    <PlacementTeamSkeletonBase />
  </ShimmerProvider>
);

const PlacementProfileSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ShimmerSkeleton width={56} height={56} borderRadius={28} />
        <View style={styles.flexGap}>
          <ShimmerSkeleton width="55%" height={16} borderRadius={4} />
          <ShimmerSkeleton width="40%" height={10} borderRadius={3} />
        </View>
      </View>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.formRow}>
          <ShimmerSkeleton width="30%" height={10} borderRadius={3} />
          <ShimmerSkeleton width="55%" height={36} borderRadius={5} />
        </View>
      ))}
    </View>
    {[0, 1, 2].map((i) => (
      <View key={i} style={styles.card}>
        <ShimmerSkeleton width="40%" height={12} borderRadius={4} />
        <ShimmerSkeleton width="100%" height={36} borderRadius={5} />
      </View>
    ))}
  </View>
);

export const PlacementProfileSkeleton: React.FC = () => (
  <ShimmerProvider>
    <PlacementProfileSkeletonBase />
  </ShimmerProvider>
);

const PlacementDriveDetailSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ShimmerSkeleton width={52} height={52} borderRadius={12} />
        <View style={styles.flexGap}>
          <ShimmerSkeleton width="60%" height={16} borderRadius={4} />
          <ShimmerSkeleton width="42%" height={10} borderRadius={3} />
        </View>
      </View>
      <ShimmerSkeleton width="90%" height={11} borderRadius={3} />
      <ShimmerSkeleton width="70%" height={11} borderRadius={3} />
      <ShimmerSkeleton width="100%" height={44} borderRadius={5} />
    </View>
    {[0, 1].map((i) => (
      <View key={i} style={styles.card}>
        <ShimmerSkeleton width="35%" height={13} borderRadius={4} />
        {[0, 1, 2].map((r) => (
          <View key={r} style={styles.rowBetween}>
            <ShimmerSkeleton width="35%" height={10} borderRadius={3} />
            <ShimmerSkeleton width="25%" height={10} borderRadius={3} />
          </View>
        ))}
      </View>
    ))}
  </View>
);

export const PlacementDriveDetailSkeleton: React.FC = () => (
  <ShimmerProvider>
    <PlacementDriveDetailSkeletonBase />
  </ShimmerProvider>
);

const SchoolDetailsSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <ShimmerSkeleton width="100%" height={160} borderRadius={0} />
    <ShimmerSkeleton width="60%" height={20} borderRadius={4} />
    <ShimmerSkeleton width="40%" height={11} borderRadius={3} />
    {[0, 1, 2].map((i) => (
      <View key={i} style={styles.card}>
        <ShimmerSkeleton width="35%" height={13} borderRadius={4} />
        <ShimmerSkeleton width="100%" height={10} borderRadius={3} />
        <ShimmerSkeleton width="85%" height={10} borderRadius={3} />
      </View>
    ))}
  </View>
);

export const SchoolDetailsSkeleton: React.FC = () => (
  <ShimmerProvider>
    <SchoolDetailsSkeletonBase />
  </ShimmerProvider>
);

const styles = StyleSheet.create({
  page: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 10,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  flexGap: { flex: 1, gap: 6 },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F3EFE8',
    paddingVertical: 14,
  },
  summaryCol: { alignItems: 'center', gap: 6 },
  tabBar: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 10,
  },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  teamCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  formRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
