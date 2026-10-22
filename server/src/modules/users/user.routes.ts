import { FastifyInstance } from 'fastify';
import {
  getProfileHandler,
  completeProfileHandler,
  updateMyProfileHandler,
  getMyProfileFieldsHandler,
} from './user.controller.js';
import { authenticate } from '../shared/middleware/auth.js';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/me', { preHandler: [authenticate] }, getProfileHandler);
  fastify.patch('/me', { preHandler: [authenticate], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, updateMyProfileHandler);
  fastify.post('/complete-profile', { preHandler: [authenticate] }, completeProfileHandler);
  // Settings → Form Fields config for the calling user's role
  fastify.get('/profile-fields', { preHandler: [authenticate] }, getMyProfileFieldsHandler);
}
