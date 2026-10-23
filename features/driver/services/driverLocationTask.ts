import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateDriverLocationApi } from '../../../api/transport';

export const DRIVER_LOCATION_TASK = 'DRIVER_LIVE_LOCATION_TASK';
const STORAGE_KEY_ACTIVE_TRIP = '@driver_active_trip_id';
const MIN_SEND_INTERVAL_MS = 4000;

export interface LocationFix {
  latitude: number;
  longitude: number;
  speed: number | null; // km/h
  heading: number | null; // 0-360 deg
  accuracy: number | null; // meters
  timestamp: number;
}

type LocationListener = (fix: LocationFix) => void;

let memoryActiveTripId: string | null = null;
let lastSendTimestamp = 0;
const listeners = new Set<LocationListener>();

export function subscribeToLocationFixes(listener: LocationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setActiveTripIdInMemory(tripId: string | null) {
  memoryActiveTripId = tripId;
  if (tripId) {
    AsyncStorage.setItem(STORAGE_KEY_ACTIVE_TRIP, tripId).catch(() => {});
  } else {
    AsyncStorage.removeItem(STORAGE_KEY_ACTIVE_TRIP).catch(() => {});
  }
}

async function resolveActiveTripId(): Promise<string | null> {
  if (memoryActiveTripId) return memoryActiveTripId;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_ACTIVE_TRIP);
    if (stored) {
      memoryActiveTripId = stored;
      return stored;
    }
  } catch {
    // Ignore storage read error
  }
  return null;
}

// Top-level Task definition for Expo TaskManager
if (!TaskManager.isTaskDefined(DRIVER_LOCATION_TASK)) {
  TaskManager.defineTask(DRIVER_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.warn('[DriverLocationTask] Background location error:', error.message);
      return;
    }

    if (data) {
      const { locations } = data as { locations: Location.LocationObject[] };
      if (!locations || locations.length === 0) return;

      const latest = locations[locations.length - 1];
      const now = Date.now();

      // Convert m/s to km/h
      const rawSpeed = latest.coords.speed;
      const speedKmh =
        rawSpeed !== null && rawSpeed !== undefined && rawSpeed >= 0
          ? Math.round(rawSpeed * 3.6)
          : null;

      const rawHeading = latest.coords.heading;
      const heading =
        rawHeading !== null && rawHeading !== undefined && rawHeading >= 0
          ? Math.round(rawHeading)
          : null;

      const fix: LocationFix = {
        latitude: latest.coords.latitude,
        longitude: latest.coords.longitude,
        speed: speedKmh,
        heading,
        accuracy: latest.coords.accuracy ? Math.round(latest.coords.accuracy) : null,
        timestamp: latest.timestamp,
      };

      // Notify any active in-app UI listeners immediately
      listeners.forEach((listener) => {
        try {
          listener(fix);
        } catch (err) {
          console.warn('[DriverLocationTask] Listener error:', err);
        }
      });

      // Throttle network POSTs to server
      if (now - lastSendTimestamp < MIN_SEND_INTERVAL_MS) {
        return;
      }

      const currentTripId = await resolveActiveTripId();
      if (!currentTripId) {
        return;
      }

      try {
        await updateDriverLocationApi(currentTripId, {
          latitude: fix.latitude,
          longitude: fix.longitude,
          speed: fix.speed,
          heading: fix.heading,
        });
        lastSendTimestamp = Date.now();
      } catch (err: any) {
        const msg = err?.message || '';
        // If trip was ended on server, stop background tracking
        if (
          msg.includes('Location can only be reported') ||
          msg.includes('not active') ||
          msg.includes('TRIP_NOT_LIVE') ||
          msg.includes('TRIP_NOT_FOUND')
        ) {
          console.warn('[DriverLocationTask] Trip concluded on server. Stopping updates.');
          stopDriverBackgroundLocation().catch(() => {});
        }
      }
    }
  });
}

/**
 * Starts continuous background location updates with persistent foreground service notification.
 */
export async function startDriverBackgroundLocation(tripId: string): Promise<boolean> {
  setActiveTripIdInMemory(tripId);

  const isAlreadyRegistered = await TaskManager.isTaskRegisteredAsync(DRIVER_LOCATION_TASK);
  if (isAlreadyRegistered) {
    return true;
  }

  try {
    await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
      distanceInterval: 10,
      showsBackgroundLocationIndicator: true, // iOS blue bar
      foregroundService: {
        notificationTitle: 'School Bus Trip in Progress',
        notificationBody: 'Broadcasting live location to students and parents',
        notificationColor: '#1A1B1C',
      },
      pausesUpdatesAutomatically: false,
    });
    return true;
  } catch (err: any) {
    console.warn('[DriverLocationTask] startLocationUpdatesAsync failed:', err?.message);
    return false;
  }
}

/**
 * Stops continuous background location updates and removes foreground notification.
 */
export async function stopDriverBackgroundLocation(): Promise<void> {
  setActiveTripIdInMemory(null);
  const isRegistered = await TaskManager.isTaskRegisteredAsync(DRIVER_LOCATION_TASK);
  if (isRegistered) {
    try {
      await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    } catch (err: any) {
      console.warn('[DriverLocationTask] stopLocationUpdatesAsync failed:', err?.message);
    }
  }
}

/**
 * Checks whether the background task is currently active.
 */
export async function isDriverBackgroundLocationActive(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(DRIVER_LOCATION_TASK);
}
