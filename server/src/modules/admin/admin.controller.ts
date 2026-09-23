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

export async function getDashboardStatsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const data = await adminService.getDashboardStats(instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch dashboard stats' },
    });
  }
}

export async function getStudentsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const q = (request.query as any) || {};
    const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
    const offset = Math.max(Number(q.offset) || 0, 0);
    const data = await adminService.getStudents(instCode, limit, offset);
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

export async function getStudentByIdHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    const data = await adminService.getStudentById(id, instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 404).send({
      success: false,
      error: { message: err.message || 'Student not found' },
    });
  }
}

export async function updateStudentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const data = await adminService.updateStudent(id, body, instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to update student' },
    });
  }
}

export async function deleteStudentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    const data = await adminService.deleteStudent(id, instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to delete student' },
    });
  }
}

export async function promoteStudentsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { studentIds, targetClassSectionId, academicYear } = request.body as any;
    const data = await adminService.promoteStudents(studentIds, targetClassSectionId, academicYear, instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to promote students' },
    });
  }
}

export async function graduateStudentsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { studentIds } = request.body as any;
    const data = await adminService.graduateStudents(studentIds, instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to graduate students' },
    });
  }
}

export async function getAlumniHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const q = (request.query as any) || {};
    const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
    const offset = Math.max(Number(q.offset) || 0, 0);
    const data = await adminService.getAlumni(instCode, limit, offset);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch alumni' },
    });
  }
}

export async function addMyDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as any).user;
    const studentId = user?.id;
    const instCode = extractInstCode(request);
    const body = request.body as { documentType: string; fileName: string; fileUrl: string };
    const data = await adminService.addStudentDocument(studentId, instCode, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to add document' },
    });
  }
}

export async function deleteMyDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as any).user;
    const studentId = user?.id;
    const instCode = extractInstCode(request);
    const { docId } = request.params as { docId: string };
    const data = await adminService.deleteStudentDocument(studentId, docId, instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to delete document' },
    });
  }
}

export async function getStudentDocumentsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    const data = await adminService.getStudentDocuments(id, instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch documents' },
    });
  }
}

export async function addStudentDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    const body = request.body as { documentType: string; fileName: string; fileUrl: string };
    const data = await adminService.addStudentDocument(id, instCode, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to add document' },
    });
  }
}

export async function deleteStudentDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id, docId } = request.params as { id: string; docId: string };
    const data = await adminService.deleteStudentDocument(id, docId, instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to delete document' },
    });
  }
}

export async function getTeachersHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const q = (request.query as any) || {};
    const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
    const offset = Math.max(Number(q.offset) || 0, 0);
    const data = await adminService.getTeachers(instCode, limit, offset);
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

export async function updateTeacherHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const data = await adminService.updateTeacher(id, body, instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to update teacher' },
    });
  }
}

export async function deleteTeacherHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    const data = await adminService.deleteTeacher(id, instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to delete teacher' },
    });
  }
}

export async function getUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const q = (request.query as any) || {};
    const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
    const offset = Math.max(Number(q.offset) || 0, 0);
    const data = await adminService.getUsers(instCode, limit, offset);
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

export async function updateUserHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const data = await adminService.updateUser(id, instCode, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to update user', code: err.code || 'UPDATE_USER_ERROR' },
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
  const body = request.body as { records: SingleFeedPayload[]; sendEmails?: boolean; overwriteUsers?: boolean };

  if (!body || !Array.isArray(body.records)) {
    return reply.status(400).send({
      success: false,
      error: { message: 'Payload must contain a "records" array', code: 'INVALID_INPUT' },
    });
  }

  try {
    const data = await adminService.bulkFeed(body.records, {
      sendEmails: body.sendEmails,
      overwriteUsers: body.overwriteUsers,
    });
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

// Fee Management Handlers
export async function getFeesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const data = await adminService.getFees(instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({ success: false, error: { message: err.message } });
  }
}

export async function createFeeHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const body = request.body as any;
    const data = await adminService.createFee(instCode, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({ success: false, error: { message: err.message } });
  }
}

export async function updateFeeHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const data = await adminService.updateFee(id, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({ success: false, error: { message: err.message } });
  }
}

export async function deleteFeeHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    await adminService.deleteFee(id);
    return reply.send({ success: true });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({ success: false, error: { message: err.message } });
  }
}

export async function getFeePaymentsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const data = await adminService.getFeePayments(instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({ success: false, error: { message: err.message } });
  }
}

export async function createFeePaymentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const body = request.body as any;
    const data = await adminService.createFeePayment(instCode, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({ success: false, error: { message: err.message } });
  }
}

export async function updateFeePaymentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const data = await adminService.updateFeePayment(id, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({ success: false, error: { message: err.message } });
  }
}

export async function deleteFeePaymentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    await adminService.deleteFeePayment(id);
    return reply.send({ success: true });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({ success: false, error: { message: err.message } });
  }
}
