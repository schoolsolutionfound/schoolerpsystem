import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, count, eq, sql } from 'drizzle-orm';
import * as schema from './schema.js';
import { invalidateCachedAuth } from '../middleware/authCache.js';

export interface InMemoryUser {
  id: string;
  firebaseUid: string;
  email: string;
  fullName: string;
  role: string;
  institutionCode: string;
  institutionName: string;
  institutionType: string;
  rollNoOrUSN: string;
  mustChangePassword: boolean;
  profileCompleted: boolean;
  parentPhone?: string;
  phone?: string;
  profilePicUrl?: string;
  tenthPercentage?: string;
  twelfthPercentage?: string;
  title?: string;
  scope?: string;
  permissions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function normalizePagination(opts?: PaginationOptions): { limit: number; offset: number } {
  const limit = Math.min(Math.max(opts?.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(opts?.offset ?? 0, 0);
  return { limit, offset };
}

/**
 * In-memory user store. Used ONLY as a fallback when no Postgres is configured
 * (local/dev mode without DATABASE_URL). When Postgres is available it is the
 * single source of truth — reads are never mirrored and mutations never
 * dual-write into this store.
 */
export class UserStore {
  private usersMap = new Map<string, InMemoryUser>();

  public findByUid(uid: string): InMemoryUser | undefined {
    return Array.from(this.usersMap.values()).find((u) => u.firebaseUid === uid);
  }

  public findByEmail(email: string): InMemoryUser | undefined {
    return Array.from(this.usersMap.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public upsertUser(user: Partial<InMemoryUser> & { firebaseUid: string; email: string }): InMemoryUser {
    const existing = this.findByUid(user.firebaseUid);
    const updated: InMemoryUser = {
      id: existing?.id || user.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      firebaseUid: user.firebaseUid,
      email: user.email,
      fullName: user.fullName ?? existing?.fullName ?? 'User',
      role: user.role ?? existing?.role ?? 'student',
      institutionCode: user.institutionCode ?? existing?.institutionCode ?? '',
      institutionName: user.institutionName ?? existing?.institutionName ?? '',
      institutionType: user.institutionType ?? existing?.institutionType ?? 'school',
      rollNoOrUSN: user.rollNoOrUSN ?? existing?.rollNoOrUSN ?? '',
      mustChangePassword: user.mustChangePassword ?? existing?.mustChangePassword ?? false,
      profileCompleted: user.profileCompleted ?? existing?.profileCompleted ?? false,
      parentPhone: user.parentPhone ?? existing?.parentPhone ?? '',
      phone: user.phone ?? existing?.phone ?? '',
      profilePicUrl: user.profilePicUrl ?? existing?.profilePicUrl ?? '',
      tenthPercentage: user.tenthPercentage ?? existing?.tenthPercentage ?? '',
      twelfthPercentage: user.twelfthPercentage ?? existing?.twelfthPercentage ?? '',
      title: user.title ?? existing?.title ?? '',
      scope: user.scope ?? existing?.scope ?? '{}',
      permissions: user.permissions ?? existing?.permissions ?? '[]',
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    this.usersMap.set(updated.id, updated);
    return updated;
  }

  public getAll(): InMemoryUser[] {
    return Array.from(this.usersMap.values());
  }

  public deleteUser(id: string): boolean {
    return this.usersMap.delete(id);
  }
}

export const inMemoryUserStore = new UserStore();

const connectionString = process.env.DATABASE_URL;
export const queryClient = connectionString ? postgres(connectionString) : null;
export const db = queryClient ? drizzle(queryClient, { schema }) : null;

function safeJsonStringify(val: any, fallback: string): string {
  if (typeof val === 'string') return val;
  try { return JSON.stringify(val); } catch { return fallback; }
}

function safeJsonParse(val: any, fallback: any): any {
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val ?? fallback;
}

function mapUserRow(row: schema.UserRecord): InMemoryUser {
  return {
    id: row.id,
    firebaseUid: row.firebaseUid,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
    institutionCode: row.institutionCode || '',
    institutionName: row.institutionName || '',
    institutionType: row.institutionType || 'school',
    rollNoOrUSN: row.rollNoOrUSN || '',
    mustChangePassword: row.mustChangePassword ?? false,
    profileCompleted: row.profileCompleted ?? false,
    parentPhone: row.parentPhone || '',
    phone: row.phone || '',
    profilePicUrl: row.profilePicUrl || '',
    tenthPercentage: row.tenthPercentage || '',
    twelfthPercentage: row.twelfthPercentage || '',
    title: row.title || '',
    scope: safeJsonStringify(row.scope, '{}'),
    permissions: safeJsonStringify(row.permissions, '[]'),
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  };
}

// ---------------------------------------------------------------------------
// Reads — Postgres when available, in-memory store only as fallback.
// ---------------------------------------------------------------------------

export async function dbFindByUid(uid: string): Promise<InMemoryUser | undefined> {
  if (db) {
    try {
      const results = await db.select().from(schema.users).where(eq(schema.users.firebaseUid, uid)).limit(1);
      return results.length > 0 ? mapUserRow(results[0]) : undefined;
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbFindByUid query failed:', error.message);
    }
  }
  return inMemoryUserStore.findByUid(uid);
}

export async function dbFindByEmail(email: string): Promise<InMemoryUser | undefined> {
  if (db) {
    try {
      const results = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      return results.length > 0 ? mapUserRow(results[0]) : undefined;
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbFindByEmail query failed:', error.message);
    }
  }
  return inMemoryUserStore.findByEmail(email);
}

export async function dbFindUserById(id: string): Promise<InMemoryUser | undefined> {
  if (db) {
    try {
      const results = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
      return results.length > 0 ? mapUserRow(results[0]) : undefined;
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbFindUserById query failed:', error.message);
    }
  }
  return inMemoryUserStore.getAll().find((u) => u.id === id);
}

/**
 * Scoped lookup by DB id OR Firebase uid, within an institution. Replaces the
 * previous full-table-scan approach used by academics/teacher flows.
 */
export async function dbFindUserByIdOrUid(identifier: string): Promise<InMemoryUser | undefined> {
  if (db) {
    try {
      const results = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.firebaseUid, identifier))
        .limit(1);
      if (results.length > 0) return mapUserRow(results[0]);
      const byId = await db.select().from(schema.users).where(eq(schema.users.id, identifier)).limit(1);
      return byId.length > 0 ? mapUserRow(byId[0]) : undefined;
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbFindUserByIdOrUid query failed:', error.message);
    }
  }
  const all = inMemoryUserStore.getAll();
  return all.find((u) => u.id === identifier || u.firebaseUid === identifier);
}

/**
 * Scoped users query — filters by institution (and optional role) in SQL,
 * with pagination. Never full-table scans.
 */
export async function dbFindUsersByInstitution(
  institutionCode: string,
  role?: string,
  opts?: PaginationOptions
): Promise<InMemoryUser[]> {
  const { limit, offset } = normalizePagination(opts);
  if (db) {
    try {
      const where = role
        ? and(eq(schema.users.institutionCode, institutionCode), eq(schema.users.role, role))
        : eq(schema.users.institutionCode, institutionCode);
      const results = await db.select().from(schema.users).where(where).limit(limit).offset(offset);
      return results.map(mapUserRow);
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbFindUsersByInstitution query failed:', error.message);
    }
  }
  const all = inMemoryUserStore.getAll().filter(
    (u) => u.institutionCode.toLowerCase() === institutionCode.toLowerCase() && (!role || u.role === role)
  );
  return all.slice(offset, offset + limit);
}

export async function dbCountUsersByInstitution(institutionCode?: string, role?: string): Promise<number> {
  if (db) {
    try {
      const conditions = [];
      if (institutionCode) conditions.push(eq(schema.users.institutionCode, institutionCode));
      if (role) conditions.push(eq(schema.users.role, role));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = where
        ? await db.select({ count: count() }).from(schema.users).where(where)
        : await db.select({ count: count() }).from(schema.users);
      return Number(rows[0]?.count ?? 0);
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbCountUsersByInstitution query failed:', error.message);
    }
  }
  return inMemoryUserStore.getAll().filter(
    (u) => (!institutionCode || u.institutionCode.toLowerCase() === institutionCode.toLowerCase()) && (!role || u.role === role)
  ).length;
}

export async function dbFindAdminsByInstitutionCode(
  institutionCode: string,
  opts?: PaginationOptions
): Promise<InMemoryUser[]> {
  const { limit, offset } = normalizePagination(opts);
  if (db) {
    try {
      const results = await db
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.institutionCode, institutionCode),
            eq(schema.users.role, 'admin')
          )
        )
        .limit(limit)
        .offset(offset);
      return results.map(mapUserRow);
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbFindAdminsByInstitutionCode query failed:', error.message);
    }
  }
  return inMemoryUserStore.getAll().filter(
    (u) => u.institutionCode === institutionCode && (u.role === 'admin' || u.role === 'institution admin')
  ).slice(offset, offset + limit);
}

/**
 * Direct student lookup by roll number / USN within an institution.
 * Uses an indexed SQL query instead of a full-table scan.
 */
export async function dbFindStudentByUsnInInstitution(
  institutionCode: string,
  usn: string
): Promise<InMemoryUser | undefined> {
  if (db) {
    try {
      const results = await db
        .select()
        .from(schema.users)
        .where(
          and(
            eq(schema.users.institutionCode, institutionCode),
            eq(schema.users.role, 'student'),
            eq(schema.users.rollNoOrUSN, usn)
          )
        )
        .limit(1);
      return results.length > 0 ? mapUserRow(results[0]) : undefined;
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbFindStudentByUsnInInstitution query failed:', error.message);
    }
  }
  return inMemoryUserStore.getAll().find(
    (u) =>
      u.institutionCode.toLowerCase() === institutionCode.toLowerCase() &&
      u.role === 'student' &&
      u.rollNoOrUSN?.toLowerCase() === usn.toLowerCase()
  );
}

/**
 * Students scoped to a class/section via the JSONB `scope` fields
 * (department / academicYear / section). Uses indexed institution + role
 * filters plus JSONB equality instead of a full-table scan in JS.
 */
export async function dbFindStudentsByClassScope(
  institutionCode: string,
  scope: { department?: string; academicYear?: string; section?: string },
  opts?: PaginationOptions
): Promise<InMemoryUser[]> {
  const { limit, offset } = normalizePagination(opts);
  const dept = scope.department || '';
  const year = scope.academicYear || '';
  const section = scope.section || '';
  if (db) {
    try {
      const conditions: any[] = [
        eq(schema.users.institutionCode, institutionCode),
        eq(schema.users.role, 'student'),
      ];
      if (dept) conditions.push(sql`${schema.users.scope}->>'department' = ${dept}`);
      if (year) conditions.push(sql`${schema.users.scope}->>'academicYear' = ${year}`);
      if (section) conditions.push(sql`${schema.users.scope}->>'section' = ${section}`);
      const results = await db
        .select()
        .from(schema.users)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);
      return results.map(mapUserRow);
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbFindStudentsByClassScope query failed:', error.message);
    }
  }
  return inMemoryUserStore
    .getAll()
    .filter(
      (u) =>
        u.institutionCode.toLowerCase() === institutionCode.toLowerCase() &&
        u.role === 'student' &&
        (!dept || (u.scope as any)?.department === dept) &&
        (!year || (u.scope as any)?.academicYear === year) &&
        (!section || (u.scope as any)?.section === section)
    )
    .slice(offset, offset + limit);
}

export async function dbCountStudentsByClassScope(
  institutionCode: string,
  scope: { department?: string; academicYear?: string; section?: string }
): Promise<number> {
  const dept = scope.department || '';
  const year = scope.academicYear || '';
  const section = scope.section || '';
  if (db) {
    try {
      const conditions: any[] = [
        eq(schema.users.institutionCode, institutionCode),
        eq(schema.users.role, 'student'),
      ];
      if (dept) conditions.push(sql`${schema.users.scope}->>'department' = ${dept}`);
      if (year) conditions.push(sql`${schema.users.scope}->>'academicYear' = ${year}`);
      if (section) conditions.push(sql`${schema.users.scope}->>'section' = ${section}`);
      const rows = await db
        .select({ count: count() })
        .from(schema.users)
        .where(and(...conditions));
      return Number(rows[0]?.count ?? 0);
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbCountStudentsByClassScope query failed:', error.message);
    }
  }
  return inMemoryUserStore
    .getAll()
    .filter(
      (u) =>
        u.institutionCode.toLowerCase() === institutionCode.toLowerCase() &&
        u.role === 'student' &&
        (!dept || (u.scope as any)?.department === dept) &&
        (!year || (u.scope as any)?.academicYear === year) &&
        (!section || (u.scope as any)?.section === section)
    )
    .length;
}

/**
 * Non-developer users (used by the developer console admins list when no
 * institution filter is given). Scoped to role in SQL.
 */
export async function dbFindNonDeveloperUsers(opts?: PaginationOptions): Promise<InMemoryUser[]> {
  const { limit, offset } = normalizePagination(opts);
  if (db) {
    try {
      const results = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.role, 'admin'))
        .limit(limit)
        .offset(offset);
      return results.map(mapUserRow);
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbFindNonDeveloperUsers query failed:', error.message);
    }
  }
  return inMemoryUserStore.getAll().filter((u) => u.role === 'admin').slice(offset, offset + limit);
}

export async function dbCountNonDeveloperUsers(): Promise<number> {
  if (db) {
    try {
      const rows = await db
        .select({ count: count() })
        .from(schema.users)
        .where(eq(schema.users.role, 'admin'));
      return Number(rows[0]?.count ?? 0);
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbCountNonDeveloperUsers query failed:', error.message);
    }
  }
  return inMemoryUserStore.getAll().filter((u) => u.role === 'admin').length;
}

// ---------------------------------------------------------------------------
// Scoped dashboard counts (Postgres only — no in-memory mirrors exist for
// academic tables, so no-DB mode returns 0).
// ---------------------------------------------------------------------------

export async function dbCountClassSectionsByInstitution(institutionCode: string): Promise<number> {
  if (db) {
    try {
      const rows = await db
        .select({ count: count() })
        .from(schema.classSections)
        .where(eq(schema.classSections.institutionCode, institutionCode));
      return Number(rows[0]?.count ?? 0);
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbCountClassSectionsByInstitution query failed:', error.message);
    }
  }
  return 0;
}

export async function dbCountSubjectsByInstitution(institutionCode: string): Promise<number> {
  if (db) {
    try {
      const rows = await db
        .select({ count: count() })
        .from(schema.subjects)
        .where(eq(schema.subjects.institutionCode, institutionCode));
      return Number(rows[0]?.count ?? 0);
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbCountSubjectsByInstitution query failed:', error.message);
    }
  }
  return 0;
}

export async function dbCountAttendanceSessionsByInstitution(institutionCode: string): Promise<number> {
  if (db) {
    try {
      const rows = await db
        .select({ count: count() })
        .from(schema.attendanceRecords)
        .where(eq(schema.attendanceRecords.institutionCode, institutionCode));
      return Number(rows[0]?.count ?? 0);
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbCountAttendanceSessionsByInstitution query failed:', error.message);
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Writes — Postgres when available, in-memory store only as fallback.
// ---------------------------------------------------------------------------

export async function dbUpsertUser(user: Partial<InMemoryUser> & { firebaseUid: string; email: string }): Promise<InMemoryUser> {
  if (!db) {
    const saved = inMemoryUserStore.upsertUser(user);
    invalidateCachedAuth(saved.firebaseUid);
    return saved;
  }

  try {
    const existing = await db.select().from(schema.users).where(eq(schema.users.firebaseUid, user.firebaseUid)).limit(1);
    const base = existing.length > 0 ? mapUserRow(existing[0]) : undefined;

    const merged: InMemoryUser = {
      id: base?.id || user.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      firebaseUid: user.firebaseUid,
      email: user.email,
      fullName: user.fullName ?? base?.fullName ?? 'User',
      role: user.role ?? base?.role ?? 'student',
      institutionCode: user.institutionCode ?? base?.institutionCode ?? '',
      institutionName: user.institutionName ?? base?.institutionName ?? '',
      institutionType: user.institutionType ?? base?.institutionType ?? 'school',
      rollNoOrUSN: user.rollNoOrUSN ?? base?.rollNoOrUSN ?? '',
      mustChangePassword: user.mustChangePassword ?? base?.mustChangePassword ?? false,
      profileCompleted: user.profileCompleted ?? base?.profileCompleted ?? false,
      parentPhone: user.parentPhone ?? base?.parentPhone ?? '',
      phone: user.phone ?? base?.phone ?? '',
      profilePicUrl: user.profilePicUrl ?? base?.profilePicUrl ?? '',
      tenthPercentage: user.tenthPercentage ?? base?.tenthPercentage ?? '',
      twelfthPercentage: user.twelfthPercentage ?? base?.twelfthPercentage ?? '',
      title: user.title ?? base?.title ?? '',
      scope: user.scope ?? base?.scope ?? '{}',
      permissions: user.permissions ?? base?.permissions ?? '[]',
      createdAt: base?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const savedRows = await db
      .insert(schema.users)
      .values({
        id: merged.id,
        firebaseUid: merged.firebaseUid,
        email: merged.email,
        fullName: merged.fullName,
        role: merged.role,
        institutionCode: merged.institutionCode,
        institutionName: merged.institutionName,
        institutionType: merged.institutionType,
        rollNoOrUSN: merged.rollNoOrUSN,
        mustChangePassword: merged.mustChangePassword,
        profileCompleted: merged.profileCompleted,
        parentPhone: merged.parentPhone,
        phone: merged.phone,
        profilePicUrl: merged.profilePicUrl,
        tenthPercentage: merged.tenthPercentage,
        twelfthPercentage: merged.twelfthPercentage,
        title: merged.title,
        scope: safeJsonParse(merged.scope, {}),
        permissions: safeJsonParse(merged.permissions, []),
        createdAt: merged.createdAt,
        updatedAt: merged.updatedAt,
      })
      .onConflictDoUpdate({
        target: schema.users.firebaseUid,
        set: {
          email: merged.email,
          fullName: merged.fullName,
          role: merged.role,
          institutionCode: merged.institutionCode,
          institutionName: merged.institutionName,
          institutionType: merged.institutionType,
          rollNoOrUSN: merged.rollNoOrUSN,
          mustChangePassword: merged.mustChangePassword,
          profileCompleted: merged.profileCompleted,
          parentPhone: merged.parentPhone,
          phone: merged.phone,
          profilePicUrl: merged.profilePicUrl,
          tenthPercentage: merged.tenthPercentage,
          twelfthPercentage: merged.twelfthPercentage,
          title: merged.title,
          scope: safeJsonParse(merged.scope, {}),
          permissions: safeJsonParse(merged.permissions, []),
          updatedAt: new Date(),
        },
      })
      .returning();

    invalidateCachedAuth(merged.firebaseUid);
    return savedRows.length > 0 ? mapUserRow(savedRows[0]) : merged;
  } catch (error: any) {
    console.warn('[PostgreSQL Drizzle Warning] dbUpsertUser query failed:', error.message);
    const fallback = inMemoryUserStore.upsertUser(user);
    invalidateCachedAuth(fallback.firebaseUid);
    return fallback;
  }
}

export async function dbDeleteUserById(id: string): Promise<boolean> {
  if (db) {
    try {
      const deleted = await db.delete(schema.users).where(eq(schema.users.id, id)).returning();
      if (deleted.length > 0) invalidateCachedAuth(deleted[0].firebaseUid);
      return true;
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbDeleteUserById query failed:', error.message);
    }
  }
  const all = inMemoryUserStore.getAll();
  const target = all.find((u) => u.id === id);
  if (target) invalidateCachedAuth(target.firebaseUid);
  return inMemoryUserStore.deleteUser(id);
}