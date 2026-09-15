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
  dbUpdateUser,
  dbDeleteUserById,
  db,
} from '../shared/db/index.js';
import { studentClasses, users, studentDocuments } from '../shared/db/schema.js';
import { and as andSql, eq as eqSql } from 'drizzle-orm';
import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';

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

const SCHOOL_ROLES = ['admin', 'principal', 'teacher', 'student', 'parent', 'accountant', 'librarian'] as const;
const COLLEGE_ROLES = ['admin', 'hod', 'teacher', 'student', 'parent', 'accountant', 'librarian'] as const;

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

  private async createFirebaseUser(email: string, password?: string, displayName?: string): Promise<string> {
    if (!isFirebaseAdminInitialized) {
      throw { statusCode: 500, code: 'FIREBASE_UNAVAILABLE', message: 'Firebase Admin is not initialized. Cannot create users.' };
    }

    let firebaseUid: string;
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password: password || 'Pass@123',
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
    };
  }

  public async updateInstitutionConfig(
    institutionCode: string,
    payload: { departments?: string[]; academicYears?: string[]; courses?: string[]; sections?: string[]; terms?: any[]; blockedDates?: any[] }
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
    const firebaseUid = await this.createFirebaseUser(payload.email, payload.password || 'TempPass123!', displayName);

    const scopeObj = JSON.stringify(
      await buildClassScope(
        payload.institutionCode,
        payload.department || '',
        payload.academicYear || '',
        payload.section || ''
      )
    );

    const createdUser = await this.repo.upsertUser({
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
    });

    // Canonical enrollment: also insert into student_classes (additive, ignores failures).
    try {
      const scope = scopeObj ? JSON.parse(scopeObj) : {};
      if (scope?.classSectionId) {
        if (db) {
          const existing = await db
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
            await db.insert(studentClasses).values({
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
      }
    } catch (err: any) {
      console.warn('[createStudent warning] student_classes insert failed:', err?.message);
    }

    return createdUser;
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

    let promoted = 0;
    for (const sid of studentIds) {
      const user = await dbFindUserById(sid);
      if (!user || user.role !== 'student' || user.institutionCode !== institutionCode) continue;

      const existingScope = typeof user.scope === 'string' ? JSON.parse(user.scope) : (user.scope || {});
      const newScope = { ...existingScope, classSectionId: targetClassSectionId, academicYear };

      await dbUpdateUser(sid, { scope: JSON.stringify(newScope) });

      try {
        if (db) {
          const now = new Date().toISOString().split('T')[0];
          const activeEnrollments = await db
            .select({ id: studentClasses.id })
            .from(studentClasses)
            .where(
              andSql(
                eqSql(studentClasses.studentId, sid),
                eqSql(studentClasses.isActive, true)
              )
            );
          for (const enr of activeEnrollments) {
            await db.update(studentClasses).set({ effectiveTo: now, isActive: false, updatedAt: new Date() }).where(eqSql(studentClasses.id, enr.id));
          }

          const classSection = await academicsRepository.listClassSections(institutionCode);
          const cs = Array.isArray(classSection) ? classSection.find((c: any) => c.id === targetClassSectionId) : null;

          const id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          await db.insert(studentClasses).values({
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
      } catch (err: any) {
        console.warn('[promoteStudents] student_classes update failed for', sid, err.message);
      }
      promoted++;
    }
    return { promoted, total: studentIds.length };
  }

  public async graduateStudents(studentIds: string[], institutionCode: string) {
    if (!studentIds.length) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'studentIds are required.' };
    }

    let graduated = 0;
    for (const sid of studentIds) {
      const user = await dbFindUserById(sid);
      if (!user || user.role !== 'student' || user.institutionCode !== institutionCode) continue;

      await dbUpdateUser(sid, { graduatedAt: new Date() });

      try {
        if (db) {
          const activeEnrollments = await db
            .select({ id: studentClasses.id })
            .from(studentClasses)
            .where(
              andSql(
                eqSql(studentClasses.studentId, sid),
                eqSql(studentClasses.isActive, true)
              )
            );
          for (const enr of activeEnrollments) {
            await db.update(studentClasses).set({ effectiveTo: new Date().toISOString().split('T')[0], isActive: false, updatedAt: new Date() }).where(eqSql(studentClasses.id, enr.id));
          }
        }
      } catch (err: any) {
        console.warn('[graduateStudents] student_classes update failed for', sid, err.message);
      }
      graduated++;
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
    const firebaseUid = await this.createFirebaseUser(payload.email, payload.password || 'TempPass123!', displayName);

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

    return createdUser;
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

    const firebaseUid = await this.createFirebaseUser(payload.email, payload.password || 'TempPass123!', payload.fullName);

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

    return createdUser;
  }

  // --- Legacy Single Feed & Bulk Feed ---
  public async singleFeed(payload: SingleFeedPayload) {
    if (!payload || !payload.email || !payload.firstName || !payload.lastName) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'Missing required single-feed fields (email, firstName, lastName)' };
    }

    const displayName = `${payload.firstName} ${payload.lastName}`.trim();
    const firebaseUid = await this.createFirebaseUser(payload.email, payload.dummyPassword, displayName);

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
    };
  }

  public async bulkFeed(records: SingleFeedPayload[], options?: { sendEmails?: boolean; overwriteUsers?: boolean }) {
    if (!Array.isArray(records)) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'Payload must contain a "records" array' };
    }

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const record of records) {
      try {
        if (!record.email || !record.firstName || !record.lastName) {
          failureCount++;
          errors.push(`Row for ${record.email || 'unknown'}: Missing required fields`);
          continue;
        }

        const displayName = `${record.firstName} ${record.lastName}`.trim();
        const firebaseUid = await this.createFirebaseUser(record.email, record.dummyPassword, displayName);

        const scopeObj = JSON.stringify(
          await buildClassScope(
            record.institutionCode,
            record.department || '',
            record.academicYear || '',
            record.section || ''
          )
        );

        const createdUser = await this.repo.upsertUser({
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
        });

        // Canonical enrollment: insert into student_classes
        try {
          const scope = scopeObj ? JSON.parse(scopeObj) : {};
          if (scope?.classSectionId && db) {
            const existing = await db
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
              await db.insert(studentClasses).values({
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
        } catch (err: any) {
          console.warn('[bulkFeed warning] student_classes insert failed:', err?.message);
        }

        successCount++;
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
    };
  }
}

export const adminService = new AdminService();
