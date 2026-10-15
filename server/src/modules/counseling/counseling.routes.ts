import { FastifyInstance } from 'fastify';
import {
  listCounselingRecordsHandler,
  createCounselingRecordHandler,
  updateCounselingRecordHandler,
} from './counseling.controller.js';
import { requireAdminOrPrincipal } from '../shared/middleware/auth.js';

export async function counselingRoutes(fastify: FastifyInstance) {
  // Principal & Admin can access and manage counseling records
  fastify.get('/', { preHandler: [requireAdminOrPrincipal] }, listCounselingRecordsHandler);
  fastify.post(
    '/',
    {
      preHandler: [requireAdminOrPrincipal],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    createCounselingRecordHandler
  );
  fastify.patch(
    '/:id',
    {
      preHandler: [requireAdminOrPrincipal],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    updateCounselingRecordHandler
  );
}
