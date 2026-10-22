import { describe, it, expect } from 'vitest';
import {
  normalizeStructure,
  structureToRecordFields,
  structureFromRecord,
  buildClassSectionFields,
  adaptLegacySchoolClassSection,
  isLegacySchoolClassSection,
  isRoleAllowedForInstitution,
  rolesForInstitutionType,
  DEFAULT_STRUCTURE,
  DEFAULT_INSTITUTION_TYPE,
} from '../academicStructure.js';
import { CreateInstitutionSchema, UpdateInstitutionSchema } from '../../institutions/institution.schema.js';

describe('normalizeStructure', () => {
  it('defaults the institution type to school (never silently college)', () => {
    expect(normalizeStructure({}).institutionType).toBe('school');
    expect(normalizeStructure({ institutionType: 'anything' }).institutionType).toBe('school');
    expect(DEFAULT_INSTITUTION_TYPE).toBe('school');
  });

  it('maps canonical school aliases: subjects -> departments, classes -> academic years', () => {
    const structure = normalizeStructure({
      institutionType: 'school',
      subjects: [' English ', 'Science', 'english'],
      classes: ['Class 9', 'Class 10'],
      sections: ['A', 'B'],
      programs: ['B.Tech'],
    });

    expect(structure.units).toEqual(['English', 'Science']);
    expect(structure.levels).toEqual(['Class 9', 'Class 10']);
    expect(structure.programs).toEqual([]);

    const fields = structureToRecordFields(structure);
    expect(fields.departments).toEqual(['English', 'Science']);
    expect(fields.academicYears).toEqual(['Class 9', 'Class 10']);
    expect(fields.courses).toEqual([]);
    expect(fields.sections).toEqual(['A', 'B']);
  });

  it('accepts the legacy storage-shaped aliases', () => {
    const structure = normalizeStructure({
      institutionType: 'college',
      departments: ['CSE', 'ECE'],
      academicYears: ['1st Year', '2nd Year'],
      courses: ['B.Tech'],
      sections: ['A'],
    });
    expect(structure.units).toEqual(['CSE', 'ECE']);
    expect(structure.levels).toEqual(['1st Year', '2nd Year']);
    expect(structure.programs).toEqual(['B.Tech']);
  });

  it('prefers canonical aliases over legacy ones', () => {
    const structure = normalizeStructure({
      institutionType: 'school',
      subjects: ['Math'],
      departments: ['Old Subject'],
      classes: ['Class 1'],
      academicYears: ['Class 99'],
    });
    expect(structure.units).toEqual(['Math']);
    expect(structure.levels).toEqual(['Class 1']);
  });

  it('applies per-type defaults only when asked', () => {
    const empty = normalizeStructure({ institutionType: 'school' });
    expect(empty.units).toEqual([]);
    expect(empty.levels).toEqual([]);

    const withDefaults = normalizeStructure({ institutionType: 'school' }, { applyDefaults: true });
    expect(withDefaults.units).toEqual(DEFAULT_STRUCTURE.school.units);
    expect(withDefaults.levels).toEqual(DEFAULT_STRUCTURE.school.levels);
    expect(withDefaults.sections).toEqual(DEFAULT_STRUCTURE.school.sections);
    expect(withDefaults.terms.length).toBeGreaterThan(0);
  });

  it('keeps explicit values when defaults are requested (no overwrite)', () => {
    const structure = normalizeStructure(
      { institutionType: 'college', departments: ['CSE'], academicYears: ['1st Year'] },
      { applyDefaults: true }
    );
    expect(structure.units).toEqual(['CSE']);
    expect(structure.levels).toEqual(['1st Year']);
  });

  it('round-trips through a DB row', () => {
    const row = {
      institutionType: 'school',
      departments: ['Math', 'Science'],
      academicYears: ['Class 1', 'Class 2'],
      courses: [],
      sections: ['A'],
      terms: [{ academicYear: '2026-2027', terms: ['Term 1'] }],
    };
    const structure = structureFromRecord(row);
    expect(structure.units).toEqual(['Math', 'Science']);
    expect(structure.levels).toEqual(['Class 1', 'Class 2']);
    expect(structureToRecordFields(structure)).toEqual({
      institutionType: 'school',
      departments: ['Math', 'Science'],
      academicYears: ['Class 1', 'Class 2'],
      yearsOfStudy: [],
      courses: [],
      sections: ['A'],
    });
  });

  it('stores college years of study separately from academic sessions', () => {
    const structure = normalizeStructure({
      institutionType: 'college',
      departments: ['CSE'],
      yearsOfStudy: ['1st Year', '2nd Year'],
      courses: ['B.Tech'],
      sections: ['A'],
    });
    expect(structure.levels).toEqual(['1st Year', '2nd Year']);
    expect(structureToRecordFields(structure)).toMatchObject({
      academicYears: [],
      yearsOfStudy: ['1st Year', '2nd Year'],
    });
  });

  it('reads legacy college rows where years still sit in academicYears', () => {
    const structure = structureFromRecord({
      institutionType: 'college',
      departments: ['CSE'],
      academicYears: ['1st Year', '2nd Year'],
      yearsOfStudy: [],
    });
    expect(structure.levels).toEqual(['1st Year', '2nd Year']);
    expect(structure.yearsOfStudy).toEqual(['1st Year', '2nd Year']);
  });

  it('prefers yearsOfStudy over legacy academicYears', () => {
    const structure = structureFromRecord({
      institutionType: 'college',
      departments: ['CSE'],
      academicYears: ['Legacy Year'],
      yearsOfStudy: ['1st Year'],
    });
    expect(structure.levels).toEqual(['1st Year']);
  });
});

describe('buildClassSectionFields', () => {
  it('builds the canonical school row (class in department, letter in academicYear)', () => {
    expect(buildClassSectionFields('school', 'Class 10', 'A')).toEqual({
      name: 'Class 10 A',
      department: 'Class 10',
      academicYear: 'A',
      section: 'A',
    });
  });

  it('builds the canonical college row', () => {
    expect(buildClassSectionFields('college', '2nd Year', 'B', 'CSE')).toEqual({
      name: 'CSE 2nd Year B',
      department: 'CSE',
      academicYear: '2nd Year',
      section: 'B',
    });
  });

  it('omits the section when none is configured', () => {
    expect(buildClassSectionFields('school', 'Class 5', '')).toEqual({
      name: 'Class 5',
      department: 'Class 5',
      academicYear: '',
      section: '',
    });
  });
});

describe('adaptLegacySchoolClassSection', () => {
  const school = {
    institutionType: 'school',
    departments: ['Math', 'Science'],
    academicYears: ['Class 9', 'Class 10'],
  };

  it('swaps the legacy (subject, class) ordering', () => {
    const legacy = { name: 'Math Class 10', department: 'Math', academicYear: 'Class 10', section: 'A' };
    expect(isLegacySchoolClassSection(school, legacy)).toBe(true);
    expect(adaptLegacySchoolClassSection(school, legacy)).toEqual({
      name: 'Math Class 10',
      department: 'Class 10',
      academicYear: 'A',
      section: 'A',
    });
  });

  it('leaves canonical rows untouched', () => {
    const canonical = { name: 'Class 10 A', department: 'Class 10', academicYear: 'A', section: 'A' };
    expect(isLegacySchoolClassSection(school, canonical)).toBe(false);
    expect(adaptLegacySchoolClassSection(school, canonical)).toBe(canonical);
  });

  it('never touches college rows', () => {
    const college = { institutionType: 'college', departments: ['CSE'], academicYears: ['2nd Year'] };
    const row = { name: 'CSE 2nd Year B', department: 'CSE', academicYear: '2nd Year', section: 'B' };
    expect(adaptLegacySchoolClassSection(college, row)).toBe(row);
  });
});

describe('roles', () => {
  it('gives schools a principal and no HOD', () => {
    expect(rolesForInstitutionType('school')).toContain('principal');
    expect(rolesForInstitutionType('school')).not.toContain('hod');
  });

  it('gives colleges both a principal and an HOD', () => {
    expect(rolesForInstitutionType('college')).toContain('principal');
    expect(rolesForInstitutionType('college')).toContain('hod');
  });

  it('only restricts HOD to colleges', () => {
    expect(isRoleAllowedForInstitution('school', 'hod')).toBe(false);
    expect(isRoleAllowedForInstitution('college', 'hod')).toBe(true);
    expect(isRoleAllowedForInstitution('school', 'principal')).toBe(true);
    expect(isRoleAllowedForInstitution('college', 'principal')).toBe(true);
  });
});

describe('institution schemas', () => {
  const base = {
    institutionCode: 'TST001',
    institutionName: 'Test School',
    institutionType: 'school' as const,
    subjects: ['Math'],
    classes: ['Class 1'],
    sections: ['A'],
  };

  it('requires an explicit institutionType on create', () => {
    const result = CreateInstitutionSchema.safeParse({
      institutionCode: 'TST001',
      institutionName: 'Test School',
    });
    expect(result.success).toBe(false);
  });

  it('accepts school canonical input', () => {
    const result = CreateInstitutionSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('rejects courses/programs for a school', () => {
    const result = CreateInstitutionSchema.safeParse({ ...base, programs: ['B.Tech'] });
    expect(result.success).toBe(false);
    expect(result.success ? '' : result.error.issues[0].message).toContain('cannot have programs');
  });

  it('allows programs for a college', () => {
    const result = CreateInstitutionSchema.safeParse({
      ...base,
      institutionType: 'college',
      programs: ['B.Tech'],
      departments: ['CSE'],
      academicYears: ['1st Year'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects unsafe section labels', () => {
    const result = CreateInstitutionSchema.safeParse({ ...base, sections: ['<script>'] });
    expect(result.success).toBe(false);
  });

  it('accepts the convert flag on update', () => {
    const result = UpdateInstitutionSchema.safeParse({ institutionType: 'college', convert: true });
    expect(result.success).toBe(true);
  });
});
