import { FastifyInstance } from 'fastify';
import { loginSyncHandler, changePasswordHandler, logoutHandler, forgotPasswordHandler, resetPasswordHandler } from './auth.controller.js';
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
    { preHandler: [authenticate], config: { rateLimit: { max: 30, timeWindow: '1 minute' } } },
    changePasswordHandler
  );
  // Forgot password (public)
  fastify.post(
    '/forgot-password',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    forgotPasswordHandler
  );
  // Password reset with a 6-digit email code (public)
  fastify.post(
    '/reset-password',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    resetPasswordHandler
  );
}
