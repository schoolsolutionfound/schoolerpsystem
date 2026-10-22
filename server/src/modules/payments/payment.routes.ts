import { FastifyInstance } from 'fastify';
import {
  cancelOrderHandler,
  createOrderHandler,
  getPaymentConfigHandler,
  listOrdersHandler,
  pollOrderHandler,
  refundOrderHandler,
  updatePaymentConfigHandler,
  webhookHandler,
} from './payment.controller.js';
import { authenticate, requireAdmin, requireRole } from '../shared/middleware/auth.js';

const requireFinance = requireRole('admin', 'accountant');
const requirePayer = requireRole('parent', 'student');

export async function paymentRoutes(fastify: FastifyInstance) {
  // ── Webhook (no Firebase auth — per-tenant HMAC signature is the auth) ──
  // Registered in an ENCAPSULATED child plugin so the raw-buffer content-type
  // parser applies ONLY here — every other route keeps normal JSON parsing.
  await fastify.register(async (webhookScope) => {
    webhookScope.addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      (_req, body, done) => {
        done(null, body);
      }
    );
    webhookScope.post(
      '/webhook/:institutionCode',
      { config: { rateLimit: { max: 120, timeWindow: '1 minute' } } },
      webhookHandler
    );
  });

  // ── Payment settings (admin) — secrets encrypted, never echoed back ──
  fastify.get('/config', { preHandler: [requireAdmin] }, getPaymentConfigHandler);
  fastify.put(
    '/config',
    { preHandler: [requireAdmin], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    updatePaymentConfigHandler
  );

  // ── Reconciliation (accountant/admin) — registered before /:orderId ──
  fastify.get('/orders', { preHandler: [requireFinance] }, listOrdersHandler);

  // ── Refund (admin) ──
  fastify.post(
    '/:orderId/refund',
    { preHandler: [requireAdmin], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    refundOrderHandler
  );

  // ── Parent / student checkout lifecycle ──
  fastify.post(
    '/order',
    { preHandler: [requirePayer], config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    createOrderHandler
  );
  fastify.get('/:orderId', { preHandler: [requirePayer] }, pollOrderHandler);
  fastify.post(
    '/:orderId/cancel',
    { preHandler: [requirePayer], config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    cancelOrderHandler
  );
}
