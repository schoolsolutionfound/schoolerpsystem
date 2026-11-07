import { transportRepository, ITransportRepository } from './transport.repository.js';
import {
  UpdateLocationInput,
  CreateRouteInput,
  UpdateRouteInput,
  CreateStopInput,
  UpdateStopInput,
  CreateVehicleInput,
  UpdateVehicleInput,
  AssignStudentTransportInput,
} from './transport.schema.js';
import { getPrimaryParentChild } from '../users/parent-links.js';
import {
  findClosestStop,
  findNearestStop,
  calculateStopsRemaining,
  fetchRoadGeometry,
} from './transport.utils.js';

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

  private async resolveUserId(uid: string): Promise<string> {
    const user = await this.repo.findUserByIdOrUid(uid);
    return user?.id || uid;
  }

  public async getDriverAssignment(institutionCode: string, driverUid: string) {
    const driverId = await this.resolveUserId(driverUid);
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
    driverUid: string,
    tripType: 'pickup' | 'dropoff' = 'pickup'
  ) {
    const driverId = await this.resolveUserId(driverUid);
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
    driverUid: string,
    tripId: string,
    input: UpdateLocationInput
  ) {
    const driverId = await this.resolveUserId(driverUid);
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

  public async endTrip(institutionCode: string, driverUid: string, tripId: string) {
    const driverId = await this.resolveUserId(driverUid);
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
    let studentId = await this.resolveUserId(userId);

    if (role === 'parent') {
      const parent = await this.repo.findUserByIdOrUid(userId);
      if (!parent) {
        throw { statusCode: 404, code: 'PARENT_NOT_FOUND', message: 'Parent account not found' };
      }

      // Parents are linked through `parent_child_links` (the table fees,
      // library and marks read); the scope USN is only a legacy fallback.
      let childId = (await getPrimaryParentChild(parent.id))?.studentId;
      if (!childId) {
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
        if (linkedUsn) {
          childId = (await this.repo.findStudentByUsn(institutionCode, linkedUsn))?.id;
        }
      }
      if (!childId) {
        throw {
          statusCode: 404,
          code: 'NO_LINKED_STUDENT',
          message: 'No linked student found in parent profile. Please complete student linking.',
        };
      }
      studentId = childId;
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
      const nearest = closest ?? findNearestStop(busCoords, formattedStops);

      // "Arrived" is only reported inside the geofence, but the ETA should stay
      // meaningful while the bus is in transit between stops.
      if (closest) {
        currentStop = {
          id: closest.id,
          name: closest.name,
          sequence: closest.sequence,
        };
      }

      if (nearest && stop) {
        stopsRemaining = calculateStopsRemaining(stop.sequence, nearest.sequence, liveTrip.tripType);
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

  // ==================================================================
  // Admin / admission transport management
  // ==================================================================

  private formatStop(stop: any) {
    return {
      id: stop.id,
      name: stop.name,
      latitude: Number(stop.latitude),
      longitude: Number(stop.longitude),
      sequence: stop.sequence,
    };
  }

  private formatVehicle(vehicle: any) {
    return {
      id: vehicle.id,
      registrationNo: vehicle.registrationNo,
      capacity: vehicle.capacity,
      status: vehicle.status,
    };
  }

  private async getOwnedRoute(institutionCode: string, routeId: string) {
    const route = await this.repo.getRouteById(routeId);
    if (!route || route.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'ROUTE_NOT_FOUND', message: 'Bus route not found in this institution.' };
    }
    return route;
  }

  private async getOwnedStop(institutionCode: string, stopId: string) {
    const stop = await this.repo.getStopById(stopId);
    if (!stop || stop.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'STOP_NOT_FOUND', message: 'Bus stop not found in this institution.' };
    }
    return stop;
  }

  private async assertDriver(institutionCode: string, driverId: string) {
    const drivers = await this.repo.listUsersByRole(institutionCode, 'driver');
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) {
      throw {
        statusCode: 400,
        code: 'DRIVER_NOT_FOUND',
        message: 'Selected driver does not exist in this institution.',
      };
    }
    return driver;
  }

  private async assertVehicle(institutionCode: string, vehicleId: string) {
    const vehicle = await this.repo.getVehicleById(vehicleId);
    if (!vehicle || vehicle.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw {
        statusCode: 400,
        code: 'VEHICLE_NOT_FOUND',
        message: 'Selected bus does not exist in this institution.',
      };
    }
    return vehicle;
  }

  public async getAdminOverview(institutionCode: string) {
    const [routes, vehicles, drivers, stops, assignments, liveTrips] = await Promise.all([
      this.repo.listRoutes(institutionCode),
      this.repo.listVehicles(institutionCode),
      this.repo.listUsersByRole(institutionCode, 'driver'),
      this.repo.listStopsByInstitution(institutionCode),
      this.repo.listAssignments(institutionCode),
      this.repo.listLiveTrips(institutionCode),
    ]);

    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
    const driverById = new Map(drivers.map((d) => [d.id, d]));
    const liveTripByRoute = new Map(liveTrips.map((trip) => [trip.routeId, trip]));

    const liveLocationByRoute = new Map<
      string,
      { latitude: number; longitude: number; speed: number | null; heading: number | null; updatedAt: Date | null }
    >();
    await Promise.all(
      liveTrips.map(async (trip) => {
        const location = await this.repo.getLatestLocation(trip.id);
        if (!location) return;
        liveLocationByRoute.set(trip.routeId, {
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
          speed: location.speed != null ? Number(location.speed) : null,
          heading: location.heading != null ? Number(location.heading) : null,
          updatedAt: location.updatedAt,
        });
      })
    );

    return {
      routes: routes.map((route) => {
        const vehicle = route.vehicleId ? vehicleById.get(route.vehicleId) : undefined;
        const driver = route.driverId ? driverById.get(route.driverId) : undefined;
        const liveTrip = liveTripByRoute.get(route.id);
        return {
          id: route.id,
          name: route.name,
          vehicleId: route.vehicleId || null,
          driverId: route.driverId || null,
          vehicle: vehicle ? this.formatVehicle(vehicle) : null,
          driver: driver || null,
          stops: stops
            .filter((s) => s.routeId === route.id)
            .sort((a, b) => a.sequence - b.sequence)
            .map((s) => this.formatStop(s)),
          assignments: assignments.filter((a) => a.routeId === route.id),
          liveTrip: liveTrip
            ? {
                id: liveTrip.id,
                tripType: liveTrip.tripType,
                status: liveTrip.status,
                startedAt: liveTrip.startedAt,
              }
            : null,
          location: liveLocationByRoute.get(route.id) || null,
        };
      }),
      vehicles: vehicles.map((v) => this.formatVehicle(v)),
      drivers,
    };
  }

  public async createRoute(institutionCode: string, input: CreateRouteInput) {
    if (input.vehicleId) await this.assertVehicle(institutionCode, input.vehicleId);
    if (input.driverId) await this.assertDriver(institutionCode, input.driverId);
    const route = await this.repo.createRoute(institutionCode, {
      name: input.name,
      vehicleId: input.vehicleId ?? null,
      driverId: input.driverId ?? null,
    });
    // A bus and a driver each belong to exactly one route. Moving either one
    // here unlinks it from any previous route so live trips resolve correctly.
    if (input.driverId) {
      await this.repo.detachDriverFromOtherRoutes(institutionCode, input.driverId, route.id);
    }
    if (input.vehicleId) {
      await this.repo.detachVehicleFromOtherRoutes(institutionCode, input.vehicleId, route.id);
    }
    return route;
  }

  public async updateRoute(institutionCode: string, routeId: string, input: UpdateRouteInput) {
    await this.getOwnedRoute(institutionCode, routeId);
    if (input.vehicleId) await this.assertVehicle(institutionCode, input.vehicleId);
    if (input.driverId) await this.assertDriver(institutionCode, input.driverId);
    const updated = await this.repo.updateRoute(institutionCode, routeId, input);
    if (!updated) throw { statusCode: 404, code: 'ROUTE_NOT_FOUND', message: 'Bus route not found.' };
    if (input.driverId) {
      await this.repo.detachDriverFromOtherRoutes(institutionCode, input.driverId, routeId);
    }
    if (input.vehicleId) {
      await this.repo.detachVehicleFromOtherRoutes(institutionCode, input.vehicleId, routeId);
    }
    return updated;
  }

  public async deleteRoute(institutionCode: string, routeId: string) {
    await this.getOwnedRoute(institutionCode, routeId);
    if (await this.repo.routeHasTrips(routeId)) {
      throw {
        statusCode: 409,
        code: 'ROUTE_HAS_TRIPS',
        message: 'This route has trip history and cannot be deleted. Rename it or reassign the driver instead.',
      };
    }
    const deleted = await this.repo.deleteRoute(institutionCode, routeId);
    if (!deleted) throw { statusCode: 404, code: 'ROUTE_NOT_FOUND', message: 'Bus route not found.' };
    return { id: routeId, deleted: true };
  }

  public async createVehicle(institutionCode: string, input: CreateVehicleInput) {
    try {
      const vehicle = await this.repo.createVehicle(institutionCode, input);
      return this.formatVehicle(vehicle);
    } catch (err: any) {
      if (err?.code === '23505' || String(err?.message || '').includes('duplicate key')) {
        throw {
          statusCode: 409,
          code: 'VEHICLE_EXISTS',
          message: 'A bus with this registration number already exists in this institution.',
        };
      }
      throw err;
    }
  }

  public async updateVehicle(institutionCode: string, vehicleId: string, input: UpdateVehicleInput) {
    await this.assertVehicle(institutionCode, vehicleId);
    const updated = await this.repo.updateVehicle(institutionCode, vehicleId, input);
    if (!updated) throw { statusCode: 404, code: 'VEHICLE_NOT_FOUND', message: 'Bus not found.' };
    return this.formatVehicle(updated);
  }

  public async addStop(institutionCode: string, routeId: string, input: CreateStopInput) {
    await this.getOwnedRoute(institutionCode, routeId);
    const existingStops = await this.repo.getStopsByRoute(institutionCode, routeId);
    const nextSequence =
      input.sequence ??
      (existingStops.length > 0
        ? Math.max(...existingStops.map((s) => s.sequence)) + 1
        : 1);
    const stop = await this.repo.createStop(institutionCode, routeId, {
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      sequence: nextSequence,
    });
    return this.formatStop(stop);
  }

  public async updateStop(institutionCode: string, stopId: string, input: UpdateStopInput) {
    await this.getOwnedStop(institutionCode, stopId);
    const updated = await this.repo.updateStop(institutionCode, stopId, input);
    if (!updated) throw { statusCode: 404, code: 'STOP_NOT_FOUND', message: 'Bus stop not found.' };
    return this.formatStop(updated);
  }

  public async deleteStop(institutionCode: string, stopId: string) {
    const stop = await this.getOwnedStop(institutionCode, stopId);
    const assignments = await this.repo.listAssignments(institutionCode);
    if (assignments.some((a) => a.stopId === stopId)) {
      throw {
        statusCode: 409,
        code: 'STOP_IN_USE',
        message: 'Students are assigned to this stop. Reassign them before deleting it.',
      };
    }
    const deleted = await this.repo.deleteStop(institutionCode, stopId);
    if (!deleted) throw { statusCode: 404, code: 'STOP_NOT_FOUND', message: 'Bus stop not found.' };
    return { id: stop.id, deleted: true };
  }

  public async searchStudents(institutionCode: string, search: string) {
    return this.repo.searchStudents(institutionCode, search || '', 30);
  }

  public async assignStudent(institutionCode: string, input: AssignStudentTransportInput) {
    const route = await this.getOwnedRoute(institutionCode, input.routeId);
    const stop = await this.getOwnedStop(institutionCode, input.stopId);
    if (stop.routeId !== route.id) {
      throw {
        statusCode: 400,
        code: 'STOP_NOT_ON_ROUTE',
        message: 'The selected stop does not belong to the selected route.',
      };
    }

    const student = await this.repo.findUserByIdOrUid(input.studentId);
    if (
      !student ||
      (student.institutionCode || '').toLowerCase() !== institutionCode.toLowerCase() ||
      (student.role || '').toLowerCase() !== 'student'
    ) {
      throw { statusCode: 404, code: 'STUDENT_NOT_FOUND', message: 'Student not found in this institution.' };
    }

    const assignment = await this.repo.upsertAssignment(institutionCode, input);
    return {
      id: assignment.id,
      studentId: assignment.studentId,
      routeId: assignment.routeId,
      stopId: assignment.stopId,
    };
  }

  public async removeAssignment(institutionCode: string, assignmentId: string) {
    const removed = await this.repo.deactivateAssignment(institutionCode, assignmentId);
    if (!removed) {
      throw { statusCode: 404, code: 'ASSIGNMENT_NOT_FOUND', message: 'Student transport assignment not found.' };
    }
    return { id: assignmentId, removed: true };
  }
}

export const transportService = new TransportService();
