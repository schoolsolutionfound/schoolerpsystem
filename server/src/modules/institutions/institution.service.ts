import { db } from '../shared/db/index.js';
import {
  dbCountClassSectionsByInstitution,
  dbCountSubjectsByInstitution,
  dbCountUsersByInstitution,
  dbFindUsersByInstitution,
  dbUpdateUser,
} from '../shared/db/index.js';
import { classSections, subjects, users as usersTable } from '../shared/db/schema.js';
import { eq } from 'drizzle-orm';
import {
  institutionRepository,
  IInstitutionRepository,
  InstitutionListOptions,
  InstitutionPage,
  InstitutionStatusBreakdown,
} from './institution.repository.js';
import { CreateInstitutionInput, UpdateInstitutionInput } from './institution.schema.js';
import {
  normalizeStructure,
  structureFromRecord,
  structureToRecordFields,
  buildClassSectionFields,
  type NormalizedStructure,
  type InstitutionType,
} from '../shared/academicStructure.js';
import {
  isConfigurableRole,
  RoleProfileFieldsSchema,
  type ConfigurableRole,
  type ProfileFieldsMap,
  type ProfileFormField,
} from '../admin/profileFields.schema.js';

function newCsId(): string {
  return `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function newSubjectId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Creates class_sections rows for an institution structure. Idempotent: rows
 * that already exist (by institutionCode+name) are skipped. This is the ONLY
 * place that turns (type, units, levels, sections) into class_sections rows, so
 * create/update/backfill all agree on the storage convention.
 */
async function seedClassSectionsForInstitution(
  institutionCode: string,
  structure: NormalizedStructure
): Promise<number> {
  const { institutionType: type, units, levels, sections } = structure;
  const rows: {
    id: string;
    institutionCode: string;
    name: string;
    department: string;
    academicYear: string;
    section: string;
    classTeacherId: string;
  }[] = [];

  if (type === 'school') {
    for (const level of levels) {
      const sectionList = sections.length > 0 ? sections : [''];
      for (const section of sectionList) {
        const fields = buildClassSectionFields(type, level, section);
        rows.push({ id: newCsId(), institutionCode, ...fields, classTeacherId: '' });
      }
    }
  } else {
    if (units.length === 0 || levels.length === 0) return 0;
    for (const unit of units) {
      for (const level of levels) {
        const sectionList = sections.length > 0 ? sections : [''];
        for (const section of sectionList) {
          const fields = buildClassSectionFields(type, level, section, unit);
          rows.push({ id: newCsId(), institutionCode, ...fields, classTeacherId: '' });
        }
      }
    }
  }

  if (rows.length === 0) return 0;
  if (!db) return 0;

  try {
    const existing = await db
      .select({ name: classSections.name })
      .from(classSections)
      .where(eq(classSections.institutionCode, institutionCode));
    const existingNames = new Set(existing.map((r) => r.name));
    const byName = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (!existingNames.has(row.name) && !byName.has(row.name)) byName.set(row.name, row);
    }
    const toInsert = Array.from(byName.values());
    if (toInsert.length === 0) return 0;
    await db.insert(classSections).values(toInsert).onConflictDoNothing();
    return toInsert.length;
  } catch (err: any) {
    // If the DB is unavailable (in-memory dev mode) the createInstitution still succeeds.
    console.warn('[Institution Seed Warning] could not seed class_sections:', err?.message);
    return 0;
  }
}

/**
 * Schools keep their subject catalogue in `institutions.departments`; the
 * Academics module reads the `subjects` table. Mirror the catalogue so the two
 * stay consistent. Colleges manage subjects explicitly and are not synced.
 */
async function syncSchoolSubjects(institutionCode: string, structure: NormalizedStructure): Promise<void> {
  if (structure.institutionType !== 'school' || !db) return;
  const names = structure.units.filter(Boolean);
  if (names.length === 0) return;
  try {
    const existing = await db
      .select({ name: subjects.name })
      .from(subjects)
      .where(eq(subjects.institutionCode, institutionCode));
    const seen = new Set(existing.map((r) => r.name.toLowerCase()));
    const toInsert = names
      .filter((name) => !seen.has(name.toLowerCase()))
      .map((name) => ({ id: newSubjectId(), institutionCode, name, code: '' }));
    if (toInsert.length > 0) {
      await db.insert(subjects).values(toInsert).onConflictDoNothing();
    }
  } catch (err: any) {
    console.warn('[Institution Subject Sync Warning] could not sync subjects:', err?.message);
  }
}

/**
 * Explicit school <-> college conversion: remaps the type-specific role
 * (principal <-> hod) and stamps every institution user with the new type.
 */
async function remapUsersForTypeChange(institutionCode: string, nextType: InstitutionType): Promise<void> {
  // Principal is valid for both types; HOD exists only in colleges. Converting
  // a college to a school therefore demotes HODs to Principal, while
  // school -> college keeps existing principals as-is.
  if (nextType === 'school') {
    const affected = await dbFindUsersByInstitution(institutionCode, 'hod', { limit: 1000 });
    for (const user of affected) {
      await dbUpdateUser(user.id, { role: 'principal' });
    }
  }
  if (db) {
    await db.update(usersTable).set({ institutionType: nextType }).where(eq(usersTable.institutionCode, institutionCode));
    return;
  }
  const allUsers = await dbFindUsersByInstitution(institutionCode, undefined, { limit: 1000 });
  for (const user of allUsers) {
    await dbUpdateUser(user.id, { institutionType: nextType });
  }
}

type StripPasswordField<T> = T extends null | undefined ? T : Omit<T, 'defaultTempPassword'>;

/**
 * API-response sanitizer: strips the institution's default temp password so it
 * can never leave the server through list/detail/create/update responses.
 * Internal service callers keep using the raw repo rows.
 */
export function toPublicInstitution<T extends object | null | undefined>(row: T): StripPasswordField<T> {
  if (!row) return row as StripPasswordField<T>;
  const { defaultTempPassword, ...rest } = row as Record<string, unknown>;
  return rest as StripPasswordField<T>;
}

const SCHOOL_METADATA: Record<string, any> = {
  TST001: {
    averageRating: 4.8,
    totalReviews: 142,
    logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
    description: 'Greenfield International is a premier CBSE institution offering world-class academics, vibrant sports programs, and robotics labs from Kindergarten through Grade 12.',
    facilities: ['Smart Classrooms', 'Olympic Swimming Pool', 'Robotics & AI Lab', 'Basketball & Cricket Turf', 'AC Transport'],
  },
  OAK002: {
    averageRating: 4.9,
    totalReviews: 98,
    logoUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&auto=format&fit=crop&q=80',
    description: 'An authorized IB World School fostering inquisitive young minds through experiential global curricula, performing arts, and international exchange opportunities.',
    facilities: ['IB Curriculum', 'Auditorium & Amphitheater', 'Indoor Badminton Court', 'Organic Cafeteria', 'Day Boarding'],
  },
  DPS003: {
    averageRating: 4.7,
    totalReviews: 215,
    logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80',
    description: 'Excellence in education since 1995. Emphasizing disciplined learning, national competitive exam prep (JEE/NEET), and leadership skills.',
    facilities: ['Science Innovation Park', 'Digital Library', 'Hostel Facilities', 'Football Ground', 'Medical Center'],
  },
  STX004: {
    averageRating: 4.6,
    totalReviews: 180,
    logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80',
    description: 'Holistic character building and ICSE curriculum with century-old heritage, distinguished alumni, and championship athletics.',
    facilities: ['Heritage Campus', 'Music Conservatory', 'Tennis Courts', 'Chapel & Meditation Hall'],
  },
  HCS005: {
    averageRating: 4.9,
    totalReviews: 165,
    logoUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80',
    description: 'Global benchmark education offering Cambridge IGCSE and A-Levels with modern STEAM research centers, equestrian training, and dual-language immersion.',
    facilities: ['Cambridge IGCSE & A-Levels', 'STEAM Research Hub', 'Horse Riding Academy', 'All-Weather Athletics Track'],
  },
  LEM006: {
    averageRating: 4.8,
    totalReviews: 88,
    logoUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
    description: 'Nurturing discovery-based learning from Toddlers to Grade 5 with authentic Montessori apparatus, organic kitchen garden, and child-centric creative studios.',
    facilities: ['Montessori Apparatus Labs', 'Child Splash Pool', 'Sensory Discovery Garden', 'Day Care & Nutritionist'],
  },
};

function enrichInstitution(inst: any) {
  if (!inst) return inst;
  const meta = SCHOOL_METADATA[inst.institutionCode] || SCHOOL_METADATA[inst.id] || {
    averageRating: 4.5,
    totalReviews: 50,
    logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
    description: `${inst.institutionName} provides comprehensive education with modern infrastructure and student-centered curriculum.`,
    facilities: ['Smart Classrooms', 'Library', 'Science Lab', 'Sports Ground'],
  };
  return { ...meta, ...inst };
}

const STRUCTURE_KEYS = [
  'subjects',
  'classes',
  'programs',
  'departments',
  'academicYears',
  'yearsOfStudy',
  'courses',
  'sections',
] as const;

export class InstitutionService {
  constructor(private repo: IInstitutionRepository = institutionRepository) {}

  public async createInstitution(input: CreateInstitutionInput) {
    const existing = await this.repo.findByCode(input.institutionCode);
    if (existing) {
      throw {
        statusCode: 409,
        code: 'INSTITUTION_CODE_EXISTS',
        message: `An institution with code "${input.institutionCode}" already exists.`,
      };
    }

    // Empty forms fall back to the per-type defaults instead of leaving the
    // institution with `[]` (which used to bypass the admin defaults because
    // an empty array is truthy).
    const structure = normalizeStructure(input, { applyDefaults: true });

    const created = await this.repo.create({
      institutionCode: input.institutionCode.toUpperCase().trim(),
      institutionName: input.institutionName.trim(),
      subscriptionStatus: input.subscriptionStatus || 'active',
      terms: input.terms ?? structure.terms,
      blockedDates: input.blockedDates ?? [],
      ...structureToRecordFields(structure),
    });

    // Auto-create class_sections rows from the structure arrays.
    const seededCount = await seedClassSectionsForInstitution(created.institutionCode, structure);
    await syncSchoolSubjects(created.institutionCode, structure);

    return { ...created, seededClassSections: seededCount };
  }

  public async getInstitutions() {
    const list = await this.repo.findAll();
    return list.map(enrichInstitution);
  }

  /**
   * Paginated, filterable institution listing. `total` always reflects the full
   * matching set, not just the returned page.
   */
  public async listInstitutions(
    opts: {
      search?: string;
      type?: string;
      status?: string;
      sort?: InstitutionListOptions['sort'];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<InstitutionPage> {
    const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500);
    const offset = Math.max(opts.offset ?? 0, 0);
    return this.repo.findPage({
      search: opts.search,
      type: opts.type,
      status: opts.status,
      sort: opts.sort,
      limit,
      offset,
    });
  }

  public async getInstitutionByCode(code: string) {
    const item = await this.repo.findByCode(code);
    return item ? enrichInstitution(item) : undefined;
  }

  /**
   * Per-role profile form fields configured by the admin (Settings → Form
   * Fields). Only known, configurable roles survive parsing; anything else
   * (e.g. admin/dev leftovers) is dropped.
   */
  public async getProfileFormFieldsMap(institutionCode: string): Promise<ProfileFieldsMap> {
    const inst = await this.getInstitutionByCode(institutionCode || '');
    const raw = (inst as any)?.profileFormFields;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

    const map: ProfileFieldsMap = {};
    for (const [role, fields] of Object.entries(raw as Record<string, any>)) {
      if (!isConfigurableRole(role) || !Array.isArray(fields)) continue;
      const parsed = RoleProfileFieldsSchema.safeParse(fields);
      if (parsed.success) map[role as ConfigurableRole] = parsed.data;
    }
    return map;
  }

  /** Fields configured for one role (empty array when none / non-configurable). */
  public async getRoleProfileFormFields(institutionCode: string, role: string): Promise<ProfileFormField[]> {
    if (!isConfigurableRole(role)) return [];
    const map = await this.getProfileFormFieldsMap(institutionCode);
    return map[role as ConfigurableRole] || [];
  }

  public async getInstitutionsByCodes(codes: string[]) {
    return this.repo.findByCodes(codes);
  }

  public async getStatusBreakdown(): Promise<InstitutionStatusBreakdown> {
    return this.repo.statusBreakdown();
  }

  public async getInstitutionById(id: string) {
    let item = await this.repo.findById(id);
    if (!item) {
      item = await this.repo.findByCode(id);
    }
    if (!item) {
      throw {
        statusCode: 404,
        code: 'INSTITUTION_NOT_FOUND',
        message: `Institution with ID "${id}" was not found.`,
      };
    }
    return enrichInstitution(item);
  }

  public async updateInstitution(id: string, input: UpdateInstitutionInput) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw {
        statusCode: 404,
        code: 'INSTITUTION_NOT_FOUND',
        message: `Institution with ID "${id}" was not found.`,
      };
    }

    const currentType = existing.institutionType as InstitutionType;
    const nextType = (input.institutionType || currentType) as InstitutionType;
    const typeChanged = nextType !== currentType;
    const explicitStructure = STRUCTURE_KEYS.some((key) => (input as any)[key] !== undefined);

    if (typeChanged) {
      const [userCount, classSectionCount, subjectCount] = await Promise.all([
        dbCountUsersByInstitution(existing.institutionCode),
        dbCountClassSectionsByInstitution(existing.institutionCode),
        dbCountSubjectsByInstitution(existing.institutionCode),
      ]);
      const hasData = userCount > 0 || classSectionCount > 0 || subjectCount > 0;
      if (hasData && !input.convert) {
        throw {
          statusCode: 409,
          code: 'TYPE_CHANGE_REQUIRES_CONVERSION',
          message:
            'This institution already has users/classes/subjects. Send "convert: true" to explicitly convert it; roles and structure will be re-seeded.',
        };
      }
      if (input.convert) {
        await remapUsersForTypeChange(existing.institutionCode, nextType);
      }
    }

    const base = structureFromRecord(existing);
    const units = (input as any).subjects ?? (input as any).departments ?? base.units;
    const levels =
      nextType === 'school'
        ? (input as any).classes ?? (input as any).academicYears ?? base.levels
        : (input as any).yearsOfStudy ?? (input as any).academicYears ?? base.levels;
    const programs = (input as any).programs ?? (input as any).courses ?? base.programs;
    const sections = input.sections ?? base.sections;
    const terms = input.terms ?? base.terms;

    const structure = normalizeStructure(
      typeChanged && !explicitStructure
        ? { institutionType: nextType }
        : {
            institutionType: nextType,
            subjects: nextType === 'school' ? units : undefined,
            classes: nextType === 'school' ? levels : undefined,
            departments: nextType === 'college' ? units : undefined,
            yearsOfStudy: nextType === 'college' ? levels : undefined,
            academicYears: nextType === 'school' ? levels : undefined,
            programs: nextType === 'college' ? programs : [],
            sections,
            terms,
          },
      { applyDefaults: typeChanged && !explicitStructure }
    );

    const {
      convert: _convert,
      subjects: _subjects,
      classes: _classes,
      programs: _programs,
      yearsOfStudy: _yearsOfStudy,
      ...rest
    } = input;
    const updateData: Record<string, any> = { ...rest };
    if (typeChanged || explicitStructure) {
      Object.assign(updateData, structureToRecordFields(structure));
      if (input.terms === undefined && typeChanged && !explicitStructure) updateData.terms = structure.terms;
    }
    // Never persist the alias fields themselves.
    delete updateData.subjects;
    delete updateData.classes;
    delete updateData.programs;

    const updated = await this.repo.update(id, updateData);
    if (updated && (typeChanged || explicitStructure)) {
      await seedClassSectionsForInstitution(updated.institutionCode, structure);
      await syncSchoolSubjects(updated.institutionCode, structure);
    }
    return updated;
  }

  public async deleteInstitution(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw {
        statusCode: 404,
        code: 'INSTITUTION_NOT_FOUND',
        message: `Institution with ID "${id}" was not found.`,
      };
    }

    const [userCount, classSectionCount, subjectCount] = await Promise.all([
      dbCountUsersByInstitution(existing.institutionCode),
      dbCountClassSectionsByInstitution(existing.institutionCode),
      dbCountSubjectsByInstitution(existing.institutionCode),
    ]);
    if (userCount > 0 || classSectionCount > 0 || subjectCount > 0) {
      throw {
        statusCode: 409,
        code: 'INSTITUTION_HAS_DATA',
        message:
          `Cannot delete "${existing.institutionCode}": it still has ${userCount} user(s), ` +
          `${classSectionCount} class section(s) and ${subjectCount} subject(s). Remove or reassign them first.`,
      };
    }

    await this.repo.delete(id);
    return { message: 'Institution deleted successfully' };
  }
}

export const institutionService = new InstitutionService();
