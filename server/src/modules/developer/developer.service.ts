import { institutionService, InstitutionService, toPublicInstitution } from '../institutions/institution.service.js';
import { CreateInstitutionInput, UpdateInstitutionInput } from '../institutions/institution.schema.js';
import { CreateAdminInput, UpdateAdminInput } from './developer.schema.js';
import {
  InMemoryUser,
  dbUpsertUser,
  dbUpdateUser,
  dbFindByEmail,
  dbFindAdminsByInstitutionCode,
  dbFindUserById,
  dbFindNonDeveloperUsers,
  dbCountNonDeveloperUsers,
  dbDeleteUserById,
  dbCountUsersByInstitution,
  dbCountClassSectionsByInstitution,
  dbCountSubjectsByInstitution,
  dbInsertAuditEvent,
  dbListAuditEvents,
  AuditEventOptions,
} from '../shared/db/index.js';
import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';
import { parseCsv, toCsv } from '../shared/utils/csv.js';

const IMPORT_MAX_ROWS = 1000;

function stripHtml(val: string | undefined, maxLen = 200): string {
  if (!val) return '';
  return val.trim().replace(/<[^>]*>/g, '').slice(0, maxLen);
}

export class DeveloperService {
  constructor(private instService: InstitutionService = institutionService) {}

  /** Fire-and-forget audit entry — audit failures never break the operation. */
  private recordAudit(
    actorEmail: string,
    action: string,
    targetType: 'institution' | 'admin',
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

  public async createInstitution(input: CreateInstitutionInput, actor: string) {
    const created = await this.instService.createInstitution(input);
    this.recordAudit(
      actor,
      'institution.created',
      'institution',
      created.id,
      created.institutionCode,
      { name: created.institutionName, type: created.institutionType }
    );
    return toPublicInstitution(created);
  }

  public async listInstitutions(
    opts: {
      search?: string;
      type?: string;
      status?: string;
      sort?: 'newest' | 'oldest' | 'name_asc' | 'name_desc';
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const page = await this.instService.listInstitutions(opts);
    // Shape matches /developer/admins: { data, total, limit, offset }
    return {
      data: page.items.map(toPublicInstitution),
      total: page.total,
      limit: page.limit,
      offset: page.offset,
    };
  }

  public async getInstitutionById(id: string) {
    const item = await this.instService.getInstitutionById(id);
    return toPublicInstitution(item);
  }

  public async updateInstitution(id: string, input: UpdateInstitutionInput, actor: string) {
    const existing = await this.instService.getInstitutionById(id);
    const updated = await this.instService.updateInstitution(id, input);
    if (!updated) {
      throw { statusCode: 404, code: 'INSTITUTION_NOT_FOUND', message: 'Institution not found.' };
    }
    this.recordAudit(
      actor,
      'institution.updated',
      'institution',
      updated.id,
      updated.institutionCode,
      {
        changed: {
          institutionName: input.institutionName ?? null,
          institutionType: input.institutionType ?? null,
          subscriptionStatus: input.subscriptionStatus ?? null,
        },
        previousStatus: existing?.subscriptionStatus,
      }
    );
    return toPublicInstitution(updated);
  }

  public async deleteInstitution(id: string, actor: string) {
    const existing = await this.instService.getInstitutionById(id);
    const result = await this.instService.deleteInstitution(id);
    if (existing) {
      this.recordAudit(actor, 'institution.deleted', 'institution', id, existing.institutionCode, {
        name: existing.institutionName,
      });
    }
    return result;
  }

  /**
   * Bulk-import institutions from CSV.
   * Header: institutionCode,institutionName,institutionType,subscriptionStatus,departments,academicYears,courses
   * Array columns use ; (or |) as the in-field separator. Rows with errors are
   * skipped and reported; the request is capped at IMPORT_MAX_ROWS.
   */
  public async importInstitutions(csv: string, actor: string) {
    const rows = parseCsv(csv);
    if (rows.length < 2) {
      throw { statusCode: 400, code: 'EMPTY_CSV', message: 'CSV must contain a header row and at least one data row.' };
    }

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = (name: string) => header.indexOf(name);
    const codeI = col('institutioncode');
    const nameI = col('institutionname');
    if (codeI === -1 || nameI === -1) {
      throw {
        statusCode: 400,
        code: 'MISSING_COLUMNS',
        message: 'CSV header must include at least "institutionCode" and "institutionName" (optional: institutionType, subscriptionStatus, departments, academicYears, courses).',
      };
    }
    const typeI = col('institutiontype');
    const statusI = col('subscriptionstatus');
    const deptsI = col('departments');
    const yearsI = col('academicyears');
    const coursesI = col('courses');

    const dataRows = rows.slice(1, 1 + IMPORT_MAX_ROWS);
    const truncated = rows.length - 1 > IMPORT_MAX_ROWS;
    const summary = {
      total: rows.length - 1,
      processed: dataRows.length,
      imported: 0,
      skipped: 0,
      truncated,
      errors: [] as { row: number; message: string }[],
    };
    const seenCodes = new Set<string>();

    for (let r = 0; r < dataRows.length; r++) {
      const row = dataRows[r];
      const rowNo = r + 2; // 1-based, header is row 1
      try {
        const code = (row[codeI] || '').trim().toUpperCase();
        const name = (row[nameI] || '').trim();
        if (!code) throw new Error('institutionCode is required');
        if (!name) throw new Error('institutionName is required');
        if (code.length > 50) throw new Error('institutionCode exceeds 50 characters');
        if (name.length > 200) throw new Error('institutionName exceeds 200 characters');
        if (seenCodes.has(code)) throw new Error(`duplicate code within CSV ("${code}")`);
        seenCodes.add(code);

        let type: 'school' | 'college' = 'college';
        if (typeI !== -1 && row[typeI]?.trim()) {
          const t = row[typeI].trim().toLowerCase();
          if (t !== 'school' && t !== 'college') {
            throw new Error(`invalid institutionType "${row[typeI]}" (use school or college)`);
          }
          type = t;
        }

        let status: 'active' | 'trial' | 'inactive' | 'suspended' = 'active';
        if (statusI !== -1 && row[statusI]?.trim()) {
          const s = row[statusI].trim().toLowerCase();
          if (!['active', 'trial', 'inactive', 'suspended'].includes(s)) {
            throw new Error(`invalid subscriptionStatus "${row[statusI]}" (use active, trial, inactive, suspended)`);
          }
          status = s as 'active' | 'trial' | 'inactive' | 'suspended';
        }

        const splitList = (i: number) =>
          i !== -1 && row[i]?.trim()
            ? row[i]
                .split(/[;|]/)
                .map((v) => v.trim())
                .filter(Boolean)
                .slice(0, 100)
            : [];

        await this.instService.createInstitution({
          institutionCode: code,
          institutionName: name,
          institutionType: type,
          subscriptionStatus: status,
          departments: splitList(deptsI),
          academicYears: splitList(yearsI),
          courses: splitList(coursesI),
          sections: [],
          terms: [],
          blockedDates: [],
        });

        summary.imported++;
      } catch (err: any) {
        summary.skipped++;
        summary.errors.push({
          row: rowNo,
          message: err?.code === 'INSTITUTION_CODE_EXISTS' ? `code already exists: "${(row[codeI] || '').trim()}"` : err?.message || 'Invalid row',
        });
      }
    }

    this.recordAudit(actor, 'institutions.imported', 'institution', undefined, 'csv-import', {
      imported: summary.imported,
      skipped: summary.skipped,
      totalRows: summary.total,
      truncated,
    });

    return summary;
  }

  /** CSV export of institutions (respects the same filters as the list). */
  public async exportInstitutionsCsv(
    opts: {
      search?: string;
      type?: string;
      status?: string;
      sort?: 'newest' | 'oldest' | 'name_asc' | 'name_desc';
    } = {}
  ): Promise<string> {
    const page = await this.instService.listInstitutions({ ...opts, limit: 5000, offset: 0 });
    const header = [
      'institutionCode',
      'institutionName',
      'institutionType',
      'subscriptionStatus',
      'departments',
      'academicYears',
      'courses',
    ];
    const rows = page.items.map((i) => [
      i.institutionCode,
      i.institutionName,
      i.institutionType,
      i.subscriptionStatus,
      (i.departments || []).join('; '),
      (i.academicYears || []).join('; '),
      (i.courses || []).join('; '),
    ]);
    return toCsv([header, ...rows]);
  }

  /**
   * SQL-backed stats — never loads the institutions table into JS.
   */
  public async getStats() {
    const [breakdown, institutionAdmins] = await Promise.all([
      this.instService.getStatusBreakdown(),
      dbCountUsersByInstitution(undefined, 'admin'),
    ]);

    return {
      totalInstitutions: breakdown.total,
      activeInstitutions: breakdown.active,
      institutionAdmins,
      activeSubscriptions: breakdown.active,
    };
  }

  /** Headcount + structure for a single institution (for the details view). */
  public async getInstitutionPeopleStats(id: string) {
    const inst = await this.instService.getInstitutionById(id);
    if (!inst) {
      throw { statusCode: 404, code: 'INSTITUTION_NOT_FOUND', message: 'Institution not found.' };
    }
    const code = inst.institutionCode;
    const [students, teachers, admins, principals, classSections, subjects] = await Promise.all([
      dbCountUsersByInstitution(code, 'student'),
      dbCountUsersByInstitution(code, 'teacher'),
      dbCountUsersByInstitution(code, 'admin'),
      dbCountUsersByInstitution(code, 'principal'),
      dbCountClassSectionsByInstitution(code),
      dbCountSubjectsByInstitution(code),
    ]);
    return {
      institutionId: inst.id,
      institutionCode: code,
      institutionName: inst.institutionName,
      students,
      teachers,
      admins,
      principals,
      classSections,
      subjects,
    };
  }

  public async getAuditEvents(opts: AuditEventOptions = {}) {
    return dbListAuditEvents(opts);
  }

  public async listAdmins(institutionCode?: string, limit = 100, offset = 0) {
    let admins: InMemoryUser[];
    let total = 0;
    if (institutionCode) {
      [admins, total] = await Promise.all([
        dbFindAdminsByInstitutionCode(institutionCode, { limit, offset }),
        dbCountUsersByInstitution(institutionCode, 'admin'),
      ]);
    } else {
      [admins, total] = await Promise.all([
        dbFindNonDeveloperUsers({ limit, offset }),
        dbCountNonDeveloperUsers(),
      ]);
    }

    // Only fetch the institutions referenced on this page — never the whole table.
    const codes = [...new Set(admins.map((u) => u.institutionCode).filter(Boolean))];
    const institutionsList = codes.length > 0 ? await this.instService.getInstitutionsByCodes(codes) : [];
    const instMap = new Map(institutionsList.map((i) => [i.institutionCode, i]));

    const data = admins.map((u) => {
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

    return { data, total, limit, offset };
  }

  public async createAdmin(payload: CreateAdminInput, actor: string) {
    const institutionCode = payload.institutionCode.toUpperCase().trim();
    const email = payload.email.toLowerCase().trim();

    const inst = await this.instService.getInstitutionByCode(institutionCode);
    if (!inst) {
      throw {
        statusCode: 404,
        code: 'INSTITUTION_NOT_FOUND',
        message: `Institution with code "${institutionCode}" was not found. Create the institution first.`,
      };
    }

    const existingEmail = await dbFindByEmail(email);
    if (existingEmail) {
      throw {
        statusCode: 409,
        code: 'EMAIL_EXISTS',
        message: `A user with email "${email}" already exists. Use a different email address.`,
      };
    }

    let firebaseUid: string;
    let authStatus: 'created' | 'skipped';
    if (isFirebaseAdminInitialized) {
      try {
        const fbUser = await admin.auth().createUser({
          email,
          password: payload.password,
          displayName: stripHtml(payload.fullName, 100),
        });
        firebaseUid = fbUser.uid;
        authStatus = 'created';
      } catch (err: any) {
        if (err?.code === 'auth/email-already-in-use') {
          throw {
            statusCode: 409,
            code: 'EMAIL_ALREADY_IN_USE',
            message: `The email "${email}" already has a Firebase account. Delete that user first.`,
          };
        }
        console.error('[Firebase Admin Create Error]', err?.message);
        throw {
          statusCode: 502,
          code: 'FIREBASE_USER_CREATE_FAILED',
          message: 'Could not create the Firebase auth account, so no institution admin was created. Try again.',
        };
      }
    } else {
      firebaseUid = `adm_uid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      authStatus = 'skipped';
      console.warn('[Developer Console] Firebase Admin not initialized — admin created without an auth account. Email/password login will NOT work until the server has Firebase credentials.');
    }

    const scope = {
      departments: (payload.scope?.departments || []).filter(Boolean),
      academicYears: (payload.scope?.academicYears || []).filter(Boolean),
    };

    const createdUser = await dbUpsertUser({
      firebaseUid,
      email,
      fullName: stripHtml(payload.fullName, 100),
      // CreateAdminSchema requires an explicit role — no silent 'admin' default.
      role: payload.role,
      title: stripHtml(payload.title, 100) || 'Institution Admin',
      institutionCode,
      institutionName: inst.institutionName,
      institutionType: inst.institutionType,
      phone: payload.phone?.trim() || '',
      scope: JSON.stringify(scope),
      permissions: JSON.stringify(payload.permissions || []),
      mustChangePassword: true,
      profileCompleted: false,
    });

    this.recordAudit(actor, 'admin.created', 'admin', createdUser.id, `${email} @ ${institutionCode}`, {
      role: createdUser.role,
      authStatus,
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
      scope,
      permissions: payload.permissions || [],
      authStatus,
      createdAt: createdUser.createdAt,
    };
  }

  public async updateAdmin(id: string, payload: UpdateAdminInput, actor: string) {
    const existing = await dbFindUserById(id);
    if (!existing) {
      throw { statusCode: 404, code: 'ADMIN_NOT_FOUND', message: `Admin with ID "${id}" was not found.` };
    }

    let institutionCode = existing.institutionCode;
    let institutionName = existing.institutionName;
    let institutionType = existing.institutionType;
    if (payload.institutionCode) {
      const code = payload.institutionCode.toUpperCase().trim();
      const inst = await this.instService.getInstitutionByCode(code);
      if (!inst) {
        throw {
          statusCode: 404,
          code: 'INSTITUTION_NOT_FOUND',
          message: `Institution with code "${code}" was not found.`,
        };
      }
      institutionCode = code;
      institutionName = inst.institutionName;
      institutionType = inst.institutionType;
    }

    let email = existing.email;
    if (payload.email) {
      const newEmail = payload.email.toLowerCase().trim();
      if (newEmail !== existing.email.toLowerCase()) {
        const duplicate = await dbFindByEmail(newEmail);
        if (duplicate) {
          throw {
            statusCode: 409,
            code: 'EMAIL_EXISTS',
            message: `A user with email "${newEmail}" already exists. Use a different email address.`,
          };
        }
        email = newEmail;
      }
    }

    const scopeString = payload.scope ? JSON.stringify(payload.scope) : existing.scope;
    const permissionsString = payload.permissions ? JSON.stringify(payload.permissions) : existing.permissions;

    const updatedUser = await dbUpsertUser({
      ...existing,
      email,
      fullName: payload.fullName ? stripHtml(payload.fullName, 100) : existing.fullName,
      phone: payload.phone ?? existing.phone,
      role: payload.role || existing.role,
      title: payload.title ? stripHtml(payload.title, 100) : existing.title,
      institutionCode,
      institutionName,
      institutionType,
      scope: scopeString,
      permissions: permissionsString,
    });

    this.recordAudit(actor, 'admin.updated', 'admin', updatedUser.id, email, {
      changed: {
        fullName: payload.fullName ?? null,
        email: payload.email ?? null,
        role: payload.role ?? null,
        institutionCode: payload.institutionCode ?? null,
      },
    });

    return updatedUser;
  }

  public async deleteAdmin(id: string, actor: string) {
    const existing = await dbFindUserById(id);
    if (!existing) {
      throw { statusCode: 404, code: 'ADMIN_NOT_FOUND', message: `Admin with ID "${id}" was not found.` };
    }

    let firebaseAuthDeleted = false;
    if (isFirebaseAdminInitialized && existing.firebaseUid) {
      try {
        await admin.auth().deleteUser(existing.firebaseUid);
        firebaseAuthDeleted = true;
      } catch (err: any) {
        if (err?.code !== 'auth/user-not-found') {
          console.warn('[Firebase Admin Delete Warning] could not remove Firebase auth account:', err?.message);
        }
      }
    }

    await dbDeleteUserById(id);
    this.recordAudit(actor, 'admin.deleted', 'admin', id, existing.email, {
      institutionCode: existing.institutionCode,
      firebaseAuthDeleted,
    });
    return { message: 'Admin deleted successfully', firebaseAuthDeleted };
  }

  public async resetAdminPassword(id: string, password: string, actor: string) {
    const existing = await dbFindUserById(id);
    if (!existing) {
      throw { statusCode: 404, code: 'ADMIN_NOT_FOUND', message: `Admin with ID "${id}" was not found.` };
    }

    if (isFirebaseAdminInitialized && existing.firebaseUid) {
      try {
        await admin.auth().updateUser(existing.firebaseUid, { password });
      } catch (err: any) {
        if (err?.code !== 'auth/user-not-found') {
          console.error('[Firebase Admin Reset Error]', err?.message);
          throw {
            statusCode: 502,
            code: 'FIREBASE_USER_UPDATE_FAILED',
            message: 'Could not update the Firebase auth password. No change was made. Try again.',
          };
        }
      }
    }

    await dbUpdateUser(id, { mustChangePassword: true });
    this.recordAudit(actor, 'admin.password_reset', 'admin', id, existing.email, {
      institutionCode: existing.institutionCode,
    });
    return { message: 'Password reset. The user must change it on their next login.', mustChangePassword: true };
  }
}

export const developerService = new DeveloperService();
