import { transportRepository, ITransportRepository } from './transport.repository.js';
import { UpdateLocationInput } from './transport.schema.js';
import { findClosestStop, calculateStopsRemaining, fetchRoadGeometry } from './transport.utils.js';

export interface LiveLocationTelemetry {
  tripId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  updatedAt: string | Date | null;
}

export type RouteTelemetryPayload =
  | {
      type: 'TRIP_STARTED';
      trip: {
        id: string;
        tripType: string;
        status: string;
        startedAt: string | Date | null;
      };
    }
  | {
      type: 'LOCATION_UPDATE';
      tripId: string;
      location: LiveLocationTelemetry;
      currentStop: { id: string; name: string; sequence: number } | null;
    }
  | {
      type: 'TRIP_ENDED';
      tripId: string;
      status: string;
    };

type RouteSubscriber = (data: RouteTelemetryPayload) => void;

class RoutePubSub {
  private channels = new Map<string, Set<RouteSubscriber>>();

  subscribe(routeId: string, cb: RouteSubscriber): () => void {
    if (!this.channels.has(routeId)) {
      this.channels.set(routeId, new Set());
    }
    this.channels.get(routeId)!.add(cb);
    return () => {
      const set = this.channels.get(routeId);
      if (set) {
        set.delete(cb);
        if (set.size === 0) this.channels.delete(routeId);
      }
    };
  }

  broadcast(routeId: string, data: RouteTelemetryPayload) {
    const set = this.channels.get(routeId);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.warn('[RoutePubSub] Subscriber error:', err);
        }
      });
    }
  }
}

export const routePubSub = new RoutePubSub();

export class TransportService {
  constructor(private repo: ITransportRepository = transportRepository) {}

  public async getDriverAssignment(institutionCode: string, driverId: string) {
    const route = await this.repo.getDriverRoute(institutionCode, driverId);
    if (!route) {
      const liveTrip = await this.repo.getLiveTripByDriver(institutionCode, driverId);
      return {
        route: null,
        vehicle: null,
        stops: [],
        hasLiveTrip: !!liveTrip,
        liveTrip: liveTrip || null,
      };
    }

    const [vehicle, stops, liveTrip] = await Promise.all([
      route.vehicleId ? this.repo.getVehicleById(route.vehicleId) : Promise.resolve(undefined),
      this.repo.getStopsByRoute(institutionCode, route.id),
      this.repo.getLiveTripByDriver(institutionCode, driverId),
    ]);

    return {
      route: {
        id: route.id,
        name: route.name,
      },
      vehicle: vehicle
        ? {
            id: vehicle.id,
            registrationNo: vehicle.registrationNo,
            capacity: vehicle.capacity,
            status: vehicle.status,
          }
        : null,
      stops: stops.map((s) => ({
        id: s.id,
        name: s.name,
        latitude: Number(s.latitude),
        longitude: Number(s.longitude),
        sequence: s.sequence,
      })),
      hasLiveTrip: !!liveTrip,
      liveTrip: liveTrip
        ? {
            id: liveTrip.id,
            tripType: liveTrip.tripType,
            status: liveTrip.status,
            startedAt: liveTrip.startedAt,
          }
        : null,
    };
  }

  public async startTrip(
    institutionCode: string,
    driverId: string,
    tripType: 'pickup' | 'dropoff' = 'pickup'
  ) {
    const existingLive = await this.repo.getLiveTripByDriver(institutionCode, driverId);
    if (existingLive) {
      throw {
        statusCode: 400,
        code: 'ACTIVE_TRIP_EXISTS',
        message: 'Driver already has an active live trip. End it before starting a new one.',
      };
    }

    const route = await this.repo.getDriverRoute(institutionCode, driverId);
    if (!route) {
      throw {
        statusCode: 400,
        code: 'NO_ASSIGNED_ROUTE',
        message: 'Driver is not assigned to any bus route in this institution.',
      };
    }

    let trip;
    try {
      trip = await this.repo.createTrip({
        institutionCode,
        routeId: route.id,
        driverId,
        tripType,
      });
    } catch (err: any) {
      if (err?.code === '23505' || err?.message?.includes('uq_bus_trips_live_driver')) {
        throw {
          statusCode: 400,
          code: 'ACTIVE_TRIP_EXISTS',
          message: 'Driver already has an active live trip. End it before starting a new one.',
        };
      }
      throw err;
    }

    routePubSub.broadcast(route.id, {
      type: 'TRIP_STARTED',
      trip: {
        id: trip.id,
        tripType: trip.tripType,
        status: trip.status,
        startedAt: trip.startedAt,
      },
    });

    return {
      id: trip.id,
      routeId: trip.routeId,
      driverId: trip.driverId,
      tripType: trip.tripType,
      status: trip.status,
      startedAt: trip.startedAt,
    };
  }

  public async updateTripLocation(
    institutionCode: string,
    driverId: string,
    tripId: string,
    input: UpdateLocationInput
  ) {
    const trip = await this.repo.getTripById(tripId);
    if (!trip) {
      throw { statusCode: 404, code: 'TRIP_NOT_FOUND', message: 'Trip not found' };
    }

    if (trip.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied: trip belongs to another institution' };
    }

    if (trip.driverId !== driverId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied: you are not the driver assigned to this trip' };
    }

    if (trip.status !== 'live') {
      throw { statusCode: 400, code: 'TRIP_NOT_LIVE', message: 'Location can only be reported for active live trips' };
    }

    const loc = await this.repo.upsertLocation({
      tripId,
      latitude: input.latitude,
      longitude: input.longitude,
      speed: input.speed,
      heading: input.heading,
    });

    const locationData = {
      tripId: loc.tripId,
      latitude: Number(loc.latitude),
      longitude: Number(loc.longitude),
      speed: loc.speed !== null && loc.speed !== undefined ? Number(loc.speed) : null,
      heading: loc.heading !== null && loc.heading !== undefined ? Number(loc.heading) : null,
      updatedAt: loc.updatedAt,
    };

    // Calculate geofence arrival detection
    const routeStops = await this.repo.getStopsByRoute(institutionCode, trip.routeId);
    const formattedStops = routeStops.map((s) => ({
      id: s.id,
      name: s.name,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      sequence: s.sequence,
    }));
    const closest = findClosestStop({ latitude: locationData.latitude, longitude: locationData.longitude }, formattedStops);

    // Push live update to SSE subscribers of this route
    routePubSub.broadcast(trip.routeId, {
      type: 'LOCATION_UPDATE',
      tripId,
      location: locationData,
      currentStop: closest ? { id: closest.id, name: closest.name, sequence: closest.sequence } : null,
    });

    return locationData;
  }

  public async endTrip(institutionCode: string, driverId: string, tripId: string) {
    const trip = await this.repo.getTripById(tripId);
    if (!trip) {
      throw { statusCode: 404, code: 'TRIP_NOT_FOUND', message: 'Trip not found' };
    }

    if (trip.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied: trip belongs to another institution' };
    }

    if (trip.driverId !== driverId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied: you are not the driver assigned to this trip' };
    }

    if (trip.status !== 'live') {
      return {
        id: trip.id,
        status: 'completed',
        endedAt: trip.endedAt || new Date(),
      };
    }

    const updated = await this.repo.endTrip(tripId);

    routePubSub.broadcast(trip.routeId, {
      type: 'TRIP_ENDED',
      tripId,
      status: 'completed',
    });

    return {
      id: updated?.id || trip.id,
      status: updated?.status || 'completed',
      endedAt: updated?.endedAt,
    };
  }

  public async getMyBus(institutionCode: string, userId: string, role: string) {
    let studentId = userId;

    if (role === 'parent') {
      const parent = await this.repo.findUserByIdOrUid(userId);
      if (!parent) {
        throw { statusCode: 404, code: 'PARENT_NOT_FOUND', message: 'Parent account not found' };
      }

      let scope: Record<string, any> = {};
      if (typeof parent.scope === 'string') {
        try {
          scope = JSON.parse(parent.scope);
        } catch {
          scope = {};
        }
      } else if (parent.scope) {
        scope = parent.scope;
      }

      const linkedUsn = scope.linkedStudentUSN;
      if (!linkedUsn) {
        throw {
          statusCode: 404,
          code: 'NO_LINKED_STUDENT',
          message: 'No linked student found in parent profile. Please complete student linking.',
        };
      }

      const child = await this.repo.findStudentByUsn(institutionCode, linkedUsn);
      if (!child) {
        throw {
          statusCode: 404,
          code: 'STUDENT_NOT_FOUND',
          message: `Linked student with USN ${linkedUsn} was not found in this institution.`,
        };
      }
      studentId = child.id;
    }

    const assignment = await this.repo.getStudentTransportAssignment(institutionCode, studentId);
    if (!assignment) {
      throw {
        statusCode: 404,
        code: 'TRANSPORT_NOT_ASSIGNED',
        message: role === 'parent' ? 'No active bus transport assigned to your child.' : 'No active bus transport assigned to you.',
      };
    }

    const [route, stop, routeStops] = await Promise.all([
      this.repo.getRouteById(assignment.routeId),
      this.repo.getStopById(assignment.stopId),
      this.repo.getStopsByRoute(institutionCode, assignment.routeId),
    ]);

    const formattedStops = routeStops.map((s) => ({
      id: s.id,
      name: s.name,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      sequence: s.sequence,
    }));

    // Fetch real road-following geometry via OSRM (Gap 3)
    const roadPath = await fetchRoadGeometry(formattedStops);

    const vehicle = route?.vehicleId ? await this.repo.getVehicleById(route.vehicleId) : null;
    const liveTrip = await this.repo.getLiveTripByRoute(institutionCode, assignment.routeId);

    if (!liveTrip) {
      return {
        isLive: false,
        route: route ? { id: route.id, name: route.name } : null,
        stop: stop
          ? {
              id: stop.id,
              name: stop.name,
              latitude: Number(stop.latitude),
              longitude: Number(stop.longitude),
              sequence: stop.sequence,
            }
          : null,
        stops: formattedStops,
        roadPath,
        currentStop: null,
        stopsRemaining: null,
        vehicle: vehicle
          ? {
              id: vehicle.id,
              registrationNo: vehicle.registrationNo,
              capacity: vehicle.capacity,
              status: vehicle.status,
            }
          : null,
        trip: null,
        location: null,
      };
    }

    const location = await this.repo.getLatestLocation(liveTrip.id);

    let currentStop: { id: string; name: string; sequence: number } | null = null;
    let stopsRemaining: number | null = null;

    if (location && formattedStops.length > 0) {
      const busCoords = {
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
      };
      const closest = findClosestStop(busCoords, formattedStops);

      if (closest) {
        currentStop = {
          id: closest.id,
          name: closest.name,
          sequence: closest.sequence,
        };

        if (stop) {
          stopsRemaining = calculateStopsRemaining(stop.sequence, closest.sequence, liveTrip.tripType);
        }
      }
    }

    return {
      isLive: true,
      route: route ? { id: route.id, name: route.name } : null,
      stop: stop
        ? {
            id: stop.id,
            name: stop.name,
            latitude: Number(stop.latitude),
            longitude: Number(stop.longitude),
            sequence: stop.sequence,
          }
        : null,
      stops: formattedStops,
      roadPath,
      currentStop,
      stopsRemaining,
      vehicle: vehicle
        ? {
            id: vehicle.id,
            registrationNo: vehicle.registrationNo,
            capacity: vehicle.capacity,
            status: vehicle.status,
          }
        : null,
      trip: {
        id: liveTrip.id,
        tripType: liveTrip.tripType,
        status: liveTrip.status,
        startedAt: liveTrip.startedAt,
      },
      location: location
        ? {
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            speed: location.speed !== null && location.speed !== undefined ? Number(location.speed) : null,
            heading: location.heading !== null && location.heading !== undefined ? Number(location.heading) : null,
            updatedAt: location.updatedAt,
          }
        : null,
    };
  }
}

export const transportService = new TransportService();
