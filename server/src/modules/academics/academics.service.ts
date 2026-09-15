import { academicsRepository } from './academics.repository.js';
import { db, dbFindUsersByInstitution, dbFindUserByIdOrUid, dbFindStudentByUsnInInstitution, dbFindStudentsByClassScope, dbCountStudentsByClassScope } from '../shared/db/index.js';
import { eq as eqSql, and as andSql } from 'drizzle-orm';
import { studentClasses, users as usersTable, subjectTeachers } from '../shared/db/schema.js';
import {
  CreateClassSectionInput,
  UpdateClassSectionInput,
  CreateSubjectInput,
  CreateSubjectTeacherInput,
  CreatePeriodInput,
  UpdateInstitutionTermsInput,
  UpdateHolidayCalendarInput,
  CreateTimetableInput,
  MarkAttendanceInput,
  CreateExamInput,
  UpdateExamInput,
  SaveMarksInput,
  CreateHomeworkInput,
  UpdateHomeworkInput,
  ATTENDANCE_STATUSES,
} from './academics.schema.js';

const TEACHER_ROLES = ['teacher', 'hod', 'admin', 'principal'];

export class AcademicsService {
  // ---------- Class Sections ----------
  public async listClassSections(institutionCode: string, opts?: { limit: number; offset: number }) {
    if (opts) {
      const { items, total } = await academicsRepository.listClassSectionsPaged(institutionCode, opts);
      return { data: items, total, limit: opts.limit, offset: opts.offset };
    }
    return academicsRepository.listClassSections(institutionCode);
  }

  public async createClassSection(institutionCode: string, input: CreateClassSectionInput) {
    if (input.classTeacherId) {
      const teacher = await this.findTeacher(institutionCode, input.classTeacherId);
      if (!teacher) {
        throw { statusCode: 400, code: 'INVALID_CLASS_TEACHER', message: 'classTeacherId does not reference a valid teacher in this institution' };
      }
    }
    return academicsRepository.createClassSection({ ...input, institutionCode });
  }

  public async updateClassSection(institutionCode: string, id: string, input: UpdateClassSectionInput) {
    const existing = await academicsRepository.getClassSectionById(id);
    if (!existing) {
      throw { statusCode: 404, code: 'CLASS_SECTION_NOT_FOUND', message: 'Class/section not found' };
    }
    if (existing.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied: class/section belongs to another institution' };
    }
    if (input.classTeacherId) {
      const teacher = await this.findTeacher(institutionCode, input.classTeacherId);
      if (!teacher) {
        throw { statusCode: 400, code: 'INVALID_CLASS_TEACHER', message: 'classTeacherId does not reference a valid teacher in this institution' };
      }
    }
    return academicsRepository.updateClassSection(id, input);
  }

  public async deleteClassSection(institutionCode: string, id: string) {
    const existing = await academicsRepository.getClassSectionById(id);
    if (!existing) {
      throw { statusCode: 404, code: 'CLASS_SECTION_NOT_FOUND', message: 'Class/section not found' };
    }
    if (existing.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied: class/section belongs to another institution' };
    }
    return academicsRepository.deleteClassSection(id);
  }

  // ---------- Subjects ----------
  public async listSubjects(institutionCode: string, opts?: { limit: number; offset: number }) {
    if (opts) {
      const { items, total } = await academicsRepository.listSubjectsPaged(institutionCode, opts);
      return { data: items, total, limit: opts.limit, offset: opts.offset };
    }
    return academicsRepository.listSubjects(institutionCode);
  }

  public async createSubject(institutionCode: string, input: CreateSubjectInput) {
    return academicsRepository.createSubject({ ...input, institutionCode });
  }

  // ---------- Subject Teachers ----------
  public async listSubjectTeachers(institutionCode: string, classSectionId?: string, teacherId?: string, opts?: { limit: number; offset: number }) {
    if (opts) {
      const { items, total } = await academicsRepository.listSubjectTeachersPaged(institutionCode, opts, classSectionId, teacherId);
      return { data: items, total, limit: opts.limit, offset: opts.offset };
    }
    return academicsRepository.listSubjectTeachers(institutionCode, classSectionId, teacherId);
  }

  public async createSubjectTeacher(institutionCode: string, input: CreateSubjectTeacherInput) {
    const classSection = await academicsRepository.getClassSectionById(input.classSectionId);
    if (!classSection || classSection.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 400, code: 'INVALID_CLASS_SECTION', message: 'classSectionId does not reference a class/section in this institution' };
    }

    const subject = await academicsRepository.getSubjectById(input.subjectId);
    if (!subject || subject.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 400, code: 'INVALID_SUBJECT', message: 'subjectId does not reference a subject in this institution' };
    }

    const teacher = await this.findTeacher(institutionCode, input.teacherId);
    if (!teacher) {
      throw { statusCode: 400, code: 'INVALID_TEACHER', message: 'teacherId does not reference a valid teacher in this institution' };
    }

    const existing = await academicsRepository.listSubjectTeachers(institutionCode, input.classSectionId);
    if (existing.some((st) => st.subjectId === input.subjectId)) {
      throw { statusCode: 409, code: 'SUBJECT_TEACHER_EXISTS', message: 'A teacher is already assigned to this subject for this class/section' };
    }

    return academicsRepository.createSubjectTeacher({ ...input, institutionCode });
  }

  public async deleteSubjectTeacher(institutionCode: string, id: string) {
    const existing = await academicsRepository.getSubjectTeacherById(id);
    if (!existing) {
      throw { statusCode: 404, code: 'SUBJECT_TEACHER_NOT_FOUND', message: 'Subject-teacher assignment not found' };
    }
    if (existing.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied: assignment belongs to another institution' };
    }
    return academicsRepository.deleteSubjectTeacher(id);
  }

  public async updateSubjectTeacher(institutionCode: string, id: string, input: { teacherId: string }) {
    const existing = await academicsRepository.getSubjectTeacherById(id);
    if (!existing) {
      throw { statusCode: 404, code: 'SUBJECT_TEACHER_NOT_FOUND', message: 'Subject-teacher assignment not found' };
    }
    if (existing.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied: assignment belongs to another institution' };
    }

    const teacher = await this.findTeacher(institutionCode, input.teacherId);
    if (!teacher) {
      throw { statusCode: 400, code: 'INVALID_TEACHER', message: 'teacherId does not reference a valid teacher in this institution' };
    }

    if (existing.teacherId === input.teacherId) {
      return existing;
    }

    const updated = await academicsRepository.updateSubjectTeacher(id, { teacherId: input.teacherId });

    // Cascade: keep timetable_slots.teacher_id in sync so student timetables reflect the new teacher.
    try {
      await academicsRepository.reassignTimetableSlotsForSubjectTeacher(
        institutionCode,
        existing.classSectionId,
        existing.subjectId,
        input.teacherId
      );
    } catch (err: any) {
      console.warn('[SubjectTeacher reassign warning] timetable cascade failed:', err?.message);
    }

    return updated;
  }

  // ---------- Periods ----------
  public async listPeriods(institutionCode: string, opts?: { limit: number; offset: number }) {
    if (opts) {
      const { items, total } = await academicsRepository.listPeriodsPaged(institutionCode, opts);
      return { data: items, total, limit: opts.limit, offset: opts.offset };
    }
    return academicsRepository.listPeriods(institutionCode);
  }

  public async createPeriod(institutionCode: string, input: CreatePeriodInput) {
    const existing = await academicsRepository.listPeriods(institutionCode);
    if (existing.some((p) => p.label.toLowerCase() === input.label.toLowerCase())) {
      throw { statusCode: 409, code: 'PERIOD_LABEL_EXISTS', message: `A period labeled "${input.label}" already exists` };
    }
    return academicsRepository.createPeriod({ ...input, institutionCode });
  }

  // ---------- Term & Holiday Config (delegated to admin config endpoints) ----------
  public async updateTerms(institutionCode: string, input: UpdateInstitutionTermsInput) {
    const { adminService } = await import('../admin/admin.service.js');
    return adminService.updateInstitutionConfig(institutionCode, {
      terms: [{ academicYear: input.academicYear, terms: input.terms }],
    });
  }

  public async updateHolidays(institutionCode: string, input: UpdateHolidayCalendarInput) {
    const { adminService } = await import('../admin/admin.service.js');
    return adminService.updateInstitutionConfig(institutionCode, {
      blockedDates: input.blockedDates,
    });
  }

  // ---------- Attendance ----------
  public async getRoster(institutionCode: string, timetableSlotId: string) {
    const slot = await academicsRepository.getTimetableSlotById(timetableSlotId);
    if (!slot || slot.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'SLOT_NOT_FOUND', message: 'Timetable slot not found' };
    }

    const classSection = await academicsRepository.getClassSectionById(slot.classSectionId);
    const students = await this.getStudentsForClassSection(slot.classSectionId);
    const subject = await academicsRepository.getSubjectById(slot.subjectId);

    return {
      slot: await this.enrichSlot(slot),
      classSection: classSection
        ? { id: classSection.id, name: classSection.name, department: classSection.department, section: classSection.section }
        : null,
      subject: subject ? { id: subject.id, name: subject.name, code: subject.code } : null,
      students,
    };
  }

  public async markAttendance(institutionCode: string, teacherUserId: string, input: MarkAttendanceInput) {
    const slot = await academicsRepository.getTimetableSlotById(input.timetableSlotId);
    if (!slot || slot.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'SLOT_NOT_FOUND', message: 'Timetable slot not found' };
    }

    const teacher = await this.findTeacher(institutionCode, teacherUserId);
    if (!teacher) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only teachers or administrators can mark attendance' };
    }
    const isAdmin = ['admin', 'hod', 'principal'].includes(teacher.role.toLowerCase());
    if (!isAdmin && teacher.id !== slot.teacherId) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'You are not the assigned teacher for this class' };
    }

    await this.assertNotBlockedDate(institutionCode, input.date);

    const existing = await academicsRepository.getAttendanceRecord(input.timetableSlotId, input.date);
    if (existing?.status === 'locked') {
      throw { statusCode: 403, code: 'ATTENDANCE_LOCKED', message: 'Attendance for this class/date is locked and can no longer be edited' };
    }

    const validStudentIds = new Set(
      (await this.getStudentsForClassSection(slot.classSectionId)).map((s) => s.id)
    );
    for (const entry of input.entries) {
      if (!validStudentIds.has(entry.studentId)) {
        throw { statusCode: 400, code: 'INVALID_STUDENT', message: `studentId ${entry.studentId} is not a member of this class/section` };
      }
      if (!ATTENDANCE_STATUSES.includes(entry.attendanceStatus)) {
        throw { statusCode: 400, code: 'INVALID_STATUS', message: `attendanceStatus must be one of: ${ATTENDANCE_STATUSES.join(', ')}` };
      }
    }

    const record = await academicsRepository.upsertAttendanceRecord({
      institutionCode,
      timetableSlotId: input.timetableSlotId,
      date: input.date,
      takenByTeacherId: teacher.id,
      status: 'submitted',
      submittedAt: new Date(),
    });

    const entryRows = input.entries.map((e) => ({
      attendanceRecordId: record.id,
      studentId: e.studentId,
      attendanceStatus: e.attendanceStatus,
      remarks: e.remarks || '',
    }));
    await academicsRepository.replaceEntriesForRecord(record.id, entryRows);

    await this.autoLockIfPastEndOfDay(record.id, input.date);

    return {
      recordId: record.id,
      status: record.status,
      entriesCount: input.entries.length,
    };
  }

  public async getAttendanceForSlot(institutionCode: string, timetableSlotId: string, date: string) {
    const slot = await academicsRepository.getTimetableSlotById(timetableSlotId);
    if (!slot || slot.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'SLOT_NOT_FOUND', message: 'Timetable slot not found' };
    }

    const record = await academicsRepository.getAttendanceRecord(timetableSlotId, date);
    if (!record) {
      return { slot: await this.enrichSlot(slot), record: null, entries: [] };
    }
    const entries = await academicsRepository.listEntriesForRecord(record.id);
    return { slot: await this.enrichSlot(slot), record, entries };
  }

  public async getStudentAttendanceHistory(institutionCode: string, studentUserId: string, fromDate?: string, toDate?: string) {
    const student = await this.findUser(institutionCode, studentUserId);
    if (!student || student.role.toLowerCase() !== 'student') {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only students can view their attendance' };
    }
    return this.buildStudentSummary(student.id, fromDate, toDate);
  }

  public async getParentView(institutionCode: string, parentUserId: string) {
    const parent = await this.findUser(institutionCode, parentUserId);
    if (!parent || parent.role.toLowerCase() !== 'parent') {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only parents can use this endpoint' };
    }
    const scope = this.parseScope(parent.scope);
    const linkedUsn = scope?.linkedStudentUSN || '';
    if (!linkedUsn) {
      throw { statusCode: 404, code: 'NO_LINKED_STUDENT', message: 'No linked student found. Complete your profile with the student USN.' };
    }
    const student = await dbFindStudentByUsnInInstitution(institutionCode, linkedUsn);
    if (!student) {
      throw { statusCode: 404, code: 'STUDENT_NOT_FOUND', message: 'Linked student was not found in this institution' };
    }
    const summary = await this.buildStudentSummary(student.id);
    const studentScope = this.parseScope(student.scope);
    const result = {
      ...summary,
      childId: student.id,
      childName: student.fullName || '',
      childEmail: student.email || '',
      childUSN: student.rollNoOrUSN || linkedUsn,
      childPhone: student.phone || '',
      childProfilePic: student.profilePicUrl || '',
      childDepartment: studentScope.department || student.department || '',
      childAcademicYear: studentScope.academicYear || '',
      childSection: studentScope.section || '',
      childClassSectionName: studentScope.classSectionName || '',
      childTenthPercentage: student.tenthPercentage || '',
      childTwelfthPercentage: student.twelfthPercentage || '',
      relation: scope?.relation || '',
    };
    return result;
  }

  public async getParentMarks(institutionCode: string, parentUserId: string) {
    const parent = await this.findUser(institutionCode, parentUserId);
    if (!parent || parent.role.toLowerCase() !== 'parent') {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only parents can use this endpoint' };
    }
    const scope = this.parseScope(parent.scope);
    const linkedUsn = scope?.linkedStudentUSN || '';
    if (!linkedUsn) {
      throw { statusCode: 404, code: 'NO_LINKED_STUDENT', message: 'No linked student found.' };
    }
    const student = await dbFindStudentByUsnInInstitution(institutionCode, linkedUsn);
    if (!student) {
      throw { statusCode: 404, code: 'STUDENT_NOT_FOUND', message: 'Linked student was not found in this institution' };
    }
    return this.getStudentMarks(institutionCode, student.id);
  }

  public async getParentTimetable(institutionCode: string, parentUserId: string, dateStr: string) {
    const parent = await this.findUser(institutionCode, parentUserId);
    if (!parent || parent.role.toLowerCase() !== 'parent') {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only parents can use this endpoint' };
    }
    const scope = this.parseScope(parent.scope);
    const linkedUsn = scope?.linkedStudentUSN || '';
    if (!linkedUsn) {
      throw { statusCode: 404, code: 'NO_LINKED_STUDENT', message: 'No linked student found.' };
    }
    const student = await dbFindStudentByUsnInInstitution(institutionCode, linkedUsn);
    if (!student) {
      throw { statusCode: 404, code: 'STUDENT_NOT_FOUND', message: 'Linked student was not found in this institution' };
    }
    return this.getMyTimetable(institutionCode, student.id, dateStr);
  }

  private async buildStudentSummary(studentId: string, fromDate?: string, toDate?: string) {
    let rows = await academicsRepository.listAttendanceEntriesWithSubject([studentId]);
    if (fromDate) rows = rows.filter((r) => r.date && this.dateStr(r.date) >= fromDate);
    if (toDate) rows = rows.filter((r) => r.date && this.dateStr(r.date) <= toDate);

    const subjectTotals = new Map<string, { present: number; total: number; subject: any }>();
    for (const row of rows) {
      const key = row.subjectId;
      const bucket = subjectTotals.get(key) || { present: 0, total: 0, subject: { id: row.subjectId, name: row.subjectName || '', code: '' } };
      bucket.total++;
      if (row.attendanceStatus !== 'absent') bucket.present++;
      subjectTotals.set(key, bucket);
    }

    const perSubject = Array.from(subjectTotals.values())
      .map((b) => ({ ...b, percentage: b.total > 0 ? Math.round((b.present / b.total) * 100) : 0 }))
      .sort((a, b) => a.subject?.name?.localeCompare(b.subject?.name || '') || 0);

    const grandTotal = rows.length;
    const presentTotal = rows.filter((r) => r.attendanceStatus !== 'absent').length;

    const daily = rows
      .filter((r) => r.date)
      .map((r) => ({
        date: this.dateStr(r.date),
        subjectId: r.subjectId,
        subjectName: r.subjectName || '',
        status: r.attendanceStatus,
      }))
      .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));

    return {
      studentId,
      overall: {
        present: presentTotal,
        total: grandTotal,
        percentage: grandTotal > 0 ? Math.round((presentTotal / grandTotal) * 100) : 0,
      },
      perSubject,
      daily,
    };
  }

  private dateStr(d: string | Date | null | undefined): string {
    if (!d) return '';
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.toISOString().slice(0, 10);
  }

  private async assertNotBlockedDate(institutionCode: string, date: string) {
    const { adminService } = await import('../admin/admin.service.js');
    const config = await adminService.getInstitutionConfig(institutionCode);
    const blocked = (config.blockedDates || []).find((b: any) => b.date === date);
    if (blocked) {
      throw {
        statusCode: 400,
        code: 'BLOCKED_DATE',
        message: `Cannot mark attendance: ${date} is blocked (${blocked.reason || 'holiday'})`,
      };
    }
  }

  private async autoLockIfPastEndOfDay(recordId: string, date: string) {
    const now = new Date();
    const dayEnd = new Date(`${date}T23:59:59`);
    if (now > dayEnd) {
      await academicsRepository.updateAttendanceRecordLock(recordId, now);
    }
  }

  private parseScope(scope: any): Record<string, any> {
    if (typeof scope === 'string') {
      try { return JSON.parse(scope); } catch { return {}; }
    }
    return scope || {};
  }

  // ---------- Timetable ----------
  public async createTimetable(institutionCode: string, createdByUserId: string, input: CreateTimetableInput) {
    const classSection = await academicsRepository.getClassSectionById(input.classSectionId);
    if (!classSection || classSection.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 400, code: 'INVALID_CLASS_SECTION', message: 'classSectionId does not reference a class/section in this institution' };
    }

    const creator = await this.findUser(institutionCode, createdByUserId);
    const creatorRole = creator?.role.toLowerCase() || '';
    const isStaffAdmin = ['admin', 'hod', 'principal'].includes(creatorRole);
    if (!isStaffAdmin) {
      if (!classSection.classTeacherId || classSection.classTeacherId !== creator?.id) {
        throw {
          statusCode: 403,
          code: 'FORBIDDEN',
          message: 'Teachers can only build timetables for their own assigned class/section',
        };
      }
    }

    const maxVersion = await academicsRepository.getMaxTimetableVersion(input.classSectionId);
    const version = maxVersion + 1;

    const slotRows: any[] = [];
    const seen = new Set<string>();
    for (const slot of input.slots) {
      if (seen.has(`${slot.dayOfWeek}:${slot.periodId}`)) {
        throw { statusCode: 409, code: 'DUPLICATE_SLOT', message: `Duplicate slot for day ${slot.dayOfWeek}, period ${slot.periodId}` };
      }
      seen.add(`${slot.dayOfWeek}:${slot.periodId}`);

      const subject = await academicsRepository.getSubjectById(slot.subjectId);
      if (!subject || subject.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
        throw { statusCode: 400, code: 'INVALID_SUBJECT', message: `slot: subject ${slot.subjectId} is invalid` };
      }

      const period = await academicsRepository.getPeriodById(slot.periodId);
      if (!period || period.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
        throw { statusCode: 400, code: 'INVALID_PERIOD', message: `slot: period ${slot.periodId} is invalid` };
      }

      const teacher = await this.findTeacher(institutionCode, slot.teacherId);
      if (!teacher) {
        throw { statusCode: 400, code: 'INVALID_TEACHER', message: `slot: teacher ${slot.teacherId} is invalid` };
      }

      slotRows.push({
        institutionCode,
        classSectionId: input.classSectionId,
        subjectId: slot.subjectId,
        teacherId: slot.teacherId,
        periodId: slot.periodId,
        dayOfWeek: slot.dayOfWeek,
        room: slot.room || '',
      });
    }

    const timetable = await academicsRepository.createTimetable({
      institutionCode,
      classSectionId: input.classSectionId,
      academicYear: input.academicYear,
      term: input.term,
      version,
      effectiveFrom: input.effectiveFrom,
      createdBy: createdByUserId,
    });

    const slots = await academicsRepository.replaceSlotsForTimetable(timetable.id, slotRows);

    return { timetable, slots: slots.length };
  }

  public async getClassTimetable(institutionCode: string, classSectionId: string, dateStr: string) {
    const classSection = await academicsRepository.getClassSectionById(classSectionId);
    if (!classSection || classSection.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'CLASS_SECTION_NOT_FOUND', message: 'Class/section not found' };
    }

    const effective = await academicsRepository.getEffectiveTimetable(classSectionId, dateStr);
    if (!effective) {
      return { classSection, effective: null, slots: [] };
    }

    const slots = await academicsRepository.listSlotsForTimetable(effective.id);
    const enriched = await this.enrichSlots(slots);
    return { classSection, effective, slots: enriched };
  }

  public async getTeacherTimetable(institutionCode: string, userId: string, dateStr: string) {
    const user = await this.findUser(institutionCode, userId);
    if (!user) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'User not found in institution' };
    }

    const dayOfWeek = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
    const slotsForDay = await academicsRepository.listSlotsForTeacherOnDay(user.id, dayOfWeek);

    const timetablesById = new Map<string, any>();
    const classVersions = new Map<string, any>();
    const classCache = new Map<string, any[]>();
    for (const slot of slotsForDay) {
      if (!timetablesById.has(slot.timetableId)) {
        const tt = await academicsRepository.getTimetableById(slot.timetableId);
        timetablesById.set(slot.timetableId, tt);
      }
      if (!classCache.has(slot.classSectionId)) {
        classCache.set(slot.classSectionId, await academicsRepository.listTimetablesForClass(slot.classSectionId));
      }
      if (!classVersions.has(slot.classSectionId)) {
        const classTts = classCache.get(slot.classSectionId) || [];
        const latest = classTts.filter((t) => t.effectiveFrom <= dateStr).sort((a, b) => b.version - a.version)[0];
        classVersions.set(slot.classSectionId, latest?.id || null);
      }
    }

    const enriched: any[] = [];
    for (const slot of slotsForDay) {
      const timetable = timetablesById.get(slot.timetableId);
      if (!timetable) continue;
      if (timetable.effectiveFrom > dateStr) continue;
      if (classVersions.get(slot.classSectionId) !== timetable.id) continue;

      enriched.push(await this.enrichSlot(slot, timetable));
    }

    const periodSort = (a: any, b: any) => {
      const ao = a?.period?.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b?.period?.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      const as = a?.period?.startTime ?? '';
      const bs = b?.period?.startTime ?? '';
      return as.localeCompare(bs);
    };
    enriched.sort(periodSort);
    return { date: dateStr, dayOfWeek, periods: enriched };
  }

  public async getAllTimetablesForClass(institutionCode: string, classSectionId: string) {
    const classSection = await academicsRepository.getClassSectionById(classSectionId);
    if (!classSection || classSection.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'CLASS_SECTION_NOT_FOUND', message: 'Class/section not found' };
    }
    return academicsRepository.listTimetablesForClass(classSectionId);
  }

  private async enrichSlots(slots: any[]) {
    const enriched = [];
    for (const slot of slots) {
      enriched.push(await this.enrichSlot(slot));
    }
    const slotSort = (a: any, b: any) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      const ao = a?.period?.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = b?.period?.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      const as = a?.period?.startTime ?? '';
      const bs = b?.period?.startTime ?? '';
      return as.localeCompare(bs);
    };
    return enriched.sort(slotSort);
  }

  private async enrichSlot(slot: any, timetable?: any) {
    const [subject, period, teacher] = await Promise.all([
      academicsRepository.getSubjectById(slot.subjectId),
      academicsRepository.getPeriodById(slot.periodId),
      this.findUser(slot.institutionCode, slot.teacherId),
    ]);
    return {
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      room: slot.room,
      subject: subject ? { id: subject.id, name: subject.name, code: subject.code } : null,
      period: period ? { id: period.id, label: period.label, startTime: period.startTime, endTime: period.endTime, sortOrder: period.sortOrder } : null,
      teacher: teacher ? { id: teacher.id, fullName: teacher.fullName } : null,
      timetable: timetable ? { id: timetable.id, version: timetable.version, effectiveFrom: timetable.effectiveFrom } : undefined,
    };
  }

  public async getMyClassSection(institutionCode: string, userId: string) {
    const user = await this.findUser(institutionCode, userId);
    if (!user) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'User not found in institution' };
    }

    // 1) Check if teacher is assigned as class teacher of any class
    const classSections = await academicsRepository.listClassSections(institutionCode);
    const asClassTeacher = classSections.find((cs) => cs.classTeacherId === user.id);
    if (asClassTeacher) return asClassTeacher;

    // 2) Check if teacher has subject assignments — return the first class they teach in
    if (db) {
      try {
        const stRows = await db
          .select({ classSectionId: subjectTeachers.classSectionId })
          .from(subjectTeachers)
          .where(
            andSql(
              eqSql(subjectTeachers.institutionCode, institutionCode),
              eqSql(subjectTeachers.teacherId, user.id)
            )
          )
          .limit(1);
        if (stRows.length > 0) {
          const cs = classSections.find((c) => c.id === stRows[0].classSectionId);
          if (cs) return cs;
        }
      } catch {}
    }

    // 3) Fallback: match by scope
    const scope = this.parseScope(user.scope);
    const match = classSections.find((cs) => {
      const matchesDept = !cs.department || (scope.department || '').toLowerCase() === cs.department.toLowerCase();
      const matchesYear = !cs.academicYear || (scope.academicYear || '').toLowerCase() === cs.academicYear.toLowerCase();
      const matchesSection = !cs.section || (scope.section || '').toLowerCase() === cs.section.toLowerCase();
      return matchesDept && matchesYear && matchesSection;
    });
    return match || null;
  }

  public async getMyTimetable(institutionCode: string, userId: string, dateStr: string) {
    const classSection = await this.getMyClassSection(institutionCode, userId);
    if (!classSection) {
      return { classSection: null, effective: null, slots: [] };
    }
    const effective = await academicsRepository.getEffectiveTimetable(classSection.id, dateStr);
    if (!effective) {
      return { classSection, effective: null, slots: [] };
    }
    const slots = await academicsRepository.listSlotsForTimetable(effective.id);
    const enriched = await this.enrichSlots(slots);
    return { classSection, effective, slots: enriched };
  }

  // ---------- Reports (HOD / Principal / Admin) ----------
  public async getDepartmentOverview(institutionCode: string, department?: string) {
    const allUsers = await dbFindUsersByInstitution(institutionCode, 'student', { limit: 500 });
    const students = allUsers
      .map((u) => ({ user: u, scope: this.parseScope(u.scope) }))
      .filter(({ scope }) => !department || (scope.department || '').toLowerCase() === department.toLowerCase());

    const sections = new Map<string, any>();
    for (const { user, scope } of students) {
      const key = `${scope.department || ''}|${scope.academicYear || ''}|${scope.section || ''}`;
      const bucket = sections.get(key) || {
        department: scope.department || '',
        academicYear: scope.academicYear || '',
        section: scope.section || '',
        students: [],
        present: 0,
        total: 0,
      };
      bucket.students.push(user);
      sections.set(key, bucket);
    }

    const sectionStats = [];
    for (const [key, bucket] of sections.entries()) {
      const stats = await this.getSectionAttendanceStats(bucket.students.map((s: any) => s.id));
      sectionStats.push({
        sectionKey: key,
        department: bucket.department,
        academicYear: bucket.academicYear,
        section: bucket.section,
        studentsCount: bucket.students.length,
        averagePercentage: stats.percentage,
        totalClasses: stats.total,
        lowAttendance: stats.lowAttendance,
      });
    }

    sectionStats.sort((a, b) => (b.averagePercentage || 0) - (a.averagePercentage || 0));
    return { department: department || null, sections: sectionStats };
  }

  public async getInstitutionOverview(institutionCode: string) {
    return this.getDepartmentOverview(institutionCode);
  }

  /**
   * Class/section attendance summary for the admin attendance console.
   * SQL-side aggregation keeps payloads bounded; the student roster is
   * paginated so large classes (hundreds+) stay cheap. Non-admin staff
   * (teachers) can only view the class they are class teacher of.
   */
  public async getClassAttendanceSummary(
    institutionCode: string,
    userId: string,
    role: string,
    classSectionId: string,
    fromDate?: string,
    toDate?: string,
    opts?: { limit: number; offset: number }
  ) {
    const normalizedRole = (role || '').toLowerCase();

    // If no classSectionId provided and user is a teacher, auto-resolve their own class
    let resolvedClassSectionId = classSectionId;
    if (!resolvedClassSectionId && ['teacher', 'hod'].includes(normalizedRole)) {
      const myClass = await this.getMyClassSection(institutionCode, userId);
      if (!myClass) {
        throw { statusCode: 404, code: 'NO_CLASS', message: 'No class section assigned to you' };
      }
      resolvedClassSectionId = myClass.id;
    }

    if (!resolvedClassSectionId) {
      throw { statusCode: 400, code: 'VALIDATION_ERROR', message: 'classSectionId is required' };
    }

    const cls = await academicsRepository.getClassSectionById(resolvedClassSectionId);
    if (!cls || cls.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'CLASS_SECTION_NOT_FOUND', message: 'Class/section not found in this institution' };
    }

    // Teachers can only view their own class (admins/hod/principal can view any)
    if (!['admin', 'hod', 'principal'].includes(normalizedRole)) {
      const caller = await this.findUser(institutionCode, userId);
      if (!caller || cls.classTeacherId !== caller.id) {
        throw {
          statusCode: 403,
          code: 'FORBIDDEN',
          message: 'Teachers can only view attendance for their own class/section',
        };
      }
    }

    const end = toDate || this.dateStr(new Date());
    const startRaw = fromDate || this.dateStr(new Date(Date.now() - 30 * 86400000));
    const maxStart = this.dateStr(new Date(new Date(`${end}T00:00:00Z`).getTime() - 365 * 86400000));
    const from = startRaw < maxStart ? maxStart : startRaw;

    const { days, studentStats, subjectStats } = await academicsRepository.getClassAttendanceAggregates(classSectionId, from, end);

    const totalMarks = studentStats.reduce((s, x) => s + (Number(x.total) || 0), 0);
    const presentMarks = studentStats.reduce((s, x) => s + (Number(x.present) || 0), 0);
    const absentMarks = studentStats.reduce((s, x) => s + (Number(x.absent) || 0), 0);
    const lateMarks = studentStats.reduce((s, x) => s + (Number(x.late) || 0), 0);
    const excusedMarks = studentStats.reduce((s, x) => s + (Number(x.excused) || 0), 0);

    const scope = {
      department: cls.department || undefined,
      academicYear: cls.academicYear || undefined,
      section: cls.section || undefined,
    };
    const totalStudents = await dbCountStudentsByClassScope(institutionCode, scope);
    const page = opts || { limit: 100, offset: 0 };
    const roster = await dbFindStudentsByClassScope(institutionCode, scope, page);
    const statsById = new Map(
      studentStats.map((s) => [
        s.studentId,
        {
          present: Number(s.present) || 0,
          absent: Number(s.absent) || 0,
          late: Number(s.late) || 0,
          excused: Number(s.excused) || 0,
          total: Number(s.total) || 0,
        },
      ])
    );
    const students = roster.map((u) => {
      const st = statsById.get(u.id) || { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      return {
        studentId: u.id,
        fullName: u.fullName,
        rollNoOrUSN: u.rollNoOrUSN || '',
        present: st.present,
        absent: st.absent,
        late: st.late,
        excused: st.excused,
        total: st.total,
        percentage: st.total > 0 ? Math.round((st.present / st.total) * 100) : 0,
      };
    });

    const normCounts = (d: any) => ({
      present: Number(d.present) || 0,
      absent: Number(d.absent) || 0,
      late: Number(d.late) || 0,
      excused: Number(d.excused) || 0,
      total: Number(d.total) || 0,
    });

    return {
      classSection: { id: cls.id, name: cls.name },
      range: { fromDate: from, toDate: end },
      summary: {
        studentsCount: totalStudents,
        totalMarks,
        present: presentMarks,
        absent: absentMarks,
        late: lateMarks,
        excused: excusedMarks,
        averagePercentage: totalMarks > 0 ? Math.round((presentMarks / totalMarks) * 100) : 0,
      },
      days: days
        .map((d) => ({
          date: d.date,
          ...normCounts(d),
          percentage: Number(d.total) > 0 ? Math.round((Number(d.present) / Number(d.total)) * 100) : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      students,
      subjects: subjectStats
        .map((s) => ({
          subjectId: s.subjectId,
          subjectName: s.subjectName,
          ...normCounts(s),
          percentage: Number(s.total) > 0 ? Math.round((Number(s.present) / Number(s.total)) * 100) : 0,
        }))
        .sort((a, b) => a.subjectName.localeCompare(b.subjectName)),
      total: totalStudents,
      limit: page.limit,
      offset: page.offset,
    };
  }

  private async getSectionAttendanceStats(studentIds: string[]) {
    const rows = await academicsRepository.listAttendanceEntriesWithSubject(studentIds);
    const byStudent = new Map<string, { present: number; total: number }>();
    for (const row of rows) {
      const bucket = byStudent.get(row.studentId) || { present: 0, total: 0 };
      bucket.total++;
      if (row.attendanceStatus !== 'absent') bucket.present++;
      byStudent.set(row.studentId, bucket);
    }
    let present = 0;
    let total = 0;
    const lowAttendance: string[] = [];
    for (const studentId of studentIds) {
      const b = byStudent.get(studentId);
      const p = b?.present || 0;
      const t = b?.total || 0;
      present += p;
      total += t;
      const pct = t > 0 ? Math.round((p / t) * 100) : 0;
      if (t > 0 && pct < 75) {
        lowAttendance.push(studentId);
      }
    }
    return {
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      total,
      lowAttendance,
    };
  }

  // ---------- Attendance Export ----------
  public async exportClassAttendanceCsv(
    institutionCode: string,
    userId: string,
    role: string,
    classSectionId: string,
    fromDate?: string,
    toDate?: string
  ) {
    const summary = await this.getClassAttendanceSummary(institutionCode, userId, role, classSectionId, fromDate, toDate);

    const header = ['Student Name', 'USN/Roll No', 'Present', 'Absent', 'Late', 'Excused', 'Total', 'Percentage'];
    const rows = summary.students.map((s: any) => [
      s.fullName,
      s.rollNoOrUSN,
      s.present,
      s.absent,
      s.late,
      s.excused,
      s.total,
      `${s.percentage}%`,
    ]);

    const subjectHeader = ['Subject', 'Present', 'Absent', 'Late', 'Excused', 'Total', 'Percentage'];
    const subjectRows = summary.subjects.map((s: any) => [
      s.subjectName,
      s.present,
      s.absent,
      s.late,
      s.excused,
      s.total,
      `${s.percentage}%`,
    ]);

    const dayHeader = ['Date', 'Present', 'Absent', 'Late', 'Excused', 'Total', 'Percentage'];
    const dayRows = summary.days.map((d: any) => [
      d.date,
      d.present,
      d.absent,
      d.late,
      d.excused,
      d.total,
      `${d.percentage}%`,
    ]);

    let csv = `Class Attendance Report\n`;
    csv += `Class: ${summary.classSection.name}\n`;
    csv += `Period: ${summary.range.fromDate} to ${summary.range.toDate}\n`;
    csv += `Overall Average: ${summary.summary.averagePercentage}%\n`;
    csv += `Total Students: ${summary.summary.studentsCount}\n\n`;

    csv += `--- Student Summary ---\n`;
    csv += header.join(',') + '\n';
    for (const row of rows) csv += row.join(',') + '\n';

    csv += `\n--- Subject Breakdown ---\n`;
    csv += subjectHeader.join(',') + '\n';
    for (const row of subjectRows) csv += row.join(',') + '\n';

    csv += `\n--- Daily Breakdown ---\n`;
    csv += dayHeader.join(',') + '\n';
    for (const row of dayRows) csv += row.join(',') + '\n';

    return { csv, className: summary.classSection.name, summary: summary.summary };
  }

  public async getClassAttendanceReport(
    institutionCode: string,
    userId: string,
    role: string,
    classSectionId: string,
    fromDate?: string,
    toDate?: string
  ) {
    const summary = await this.getClassAttendanceSummary(institutionCode, userId, role, classSectionId, fromDate, toDate);

    const lowAttendance = summary.students
      .filter((s: any) => s.total > 0 && s.percentage < 75)
      .sort((a: any, b: any) => a.percentage - b.percentage);

    const topPerformers = summary.students
      .filter((s: any) => s.total > 0)
      .sort((a: any, b: any) => b.percentage - a.percentage)
      .slice(0, 5);

    const dailyTrend = summary.days.map((d: any) => ({
      date: d.date,
      percentage: d.percentage,
      present: d.present,
      total: d.total,
    }));

    return {
      classSection: summary.classSection,
      range: summary.range,
      summary: summary.summary,
      subjects: summary.subjects,
      dailyTrend,
      lowAttendance,
      topPerformers,
      totalStudents: summary.totalStudents,
    };
  }

  // ---------- Helpers ----------
  /**
   * Roster for a class section. Prefers the canonical `student_classes` table
   * and falls back to the legacy (department, academicYear, section) string
   * triple match against `users.scope` for institutions that haven't migrated.
   */
  private async getStudentsForClassSection(classSectionId: string) {
    const classSection = await academicsRepository.getClassSectionById(classSectionId);
    if (!classSection) return [];

    // 1) New path: student_classes join
    if (db) {
      try {
        const rows = await db
          .select({
            id: studentClasses.studentId,
            fullName: usersTable.fullName,
            rollNoOrUSN: usersTable.rollNoOrUSN,
          })
          .from(studentClasses)
          .leftJoin(usersTable, eqSql(usersTable.id, studentClasses.studentId))
          .where(
            andSql(
              eqSql(studentClasses.classSectionId, classSectionId),
              eqSql(studentClasses.isActive, true)
            )
          );

        if (rows.length > 0) {
          return rows
            .filter((r) => r.id)
            .map((r) => ({
              id: r.id!,
              fullName: r.fullName || '',
              rollNoOrUSN: r.rollNoOrUSN || '',
              department: classSection.department || '',
              academicYear: classSection.academicYear || '',
              section: classSection.section || '',
            }))
            .sort((a, b) => (a.rollNoOrUSN || '').localeCompare(b.rollNoOrUSN || ''));
        }
      } catch (err: any) {
        console.warn('[Academics] getStudentsForClassSection via student_classes failed, falling back:', err?.message);
      }
    }

    // 2) Legacy fallback: string-triple match against users.scope
    const scope = {
      department: classSection.department || '',
      academicYear: classSection.academicYear || '',
      section: classSection.section || '',
    };
    const allUsers = await dbFindStudentsByClassScope(classSection.institutionCode, scope, { limit: 500 });
    return allUsers
      .map((u) => {
        const sc = this.parseScope(u.scope);
        return {
          id: u.id,
          fullName: u.fullName,
          rollNoOrUSN: u.rollNoOrUSN,
          department: sc.department || '',
          academicYear: sc.academicYear || '',
          section: sc.section || '',
        };
      })
      .sort((a, b) => (a.rollNoOrUSN || '').localeCompare(b.rollNoOrUSN || ''));
  }

  private async findTeacher(institutionCode: string, userId: string) {
    const teacher = await this.findUser(institutionCode, userId);
    if (!teacher) return undefined;
    if (!TEACHER_ROLES.includes(teacher.role.toLowerCase())) return undefined;
    return teacher;
  }

  private async findUser(institutionCode: string, userId: string) {
    const user = await dbFindUserByIdOrUid(userId);
    if (!user) return undefined;
    if (user.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) return undefined;
    return user;
  }

  // ---------- Exams / Marks ----------

  public async listExams(institutionCode: string) {
    return academicsRepository.listExams(institutionCode);
  }

  public async getExamDetails(institutionCode: string, examId: string) {
    const exam = await academicsRepository.getExamById(examId);
    if (!exam || exam.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'EXAM_NOT_FOUND', message: 'Exam not found' };
    }
    const subjects = await academicsRepository.listExamSubjects(examId);
    return { exam, subjects };
  }

  public async createExam(institutionCode: string, input: CreateExamInput, createdBy: string) {
    const created = await academicsRepository.createExam({
      institutionCode,
      name: input.name,
      term: input.term || '',
      academicYear: input.academicYear || '',
      startDate: input.startDate || null,
      endDate: input.endDate || null,
      status: 'draft',
      createdBy,
    });
    for (const s of input.subjects) {
      const subj = await academicsRepository.getSubjectById(s.subjectId);
      if (!subj || subj.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
        throw { statusCode: 400, code: 'INVALID_SUBJECT', message: `subjectId ${s.subjectId} is not in this institution` };
      }
      await academicsRepository.upsertExamSubject({
        examId: created.id,
        institutionCode,
        subjectId: s.subjectId,
        maxMarks: s.maxMarks ?? 100,
        passMarks: s.passMarks ?? 35,
      });
    }
    return created;
  }

  public async updateExam(institutionCode: string, examId: string, input: UpdateExamInput) {
    const existing = await academicsRepository.getExamById(examId);
    if (!existing || existing.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'EXAM_NOT_FOUND', message: 'Exam not found' };
    }
    if (existing.status === 'locked') {
      throw { statusCode: 409, code: 'EXAM_LOCKED', message: 'Exam is locked and cannot be modified' };
    }
    return academicsRepository.updateExam(examId, input);
  }

  public async getMarksForClass(institutionCode: string, examSubjectId: string, classSectionId: string, enteredBy: string) {
    const examSubject = await academicsRepository.getExamSubjectById(examSubjectId);
    if (!examSubject || examSubject.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'EXAM_SUBJECT_NOT_FOUND', message: 'Exam subject not found' };
    }
    const classSection = await academicsRepository.getClassSectionById(classSectionId);
    if (!classSection || classSection.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 400, code: 'INVALID_CLASS_SECTION', message: 'classSectionId not in this institution' };
    }
    const roster = await this.getStudentsForClassSection(classSectionId);
    const existing = await academicsRepository.listMarksForExamSubject(examSubjectId);
    const byStudent = new Map(existing.map((m) => [m.studentId, m]));
    return roster.map((stu) => {
      const m = byStudent.get(stu.id);
      return {
        studentId: stu.id,
        fullName: stu.fullName,
        rollNoOrUSN: stu.rollNoOrUSN,
        marksObtained: m ? Number(m.marksObtained) : 0,
        grade: m?.grade || '',
        remarks: m?.remarks || '',
        entered: !!m,
      };
    });
  }

  public async saveMarks(institutionCode: string, input: SaveMarksInput, enteredBy: string) {
    const examSubject = await academicsRepository.getExamSubjectById(input.examSubjectId);
    if (!examSubject || examSubject.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'EXAM_SUBJECT_NOT_FOUND', message: 'Exam subject not found' };
    }
    const exam = await academicsRepository.getExamById(examSubject.examId);
    if (!exam) {
      throw { statusCode: 404, code: 'EXAM_NOT_FOUND', message: 'Exam not found' };
    }
    if (exam.status === 'locked') {
      throw { statusCode: 409, code: 'EXAM_LOCKED', message: 'Exam is locked; marks cannot be saved' };
    }
    const classSection = await academicsRepository.getClassSectionById(input.classSectionId);
    if (!classSection || classSection.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 400, code: 'INVALID_CLASS_SECTION', message: 'classSectionId not in this institution' };
    }
    const roster = await this.getStudentsForClassSection(input.classSectionId);
    const validIds = new Set(roster.map((r) => r.id));
    const out: any[] = [];
    for (const entry of input.entries) {
      if (!validIds.has(entry.studentId)) {
        throw { statusCode: 400, code: 'STUDENT_NOT_IN_CLASS', message: `Student ${entry.studentId} is not in class ${input.classSectionId}` };
      }
      const mark = await academicsRepository.upsertMark({
        examId: examSubject.examId,
        examSubjectId: examSubject.id,
        institutionCode,
        studentId: entry.studentId,
        classSectionId: input.classSectionId,
        subjectId: examSubject.subjectId,
        marksObtained: entry.marksObtained,
        grade: entry.grade || '',
        remarks: entry.remarks || '',
        enteredBy,
      });
      out.push(mark);
    }
    return { saved: out.length };
  }

  public async getStudentMarks(institutionCode: string, studentUserId: string) {
    const student = await this.findUser(institutionCode, studentUserId);
    if (!student) {
      throw { statusCode: 404, code: 'STUDENT_NOT_FOUND', message: 'Student not found' };
    }
    const allMarks = await academicsRepository.listMarksForStudent(institutionCode, student.id);
    if (allMarks.length === 0) return { exams: [], totals: { present: 0, total: 0, percentage: 0 } };

    const examIds = Array.from(new Set(allMarks.map((m) => m.examId)));
    const examRows = await Promise.all(examIds.map((id) => academicsRepository.getExamById(id)));
    const examById = new Map(examRows.filter(Boolean).map((e) => [e!.id, e!]));

    const examSubjectIds = Array.from(new Set(allMarks.map((m) => m.examSubjectId)));
    const examSubjectRows = await Promise.all(examSubjectIds.map((id) => academicsRepository.getExamSubjectById(id)));
    const examSubjectById = new Map(examSubjectRows.filter(Boolean).map((es) => [es!.id, es!]));

    // Group by exam
    const byExam = new Map<string, any>();
    for (const m of allMarks) {
      const es = examSubjectById.get(m.examSubjectId);
      if (!es) continue;
      const e = examById.get(m.examId);
      if (!e) continue;
      const bucket = byExam.get(e.id) || {
        exam: { id: e.id, name: e.name, term: e.term, academicYear: e.academicYear, status: e.status },
        subjects: [],
        totalObtained: 0,
        totalMax: 0,
      };
      bucket.subjects.push({
        subjectId: es.subjectId,
        marksObtained: Number(m.marksObtained),
        maxMarks: es.maxMarks,
        passMarks: es.passMarks,
        grade: m.grade,
        remarks: m.remarks,
      });
      bucket.totalObtained += Number(m.marksObtained);
      bucket.totalMax += es.maxMarks;
      byExam.set(e.id, bucket);
    }

    const exams = Array.from(byExam.values()).map((b) => ({
      ...b,
      percentage: b.totalMax > 0 ? Math.round((b.totalObtained / b.totalMax) * 100) : 0,
    }));

    const totalObtained = exams.reduce((s, e) => s + e.totalObtained, 0);
    const totalMax = exams.reduce((s, e) => s + e.totalMax, 0);
    return {
      exams,
      totals: {
        present: totalObtained,
        total: totalMax,
        percentage: totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0,
      },
    };
  }

  // ---------- Homework ----------
  public async createHomework(institutionCode: string, teacherId: string, input: CreateHomeworkInput) {
    return academicsRepository.createHomework({
      ...input,
      institutionCode,
      teacherId,
      createdBy: teacherId,
    });
  }

  public async listHomeworkByClass(institutionCode: string, classSectionId: string) {
    return academicsRepository.listHomeworkByClass(classSectionId);
  }

  public async listHomeworkByTeacher(institutionCode: string, teacherId: string) {
    return academicsRepository.listHomeworkByTeacher(teacherId);
  }

  public async getHomeworkById(institutionCode: string, id: string) {
    const hw = await academicsRepository.getHomeworkById(id);
    if (!hw) throw { statusCode: 404, code: 'HOMEWORK_NOT_FOUND', message: 'Homework not found' };
    if (hw.institutionCode !== institutionCode) throw { statusCode: 403, code: 'FORBIDDEN', message: 'Access denied' };
    return hw;
  }

  public async updateHomework(institutionCode: string, id: string, input: UpdateHomeworkInput) {
    const existing = await this.getHomeworkById(institutionCode, id);
    return academicsRepository.updateHomework(id, input);
  }

  public async deleteHomework(institutionCode: string, id: string) {
    await this.getHomeworkById(institutionCode, id);
    return academicsRepository.deleteHomework(id);
  }

  public async listHomeworkForStudent(institutionCode: string, classSectionId: string) {
    return academicsRepository.listHomeworkByClass(classSectionId);
  }

  public async listHomeworkForParent(institutionCode: string, classSectionId: string) {
    return academicsRepository.listHomeworkByClass(classSectionId);
  }
}

export const academicsService = new AcademicsService();
