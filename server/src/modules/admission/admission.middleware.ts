import { FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../shared/middleware/auth.js';
import { db } from '../shared/db/index.js';
import { users } from '../shared/db/schema.js';
import { eq } from 'drizzle-orm';

export async function requireAdmissionAccess(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  const user = request.user;
  if (!user || !user.uid || !user.institutionCode) {
    return reply.status(401).send({
      success: false,
      error: { message: 'Unauthorized: User authentication required', code: 'UNAUTHORIZED' },
    });
  }

  // Developer has full access
  if (user.role === 'dev') return;

  const role = (user.role || '').toLowerCase().trim();
  if (role === 'admin' || role === 'institution admin' || role === 'admission_officer') {
    return;
  }

  // Fallback DB check
  if (db) {
    try {
      const dbUser = await db.query.users.findFirst({ where: eq(users.firebaseUid, user.uid) });
      const dbRole = (dbUser?.role || '').toLowerCase().trim();
      if (dbRole === 'admin' || dbRole === 'institution admin' || dbRole === 'admission_officer') {
        return;
      }
    } catch (err) {
      console.warn('[Admission Middleware] DB role verification failed:', err);
    }
  }

  return reply.status(403).send({
    success: false,
    error: { message: 'Access denied: Admission Officer or Administrator access required.', code: 'FORBIDDEN' },
  });
}
