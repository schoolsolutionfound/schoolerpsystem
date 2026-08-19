import { userRepository, IUserRepository } from './user.repository.js';
import { AuthenticatedUser } from '../shared/middleware/auth.js';

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

    const existing = await this.repo.findByUid(currentUser.uid);
    const existingScope = parseScope(existing?.scope);

    const scopeObj = {
      ...existingScope,
      ...(payload.employeeId ? { employeeId: payload.employeeId } : {}),
      ...(payload.department ? { department: payload.department } : {}),
      ...(payload.linkedStudentUSN ? { linkedStudentUSN: payload.linkedStudentUSN } : {}),
      ...(payload.relation ? { relation: payload.relation } : {}),
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
