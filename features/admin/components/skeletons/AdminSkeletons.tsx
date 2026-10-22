import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton, ShimmerProvider } from '../../../student/components/ShimmerSkeleton';
import { BorderRadius } from '../../../../constants/theme';

/** Search bar + filter + stacked list rows (students / teachers / users / parents). */
export const AdminListSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <View style={styles.container}>
    <View style={styles.pageHeader}>
      <View style={{ gap: 6 }}>
        <ShimmerSkeleton width={110} height={18} borderRadius={4} />
        <ShimmerSkeleton width={70} height={10} borderRadius={3} />
      </View>
      <ShimmerSkeleton width={96} height={34} borderRadius={BorderRadius.chip} />
    </View>

    <View style={styles.searchBox}>
      <ShimmerSkeleton width="55%" height={14} borderRadius={4} />
    </View>
    <ShimmerSkeleton width={140} height={36} borderRadius={BorderRadius.chip} />

    {Array.from({ length: rows }).map((_, i) => (
      <View key={i} style={styles.listCard}>
        <ShimmerSkeleton width={44} height={44} borderRadius={22} />
        <View style={styles.listLines}>
          <ShimmerSkeleton width="55%" height={13} borderRadius={4} />
          <ShimmerSkeleton width="75%" height={10} borderRadius={3} />
          <ShimmerSkeleton width="40%" height={9} borderRadius={3} />
        </View>
        <ShimmerSkeleton width={28} height={28} borderRadius={14} />
      </View>
    ))}
  </View>
);

/** Banner + stat grid + recent feed cards (dashboard). */
export const AdminDashboardSkeleton: React.FC = () => (
  <View style={styles.container}>
    <ShimmerSkeleton width="100%" height={88} borderRadius={BorderRadius.card} />

    <View style={styles.statsGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.statCard}>
          <ShimmerSkeleton width={48} height={26} borderRadius={4} />
          <ShimmerSkeleton width="70%" height={9} borderRadius={3} />
        </View>
      ))}
    </View>

    <ShimmerSkeleton width="35%" height={14} borderRadius={4} />
    <View style={styles.quickRow}>
      <ShimmerSkeleton width="48%" height={72} borderRadius={BorderRadius.card} />
      <ShimmerSkeleton width="48%" height={72} borderRadius={BorderRadius.card} />
    </View>

    <ShimmerSkeleton width="45%" height={14} borderRadius={4} />
    {[0, 1, 2].map((i) => (
      <View key={i} style={styles.feedCard}>
        <ShimmerSkeleton width={36} height={36} borderRadius={18} />
        <View style={styles.listLines}>
          <ShimmerSkeleton width="55%" height={13} borderRadius={4} />
          <ShimmerSkeleton width="70%" height={10} borderRadius={3} />
        </View>
        <ShimmerSkeleton width={54} height={20} borderRadius={BorderRadius.chip} />
      </View>
    ))}
  </View>
);

/** Generic stacked cards with label/value rows (institution, academics, settings, profile...). */
export const AdminPanelSkeleton: React.FC<{ cards?: number }> = ({ cards = 3 }) => (
  <View style={styles.container}>
    <ShimmerSkeleton width="30%" height={12} borderRadius={3} />
    {Array.from({ length: cards }).map((_, i) => (
      <View key={i} style={styles.panelCard}>
        <ShimmerSkeleton width="45%" height={14} borderRadius={4} />
        {[0, 1, 2].map((r) => (
          <View key={r} style={styles.panelRow}>
            <ShimmerSkeleton width="35%" height={11} borderRadius={3} />
            <ShimmerSkeleton width="45%" height={11} borderRadius={3} />
          </View>
        ))}
      </View>
    ))}
  </View>
);

export type AdminSkeletonTab =
  | 'dashboard'
  | 'institution'
  | 'students'
  | 'teachers'
  | 'users'
  | 'parents'
  | 'academics'
  | 'timetable'
  | 'attendance'
  | 'announcements'
  | 'payments'
  | 'settings'
  | 'profile';

/** Picks the right skeleton for the active admin tab. */
export const AdminSkeleton: React.FC<{ tab: AdminSkeletonTab }> = ({ tab }) => {
  let body: React.ReactNode;
  switch (tab) {
    case 'dashboard':
      body = <AdminDashboardSkeleton />;
      break;
    case 'students':
    case 'teachers':
    case 'users':
    case 'parents':
      body = <AdminListSkeleton />;
      break;
    default:
      body = <AdminPanelSkeleton />;
  }
  return <ShimmerProvider>{body}</ShimmerProvider>;
};

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14, paddingBottom: 40 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  quickRow: { flexDirection: 'row', gap: 12 },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  feedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listLines: { flex: 1, gap: 6 },
  panelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 18,
    gap: 14,
  },
  panelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
