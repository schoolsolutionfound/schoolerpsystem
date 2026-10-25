/**
 * Single source of truth for how school vs college academic structure is
 * labelled, validated and mapped onto the `institutions` / `class_sections`
 * tables.
 *
 * Storage contract (do not change without a migration):
 *   institutions.departments   school -> subjects        college -> departments
 *   institutions.academicYears school -> classes          college -> [] (sessions live in academic_sessions)
 *   institutions.yearsOfStudy  school -> []               college -> years of study
 *   institutions.courses       school -> []               college -> programs
 *   institutions.sections      both   -> section letters  (e.g. A, B, C)
 *
 * class_sections contract:
 *   school  -> department = class, academicYear = section letter, section = letter
 *   college -> department = department, academicYear = year, section = section
 *
 * The school shape (class stored in `department`, section letter in
 * `academicYear`) is the convention already used by student/teacher scopes,
 * promotion, seeding and the admin UI. It exists because `student_classes` and
 * `users.scope` need a year-like column for schools. Keep it, but always go
 * through these helpers so the meaning is explicit.
 */

export type InstitutionType = 'school' | 'college';

export interface TermEntry {
  academicYear: string;
  terms: string[];
}

export const DEFAULT_INSTITUTION_TYPE: InstitutionType = 'school';

export function normalizeInstitutionType(value?: string | null): InstitutionType {
  return String(value || '').toLowerCase() === 'college' ? 'college' : 'school';
}

export const SCHOOL_ROLES = [
  'admin',
  'principal',
  'teacher',
  'student',
  'parent',
  'accountant',
  'librarian',
  'driver',
  'admission_officer',
] as const;

export const COLLEGE_ROLES = [
  'admin',
  'principal',
  'hod',
  'teacher',
  'student',
  'parent',
  'accountant',
  'librarian',
  'driver',
  'placement_officer',
  'admission_officer',
] as const;

export function rolesForInstitutionType(
  type?: InstitutionType | string | null
): readonly string[] {
  return normalizeInstitutionType(type) === 'school' ? SCHOOL_ROLES : COLLEGE_ROLES;
}

export function isRoleAllowedForInstitution(
  type: InstitutionType | string | null | undefined,
  role: string
): boolean {
  return rolesForInstitutionType(type).includes(String(role || '').toLowerCase());
}

export interface StructureLabels {
  /** School: "Subject"; college: "Department". */
  unit: string;
  units: string;
  /** School: "Class"; college: "Year". */
  level: string;
  levels: string;
  section: string;
  sections: string;
  /** School: not used; college: "Program". */
  program: string;
  programs: string;
  subject: string;
  subjects: string;
  terms: string;
}

export const STRUCTURE_LABELS: Record<InstitutionType, StructureLabels> = {
  school: {
    unit: 'Subject',
    units: 'Subjects',
    level: 'Class',
    levels: 'Classes',
    section: 'Section',
    sections: 'Sections',
    program: 'Program',
    programs: 'Programs',
    subject: 'Subject',
    subjects: 'Subjects',
    terms: 'Terms',
  },
  college: {
    unit: 'Department',
    units: 'Departments',
    level: 'Year',
    levels: 'Academic Years',
    section: 'Section',
    sections: 'Sections',
    program: 'Program',
    programs: 'Programs',
    subject: 'Subject',
    subjects: 'Subjects',
    terms: 'Terms',
  },
};

export interface StructureDefaults {
  units: string[];
  levels: string[];
  programs: string[];
  sections: string[];
  terms: TermEntry[];
}

export const DEFAULT_STRUCTURE: Record<InstitutionType, StructureDefaults> = {
  school: {
    units: ['English', 'Mathematics', 'Science'],
    levels: [
      'Class 1',
      'Class 2',
      'Class 3',
      'Class 4',
      'Class 5',
      'Class 6',
      'Class 7',
      'Class 8',
      'Class 9',
      'Class 10',
    ],
    programs: [],
    sections: ['A', 'B', 'C'],
    terms: [{ academicYear: '2026-2027', terms: ['Term 1', 'Term 2', 'Term 3'] }],
  },
  college: {
    units: ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
    levels: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    programs: ['B.Tech', 'M.Tech'],
    sections: ['A', 'B'],
    terms: [{ academicYear: '2026-27', terms: ['Semester 1', 'Semester 2'] }],
  },
};

export interface NormalizedStructure {
  institutionType: InstitutionType;
  /** School: subjects. College: departments. Stored in `departments`. */
  units: string[];
  /** School: classes. College: years of study. */
  levels: string[];
  /** School: []. College: years of study. Stored in `yearsOfStudy`. */
  yearsOfStudy: string[];
  /** College only. Stored in `courses`. */
  programs: string[];
  /** Section letters/palette shared by all levels. Stored in `sections`. */
  sections: string[];
  terms: TermEntry[];
}

export interface StructureInput {
  institutionType?: string | null;
  /** Canonical aliases (preferred). */
  subjects?: string[];
  classes?: string[];
  programs?: string[];
  /** College: 1st Year, 2nd Year, … (preferred over legacy `academicYears`). */
  yearsOfStudy?: string[];
  /** Legacy storage-shaped aliases. */
  departments?: string[];
  /** School: classes. College: legacy location for years of study. */
  academicYears?: string[];
  courses?: string[];
  sections?: string[];
  terms?: TermEntry[];
}

export function uniqueStrings(values: unknown, max = 100): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = String(raw ?? '').trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value.slice(0, 200));
    if (out.length >= max) break;
  }
  return out;
}

function normalizeTerms(
  terms: TermEntry[] | undefined,
  type: InstitutionType,
  applyDefaults: boolean
): TermEntry[] {
  const cleaned: TermEntry[] = [];
  if (Array.isArray(terms)) {
    for (const entry of terms) {
      const academicYear = String(entry?.academicYear ?? '').trim();
      if (!academicYear) continue;
      cleaned.push({
        academicYear: academicYear.slice(0, 100),
        terms: uniqueStrings(entry?.terms, 12),
      });
      if (cleaned.length >= 20) break;
    }
  }
  if (cleaned.length === 0 && applyDefaults) {
    return DEFAULT_STRUCTURE[type].terms.map((entry) => ({
      academicYear: entry.academicYear,
      terms: [...entry.terms],
    }));
  }
  return cleaned;
}

/**
 * Normalizes any accepted structure input into the canonical shape. The
 * canonical aliases (`subjects`/`classes`/`programs`) win; storage-shaped
 * aliases are accepted so older clients keep working.
 *
 * `applyDefaults` fills empty dimensions with DEFAULT_STRUCTURE (used on
 * create/update so an empty form never silently wipes the admin defaults).
 */
export function normalizeStructure(
  input: StructureInput = {},
  opts: { applyDefaults?: boolean; fallbackType?: InstitutionType } = {}
): NormalizedStructure {
  const type = normalizeInstitutionType(input.institutionType ?? opts.fallbackType);
  const applyDefaults = opts.applyDefaults === true;

  const units =
    type === 'school'
      ? uniqueStrings(input.subjects ?? input.departments)
      : uniqueStrings(input.departments ?? input.subjects);
  // College levels are years of study. `academicYears` is accepted as a legacy
  // alias so rows written before the yearsOfStudy column keep working. Take the
  // first alias that actually has values (an empty array must not mask a
  // populated fallback).
  const pickLevels = (...candidates: unknown[]): string[] => {
    for (const candidate of candidates) {
      const values = uniqueStrings(candidate);
      if (values.length > 0) return values;
    }
    return [];
  };
  const levels =
    type === 'school'
      ? pickLevels(input.classes, input.academicYears)
      : pickLevels(input.yearsOfStudy, input.academicYears, input.classes);
  const programs =
    type === 'school' ? [] : uniqueStrings(input.programs ?? input.courses);
  const sections = uniqueStrings(input.sections, 50);

  const defaults = DEFAULT_STRUCTURE[type];
  const resolvedLevels = levels.length > 0 || !applyDefaults ? levels : [...defaults.levels];
  return {
    institutionType: type,
    units: units.length > 0 || !applyDefaults ? units : [...defaults.units],
    levels: resolvedLevels,
    yearsOfStudy: type === 'college' ? resolvedLevels : [],
    programs: programs.length > 0 || !applyDefaults ? programs : [...defaults.programs],
    sections: sections.length > 0 || !applyDefaults ? sections : [...defaults.sections],
    terms: normalizeTerms(input.terms, type, applyDefaults),
  };
}

export interface StructureRecordFields {
  institutionType: InstitutionType;
  departments: string[];
  academicYears: string[];
  yearsOfStudy: string[];
  courses: string[];
  sections: string[];
}

export function structureToRecordFields(structure: NormalizedStructure): StructureRecordFields {
  const isSchool = structure.institutionType === 'school';
  return {
    institutionType: structure.institutionType,
    departments: structure.units,
    academicYears: isSchool ? structure.levels : [],
    yearsOfStudy: isSchool ? [] : structure.yearsOfStudy,
    courses: isSchool ? [] : structure.programs,
    sections: structure.sections,
  };
}

export interface InstitutionStructureSource {
  institutionType?: string | null;
  departments?: unknown;
  academicYears?: unknown;
  yearsOfStudy?: unknown;
  courses?: unknown;
  sections?: unknown;
  terms?: unknown;
}

export function structureFromRecord(inst: InstitutionStructureSource): NormalizedStructure {
  const yearsOfStudy = Array.isArray(inst?.yearsOfStudy) ? (inst.yearsOfStudy as string[]) : [];
  const academicYears = Array.isArray(inst?.academicYears) ? (inst.academicYears as string[]) : [];
  return normalizeStructure(
    {
      institutionType: inst?.institutionType,
      departments: Array.isArray(inst?.departments) ? (inst.departments as string[]) : [],
      yearsOfStudy,
      // Legacy fallback only when the new column is empty.
      academicYears: yearsOfStudy.length > 0 ? [] : academicYears,
      courses: Array.isArray(inst?.courses) ? (inst.courses as string[]) : [],
      sections: Array.isArray(inst?.sections) ? (inst.sections as string[]) : [],
      terms: Array.isArray(inst?.terms) ? (inst.terms as TermEntry[]) : [],
    },
    { applyDefaults: false }
  );
}

export interface DisplayStructure {
  institutionType: InstitutionType;
  labels: StructureLabels;
  units: string[];
  levels: string[];
  programs: string[];
  sections: string[];
  terms: TermEntry[];
  /** Convenience aliases so UI code can read the type-appropriate name. */
  subjects: string[];
  classes: string[];
  departments: string[];
  years: string[];
  sectionLetters: string[];
}

export function toDisplayStructure(inst: InstitutionStructureSource): DisplayStructure {
  const structure = structureFromRecord(inst);
  const labels = STRUCTURE_LABELS[structure.institutionType];
  return {
    institutionType: structure.institutionType,
    labels,
    units: structure.units,
    levels: structure.levels,
    programs: structure.programs,
    sections: structure.sections,
    terms: structure.terms,
    subjects: structure.institutionType === 'school' ? structure.units : [],
    classes: structure.institutionType === 'school' ? structure.levels : [],
    departments: structure.institutionType === 'college' ? structure.units : [],
    years: structure.institutionType === 'college' ? structure.levels : [],
    sectionLetters: structure.sections,
  };
}

/**
 * Builds the storage fields for one class_sections row.
 *
 * school  ("Class 10", "A")        -> name "Class 10 A", department "Class 10",
 *                                     academicYear "A", section "A"
 * college ("CSE", "2nd Year", "B") -> name "CSE 2nd Year B", department "CSE",
 *                                     academicYear "2nd Year", section "B"
 */
export function buildClassSectionFields(
  type: InstitutionType | string | null | undefined,
  level: string,
  section: string,
  unit = ''
) {
  const kind = normalizeInstitutionType(type);
  const lvl = String(level || '').trim();
  const sec = String(section || '').trim();
  const org = String(unit || '').trim();

  if (kind === 'school') {
    return {
      name: [lvl, sec].filter(Boolean).join(' '),
      department: lvl,
      academicYear: sec,
      section: sec,
    };
  }
  return {
    name: [org, lvl, sec].filter(Boolean).join(' '),
    department: org,
    academicYear: lvl,
    section: sec,
  };
}

/** The class/level held by a class_sections row (school: department, college: academicYear). */
export function classSectionLevel(
  type: InstitutionType | string | null | undefined,
  row: { department?: string | null; academicYear?: string | null }
): string {
  return normalizeInstitutionType(type) === 'school'
    ? String(row?.department || '').trim()
    : String(row?.academicYear || '').trim();
}

/**
 * Read-time repair for school class_sections rows created by the old
 * Academics screen (it stored Stream/Subject in `department` and the class in
 * `academicYear`). Only rewrites the in-memory row; a backfill script persists
 * the correction.
 */
export function adaptLegacySchoolClassSection<T extends {
  name?: string | null;
  department?: string | null;
  academicYear?: string | null;
  section?: string | null;
}>(inst: InstitutionStructureSource, row: T): T {
  if (normalizeInstitutionType(inst?.institutionType) !== 'school') return row;

  const units = Array.isArray(inst?.departments) ? (inst.departments as string[]) : [];
  const levels = Array.isArray(inst?.academicYears) ? (inst.academicYears as string[]) : [];
  const department = String(row?.department || '').trim();
  const academicYear = String(row?.academicYear || '').trim();
  if (!department || !academicYear) return row;

  const lower = (v: string) => v.toLowerCase();
  const departmentIsUnit = units.some((u) => lower(String(u)) === lower(department));
  const yearIsLevel = levels.some((l) => lower(String(l)) === lower(academicYear));
  if (!departmentIsUnit || !yearIsLevel) return row;

  const section = String(row?.section || '').trim();
  return {
    ...row,
    department: academicYear,
    academicYear: section,
  };
}

/** True when a school row still uses the legacy (subject, class) ordering. */
export function isLegacySchoolClassSection(
  inst: InstitutionStructureSource,
  row: { department?: string | null; academicYear?: string | null }
): boolean {
  if (normalizeInstitutionType(inst?.institutionType) !== 'school') return false;
  const units = Array.isArray(inst?.departments) ? (inst.departments as string[]) : [];
  const levels = Array.isArray(inst?.academicYears) ? (inst.academicYears as string[]) : [];
  const department = String(row?.department || '').trim().toLowerCase();
  const academicYear = String(row?.academicYear || '').trim().toLowerCase();
  return (
    units.some((u) => String(u).trim().toLowerCase() === department) &&
    levels.some((l) => String(l).trim().toLowerCase() === academicYear)
  );
}
