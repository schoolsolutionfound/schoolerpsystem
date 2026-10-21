import { useState, useEffect, useRef, useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { updateDriverLocationApi } from '../../../api/transport';
import { USE_REAL_DRIVER_GPS } from '../../../constants/featureFlags';

export type GpsBroadcastStatus =
  | 'idle'
  | 'acquiring'
  | 'sharing'
  | 'offline'
  | 'permission_needed'
  | 'error';

export interface LocationFix {
  latitude: number;
  longitude: number;
  speed: number | null; // km/h
  heading: number | null; // 0-360 degrees
  accuracy: number | null; // meters
  timestamp: number;
}

export interface UseDriverLocationBroadcastReturn {
  status: GpsBroadcastStatus;
  lastFix: LocationFix | null;
  lastSentAt: number | null;
  error: string | null;
  permissionGranted: boolean;
  retry: () => void;
  openSettings: () => void;
}

const MIN_SEND_INTERVAL_MS = 4000;
const MAX_CONSECUTIVE_FAILURES = 3;
const KEEP_AWAKE_TAG = 'driver-trip-broadcast';

export function useDriverLocationBroadcast(
  tripId: string | null,
  isLive: boolean
): UseDriverLocationBroadcastReturn {
  const [status, setStatus] = useState<GpsBroadcastStatus>('idle');
  const [lastFix, setLastFix] = useState<LocationFix | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const isPostingRef = useRef<boolean>(false);
  const pendingFixRef = useRef<LocationFix | null>(null);
  const consecutiveFailuresRef = useRef<number>(0);
  const lastSendTimeRef = useRef<number>(0);
  const tripTerminatedRef = useRef<boolean>(false);

  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  const sendFix = useCallback(
    async (fix: LocationFix, currentTripId: string) => {
      if (isPostingRef.current || tripTerminatedRef.current) {
        pendingFixRef.current = fix;
        return;
      }

      const now = Date.now();
      const elapsed = now - lastSendTimeRef.current;
      if (elapsed < MIN_SEND_INTERVAL_MS) {
        pendingFixRef.current = fix;
        return;
      }

      isPostingRef.current = true;
      try {
        await updateDriverLocationApi(currentTripId, {
          latitude: fix.latitude,
          longitude: fix.longitude,
          speed: fix.speed,
          heading: fix.heading,
        });

        lastSendTimeRef.current = Date.now();
        consecutiveFailuresRef.current = 0;
        setLastSentAt(Date.now());
        setStatus('sharing');
        setError(null);
      } catch (err: any) {
        consecutiveFailuresRef.current += 1;
        const msg = err?.message || 'Network error';

        if (
          msg.includes('Location can only be reported') ||
          msg.includes('not active') ||
          msg.includes('TRIP_NOT_LIVE') ||
          msg.includes('TRIP_NOT_FOUND') ||
          msg.includes('you are not the driver') ||
          err?.code === 'TRIP_NOT_LIVE'
        ) {
          tripTerminatedRef.current = true;
          setStatus('error');
          setError('Trip is no longer active on the server.');
          if (subscriptionRef.current) {
            subscriptionRef.current.remove();
            subscriptionRef.current = null;
          }
          return;
        }

        if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
          setStatus('offline');
          setError('Location update failed. Checking connection...');
        }
        pendingFixRef.current = fix;
      } finally {
        isPostingRef.current = false;
        if (
          pendingFixRef.current &&
          !tripTerminatedRef.current &&
          Date.now() - lastSendTimeRef.current >= MIN_SEND_INTERVAL_MS
        ) {
          const next = pendingFixRef.current;
          pendingFixRef.current = null;
          sendFix(next, currentTripId);
        }
      }
    },
    []
  );

  const startTracking = useCallback(async () => {
    if (!USE_REAL_DRIVER_GPS || !isLive || !tripId) {
      setStatus('idle');
      return;
    }

    tripTerminatedRef.current = false;
    consecutiveFailuresRef.current = 0;
    setStatus('acquiring');
    setError(null);

    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setPermissionGranted(false);
        setStatus('permission_needed');
        setError('Location permission is needed to share the bus position.');
        return;
      }

      setPermissionGranted(true);

      // Keep screen awake while tracking
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});

      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (loc) => {
          if (tripTerminatedRef.current) return;

          // Convert m/s to km/h, treat negative speed/heading as null
          const rawSpeed = loc.coords.speed;
          const speedKmh =
            rawSpeed !== null && rawSpeed !== undefined && rawSpeed >= 0
              ? Math.round(rawSpeed * 3.6)
              : null;

          const rawHeading = loc.coords.heading;
          const heading =
            rawHeading !== null && rawHeading !== undefined && rawHeading >= 0
              ? Math.round(rawHeading)
              : null;

          const fix: LocationFix = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speed: speedKmh,
            heading,
            accuracy: loc.coords.accuracy ? Math.round(loc.coords.accuracy) : null,
            timestamp: loc.timestamp,
          };

          setLastFix(fix);
          sendFix(fix, tripId);
        }
      );
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'Failed to start GPS tracking.');
    }
  }, [isLive, tripId, sendFix]);

  useEffect(() => {
    if (isLive && tripId && USE_REAL_DRIVER_GPS) {
      startTracking();
    } else {
      setStatus('idle');
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [isLive, tripId, startTracking]);

  const retry = useCallback(() => {
    startTracking();
  }, [startTracking]);

  return {
    status,
    lastFix,
    lastSentAt,
    error,
    permissionGranted,
    retry,
    openSettings,
  };
}
