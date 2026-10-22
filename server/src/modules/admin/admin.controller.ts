import { FastifyRequest, FastifyReply } from 'fastify';
import { adminService, SingleFeedPayload, CreateStudentPayload, CreateTeacherPayload } from './admin.service.js';
import {
  CreateFeeSchema,
  CreateFeePaymentSchema,
  UpdateFeeSchema,
  UpdateFeePaymentSchema,
  CreateExpenseSchema,
  UpdateExpenseSchema,
  CreateUserSchema,
  BulkCreateUsersSchema,
} from './admin.schema.js';
import { notifyFeePaid } from '../notifications/notification.triggers.js';
import { dbFindUserByIdOrUid } from '../shared/db/index.js';

export { SingleFeedPayload, CreateStudentPayload, CreateTeacherPayload };

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

export function extractInstCode(req: FastifyRequest): string {
  const instCode = req.user?.institutionCode?.trim();
  if (!instCode) {
    throw { statusCode: 403, code: 'NO_INSTITUTION', message: 'No institution assigned to this user.' };
  }
  return instCode;
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

export async function getProfileFieldsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const data = await adminService.getProfileFields(instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch form fields', code: err.code || 'SERVER_ERROR' },
    });
  }
}

export async function updateRoleProfileFieldsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const role = (request.params as any)?.role || '';
    const body = (request.body || {}) as { fields?: unknown };
    const data = await adminService.updateRoleProfileFields(instCode, role, body.fields);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to update form fields', code: err.code || 'VALIDATION_ERROR' },
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
    const search = String(q.search || '').trim();
    const data = await adminService.getStudents(instCode, limit, offset, search);
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

/**
 * Resolve the PostgreSQL student row id for a self-service (/my/documents)
 * session. AuthenticatedUser only carries the Firebase uid — not the DB id —
 * so look it up (or accept a raw DB id if ever present on the session).
 */
async function resolveSelfStudentId(request: FastifyRequest): Promise<string> {
  const user = (request as any).user;
  const identifier: string | undefined = user?.id || user?.uid;
  if (!identifier) {
    throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'No student session.' };
  }
  const row = await dbFindUserByIdOrUid(identifier);
  if (!row || row.role !== 'student') {
    throw { statusCode: 404, code: 'STUDENT_NOT_FOUND', message: 'Student not found.' };
  }
  return row.id;
}

export async function getMyDocumentsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const studentId = await resolveSelfStudentId(request);
    const instCode = extractInstCode(request);
    const data = await adminService.getStudentDocuments(studentId, instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch documents' },
    });
  }
}

export async function addMyDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const studentId = await resolveSelfStudentId(request);
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
    const studentId = await resolveSelfStudentId(request);
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
    const search = String(q.search || '').trim();
    const data = await adminService.getTeachers(instCode, limit, offset, search);
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
    const search = String(q.search || '').trim();
    const data = await adminService.getUsers(instCode, limit, offset, search);
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
    const parsed = CreateUserSchema.safeParse(request.body || {});
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return reply.status(400).send({
        success: false,
        error: {
          message: issue ? `${issue.path.join('.') || 'body'}: ${issue.message}` : 'Invalid request body',
          code: 'VALIDATION_ERROR',
        },
      });
    }
    const data = await adminService.createUser(
      { ...parsed.data, institutionCode: instCode },
      request.user?.email
    );
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to create user', code: err.code || 'CREATE_USER_ERROR' },
    });
  }
}

export async function bulkCreateUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const parsed = BulkCreateUsersSchema.safeParse(request.body || {});
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return reply.status(400).send({
        success: false,
        error: {
          message: issue ? `${issue.path.join('.') || 'body'}: ${issue.message}` : 'Invalid request body',
          code: 'VALIDATION_ERROR',
        },
      });
    }
    const data = await adminService.bulkCreateUsers(
      instCode,
      parsed.data.role,
      parsed.data.records,
      request.user?.email
    );
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Bulk create failed', code: err.code || 'BULK_CREATE_ERROR' },
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

export async function resetUserPasswordHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    const body = (request.body || {}) as { password?: string };
    const data = await adminService.resetUserPassword(id, instCode, body?.password);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({
      success: false,
      error: { message: err.message || 'Failed to reset password', code: err.code || 'RESET_PASSWORD_ERROR' },
    });
  }
}

export async function singleFeedHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const body = request.body as SingleFeedPayload;
    const data = await adminService.singleFeed({ ...body, institutionCode: instCode });
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
    const instCode = extractInstCode(request);
    const data = await adminService.bulkFeed(
      body.records.map((record) => ({ ...record, institutionCode: instCode })),
      {
        sendEmails: body.sendEmails,
        overwriteUsers: body.overwriteUsers,
      }
    );
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
    const body = CreateFeeSchema.parse(request.body);
    const data = await adminService.createFee(instCode, {
      ...body,
      createdBy: request.user?.uid,
    });
    return reply.send({ success: true, data });
  } catch (err: any) {
    const parsed = parseZod(err);
    return reply.status(parsed.statusCode || 400).send({ success: false, error: { message: parsed.message, code: parsed.code } });
  }
}

export async function updateFeeHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    const body = UpdateFeeSchema.parse(request.body);
    const data = await adminService.updateFee(id, instCode, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    const parsed = parseZod(err);
    return reply.status(parsed.statusCode || 400).send({ success: false, error: { message: parsed.message, code: parsed.code } });
  }
}

export async function deleteFeeHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    await adminService.deleteFee(id, instCode);
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
    const body = CreateFeePaymentSchema.parse(request.body);
    const data = await adminService.createFeePayment(instCode, {
      ...body,
      createdBy: request.user?.uid,
    });
    notifyFeePaid({
      institutionCode: instCode,
      studentId: data.studentId,
      amount: data.amount,
      receiptNo: data.receiptNo || undefined,
      paymentId: data.id,
    });
    return reply.send({ success: true, data });
  } catch (err: any) {
    const parsed = parseZod(err);
    return reply.status(parsed.statusCode || 400).send({ success: false, error: { message: parsed.message, code: parsed.code } });
  }
}

export async function updateFeePaymentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    const body = UpdateFeePaymentSchema.parse(request.body);
    const data = await adminService.updateFeePayment(id, instCode, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    const parsed = parseZod(err);
    return reply.status(parsed.statusCode || 400).send({ success: false, error: { message: parsed.message, code: parsed.code } });
  }
}

export async function deleteFeePaymentHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    await adminService.deleteFeePayment(id, instCode);
    return reply.send({ success: true });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({ success: false, error: { message: err.message } });
  }
}

export async function getParentFeesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const uid = request.user?.uid || '';
    const data = await adminService.getParentFees(instCode, uid);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({ success: false, error: { message: err.message, code: err.code } });
  }
}

export async function getStudentFeesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const uid = request.user?.uid || '';
    const data = await adminService.getStudentFees(instCode, uid);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({ success: false, error: { message: err.message, code: err.code } });
  }
}

// Expense Management Handlers
export async function getExpensesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const data = await adminService.getExpenses(instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({ success: false, error: { message: err.message } });
  }
}

export async function createExpenseHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const body = CreateExpenseSchema.parse(request.body);
    const data = await adminService.createExpense(instCode, {
      ...body,
      createdBy: request.user?.uid,
    });
    return reply.send({ success: true, data });
  } catch (err: any) {
    const parsed = parseZod(err);
    return reply.status(parsed.statusCode || 400).send({ success: false, error: { message: parsed.message, code: parsed.code } });
  }
}

export async function updateExpenseHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    const body = UpdateExpenseSchema.parse(request.body);
    const data = await adminService.updateExpense(id, instCode, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    const parsed = parseZod(err);
    return reply.status(parsed.statusCode || 400).send({ success: false, error: { message: parsed.message, code: parsed.code } });
  }
}

export async function deleteExpenseHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { id } = request.params as { id: string };
    await adminService.deleteExpense(id, instCode);
    return reply.send({ success: true });
  } catch (err: any) {
    return reply.status(err.statusCode || 400).send({ success: false, error: { message: err.message } });
  }
}
