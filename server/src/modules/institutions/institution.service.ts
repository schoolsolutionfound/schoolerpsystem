import { db } from '../shared/db/index.js';
import {
  dbCountClassSectionsByInstitution,
  dbCountSubjectsByInstitution,
  dbCountUsersByInstitution,
  dbFindUsersByInstitution,
  dbUpdateUser,
} from '../shared/db/index.js';
import { classSections, institutions, subjects, studentClasses, subjectTeachers, users as usersTable } from '../shared/db/schema.js';
import { and, eq, inArray } from 'drizzle-orm';
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
  uniqueStrings,
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
  structure: NormalizedStructure,
  executor: any = db,
  strict = false
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
  if (!executor) return 0;

  try {
    const existing = await executor
      .select({ name: classSections.name })
      .from(classSections)
      .where(eq(classSections.institutionCode, institutionCode));
    const existingNames = new Set(existing.map((r: any) => r.name));
    const byName = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (!existingNames.has(row.name) && !byName.has(row.name)) byName.set(row.name, row);
    }
    const toInsert = Array.from(byName.values());
    if (toInsert.length === 0) return 0;
    await executor.insert(classSections).values(toInsert).onConflictDoNothing();
    return toInsert.length;
  } catch (err: any) {
    // Inside a conversion transaction a failure must abort, not be swallowed.
    if (strict) throw err;
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
async function syncSchoolSubjects(
  institutionCode: string,
  structure: NormalizedStructure,
  executor: any = db,
  strict = false
): Promise<void> {
  if (structure.institutionType !== 'school' || !executor) return;
  const names = structure.units.filter(Boolean);
  if (names.length === 0) return;
  try {
    const existing = await executor
      .select({ name: subjects.name })
      .from(subjects)
      .where(eq(subjects.institutionCode, institutionCode));
    const seen = new Set(existing.map((r: any) => r.name.toLowerCase()));
    const toInsert = names
      .filter((name) => !seen.has(name.toLowerCase()))
      .map((name) => ({ id: newSubjectId(), institutionCode, name, code: '' }));
    if (toInsert.length > 0) {
      await executor.insert(subjects).values(toInsert).onConflictDoNothing();
    }
  } catch (err: any) {
    if (strict) throw err;
    console.warn('[Institution Subject Sync Warning] could not sync subjects:', err?.message);
  }
}

/**
 * The class_sections row names a structure implies. Mirrors
 * seedClassSectionsForInstitution so an update can diff the stored rows
 * against the new configuration.
 */
function impliedClassSectionNames(structure: NormalizedStructure): string[] {
  const { institutionType: type, units, levels, sections } = structure;
  const names = new Set<string>();
  if (type === 'school') {
    for (const level of levels) {
      for (const section of sections.length > 0 ? sections : ['']) {
        names.add(buildClassSectionFields(type, level, section).name);
      }
    }
    return Array.from(names);
  }
  for (const unit of units) {
    for (const level of levels) {
      for (const section of sections.length > 0 ? sections : ['']) {
        names.add(buildClassSectionFields(type, level, section, unit).name);
      }
    }
  }
  return Array.from(names);
}

function structureRemoveBlocked(institutionCode: string, detail: string) {
  return {
    statusCode: 409,
    code: 'STRUCTURE_CHANGE_BLOCKED',
    message:
      `Cannot remove ${detail} from "${institutionCode}": existing records still reference ` +
      'them. Move or clear those records first, then save the structure.',
  };
}

/**
 * Deletes the class_sections (and, for schools, subject) rows the new
 * configuration no longer contains. Enrollment and teacher-assignment links
 * cascade silently in the schema, so they are refused instead of being
 * dropped as a side effect of editing the class list. Other restricted
 * references (timetable, marks, fees, ...) abort the transaction with
 * 23001/23503 and surface as a clean 409 at the call site.
 */
async function removeStaleStructureRows(
  tx: any,
  institutionCode: string,
  previous: NormalizedStructure,
  next: NormalizedStructure
): Promise<void> {
  const nextNames = new Set(impliedClassSectionNames(next));
  const nextLevels = new Set(next.levels);
  const staleNames = new Set<string>();
  for (const name of impliedClassSectionNames(previous)) {
    if (!nextNames.has(name)) staleNames.add(name);
  }
  // The admin editor stores the full class-section name (e.g. "Class 1 A") as
  // the level, so a removed level is itself a row name even when the
  // level × section expansion does not reproduce it.
  for (const level of previous.levels) {
    if (!nextLevels.has(level)) staleNames.add(level);
  }
  const staleList = Array.from(staleNames);

  if (staleList.length > 0) {
    const staleRows: { id: string }[] = await tx
      .select({ id: classSections.id })
      .from(classSections)
      .where(and(eq(classSections.institutionCode, institutionCode), inArray(classSections.name, staleList)));
    const staleIds = staleRows.map((row) => row.id);

    if (staleIds.length > 0) {
      const [enrollments, assignments] = await Promise.all([
        tx
          .select({ id: studentClasses.id })
          .from(studentClasses)
          .where(
            and(
              eq(studentClasses.institutionCode, institutionCode),
              inArray(studentClasses.classSectionId, staleIds)
            )
          ),
        tx
          .select({ id: subjectTeachers.id })
          .from(subjectTeachers)
          .where(
            and(
              eq(subjectTeachers.institutionCode, institutionCode),
              inArray(subjectTeachers.classSectionId, staleIds)
            )
          ),
      ]);
      if (enrollments.length > 0 || assignments.length > 0) {
        throw structureRemoveBlocked(institutionCode, 'the selected classes/sections');
      }
      await tx
        .delete(classSections)
        .where(and(eq(classSections.institutionCode, institutionCode), inArray(classSections.id, staleIds)));
    }
  }

  // College `subjects` are course subjects managed elsewhere, not departments,
  // so only schools mirror their subject catalogue into the subjects table.
  if (next.institutionType !== 'school') return;
  const nextUnits = new Set(next.units.map((unit) => unit.toLowerCase()));
  const removedSubjects = previous.units.filter((unit) => !nextUnits.has(unit.toLowerCase()));
  if (removedSubjects.length === 0) return;

  const staleSubjectRows: { id: string }[] = await tx
    .select({ id: subjects.id })
    .from(subjects)
    .where(and(eq(subjects.institutionCode, institutionCode), inArray(subjects.name, removedSubjects)));
  const staleSubjectIds = staleSubjectRows.map((row) => row.id);
  if (staleSubjectIds.length === 0) return;

  const subjectAssignments = await tx
    .select({ id: subjectTeachers.id })
    .from(subjectTeachers)
    .where(
      and(
        eq(subjectTeachers.institutionCode, institutionCode),
        inArray(subjectTeachers.subjectId, staleSubjectIds)
      )
    );
  if (subjectAssignments.length > 0) {
    throw structureRemoveBlocked(institutionCode, 'the selected subjects');
  }
  await tx
    .delete(subjects)
    .where(and(eq(subjects.institutionCode, institutionCode), inArray(subjects.id, staleSubjectIds)));
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

function enrichInstitution(inst: any) {
  return inst;
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
    // Normalize once so duplicate detection and the insert agree (a code
    // arriving with padding/spaces used to bypass the check and 500 on the
    // unique constraint instead of returning a clean 409).
    const institutionCode = input.institutionCode.toUpperCase().trim();
    const existing = await this.repo.findByCode(institutionCode);
    if (existing) {
      throw {
        statusCode: 409,
        code: 'INSTITUTION_CODE_EXISTS',
        message: `An institution with code "${institutionCode}" already exists.`,
      };
    }

    // Persist exactly what the caller supplies. No structure is invented here:
    // an empty form creates an institution with no subjects/classes/sections.
    const structure = normalizeStructure(input);

    const created = await this.repo.create({
      institutionCode,
      institutionName: input.institutionName.trim(),
      subscriptionStatus: input.subscriptionStatus || 'active',
      terms: structure.terms,
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
    const clearStructure = input.clearStructure === true;
    const explicitStructure =
      clearStructure || STRUCTURE_KEYS.some((key) => (input as any)[key] !== undefined);

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

    // The alias that belongs to the selected type is authoritative. Editors
    // submit every alias, sending `[]` for the ones that do not apply; those
    // empty foreign aliases must never override the stored dimension. An
    // all-empty alias set only clears a dimension when the caller opts in via
    // `clearStructure`; otherwise the stored value is kept.
    const pickAlias = (...candidates: unknown[]): string[] | undefined => {
      const supplied = candidates.filter((candidate) => candidate !== undefined);
      if (supplied.length === 0) return undefined;
      for (const candidate of supplied) {
        const values = uniqueStrings(candidate);
        if (values.length > 0) return values;
      }
      return clearStructure ? [] : undefined;
    };
    const base = structureFromRecord(existing);
    const units =
      (nextType === 'school'
        ? pickAlias((input as any).subjects, (input as any).departments)
        : pickAlias((input as any).departments, (input as any).subjects)) ?? base.units;
    const levels =
      (nextType === 'school'
        ? pickAlias((input as any).classes, (input as any).academicYears)
        : pickAlias((input as any).yearsOfStudy, (input as any).academicYears, (input as any).classes)) ??
      base.levels;
    const programs =
      nextType === 'school'
        ? []
        : pickAlias((input as any).programs, (input as any).courses) ?? base.programs;
    const sections = pickAlias(input.sections) ?? base.sections;
    const terms = input.terms ?? base.terms;

    const structure = normalizeStructure({
      institutionType: nextType,
      subjects: nextType === 'school' ? units : undefined,
      classes: nextType === 'school' ? levels : undefined,
      departments: nextType === 'college' ? units : undefined,
      yearsOfStudy: nextType === 'college' ? levels : undefined,
      academicYears: nextType === 'school' ? levels : undefined,
      programs: nextType === 'college' ? programs : [],
      sections,
      terms,
    });

    const {
      convert: _convert,
      clearStructure: _clearStructure,
      subjects: _subjects,
      classes: _classes,
      programs: _programs,
      yearsOfStudy: _yearsOfStudy,
      ...rest
    } = input;
    const updateData: Record<string, any> = { ...rest };
    if (typeChanged || explicitStructure) {
      Object.assign(updateData, structureToRecordFields(structure));
    }
    // Never persist the alias fields themselves.
    delete updateData.subjects;
    delete updateData.classes;
    delete updateData.programs;

    if (!db || !(typeChanged || explicitStructure)) {
      const updated = await this.repo.update(id, updateData);
      if (updated && (typeChanged || explicitStructure)) {
        await seedClassSectionsForInstitution(updated.institutionCode, structure);
        await syncSchoolSubjects(updated.institutionCode, structure);
      }
      return updated;
    }

    try {
      return await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(institutions)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(institutions.id, id))
          .returning();
        if (!updated) return undefined;

        if (typeChanged) {
          // A conversion rebuilds the structure: rows of the previous type must
          // not linger next to the new ones.
          await tx.delete(classSections).where(eq(classSections.institutionCode, updated.institutionCode));
          await tx.delete(subjects).where(eq(subjects.institutionCode, updated.institutionCode));
        } else {
          // Same type: treat the payload as the full new set and drop only the
          // rows it no longer contains.
          await removeStaleStructureRows(tx, updated.institutionCode, base, structure);
        }

        await seedClassSectionsForInstitution(updated.institutionCode, structure, tx, true);
        await syncSchoolSubjects(updated.institutionCode, structure, tx, true);
        return updated;
      });
    } catch (err: any) {
      // RESTRICT raises 23001; NO ACTION raises 23503.
      if (err?.code === '23001' || err?.code === '23503') {
        if (typeChanged) {
          throw {
            statusCode: 409,
            code: 'TYPE_CHANGE_BLOCKED',
            message:
              `Cannot convert "${existing.institutionCode}": existing records reference the old ` +
              'structure. Clear them first, then convert.',
          };
        }
        throw {
          statusCode: 409,
          code: 'STRUCTURE_CHANGE_BLOCKED',
          message:
            `Cannot remove the selected classes/sections/subjects from "${existing.institutionCode}": ` +
            'existing records reference them. Move or clear those records first.',
        };
      }
      throw err;
    }
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

    const userCount = await dbCountUsersByInstitution(existing.institutionCode);
    // Seeded class_sections/subjects are derived config, not user data, so they
    // must not block deletion of a never-used tenant. Any user, however, means
    // real records (attendance, fees, exams) exist and deletion is refused.
    if (userCount > 0) {
      throw {
        statusCode: 409,
        code: 'INSTITUTION_HAS_DATA',
        message:
          `Cannot delete "${existing.institutionCode}": it still has ${userCount} user(s). ` +
          'Suspend it instead to keep its records recoverable.',
      };
    }

    if (db) {
      // Atomic cleanup: drop the seeded catalogue and the institution together.
      // Cascading FKs clean up most dependents, but timetable/marks/exam/fee
      // rows are ON DELETE RESTRICT — if any survived (e.g. users were removed
      // after they were created) the transaction aborts, so report it cleanly.
      try {
        await db.transaction(async (tx) => {
          await tx.delete(classSections).where(eq(classSections.institutionCode, existing.institutionCode));
          await tx.delete(subjects).where(eq(subjects.institutionCode, existing.institutionCode));
          await tx.delete(institutions).where(eq(institutions.id, id));
        });
      } catch (err: any) {
        // RESTRICT raises 23001; NO ACTION raises 23503.
        if (err?.code === '23001' || err?.code === '23503') {
          throw {
            statusCode: 409,
            code: 'INSTITUTION_HAS_DATA',
            message:
              `Cannot delete "${existing.institutionCode}": dependent records still reference it. ` +
              'Suspend it instead to keep its records recoverable.',
          };
        }
        throw err;
      }
    } else {
      await this.repo.delete(id);
    }
    return { message: 'Institution deleted successfully' };
  }
}

export const institutionService = new InstitutionService();
