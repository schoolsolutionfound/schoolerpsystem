import { academicsRepository } from './academics.repository.js';
import { dbFindUsersByInstitution, dbFindUserByIdOrUid, dbFindStudentByUsnInInstitution, dbFindStudentsByClassScope, dbCountStudentsByClassScope } from '../shared/db/index.js';
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
    return this.buildStudentSummary(student.id);
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

    return {
      studentId,
      overall: {
        present: presentTotal,
        total: grandTotal,
        percentage: grandTotal > 0 ? Math.round((presentTotal / grandTotal) * 100) : 0,
      },
      perSubject,
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
    const scope = this.parseScope(user.scope);
    const classSections = await academicsRepository.listClassSections(institutionCode);
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
    const cls = await academicsRepository.getClassSectionById(classSectionId);
    if (!cls || cls.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'CLASS_SECTION_NOT_FOUND', message: 'Class/section not found in this institution' };
    }

    const normalizedRole = (role || '').toLowerCase();
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

  // ---------- Helpers ----------
  private async getStudentsForClassSection(classSectionId: string) {
    const classSection = await academicsRepository.getClassSectionById(classSectionId);
    if (!classSection) return [];
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
}

export const academicsService = new AcademicsService();
