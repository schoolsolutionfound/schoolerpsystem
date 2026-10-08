import { describe, it, expect, vi, beforeEach } from 'vitest';

const updateUser = vi.fn();
const revokeRefreshTokens = vi.fn();

vi.mock('../../shared/db/index.js', () => ({
  db: {},
  withTransaction: vi.fn(),
  dbFindUserById: vi.fn(),
  dbFindUserByIdOrUid: vi.fn(),
  dbFindUsersByInstitution: vi.fn(),
  dbCountUsersByInstitution: vi.fn(),
  dbCountClassSectionsByInstitution: vi.fn(),
  dbCountSubjectsByInstitution: vi.fn(),
  dbCountAttendanceSessionsInstitution: vi.fn(),
  dbCountAttendanceSessionsByInstitution: vi.fn(),
  dbFindStudentByUsnInInstitution: vi.fn(),
  dbFindStudentClassSectionId: vi.fn(),
  dbUpdateUser: vi.fn(),
  dbDeleteUserById: vi.fn(),
  dbFindByEmail: vi.fn(),
  dbUpsertUser: vi.fn(),
}));

vi.mock('../../shared/config/firebase.js', () => ({
  admin: { auth: () => ({ updateUser, revokeRefreshTokens }) },
  isFirebaseAdminInitialized: true,
}));

vi.mock('../../institutions/institution.service.js', () => ({
  institutionService: {
    getInstitutions: vi.fn(async () => [
      { institutionCode: 'GIS001', institutionName: 'Test', institutionType: 'school', defaultTempPassword: '' },
      { institutionCode: 'DEF001', institutionName: 'Def', institutionType: 'school', defaultTempPassword: 'School@1234' },
    ]),
    getInstitutionByCode: vi.fn(),
  },
}));

vi.mock('../academics/academics.repository.js', () => ({
  academicsRepository: { listClassSections: vi.fn(async () => []) },
}));

import { adminService } from '../admin.service.js';
import { dbFindUserById, dbUpdateUser } from '../../shared/db/index.js';

const findUser = vi.mocked(dbFindUserById);
const updateUserDb = vi.mocked(dbUpdateUser);

function baseUser(overrides: Record<string, any> = {}) {
  return {
    id: 'u1',
    firebaseUid: 'fb-uid-1',
    email: 'user@test.com',
    fullName: 'Test User',
    role: 'teacher',
    institutionCode: 'GIS001',
    ...overrides,
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  updateUser.mockResolvedValue({});
  revokeRefreshTokens.mockResolvedValue({});
});

describe('adminService.resetUserPassword (H3)', () => {
  it('404s when the user does not exist', async () => {
    findUser.mockResolvedValue(undefined);

    await expect(adminService.resetUserPassword('missing', 'GIS001')).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('404s when the user belongs to a different institution (tenant check)', async () => {
    findUser.mockResolvedValue(baseUser({ institutionCode: 'OTHER' }));

    await expect(adminService.resetUserPassword('u1', 'GIS001')).rejects.toMatchObject({
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('400s when the user has no Firebase uid', async () => {
    findUser.mockResolvedValue(baseUser({ firebaseUid: '' }));

    await expect(adminService.resetUserPassword('u1', 'GIS001')).rejects.toMatchObject({
      statusCode: 400,
      code: 'NO_FIREBASE_UID',
    });
  });

  it('resets the password, revokes sessions, and re-arms the change gate with a generated temp', async () => {
    findUser.mockResolvedValue(baseUser());

    const result = await adminService.resetUserPassword('u1', 'GIS001');

    expect(updateUser).toHaveBeenCalledWith('fb-uid-1', { password: expect.any(String) });
    // Temp must satisfy the shared policy (this is what the admin sees ONCE).
    expect(result.tempPassword).toBeTruthy();
    expect(result.tempPassword).toMatch(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/);
    expect(revokeRefreshTokens).toHaveBeenCalledWith('fb-uid-1');
    expect(updateUserDb).toHaveBeenCalledWith('u1', { mustChangePassword: true });
    expect(result.mustChangePassword).toBe(true);
    expect(result.usingInstitutionDefaultPassword).toBeUndefined();
  });

  it('uses the institution default password when no explicit one is given', async () => {
    findUser.mockResolvedValue(baseUser({ institutionCode: 'DEF001' }));

    const result = await adminService.resetUserPassword('u1', 'DEF001');

    expect(updateUser).toHaveBeenCalledWith('fb-uid-1', { password: 'School@1234' });
    expect(result.tempPassword).toBeUndefined();
    expect(result.usingInstitutionDefaultPassword).toBe(true);
  });

  it('uses an explicit admin-provided password when supplied', async () => {
    findUser.mockResolvedValue(baseUser());

    const result = await adminService.resetUserPassword('u1', 'GIS001', 'AdminSet123!');

    expect(updateUser).toHaveBeenCalledWith('fb-uid-1', { password: 'AdminSet123!' });
    expect(result.tempPassword).toBeUndefined();
    expect(result.usingInstitutionDefaultPassword).toBeUndefined();
  });

  it('maps Firebase user-not-found to a 404 and does not touch the DB', async () => {
    findUser.mockResolvedValue(baseUser());
    updateUser.mockRejectedValue(Object.assign(new Error('no user'), { code: 'auth/user-not-found' }));

    await expect(adminService.resetUserPassword('u1', 'GIS001')).rejects.toMatchObject({
      statusCode: 404,
      code: 'FIREBASE_USER_NOT_FOUND',
    });
    expect(updateUserDb).not.toHaveBeenCalled();
  });

  it('still revokes sessions and re-arms the gate when explicit password used', async () => {
    findUser.mockResolvedValue(baseUser());

    await adminService.resetUserPassword('u1', 'GIS001', 'AdminSet123!');

    expect(revokeRefreshTokens).toHaveBeenCalledWith('fb-uid-1');
    expect(updateUserDb).toHaveBeenCalledWith('u1', { mustChangePassword: true });
  });
});
