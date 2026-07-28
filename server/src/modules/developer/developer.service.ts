import { institutionService, InstitutionService } from '../institutions/institution.service.js';
import { CreateInstitutionInput, UpdateInstitutionInput } from '../institutions/institution.schema.js';
import { inMemoryUserStore, dbUpsertUser, dbGetAllUsers, dbDeleteUserById } from '../shared/db/index.js';
import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';

export interface CreateAdminPayload {
  fullName: string;
  email: string;
  password?: string;
  institutionCode: string;
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

  public async listAdmins() {
    const allUsers = await dbGetAllUsers();
    const admins = allUsers.filter(
      (u) => u.role === 'maintainer' || u.role === 'admin'
    );
    const institutionsList = await this.instService.getInstitutions();
    const instMap = new Map(institutionsList.map((i) => [i.institutionCode, i]));

    return admins.map((u) => {
      const inst = instMap.get(u.institutionCode);
      let parsedScope = { departments: [], academicYears: [] };
      let parsedPermissions: string[] = [];

      try {
        parsedScope = typeof u.scope === 'string' ? JSON.parse(u.scope || '{}') : u.scope;
      } catch {
        parsedScope = { departments: [], academicYears: [] };
      }

      try {
        parsedPermissions = typeof u.permissions === 'string' ? JSON.parse(u.permissions || '[]') : u.permissions;
      } catch {
        parsedPermissions = [];
      }

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
    let firebaseUid = `adm_uid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    if (isFirebaseAdminInitialized && payload.password) {
      try {
        const fbUser = await admin.auth().createUser({
          email: payload.email,
          password: payload.password,
          displayName: payload.fullName,
        });
        firebaseUid = fbUser.uid;
      } catch (err: any) {
        console.warn('[Firebase Admin Create Error]', err.message);
      }
    }

    const inst = (await this.instService.getInstitutions()).find(
      (i) => i.institutionCode.toLowerCase() === payload.institutionCode.toLowerCase()
    );

    const scopeString = JSON.stringify(payload.scope || { departments: [], academicYears: [] });
    const permissionsString = JSON.stringify(payload.permissions || []);

    const createdUser = await dbUpsertUser({
      firebaseUid,
      email: payload.email,
      fullName: payload.fullName,
      role: 'admin',
      title: payload.title || 'Institution Admin',
      institutionCode: payload.institutionCode.toUpperCase(),
      institutionName: inst?.institutionName || payload.institutionCode,
      institutionType: inst?.institutionType || 'college',
      scope: scopeString,
      permissions: permissionsString,
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
      scope: payload.scope || { departments: [], academicYears: [] },
      permissions: payload.permissions || [],
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

    const updatedUser = await dbUpsertUser({
      ...existing,
      email: payload.email || existing.email,
      fullName: payload.fullName || existing.fullName,
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
