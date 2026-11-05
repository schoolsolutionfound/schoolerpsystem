import { describe, it, expect, beforeEach, vi } from 'vitest';

const state = vi.hoisted(() => ({
  users: 0,
  deletes: [] as string[],
  repoDeleteCalled: false,
  fkFailure: false,
}));

vi.mock('../../shared/db/index.js', () => ({
  db: {
    transaction: async (fn: any) =>
      fn({
        delete: (table: any) => ({
          where: async () => {
            state.deletes.push(String(table?.[Symbol.for('drizzle:Name')] ?? 'unknown'));
            if (state.fkFailure) throw Object.assign(new Error('fk violation'), { code: '23001' });
          },
        }),
      }),
  },
  dbCountUsersByInstitution: async () => state.users,
  dbCountClassSectionsByInstitution: async () => 0,
  dbCountSubjectsByInstitution: async () => 0,
  dbFindUsersByInstitution: async () => [],
  dbUpdateUser: async () => {},
}));

import { InstitutionService } from '../institution.service.js';

function makeService() {
  const repo = {
    findById: async (id: string) => ({
      id,
      institutionCode: 'NEW001',
      institutionName: 'New School',
    }),
    delete: async () => {
      state.repoDeleteCalled = true;
      return true;
    },
  };
  return new InstitutionService(repo as any);
}

describe('InstitutionService.deleteInstitution', () => {
  beforeEach(() => {
    state.users = 0;
    state.deletes = [];
    state.repoDeleteCalled = false;
    state.fkFailure = false;
  });

  it('removes the seeded catalogue and the institution in one transaction', async () => {
    const service = makeService();
    await expect(service.deleteInstitution('inst_1')).resolves.toEqual({
      message: 'Institution deleted successfully',
    });
    expect(state.deletes).toEqual(['class_sections', 'subjects', 'institutions']);
    expect(state.repoDeleteCalled).toBe(false);
  });

  it('refuses deletion and touches nothing when the tenant has users', async () => {
    state.users = 2;
    const service = makeService();
    await expect(service.deleteInstitution('inst_1')).rejects.toMatchObject({
      code: 'INSTITUTION_HAS_DATA',
      statusCode: 409,
    });
    expect(state.deletes).toEqual([]);
    expect(state.repoDeleteCalled).toBe(false);
  });

  it('turns a restrict-FK violation into a clean 409 instead of a 500', async () => {
    state.fkFailure = true;
    const service = makeService();
    await expect(service.deleteInstitution('inst_1')).rejects.toMatchObject({
      code: 'INSTITUTION_HAS_DATA',
      statusCode: 409,
    });
    expect(state.repoDeleteCalled).toBe(false);
  });
});
