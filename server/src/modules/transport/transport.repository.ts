import { eq, and, desc, asc, ilike, or } from 'drizzle-orm';
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

export interface AdminUserSummary {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  rollNoOrUSN: string | null;
}

export interface StudentAssignmentRow {
  id: string;
  routeId: string;
  stopId: string;
  studentId: string;
  studentName: string | null;
  rollNo: string | null;
}

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

  listVehicles(institutionCode: string): Promise<BusVehicleRecord[]>;
  createVehicle(institutionCode: string, data: { registrationNo: string; capacity?: number; status?: string }): Promise<BusVehicleRecord>;
  updateVehicle(institutionCode: string, id: string, data: { registrationNo?: string; capacity?: number; status?: string }): Promise<BusVehicleRecord | undefined>;
  listRoutes(institutionCode: string): Promise<BusRouteRecord[]>;
  createRoute(institutionCode: string, data: { name: string; vehicleId?: string | null; driverId?: string | null }): Promise<BusRouteRecord>;
  updateRoute(institutionCode: string, id: string, data: { name?: string; vehicleId?: string | null; driverId?: string | null }): Promise<BusRouteRecord | undefined>;
  deleteRoute(institutionCode: string, id: string): Promise<boolean>;
  routeHasTrips(routeId: string): Promise<boolean>;
  listStopsByInstitution(institutionCode: string): Promise<BusStopRecord[]>;
  createStop(institutionCode: string, routeId: string, data: { name: string; latitude: number; longitude: number; sequence: number }): Promise<BusStopRecord>;
  updateStop(institutionCode: string, id: string, data: { name?: string; latitude?: number; longitude?: number; sequence?: number }): Promise<BusStopRecord | undefined>;
  deleteStop(institutionCode: string, id: string): Promise<boolean>;
  listUsersByRole(institutionCode: string, role: string): Promise<AdminUserSummary[]>;
  searchStudents(institutionCode: string, search: string, limit: number): Promise<AdminUserSummary[]>;
  listAssignments(institutionCode: string): Promise<StudentAssignmentRow[]>;
  upsertAssignment(institutionCode: string, data: { studentId: string; routeId: string; stopId: string }): Promise<StudentTransportRecord>;
  deactivateAssignment(institutionCode: string, id: string): Promise<StudentTransportRecord | undefined>;
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

  // ------------------------------------------------------------------ admin CRUD

  public async listVehicles(institutionCode: string): Promise<BusVehicleRecord[]> {
    if (!db) return [];
    return db
      .select()
      .from(busVehicles)
      .where(eq(busVehicles.institutionCode, institutionCode))
      .orderBy(asc(busVehicles.registrationNo));
  }

  public async createVehicle(
    institutionCode: string,
    data: { registrationNo: string; capacity?: number; status?: string }
  ): Promise<BusVehicleRecord> {
    if (!db) throw new Error('Database not connected');
    const [row] = await db
      .insert(busVehicles)
      .values({
        institutionCode,
        registrationNo: data.registrationNo,
        capacity: data.capacity ?? 30,
        status: data.status ?? 'active',
      })
      .returning();
    return row;
  }

  public async updateVehicle(
    institutionCode: string,
    id: string,
    data: { registrationNo?: string; capacity?: number; status?: string }
  ): Promise<BusVehicleRecord | undefined> {
    if (!db) return undefined;
    const patch: Partial<typeof busVehicles.$inferInsert> = { updatedAt: new Date() };
    if (data.registrationNo !== undefined) patch.registrationNo = data.registrationNo;
    if (data.capacity !== undefined) patch.capacity = data.capacity;
    if (data.status !== undefined) patch.status = data.status;
    const [row] = await db
      .update(busVehicles)
      .set(patch)
      .where(and(eq(busVehicles.id, id), eq(busVehicles.institutionCode, institutionCode)))
      .returning();
    return row;
  }

  public async listRoutes(institutionCode: string): Promise<BusRouteRecord[]> {
    if (!db) return [];
    return db
      .select()
      .from(busRoutes)
      .where(eq(busRoutes.institutionCode, institutionCode))
      .orderBy(asc(busRoutes.name));
  }

  public async createRoute(
    institutionCode: string,
    data: { name: string; vehicleId?: string | null; driverId?: string | null }
  ): Promise<BusRouteRecord> {
    if (!db) throw new Error('Database not connected');
    const [row] = await db
      .insert(busRoutes)
      .values({
        institutionCode,
        name: data.name,
        vehicleId: data.vehicleId ?? null,
        driverId: data.driverId ?? null,
      })
      .returning();
    return row;
  }

  public async updateRoute(
    institutionCode: string,
    id: string,
    data: { name?: string; vehicleId?: string | null; driverId?: string | null }
  ): Promise<BusRouteRecord | undefined> {
    if (!db) return undefined;
    const patch: Partial<typeof busRoutes.$inferInsert> = { updatedAt: new Date() };
    if (data.name !== undefined) patch.name = data.name;
    if (data.vehicleId !== undefined) patch.vehicleId = data.vehicleId;
    if (data.driverId !== undefined) patch.driverId = data.driverId;
    const [row] = await db
      .update(busRoutes)
      .set(patch)
      .where(and(eq(busRoutes.id, id), eq(busRoutes.institutionCode, institutionCode)))
      .returning();
    return row;
  }

  public async deleteRoute(institutionCode: string, id: string): Promise<boolean> {
    if (!db) return false;
    return db.transaction(async (tx) => {
      await tx
        .delete(studentTransport)
        .where(
          and(
            eq(studentTransport.institutionCode, institutionCode),
            eq(studentTransport.routeId, id)
          )
        );
      await tx
        .delete(busStops)
        .where(and(eq(busStops.institutionCode, institutionCode), eq(busStops.routeId, id)));
      const rows = await tx
        .delete(busRoutes)
        .where(and(eq(busRoutes.id, id), eq(busRoutes.institutionCode, institutionCode)))
        .returning({ id: busRoutes.id });
      return rows.length > 0;
    });
  }

  public async routeHasTrips(routeId: string): Promise<boolean> {
    if (!db) return false;
    const rows = await db
      .select({ id: busTrips.id })
      .from(busTrips)
      .where(eq(busTrips.routeId, routeId))
      .limit(1);
    return rows.length > 0;
  }

  public async listStopsByInstitution(institutionCode: string): Promise<BusStopRecord[]> {
    if (!db) return [];
    return db
      .select()
      .from(busStops)
      .where(eq(busStops.institutionCode, institutionCode))
      .orderBy(asc(busStops.routeId), asc(busStops.sequence));
  }

  public async createStop(
    institutionCode: string,
    routeId: string,
    data: { name: string; latitude: number; longitude: number; sequence: number }
  ): Promise<BusStopRecord> {
    if (!db) throw new Error('Database not connected');
    const [row] = await db
      .insert(busStops)
      .values({
        institutionCode,
        routeId,
        name: data.name,
        latitude: data.latitude.toString(),
        longitude: data.longitude.toString(),
        sequence: data.sequence,
      })
      .returning();
    return row;
  }

  public async updateStop(
    institutionCode: string,
    id: string,
    data: { name?: string; latitude?: number; longitude?: number; sequence?: number }
  ): Promise<BusStopRecord | undefined> {
    if (!db) return undefined;
    const patch: Partial<typeof busStops.$inferInsert> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.latitude !== undefined) patch.latitude = data.latitude.toString();
    if (data.longitude !== undefined) patch.longitude = data.longitude.toString();
    if (data.sequence !== undefined) patch.sequence = data.sequence;
    const [row] = await db
      .update(busStops)
      .set(patch)
      .where(and(eq(busStops.id, id), eq(busStops.institutionCode, institutionCode)))
      .returning();
    return row;
  }

  public async deleteStop(institutionCode: string, id: string): Promise<boolean> {
    if (!db) return false;
    const rows = await db
      .delete(busStops)
      .where(and(eq(busStops.id, id), eq(busStops.institutionCode, institutionCode)))
      .returning({ id: busStops.id });
    return rows.length > 0;
  }

  public async listUsersByRole(institutionCode: string, role: string): Promise<AdminUserSummary[]> {
    if (!db) return [];
    return db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        rollNoOrUSN: users.rollNoOrUSN,
      })
      .from(users)
      .where(and(eq(users.institutionCode, institutionCode), eq(users.role, role)))
      .orderBy(asc(users.fullName));
  }

  public async searchStudents(
    institutionCode: string,
    search: string,
    limit: number
  ): Promise<AdminUserSummary[]> {
    if (!db) return [];
    const term = `%${search.trim()}%`;
    const filters = [
      eq(users.institutionCode, institutionCode),
      eq(users.role, 'student'),
    ];
    if (search.trim()) {
      filters.push(or(ilike(users.fullName, term), ilike(users.rollNoOrUSN, term)) as any);
    }
    return db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        rollNoOrUSN: users.rollNoOrUSN,
      })
      .from(users)
      .where(and(...filters))
      .orderBy(asc(users.fullName))
      .limit(limit);
  }

  public async listAssignments(institutionCode: string): Promise<StudentAssignmentRow[]> {
    if (!db) return [];
    return db
      .select({
        id: studentTransport.id,
        routeId: studentTransport.routeId,
        stopId: studentTransport.stopId,
        studentId: studentTransport.studentId,
        studentName: users.fullName,
        rollNo: users.rollNoOrUSN,
      })
      .from(studentTransport)
      .leftJoin(users, eq(users.id, studentTransport.studentId))
      .where(
        and(
          eq(studentTransport.institutionCode, institutionCode),
          eq(studentTransport.isActive, true)
        )
      )
      .orderBy(asc(users.fullName));
  }

  public async upsertAssignment(
    institutionCode: string,
    data: { studentId: string; routeId: string; stopId: string }
  ): Promise<StudentTransportRecord> {
    if (!db) throw new Error('Database not connected');
    const [row] = await db
      .insert(studentTransport)
      .values({
        institutionCode,
        studentId: data.studentId,
        routeId: data.routeId,
        stopId: data.stopId,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [studentTransport.studentId, studentTransport.routeId],
        set: {
          stopId: data.stopId,
          isActive: true,
          updatedAt: new Date(),
        },
      })
      .returning();
    return row;
  }

  public async deactivateAssignment(
    institutionCode: string,
    id: string
  ): Promise<StudentTransportRecord | undefined> {
    if (!db) return undefined;
    const [row] = await db
      .update(studentTransport)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(studentTransport.id, id),
          eq(studentTransport.institutionCode, institutionCode)
        )
      )
      .returning();
    return row;
  }
}

export const transportRepository = new TransportRepository();
