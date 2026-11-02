import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerProvider, ShimmerSkeleton } from '../../../student/components/ShimmerSkeleton';

const Row = ({ lines = 3 }: { lines?: number }) => (
  <View style={styles.rowCard}>
    <ShimmerSkeleton width={42} height={42} borderRadius={21} />
    <View style={styles.rowLines}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerSkeleton key={i} width={i === 0 ? '60%' : '80%'} height={i === 0 ? 13 : 10} borderRadius={4} />
      ))}
    </View>
    <ShimmerSkeleton width={64} height={26} borderRadius={5} />
  </View>
);

const AccountantDashboardSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <ShimmerSkeleton width="55%" height={20} borderRadius={5} />
    <ShimmerSkeleton width="35%" height={11} borderRadius={4} />
    <View style={styles.balanceCard}>
      <ShimmerSkeleton width="45%" height={11} borderRadius={4} />
      <ShimmerSkeleton width="65%" height={32} borderRadius={6} />
      <View style={styles.statRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.statTile}>
            <ShimmerSkeleton width="70%" height={9} borderRadius={3} />
            <ShimmerSkeleton width="55%" height={16} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
    <View style={styles.quickGrid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.quickCard}>
          <ShimmerSkeleton width={34} height={34} borderRadius={10} />
          <ShimmerSkeleton width="70%" height={11} borderRadius={4} />
        </View>
      ))}
    </View>
    <ShimmerSkeleton width="42%" height={14} borderRadius={4} />
    {[0, 1, 2].map((i) => (
      <Row key={i} lines={2} />
    ))}
  </View>
);

export const AccountantDashboardSkeleton: React.FC = () => (
  <ShimmerProvider>
    <AccountantDashboardSkeletonBase />
  </ShimmerProvider>
);

const AccountantListSkeletonBase: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <View style={styles.page}>
    <View style={styles.headerRow}>
      <ShimmerSkeleton width={140} height={18} borderRadius={4} />
      <ShimmerSkeleton width={34} height={34} borderRadius={17} />
    </View>
    <View style={styles.kpiBanner}>
      <ShimmerSkeleton width="40%" height={11} borderRadius={4} />
      <ShimmerSkeleton width="55%" height={24} borderRadius={5} />
      <View style={styles.statRow}>
        {[0, 1, 2].map((i) => (
          <ShimmerSkeleton key={i} width="30%" height={12} borderRadius={4} />
        ))}
      </View>
    </View>
    <View style={styles.chipRow}>
      {[90, 80, 70].map((w, i) => (
        <ShimmerSkeleton key={i} width={w} height={30} borderRadius={15} />
      ))}
    </View>
    <ShimmerSkeleton width="100%" height={42} borderRadius={8} />
    {Array.from({ length: rows }).map((_, i) => (
      <Row key={i} />
    ))}
  </View>
);

export const AccountantListSkeleton: React.FC<{ rows?: number }> = (props) => (
  <ShimmerProvider>
    <AccountantListSkeletonBase {...props} />
  </ShimmerProvider>
);

const AccountantOnlinePaymentsSkeletonBase: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <View style={styles.page}>
    <ShimmerSkeleton width="50%" height={18} borderRadius={4} />
    <View style={styles.heroCard}>
      <ShimmerSkeleton width="45%" height={11} borderRadius={4} />
      <ShimmerSkeleton width="60%" height={30} borderRadius={6} />
      <View style={styles.statRow}>
        {[0, 1, 2].map((i) => (
          <ShimmerSkeleton key={i} width="30%" height={12} borderRadius={4} />
        ))}
      </View>
    </View>
    <View style={styles.chipRow}>
      {[80, 70, 90, 75].map((w, i) => (
        <ShimmerSkeleton key={i} width={w} height={30} borderRadius={15} />
      ))}
    </View>
    {Array.from({ length: rows }).map((_, i) => (
      <Row key={i} />
    ))}
  </View>
);

export const AccountantOnlinePaymentsSkeleton: React.FC<{ rows?: number }> = (props) => (
  <ShimmerProvider>
    <AccountantOnlinePaymentsSkeletonBase {...props} />
  </ShimmerProvider>
);

const AccountantPayrollSkeletonBase: React.FC = () => (
  <View style={styles.page}>
    <View style={styles.balanceCard}>
      <ShimmerSkeleton width="40%" height={11} borderRadius={4} />
      <ShimmerSkeleton width="58%" height={30} borderRadius={6} />
      <ShimmerSkeleton width="45%" height={11} borderRadius={4} />
    </View>
    <View style={styles.panelCard}>
      <ShimmerSkeleton width="45%" height={14} borderRadius={4} />
      <ShimmerSkeleton width="100%" height={46} borderRadius={8} />
      <ShimmerSkeleton width="100%" height={46} borderRadius={8} />
    </View>
    <ShimmerSkeleton width="38%" height={14} borderRadius={4} />
    {[0, 1, 2, 3].map((i) => (
      <Row key={i} lines={2} />
    ))}
  </View>
);

export const AccountantPayrollSkeleton: React.FC = () => (
  <ShimmerProvider>
    <AccountantPayrollSkeletonBase />
  </ShimmerProvider>
);

export type AccountantSkeletonTab =
  | 'overview'
  | 'fees'
  | 'dues'
  | 'income'
  | 'payments'
  | 'expenses'
  | 'accounts';

export const AccountantTabSkeleton: React.FC<{ tab: AccountantSkeletonTab }> = ({ tab }) => {
  switch (tab) {
    case 'overview':
      return <AccountantDashboardSkeleton />;
    case 'payments':
      return <AccountantOnlinePaymentsSkeleton />;
    default:
      return <AccountantListSkeleton />;
  }
};

const styles = StyleSheet.create({
  page: { padding: 16, gap: 14, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    gap: 10,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 18,
    gap: 10,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 18,
    gap: 10,
  },
  panelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    gap: 12,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 4 },
  statTile: { flex: 1, gap: 6 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 8,
  },
  chipRow: { flexDirection: 'row', gap: 8 },
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
});
