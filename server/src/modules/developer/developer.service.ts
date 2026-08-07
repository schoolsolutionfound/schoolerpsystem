import { institutionService, InstitutionService } from '../institutions/institution.service.js';
import { CreateInstitutionInput, UpdateInstitutionInput } from '../institutions/institution.schema.js';
import { InMemoryUser, inMemoryUserStore, dbUpsertUser, dbGetAllUsers, dbFindAdminsByInstitutionCode, dbDeleteUserById } from '../shared/db/index.js';
import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';

function sanitize(val: string | undefined, maxLen = 200): string {
  if (!val) return '';
  return val.trim().replace(/<[^>]*>/g, '').slice(0, maxLen);
}

function validatePassword(pw: string | undefined): string | null {
  if (!pw || pw.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(pw)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(pw)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(pw)) return 'Password must contain a digit';
  return null;
}

const VALID_ROLES = ['admin', 'teacher', 'student', 'principal', 'parent', 'accountant', 'hod', 'librarian'] as const;

export interface CreateAdminPayload {
  fullName: string;
  email: string;
  password?: string;
  institutionCode: string;
  role?: string;
  title?: string;
  scope?: {
    departments?: string[];
    academicYears?: string[];
  };
  permissions?: string[];
}

export interface UpdateAdminPayload {
  fullName?: string;
  email?: string;
  institutionCode?: string;
  role?: string;
  title?: string;
  scope?: {
    departments?: string[];
    academicYears?: string[];
  };
  permissions?: string[];
  status?: string;
}

export class DeveloperService {
  constructor(private instService: InstitutionService = institutionService) {}

  public async createInstitution(input: CreateInstitutionInput) {
    return this.instService.createInstitution(input);
  }

  public async listInstitutions() {
    return this.instService.getInstitutions();
  }

  public async getInstitutionById(id: string) {
    return this.instService.getInstitutionById(id);
  }

  public async updateInstitution(id: string, input: UpdateInstitutionInput) {
    return this.instService.updateInstitution(id, input);
  }

  public async deleteInstitution(id: string) {
    return this.instService.deleteInstitution(id);
  }

  public async getStats() {
    const institutionsList = await this.instService.getInstitutions();
    const totalInstitutions = institutionsList.length;
    const activeInstitutions = institutionsList.filter(
      (i) => (i.subscriptionStatus || 'active').toLowerCase() === 'active'
    ).length;

    const allUsers = await dbGetAllUsers();
    const institutionAdmins = allUsers.filter(
      (u) => u.role.toLowerCase() === 'institution admin' || u.role.toLowerCase() === 'admin' || u.role.toLowerCase() === 'maintainer'
    ).length;

    const activeSubscriptions = activeInstitutions;
    const monthlyRevenue = activeSubscriptions * 5000;

    return {
      totalInstitutions,
      activeInstitutions,
      institutionAdmins,
      activeSubscriptions,
      monthlyRevenue,
    };
  }

  public async listAdmins(institutionCode?: string) {
    let admins: InMemoryUser[];
    if (institutionCode) {
      admins = await dbFindAdminsByInstitutionCode(institutionCode);
    } else {
      const allUsers = await dbGetAllUsers();
      admins = allUsers.filter((u) => u.role !== 'dev' && u.role !== 'maintainer');
    }

    const institutionsList = await this.instService.getInstitutions();
    const instMap = new Map(institutionsList.map((i) => [i.institutionCode, i]));

    return admins.map((u) => {
      const inst = instMap.get(u.institutionCode);
      const parsedScope = typeof u.scope === 'string' ? JSON.parse(u.scope || '{}') : (u.scope || {});
      const parsedPermissions = typeof u.permissions === 'string' ? JSON.parse(u.permissions || '[]') : (u.permissions || []);

      return {
        id: u.id,
        firebaseUid: u.firebaseUid,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        title: u.title || 'Institution Admin',
        institutionCode: u.institutionCode,
        institutionName: inst?.institutionName || u.institutionName || u.institutionCode,
        institutionType: inst?.institutionType || u.institutionType || 'college',
        status: 'active',
        scope: parsedScope,
        permissions: parsedPermissions,
        createdAt: u.createdAt,
      };
    });
  }

  public async createAdmin(payload: CreateAdminPayload) {
    const passwordError = validatePassword(payload.password);
    if (passwordError) {
      throw { statusCode: 400, code: 'WEAK_PASSWORD', message: passwordError };
    }

    const targetRole = payload.role?.toLowerCase().trim() || 'admin';
    const validRole = VALID_ROLES.includes(targetRole as any) ? targetRole : 'admin';

    const sanitized: CreateAdminPayload = {
      fullName: sanitize(payload.fullName, 100),
      email: payload.email.toLowerCase().trim(),
      password: payload.password,
      role: validRole,
      institutionCode: sanitize(payload.institutionCode, 50).toUpperCase(),
      title: sanitize(payload.title, 100) || 'Institution Admin',
      scope: {
        departments: (payload.scope?.departments || []).map((d) => sanitize(d, 100)).filter(Boolean),
        academicYears: (payload.scope?.academicYears || []).map((y) => sanitize(y, 100)).filter(Boolean),
      },
      permissions: (payload.permissions || []).map((p) => sanitize(p, 100)).filter(Boolean),
    };

    let firebaseUid = `adm_uid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    if (isFirebaseAdminInitialized && sanitized.password) {
      try {
        const fbUser = await admin.auth().createUser({
          email: sanitized.email,
          password: sanitized.password,
          displayName: sanitized.fullName,
        });
        firebaseUid = fbUser.uid;
      } catch (err: any) {
        console.warn('[Firebase Admin Create Error]', err.message);
      }
    }

    const inst = (await this.instService.getInstitutions()).find(
      (i) => i.institutionCode.toLowerCase() === sanitized.institutionCode.toLowerCase()
    );

    const createdUser = await dbUpsertUser({
      firebaseUid,
      email: sanitized.email,
      fullName: sanitized.fullName,
      role: sanitized.role,
      title: sanitized.title,
      institutionCode: sanitized.institutionCode,
      institutionName: inst?.institutionName || sanitized.institutionCode,
      institutionType: inst?.institutionType || 'college',
      scope: JSON.stringify(sanitized.scope),
      permissions: JSON.stringify(sanitized.permissions),
    });

    return {
      id: createdUser.id,
      firebaseUid: createdUser.firebaseUid,
      email: createdUser.email,
      fullName: createdUser.fullName,
      role: createdUser.role,
      title: createdUser.title,
      institutionCode: createdUser.institutionCode,
      institutionName: createdUser.institutionName,
      institutionType: createdUser.institutionType,
      status: 'active',
      scope: sanitized.scope,
      permissions: sanitized.permissions,
      createdAt: createdUser.createdAt,
    };
  }

  public async updateAdmin(id: string, payload: UpdateAdminPayload) {
    const existing = (await dbGetAllUsers()).find((u) => u.id === id);
    if (!existing) {
      throw { statusCode: 404, code: 'ADMIN_NOT_FOUND', message: `Admin with ID "${id}" was not found.` };
    }

    const scopeString = payload.scope ? JSON.stringify(payload.scope) : existing.scope;
    const permissionsString = payload.permissions ? JSON.stringify(payload.permissions) : existing.permissions;

    const role = payload.role
      ? (VALID_ROLES.includes(payload.role.toLowerCase().trim() as any) ? payload.role.toLowerCase().trim() : existing.role)
      : existing.role;

    const updatedUser = await dbUpsertUser({
      ...existing,
      email: payload.email || existing.email,
      fullName: payload.fullName || existing.fullName,
      role,
      title: payload.title || existing.title,
      institutionCode: payload.institutionCode ? payload.institutionCode.toUpperCase() : existing.institutionCode,
      scope: scopeString,
      permissions: permissionsString,
    });

    return updatedUser;
  }

  public async deleteAdmin(id: string) {
    const existing = (await dbGetAllUsers()).find((u) => u.id === id);
    if (!existing) {
      throw { statusCode: 404, code: 'ADMIN_NOT_FOUND', message: `Admin with ID "${id}" was not found.` };
    }
    await dbDeleteUserById(id);
    return { message: 'Admin deleted successfully' };
  }
}

export const developerService = new DeveloperService();
