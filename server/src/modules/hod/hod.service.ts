import { db } from '../shared/db/index.js';
import {
  departmentCourses,
  DepartmentCourseEntity,
  examEligibility,
  ExamEligibilityEntity,
  schoolNotices,
  SchoolNoticeRecord,
  users,
} from '../shared/db/schema.js';
import { eq, and, sql, desc, or } from 'drizzle-orm';

function getDb() {
  if (!db) {
    const err: any = new Error('Database unavailable');
    err.statusCode = 500;
    throw err;
  }
  return db;
}

export interface AssignCourseInput {
  facultyId: string;
  facultyName?: string;
}

export class HODService {
  async getKPIs(institutionCode: string, department: string) {
    const database = getDb();

    // 1. Courses in department
    const courseConditions = [eq(departmentCourses.institutionCode, institutionCode)];
    if (department) {
      courseConditions.push(eq(departmentCourses.department, department));
    }

    const courses = await database
      .select()
      .from(departmentCourses)
      .where(and(...courseConditions));

    const totalCourses = courses.length;
    const practicalLabs = courses.filter((c) => c.type === 'practical_lab').length;
    const unassignedCourses = courses.filter((c) => !c.instructorId || c.instructorId.trim() === '').length;
    const totalSyllabus = courses.reduce((sum, c) => sum + (c.syllabusProgressPct || 0), 0);
    const averageSyllabusProgress = totalCourses > 0 ? Math.round(totalSyllabus / totalCourses) : 0;

    // 2. Faculty in department
    const faculty = await this.getFaculty(institutionCode, department);
    const totalFaculty = faculty.length;
    const facultyOnDuty = faculty.filter((f) => f.status !== 'on_leave' && f.status !== 'absent').length;

    // 3. Exam eligibility alerts in department
    const elgConditions = [eq(examEligibility.institutionCode, institutionCode)];
    if (department) {
      elgConditions.push(eq(examEligibility.department, department));
    }
    const eligRecords = await database
      .select()
      .from(examEligibility)
      .where(and(...elgConditions));

    const detentionAlertsCount = eligRecords.filter((e) => e.hallTicketStatus !== 'eligible').length;

    // 4. Student count in department
    const studentConditions = [
      eq(users.institutionCode, institutionCode),
      eq(users.role, 'student'),
    ];
    if (department && department.trim() !== '') {
      studentConditions.push(
        sql`(${users.scope}->>'department' ILIKE ${department} OR ${users.scope}->>'dept' ILIKE ${department})`
      );
    }
    const studentUsers = await database
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(...studentConditions));
    const totalStudents = Number(studentUsers[0]?.count || 0);

    return {
      totalStudents,
      facultyOnDuty,
      totalFaculty,
      activeCourses: totalCourses,
      practicalLabsCount: practicalLabs,
      averageSyllabusProgress,
      detentionAlertsCount,
      unassignedCoursesCount: unassignedCourses,
      todayLabSessions: practicalLabs > 0 ? Math.min(practicalLabs, 4) : 0,
    };
  }

  async getFaculty(institutionCode: string, department?: string) {
    const database = getDb();
    const rawUsers = await database
      .select()
      .from(users)
      .where(
        and(
          eq(users.institutionCode, institutionCode),
          or(
            eq(users.role, 'teacher'),
            eq(users.role, 'hod'),
            eq(users.role, 'professor'),
            eq(users.role, 'assistant_professor'),
            eq(users.role, 'associate_professor')
          )!
        )
      );

    const facultyList = rawUsers
      .map((u) => {
        let parsedScope: any = {};
        if (typeof u.scope === 'object' && u.scope !== null) {
          parsedScope = u.scope;
        } else if (typeof u.scope === 'string') {
          try {
            parsedScope = JSON.parse(u.scope);
          } catch {
            parsedScope = {};
          }
        }

        const userDept = parsedScope.department || (u as any).department || '';
        return {
          id: u.id,
          name: u.fullName,
          employeeId: parsedScope.employeeId || u.id,
          email: u.email,
          phone: u.phone || '+91 98765 43210',
          rank: parsedScope.rank || (u.role === 'hod' ? 'professor' : 'assistant_professor'),
          department: userDept,
          specialization: parsedScope.specialization || 'Computer Science & Engineering',
          maxCreditsPerWeek: Number(parsedScope.maxCreditsPerWeek) || 18,
          assignedCredits: Number(parsedScope.assignedCredits) || 0,
          assignedCourses: Array.isArray(parsedScope.assignedCourses) ? parsedScope.assignedCourses : [],
          status: parsedScope.status || 'present',
          cabinNumber: parsedScope.cabinNumber || 'CSB-101',
        };
      })
      .filter((f) => {
        if (!department || department.trim() === '') return true;
        return f.department.toLowerCase() === department.toLowerCase();
      });

    return facultyList;
  }

  async getCourses(institutionCode: string, department?: string): Promise<DepartmentCourseEntity[]> {
    const database = getDb();
    const conditions = [eq(departmentCourses.institutionCode, institutionCode)];
    if (department && department.trim() !== '') {
      conditions.push(eq(departmentCourses.department, department));
    }

    return await database
      .select()
      .from(departmentCourses)
      .where(and(...conditions))
      .orderBy(departmentCourses.code);
  }

  async createCourse(institutionCode: string, payload: any): Promise<DepartmentCourseEntity> {
    const database = getDb();
    const [created] = await database
      .insert(departmentCourses)
      .values({
        institutionCode,
        code: payload.code,
        name: payload.name,
        department: payload.department,
        semester: payload.semester,
        batchYear: payload.batchYear || '',
        type: payload.type || 'theory',
        credits: Number(payload.credits) || 3,
        instructorId: payload.instructorId || '',
        instructorName: payload.instructorName || '',
        instructorRank: payload.instructorRank || '',
        enrolledStudentsCount: Number(payload.enrolledStudentsCount) || 0,
        totalPlannedHours: Number(payload.totalPlannedHours) || 45,
        completedHours: Number(payload.completedHours) || 0,
        syllabusProgressPct: Number(payload.syllabusProgressPct) || 0,
        labBatchesCount: Number(payload.labBatchesCount) || 1,
      })
      .returning();

    return created;
  }

  async assignCourseInstructor(
    institutionCode: string,
    courseId: string,
    input: AssignCourseInput
  ): Promise<DepartmentCourseEntity> {
    const database = getDb();

    // 1. Verify course
    const [course] = await database
      .select()
      .from(departmentCourses)
      .where(
        and(
          eq(departmentCourses.id, courseId),
          eq(departmentCourses.institutionCode, institutionCode)
        )
      );

    if (!course) {
      const err: any = new Error('Course not found in current institution');
      err.statusCode = 404;
      throw err;
    }

    // 2. Verify faculty exists in same institution
    const [teacher] = await database
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, input.facultyId),
          eq(users.institutionCode, institutionCode)
        )
      );

    if (!teacher) {
      const err: any = new Error('Selected faculty member not found in this institution');
      err.statusCode = 400;
      throw err;
    }

    const instructorName = input.facultyName || teacher.fullName;
    let instructorRank = 'Assistant Professor';
    if (typeof teacher.scope === 'object' && teacher.scope && (teacher.scope as any).rank) {
      instructorRank = (teacher.scope as any).rank;
    }

    // 3. Concurrency-safe atomic update
    const [updated] = await database
      .update(departmentCourses)
      .set({
        instructorId: teacher.id,
        instructorName,
        instructorRank,
        version: sql`${departmentCourses.version} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(departmentCourses.id, courseId),
          eq(departmentCourses.institutionCode, institutionCode)
        )
      )
      .returning();

    return updated;
  }

  async getExamEligibility(
    institutionCode: string,
    department?: string,
    semester?: string
  ): Promise<ExamEligibilityEntity[]> {
    const database = getDb();
    const conditions = [eq(examEligibility.institutionCode, institutionCode)];
    if (department && department.trim() !== '') {
      conditions.push(eq(examEligibility.department, department));
    }
    if (semester && semester.trim() !== '' && semester.toLowerCase() !== 'all') {
      conditions.push(eq(examEligibility.semester, semester));
    }

    return await database
      .select()
      .from(examEligibility)
      .where(and(...conditions))
      .orderBy(desc(examEligibility.overallAttendancePct));
  }

  async updateHallTicketStatus(
    institutionCode: string,
    recordId: string,
    status: string,
    note?: string,
    approvedBy?: string
  ): Promise<ExamEligibilityEntity> {
    const database = getDb();
    const [record] = await database
      .select()
      .from(examEligibility)
      .where(
        and(
          eq(examEligibility.id, recordId),
          eq(examEligibility.institutionCode, institutionCode)
        )
      );

    if (!record) {
      const err: any = new Error('Exam eligibility record not found');
      err.statusCode = 404;
      throw err;
    }

    const attendancePct = Number(record.overallAttendancePct);

    // E6: Server-side enforcement of 75% attendance threshold
    if ((status === 'eligible' || status === 'condonation_needed') && attendancePct < 75) {
      const remarks = (note || record.remarks || record.condonationReason || '').trim();
      if (!remarks) {
        const err: any = new Error(
          'ATTENDANCE_RULE_VIOLATION: Student attendance is below 75% (' +
            attendancePct +
            '%). A mandatory condonation reason or justifying remark must be provided.'
        );
        err.statusCode = 400;
        throw err;
      }
    }

    const [updated] = await database
      .update(examEligibility)
      .set({
        hallTicketStatus: status,
        remarks: note ? note : record.remarks,
        approvedBy: approvedBy || 'Head of Department',
        approvalDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(examEligibility.id, recordId),
          eq(examEligibility.institutionCode, institutionCode)
        )
      )
      .returning();

    return updated;
  }

  async getNotices(institutionCode: string, department?: string): Promise<SchoolNoticeRecord[]> {
    const database = getDb();
    const conditions = [eq(schoolNotices.institutionCode, institutionCode)];
    if (department && department.trim() !== '') {
      conditions.push(
        or(
          eq(schoolNotices.department, department),
          eq(schoolNotices.targetAudience, 'all'),
          eq(schoolNotices.targetAudience, 'faculty')
        )!
      );
    }

    return await database
      .select()
      .from(schoolNotices)
      .where(and(...conditions))
      .orderBy(desc(schoolNotices.createdAt));
  }

  async createNotice(
    institutionCode: string,
    user: any,
    payload: any
  ): Promise<SchoolNoticeRecord> {
    const database = getDb();
    const [created] = await database
      .insert(schoolNotices)
      .values({
        institutionCode,
        title: payload.title,
        content: payload.content,
        targetAudience: payload.targetAudience || 'faculty',
        department: payload.department || '',
        priority: payload.priority || 'normal',
        authorId: user.uid,
        authorName: user.name || payload.authorName || 'Head of Department',
        authorRole: 'hod',
      })
      .returning();

    return created;
  }
}

export const hodService = new HODService();
