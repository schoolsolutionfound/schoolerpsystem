import { FastifyInstance } from 'fastify';
import { admissionsController } from './admissions.controller.js';
import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';

async function optionalAuth(req: any, _reply: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ') && isFirebaseAdminInitialized) {
    try {
      const token = authHeader.split('Bearer ')[1]?.trim();
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = { uid: decoded.uid, email: decoded.email, role: decoded.role || '' };
    } catch {}
  }
}

export async function admissionsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', optionalAuth);

  // GET /api/v1/admissions - List admissions
  fastify.get('/', (req, reply) => admissionsController.getAdmissions(req, reply));

  // POST /api/v1/admissions - Submit admission
  fastify.post('/', (req, reply) => admissionsController.createAdmission(req, reply));

  // PATCH /api/v1/admissions/:id/status - Update admission status
  fastify.patch('/:id/status', (req, reply) => admissionsController.updateAdmissionStatus(req, reply));
}
