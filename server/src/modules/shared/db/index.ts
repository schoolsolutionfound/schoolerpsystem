import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, count, desc, eq, sql } from 'drizzle-orm';
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
  department?: string;
  scope?: string;
  permissions?: string;
  graduatedAt?: Date | string;
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

/**
 * Run `fn` inside a Postgres transaction. Throws DB_UNAVAILABLE when no
 * DATABASE_URL is configured (callers must branch for no-DB dev mode).
 * The callback receives the transaction handle — pass it into write helpers
 * that accept an optional executor so every write joins the same tx.
 */
export async function withTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
  if (!db) {
    throw Object.assign(new Error('Database not available'), { statusCode: 500, code: 'DB_UNAVAILABLE' });
  }
  return db.transaction(fn);
}

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
    department: (row as any).department || '',
    scope: safeJsonStringify(row.scope, '{}'),
    permissions: safeJsonStringify(row.permissions, '[]'),
    graduatedAt: (row as any).graduatedAt || undefined,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  };
}

// ---------------------------------------------------------------------------
// Reads — Postgres when configured (single source of truth; errors propagate);
// in-memory store only in no-DATABASE_URL dev mode.
// ---------------------------------------------------------------------------

export async function dbFindByUid(uid: string): Promise<InMemoryUser | undefined> {
  if (db) {
    const results = await db.select().from(schema.users).where(eq(schema.users.firebaseUid, uid)).limit(1);
    return results.length > 0 ? mapUserRow(results[0]) : undefined;
  }
  return inMemoryUserStore.findByUid(uid);
}

export async function dbFindByEmail(email: string): Promise<InMemoryUser | undefined> {
  if (db) {
    const results = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return results.length > 0 ? mapUserRow(results[0]) : undefined;
  }
  return inMemoryUserStore.findByEmail(email);
}

export async function dbFindUserById(id: string): Promise<InMemoryUser | undefined> {
  if (db) {
    const results = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return results.length > 0 ? mapUserRow(results[0]) : undefined;
  }
  return inMemoryUserStore.getAll().find((u) => u.id === id);
}

/**
 * Scoped lookup by DB id OR Firebase uid, within an institution. Replaces the
 * previous full-table-scan approach used by academics/teacher flows.
 */
export async function dbFindUserByIdOrUid(identifier: string): Promise<InMemoryUser | undefined> {
  if (db) {
    const results = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.firebaseUid, identifier))
      .limit(1);
    if (results.length > 0) return mapUserRow(results[0]);
    const byId = await db.select().from(schema.users).where(eq(schema.users.id, identifier)).limit(1);
    return byId.length > 0 ? mapUserRow(byId[0]) : undefined;
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
    const where = role
      ? and(eq(schema.users.institutionCode, institutionCode), eq(schema.users.role, role))
      : eq(schema.users.institutionCode, institutionCode);
    const results = await db.select().from(schema.users).where(where).limit(limit).offset(offset);
    return results.map(mapUserRow);
  }
  const all = inMemoryUserStore.getAll().filter(
    (u) => u.institutionCode.toLowerCase() === institutionCode.toLowerCase() && (!role || u.role === role)
  );
  return all.slice(offset, offset + limit);
}

export async function dbCountUsersByInstitution(institutionCode?: string, role?: string): Promise<number> {
  if (db) {
    const conditions = [];
    if (institutionCode) conditions.push(eq(schema.users.institutionCode, institutionCode));
    if (role) conditions.push(eq(schema.users.role, role));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = where
      ? await db.select({ count: count() }).from(schema.users).where(where)
      : await db.select({ count: count() }).from(schema.users);
    return Number(rows[0]?.count ?? 0);
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
  }
  return inMemoryUserStore.getAll().filter(
    (u) => u.institutionCode === institutionCode && (u.role === 'admin' || u.role === 'institution admin')
  ).slice(offset, offset + limit);
}

/**
 * Resolve a student's currently-active class_section_id.
 *
 * Prefers the canonical `student_classes` table (new), falls back to the
 * legacy `users.scope->>'classSectionId'` field for users who were enrolled
 * before the migration.
 */
export async function dbFindStudentClassSectionId(studentId: string): Promise<string | undefined> {
  if (db) {
    const rows = await db
      .select({ classSectionId: schema.studentClasses.classSectionId })
      .from(schema.studentClasses)
      .where(
        and(
          eq(schema.studentClasses.studentId, studentId),
          eq(schema.studentClasses.isActive, true)
        )
      )
      .limit(1);
    if (rows.length > 0) return rows[0].classSectionId;
  }
  // Intentional legacy data fallback (not an error swallow): pre-migration users
  // encode class membership in users.scope instead of student_classes.
  const user = await dbFindUserByIdOrUid(studentId);
  if (!user) return undefined;
  let scope: any = (user as any).scope || {};
  if (typeof scope === 'string') {
    try { scope = JSON.parse(scope); } catch { /* ignore */ }
  }
  const fromScope = scope?.classSectionId;
  return typeof fromScope === 'string' && fromScope.length > 0 ? fromScope : undefined;
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
    const results = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'admin'))
      .limit(limit)
      .offset(offset);
    return results.map(mapUserRow);
  }
  return inMemoryUserStore.getAll().filter((u) => u.role === 'admin').slice(offset, offset + limit);
}

export async function dbCountNonDeveloperUsers(): Promise<number> {
  if (db) {
    const rows = await db
      .select({ count: count() })
      .from(schema.users)
      .where(eq(schema.users.role, 'admin'));
    return Number(rows[0]?.count ?? 0);
  }
  return inMemoryUserStore.getAll().filter((u) => u.role === 'admin').length;
}

// ---------------------------------------------------------------------------
// Scoped dashboard counts (Postgres only — no in-memory mirrors exist for
// academic tables, so no-DB mode returns 0).
// ---------------------------------------------------------------------------

export async function dbCountClassSectionsByInstitution(institutionCode: string): Promise<number> {
  if (db) {
    const rows = await db
      .select({ count: count() })
      .from(schema.classSections)
      .where(eq(schema.classSections.institutionCode, institutionCode));
    return Number(rows[0]?.count ?? 0);
  }
  return 0;
}

export async function dbCountSubjectsByInstitution(institutionCode: string): Promise<number> {
  if (db) {
    const rows = await db
      .select({ count: count() })
      .from(schema.subjects)
      .where(eq(schema.subjects.institutionCode, institutionCode));
    return Number(rows[0]?.count ?? 0);
  }
  return 0;
}

export async function dbCountAttendanceSessionsByInstitution(institutionCode: string): Promise<number> {
  if (db) {
    const rows = await db
      .select({ count: count() })
      .from(schema.attendanceRecords)
      .where(eq(schema.attendanceRecords.institutionCode, institutionCode));
    return Number(rows[0]?.count ?? 0);
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Writes — Postgres when configured (errors propagate; never silently
// "succeed" into the in-memory store); memory only in no-DB dev mode.
// ---------------------------------------------------------------------------

export async function dbUpsertUser(
  user: Partial<InMemoryUser> & { firebaseUid: string; email: string },
  executor?: any
): Promise<InMemoryUser> {
  const q = executor ?? db;
  if (!q) {
    const saved = inMemoryUserStore.upsertUser(user);
    invalidateCachedAuth(saved.firebaseUid);
    return saved;
  }

  const existing = await q.select().from(schema.users).where(eq(schema.users.firebaseUid, user.firebaseUid)).limit(1);
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

  const savedRows = await q
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
}

export async function dbUpdateUser(id: string, fields: Partial<InMemoryUser>, executor?: any): Promise<InMemoryUser | undefined> {
  const q = executor ?? db;
  if (q) {
    const updateData: Record<string, any> = {};
    if (fields.email !== undefined) updateData.email = fields.email;
    if (fields.fullName !== undefined) updateData.fullName = fields.fullName;
    if (fields.role !== undefined) updateData.role = fields.role;
    if (fields.title !== undefined) updateData.title = fields.title;
    if (fields.phone !== undefined) updateData.phone = fields.phone;
    if (fields.parentPhone !== undefined) updateData.parentPhone = fields.parentPhone;
    if (fields.rollNoOrUSN !== undefined) updateData.rollNoOrUSN = fields.rollNoOrUSN;
    if (fields.department !== undefined) updateData.department = fields.department;
    if (fields.scope !== undefined) updateData.scope = fields.scope;
    if (fields.permissions !== undefined) updateData.permissions = fields.permissions;
    if (fields.profileCompleted !== undefined) updateData.profileCompleted = fields.profileCompleted;
    if (fields.mustChangePassword !== undefined) updateData.mustChangePassword = fields.mustChangePassword;
    if (fields.profilePicUrl !== undefined) updateData.profilePicUrl = fields.profilePicUrl;
    if (fields.tenthPercentage !== undefined) updateData.tenthPercentage = fields.tenthPercentage;
    if (fields.twelfthPercentage !== undefined) updateData.twelfthPercentage = fields.twelfthPercentage;
    if (fields.graduatedAt !== undefined) updateData.graduatedAt = fields.graduatedAt;
    updateData.updatedAt = new Date();

    const updated = await q.update(schema.users).set(updateData).where(eq(schema.users.id, id)).returning();
    if (updated.length > 0) {
      invalidateCachedAuth(updated[0].firebaseUid);
      return mapUserRow(updated[0]);
    }
    return undefined;
  }
  const fallback = inMemoryUserStore.getAll().find((u) => u.id === id);
  if (fallback) {
    Object.assign(fallback, fields, { updatedAt: new Date() });
    invalidateCachedAuth(fallback.firebaseUid);
    return fallback;
  }
  return undefined;
}

export async function dbDeleteUserById(id: string): Promise<boolean> {
  if (db) {
    const deleted = await db.delete(schema.users).where(eq(schema.users.id, id)).returning();
    if (deleted.length > 0) invalidateCachedAuth(deleted[0].firebaseUid);
    return deleted.length > 0;
  }
  const all = inMemoryUserStore.getAll();
  const target = all.find((u) => u.id === id);
  if (target) invalidateCachedAuth(target.firebaseUid);
  return inMemoryUserStore.deleteUser(id);
}

// ---------------------------------------------------------------------------
// Audit log — developer-action history (Postgres; in-memory fallback in dev).
// ---------------------------------------------------------------------------

const inMemoryAuditEvents: schema.AuditEventRecord[] = [];

export interface AuditEventOptions {
  limit?: number;
  offset?: number;
  action?: string;
  targetType?: string;
  targetId?: string;
}

function mapAuditRow(row: schema.AuditEventRow): schema.AuditEventRecord {
  return {
    id: row.id,
    actorEmail: row.actorEmail,
    action: row.action,
    targetType: row.targetType as schema.AuditEventRecord['targetType'],
    targetId: row.targetId || undefined,
    targetLabel: row.targetLabel || undefined,
    details: row.details || undefined,
    createdAt: row.createdAt || new Date(),
  };
}

/**
 * Append an audit event. Never throws — audit failures must not break the
 * operation being audited.
 */
export async function dbInsertAuditEvent(event: Omit<schema.AuditEventRecord, 'id' | 'createdAt'>): Promise<void> {
  try {
    if (db) {
      await db.insert(schema.auditEvents).values({
        actorEmail: event.actorEmail,
        action: event.action,
        targetType: event.targetType,
        targetId: event.targetId || null,
        targetLabel: event.targetLabel || null,
        details: event.details || null,
      });
    } else {
      inMemoryAuditEvents.push({
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...event,
        createdAt: new Date(),
      });
      if (inMemoryAuditEvents.length > 1000) inMemoryAuditEvents.splice(0, inMemoryAuditEvents.length - 1000);
    }
  } catch (err) {
    console.warn('[Audit] failed to record event:', (err as any)?.message);
  }
}

export async function dbListAuditEvents(opts: AuditEventOptions = {}): Promise<{
  data: schema.AuditEventRecord[];
  total: number;
  limit: number;
  offset: number;
}> {
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500);
  const offset = Math.max(opts.offset ?? 0, 0);

  if (db) {
    const conditions: any[] = [];
    if (opts.action) conditions.push(eq(schema.auditEvents.action, opts.action));
    if (opts.targetType) conditions.push(eq(schema.auditEvents.targetType, opts.targetType));
    if (opts.targetId) conditions.push(eq(schema.auditEvents.targetId, opts.targetId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(schema.auditEvents)
        .where(where)
        .orderBy(desc(schema.auditEvents.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(schema.auditEvents).where(where),
    ]);

    return {
      data: rows.map(mapAuditRow),
      total: Number(countRows[0]?.count ?? 0),
      limit,
      offset,
    };
  }

  let list = inMemoryAuditEvents;
  if (opts.action) list = list.filter((e) => e.action === opts.action);
  if (opts.targetType) list = list.filter((e) => e.targetType === opts.targetType);
  if (opts.targetId) list = list.filter((e) => e.targetId === opts.targetId);
  const sorted = [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return {
    data: sorted.slice(offset, offset + limit),
    total: sorted.length,
    limit,
    offset,
  };
}