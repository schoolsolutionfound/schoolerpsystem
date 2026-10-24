import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { FontFamily } from '../../../constants/fonts';

export interface DriverTripHeroProps {
  routeName: string;
  regNo: string;
  stopsCount: number;
  displaySpeed: number | null;
}

export const DriverTripHero: React.FC<DriverTripHeroProps> = ({
  routeName,
  regNo,
  stopsCount,
  displaySpeed,
}) => {
  return (
    <View style={styles.heroBlock}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.sectionTitle}>Today's Route</Text>
          <View style={styles.sectionUnderline} />
        </View>
      </View>

      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {routeName}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={[styles.statNum, styles.vehicleValue]}>{regNo}</Text>
          <Text style={styles.statLabel}>Vehicle</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statNum}>{stopsCount}</Text>
          <Text style={styles.statLabel}>Stops</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statNum}>
            {displaySpeed != null ? `${displaySpeed} km/h` : '0 km/h'}
          </Text>
          <Text style={styles.statLabel}>Speed</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  sectionUnderline: {
    height: 3,
    width: 44,
    borderRadius: 2,
    backgroundColor: '#F4C430',
    marginTop: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroTitle: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
    letterSpacing: -0.2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statCell: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statNum: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
  },
  vehicleValue: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E8E5DC',
  },
});
