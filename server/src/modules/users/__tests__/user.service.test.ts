import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../shared/db/index.js', () => ({
  db: null,
  dbFindUserById: vi.fn(),
  dbFindStudentByUsnInInstitution: vi.fn(),
}));

import { UserService } from '../user.service.js';
import { dbFindStudentByUsnInInstitution } from '../../shared/db/index.js';
import { getParentLinks, __resetParentLinksForTests } from '../parent-links.js';

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
  __resetParentLinksForTests();
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
    expect(scope.linkedStudentUSN).toBeUndefined();
    expect(scope.relation).toBe('Mother');
    const links = await getParentLinks('u1');
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ studentId: 's1', relationship: 'Mother', isPrimary: true });
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

  it('allows idempotent re-submit of the same USN (case-insensitive) and keeps the link in parent_links', async () => {
    findStudent.mockResolvedValue({ id: 's1', role: 'student', rollNoOrUSN: 'GIS2026001' } as any);
    const { repo, upsertUser } = makeRepo(
      makeUser({ scope: JSON.stringify({ linkedStudentUSN: 'GIS2026001' }) })
    );
    const svc = new UserService(repo);

    await svc.completeProfile(makeAuth(), { linkedStudentUSN: 'gis2026001' });

    const scope = JSON.parse(upsertUser.mock.calls[0][0].scope);
    expect(scope.linkedStudentUSN).toBeUndefined();
    const links = await getParentLinks('u1');
    expect(links).toHaveLength(1);
    expect(links[0].studentId).toBe('s1');
  });

  it('no longer hard-requires guardian fields for students (now settings-driven)', async () => {
    const { repo, upsertUser } = makeRepo(makeUser({ role: 'student' }));
    const svc = new UserService(repo);

    const result = await svc.completeProfile(makeAuth({ role: 'student' }), {});
    expect(result.message).toBe('Profile completed successfully');
    expect(upsertUser.mock.calls[0][0].profileCompleted).toBe(true);
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

describe('completeProfile — phone handling', () => {
  it('allows admins to complete without a phone (phone is a creation-time basic)', async () => {
    const { repo, upsertUser } = makeRepo(makeUser({ role: 'admin', email: 'admin@test.com' }));
    const svc = new UserService(repo);

    const result = await svc.completeProfile(makeAuth({ role: 'admin', email: 'admin@test.com' }), {});
    expect(result.message).toBe('Profile completed successfully');
    expect(upsertUser.mock.calls[0][0].profileCompleted).toBe(true);
  });

  it('rejects a malformed phone number for admins', async () => {
    const { repo } = makeRepo(makeUser({ role: 'admin' }));
    const svc = new UserService(repo);

    await expect(
      svc.completeProfile(makeAuth({ role: 'admin' }), { phone: 'abc' })
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_PHONE' });
  });

  it('rejects a malformed phone from non-admin roles as well', async () => {
    const { repo } = makeRepo(makeUser({ role: 'teacher' }));
    const svc = new UserService(repo);

    await expect(
      svc.completeProfile(makeAuth({ role: 'teacher' }), { phone: '12' })
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_PHONE' });
  });

  it('accepts a valid phone for admins and marks the profile complete', async () => {
    const { repo, upsertUser } = makeRepo(makeUser({ role: 'admin' }));
    const svc = new UserService(repo);

    const result = await svc.completeProfile(makeAuth({ role: 'admin' }), {
      phone: '+91 98765 43210',
    });

    expect(result.message).toBe('Profile completed successfully');
    expect(upsertUser.mock.calls[0][0].profileCompleted).toBe(true);
    expect(upsertUser.mock.calls[0][0].phone).toBe('+91 98765 43210');
  });
});
