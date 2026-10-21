import { FastifyInstance } from 'fastify';
import { requireRole } from '../shared/middleware/auth.js';
import {
  getDriverAssignmentHandler,
  startTripHandler,
  updateLocationHandler,
  endTripHandler,
  getMyBusHandler,
} from './transport.controller.js';

export async function transportRoutes(fastify: FastifyInstance) {
  // Driver routes
  fastify.get('/driver/assignment', { preHandler: [requireRole('driver')] }, getDriverAssignmentHandler);
  fastify.post('/driver/trips/start', { preHandler: [requireRole('driver')] }, startTripHandler);
  fastify.post('/driver/trips/:id/location', { preHandler: [requireRole('driver')] }, updateLocationHandler);
  fastify.post('/driver/trips/:id/end', { preHandler: [requireRole('driver')] }, endTripHandler);

  // Student and Parent routes
  fastify.get('/my-bus', { preHandler: [requireRole('student', 'parent')] }, getMyBusHandler);
}
