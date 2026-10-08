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

import * as repo from '../notification.repository.js';
import * as expo from '../expo.provider.js';
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
  });

  it('closes out in_app rows as sent', async () => {
    vi.mocked(repo.getPendingNotifications).mockResolvedValue([row('a1', 'in_app')]);

    await processPendingNotifications();

    expect(repo.markSent).toHaveBeenCalledWith(['a1']);
    expect(repo.markFailed).not.toHaveBeenCalled();
  });

  it('fails sms/email rows instead of reporting a delivery that never happened', async () => {
    vi.mocked(repo.getPendingNotifications).mockResolvedValue([
      row('s1', 'sms'),
      row('e1', 'email'),
      row('i1', 'in_app'),
    ]);

    await processPendingNotifications();

    expect(repo.markSent).toHaveBeenCalledWith(['i1']);
    expect(repo.markFailed).toHaveBeenCalledWith(
      ['s1'],
      'sms delivery not configured — no provider connected'
    );
    expect(repo.markFailed).toHaveBeenCalledWith(
      ['e1'],
      'email delivery not configured — no provider connected'
    );
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
