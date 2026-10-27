import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import {
  insertToken,
  countRecentSends,
  consumeToken,
  findActiveOtp,
  failOtpAttempt,
  invalidateOtpsForEmail,
  isSuppressed,
  addSuppression,
  getEmailConfig,
  findUserByEmail,
  findUserByUid,
  markUserEmailVerified,
} from './email.repository.js';
import { sendEmail, EmailSendError, isSesConfigured } from './email.provider.js';

// ============================================================================
// Email Verification Service (Phase 2 — OTP via custom SES provider)
//
// Flow:
//   1. requestVerification() — rate-limited, suppression-checked, mints a
//      6-digit OTP (only an HMAC keyed by a server secret is stored),
//      invalidates prior codes, and emails the code.
//   2. verifyOtp() — compares in constant time, counts failed attempts, and
//      consumes the code on success or at the attempt cap.
//
// Why HMAC and not a bare hash: a 6-digit code has ~20 bits of entropy, so a
// leaked database row would be brute-forced instantly if it held sha256(code).
// Keying the digest with EMAIL_OTP_SECRET makes an offline attack useless
// without the secret. The email address is mixed into the HMAC so a code
// issued for one account can never validate for another.
//
// Online guessing is bounded separately by the attempts column (5 per code)
// plus the resend cap (3/hour/address) → at most 15 guesses/hour against a
// 10^6 space.
// ============================================================================

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_LENGTH = 6;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_LIMIT_PER_HOUR = 3;
const RESEND_WINDOW_MS = 60 * 60 * 1000;

const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || '';
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || 'School ERP';

let warnedMissingSecret = false;
let warnedTestOtp = false;

/**
 * Key for the OTP digest. A dedicated secret keeps a database leak useless on
 * its own; falling back to the payment master key avoids blocking local dev,
 * and the last-resort literal only ever applies when nothing is configured
 * (it is warned about loudly rather than silently weakening production).
 */
function otpSecret(): string {
  const secret = process.env.EMAIL_OTP_SECRET || process.env.PAYMENT_CONFIG_MASTER_KEY || '';
  if (!secret) {
    if (!warnedMissingSecret) {
      console.warn(
        '[Email Verification] EMAIL_OTP_SECRET is not set — using an ephemeral secret. Codes will not survive a server restart and this is NOT safe for production.'
      );
      warnedMissingSecret = true;
    }
    return `ephemeral-${process.pid}`;
  }
  return secret;
}

function otpHmac(email: string, code: string): string {
  return createHmac('sha256', otpSecret()).update(`${email}:${code}`, 'utf8').digest('hex');
}

function generateOtp(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
}

function getTestOtpCode(): string | null {
  if (process.env.NODE_ENV === 'production') return null;
  const code = (process.env.EMAIL_OTP_TEST_CODE || '').trim();
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(code)) return null;
  if (!warnedTestOtp) {
    console.warn('[Email Verification] Test OTP is enabled. Verification codes are fixed until EMAIL_OTP_TEST_CODE is removed.');
    warnedTestOtp = true;
  }
  return code;
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a || '', 'utf8');
  const bufB = Buffer.from(b || '', 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export type VerifyResult =
  | { ok: true; email: string; institutionCode: string }
  | {
      ok: false;
      code: 'OTP_INVALID' | 'OTP_EXPIRED' | 'OTP_LOCKED' | 'ALREADY_VERIFIED';
      message: string;
      attemptsLeft?: number;
    };

export type RequestResult =
  | { ok: true; devCode?: string }
  | {
      ok: false;
      code: 'RATE_LIMITED' | 'SUPPRESSED' | 'SES_NOT_CONFIGURED' | 'USER_NOT_FOUND' | 'EMAIL_MISMATCH';
      message: string;
    };

/**
 * Render the OTP email. The code is the only actionable element — no link,
 * so there is nothing to phish and no deep-link/redirect surface.
 */
export function renderOtpEmail(opts: {
  institutionName: string;
  fullName: string;
  code: string;
  expiresMinutes: number;
}): { subject: string; html: string; text: string } {
  const { institutionName, fullName, code, expiresMinutes } = opts;
  const safeName = escapeHtml(fullName || 'there');
  const safeInst = escapeHtml(institutionName || 'Your institution');

  const subject = `Your ${institutionName || 'School ERP'} verification code`;

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#FFFDF7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFDF7;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E8E5DC;border-radius:12px;overflow:hidden;">
          <tr><td style="background:#171717;padding:24px 28px;">
            <div style="color:#F4C430;font-size:18px;font-weight:700;">${safeInst}</div>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="margin:0 0 12px;font-size:20px;color:#171717;">Verify your email</h1>
            <p style="margin:0 0 20px;font-size:15px;color:#3F3F46;line-height:1.5;">
              Hi ${safeName}, use this code to confirm your email address:
            </p>
            <div style="margin:0 0 20px;padding:16px;background:#FFF4C7;border:1px dashed #F4C430;border-radius:10px;text-align:center;">
              <span style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:34px;font-weight:700;letter-spacing:12px;color:#171717;">${escapeHtml(code)}</span>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#71717A;">This code expires in ${expiresMinutes} minutes and can only be used once. If you didn't request it, you can safely ignore this email.</p>
          </td></tr>
          <tr><td style="border-top:1px solid #E8E5DC;padding:16px 28px;">
            <p style="margin:0;font-size:12px;color:#A1A1AA;">Never share this code. ${safeInst} will never ask for it by phone or chat.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `${institutionName || 'School ERP'} — verify your email\n\nHi ${fullName || 'there'},\n\nYour verification code is: ${code}\n\nIt expires in ${expiresMinutes} minutes and can only be used once. If you didn't request it, ignore this email.`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Resolve the per-tenant sender, falling back to the env default. */
async function resolveSender(institutionCode: string): Promise<{
  fromEmail: string;
  fromName: string;
  replyTo: string;
  configurationSet: string;
} | null> {
  const cfg = await getEmailConfig(institutionCode);
  if (cfg && cfg.fromEmail) return cfg;
  if (!DEFAULT_FROM_EMAIL) return null;
  return { fromEmail: DEFAULT_FROM_EMAIL, fromName: DEFAULT_FROM_NAME, replyTo: '', configurationSet: '' };
}

/**
 * Mint an OTP and email it.
 *
 * Rate limit: RESEND_LIMIT_PER_HOUR per address per rolling hour.
 * Suppression: a bounced/complained address is refused before any SES call.
 * Latest-code-only: any prior live code for the address is invalidated first.
 */
export async function requestVerification(input: {
  institutionCode: string;
  email: string;
  firebaseUid?: string;
  institutionName?: string;
  fullName?: string;
}): Promise<RequestResult> {
  const { institutionCode, email, firebaseUid = '', institutionName = '', fullName = '' } = input;
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return { ok: false, code: 'USER_NOT_FOUND', message: 'No email address on file.' };
  }

  // If a firebase uid is supplied, make sure it actually owns this address so
  // a caller can't verify an arbitrary address against their own account.
  if (firebaseUid) {
    const owner = await findUserByUid(firebaseUid);
    if (owner && owner.email && owner.email.trim().toLowerCase() !== normalizedEmail) {
      return { ok: false, code: 'EMAIL_MISMATCH', message: 'Email does not match this account.' };
    }
  }

  if (await isSuppressed(institutionCode, normalizedEmail)) {
    return { ok: false, code: 'SUPPRESSED', message: 'This address has been marked undeliverable.' };
  }

  const windowStart = new Date(Date.now() - RESEND_WINDOW_MS);
  const recent = await countRecentSends(normalizedEmail, windowStart);
  if (recent >= RESEND_LIMIT_PER_HOUR) {
    return { ok: false, code: 'RATE_LIMITED', message: 'Too many verification emails. Please wait before requesting another.' };
  }

  const testCode = getTestOtpCode();
  const sender = testCode ? null : await resolveSender(institutionCode);
  if (!testCode && !sender) {
    return { ok: false, code: 'SES_NOT_CONFIGURED', message: 'Email delivery is not configured.' };
  }

  // Latest-code-only: kill any live code before minting the new one.
  await invalidateOtpsForEmail(normalizedEmail);

  const code = testCode || generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await insertToken({
    institutionCode,
    email: normalizedEmail,
    firebaseUid,
    tokenHash: otpHmac(normalizedEmail, code),
    expiresAt,
  });

  // Dev / no-SES path: skip the send entirely and surface the code so the
  // full request → enter → verify loop can be exercised locally without AWS.
  if (testCode || !isSesConfigured()) {
    return { ok: true, devCode: code };
  }
  if (!sender) {
    return { ok: false, code: 'SES_NOT_CONFIGURED', message: 'Email delivery is not configured.' };
  }

  const { subject, html, text } = renderOtpEmail({
    institutionName,
    fullName,
    code,
    expiresMinutes: Math.round(OTP_TTL_MS / 60000),
  });

  try {
    await sendEmail({
      to: normalizedEmail,
      subject,
      html,
      text,
      fromEmail: sender.fromEmail,
      fromName: sender.fromName,
      replyTo: sender.replyTo,
      configurationSet: sender.configurationSet,
    });
  } catch (err: any) {
    if (err instanceof EmailSendError && err.kind === 'permanent') {
      // A permanent send failure (bad address etc.) suppresses the destination
      // so we stop retrying and stop paying for it.
      await addSuppression({
        institutionCode,
        email: normalizedEmail,
        reason: 'bounce',
        detail: err.message,
      });
    }
    // Transient failures leave the code valid — the user can resend.
    return { ok: false, code: 'SES_NOT_CONFIGURED', message: 'Could not send the verification email. Please try again shortly.' };
  }

  return { ok: true };
}

/**
 * Verify a 6-digit OTP for an address.
 *
 * The lookup is by address (latest live code), and the comparison is a
 * constant-time HMAC check — a wrong guess increments the attempt counter and
 * the code self-destructs at the cap. Success consumes the code (guarded
 * UPDATE) so it cannot be replayed, then marks the user verified.
 */
export async function verifyOtp(email: string, code: string, firebaseUid = ''): Promise<VerifyResult> {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const submitted = (code || '').trim();

  if (!normalizedEmail) {
    return { ok: false, code: 'OTP_INVALID', message: 'No email address on file.' };
  }
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(submitted)) {
    return { ok: false, code: 'OTP_INVALID', message: `Enter the ${OTP_LENGTH}-digit code from your email.` };
  }

  const testCode = getTestOtpCode();
  if (testCode && constantTimeEquals(submitted, testCode)) {
    if (!firebaseUid) {
      return { ok: false, code: 'OTP_INVALID', message: 'No signed-in account for this code.' };
    }
    const owner = await findUserByUid(firebaseUid);
    if (owner?.email && owner.email.trim().toLowerCase() !== normalizedEmail) {
      return { ok: false, code: 'OTP_INVALID', message: 'Email does not match this account.' };
    }
    await markUserEmailVerified(firebaseUid);
    return { ok: true, email: normalizedEmail, institutionCode: owner?.institutionCode || '' };
  }

  const record = await findActiveOtp(normalizedEmail);
  if (!record) {
    return { ok: false, code: 'OTP_EXPIRED', message: 'This code has expired or was already used. Request a new one.' };
  }

  const expected = otpHmac(normalizedEmail, submitted);
  if (!constantTimeEquals(expected, record.tokenHash)) {
    const attempts = await failOtpAttempt(record.id, MAX_OTP_ATTEMPTS);
    if (attempts >= MAX_OTP_ATTEMPTS) {
      return {
        ok: false,
        code: 'OTP_LOCKED',
        message: 'Too many incorrect attempts. This code is no longer valid — request a new one.',
      };
    }
    return {
      ok: false,
      code: 'OTP_INVALID',
      message: `Incorrect code. ${MAX_OTP_ATTEMPTS - attempts} attempt${MAX_OTP_ATTEMPTS - attempts === 1 ? '' : 's'} remaining.`,
      attemptsLeft: MAX_OTP_ATTEMPTS - attempts,
    };
  }

  // Guarded consume — two concurrent submits with the right code: one wins.
  const consumed = await consumeToken(record.tokenHash);
  if (!consumed) {
    return { ok: false, code: 'OTP_INVALID', message: 'This code was already used. Request a new one.' };
  }

  const uid = record.firebaseUid || firebaseUid || (await findUserByEmail(record.institutionCode, record.email))?.firebaseUid || '';
  if (uid) {
    await markUserEmailVerified(uid);
  }

  return { ok: true, email: record.email, institutionCode: record.institutionCode };
}

/** Report the verification state for an account (used by the client gate). */
export async function getVerificationStatus(firebaseUid: string): Promise<{ verified: boolean; email: string }> {
  const user = await findUserByUid(firebaseUid);
  if (!user) return { verified: false, email: '' };
  const row = await findUserByEmail(user.institutionCode, user.email);
  return { verified: row?.emailVerified ?? false, email: user.email };
}

export function renderParentInviteEmail(opts: {
  institutionName: string;
  fullName: string;
  tempPassword: string;
  childNames: string[];
}): { subject: string; html: string; text: string } {
  const safeName = escapeHtml(opts.fullName || 'there');
  const safeInst = escapeHtml(opts.institutionName || 'Your institution');
  const safePassword = escapeHtml(opts.tempPassword);
  const childList = opts.childNames.length
    ? opts.childNames.map((n) => `<li style="margin:4px 0;color:#3F3F46;">${escapeHtml(n)}</li>`).join('')
    : '';

  const subject = `Your ${opts.institutionName || 'School ERP'} parent account`;
  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#FFFDF7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFDF7;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E8E5DC;border-radius:12px;overflow:hidden;">
          <tr><td style="background:#171717;padding:24px 28px;">
            <div style="color:#F4C430;font-size:18px;font-weight:700;">${safeInst}</div>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="margin:0 0 12px;font-size:20px;color:#171717;">Your parent account is ready</h1>
            <p style="margin:0 0 16px;font-size:15px;color:#3F3F46;line-height:1.5;">
              Hi ${safeName}, an administrator has created your parent account.${
                opts.childNames.length ? ' You are linked to the following student(s):' : ''
              }
            </p>
            ${childList ? `<ul style="margin:0 0 16px;padding-left:20px;">${childList}</ul>` : ''}
            <p style="margin:0 0 8px;font-size:15px;color:#3F3F46;line-height:1.5;">Sign in with your email and this temporary password:</p>
            <div style="margin:0 0 20px;padding:16px;background:#FFF4C7;border:1px dashed #F4C430;border-radius:10px;text-align:center;">
              <span style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:22px;font-weight:700;letter-spacing:1px;color:#171717;">${safePassword}</span>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#71717A;">You will be asked to set your own password after the first sign-in.</p>
          </td></tr>
          <tr><td style="border-top:1px solid #E8E5DC;padding:16px 28px;">
            <p style="margin:0;font-size:12px;color:#A1A1AA;">If you were not expecting this account, contact ${safeInst} immediately.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `${opts.institutionName || 'School ERP'} — your parent account\n\nHi ${opts.fullName || 'there'},\n\nYour temporary password is: ${opts.tempPassword}\n\nSign in with your email and this password, then set your own at first login.${
    opts.childNames.length ? `\n\nLinked students: ${opts.childNames.join(', ')}` : ''
  }`;

  return { subject, html, text };
}

export interface ParentInviteResult {
  sent: boolean;
  reason?: 'SES_NOT_CONFIGURED' | 'SUPPRESSED' | 'SEND_FAILED';
}

export interface LoginCredentialsInviteResult {
  sent: boolean;
  reason?: 'SES_NOT_CONFIGURED' | 'SUPPRESSED' | 'SEND_FAILED';
}

/**
 * Email a freshly-provisioned user (student/teacher/staff) their temp password.
 * Never throws — the caller falls back to one-time password reveal / admin reset.
 */
export async function sendLoginCredentialsInvite(input: {
  institutionCode: string;
  institutionName?: string;
  email: string;
  fullName: string;
  role?: string;
  tempPassword: string;
}): Promise<LoginCredentialsInviteResult> {
  const emailAddr = (input.email || '').trim().toLowerCase();
  if (!emailAddr || !input.tempPassword) return { sent: false, reason: 'SEND_FAILED' };
  if (!isSesConfigured()) return { sent: false, reason: 'SES_NOT_CONFIGURED' };

  const sender = await resolveSender(input.institutionCode);
  if (!sender) return { sent: false, reason: 'SES_NOT_CONFIGURED' };
  if (await isSuppressed(input.institutionCode, emailAddr)) return { sent: false, reason: 'SUPPRESSED' };

  const safeName = escapeHtml(input.fullName || 'there');
  const safeInst = escapeHtml(input.institutionName || input.institutionCode || 'Your institution');
  const safePassword = escapeHtml(input.tempPassword);
  const roleLabel = escapeHtml(input.role || 'user');

  const subject = `Your ${input.institutionName || 'School ERP'} account credentials`;
  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#FFFDF7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFDF7;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E8E5DC;border-radius:12px;overflow:hidden;">
          <tr><td style="background:#171717;padding:24px 28px;">
            <div style="color:#F4C430;font-size:18px;font-weight:700;">${safeInst}</div>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="margin:0 0 12px;font-size:20px;color:#171717;">Your account is ready</h1>
            <p style="margin:0 0 16px;font-size:15px;color:#3F3F46;line-height:1.5;">
              Hi ${safeName}, an administrator has created your ${roleLabel} account.
            </p>
            <p style="margin:0 0 8px;font-size:15px;color:#3F3F46;line-height:1.5;">Sign in with your email and this temporary password:</p>
            <div style="margin:0 0 20px;padding:16px;background:#FFF4C7;border:1px dashed #F4C430;border-radius:10px;text-align:center;">
              <span style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:22px;font-weight:700;letter-spacing:1px;color:#171717;">${safePassword}</span>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#71717A;">You will be asked to set your own password after the first sign-in.</p>
          </td></tr>
          <tr><td style="border-top:1px solid #E8E5DC;padding:16px 28px;">
            <p style="margin:0;font-size:12px;color:#A1A1AA;">If you were not expecting this account, contact ${safeInst} immediately.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  const text = `${input.institutionName || 'School ERP'} — your account credentials\n\nHi ${input.fullName || 'there'},\n\nYour temporary password is: ${input.tempPassword}\n\nSign in with your email and this password, then set your own at first login.`;

  try {
    await sendEmail({
      to: emailAddr,
      subject,
      html,
      text,
      fromEmail: sender.fromEmail,
      fromName: sender.fromName,
      replyTo: sender.replyTo,
      configurationSet: sender.configurationSet,
    });
    return { sent: true };
  } catch (err: any) {
    if (err instanceof EmailSendError && err.kind === 'permanent') {
      await addSuppression({
        institutionCode: input.institutionCode,
        email: emailAddr,
        reason: 'bounce',
        detail: err.message,
      });
    }
    return { sent: false, reason: 'SEND_FAILED' };
  }
}

/**
 * Email a freshly-provisioned parent their temp password.
 * Never throws — the caller falls back to showing the password once / admin reset.
 */
export async function sendParentInvite(input: {
  institutionCode: string;
  institutionName?: string;
  email: string;
  fullName: string;
  tempPassword: string;
  childNames?: string[];
}): Promise<ParentInviteResult> {
  const emailAddr = (input.email || '').trim().toLowerCase();
  if (!emailAddr || !input.tempPassword) return { sent: false, reason: 'SEND_FAILED' };
  if (!isSesConfigured()) return { sent: false, reason: 'SES_NOT_CONFIGURED' };

  const sender = await resolveSender(input.institutionCode);
  if (!sender) return { sent: false, reason: 'SES_NOT_CONFIGURED' };
  if (await isSuppressed(input.institutionCode, emailAddr)) return { sent: false, reason: 'SUPPRESSED' };

  const { subject, html, text } = renderParentInviteEmail({
    institutionName: input.institutionName || '',
    fullName: input.fullName,
    tempPassword: input.tempPassword,
    childNames: input.childNames || [],
  });

  try {
    await sendEmail({
      to: emailAddr,
      subject,
      html,
      text,
      fromEmail: sender.fromEmail,
      fromName: sender.fromName,
      replyTo: sender.replyTo,
      configurationSet: sender.configurationSet,
    });
    return { sent: true };
  } catch (err: any) {
    if (err instanceof EmailSendError && err.kind === 'permanent') {
      await addSuppression({
        institutionCode: input.institutionCode,
        email: emailAddr,
        reason: 'bounce',
        detail: err.message,
      });
    }
    return { sent: false, reason: 'SEND_FAILED' };
  }
}

export const emailVerificationService = {
  requestVerification,
  verifyOtp,
  getVerificationStatus,
  renderOtpEmail,
};
