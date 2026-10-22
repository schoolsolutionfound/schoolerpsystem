import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'crypto';

vi.mock('../email.repository.js', () => ({
  insertToken: vi.fn(),
  countRecentSends: vi.fn(),
  consumeToken: vi.fn(),
  findActiveOtp: vi.fn(),
  failOtpAttempt: vi.fn(),
  invalidateOtpsForEmail: vi.fn(),
  isSuppressed: vi.fn(),
  addSuppression: vi.fn(),
  getEmailConfig: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserByUid: vi.fn(),
  markUserEmailVerified: vi.fn(),
}));

vi.mock('../email.provider.js', () => ({
  sendEmail: vi.fn(),
  isSesConfigured: vi.fn(),
  EmailSendError: class EmailSendError extends Error {
    kind: string;
    code: string;
    constructor(message: string, kind: string, code = 'SES_ERROR') {
      super(message);
      this.kind = kind;
      this.code = code;
    }
  },
}));

import * as repo from '../email.repository.js';
import * as provider from '../email.provider.js';
import { requestVerification, verifyOtp } from '../email.service.js';
import { EmailSendError } from '../email.provider.js';

// Deterministic secret so HMAC assertions are stable across runs.
const PREV_SECRET = process.env.EMAIL_OTP_SECRET;
const SECRET = 'test-otp-secret';
// Mirror of the service's key derivation: HMAC-SHA256 over "<email>:<code>".
const otpHmac = (email: string, code: string) =>
  createHmac('sha256', SECRET).update(`${email}:${code}`, 'utf8').digest('hex');

function seedSender() {
  vi.mocked(repo.getEmailConfig).mockResolvedValue({
    fromEmail: 'noreply@school.test',
    fromName: 'School',
    replyTo: '',
    configurationSet: '',
  } as any);
}

/** Stub an active OTP row the given code would hash to. */
function seedActiveOtp(email: string, code: string, attempts = 0) {
  vi.mocked(repo.findActiveOtp).mockResolvedValue({
    id: 't1',
    tokenHash: otpHmac(email, code),
    attempts,
    institutionCode: 'TST001',
    firebaseUid: 'uid-1',
    email,
  } as any);
}

describe('email verification service (OTP)', () => {
  beforeEach(() => {
    process.env.EMAIL_OTP_SECRET = SECRET;
    vi.clearAllMocks();
    vi.mocked(repo.isSuppressed).mockResolvedValue(false);
    vi.mocked(repo.countRecentSends).mockResolvedValue(0);
    vi.mocked(repo.findUserByUid).mockResolvedValue({ email: 'u1@example.com', institutionCode: 'TST001' } as any);
    vi.mocked(repo.findUserByEmail).mockResolvedValue({ firebaseUid: 'uid-1', emailVerified: false } as any);
    vi.mocked(provider.isSesConfigured).mockReturnValue(true);
    vi.mocked(provider.sendEmail).mockResolvedValue({ messageId: 'mid-1' } as any);
    seedSender();
  });

  afterEach(() => {
    if (PREV_SECRET === undefined) delete process.env.EMAIL_OTP_SECRET;
    else process.env.EMAIL_OTP_SECRET = PREV_SECRET;
  });

  describe('requestVerification', () => {
    it('stores only an HMAC of the code, never the plaintext', async () => {
      const res = await requestVerification({ institutionCode: 'TST001', email: 'U1@Example.com', firebaseUid: 'uid-1' });

      expect(res.ok).toBe(true);
      expect(repo.insertToken).toHaveBeenCalledTimes(1);
      const arg = vi.mocked(repo.insertToken).mock.calls[0][0];
      // A 6-digit code has ~20 bits of entropy; a bare sha256 would be
      // brute-forceable from a DB dump. We require a keyed digest instead.
      expect(arg.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(arg.tokenHash).not.toContain('000000'); // sanity: not the code
      expect(arg.email).toBe('u1@example.com'); // normalized to lowercase
      // The raw code must never appear anywhere in the persisted row.
      expect(JSON.stringify(arg)).not.toMatch(/\b\d{6}\b/);
    });

    it('invalidates any prior live code so only the newest is valid', async () => {
      await requestVerification({ institutionCode: 'TST001', email: 'u1@example.com' });
      expect(repo.invalidateOtpsForEmail).toHaveBeenCalledWith('u1@example.com');
    });

    it('refuses a suppressed address before spending an SES call', async () => {
      vi.mocked(repo.isSuppressed).mockResolvedValue(true);
      const res = await requestVerification({ institutionCode: 'TST001', email: 'dead@example.com' });

      expect(res).toMatchObject({ ok: false, code: 'SUPPRESSED' });
      expect(provider.sendEmail).not.toHaveBeenCalled();
      expect(repo.insertToken).not.toHaveBeenCalled();
    });

    it('rate-limits past the hourly resend cap', async () => {
      vi.mocked(repo.countRecentSends).mockResolvedValue(3);
      const res = await requestVerification({ institutionCode: 'TST001', email: 'u1@example.com' });

      expect(res).toMatchObject({ ok: false, code: 'RATE_LIMITED' });
      expect(provider.sendEmail).not.toHaveBeenCalled();
    });

    it('rejects an email that does not belong to the calling account', async () => {
      vi.mocked(repo.findUserByUid).mockResolvedValue({ email: 'owner@example.com', institutionCode: 'TST001' } as any);
      const res = await requestVerification({
        institutionCode: 'TST001',
        email: 'someoneelse@example.com',
        firebaseUid: 'uid-1',
      });

      expect(res).toMatchObject({ ok: false, code: 'EMAIL_MISMATCH' });
      expect(provider.sendEmail).not.toHaveBeenCalled();
    });

    it('returns a devCode instead of sending when SES is unconfigured', async () => {
      vi.mocked(provider.isSesConfigured).mockReturnValue(false);
      const res = await requestVerification({ institutionCode: 'TST001', email: 'u1@example.com' });

      expect(res.ok).toBe(true);
      expect(provider.sendEmail).not.toHaveBeenCalled();
      expect((res as any).devCode).toMatch(/^\d{6}$/);
    });

    it('suppresses the address and fails when SES reports a permanent error', async () => {
      vi.mocked(provider.sendEmail).mockRejectedValue(new EmailSendError('Invalid recipient', 'permanent', 'SES_INVALID'));
      const res = await requestVerification({ institutionCode: 'TST001', email: 'bad@example.com' });

      expect(res.ok).toBe(false);
      expect(repo.addSuppression).toHaveBeenCalledWith(
        expect.objectContaining({ institutionCode: 'TST001', email: 'bad@example.com', reason: 'bounce' })
      );
    });

    it('does not suppress on a transient SES error', async () => {
      vi.mocked(provider.sendEmail).mockRejectedValue(new EmailSendError('throttled', 'transient', 'SES_THROTTLED'));
      const res = await requestVerification({ institutionCode: 'TST001', email: 'u1@example.com' });

      expect(res.ok).toBe(false);
      expect(repo.addSuppression).not.toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    it('accepts the correct code and marks the owning user verified', async () => {
      seedActiveOtp('u1@example.com', '482913');
      vi.mocked(repo.consumeToken).mockResolvedValue({
        id: 't1',
        institutionCode: 'TST001',
        email: 'u1@example.com',
        firebaseUid: 'uid-1',
      } as any);

      const res = await verifyOtp('u1@example.com', '482913');

      expect(res).toMatchObject({ ok: true, email: 'u1@example.com' });
      // Lookup used the keyed digest of "<email>:<code>", not the raw code.
      expect(repo.findActiveOtp).toHaveBeenCalledWith('u1@example.com');
      expect(repo.consumeToken).toHaveBeenCalledWith(otpHmac('u1@example.com', '482913'));
      expect(repo.markUserEmailVerified).toHaveBeenCalledWith('uid-1');
    });

    it('rejects a wrong code, counts the attempt, and reports attempts left', async () => {
      seedActiveOtp('u1@example.com', '482913', 0);
      vi.mocked(repo.failOtpAttempt).mockResolvedValue(1);

      const res = await verifyOtp('u1@example.com', '000000');

      expect(res).toMatchObject({ ok: false, code: 'OTP_INVALID', attemptsLeft: 4 });
      expect(repo.failOtpAttempt).toHaveBeenCalledWith('t1', 5);
      expect(repo.consumeToken).not.toHaveBeenCalled();
      expect(repo.markUserEmailVerified).not.toHaveBeenCalled();
    });

    it('locks the code at the attempt cap so it cannot be used again', async () => {
      seedActiveOtp('u1@example.com', '482913', 4);
      vi.mocked(repo.failOtpAttempt).mockResolvedValue(5);

      const res = await verifyOtp('u1@example.com', '000000');

      expect(res).toMatchObject({ ok: false, code: 'OTP_LOCKED' });
      expect(repo.consumeToken).not.toHaveBeenCalled();
      expect(repo.markUserEmailVerified).not.toHaveBeenCalled();
    });

    it('single-use: fails when the code was already consumed', async () => {
      seedActiveOtp('u1@example.com', '482913');
      vi.mocked(repo.consumeToken).mockResolvedValue(null); // guarded UPDATE lost the race

      const res = await verifyOtp('u1@example.com', '482913');

      expect(res).toMatchObject({ ok: false, code: 'OTP_INVALID' });
      expect(repo.markUserEmailVerified).not.toHaveBeenCalled();
    });

    it('rejects a malformed code without touching the repository', async () => {
      const res = await verifyOtp('u1@example.com', '12ab');

      expect(res).toMatchObject({ ok: false, code: 'OTP_INVALID' });
      expect(repo.findActiveOtp).not.toHaveBeenCalled();
      expect(repo.consumeToken).not.toHaveBeenCalled();
    });

    it('expires when no live code exists', async () => {
      vi.mocked(repo.findActiveOtp).mockResolvedValue(null);

      const res = await verifyOtp('u1@example.com', '482913');

      expect(res).toMatchObject({ ok: false, code: 'OTP_EXPIRED' });
      expect(repo.consumeToken).not.toHaveBeenCalled();
    });
  });
});
