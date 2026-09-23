import { db } from '../shared/db/index.js';
import * as schema from '../shared/db/schema.js';
import { eq, desc, or, inArray } from 'drizzle-orm';

function newAdmId(): string {
  return `adm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export class AdmissionsService {
  public async getAdmissions(filter: { parentId?: string; schoolId?: string }) {
    if (!db) return [];

    let schoolIdsToMatch: string[] = [];
    if (filter.schoolId) {
      schoolIdsToMatch = [filter.schoolId];
      try {
        const inst = await db
          .select()
          .from(schema.institutions)
          .where(
            or(
              eq(schema.institutions.id, filter.schoolId),
              eq(schema.institutions.institutionCode, filter.schoolId)
            )
          );
        if (inst.length > 0) {
          schoolIdsToMatch = Array.from(new Set([inst[0].id, inst[0].institutionCode]));
        }
      } catch {}
    }

    if (filter.parentId && filter.schoolId) {
      return db
        .select()
        .from(schema.admissions)
        .where(
          or(
            eq(schema.admissions.parentId, filter.parentId),
            inArray(schema.admissions.schoolId, schoolIdsToMatch)
          )
        )
        .orderBy(desc(schema.admissions.createdAt));
    } else if (filter.parentId) {
      return db
        .select()
        .from(schema.admissions)
        .where(eq(schema.admissions.parentId, filter.parentId))
        .orderBy(desc(schema.admissions.createdAt));
    } else if (filter.schoolId) {
      return db
        .select()
        .from(schema.admissions)
        .where(inArray(schema.admissions.schoolId, schoolIdsToMatch))
        .orderBy(desc(schema.admissions.createdAt));
    }

    return db.select().from(schema.admissions).orderBy(desc(schema.admissions.createdAt));
  }

  public async createAdmission(data: {
    parentId: string;
    schoolId: string;
    childFullName: string;
    childAge: number;
    childGender: string;
    previousSchool?: string;
    gradeApplyingFor: string;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
  }) {
    if (!db) throw new Error('Database not connected');

    // Fetch school name and canonical institutionCode if not provided
    let schoolName = data.schoolId;
    let targetSchoolId = data.schoolId;
    try {
      const inst = await db
        .select()
        .from(schema.institutions)
        .where(
          or(
            eq(schema.institutions.id, data.schoolId),
            eq(schema.institutions.institutionCode, data.schoolId)
          )
        );
      if (inst.length > 0) {
        schoolName = inst[0].institutionName;
        targetSchoolId = inst[0].institutionCode;
      }
    } catch {}

    const id = newAdmId();
    const [created] = await db
      .insert(schema.admissions)
      .values({
        id,
        parentId: data.parentId,
        parentName: data.parentName || '',
        parentEmail: data.parentEmail || '',
        parentPhone: data.parentPhone || '',
        schoolId: targetSchoolId,
        schoolName,
        childFullName: data.childFullName,
        childAge: data.childAge,
        childGender: data.childGender || 'male',
        previousSchool: data.previousSchool || '',
        gradeApplyingFor: data.gradeApplyingFor,
        status: 'pending',
      })
      .returning();

    return created;
  }

  public async updateAdmissionStatus(
    id: string,
    status: string,
    details?: {
      entranceTestDate?: string | Date | null;
      entranceTestVenue?: string;
      entranceTestInstructions?: string;
    }
  ) {
    if (!db) throw new Error('Database not connected');

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (details?.entranceTestDate !== undefined) {
      updateData.entranceTestDate = details.entranceTestDate ? new Date(details.entranceTestDate) : null;
    }
    if (details?.entranceTestVenue !== undefined) {
      updateData.entranceTestVenue = details.entranceTestVenue;
    }
    if (details?.entranceTestInstructions !== undefined) {
      updateData.entranceTestInstructions = details.entranceTestInstructions;
    }

    const [updated] = await db
      .update(schema.admissions)
      .set(updateData)
      .where(eq(schema.admissions.id, id))
      .returning();

    return updated;
  }
}

export const admissionsService = new AdmissionsService();
