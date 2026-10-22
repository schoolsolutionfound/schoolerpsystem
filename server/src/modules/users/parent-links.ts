import { and, desc, eq, inArray, asc } from 'drizzle-orm';
import {
  db,
  dbFindUserById,
  dbFindStudentByUsnInInstitution,
} from '../shared/db/index.js';
import { parentLinks, users } from '../shared/db/schema.js';

/**
 * Parent → child linking.
 *
 * `parent_links` (keyed by immutable student id) is the source of truth.
 * The legacy single-child `users.scope.linkedStudentUSN` is ONLY read as a
 * fallback for parents created before this table existed — nothing writes it
 * anymore. Backfill scripts materialise legacy rows into the table over time.
 */

export interface ParentChildLink {
  studentId: string;
  relationship: string;
  permissions: string[];
  isPrimary: boolean;
}

/** Granted-permission set given to parents when none is specified explicitly. */
export const DEFAULT_PARENT_PERMISSIONS = ['view_attendance', 'view_marks', 'view_fees', 'pay_fees', 'receive_alerts'];

interface MemLinkRow extends ParentChildLink {
  id: string;
  institutionCode: string;
  parentId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const memLinkStore: MemLinkRow[] = [];

export function __resetParentLinksForTests(): void {
  memLinkStore.length = 0;
}

export interface ParentLinkInput {
  studentId: string;
  relationship?: string;
  permissions?: string[];
  isPrimary?: boolean;
}

export async function insertParentLinks(
  institutionCode: string,
  parentId: string,
  links: ParentLinkInput[]
): Promise<void> {
  if (links.length === 0) return;
  if (db) {
    const now = new Date();
    const rows = links.map((l, i) => ({
      id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${i}`,
      institutionCode,
      parentId,
      studentId: l.studentId,
      relationship: l.relationship || '',
      permissions: l.permissions || [],
      isPrimary: l.isPrimary ?? i === 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));
    await db.insert(parentLinks).values(rows).onConflictDoNothing();
    return;
  }
  for (const [i, l] of links.entries()) {
    const existingIdx = memLinkStore.findIndex((r) => r.parentId === parentId && r.studentId === l.studentId);
    const row: MemLinkRow = {
      id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${i}`,
      institutionCode,
      parentId,
      studentId: l.studentId,
      relationship: l.relationship || '',
      permissions: l.permissions || [],
      isPrimary: l.isPrimary ?? i === 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (existingIdx >= 0) memLinkStore[existingIdx] = row;
    else memLinkStore.push(row);
  }
}

/** Table rows only — no legacy scope fallback. Primary child first. */
export async function getParentLinks(parentId: string): Promise<ParentChildLink[]> {
  if (db) {
    const rows = await db
      .select({
        studentId: parentLinks.studentId,
        relationship: parentLinks.relationship,
        permissions: parentLinks.permissions,
        isPrimary: parentLinks.isPrimary,
      })
      .from(parentLinks)
      .where(and(eq(parentLinks.parentId, parentId), eq(parentLinks.isActive, true)))
      .orderBy(desc(parentLinks.isPrimary), asc(parentLinks.createdAt));
    return rows.map((r) => ({
      studentId: r.studentId,
      relationship: r.relationship || '',
      permissions: Array.isArray(r.permissions) ? r.permissions : [],
      isPrimary: Boolean(r.isPrimary),
    }));
  }
  return memLinkStore
    .filter((r) => r.parentId === parentId && r.isActive)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.createdAt.getTime() - b.createdAt.getTime())
    .map((r) => ({ studentId: r.studentId, relationship: r.relationship, permissions: r.permissions, isPrimary: r.isPrimary }));
}

/**
 * Resolved children for one parent: table rows first, legacy scope.USN
 * fallback for pre-migration parents. Primary child first.
 */
export async function resolveParentChildren(parentId: string): Promise<ParentChildLink[]> {
  const rows = await getParentLinks(parentId);
  if (rows.length > 0) return rows;

  const parent = await dbFindUserById(parentId);
  if (!parent || (parent.role || '').toLowerCase() !== 'parent') return [];
  let scope: Record<string, any> = {};
  try {
    scope = typeof parent.scope === 'string' ? JSON.parse(parent.scope || '{}') : (parent.scope || {});
  } catch {
    scope = {};
  }
  const usn = String(scope.linkedStudentUSN || '').trim();
  if (!usn) return [];
  const student = await dbFindStudentByUsnInInstitution(parent.institutionCode || '', usn);
  if (!student) return [];
  return [
    {
      studentId: student.id,
      relationship: String(scope.relation || 'Guardian'),
      permissions: [],
      isPrimary: true,
    },
  ];
}

export async function getPrimaryParentChild(parentId: string): Promise<ParentChildLink | null> {
  const children = await resolveParentChildren(parentId);
  return children.length > 0 ? children[0] : null;
}

export interface FamilyChildPair {
  parentId: string;
  studentId: string;
  relationship: string;
}

/**
 * All (parent, child) pairs for a batch of parents — used by family
 * notification/announcement targeting. Falls back to the legacy scope.USN
 * resolution for parents that predate the table.
 */
export async function getFamilyChildPairs(
  institutionCode: string,
  parentIds: string[]
): Promise<FamilyChildPair[]> {
  if (parentIds.length === 0) return [];
  const pairs: FamilyChildPair[] = [];
  const withRows = new Set<string>();

  if (db) {
    const rows = await db
      .select({
        parentId: parentLinks.parentId,
        studentId: parentLinks.studentId,
        relationship: parentLinks.relationship,
      })
      .from(parentLinks)
      .where(and(inArray(parentLinks.parentId, parentIds), eq(parentLinks.isActive, true)));
    for (const r of rows) {
      pairs.push({ parentId: r.parentId, studentId: r.studentId, relationship: r.relationship || '' });
      withRows.add(r.parentId);
    }
  } else {
    for (const r of memLinkStore) {
      if (r.isActive && parentIds.includes(r.parentId)) {
        pairs.push({ parentId: r.parentId, studentId: r.studentId, relationship: r.relationship });
        withRows.add(r.parentId);
      }
    }
  }

  // Legacy parents: resolve scope.linkedStudentUSN for everyone without
  // table rows — one batched query in Postgres mode, per-row in memory mode.
  const missing = parentIds.filter((id) => !withRows.has(id));
  if (missing.length === 0) return pairs;

  if (db) {
    const parentRows = await db
      .select({ id: users.id, scope: users.scope, institutionCode: users.institutionCode })
      .from(users)
      .where(and(inArray(users.id, missing), eq(users.role, 'parent')));
    const usnByParent = new Map<string, string>();
    const relationByParent = new Map<string, string>();
    for (const row of parentRows) {
      if ((row.institutionCode || '').toLowerCase() !== (institutionCode || '').toLowerCase()) continue;
      let scope: Record<string, any> = {};
      try {
        scope = typeof row.scope === 'string' ? JSON.parse(row.scope || '{}') : row.scope || {};
      } catch {
        continue;
      }
      const usn = String(scope.linkedStudentUSN || '').trim();
      if (usn) {
        usnByParent.set(row.id, usn);
        relationByParent.set(row.id, String(scope.relation || 'Guardian'));
      }
    }
    if (usnByParent.size > 0) {
      const usns = Array.from(new Set(Array.from(usnByParent.values())));
      const studentRows = await db
        .select({ id: users.id, rollNoOrUSN: users.rollNoOrUSN })
        .from(users)
        .where(and(eq(users.institutionCode, institutionCode), inArray(users.rollNoOrUSN, usns)));
      const idByUsn = new Map(studentRows.map((s) => [s.rollNoOrUSN, s.id]));
      for (const [parentId, usn] of usnByParent) {
        const studentId = idByUsn.get(usn);
        if (studentId) pairs.push({ parentId, studentId, relationship: relationByParent.get(parentId) || 'Guardian' });
      }
    }
    return pairs;
  }

  for (const parentId of missing) {
    const parent = await dbFindUserById(parentId);
    if (!parent || (parent.role || '').toLowerCase() !== 'parent') continue;
    if ((parent.institutionCode || '').toLowerCase() !== (institutionCode || '').toLowerCase()) continue;
    let scope: Record<string, any> = {};
    try {
      scope = typeof parent.scope === 'string' ? JSON.parse(parent.scope || '{}') : (parent.scope || {});
    } catch {
      scope = {};
    }
    const usn = String(scope.linkedStudentUSN || '').trim();
    if (!usn) continue;
    const student = await dbFindStudentByUsnInInstitution(institutionCode, usn);
    if (student) pairs.push({ parentId, studentId: student.id, relationship: String(scope.relation || 'Guardian') });
  }
  return pairs;
}
