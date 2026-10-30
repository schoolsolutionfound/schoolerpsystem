import { describe, it, expect, vi, beforeEach } from 'vitest';

const { upsertUser, updateUser, revokeRefreshTokens } = vi.hoisted(() => ({
  upsertUser: vi.fn(),
  updateUser: vi.fn(),
  revokeRefreshTokens: vi.fn(),
}));

vi.mock('../../shared/config/firebase.js', () => ({
  isFirebaseAdminInitialized: false,
  admin: {
    auth: () => ({ updateUser, revokeRefreshTokens }),
  },
}));

vi.mock('../../shared/db/index.js', () => ({
  db: {},
  dbFindByUid: vi.fn(),
  dbUpsertUser: vi.fn(),
  dbFindUserById: vi.fn(),
  dbFindStudentByUsnInInstitution: vi.fn(),
}));

vi.mock('../../institutions/institution.service.js', () => ({
  institutionService: {},
}));

import { AuthService } from '../auth.service.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthService.changePassword', () => {
  it('fails closed when Firebase Admin is unavailable', async () => {
    const repo = { findByUid: vi.fn(), upsertUser };
    const service = new AuthService(repo);

    await expect(
      service.changePassword({ uid: 'uid-1', email: 'user@test.com', mustChangePassword: true } as any, 'NewPass@1234')
    ).rejects.toMatchObject({
      statusCode: 503,
      code: 'PASSWORD_CHANGE_UNAVAILABLE',
    });

    expect(updateUser).not.toHaveBeenCalled();
    expect(upsertUser).not.toHaveBeenCalled();
    expect(revokeRefreshTokens).not.toHaveBeenCalled();
  });
});
