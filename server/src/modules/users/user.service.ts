import { userRepository, IUserRepository } from './user.repository.js';
import { AuthenticatedUser } from '../shared/middleware/auth.js';
import { dbFindStudentByUsnInInstitution } from '../shared/db/index.js';

export interface CompleteProfileInput {
  phone?: string;
  parentPhone?: string;
  profilePicUrl?: string;
  institutionType?: 'school' | 'college';
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
}

function parseScope(val: any): Record<string, any> {
  if (!val) return {};
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return {}; }
  }
  return typeof val === 'object' ? val : {};
}

const RELATION_CANONICAL: Record<string, string> = {
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
      designation: user.title || '',
      ...parseScope(user.scope),
    };
  }

  public async completeProfile(currentUser: AuthenticatedUser, payload: CompleteProfileInput) {
    const role = (currentUser.role || 'student').toLowerCase();

    if (role === 'student') {
      if (!payload.parentPhone) {
        throw { statusCode: 400, code: 'MISSING_FIELD', message: 'Parent phone number is required for students' };
      }
    }

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

    let storedUsn = requestedUsn;

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
      const currentUsn = (existingScope.linkedStudentUSN || '').trim();
      if (currentUsn && currentUsn.toLowerCase() !== requestedUsn.toLowerCase()) {
        throw {
          statusCode: 403,
          code: 'LINK_CHANGE_FORBIDDEN',
          message: 'This account is already linked to a student. Contact your administrator to change the link.',
        };
      }
      // Preserve the original casing on re-submit (SQL USN match is case-sensitive).
      if (currentUsn) {
        storedUsn = currentUsn;
      }
    }

    const scopeObj = {
      ...existingScope,
      ...(payload.employeeId ? { employeeId: payload.employeeId } : {}),
      ...(payload.department ? { department: payload.department } : {}),
      ...(storedUsn ? { linkedStudentUSN: storedUsn } : {}),
      ...(canonicalRelation ? { relation: canonicalRelation } : {}),
      ...(payload.qualification ? { qualification: payload.qualification } : {}),
      ...(payload.experience ? { experience: payload.experience } : {}),
      ...(payload.libraryBadgeId ? { libraryBadgeId: payload.libraryBadgeId } : {}),
    };

    const updatedUser = await this.repo.upsertUser({
      firebaseUid: currentUser.uid,
      email: currentUser.email,
      parentPhone: payload.parentPhone || '',
      phone: payload.phone || payload.parentPhone || '',
      profilePicUrl: payload.profilePicUrl,
      institutionType: payload.institutionType || 'college',
      tenthPercentage: role === 'student' ? payload.tenthPercentage : undefined,
      twelfthPercentage: role === 'student' ? payload.twelfthPercentage : undefined,
      title: payload.designation || existing?.title || '',
      scope: JSON.stringify(scopeObj),
      profileCompleted: true,
    });

    return {
      message: 'Profile completed successfully',
      user: updatedUser,
    };
  }
}

export const userService = new UserService();
