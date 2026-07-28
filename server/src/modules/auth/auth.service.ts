import { authRepository, IAuthRepository } from './auth.repository.js';
import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';
import { AuthenticatedUser } from '../shared/middleware/auth.js';

export class AuthService {
  constructor(private repo: IAuthRepository = authRepository) {}

  public async loginSync(currentUser: AuthenticatedUser) {
    let user = await this.repo.findByUid(currentUser.uid);

    if (!user) {
      user = await this.repo.upsertUser({
        firebaseUid: currentUser.uid,
        email: currentUser.email || 'user@school.com',
        fullName: currentUser.email?.split('@')[0] || 'App User',
        role: currentUser.role || 'student',
        mustChangePassword: false,
        profileCompleted: false,
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
    };
  }

  public async changePassword(currentUser: AuthenticatedUser, newPassword?: string) {
    if (!newPassword || newPassword.length < 6) {
      throw { statusCode: 400, code: 'INVALID_PASSWORD', message: 'Password must be at least 6 characters long' };
    }

    if (isFirebaseAdminInitialized) {
      try {
        await admin.auth().updateUser(currentUser.uid, {
          password: newPassword,
        });
      } catch (err: any) {
        console.warn('[Firebase Auth Update Error]', err.message);
      }
    }

    await this.repo.upsertUser({
      firebaseUid: currentUser.uid,
      email: currentUser.email,
      mustChangePassword: false,
    });

    return {
      message: 'Password changed successfully',
      mustChangePassword: false,
    };
  }
}

export const authService = new AuthService();
