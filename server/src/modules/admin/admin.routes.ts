import { FastifyInstance } from 'fastify';
import {
  getInstitutionConfigHandler,
  updateInstitutionConfigHandler,
  getDashboardStatsHandler,
  getStudentsHandler,
  createStudentHandler,
  getTeachersHandler,
  createTeacherHandler,
  getUsersHandler,
  createUserHandler,
  singleFeedHandler,
  bulkFeedHandler,
} from './admin.controller.js';
import { authenticate, requireAdmin } from '../shared/middleware/auth.js';

export async function adminRoutes(fastify: FastifyInstance) {
  // Academic Config (read is safe for any authenticated user; writes are admin-only)
  fastify.get('/institution-config', { preHandler: [authenticate] }, getInstitutionConfigHandler);
  fastify.put('/institution-config', { preHandler: [requireAdmin], config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, updateInstitutionConfigHandler);

  // Dashboard Stats (Maintainer Dashboard — admin only)
  fastify.get('/dashboard-stats', { preHandler: [requireAdmin] }, getDashboardStatsHandler);

  // Student Management
  fastify.get('/students', { preHandler: [requireAdmin] }, getStudentsHandler);
  fastify.post('/students', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, createStudentHandler);

  // Teacher Management
  fastify.get('/teachers', { preHandler: [requireAdmin] }, getTeachersHandler);
  fastify.post('/teachers', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, createTeacherHandler);

  // Unified User Management (all roles)
  fastify.get('/users', { preHandler: [requireAdmin] }, getUsersHandler);
  fastify.post('/users', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, createUserHandler);

  // Legacy Feeds
  fastify.post('/single-feed', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, singleFeedHandler);
  fastify.post('/bulk-feed', { preHandler: [requireAdmin], config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, bulkFeedHandler);
}
