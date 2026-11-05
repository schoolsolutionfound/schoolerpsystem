import { describe, it, expect, beforeEach, vi } from 'vitest';

const state = vi.hoisted(() => ({
  classRows: [] as { id: string; name: string }[],
  subjectRows: [] as { id: string; name: string }[],
  enrollments: [] as { id: string; classSectionId: string }[],
  subjectAssignments: [] as { id: string; classSectionId: string; subjectId: string }[],
  deletedClassNames: [] as string[],
  deletedSubjectNames: [] as string[],
  insertedClassNames: [] as string[],
}));

const tableName = (table: any) => String(table?.[Symbol.for('drizzle:Name')] ?? 'unknown');

function boundValues(condition: any): string[] {
  const values: string[] = [];
  const walk = (chunk: any) => {
    if (!chunk || typeof chunk !== 'object') return;
    if (Array.isArray(chunk)) {
      chunk.forEach(walk);
      return;
    }
    if (chunk.constructor?.name === 'Param') {
      values.push(String(chunk.value));
      return;
    }
    if (Array.isArray(chunk.queryChunks)) chunk.queryChunks.forEach(walk);
  };
  walk(condition);
  return values;
}

function matching(rows: any[], columns: string[], values: string[]) {
  return rows.filter((row) => columns.some((column) => values.includes(String(row[column] ?? ''))));
}

// Conditions always carry the institution code; rows are scoped to it already,
// so only the id/name parameters matter when filtering.
function scopedValues(condition: any): string[] {
  return boundValues(condition).filter((value) => value !== 'DIFF001');
}

const existingRow = {
  id: 'inst_1',
  institutionCode: 'DIFF001',
  institutionName: 'Diff School',
  institutionType: 'school',
  subscriptionStatus: 'active',
  departments: ['Math', 'Physics'],
  academicYears: ['Class 1', 'Class 2'],
  yearsOfStudy: [],
  courses: [],
  sections: ['A'],
  terms: [],
  blockedDates: [],
  classSubjects: {},
};

vi.mock('../../shared/db/index.js', () => ({
  db: {
    update: () => ({ set: () => ({ where: async () => {} }) }),
    transaction: async (fn: any) =>
      fn({
        update: () => ({
          set: (data: any) => ({
            where: () => ({ returning: async () => [{ ...existingRow, ...data }] }),
          }),
        }),
        select: () => ({
          from: (table: any) => ({
            where: async (condition: any) => {
              const values = scopedValues(condition);
              const scoped = (rows: any[], columns: string[]) =>
                values.length === 0 ? rows : matching(rows, columns, values);
              switch (tableName(table)) {
                case 'class_sections':
                  return scoped(state.classRows, ['id', 'name']);
                case 'subjects':
                  return scoped(state.subjectRows, ['id', 'name']);
                case 'student_classes':
                  return scoped(state.enrollments, ['id', 'classSectionId']);
                case 'subject_teachers':
                  return scoped(state.subjectAssignments, ['id', 'classSectionId', 'subjectId']);
                default:
                  return [];
              }
            },
          }),
        }),
        delete: (table: any) => ({
          where: async (condition: any) => {
            const values = scopedValues(condition);
            switch (tableName(table)) {
              case 'class_sections': {
                const hit = matching(state.classRows, ['id', 'name'], values);
                state.deletedClassNames.push(...hit.map((row) => row.name));
                state.classRows = state.classRows.filter((row) => !hit.includes(row));
                break;
              }
              case 'subjects': {
                const hit = matching(state.subjectRows, ['id', 'name'], values);
                state.deletedSubjectNames.push(...hit.map((row) => row.name));
                state.subjectRows = state.subjectRows.filter((row) => !hit.includes(row));
                break;
              }
            }
          },
        }),
        insert: (table: any) => ({
          values: (rows: any[]) => ({
            onConflictDoNothing: async () => {
              if (tableName(table) !== 'class_sections') return;
              for (const row of rows) {
                state.insertedClassNames.push(row.name);
                state.classRows.push({ id: row.id, name: row.name });
              }
            },
          }),
        }),
      }),
  },
  dbCountUsersByInstitution: async () => 0,
  dbCountClassSectionsByInstitution: async () => state.classRows.length,
  dbCountSubjectsByInstitution: async () => state.subjectRows.length,
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

describe('InstitutionService.updateInstitution structure diff', () => {
  beforeEach(() => {
    state.classRows = [
      { id: 'cs1', name: 'Class 1 A' },
      { id: 'cs2', name: 'Class 2 A' },
    ];
    state.subjectRows = [
      { id: 'sub1', name: 'Math' },
      { id: 'sub2', name: 'Physics' },
    ];
    state.enrollments = [];
    state.subjectAssignments = [];
    state.deletedClassNames = [];
    state.deletedSubjectNames = [];
    state.insertedClassNames = [];
    existingRow.departments = ['Math', 'Physics'];
    existingRow.academicYears = ['Class 1', 'Class 2'];
    existingRow.sections = ['A'];
  });

  it('deletes the class_sections row of a class removed from the structure', async () => {
    const service = makeService();
    await service.updateInstitution('inst_1', { classes: ['Class 1'] } as any);

    expect(state.deletedClassNames).toEqual(['Class 2 A']);
    expect(state.classRows.map((row) => row.name)).toEqual(['Class 1 A']);
  });

  it('deletes a row when the level is stored as the full class-section name', async () => {
    // The admin editor keeps "Class 1 A" itself in the class list.
    existingRow.academicYears = ['Class 1 A', 'Class 2 A'];
    state.classRows = [
      { id: 'cs1', name: 'Class 1 A' },
      { id: 'cs2', name: 'Class 2 A' },
    ];
    const service = makeService();
    await service.updateInstitution('inst_1', { classes: ['Class 2 A'] } as any);

    expect(state.deletedClassNames).toEqual(['Class 1 A']);
    expect(state.classRows.some((row) => row.name === 'Class 1 A')).toBe(false);
  });

  it('deletes the subject row of a subject removed from the structure', async () => {
    const service = makeService();
    await service.updateInstitution('inst_1', { subjects: ['Math'] } as any);

    expect(state.deletedSubjectNames).toEqual(['Physics']);
    expect(state.subjectRows.map((row) => row.name)).toEqual(['Math']);
  });

  it('refuses to drop a class that students are enrolled in', async () => {
    state.enrollments = [{ id: 'sc1', classSectionId: 'cs2' }];
    const service = makeService();

    await expect(
      service.updateInstitution('inst_1', { classes: ['Class 1'] } as any)
    ).rejects.toMatchObject({ code: 'STRUCTURE_CHANGE_BLOCKED', statusCode: 409 });
    expect(state.deletedClassNames).toEqual([]);
    expect(state.classRows).toHaveLength(2);
  });

  it('keeps stored classes when an empty list arrives without clearStructure', async () => {
    const service = makeService();
    await service.updateInstitution('inst_1', { classes: [] } as any);

    expect(state.deletedClassNames).toEqual([]);
    expect(state.classRows).toHaveLength(2);
  });

  it('deletes every class row when clearStructure clears the class list', async () => {
    const service = makeService();
    await service.updateInstitution('inst_1', { clearStructure: true, classes: [] } as any);

    expect(state.deletedClassNames.sort()).toEqual(['Class 1 A', 'Class 2 A']);
    expect(state.classRows).toEqual([]);
  });
});
