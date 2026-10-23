import { useState, useEffect, useRef, useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { updateDriverLocationApi } from '../../../api/transport';
import { USE_REAL_DRIVER_GPS } from '../../../constants/featureFlags';
import {
  startDriverBackgroundLocation,
  stopDriverBackgroundLocation,
  subscribeToLocationFixes,
  LocationFix,
} from '../services/driverLocationTask';

export type GpsBroadcastStatus =
  | 'idle'
  | 'acquiring'
  | 'sharing'
  | 'offline'
  | 'permission_needed'
  | 'error';

export { LocationFix };

export interface UseDriverLocationBroadcastReturn {
  status: GpsBroadcastStatus;
  lastFix: LocationFix | null;
  lastSentAt: number | null;
  error: string | null;
  permissionGranted: boolean;
  isBackgroundEnabled: boolean;
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
  const [isBackgroundEnabled, setIsBackgroundEnabled] = useState<boolean>(false);

  const foregroundSubRef = useRef<Location.LocationSubscription | null>(null);
  const backgroundUnsubRef = useRef<(() => void) | null>(null);
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
          if (foregroundSubRef.current) {
            foregroundSubRef.current.remove();
            foregroundSubRef.current = null;
          }
          stopDriverBackgroundLocation().catch(() => {});
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
      // 1. Request foreground location permission
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        setPermissionGranted(false);
        setStatus('permission_needed');
        setError('Location permission is needed to broadcast the bus position.');
        return;
      }

      setPermissionGranted(true);
      activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});

      // 2. Attempt background permission & background TaskManager updates
      let bgStarted = false;
      if (Platform.OS !== 'web') {
        try {
          const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
          if (bgStatus === 'granted') {
            bgStarted = await startDriverBackgroundLocation(tripId);
          }
        } catch (bgErr) {
          console.warn('[useDriverLocationBroadcast] Background permission check skipped:', bgErr);
        }
      }

      if (bgStarted) {
        setIsBackgroundEnabled(true);
        setStatus('sharing');

        // Subscribe to background task fixes to update local UI
        if (backgroundUnsubRef.current) backgroundUnsubRef.current();
        backgroundUnsubRef.current = subscribeToLocationFixes((fix) => {
          setLastFix(fix);
          setLastSentAt(Date.now());
          setStatus('sharing');
        });
        return;
      }

      // 3. Graceful fallback to foreground watch if background is unsupported/denied
      setIsBackgroundEnabled(false);
      if (foregroundSubRef.current) {
        foregroundSubRef.current.remove();
      }

      foregroundSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (loc) => {
          if (tripTerminatedRef.current) return;

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
      setIsBackgroundEnabled(false);
      if (foregroundSubRef.current) {
        foregroundSubRef.current.remove();
        foregroundSubRef.current = null;
      }
      if (backgroundUnsubRef.current) {
        backgroundUnsubRef.current();
        backgroundUnsubRef.current = null;
      }
      stopDriverBackgroundLocation().catch(() => {});
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    }

    return () => {
      if (foregroundSubRef.current) {
        foregroundSubRef.current.remove();
        foregroundSubRef.current = null;
      }
      if (backgroundUnsubRef.current) {
        backgroundUnsubRef.current();
        backgroundUnsubRef.current = null;
      }
      stopDriverBackgroundLocation().catch(() => {});
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
    isBackgroundEnabled,
    retry,
    openSettings,
  };
}
