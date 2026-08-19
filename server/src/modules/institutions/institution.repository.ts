import { eq } from 'drizzle-orm';
import { db } from '../shared/db/index.js';
import { institutions, InstitutionRecord, NewInstitutionRecord } from './institution.schema.js';

export interface IInstitutionRepository {
  create(data: Partial<NewInstitutionRecord> & { institutionCode: string; institutionName: string }): Promise<InstitutionRecord>;
  findAll(): Promise<InstitutionRecord[]>;
  findById(id: string): Promise<InstitutionRecord | undefined>;
  findByCode(code: string): Promise<InstitutionRecord | undefined>;
  update(id: string, data: Partial<NewInstitutionRecord>): Promise<InstitutionRecord | undefined>;
  delete(id: string): Promise<boolean>;
}

/**
 * In-memory institution store. Used ONLY as a fallback when no Postgres is
 * configured. When Postgres is available it is the single source of truth —
 * reads are never mirrored and mutations never dual-write into this store.
 */
class InMemoryInstitutionStore {
  private store = new Map<string, InstitutionRecord>();

  public save(item: InstitutionRecord): InstitutionRecord {
    this.store.set(item.id, item);
    return item;
  }

  public getAll(): InstitutionRecord[] {
    return Array.from(this.store.values());
  }

  public getById(id: string): InstitutionRecord | undefined {
    return this.store.get(id);
  }

  public getByCode(code: string): InstitutionRecord | undefined {
    return Array.from(this.store.values()).find(
      (item) => item.institutionCode.toLowerCase() === code.toLowerCase()
    );
  }

  public update(id: string, data: Partial<InstitutionRecord>): InstitutionRecord | undefined {
    const existing = this.store.get(id);
    if (!existing) return undefined;
    const updated: InstitutionRecord = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return updated;
  }

  public delete(id: string): boolean {
    return this.store.delete(id);
  }
}

const inMemoryStore = new InMemoryInstitutionStore();

function toRecord(data: Partial<NewInstitutionRecord> & { institutionCode: string; institutionName: string }): InstitutionRecord {
  return {
    id: data.id || `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    institutionCode: data.institutionCode,
    institutionName: data.institutionName,
    institutionType: data.institutionType || 'college',
    subscriptionStatus: data.subscriptionStatus || 'active',
    departments: data.departments ?? [],
    academicYears: data.academicYears ?? [],
    courses: data.courses ?? [],
    terms: data.terms ?? [],
    blockedDates: data.blockedDates ?? [],
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };
}

export class InstitutionRepository implements IInstitutionRepository {
  public async create(data: Partial<NewInstitutionRecord> & { institutionCode: string; institutionName: string }): Promise<InstitutionRecord> {
    if (!db) {
      return inMemoryStore.save(toRecord(data));
    }

    try {
      const [inserted] = await db.insert(institutions).values(toRecord(data)).returning();
      return inserted;
    } catch (err: any) {
      console.warn('[PostgreSQL Institution Create Error]', err.message);
      return inMemoryStore.save(toRecord(data));
    }
  }

  public async findAll(): Promise<InstitutionRecord[]> {
    if (db) {
      try {
        return await db.select().from(institutions);
      } catch (err: any) {
        console.warn('[PostgreSQL Institution FindAll Error]', err.message);
      }
    }
    return inMemoryStore.getAll();
  }

  public async findById(id: string): Promise<InstitutionRecord | undefined> {
    if (db) {
      try {
        const results = await db.select().from(institutions).where(eq(institutions.id, id)).limit(1);
        return results.length > 0 ? results[0] : undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Institution FindById Error]', err.message);
      }
    }
    return inMemoryStore.getById(id);
  }

  public async findByCode(code: string): Promise<InstitutionRecord | undefined> {
    if (db) {
      try {
        const results = await db.select().from(institutions).where(eq(institutions.institutionCode, code)).limit(1);
        return results.length > 0 ? results[0] : undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Institution FindByCode Error]', err.message);
      }
    }
    return inMemoryStore.getByCode(code);
  }

  public async update(id: string, data: Partial<NewInstitutionRecord>): Promise<InstitutionRecord | undefined> {
    if (db) {
      try {
        const [updatedRow] = await db
          .update(institutions)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(institutions.id, id))
          .returning();
        if (updatedRow) return updatedRow;
        return undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Institution Update Error]', err.message);
      }
    }
    return inMemoryStore.update(id, data);
  }

  public async delete(id: string): Promise<boolean> {
    if (db) {
      try {
        await db.delete(institutions).where(eq(institutions.id, id));
        return true;
      } catch (err: any) {
        console.warn('[PostgreSQL Institution Delete Error]', err.message);
      }
    }
    return inMemoryStore.delete(id);
  }
}

export const institutionRepository = new InstitutionRepository();