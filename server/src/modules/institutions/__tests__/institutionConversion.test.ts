import { describe, it, expect, beforeEach, vi } from 'vitest';

const state = vi.hoisted(() => ({
  ops: [] as string[],
}));

const existingRow = {
  id: 'inst_1',
  institutionCode: 'CONV001',
  institutionName: 'Convert Me',
  institutionType: 'school',
  subscriptionStatus: 'active',
  departments: ['Math'],
  academicYears: ['Class 1'],
  yearsOfStudy: [],
  courses: [],
  sections: ['A'],
  terms: [],
  blockedDates: [],
  classSubjects: {},
};

const tableName = (table: any) => String(table?.[Symbol.for('drizzle:Name')] ?? 'unknown');

vi.mock('../../shared/db/index.js', () => ({
  db: {
    update: () => ({ set: () => ({ where: async () => {} }) }),
    transaction: async (fn: any) =>
      fn({
        update: () => ({
          set: (data: any) => ({
            where: () => ({
              returning: async () => [{ ...existingRow, ...data }],
            }),
          }),
        }),
        delete: (table: any) => ({
          where: async () => {
            state.ops.push('delete:' + tableName(table));
          },
        }),
        select: () => ({ from: () => ({ where: async () => [] }) }),
        insert: (table: any) => ({
          values: () => ({
            onConflictDoNothing: async () => {
              state.ops.push('insert:' + tableName(table));
            },
          }),
        }),
      }),
  },
  dbCountUsersByInstitution: async () => 0,
  dbCountClassSectionsByInstitution: async () => 1,
  dbCountSubjectsByInstitution: async () => 1,
  dbFindUsersByInstitution: async () => [],
  dbUpdateUser: async () => {},
}));

import { InstitutionService } from '../institution.service.js';

function makeService() {
  const repo = {
    findById: async () => existingRow,
    update: async () => existingRow,
  };
  return new InstitutionService(repo as any);
}

describe('InstitutionService.updateInstitution conversion', () => {
  beforeEach(() => {
    state.ops = [];
  });

  it('rebuilds the structure instead of stacking college rows on school rows', async () => {
    const service = makeService();
    const updated = await service.updateInstitution('inst_1', {
      institutionType: 'college',
      convert: true,
      departments: ['CSE'],
      yearsOfStudy: ['1st Year'],
      sections: ['A'],
    } as any);

    expect(updated?.institutionType).toBe('college');
    expect(state.ops).toEqual([
      'delete:class_sections',
      'delete:subjects',
      'insert:class_sections',
    ]);
  });
});
