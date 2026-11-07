import { FastifyInstance } from 'fastify';
import {
  listManagementAnnouncementsHandler,
  createAnnouncementHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
} from './announcement.controller.js';
import { requireStaff } from '../shared/middleware/auth.js';

/**
 * Principal / HOD notice board. Reads and writes the same `announcements`
 * table the notification bell feed uses, so a notice published here reaches
 * every targeted role's /notifications feed (and read state is shared).
 */
export async function principalNoticesRoutes(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [requireStaff] }, (req, reply) => listManagementAnnouncementsHandler(req, reply));
  fastify.post(
    '/',
    {
      preHandler: [requireStaff],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    (req, reply) => createAnnouncementHandler(req, reply)
  );
  fastify.put(
    '/:id',
    {
      preHandler: [requireStaff],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    (req: any, reply) => updateAnnouncementHandler(req, reply)
  );
  fastify.delete(
    '/:id',
    {
      preHandler: [requireStaff],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    (req: any, reply) => deleteAnnouncementHandler(req, reply)
  );
}
