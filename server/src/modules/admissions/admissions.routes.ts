import { FastifyInstance } from 'fastify';
import { admissionsController } from './admissions.controller.js';
import { admin, isFirebaseAdminInitialized } from '../shared/config/firebase.js';

import { db } from '../shared/db/index.js';
import * as schema from '../shared/db/schema.js';
import { eq, or } from 'drizzle-orm';

async function optionalAuth(req: any, _reply: any) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ') && isFirebaseAdminInitialized) {
    try {
      const token = authHeader.split('Bearer ')[1]?.trim();
      const decoded = await admin.auth().verifyIdToken(token);
      let institutionCode = decoded.institutionCode || '';
      let roles = decoded.roles || [decoded.role || ''];

      if ((!institutionCode || institutionCode === 'DEFAULT') && db) {
        const dbUsers = await db
          .select()
          .from(schema.users)
          .where(
            or(
              eq(schema.users.firebaseUid, decoded.uid),
              eq(schema.users.id, decoded.uid),
              decoded.email ? eq(schema.users.email, decoded.email) : eq(schema.users.id, decoded.uid)
            )
          );
        if (dbUsers.length > 0) {
          institutionCode = dbUsers[0].institutionCode || '';
          roles = dbUsers[0].roles || [dbUsers[0].role];
        }
      }

      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        role: decoded.role || '',
        roles,
        institutionCode,
      };
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
