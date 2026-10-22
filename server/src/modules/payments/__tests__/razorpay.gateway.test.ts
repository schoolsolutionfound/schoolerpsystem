import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';

const sdk = vi.hoisted(() => ({
  ordersCreate: vi.fn(),
  paymentsFetch: vi.fn(),
  paymentsRefund: vi.fn(),
}));

vi.mock('razorpay', () => ({
  default: class MockRazorpay {
    orders = { create: sdk.ordersCreate };
    payments = { fetch: sdk.paymentsFetch, refund: sdk.paymentsRefund };
    constructor(_opts: any) {}
  },
}));

import { RazorpayGateway } from '../gateway/razorpay.js';
import type { MerchantCredentials } from '../gateway/adapter.js';

const gw = new RazorpayGateway();
const CREDS: MerchantCredentials = {
  keyId: 'rzp_test_123',
  keySecret: 'secret_key_abc',
  webhookSecret: 'whsec_xyz',
};

const SECRET = 'whsec_test_secret';

function sign(body: Buffer, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

function capturedBody(entity: Record<string, any> = {}): Buffer {
  return Buffer.from(
    JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_123',
            order_id: 'order_abc',
            amount: 499900,
            currency: 'INR',
            method: 'upi',
            status: 'captured',
            notes: { orderId: 'local-order-1' },
            ...entity,
          },
        },
      },
    }),
    'utf8'
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('verifyWebhookSignature (HMAC-SHA256 over raw bytes)', () => {
  it('accepts a signature produced with the same secret and body', () => {
    const body = capturedBody();
    expect(gw.verifyWebhookSignature(body, sign(body, SECRET), SECRET)).toBe(true);
  });

  it('rejects a signature from a different secret', () => {
    const body = capturedBody();
    expect(gw.verifyWebhookSignature(body, sign(body, 'other-secret'), SECRET)).toBe(false);
  });

  it('rejects a tampered body', () => {
    const body = capturedBody();
    const signature = sign(body, SECRET);
    const tampered = Buffer.from(body.toString('utf8').replace('499900', '499901'), 'utf8');
    expect(gw.verifyWebhookSignature(tampered, signature, SECRET)).toBe(false);
  });

  it('rejects a tampered signature', () => {
    const body = capturedBody();
    const signature = sign(body, SECRET);
    const flipped = (signature[0] === 'a' ? 'b' : 'a') + signature.slice(1);
    expect(gw.verifyWebhookSignature(body, flipped, SECRET)).toBe(false);
  });

  it('rejects empty body, signature, or secret without throwing', () => {
    expect(gw.verifyWebhookSignature(Buffer.alloc(0), sign(Buffer.from('x'), SECRET), SECRET)).toBe(false);
    expect(gw.verifyWebhookSignature(capturedBody(), '', SECRET)).toBe(false);
    expect(gw.verifyWebhookSignature(capturedBody(), 'deadbeef', '')).toBe(false);
  });
});

describe('parseWebhook', () => {
  it('maps payment.captured with paise amount, method, and order pointers', () => {
    const event = gw.parseWebhook(capturedBody());
    expect(event.type).toBe('payment.captured');
    expect(event.paymentId).toBe('pay_123');
    expect(event.orderId).toBe('order_abc');
    expect(event.amountPaise).toBe(499900);
    expect(event.currency).toBe('INR');
    expect(event.method).toBe('upi');
    expect(event.notesOrderId).toBe('local-order-1');
    expect(event.failureReason).toBeNull();
  });

  it('maps payment.authorized', () => {
    const body = Buffer.from(
      JSON.stringify({
        event: 'payment.authorized',
        payload: { payment: { entity: { id: 'pay_a', order_id: 'order_a', amount: 100, method: 'card', status: 'authorized' } } },
      })
    );
    expect(gw.parseWebhook(body).type).toBe('payment.authorized');
  });

  it('maps payment.failed with the gateway failure reason', () => {
    const body = Buffer.from(
      JSON.stringify({
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_f',
              order_id: 'order_f',
              amount: 2500,
              method: 'netbanking',
              status: 'failed',
              error_description: 'Customer dropped the transaction',
            },
          },
        },
      })
    );
    const event = gw.parseWebhook(body);
    expect(event.type).toBe('payment.failed');
    expect(event.failureReason).toBe('Customer dropped the transaction');
  });

  it('maps refund.processed with the refund amount (partial refunds supported)', () => {
    const body = Buffer.from(
      JSON.stringify({
        event: 'refund.processed',
        payload: {
          refund: {
            entity: {
              id: 'rfnd_1',
              payment_id: 'pay_123',
              amount: 1000,
              currency: 'INR',
              notes: { orderId: 'local-order-1' },
            },
          },
        },
      })
    );
    const event = gw.parseWebhook(body);
    expect(event.type).toBe('refund.processed');
    expect(event.paymentId).toBe('pay_123');
    expect(event.refundAmountPaise).toBe(1000);
    expect(event.notesOrderId).toBe('local-order-1');
  });

  it('treats refund.initiated / refund.failed as unknown (only processed moves money)', () => {
    for (const name of ['refund.initiated', 'refund.failed']) {
      const body = Buffer.from(
        JSON.stringify({
          event: name,
          payload: { refund: { entity: { id: 'rfnd_x', payment_id: 'pay_x', amount: 10 } } },
        })
      );
      expect(gw.parseWebhook(body).type).toBe('unknown');
    }
  });

  it('returns unknown for unrecognized events but keeps the order pointer', () => {
    const body = Buffer.from(
      JSON.stringify({
        event: 'dispute.opened',
        payload: { payment: { entity: { id: 'pay_d', notes: { orderId: 'local-order-9' } } } },
      })
    );
    const event = gw.parseWebhook(body);
    expect(event.type).toBe('unknown');
    expect(event.notesOrderId).toBe('local-order-9');
  });

  it('never throws on invalid JSON', () => {
    const event = gw.parseWebhook(Buffer.from('not-json{', 'utf8'));
    expect(event.type).toBe('unknown');
  });

  it('redacts PII from the persisted callback (no email/contact/card)', () => {
    const body = capturedBody({
      email: 'parent@example.com',
      contact: '9876543210',
      card: { last4: '4242', number: '4111111111111111' },
      token: 'token_abc',
      vpa: 'parent@upi',
      description: 'fee payment',
    });
    const event = gw.parseWebhook(body);
    expect(event.callback).toMatchObject({
      event: 'payment.captured',
      id: 'pay_123',
      order_id: 'order_abc',
      amount: 499900,
      method: 'upi',
      status: 'captured',
    });
    const serialized = JSON.stringify(event.callback);
    expect(serialized).not.toContain('parent@example.com');
    expect(serialized).not.toContain('9876543210');
    expect(serialized).not.toContain('4111111111111111');
    expect(serialized).not.toContain('token_abc');
    expect(serialized).not.toContain('parent@upi');
    expect(Object.keys(event.callback)).toEqual([
      'event',
      'id',
      'order_id',
      'payment_id',
      'amount',
      'currency',
      'method',
      'status',
      'error_description',
    ]);
  });
});

describe('createOrder (SDK mapping)', () => {
  it('creates the gateway order in paise with receipt + notes + expire_by', async () => {
    sdk.ordersCreate.mockResolvedValue({ id: 'order_GW1' });
    const result = await gw.createOrder(CREDS, {
      amountPaise: 499900,
      currency: 'INR',
      receipt: 'local-order-1',
      notes: { orderId: 'local-order-1', institutionCode: 'DPS' },
      expireBy: 1790000000,
    });
    expect(result).toEqual({ gatewayOrderId: 'order_GW1' });
    expect(sdk.ordersCreate).toHaveBeenCalledWith({
      amount: 499900,
      currency: 'INR',
      receipt: 'local-order-1',
      notes: { orderId: 'local-order-1', institutionCode: 'DPS' },
      expire_by: 1790000000,
    });
  });

  it('throws GATEWAY_BAD_RESPONSE (502) when the gateway returns no id', async () => {
    sdk.ordersCreate.mockResolvedValue({});
    await expect(
      gw.createOrder(CREDS, { amountPaise: 100, currency: 'INR', receipt: 'r', notes: {} })
    ).rejects.toMatchObject({ code: 'GATEWAY_BAD_RESPONSE', statusCode: 502 });
  });
});

describe('refund (SDK mapping)', () => {
  it('refunds the full captured amount and returns the refund id', async () => {
    sdk.paymentsRefund.mockResolvedValue({ id: 'rfnd_9', status: 'processed' });
    const result = await gw.refund(CREDS, {
      paymentId: 'pay_123',
      amountPaise: 499900,
      reason: 'parent requested cancellation',
    });
    expect(result).toEqual({ refundId: 'rfnd_9', status: 'processed' });
    expect(sdk.paymentsRefund).toHaveBeenCalledWith('pay_123', {
      amount: 499900,
      notes: { reason: 'parent requested cancellation' },
    });
  });

  it('truncates the reason to 255 chars in notes', async () => {
    sdk.paymentsRefund.mockResolvedValue({ id: 'rfnd_10', status: 'pending' });
    await gw.refund(CREDS, { paymentId: 'pay_1', amountPaise: 100, reason: 'x'.repeat(300) });
    const notes = sdk.paymentsRefund.mock.calls[0][1].notes;
    expect(notes.reason).toHaveLength(255);
  });

  it('throws GATEWAY_BAD_RESPONSE when no refund id comes back', async () => {
    sdk.paymentsRefund.mockResolvedValue({});
    await expect(
      gw.refund(CREDS, { paymentId: 'pay_1', amountPaise: 100 })
    ).rejects.toMatchObject({ code: 'GATEWAY_BAD_RESPONSE', statusCode: 502 });
  });
});

describe('fetchPayment', () => {
  it('normalizes amount to integer paise', async () => {
    sdk.paymentsFetch.mockResolvedValue({ id: 'pay_1', status: 'captured', amount: 1050.7 });
    const result = await gw.fetchPayment(CREDS, 'pay_1');
    expect(result).toEqual({ id: 'pay_1', status: 'captured', amountPaise: 1051 });
  });
});
