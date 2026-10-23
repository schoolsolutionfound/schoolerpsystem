import { apiClient, getApiBaseUrl } from './client';
import { auth } from '../firebaseConfig';

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
  roadPath?: { latitude: number; longitude: number }[];
  currentStop: { id: string; name: string; sequence: number } | null;
  stopsRemaining: number | null;
  vehicle: BusVehicle | null;
  trip: LiveTrip | null;
  location: BusLocation | null;
}

/**
 * Fetch assigned route, vehicle, stops, and live trip status for the authenticated driver.
 */
export async function getDriverAssignmentApi(): Promise<DriverAssignmentData> {
  return apiClient<DriverAssignmentData>('/transport/driver/assignment');
}

/**
 * Start a new live trip (pickup or dropoff).
 */
export async function startDriverTripApi(tripType: 'pickup' | 'dropoff' = 'pickup'): Promise<LiveTrip> {
  return apiClient<LiveTrip>('/transport/driver/trips/start', {
    method: 'POST',
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
    body: JSON.stringify(coords),
  });
}

/**
 * End an active trip.
 */
export async function endDriverTripApi(tripId: string): Promise<{ id: string; status: string; endedAt: string }> {
  return apiClient(`/transport/driver/trips/${tripId}/end`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Fetch live bus tracking info for the logged-in student or parent.
 */
export async function getMyBusApi(): Promise<MyBusData> {
  return apiClient<MyBusData>('/transport/my-bus');
}

export type BusTelemetryEvent =
  | { type: 'INITIAL'; data: MyBusData }
  | {
      type: 'LOCATION_UPDATE';
      tripId: string;
      location: BusLocation;
      currentStop: { id: string; name: string; sequence: number } | null;
    }
  | { type: 'TRIP_STARTED'; trip: LiveTrip }
  | { type: 'TRIP_ENDED'; tripId: string; status: string };

/**
 * Subscribes to live Server-Sent Events (SSE) bus telemetry stream.
 * Pushes updates with zero-latency when the driver broadcasts a GPS fix.
 */
export function subscribeToBusStream(
  onMessage: (payload: BusTelemetryEvent) => void,
  onError?: (err: any) => void
): () => void {
  let isClosed = false;
  let xhr: XMLHttpRequest | null = null;
  let reconnectTimeout: any = null;

  function scheduleReconnect(delay: number) {
    if (isClosed) return;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;
      void connect();
    }, delay);
  }

  async function connect() {
    if (isClosed) return;
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : '';
      if (!token) {
        onError?.(new Error('Not authenticated'));
        return;
      }
      if (isClosed) return;

      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/transport/stream`;
      xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');

      let lastIndex = 0;
      let buffer = '';
      xhr.onprogress = () => {
        if (isClosed) return;
        const responseText = xhr?.responseText || '';
        buffer += responseText.substring(lastIndex);
        lastIndex = responseText.length;

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const event of events) {
          for (const line of event.split('\n')) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr) {
                try {
                  onMessage(JSON.parse(jsonStr));
                } catch {
                  // Ignore malformed event payloads.
                }
              }
            }
          }
        }
      };

      xhr.onerror = () => {
        if (!isClosed) {
          onError?.(new Error('SSE stream disconnected'));
          scheduleReconnect(4000);
        }
      };

      xhr.onloadend = () => {
        if (!isClosed) {
          scheduleReconnect(3000);
        }
      };

      xhr.send();
    } catch (err) {
      if (!isClosed) {
        onError?.(err);
        scheduleReconnect(4000);
      }
    }
  }

  void connect();

  return () => {
    isClosed = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (xhr) {
      try {
        xhr.abort();
      } catch {}
      xhr = null;
    }
  };
}
