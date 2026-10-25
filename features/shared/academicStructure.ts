/**
 * Client mirror of `server/src/modules/shared/academicStructure.ts`.
 *
 * Keep the labels/defaults in sync with the server. The server remains the
 * validator; the app uses this only to render type-aware labels and to build
 * class_sections payloads consistently.
 */

export type InstitutionType = 'school' | 'college';

export const DEFAULT_INSTITUTION_TYPE: InstitutionType = 'school';

export function normalizeInstitutionType(value?: string | null): InstitutionType {
  return String(value || '').toLowerCase() === 'college' ? 'college' : 'school';
}

export interface StructureLabels {
  unit: string;
  units: string;
  level: string;
  levels: string;
  section: string;
  sections: string;
  program: string;
  programs: string;
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
    terms: 'Terms',
  },
  college: {
    unit: 'Department',
    units: 'Departments',
    level: 'Year',
    levels: 'Years of Study',
    section: 'Section',
    sections: 'Sections',
    program: 'Program',
    programs: 'Programs',
    terms: 'Terms',
  },
};

export interface StructureDefaults {
  units: string[];
  levels: string[];
  programs: string[];
  sections: string[];
  terms: TermPlanEntry[];
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
    units: ['CSE', 'ECE', 'Civil', 'Mechanical', 'AIML'],
    levels: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    programs: ['B.Tech', 'M.Tech'],
    sections: ['A', 'B'],
    terms: [{ academicYear: '2026-27', terms: ['Semester 1', 'Semester 2'] }],
  },
};

export interface RoleOption {
  key: string;
  label: string;
  icon: string;
}

export const SCHOOL_ROLE_OPTIONS: RoleOption[] = [
  { key: 'admin', label: 'Admin', icon: 'shield-account-outline' },
  { key: 'principal', label: 'Principal', icon: 'account-tie-outline' },
  { key: 'accountant', label: 'Accountant', icon: 'calculator' },
  { key: 'librarian', label: 'Librarian', icon: 'book-outline' },
  { key: 'driver', label: 'Driver', icon: 'bus' },
  { key: 'admission_officer', label: 'Admission Officer', icon: 'card-account-details-outline' },
];

export const COLLEGE_ROLE_OPTIONS: RoleOption[] = [
  { key: 'admin', label: 'Admin', icon: 'shield-account-outline' },
  { key: 'principal', label: 'Principal', icon: 'account-tie-outline' },
  { key: 'hod', label: 'HOD', icon: 'account-tie-outline' },
  { key: 'accountant', label: 'Accountant', icon: 'calculator' },
  { key: 'librarian', label: 'Librarian', icon: 'book-outline' },
  { key: 'driver', label: 'Driver', icon: 'bus' },
  { key: 'placement_officer', label: 'Placement Officer', icon: 'briefcase-outline' },
  { key: 'admission_officer', label: 'Admission Officer', icon: 'card-account-details-outline' },
];

/** Roles that may be created for an institution (superset used by developer). */
export const SCHOOL_ADMIN_ROLES = [
  'admin',
  'teacher',
  'student',
  'principal',
  'parent',
  'accountant',
  'librarian',
  'driver',
  'admission_officer',
] as const;

export const COLLEGE_ADMIN_ROLES = [
  'admin',
  'principal',
  'teacher',
  'student',
  'hod',
  'parent',
  'accountant',
  'librarian',
  'driver',
  'placement_officer',
  'admission_officer',
] as const;

export function roleOptionsForInstitutionType(
  type?: InstitutionType | string | null
): RoleOption[] {
  return normalizeInstitutionType(type) === 'school' ? SCHOOL_ROLE_OPTIONS : COLLEGE_ROLE_OPTIONS;
}

export function roleKeysForInstitutionType(type?: InstitutionType | string | null): string[] {
  return (normalizeInstitutionType(type) === 'school' ? SCHOOL_ADMIN_ROLES : COLLEGE_ADMIN_ROLES).slice();
}

export function isRoleAllowedForInstitution(
  type: InstitutionType | string | null | undefined,
  role: string
): boolean {
  return roleKeysForInstitutionType(type).includes(String(role || '').toLowerCase());
}

/**
 * Storage mapping for one class_sections row (matches the server).
 * school  ("Class 10", "A")        -> department "Class 10", academicYear "A"
 * college ("CSE", "2nd Year", "B") -> department "CSE", academicYear "2nd Year"
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

export function classSectionLevel(
  type: InstitutionType | string | null | undefined,
  row: { department?: string | null; academicYear?: string | null }
): string {
  return normalizeInstitutionType(type) === 'school'
    ? String(row?.department || '').trim()
    : String(row?.academicYear || '').trim();
}

/**
 * Type-aware level list from an institution config.
 * School: classes (academicYears). College: years of study (yearsOfStudy, with
 * a legacy fallback to academicYears for rows created before the split).
 * Academic session names like 2026-27 are NOT part of this list.
 */
export function levelsForInstitution(config: {
  institutionType?: string | null;
  academicYears?: string[] | null;
  yearsOfStudy?: string[] | null;
}): string[] {
  const academicYears = Array.isArray(config?.academicYears) ? config.academicYears : [];
  if (normalizeInstitutionType(config?.institutionType) === 'school') return academicYears;
  const yearsOfStudy = Array.isArray(config?.yearsOfStudy) ? config.yearsOfStudy : [];
  return yearsOfStudy.length > 0 ? yearsOfStudy : academicYears;
}

export interface TermPlanEntry {
  academicYear: string;
  terms: string[];
}

/**
 * Builds the terms plan from a numeric count (1–12). Schools use "Term N",
 * colleges use "Semester N" to match the seeded defaults.
 */
export function buildTerms(
  count: number | string,
  academicYear?: string | null,
  type?: InstitutionType | string | null
): TermPlanEntry[] {
  const kind = normalizeInstitutionType(type);
  const defaults = DEFAULT_STRUCTURE[kind].terms[0];
  const year = String(academicYear || defaults?.academicYear || '').trim();
  const parsed = Math.floor(Number(count));
  const total = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 12) : kind === 'college' ? 2 : 3;
  const prefix = kind === 'college' ? 'Semester' : 'Term';
  return [
    {
      academicYear: year,
      terms: Array.from({ length: total }, (_, i) => `${prefix} ${i + 1}`),
    },
  ];
}

/** Number of terms currently configured (falls back to the per-type default). */
export function termCountFromPlan(
  terms: TermPlanEntry[] | undefined | null,
  type?: InstitutionType | string | null
): number {
  const first = Array.isArray(terms) ? terms.find((t) => Array.isArray(t?.terms) && t.terms.length > 0) : undefined;
  if (first) return first.terms.length;
  return normalizeInstitutionType(type) === 'college' ? 2 : 3;
}

/** "Class 10" + "A" -> "Class 10 A" / "10" + "A" -> "10A". */
export function joinClassLabel(level: string, section: string): string {
  const lvl = String(level || '').trim();
  const sec = String(section || '').trim();
  if (!sec) return lvl;
  return /\d$/.test(lvl) ? `${lvl}${sec}` : `${lvl} ${sec}`;
}
