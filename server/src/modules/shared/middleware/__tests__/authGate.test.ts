import { describe, it, expect, vi, beforeEach } from 'vitest';

let uidCounter = 0;

vi.mock('../../db/index.js', () => ({
  dbFindByUid: vi.fn(),
}));

vi.mock('../../config/firebase.js', () => ({
  admin: {
    auth: () => ({
      verifyIdToken: vi.fn(async () => ({
        uid: 'uid-auth',
        email: 'auth@test.com',
        role: '',
      })),
    }),
  },
  isFirebaseAdminInitialized: true,
}));

vi.mock('../authCache.js', () => ({
  getCachedAuth: vi.fn(() => undefined),
  setCachedAuth: vi.fn(),
  invalidateCachedAuth: vi.fn(),
}));

import { requireAdmin, requireRole, authenticate } from '../auth.js';
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
  uidCounter += 1;
  return {
    headers: { authorization: `Bearer valid-token-${uidCounter}` },
    user: undefined,
  } as any;
}

describe('authenticate with DB failure → 503', () => {
  it('returns 503 SERVICE_UNAVAILABLE when dbFindByUid throws', async () => {
    vi.mocked(dbFindByUid).mockRejectedValueOnce(new Error('connection refused'));
    const req = reqWithToken();
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.statusCode).toBe(503);
    expect(reply.payload?.error?.code).toBe('SERVICE_UNAVAILABLE');
    expect(req.user).toBeUndefined();
  });

  it('returns 403 when DB user has no role', async () => {
    vi.mocked(dbFindByUid).mockResolvedValueOnce(undefined as any);
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
      email: 'user@test.com',
      fullName: 'Test',
      role: 'accountant',
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
    expect(req.user?.role).toBe('accountant');
    expect(req.user?.institutionCode).toBe('DPS');
  });
});

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.mocked(dbFindByUid).mockReset();
    vi.mocked(dbFindByUid).mockResolvedValue({
      id: 'u1',
      firebaseUid: 'uid-auth',
      email: 'a@b.c',
      fullName: 'A',
      role: 'accountant',
      institutionCode: 'X',
      institutionName: 'X',
      institutionType: 'school',
      rollNoOrUSN: '',
      mustChangePassword: false,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  });

  it('rejects accountant with 403', async () => {
    const req = reqWithToken();
    const reply = mockReply();
    await requireAdmin(req, reply);
    expect(reply.statusCode).toBe(403);
    expect(reply.payload?.error?.code).toBe('FORBIDDEN');
  });

  it('allows admin (institution admin normalized)', async () => {
    vi.mocked(dbFindByUid).mockResolvedValue({
      id: 'u1',
      firebaseUid: 'uid-auth',
      email: 'a@b.c',
      fullName: 'A',
      role: 'institution admin',
      institutionCode: 'X',
      institutionName: 'X',
      institutionType: 'school',
      rollNoOrUSN: '',
      mustChangePassword: false,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    const req = reqWithToken();
    const reply = mockReply();
    await requireAdmin(req, reply);
    expect(reply.statusCode).toBe(200);
    expect(reply.sent).toBe(false);
  });
});

describe('requireRole', () => {
  beforeEach(() => {
    vi.mocked(dbFindByUid).mockReset();
    vi.mocked(dbFindByUid).mockResolvedValue({
      id: 'u1',
      firebaseUid: 'uid-auth',
      email: 'a@b.c',
      fullName: 'A',
      role: 'accountant',
      institutionCode: 'X',
      institutionName: 'X',
      institutionType: 'school',
      rollNoOrUSN: '',
      mustChangePassword: false,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  });

  it('allows listed role', async () => {
    const mw = requireRole('admin', 'accountant');
    const req = reqWithToken();
    const reply = mockReply();
    await mw(req, reply);
    expect(reply.sent).toBe(false);
    expect(reply.statusCode).toBe(200);
  });

  it('rejects unlisted role', async () => {
    vi.mocked(dbFindByUid).mockResolvedValue({
      id: 'u1',
      firebaseUid: 'uid-auth',
      email: 'a@b.c',
      fullName: 'A',
      role: 'student',
      institutionCode: 'X',
      institutionName: 'X',
      institutionType: 'school',
      rollNoOrUSN: '',
      mustChangePassword: false,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    const mw = requireRole('admin', 'accountant');
    const req = reqWithToken();
    const reply = mockReply();
    await mw(req, reply);
    expect(reply.statusCode).toBe(403);
    expect(reply.payload?.error?.code).toBe('FORBIDDEN');
  });
});

describe('mustChangePassword gate', () => {
  beforeEach(() => {
    vi.mocked(dbFindByUid).mockReset();
    vi.mocked(dbFindByUid).mockResolvedValue({
      id: 'u1',
      firebaseUid: 'uid-auth',
      email: 'new@user.com',
      fullName: 'New',
      role: 'student',
      institutionCode: 'X',
      institutionName: 'X',
      institutionType: 'school',
      rollNoOrUSN: '',
      mustChangePassword: true,
      profileCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  });

  function reqFor(url: string) {
    return {
      headers: { authorization: 'Bearer gate-token' },
      url,
      routeOptions: { url },
      user: undefined,
    } as any;
  }

  it('blocks non-exempt routes with 403 PASSWORD_CHANGE_REQUIRED', async () => {
    const req = reqFor('/api/v1/admin/students');
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.statusCode).toBe(403);
    expect(reply.payload?.error?.code).toBe('PASSWORD_CHANGE_REQUIRED');
    expect(req.user).toBeUndefined();
  });

  it('allows the exempt change-password route', async () => {
    const req = reqFor('/api/v1/auth/change-password');
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.sent).toBe(false);
    expect(req.user?.role).toBe('student');
  });

  it('allows the exempt login-sync route', async () => {
    const req = reqFor('/api/v1/auth/login-sync');
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.sent).toBe(false);
    expect(req.user?.role).toBe('student');
  });

  it('allows the exempt /users/me bootstrap route', async () => {
    const req = reqFor('/api/v1/users/me');
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.sent).toBe(false);
    expect(req.user?.role).toBe('student');
  });

  it('allows exempt routes even when the URL has a query string', async () => {
    const req = reqFor('/api/v1/users/me?foo=bar');
    req.routeOptions = { url: '/api/v1/users/me' };
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.sent).toBe(false);
    expect(req.user?.role).toBe('student');
  });

  it('does not block when mustChangePassword is false', async () => {
    vi.mocked(dbFindByUid).mockResolvedValueOnce({
      id: 'u1',
      firebaseUid: 'uid-auth',
      email: 'old@user.com',
      fullName: 'Old',
      role: 'student',
      institutionCode: 'X',
      institutionName: 'X',
      institutionType: 'school',
      rollNoOrUSN: '',
      mustChangePassword: false,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    const req = reqFor('/api/v1/admin/students');
    const reply = mockReply();
    await authenticate(req, reply);
    expect(reply.sent).toBe(false);
    expect(req.user?.role).toBe('student');
  });
});
