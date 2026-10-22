/**
 * @file payroll.controller.ts
 * @description HTTP handlers for the Payroll module.
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { payrollService } from './payroll.service.js';
import {
  CreatePayrollScheduleSchema,
  UpdatePayrollScheduleSchema,
  PayScheduleSchema,
  AddBonusSchema,
} from './payroll.schema.js';

function parseZod(err: any) {
  if (err?.name === 'ZodError') {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: err.errors?.[0]?.message || 'Invalid input data',
    };
  }
  return err;
}

function extractInstCode(req: FastifyRequest): string {
  const instCode = req.user?.institutionCode?.trim();
  if (!instCode) {
    throw { statusCode: 403, code: 'NO_INSTITUTION', message: 'No institution assigned to this user.' };
  }
  return instCode;
}

function actorId(req: FastifyRequest): string | undefined {
  return (req.user as any)?.id;
}

export async function listStaffHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const q = (request.query as any) || {};
    const data = await payrollService.listStaff(instCode, q.role ? String(q.role) : undefined);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch staff' },
    });
  }
}

export async function listSchedulesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const data = await payrollService.listSchedules(instCode);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch payroll schedules' },
    });
  }
}

export async function createSchedulesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const parsed = CreatePayrollScheduleSchema.parse(request.body);
    const data = await payrollService.createSchedules(instCode, parsed, actorId(request));
    return reply.send({ success: true, data });
  } catch (err: any) {
    const e = parseZod(err);
    return reply.status(e.statusCode || 500).send({
      success: false,
      error: { message: e.message || 'Failed to create payroll schedules', ...(e.code ? { code: e.code } : {}) },
    });
  }
}

export async function getScheduleDetailHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const id = (request.params as any)?.id;
    const data = await payrollService.getDetail(instCode, id);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to fetch payroll schedule' },
    });
  }
}

export async function updateScheduleHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const id = (request.params as any)?.id;
    const parsed = UpdatePayrollScheduleSchema.parse(request.body);
    const data = await payrollService.updateSchedule(instCode, id, parsed);
    return reply.send({ success: true, data });
  } catch (err: any) {
    const e = parseZod(err);
    return reply.status(e.statusCode || 500).send({
      success: false,
      error: { message: e.message || 'Failed to update payroll schedule', ...(e.code ? { code: e.code } : {}) },
    });
  }
}

export async function payScheduleHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const id = (request.params as any)?.id;
    const parsed = PayScheduleSchema.parse(request.body);
    const data = await payrollService.pay(instCode, id, parsed);
    return reply.send({ success: true, data });
  } catch (err: any) {
    const e = parseZod(err);
    return reply.status(e.statusCode || 500).send({
      success: false,
      error: { message: e.message || 'Payment failed', ...(e.code ? { code: e.code } : {}) },
    });
  }
}

export async function addBonusHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const id = (request.params as any)?.id;
    const parsed = AddBonusSchema.parse(request.body);
    const data = await payrollService.addBonus(instCode, id, parsed, actorId(request));
    return reply.send({ success: true, data });
  } catch (err: any) {
    const e = parseZod(err);
    return reply.status(e.statusCode || 500).send({
      success: false,
      error: { message: e.message || 'Failed to add bonus', ...(e.code ? { code: e.code } : {}) },
    });
  }
}

export async function generateDueHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const generated = await payrollService.generateDue(instCode);
    return reply.send({ success: true, data: { generated } });
  } catch (err: any) {
    return reply.status(err.statusCode || 500).send({
      success: false,
      error: { message: err.message || 'Failed to generate due payroll rows' },
    });
  }
}
