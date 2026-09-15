import { FastifyRequest, FastifyReply } from 'fastify';
import { academicsService } from './academics.service.js';
import {
  CreateClassSectionSchema,
  UpdateClassSectionSchema,
  CreateSubjectSchema,
  CreateSubjectTeacherSchema,
  UpdateSubjectTeacherSchema,
  CreatePeriodSchema,
  UpdateInstitutionTermsSchema,
  UpdateHolidayCalendarSchema,
  CreateTimetableSchema,
  MarkAttendanceSchema,
  CreateExamSchema,
  UpdateExamSchema,
  SaveMarksSchema,
  CreateHomeworkSchema,
  UpdateHomeworkSchema,
} from './academics.schema.js';

function getInstCode(req: FastifyRequest): string {
  const user = (req as any).user;
  return user?.institutionCode || '';
}

function getPagination(query: any): { limit: number; offset: number } | undefined {
  const q = query || {};
  if (q.limit === undefined && q.offset === undefined) return undefined;
  const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
  const offset = Math.max(Number(q.offset) || 0, 0);
  return { limit, offset };
}

function getUserId(req: FastifyRequest): string {
  const user = (req as any).user;
  return user?.uid || '';
}

function getRole(req: FastifyRequest): string {
  const user = (req as any).user;
  return user?.role || '';
}

function parseZod(err: any) {
  if (err?.name === 'ZodError') {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: err.errors?.[0]?.message || 'Invalid input data',
    };
  }
  return err;
}

function sendError(reply: FastifyReply, err: any, fallbackMsg: string) {
  const parsed = parseZod(err);
  return reply.status(parsed.statusCode || 500).send({
    success: false,
    error: {
      message: parsed.message || fallbackMsg,
      code: parsed.code || 'INTERNAL_ERROR',
    },
  });
}

export async function listClassSectionsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await academicsService.listClassSections(getInstCode(request), getPagination(request.query));
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch class sections');
  }
}

export async function createClassSectionHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CreateClassSectionSchema.parse(request.body);
    const data = await academicsService.createClassSection(getInstCode(request), body);
    return reply.status(201).send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to create class section');
  }
}

export async function updateClassSectionHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const body = UpdateClassSectionSchema.parse(request.body);
    const data = await academicsService.updateClassSection(getInstCode(request), request.params.id, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to update class section');
  }
}

export async function deleteClassSectionHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const data = await academicsService.deleteClassSection(getInstCode(request), request.params.id);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to delete class section');
  }
}

export async function listSubjectsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await academicsService.listSubjects(getInstCode(request), getPagination(request.query));
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch subjects');
  }
}

export async function createSubjectHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CreateSubjectSchema.parse(request.body);
    const data = await academicsService.createSubject(getInstCode(request), body);
    return reply.status(201).send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to create subject');
  }
}

export async function listSubjectTeachersHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { classSectionId?: string; teacherId?: string };
    const data = await academicsService.listSubjectTeachers(
      getInstCode(request),
      query.classSectionId,
      query.teacherId,
      getPagination(request.query)
    );
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch subject-teacher assignments');
  }
}

export async function createSubjectTeacherHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CreateSubjectTeacherSchema.parse(request.body);
    const data = await academicsService.createSubjectTeacher(getInstCode(request), body);
    return reply.status(201).send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to assign subject teacher');
  }
}

export async function deleteSubjectTeacherHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const data = await academicsService.deleteSubjectTeacher(getInstCode(request), request.params.id);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to remove subject-teacher assignment');
  }
}

export async function updateSubjectTeacherHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const body = UpdateSubjectTeacherSchema.parse(request.body);
    const data = await academicsService.updateSubjectTeacher(getInstCode(request), request.params.id, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to reassign subject teacher');
  }
}

export async function listPeriodsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await academicsService.listPeriods(getInstCode(request), getPagination(request.query));
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch periods');
  }
}

export async function createPeriodHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CreatePeriodSchema.parse(request.body);
    const data = await academicsService.createPeriod(getInstCode(request), body);
    return reply.status(201).send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to create period');
  }
}

export async function updateTermsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = UpdateInstitutionTermsSchema.parse(request.body);
    const data = await academicsService.updateTerms(getInstCode(request), body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to update academic terms');
  }
}

export async function updateHolidaysHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = UpdateHolidayCalendarSchema.parse(request.body);
    const data = await academicsService.updateHolidays(getInstCode(request), body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to update holiday calendar');
  }
}

export async function createTimetableHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CreateTimetableSchema.parse(request.body);
    const data = await academicsService.createTimetable(getInstCode(request), getUserId(request), body);
    return reply.status(201).send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to create timetable');
  }
}

export async function getClassTimetableHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { classSectionId: string; date?: string };
    if (!query.classSectionId) {
      return reply.status(400).send({ success: false, error: { message: 'classSectionId query param is required', code: 'VALIDATION_ERROR' } });
    }
    const date = query.date || new Date().toISOString().slice(0, 10);
    const data = await academicsService.getClassTimetable(getInstCode(request), query.classSectionId, date);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch class timetable');
  }
}

export async function getTeacherTimetableHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { date?: string };
    const date = query.date || new Date().toISOString().slice(0, 10);
    const data = await academicsService.getTeacherTimetable(getInstCode(request), getUserId(request), date);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch teacher timetable');
  }
}

export async function getMyTimetableHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { date?: string };
    const date = query.date || new Date().toISOString().slice(0, 10);
    const data = await academicsService.getMyTimetable(getInstCode(request), getUserId(request), date);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch my timetable');
  }
}

export async function getMyClassSectionHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await academicsService.getMyClassSection(getInstCode(request), getUserId(request));
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch my class section');
  }
}

export async function getAllTimetablesForClassHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const data = await academicsService.getAllTimetablesForClass(getInstCode(request), request.params.id);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch timetables for class');
  }
}

export async function getRosterHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { timetableSlotId: string };
    if (!query.timetableSlotId) {
      return reply.status(400).send({ success: false, error: { message: 'timetableSlotId query param is required', code: 'VALIDATION_ERROR' } });
    }
    const data = await academicsService.getRoster(getInstCode(request), query.timetableSlotId);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch roster');
  }
}

export async function markAttendanceHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = MarkAttendanceSchema.parse(request.body);
    const data = await academicsService.markAttendance(getInstCode(request), getUserId(request), body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to mark attendance');
  }
}

export async function getAttendanceForSlotHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { timetableSlotId: string; date?: string };
    if (!query.timetableSlotId) {
      return reply.status(400).send({ success: false, error: { message: 'timetableSlotId query param is required', code: 'VALIDATION_ERROR' } });
    }
    const date = query.date || new Date().toISOString().slice(0, 10);
    const data = await academicsService.getAttendanceForSlot(getInstCode(request), query.timetableSlotId, date);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch attendance for slot');
  }
}

export async function getStudentAttendanceHistoryHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { fromDate?: string; toDate?: string };
    const data = await academicsService.getStudentAttendanceHistory(getInstCode(request), getUserId(request), query.fromDate, query.toDate);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch attendance history');
  }
}

export async function getParentAttendanceHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await academicsService.getParentView(getInstCode(request), getUserId(request));
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch linked student attendance');
  }
}

export async function getDepartmentOverviewHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { department?: string };
    const data = await academicsService.getDepartmentOverview(getInstCode(request), query.department);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch department overview');
  }
}

export async function getInstitutionOverviewHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await academicsService.getInstitutionOverview(getInstCode(request));
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch institution overview');
  }
}

export async function getClassAttendanceHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as any;
    const classSectionId = query.classSectionId || '';
    if (!classSectionId) {
      return reply.status(400).send({
        success: false,
        error: { message: 'classSectionId is required', code: 'VALIDATION_ERROR' },
      });
    }
    const data = await academicsService.getClassAttendanceSummary(
      getInstCode(request),
      getUserId(request),
      getRole(request),
      classSectionId,
      query.fromDate,
      query.toDate,
      getPagination(query)
    );
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch class attendance');
  }
}

// ---------- Attendance Export / Report ----------

export async function exportClassAttendanceHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as any;
    const classSectionId = query.classSectionId || '';
    // classSectionId is optional — teachers get auto-resolved to their own class
    const data = await academicsService.exportClassAttendanceCsv(
      getInstCode(request),
      getUserId(request),
      getRole(request),
      classSectionId,
      query.fromDate,
      query.toDate
    );
    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', `attachment; filename="attendance-${data.className}-${data.range.fromDate}-to-${data.range.toDate}.csv"`);
    return reply.send(data.csv);
  } catch (err: any) {
    return sendError(reply, err, 'Failed to export attendance');
  }
}

export async function getClassAttendanceReportHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as any;
    const classSectionId = query.classSectionId || '';
    // classSectionId is optional — teachers get auto-resolved to their own class
    const data = await academicsService.getClassAttendanceReport(
      getInstCode(request),
      getUserId(request),
      getRole(request),
      classSectionId,
      query.fromDate,
      query.toDate
    );
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch attendance report');
  }
}

// ---------- Marks / Exams ----------

export async function listExamsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await academicsService.listExams(getInstCode(request));
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch exams');
  }
}

export async function getExamHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await academicsService.getExamDetails(getInstCode(request), request.params.id);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch exam');
  }
}

export async function createExamHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CreateExamSchema.parse(request.body);
    const data = await academicsService.createExam(getInstCode(request), body, getUserId(request));
    return reply.status(201).send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to create exam');
  }
}

export async function updateExamHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const body = UpdateExamSchema.parse(request.body);
    const data = await academicsService.updateExam(getInstCode(request), request.params.id, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to update exam');
  }
}

export async function getMarksForClassHandler(
  request: FastifyRequest<{ Querystring: { examSubjectId: string; classSectionId: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await academicsService.getMarksForClass(
      getInstCode(request),
      request.query.examSubjectId,
      request.query.classSectionId,
      getUserId(request)
    );
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch marks');
  }
}

export async function saveMarksHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = SaveMarksSchema.parse(request.body);
    const data = await academicsService.saveMarks(getInstCode(request), body, getUserId(request));
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to save marks');
  }
}

export async function getMyMarksHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await academicsService.getStudentMarks(getInstCode(request), getUserId(request));
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch my marks');
  }
}

export async function getParentMarksHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await academicsService.getParentMarks(getInstCode(request), getUserId(request));
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch linked student marks');
  }
}

export async function getParentTimetableHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { date?: string };
    const dateStr = query.date || new Date().toISOString().slice(0, 10);
    const data = await academicsService.getParentTimetable(getInstCode(request), getUserId(request), dateStr);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch linked student timetable');
  }
}

export async function getStudentMarksByIdHandler(
  request: FastifyRequest<{ Params: { studentId: string } }>,
  reply: FastifyReply
) {
  try {
    const data = await academicsService.getStudentMarks(getInstCode(request), request.params.studentId);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch student marks');
  }
}

// ---------- Homework ----------

export async function createHomeworkHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CreateHomeworkSchema.parse(request.body);
    const data = await academicsService.createHomework(getInstCode(request), getUserId(request), body);
    return reply.status(201).send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to create homework');
  }
}

export async function listHomeworkByClassHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = request.query as { classSectionId?: string };
    const classSectionId = query.classSectionId || '';
    if (!classSectionId) return reply.status(400).send({ success: false, error: { message: 'classSectionId is required', code: 'MISSING_PARAM' } });
    const data = await academicsService.listHomeworkByClass(getInstCode(request), classSectionId);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch homework');
  }
}

export async function listMyHomeworkHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await academicsService.listHomeworkByTeacher(getInstCode(request), getUserId(request));
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch homework');
  }
}

export async function getHomeworkByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await academicsService.getHomeworkById(getInstCode(request), (request.params as any).id);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch homework');
  }
}

export async function updateHomeworkHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = UpdateHomeworkSchema.parse(request.body);
    const data = await academicsService.updateHomework(getInstCode(request), (request.params as any).id, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to update homework');
  }
}

export async function deleteHomeworkHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    await academicsService.deleteHomework(getInstCode(request), (request.params as any).id);
    return reply.send({ success: true, data: { deleted: true } });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to delete homework');
  }
}

export async function listStudentHomeworkHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getUserId(request);
    const role = getRole(request);
    const instCode = getInstCode(request);
    let classSectionId = '';
    if (role === 'student') {
      const cls = await (await import('./academics.service.js')).academicsService.getMyClassSection(instCode, userId);
      classSectionId = cls?.id || '';
    }
    if (!classSectionId) {
      const query = request.query as { classSectionId?: string };
      classSectionId = query.classSectionId || '';
    }
    if (!classSectionId) return reply.send({ success: true, data: [] });
    const data = await academicsService.listHomeworkForStudent(instCode, classSectionId);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch homework');
  }
}

export async function listParentHomeworkHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getUserId(request);
    const instCode = getInstCode(request);
    const parent = await (await import('../shared/db/index.js')).dbFindUserByIdOrUid(userId);
    if (!parent || parent.role !== 'parent') {
      return reply.status(403).send({ success: false, error: { message: 'Only parents can use this endpoint', code: 'FORBIDDEN' } });
    }
    const scope = typeof parent.scope === 'string' ? JSON.parse(parent.scope || '{}') : (parent.scope || {});
    const linkedUsn = scope?.linkedStudentUSN || '';
    if (!linkedUsn) return reply.send({ success: true, data: [] });
    const student = await (await import('../shared/db/index.js')).dbFindStudentByUsnInInstitution(instCode, linkedUsn);
    if (!student) return reply.send({ success: true, data: [] });
    const enrollment = await (await import('../shared/db/index.js')).dbFindStudentClassSectionId(student.id);
    if (!enrollment) return reply.send({ success: true, data: [] });
    const data = await academicsService.listHomeworkForParent(instCode, enrollment);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return sendError(reply, err, 'Failed to fetch homework');
  }
}
