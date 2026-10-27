import { FastifyInstance } from 'fastify';
import { admissionsController } from './admissions.controller.js';
import { authenticate } from '../shared/middleware/auth.js';

export async function admissionsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  // GET /api/v1/admissions - List admissions (tenant-scoped by controller)
  fastify.get('/', (req, reply) => admissionsController.getAdmissions(req, reply));

  // POST /api/v1/admissions - Submit admission
  fastify.post('/', (req, reply) => admissionsController.createAdmission(req, reply));

  // PATCH /api/v1/admissions/:id/status - Update admission status
  fastify.patch('/:id/status', (req, reply) => admissionsController.updateAdmissionStatus(req, reply));
}
