import { FastifyInstance } from 'fastify';
import {
  listAnnouncementsHandler,
  createAnnouncementHandler,
  deleteAnnouncementHandler,
} from './announcements.controller.js';
import { authenticate, requireStaff } from '../shared/middleware/auth.js';

export async function announcementsRoutes(fastify: FastifyInstance) {
  // Any authenticated user can view announcements relevant to their audience/department
  fastify.get('/', { preHandler: [authenticate] }, listAnnouncementsHandler);

  // Staff (Principal, Admin, HOD, Teacher) can publish announcements/circulars/memos
  fastify.post(
    '/',
    {
      preHandler: [requireStaff],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    createAnnouncementHandler
  );

  // Deletion: Author or Admin/Principal
  fastify.delete(
    '/:id',
    {
      preHandler: [requireStaff],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    deleteAnnouncementHandler
  );
}
