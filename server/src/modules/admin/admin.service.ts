import { adminRepository, IAdminRepository } from './admin.repository.js';
import { institutionService } from '../institutions/institution.service.js';
import { inMemoryUserStore, dbUpsertUser, dbGetAllUsers } from '../shared/db/index.js';
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

export class AdminService {
  constructor(private repo: IAdminRepository = adminRepository) {}

  private async createFirebaseUser(email: string, password?: string, displayName?: string): Promise<string> {
    let firebaseUid = `uid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (isFirebaseAdminInitialized) {
      try {
        const userRecord = await admin.auth().createUser({
          email,
          password: password || 'Pass@123',
          displayName: displayName || email,
        });
        firebaseUid = userRecord.uid;
      } catch (err: any) {
        if (err.code === 'auth/email-already-exists') {
          try {
            const existingUser = await admin.auth().getUserByEmail(email);
            firebaseUid = existingUser.uid;
          } catch {
            // ignore
          }
        } else {
          console.warn('[Admin Feed Firebase Warning]', err.message);
        }
      }
    }

    return firebaseUid;
  }

  // --- Academic Configuration ---
  public async getInstitutionConfig(institutionCode: string) {
    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === (institutionCode || '').toLowerCase())
    );

    if (!inst) {
      return {
        institutionCode: institutionCode || 'DEFAULT',
        institutionName: 'My Institution',
        institutionType: 'college',
        departments: ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
        academicYears: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
        courses: ['B.Tech', 'M.Tech'],
        sections: ['Section A', 'Section B'],
      };
    }

    let scopeObj: any = {};
    try {
      scopeObj = typeof inst === 'object' && (inst as any).scope ? JSON.parse((inst as any).scope) : {};
    } catch {
      scopeObj = {};
    }

    return {
      institutionCode: inst.institutionCode,
      institutionName: inst.institutionName,
      institutionType: inst.institutionType,
      subscriptionStatus: inst.subscriptionStatus,
      departments: scopeObj.departments || ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
      academicYears: scopeObj.academicYears || ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      courses: scopeObj.courses || ['B.Tech', 'M.Tech'],
      sections: scopeObj.sections || ['Section A', 'Section B'],
    };
  }

  public async updateInstitutionConfig(institutionCode: string, payload: { departments?: string[]; academicYears?: string[]; courses?: string[]; sections?: string[] }) {
    const inst = await institutionService.getInstitutions().then((list) =>
      list.find((i) => i.institutionCode.toLowerCase() === (institutionCode || '').toLowerCase())
    );

    if (inst) {
      const scopeJson = JSON.stringify({
        departments: payload.departments || [],
        academicYears: payload.academicYears || [],
        courses: payload.courses || [],
        sections: payload.sections || [],
      });
      await institutionService.updateInstitution(inst.id, { scope: scopeJson } as any);
    }

    return this.getInstitutionConfig(institutionCode);
  }

  // --- Student Management ---
  public async getStudents(institutionCode: string) {
    const allUsers = await dbGetAllUsers();
    return allUsers.filter(
      (u) =>
        u.role.toLowerCase() === 'student' &&
        (!institutionCode || u.institutionCode.toLowerCase() === institutionCode.toLowerCase())
    );
  }

  public async createStudent(payload: CreateStudentPayload) {
    if (!payload.email || !payload.firstName || !payload.lastName || !payload.rollNoOrUSN) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'Missing required student fields (email, firstName, lastName, rollNoOrUSN)' };
    }

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
      institutionName: payload.institutionCode,
      rollNoOrUSN: payload.rollNoOrUSN,
      mustChangePassword: true,
      profileCompleted: false,
      scope: scopeObj,
    });

    return createdUser;
  }

  // --- Teacher Management ---
  public async getTeachers(institutionCode: string) {
    const allUsers = await dbGetAllUsers();
    return allUsers.filter(
      (u) =>
        u.role.toLowerCase() === 'teacher' &&
        (!institutionCode || u.institutionCode.toLowerCase() === institutionCode.toLowerCase())
    );
  }

  public async createTeacher(payload: CreateTeacherPayload) {
    if (!payload.email || !payload.firstName || !payload.lastName) {
      throw { statusCode: 400, code: 'INVALID_INPUT', message: 'Missing required teacher fields (email, firstName, lastName)' };
    }

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
      institutionName: payload.institutionCode,
      mustChangePassword: true,
      profileCompleted: false,
      scope: scopeObj,
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
