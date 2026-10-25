import { eq, and, sql, desc, or, ilike } from 'drizzle-orm';
import { db } from '../shared/db/index.js';
import {
  admissionCourses,
  admissionApplications,
  admissionFormConfigs,
  AdmissionCourseRecord,
  AdmissionApplicationRecord,
  QuotaAllocationItem,
} from '../shared/db/schema.js';
import {
  CreateCourseInput,
  UpdateCourseInput,
  CreateApplicationInput,
  UpdateApplicationInput,
  AllocateSeatInput,
  FormConfigInput,
} from './admission.schema.js';

export interface CourseSeatSummary extends AdmissionCourseRecord {
  allocatedSeats: number;
  confirmedSeats: number;
  availableSeats: number;
  quotaSummaries: {
    quotaName: string;
    total: number;
    allocated: number;
    confirmed: number;
    available: number;
  }[];
}

export class AdmissionService {
  /**
   * Helper: Generate sequential-looking application number
   */
  private generateApplicationNumber(year: string): string {
    const yr = (year || new Date().getFullYear().toString()).replace(/[^0-9]/g, '').slice(-4);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ADM-${yr}-${rand}`;
  }

  // ==========================================
  // COURSES & SEAT MATRIX
  // ==========================================

  public async getCourses(institutionCode: string, academicYear?: string): Promise<CourseSeatSummary[]> {
    if (!db) throw new Error('Database connection required');

    const conditions = [eq(admissionCourses.institutionCode, institutionCode)];
    if (academicYear) {
      conditions.push(eq(admissionCourses.academicYear, academicYear));
    }

    const courses = await db.query.admissionCourses.findMany({
      where: and(...conditions),
      orderBy: [desc(admissionCourses.createdAt)],
    });

    // Compute live seat metrics per course
    const summaries: CourseSeatSummary[] = [];

    for (const c of courses) {
      const apps = await db.query.admissionApplications.findMany({
        where: and(
          eq(admissionApplications.institutionCode, institutionCode),
          eq(admissionApplications.allocatedCourseId, c.id)
        ),
      });

      const allocatedSeats = apps.filter((a) => a.status === 'allocated').length;
      const confirmedSeats = apps.filter((a) => a.status === 'confirmed').length;
      const availableSeats = Math.max(0, c.totalSeats - (allocatedSeats + confirmedSeats));

      const quotaSummaries = (c.quotas || []).map((q) => {
        const qAllocated = apps.filter(
          (a) => a.status === 'allocated' && (a.allocatedQuota || '').toLowerCase() === q.quotaName.toLowerCase()
        ).length;
        const qConfirmed = apps.filter(
          (a) => a.status === 'confirmed' && (a.allocatedQuota || '').toLowerCase() === q.quotaName.toLowerCase()
        ).length;
        const qAvailable = Math.max(0, q.seats - (qAllocated + qConfirmed));

        return {
          quotaName: q.quotaName,
          total: q.seats,
          allocated: qAllocated,
          confirmed: qConfirmed,
          available: qAvailable,
        };
      });

      summaries.push({
        ...c,
        allocatedSeats,
        confirmedSeats,
        availableSeats,
        quotaSummaries,
      });
    }

    return summaries;
  }

  public async createCourse(institutionCode: string, payload: CreateCourseInput) {
    if (!db) throw new Error('Database connection required');

    // Validate that quota seats do not exceed total seats
    const quotaTotal = (payload.quotas || []).reduce((acc, curr) => acc + (curr.seats || 0), 0);
    if (quotaTotal > payload.totalSeats) {
      throw {
        statusCode: 400,
        code: 'INVALID_QUOTA_SUM',
        message: `Sum of quota seats (${quotaTotal}) exceeds total course seats (${payload.totalSeats}).`,
      };
    }

    const existing = await db.query.admissionCourses.findFirst({
      where: and(
        eq(admissionCourses.institutionCode, institutionCode),
        eq(admissionCourses.academicYear, payload.academicYear),
        eq(admissionCourses.courseCode, payload.courseCode)
      ),
    });

    if (existing) {
      throw {
        statusCode: 409,
        code: 'COURSE_EXISTS',
        message: `Course with code "${payload.courseCode}" already exists for batch ${payload.academicYear}.`,
      };
    }

    const id = `ac_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const [created] = await db
      .insert(admissionCourses)
      .values({
        id,
        institutionCode,
        academicYear: payload.academicYear,
        courseCode: payload.courseCode.toUpperCase().trim(),
        courseName: payload.courseName.trim(),
        programType: payload.programType,
        totalSeats: payload.totalSeats,
        quotas: payload.quotas,
      })
      .returning();

    return created;
  }

  public async updateCourse(institutionCode: string, id: string, payload: UpdateCourseInput) {
    if (!db) throw new Error('Database connection required');

    const course = await db.query.admissionCourses.findFirst({
      where: and(eq(admissionCourses.institutionCode, institutionCode), eq(admissionCourses.id, id)),
    });

    if (!course) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Course not found.' };
    }

    const newTotal = payload.totalSeats ?? course.totalSeats;
    const newQuotas = payload.quotas ?? course.quotas ?? [];

    const quotaTotal = newQuotas.reduce((acc, curr) => acc + (curr.seats || 0), 0);
    if (quotaTotal > newTotal) {
      throw {
        statusCode: 400,
        code: 'INVALID_QUOTA_SUM',
        message: `Sum of quota seats (${quotaTotal}) exceeds total course seats (${newTotal}).`,
      };
    }

    const updateData: Partial<typeof admissionCourses.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (payload.courseName) updateData.courseName = payload.courseName.trim();
    if (payload.totalSeats !== undefined) updateData.totalSeats = payload.totalSeats;
    if (payload.quotas !== undefined) updateData.quotas = payload.quotas;
    if (payload.programType) updateData.programType = payload.programType;

    const [updated] = await db
      .update(admissionCourses)
      .set(updateData)
      .where(and(eq(admissionCourses.institutionCode, institutionCode), eq(admissionCourses.id, id)))
      .returning();

    return updated;
  }

  public async deleteCourse(institutionCode: string, id: string) {
    if (!db) throw new Error('Database connection required');

    // Check if any students are allocated or confirmed
    const activeStudent = await db.query.admissionApplications.findFirst({
      where: and(
        eq(admissionApplications.institutionCode, institutionCode),
        eq(admissionApplications.allocatedCourseId, id),
        or(eq(admissionApplications.status, 'allocated'), eq(admissionApplications.status, 'confirmed'))
      ),
    });

    if (activeStudent) {
      throw {
        statusCode: 400,
        code: 'COURSE_IN_USE',
        message: 'Cannot delete course with active allocated or confirmed students.',
      };
    }

    await db
      .delete(admissionCourses)
      .where(and(eq(admissionCourses.institutionCode, institutionCode), eq(admissionCourses.id, id)));

    return { success: true, message: 'Course deleted successfully.' };
  }

  // ==========================================
  // DASHBOARD STATS
  // ==========================================

  public async getStats(institutionCode: string, academicYear?: string) {
    if (!db) throw new Error('Database connection required');

    const courseConditions = [eq(admissionCourses.institutionCode, institutionCode)];
    const appConditions = [eq(admissionApplications.institutionCode, institutionCode)];

    if (academicYear) {
      courseConditions.push(eq(admissionCourses.academicYear, academicYear));
      appConditions.push(eq(admissionApplications.academicYear, academicYear));
    }

    const [courses, apps] = await Promise.all([
      db.query.admissionCourses.findMany({ where: and(...courseConditions) }),
      db.query.admissionApplications.findMany({ where: and(...appConditions) }),
    ]);

    const totalSeats = courses.reduce((acc, c) => acc + (c.totalSeats || 0), 0);
    const allocatedSeats = apps.filter((a) => a.status === 'allocated').length;
    const confirmedSeats = apps.filter((a) => a.status === 'confirmed').length;
    const availableSeats = Math.max(0, totalSeats - (allocatedSeats + confirmedSeats));
    const waitingListCount = apps.filter((a) => a.status === 'waiting_list').length;
    const cancelledCount = apps.filter((a) => a.status === 'cancelled').length;

    // Extract all unique batches for filtering
    const allApps = await db.query.admissionApplications.findMany({
      where: eq(admissionApplications.institutionCode, institutionCode),
      columns: { academicYear: true },
    });
    const batchSet = new Set<string>();
    courses.forEach((c) => batchSet.add(c.academicYear));
    allApps.forEach((a) => batchSet.add(a.academicYear));
    if (batchSet.size === 0) {
      batchSet.add('2026-2027');
    }
    const batches = Array.from(batchSet).sort().reverse();

    return {
      totalSeats,
      allocatedSeats,
      confirmedSeats,
      availableSeats,
      waitingListCount,
      cancelledCount,
      totalApplications: apps.length,
      batches,
    };
  }

  // ==========================================
  // APPLICATIONS (STUDENTS) CRUD & FILTERS
  // ==========================================

  public async getApplications(
    institutionCode: string,
    filters: {
      academicYear?: string;
      status?: string;
      branchId?: string;
      quota?: string;
      search?: string;
    }
  ) {
    if (!db) throw new Error('Database connection required');

    const conditions = [eq(admissionApplications.institutionCode, institutionCode)];

    if (filters.academicYear && filters.academicYear !== 'all') {
      conditions.push(eq(admissionApplications.academicYear, filters.academicYear));
    }

    if (filters.status && filters.status !== 'all') {
      conditions.push(eq(admissionApplications.status, filters.status));
    }

    const apps = await db.query.admissionApplications.findMany({
      where: and(...conditions),
      orderBy: [desc(admissionApplications.createdAt)],
    });

    let filtered = apps;

    // Filter by branch/course:
    // If status is waiting_list, compare with preferredCourseId
    // If status is allocated or confirmed, compare with allocatedCourseId
    if (filters.branchId && filters.branchId !== 'all') {
      filtered = filtered.filter((a) => {
        if (a.status === 'waiting_list') {
          return a.preferredCourseId === filters.branchId;
        }
        return a.allocatedCourseId === filters.branchId;
      });
    }

    // Filter by quota
    if (filters.quota && filters.quota !== 'all') {
      filtered = filtered.filter(
        (a) => (a.allocatedQuota || '').toLowerCase().trim() === filters.quota?.toLowerCase().trim()
      );
    }

    // Search query
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      filtered = filtered.filter(
        (a) =>
          a.fullName.toLowerCase().includes(q) ||
          a.applicationNumber.toLowerCase().includes(q) ||
          a.parentPhone.toLowerCase().includes(q) ||
          (a.fatherName && a.fatherName.toLowerCase().includes(q)) ||
          (a.motherName && a.motherName.toLowerCase().includes(q))
      );
    }

    return filtered;
  }

  public async getApplicationById(institutionCode: string, id: string) {
    if (!db) throw new Error('Database connection required');

    const application = await db.query.admissionApplications.findFirst({
      where: and(eq(admissionApplications.institutionCode, institutionCode), eq(admissionApplications.id, id)),
    });

    if (!application) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Application not found.' };
    }

    return application;
  }

  public async createApplication(
    institutionCode: string,
    createdByUid: string,
    payload: CreateApplicationInput
  ) {
    if (!db) throw new Error('Database connection required');

    let preferredCourseName = payload.preferredCourseName || '';
    if (payload.preferredCourseId && !preferredCourseName) {
      const course = await db.query.admissionCourses.findFirst({
        where: eq(admissionCourses.id, payload.preferredCourseId),
      });
      if (course) preferredCourseName = course.courseName;
    }

    const appNumber = this.generateApplicationNumber(payload.academicYear);
    const id = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const [created] = await db
      .insert(admissionApplications)
      .values({
        id,
        institutionCode,
        academicYear: payload.academicYear,
        applicationNumber: appNumber,
        fullName: payload.fullName.trim(),
        parentPhone: payload.parentPhone.trim(),
        dob: payload.dob || '',
        fatherName: payload.fatherName || '',
        motherName: payload.motherName || '',
        guardianPhone: payload.guardianPhone || '',
        address: payload.address || '',
        bloodGroup: payload.bloodGroup || '',
        programType: payload.programType || 'engineering',
        preferredCourseId: payload.preferredCourseId || null,
        preferredCourseName,
        status: 'waiting_list', // ALWAYS starts in waiting list
        notes: payload.notes || '',
        customFields: payload.customFields || {},
        createdBy: createdByUid,
      })
      .returning();

    return created;
  }

  public async updateApplication(institutionCode: string, id: string, payload: UpdateApplicationInput) {
    if (!db) throw new Error('Database connection required');

    const app = await db.query.admissionApplications.findFirst({
      where: and(eq(admissionApplications.institutionCode, institutionCode), eq(admissionApplications.id, id)),
    });

    if (!app) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Application not found.' };
    }

    const updateData: Partial<typeof admissionApplications.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (payload.fullName) updateData.fullName = payload.fullName.trim();
    if (payload.parentPhone) updateData.parentPhone = payload.parentPhone.trim();
    if (payload.dob !== undefined) updateData.dob = payload.dob;
    if (payload.fatherName !== undefined) updateData.fatherName = payload.fatherName;
    if (payload.motherName !== undefined) updateData.motherName = payload.motherName;
    if (payload.guardianPhone !== undefined) updateData.guardianPhone = payload.guardianPhone;
    if (payload.address !== undefined) updateData.address = payload.address;
    if (payload.bloodGroup !== undefined) updateData.bloodGroup = payload.bloodGroup;
    if (payload.preferredCourseId !== undefined) updateData.preferredCourseId = payload.preferredCourseId;
    if (payload.preferredCourseName !== undefined) updateData.preferredCourseName = payload.preferredCourseName;
    if (payload.notes !== undefined) updateData.notes = payload.notes;
    if (payload.customFields !== undefined) updateData.customFields = payload.customFields;

    const [updated] = await db
      .update(admissionApplications)
      .set(updateData)
      .where(and(eq(admissionApplications.institutionCode, institutionCode), eq(admissionApplications.id, id)))
      .returning();

    return updated;
  }

  // ==========================================
  // ALLOCATION / UNALLOCATION / CONFIRMATION
  // ==========================================

  /**
   * Allocate a seat to a waiting student
   */
  public async allocateSeat(institutionCode: string, id: string, payload: AllocateSeatInput) {
    if (!db) throw new Error('Database connection required');

    const app = await db.query.admissionApplications.findFirst({
      where: and(eq(admissionApplications.institutionCode, institutionCode), eq(admissionApplications.id, id)),
    });

    if (!app) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Application not found.' };
    }

    if (app.status === 'confirmed') {
      throw {
        statusCode: 400,
        code: 'ALREADY_CONFIRMED',
        message: 'Cannot re-allocate a confirmed admission. Unconfirm or cancel first.',
      };
    }

    // Verify course exists in this institution
    const course = await db.query.admissionCourses.findFirst({
      where: and(eq(admissionCourses.institutionCode, institutionCode), eq(admissionCourses.id, payload.courseId)),
    });

    if (!course) {
      throw { statusCode: 404, code: 'COURSE_NOT_FOUND', message: 'Target course not found.' };
    }

    // Check course overall capacity
    const appsInCourse = await db.query.admissionApplications.findMany({
      where: and(
        eq(admissionApplications.institutionCode, institutionCode),
        eq(admissionApplications.allocatedCourseId, course.id),
        or(eq(admissionApplications.status, 'allocated'), eq(admissionApplications.status, 'confirmed'))
      ),
    });

    // If candidate was already allocated in this course, don't double count
    const occupiedOverall = appsInCourse.filter((a) => a.id !== id).length;
    if (occupiedOverall >= course.totalSeats) {
      throw {
        statusCode: 400,
        code: 'COURSE_FULL',
        message: `All ${course.totalSeats} seats in ${course.courseName} are occupied.`,
      };
    }

    // Check quota capacity
    const targetQuota = (course.quotas || []).find(
      (q) => q.quotaName.toLowerCase().trim() === payload.quota.toLowerCase().trim()
    );

    if (targetQuota) {
      const occupiedQuota = appsInCourse.filter(
        (a) =>
          a.id !== id &&
          (a.allocatedQuota || '').toLowerCase().trim() === payload.quota.toLowerCase().trim()
      ).length;

      if (occupiedQuota >= targetQuota.seats) {
        throw {
          statusCode: 400,
          code: 'QUOTA_FULL',
          message: `All ${targetQuota.seats} seats in quota "${targetQuota.quotaName}" for ${course.courseName} are occupied.`,
        };
      }
    }

    const [updated] = await db
      .update(admissionApplications)
      .set({
        status: 'allocated',
        allocatedCourseId: course.id,
        allocatedCourseName: course.courseName,
        allocatedQuota: payload.quota,
        allocatedAt: new Date(),
        notes: payload.notes || app.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(admissionApplications.institutionCode, institutionCode), eq(admissionApplications.id, id)))
      .returning();

    return updated;
  }

  /**
   * Unallocate seat: moves student back to Waiting List, frees up seat immediately
   */
  public async unallocateSeat(institutionCode: string, id: string, notes?: string) {
    if (!db) throw new Error('Database connection required');

    const app = await db.query.admissionApplications.findFirst({
      where: and(eq(admissionApplications.institutionCode, institutionCode), eq(admissionApplications.id, id)),
    });

    if (!app) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Application not found.' };
    }

    if (app.status === 'confirmed') {
      throw {
        statusCode: 400,
        code: 'CONFIRMED_SEAT',
        message: 'Confirmed admissions cannot be unallocated directly. Please withdraw/cancel first.',
      };
    }

    const [updated] = await db
      .update(admissionApplications)
      .set({
        status: 'waiting_list',
        allocatedCourseId: null,
        allocatedCourseName: '',
        allocatedQuota: '',
        allocatedAt: null,
        notes: notes || app.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(admissionApplications.institutionCode, institutionCode), eq(admissionApplications.id, id)))
      .returning();

    return updated;
  }

  /**
   * Confirm seat: locks the seat permanently (fees paid, documents verified)
   */
  public async confirmSeat(institutionCode: string, id: string, notes?: string) {
    if (!db) throw new Error('Database connection required');

    const app = await db.query.admissionApplications.findFirst({
      where: and(eq(admissionApplications.institutionCode, institutionCode), eq(admissionApplications.id, id)),
    });

    if (!app) {
      throw { statusCode: 404, code: 'NOT_FOUND', message: 'Application not found.' };
    }

    if (!app.allocatedCourseId) {
      throw {
        statusCode: 400,
        code: 'NOT_ALLOCATED',
        message: 'Student must be allocated a seat before confirmation.',
      };
    }

    const [updated] = await db
      .update(admissionApplications)
      .set({
        status: 'confirmed',
        confirmedAt: new Date(),
        notes: notes || app.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(admissionApplications.institutionCode, institutionCode), eq(admissionApplications.id, id)))
      .returning();

    return updated;
  }

  /**
   * Cancel application
   */
  public async cancelApplication(institutionCode: string, id: string, notes?: string) {
    if (!db) throw new Error('Database connection required');

    const [updated] = await db
      .update(admissionApplications)
      .set({
        status: 'cancelled',
        notes: notes || undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(admissionApplications.institutionCode, institutionCode), eq(admissionApplications.id, id)))
      .returning();

    return updated;
  }

  // ==========================================
  // DYNAMIC FORM CONFIGS PIPELINE
  // ==========================================

  public async getFormConfigs(institutionCode: string, programType?: string) {
    if (!db) throw new Error('Database connection required');

    const conditions = [
      eq(admissionFormConfigs.institutionCode, institutionCode),
      eq(admissionFormConfigs.isActive, true),
    ];

    if (programType && programType !== 'all') {
      conditions.push(or(eq(admissionFormConfigs.programType, programType), eq(admissionFormConfigs.programType, 'all'))!);
    }

    return db.query.admissionFormConfigs.findMany({
      where: and(...conditions),
      orderBy: [admissionFormConfigs.order],
    });
  }

  public async saveFormConfig(institutionCode: string, payload: FormConfigInput) {
    if (!db) throw new Error('Database connection required');

    const id = `afc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Upsert by institutionCode + programType + fieldKey
    const existing = await db.query.admissionFormConfigs.findFirst({
      where: and(
        eq(admissionFormConfigs.institutionCode, institutionCode),
        eq(admissionFormConfigs.programType, payload.programType),
        eq(admissionFormConfigs.fieldKey, payload.fieldKey)
      ),
    });

    if (existing) {
      const [updated] = await db
        .update(admissionFormConfigs)
        .set({
          label: payload.label,
          fieldType: payload.fieldType,
          options: payload.options,
          placeholder: payload.placeholder,
          isRequired: payload.isRequired,
          order: payload.order,
          isActive: payload.isActive,
          updatedAt: new Date(),
        })
        .where(eq(admissionFormConfigs.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(admissionFormConfigs)
      .values({
        id,
        institutionCode,
        programType: payload.programType,
        fieldKey: payload.fieldKey,
        label: payload.label,
        fieldType: payload.fieldType,
        options: payload.options,
        placeholder: payload.placeholder,
        isRequired: payload.isRequired,
        order: payload.order,
        isActive: payload.isActive ?? true,
      })
      .returning();

    return created;
  }

  public async deleteFormConfig(institutionCode: string, id: string) {
    if (!db) throw new Error('Database connection required');

    await db
      .update(admissionFormConfigs)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(admissionFormConfigs.institutionCode, institutionCode), eq(admissionFormConfigs.id, id)));

    return { success: true };
  }
}

export const admissionService = new AdmissionService();
