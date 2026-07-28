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

export class InstitutionRepository implements IInstitutionRepository {
  public async create(data: Partial<NewInstitutionRecord> & { institutionCode: string; institutionName: string }): Promise<InstitutionRecord> {
    const newRecord: InstitutionRecord = {
      id: data.id || `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      institutionCode: data.institutionCode,
      institutionName: data.institutionName,
      institutionType: data.institutionType || 'college',
      subscriptionStatus: data.subscriptionStatus || 'active',
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };

    inMemoryStore.save(newRecord);

    if (db) {
      try {
        const [inserted] = await db.insert(institutions).values(newRecord).returning();
        if (inserted) return inserted;
      } catch (err: any) {
        console.warn('[PostgreSQL Institution Create Error]', err.message);
      }
    }

    return newRecord;
  }

  public async findAll(): Promise<InstitutionRecord[]> {
    if (db) {
      try {
        const results = await db.select().from(institutions);
        results.forEach((item) => inMemoryStore.save(item));
        return results;
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
        if (results.length > 0) {
          inMemoryStore.save(results[0]);
          return results[0];
        }
        return undefined;
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
        if (results.length > 0) {
          inMemoryStore.save(results[0]);
          return results[0];
        }
        return undefined;
      } catch (err: any) {
        console.warn('[PostgreSQL Institution FindByCode Error]', err.message);
      }
    }
    return inMemoryStore.getByCode(code);
  }

  public async update(id: string, data: Partial<NewInstitutionRecord>): Promise<InstitutionRecord | undefined> {
    const updatedInMemory = inMemoryStore.update(id, data);

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
      } catch (err: any) {
        console.warn('[PostgreSQL Institution Update Error]', err.message);
      }
    }

    return updatedInMemory;
  }

  public async delete(id: string): Promise<boolean> {
    const deletedInMemory = inMemoryStore.delete(id);

    if (db) {
      try {
        await db.delete(institutions).where(eq(institutions.id, id));
        return true;
      } catch (err: any) {
        console.warn('[PostgreSQL Institution Delete Error]', err.message);
      }
    }

    return deletedInMemory;
  }
}

export const institutionRepository = new InstitutionRepository();
