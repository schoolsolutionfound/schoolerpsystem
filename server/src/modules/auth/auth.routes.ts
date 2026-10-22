import { FastifyInstance } from 'fastify';
import { loginSyncHandler, changePasswordHandler, logoutHandler } from './auth.controller.js';
import { emailVerificationRoutes } from './email.verification.routes.js';
import { authenticate } from '../shared/middleware/auth.js';

export async function authRoutes(fastify: FastifyInstance) {
  await fastify.register(emailVerificationRoutes);
  fastify.post(
    '/login-sync',
    { preHandler: [authenticate], config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    loginSyncHandler
  );
  fastify.post(
    '/logout',
    { preHandler: [authenticate], config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    logoutHandler
  );
  fastify.post(
    '/change-password',
    { preHandler: [authenticate], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    changePasswordHandler
  );
}
