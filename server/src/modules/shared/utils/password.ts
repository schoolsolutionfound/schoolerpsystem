import { randomInt } from 'crypto';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*?';

/**
 * Shared password policy — used by forced password change AND by the
 * institution default temp password setting. Keep in sync with Firebase's
 * own password requirements (min 6) — we are stricter on purpose.
 */
export function validatePasswordStrength(password: string): { ok: true } | { ok: false; message: string } {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters long` };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, message: 'Password must contain an uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, message: 'Password must contain a lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, message: 'Password must contain a digit' };
  }
  return { ok: true };
}

/**
 * Cryptographically random per-user temporary password that always satisfies
 * validatePasswordStrength (one char from each class + fill + shuffle).
 * Replaces the old shared constants (Pass@123 / TempPass123!).
 */
export function generateTempPassword(length = 14): string {
  const len = Math.max(length, PASSWORD_MIN_LENGTH + 2);
  const chars: string[] = [
    LOWER[randomInt(LOWER.length)],
    UPPER[randomInt(UPPER.length)],
    DIGITS[randomInt(DIGITS.length)],
    SYMBOLS[randomInt(SYMBOLS.length)],
  ];
  const all = LOWER + UPPER + DIGITS + SYMBOLS;
  while (chars.length < len) {
    chars.push(all[randomInt(all.length)]);
  }
  // Fisher–Yates shuffle with crypto-backed randomInt
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export type PasswordSource = 'provided' | 'institution_default' | 'generated';

export interface ResolvedPassword {
  password: string;
  source: PasswordSource;
  /** Only set when source === 'generated' — must be shown to the admin ONCE. */
  tempPassword?: string;
}

/**
 * Precedence: explicit row/admin password > institution default > random per-user.
 * Never falls back to a hardcoded constant.
 */
export function resolveProvisionPassword(
  explicit: string | undefined | null,
  institutionDefault: string | undefined | null
): ResolvedPassword {
  const provided = (explicit || '').trim();
  if (provided) {
    return { password: provided, source: 'provided' };
  }
  const instDefault = (institutionDefault || '').trim();
  if (instDefault) {
    return { password: instDefault, source: 'institution_default' };
  }
  const generated = generateTempPassword();
  return { password: generated, source: 'generated', tempPassword: generated };
}
