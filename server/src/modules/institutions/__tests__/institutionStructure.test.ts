import { describe, it, expect, beforeEach, vi } from 'vitest';

const dbState = vi.hoisted(() => ({ users: 0, sections: 0, subjects: 0 }));
const roleUpdates = vi.hoisted(() => [] as { id: string; data: any }[]);

vi.mock('../../shared/db/index.js', () => ({
  db: null,
  dbCountUsersByInstitution: async () => dbState.users,
  dbCountClassSectionsByInstitution: async () => dbState.sections,
  dbCountSubjectsByInstitution: async () => dbState.subjects,
  dbFindUsersByInstitution: async () => [],
  dbUpdateUser: async (id: string, data: any) => {
    roleUpdates.push({ id, data });
  },
}));

import { InstitutionService } from '../institution.service.js';
import { institutionRepository } from '../institution.repository.js';

const service = new InstitutionService(institutionRepository);

async function createSchool(code: string) {
  return service.createInstitution({
    institutionCode: code,
    institutionName: `${code} School`,
    institutionType: 'school',
    subscriptionStatus: 'active',
    subjects: ['Math'],
    classes: ['Class 1'],
    sections: ['A'],
  } as any);
}

describe('InstitutionService structure', () => {
  beforeEach(() => {
    dbState.users = 0;
    dbState.sections = 0;
    dbState.subjects = 0;
    roleUpdates.length = 0;
  });

  it('creates a school with the canonical storage mapping', async () => {
    const created = await createSchool('STR101');
    expect(created.institutionType).toBe('school');
    expect(created.departments).toEqual(['Math']);
    expect(created.academicYears).toEqual(['Class 1']);
    expect(created.yearsOfStudy).toEqual([]);
    expect(created.courses).toEqual([]);
    expect(created.sections).toEqual(['A']);
  });

  it('creates a college with yearsOfStudy separate from academicYears', async () => {
    const created = await service.createInstitution({
      institutionCode: 'STR108',
      institutionName: 'Engineering College',
      institutionType: 'college',
      subscriptionStatus: 'active',
      departments: ['CSE'],
      yearsOfStudy: ['1st Year', '2nd Year'],
      programs: ['B.Tech'],
      sections: ['A'],
    } as any);
    expect(created.institutionType).toBe('college');
    expect(created.yearsOfStudy).toEqual(['1st Year', '2nd Year']);
    expect(created.academicYears).toEqual([]);
    expect(created.courses).toEqual(['B.Tech']);
  });

  it('migrates legacy college academicYears into yearsOfStudy on update', async () => {
    const legacy = await service.createInstitution({
      institutionCode: 'STR109',
      institutionName: 'Legacy College',
      institutionType: 'college',
      subscriptionStatus: 'active',
      departments: ['CSE'],
      academicYears: ['1st Year', '2nd Year'],
      sections: ['A'],
    } as any);
    expect(legacy.yearsOfStudy).toEqual(['1st Year', '2nd Year']);
    expect(legacy.academicYears).toEqual([]);
  });

  it('applies per-type defaults instead of storing empty arrays', async () => {
    const created = await service.createInstitution({
      institutionCode: 'STR102',
      institutionName: 'Defaults School',
      institutionType: 'school',
      subscriptionStatus: 'active',
    } as any);
    expect(created.departments!.length).toBeGreaterThan(0);
    expect(created.academicYears!.length).toBeGreaterThan(0);
    expect(created.sections!.length).toBeGreaterThan(0);
  });

  it('refuses a type change when the institution has data and convert is not set', async () => {
    const created = await createSchool('STR103');
    dbState.users = 2;

    await expect(
      service.updateInstitution(created.id, { institutionType: 'college' } as any)
    ).rejects.toMatchObject({ code: 'TYPE_CHANGE_REQUIRES_CONVERSION', statusCode: 409 });
  });

  it('converts the type when convert is explicitly set', async () => {
    const created = await createSchool('STR104');
    dbState.users = 1;

    const updated = await service.updateInstitution(created.id, {
      institutionType: 'college',
      convert: true,
    } as any);

    expect(updated?.institutionType).toBe('college');
    expect(updated?.departments).toEqual(expect.any(Array));
  });

  it('allows a type change when the institution has no data', async () => {
    const created = await createSchool('STR105');
    const updated = await service.updateInstitution(created.id, { institutionType: 'college' } as any);
    expect(updated?.institutionType).toBe('college');
  });

  it('refuses to delete an institution that still has users', async () => {
    const created = await createSchool('STR106');
    dbState.users = 1;
    await expect(service.deleteInstitution(created.id)).rejects.toMatchObject({
      code: 'INSTITUTION_HAS_DATA',
      statusCode: 409,
    });
  });

  it('updates the class catalogue only through the canonical aliases', async () => {
    const created = await createSchool('STR107');
    const updated = await service.updateInstitution(created.id, {
      subjects: ['Physics'],
      classes: ['Class 2'],
      sections: ['B'],
    } as any);

    expect(updated?.departments).toEqual(['Physics']);
    expect(updated?.academicYears).toEqual(['Class 2']);
    expect(updated?.sections).toEqual(['B']);
  });
});
