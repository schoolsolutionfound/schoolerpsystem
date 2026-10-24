import { adminRepository, IAdminRepository } from './admin.repository.js';
import { institutionService } from '../institutions/institution.service.js';
import { academicsRepository } from '../academics/academics.repository.js';
import { getPrimaryParentChild, insertParentLinks, getFamilyChildPairs, DEFAULT_PARENT_PERMISSIONS } from '../users/parent-links.js';
import { RELATION_CANONICAL } from '../users/user.service.js';
import {
  dbFindUsersByInstitution,
  dbCountUsersByInstitution,
  dbFindFacultyByInstitution,
  dbCountFacultyByInstitution,
  dbCountClassSectionsByInstitution,
  dbCountSubjectsByInstitution,
  dbCountAttendanceSessionsByInstitution,
  dbFindUserById,
  dbFindUserByIdOrUid,
  dbFindByEmail,
  dbFindStudentClassSectionId,
  dbUpdateUser,
  dbDeleteUserById,
  dbInsertAuditEvent,
  db,
  withTransaction,
  type InMemoryUser,
} from '../shared/db/index.js';
import { studentClasses, users, studentDocuments, feeStructures, feePayments, expenseRecords } from '../shared/db/schema.js';
import { and as andSql, eq as eqSql, desc as descSql, inArray as inArraySql } from 'drizzle-orm';
import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';
import { resolveProvisionPassword, validatePasswordStrength } from '../shared/utils/password.js';
import { upsertPreferences } from '../notifications/notification.repository.js';
import { sendParentInvite, sendLoginCredentialsInvite } from '../notifications/email.service.js';
import { nextReceiptNo } from '../payments/receipt.js';
import {
  isConfigurableRole,
  normalizeProfileFormField,
  RoleProfileFieldsSchema,
  type ConfigurableRole,
  type ProfileFieldsMap,
} from './profileFields.schema.js';
import {
  COLLEGE_ROLES,
  DEFAULT_INSTITUTION_TYPE,
  normalizeInstitutionType,
  normalizeStructure,
  SCHOOL_ROLES,
  structureFromRecord,
  structureToRecordFields,
} from '../shared/academicStructure.js';

/**
 * Resolve a class_sections row from a (institutionCode, department, academicYear, section) triple
 * and return a `scope` object that includes the resolved classSectionId + classSectionName
 * alongside the raw triple fields. If no match is found, just returns the raw fields.
 *
 * The students `users` table has no `class_section_id` column — class membership is encoded
 * inside `users.scope` (jsonb) so the admin app can filter and the student app can resolve
 * the class without a separate join table.
 */
async function buildClassScope(
  institutionCode: string,
  department: string,
  academicYear: string,
  section: string
): Promise<Record<string, string>> {
  const base: Record<string, string> = {
    department: department || '',
    academicYear: academicYear || '',
    section: section || '',
  };
  const dept = (department || '').trim();
  const yr = (academicYear || '').trim();
  const sec = (section || '').trim();
  if (!dept && !yr && !sec) return base;

  try {
    const allRows = await academicsRepository.listClassSections(institutionCode);
    const all = Array.isArray(allRows) ? allRows : [];
    const match = all.find(
      (c: any) =>
        (c.department || '').trim().toLowerCase() === dept.toLowerCase() &&
        (c.academicYear || '').trim().toLowerCase() === yr.toLowerCase() &&
        (c.section || '').trim().toLowerCase() === sec.toLowerCase()
    );
    if (match) {
      base.classSectionId = match.id;
      base.classSectionName = match.name;
    } else {
      // Legacy school rows (written by the old Academics screen) store the
      // subject in `department` and the class in `academicYear`. Match the
      // canonical request (department = class, academicYear = section letter)
      // against that swapped shape so existing students keep their scope.
      const inst = await institutionService.getInstitutionByCode(institutionCode).catch(() => undefined);
      if (inst && normalizeInstitutionType(inst.institutionType) === 'school') {
        const legacy = all.find(
          (c: any) =>
            (c.academicYear || '').trim().toLowerCase() === dept.toLowerCase() &&
            (c.section || '').trim().toLowerCase() === sec.toLowerCase()
        );
        if (legacy) {
          base.classSectionId = legacy.id;
          base.classSectionName = legacy.name;
        }
      }
    }
  } catch {
    // best-effort: leave scope without the id/name if academics module is unavailable
  }
  return base;
}

export interface SingleFeedPayload {
  firstName: string;
  lastName: string;
  rollNoOrUSN: string;
  email: string;
  dummyPassword?: string;
  institutionCode: string;
  institutionName: string;
  institutionType?: 'school' | 'college';
  role?: 'student' | 'teacher';
  department?: string;
  academicYear?: string;
  section?: string;
}

export interface CreateStudentPayload {
  firstName: string;
  lastName: string;
  email: string;
  /** Optional — schools may backfill later from the edit screen. */
  rollNoOrUSN?: string;
  phone?: string;
  department?: string;
  academicYear?: string;
  section?: string;
  password?: string;
  parentPhone?: string;
  dob?: string;
  gender?: string;
  admissionNo?: string;
  admissionDate?: string;
  sessionId?: string;
  institutionCode: string;
}

export interface CreateTeacherPayload {
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  department?: string;
  password?: string;
  institutionCode: string;
  phone?: string;
  dob?: string;
  gender?: string;
  designation?: string;
  employmentType?: string;
  joiningDate?: string;
  /** School: assigned class/section triple. Merged into scope via buildClassScope. */
  classSection?: { department: string; academicYear: string; section: string };
  /** College: program/degree + semester assignment (stored in scope). */
  program?: string;
  semester?: string;
}


export interface ParentChildLinkInput {
  studentId: string;
  relationship?: string;
  permissions?: string[];
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  role: string;
  roles?: string[];
  phone?: string;
  parentPhone?: string;
  employeeId?: string;
  rollNoOrUSN?: string;
  department?: string;
  academicYear?: string;
  section?: string;
  title?: string;
  password?: string;
  institutionCode: string;
  institutionName?: string;
  institutionType?: 'school' | 'college';
  address?: string;
  city?: string;
  pincode?: string;
  alternatePhone?: string;
  occupation?: string;
  emergencyContact?: string;
  preferredLanguage?: string;
  /** driver only */
  vehicleNumber?: string;
  licenseNumber?: string;
  /** parent only — Father | Mother | Guardian */
  relation?: string;
  /** parent only — at least one student, keyed by student id (no USN) */
  children?: ParentChildLinkInput[];
  /** parent only — push toggles + disabled notification types */
  notificationPrefs?: { pushEnabled?: boolean; disabledTypes?: string[] };
  /** admission_officer only — quota category (name + intake) */
  categoryName?: string;
  seats?: number;
  /** admission_officer only — already-created classes (school) / departments (college) */
  classSections?: string[];
  /** admission_officer only — assigned fee structures (class + amount) */
  feeStructureIds?: string[];
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  role?: string;
  roles?: string[];
  phone?: string;
  parentPhone?: string;
  employeeId?: string;
  rollNoOrUSN?: string;
  department?: string;
  title?: string;
}

/** One CSV row for POST /admin/bulk-create — role is fixed per request. */
export interface BulkCreateRecord {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  rollNoOrUSN?: string;
  department?: string;
  academicYear?: string;
  section?: string;
  employeeId?: string;
  /** parent only — Father | Mother | Guardian */
  relation?: string;
  /** parent only — student emails to link */
  childEmails?: string[];
  /** admission_officer only */
  categoryName?: string;
  /** admission_officer only */
  seats?: number;
}

export class AdminService {
  constructor(private repo: IAdminRepository = adminRepository) {}

  /** Fire-and-forget audit entry — audit failures never break the operation. */
  private recordAudit(
    actorEmail: string | undefined,
    action: string,
    targetType: 'institution' | 'admin' | 'platform' | 'user',
    targetId?: string,
    targetLabel?: string,
    details?: Record<string, any>
  ) {
    void dbInsertAuditEvent({
      actorEmail: actorEmail || 'unknown',
      action,
      targetType,
      targetId,
      targetLabel,
      details,
    });
  }

  private async createFirebaseUser(email: string, password: string, displayName?: string): Promise<string> {
    if (!isFirebaseAdminInitialized) {
      throw { statusCode: 500, code: 'FIREBASE_UNAVAILABLE', message: 'Firebase Admin is not initialized. Cannot create users.' };
    }

    if (!password) {
      // Never fall back to a hardcoded constant — callers must resolve via
      // resolveProvisionPassword() (row password > institution default > random).
      throw { statusCode: 400, code: 'PASSWORD_REQUIRED', message: 'A password is required to create a user.' };
    }

    let firebaseUid: string;
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: displayName || email,
      });
      firebaseUid = userRecord.uid;
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        throw { statusCode: 409, code: 'EMAIL_EXISTS', message: `A user with email "${email}" already exists in Firebase Auth.` };
      } else {
        throw { statusCode: 500, code: 'FIREBASE_USER_CREATE_FAILED', message: `Failed to create Firebase user: ${err.message}` };
      }
    }

    return firebaseUid;
  }

  // --- Academic Configuration ---
  private getDefaultAcademicConfig(institutionType: string) {
    const structure = normalizeStructure(
      { institutionType },
      { applyDefaults: true, fallbackType: DEFAULT_INSTITUTION_TYPE }
    );
    return {
      ...structureToRecordFields(structure),
      terms: structure.terms,
    };
  }

  public async getInstitutionConfig(institutionCode: string) {
    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === (institutionCode || '').toLowerCase())
    );

    if (!inst) {
      return {
        institutionCode: institutionCode || 'DEFAULT',
        institutionName: 'My Institution',
        ...this.getDefaultAcademicConfig(DEFAULT_INSTITUTION_TYPE),
        blockedDates: [],
      };
    }

    const instType = normalizeInstitutionType(inst.institutionType);
    const structure = structureFromRecord(inst);
    const defaults = this.getDefaultAcademicConfig(instType);
    const isSchool = instType === 'school';
    return {
      institutionCode: inst.institutionCode,
      institutionName: inst.institutionName,
      institutionType: inst.institutionType,
      subscriptionStatus: inst.subscriptionStatus,
      departments: structure.units.length ? structure.units : defaults.departments,
      // Schools: classes. Colleges: 2026-27-style sessions are separate, so
      // academicYears is empty and years of study live in yearsOfStudy.
      academicYears: !isSchool ? [] : structure.levels.length ? structure.levels : defaults.academicYears,
      yearsOfStudy: isSchool ? [] : structure.levels.length ? structure.levels : defaults.yearsOfStudy,
      courses: structure.programs.length ? structure.programs : defaults.courses,
      sections: structure.sections.length ? structure.sections : defaults.sections,
      classSubjects: inst.classSubjects || {},
      terms: inst.terms?.length ? inst.terms : defaults.terms,
      blockedDates: inst.blockedDates || [],
      // Boolean only — the default password value itself never leaves the server.
      hasDefaultPassword: Boolean(inst.defaultTempPassword),
      maintenanceEnabled: (inst as any).maintenanceEnabled ?? false,
      maintenanceMinVersion: (inst as any).maintenanceMinVersion || '0.0.0',
    };
  }

  public async updateInstitutionConfig(
    institutionCode: string,
    payload: { departments?: string[]; academicYears?: string[]; yearsOfStudy?: string[]; courses?: string[]; sections?: string[]; classSubjects?: Record<string, string[]>; terms?: any[]; blockedDates?: any[]; defaultTempPassword?: string; maintenanceEnabled?: boolean; maintenanceMinVersion?: string }
  ) {
    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === (institutionCode || '').toLowerCase())
    );

    if (inst) {
      const update: any = {};
      if (payload.departments !== undefined) update.departments = payload.departments;
      if (payload.academicYears !== undefined) update.academicYears = payload.academicYears;
      if (payload.yearsOfStudy !== undefined) update.yearsOfStudy = payload.yearsOfStudy;
      if (payload.courses !== undefined) update.courses = payload.courses;
      if (payload.terms !== undefined) update.terms = payload.terms;
      if (payload.blockedDates !== undefined) update.blockedDates = payload.blockedDates;
      if (payload.sections !== undefined) update.sections = payload.sections;
      if (payload.classSubjects !== undefined) update.classSubjects = payload.classSubjects;
      if (payload.defaultTempPassword !== undefined) {
        const next = payload.defaultTempPassword;
        if (next !== '') {
          const check = validatePasswordStrength(next);
          if (!check.ok) {
            throw { statusCode: 400, code: 'WEAK_DEFAULT_PASSWORD', message: check.message };
          }
        }
        update.defaultTempPassword = next;
      }
      if (payload.maintenanceEnabled !== undefined) update.maintenanceEnabled = payload.maintenanceEnabled;
      if (payload.maintenanceMinVersion !== undefined) update.maintenanceMinVersion = payload.maintenanceMinVersion;
      await institutionService.updateInstitution(inst.id, update as any);
    }

    return this.getInstitutionConfig(institutionCode);
  }

  // --- Per-role profile form fields (Settings → Form Fields) ---

  /** Full { role: fields[] } map for the institution (admin UI). */
  public async getProfileFields(institutionCode: string): Promise<ProfileFieldsMap> {
    return institutionService.getProfileFormFieldsMap(institutionCode);
  }

  /** Fields configured for a single role (used by profile APIs). */
  public async getRoleProfileFields(institutionCode: string, role: string) {
    return institutionService.getRoleProfileFormFields(institutionCode, role);
  }

  /** Replaces the field list for one role. admin/dev roles are not configurable. */
  public async updateRoleProfileFields(institutionCode: string, role: string, fields: unknown) {
    const normalizedRole = (role || '').toLowerCase().trim();
    if (!isConfigurableRole(normalizedRole)) {
      throw {
        statusCode: 400,
        code: 'ROLE_NOT_CONFIGURABLE',
        message: 'Form fields can only be configured for institution roles (not admin or developer).',
      };
    }

    const parsed = RoleProfileFieldsSchema.safeParse(fields);
    if (!parsed.success) {
      throw {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: parsed.error.errors?.[0]?.message || 'Invalid form field definition.',
      };
    }

    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === (institutionCode || '').toLowerCase())
    );
    if (!inst) {
      throw { statusCode: 404, code: 'INSTITUTION_NOT_FOUND', message: 'No institution found for this account.' };
    }

    const current = await this.getProfileFields(institutionCode);
    const next: ProfileFieldsMap = {
      ...current,
      [normalizedRole]: parsed.data.map(normalizeProfileFormField),
    };
    await institutionService.updateInstitution(inst.id, { profileFormFields: next } as any);

    return next;
  }

  // --- Dashboard Stats ---
  public async getDashboardStats(institutionCode: string) {
    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === (institutionCode || '').toLowerCase())
    );

    const [students, teachers, totalUsers, classSections, subjects, attendanceSessions] = await Promise.all([
      dbCountUsersByInstitution(institutionCode, 'student'),
      dbCountUsersByInstitution(institutionCode, 'teacher'),
      dbCountUsersByInstitution(institutionCode),
      dbCountClassSectionsByInstitution(institutionCode),
      dbCountSubjectsByInstitution(institutionCode),
      dbCountAttendanceSessionsByInstitution(institutionCode),
    ]);

    return {
      institutionCode,
      institutionName: inst?.institutionName || 'My Institution',
      institutionType: inst?.institutionType || DEFAULT_INSTITUTION_TYPE,
      subscriptionStatus: inst?.subscriptionStatus || 'active',
      students,
      teachers,
      totalUsers,
      classSections,
      subjects,
      attendanceSessions,
    };
  }

  // --- Student Management ---

  /**
   * Attach `sessionId` of each student's earliest enrollment (their joined
   * session) to plain user objects returned by the users table queries.
   */
  private async attachJoinedSessions<T extends { id: string }>(items: T[]): Promise<(T & { sessionId: string })[]> {
    if (!db || items.length === 0) return items.map((i) => ({ ...i, sessionId: '' }));
    try {
      const rows = await db
        .select({
          studentId: studentClasses.studentId,
          sessionId: studentClasses.sessionId,
          effectiveFrom: studentClasses.effectiveFrom,
        })
        .from(studentClasses)
        .where(inArraySql(studentClasses.studentId, items.map((i) => i.id)));
      rows.sort((a, b) => (a.effectiveFrom || '').localeCompare(b.effectiveFrom || ''));
      const joined = new Map<string, string>();
      for (const r of rows) {
        if (!joined.has(r.studentId)) joined.set(r.studentId, r.sessionId || '');
      }
      return items.map((i) => ({ ...i, sessionId: joined.get(i.id) || '' }));
    } catch {
      return items.map((i) => ({ ...i, sessionId: '' }));
    }
  }
  public async getStudents(institutionCode: string, limit = 100, offset = 0, search = '') {
    const [items, total] = await Promise.all([
      dbFindUsersByInstitution(institutionCode, 'student', { limit, offset, search: search || undefined }),
      dbCountUsersByInstitution(institutionCode, 'student'),
    ]);
    return { data: await this.attachJoinedSessions(items), total, limit, offset };
  }

  public async createStudent(payload: CreateStudentPayload) {
    if (!payload.email || !payload.firstName || !payload.lastName) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'Missing required student fields (email, firstName, lastName)' };
    }

    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === (payload.institutionCode || '').toLowerCase())
    );
    const institutionName = inst?.institutionName || payload.institutionCode;
    const institutionType = inst?.institutionType || DEFAULT_INSTITUTION_TYPE;

    const displayName = `${payload.firstName} ${payload.lastName}`.trim();
    const resolved = resolveProvisionPassword(payload.password, inst?.defaultTempPassword);
    const firebaseUid = await this.createFirebaseUser(payload.email, resolved.password, displayName);

    const scopeObj = JSON.stringify(
      await buildClassScope(
        payload.institutionCode,
        payload.department || '',
        payload.academicYear || '',
        payload.section || ''
      )
    );

    // Academic session the student is admitted under. Admin may backfill
    // past joiners (e.g. 2024-25); defaults to the current session.
    let sessionId = '';
    if (payload.sessionId) {
      const picked = await academicsRepository.getAcademicSessionById(payload.sessionId);
      if (!picked || (picked.institutionCode || '').toLowerCase() !== (payload.institutionCode || '').toLowerCase()) {
        throw { statusCode: 400, code: 'SESSION_NOT_FOUND', message: 'Selected academic session not found.' };
      }
      sessionId = picked.id;
    } else {
      const currentSession = await academicsRepository.getCurrentAcademicSession(payload.institutionCode);
      sessionId = currentSession?.id || '';
    }

    const writeStudent = async (tx: any) => {
      const createdUser = await this.repo.upsertUser(
        {
          firebaseUid,
          email: payload.email,
          fullName: displayName,
          role: 'student',
          institutionCode: payload.institutionCode,
          institutionName,
          institutionType,
          rollNoOrUSN: payload.rollNoOrUSN || '',
          phone: payload.phone || '',
          parentPhone: payload.parentPhone || '',
          dob: payload.dob || '',
          gender: payload.gender || '',
          admissionNo: payload.admissionNo || '',
          admissionDate: payload.admissionDate || '',
          mustChangePassword: true,
          profileCompleted: false,
          scope: scopeObj,
        },
        tx
      );

      const scope = scopeObj ? JSON.parse(scopeObj) : {};
      const q = tx ?? db;
      if (scope?.classSectionId && q) {
        const existing = await q
          .select({ id: studentClasses.id })
          .from(studentClasses)
          .where(
            andSql(
              eqSql(studentClasses.classSectionId, scope.classSectionId),
              eqSql(studentClasses.studentId, createdUser.id),
              eqSql(studentClasses.academicYear, scope.academicYear || '')
            )
          )
          .limit(1);
        if (existing.length === 0) {
          const id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          await q.insert(studentClasses).values({
            id,
            institutionCode: payload.institutionCode,
            studentId: createdUser.id,
            classSectionId: scope.classSectionId,
            rollNo: payload.rollNoOrUSN || '',
            academicYear: scope.academicYear || '',
            sessionId,
            effectiveFrom: payload.admissionDate || undefined,
            isActive: true,
          });
        }
      }
      return createdUser;
    };

    const createdUser = db ? await withTransaction(writeStudent) : await writeStudent(null);
    return resolved.tempPassword ? { ...createdUser, tempPassword: resolved.tempPassword } : createdUser;
  }

  public async getStudentById(id: string, institutionCode: string) {
    const user = await dbFindUserById(id);
    if (!user || user.role !== 'student' || user.institutionCode !== institutionCode) {
      throw { statusCode: 404, code: 'STUDENT_NOT_FOUND', message: 'Student not found.' };
    }
    return (await this.attachJoinedSessions([user]))[0];
  }

  public async updateStudent(id: string, payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    rollNoOrUSN?: string;
    department?: string;
    academicYear?: string;
    section?: string;
    phone?: string;
    parentPhone?: string;
    dob?: string;
    gender?: string;
    admissionNo?: string;
    admissionDate?: string;
    sessionId?: string;
    tenthPercentage?: string;
    twelfthPercentage?: string;
  }, institutionCode: string) {
    const existing = await dbFindUserById(id);
    if (!existing || existing.role !== 'student' || existing.institutionCode !== institutionCode) {
      throw { statusCode: 404, code: 'STUDENT_NOT_FOUND', message: 'Student not found.' };
    }

    const updateFields: any = {};
    if (payload.firstName || payload.lastName) {
      const first = payload.firstName || existing.fullName.split(' ')[0] || '';
      const last = payload.lastName || existing.fullName.split(' ').slice(1).join('') || '';
      updateFields.fullName = `${first} ${last}`.trim();
    }
    if (payload.email) updateFields.email = payload.email;
    if (payload.rollNoOrUSN !== undefined) updateFields.rollNoOrUSN = payload.rollNoOrUSN;
    if (payload.phone !== undefined) updateFields.phone = payload.phone;
    if (payload.parentPhone !== undefined) updateFields.parentPhone = payload.parentPhone;
    if (payload.dob !== undefined) updateFields.dob = payload.dob;
    if (payload.gender !== undefined) updateFields.gender = payload.gender;
    if (payload.admissionNo !== undefined) updateFields.admissionNo = payload.admissionNo;
    if (payload.admissionDate !== undefined) updateFields.admissionDate = payload.admissionDate;
    if (payload.tenthPercentage !== undefined) updateFields.tenthPercentage = payload.tenthPercentage;
    if (payload.twelfthPercentage !== undefined) updateFields.twelfthPercentage = payload.twelfthPercentage;

    if (payload.department || payload.academicYear || payload.section) {
      const scope = typeof existing.scope === 'string' ? JSON.parse(existing.scope) : (existing.scope || {});
      const newScope = await buildClassScope(
        institutionCode,
        payload.department || scope.department || '',
        payload.academicYear || scope.academicYear || '',
        payload.section || scope.section || ''
      );
      updateFields.scope = JSON.stringify(newScope);
    }

    if (payload.sessionId) {
      const picked = await academicsRepository.getAcademicSessionById(payload.sessionId);
      if (!picked || (picked.institutionCode || '').toLowerCase() !== institutionCode.toLowerCase()) {
        throw { statusCode: 400, code: 'SESSION_NOT_FOUND', message: 'Selected academic session not found.' };
      }
      if (db) {
        await db
          .update(studentClasses)
          .set({ sessionId: picked.id, updatedAt: new Date() })
          .where(andSql(eqSql(studentClasses.studentId, id), eqSql(studentClasses.isActive, true)));
      }
    }

    const updatedUser = await dbUpdateUser(id, updateFields);
    return payload.sessionId
      ? { ...(updatedUser || existing), sessionId: payload.sessionId }
      : updatedUser;
  }

  public async deleteStudent(id: string, institutionCode: string) {
    const existing = await dbFindUserById(id);
    if (!existing || existing.role !== 'student' || existing.institutionCode !== institutionCode) {
      throw { statusCode: 404, code: 'STUDENT_NOT_FOUND', message: 'Student not found.' };
    }

    if (isFirebaseAdminInitialized) {
      try {
        await admin.auth().deleteUser(existing.firebaseUid);
      } catch (err: any) {
        console.warn('[deleteStudent] Firebase delete failed (proceeding with DB delete):', err.message);
      }
    }

    await dbDeleteUserById(id);
    return { message: 'Student deleted successfully' };
  }

  public async promoteStudents(studentIds: string[], targetClassSectionId: string, academicYear: string, institutionCode: string) {
    if (!studentIds.length || !targetClassSectionId) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'studentIds and targetClassSectionId are required.' };
    }

    const promoteOne = async (tx: any, sid: string): Promise<boolean> => {
      const user = await dbFindUserById(sid);
      if (!user || user.role !== 'student' || user.institutionCode !== institutionCode) return false;

      const existingScope = typeof user.scope === 'string' ? JSON.parse(user.scope) : (user.scope || {});
      const newScope = { ...existingScope, classSectionId: targetClassSectionId, academicYear };

      await dbUpdateUser(sid, { scope: JSON.stringify(newScope) }, tx);

      const q = tx ?? db;
      if (q) {
        const now = new Date().toISOString().split('T')[0];
        const activeEnrollments = await q
          .select({ id: studentClasses.id })
          .from(studentClasses)
          .where(
            andSql(
              eqSql(studentClasses.studentId, sid),
              eqSql(studentClasses.isActive, true)
            )
          );
        for (const enr of activeEnrollments) {
          await q.update(studentClasses).set({ effectiveTo: now, isActive: false, updatedAt: new Date() }).where(eqSql(studentClasses.id, enr.id));
        }

        const id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const currentSession = await academicsRepository.getCurrentAcademicSession(institutionCode);
        await q.insert(studentClasses).values({
          id,
          institutionCode,
          studentId: sid,
          classSectionId: targetClassSectionId,
          rollNo: user.rollNoOrUSN || '',
          academicYear,
          sessionId: currentSession?.id || '',
          effectiveFrom: now,
          isActive: true,
        });
      }
      return true;
    };

    let promoted = 0;
    if (db) {
      await withTransaction(async (tx) => {
        for (const sid of studentIds) {
          if (await promoteOne(tx, sid)) promoted++;
        }
      });
    } else {
      for (const sid of studentIds) {
        if (await promoteOne(null, sid)) promoted++;
      }
    }
    return { promoted, total: studentIds.length };
  }

  public async graduateStudents(studentIds: string[], institutionCode: string) {
    if (!studentIds.length) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'studentIds are required.' };
    }

    const graduateOne = async (tx: any, sid: string): Promise<boolean> => {
      const user = await dbFindUserById(sid);
      if (!user || user.role !== 'student' || user.institutionCode !== institutionCode) return false;

      await dbUpdateUser(sid, { graduatedAt: new Date() }, tx);

      const q = tx ?? db;
      if (q) {
        const activeEnrollments = await q
          .select({ id: studentClasses.id })
          .from(studentClasses)
          .where(
            andSql(
              eqSql(studentClasses.studentId, sid),
              eqSql(studentClasses.isActive, true)
            )
          );
        for (const enr of activeEnrollments) {
          await q.update(studentClasses).set({ effectiveTo: new Date().toISOString().split('T')[0], isActive: false, updatedAt: new Date() }).where(eqSql(studentClasses.id, enr.id));
        }
      }
      return true;
    };

    let graduated = 0;
    if (db) {
      await withTransaction(async (tx) => {
        for (const sid of studentIds) {
          if (await graduateOne(tx, sid)) graduated++;
        }
      });
    } else {
      for (const sid of studentIds) {
        if (await graduateOne(null, sid)) graduated++;
      }
    }
    return { graduated, total: studentIds.length };
  }

  public async getAlumni(institutionCode: string, limit = 100, offset = 0) {
    if (db) {
      try {
        const all = await dbFindUsersByInstitution(institutionCode, 'student', { limit: 500, offset: 0 });
        const alumni = all.filter((u: any) => u.graduatedAt);
        return { data: alumni.slice(offset, offset + limit), total: alumni.length, limit, offset };
      } catch {
        // fall through
      }
    }
    const all = await dbFindUsersByInstitution(institutionCode, 'student', { limit: 500, offset: 0 });
    const alumni = all.filter((u: any) => u.graduatedAt);
    return { data: alumni.slice(offset, offset + limit), total: alumni.length, limit, offset };
  }

  // --- Student Documents ---
  public async getStudentDocuments(studentId: string, institutionCode: string) {
    if (!db) return { data: [], total: 0 };
    try {
      const results = await db
        .select()
        .from(studentDocuments)
        .where(
          andSql(
            eqSql(studentDocuments.studentId, studentId),
            eqSql(studentDocuments.institutionCode, institutionCode)
          )
        );
      return { data: results, total: results.length };
    } catch (err: any) {
      console.warn('[getStudentDocuments] query failed:', err.message);
      return { data: [], total: 0 };
    }
  }

  public async addStudentDocument(studentId: string, institutionCode: string, payload: { documentType: string; fileName: string; fileUrl: string }) {
    const user = await dbFindUserById(studentId);
    if (!user || user.role !== 'student' || user.institutionCode !== institutionCode) {
      throw { statusCode: 404, code: 'STUDENT_NOT_FOUND', message: 'Student not found.' };
    }
    if (!db) throw { statusCode: 500, code: 'DB_UNAVAILABLE', message: 'Database unavailable.' };

    const id = `sd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const [doc] = await db.insert(studentDocuments).values({
      id,
      institutionCode,
      studentId,
      documentType: payload.documentType,
      fileName: payload.fileName,
      fileUrl: payload.fileUrl,
    }).returning();
    return doc;
  }

  public async deleteStudentDocument(studentId: string, docId: string, institutionCode: string) {
    if (!db) throw { statusCode: 500, code: 'DB_UNAVAILABLE', message: 'Database unavailable.' };
    const [deleted] = await db
      .delete(studentDocuments)
      .where(
        andSql(
          eqSql(studentDocuments.id, docId),
          eqSql(studentDocuments.studentId, studentId),
          eqSql(studentDocuments.institutionCode, institutionCode)
        )
      )
      .returning();
    if (!deleted) throw { statusCode: 404, code: 'DOC_NOT_FOUND', message: 'Document not found.' };
    return { message: 'Document deleted successfully' };
  }

  // --- Teacher / Faculty Management ---
  public async getTeachers(institutionCode: string, limit = 100, offset = 0, search = '') {
    const [items, total] = await Promise.all([
      dbFindFacultyByInstitution(institutionCode, { limit, offset, search: search || undefined }),
      dbCountFacultyByInstitution(institutionCode, search || undefined),
    ]);
    return { data: items, total, limit, offset };
  }

  public async createTeacher(payload: CreateTeacherPayload) {
    if (!payload.email || !payload.firstName || !payload.lastName) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'Missing required teacher fields (email, firstName, lastName)' };
    }

    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === (payload.institutionCode || '').toLowerCase())
    );
    const institutionName = inst?.institutionName || payload.institutionCode;

    const displayName = `${payload.firstName} ${payload.lastName}`.trim();
    const resolved = resolveProvisionPassword(payload.password, inst?.defaultTempPassword);
    const firebaseUid = await this.createFirebaseUser(payload.email, resolved.password, displayName);

    const scopeObj: Record<string, any> = {
      employeeId: payload.employeeId || '',
      department: payload.department || '',
      ...(payload.designation ? { designation: payload.designation } : {}),
      ...(payload.employmentType ? { employmentType: payload.employmentType } : {}),
      ...(payload.joiningDate ? { joiningDate: payload.joiningDate } : {}),
      ...(payload.program ? { program: payload.program } : {}),
      ...(payload.semester ? { semester: payload.semester } : {}),
    };
    const cs = payload.classSection;
    if (cs && ((cs.department || '').trim() || (cs.academicYear || '').trim() || (cs.section || '').trim())) {
      const built = await buildClassScope(
        payload.institutionCode,
        (cs.department || '').toString(),
        (cs.academicYear || '').toString(),
        (cs.section || '').toString()
      );
      Object.assign(scopeObj, built);
      scopeObj.classSection = {
        department: (cs.department || '').toString(),
        academicYear: (cs.academicYear || '').toString(),
        section: (cs.section || '').toString(),
      };
    }

    const createdUser = await this.repo.upsertUser({
      firebaseUid,
      email: payload.email,
      fullName: displayName,
      role: 'teacher',
      institutionCode: payload.institutionCode,
      institutionName,
      title: payload.designation || '',
      phone: payload.phone || '',
      dob: payload.dob || '',
      gender: payload.gender || '',
      mustChangePassword: true,
      profileCompleted: false,
      scope: JSON.stringify(scopeObj),
    });

    return resolved.tempPassword ? { ...createdUser, tempPassword: resolved.tempPassword } : createdUser;
  }

  public async updateTeacher(id: string, payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    employeeId?: string;
    department?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    designation?: string;
    employmentType?: string;
    joiningDate?: string;
    classSection?: { department: string; academicYear: string; section: string };
    program?: string;
    semester?: string;
  }, institutionCode: string) {
    const existing = await dbFindUserById(id);
    if (!existing || existing.role !== 'teacher' || existing.institutionCode !== institutionCode) {
      throw { statusCode: 404, code: 'TEACHER_NOT_FOUND', message: 'Teacher not found.' };
    }

    const updateFields: any = {};
    if (payload.firstName || payload.lastName) {
      const first = payload.firstName || existing.fullName.split(' ')[0] || '';
      const last = payload.lastName || existing.fullName.split(' ').slice(1).join('') || '';
      updateFields.fullName = `${first} ${last}`.trim();
    }
    if (payload.email) updateFields.email = payload.email;
    if (payload.phone !== undefined) updateFields.phone = payload.phone;
    if (payload.dob !== undefined) updateFields.dob = payload.dob;
    if (payload.gender !== undefined) updateFields.gender = payload.gender;
    if (payload.designation !== undefined) updateFields.title = payload.designation;

    const scopeTouched =
      payload.employeeId !== undefined ||
      payload.department !== undefined ||
      payload.designation !== undefined ||
      payload.employmentType !== undefined ||
      payload.joiningDate !== undefined ||
      payload.program !== undefined ||
      payload.semester !== undefined ||
      (payload.classSection && true);

    if (scopeTouched) {
      const scope = typeof existing.scope === 'string' ? JSON.parse(existing.scope || '{}') : (existing.scope || {});
      const newScope: Record<string, any> = { ...scope };
      if (payload.employeeId !== undefined) newScope.employeeId = payload.employeeId;
      if (payload.department !== undefined) newScope.department = payload.department;
      if (payload.designation !== undefined) newScope.designation = payload.designation;
      if (payload.employmentType !== undefined) newScope.employmentType = payload.employmentType;
      if (payload.joiningDate !== undefined) newScope.joiningDate = payload.joiningDate;
      if (payload.program !== undefined) newScope.program = payload.program;
      if (payload.semester !== undefined) newScope.semester = payload.semester;
      if (payload.classSection) {
        const built = await buildClassScope(
          institutionCode,
          (payload.classSection.department || '').toString(),
          (payload.classSection.academicYear || '').toString(),
          (payload.classSection.section || '').toString()
        );
        Object.assign(newScope, built);
        newScope.classSection = {
          department: (payload.classSection.department || '').toString(),
          academicYear: (payload.classSection.academicYear || '').toString(),
          section: (payload.classSection.section || '').toString(),
        };
      }
      updateFields.scope = JSON.stringify(newScope);
    }

    return dbUpdateUser(id, updateFields);
  }

  public async deleteTeacher(id: string, institutionCode: string) {
    const existing = await dbFindUserById(id);
    if (!existing || existing.role !== 'teacher' || existing.institutionCode !== institutionCode) {
      throw { statusCode: 404, code: 'TEACHER_NOT_FOUND', message: 'Teacher not found.' };
    }

    if (isFirebaseAdminInitialized) {
      try {
        await admin.auth().deleteUser(existing.firebaseUid);
      } catch (err: any) {
        console.warn('[deleteTeacher] Firebase delete failed (proceeding with DB delete):', err.message);
      }
    }

    await dbDeleteUserById(id);
    return { message: 'Teacher deleted successfully' };
  }

  // --- Unified User Management (all roles) ---
  /** Attach children (name + relationship) to parent rows from parent_links. */
  private async attachParentChildren(
    institutionCode: string,
    items: InMemoryUser[]
  ): Promise<InMemoryUser[]> {
    const parentRows = items.filter((u) => (u.role || '').toLowerCase() === 'parent');
    if (parentRows.length === 0) return items;

    const pairs = await getFamilyChildPairs(
      institutionCode,
      parentRows.map((p) => p.id)
    );
    const nameCache = new Map<string, string>();
    await Promise.all(
      Array.from(new Set(pairs.map((p) => p.studentId))).map(async (sid) => {
        const s = await dbFindUserById(sid);
        nameCache.set(sid, s?.fullName || '');
      })
    );
    const childrenByParent = new Map<
      string,
      { studentId: string; name: string; relationship: string }[]
    >();
    for (const p of pairs) {
      const list = childrenByParent.get(p.parentId) || [];
      list.push({
        studentId: p.studentId,
        name: nameCache.get(p.studentId) || '',
        relationship: p.relationship,
      });
      childrenByParent.set(p.parentId, list);
    }
    return items.map((u) => {
      if ((u.role || '').toLowerCase() !== 'parent') return u;
      const children = childrenByParent.get(u.id) || [];
      return { ...u, children, childrenCount: children.length };
    });
  }

  public async getUsers(institutionCode: string, limit = 100, offset = 0, search = '') {
    const [items, total] = await Promise.all([
      dbFindUsersByInstitution(institutionCode, undefined, { limit, offset, search: search || undefined }),
      dbCountUsersByInstitution(institutionCode),
    ]);
    return { data: await this.attachParentChildren(institutionCode, items), total, limit, offset };
  }

  public async createUser(payload: CreateUserPayload, actorEmail?: string) {
    if (!payload.fullName || !payload.email || !payload.role) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'fullName, email, and role are required' };
    }

    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === payload.institutionCode.toLowerCase())
    );
    const instType: 'school' | 'college' = (payload.institutionType || inst?.institutionType || DEFAULT_INSTITUTION_TYPE) as 'school' | 'college';
    const validRoles = instType === 'college' ? COLLEGE_ROLES : SCHOOL_ROLES;

    const normalizedRole = payload.role.toLowerCase().trim();
    if (!validRoles.includes(normalizedRole as any)) {
      throw {
        statusCode: 400,
        code: 'INVALID_ROLE',
        message: `"${normalizedRole}" is not valid for a ${instType} institution. Allowed: ${validRoles.join(', ')}`,
      };
    }

    let assignedRoles: string[] = [];
    if (payload.roles && Array.isArray(payload.roles) && payload.roles.length > 0) {
      for (const r of payload.roles) {
        const nr = r.toLowerCase().trim();
        if (!validRoles.includes(nr as any)) {
          throw {
            statusCode: 400,
            code: 'INVALID_ROLE',
            message: `"${nr}" is not valid for a ${instType} institution. Allowed: ${validRoles.join(', ')}`,
          };
        }
        assignedRoles.push(nr);
      }
    } else {
      assignedRoles = [normalizedRole];
    }
    const primaryRole = assignedRoles[0] || normalizedRole;

    // --- Parent-specific validation (invite flow, links keyed by studentId) ---
    const isParent = primaryRole === 'parent';
    let parentRelation = '';
    let parentChildren: {
      studentId: string;
      name: string;
      relationship: string;
      permissions: string[];
    }[] = [];
    if (isParent) {
      parentRelation = RELATION_CANONICAL[(payload.relation || '').trim().toLowerCase()] || '';
      if (!parentRelation) {
        throw {
          statusCode: 400,
          code: 'INVALID_RELATION',
          message: 'relation must be one of: Father, Mother, Guardian.',
        };
      }
      const requested = Array.isArray(payload.children) ? payload.children.filter((c) => c && c.studentId) : [];
      if (requested.length === 0) {
        throw {
          statusCode: 400,
          code: 'NO_CHILDREN',
          message: 'Link at least one student to this parent account.',
        };
      }
      const seen = new Set<string>();
      for (const child of requested) {
        if (seen.has(child.studentId)) continue;
        seen.add(child.studentId);
        const student = await dbFindUserById(child.studentId);
        if (
          !student ||
          (student.role || '').toLowerCase() !== 'student' ||
          (student.institutionCode || '').toLowerCase() !== payload.institutionCode.toLowerCase()
        ) {
          throw {
            statusCode: 400,
            code: 'STUDENT_NOT_FOUND',
            message: 'One of the linked students was not found in this institution.',
          };
        }
        parentChildren.push({
          studentId: student.id,
          name: student.fullName || '',
          relationship:
            RELATION_CANONICAL[(child.relationship || '').trim().toLowerCase()] || parentRelation,
          permissions:
            Array.isArray(child.permissions) && child.permissions.length > 0
              ? child.permissions
              : DEFAULT_PARENT_PERMISSIONS,
        });
      }
    }

    // Parents never pick a password — the server mints a temp password that is
    // emailed as an invite (surfaced once in dev when SES is not configured).
    const resolved = resolveProvisionPassword(
      isParent ? undefined : payload.password,
      isParent ? undefined : inst?.defaultTempPassword
    );
    if (resolved.source === 'provided') {
      const check = validatePasswordStrength(resolved.password);
      if (!check.ok) {
        throw { statusCode: 400, code: 'WEAK_PASSWORD', message: check.message };
      }
    }
    const firebaseUid = await this.createFirebaseUser(payload.email, resolved.password, payload.fullName);

    const hasClassTriple = Boolean(
      (payload.department || '').toString().trim() ||
        (payload.academicYear || '').toString().trim() ||
        (payload.section || '').toString().trim()
    );

    const scopeObj: Record<string, any> = hasClassTriple
      ? await buildClassScope(
          payload.institutionCode,
          (payload.department || '').toString(),
          (payload.academicYear || '').toString(),
          (payload.section || '').toString()
        )
      : {};
    if (payload.employeeId) scopeObj.employeeId = payload.employeeId;
    if (payload.vehicleNumber) scopeObj.vehicleNumber = payload.vehicleNumber;
    if (payload.licenseNumber) scopeObj.licenseNumber = payload.licenseNumber;
    // Admission officer: quota category (name + seats) and assigned fee
    // structures — stored in users.scope (jsonb).
    if (assignedRoles.includes('admission_officer')) {
      if ((payload.categoryName || '').trim()) scopeObj.categoryName = payload.categoryName!.trim();
      if (typeof payload.seats === 'number' && Number.isFinite(payload.seats)) scopeObj.seats = payload.seats;
      const picked = Array.isArray(payload.classSections)
        ? payload.classSections.map((c) => (c || '').trim()).filter(Boolean)
        : [];
      if (picked.length) scopeObj.classSections = picked;
      const feeIds = Array.isArray(payload.feeStructureIds)
        ? payload.feeStructureIds.map((f) => (f || '').trim()).filter(Boolean)
        : [];
      if (feeIds.length) scopeObj.feeStructureIds = feeIds;
    }
    // Parent linking lives in parent_links — scope only carries the relation
    // label for legacy display paths (linkedStudentUSN is never written).
    if (isParent) scopeObj.relation = parentRelation;

    const createdUser = await this.repo.upsertUser({
      firebaseUid,
      email: payload.email,
      fullName: payload.fullName,
      role: primaryRole,
      roles: assignedRoles,
      institutionCode: payload.institutionCode,
      institutionName: payload.institutionName || payload.institutionCode,
      institutionType: instType,
      title: payload.title || '',
      rollNoOrUSN: payload.rollNoOrUSN || '',
      parentPhone: primaryRole === 'student' ? (payload.parentPhone || '') : undefined,
      phone: payload.phone || '',
      address: payload.address,
      city: payload.city,
      pincode: payload.pincode,
      alternatePhone: payload.alternatePhone,
      occupation: payload.occupation,
      emergencyContact: payload.emergencyContact,
      preferredLanguage: payload.preferredLanguage,
      mustChangePassword: true,
      profileCompleted: false,
      scope: JSON.stringify(scopeObj),
    });

    this.recordAudit(actorEmail, 'user.created', 'user', createdUser.id, `${payload.email} @ ${payload.institutionCode}`, {
      role: primaryRole,
      institutionCode: payload.institutionCode,
      passwordSource: resolved.source,
    });

    if (isParent) {
      await insertParentLinks(
        payload.institutionCode,
        createdUser.id,
        parentChildren.map((c) => ({
          studentId: c.studentId,
          relationship: c.relationship,
          permissions: c.permissions,
        }))
      );
      await upsertPreferences(createdUser.id, payload.institutionCode, {
        pushEnabled: payload.notificationPrefs?.pushEnabled !== false,
        disabledTypes: Array.isArray(payload.notificationPrefs?.disabledTypes)
          ? payload.notificationPrefs!.disabledTypes
          : [],
      });

      const invite = await sendParentInvite({
        institutionCode: payload.institutionCode,
        institutionName: payload.institutionName || inst?.institutionName || '',
        email: payload.email,
        fullName: payload.fullName,
        tempPassword: resolved.tempPassword || resolved.password,
        childNames: parentChildren.map((c) => c.name).filter(Boolean),
      });
      const childrenOut = parentChildren.map((c) => ({
        studentId: c.studentId,
        name: c.name,
        relationship: c.relationship,
        permissions: c.permissions,
      }));
      if (invite.sent) {
        return { ...createdUser, children: childrenOut, childrenCount: childrenOut.length, inviteSent: true };
      }
      if (invite.reason === 'SES_NOT_CONFIGURED') {
        return {
          ...createdUser,
          children: childrenOut,
          childrenCount: childrenOut.length,
          inviteSent: false,
          tempPassword: resolved.tempPassword || resolved.password,
        };
      }
      return { ...createdUser, children: childrenOut, childrenCount: childrenOut.length, inviteSent: false };
    }

    return resolved.tempPassword ? { ...createdUser, tempPassword: resolved.tempPassword } : createdUser;
  }

  /**
   * Admin-initiated password reset for an existing account.
   * Resets the Firebase password, revokes all refresh tokens (forces
   * re-login everywhere), and re-arms mustChangePassword so the user
   * picks their own password at next login. Shows the temp password ONCE.
   */
  public async resetUserPassword(id: string, institutionCode: string, explicitPassword?: string) {
    const existing = await dbFindUserById(id);
    if (!existing || existing.institutionCode !== institutionCode) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found.' };
    }
    if (!existing.firebaseUid) {
      throw { statusCode: 400, code: 'NO_FIREBASE_UID', message: 'User has no linked login account.' };
    }

    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === institutionCode.toLowerCase())
    );
    const resolved = resolveProvisionPassword(explicitPassword, inst?.defaultTempPassword);

    if (!isFirebaseAdminInitialized) {
      throw { statusCode: 500, code: 'FIREBASE_UNAVAILABLE', message: 'Firebase Admin is not initialized. Cannot reset passwords.' };
    }

    try {
      await admin.auth().updateUser(existing.firebaseUid, { password: resolved.password });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        throw { statusCode: 404, code: 'FIREBASE_USER_NOT_FOUND', message: 'Login account no longer exists in Firebase Auth.' };
      }
      throw { statusCode: 500, code: 'FIREBASE_PASSWORD_RESET_FAILED', message: `Failed to reset password: ${err.message}` };
    }

    // Kill sessions on every device — a reset must also end stolen sessions.
    try {
      await admin.auth().revokeRefreshTokens(existing.firebaseUid);
    } catch (err: any) {
      console.warn('[resetUserPassword] Token revocation failed:', err.message);
    }

    // dbUpdateUser invalidates the auth cache, so the gate re-arms immediately.
    await dbUpdateUser(id, { mustChangePassword: true });

    return {
      message: 'Password reset successfully',
      userId: id,
      email: existing.email,
      ...(resolved.tempPassword ? { tempPassword: resolved.tempPassword } : {}),
      ...(resolved.source === 'institution_default' ? { usingInstitutionDefaultPassword: true } : {}),
      mustChangePassword: true,
    };
  }

  public async updateUser(id: string, institutionCode: string, payload: UpdateUserPayload) {
    const existing = await dbFindUserById(id);
    if (!existing) {
      throw { statusCode: 404, code: 'USER_NOT_FOUND', message: 'User not found.' };
    }
    if (existing.institutionCode && existing.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'You cannot edit users outside your institution.' };
    }

    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === institutionCode.toLowerCase())
    );
    const instType: 'school' | 'college' = (inst?.institutionType || DEFAULT_INSTITUTION_TYPE) as 'school' | 'college';
    const validRoles = instType === 'college' ? COLLEGE_ROLES : SCHOOL_ROLES;

    const updateFields: any = {};
    if (payload.fullName) updateFields.fullName = payload.fullName.trim();
    if (payload.phone !== undefined) updateFields.phone = payload.phone;
    if (payload.parentPhone !== undefined) updateFields.parentPhone = payload.parentPhone;
    if (payload.title !== undefined) updateFields.title = payload.title;
    if (payload.rollNoOrUSN !== undefined) updateFields.rollNoOrUSN = payload.rollNoOrUSN;
    if (payload.department !== undefined) updateFields.department = payload.department;

    if (payload.roles && Array.isArray(payload.roles) && payload.roles.length > 0) {
      const cleanedRoles: string[] = [];
      for (const r of payload.roles) {
        const nr = r.toLowerCase().trim();
        if (!validRoles.includes(nr as any)) {
          throw { statusCode: 400, code: 'INVALID_ROLE', message: `"${nr}" is not a valid role.` };
        }
        cleanedRoles.push(nr);
      }
      updateFields.roles = cleanedRoles;
      updateFields.role = payload.role ? payload.role.toLowerCase().trim() : cleanedRoles[0];
    } else if (payload.role) {
      const normRole = payload.role.toLowerCase().trim();
      if (!validRoles.includes(normRole as any)) {
        throw { statusCode: 400, code: 'INVALID_ROLE', message: `"${normRole}" is not a valid role.` };
      }
      updateFields.role = normRole;
      const currentRoles = existing.roles || [existing.role];
      if (!currentRoles.includes(normRole)) {
        updateFields.roles = [normRole, ...currentRoles];
      }
    }

    return dbUpdateUser(id, updateFields);
  }

  // --- Legacy Single Feed & Bulk Feed ---
  public async singleFeed(payload: SingleFeedPayload) {
    if (!payload || !payload.email || !payload.firstName || !payload.lastName) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'Missing required single-feed fields (email, firstName, lastName)' };
    }

    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === (payload.institutionCode || '').toLowerCase())
    );
    const displayName = `${payload.firstName} ${payload.lastName}`.trim();
    const resolved = resolveProvisionPassword(payload.dummyPassword, inst?.defaultTempPassword);
    const firebaseUid = await this.createFirebaseUser(payload.email, resolved.password, displayName);

    const createdUser = await this.repo.upsertUser({
      firebaseUid,
      email: payload.email,
      fullName: displayName,
      role: payload.role || 'student',
      institutionCode: payload.institutionCode,
      institutionName: payload.institutionName,
      institutionType: payload.institutionType || DEFAULT_INSTITUTION_TYPE,
      rollNoOrUSN: payload.rollNoOrUSN,
      mustChangePassword: true,
      profileCompleted: false,
    });

    return {
      message: 'User created successfully',
      user: createdUser,
      ...(resolved.tempPassword ? { tempPassword: resolved.tempPassword } : {}),
      ...(resolved.source === 'institution_default' ? { usingInstitutionDefaultPassword: true } : {}),
    };
  }

  public async bulkFeed(records: SingleFeedPayload[], options?: { sendEmails?: boolean; overwriteUsers?: boolean }) {
    if (!Array.isArray(records)) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'Payload must contain a "records" array' };
    }

    let successCount = 0;
    let failureCount = 0;
    let overwrittenCount = 0;
    let emailsSent = 0;
    let emailsFailed = 0;
    const errors: string[] = [];
    // One-time lookup: institutionCode -> admin-set default temp password.
    const institutionDefaults = new Map<string, string>();
    const tempPasswords: { email: string; tempPassword: string }[] = [];
    let defaultPasswordsUsed = 0;
    try {
      const list = await institutionService.getInstitutions();
      for (const i of list) {
        institutionDefaults.set(i.institutionCode.toLowerCase(), i.defaultTempPassword || '');
      }
    } catch {
      // No institution data available — rows will fall back to random per-user temps.
    }

    for (const record of records) {
      try {
        if (!record.email || !record.firstName || !record.lastName) {
          failureCount++;
          errors.push(`Row for ${record.email || 'unknown'}: Missing required fields`);
          continue;
        }

        const displayName = `${record.firstName} ${record.lastName}`.trim();
        const instDefault = institutionDefaults.get((record.institutionCode || '').toLowerCase()) || '';
        const resolved = resolveProvisionPassword(record.dummyPassword, instDefault);

        // Overwrite mode: reuse the existing Firebase + DB identity instead of
        // failing with EMAIL_EXISTS. Password is rotated to the resolved temp
        // so the CSV/default password is authoritative after import.
        let firebaseUid: string;
        let didOverwrite = false;
        const existingDbUser = await dbFindByEmail(record.email);
        try {
          firebaseUid = await this.createFirebaseUser(record.email, resolved.password, displayName);
        } catch (createErr: any) {
          if (createErr?.code === 'EMAIL_EXISTS' && options?.overwriteUsers) {
            const existingAuth = await admin.auth().getUserByEmail(record.email).catch(() => null);
            if (!existingAuth) throw createErr;
            firebaseUid = existingAuth.uid;
            await admin.auth().updateUser(firebaseUid, {
              password: resolved.password,
              displayName,
            });
            didOverwrite = true;
            overwrittenCount++;
          } else if (createErr?.code === 'EMAIL_EXISTS') {
            throw {
              statusCode: 409,
              code: 'EMAIL_EXISTS',
              message: `Email "${record.email}" already exists. Enable "Overwrite existing users" to update it.`,
            };
          } else {
            throw createErr;
          }
        }

        const scopeObj = JSON.stringify(
          await buildClassScope(
            record.institutionCode,
            record.department || '',
            record.academicYear || '',
            record.section || ''
          )
        );

        // Firebase user already exists; DB writes for this record are atomic.
        const writeRecord = async (tx: any) => {
          const createdUser = await this.repo.upsertUser(
            {
              firebaseUid,
              email: record.email,
              fullName: displayName,
              role: record.role || 'student',
              institutionCode: record.institutionCode,
              institutionName: record.institutionName,
              institutionType: record.institutionType || DEFAULT_INSTITUTION_TYPE,
              rollNoOrUSN: record.rollNoOrUSN,
              mustChangePassword: true,
              profileCompleted: false,
              scope: scopeObj,
            },
            tx
          );

          const scope = scopeObj ? JSON.parse(scopeObj) : {};
          const q = tx ?? db;
          if (scope?.classSectionId && q) {
            const existing = await q
              .select({ id: studentClasses.id })
              .from(studentClasses)
              .where(
                andSql(
                  eqSql(studentClasses.classSectionId, scope.classSectionId),
                  eqSql(studentClasses.studentId, createdUser.id),
                  eqSql(studentClasses.academicYear, scope.academicYear || '')
                )
              )
              .limit(1);
            if (existing.length === 0) {
              const id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
              await q.insert(studentClasses).values({
                id,
                institutionCode: record.institutionCode,
                studentId: createdUser.id,
                classSectionId: scope.classSectionId,
                rollNo: record.rollNoOrUSN,
                academicYear: scope.academicYear || '',
                isActive: true,
              });
            }
          }
          return createdUser;
        };

        await (db ? withTransaction(writeRecord) : writeRecord(null));
        successCount++;

        // Credential email — only actually send when requested AND we have a
        // password to share. Count real sends; never fabricate emailsSent.
        if (options?.sendEmails) {
          const passwordToEmail = resolved.tempPassword || resolved.password;
          const invite = await sendLoginCredentialsInvite({
            institutionCode: record.institutionCode,
            institutionName: record.institutionName || existingDbUser?.institutionName || '',
            email: record.email,
            fullName: displayName,
            role: record.role || 'student',
            tempPassword: passwordToEmail,
          });
          if (invite.sent) emailsSent++;
          else emailsFailed++;
        }

        if (resolved.source === 'institution_default') defaultPasswordsUsed++;
        if (resolved.tempPassword) tempPasswords.push({ email: record.email, tempPassword: resolved.tempPassword });
      } catch (error: any) {
        failureCount++;
        errors.push(`Row for ${record.email}: ${error.message}`);
      }
    }

    return {
      totalProcessed: records.length,
      successCount,
      failureCount,
      overwrittenCount,
      // Real counts only — 0 when sendEmails was off, or when SES is not
      // configured / sends failed (see emailNotSentReason via tempPasswords).
      emailsSent,
      emailsFailed,
      errors,
      defaultPasswordsUsed,
      // One-time reveal: passwords generated for rows that had neither a CSV
      // password nor an institution default. Never persisted anywhere else.
      tempPasswords,
    };
  }

  /**
   * CSV bulk import for a single role (student | teacher | parent | staff).
   * Kept lean on purpose: one institution lookup, one batched email-existence
   * check, class-scope resolution cached per distinct triple, Firebase creates
   * in small parallel chunks, then per-row DB upserts. No per-row institution
   * reads and no invite emails — parent temp passwords are returned instead.
   */
  public async bulkCreateUsers(
    institutionCode: string,
    requestedRole: string,
    records: BulkCreateRecord[],
    actorEmail?: string
  ) {
    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === (institutionCode || '').toLowerCase())
    );
    const instType: 'school' | 'college' = (inst?.institutionType || DEFAULT_INSTITUTION_TYPE) as 'school' | 'college';
    const validRoles = instType === 'college' ? COLLEGE_ROLES : SCHOOL_ROLES;
    const role = (requestedRole || '').toLowerCase().trim();
    if (!validRoles.includes(role as any)) {
      throw {
        statusCode: 400,
        code: 'INVALID_ROLE',
        message: `"${role}" is not valid for a ${instType} institution. Allowed: ${validRoles.join(', ')}`,
      };
    }

    const isParent = role === 'parent';
    const defaultTemp = inst?.defaultTempPassword || '';
    const institutionName = inst?.institutionName || institutionCode;
    const errors: { row: number; message: string }[] = [];
    const skipped: string[] = [];
    const tempPasswords: { email: string; tempPassword: string }[] = [];

    interface PreparedRow {
      row: number;
      email: string;
      firstName: string;
      lastName: string;
      displayName: string;
      phone?: string;
      password?: string;
      rollNoOrUSN?: string;
      department?: string;
      academicYear?: string;
      section?: string;
      employeeId?: string;
      relation?: string;
      childEmails: string[];
      categoryName?: string;
      seats?: number;
    }

    // Row numbers refer to the CSV file (header = row 1).
    const prepared: PreparedRow[] = [];
    const seenEmails = new Set<string>();
    records.forEach((rec, idx) => {
      const row = idx + 2;
      const email = (rec.email || '').toLowerCase().trim();
      const firstName = (rec.firstName || '').trim();
      const lastName = (rec.lastName || '').trim();
      if (!email || !firstName || !lastName) {
        errors.push({ row, message: 'Missing required fields (firstName, lastName, email)' });
        return;
      }
      if (seenEmails.has(email)) {
        errors.push({ row, message: `Duplicate email in file: ${email}` });
        return;
      }
      seenEmails.add(email);
      const childEmails = (rec.childEmails || [])
        .map((e) => (e || '').toLowerCase().trim())
        .filter(Boolean);
      if (isParent) {
        const relation = RELATION_CANONICAL[(rec.relation || '').trim().toLowerCase()] || '';
        if (!relation) {
          errors.push({ row, message: 'relation must be one of: Father, Mother, Guardian' });
          return;
        }
        if (childEmails.length === 0) {
          errors.push({ row, message: 'childEmails must list at least one student email' });
          return;
        }
        prepared.push({
          row,
          email,
          firstName,
          lastName,
          displayName: `${firstName} ${lastName}`.trim(),
          phone: rec.phone || undefined,
          relation,
          childEmails,
        });
        return;
      }
      prepared.push({
        row,
        email,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim(),
        phone: rec.phone || undefined,
        password: rec.password || undefined,
        rollNoOrUSN: rec.rollNoOrUSN || undefined,
        department: rec.department || undefined,
        academicYear: rec.academicYear || undefined,
        section: rec.section || undefined,
        employeeId: rec.employeeId || undefined,
        categoryName: rec.categoryName || undefined,
        seats: rec.seats,
        childEmails,
      });
    });

    // One batched existence check instead of a query per row.
    let ready = prepared;
    if (prepared.length > 0) {
      const existingEmails = new Set(
        (await this.findUsersByEmails(prepared.map((r) => r.email))).map((u) => (u.email || '').toLowerCase())
      );
      ready = prepared.filter((r) => {
        if (existingEmails.has(r.email)) {
          skipped.push(r.email);
          return false;
        }
        return true;
      });
    }

    // Resolve passwords (row password > institution default > random temp).
    for (const r of ready) {
      const resolved = resolveProvisionPassword(
        isParent ? undefined : r.password,
        isParent ? undefined : defaultTemp
      );
      r.password = resolved.password;
      if (resolved.tempPassword) tempPasswords.push({ email: r.email, tempPassword: resolved.tempPassword });
    }

    // Class-scope resolution is cached per distinct triple so the whole file
    // shares (at most) a handful of class_sections lookups.
    const scopeCache = new Map<string, Promise<Record<string, string>>>();
    const cachedClassScope = (dept?: string, yr?: string, sec?: string) => {
      const key = `${(dept || '').toLowerCase()}|${(yr || '').toLowerCase()}|${(sec || '').toLowerCase()}`;
      if (!scopeCache.has(key)) {
        scopeCache.set(key, buildClassScope(institutionCode, dept || '', yr || '', sec || ''));
      }
      return scopeCache.get(key)!;
    };

    const created: {
      row: number;
      email: string;
      id: string;
      scopeObj: Record<string, any>;
      classSectionId?: string;
      relation?: string;
      childEmails: string[];
      rollNoOrUSN?: string;
    }[] = [];
    let createdCount = 0;
    const CHUNK = 5;
    for (let i = 0; i < ready.length; i += CHUNK) {
      const chunk = ready.slice(i, i + CHUNK);
      const results = await Promise.allSettled(
        chunk.map(async (r) => {
          const firebaseUid = await this.createFirebaseUser(r.email, r.password!, r.displayName);
          return { r, firebaseUid };
        })
      );
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const r = chunk[j];
        if (result.status === 'rejected') {
          const reason: any = result.reason;
          const msg = reason?.message || 'Failed to create login account';
          if (reason?.code === 'EMAIL_EXISTS' || /already exists/i.test(msg)) {
            skipped.push(r.email);
          } else {
            errors.push({ row: r.row, message: msg });
          }
          continue;
        }
        const { firebaseUid } = result.value;
        try {
          let scopeObj: Record<string, any> = {};
          let classSectionId: string | undefined;
          if (role === 'student' || role === 'teacher') {
            const built = await cachedClassScope(r.department, r.academicYear, r.section);
            classSectionId = built.classSectionId;
            scopeObj = { ...built };
          }
          if (role === 'teacher') {
            scopeObj.employeeId = r.employeeId || '';
            scopeObj.department = r.department || '';
          }
          if (isParent) scopeObj.relation = r.relation || '';
          if (role === 'admission_officer') {
            if (r.categoryName) scopeObj.categoryName = r.categoryName;
            if (typeof r.seats === 'number' && Number.isFinite(r.seats)) scopeObj.seats = r.seats;
          }

          const createdUser = await this.repo.upsertUser({
            firebaseUid,
            email: r.email,
            fullName: r.displayName,
            role,
            roles: [role],
            institutionCode,
            institutionName,
            institutionType: instType,
            rollNoOrUSN: r.rollNoOrUSN || '',
            phone: r.phone || '',
            mustChangePassword: true,
            profileCompleted: false,
            scope: JSON.stringify(scopeObj),
          });
          createdCount++;
          created.push({
            row: r.row,
            email: r.email,
            id: createdUser.id,
            scopeObj,
            classSectionId,
            relation: r.relation,
            childEmails: r.childEmails,
            rollNoOrUSN: r.rollNoOrUSN,
          });
        } catch (err: any) {
          errors.push({ row: r.row, message: err?.message || 'Failed to save user record' });
        }
      }
    }

    // Student → class membership rows, batched into one insert.
    const studentClassRows = created
      .filter((c) => c.classSectionId)
      .map((c) => ({
        institutionCode,
        studentId: c.id,
        classSectionId: c.classSectionId!,
        rollNo: c.rollNoOrUSN || '',
        academicYear: (c.scopeObj?.academicYear || '') as string,
        isActive: true,
      }));
    if (db && studentClassRows.length > 0) {
      try {
        await db.insert(studentClasses).values(studentClassRows).onConflictDoNothing();
      } catch {
        // Non-fatal — membership can be fixed later from the student editor.
      }
    }

    // Parent → child links: resolve every referenced student email in ONE
    // query, then insert links per new parent.
    if (isParent && created.length > 0) {
      const allChildEmails = [...new Set(created.flatMap((c) => c.childEmails))];
      const childUsers = allChildEmails.length ? await this.findUsersByEmails(allChildEmails) : [];
      const childByEmail = new Map(
        childUsers
          .filter((u) => (u.role || '').toLowerCase() === 'student')
          .map((u) => [(u.email || '').toLowerCase(), u])
      );
      for (const c of created) {
        const links: { studentId: string; relationship: string; permissions: string[] }[] = [];
        const missing: string[] = [];
        for (const childEmail of c.childEmails) {
          const student = childByEmail.get(childEmail);
          if (!student) {
            missing.push(childEmail);
            continue;
          }
          links.push({
            studentId: student.id,
            relationship: c.relation || '',
            permissions: [...DEFAULT_PARENT_PERMISSIONS],
          });
        }
        if (missing.length) {
          errors.push({
            row: c.row,
            message:
              links.length === 0
                ? `Parent created but no linked children (unknown student emails: ${missing.join(', ')})`
                : `Some children were not found: ${missing.join(', ')}`,
          });
          if (links.length === 0) continue;
        }
        try {
          await insertParentLinks(institutionCode, c.id, links);
          await upsertPreferences(c.id, institutionCode, { pushEnabled: true, disabledTypes: [] });
        } catch (err: any) {
          errors.push({ row: c.row, message: `Parent created but linking children failed: ${err?.message || err}` });
        }
      }
    }

    this.recordAudit(
      actorEmail,
      'users.bulk_created',
      'user',
      undefined,
      `${role} x${createdCount} @ ${institutionCode}`,
      { role, created: createdCount, skipped: skipped.length, failed: errors.length, total: records.length }
    );

    return {
      total: records.length,
      created: createdCount,
      skipped: skipped.length,
      skippedEmails: skipped,
      failed: errors.length,
      errors,
      // One-time reveal — parents never pick a password; other roles only get
      // a temp when neither a CSV password nor institution default applied.
      tempPasswords,
      note: isParent
        ? 'Parent invite emails are not sent in bulk — share the temp passwords shown.'
        : undefined,
    };
  }

  /** Batched email lookup (one IN query; small in-memory fallback). */
  private async findUsersByEmails(
    emails: string[]
  ): Promise<Pick<InMemoryUser, 'id' | 'email' | 'role' | 'fullName'>[]> {
    const cleaned = [...new Set(emails.map((e) => (e || '').toLowerCase().trim()).filter(Boolean))];
    if (cleaned.length === 0) return [];
    if (!db) {
      const out: Pick<InMemoryUser, 'id' | 'email' | 'role' | 'fullName'>[] = [];
      for (const email of cleaned) {
        const found = await dbFindByEmail(email);
        if (found) out.push({ id: found.id, email: found.email, role: found.role, fullName: found.fullName });
      }
      return out;
    }
    const rows = await db
      .select({ id: users.id, email: users.email, role: users.role, fullName: users.fullName })
      .from(users)
      .where(inArraySql(users.email, cleaned));
    return rows.map((r) => ({ id: r.id, email: r.email, role: r.role, fullName: r.fullName }));
  }

  // Fee Management Methods
  async getFees(institutionCode: string) {
    if (!db) return [];
    const result = await db.select().from(feeStructures).where(eqSql(feeStructures.institutionCode, institutionCode));
    return result;
  }

  async createFee(institutionCode: string, data: any) {
    if (!db) throw Object.assign(new Error('Database not available'), { statusCode: 500 });
    const id = `fs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const [result] = await db.insert(feeStructures).values({
      id,
      institutionCode,
      classSectionId: data.classSectionId,
      title: data.title,
      category: data.category || 'student_fee',
      amount: String(data.amount),
      term: data.term,
      academicYear: data.academicYear,
      dueDate: data.dueDate,
      status: data.status || 'active',
      createdBy: data.createdBy,
    }).returning();
    return result;
  }

  async updateFee(id: string, institutionCode: string, data: any) {
    if (!db) throw Object.assign(new Error('Database not available'), { statusCode: 500 });
    const [result] = await db
      .update(feeStructures)
      .set(data)
      .where(andSql(eqSql(feeStructures.id, id), eqSql(feeStructures.institutionCode, institutionCode)))
      .returning();
    if (!result) throw Object.assign(new Error('Fee not found'), { statusCode: 404 });
    return result;
  }

  async deleteFee(id: string, institutionCode: string) {
    if (!db) throw Object.assign(new Error('Database not available'), { statusCode: 500 });
    await db
      .delete(feeStructures)
      .where(andSql(eqSql(feeStructures.id, id), eqSql(feeStructures.institutionCode, institutionCode)));
  }

  async getFeePayments(institutionCode: string) {
    if (!db) return [];
    const result = await db.select().from(feePayments).where(eqSql(feePayments.institutionCode, institutionCode));
    return result;
  }

  async createFeePayment(institutionCode: string, data: any) {
    if (!db) throw Object.assign(new Error('Database not available'), { statusCode: 500 });
    const id = `fp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    // Receipt number comes from the per-institution sequence, allocated inside
    // the same transaction as the insert so concurrent collections can never
    // produce duplicate receipt numbers (the old timestamp generator could).
    return withTransaction(async (tx) => {
      const receiptNo = await nextReceiptNo(tx, institutionCode);
      const [result] = await tx.insert(feePayments).values({
        id,
        institutionCode,
        feeStructureId: data.feeStructureId,
        studentId: data.studentId,
        amount: String(data.amount),
        paymentMethod: data.paymentMethod || 'upi',
        paymentDate: data.paymentDate,
        status: data.status || 'paid',
        receiptNo,
        notes: data.notes,
        createdBy: data.createdBy,
      }).returning();
      return result;
    });
  }

  async updateFeePayment(id: string, institutionCode: string, data: any) {
    if (!db) throw Object.assign(new Error('Database not available'), { statusCode: 500 });
    const [result] = await db
      .update(feePayments)
      .set(data)
      .where(andSql(eqSql(feePayments.id, id), eqSql(feePayments.institutionCode, institutionCode)))
      .returning();
    if (!result) throw Object.assign(new Error('Fee payment not found'), { statusCode: 404 });
    return result;
  }

  async deleteFeePayment(id: string, institutionCode: string) {
    if (!db) throw Object.assign(new Error('Database not available'), { statusCode: 500 });
    await db
      .delete(feePayments)
      .where(andSql(eqSql(feePayments.id, id), eqSql(feePayments.institutionCode, institutionCode)));
  }

  // Expense Management Methods
  async getExpenses(institutionCode: string) {
    if (!db) return [];
    const result = await db
      .select()
      .from(expenseRecords)
      .where(eqSql(expenseRecords.institutionCode, institutionCode))
      .orderBy(descSql(expenseRecords.createdAt));
    return result;
  }

  async createExpense(institutionCode: string, data: any) {
    if (!db) throw Object.assign(new Error('Database not available'), { statusCode: 500 });
    const id = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const invoiceNo = `EXP-${Date.now().toString().slice(-6)}`;
    const [result] = await db.insert(expenseRecords).values({
      id,
      institutionCode,
      title: data.title,
      category: data.category || 'other',
      payeeName: data.payeeName,
      employeeId: data.employeeId,
      designation: data.designation,
      department: data.department,
      vehicleNo: data.vehicleNo,
      amount: String(data.amount),
      paymentMethod: data.paymentMethod || 'bank_transfer',
      paymentDate: data.paymentDate,
      status: data.status || 'paid',
      invoiceNo,
      notes: data.notes,
      createdBy: data.createdBy,
    }).returning();
    return result;
  }

  async updateExpense(id: string, institutionCode: string, data: any) {
    if (!db) throw Object.assign(new Error('Database not available'), { statusCode: 500 });
    const [result] = await db
      .update(expenseRecords)
      .set(data)
      .where(andSql(eqSql(expenseRecords.id, id), eqSql(expenseRecords.institutionCode, institutionCode)))
      .returning();
    if (!result) throw Object.assign(new Error('Expense not found'), { statusCode: 404 });
    return result;
  }

  async deleteExpense(id: string, institutionCode: string) {
    if (!db) throw Object.assign(new Error('Database not available'), { statusCode: 500 });
    await db
      .delete(expenseRecords)
      .where(andSql(eqSql(expenseRecords.id, id), eqSql(expenseRecords.institutionCode, institutionCode)));
  }

  /**
   * Student-scoped fee statement. Student is resolved only from the session
   * uid — never from client input. Returns [] when not found.
   */
  async getStudentFees(institutionCode: string, studentUid: string) {
    const student = await dbFindUserByIdOrUid(studentUid);
    if (!student || student.role.toLowerCase() !== 'student' || student.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only students can view their fee statement' };
    }
    if (!db) return [];
    return this.buildFeeStatement(institutionCode, student.id, student);
  }

  /**
   * Parent-scoped fee statement. Child is resolved only from the parent's
   * own record (uid → scope.linkedStudentUSN) — never from client input.
   * Returns [] when no child is linked (soft), 403 only if not a parent.
   */
  async getParentFees(institutionCode: string, parentUid: string) {
    const parent = await dbFindUserByIdOrUid(parentUid);
    if (!parent || parent.role.toLowerCase() !== 'parent' || parent.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only parents can view fee statements' };
    }

    const link = await getPrimaryParentChild(parent.id);
    if (!link) return [];

    const student = await dbFindUserById(link.studentId);
    if (!student) return [];

    return this.buildFeeStatement(institutionCode, student.id, student);
  }

  private async buildFeeStatement(institutionCode: string, studentId: string, student: {
    id: string;
    fullName?: string;
    rollNoOrUSN?: string;
  }) {
    if (!db) return [];

    const structures = await db
      .select()
      .from(feeStructures)
      .where(andSql(eqSql(feeStructures.institutionCode, institutionCode), eqSql(feeStructures.status, 'active')));
    const payments = await db
      .select()
      .from(feePayments)
      .where(andSql(eqSql(feePayments.institutionCode, institutionCode), eqSql(feePayments.studentId, studentId)));

    const childClassId = await dbFindStudentClassSectionId(studentId).catch(() => undefined);

    return structures
      .filter((s) => !s.classSectionId || s.classSectionId === childClassId)
      .map((s) => {
        const related = payments.filter((p) => p.feeStructureId === s.id);
        const paid = related.find((p) => p.status === 'paid');
        const pending = related.find((p) => p.status === 'pending');
        return {
          id: s.id,
          title: s.title,
          category: s.category,
          amount: Number(s.amount),
          term: s.term || '',
          academicYear: s.academicYear || '',
          dueDate: s.dueDate || '',
          status: paid ? 'paid' : 'pending',
          studentId,
          studentName: student.fullName || '',
          rollNo: student.rollNoOrUSN || '',
          paymentId: (paid || pending)?.id || null,
          paymentDate: paid?.paymentDate || '',
          receiptNo: paid?.receiptNo || '',
          paymentMethod: paid?.paymentMethod || '',
          notes: paid?.notes || pending?.notes || '',
        };
      });
  }
}

export const adminService = new AdminService();
