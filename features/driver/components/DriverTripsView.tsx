import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontFamily } from '../../../constants/fonts';
import { useDriverLocationBroadcast } from '../hooks/useDriverLocationBroadcast';
import {
  getDriverAssignmentApi,
  startDriverTripApi,
  updateDriverLocationApi,
  endDriverTripApi,
  DriverAssignmentData,
  BusStop,
} from '../../../api/transport';
import { DriverTripHero } from './DriverTripHero';
import { DriverTripBroadcastCard } from './DriverTripBroadcastCard';
import { DriverTripStopsTimeline } from './DriverTripStopsTimeline';

const EARTH_RADIUS_KM = 6371;

function distanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestStopIndex(
  stops: BusStop[],
  latitude: number,
  longitude: number
): number {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  stops.forEach((stop, index) => {
    const distance = distanceKm(
      latitude,
      longitude,
      Number(stop.latitude),
      Number(stop.longitude)
    );
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

export const DriverTripsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [assignment, setAssignment] = useState<DriverAssignmentData | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [autoBroadcast, setAutoBroadcast] = useState(false);
  const [simCoords, setSimCoords] = useState<{ lat: number; lng: number; speed: number } | null>(null);

  const broadcastTimerRef = useRef<any>(null);

  const fetchAssignment = useCallback(async () => {
    try {
      const data = await getDriverAssignmentApi();
      setAssignment(data);
      if (data.hasLiveTrip && data.liveTrip) {
        setActiveTripId(data.liveTrip.id);
      } else {
        setActiveTripId(null);
      }
    } catch (err: any) {
      console.warn('[DriverTripsView] Failed to fetch assignment:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const isLive = !!activeTripId;
  const stops: BusStop[] = assignment?.stops || [];

  // Real GPS broadcasting via expo-location (paused when autoBroadcast is ON)
  const gps = useDriverLocationBroadcast(activeTripId, isLive && !autoBroadcast);

  // Derive the bus location to display: prefer sim coords when autoBroadcast is active, else real GPS
  const displayLocation = autoBroadcast && simCoords
    ? { latitude: simCoords.lat, longitude: simCoords.lng, speed: simCoords.speed }
    : gps.lastFix
    ? {
        latitude: gps.lastFix.latitude,
        longitude: gps.lastFix.longitude,
        speed: gps.lastFix.speed,
        heading: gps.lastFix.heading,
      }
    : simCoords
    ? { latitude: simCoords.lat, longitude: simCoords.lng, speed: simCoords.speed }
    : null;

  // Display speed: prefer sim speed when auto-moving, else real GPS fix
  const displaySpeed = autoBroadcast && simCoords
    ? simCoords.speed
    : (gps.lastFix?.speed ?? simCoords?.speed ?? null);

  const displayLatitude = displayLocation?.latitude;
  const displayLongitude = displayLocation?.longitude;

  // Keep the stop timeline aligned with the real bus position instead of the
  // simulated stop index, which only changes when the simulator advances.
  const displayStopIndex = useMemo(() => {
    if (
      displayLatitude === undefined ||
      displayLongitude === undefined ||
      stops.length === 0
    ) {
      return currentStopIndex;
    }
    return findNearestStopIndex(stops, displayLatitude, displayLongitude);
  }, [displayLatitude, displayLongitude, stops, currentStopIndex]);

  // Manual simulation location sender (fallback for dev / web)
  const broadcastSimLocation = useCallback(
    async (lat: number, lng: number, speed: number = 28) => {
      if (!activeTripId) return;
      try {
        await updateDriverLocationApi(activeTripId, {
          latitude: lat,
          longitude: lng,
          speed,
          heading: 180,
        });
        setSimCoords({ lat, lng, speed });
      } catch (err: any) {
        if (
          err?.message?.includes('Location can only be reported') ||
          err?.message?.includes('not active') ||
          err?.message?.includes('TRIP_NOT_LIVE') ||
          err?.code === 'TRIP_NOT_LIVE'
        ) {
          setActiveTripId(null);
          setAutoBroadcast(false);
          fetchAssignment();
        } else {
          console.warn('[DriverTripsView] Simulation broadcast failed:', err.message);
        }
      }
    },
    [activeTripId, fetchAssignment]
  );

  // Advance simulation to next stop along the route
  const handleNextStop = useCallback(() => {
    if (stops.length === 0) return;
    const nextIdx = (currentStopIndex + 1) % stops.length;
    setCurrentStopIndex(nextIdx);
    const stop = stops[nextIdx];
    broadcastSimLocation(stop.latitude, stop.longitude, 32);
  }, [stops, currentStopIndex, broadcastSimLocation]);

  // Auto-broadcast simulation loop when enabled
  useEffect(() => {
    if (isLive && autoBroadcast && stops.length > 0) {
      const initial = stops[currentStopIndex] || stops[0];
      broadcastSimLocation(initial.latitude, initial.longitude, 32);

      broadcastTimerRef.current = setInterval(() => {
        setCurrentStopIndex((prev) => {
          const next = (prev + 1) % stops.length;
          const stop = stops[next];
          broadcastSimLocation(stop.latitude, stop.longitude, Math.floor(28 + Math.random() * 12));
          return next;
        });
      }, 3500);
    } else {
      if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current);
    }
    return () => {
      if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current);
    };
  }, [isLive, autoBroadcast, stops, broadcastSimLocation]);

  const handleStartTrip = async () => {
    setActionLoading(true);
    try {
      const trip = await startDriverTripApi('pickup');
      setActiveTripId(trip.id);
      setCurrentStopIndex(0);
      await fetchAssignment();
    } catch (err: any) {
      Alert.alert('Cannot Start Trip', err.message || 'Failed to start trip.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!activeTripId) return;
    setActionLoading(true);
    setAutoBroadcast(false);
    if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current);
    try {
      await endDriverTripApi(activeTripId);
    } catch (err: any) {
      console.warn('[DriverTripsView] End trip notice:', err.message);
    } finally {
      setActiveTripId(null);
      setSimCoords(null);
      await fetchAssignment();
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F4C430" />
        <Text style={styles.loadingText}>Loading assigned route & bus...</Text>
      </View>
    );
  }

  const routeName = assignment?.route?.name || 'No route assigned';
  const regNo = assignment?.vehicle?.registrationNo || 'N/A';

  return (
    <View style={styles.container}>
      {/* Hero Header & Metrics */}
      <DriverTripHero
        routeName={routeName}
        regNo={regNo}
        stopsCount={stops.length}
        displaySpeed={displaySpeed}
      />

      {/* Start / End Tracking Button */}
      {isLive ? (
        <TouchableOpacity
          style={[styles.trackBtn, styles.trackBtnEnd]}
          onPress={handleEndTrip}
          disabled={actionLoading}
          activeOpacity={0.85}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.trackBtnText, styles.trackBtnTextEnd]}>End Active Trip</Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={handleStartTrip}
          disabled={actionLoading}
          activeOpacity={0.85}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="#171717" />
          ) : (
            <Text style={styles.trackBtnText}>Start Live Trip</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Live GPS / Simulator Control Card */}
      <DriverTripBroadcastCard
        isLive={isLive}
        autoBroadcast={autoBroadcast}
        onToggleAutoBroadcast={setAutoBroadcast}
        stops={stops}
        currentStopIndex={currentStopIndex}
        displaySpeed={displaySpeed}
        gps={gps}
        onSimulateNextStop={handleNextStop}
      />

      {/* Route Stops Sequence & Interactive Map */}
      <DriverTripStopsTimeline
        stops={stops}
        currentStopIndex={displayStopIndex}
        isLive={isLive}
        routeName={routeName}
        regNo={regNo}
        displayLocation={displayLocation}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 14 },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 13, color: '#6B7280', fontFamily: FontFamily.medium },

  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#F4C430',
    borderRadius: 5,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#EAB308',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  trackBtnEnd: {
    backgroundColor: '#1A1B1C',
    borderColor: '#1A1B1C',
    shadowColor: '#1A1B1C',
  },
  trackBtnText: { fontSize: 15, fontWeight: '800', color: '#171717', fontFamily: FontFamily.bold },
  trackBtnTextEnd: { color: '#FFFFFF' },
});
