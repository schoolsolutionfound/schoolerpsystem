import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../notification.repository.js', () => ({
  getPendingNotifications: vi.fn(),
  markSent: vi.fn(),
  markFailed: vi.fn(),
  incrementRetry: vi.fn(),
  getActiveTokensByUsers: vi.fn(),
  deactivateToken: vi.fn(),
}));

vi.mock('../expo.provider.js', () => ({
  sendExpoPushes: vi.fn(),
  buildPushMessages: vi.fn(),
  processTickets: vi.fn(),
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

vi.mock('../email.repository.js', () => ({
  getEmailConfig: vi.fn(),
  isSuppressed: vi.fn(),
  findUserByUid: vi.fn(),
  markUserEmailVerified: vi.fn(),
}));

import * as repo from '../notification.repository.js';
import * as expo from '../expo.provider.js';
import * as emailProvider from '../email.provider.js';
import * as emailRepo from '../email.repository.js';
import { processPendingNotifications } from '../notification.queue.js';
import { MAX_RETRY_COUNT } from '../notification.types.js';

const row = (id: string, channel: string, retryCount = 0) =>
  ({ id, channel, retryCount, recipientId: 'u1', title: 't', body: 'b', priority: 'normal' }) as any;

function mockPushFailure(ticketRetryCount: number) {
  vi.mocked(repo.getPendingNotifications).mockResolvedValue([row('n1', 'push', ticketRetryCount)]);
  vi.mocked(repo.getActiveTokensByUsers).mockResolvedValue(
    new Map([['u1', [{ token: 'ExponentPushToken[x]', isActive: true } as any]]]) as any
  );
  vi.mocked(expo.buildPushMessages).mockReturnValue([{ to: 'ExponentPushToken[x]' }] as any);
  vi.mocked(expo.sendExpoPushes).mockResolvedValue({ tickets: [{ status: 'error', message: 'boom' }], failed: 1 });
  vi.mocked(expo.processTickets).mockReturnValue({ sentIds: [], failedIds: ['n1'], deactivateTokens: [] });
}

describe('notification queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reachable-send default: pretend SES is configured and the tenant has a
    // sender identity, so tests that care about a specific branch override it.
    vi.mocked(emailProvider.isSesConfigured).mockReturnValue(true);
    vi.mocked(emailRepo.isSuppressed).mockResolvedValue(false);
    vi.mocked(emailRepo.findUserByUid).mockResolvedValue({ email: 'u1@example.com' } as any);
    vi.mocked(emailRepo.getEmailConfig).mockResolvedValue({
      fromEmail: 'noreply@school.test',
      fromName: 'School',
    } as any);
  });

  it('closes out in_app rows as sent', async () => {
    vi.mocked(repo.getPendingNotifications).mockResolvedValue([row('a1', 'in_app')]);

    await processPendingNotifications();

    expect(repo.markSent).toHaveBeenCalledWith(['a1']);
    expect(repo.markFailed).not.toHaveBeenCalled();
  });

  it('routes email to the SES channel and still hard-fails unconfigured sms', async () => {
    vi.mocked(repo.getPendingNotifications).mockResolvedValue([
      row('s1', 'sms'),
      row('e1', 'email'),
      row('i1', 'in_app'),
    ]);
    vi.mocked(emailProvider.sendEmail).mockResolvedValue({ messageId: 'mid-1' } as any);

    await processPendingNotifications();

    // sms has no provider — hard fail (unchanged contract).
    expect(repo.markFailed).toHaveBeenCalledWith(
      ['s1'],
      'sms delivery not configured — no provider connected'
    );
    // in_app still closes out as sent.
    expect(repo.markSent).toHaveBeenCalledWith(['i1']);
    // email is a real channel now: dispatched to SES and marked sent, not failed.
    expect(emailProvider.sendEmail).toHaveBeenCalledTimes(1);
    expect(emailProvider.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'u1@example.com', fromEmail: 'noreply@school.test' })
    );
    expect(repo.markSent).toHaveBeenCalledWith(['e1']);
  });

  it('marks an email row terminal when SES reports a permanent failure', async () => {
    vi.mocked(repo.getPendingNotifications).mockResolvedValue([row('e1', 'email')]);
    vi.mocked(emailProvider.sendEmail).mockRejectedValue(
      new emailProvider.EmailSendError('Invalid recipient', 'permanent', 'SES_INVALID_RECIPIENT')
    );

    await processPendingNotifications();

    expect(repo.markFailed).toHaveBeenCalledWith(['e1'], 'Invalid recipient');
    expect(repo.incrementRetry).not.toHaveBeenCalledWith('e1');
  });

  it('retries an email row on a transient SES failure instead of failing it', async () => {
    vi.mocked(repo.getPendingNotifications).mockResolvedValue([row('e1', 'email', 0)]);
    vi.mocked(emailProvider.sendEmail).mockRejectedValue(
      new emailProvider.EmailSendError('throttled', 'transient', 'SES_THROTTLED')
    );

    await processPendingNotifications();

    // Retry budget spent; not marked failed while budget remains.
    expect(repo.incrementRetry).toHaveBeenCalledWith('e1');
    expect(repo.markFailed).not.toHaveBeenCalled();
  });

  it('keeps failed push rows pending while retry budget remains', async () => {
    mockPushFailure(0);

    await processPendingNotifications();

    expect(repo.incrementRetry).toHaveBeenCalledWith('n1');
    expect(repo.markFailed).not.toHaveBeenCalled();
  });

  it('fails push rows terminally once the retry budget is exhausted', async () => {
    mockPushFailure(MAX_RETRY_COUNT - 1);

    await processPendingNotifications();

    expect(repo.markFailed).toHaveBeenCalledWith(['n1'], `Failed after ${MAX_RETRY_COUNT} attempts`);
    expect(repo.incrementRetry).not.toHaveBeenCalled();
  });

  it('marks successful push deliveries as sent', async () => {
    vi.mocked(repo.getPendingNotifications).mockResolvedValue([row('ok1', 'push')]);
    vi.mocked(repo.getActiveTokensByUsers).mockResolvedValue(
      new Map([['u1', [{ token: 'ExponentPushToken[x]', isActive: true } as any]]]) as any
    );
    vi.mocked(expo.buildPushMessages).mockReturnValue([{ to: 'ExponentPushToken[x]' }] as any);
    vi.mocked(expo.sendExpoPushes).mockResolvedValue({ tickets: [{ status: 'ok', id: 'ticket1' }], failed: 0 });
    vi.mocked(expo.processTickets).mockReturnValue({ sentIds: ['ok1'], failedIds: [], deactivateTokens: [] });

    await processPendingNotifications();

    expect(repo.markSent).toHaveBeenCalledWith(['ok1']);
    expect(repo.markFailed).not.toHaveBeenCalled();
    expect(repo.incrementRetry).not.toHaveBeenCalled();
  });
});
