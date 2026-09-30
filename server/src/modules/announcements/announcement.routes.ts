import { FastifyInstance } from 'fastify';
import {
  listAnnouncementsHandler,
  listUserFeedHandler,
  getUnreadCountHandler,
  getAnnouncementByIdHandler,
  createAnnouncementHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
  publishAnnouncementHandler,
  cancelAnnouncementHandler,
  archiveAnnouncementHandler,
  markAnnouncementReadHandler,
} from './announcement.controller.js';
import { authenticate, requireStaff } from '../shared/middleware/auth.js';

export async function announcementRoutes(fastify: FastifyInstance) {
  // Feed & Read Status (User-facing)
  fastify.get('/feed', { preHandler: [authenticate] }, (req, reply) => listUserFeedHandler(req, reply));
  fastify.get('/unread-count', { preHandler: [authenticate] }, (req, reply) => getUnreadCountHandler(req, reply));
  fastify.post('/:id/read', { preHandler: [authenticate] }, (req: any, reply) => markAnnouncementReadHandler(req, reply));

  // Management List & Detail
  fastify.get('/', { preHandler: [requireStaff] }, (req, reply) => listAnnouncementsHandler(req, reply));
  fastify.get('/:id', { preHandler: [authenticate] }, (req: any, reply) => getAnnouncementByIdHandler(req, reply));

  // Actions & Mutations (Staff / Admin)
  fastify.post('/', { preHandler: [requireStaff] }, (req, reply) => createAnnouncementHandler(req, reply));
  fastify.patch('/:id', { preHandler: [requireStaff] }, (req: any, reply) => updateAnnouncementHandler(req, reply));
  fastify.delete('/:id', { preHandler: [requireStaff] }, (req: any, reply) => deleteAnnouncementHandler(req, reply));
  fastify.post('/:id/publish', { preHandler: [requireStaff] }, (req: any, reply) => publishAnnouncementHandler(req, reply));
  fastify.post('/:id/cancel', { preHandler: [requireStaff] }, (req: any, reply) => cancelAnnouncementHandler(req, reply));
  fastify.post('/:id/archive', { preHandler: [requireStaff] }, (req: any, reply) => archiveAnnouncementHandler(req, reply));
}
