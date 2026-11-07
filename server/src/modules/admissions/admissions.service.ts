import { db } from '../shared/db/index.js';
import * as schema from '../shared/db/schema.js';
import { eq, desc, or, inArray, and, ne } from 'drizzle-orm';
import { admin } from '../shared/config/firebase.js';
import { insertParentLinks, getParentLinks } from '../users/parent-links.js';

function newAdmId(): string {
  return `adm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export class AdmissionsService {
  /**
   * Public school directory for the parent app. Only non-sensitive
   * descriptive columns leave the server; never settings or staff data.
   */
  public async listPublicInstitutions(type?: 'school' | 'college') {
    if (!db) return [];
    const where = type ? eq(schema.institutions.institutionType, type) : undefined;
    const q = db
      .select({
        institutionCode: schema.institutions.institutionCode,
        institutionName: schema.institutions.institutionName,
        institutionType: schema.institutions.institutionType,
        departments: schema.institutions.departments,
        academicYears: schema.institutions.academicYears,
        courses: schema.institutions.courses,
        sections: schema.institutions.sections,
      })
      .from(schema.institutions);
    const rows = where ? await q.where(where) : await q;
    return rows.map((r) => ({
      ...r,
      description: `${r.institutionType === 'college' ? 'College' : 'School'} offering ${[...(r.academicYears || []), ...(r.courses || [])].slice(0, 4).join(', ') || 'education'}`,
      logoUrl: '',
      facilities: [],
      averageRating: 0,
      totalReviews: 0,
    }));
  }

  public async getPublicInstitution(code: string) {
    const rows = await this.listPublicInstitutions();
    return rows.find((r) => r.institutionCode.toLowerCase() === code.toLowerCase());
  }

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
          and(
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
    const inst = await db
      .select()
      .from(schema.institutions)
      .where(
        or(
          eq(schema.institutions.id, data.schoolId),
          eq(schema.institutions.institutionCode, data.schoolId)
        )
      );
    if (inst.length === 0) {
      throw { statusCode: 404, code: 'INSTITUTION_NOT_FOUND', message: 'Institution not found.' };
    }
    schoolName = inst[0].institutionName;
    targetSchoolId = inst[0].institutionCode;

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
    },
    scope?: { parentId?: string; schoolId?: string }
  ) {
    if (!db) throw new Error('Database not connected');

    const conditions = [eq(schema.admissions.id, id)];
    if (scope?.parentId) conditions.push(eq(schema.admissions.parentId, scope.parentId));
    if (scope?.schoolId) conditions.push(eq(schema.admissions.schoolId, scope.schoolId));

    const [existing] = await db
      .select()
      .from(schema.admissions)
      .where(and(...conditions))
      .limit(1);
    if (!existing) {
      throw { statusCode: 404, code: 'ADMISSION_NOT_FOUND', message: 'Admission application not found.' };
    }

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
      .where(and(...conditions))
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
          and(
            eq(schema.users.institutionCode, adm.schoolId),
            or(
              eq(schema.users.rollNoOrUSN, studentUSN),
              eq(schema.users.fullName, adm.childFullName)
            )
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
            eq(schema.users.firebaseUid, adm.parentId)
          )
        );

      if (parentMatches.length > 0) {
        const parentUser = parentMatches[0];
        const currentScope = (parentUser.scope as any) || {};

        // Canonical parent → student link (no USN in scope anymore). A parent
        // who already has children keeps their existing default child; only an
        // unaffiliated parent adopts the newly admitted student as primary.
        let isPrimary = true;
        try {
          const existingLinks = await getParentLinks(parentUser.id);
          isPrimary = existingLinks.length === 0;
          await insertParentLinks(adm.schoolId, parentUser.id, [
            { studentId: actualStudentId, relationship: 'Parent', isPrimary },
          ]);
        } catch (lErr) {
          console.warn('[AdmissionsService] parent link insert error:', lErr);
        }

        const updatedScope: Record<string, any> = {
          ...currentScope,
          relation: currentScope.relation || 'Parent',
          institutionCode: adm.schoolId,
          schoolName: adm.schoolName,
        };
        if (isPrimary) {
          updatedScope.childId = actualStudentId;
          updatedScope.childName = adm.childFullName;
          updatedScope.grade = adm.gradeApplyingFor;
        }

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
              ...(isPrimary ? { childName: adm.childFullName, childId: actualStudentId } : {}),
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

      // 4. Auto-decline competing offers from other schools for this student
      try {
        const otherAdmissions = await db
          .select()
          .from(schema.admissions)
          .where(
            and(
              eq(schema.admissions.parentId, adm.parentId),
              eq(schema.admissions.childFullName, adm.childFullName),
              ne(schema.admissions.id, adm.id)
            )
          );

        for (const other of otherAdmissions) {
          if (other.status === 'approved' || other.status === 'pending' || other.status === 'test_scheduled') {
            await db
              .update(schema.admissions)
              .set({
                status: 'offer_declined',
                updatedAt: new Date(),
              })
              .where(eq(schema.admissions.id, other.id));
          }
        }
      } catch (autoDeclineErr) {
        console.warn('[AdmissionsService] Error auto-declining competing admissions:', autoDeclineErr);
      }
    } catch (err) {
      console.error('[AdmissionsService] Error in handleAdmissionAccepted:', err);
    }
  }
}

export const admissionsService = new AdmissionsService();
