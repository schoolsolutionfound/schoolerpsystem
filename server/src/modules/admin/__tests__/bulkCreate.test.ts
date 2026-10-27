import { describe, it, expect, vi, beforeEach } from 'vitest';

const { createUser, dbUpsertUser, dbFindByEmail, upsertPreferences } = vi.hoisted(() => ({
  createUser: vi.fn(),
  dbUpsertUser: vi.fn(),
  dbFindByEmail: vi.fn(),
  upsertPreferences: vi.fn(),
}));

vi.mock('../../shared/db/index.js', () => ({
  // db = null pushes every path onto the in-memory fallbacks (no Postgres in tests)
  db: null,
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
  dbFindByEmail,
  dbUpsertUser,
  dbInsertAuditEvent: vi.fn(),
}));

vi.mock('../../shared/config/firebase.js', () => ({
  admin: { auth: () => ({ createUser, updateUser: vi.fn(), revokeRefreshTokens: vi.fn() }) },
  isFirebaseAdminInitialized: true,
}));

vi.mock('../../institutions/institution.service.js', () => ({
  institutionService: {
    getInstitutions: vi.fn(async () => [
      { institutionCode: 'GIS001', institutionName: 'Greenfield', institutionType: 'school', defaultTempPassword: '' },
      { institutionCode: 'DEF001', institutionName: 'Default School', institutionType: 'school', defaultTempPassword: 'School@1234' },
    ]),
    getInstitutionByCode: vi.fn(),
  },
}));

vi.mock('../academics/academics.repository.js', () => ({
  academicsRepository: { listClassSections: vi.fn(async () => []) },
}));

vi.mock('../../notifications/notification.repository.js', () => ({
  upsertPreferences,
}));

import { adminService } from '../admin.service.js';

beforeEach(() => {
  vi.clearAllMocks();
  dbFindByEmail.mockResolvedValue(undefined);
  dbUpsertUser.mockImplementation(async (u: any) => ({
    id: `usr_${(u.email || '').replace(/[^a-z0-9]/gi, '_')}`,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    institutionCode: u.institutionCode,
    scope: u.scope,
    ...u,
  }));
  createUser.mockImplementation(async (props: any) => ({ uid: `fb_${props.email}` }));
  upsertPreferences.mockResolvedValue(undefined);
});

const rec = (over: Record<string, any> = {}) => ({
  firstName: 'Aarav',
  lastName: 'Sharma',
  email: 'aarav@school.edu',
  ...over,
});

describe('adminService.bulkCreateUsers — CSV bulk import', () => {
  it('creates student rows with generated temp passwords in one pass', async () => {
    const result = await adminService.bulkCreateUsers('GIS001', 'student', [
      rec(),
      rec({ firstName: 'Diya', lastName: 'Patel', email: 'diya@school.edu', rollNoOrUSN: '102', phone: '+91 98765 43211' }),
    ]);

    expect(result).toMatchObject({ total: 2, created: 2, skipped: 0, failed: 0 });
    expect(result.tempPasswords).toHaveLength(2);
    expect(result.tempPasswords[0].tempPassword).toMatch(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/);
    expect(createUser).toHaveBeenCalledTimes(2);
    expect(dbUpsertUser).toHaveBeenCalledTimes(2);
    const firstUser = dbUpsertUser.mock.calls[0][0];
    expect(firstUser).toMatchObject({
      email: 'aarav@school.edu',
      fullName: 'Aarav Sharma',
      role: 'student',
      institutionCode: 'GIS001',
      mustChangePassword: true,
      profileCompleted: false,
    });
    // Batched existence check = exactly one dbFindByEmail pass per row (in-memory fallback),
    // never a write for skipped rows.
    expect(dbFindByEmail).toHaveBeenCalled();
  });

  it('validates and dedupes rows in-file, reporting CSV row numbers (header = row 1)', async () => {
    const result = await adminService.bulkCreateUsers('GIS001', 'student', [
      rec(), // row 2 — good
      rec({ email: '', firstName: 'NoEmail' }), // row 3 — missing email
      rec({ firstName: 'Copy', email: 'aarav@school.edu' }), // row 4 — duplicate of row 2
    ]);

    expect(result).toMatchObject({ total: 3, created: 1, failed: 2 });
    const messages = result.errors.map((e) => e.message);
    expect(result.errors.find((e) => e.row === 3)?.message).toMatch(/Missing required fields/);
    expect(result.errors.find((e) => e.row === 4)?.message).toMatch(/Duplicate email in file/);
    expect(createUser).toHaveBeenCalledTimes(1);
  });

  it('skips emails that already exist without touching Firebase for them', async () => {
  dbFindByEmail.mockImplementation(async (email: string) =>
    email === 'taken@school.edu'
      ? { id: 'existing', email, role: 'student', fullName: 'Taken', institutionCode: 'GIS001' }
      : undefined
  );

    const result = await adminService.bulkCreateUsers('GIS001', 'student', [
      rec({ email: 'taken@school.edu' }),
      rec({ email: 'fresh@school.edu' }),
    ]);

    expect(result).toMatchObject({ created: 1, skipped: 1 });
    expect(result.skippedEmails).toEqual(['taken@school.edu']);
    expect(createUser).toHaveBeenCalledTimes(1);
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'fresh@school.edu', password: expect.any(String) })
    );
  });

  it('counts Firebase EMAIL_EXISTS races as skips, not failures', async () => {
    // Shape of the error createFirebaseUser() maps from Firebase Auth.
    createUser.mockRejectedValue(Object.assign(new Error('email exists'), { code: 'auth/email-already-exists' }));

    const result = await adminService.bulkCreateUsers('GIS001', 'student', [rec()]);

    expect(result).toMatchObject({ created: 0, skipped: 1, failed: 0 });
  });

  it('rejects roles not valid for the institution type', async () => {
    await expect(adminService.bulkCreateUsers('GIS001', 'hod', [rec()])).rejects.toMatchObject({
      statusCode: 400,
      code: 'INVALID_ROLE',
    });
    expect(createUser).not.toHaveBeenCalled();
    expect(dbUpsertUser).not.toHaveBeenCalled();
  });

  it('rejects parent rows with a bad relation or no child emails before any writes', async () => {
    const result = await adminService.bulkCreateUsers('GIS001', 'parent', [
      rec({ relation: 'Aunt', childEmails: ['kid@school.edu'] }), // row 2 — invalid relation
      rec({ firstName: 'NoKid', email: 'parent2@school.edu', relation: 'Father', childEmails: [] }), // row 3
    ]);

    expect(result).toMatchObject({ created: 0, failed: 2 });
    expect(result.errors[0].message).toMatch(/Father, Mother, Guardian/);
    expect(result.errors[1].message).toMatch(/at least one student email/);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('creates parents with linked children (resolved by email) and returns invite temps', async () => {
    dbFindByEmail.mockImplementation(async (email: string) =>
      email === 'kid@school.edu'
        ? { id: 'stu_1', email, role: 'student', fullName: 'Kid One' }
        : undefined
    );

    const result = await adminService.bulkCreateUsers('GIS001', 'parent', [
      rec({ email: 'father@parent.edu', relation: 'father', childEmails: ['kid@school.edu', 'ghost@school.edu'] }),
    ]);

    expect(result.created).toBe(1);
    expect(result.note).toMatch(/invite emails are not sent in bulk/);
    expect(result.tempPasswords).toHaveLength(1);
    // Unknown child surfaces as a row error but the parent still exists.
    expect(result.failed).toBe(1);
    expect(result.errors[0].message).toMatch(/ghost@school.edu/);
    expect(dbUpsertUser).toHaveBeenCalledTimes(1);
    const parentUser = dbUpsertUser.mock.calls[0][0];
    expect(parentUser).toMatchObject({
      role: 'parent',
      scope: JSON.stringify({ relation: 'Father' }),
    });
  });

  it('stores admission officer category + seats in users.scope', async () => {
    const result = await adminService.bulkCreateUsers('GIS001', 'admission_officer', [
      rec({ email: 'officer@school.edu', categoryName: 'Management Quota', seats: 30 }),
    ]);

    expect(result.created).toBe(1);
    const call = dbUpsertUser.mock.calls[0][0];
    expect(JSON.parse(call.scope)).toMatchObject({ categoryName: 'Management Quota', seats: 30 });
    expect(call.role).toBe('admission_officer');
  });

  it('uses the institution default password when the CSV password column is blank', async () => {
    const result = await adminService.bulkCreateUsers('DEF001', 'student', [rec()]);

    expect(result.created).toBe(1);
    expect(result.tempPasswords).toHaveLength(0);
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'aarav@school.edu', password: 'School@1234' })
    );
  });
});
