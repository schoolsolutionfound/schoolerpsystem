import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface DriverTripHeroProps {
  routeName: string;
  regNo: string;
  today: string;
  isLive: boolean;
  stopsCount: number;
  displaySpeed: number | null;
}

export const DriverTripHero: React.FC<DriverTripHeroProps> = ({
  routeName,
  regNo,
  today,
  isLive,
  stopsCount,
  displaySpeed,
}) => {
  return (
    <View style={styles.heroBlock}>
      <View style={styles.heroRow}>
        <View style={[styles.heroIconWrap, isLive && styles.heroIconWrapLive]}>
          <MaterialCommunityIcons name="bus-side" size={26} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle} numberOfLines={1}>
            {routeName}
          </Text>
          <Text style={styles.heroSub}>
            Bus {regNo} • {today}
          </Text>
        </View>
        <View style={[styles.statusBadge, isLive && styles.statusBadgeActive]}>
          <View style={[styles.statusDot, isLive && styles.statusDotActive]} />
          <Text style={[styles.statusText, isLive && styles.statusTextActive]}>
            {isLive ? 'LIVE' : 'IDLE'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <MaterialCommunityIcons name="bus" size={18} color="#F4C430" />
          <Text style={styles.statNum} numberOfLines={1}>
            {regNo}
          </Text>
          <Text style={styles.statLabel}>Vehicle</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <MaterialCommunityIcons name="map-marker-radius" size={18} color="#F4C430" />
          <Text style={styles.statNum}>{stopsCount}</Text>
          <Text style={styles.statLabel}>Stops</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <MaterialCommunityIcons name="speedometer" size={18} color="#F4C430" />
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
    backgroundColor: '#1A1B1C',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2B2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconWrapLive: {
    backgroundColor: '#0EA5E9',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#2A2B2C',
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  statusDotActive: {
    backgroundColor: '#16A34A',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: '#16A34A',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#252627',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statCell: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statNum: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#374151',
  },
});
