import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface StudentBusProximityBannerProps {
  isLive: boolean;
  stopsRemaining: number | null;
  currentStopName?: string | null;
  locationAgeSec: number | null;
}

export const StudentBusProximityBanner: React.FC<StudentBusProximityBannerProps> = ({
  isLive,
  stopsRemaining,
  currentStopName,
  locationAgeSec,
}) => {
  const isStale = isLive && locationAgeSec !== null && locationAgeSec > 30;
  const isVeryStale = isLive && locationAgeSec !== null && locationAgeSec > 120;

  return (
    <>
      {/* Staleness Notice Banner */}
      {isVeryStale ? (
        <View style={styles.veryStaleNotice}>
          <MaterialCommunityIcons name="wifi-off" size={18} color="#991B1B" />
          <Text style={styles.veryStaleText}>
            Bus location unavailable, last seen {Math.round(locationAgeSec / 60)} min ago
          </Text>
        </View>
      ) : isStale ? (
        <View style={styles.staleNotice}>
          <MaterialCommunityIcons name="clock-alert-outline" size={16} color="#92400E" />
          <Text style={styles.staleText}>
            Last seen {locationAgeSec < 60 ? `${locationAgeSec}s ago` : `${Math.round(locationAgeSec / 60)}m ago`}
          </Text>
        </View>
      ) : null}

      {/* Proximity Alert Banner */}
      {isLive && (
        <View
          style={[
            styles.proximityCard,
            stopsRemaining === 0
              ? styles.proximityArrived
              : stopsRemaining !== null && stopsRemaining < 0
              ? styles.proximityPassed
              : styles.proximityEnRoute,
          ]}
        >
          <MaterialCommunityIcons
            name={
              stopsRemaining === 0
                ? 'bell-ring'
                : stopsRemaining !== null && stopsRemaining < 0
                ? 'information'
                : 'navigation-variant'
            }
            size={20}
            color={
              stopsRemaining === 0
                ? '#15803D'
                : stopsRemaining !== null && stopsRemaining < 0
                ? '#C2410C'
                : '#0284C7'
            }
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.proximityTitle,
                stopsRemaining === 0
                  ? { color: '#15803D' }
                  : stopsRemaining !== null && stopsRemaining < 0
                  ? { color: '#C2410C' }
                  : { color: '#0284C7' },
              ]}
            >
              {stopsRemaining === 0
                ? 'The bus has arrived at your stop!'
                : stopsRemaining !== null && stopsRemaining > 0
                ? `Bus is ${stopsRemaining} stop${stopsRemaining > 1 ? 's' : ''} away from your stop`
                : stopsRemaining !== null && stopsRemaining < 0
                ? 'Bus has already departed your boarding stop'
                : 'Bus is currently en route'}
            </Text>
            <Text style={styles.proximitySub}>
              {currentStopName ? `Currently at: ${currentStopName}` : 'En route along the schedule'}
            </Text>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  staleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  staleText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  veryStaleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  veryStaleText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  proximityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  proximityEnRoute: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  proximityArrived: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  proximityPassed: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FFEDD5',
  },
  proximityTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  proximitySub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});
