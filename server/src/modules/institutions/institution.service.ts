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
    const list = await this.repo.findAll();
    return list.map(enrichInstitution);
  }

  public async getInstitutionByCode(code: string) {
    const item = await this.repo.findByCode(code);
    return item ? enrichInstitution(item) : undefined;
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
