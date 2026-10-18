import { db } from '../shared/db/index.js';
import { announcements, AnnouncementRecord } from '../shared/db/schema.js';
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
  ): Promise<AnnouncementRecord[]> {
    const database = getDb();
    const conditions = [eq(announcements.institutionCode, institutionCode)];

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
          eq(announcements.targetAudience, 'all'),
          eq(announcements.targetAudience, 'faculty'),
          eq(announcements.targetAudience, 'teachers'),
          eq(announcements.targetAudience, 'staff')
        )!
      );

      // Department scoping: school-wide OR teacher's specific department
      if (department && department.trim() !== '' && department.toLowerCase() !== 'all') {
        conditions.push(
          or(
            eq(announcements.department, ''),
            sql`${announcements.department} IS NULL`,
            sql`LOWER(${announcements.department}) = 'all'`,
            sql`LOWER(${announcements.department}) = LOWER(${department})`
          )!
        );
      } else {
        conditions.push(
          or(
            eq(announcements.department, ''),
            sql`${announcements.department} IS NULL`,
            sql`LOWER(${announcements.department}) = 'all'`
          )!
        );
      }
    } else if (normalizedRole === 'hod') {
      // HOD sees circulars for all, faculty, teachers, staff, or hod
      conditions.push(
        or(
          eq(announcements.targetAudience, 'all'),
          eq(announcements.targetAudience, 'faculty'),
          eq(announcements.targetAudience, 'teachers'),
          eq(announcements.targetAudience, 'staff'),
          eq(announcements.targetAudience, 'hod')
        )!
      );

      // Department scoping: school-wide OR HOD's department
      if (department && department.trim() !== '' && department.toLowerCase() !== 'all') {
        conditions.push(
          or(
            eq(announcements.department, ''),
            sql`${announcements.department} IS NULL`,
            sql`LOWER(${announcements.department}) = 'all'`,
            sql`LOWER(${announcements.department}) = LOWER(${department})`
          )!
        );
      }
    } else if (normalizedRole === 'student') {
      conditions.push(
        or(
          eq(announcements.targetAudience, 'all'),
          eq(announcements.targetAudience, 'students')
        )!
      );
      if (department && department.trim() !== '' && department.toLowerCase() !== 'all') {
        conditions.push(
          or(
            eq(announcements.department, ''),
            sql`${announcements.department} IS NULL`,
            sql`LOWER(${announcements.department}) = 'all'`,
            sql`LOWER(${announcements.department}) = LOWER(${department})`
          )!
        );
      }
    } else if (normalizedRole === 'parent') {
      conditions.push(
        or(
          eq(announcements.targetAudience, 'all'),
          eq(announcements.targetAudience, 'parents')
        )!
      );
      if (department && department.trim() !== '' && department.toLowerCase() !== 'all') {
        conditions.push(
          or(
            eq(announcements.department, ''),
            sql`${announcements.department} IS NULL`,
            sql`LOWER(${announcements.department}) = 'all'`,
            sql`LOWER(${announcements.department}) = LOWER(${department})`
          )!
        );
      }
    }

    return await database
      .select()
      .from(announcements)
      .where(and(...conditions))
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(
    institutionCode: string,
    input: CreateAnnouncementInput
  ): Promise<AnnouncementRecord> {
    const database = getDb();
    const [created] = await database
      .insert(announcements)
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
      eq(announcements.id, id),
      eq(announcements.institutionCode, institutionCode),
    ];
    if (!isPowerUser) {
      conditions.push(eq(announcements.authorId, userId));
    }

    const res = await database.delete(announcements).where(and(...conditions)).returning();
    return res.length > 0;
  }
}

export const announcementsService = new AnnouncementsService();
