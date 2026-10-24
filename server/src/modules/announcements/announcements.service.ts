import { db } from '../shared/db/index.js';
import { schoolNotices, SchoolNoticeRecord } from '../shared/db/schema.js';
import { eq, and, desc, or, sql } from 'drizzle-orm';

function getDb() {
  if (!db) {
    const err: any = new Error('Database unavailable');
    err.statusCode = 500;
    throw err;
  }
  return db;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  targetAudience?: string;
  department?: string;
  priority?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
}

export class AnnouncementsService {
  async listAnnouncements(
    institutionCode: string,
    role?: string,
    department?: string
  ): Promise<SchoolNoticeRecord[]> {
    const database = getDb();
    const conditions = [eq(schoolNotices.institutionCode, institutionCode)];

    const normalizedRole = (role || '').toLowerCase();

    // 1. Principal & Admin: Head of Institution has FULL institutional access across all departments & audiences
    if (
      normalizedRole === 'principal' ||
      normalizedRole === 'admin' ||
      normalizedRole === 'headmaster' ||
      normalizedRole === 'director'
    ) {
      // Principal sees all notices without restrictions
    } else if (
      normalizedRole === 'teacher' ||
      normalizedRole === 'faculty' ||
      normalizedRole === 'professor'
    ) {
      // Teachers see circulars targeted to all, faculty, teachers, or staff
      conditions.push(
        or(
          eq(schoolNotices.targetAudience, 'all'),
          eq(schoolNotices.targetAudience, 'faculty'),
          eq(schoolNotices.targetAudience, 'teachers'),
          eq(schoolNotices.targetAudience, 'staff')
        )!
      );

      // Department scoping: school-wide OR teacher's specific department
      if (department && department.trim() !== '' && department.toLowerCase() !== 'all') {
        conditions.push(
          or(
            eq(schoolNotices.department, ''),
            sql`${schoolNotices.department} IS NULL`,
            sql`LOWER(${schoolNotices.department}) = 'all'`,
            sql`LOWER(${schoolNotices.department}) = LOWER(${department})`
          )!
        );
      } else {
        conditions.push(
          or(
            eq(schoolNotices.department, ''),
            sql`${schoolNotices.department} IS NULL`,
            sql`LOWER(${schoolNotices.department}) = 'all'`
          )!
        );
      }
    } else if (normalizedRole === 'hod') {
      // HOD sees circulars for all, faculty, teachers, staff, or hod
      conditions.push(
        or(
          eq(schoolNotices.targetAudience, 'all'),
          eq(schoolNotices.targetAudience, 'faculty'),
          eq(schoolNotices.targetAudience, 'teachers'),
          eq(schoolNotices.targetAudience, 'staff'),
          eq(schoolNotices.targetAudience, 'hod')
        )!
      );

      // Department scoping: school-wide OR HOD's department
      if (department && department.trim() !== '' && department.toLowerCase() !== 'all') {
        conditions.push(
          or(
            eq(schoolNotices.department, ''),
            sql`${schoolNotices.department} IS NULL`,
            sql`LOWER(${schoolNotices.department}) = 'all'`,
            sql`LOWER(${schoolNotices.department}) = LOWER(${department})`
          )!
        );
      }
    } else if (normalizedRole === 'student') {
      conditions.push(
        or(
          eq(schoolNotices.targetAudience, 'all'),
          eq(schoolNotices.targetAudience, 'students')
        )!
      );
      if (department && department.trim() !== '' && department.toLowerCase() !== 'all') {
        conditions.push(
          or(
            eq(schoolNotices.department, ''),
            sql`${schoolNotices.department} IS NULL`,
            sql`LOWER(${schoolNotices.department}) = 'all'`,
            sql`LOWER(${schoolNotices.department}) = LOWER(${department})`
          )!
        );
      }
    } else if (normalizedRole === 'parent') {
      conditions.push(
        or(
          eq(schoolNotices.targetAudience, 'all'),
          eq(schoolNotices.targetAudience, 'parents')
        )!
      );
      if (department && department.trim() !== '' && department.toLowerCase() !== 'all') {
        conditions.push(
          or(
            eq(schoolNotices.department, ''),
            sql`${schoolNotices.department} IS NULL`,
            sql`LOWER(${schoolNotices.department}) = 'all'`,
            sql`LOWER(${schoolNotices.department}) = LOWER(${department})`
          )!
        );
      }
    }

    return await database
      .select()
      .from(schoolNotices)
      .where(and(...conditions))
      .orderBy(desc(schoolNotices.createdAt));
  }

  async createAnnouncement(
    institutionCode: string,
    input: CreateAnnouncementInput
  ): Promise<SchoolNoticeRecord> {
    const database = getDb();
    const [created] = await database
      .insert(schoolNotices)
      .values({
        institutionCode,
        title: input.title,
        content: input.content,
        targetAudience: input.targetAudience || 'all',
        department: input.department || '',
        priority: input.priority || 'normal',
        authorId: input.authorId,
        authorName: input.authorName,
        authorRole: input.authorRole,
      })
      .returning();

    return created;
  }

  async updateAnnouncement(
    institutionCode: string,
    id: string,
    input: Partial<Pick<CreateAnnouncementInput, 'title' | 'content' | 'targetAudience' | 'department' | 'priority'>>,
    userId: string,
    userRole: string
  ): Promise<SchoolNoticeRecord | null> {
    const database = getDb();
    const normalizedRole = (userRole || '').toLowerCase();
    const isPowerUser = normalizedRole === 'admin' || normalizedRole === 'principal';

    const conditions = [
      eq(schoolNotices.id, id),
      eq(schoolNotices.institutionCode, institutionCode),
    ];
    if (!isPowerUser) {
      conditions.push(eq(schoolNotices.authorId, userId));
    }

    const [updated] = await database
      .update(schoolNotices)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.targetAudience !== undefined ? { targetAudience: input.targetAudience } : {}),
        ...(input.department !== undefined ? { department: input.department } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        updatedAt: new Date(),
      })
      .where(and(...conditions))
      .returning();

    return updated || null;
  }

  async deleteAnnouncement(
    institutionCode: string,
    id: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    const database = getDb();
    const normalizedRole = (userRole || '').toLowerCase();
    const isPowerUser = normalizedRole === 'admin' || normalizedRole === 'principal';

    const conditions = [
      eq(schoolNotices.id, id),
      eq(schoolNotices.institutionCode, institutionCode),
    ];
    if (!isPowerUser) {
      conditions.push(eq(schoolNotices.authorId, userId));
    }

    const res = await database.delete(schoolNotices).where(and(...conditions)).returning();
    return res.length > 0;
  }
}

export const announcementsService = new AnnouncementsService();
