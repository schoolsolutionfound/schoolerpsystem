import { db } from '../shared/db/index.js';
import { classSections } from '../shared/db/schema.js';
import { eq } from 'drizzle-orm';
import { institutionRepository, IInstitutionRepository } from './institution.repository.js';
import { CreateInstitutionInput, UpdateInstitutionInput } from './institution.schema.js';

function newCsId(): string {
  return `cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function seedClassSectionsForInstitution(
  institutionCode: string,
  institutionType: 'school' | 'college',
  departments: string[],
  academicYears: string[],
  courses: string[]
): Promise<number> {
  if (!departments.length) return 0;

  const sections = (academicYears || []).map((s) => String(s).trim()).filter(Boolean);
  const deptList = departments.map((d) => String(d).trim()).filter(Boolean);
  const yearList = (institutionType === 'college' ? (courses || []) : (academicYears || []))
    .map((y) => String(y).trim())
    .filter(Boolean);

  const rows: { id: string; institutionCode: string; name: string; department: string; academicYear: string; section: string; classTeacherId: string }[] = [];

  if (institutionType === 'school') {
    for (const klass of deptList) {
      if (sections.length === 0) {
        rows.push({
          id: newCsId(),
          institutionCode,
          name: klass,
          department: klass,
          academicYear: '',
          section: '',
          classTeacherId: '',
        });
      } else {
        for (const sec of sections) {
          rows.push({
            id: newCsId(),
            institutionCode,
            name: `${klass} ${sec}`,
            department: klass,
            academicYear: sec,
            section: sec,
            classTeacherId: '',
          });
        }
      }
    }
  } else {
    for (const dept of deptList) {
      for (const year of yearList) {
        if (sections.length === 0) {
          rows.push({
            id: newCsId(),
            institutionCode,
            name: `${dept} ${year}`,
            department: dept,
            academicYear: year,
            section: '',
            classTeacherId: '',
          });
        } else {
          for (const sec of sections) {
            rows.push({
              id: newCsId(),
              institutionCode,
              name: `${dept} ${year} ${sec}`,
              department: dept,
              academicYear: year,
              section: sec,
              classTeacherId: '',
            });
          }
        }
      }
    }
  }

  if (rows.length === 0) return 0;

  if (!db) {
    // In-memory dev mode has no DB; nothing to seed here.
    return 0;
  }

  try {
    // Skip rows that already exist (by institutionCode+name) to keep this idempotent.
    const existing = await db
      .select({ name: classSections.name })
      .from(classSections)
      .where(eq(classSections.institutionCode, institutionCode));
    const existingNames = new Set(existing.map((r) => r.name));
    const toInsert = rows.filter((r) => !existingNames.has(r.name));
    if (toInsert.length === 0) return 0;
    await db.insert(classSections).values(toInsert).onConflictDoNothing();
    return toInsert.length;
  } catch (err: any) {
    // If the DB is unavailable (in-memory dev mode) the createInstitution still succeeds.
    console.warn('[Institution Seed Warning] could not seed class_sections:', err?.message);
    return 0;
  }
}

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

    const created = await this.repo.create({
      institutionCode: input.institutionCode.toUpperCase().trim(),
      institutionName: input.institutionName.trim(),
      institutionType: input.institutionType || 'college',
      subscriptionStatus: input.subscriptionStatus || 'active',
      departments: input.departments ?? [],
      academicYears: input.academicYears ?? [],
      courses: input.courses ?? [],
    });

    // Auto-create class_sections rows from the class/year/section arrays.
    const seededCount = await seedClassSectionsForInstitution(
      created.institutionCode,
      (created.institutionType as 'school' | 'college') || 'college',
      created.departments || [],
      created.academicYears || [],
      created.courses || []
    );

    return { ...created, seededClassSections: seededCount };
  }

  public async getInstitutions() {
    return this.repo.findAll();
  }

  public async getInstitutionByCode(code: string) {
    return this.repo.findByCode(code);
  }

  public async getInstitutionById(id: string) {
    const item = await this.repo.findById(id);
    if (!item) {
      throw {
        statusCode: 404,
        code: 'INSTITUTION_NOT_FOUND',
        message: `Institution with ID "${id}" was not found.`,
      };
    }
    return item;
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

    const updated = await this.repo.update(id, input);
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

    await this.repo.delete(id);
    return { message: 'Institution deleted successfully' };
  }
}

export const institutionService = new InstitutionService();
