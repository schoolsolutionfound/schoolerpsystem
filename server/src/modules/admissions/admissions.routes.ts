import { FastifyInstance } from 'fastify';
import { admissionsController } from './admissions.controller.js';
import { authenticate } from '../shared/middleware/auth.js';

export async function admissionsRoutes(fastify: FastifyInstance) {
  // Public directory used by the parent app's school discovery screens.
  // Registered in a child scope so the auth hook below cannot capture it.
  await fastify.register(async (publicScope) => {
    publicScope.get('/public-institutions', (req, reply) => admissionsController.listPublicInstitutions(req, reply));
    publicScope.get('/public-institutions/:code', (req: any, reply) => admissionsController.getPublicInstitution(req, reply));
  });

  await fastify.register(async (authScope) => {
    authScope.addHook('preHandler', authenticate);

    // GET /api/v1/admissions - List admissions (tenant-scoped by controller)
    authScope.get('/', (req, reply) => admissionsController.getAdmissions(req, reply));

    // POST /api/v1/admissions - Submit admission
    authScope.post('/', (req, reply) => admissionsController.createAdmission(req, reply));

    // PATCH /api/v1/admissions/:id/status - Update admission status
    authScope.patch('/:id/status', (req, reply) => admissionsController.updateAdmissionStatus(req, reply));
  });
}
