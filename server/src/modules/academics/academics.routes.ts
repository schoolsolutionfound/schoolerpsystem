import { FastifyInstance } from 'fastify';
import {
  listClassSectionsHandler,
  createClassSectionHandler,
  updateClassSectionHandler,
  deleteClassSectionHandler,
  listSubjectsHandler,
  createSubjectHandler,
  listSubjectTeachersHandler,
  createSubjectTeacherHandler,
  deleteSubjectTeacherHandler,
  listPeriodsHandler,
  createPeriodHandler,
  updateTermsHandler,
  updateHolidaysHandler,
} from './academics.controller.js';
import { authenticate, requireAdmin } from '../shared/middleware/auth.js';

export async function academicsRoutes(fastify: FastifyInstance) {
  // Class Sections
  fastify.get('/class-sections', { preHandler: [authenticate] }, (req, reply) => listClassSectionsHandler(req, reply));
  fastify.post('/class-sections', { preHandler: [requireAdmin] }, (req, reply) => createClassSectionHandler(req, reply));
  fastify.put('/class-sections/:id', { preHandler: [requireAdmin] }, (req, reply) => updateClassSectionHandler(req as any, reply));
  fastify.delete('/class-sections/:id', { preHandler: [requireAdmin] }, (req, reply) => deleteClassSectionHandler(req as any, reply));

  // Subjects
  fastify.get('/subjects', { preHandler: [authenticate] }, (req, reply) => listSubjectsHandler(req, reply));
  fastify.post('/subjects', { preHandler: [requireAdmin] }, (req, reply) => createSubjectHandler(req, reply));

  // Subject Teachers
  fastify.get('/subject-teachers', { preHandler: [authenticate] }, (req, reply) => listSubjectTeachersHandler(req, reply));
  fastify.post('/subject-teachers', { preHandler: [requireAdmin] }, (req, reply) => createSubjectTeacherHandler(req, reply));
  fastify.delete('/subject-teachers/:id', { preHandler: [requireAdmin] }, (req, reply) => deleteSubjectTeacherHandler(req as any, reply));

  // Periods
  fastify.get('/periods', { preHandler: [authenticate] }, (req, reply) => listPeriodsHandler(req, reply));
  fastify.post('/periods', { preHandler: [requireAdmin] }, (req, reply) => createPeriodHandler(req, reply));

  // Config (terms + holiday calendar)
  fastify.put('/config/terms', { preHandler: [requireAdmin] }, (req, reply) => updateTermsHandler(req, reply));
  fastify.put('/config/holidays', { preHandler: [requireAdmin] }, (req, reply) => updateHolidaysHandler(req, reply));
}
