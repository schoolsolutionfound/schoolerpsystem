import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BusMapProps } from './types';

export const BusMapPlaceholder: React.FC<BusMapProps> = ({
  stops,
  studentStopId,
  isLive,
  height = 240,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isLive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isLive, pulseAnim]);

  return (
    <View style={[styles.mapContainer, { height }]}>
      {/* Background grid texture */}
      <View style={styles.gridOverlay}>
        <View style={styles.gridCircleOuter} />
        <View style={styles.gridCircleInner} />
      </View>

      {isLive && stops.length > 0 ? (
        <View style={styles.mapInnerContent}>
          {/* Stops visual track */}
          <View style={styles.stopsTrack}>
            {stops.map((s, idx) => {
              const isFirstOrLive = idx === 0;
              const isMyStop = studentStopId === s.id;

              return (
                <View key={s.id} style={styles.stationWrap}>
                  {isFirstOrLive ? (
                    <Animated.View
                      style={[
                        styles.busPinAnim,
                        { transform: [{ scale: pulseAnim }] },
                      ]}
                    >
                      <View style={styles.busPin}>
                        <MaterialCommunityIcons name="bus" size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.busPinBadge}>
                        <Text style={styles.busPinBadgeText}>BUS</Text>
                      </View>
                    </Animated.View>
                  ) : isMyStop ? (
                    <View style={styles.myStopPin}>
                      <MaterialCommunityIcons name="star" size={14} color="#FFFFFF" />
                      <View style={styles.myStopTag}>
                        <Text style={styles.myStopTagText}>YOUR STOP</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.regularStopPin}>
                      <Text style={styles.stopSeqText}>{s.sequence}</Text>
                    </View>
                  )}

                  <Text style={[styles.stationLabel, isMyStop && styles.stationLabelMyStop]} numberOfLines={2}>
                    {s.name.replace(' Station', '').replace(' Complex', '')}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.trackLine} />
        </View>
      ) : (
        <View style={styles.offlineMapNotice}>
          <MaterialCommunityIcons name="bus-stop-covered" size={48} color="#9CA3AF" />
          <Text style={styles.offlineTitle}>Trip Not Active</Text>
          <Text style={styles.offlineSub}>
            Live location and route progress will appear here as soon as the driver starts the journey.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCircleOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    position: 'absolute',
  },
  gridCircleInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    position: 'absolute',
  },
  mapInnerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    position: 'relative',
  },
  stopsTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  stationWrap: {
    alignItems: 'center',
    width: 60,
  },
  busPinAnim: {
    alignItems: 'center',
  },
  busPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  busPinBadge: {
    backgroundColor: '#0EA5E9',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
  },
  busPinBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  myStopPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  myStopTag: {
    backgroundColor: '#1A1B1C',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginTop: 2,
  },
  myStopTagText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#F4C430',
  },
  regularStopPin: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopSeqText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
  },
  stationLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 4,
    height: 24,
  },
  stationLabelMyStop: {
    color: '#1A1B1C',
    fontWeight: '800',
  },
  trackLine: {
    position: 'absolute',
    top: '46%',
    left: 30,
    right: 30,
    height: 3,
    backgroundColor: '#D1D5DB',
    zIndex: 1,
  },
  offlineMapNotice: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 6,
  },
  offlineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  offlineSub: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
});
