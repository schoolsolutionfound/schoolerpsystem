import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getMyBusApi, MyBusData, BusStop } from '../../../api/transport';
import { BusTrackingSkeleton } from './skeletons';
import { ShimmerProvider } from './ShimmerSkeleton';

import { BusMap } from '../../shared/maps/BusMap';

export const StudentBusTrackingView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busData, setBusData] = useState<MyBusData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollTimerRef = useRef<any>(null);

  // Pulsing animation for live marker
  useEffect(() => {
    if (busData?.isLive) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [busData?.isLive, pulseAnim]);

  const fetchTracking = useCallback(async (isSilent: boolean = false) => {
    if (!isSilent) setErrorMsg(null);
    try {
      const data = await getMyBusApi();
      setBusData(data);
    } catch (err: any) {
      if (!isSilent) {
        setErrorMsg(err.message || 'Unable to load bus tracking.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  // Poll every 4 seconds to stream live location
  useEffect(() => {
    pollTimerRef.current = setInterval(() => {
      fetchTracking(true);
    }, 4000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchTracking]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTracking(false);
  }, [fetchTracking]);

  if (loading && !refreshing) {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <ShimmerProvider>
          <BusTrackingSkeleton />
        </ShimmerProvider>
      </ScrollView>
    );
  }

  const isLive = busData?.isLive ?? false;
  const routeName = busData?.route?.name || 'Assigned Route';
  const myStop = busData?.stop;
  const myStopName = myStop?.name || 'Your Assigned Stop';
  const allStops: BusStop[] = busData?.stops || [];
  const currentStop = busData?.currentStop;
  const stopsRemaining = busData?.stopsRemaining ?? null;
  const busReg = busData?.vehicle?.registrationNo || 'School Bus';
  const speed = busData?.location?.speed != null ? `${Math.round(busData.location.speed)} km/h` : '0 km/h';

  // Calculate current stop index on the route
  const currentStopIndex = currentStop
    ? allStops.findIndex((s) => s.id === currentStop.id)
    : 0;

  // Calculate location staleness
  const updatedAtMs = busData?.location?.updatedAt
    ? new Date(busData.location.updatedAt).getTime()
    : null;
  const locationAgeSec = updatedAtMs ? Math.max(0, Math.round((Date.now() - updatedAtMs) / 1000)) : null;
  const isStale = isLive && locationAgeSec !== null && locationAgeSec > 30;
  const isVeryStale = isLive && locationAgeSec !== null && locationAgeSec > 120;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1A1B1C"
          colors={['#1A1B1C']}
          progressBackgroundColor="#FFFFFF"
        />
      }
    >
      <View style={styles.container}>
        {/* Live Route Map (Native Map / Placeholder Fallback) */}
        <View style={styles.mapWrapper}>
          <BusMap
            stops={allStops}
            busLocation={isVeryStale ? null : busData?.location}
            studentStopId={myStop?.id}
            isLive={isLive}
            height={260}
          />
          {/* Auto-Updating Pill */}
          <TouchableOpacity style={styles.refreshPill} onPress={onRefresh}>
            <MaterialCommunityIcons name="sync" size={14} color="#374151" />
            <Text style={styles.refreshPillText}>Auto-Updating (4s)</Text>
          </TouchableOpacity>
        </View>

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

        {/* Bottom Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoTitleRow}>
              <MaterialCommunityIcons name="bus" size={22} color="#1A1B1C" />
              <Text style={styles.infoTitle}>Live Bus Tracking</Text>
            </View>
            <View
              style={[
                styles.liveBadge,
                isLive && (isVeryStale ? styles.liveBadgeOffline : isStale ? styles.liveBadgeStale : styles.liveBadgeActive),
              ]}
            >
              <View
                style={[
                  styles.liveDot,
                  isLive && (isVeryStale ? styles.liveDotOffline : isStale ? styles.liveDotStale : styles.liveDotActive),
                ]}
              />
              <Text
                style={[
                  styles.liveText,
                  isLive && (isVeryStale ? styles.liveTextOffline : isStale ? styles.liveTextStale : styles.liveTextActive),
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
                  {currentStop ? `Currently at: ${currentStop.name}` : 'En route along the schedule'}
                </Text>
              </View>
            </View>
          )}

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
                {isLive && currentStop ? currentStop.name.split(' ')[0] : 'Depot'}
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

            {isLive && busData?.location && (
              <>
                <View style={styles.dividerH} />
                <View style={styles.detailRow}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>GPS Coordinates</Text>
                    <Text style={styles.coordsValue}>
                      {busData.location.latitude.toFixed(5)}, {busData.location.longitude.toFixed(5)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Complete Route Stops Timeline */}
          {allStops.length > 0 && (
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
          )}

          {errorMsg && (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },

  // Visual Map Radar Area
  mapWrapper: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  mapContainer: {
    height: 330,
    backgroundColor: '#0F172A',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCircleOuter: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gridCircleInner: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },

  mapInnerContent: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  mapRoutePill: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  mapRoutePillText: { fontSize: 11, fontWeight: '700', color: '#E2E8F0' },

  stopsTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    zIndex: 10,
  },
  trackLine: {
    position: 'absolute',
    left: 28,
    right: 28,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
  },

  stationWrap: {
    alignItems: 'center',
    width: 62,
    gap: 6,
  },
  busPinAnim: {
    alignItems: 'center',
    zIndex: 20,
  },
  busPin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  busPinBadge: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  busPinBadgeText: { fontSize: 8, fontWeight: '800', color: '#FFFFFF' },

  myStopPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 15,
  },
  myStopTag: {
    position: 'absolute',
    top: -18,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  myStopTagText: { fontSize: 7, fontWeight: '800', color: '#FFFFFF' },

  regularStopPin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  regularStopPinPassed: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  stopSeqText: { fontSize: 9, fontWeight: '800', color: '#94A3B8' },

  stationLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 12,
  },
  stationLabelActive: { color: '#38BDF8', fontWeight: '800' },
  stationLabelMyStop: { color: '#FCD34D', fontWeight: '800' },

  offlineMapNotice: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  offlineTitle: { fontSize: 16, fontWeight: '800', color: '#E2E8F0' },
  offlineSub: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },

  refreshPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  refreshPillText: { fontSize: 10, fontWeight: '700', color: '#374151' },

  // Bottom Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  liveBadgeActive: {
    backgroundColor: '#DCFCE7',
  },
  liveBadgeStale: {
    backgroundColor: '#FEF3C7',
  },
  liveBadgeOffline: {
    backgroundColor: '#FEE2E2',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
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
  liveText: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
  liveTextActive: { color: '#15803D' },
  liveTextStale: { color: '#B45309' },
  liveTextOffline: { color: '#B91C1C' },

  veryStaleNotice: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  veryStaleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    flex: 1,
  },
  staleNotice: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  staleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },

  // Proximity Alert Banner
  proximityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 14,
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
  proximityTitle: { fontSize: 13, fontWeight: '800' },
  proximitySub: { fontSize: 11, color: '#64748B', marginTop: 2 },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 14,
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  statNum: { fontSize: 15, fontWeight: '800', color: '#F4C430' },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#334155', marginVertical: 4 },

  // Route & Stop Details Box
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  detailValue: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 2 },
  coordsValue: { fontSize: 12, fontWeight: '600', color: '#0F172A', fontFamily: 'monospace', marginTop: 2 },
  dividerH: { height: 1, backgroundColor: '#E2E8F0' },

  // Complete Route Stops Timeline
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 14,
  },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineTitle: { fontSize: 14, fontWeight: '800', color: '#171717' },

  timelineList: { gap: 0, paddingLeft: 6 },
  stopTimelineRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 52 },
  timelineIndicatorCol: { alignItems: 'center', width: 22 },
  tDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  tDotCurrent: {
    borderColor: '#0EA5E9',
    backgroundColor: '#0EA5E9',
  },
  tDotMyStop: {
    borderColor: '#F59E0B',
    backgroundColor: '#F59E0B',
  },
  tDotPassed: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  tDotNum: { fontSize: 9, fontWeight: '700', color: '#64748B' },
  tLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    minHeight: 32,
  },
  tLinePassed: {
    backgroundColor: '#16A34A',
  },
  timelineInfoCol: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  timelineNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  timelineStopName: { fontSize: 13, fontWeight: '600', color: '#334155' },
  tNameCurrent: { color: '#0284C7', fontWeight: '800' },
  tNameMyStop: { color: '#B45309', fontWeight: '800' },

  busHereTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  busHereTagText: { fontSize: 9, fontWeight: '800', color: '#0284C7' },
  yourStopTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  yourStopTagText: { fontSize: 9, fontWeight: '800', color: '#B45309' },
  timelineCoords: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 12, color: '#DC2626' },
});
