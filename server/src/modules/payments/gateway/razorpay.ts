import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import type {
  CreateGatewayOrderInput,
  GatewayOrderResult,
  GatewayPaymentEvent,
  GatewayRefundResult,
  MerchantCredentials,
  PaymentGateway,
} from './adapter.js';
import { safeEqual } from '../../shared/utils/encryption.js';

/**
 * Razorpay implementation of the PaymentGateway adapter.
 *
 * A fresh client is built per call from per-tenant credentials — there is no
 * module-level singleton, so one institution's keys can never be used for
 * another institution's operations.
 *
 * Webhook signatures are verified HERE with node crypto (HMAC-SHA256 over the
 * raw body bytes + timing-safe compare) rather than the SDK helper, so the
 * exact bytes we sign are the exact bytes the gateway signed.
 */

function getClient(creds: MerchantCredentials): Razorpay {
  return new Razorpay({ key_id: creds.keyId, key_secret: creds.keySecret });
}

function toPaise(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

function redactCallback(event: string, entity: Record<string, any>): Record<string, unknown> {
  // PII-minimised audit subset — never persist contact/email/card details.
  return {
    event,
    id: entity?.id ?? null,
    order_id: entity?.order_id ?? null,
    payment_id: entity?.payment_id ?? entity?.id ?? null,
    amount: entity?.amount ?? null,
    currency: entity?.currency ?? null,
    method: entity?.method ?? null,
    status: entity?.status ?? null,
    error_description: entity?.error_description ?? null,
  };
}

export class RazorpayGateway implements PaymentGateway {
  readonly name = 'razorpay';

  async createOrder(creds: MerchantCredentials, input: CreateGatewayOrderInput): Promise<GatewayOrderResult> {
    const client = getClient(creds);
    // expire_by is supported by the REST API but missing from the SDK's types.
    const order = await client.orders.create({
      amount: input.amountPaise,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
      ...(input.expireBy ? { expire_by: input.expireBy } : {}),
    } as any);
    if (!order?.id) {
      throw Object.assign(new Error('Gateway did not return an order id.'), {
        statusCode: 502,
        code: 'GATEWAY_BAD_RESPONSE',
      });
    }
    return { gatewayOrderId: order.id };
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string, webhookSecret: string): boolean {
    if (!rawBody?.length || !signature || !webhookSecret) return false;
    const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    return safeEqual(expected, signature);
  }

  async fetchPayment(creds: MerchantCredentials, paymentId: string) {
    const client = getClient(creds);
    const payment = await client.payments.fetch(paymentId);
    return {
      id: payment.id,
      status: payment.status,
      amountPaise: toPaise(payment.amount) ?? 0,
    };
  }

  async refund(
    creds: MerchantCredentials,
    input: { paymentId: string; amountPaise: number; reason?: string }
  ): Promise<GatewayRefundResult> {
    const client = getClient(creds);
    const refund = await client.payments.refund(input.paymentId, {
      amount: input.amountPaise,
      ...(input.reason ? { notes: { reason: input.reason.slice(0, 255) } } : {}),
    });
    if (!refund?.id) {
      throw Object.assign(new Error('Gateway did not return a refund id.'), {
        statusCode: 502,
        code: 'GATEWAY_BAD_RESPONSE',
      });
    }
    return { refundId: refund.id, status: refund.status || 'pending' };
  }

  parseWebhook(rawBody: Buffer): GatewayPaymentEvent {
    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      payload = {};
    }

    const event: string = payload?.event || 'unknown';
    const paymentEntity = payload?.payload?.payment?.entity;
    const refundEntity = payload?.payload?.refund?.entity;
    const notes = paymentEntity?.notes ?? refundEntity?.notes ?? {};

    const base: GatewayPaymentEvent = {
      type: 'unknown',
      paymentId: '',
      orderId: null,
      amountPaise: null,
      currency: null,
      method: null,
      failureReason: null,
      callback: redactCallback(event, paymentEntity || refundEntity || {}),
      notesOrderId: typeof notes.orderId === 'string' ? notes.orderId : null,
      refundAmountPaise: null,
    };

    if (event === 'payment.authorized' || event === 'payment.captured' || event === 'payment.failed') {
      return {
        ...base,
        type: event,
        paymentId: String(paymentEntity?.id || ''),
        orderId: paymentEntity?.order_id ? String(paymentEntity.order_id) : null,
        amountPaise: toPaise(paymentEntity?.amount),
        currency: paymentEntity?.currency ? String(paymentEntity.currency) : null,
        method: paymentEntity?.method ? String(paymentEntity.method) : null,
        failureReason: paymentEntity?.error_description
          ? String(paymentEntity.error_description)
          : null,
      };
    }

    if (event === 'refund.processed' || event === 'refund.failed' || event === 'refund.initiated') {
      // Only refund.processed changes money state; the service ignores others.
      return {
        ...base,
        type: event === 'refund.processed' ? 'refund.processed' : 'unknown',
        paymentId: String(refundEntity?.payment_id || paymentEntity?.id || ''),
        orderId: paymentEntity?.order_id ? String(paymentEntity.order_id) : null,
        amountPaise: toPaise(refundEntity?.amount ?? paymentEntity?.amount),
        currency: refundEntity?.currency ? String(refundEntity.currency) : null,
        callback: redactCallback(event, refundEntity || paymentEntity || {}),
        refundAmountPaise: toPaise(refundEntity?.amount),
      };
    }

    return base;
  }
}

export const razorpayGateway = new RazorpayGateway();
