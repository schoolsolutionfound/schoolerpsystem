import { eq, and, desc, asc } from 'drizzle-orm';
import { db, dbFindUserByIdOrUid, dbFindStudentByUsnInInstitution } from '../shared/db/index.js';
import {
  busVehicles,
  busRoutes,
  busStops,
  studentTransport,
  busTrips,
  busLocations,
  users,
  BusVehicleRecord,
  BusRouteRecord,
  BusStopRecord,
  StudentTransportRecord,
  BusTripRecord,
  BusLocationRecord,
} from '../shared/db/schema.js';

export interface ITransportRepository {
  getDriverRoute(institutionCode: string, driverId: string): Promise<BusRouteRecord | undefined>;
  getVehicleById(id: string): Promise<BusVehicleRecord | undefined>;
  getStopsByRoute(institutionCode: string, routeId: string): Promise<BusStopRecord[]>;
  getLiveTripByDriver(institutionCode: string, driverId: string): Promise<BusTripRecord | undefined>;
  getTripById(id: string): Promise<BusTripRecord | undefined>;
  createTrip(trip: { institutionCode: string; routeId: string; driverId: string; tripType: string }): Promise<BusTripRecord>;
  endTrip(tripId: string): Promise<BusTripRecord | undefined>;
  upsertLocation(data: { tripId: string; latitude: number; longitude: number; speed?: number | null; heading?: number | null }): Promise<BusLocationRecord>;
  getLatestLocation(tripId: string): Promise<BusLocationRecord | undefined>;
  getStudentTransportAssignment(institutionCode: string, studentId: string): Promise<StudentTransportRecord | undefined>;
  getRouteById(id: string): Promise<BusRouteRecord | undefined>;
  getStopById(id: string): Promise<BusStopRecord | undefined>;
  getLiveTripByRoute(institutionCode: string, routeId: string): Promise<BusTripRecord | undefined>;
  findUserByIdOrUid(idOrUid: string): Promise<any>;
  findStudentByUsn(institutionCode: string, usn: string): Promise<any>;
}

export class TransportRepository implements ITransportRepository {
  public async getDriverRoute(institutionCode: string, driverId: string): Promise<BusRouteRecord | undefined> {
    if (!db) return undefined;
    const rows = await db
      .select()
      .from(busRoutes)
      .where(and(eq(busRoutes.institutionCode, institutionCode), eq(busRoutes.driverId, driverId)))
      .limit(1);
    return rows[0];
  }

  public async getVehicleById(id: string): Promise<BusVehicleRecord | undefined> {
    if (!db) return undefined;
    const rows = await db.select().from(busVehicles).where(eq(busVehicles.id, id)).limit(1);
    return rows[0];
  }

  public async getStopsByRoute(institutionCode: string, routeId: string): Promise<BusStopRecord[]> {
    if (!db) return [];
    return db
      .select()
      .from(busStops)
      .where(and(eq(busStops.institutionCode, institutionCode), eq(busStops.routeId, routeId)))
      .orderBy(asc(busStops.sequence));
  }

  public async getLiveTripByDriver(institutionCode: string, driverId: string): Promise<BusTripRecord | undefined> {
    if (!db) return undefined;
    const rows = await db
      .select()
      .from(busTrips)
      .where(
        and(
          eq(busTrips.institutionCode, institutionCode),
          eq(busTrips.driverId, driverId),
          eq(busTrips.status, 'live')
        )
      )
      .orderBy(desc(busTrips.startedAt))
      .limit(1);
    return rows[0];
  }

  public async getTripById(id: string): Promise<BusTripRecord | undefined> {
    if (!db) return undefined;
    const rows = await db.select().from(busTrips).where(eq(busTrips.id, id)).limit(1);
    return rows[0];
  }

  public async createTrip(trip: {
    institutionCode: string;
    routeId: string;
    driverId: string;
    tripType: string;
  }): Promise<BusTripRecord> {
    if (!db) throw new Error('Database not connected');
    const rows = await db
      .insert(busTrips)
      .values({
        institutionCode: trip.institutionCode,
        routeId: trip.routeId,
        driverId: trip.driverId,
        tripType: trip.tripType,
        status: 'live',
        startedAt: new Date(),
      })
      .returning();
    return rows[0];
  }

  public async endTrip(tripId: string): Promise<BusTripRecord | undefined> {
    if (!db) return undefined;
    const rows = await db
      .update(busTrips)
      .set({
        status: 'completed',
        endedAt: new Date(),
      })
      .where(eq(busTrips.id, tripId))
      .returning();
    return rows[0];
  }

  public async upsertLocation(data: {
    tripId: string;
    latitude: number;
    longitude: number;
    speed?: number | null;
    heading?: number | null;
  }): Promise<BusLocationRecord> {
    if (!db) throw new Error('Database not connected');
    const rows = await db
      .insert(busLocations)
      .values({
        tripId: data.tripId,
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        speed: data.speed !== undefined && data.speed !== null ? data.speed.toString() : null,
        heading: data.heading !== undefined && data.heading !== null ? data.heading.toString() : null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: busLocations.tripId,
        set: {
          latitude: data.latitude.toString(),
          longitude: data.longitude.toString(),
          speed: data.speed !== undefined && data.speed !== null ? data.speed.toString() : null,
          heading: data.heading !== undefined && data.heading !== null ? data.heading.toString() : null,
          updatedAt: new Date(),
        },
      })
      .returning();
    return rows[0];
  }

  public async getLatestLocation(tripId: string): Promise<BusLocationRecord | undefined> {
    if (!db) return undefined;
    const rows = await db.select().from(busLocations).where(eq(busLocations.tripId, tripId)).limit(1);
    return rows[0];
  }

  public async getStudentTransportAssignment(
    institutionCode: string,
    studentId: string
  ): Promise<StudentTransportRecord | undefined> {
    if (!db) return undefined;
    const rows = await db
      .select()
      .from(studentTransport)
      .where(
        and(
          eq(studentTransport.institutionCode, institutionCode),
          eq(studentTransport.studentId, studentId),
          eq(studentTransport.isActive, true)
        )
      )
      .limit(1);
    return rows[0];
  }

  public async getRouteById(id: string): Promise<BusRouteRecord | undefined> {
    if (!db) return undefined;
    const rows = await db.select().from(busRoutes).where(eq(busRoutes.id, id)).limit(1);
    return rows[0];
  }

  public async getStopById(id: string): Promise<BusStopRecord | undefined> {
    if (!db) return undefined;
    const rows = await db.select().from(busStops).where(eq(busStops.id, id)).limit(1);
    return rows[0];
  }

  public async getLiveTripByRoute(institutionCode: string, routeId: string): Promise<BusTripRecord | undefined> {
    if (!db) return undefined;
    const rows = await db
      .select()
      .from(busTrips)
      .where(
        and(
          eq(busTrips.institutionCode, institutionCode),
          eq(busTrips.routeId, routeId),
          eq(busTrips.status, 'live')
        )
      )
      .orderBy(desc(busTrips.startedAt))
      .limit(1);
    return rows[0];
  }

  public async findUserByIdOrUid(idOrUid: string): Promise<any> {
    return dbFindUserByIdOrUid(idOrUid);
  }

  public async findStudentByUsn(institutionCode: string, usn: string): Promise<any> {
    return dbFindStudentByUsnInInstitution(institutionCode, usn);
  }
}

export const transportRepository = new TransportRepository();
