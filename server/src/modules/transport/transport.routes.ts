import { FastifyInstance } from 'fastify';
import { requireRole } from '../shared/middleware/auth.js';
import {
  getDriverAssignmentHandler,
  startTripHandler,
  updateLocationHandler,
  endTripHandler,
  getMyBusHandler,
  streamBusLocationHandler,
  getTransportOverviewHandler,
  createRouteHandler,
  updateRouteHandler,
  deleteRouteHandler,
  createVehicleHandler,
  updateVehicleHandler,
  addStopHandler,
  updateStopHandler,
  deleteStopHandler,
  searchStudentsHandler,
  assignStudentHandler,
  removeAssignmentHandler,
} from './transport.controller.js';

export async function transportRoutes(fastify: FastifyInstance) {
  // Driver routes
  fastify.get('/driver/assignment', { preHandler: [requireRole('driver')] }, getDriverAssignmentHandler);
  fastify.post('/driver/trips/start', { preHandler: [requireRole('driver')] }, startTripHandler);
  fastify.post('/driver/trips/:id/location', { preHandler: [requireRole('driver')] }, updateLocationHandler);
  fastify.post('/driver/trips/:id/end', { preHandler: [requireRole('driver')] }, endTripHandler);

  // Student and Parent routes
  fastify.get('/my-bus', { preHandler: [requireRole('student', 'parent')] }, getMyBusHandler);
  fastify.get('/stream', { preHandler: [requireRole('student', 'parent')] }, streamBusLocationHandler);

  // Admin / Admission transport management
  const managers = requireRole('admin', 'admission_officer', 'admission officer', 'principal');

  fastify.get('/admin/overview', { preHandler: [managers] }, getTransportOverviewHandler);

  fastify.post('/admin/routes', { preHandler: [managers] }, createRouteHandler);
  fastify.patch('/admin/routes/:id', { preHandler: [managers] }, updateRouteHandler);
  fastify.delete('/admin/routes/:id', { preHandler: [managers] }, deleteRouteHandler);

  fastify.post('/admin/routes/:id/stops', { preHandler: [managers] }, addStopHandler);
  fastify.patch('/admin/stops/:id', { preHandler: [managers] }, updateStopHandler);
  fastify.delete('/admin/stops/:id', { preHandler: [managers] }, deleteStopHandler);

  fastify.post('/admin/vehicles', { preHandler: [managers] }, createVehicleHandler);
  fastify.patch('/admin/vehicles/:id', { preHandler: [managers] }, updateVehicleHandler);

  fastify.get('/admin/students', { preHandler: [managers] }, searchStudentsHandler);
  fastify.post('/admin/assignments', { preHandler: [managers] }, assignStudentHandler);
  fastify.delete('/admin/assignments/:id', { preHandler: [managers] }, removeAssignmentHandler);
}

