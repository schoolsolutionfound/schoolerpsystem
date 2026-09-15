import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from '../ShimmerSkeleton';

export const ProfileSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <View style={styles.heroRow}>
          <ShimmerSkeleton width={72} height={72} borderRadius={36} />
          <View style={styles.heroInfo}>
            <ShimmerSkeleton width="70%" height={16} borderRadius={4} />
            <ShimmerSkeleton width="50%" height={10} borderRadius={4} />
            <View style={styles.badgeRow}>
              <ShimmerSkeleton width={60} height={18} borderRadius={4} />
              <ShimmerSkeleton width={100} height={18} borderRadius={4} />
            </View>
          </View>
        </View>
        <View style={styles.statsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.statCell}>
              <ShimmerSkeleton width={50} height={12} borderRadius={4} />
              <ShimmerSkeleton width={40} height={8} borderRadius={3} />
            </View>
          ))}
        </View>
      </View>

      {[0, 1, 2].map((cardIdx) => (
        <View key={cardIdx} style={styles.card}>
          <View style={styles.cardHeader}>
            <ShimmerSkeleton width={16} height={16} borderRadius={4} />
            <ShimmerSkeleton width={80} height={12} borderRadius={4} />
          </View>
          {[0, 1].map((rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              <View style={styles.gridCell}>
                <ShimmerSkeleton width="60%" height={8} borderRadius={3} />
                <ShimmerSkeleton width="80%" height={12} borderRadius={4} />
              </View>
              <View style={styles.gridCell}>
                <ShimmerSkeleton width="50%" height={8} borderRadius={3} />
                <ShimmerSkeleton width="70%" height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingBottom: 40 },
  heroSection: {
    backgroundColor: '#1A1B1C',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2C',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroInfo: { flex: 1, gap: 6 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 16,
    backgroundColor: '#232425',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    marginHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE9D6',
  },
  gridRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F1EA',
    gap: 8,
  },
  gridCell: { flex: 1, gap: 4 },
});
