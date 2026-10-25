import { userRepository, IUserRepository } from './user.repository.js';
import { AuthenticatedUser } from '../shared/middleware/auth.js';
import { dbFindStudentByUsnInInstitution, db } from '../shared/db/index.js';
import { placementMembers } from '../shared/db/schema.js';
import { and, eq } from 'drizzle-orm';
import { getParentLinks, insertParentLinks, DEFAULT_PARENT_PERMISSIONS } from './parent-links.js';
import { institutionService } from '../institutions/institution.service.js';
import { validateCustomFields, mergeCustomFields } from './profile-fields.validation.js';
import type { ProfileFormField } from '../admin/profileFields.schema.js';
import { DEFAULT_INSTITUTION_TYPE } from '../shared/academicStructure.js';

export interface CompleteProfileInput {
  phone?: string;
  parentPhone?: string;
  profilePicUrl?: string;
  institutionType?: 'school' | 'college';
  address?: string;
  city?: string;
  pincode?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianEmail?: string;
  tenthPercentage?: string;
  twelfthPercentage?: string;
  employeeId?: string;
  department?: string;
  linkedStudentUSN?: string;
  relation?: string;
  qualification?: string;
  experience?: string;
  libraryBadgeId?: string;
  designation?: string;
  dob?: string;
  gender?: string;
  specialization?: string;
  emergencyContact?: string;
  /** Settings → Form Fields values, keyed by field id. */
  customFields?: Record<string, any>;
}

function parseScope(val: any): Record<string, any> {
  if (!val) return {};
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return {}; }
  }
  return typeof val === 'object' ? val : {};
}

export const RELATION_CANONICAL: Record<string, string> = {
  father: 'Father',
  mother: 'Mother',
  guardian: 'Guardian',
};

export class UserService {
  constructor(private repo: IUserRepository = userRepository) {}

  public async getProfile(currentUser: AuthenticatedUser) {
    const user = await this.repo.findByUid(currentUser.uid);

    if (!user) {
      throw {
        statusCode: 403,
        code: 'ACCOUNT_NOT_PROVISIONED',
        message: 'No account is provisioned for this user. Contact your administrator.',
      };
    }

    const scope = parseScope(user.scope);
    // Settings → Form Fields: the role's configured extra fields plus this
    // user's saved values (both also flow through the scope spread below, but
    // are returned explicitly so clients never depend on spread ordering).
    const profileFormFields = await institutionService
      .getRoleProfileFormFields(user.institutionCode || '', user.role || '')
      .catch(() => [] as ProfileFormField[]);

    let placementAccess: 'head' | 'member' | null = null;
    if (user.role === 'placement_officer' || user.role === 'admin') {
      placementAccess = 'head';
    } else if (db && user.institutionCode && user.role !== 'student' && user.role !== 'parent') {
      try {
        const membership = await db.query.placementMembers.findFirst({
          where: and(
            eq(placementMembers.institutionCode, user.institutionCode),
            eq(placementMembers.userId, user.id)
          ),
        });
        if (membership) placementAccess = membership.accessLevel as 'head' | 'member';
      } catch (err) {
        console.warn('[User Service] Failed to fetch placement access:', err);
      }
    }

    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      fullName: user.fullName,
      userRole: user.role,
      institutionCode: user.institutionCode,
      institutionName: user.institutionName,
      institutionType: user.institutionType,
      mustChangePassword: user.mustChangePassword,
      profileCompleted: user.profileCompleted,
      parentPhone: user.parentPhone,
      phone: user.phone,
      profilePicUrl: user.profilePicUrl,
      tenthPercentage: user.tenthPercentage,
      twelfthPercentage: user.twelfthPercentage,
      dob: user.dob,
      gender: user.gender,
      admissionNo: user.admissionNo,
      admissionDate: user.admissionDate,
      address: user.address,
      city: user.city,
      pincode: user.pincode,
      emergencyContact: user.emergencyContact || '',
      guardianName: user.guardianName,
      guardianRelation: user.guardianRelation,
      guardianEmail: user.guardianEmail,
      designation: user.title || '',
      profileFormFields,
      customFields: (scope.customFields && typeof scope.customFields === 'object' ? scope.customFields : {}),
      placementAccess,
      ...scope,
    };
  }

  /** Settings → Form Fields config for the calling user's role + institution. */
  public async getMyProfileFields(currentUser: AuthenticatedUser) {
    const user = await this.repo.findByUid(currentUser.uid);
    const instCode = (currentUser.institutionCode || user?.institutionCode || '').trim();
    const role = user?.role || currentUser.role || '';
    return institutionService.getRoleProfileFormFields(instCode, role);
  }

  public async completeProfile(currentUser: AuthenticatedUser, payload: CompleteProfileInput) {
    const role = (currentUser.role || 'student').toLowerCase();

    const phone = (payload.phone || '').trim();
    if (phone && !/^\+?[\d\s-]{7,20}$/.test(phone)) {
      throw { statusCode: 400, code: 'INVALID_PHONE', message: 'Phone number must be 7-20 digits (may include +, spaces or dashes)' };
    }

    const canonicalGuardianRelation =
      role === 'student' ? RELATION_CANONICAL[(payload.guardianRelation || '').trim().toLowerCase()] || '' : '';

    const requestedUsn = (payload.linkedStudentUSN || '').trim();
    const requestedRelation = (payload.relation || '').trim();

    // linkedStudentUSN/relation are parent-only fields — any other role
    // sending them is an account-linking forgery attempt.
    if (role !== 'parent' && (requestedUsn || requestedRelation)) {
      throw {
        statusCode: 403,
        code: 'FORBIDDEN_FIELD',
        message: 'linkedStudentUSN and relation can only be set for parent accounts.',
      };
    }

    let canonicalRelation: string | undefined;
    if (role === 'parent' && requestedRelation) {
      canonicalRelation = RELATION_CANONICAL[requestedRelation.toLowerCase()];
      if (!canonicalRelation) {
        throw {
          statusCode: 400,
          code: 'INVALID_RELATION',
          message: 'relation must be one of: Father, Mother, Guardian.',
        };
      }
    }

    let linkStudentId: string | undefined;
    let linkInstitutionCode = '';

    const existing = await this.repo.findByUid(currentUser.uid);
    const existingScope = parseScope(existing?.scope);

    if (role === 'parent' && requestedUsn) {
      const institutionCode = (currentUser.institutionCode || existing?.institutionCode || '').trim();
      if (!institutionCode) {
        throw { statusCode: 403, code: 'NO_INSTITUTION', message: 'No institution assigned to this user.' };
      }

      const student = await dbFindStudentByUsnInInstitution(institutionCode, requestedUsn);
      if (!student) {
        throw {
          statusCode: 400,
          code: 'STUDENT_NOT_FOUND',
          message: 'No student with this USN / Roll number exists in your institution.',
        };
      }

      // Once linked, the child cannot be re-pointed through self-service —
      // that is the account-linking forgery vector. Admins change it server-side.
      const currentLinks = existing ? await getParentLinks(existing.id) : [];
      const legacyUsn = String(existingScope.linkedStudentUSN || '').trim();
      const isSameChild =
        (currentLinks.length > 0 && currentLinks[0].studentId === student.id) ||
        (currentLinks.length === 0 &&
          legacyUsn !== '' &&
          legacyUsn.toLowerCase() === requestedUsn.toLowerCase());
      if ((currentLinks.length > 0 || legacyUsn) && !isSameChild) {
        throw {
          statusCode: 403,
          code: 'LINK_CHANGE_FORBIDDEN',
          message: 'This account is already linked to a student. Contact your administrator to change the link.',
        };
      }
      linkStudentId = student.id;
      linkInstitutionCode = institutionCode;
    }

    // Settings → Form Fields: validate the role's configured fields (required
    // + per-type checks). Values are persisted inside scope.customFields keyed
    // by stable field id, so label/type edits never orphan saved data.
    const instCode = (currentUser.institutionCode || existing?.institutionCode || '').trim();
    const roleFields = await institutionService.getRoleProfileFormFields(instCode, role).catch(() => [] as ProfileFormField[]);
    let validatedCustomFields: Record<string, any> = {};
    if (roleFields.length > 0) {
      const result = validateCustomFields(roleFields, payload.customFields ?? {});
      if (!result.ok) {
        throw { statusCode: 400, code: 'INVALID_CUSTOM_FIELDS', message: result.message };
      }
      validatedCustomFields = result.values;
    }

    const scopeObj: Record<string, any> = {
      ...existingScope,
      ...(payload.employeeId ? { employeeId: payload.employeeId } : {}),
      ...(payload.department ? { department: payload.department } : {}),
      ...(canonicalRelation ? { relation: canonicalRelation } : {}),
      ...(payload.qualification ? { qualification: payload.qualification } : {}),
      ...(payload.experience ? { experience: payload.experience } : {}),
      ...(payload.libraryBadgeId ? { libraryBadgeId: payload.libraryBadgeId } : {}),
      ...(payload.specialization ? { specialization: payload.specialization } : {}),
    };
    if (roleFields.length > 0) {
      scopeObj.customFields = mergeCustomFields(
        existingScope.customFields as Record<string, any> | undefined,
        validatedCustomFields
      );
    }
    // Linking lives in parent_links now — keep scope free of the legacy key
    // for accounts we touch (legacy readers fall back only when rows are absent).
    delete scopeObj.linkedStudentUSN;

    const updatedUser = await this.repo.upsertUser({
      firebaseUid: currentUser.uid,
      email: currentUser.email,
      parentPhone: payload.parentPhone || '',
      phone: payload.phone || payload.parentPhone || '',
      profilePicUrl: payload.profilePicUrl,
      institutionType: payload.institutionType || DEFAULT_INSTITUTION_TYPE,
      address: payload.address,
      city: payload.city,
      pincode: payload.pincode,
      guardianName: role === 'student' ? payload.guardianName : undefined,
      guardianRelation: role === 'student' ? canonicalGuardianRelation : undefined,
      guardianEmail: role === 'student' ? payload.guardianEmail : undefined,
      tenthPercentage: role === 'student' ? payload.tenthPercentage : undefined,
      twelfthPercentage: role === 'student' ? payload.twelfthPercentage : undefined,
      title: payload.designation || existing?.title || '',
      dob: payload.dob || existing?.dob || '',
      gender: payload.gender || existing?.gender || '',
      emergencyContact: payload.emergencyContact || existing?.emergencyContact || '',
      scope: JSON.stringify(scopeObj),
      profileCompleted: true,
    });

    const parentId = existing?.id || (updatedUser as any)?.id;
    if (linkStudentId && parentId) {
      await insertParentLinks(linkInstitutionCode, parentId, [
        {
          studentId: linkStudentId,
          relationship: canonicalRelation || 'Guardian',
          permissions: DEFAULT_PARENT_PERMISSIONS,
          isPrimary: true,
        },
      ]);
    }

    return {
      message: 'Profile completed successfully',
      user: updatedUser,
    };
  }

  /**
   * Self-service profile edit for already-completed accounts (admin/developer/
   * staff). Only safe display fields — never role, institution, or parent links.
   */
  public async updateMyProfile(
    currentUser: AuthenticatedUser,
    payload: {
      fullName?: string;
      phone?: string;
      designation?: string;
      profilePicUrl?: string;
      address?: string;
      city?: string;
      pincode?: string;
      emergencyContact?: string;
      qualification?: string;
      experience?: string;
      /** Settings — Form Fields values; only fields flagged editable apply. */
      customFields?: Record<string, any>;
    }
  ) {
    const existing = await this.repo.findByUid(currentUser.uid);
    if (!existing) {
      throw {
        statusCode: 403,
        code: 'ACCOUNT_NOT_PROVISIONED',
        message: 'No account is provisioned for this user. Contact your administrator.',
      };
    }

    const fullName = (payload.fullName ?? '').trim();
    if (payload.fullName !== undefined && fullName.length < 2) {
      throw { statusCode: 400, code: 'INVALID_NAME', message: 'Full name must be at least 2 characters.' };
    }
    if (payload.phone !== undefined && payload.phone && !/^\+?[\d\s-]{7,20}$/.test(payload.phone.trim())) {
      throw { statusCode: 400, code: 'INVALID_PHONE', message: 'Phone number looks invalid.' };
    }

    const existingScope = parseScope(existing.scope);

    const scopeUpdates: Record<string, any> = {};
    if (payload.customFields !== undefined) {
      const roleFields = await institutionService
        .getRoleProfileFormFields(existing.institutionCode || '', existing.role || '')
        .catch(() => [] as ProfileFormField[]);
      const result = validateCustomFields(roleFields, payload.customFields, { onlyEditable: true });
      if (!result.ok) {
        throw { statusCode: 400, code: 'INVALID_CUSTOM_FIELDS', message: result.message };
      }
      scopeUpdates.customFields = mergeCustomFields(
        existingScope.customFields as Record<string, any> | undefined,
        result.values
      );
    }
    if (payload.qualification !== undefined) {
      scopeUpdates.qualification = payload.qualification.trim();
    }
    if (payload.experience !== undefined) {
      scopeUpdates.experience = payload.experience.trim();
    }
    const scopeBlob =
      Object.keys(scopeUpdates).length > 0
        ? JSON.stringify({ ...existingScope, ...scopeUpdates })
        : JSON.stringify(existingScope);

    const updatedUser = await this.repo.upsertUser({
      firebaseUid: currentUser.uid,
      email: existing.email,
      ...(payload.fullName !== undefined && fullName ? { fullName } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone.trim() } : {}),
      ...(payload.designation !== undefined ? { title: payload.designation.trim() } : {}),
      ...(payload.profilePicUrl !== undefined ? { profilePicUrl: payload.profilePicUrl } : {}),
      ...(payload.address !== undefined ? { address: payload.address.trim() } : {}),
      ...(payload.city !== undefined ? { city: payload.city.trim() } : {}),
      ...(payload.pincode !== undefined ? { pincode: payload.pincode.trim() } : {}),
      ...(payload.emergencyContact !== undefined ? { emergencyContact: payload.emergencyContact.trim() } : {}),
      scope: scopeBlob,
      profileCompleted: true,
    });

    return {
      message: 'Profile updated successfully',
      user: updatedUser,
      fullName: updatedUser?.fullName ?? existing.fullName,
      phone: updatedUser?.phone ?? existing.phone,
      designation: updatedUser?.title ?? existing.title,
      profilePicUrl: updatedUser?.profilePicUrl ?? existing.profilePicUrl,
      qualification: (updatedUser?.scope ? parseScope(updatedUser.scope) : existingScope).qualification ?? '',
      experience: (updatedUser?.scope ? parseScope(updatedUser.scope) : existingScope).experience ?? '',
    };
  }
}

export const userService = new UserService();
