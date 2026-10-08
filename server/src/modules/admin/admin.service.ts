import { adminRepository, IAdminRepository } from './admin.repository.js';
import { institutionService } from '../institutions/institution.service.js';
import { academicsRepository } from '../academics/academics.repository.js';
import {
  dbFindUsersByInstitution,
  dbCountUsersByInstitution,
  dbCountClassSectionsByInstitution,
  dbCountSubjectsByInstitution,
  dbCountAttendanceSessionsByInstitution,
  dbFindUserById,
  dbFindUserByIdOrUid,
  dbFindStudentByUsnInInstitution,
  dbFindStudentClassSectionId,
  dbUpdateUser,
  dbDeleteUserById,
  db,
  withTransaction,
} from '../shared/db/index.js';
import { studentClasses, users, studentDocuments, feeStructures, feePayments, expenseRecords } from '../shared/db/schema.js';
import { and as andSql, eq as eqSql, desc as descSql } from 'drizzle-orm';
import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';
import { resolveProvisionPassword, validatePasswordStrength } from '../shared/utils/password.js';

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
  rollNoOrUSN: string;
  department?: string;
  academicYear?: string;
  section?: string;
  password?: string;
  parentPhone?: string;
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
}

const SCHOOL_ROLES = ['admin', 'principal', 'teacher', 'student', 'parent', 'accountant', 'librarian', 'driver'] as const;
const COLLEGE_ROLES = ['admin', 'hod', 'teacher', 'student', 'parent', 'accountant', 'librarian', 'driver'] as const;

export interface CreateUserPayload {
  fullName: string;
  email: string;
  role: string;
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
}

export class AdminService {
  constructor(private repo: IAdminRepository = adminRepository) {}

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
    if (institutionType === 'school') {
      return {
        institutionType: 'school',
        departments: ['English', 'Mathematics', 'Science'],
        academicYears: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
        courses: [],
        sections: ['A', 'B', 'C'],
        terms: [{ academicYear: '2026-2027', terms: ['Term 1', 'Term 2', 'Term 3'] }],
      };
    }
    return {
      institutionType: 'college',
      departments: ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
      academicYears: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      courses: ['B.Tech', 'M.Tech'],
      sections: ['Section A', 'Section B'],
      terms: [{ academicYear: '2026-27', terms: ['Semester 1', 'Semester 2'] }],
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
        ...this.getDefaultAcademicConfig('college'),
        blockedDates: [],
      };
    }

    return {
      institutionCode: inst.institutionCode,
      institutionName: inst.institutionName,
      institutionType: inst.institutionType,
      subscriptionStatus: inst.subscriptionStatus,
      departments: inst.departments || this.getDefaultAcademicConfig(inst.institutionType).departments,
      academicYears: inst.academicYears || this.getDefaultAcademicConfig(inst.institutionType).academicYears,
      courses: inst.courses || this.getDefaultAcademicConfig(inst.institutionType).courses,
      sections: (inst as any).sections || this.getDefaultAcademicConfig(inst.institutionType).sections,
      terms: inst.terms || this.getDefaultAcademicConfig(inst.institutionType).terms,
      blockedDates: inst.blockedDates || [],
      // Boolean only — the default password value itself never leaves the server.
      hasDefaultPassword: Boolean(inst.defaultTempPassword),
      maintenanceEnabled: (inst as any).maintenanceEnabled ?? false,
      maintenanceMinVersion: (inst as any).maintenanceMinVersion || '0.0.0',
    };
  }

  public async updateInstitutionConfig(
    institutionCode: string,
    payload: { departments?: string[]; academicYears?: string[]; courses?: string[]; sections?: string[]; terms?: any[]; blockedDates?: any[]; defaultTempPassword?: string; maintenanceEnabled?: boolean; maintenanceMinVersion?: string }
  ) {
    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === (institutionCode || '').toLowerCase())
    );

    if (inst) {
      const update: any = {};
      if (payload.departments !== undefined) update.departments = payload.departments;
      if (payload.academicYears !== undefined) update.academicYears = payload.academicYears;
      if (payload.courses !== undefined) update.courses = payload.courses;
      if (payload.terms !== undefined) update.terms = payload.terms;
      if (payload.blockedDates !== undefined) update.blockedDates = payload.blockedDates;
      if (payload.sections !== undefined) update.sections = payload.sections;
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
      institutionType: inst?.institutionType || 'college',
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
  public async getStudents(institutionCode: string, limit = 100, offset = 0) {
    const [items, total] = await Promise.all([
      dbFindUsersByInstitution(institutionCode, 'student', { limit, offset }),
      dbCountUsersByInstitution(institutionCode, 'student'),
    ]);
    return { data: items, total, limit, offset };
  }

  public async createStudent(payload: CreateStudentPayload) {
    if (!payload.email || !payload.firstName || !payload.lastName || !payload.rollNoOrUSN) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'Missing required student fields (email, firstName, lastName, rollNoOrUSN)' };
    }

    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === (payload.institutionCode || '').toLowerCase())
    );
    const institutionName = inst?.institutionName || payload.institutionCode;
    const institutionType = inst?.institutionType || 'college';

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
          rollNoOrUSN: payload.rollNoOrUSN,
          parentPhone: payload.parentPhone || '',
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
            rollNo: payload.rollNoOrUSN,
            academicYear: scope.academicYear || '',
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
    return user;
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

    return dbUpdateUser(id, updateFields);
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
        await q.insert(studentClasses).values({
          id,
          institutionCode,
          studentId: sid,
          classSectionId: targetClassSectionId,
          rollNo: user.rollNoOrUSN || '',
          academicYear,
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

  // --- Teacher Management ---
  public async getTeachers(institutionCode: string, limit = 100, offset = 0) {
    const [items, total] = await Promise.all([
      dbFindUsersByInstitution(institutionCode, 'teacher', { limit, offset }),
      dbCountUsersByInstitution(institutionCode, 'teacher'),
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

    const scopeObj = JSON.stringify({
      employeeId: payload.employeeId || '',
      department: payload.department || '',
    });

    const createdUser = await this.repo.upsertUser({
      firebaseUid,
      email: payload.email,
      fullName: displayName,
      role: 'teacher',
      institutionCode: payload.institutionCode,
      institutionName,
      mustChangePassword: true,
      profileCompleted: false,
      scope: scopeObj,
    });

    return resolved.tempPassword ? { ...createdUser, tempPassword: resolved.tempPassword } : createdUser;
  }

  public async updateTeacher(id: string, payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    employeeId?: string;
    department?: string;
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

    if (payload.employeeId !== undefined || payload.department !== undefined) {
      const scope = typeof existing.scope === 'string' ? JSON.parse(existing.scope || '{}') : (existing.scope || {});
      const newScope = {
        employeeId: payload.employeeId ?? scope.employeeId ?? '',
        department: payload.department ?? scope.department ?? '',
      };
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
  public async getUsers(institutionCode: string, limit = 100, offset = 0) {
    const [items, total] = await Promise.all([
      dbFindUsersByInstitution(institutionCode, undefined, { limit, offset }),
      dbCountUsersByInstitution(institutionCode),
    ]);
    return { data: items, total, limit, offset };
  }

  public async createUser(payload: CreateUserPayload) {
    if (!payload.fullName || !payload.email || !payload.role) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'fullName, email, and role are required' };
    }

    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === payload.institutionCode.toLowerCase())
    );
    const instType: 'school' | 'college' = (payload.institutionType || inst?.institutionType || 'school') as 'school' | 'college';
    const validRoles = instType === 'college' ? COLLEGE_ROLES : SCHOOL_ROLES;

    const normalizedRole = payload.role.toLowerCase().trim();
    if (!validRoles.includes(normalizedRole as any)) {
      throw {
        statusCode: 400,
        code: 'INVALID_ROLE',
        message: `"${normalizedRole}" is not valid for a ${instType} institution. Allowed: ${validRoles.join(', ')}`,
      };
    }

    const resolved = resolveProvisionPassword(payload.password, inst?.defaultTempPassword);
    const firebaseUid = await this.createFirebaseUser(payload.email, resolved.password, payload.fullName);

    const hasClassTriple = Boolean(
      (payload.department || '').toString().trim() ||
        (payload.academicYear || '').toString().trim() ||
        (payload.section || '').toString().trim()
    );

    const scopeObj: Record<string, string> = hasClassTriple
      ? await buildClassScope(
          payload.institutionCode,
          (payload.department || '').toString(),
          (payload.academicYear || '').toString(),
          (payload.section || '').toString()
        )
      : {};
    if (payload.employeeId) scopeObj.employeeId = payload.employeeId;

    const createdUser = await this.repo.upsertUser({
      firebaseUid,
      email: payload.email,
      fullName: payload.fullName,
      role: normalizedRole,
      institutionCode: payload.institutionCode,
      institutionName: payload.institutionName || payload.institutionCode,
      institutionType: instType,
      title: payload.title || '',
      rollNoOrUSN: payload.rollNoOrUSN || '',
      parentPhone: normalizedRole === 'student' ? (payload.parentPhone || '') : undefined,
      phone: payload.phone || '',
      mustChangePassword: true,
      profileCompleted: false,
      scope: JSON.stringify(scopeObj),
    });

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
      institutionType: payload.institutionType || 'school',
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
        const firebaseUid = await this.createFirebaseUser(record.email, resolved.password, displayName);

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
              institutionType: record.institutionType || 'school',
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
      emailsSent: options?.sendEmails ? successCount : 0,
      errors,
      defaultPasswordsUsed,
      // One-time reveal: passwords generated for rows that had neither a CSV
      // password nor an institution default. Never persisted anywhere else.
      tempPasswords,
    };
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
    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
    const [result] = await db.insert(feePayments).values({
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

    let scope: any = {};
    try {
      scope = typeof parent.scope === 'string' ? JSON.parse(parent.scope || '{}') : (parent.scope || {});
    } catch {
      scope = {};
    }
    const linkedUsn = scope?.linkedStudentUSN || '';
    if (!linkedUsn) return [];

    const student = await dbFindStudentByUsnInInstitution(institutionCode, linkedUsn);
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
