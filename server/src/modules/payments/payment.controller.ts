import { FastifyRequest, FastifyReply } from 'fastify';
import { paymentService } from './payment.service.js';
import {
  CreateOrderSchema,
  ListOrdersQuerySchema,
  RefundOrderSchema,
  UpdatePaymentConfigSchema,
} from './payment.schema.js';
import { getPublicPaymentConfig, savePaymentConfig } from './payment.config.js';

/**
 * Payments controller. Tenant code is read ONLY from the session
 * (never body/query/params) except for the webhook, where the tenant comes
 * from the URL path but is authenticated by the per-tenant HMAC signature.
 */

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

function payerOf(req: FastifyRequest): { uid: string; role: string } {
  const uid = req.user?.uid;
  const role = (req.user?.role || '').toLowerCase();
  if (!uid) throw { statusCode: 401, code: 'UNAUTHENTICATED', message: 'Authentication required.' };
  return { uid, role };
}

function fail(reply: FastifyReply, err: any, fallbackCode = 'PAYMENT_ERROR') {
  const parsed = parseZod(err);
  return reply.status(parsed.statusCode || 400).send({
    success: false,
    error: { message: parsed.message || 'Payment request failed', code: parsed.code || fallbackCode },
  });
}

// ─────────────────────────────────────────────────────────── parent/student

export async function createOrderHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const body = CreateOrderSchema.parse(request.body);
    const data = await paymentService.createOrder(instCode, payerOf(request), body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return fail(reply, err);
  }
}

export async function pollOrderHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { orderId } = request.params as { orderId: string };
    const data = await paymentService.pollOrder(instCode, orderId, payerOf(request).uid);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return fail(reply, err);
  }
}

export async function cancelOrderHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { orderId } = request.params as { orderId: string };
    const data = await paymentService.cancelOrder(instCode, orderId, payerOf(request).uid);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return fail(reply, err);
  }
}

// ─────────────────────────────────────────────────────────────────── webhook

/**
 * Gateway webhook. Body arrives as a raw Buffer (content-type parser scoped
 * to this route only) so HMAC verification runs over the exact signed bytes.
 * Auth = per-tenant signature; the path tenant must also match the order row.
 */
export async function webhookHandler(request: FastifyRequest, reply: FastifyReply) {
  const { institutionCode } = request.params as { institutionCode: string };
  try {
    const rawBody = request.body as Buffer;
    if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
      return reply.status(400).send({ success: false, error: { message: 'Empty webhook body', code: 'EMPTY_BODY' } });
    }
    const signature = String(request.headers['x-razorpay-signature'] || '');
    const result = await paymentService.handleWebhook(institutionCode, rawBody, signature);
    return reply.status(200).send({ success: true, data: result });
  } catch (err: any) {
    // Log webhook failures server-side; return minimal detail to the gateway.
    console.warn(
      `[payments] webhook rejected tenant=${institutionCode} status=${err?.statusCode || 500} code=${err?.code || '?'} ${err?.message || ''}`
    );
    return reply.status(err?.statusCode || 500).send({
      success: false,
      error: { message: err?.code || 'WEBHOOK_ERROR', code: err?.code || 'WEBHOOK_ERROR' },
    });
  }
}

// ─────────────────────────────────────────────────────── accountant / admin

export async function listOrdersHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const query = ListOrdersQuerySchema.parse(request.query || {});
    const data = await paymentService.listOrders(instCode, query);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return fail(reply, err);
  }
}

export async function refundOrderHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const { orderId } = request.params as { orderId: string };
    const body = RefundOrderSchema.parse(request.body || {});
    const data = await paymentService.refundOrder(instCode, orderId, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return fail(reply, err);
  }
}

// ───────────────────────────────────────────────────────── payment config

export async function getPaymentConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const data = (await getPublicPaymentConfig(instCode)) || null;
    return reply.send({ success: true, data });
  } catch (err: any) {
    return fail(reply, err);
  }
}

export async function updatePaymentConfigHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const instCode = extractInstCode(request);
    const body = UpdatePaymentConfigSchema.parse(request.body);
    const data = await savePaymentConfig(instCode, body);
    return reply.send({ success: true, data });
  } catch (err: any) {
    return fail(reply, err);
  }
}
