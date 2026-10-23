import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BusStop, BusLocation } from '../../../api/transport';

export interface StudentBusDetailsCardProps {
  isLive: boolean;
  isStale: boolean;
  isVeryStale: boolean;
  busReg: string;
  speed: string;
  currentStopName: string;
  routeName: string;
  myStopName: string;
  myStop: BusStop | null;
  location?: BusLocation | null;
  children?: React.ReactNode;
}

export const StudentBusDetailsCard: React.FC<StudentBusDetailsCardProps> = ({
  isLive,
  isStale,
  isVeryStale,
  busReg,
  speed,
  currentStopName,
  routeName,
  myStopName,
  myStop,
  location,
  children,
}) => {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <View style={styles.infoTitleRow}>
          <MaterialCommunityIcons name="bus" size={22} color="#1A1B1C" />
          <Text style={styles.infoTitle}>Live Bus Tracking</Text>
        </View>
        <View
          style={[
            styles.liveBadge,
            isLive &&
              (isVeryStale
                ? styles.liveBadgeOffline
                : isStale
                ? styles.liveBadgeStale
                : styles.liveBadgeActive),
          ]}
        >
          <View
            style={[
              styles.liveDot,
              isLive &&
                (isVeryStale
                  ? styles.liveDotOffline
                  : isStale
                  ? styles.liveDotStale
                  : styles.liveDotActive),
            ]}
          />
          <Text
            style={[
              styles.liveText,
              isLive &&
                (isVeryStale
                  ? styles.liveTextOffline
                  : isStale
                  ? styles.liveTextStale
                  : styles.liveTextActive),
            ]}
          >
            {!isLive
              ? 'OFFLINE'
              : isVeryStale
              ? 'SIGNAL LOST'
              : isStale
              ? 'SIGNAL WEAK'
              : 'LIVE ON ROUTE'}
          </Text>
        </View>
      </View>

      {/* Optional Proximity banner slot */}
      {children}

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={styles.statNum} numberOfLines={1}>
            {busReg}
          </Text>
          <Text style={styles.statLabel}>Bus Number</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statNum}>{isLive ? speed : '—'}</Text>
          <Text style={styles.statLabel}>Speed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statNum} numberOfLines={1}>
            {isLive ? currentStopName : 'Depot'}
          </Text>
          <Text style={styles.statLabel}>Current Stop</Text>
        </View>
      </View>

      {/* Route & Stop Details Box */}
      <View style={styles.detailsBox}>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="map-marker-path" size={18} color="#0EA5E9" />
          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>Assigned Route</Text>
            <Text style={styles.detailValue}>{routeName}</Text>
          </View>
        </View>

        <View style={styles.dividerH} />

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="star-circle" size={18} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>Your Boarding Stop</Text>
            <Text style={styles.detailValue}>
              {myStopName} {myStop ? `(Stop #${myStop.sequence})` : ''}
            </Text>
          </View>
        </View>

        {isLive && location && (
          <>
            <View style={styles.dividerH} />
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#10B981" />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>GPS Coordinates</Text>
                <Text style={styles.coordsValue}>
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  liveBadgeActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  liveBadgeStale: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  liveBadgeOffline: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  liveDotActive: {
    backgroundColor: '#16A34A',
  },
  liveDotStale: {
    backgroundColor: '#F59E0B',
  },
  liveDotOffline: {
    backgroundColor: '#DC2626',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  liveTextActive: {
    color: '#16A34A',
  },
  liveTextStale: {
    color: '#D97706',
  },
  liveTextOffline: {
    color: '#DC2626',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statCell: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statNum: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  coordsValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  dividerH: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
});
