/**
 * Pure transport calculations and validation functions
 */

export interface StopCoordinate {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Validates coordinate bounds.
 * Latitude must be in [-90, 90], Longitude in [-180, 180].
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Calculates Great-Circle distance in kilometers using the Haversine formula.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Radius in km within which the bus is considered to have "arrived" at a stop.
 * 0.15 km = 150 metres — tight enough to be accurate, forgiving enough for GPS drift.
 */
const ARRIVAL_RADIUS_KM = 0.15;

/**
 * Finds the closest stop to current bus coordinates using Haversine distance.
 * Returns null when the bus is not within ARRIVAL_RADIUS_KM of any stop,
 * meaning the bus is in transit between stops.
 */
export function findClosestStop(
  busCoords: LatLng,
  stops: StopCoordinate[]
): StopCoordinate | null {
  if (!stops || stops.length === 0) return null;

  let minDistance = Infinity;
  let closest: StopCoordinate | null = null;

  for (const stop of stops) {
    const dist = haversineDistanceKm(
      busCoords.latitude,
      busCoords.longitude,
      stop.latitude,
      stop.longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
      closest = stop;
    }
  }

  // Only report arrival if the bus is actually within the geofence radius.
  // Returns null when bus is between stops (in transit).
  return minDistance <= ARRIVAL_RADIUS_KM ? closest : null;
}

/**
 * Calculates remaining stops between current closest stop and student boarding stop.
 * > 0 : Upcoming stops
 * 0   : At the student stop
 * < 0 : Bus has already passed the stop
 */
export function calculateStopsRemaining(
  studentStopSequence: number,
  currentStopSequence: number
): number {
  return studentStopSequence - currentStopSequence;
}
