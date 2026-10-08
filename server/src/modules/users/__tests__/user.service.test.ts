import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../shared/db/index.js', () => ({
  dbFindStudentByUsnInInstitution: vi.fn(),
}));

import { UserService } from '../user.service.js';
import { dbFindStudentByUsnInInstitution } from '../../shared/db/index.js';

const findStudent = vi.mocked(dbFindStudentByUsnInInstitution);

function makeUser(overrides: Record<string, any> = {}) {
  return {
    id: 'u1',
    firebaseUid: 'uid-1',
    email: 'parent@test.com',
    fullName: 'Test Parent',
    role: 'parent',
    institutionCode: 'GIS001',
    scope: '',
    ...overrides,
  } as any;
}

function makeRepo(user: ReturnType<typeof makeUser> | undefined) {
  const upsertUser = vi.fn(async (u: any) => ({ ...user, ...u }));
  return {
    repo: { findByUid: vi.fn(async () => user), upsertUser } as any,
    upsertUser,
  };
}

function makeAuth(overrides: Record<string, any> = {}) {
  return {
    uid: 'uid-1',
    email: 'parent@test.com',
    role: 'parent',
    institutionCode: 'GIS001',
    ...overrides,
  } as any;
}

beforeEach(() => {
  findStudent.mockReset();
});

describe('completeProfile — parent link validation (H2)', () => {
  it('rejects linkedStudentUSN from a non-parent role', async () => {
    const { repo } = makeRepo(makeUser({ role: 'teacher' }));
    const svc = new UserService(repo);

    await expect(
      svc.completeProfile(makeAuth({ role: 'teacher' }), { linkedStudentUSN: 'GIS2026001' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN_FIELD' });
  });

  it('rejects relation from a non-parent role', async () => {
    const { repo } = makeRepo(makeUser({ role: 'accountant' }));
    const svc = new UserService(repo);

    await expect(
      svc.completeProfile(makeAuth({ role: 'accountant' }), { relation: 'Father' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN_FIELD' });
  });

  it('rejects a USN that does not exist in the institution', async () => {
    findStudent.mockResolvedValue(undefined);
    const { repo } = makeRepo(makeUser());
    const svc = new UserService(repo);

    await expect(
      svc.completeProfile(makeAuth(), { linkedStudentUSN: 'NOPE123' })
    ).rejects.toMatchObject({ statusCode: 400, code: 'STUDENT_NOT_FOUND' });
    expect(findStudent).toHaveBeenCalledWith('GIS001', 'NOPE123');
  });

  it('rejects a relation outside Father/Mother/Guardian', async () => {
    const { repo } = makeRepo(makeUser());
    const svc = new UserService(repo);

    await expect(
      svc.completeProfile(makeAuth(), { relation: 'Cousin' })
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_RELATION' });
  });

  it('links a parent to an existing student in the same institution', async () => {
    findStudent.mockResolvedValue({ id: 's1', role: 'student', rollNoOrUSN: 'GIS2026001' } as any);
    const { repo, upsertUser } = makeRepo(makeUser());
    const svc = new UserService(repo);

    const result = await svc.completeProfile(makeAuth(), {
      linkedStudentUSN: 'GIS2026001',
      relation: 'mother',
    });

    expect(result.message).toBe('Profile completed successfully');
    const scope = JSON.parse(upsertUser.mock.calls[0][0].scope);
    expect(scope.linkedStudentUSN).toBe('GIS2026001');
    expect(scope.relation).toBe('Mother');
  });

  it('blocks re-linking to a different student once linked', async () => {
    findStudent.mockResolvedValue({ id: 's2', role: 'student', rollNoOrUSN: 'GIS2026002' } as any);
    const { repo, upsertUser } = makeRepo(
      makeUser({ scope: JSON.stringify({ linkedStudentUSN: 'GIS2026001' }) })
    );
    const svc = new UserService(repo);

    await expect(
      svc.completeProfile(makeAuth(), { linkedStudentUSN: 'GIS2026002' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'LINK_CHANGE_FORBIDDEN' });
    expect(upsertUser).not.toHaveBeenCalled();
  });

  it('allows idempotent re-submit of the same USN (case-insensitive), preserving original casing', async () => {
    findStudent.mockResolvedValue({ id: 's1', role: 'student', rollNoOrUSN: 'GIS2026001' } as any);
    const { repo, upsertUser } = makeRepo(
      makeUser({ scope: JSON.stringify({ linkedStudentUSN: 'GIS2026001' }) })
    );
    const svc = new UserService(repo);

    await svc.completeProfile(makeAuth(), { linkedStudentUSN: 'gis2026001' });

    const scope = JSON.parse(upsertUser.mock.calls[0][0].scope);
    expect(scope.linkedStudentUSN).toBe('GIS2026001');
  });

  it('still enforces parentPhone for students', async () => {
    const { repo } = makeRepo(makeUser({ role: 'student' }));
    const svc = new UserService(repo);

    await expect(
      svc.completeProfile(makeAuth({ role: 'student' }), {})
    ).rejects.toMatchObject({ statusCode: 400, code: 'MISSING_FIELD' });
  });

  it('rejects parent link when user has no institution', async () => {
    const { repo } = makeRepo(makeUser({ institutionCode: '' }));
    const svc = new UserService(repo);

    await expect(
      svc.completeProfile(makeAuth({ institutionCode: '' }), { linkedStudentUSN: 'GIS2026001' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'NO_INSTITUTION' });
    expect(findStudent).not.toHaveBeenCalled();
  });
});
