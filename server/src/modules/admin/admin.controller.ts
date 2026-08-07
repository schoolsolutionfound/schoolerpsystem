import { FastifyRequest, FastifyReply } from 'fastify';
import { adminService, SingleFeedPayload, CreateStudentPayload, CreateTeacherPayload } from './admin.service.js';

export { SingleFeedPayload, CreateStudentPayload, CreateTeacherPayload };

function extractInstCode(req: FastifyRequest): string {
  const user = (req as any).user;
  return user?.institutionCode || (req.query as any)?.institutionCode || 'DEFAULT';
}

export async function getInstitutionConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const data = await adminService.getInstitutionConfig(instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch institution config' },
    });
  }
}

export async function updateInstitutionConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const body = request.body as any;
    const data = await adminService.updateInstitutionConfig(instCode, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to update institution config' },
    });
  }
}

export async function getStudentsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const data = await adminService.getStudents(instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch students' },
    });
  }
}

export async function createStudentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const body = request.body as CreateStudentPayload;
    const data = await adminService.createStudent({ ...body, institutionCode: instCode });
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to create student' },
    });
  }
}

export async function getTeachersHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const data = await adminService.getTeachers(instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch teachers' },
    });
  }
}

export async function createTeacherHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const body = request.body as CreateTeacherPayload;
    const data = await adminService.createTeacher({ ...body, institutionCode: instCode });
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to create teacher' },
    });
  }
}

export async function getUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const data = await adminService.getUsers(instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch users' },
    });
  }
}

export async function createUserHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const body = request.body as any;
    const data = await adminService.createUser({
      ...body,
      institutionCode: instCode,
    });
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to create user', code: err.code || 'CREATE_USER_ERROR' },
    });
  }
}

export async function singleFeedHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as SingleFeedPayload;

  try {
    const data = await adminService.singleFeed(body);
    return reply.send({
      success: true,
      data,
    });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Invalid feed request', code: err.code || 'INVALID_INPUT' },
    });
  }
}

export async function bulkFeedHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as { records: SingleFeedPayload[] };

  if (!body || !Array.isArray(body.records)) {
    return reply.status(400).send({
      success: false,
      error: { message: 'Payload must contain a "records" array', code: 'INVALID_INPUT' },
    });
  }

  try {
    const data = await adminService.bulkFeed(body.records);
    return reply.send({
      success: true,
      data,
    });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Bulk feed failure', code: err.code || 'BULK_FEED_ERROR' },
    });
  }
}
