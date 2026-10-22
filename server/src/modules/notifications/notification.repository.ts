import { db } from '../shared/db/index.js';
import * as schema from '../shared/db/schema.js';
import { eq, and, or, desc, sql, inArray, count, gte, lte, isNull, isNotNull } from 'drizzle-orm';
import { getFamilyChildPairs } from '../users/parent-links.js';
import {
  NotificationRecord,
  NewNotificationRecord,
  PushTokenRecord,
  NewPushTokenRecord,
  NotificationCampaignRecord,
  NewNotificationCampaignRecord,
  NotificationTemplateRecord,
  NewNotificationTemplateRecord,
  NotificationPayload,
  BulkNotificationPayload,
} from './notification.types.js';

function requireDb() {
  if (!db) {
    throw Object.assign(new Error('Database not available'), { statusCode: 500, code: 'DB_UNAVAILABLE' });
  }
  return db;
}

// ============================================================================
// Notifications
// ============================================================================

export async function createNotification(payload: NotificationPayload): Promise<NotificationRecord> {
  const d = requireDb();
  const rows = await d
    .insert(schema.notifications)
    .values({
      institutionCode: payload.institutionCode,
      recipientId: payload.recipientId,
      title: payload.title,
      body: payload.body,
      type: payload.type || 'general',
      priority: payload.priority || 'normal',
      channel: payload.channel || 'push',
      data: (payload.data || {}) as any,
      status: 'pending',
    })
    .returning();
  return rows[0] as NotificationRecord;
}

export async function createBulkNotifications(payloads: NotificationPayload[]): Promise<NotificationRecord[]> {
  if (payloads.length === 0) return [];
  const d = requireDb();
  const rows = await d
    .insert(schema.notifications)
    .values(
      payloads.map((p) => ({
        institutionCode: p.institutionCode,
        recipientId: p.recipientId,
        title: p.title,
        body: p.body,
        type: p.type || 'general',
        priority: p.priority || 'normal',
        channel: p.channel || 'push',
        data: (p.data || {}) as any,
        status: 'pending',
      }))
    )
    .returning();
  return rows as NotificationRecord[];
}

export async function getNotificationsByRecipient(
  recipientId: string,
  opts: { limit?: number; offset?: number; unreadOnly?: boolean; type?: string } = {}
): Promise<{ items: NotificationRecord[]; total: number }> {
  const d = requireDb();
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);

  const conditions = [eq(schema.notifications.recipientId, recipientId)];
  if (opts.unreadOnly) {
    conditions.push(isNull(schema.notifications.readAt));
  }
  if (opts.type) {
    conditions.push(eq(schema.notifications.type, opts.type));
  }
  const where = and(...conditions);

  const [items, totalRow] = await Promise.all([
    d
      .select()
      .from(schema.notifications)
      .where(where)
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset),
    d
      .select({ total: count() })
      .from(schema.notifications)
      .where(where),
  ]);

  return { items: items as NotificationRecord[], total: totalRow[0]?.total ?? 0 };
}

export async function getUnreadCount(recipientId: string): Promise<number> {
  const d = requireDb();
  const rows = await d
    .select({ total: count() })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.recipientId, recipientId), isNull(schema.notifications.readAt)));
  return rows[0]?.total ?? 0;
}

export async function markAsRead(id: string, recipientId: string): Promise<void> {
  const d = requireDb();
  await d
    .update(schema.notifications)
    .set({ readAt: new Date(), status: 'read' })
    .where(and(eq(schema.notifications.id, id), eq(schema.notifications.recipientId, recipientId)));
}

export async function markAllAsRead(recipientId: string): Promise<number> {
  const d = requireDb();
  const rows = await d
    .update(schema.notifications)
    .set({ readAt: new Date(), status: 'read' })
    .where(and(eq(schema.notifications.recipientId, recipientId), isNull(schema.notifications.readAt)))
    .returning({ id: schema.notifications.id });
  return rows.length;
}

export async function getPendingNotifications(limit: number = 100): Promise<NotificationRecord[]> {
  const d = requireDb();
  const rows = await d
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.status, 'pending'))
    .orderBy(sql`CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END`)
    .limit(limit);
  return rows as NotificationRecord[];
}

export async function markSent(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const d = requireDb();
  await d
    .update(schema.notifications)
    .set({ status: 'sent', sentAt: new Date(), errorMessage: '' })
    .where(inArray(schema.notifications.id, ids));
}

export async function markFailed(ids: string[], errorMessage: string): Promise<void> {
  if (ids.length === 0) return;
  const d = requireDb();
  await d
    .update(schema.notifications)
    .set({ status: 'failed', failedAt: new Date(), errorMessage })
    .where(inArray(schema.notifications.id, ids));
}

export async function incrementRetry(id: string): Promise<void> {
  const d = requireDb();
  await d
    .update(schema.notifications)
    .set({ retryCount: sql`${schema.notifications.retryCount} + 1` })
    .where(eq(schema.notifications.id, id));
}

export async function getNotificationStats(institutionCode: string): Promise<{
  total: number;
  unread: number;
  sentToday: number;
  failedToday: number;
}> {
  const d = requireDb();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalRow, unreadRow, sentRow, failedRow] = await Promise.all([
    d
      .select({ total: count() })
      .from(schema.notifications)
      .where(eq(schema.notifications.institutionCode, institutionCode)),
    d
      .select({ total: count() })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.institutionCode, institutionCode), isNull(schema.notifications.readAt))),
    d
      .select({ total: count() })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.institutionCode, institutionCode),
          eq(schema.notifications.status, 'sent'),
          gte(schema.notifications.sentAt, todayStart)
        )
      ),
    d
      .select({ total: count() })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.institutionCode, institutionCode),
          eq(schema.notifications.status, 'failed'),
          gte(schema.notifications.failedAt, todayStart)
        )
      ),
  ]);

  return {
    total: totalRow[0]?.total ?? 0,
    unread: unreadRow[0]?.total ?? 0,
    sentToday: sentRow[0]?.total ?? 0,
    failedToday: failedRow[0]?.total ?? 0,
  };
}

export async function deleteOldNotifications(institutionCode: string, daysOld: number = 90): Promise<number> {
  const d = requireDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  const rows = await d
    .delete(schema.notifications)
    .where(and(eq(schema.notifications.institutionCode, institutionCode), lte(schema.notifications.createdAt, cutoff)))
    .returning({ id: schema.notifications.id });
  return rows.length;
}

// ============================================================================
// Push Tokens
// ============================================================================

export async function registerPushToken(
  userId: string,
  institutionCode: string,
  token: string,
  platform: string,
  deviceName: string = ''
): Promise<PushTokenRecord> {
  const d = requireDb();
  const existing = await d
    .select()
    .from(schema.pushTokens)
    .where(eq(schema.pushTokens.token, token))
    .limit(1);

  if (existing.length > 0) {
    const rows = await d
      .update(schema.pushTokens)
      .set({ userId, institutionCode, platform, deviceName, isActive: true, lastUsedAt: new Date() })
      .where(eq(schema.pushTokens.token, token))
      .returning();
    return rows[0] as PushTokenRecord;
  }

  const rows = await d
    .insert(schema.pushTokens)
    .values({ userId, institutionCode, token, platform, deviceName })
    .returning();
  return rows[0] as PushTokenRecord;
}

export async function unregisterPushToken(token: string, userId: string): Promise<void> {
  const d = requireDb();
  // Scoped to the caller so a user can only deactivate their own device token.
  await d
    .update(schema.pushTokens)
    .set({ isActive: false })
    .where(and(eq(schema.pushTokens.token, token), eq(schema.pushTokens.userId, userId)));
}

export async function getActiveTokensByUser(userId: string): Promise<PushTokenRecord[]> {
  const d = requireDb();
  const rows = await d
    .select()
    .from(schema.pushTokens)
    .where(and(eq(schema.pushTokens.userId, userId), eq(schema.pushTokens.isActive, true)));
  return rows as PushTokenRecord[];
}

export async function getActiveTokensByUsers(userIds: string[]): Promise<Map<string, PushTokenRecord[]>> {
  if (userIds.length === 0) return new Map();
  const d = requireDb();
  const rows = await d
    .select()
    .from(schema.pushTokens)
    .where(and(inArray(schema.pushTokens.userId, userIds), eq(schema.pushTokens.isActive, true)));
  const map = new Map<string, PushTokenRecord[]>();
  for (const row of rows as PushTokenRecord[]) {
    const list = map.get(row.userId) || [];
    list.push(row);
    map.set(row.userId, list);
  }
  return map;
}

export async function deactivateToken(token: string): Promise<void> {
  const d = requireDb();
  await d.update(schema.pushTokens).set({ isActive: false }).where(eq(schema.pushTokens.token, token));
}

// ============================================================================
// Campaigns
// ============================================================================

export async function createCampaign(payload: NewNotificationCampaignRecord): Promise<NotificationCampaignRecord> {
  const d = requireDb();
  const rows = await d.insert(schema.notificationCampaigns).values(payload).returning();
  return rows[0] as NotificationCampaignRecord;
}

export async function getCampaigns(
  institutionCode: string,
  opts: { limit?: number; offset?: number; status?: string } = {}
): Promise<{ items: NotificationCampaignRecord[]; total: number }> {
  const d = requireDb();
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);

  const conditions = [eq(schema.notificationCampaigns.institutionCode, institutionCode)];
  if (opts.status) {
    conditions.push(eq(schema.notificationCampaigns.status, opts.status));
  }
  const where = and(...conditions);

  const [items, totalRow] = await Promise.all([
    d
      .select()
      .from(schema.notificationCampaigns)
      .where(where)
      .orderBy(desc(schema.notificationCampaigns.createdAt))
      .limit(limit)
      .offset(offset),
    d.select({ total: count() }).from(schema.notificationCampaigns).where(where),
  ]);

  return { items: items as NotificationCampaignRecord[], total: totalRow[0]?.total ?? 0 };
}

export async function getCampaignById(
  id: string,
  institutionCode: string
): Promise<NotificationCampaignRecord | null> {
  const d = requireDb();
  const rows = await d
    .select()
    .from(schema.notificationCampaigns)
    .where(and(eq(schema.notificationCampaigns.id, id), eq(schema.notificationCampaigns.institutionCode, institutionCode)))
    .limit(1);
  return (rows[0] as NotificationCampaignRecord) || null;
}

export async function updateCampaign(id: string, updates: Partial<NewNotificationCampaignRecord>): Promise<void> {
  const d = requireDb();
  await d.update(schema.notificationCampaigns).set(updates).where(eq(schema.notificationCampaigns.id, id));
}

export async function getDueCampaigns(limit: number = 20): Promise<NotificationCampaignRecord[]> {
  const d = requireDb();
  const rows = await d
    .select()
    .from(schema.notificationCampaigns)
    .where(
      and(
        eq(schema.notificationCampaigns.status, 'scheduled'),
        lte(schema.notificationCampaigns.scheduledAt, new Date())
      )
    )
    .orderBy(schema.notificationCampaigns.scheduledAt)
    .limit(limit);
  return rows as NotificationCampaignRecord[];
}

export async function getCampaignStats(institutionCode: string): Promise<{
  totalCampaigns: number;
  runningCampaigns: number;
  totalSent: number;
  totalFailed: number;
}> {
  const d = requireDb();
  const [totalRow, runningRow] = await Promise.all([
    d
      .select({ total: count() })
      .from(schema.notificationCampaigns)
      .where(eq(schema.notificationCampaigns.institutionCode, institutionCode)),
    d
      .select({ total: count() })
      .from(schema.notificationCampaigns)
      .where(
        and(
          eq(schema.notificationCampaigns.institutionCode, institutionCode),
          eq(schema.notificationCampaigns.status, 'running')
        )
      ),
  ]);

  const sentRow = await d
    .select({ total: sql<number>`COALESCE(SUM(${schema.notificationCampaigns.sentCount}), 0)` })
    .from(schema.notificationCampaigns)
    .where(eq(schema.notificationCampaigns.institutionCode, institutionCode));

  const failedRow = await d
    .select({ total: sql<number>`COALESCE(SUM(${schema.notificationCampaigns.failedCount}), 0)` })
    .from(schema.notificationCampaigns)
    .where(eq(schema.notificationCampaigns.institutionCode, institutionCode));

  return {
    totalCampaigns: totalRow[0]?.total ?? 0,
    runningCampaigns: runningRow[0]?.total ?? 0,
    totalSent: Number(sentRow[0]?.total ?? 0),
    totalFailed: Number(failedRow[0]?.total ?? 0),
  };
}

// ============================================================================
// Templates
// ============================================================================

export async function getTemplates(institutionCode: string, type?: string): Promise<NotificationTemplateRecord[]> {
  const d = requireDb();
  const conditions = [eq(schema.notificationTemplates.institutionCode, institutionCode)];
  if (type) {
    conditions.push(eq(schema.notificationTemplates.type, type));
  }
  const rows = await d
    .select()
    .from(schema.notificationTemplates)
    .where(and(...conditions))
    .orderBy(schema.notificationTemplates.type);
  return rows as NotificationTemplateRecord[];
}

export async function getTemplateByType(
  institutionCode: string,
  type: string,
  channel: string = 'push'
): Promise<NotificationTemplateRecord | null> {
  const d = requireDb();
  const rows = await d
    .select()
    .from(schema.notificationTemplates)
    .where(
      and(
        eq(schema.notificationTemplates.institutionCode, institutionCode),
        eq(schema.notificationTemplates.type, type),
        eq(schema.notificationTemplates.channel, channel),
        eq(schema.notificationTemplates.isActive, true)
      )
    )
    .limit(1);
  return (rows[0] as NotificationTemplateRecord) || null;
}

export async function upsertTemplate(payload: NewNotificationTemplateRecord): Promise<NotificationTemplateRecord> {
  const d = requireDb();
  const existing = await d
    .select()
    .from(schema.notificationTemplates)
    .where(
      and(
        eq(schema.notificationTemplates.institutionCode, payload.institutionCode),
        eq(schema.notificationTemplates.type, payload.type),
        eq(schema.notificationTemplates.channel, payload.channel ?? 'push')
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const rows = await d
      .update(schema.notificationTemplates)
      .set({ titleTemplate: payload.titleTemplate, bodyTemplate: payload.bodyTemplate, isActive: payload.isActive ?? true, updatedAt: new Date() })
      .where(eq(schema.notificationTemplates.id, existing[0].id))
      .returning();
    return rows[0] as NotificationTemplateRecord;
  }

  const rows = await d.insert(schema.notificationTemplates).values(payload).returning();
  return rows[0] as NotificationTemplateRecord;
}

// ============================================================================
// Recipient Resolution
// ============================================================================

/**
 * Normalize a mixed list of DB user ids and/or Firebase uids into Firebase uids.
 * Notifications and push tokens are keyed by Firebase uid (req.user.uid).
 */
export async function toFirebaseUids(institutionCode: string, identifiers: string[]): Promise<string[]> {
  const unique = Array.from(new Set(identifiers.filter(Boolean)));
  if (unique.length === 0) return [];
  const d = requireDb();
  const rows = await d
    .select({ firebaseUid: schema.users.firebaseUid })
    .from(schema.users)
    .where(
      and(
        eq(schema.users.institutionCode, institutionCode),
        or(inArray(schema.users.id, unique), inArray(schema.users.firebaseUid, unique))
      )
    );
  return rows.map((r) => r.firebaseUid);
}

export async function getUserIdsByRole(institutionCode: string, roles: string[]): Promise<string[]> {
  if (roles.length === 0) return [];
  const d = requireDb();
  const rows = await d
    .select({ firebaseUid: schema.users.firebaseUid })
    .from(schema.users)
    .where(and(eq(schema.users.institutionCode, institutionCode), inArray(schema.users.role, roles)));
  return rows.map((r) => r.firebaseUid);
}

export async function getUserIdsByClass(institutionCode: string, classSectionIds: string[]): Promise<string[]> {
  if (classSectionIds.length === 0) return [];
  const d = requireDb();
  const rows = await d
    .select({ studentId: schema.studentClasses.studentId })
    .from(schema.studentClasses)
    .where(
      and(
        eq(schema.studentClasses.institutionCode, institutionCode),
        eq(schema.studentClasses.isActive, true),
        inArray(schema.studentClasses.classSectionId, classSectionIds)
      )
    );
  return toFirebaseUids(institutionCode, rows.map((r) => r.studentId));
}

export async function getAllUserIds(institutionCode: string): Promise<string[]> {
  const d = requireDb();
  const rows = await d
    .select({ firebaseUid: schema.users.firebaseUid })
    .from(schema.users)
    .where(eq(schema.users.institutionCode, institutionCode));
  return rows.map((r) => r.firebaseUid);
}

export async function getUserIdsByParentChildren(institutionCode: string, parentIds: string[]): Promise<string[]> {
  if (parentIds.length === 0) return [];
  const d = requireDb();
  const unique = Array.from(new Set(parentIds.filter(Boolean)));
  const rows = await d
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(
      and(
        eq(schema.users.institutionCode, institutionCode),
        or(inArray(schema.users.id, unique), inArray(schema.users.firebaseUid, unique))
      )
    );
  if (rows.length === 0) return [];

  const pairs = await getFamilyChildPairs(institutionCode, rows.map((r) => r.id));
  const studentIds = Array.from(new Set(pairs.map((p) => p.studentId)));
  if (studentIds.length === 0) return [];
  return toFirebaseUids(institutionCode, studentIds);
}

/**
 * Map of student identifier (DB id AND Firebase uid both act as keys) to that
 * student's notification recipients (student + linked parents, Firebase uids).
 * Resolves everything in two queries so batch triggers stay cheap.
 */
export async function getFamilyRecipientMap(
  institutionCode: string,
  studentIdentifiers: string[]
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  const unique = Array.from(new Set(studentIdentifiers.filter(Boolean)));
  if (unique.length === 0) return result;
  const d = requireDb();

  const students = await d
    .select({ id: schema.users.id, firebaseUid: schema.users.firebaseUid, usn: schema.users.rollNoOrUSN })
    .from(schema.users)
    .where(
      and(
        eq(schema.users.institutionCode, institutionCode),
        or(inArray(schema.users.id, unique), inArray(schema.users.firebaseUid, unique))
      )
    );
  if (students.length === 0) return result;

  // parents → children pairs from parent_links (legacy scope fallback inside),
  // then invert to student → parent uids.
  const parents = await d
    .select({ id: schema.users.id, firebaseUid: schema.users.firebaseUid })
    .from(schema.users)
    .where(and(eq(schema.users.institutionCode, institutionCode), eq(schema.users.role, 'parent')));

  const uidByParentId = new Map(parents.map((p) => [p.id, p.firebaseUid]));
  const parentsByStudent = new Map<string, string[]>();
  if (parents.length > 0) {
    const pairs = await getFamilyChildPairs(
      institutionCode,
      parents.map((p) => p.id)
    );
    for (const pair of pairs) {
      const uid = uidByParentId.get(pair.parentId);
      if (!uid) continue;
      const list = parentsByStudent.get(pair.studentId) || [];
      list.push(uid);
      parentsByStudent.set(pair.studentId, list);
    }
  }

  for (const student of students) {
    const recipients = [student.firebaseUid, ...(parentsByStudent.get(student.id) || [])];
    const deduped = Array.from(new Set(recipients));
    result.set(student.id, deduped);
    result.set(student.firebaseUid, deduped);
  }
  return result;
}

/**
 * Recipients for one or more students: the students themselves plus every
 * parent whose scope.linkedStudentUSN matches the student's roll number/USN.
 * Accepts DB ids or Firebase uids; returns Firebase uids.
 */
export async function getFamilyRecipients(
  institutionCode: string,
  studentIdentifiers: string[]
): Promise<string[]> {
  const map = await getFamilyRecipientMap(institutionCode, studentIdentifiers);
  const recipients = new Set<string>();
  for (const list of map.values()) list.forEach((id) => recipients.add(id));
  return Array.from(recipients);
}

/**
 * Recipients for a set of class sections: every active student in those
 * sections plus their parents. Returns Firebase uids.
 */
export async function getClassFamilyRecipients(
  institutionCode: string,
  classSectionIds: string[]
): Promise<string[]> {
  const unique = Array.from(new Set(classSectionIds.filter(Boolean)));
  if (unique.length === 0) return [];
  const d = requireDb();

  const rows = await d
    .select({ studentId: schema.studentClasses.studentId })
    .from(schema.studentClasses)
    .where(
      and(
        eq(schema.studentClasses.institutionCode, institutionCode),
        eq(schema.studentClasses.isActive, true),
        inArray(schema.studentClasses.classSectionId, unique)
      )
    );
  if (rows.length === 0) return [];

  return getFamilyRecipients(
    institutionCode,
    rows.map((r) => r.studentId)
  );
}

// ============================================================================
// Preferences
// ============================================================================

export interface RecipientPreference {
  pushEnabled: boolean;
  disabledTypes: string[];
}

export async function getPreferences(userId: string): Promise<RecipientPreference | null> {
  if (!db) return null;
  const rows = await db
    .select()
    .from(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.userId, userId))
    .limit(1);
  if (!rows[0]) return null;
  return {
    pushEnabled: rows[0].pushEnabled,
    disabledTypes: rows[0].disabledTypes || [],
  };
}

export async function getRecipientPreferences(
  recipientIds: string[]
): Promise<Map<string, RecipientPreference>> {
  const map = new Map<string, RecipientPreference>();
  const unique = Array.from(new Set(recipientIds.filter(Boolean)));
  if (unique.length === 0 || !db) return map;

  const rows = await db
    .select()
    .from(schema.notificationPreferences)
    .where(inArray(schema.notificationPreferences.userId, unique));

  for (const row of rows) {
    map.set(row.userId, {
      pushEnabled: row.pushEnabled,
      disabledTypes: row.disabledTypes || [],
    });
  }
  return map;
}

export async function upsertPreferences(
  userId: string,
  institutionCode: string,
  prefs: { pushEnabled?: boolean; disabledTypes?: string[] }
): Promise<RecipientPreference> {
  const d = requireDb();
  const pushEnabled = prefs.pushEnabled !== false;
  const disabledTypes = Array.isArray(prefs.disabledTypes) ? prefs.disabledTypes : [];

  const existing = await d
    .select({ id: schema.notificationPreferences.id })
    .from(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await d
      .update(schema.notificationPreferences)
      .set({ pushEnabled, disabledTypes, updatedAt: new Date() })
      .where(eq(schema.notificationPreferences.id, existing[0].id));
  } else {
    await d.insert(schema.notificationPreferences).values({
      institutionCode,
      userId,
      pushEnabled,
      disabledTypes,
    });
  }

  return { pushEnabled, disabledTypes };
}

// ============================================================================
// Audit Log
// ============================================================================

export async function logAudit(payload: {
  institutionCode: string;
  action: string;
  notificationId?: string;
  campaignId?: string;
  userId?: string;
  details?: Record<string, any>;
}): Promise<void> {
  if (!db) return;
  await db.insert(schema.notificationAuditLog).values({
    institutionCode: payload.institutionCode,
    action: payload.action,
    notificationId: payload.notificationId,
    campaignId: payload.campaignId,
    userId: payload.userId,
    details: (payload.details || {}) as any,
  });
}
