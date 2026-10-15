import { authRepository, IAuthRepository } from './auth.repository.js';
import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';
import { AuthenticatedUser } from '../shared/middleware/auth.js';
import { institutionService } from '../institutions/institution.service.js';
import { dbFindStudentByUsnInInstitution } from '../shared/db/index.js';

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
      // Auto-provision unassigned / new normal users as prospective parents
      // so they can log in, discover schools, and apply for admissions!
      user = await this.repo.upsertUser({
        firebaseUid: currentUser.uid,
        email: currentUser.email || '',
        fullName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Parent',
        role: 'parent',
        institutionCode: '',
        institutionName: 'Prospective Parent',
        institutionType: 'school',
        profileCompleted: true,
        mustChangePassword: false,
      });
    }

    let institutionName = user.institutionName || '';
    let institutionType = user.institutionType || '';
    try {
      const match = await institutionService.getInstitutionByCode(user.institutionCode || '');
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
      roles: (user.roles && Array.isArray(user.roles) && user.roles.length > 0) ? user.roles : [user.role],
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
      ...await this.resolveParentChild(user),
    };
  }

  private async resolveParentChild(user: any): Promise<Record<string, any>> {
    if (user.role?.toLowerCase() !== 'parent') return {};
    const scope = parseScope(user.scope);
    const linkedUsn = scope.linkedStudentUSN || '';
    if (!linkedUsn) return {};
    try {
      const student = await dbFindStudentByUsnInInstitution(user.institutionCode || '', linkedUsn);
      if (!student) return {};
      return { childId: student.id, childName: student.fullName || '' };
    } catch {
      return {};
    }
  }

  public async logout(currentUser: AuthenticatedUser) {
    if (isFirebaseAdminInitialized && currentUser.uid) {
      try {
        await admin.auth().revokeRefreshTokens(currentUser.uid);
      } catch (err: any) {
        console.warn('[Auth Service] Refresh token revocation failed:', err.message);
      }
    }

    return { message: 'Logged out successfully' };
  }

  public async changePassword(currentUser: AuthenticatedUser, newPassword?: string) {
    if (!newPassword || newPassword.length < 8) {
      throw { statusCode: 400, code: 'INVALID_PASSWORD', message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(newPassword)) {
      throw { statusCode: 400, code: 'INVALID_PASSWORD', message: 'Password must contain an uppercase letter' };
    }
    if (!/[a-z]/.test(newPassword)) {
      throw { statusCode: 400, code: 'INVALID_PASSWORD', message: 'Password must contain a lowercase letter' };
    }
    if (!/[0-9]/.test(newPassword)) {
      throw { statusCode: 400, code: 'INVALID_PASSWORD', message: 'Password must contain a digit' };
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
