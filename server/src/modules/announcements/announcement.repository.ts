import { and, count, desc, eq, gt, ilike, inArray, isNull, lte, or } from 'drizzle-orm';
import { db } from '../shared/db/index.js';
import * as schema from '../shared/db/schema.js';
import { AnnouncementQueryInput, TargetInput } from './announcement.schema.js';

export interface AnnouncementWithTargetsAndReadStatus extends schema.AnnouncementRecord {
  targets: schema.AnnouncementTargetRecord[];
  isRead?: boolean;
  readAt?: Date | null;
  readCount?: number;
}

export class AnnouncementRepository {
  /**
   * Create announcement record with target entries in a single database transaction.
   */
  async create(
    institutionCode: string,
    data: Omit<schema.NewAnnouncementRecord, 'id' | 'institutionCode' | 'createdAt' | 'updatedAt'>,
    targetsData: TargetInput[]
  ): Promise<AnnouncementWithTargetsAndReadStatus> {
    if (!db) {
      throw new Error('Database connection unavailable');
    }

    return await db.transaction(async (tx) => {
      const [newAnn] = await tx
        .insert(schema.announcements)
        .values({
          ...data,
          institutionCode,
        })
        .returning();

      let createdTargets: schema.AnnouncementTargetRecord[] = [];
      if (targetsData && targetsData.length > 0) {
        createdTargets = await tx
          .insert(schema.announcementTargets)
          .values(
            targetsData.map((t) => ({
              announcementId: newAnn.id,
              targetType: t.targetType || 'all',
              targetRole: t.targetRole || '',
              classId: t.classId || '',
              sectionId: t.sectionId || '',
            }))
          )
          .returning();
      }

      return {
        ...newAnn,
        targets: createdTargets,
        isRead: false,
        readCount: 0,
      };
    });
  }

  /**
   * Find announcement by ID within institution scope.
   */
  async findById(
    institutionCode: string,
    id: string,
    userId?: string
  ): Promise<AnnouncementWithTargetsAndReadStatus | null> {
    if (!db) return null;

    const [ann] = await db
      .select()
      .from(schema.announcements)
      .where(and(eq(schema.announcements.id, id), eq(schema.announcements.institutionCode, institutionCode)))
      .limit(1);

    if (!ann) return null;

    const targets = await db
      .select()
      .from(schema.announcementTargets)
      .where(eq(schema.announcementTargets.announcementId, ann.id));

    let isRead = false;
    let readAt: Date | null = null;

    if (userId) {
      const [readRecord] = await db
        .select()
        .from(schema.announcementReads)
        .where(
          and(
            eq(schema.announcementReads.announcementId, ann.id),
            eq(schema.announcementReads.userId, userId)
          )
        )
        .limit(1);

      if (readRecord) {
        isRead = true;
        readAt = readRecord.readAt || null;
      }
    }

    const [readCountResult] = await db
      .select({ count: count() })
      .from(schema.announcementReads)
      .where(eq(schema.announcementReads.announcementId, ann.id));

    return {
      ...ann,
      targets,
      isRead,
      readAt,
      readCount: Number(readCountResult?.count || 0),
    };
  }

  /**
   * List announcements for management with filters and pagination.
   */
  async list(
    institutionCode: string,
    query: AnnouncementQueryInput,
    pagination: { limit: number; offset: number }
  ): Promise<{ items: AnnouncementWithTargetsAndReadStatus[]; total: number }> {
    if (!db) return { items: [], total: 0 };

    const conditions = [eq(schema.announcements.institutionCode, institutionCode)];

    if (query.status) {
      conditions.push(eq(schema.announcements.status, query.status));
    }

    if (query.type) {
      conditions.push(eq(schema.announcements.type, query.type));
    }

    if (query.priority) {
      conditions.push(eq(schema.announcements.priority, query.priority));
    }

    if (query.search && query.search.trim()) {
      const searchPattern = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.announcements.title, searchPattern),
          ilike(schema.announcements.content, searchPattern)
        )!
      );
    }

    const whereClause = and(...conditions);

    const [totalRes] = await db.select({ count: count() }).from(schema.announcements).where(whereClause);
    const total = Number(totalRes?.count || 0);

    const rows = await db
      .select()
      .from(schema.announcements)
      .where(whereClause)
      .orderBy(desc(schema.announcements.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    if (rows.length === 0) {
      return { items: [], total };
    }

    const annIds = rows.map((r) => r.id);
    const allTargets = await db
      .select()
      .from(schema.announcementTargets)
      .where(inArray(schema.announcementTargets.announcementId, annIds));

    const targetsMap = new Map<string, schema.AnnouncementTargetRecord[]>();
    for (const target of allTargets) {
      const list = targetsMap.get(target.announcementId) || [];
      list.push(target);
      targetsMap.set(target.announcementId, list);
    }

    const items: AnnouncementWithTargetsAndReadStatus[] = rows.map((r) => ({
      ...r,
      targets: targetsMap.get(r.id) || [],
    }));

    return { items, total };
  }

  /**
   * Update announcement and optionally replace target records in transaction.
   */
  async update(
    institutionCode: string,
    id: string,
    data: Partial<schema.NewAnnouncementRecord>,
    targetsData?: TargetInput[]
  ): Promise<AnnouncementWithTargetsAndReadStatus | null> {
    if (!db) return null;

    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(schema.announcements)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.announcements.id, id), eq(schema.announcements.institutionCode, institutionCode)))
        .returning();

      if (!updated) return null;

      let currentTargets: schema.AnnouncementTargetRecord[] = [];

      if (targetsData) {
        await tx
          .delete(schema.announcementTargets)
          .where(eq(schema.announcementTargets.announcementId, id));

        if (targetsData.length > 0) {
          currentTargets = await tx
            .insert(schema.announcementTargets)
            .values(
              targetsData.map((t) => ({
                announcementId: id,
                targetType: t.targetType || 'all',
                targetRole: t.targetRole || '',
                classId: t.classId || '',
                sectionId: t.sectionId || '',
              }))
            )
            .returning();
        }
      } else {
        currentTargets = await tx
          .select()
          .from(schema.announcementTargets)
          .where(eq(schema.announcementTargets.announcementId, id));
      }

      return {
        ...updated,
        targets: currentTargets,
      };
    });
  }

  /**
   * Delete announcement and associated targets & reads (only draft announcements).
   */
  async delete(institutionCode: string, id: string): Promise<boolean> {
    if (!db) return false;

    return await db.transaction(async (tx) => {
      await tx.delete(schema.announcementTargets).where(eq(schema.announcementTargets.announcementId, id));
      await tx.delete(schema.announcementReads).where(eq(schema.announcementReads.announcementId, id));
      const res = await tx
        .delete(schema.announcements)
        .where(and(eq(schema.announcements.id, id), eq(schema.announcements.institutionCode, institutionCode)))
        .returning();

      return res.length > 0;
    });
  }

  /**
   * Fetch active, eligible user feed announcements for standard users.
   */
  async listUserFeed(
    institutionCode: string,
    userRole: string,
    userClassSectionIds: string[],
    userId: string,
    pagination: { limit: number; offset: number }
  ): Promise<{ items: AnnouncementWithTargetsAndReadStatus[]; total: number }> {
    if (!db) return { items: [], total: 0 };

    const now = new Date();
    const normalizedRole = userRole.toLowerCase().trim();

    // Query active published announcements for this institution
    const rawAnnouncements = await db
      .select()
      .from(schema.announcements)
      .where(
        and(
          eq(schema.announcements.institutionCode, institutionCode),
          eq(schema.announcements.status, 'PUBLISHED'),
          lte(schema.announcements.publishAt, now),
          or(
            isNull(schema.announcements.expiresAt),
            gt(schema.announcements.expiresAt, now)
          )
        )
      )
      .orderBy(desc(schema.announcements.publishAt));

    if (rawAnnouncements.length === 0) {
      return { items: [], total: 0 };
    }

    const annIds = rawAnnouncements.map((a) => a.id);

    // Fetch targets for these announcements
    const allTargets = await db
      .select()
      .from(schema.announcementTargets)
      .where(inArray(schema.announcementTargets.announcementId, annIds));

    const targetsMap = new Map<string, schema.AnnouncementTargetRecord[]>();
    for (const t of allTargets) {
      const list = targetsMap.get(t.announcementId) || [];
      list.push(t);
      targetsMap.set(t.announcementId, list);
    }

    // Fetch user reads
    const userReads = await db
      .select()
      .from(schema.announcementReads)
      .where(
        and(
          inArray(schema.announcementReads.announcementId, annIds),
          eq(schema.announcementReads.userId, userId)
        )
      );

    const readSet = new Set<string>();
    for (const r of userReads) {
      readSet.add(r.announcementId);
    }

    // Filter announcements eligible for this user based on targets
    const eligibleAnnouncements = rawAnnouncements.filter((ann) => {
      const targets = targetsMap.get(ann.id) || [];
      if (targets.length === 0) return true; // Default to institution-wide if no target rows exist

      return targets.some((t) => {
        if (t.targetType === 'all') return true;

        if (t.targetType === 'role' || t.targetRole) {
          const tRole = (t.targetRole || '').toLowerCase().trim();
          if (tRole === 'all' || tRole === normalizedRole) return true;
          if (tRole === 'staff' && ['admin', 'teacher', 'hod', 'principal', 'librarian', 'accountant', 'staff'].includes(normalizedRole)) return true;
        }

        if (t.targetType === 'class' || t.targetType === 'section' || t.classId || t.sectionId) {
          const targetClass = t.classId || t.sectionId;
          if (targetClass && userClassSectionIds.includes(targetClass)) return true;
        }

        return false;
      });
    });

    const total = eligibleAnnouncements.length;
    const paginated = eligibleAnnouncements.slice(pagination.offset, pagination.offset + pagination.limit);

    const items: AnnouncementWithTargetsAndReadStatus[] = paginated.map((ann) => ({
      ...ann,
      targets: targetsMap.get(ann.id) || [],
      isRead: readSet.has(ann.id),
    }));

    return { items, total };
  }

  /**
   * Mark announcement as read by user (idempotent via ON CONFLICT / unique constraint).
   */
  async markRead(institutionCode: string, announcementId: string, userId: string): Promise<boolean> {
    if (!db) return false;

    // Verify announcement exists and belongs to institution
    const [ann] = await db
      .select()
      .from(schema.announcements)
      .where(and(eq(schema.announcements.id, announcementId), eq(schema.announcements.institutionCode, institutionCode)))
      .limit(1);

    if (!ann) return false;

    try {
      await db
        .insert(schema.announcementReads)
        .values({
          announcementId,
          userId,
          readAt: new Date(),
        })
        .onConflictDoNothing();

      return true;
    } catch {
      // Idempotent success if read record already exists
      return true;
    }
  }

  /**
   * Get unread count for current user in institution.
   */
  async getUnreadCount(
    institutionCode: string,
    userRole: string,
    userClassSectionIds: string[],
    userId: string
  ): Promise<number> {
    const feed = await this.listUserFeed(institutionCode, userRole, userClassSectionIds, userId, {
      limit: 1000,
      offset: 0,
    });
    return feed.items.filter((item) => !item.isRead).length;
  }
}

export const announcementRepository = new AnnouncementRepository();
