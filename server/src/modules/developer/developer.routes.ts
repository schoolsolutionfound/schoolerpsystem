import { FastifyInstance } from 'fastify';
import { developerController } from './developer.controller.js';
import { requireDeveloper } from '../shared/middleware/auth.js';

export async function developerRoutes(fastify: FastifyInstance) {
  // Enforce requireDeveloper middleware for all developer routes
  fastify.addHook('preHandler', requireDeveloper);

  // POST /api/v1/developer/institutions - Create institution
  fastify.post('/institutions', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, (req, reply) =>
    developerController.createInstitution(req, reply)
  );

  // GET /api/v1/developer/institutions - List institutions
  fastify.get('/institutions', (req, reply) => developerController.listInstitutions(req, reply));

  // GET /api/v1/developer/institutions/:id - Get institution by ID
  fastify.get('/institutions/:id', (req, reply) => developerController.getInstitutionById(req as any, reply));

  // PUT /api/v1/developer/institutions/:id - Update institution (including subscriptionStatus)
  fastify.put('/institutions/:id', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, (req, reply) =>
    developerController.updateInstitution(req as any, reply)
  );

  // DELETE /api/v1/developer/institutions/:id - Delete institution
  fastify.delete('/institutions/:id', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, (req, reply) =>
    developerController.deleteInstitution(req as any, reply)
  );

  // GET /api/v1/developer/stats - Get overall developer stats
  fastify.get('/stats', (req, reply) => developerController.getStats(req, reply));

  // GET /api/v1/developer/admins - List institution admins
  fastify.get('/admins', (req, reply) => developerController.listAdmins(req as any, reply));

  // POST /api/v1/developer/admins - Create institution admin
  fastify.post('/admins', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, (req, reply) =>
    developerController.createAdmin(req, reply)
  );

  // PUT /api/v1/developer/admins/:id - Update institution admin
  fastify.put('/admins/:id', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, (req, reply) =>
    developerController.updateAdmin(req as any, reply)
  );

  // DELETE /api/v1/developer/admins/:id - Delete institution admin
  fastify.delete('/admins/:id', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, (req, reply) =>
    developerController.deleteAdmin(req as any, reply)
  );
}
