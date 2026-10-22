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
import { getMyBusApi, subscribeToBusStream, MyBusData, BusStop } from '../../../api/transport';
import { BusTrackingSkeleton } from './skeletons';
import { ShimmerProvider } from './ShimmerSkeleton';
import { BusMap } from '../../shared/maps/BusMap';
import { StudentBusTimeline } from './StudentBusTimeline';
import { StudentBusProximityBanner } from './StudentBusProximityBanner';
import { StudentBusDetailsCard } from './StudentBusDetailsCard';

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

  // Initial fetch
  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  // Live Server-Sent Events (SSE) telemetry stream with polling watchdog
  useEffect(() => {
    let sseActive = false;

    const unsubscribe = subscribeToBusStream(
      (payload) => {
        sseActive = true;
        setLoading(false);
        setRefreshing(false);
        setErrorMsg(null);

        if (payload.type === 'INITIAL' && payload.data) {
          setBusData(payload.data);
        } else if (payload.type === 'LOCATION_UPDATE' && payload.location) {
          setBusData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              isLive: true,
              location: payload.location,
              currentStop: payload.currentStop !== undefined ? payload.currentStop : prev.currentStop,
            };
          });
        } else if (payload.type === 'TRIP_STARTED') {
          setBusData((prev) => (prev ? { ...prev, isLive: true, trip: payload.trip } : prev));
        } else if (payload.type === 'TRIP_ENDED') {
          setBusData((prev) => (prev ? { ...prev, isLive: false, trip: null } : prev));
        }
      },
      () => {
        // Fallback to polling if SSE drops
        sseActive = false;
        fetchTracking(true);
      }
    );

    // Watchdog polling: only runs if SSE stream is inactive or disconnected
    pollTimerRef.current = setInterval(() => {
      if (!sseActive) {
        fetchTracking(true);
      }
    }, 6000);

    return () => {
      unsubscribe();
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
  const myStop = busData?.stop || null;
  const myStopName = myStop?.name || 'Your Assigned Stop';
  const isDropoff = busData?.trip?.tripType === 'dropoff';
  const allStops: BusStop[] = isDropoff ? [...(busData?.stops || [])].reverse() : (busData?.stops || []);
  const currentStop = busData?.currentStop || null;
  const stopsRemaining = busData?.stopsRemaining ?? null;
  const busReg = busData?.vehicle?.registrationNo || 'School Bus';
  const speed = busData?.location?.speed != null ? `${Math.round(busData.location.speed)} km/h` : '0 km/h';

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
        {/* Live Route Map (Interactive Leaflet Map with Road-Following Polyline) */}
        <View style={styles.mapWrapper}>
          <BusMap
            stops={allStops}
            roadPath={busData?.roadPath}
            busLocation={isVeryStale ? null : busData?.location}
            studentStopId={myStop?.id}
            isLive={isLive}
            height={260}
          />
          {/* Auto-Updating Pill */}
          <TouchableOpacity style={styles.refreshPill} onPress={onRefresh} activeOpacity={0.8}>
            <MaterialCommunityIcons name="broadcast" size={14} color="#16A34A" />
            <Text style={styles.refreshPillText}>Live Stream</Text>
          </TouchableOpacity>
        </View>

        {/* Bus Details & Proximity Card */}
        <StudentBusDetailsCard
          isLive={isLive}
          isStale={isStale}
          isVeryStale={isVeryStale}
          busReg={busReg}
          speed={speed}
          currentStopName={currentStop?.name || 'Depot'}
          routeName={routeName}
          myStopName={myStopName}
          myStop={myStop}
          location={busData?.location}
        >
          <StudentBusProximityBanner
            isLive={isLive}
            stopsRemaining={stopsRemaining}
            currentStopName={currentStop?.name}
            locationAgeSec={locationAgeSec}
          />
        </StudentBusDetailsCard>

        {/* Complete Route Stops Timeline */}
        {allStops.length > 0 && (
          <View style={styles.timelineWrapper}>
            <StudentBusTimeline
              allStops={allStops}
              isLive={isLive}
              currentStop={currentStop}
              myStop={myStop}
            />
          </View>
        )}

        {/* Error Banner if any */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, paddingBottom: 24 },

  mapWrapper: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
  },
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

  timelineWrapper: {
    marginHorizontal: 16,
    marginTop: 14,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 12, color: '#DC2626' },
});
