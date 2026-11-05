// ============================================================================
// Password Reset Service (OTP — forgot password)
//
// Flow:
//   1. forgotPassword() — mints a 6-digit code and emails it through the same
//      SES/provider pipeline as email verification, but with reset copy. The
//      response is identical for unknown addresses so the endpoint cannot be
//      used to enumerate accounts.
//   2. resetPassword() — validates the code (constant-time HMAC, attempt cap,
//      single-use) and the new password, updates the Firebase password, marks
//      the account verified, and revokes every refresh token so a stolen
//      session cannot outlive the reset.
//
// No links and no Firebase-hosted email templates: delivery goes through the
// institution's own SES identity and the code is typed into the app.
// ============================================================================

import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';
import { authRepository, IAuthRepository } from './auth.repository.js';
import { invalidateVerifiedTokensForUid } from '../shared/middleware/verifiedTokenCache.js';
import { validatePasswordStrength } from '../shared/utils/password.js';
import { emailVerificationService } from '../notifications/email.service.js';
import { findInstitutionCodeByEmail } from '../notifications/email.repository.js';

export class PasswordResetService {
  private repo: IAuthRepository;

  constructor(repo = authRepository) {
    this.repo = repo;
  }

  /**
   * Send a reset code to the address on file.
   *
   * Always reports success after basic validation: unknown addresses, throttled
   * addresses and delivery failures all return the same shape, so the endpoint
   * cannot be used to enumerate accounts. Failures are logged server-side for
   * operators; the user is told to check spam / try again later.
   */
  public async forgotPassword(email: string): Promise<{ sent: true; devCode?: string }> {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'A valid email is required',
      };
    }

    const user = await this.repo.findByEmail(normalizedEmail);
    if (!user) {
      return { sent: true };
    }

    const institutionCode =
      user.institutionCode || (await findInstitutionCodeByEmail(normalizedEmail)) || '';
    const result = await emailVerificationService.requestVerification({
      institutionCode,
      email: normalizedEmail,
      firebaseUid: user.firebaseUid,
      institutionName: user.institutionName || '',
      fullName: user.fullName || '',
      purpose: 'password_reset',
    });

    if (!result.ok) {
      console.warn(
        `[Password Reset Service] Reset code not sent to ${normalizedEmail}: ${result.code} — ${result.message}`
      );
      return { sent: true };
    }

    return { sent: true, ...(result.devCode ? { devCode: result.devCode } : {}) };
  }

  /**
   * Consume a reset code and set the new password.
   *
   * The code is consumed before the password write: if two requests race with
   * the same valid code only one proceeds, and a code can never authorize two
   * password changes.
   */
  public async resetPassword(email: string, code: string, newPassword: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const submittedCode = (code || '').trim();

    if (!normalizedEmail) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'Email is required' };
    }
    if (!submittedCode) {
      throw { statusCode: 400, code: 'OTP_INVALID', message: 'Enter the 6-digit code from your email.' };
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.ok) {
      throw { statusCode: 400, code: 'INVALID_PASSWORD', message: strength.message };
    }

    if (!isFirebaseAdminInitialized) {
      throw {
        statusCode: 503,
        code: 'PASSWORD_RESET_UNAVAILABLE',
        message: 'Password reset is unavailable. Please try again later.',
      };
    }

    const verified = await emailVerificationService.verifyOtpCode(normalizedEmail, submittedCode);
    if (!verified.ok) {
      const status =
        verified.code === 'OTP_LOCKED' ? 403 : verified.code === 'OTP_EXPIRED' ? 410 : 400;
      throw {
        statusCode: status,
        code: verified.code,
        message: verified.message,
        ...(verified.attemptsLeft !== undefined ? { attemptsLeft: verified.attemptsLeft } : {}),
      };
    }

    // Resolve the account behind the proved mailbox. A code is only ever minted
    // for an existing user, but the account could have been removed since.
    const user = verified.firebaseUid
      ? await this.repo.findByUid(verified.firebaseUid)
      : await this.repo.findByEmail(verified.email);
    if (!user) {
      throw {
        statusCode: 400,
        code: 'RESET_FAILED',
        message: 'This reset request is no longer valid. Request a new code.',
      };
    }

    try {
      // The mailbox is proved, so the address is safe to treat as verified.
      await admin.auth().updateUser(user.firebaseUid, {
        password: newPassword,
        emailVerified: true,
      });
    } catch (err: any) {
      console.warn('[Password Reset Service] Password update failed:', err.message);
      if (err.code === 'auth/user-not-found') {
        throw {
          statusCode: 400,
          code: 'RESET_FAILED',
          message: 'This account is no longer available. Contact your administrator.',
        };
      }
      throw {
        statusCode: 500,
        code: 'PASSWORD_RESET_FAILED',
        message: 'Could not update the password. Request a new code and try again.',
      };
    }

    try {
      await this.repo.upsertUser({
        firebaseUid: user.firebaseUid,
        email: user.email,
        mustChangePassword: false,
        emailVerified: true,
      });
    } catch (err: any) {
      // The password already changed; don't report failure for a mirror write.
      console.warn('[Password Reset Service] User row update failed after reset:', err.message);
    }

    // Kill every existing session: ID tokens lapse on their own, but no new
    // refresh may be granted from a pre-reset session.
    try {
      await admin.auth().revokeRefreshTokens(user.firebaseUid);
    } catch (err: any) {
      console.warn('[Password Reset Service] Token revocation after reset failed:', err.message);
    }

    invalidateVerifiedTokensForUid(user.firebaseUid);

    return {
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    };
  }
}

export const passwordResetService = new PasswordResetService();
