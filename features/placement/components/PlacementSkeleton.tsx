import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from '../../student/components/ShimmerSkeleton';
import { BorderRadius } from '../../../constants/theme';

export const PlacementStatsSkeleton: React.FC = () => {
  return (
    <View style={styles.statsCard}>
      <View style={{ gap: 8 }}>
        <ShimmerSkeleton width={70} height={32} borderRadius={6} />
        <ShimmerSkeleton width={90} height={10} borderRadius={4} />
      </View>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <ShimmerSkeleton width={40} height={20} borderRadius={4} />
          <ShimmerSkeleton width={50} height={10} borderRadius={4} />
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <ShimmerSkeleton width={40} height={20} borderRadius={4} />
          <ShimmerSkeleton width={50} height={10} borderRadius={4} />
        </View>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <ShimmerSkeleton width={40} height={20} borderRadius={4} />
          <ShimmerSkeleton width={50} height={10} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

export const PlacementDriveCardSkeleton: React.FC = () => {
  return (
    <View style={styles.driveCard}>
      <View style={styles.driveHeader}>
        <ShimmerSkeleton width={48} height={48} borderRadius={10} />
        <ShimmerSkeleton width={80} height={22} borderRadius={12} />
      </View>
      <ShimmerSkeleton width="40%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
      <ShimmerSkeleton width="75%" height={18} borderRadius={4} style={{ marginTop: 6 }} />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <ShimmerSkeleton width={100} height={14} borderRadius={4} />
        <ShimmerSkeleton width={110} height={14} borderRadius={4} />
      </View>
      <View style={styles.divider} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <ShimmerSkeleton width={110} height={12} borderRadius={4} />
        <ShimmerSkeleton width={90} height={14} borderRadius={4} />
      </View>
    </View>
  );
};

export const PlacementStudentsSkeleton: React.FC = () => {
  return (
    <View style={{ gap: 10, padding: 16 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.studentRow}>
          <ShimmerSkeleton width={44} height={44} borderRadius={22} />
          <View style={{ flex: 1, gap: 6 }}>
            <ShimmerSkeleton width="60%" height={15} borderRadius={4} />
            <ShimmerSkeleton width="40%" height={11} borderRadius={4} />
          </View>
          <ShimmerSkeleton width={60} height={22} borderRadius={11} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  statsCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: BorderRadius.card,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2B2C',
    marginBottom: 16,
  },
  driveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 12,
  },
  driveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F1EA',
    marginVertical: 12,
  },
  studentRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
