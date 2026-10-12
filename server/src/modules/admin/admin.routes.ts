import { FastifyInstance } from 'fastify';
import {
  getInstitutionConfigHandler,
  updateInstitutionConfigHandler,
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
  getTeachersHandler,
  createTeacherHandler,
  updateTeacherHandler,
  deleteTeacherHandler,
  getUsersHandler,
  createUserHandler,
  updateUserHandler,
  singleFeedHandler,
  bulkFeedHandler,
  getFeesHandler,
  createFeeHandler,
  updateFeeHandler,
  deleteFeeHandler,
  getFeePaymentsHandler,
  createFeePaymentHandler,
  updateFeePaymentHandler,
  deleteFeePaymentHandler,
} from './admin.controller.js';
import { authenticate, requireAdmin, requireAdminOrPrincipal, requireRole } from '../shared/middleware/auth.js';

export async function adminRoutes(fastify: FastifyInstance) {
  // Academic Config (read is safe for any authenticated user; writes are admin or principal)
  fastify.get('/institution-config', { preHandler: [authenticate] }, getInstitutionConfigHandler);
  fastify.put('/institution-config', { preHandler: [requireAdminOrPrincipal], config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, updateInstitutionConfigHandler);

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
  fastify.get('/my/documents', { preHandler: [requireRole('student')] }, getStudentDocumentsHandler);
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
  fastify.patch('/users/:id', { preHandler: [requireAdminOrPrincipal], config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, updateUserHandler);

  // Fee Management
  fastify.get('/fees', { preHandler: [requireAdmin] }, getFeesHandler);
  fastify.post('/fees', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, createFeeHandler);
  fastify.put('/fees/:id', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, updateFeeHandler);
  fastify.delete('/fees/:id', { preHandler: [requireAdmin], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, deleteFeeHandler);
  fastify.get('/fee-payments', { preHandler: [requireAdmin] }, getFeePaymentsHandler);
  fastify.post('/fee-payments', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, createFeePaymentHandler);
  fastify.put('/fee-payments/:id', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, updateFeePaymentHandler);
  fastify.delete('/fee-payments/:id', { preHandler: [requireAdmin], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, deleteFeePaymentHandler);

  // Legacy Feeds
  fastify.post('/single-feed', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, singleFeedHandler);
  fastify.post('/bulk-feed', { preHandler: [requireAdmin], config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, bulkFeedHandler);
}
