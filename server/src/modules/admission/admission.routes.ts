import { FastifyInstance } from 'fastify';
import { admissionController } from './admission.controller.js';
import { requireAdmissionAccess } from './admission.middleware.js';

export async function admissionRoutes(fastify: FastifyInstance) {
  // All admission endpoints require admission access (officer or admin)
  fastify.addHook('preHandler', requireAdmissionAccess);

  // Seat tracking & metrics
  fastify.get('/stats', admissionController.getStats.bind(admissionController));

  // Courses & Seat Matrix
  fastify.get('/courses', admissionController.getCourses.bind(admissionController));
  fastify.post('/courses', admissionController.createCourse.bind(admissionController));
  fastify.put('/courses/:id', admissionController.updateCourse.bind(admissionController));
  fastify.delete('/courses/:id', admissionController.deleteCourse.bind(admissionController));

  // Prospective Student Applications
  fastify.get('/applications', admissionController.getApplications.bind(admissionController));
  fastify.post('/applications', admissionController.createApplication.bind(admissionController));
  fastify.get('/applications/:id', admissionController.getApplicationById.bind(admissionController));
  fastify.put('/applications/:id', admissionController.updateApplication.bind(admissionController));

  // Allocation Lifecycle Actions
  fastify.post('/applications/:id/allocate', admissionController.allocateSeat.bind(admissionController));
  fastify.post('/applications/:id/unallocate', admissionController.unallocateSeat.bind(admissionController));
  fastify.post('/applications/:id/confirm', admissionController.confirmSeat.bind(admissionController));
  fastify.post('/applications/:id/cancel', admissionController.cancelApplication.bind(admissionController));

  // Dynamic Form Configs Pipeline
  fastify.get('/form-config', admissionController.getFormConfigs.bind(admissionController));
  fastify.post('/form-config', admissionController.saveFormConfig.bind(admissionController));
  fastify.delete('/form-config/:id', admissionController.deleteFormConfig.bind(admissionController));
}
