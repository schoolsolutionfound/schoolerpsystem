import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../email.repository.js', () => ({
  addSuppression: vi.fn(),
  findInstitutionCodeByEmail: vi.fn(),
}));

import * as repo from '../email.repository.js';
import {
  isValidSnsSecret,
  extractRecipients,
  processSnsEnvelope,
} from '../email.sns.js';

describe('isValidSnsSecret', () => {
  it('refuses everything when the secret is unset', () => {
    expect(isValidSnsSecret('anything', '')).toBe(false);
    expect(isValidSnsSecret('', '')).toBe(false);
  });

  it('accepts an exact match and rejects otherwise', () => {
    expect(isValidSnsSecret('correct-horse', 'correct-horse')).toBe(true);
    expect(isValidSnsSecret('wrong', 'correct-horse')).toBe(false);
    expect(isValidSnsSecret('correct-horsee', 'correct-horse')).toBe(false);
  });
});

describe('extractRecipients', () => {
  it('pulls and normalizes bounced recipients', () => {
    const out = extractRecipients({
      notificationType: 'bounce',
      bounce: {
        bouncedRecipients: [
          { emailAddress: 'A@Example.com' },
          { emailAddress: '  b@example.com  ' },
          { emailAddress: '' }, // dropped
        ],
      },
    });
    expect(out).toEqual({ kind: 'bounce', emails: ['a@example.com', 'b@example.com'] });
  });

  it('pulls complained recipients', () => {
    const out = extractRecipients({
      notificationType: 'complaint',
      complaint: { complainedRecipients: [{ emailAddress: 'angry@example.com' }] },
    });
    expect(out).toEqual({ kind: 'complaint', emails: ['angry@example.com'] });
  });

  it('returns null for delivery receipts and empty bounces', () => {
    expect(extractRecipients({ notificationType: 'delivery' })).toBeNull();
    expect(
      extractRecipients({ notificationType: 'bounce', bounce: { bouncedRecipients: [] } })
    ).toBeNull();
  });
});

describe('processSnsEnvelope', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    // SubscriptionConfirmation triggers a SubscribeURL GET — never do it here.
    global.fetch = vi.fn(async () => ({ ok: true })) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('suppresses each bounced recipient under its resolved tenant', async () => {
    vi.mocked(repo.findInstitutionCodeByEmail).mockResolvedValue('TST001');

    const res = await processSnsEnvelope({
      Type: 'Notification',
      MessageId: 'sns-1',
      Message: JSON.stringify({
        notificationType: 'bounce',
        bounce: { bouncedRecipients: [{ emailAddress: 'gone@example.com' }] },
      }),
    });

    expect(res).toMatchObject({ ok: true, suppressed: 1 });
    expect(repo.addSuppression).toHaveBeenCalledWith(
      expect.objectContaining({
        institutionCode: 'TST001',
        email: 'gone@example.com',
        reason: 'bounce',
        sesEventId: 'sns-1',
      })
    );
  });

  it('still suppresses when the tenant cannot be resolved', async () => {
    vi.mocked(repo.findInstitutionCodeByEmail).mockResolvedValue(null);

    const res = await processSnsEnvelope({
      Type: 'Notification',
      Message: JSON.stringify({
        notificationType: 'complaint',
        complaint: { complainedRecipients: [{ emailAddress: 'spam@example.com' }] },
      }),
    });

    expect(res).toMatchObject({ ok: true, suppressed: 1 });
    expect(repo.addSuppression).toHaveBeenCalledWith(
      expect.objectContaining({ institutionCode: '', reason: 'complaint' })
    );
  });

  it('ignores non-bounce/complaint notifications without suppressing', async () => {
    const res = await processSnsEnvelope({
      Type: 'Notification',
      Message: JSON.stringify({ notificationType: 'delivery' }),
    });

    expect(res).toMatchObject({ ok: true, ignored: 1, suppressed: 0 });
    expect(repo.addSuppression).not.toHaveBeenCalled();
  });

  it('rejects a malformed SES message payload', async () => {
    const res = await processSnsEnvelope({ Type: 'Notification', Message: 'not-json' });

    expect(res).toMatchObject({ ok: false });
    expect(repo.addSuppression).not.toHaveBeenCalled();
  });

  it('confirms a subscription via its SubscribeURL and suppresses nothing', async () => {
    const res = await processSnsEnvelope({
      Type: 'SubscriptionConfirmation',
      SubscribeURL: 'https://sns.us-east-1.amazonaws.com/Confirm?token=abc',
    });

    expect(res).toMatchObject({ ok: true, suppressed: 0 });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://sns.us-east-1.amazonaws.com/Confirm?token=abc',
      expect.objectContaining({ method: 'GET' })
    );
    expect(repo.addSuppression).not.toHaveBeenCalled();
  });

  it('never GETs a SubscribeURL hosted outside amazonaws.com', async () => {
    await processSnsEnvelope({
      Type: 'SubscriptionConfirmation',
      SubscribeURL: 'https://evil.example.com/steal',
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
