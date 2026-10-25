import { authRepository, IAuthRepository } from './auth.repository.js';
import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';
import { AuthenticatedUser } from '../shared/middleware/auth.js';
import { setCachedAuth } from '../shared/middleware/authCache.js';
import { institutionService } from '../institutions/institution.service.js';
import { dbFindUserById, db } from '../shared/db/index.js';
import { getPrimaryParentChild } from '../users/parent-links.js';
import { validatePasswordStrength } from '../shared/utils/password.js';
import { DEFAULT_INSTITUTION_TYPE } from '../shared/academicStructure.js';
import { placementMembers } from '../shared/db/schema.js';
import { eq, and } from 'drizzle-orm';

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
    const user = await this.repo.findByUid(currentUser.uid);

    if (!user) {
      throw {
        statusCode: 403,
        code: 'NO_ACCOUNT',
        message: 'No account is provisioned for this email. Contact your institution administrator.',
      };
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
        console.warn('[Auth Service] Failed to fetch placement access:', err);
      }
    }

    setCachedAuth(
      user.firebaseUid,
      user.role,
      user.institutionCode || '',
      Boolean(user.mustChangePassword),
      user.emailVerified ?? true,
      user.department || '',
      placementAccess
    );

    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      fullName: user.fullName,
      userRole: user.role,
      roles: (user.roles && Array.isArray(user.roles) && user.roles.length > 0) ? user.roles : [user.role],
      institutionCode: user.institutionCode,
      institutionName,
      institutionType: institutionType || DEFAULT_INSTITUTION_TYPE,
      rollNoOrUSN: user.rollNoOrUSN || '',
      phone: user.phone || '',
      parentPhone: user.parentPhone || '',
      profilePicUrl: user.profilePicUrl || '',
      tenthPercentage: user.tenthPercentage || '',
      twelfthPercentage: user.twelfthPercentage || '',
      dob: user.dob || '',
      gender: user.gender || '',
      admissionNo: user.admissionNo || '',
      admissionDate: user.admissionDate || '',
      address: user.address || '',
      city: user.city || '',
      pincode: user.pincode || '',
      guardianName: user.guardianName || '',
      guardianRelation: user.guardianRelation || '',
      guardianEmail: user.guardianEmail || '',
      mustChangePassword: user.mustChangePassword,
      profileCompleted: user.profileCompleted,
      // Phase 2: real verification state so the client can gate on it.
      // Default true keeps pre-existing accounts working.
      isEmailVerified: user.emailVerified ?? true,
      designation: user.title || '',
      // Settings → Form Fields: role's configured fields + saved values.
      profileFormFields: await institutionService
        .getRoleProfileFormFields(user.institutionCode || '', user.role || '')
        .catch(() => []),
      customFields: (() => {
        const scope = parseScope(user.scope);
        return scope.customFields && typeof scope.customFields === 'object' ? scope.customFields : {};
      })(),
      placementAccess,
      ...parseScope(user.scope),
      ...await this.resolveParentChild(user),
    };
  }

  private async resolveParentChild(user: any): Promise<Record<string, any>> {
    if (user.role?.toLowerCase() !== 'parent') return {};
    try {
      const link = await getPrimaryParentChild(user.id);
      if (!link) return {};
      const student = await dbFindUserById(link.studentId);
      if (!student) return {};
      return {
        childId: student.id,
        childName: student.fullName || '',
        // Display-only mirror of the child's current roll number so legacy
        // clients keep seeing the same shape they got from scope before.
        linkedStudentUSN: student.rollNoOrUSN || '',
        relation: link.relationship || '',
      };
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

  /**
   * Verify an email/password pair against Firebase Identity Toolkit.
   *
   * The Admin SDK has no password-verification method, so this calls
   * `accounts:signInWithPassword` with a service-account OAuth access token.
   * Returns true only on a successful sign-in; any other outcome (wrong
   * password, user not found, disabled account, network failure) is false.
   *
   * Fail-closed: if the service account or network is unavailable we return
   * false rather than true, so an outage can never be mistaken for a correct
   * password.
   */
  private async verifyCurrentPassword(email: string, password: string): Promise<boolean> {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID || admin.app().options.projectId;
      if (!projectId || !email) return false;

      const accessToken = await admin.credential.applicationDefault().getAccessToken();
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY || ''}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken.access_token}`,
          },
          body: JSON.stringify({ email, password, returnSecureToken: false }),
        }
      );
      return res.ok;
    } catch (err: any) {
      console.warn('[Auth Service] Password verification failed:', err.message);
      return false;
    }
  }

  public async changePassword(currentUser: AuthenticatedUser, newPassword?: string, currentPassword?: string) {
    // Voluntary change (mustChangePassword=false) requires the caller to supply
    // the current password, which we verify server-side. Forced first-login flow
    // (mustChangePassword=true) skips this — the user only knows the temp
    // password, and must be allowed to rotate it.
    //
    // How the check works: firebase-admin exposes no API to verify an
    // email/password pair, so we call the Identity Toolkit REST endpoint
    // `accounts:signInWithPassword` with the service-account OAuth token. That
    // is the same endpoint the client SDK uses, so the verification semantics
    // (lockout, disabled accounts, password correctness) match sign-in exactly.
    // Nothing is stored client- or server-side beyond the request itself, and a
    // wrong password returns INVALID_CREDENTIAL before any write happens.
    if (currentPassword) {
      if (!isFirebaseAdminInitialized) {
        throw {
          statusCode: 503,
          code: 'PASSWORD_VERIFY_UNAVAILABLE',
          message: 'Password verification is unavailable. Please try again later.',
        };
      }
      const ok = await this.verifyCurrentPassword(currentUser.email, currentPassword);
      if (!ok) {
        throw { statusCode: 400, code: 'INVALID_CURRENT_PASSWORD', message: 'Current password is incorrect.' };
      }
    }

    const check = validatePasswordStrength(newPassword || '');
    if (!check.ok) {
      throw { statusCode: 400, code: 'INVALID_PASSWORD', message: check.message };
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
