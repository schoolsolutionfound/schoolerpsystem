import { authRepository, IAuthRepository } from './auth.repository.js';
import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';
import { AuthenticatedUser } from '../shared/middleware/auth.js';
import { institutionService } from '../institutions/institution.service.js';

function parseScope(val: any): Record<string, any> {
  if (!val) return {};
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return {}; }
  }
  return typeof val === 'object' ? val : {};
}

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

    let institutionName = user.institutionName || '';
    let institutionType = user.institutionType || '';
    try {
      const insts = await institutionService.getInstitutions();
      const match = insts.find((i) => i.institutionCode.toLowerCase() === (user.institutionCode || '').toLowerCase());
      if (match) {
        if (!institutionName || institutionName === user.institutionCode) institutionName = match.institutionName;
        institutionType = match.institutionType || institutionType;
      }
    } catch {}

    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      fullName: user.fullName,
      userRole: user.role,
      institutionCode: user.institutionCode,
      institutionName,
      institutionType: institutionType || 'college',
      rollNoOrUSN: user.rollNoOrUSN || '',
      phone: user.phone || '',
      parentPhone: user.parentPhone || '',
      profilePicUrl: user.profilePicUrl || '',
      tenthPercentage: user.tenthPercentage || '',
      twelfthPercentage: user.twelfthPercentage || '',
      mustChangePassword: user.mustChangePassword,
      profileCompleted: user.profileCompleted,
      designation: user.title || '',
      ...parseScope(user.scope),
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
        throw { statusCode: 400, code: 'FIREBASE_AUTH_ERROR', message: `Failed to update password: ${err.message}` };
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
