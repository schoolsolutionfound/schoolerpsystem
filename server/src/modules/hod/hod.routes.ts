import { FastifyInstance } from 'fastify';
import {
  getKPIsHandler,
  getFacultyHandler,
  getCoursesHandler,
  createCourseHandler,
  assignCourseInstructorHandler,
  getExamEligibilityHandler,
  updateHallTicketStatusHandler,
  getNoticesHandler,
  createNoticeHandler,
} from './hod.controller.js';
import { requireHODOrAdmin } from '../shared/middleware/auth.js';

export async function hodRoutes(fastify: FastifyInstance) {
  // Pre-handler for all HOD routes: requires HOD, Admin, or Principal role
  fastify.addHook('preHandler', requireHODOrAdmin);

  fastify.get('/kpis', getKPIsHandler);

  fastify.get('/faculty', getFacultyHandler);

  fastify.get('/courses', getCoursesHandler);
  fastify.post('/courses', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, createCourseHandler);
  fastify.post('/courses/:id/assign', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, assignCourseInstructorHandler);
  fastify.put('/courses/:id/assign', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, assignCourseInstructorHandler);

  fastify.get('/eligibility', getExamEligibilityHandler);
  fastify.patch('/eligibility/:id', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, updateHallTicketStatusHandler);

  fastify.get('/notices', getNoticesHandler);
  fastify.post('/notices', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, createNoticeHandler);
}
