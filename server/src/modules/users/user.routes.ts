import { FastifyInstance } from 'fastify';
import { getProfileHandler, completeProfileHandler } from './user.controller.js';
import { authenticate } from '../shared/middleware/auth.js';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/me', { preHandler: [authenticate] }, getProfileHandler);
  fastify.post('/complete-profile', { preHandler: [authenticate] }, completeProfileHandler);
}
