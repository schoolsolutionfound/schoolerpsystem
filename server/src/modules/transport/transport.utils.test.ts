import { describe, it, expect } from 'vitest';
import {
  validateCoordinates,
  haversineDistanceKm,
  findClosestStop,
  calculateStopsRemaining,
  StopCoordinate,
} from './transport.utils';



describe('Transport Pure Logic Unit Tests', () => {
  describe('validateCoordinates', () => {
    it('validates normal geographic coordinates within range', () => {
      expect(validateCoordinates(25.2048, 55.2708)).toBe(true); // Dubai
      expect(validateCoordinates(-90, 0)).toBe(true); // South Pole
      expect(validateCoordinates(90, 0)).toBe(true); // North Pole
      expect(validateCoordinates(0, -180)).toBe(true); // Date line West
      expect(validateCoordinates(0, 180)).toBe(true); // Date line East
    });

    it('rejects coordinates out of bounds', () => {
      expect(validateCoordinates(90.1, 55.0)).toBe(false);
      expect(validateCoordinates(-90.001, 55.0)).toBe(false);
      expect(validateCoordinates(25.0, 180.001)).toBe(false);
      expect(validateCoordinates(25.0, -180.1)).toBe(false);
    });

    it('rejects non-numeric or NaN inputs', () => {
      expect(validateCoordinates(NaN, 55.0)).toBe(false);
      expect(validateCoordinates(25.0, NaN)).toBe(false);
      // @ts-expect-error test invalid types
      expect(validateCoordinates(null, 55.0)).toBe(false);
      // @ts-expect-error test invalid types
      expect(validateCoordinates(undefined, 55.0)).toBe(false);
    });
  });

  describe('haversineDistanceKm', () => {
    it('returns 0 distance for identical coordinates', () => {
      const dist = haversineDistanceKm(25.2048, 55.2708, 25.2048, 55.2708);
      expect(dist).toBeCloseTo(0, 5);
    });

    it('calculates approximately correct distance between known points', () => {
      // Dubai (25.2048, 55.2708) to Abu Dhabi (24.4539, 54.3773) is roughly 120-135 km
      const dist = haversineDistanceKm(25.2048, 55.2708, 24.4539, 54.3773);
      expect(dist).toBeGreaterThan(120);
      expect(dist).toBeLessThan(140);
    });

    it('calculates small distances accurately in km', () => {
      // 1 degree latitude is approximately 111 km
      const dist = haversineDistanceKm(25.0, 55.0, 26.0, 55.0);
      expect(dist).toBeCloseTo(111.19, 1);
    });
  });

  describe('findClosestStop', () => {
    const mockStops: StopCoordinate[] = [
      { id: '1', name: 'Stop A', latitude: 25.2000, longitude: 55.2700, sequence: 1 },
      { id: '2', name: 'Stop B', latitude: 25.2100, longitude: 55.2800, sequence: 2 },
      { id: '3', name: 'Stop C', latitude: 25.2200, longitude: 55.2900, sequence: 3 },
    ];

    it('returns null if stop list is empty', () => {
      expect(findClosestStop({ latitude: 25.2000, longitude: 55.2700 }, [])).toBeNull();
    });

    it('returns null when bus is far from all stops (in transit between stops)', () => {
      // Bus is ~2.5 km away from all stops — should NOT report any stop arrival
      const busInTransit = { latitude: 25.1800, longitude: 55.2500 };
      expect(findClosestStop(busInTransit, mockStops)).toBeNull();
    });

    it('finds the nearest stop when bus is within 150m arrival radius', () => {
      // Bus is ~30m from Stop B
      const closest = findClosestStop({ latitude: 25.2098, longitude: 55.2799 }, mockStops);
      expect(closest).not.toBeNull();
      expect(closest?.id).toBe('2');
      expect(closest?.name).toBe('Stop B');
    });

    it('finds Stop A when bus is right at Stop A coordinates', () => {
      const closest = findClosestStop({ latitude: 25.2000, longitude: 55.2700 }, mockStops);
      expect(closest?.id).toBe('1');
    });
  });

  describe('calculateStopsRemaining', () => {
    it('returns positive number when bus is before the student stop', () => {
      // Bus is at stop 1, student is at stop 3 -> 2 stops remaining
      expect(calculateStopsRemaining(3, 1)).toBe(2);
      expect(calculateStopsRemaining(5, 2)).toBe(3);
    });

    it('returns 0 when bus is at the student stop', () => {
      expect(calculateStopsRemaining(3, 3)).toBe(0);
    });

    it('returns negative number when bus has passed the student stop', () => {
      // Bus is at stop 4, student was at stop 2 -> -2
      expect(calculateStopsRemaining(2, 4)).toBe(-2);
    });
  });
});
