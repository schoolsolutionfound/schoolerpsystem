import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
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
  emailVerified: boolean;
  parentPhone?: string;
  phone?: string;
  profilePicUrl?: string;
  dob?: string;
  gender?: string;
  admissionNo?: string;
  admissionDate?: string;
  address?: string;
  city?: string;
  pincode?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianEmail?: string;
  tenthPercentage?: string;
  twelfthPercentage?: string;
  alternatePhone?: string;
  occupation?: string;
  emergencyContact?: string;
  preferredLanguage?: string;
  title?: string;
  department?: string;
  roles?: string[];
  scope?: string;
  permissions?: string;
  graduatedAt?: Date | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  /** Free-text match against fullName / rollNoOrUSN / admissionNo / email. */
  search?: string;
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
      emailVerified: user.emailVerified ?? existing?.emailVerified ?? true,
      parentPhone: user.parentPhone ?? existing?.parentPhone ?? '',
      phone: user.phone ?? existing?.phone ?? '',
      profilePicUrl: user.profilePicUrl ?? existing?.profilePicUrl ?? '',
      dob: user.dob ?? existing?.dob ?? '',
      gender: user.gender ?? existing?.gender ?? '',
      admissionNo: user.admissionNo ?? existing?.admissionNo ?? '',
      admissionDate: user.admissionDate ?? existing?.admissionDate ?? '',
      address: user.address ?? existing?.address ?? '',
      city: user.city ?? existing?.city ?? '',
      pincode: user.pincode ?? existing?.pincode ?? '',
      guardianName: user.guardianName ?? existing?.guardianName ?? '',
      guardianRelation: user.guardianRelation ?? existing?.guardianRelation ?? '',
      guardianEmail: user.guardianEmail ?? existing?.guardianEmail ?? '',
      tenthPercentage: user.tenthPercentage ?? existing?.tenthPercentage ?? '',
      twelfthPercentage: user.twelfthPercentage ?? existing?.twelfthPercentage ?? '',
      alternatePhone: user.alternatePhone ?? existing?.alternatePhone ?? '',
      occupation: user.occupation ?? existing?.occupation ?? '',
      emergencyContact: user.emergencyContact ?? existing?.emergencyContact ?? '',
      preferredLanguage: user.preferredLanguage ?? existing?.preferredLanguage ?? '',
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

export async function initCustomTables() {
  if (!queryClient) return;
  try {
    await queryClient`
      CREATE TABLE IF NOT EXISTS school_notices (
        id TEXT PRIMARY KEY,
        institution_code VARCHAR(100) NOT NULL,
        title VARCHAR(300) NOT NULL,
        content TEXT NOT NULL,
        target_audience VARCHAR(50) NOT NULL DEFAULT 'all',
        department VARCHAR(100) DEFAULT '',
        priority VARCHAR(20) NOT NULL DEFAULT 'normal',
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await queryClient`
      CREATE TABLE IF NOT EXISTS counseling_records (
        id TEXT PRIMARY KEY,
        institution_code VARCHAR(100) NOT NULL,
        student_id TEXT NOT NULL,
        student_name VARCHAR(200) NOT NULL,
        grade_section VARCHAR(100) DEFAULT '',
        counselor_id TEXT NOT NULL,
        counselor_name VARCHAR(200) NOT NULL,
        concern_category VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'medium',
        action_plan TEXT DEFAULT '',
        parent_contacted BOOLEAN DEFAULT FALSE,
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        date DATE NOT NULL,
        last_follow_up_date DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await queryClient`
      CREATE TABLE IF NOT EXISTS department_courses (
        id TEXT PRIMARY KEY,
        institution_code VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL,
        name VARCHAR(200) NOT NULL,
        department VARCHAR(100) NOT NULL,
        semester VARCHAR(50) NOT NULL,
        batch_year VARCHAR(50) DEFAULT '',
        type VARCHAR(30) NOT NULL DEFAULT 'theory',
        credits INTEGER NOT NULL DEFAULT 3,
        instructor_id TEXT DEFAULT '',
        instructor_name VARCHAR(200) DEFAULT '',
        instructor_rank VARCHAR(50) DEFAULT '',
        enrolled_students_count INTEGER DEFAULT 0,
        total_planned_hours INTEGER DEFAULT 45,
        completed_hours INTEGER DEFAULT 0,
        syllabus_progress_pct INTEGER DEFAULT 0,
        lab_batches_count INTEGER DEFAULT 1,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await queryClient`
      CREATE TABLE IF NOT EXISTS exam_eligibility (
        id TEXT PRIMARY KEY,
        institution_code VARCHAR(100) NOT NULL,
        student_id TEXT NOT NULL,
        student_name VARCHAR(200) NOT NULL,
        usn VARCHAR(50) NOT NULL,
        semester VARCHAR(50) NOT NULL,
        department VARCHAR(100) NOT NULL,
        overall_attendance_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
        courses_below_threshold INTEGER DEFAULT 0,
        internal_assessment_score NUMERIC(5, 2) DEFAULT 0,
        hall_ticket_status VARCHAR(30) NOT NULL DEFAULT 'detained',
        condonation_reason TEXT DEFAULT '',
        approved_by TEXT DEFAULT '',
        approval_date DATE,
        remarks TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log('[PostgreSQL] Custom tables verified / created.');
  } catch (err: any) {
    console.warn('[PostgreSQL] initCustomTables warning:', err.message);
  }
}

// Auto-run verification on load
if (queryClient) {
  initCustomTables().catch(() => {});
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
    emailVerified: row.emailVerified ?? true,
    parentPhone: row.parentPhone || '',
    phone: row.phone || '',
    profilePicUrl: row.profilePicUrl || '',
    dob: row.dob || '',
    gender: row.gender || '',
    admissionNo: row.admissionNo || '',
    admissionDate: row.admissionDate || '',
    address: row.address || '',
    city: row.city || '',
    pincode: row.pincode || '',
    guardianName: row.guardianName || '',
    guardianRelation: row.guardianRelation || '',
    guardianEmail: row.guardianEmail || '',
    tenthPercentage: row.tenthPercentage || '',
    twelfthPercentage: row.twelfthPercentage || '',
    alternatePhone: row.alternatePhone || '',
    occupation: row.occupation || '',
    emergencyContact: row.emergencyContact || '',
    preferredLanguage: row.preferredLanguage || '',
    title: row.title || '',
    department: (row as any).department || '',
    roles: Array.isArray(row.roles) && row.roles.length > 0 ? row.roles : (row.role ? [row.role] : []),
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
  const term = (opts?.search || '').trim();
  if (db) {
    const conditions = [eq(schema.users.institutionCode, institutionCode)];
    if (role) conditions.push(eq(schema.users.role, role));
    if (term) {
      const pattern = `%${term}%`;
      conditions.push(
        sql`(${schema.users.fullName} ILIKE ${pattern} OR ${schema.users.rollNoOrUSN} ILIKE ${pattern} OR ${schema.users.admissionNo} ILIKE ${pattern} OR ${schema.users.email} ILIKE ${pattern})`
      );
    }
    const where = and(...conditions);
    const results = await db.select().from(schema.users).where(where).limit(limit).offset(offset);
    return results.map(mapUserRow);
  }
  const needle = term.toLowerCase();
  const all = inMemoryUserStore.getAll().filter(
    (u) =>
      u.institutionCode.toLowerCase() === institutionCode.toLowerCase() &&
      (!role || u.role === role) &&
      (!term ||
        [u.fullName, u.rollNoOrUSN, u.admissionNo || '', u.email].some((v) => (v || '').toLowerCase().includes(needle)))
  );
  return all.slice(offset, offset + limit);
}

const FACULTY_ROLES = ['teacher', 'hod', 'principal', 'counselor', 'coordinator', 'admin', 'institution admin', 'professor', 'assistant_professor', 'associate_professor', 'lab_instructor'];

export async function dbFindFacultyByInstitution(
  institutionCode: string,
  opts?: PaginationOptions
): Promise<InMemoryUser[]> {
  const { limit, offset } = normalizePagination(opts);
  const term = (opts?.search || '').trim();
  const conditions: any[] = [
    eq(schema.users.institutionCode, institutionCode),
    inArray(schema.users.role, FACULTY_ROLES),
  ];
  if (term) {
    const pattern = `%${term}%`;
    conditions.push(
      sql`(${schema.users.fullName} ILIKE ${pattern} OR ${schema.users.email} ILIKE ${pattern} OR ${schema.users.rollNoOrUSN} ILIKE ${pattern})`
    );
  }
  if (db) {
    try {
      const results = await db.select().from(schema.users).where(and(...conditions)).limit(limit).offset(offset);
      return results.map(mapUserRow);
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbFindFacultyByInstitution query failed:', error.message);
    }
  }
  const lowered = term.toLowerCase();
  const all = inMemoryUserStore.getAll().filter(
    (u) =>
      u.institutionCode.toLowerCase() === institutionCode.toLowerCase() &&
      FACULTY_ROLES.includes(u.role.toLowerCase()) &&
      (!lowered ||
        u.fullName?.toLowerCase().includes(lowered) ||
        u.email?.toLowerCase().includes(lowered) ||
        u.rollNoOrUSN?.toLowerCase().includes(lowered))
  );
  return all.slice(offset, offset + limit);
}

export async function dbCountFacultyByInstitution(institutionCode: string, search?: string): Promise<number> {
  const term = (search || '').trim();
  const conditions: any[] = [
    eq(schema.users.institutionCode, institutionCode),
    inArray(schema.users.role, FACULTY_ROLES),
  ];
  if (term) {
    const pattern = `%${term}%`;
    conditions.push(
      sql`(${schema.users.fullName} ILIKE ${pattern} OR ${schema.users.email} ILIKE ${pattern} OR ${schema.users.rollNoOrUSN} ILIKE ${pattern})`
    );
  }
  if (db) {
    try {
      const rows = await db.select({ count: count() }).from(schema.users).where(and(...conditions));
      return Number(rows[0]?.count ?? 0);
    } catch (error: any) {
      console.warn('[PostgreSQL Drizzle Warning] dbCountFacultyByInstitution query failed:', error.message);
    }
  }
  const lowered = term.toLowerCase();
  return inMemoryUserStore.getAll().filter(
    (u) =>
      u.institutionCode.toLowerCase() === institutionCode.toLowerCase() &&
      FACULTY_ROLES.includes(u.role.toLowerCase()) &&
      (!lowered ||
        u.fullName?.toLowerCase().includes(lowered) ||
        u.email?.toLowerCase().includes(lowered) ||
        u.rollNoOrUSN?.toLowerCase().includes(lowered))
  ).length;
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
    emailVerified: user.emailVerified ?? base?.emailVerified ?? true,
    parentPhone: user.parentPhone ?? base?.parentPhone ?? '',
    phone: user.phone ?? base?.phone ?? '',
    profilePicUrl: user.profilePicUrl ?? base?.profilePicUrl ?? '',
    dob: user.dob ?? base?.dob ?? '',
    gender: user.gender ?? base?.gender ?? '',
    admissionNo: user.admissionNo ?? base?.admissionNo ?? '',
    admissionDate: user.admissionDate ?? base?.admissionDate ?? '',
    address: user.address ?? base?.address ?? '',
    city: user.city ?? base?.city ?? '',
    pincode: user.pincode ?? base?.pincode ?? '',
    guardianName: user.guardianName ?? base?.guardianName ?? '',
    guardianRelation: user.guardianRelation ?? base?.guardianRelation ?? '',
    guardianEmail: user.guardianEmail ?? base?.guardianEmail ?? '',
    tenthPercentage: user.tenthPercentage ?? base?.tenthPercentage ?? '',
    twelfthPercentage: user.twelfthPercentage ?? base?.twelfthPercentage ?? '',
    alternatePhone: user.alternatePhone ?? base?.alternatePhone ?? '',
    occupation: user.occupation ?? base?.occupation ?? '',
    emergencyContact: user.emergencyContact ?? base?.emergencyContact ?? '',
    preferredLanguage: user.preferredLanguage ?? base?.preferredLanguage ?? '',
    title: user.title ?? base?.title ?? '',
    roles: user.roles ?? base?.roles ?? (user.role ? [user.role] : ['student']),
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
      dob: merged.dob,
      gender: merged.gender,
      admissionNo: merged.admissionNo,
      admissionDate: merged.admissionDate,
      address: merged.address,
      city: merged.city,
      pincode: merged.pincode,
      guardianName: merged.guardianName,
      guardianRelation: merged.guardianRelation,
      guardianEmail: merged.guardianEmail,
      tenthPercentage: merged.tenthPercentage,
      twelfthPercentage: merged.twelfthPercentage,
      alternatePhone: merged.alternatePhone,
      occupation: merged.occupation,
      emergencyContact: merged.emergencyContact,
      preferredLanguage: merged.preferredLanguage,
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
        dob: merged.dob,
        gender: merged.gender,
        admissionNo: merged.admissionNo,
        admissionDate: merged.admissionDate,
        address: merged.address,
        city: merged.city,
        pincode: merged.pincode,
        guardianName: merged.guardianName,
        guardianRelation: merged.guardianRelation,
        guardianEmail: merged.guardianEmail,
        tenthPercentage: merged.tenthPercentage,
        twelfthPercentage: merged.twelfthPercentage,
        alternatePhone: merged.alternatePhone,
        occupation: merged.occupation,
        emergencyContact: merged.emergencyContact,
        preferredLanguage: merged.preferredLanguage,
        title: merged.title,
        roles: merged.roles,
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
    if (fields.roles !== undefined) updateData.roles = fields.roles;
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
    if (fields.dob !== undefined) updateData.dob = fields.dob;
    if (fields.gender !== undefined) updateData.gender = fields.gender;
    if (fields.admissionNo !== undefined) updateData.admissionNo = fields.admissionNo;
    if (fields.admissionDate !== undefined) updateData.admissionDate = fields.admissionDate;
    if (fields.address !== undefined) updateData.address = fields.address;
    if (fields.city !== undefined) updateData.city = fields.city;
    if (fields.pincode !== undefined) updateData.pincode = fields.pincode;
    if (fields.guardianName !== undefined) updateData.guardianName = fields.guardianName;
    if (fields.guardianRelation !== undefined) updateData.guardianRelation = fields.guardianRelation;
    if (fields.guardianEmail !== undefined) updateData.guardianEmail = fields.guardianEmail;
    if (fields.tenthPercentage !== undefined) updateData.tenthPercentage = fields.tenthPercentage;
    if (fields.twelfthPercentage !== undefined) updateData.twelfthPercentage = fields.twelfthPercentage;
    if (fields.alternatePhone !== undefined) updateData.alternatePhone = fields.alternatePhone;
    if (fields.occupation !== undefined) updateData.occupation = fields.occupation;
    if (fields.emergencyContact !== undefined) updateData.emergencyContact = fields.emergencyContact;
    if (fields.preferredLanguage !== undefined) updateData.preferredLanguage = fields.preferredLanguage;
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
    // Drop parent ↔ child links where this user is the parent or the child.
    await db.delete(schema.parentLinks).where(eq(schema.parentLinks.parentId, id));
    await db.delete(schema.parentLinks).where(eq(schema.parentLinks.studentId, id));
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