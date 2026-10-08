import { FastifyInstance } from 'fastify';
import {
  getMyNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler,
  registerTokenHandler,
  unregisterTokenHandler,
  sendToUserHandler,
  sendBatchHandler,
  createCampaignHandler,
  launchCampaignHandler,
  getCampaignsHandler,
  getCampaignStatsHandler,
  getStatsHandler,
  getTemplatesHandler,
  upsertTemplateHandler,
  getPreferencesHandler,
  updatePreferencesHandler,
} from './notification.controller.js';
import { authenticate, requireRole } from '../shared/middleware/auth.js';

const requireStaff = requireRole('admin', 'teacher', 'hod', 'principal', 'accountant', 'librarian');
const requireAdmin = requireRole('admin');

export async function notificationRoutes(fastify: FastifyInstance) {
  // User — read own notifications
  fastify.get('/', { preHandler: [authenticate] }, getMyNotificationsHandler);
  fastify.get('/unread-count', { preHandler: [authenticate] }, getUnreadCountHandler);
  fastify.put('/:id/read', { preHandler: [authenticate] }, markAsReadHandler);
  fastify.put('/read-all', { preHandler: [authenticate] }, markAllAsReadHandler);

  // Preferences
  fastify.get('/preferences', { preHandler: [authenticate] }, getPreferencesHandler);
  fastify.put('/preferences', { preHandler: [authenticate], config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, updatePreferencesHandler);

  // Token management
  fastify.post('/register-token', { preHandler: [authenticate], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, registerTokenHandler);
  fastify.post('/unregister-token', { preHandler: [authenticate] }, unregisterTokenHandler);

  // Send (staff)
  fastify.post('/send', { preHandler: [requireStaff], config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, sendToUserHandler);
  fastify.post('/send-batch', { preHandler: [requireStaff], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, sendBatchHandler);

  // Campaigns (admin)
  fastify.post('/campaigns', { preHandler: [requireAdmin], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, createCampaignHandler);
  fastify.post('/campaigns/:id/launch', { preHandler: [requireAdmin], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, launchCampaignHandler);
  fastify.get('/campaigns', { preHandler: [requireAdmin] }, getCampaignsHandler);
  fastify.get('/campaigns/stats', { preHandler: [requireAdmin] }, getCampaignStatsHandler);

  // Stats (admin)
  fastify.get('/stats', { preHandler: [requireAdmin] }, getStatsHandler);

  // Templates (admin)
  fastify.get('/templates', { preHandler: [requireAdmin] }, getTemplatesHandler);
  fastify.put('/templates', { preHandler: [requireAdmin], config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, upsertTemplateHandler);
}
