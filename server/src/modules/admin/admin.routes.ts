import { FastifyInstance } from 'fastify';
import {
  getInstitutionConfigHandler,
  updateInstitutionConfigHandler,
  getStudentsHandler,
  createStudentHandler,
  getTeachersHandler,
  createTeacherHandler,
  getUsersHandler,
  createUserHandler,
  singleFeedHandler,
  bulkFeedHandler,
} from './admin.controller.js';
import { authenticate } from '../shared/middleware/auth.js';

export async function adminRoutes(fastify: FastifyInstance) {
  // Academic Config
  fastify.get('/institution-config', { preHandler: [authenticate] }, getInstitutionConfigHandler);
  fastify.put('/institution-config', { preHandler: [authenticate] }, updateInstitutionConfigHandler);

  // Student Management
  fastify.get('/students', { preHandler: [authenticate] }, getStudentsHandler);
  fastify.post('/students', { preHandler: [authenticate] }, createStudentHandler);

  // Teacher Management
  fastify.get('/teachers', { preHandler: [authenticate] }, getTeachersHandler);
  fastify.post('/teachers', { preHandler: [authenticate] }, createTeacherHandler);

  // Unified User Management (all roles)
  fastify.get('/users', { preHandler: [authenticate] }, getUsersHandler);
  fastify.post('/users', { preHandler: [authenticate] }, createUserHandler);

  // Legacy Feeds
  fastify.post('/single-feed', { preHandler: [authenticate] }, singleFeedHandler);
  fastify.post('/bulk-feed', { preHandler: [authenticate] }, bulkFeedHandler);
}
