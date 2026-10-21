import { apiClient } from './client';

export interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
}

export interface BusVehicle {
  id: string;
  registrationNo: string;
  capacity: number;
  status: string;
}

export interface BusRoute {
  id: string;
  name: string;
}

export interface LiveTrip {
  id: string;
  tripType: 'pickup' | 'dropoff';
  status: string;
  startedAt: string;
}

export interface DriverAssignmentData {
  route: BusRoute | null;
  vehicle: BusVehicle | null;
  stops: BusStop[];
  hasLiveTrip: boolean;
  liveTrip: LiveTrip | null;
}

export interface BusLocation {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  updatedAt: string;
}

export interface MyBusData {
  isLive: boolean;
  route: BusRoute | null;
  stop: BusStop | null;
  stops: BusStop[];
  currentStop: { id: string; name: string; sequence: number } | null;
  stopsRemaining: number | null;
  vehicle: BusVehicle | null;
  trip: LiveTrip | null;
  location: BusLocation | null;
}

const DRIVER_TOKEN = 'Bearer dev-hardcoded-driver-token';
const STUDENT_TOKEN = 'Bearer dev-hardcoded-student-token';

/**
 * Fetch assigned route, vehicle, stops, and live trip status for the authenticated driver.
 */
export async function getDriverAssignmentApi(): Promise<DriverAssignmentData> {
  return apiClient<DriverAssignmentData>('/transport/driver/assignment', {
    headers: { Authorization: DRIVER_TOKEN },
  });
}

/**
 * Start a new live trip (pickup or dropoff).
 */
export async function startDriverTripApi(tripType: 'pickup' | 'dropoff' = 'pickup'): Promise<LiveTrip> {
  return apiClient<LiveTrip>('/transport/driver/trips/start', {
    method: 'POST',
    headers: { Authorization: DRIVER_TOKEN },
    body: JSON.stringify({ tripType }),
  });
}

/**
 * Send driver GPS coordinate updates to backend.
 */
export async function updateDriverLocationApi(
  tripId: string,
  coords: { latitude: number; longitude: number; speed?: number | null; heading?: number | null }
): Promise<{ tripId: string; latitude: number; longitude: number; speed?: number | null; heading?: number | null; updatedAt: string }> {
  return apiClient(`/transport/driver/trips/${tripId}/location`, {
    method: 'POST',
    headers: { Authorization: DRIVER_TOKEN },
    body: JSON.stringify(coords),
  });
}

/**
 * End an active trip.
 */
export async function endDriverTripApi(tripId: string): Promise<{ id: string; status: string; endedAt: string }> {
  return apiClient(`/transport/driver/trips/${tripId}/end`, {
    method: 'POST',
    headers: { Authorization: DRIVER_TOKEN },
    body: JSON.stringify({}),
  });
}

/**
 * Fetch live bus tracking info for the logged-in student or parent.
 */
export async function getMyBusApi(tokenOverride?: string): Promise<MyBusData> {
  return apiClient<MyBusData>('/transport/my-bus', {
    headers: { Authorization: tokenOverride ? `Bearer ${tokenOverride}` : STUDENT_TOKEN },
  });
}
