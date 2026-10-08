import { describe, it, expect, vi, beforeEach } from 'vitest';

const { cache } = vi.hoisted(() => ({
  cache: new Map<string, { role: string; institutionCode: string; mustChangePassword: boolean; expiresAt: number }>(),
}));

vi.mock('../../db/index.js', () => ({
  dbFindByUid: vi.fn(),
}));

vi.mock('../../config/firebase.js', () => ({
  admin: {
    auth: () => ({
      verifyIdToken: vi.fn(async () => ({ uid: 'uid-cache', email: 'c@t.com', role: '' })),
    }),
  },
  isFirebaseAdminInitialized: true,
}));

vi.mock('../authCache.js', () => ({
  getCachedAuth: (uid: string) => {
    const e = cache.get(uid);
    if (!e) return undefined;
    if (Date.now() > e.expiresAt) {
      cache.delete(uid);
      return undefined;
    }
    return e;
  },
  setCachedAuth: (uid: string, role: string, institutionCode: string, mustChangePassword: boolean) => {
    cache.set(uid, { role, institutionCode, mustChangePassword: Boolean(mustChangePassword), expiresAt: Date.now() + 300000 });
  },
  invalidateCachedAuth: (uid: string) => {
    cache.delete(uid);
  },
}));

import { authenticate } from '../auth.js';
import { dbFindByUid } from '../../db/index.js';

function mockReply() {
  const reply: any = {
    statusCode: 200,
    sent: false,
    status(code: number) {
      reply.statusCode = code;
      return reply;
    },
    send(payload: any) {
      reply.sent = true;
      reply.payload = payload;
      return reply;
    },
  };
  return reply;
}

function req() {
  return { headers: { authorization: 'Bearer t' }, user: undefined } as any;
}

beforeEach(() => {
  cache.clear();
  vi.mocked(dbFindByUid).mockReset();
});

describe('authCache TTL', () => {
  it('serves from cache on second authenticate (no DB hit)', async () => {
    vi.mocked(dbFindByUid).mockResolvedValue({
      id: 'u1',
      firebaseUid: 'uid-cache',
      email: 'c@t.com',
      fullName: 'C',
      role: 'admin',
      institutionCode: 'DPS',
      institutionName: 'DPS',
      institutionType: 'school',
      rollNoOrUSN: '',
      mustChangePassword: false,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const r1 = req();
    await authenticate(r1, mockReply());
    expect(dbFindByUid).toHaveBeenCalledTimes(1);
    expect(r1.user?.institutionCode).toBe('DPS');

    const r2 = req();
    await authenticate(r2, mockReply());
    expect(dbFindByUid).toHaveBeenCalledTimes(1);
    expect(r2.user?.role).toBe('admin');
    expect(r2.user?.institutionCode).toBe('DPS');
  });

  it('expires after TTL and re-queries DB', async () => {
    vi.mocked(dbFindByUid).mockResolvedValue({
      id: 'u1',
      firebaseUid: 'uid-cache',
      email: 'c@t.com',
      fullName: 'C',
      role: 'admin',
      institutionCode: 'DPS',
      institutionName: 'DPS',
      institutionType: 'school',
      rollNoOrUSN: '',
      mustChangePassword: false,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await authenticate(req(), mockReply());
    expect(dbFindByUid).toHaveBeenCalledTimes(1);

    const entry = cache.get('uid-cache');
    expect(entry).toBeDefined();
    entry!.expiresAt = Date.now() - 1;

    await authenticate(req(), mockReply());
    expect(dbFindByUid).toHaveBeenCalledTimes(2);
  });
});
