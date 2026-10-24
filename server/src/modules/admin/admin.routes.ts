import { FastifyInstance } from 'fastify';
import {
  getInstitutionConfigHandler,
  updateInstitutionConfigHandler,
  getProfileFieldsHandler,
  updateRoleProfileFieldsHandler,
  getDashboardStatsHandler,
  getStudentsHandler,
  createStudentHandler,
  getStudentByIdHandler,
  updateStudentHandler,
  deleteStudentHandler,
  promoteStudentsHandler,
  graduateStudentsHandler,
  getAlumniHandler,
  getStudentDocumentsHandler,
  addStudentDocumentHandler,
  deleteStudentDocumentHandler,
  addMyDocumentHandler,
  deleteMyDocumentHandler,
  getMyDocumentsHandler,
  getTeachersHandler,
  createTeacherHandler,
  updateTeacherHandler,
  deleteTeacherHandler,
  getUsersHandler,
  createUserHandler,
  resetUserPasswordHandler,
  updateUserHandler,
  singleFeedHandler,
  bulkFeedHandler,
  bulkCreateUsersHandler,
  getFeesHandler,
  createFeeHandler,
  updateFeeHandler,
  deleteFeeHandler,
  getFeePaymentsHandler,
  createFeePaymentHandler,
  updateFeePaymentHandler,
  deleteFeePaymentHandler,
  getExpensesHandler,
  createExpenseHandler,
  updateExpenseHandler,
  deleteExpenseHandler,
  getParentFeesHandler,
  getStudentFeesHandler,
} from './admin.controller.js';
import { authenticate, requireAdmin, requireAdminOrPrincipal, requireRole } from '../shared/middleware/auth.js';

const requireFinance = requireRole('admin', 'accountant');

export async function adminRoutes(fastify: FastifyInstance) {
  // Academic Config (read is safe for any authenticated user; writes are admin or principal)
  fastify.get('/institution-config', { preHandler: [authenticate] }, getInstitutionConfigHandler);
  fastify.put('/institution-config', { preHandler: [requireAdminOrPrincipal], config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, updateInstitutionConfigHandler);

  // Per-role profile form fields (Settings �+' Form Fields)
  fastify.get('/profile-fields', { preHandler: [requireAdmin] }, getProfileFieldsHandler);
  fastify.put('/profile-fields/:role', { preHandler: [requireAdmin], config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, updateRoleProfileFieldsHandler);

  // Dashboard Stats (Maintainer & Principal Dashboard)
  fastify.get('/dashboard-stats', { preHandler: [requireAdminOrPrincipal] }, getDashboardStatsHandler);

  // Student Management
  fastify.get('/students', { preHandler: [requireAdminOrPrincipal] }, getStudentsHandler);
  fastify.get('/students/alumni', { preHandler: [requireAdminOrPrincipal] }, getAlumniHandler);
  fastify.get('/students/:id', { preHandler: [requireAdminOrPrincipal] }, getStudentByIdHandler);
  fastify.post('/students', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, createStudentHandler);
  fastify.put('/students/:id', { preHandler: [requireAdminOrPrincipal], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, updateStudentHandler);
  fastify.delete('/students/:id', { preHandler: [requireAdmin], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, deleteStudentHandler);
  fastify.post('/students/promote', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, promoteStudentsHandler);
  fastify.post('/students/graduate', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, graduateStudentsHandler);

  // Student Documents
  fastify.get('/students/:id/documents', { preHandler: [requireAdminOrPrincipal] }, getStudentDocumentsHandler);
  fastify.post('/students/:id/documents', { preHandler: [requireAdminOrPrincipal], config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, addStudentDocumentHandler);
  fastify.delete('/students/:id/documents/:docId', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, deleteStudentDocumentHandler);

  // Student Self-Document Upload (student auth)
  fastify.get('/my/documents', { preHandler: [requireRole('student')] }, getMyDocumentsHandler);
  fastify.post('/my/documents', { preHandler: [requireRole('student')], config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, addMyDocumentHandler);
  fastify.delete('/my/documents/:docId', { preHandler: [requireRole('student')], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, deleteMyDocumentHandler);

  // Teacher Management
  fastify.get('/teachers', { preHandler: [requireAdminOrPrincipal] }, getTeachersHandler);
  fastify.post('/teachers', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, createTeacherHandler);
  fastify.put('/teachers/:id', { preHandler: [requireAdminOrPrincipal], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, updateTeacherHandler);
  fastify.delete('/teachers/:id', { preHandler: [requireAdmin], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, deleteTeacherHandler);

  // Unified User Management (all roles)
  fastify.get('/users', { preHandler: [requireAdminOrPrincipal] }, getUsersHandler);
  fastify.post('/users', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, createUserHandler);
  fastify.post('/bulk-create', { preHandler: [requireAdmin], config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, bulkCreateUsersHandler);
  fastify.patch('/users/:id', { preHandler: [requireAdminOrPrincipal], config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, updateUserHandler);
  fastify.post('/users/:id/reset-password', { preHandler: [requireAdmin], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, resetUserPasswordHandler);

  // Fee Management (admin + accountant)
  fastify.get('/fees', { preHandler: [requireFinance] }, getFeesHandler);
  fastify.post('/fees', { preHandler: [requireFinance], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, createFeeHandler);
  fastify.put('/fees/:id', { preHandler: [requireFinance], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, updateFeeHandler);
  fastify.delete('/fees/:id', { preHandler: [requireFinance], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, deleteFeeHandler);
  fastify.get('/fee-payments', { preHandler: [requireFinance] }, getFeePaymentsHandler);
  fastify.post('/fee-payments', { preHandler: [requireFinance], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, createFeePaymentHandler);
  fastify.put('/fee-payments/:id', { preHandler: [requireFinance], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, updateFeePaymentHandler);
  fastify.delete('/fee-payments/:id', { preHandler: [requireFinance], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, deleteFeePaymentHandler);

  // Expense Management (accountant disbursements: salaries, fuel, utilities, ...)
  fastify.get('/expenses', { preHandler: [requireFinance] }, getExpensesHandler);
  fastify.post('/expenses', { preHandler: [requireFinance], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, createExpenseHandler);
  fastify.put('/expenses/:id', { preHandler: [requireFinance], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, updateExpenseHandler);
  fastify.delete('/expenses/:id', { preHandler: [requireFinance], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, deleteExpenseHandler);
  // Parent-scoped fee statement (child resolved server-side from parent.scope)
  fastify.get('/fees/parent', { preHandler: [requireRole('parent')] }, getParentFeesHandler);
  // Student-scoped fee statement (self resolved from session uid)
  fastify.get('/fees/student', { preHandler: [requireRole('student')] }, getStudentFeesHandler);

  // Legacy Feeds
  fastify.post('/single-feed', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, singleFeedHandler);
  fastify.post('/bulk-feed', { preHandler: [requireAdmin], config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, bulkFeedHandler);
}
