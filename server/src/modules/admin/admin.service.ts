import { adminRepository, IAdminRepository } from './admin.repository.js';
import { institutionService } from '../institutions/institution.service.js';
import {
  dbFindUsersByInstitution,
  dbCountUsersByInstitution,
  dbCountClassSectionsByInstitution,
  dbCountSubjectsByInstitution,
  dbCountAttendanceSessionsByInstitution,
} from '../shared/db/index.js';
import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';

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

    const scopeObj = JSON.stringify({
      department: payload.department || '',
      academicYear: payload.academicYear || '',
      section: payload.section || '',
    });

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

    return createdUser;
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

    const scopeObj: Record<string, string> = {};
    if (payload.department) scopeObj.department = payload.department;
    if (payload.academicYear) scopeObj.academicYear = payload.academicYear;
    if (payload.section) scopeObj.section = payload.section;
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

  public async bulkFeed(records: SingleFeedPayload[]) {
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

        await this.repo.upsertUser({
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
        });

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
      errors,
    };
  }
}

export const adminService = new AdminService();
