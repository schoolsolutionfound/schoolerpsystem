import { db } from '../shared/db/index.js';
import * as schema from '../shared/db/schema.js';
import { eq, desc, or, inArray } from 'drizzle-orm';
import { admin } from '../shared/config/firebase.js';

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

    if (status === 'accepted' && updated) {
      await this.handleAdmissionAccepted(updated);
    }

    return updated;
  }

  public async handleAdmissionAccepted(adm: typeof schema.admissions.$inferSelect) {
    try {
      if (!db) return;

      const studentUSN = `${adm.schoolId}-${new Date().getFullYear()}-${adm.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase()}`;
      const studentId = `stu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      // 1. Create or ensure student record in PostgreSQL users
      const existingStudent = await db
        .select()
        .from(schema.users)
        .where(
          or(
            eq(schema.users.rollNoOrUSN, studentUSN),
            eq(schema.users.fullName, adm.childFullName)
          )
        );

      let actualStudentId = studentId;
      if (existingStudent.length === 0) {
        const studentEmail = `${adm.childFullName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${adm.schoolId.toLowerCase()}@student.schoolerp.test`;
        await db.insert(schema.users).values({
          id: studentId,
          firebaseUid: studentId,
          email: studentEmail,
          fullName: adm.childFullName,
          role: 'student',
          roles: ['student'],
          institutionCode: adm.schoolId,
          institutionName: adm.schoolName || '',
          rollNoOrUSN: studentUSN,
          scope: {
            classSectionName: adm.gradeApplyingFor,
            department: adm.gradeApplyingFor,
            academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          },
        });
      } else {
        actualStudentId = existingStudent[0].id;
      }

      // 2. Find parent user by parentId or parentEmail
      const parentMatches = await db
        .select()
        .from(schema.users)
        .where(
          or(
            eq(schema.users.id, adm.parentId),
            eq(schema.users.firebaseUid, adm.parentId),
            adm.parentEmail ? eq(schema.users.email, adm.parentEmail) : eq(schema.users.id, adm.parentId)
          )
        );

      if (parentMatches.length > 0) {
        const parentUser = parentMatches[0];
        const currentScope = (parentUser.scope as any) || {};
        const updatedScope = {
          ...currentScope,
          childId: actualStudentId,
          childName: adm.childFullName,
          linkedStudentUSN: studentUSN,
          relation: currentScope.relation || 'Parent',
          institutionCode: adm.schoolId,
          schoolName: adm.schoolName,
          grade: adm.gradeApplyingFor,
        };

        await db
          .update(schema.users)
          .set({
            institutionCode: adm.schoolId,
            institutionName: adm.schoolName || parentUser.institutionName,
            scope: updatedScope,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, parentUser.id));

        // 3. Sync to Firestore for instant mobile reflection
        try {
          const docId = parentUser.firebaseUid || parentUser.id;
          await admin.firestore().collection('users').doc(docId).set(
            {
              institutionCode: adm.schoolId,
              institutionId: adm.schoolId,
              schoolId: adm.schoolId,
              institutionName: adm.schoolName,
              schoolName: adm.schoolName,
              childName: adm.childFullName,
              childId: actualStudentId,
              linkedStudentUSN: studentUSN,
              relation: currentScope.relation || 'Parent',
              scope: updatedScope,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (fErr) {
          console.warn('[AdmissionsService] Firestore sync error:', fErr);
        }
      }
    } catch (err) {
      console.error('[AdmissionsService] Error in handleAdmissionAccepted:', err);
    }
  }
}

export const admissionsService = new AdmissionsService();
