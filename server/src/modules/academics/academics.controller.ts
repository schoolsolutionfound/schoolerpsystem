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
} from './academics.schema.js';

function getInstCode(req: FastifyRequest): string {
  const user = (req as any).user;
  return user?.institutionCode || '';
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
