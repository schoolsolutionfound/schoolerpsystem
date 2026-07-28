import { FastifyInstance } from 'fastify';
import { institutionController } from './institution.controller.js';

export async function institutionRoutes(fastify: FastifyInstance) {
  // POST /api/v1/institutions - Create institution
  fastify.post('/', (req, reply) => institutionController.createInstitution(req, reply));

  // GET /api/v1/institutions - List all institutions
  fastify.get('/', (req, reply) => institutionController.getInstitutions(req, reply));

  // GET /api/v1/institutions/:id - Get institution by ID
  fastify.get('/:id', (req, reply) => institutionController.getInstitutionById(req as any, reply));

  // PUT /api/v1/institutions/:id - Update institution by ID
  fastify.put('/:id', (req, reply) => institutionController.updateInstitution(req as any, reply));

  // DELETE /api/v1/institutions/:id - Delete institution by ID
  fastify.delete('/:id', (req, reply) => institutionController.deleteInstitution(req as any, reply));
}
