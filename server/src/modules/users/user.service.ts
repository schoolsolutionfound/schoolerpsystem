import { userRepository, IUserRepository } from './user.repository.js';
import { AuthenticatedUser } from '../shared/middleware/auth.js';

export interface CompleteProfileInput {
  studentPhone?: string;
  parentPhone: string;
  profilePicUrl?: string;
  institutionType: 'school' | 'college';
  tenthPercentage?: string;
  twelfthPercentage?: string;
}

export class UserService {
  constructor(private repo: IUserRepository = userRepository) {}

  public async getProfile(currentUser: AuthenticatedUser) {
    let user = await this.repo.findByUid(currentUser.uid);

    if (!user) {
      user = await this.repo.upsertUser({
        firebaseUid: currentUser.uid,
        email: currentUser.email || 'user@school.com',
      });
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
      studentPhone: user.studentPhone,
      profilePicUrl: user.profilePicUrl,
      tenthPercentage: user.tenthPercentage,
      twelfthPercentage: user.twelfthPercentage,
    };
  }

  public async completeProfile(currentUser: AuthenticatedUser, payload: CompleteProfileInput) {
    if (!payload || !payload.parentPhone) {
      throw { statusCode: 400, code: 'MISSING_FIELD', message: 'Parent phone number is required' };
    }

    const updatedUser = await this.repo.upsertUser({
      firebaseUid: currentUser.uid,
      email: currentUser.email,
      parentPhone: payload.parentPhone,
      studentPhone: payload.studentPhone,
      profilePicUrl: payload.profilePicUrl,
      institutionType: payload.institutionType,
      tenthPercentage: payload.tenthPercentage,
      twelfthPercentage: payload.twelfthPercentage,
      profileCompleted: true,
    });

    return {
      message: 'Profile completed successfully',
      user: updatedUser,
    };
  }
}

export const userService = new UserService();
