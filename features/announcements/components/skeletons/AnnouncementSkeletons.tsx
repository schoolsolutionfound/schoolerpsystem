import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerProvider, ShimmerSkeleton } from '../../../student/components/ShimmerSkeleton';
import { Colors } from '../../../../constants/theme';

const AnnouncementListSkeletonBase: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <View style={styles.page}>
    <View style={styles.headerRow}>
      <ShimmerSkeleton width="45%" height={22} borderRadius={5} />
      <ShimmerSkeleton width={60} height={30} borderRadius={10} />
    </View>
    <ShimmerSkeleton width="100%" height={44} borderRadius={10} />
    {Array.from({ length: rows }).map((_, i) => (
      <View key={i} style={styles.card}>
        <View style={styles.cardHeader}>
          <ShimmerSkeleton width={38} height={38} borderRadius={19} />
          <View style={styles.flex}>
            <ShimmerSkeleton width="65%" height={13} borderRadius={4} />
            <ShimmerSkeleton width="40%" height={10} borderRadius={3} />
          </View>
        </View>
        <ShimmerSkeleton width="100%" height={10} borderRadius={3} />
        <ShimmerSkeleton width="85%" height={10} borderRadius={3} />
      </View>
    ))}
  </View>
);

export const AnnouncementListSkeleton: React.FC<{ rows?: number }> = (props) => (
  <ShimmerProvider>
    <AnnouncementListSkeletonBase {...props} />
  </ShimmerProvider>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1, gap: 6 },
});
