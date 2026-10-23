import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BusStop } from '../../../api/transport';

export interface StudentBusTimelineProps {
  allStops: BusStop[];
  isLive: boolean;
  currentStop: { id: string; name: string; sequence: number } | null;
  myStop: BusStop | null;
}

export const StudentBusTimeline: React.FC<StudentBusTimelineProps> = ({
  allStops,
  isLive,
  currentStop,
  myStop,
}) => {
  if (!allStops || allStops.length === 0) return null;

  return (
    <View style={styles.timelineCard}>
      <View style={styles.timelineHeader}>
        <MaterialCommunityIcons name="map-marker-distance" size={18} color="#0EA5E9" />
        <Text style={styles.timelineTitle}>All Route Stops ({allStops.length})</Text>
      </View>

      <View style={styles.timelineList}>
        {allStops.map((stop, index) => {
          const isCurrent = isLive && currentStop?.id === stop.id;
          const isMyStop = myStop?.id === stop.id;
          const isPassed = isLive && currentStop && stop.sequence < currentStop.sequence;
          const isLast = index === allStops.length - 1;

          return (
            <View key={stop.id} style={styles.stopTimelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <View
                  style={[
                    styles.tDot,
                    isCurrent && styles.tDotCurrent,
                    isMyStop && styles.tDotMyStop,
                    isPassed && styles.tDotPassed,
                  ]}
                >
                  {isCurrent ? (
                    <MaterialCommunityIcons name="bus" size={12} color="#FFFFFF" />
                  ) : isMyStop ? (
                    <MaterialCommunityIcons name="star" size={10} color="#FFFFFF" />
                  ) : isPassed ? (
                    <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.tDotNum}>{stop.sequence}</Text>
                  )}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.tLine,
                      isPassed && styles.tLinePassed,
                    ]}
                  />
                )}
              </View>

              <View style={styles.timelineInfoCol}>
                <View style={styles.timelineNameRow}>
                  <Text
                    style={[
                      styles.timelineStopName,
                      isCurrent && styles.tNameCurrent,
                      isMyStop && styles.tNameMyStop,
                    ]}
                  >
                    {stop.name}
                  </Text>

                  {isCurrent && (
                    <View style={styles.busHereTag}>
                      <Text style={styles.busHereTagText}>BUS HERE</Text>
                    </View>
                  )}

                  {isMyStop && (
                    <View style={styles.yourStopTag}>
                      <Text style={styles.yourStopTagText}>YOUR STOP</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.timelineCoords}>
                  Stop #{stop.sequence} • Lat: {Number(stop.latitude).toFixed(4)}, Lng:{' '}
                  {Number(stop.longitude).toFixed(4)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 14,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171717',
  },
  timelineList: {
    gap: 0,
    paddingLeft: 4,
  },
  stopTimelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 52,
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 24,
  },
  tDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tDotCurrent: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0284C7',
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  tDotMyStop: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  tDotPassed: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  tDotNum: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
  },
  tLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    minHeight: 32,
  },
  tLinePassed: {
    backgroundColor: '#10B981',
  },
  timelineInfoCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  timelineNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  timelineStopName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  tNameCurrent: {
    color: '#0EA5E9',
    fontWeight: '800',
  },
  tNameMyStop: {
    color: '#D97706',
    fontWeight: '800',
  },
  busHereTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  busHereTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284C7',
  },
  yourStopTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  yourStopTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  timelineCoords: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
