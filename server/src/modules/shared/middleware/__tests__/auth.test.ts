import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyIdToken = vi.fn(async () => ({
  uid: 'uid-auth',
  email: 'auth@test.com',
  role: '',
}));

vi.mock('../../db/index.js', () => ({
  dbFindByUid: vi.fn(),
}));

vi.mock('../../config/firebase.js', () => ({
  admin: {
    auth: () => ({ verifyIdToken }),
  },
  isFirebaseAdminInitialized: true,
}));

vi.mock('../authCache.js', () => {
  const store = new Map<string, { role: string; institutionCode: string; mustChangePassword: boolean; expiresAt: number }>();
  return {
    getCachedAuth: (uid: string) => store.get(uid),
    setCachedAuth: (uid: string, role: string, institutionCode: string, mustChangePassword: boolean) => {
      store.set(uid, { role, institutionCode, mustChangePassword: Boolean(mustChangePassword), expiresAt: Date.now() + 300000 });
    },
    invalidateCachedAuth: (uid: string) => {
      store.delete(uid);
    },
    __clear: () => store.clear(),
  };
});

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

function reqWithToken() {
  return { headers: { authorization: 'Bearer valid-token' }, user: undefined } as any;
}

beforeEach(() => {
  vi.mocked(dbFindByUid).mockReset();
  verifyIdToken.mockReset();
  verifyIdToken.mockResolvedValue({ uid: 'uid-auth', email: 'auth@test.com', role: '' });
});

describe('authenticate', () => {
  it('returns 401 when Authorization header missing', async () => {
    const req = { headers: {} } as any;
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.payload?.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when token empty', async () => {
    const req = { headers: { authorization: 'Bearer ' } } as any;
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.statusCode).toBe(401);
  });

  it('returns 401 INVALID_TOKEN when Firebase verify fails', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('bad token'));
    const req = reqWithToken();
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.payload?.error?.code).toBe('INVALID_TOKEN');
  });

  it('returns 403 when DB user has no role', async () => {
    vi.mocked(dbFindByUid).mockResolvedValue(undefined as any);
    const req = reqWithToken();
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.statusCode).toBe(403);
    expect(reply.payload?.error?.code).toBe('NO_ROLE_ASSIGNED');
  });

  it('attaches role and institutionCode on success', async () => {
    vi.mocked(dbFindByUid).mockResolvedValue({
      id: 'u1',
      firebaseUid: 'uid-auth',
      email: 'auth@test.com',
      fullName: 'Test',
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
    const req = reqWithToken();
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.sent).toBe(false);
    expect(req.user?.role).toBe('admin');
    expect(req.user?.institutionCode).toBe('DPS');
  });
});
