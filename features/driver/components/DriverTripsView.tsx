import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
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
        today={today}
        isLive={isLive}
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
            <>
              <MaterialCommunityIcons name="stop-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.trackBtnText}>End Active Trip</Text>
            </>
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
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="play-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.trackBtnText}>Start Live Trip</Text>
            </>
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
        currentStopIndex={currentStopIndex}
        isLive={isLive}
        routeName={routeName}
        regNo={regNo}
        displayLocation={displayLocation}
      />

      {/* Quick Emergency / Support Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => Linking.openURL('tel:100')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="phone-alert" size={24} color="#DC3545" />
          <Text style={styles.actionText}>Emergency</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={fetchAssignment}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="refresh" size={24} color="#0EA5E9" />
          <Text style={styles.actionText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 13, color: '#6B6B6B' },

  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  trackBtnEnd: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  trackBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  actionText: { fontSize: 11, fontWeight: '700', color: '#171717' },
});
