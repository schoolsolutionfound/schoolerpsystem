import { and, asc, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { db } from '../shared/db/index.js';
import { institutions, InstitutionRecord, NewInstitutionRecord } from './institution.schema.js';

export interface InstitutionListOptions {
  search?: string;
  type?: string;
  status?: string;
  sort?: 'newest' | 'oldest' | 'name_asc' | 'name_desc';
  limit: number;
  offset: number;
}

export interface InstitutionPage {
  items: InstitutionRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface InstitutionStatusBreakdown {
  total: number;
  active: number;
}

export interface IInstitutionRepository {
  create(data: Partial<NewInstitutionRecord> & { institutionCode: string; institutionName: string }): Promise<InstitutionRecord>;
  findAll(): Promise<InstitutionRecord[]>;
  findById(id: string): Promise<InstitutionRecord | undefined>;
  findByCode(code: string): Promise<InstitutionRecord | undefined>;
  findPage(opts: InstitutionListOptions): Promise<InstitutionPage>;
  findByCodes(codes: string[]): Promise<InstitutionRecord[]>;
  statusBreakdown(): Promise<InstitutionStatusBreakdown>;
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
    defaultTempPassword: data.defaultTempPassword || '',
    maintenanceEnabled: (data as any).maintenanceEnabled ?? false,
    maintenanceMinVersion: (data as any).maintenanceMinVersion || '0.0.0',
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };
}

export class InstitutionRepository implements IInstitutionRepository {
  public async create(data: Partial<NewInstitutionRecord> & { institutionCode: string; institutionName: string }): Promise<InstitutionRecord> {
    if (!db) {
      return inMemoryStore.save(toRecord(data));
    }

    const [inserted] = await db.insert(institutions).values(toRecord(data)).returning();
    return inserted;
  }

  public async findAll(): Promise<InstitutionRecord[]> {
    if (db) {
      return await db.select().from(institutions);
    }
    return inMemoryStore.getAll();
  }

  public async findById(id: string): Promise<InstitutionRecord | undefined> {
    if (db) {
      const results = await db.select().from(institutions).where(eq(institutions.id, id)).limit(1);
      return results.length > 0 ? results[0] : undefined;
    }
    return inMemoryStore.getById(id);
  }

  public async findByCode(code: string): Promise<InstitutionRecord | undefined> {
    if (db) {
      // Case-insensitive: codes are stored uppercase, but lookups may arrive in any case.
      const results = await db
        .select()
        .from(institutions)
        .where(sql`lower(${institutions.institutionCode}) = lower(${code})`)
        .limit(1);
      return results.length > 0 ? results[0] : undefined;
    }
    return inMemoryStore.getByCode(code);
  }

  public async findPage(opts: InstitutionListOptions): Promise<InstitutionPage> {
    if (db) {
      const conditions: any[] = [];
      const term = opts.search?.trim();
      if (term) {
        conditions.push(
          or(
            ilike(institutions.institutionName, `%${term}%`),
            ilike(institutions.institutionCode, `%${term}%`)
          )
        );
      }
      if (opts.type) conditions.push(eq(institutions.institutionType, opts.type.toLowerCase()));
      if (opts.status) {
        const status = opts.status.toLowerCase();
        // 'non_active' is a composite status: inactive + suspended.
        conditions.push(
          status === 'non_active'
            ? inArray(institutions.subscriptionStatus, ['inactive', 'suspended'])
            : eq(institutions.subscriptionStatus, status)
        );
      }
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const sort = opts.sort || 'newest';
      const orderBy =
        sort === 'oldest'
          ? asc(institutions.createdAt)
          : sort === 'name_asc'
            ? asc(institutions.institutionName)
            : sort === 'name_desc'
              ? desc(institutions.institutionName)
              : desc(institutions.createdAt);

      const [items, countRows] = await Promise.all([
        db.select().from(institutions).where(where).orderBy(orderBy).limit(opts.limit).offset(opts.offset),
        db.select({ count: count() }).from(institutions).where(where),
      ]);

      return {
        items,
        total: Number(countRows[0]?.count ?? 0),
        limit: opts.limit,
        offset: opts.offset,
      };
    }

    let list = inMemoryStore.getAll();
    const term = opts.search?.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (i) =>
          i.institutionName.toLowerCase().includes(term) || i.institutionCode.toLowerCase().includes(term)
      );
    }
    if (opts.type) list = list.filter((i) => i.institutionType.toLowerCase() === opts.type!.toLowerCase());
    if (opts.status) {
      const status = opts.status!.toLowerCase();
      list =
        status === 'non_active'
          ? list.filter((i) => ['inactive', 'suspended'].includes(i.subscriptionStatus.toLowerCase()))
          : list.filter((i) => i.subscriptionStatus.toLowerCase() === status);
    }

    const sort = opts.sort || 'newest';
    const ts = (d: Date | null) => new Date(d ?? 0).getTime();
    const sorted = [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return ts(a.createdAt) - ts(b.createdAt);
        case 'name_asc':
          return a.institutionName.localeCompare(b.institutionName);
        case 'name_desc':
          return b.institutionName.localeCompare(a.institutionName);
        default:
          return ts(b.createdAt) - ts(a.createdAt);
      }
    });

    return {
      items: sorted.slice(opts.offset, opts.offset + opts.limit),
      total: sorted.length,
      limit: opts.limit,
      offset: opts.offset,
    };
  }

  public async findByCodes(codes: string[]): Promise<InstitutionRecord[]> {
    if (codes.length === 0) return [];
    if (db) {
      const results = await db
        .select()
        .from(institutions)
        .where(inArray(institutions.institutionCode, codes));
      return results;
    }
    const wanted = new Set(codes.map((c) => c.toUpperCase()));
    return inMemoryStore.getAll().filter((i) => wanted.has(i.institutionCode.toUpperCase()));
  }

  public async statusBreakdown(): Promise<InstitutionStatusBreakdown> {
    if (db) {
      const [totalRows, activeRows] = await Promise.all([
        db.select({ count: count() }).from(institutions),
        db
          .select({ count: count() })
          .from(institutions)
          .where(
            sql`(lower(${institutions.subscriptionStatus}) = 'active' OR ${institutions.subscriptionStatus} IS NULL OR ${institutions.subscriptionStatus} = '')`
          ),
      ]);
      return {
        total: Number(totalRows[0]?.count ?? 0),
        active: Number(activeRows[0]?.count ?? 0),
      };
    }
    const all = inMemoryStore.getAll();
    return {
      total: all.length,
      active: all.filter((i) => (i.subscriptionStatus || 'active').toLowerCase() === 'active').length,
    };
  }

  public async update(id: string, data: Partial<NewInstitutionRecord>): Promise<InstitutionRecord | undefined> {
    if (db) {
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
    }
    return inMemoryStore.update(id, data);
  }

  public async delete(id: string): Promise<boolean> {
    if (db) {
      await db.delete(institutions).where(eq(institutions.id, id));
      return true;
    }
    return inMemoryStore.delete(id);
  }
}

export const institutionRepository = new InstitutionRepository();