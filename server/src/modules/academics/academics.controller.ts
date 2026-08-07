import { FastifyRequest, FastifyReply } from 'fastify';
import { academicsService } from './academics.service.js';
import {
  CreateClassSectionSchema,
  UpdateClassSectionSchema,
  CreateSubjectSchema,
  CreateSubjectTeacherSchema,
  CreatePeriodSchema,
  UpdateInstitutionTermsSchema,
  UpdateHolidayCalendarSchema,
  CreateTimetableSchema,
  MarkAttendanceSchema,
} from './academics.schema.js';

function getInstCode(req: FastifyRequest): string {
  const user = (req as any).user;
  return user?.institutionCode || '';
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
    const data = await academicsService.listClassSections(getInstCode(request));
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
    const data = await academicsService.listSubjects(getInstCode(request));
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
      query.teacherId
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

export async function listPeriodsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await academicsService.listPeriods(getInstCode(request));
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
