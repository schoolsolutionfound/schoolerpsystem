import { describe, it, expect } from 'vitest';
import {
  generateTempPassword,
  validatePasswordStrength,
  resolveProvisionPassword,
  PASSWORD_MIN_LENGTH,
} from '../password.js';

describe('validatePasswordStrength', () => {
  it('accepts a compliant password', () => {
    expect(validatePasswordStrength('Abcdef12')).toEqual({ ok: true });
  });

  it('rejects too-short passwords', () => {
    const r = validatePasswordStrength('Ab1efgh');
    expect(r.ok).toBe(false);
  });

  it('rejects missing uppercase', () => {
    const r = validatePasswordStrength('abcdefg1');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/uppercase/i);
  });

  it('rejects missing lowercase', () => {
    const r = validatePasswordStrength('ABCDEFG1');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/lowercase/i);
  });

  it('rejects missing digit', () => {
    const r = validatePasswordStrength('Abcdefgh');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/digit/i);
  });

  it('rejects empty input', () => {
    expect(validatePasswordStrength('').ok).toBe(false);
    expect(validatePasswordStrength(undefined as any).ok).toBe(false);
  });
});

describe('generateTempPassword', () => {
  it('produces policy-compliant passwords by default', () => {
    for (let i = 0; i < 50; i++) {
      const pw = generateTempPassword();
      expect(pw.length).toBeGreaterThanOrEqual(PASSWORD_MIN_LENGTH);
      expect(validatePasswordStrength(pw)).toEqual({ ok: true });
    }
  });

  it('honours a custom length but never below the policy minimum', () => {
    expect(generateTempPassword(20).length).toBe(20);
    expect(generateTempPassword(4).length).toBeGreaterThanOrEqual(PASSWORD_MIN_LENGTH);
  });

  it('generates unique values across calls', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) seen.add(generateTempPassword());
    expect(seen.size).toBe(500);
  });
});

describe('resolveProvisionPassword', () => {
  it('prefers the explicitly provided password', () => {
    const r = resolveProvisionPassword('Provided123', 'Institution1');
    expect(r.source).toBe('provided');
    expect(r.password).toBe('Provided123');
    expect(r.tempPassword).toBeUndefined();
  });

  it('falls back to the institution default when no row password', () => {
    const r = resolveProvisionPassword('', 'Institution1');
    expect(r.source).toBe('institution_default');
    expect(r.password).toBe('Institution1');
    expect(r.tempPassword).toBeUndefined();
  });

  it('treats whitespace-only values as empty', () => {
    const r = resolveProvisionPassword('   ', 'Institution1');
    expect(r.source).toBe('institution_default');
    expect(r.password).toBe('Institution1');
  });

  it('generates a per-user random password when nothing is set', () => {
    const r = resolveProvisionPassword(undefined, '');
    expect(r.source).toBe('generated');
    expect(r.tempPassword).toBe(r.password);
    expect(validatePasswordStrength(r.password)).toEqual({ ok: true });
  });

  it('generates distinct passwords for consecutive fallback calls', () => {
    const a = resolveProvisionPassword(undefined, null);
    const b = resolveProvisionPassword(undefined, null);
    expect(a.password).not.toBe(b.password);
  });
});
