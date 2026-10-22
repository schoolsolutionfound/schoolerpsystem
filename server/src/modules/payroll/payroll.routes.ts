/**
 * @file payroll.routes.ts
 * @description Payroll module routes — finance staff only.
 */

import { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../shared/middleware/auth.js';
import {
  listStaffHandler,
  listSchedulesHandler,
  createSchedulesHandler,
  getScheduleDetailHandler,
  updateScheduleHandler,
  payScheduleHandler,
  addBonusHandler,
  generateDueHandler,
} from './payroll.controller.js';

const requireFinance = requireRole('admin', 'accountant');

export async function payrollRoutes(fastify: FastifyInstance) {
  fastify.get('/staff', { preHandler: [authenticate, requireFinance] }, listStaffHandler);

  fastify.get('/schedules', { preHandler: [authenticate, requireFinance] }, listSchedulesHandler);
  fastify.post(
    '/schedules',
    {
      preHandler: [authenticate, requireFinance],
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    createSchedulesHandler,
  );
  fastify.get('/schedules/:id', { preHandler: [authenticate, requireFinance] }, getScheduleDetailHandler);
  fastify.put(
    '/schedules/:id',
    {
      preHandler: [authenticate, requireFinance],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    updateScheduleHandler,
  );
  fastify.post(
    '/schedules/:id/pay',
    {
      preHandler: [authenticate, requireFinance],
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    payScheduleHandler,
  );
  fastify.post(
    '/schedules/:id/bonus',
    {
      preHandler: [authenticate, requireFinance],
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    },
    addBonusHandler,
  );

  fastify.post(
    '/generate-due',
    {
      preHandler: [authenticate, requireFinance],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    generateDueHandler,
  );
}
