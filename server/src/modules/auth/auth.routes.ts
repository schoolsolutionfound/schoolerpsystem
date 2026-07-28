import { FastifyInstance } from 'fastify';
import { loginSyncHandler, changePasswordHandler } from './auth.controller.js';
import { authenticate } from '../shared/middleware/auth.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login-sync', { preHandler: [authenticate] }, loginSyncHandler);
  fastify.post('/change-password', { preHandler: [authenticate] }, changePasswordHandler);
}
