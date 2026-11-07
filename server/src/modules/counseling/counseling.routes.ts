import { FastifyInstance } from 'fastify';
import {
  listCounselingRecordsHandler,
  createCounselingRecordHandler,
  updateCounselingRecordHandler,
} from './counseling.controller.js';
import { requireCounselorOrAdmin } from '../shared/middleware/auth.js';

export async function counselingRoutes(fastify: FastifyInstance) {
  // Principal, Admin and the counselor role can access and manage records
  fastify.get('/', { preHandler: [requireCounselorOrAdmin] }, listCounselingRecordsHandler);
  fastify.post(
    '/',
    {
      preHandler: [requireCounselorOrAdmin],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    createCounselingRecordHandler
  );
  fastify.patch(
    '/:id',
    {
      preHandler: [requireCounselorOrAdmin],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    updateCounselingRecordHandler
  );
}
