import { describe, it, expect } from 'vitest';
import {
  CreateOrderSchema,
  UpdatePaymentConfigSchema,
  ListOrdersQuerySchema,
  RefundOrderSchema,
} from '../payment.schema.js';

describe('CreateOrderSchema (client sends fee ids only)', () => {
  it('accepts a list of fee structure ids', () => {
    const parsed = CreateOrderSchema.parse({ feeStructureIds: ['fs_1', 'fs_2'] });
    expect(parsed.feeStructureIds).toEqual(['fs_1', 'fs_2']);
  });

  it('rejects an empty list', () => {
    expect(() => CreateOrderSchema.parse({ feeStructureIds: [] })).toThrow();
  });

  it('rejects a missing list', () => {
    expect(() => CreateOrderSchema.parse({})).toThrow();
  });

  it('rejects more than 50 lines', () => {
    const ids = Array.from({ length: 51 }, (_, i) => `fs_${i}`);
    expect(() => CreateOrderSchema.parse({ feeStructureIds: ids })).toThrow();
  });

  it('rejects blank ids', () => {
    expect(() => CreateOrderSchema.parse({ feeStructureIds: [''] })).toThrow();
  });

  it('REJECTS client-supplied amounts (unknown keys are stripped)', () => {
    const parsed = CreateOrderSchema.parse({
      feeStructureIds: ['fs_1'],
      amountPaise: 1,
      studentId: 'someone-else',
      institutionCode: 'OTHER',
    });
    expect(parsed).toEqual({ feeStructureIds: ['fs_1'] });
  });
});

describe('UpdatePaymentConfigSchema (write-only secrets)', () => {
  it('accepts full setup payload with defaults', () => {
    const parsed = UpdatePaymentConfigSchema.parse({
      keyId: 'rzp_test_abc',
      keySecret: 'secret1',
      webhookSecret: 'hook2',
    });
    expect(parsed).toEqual({
      gateway: 'razorpay',
      keyId: 'rzp_test_abc',
      keySecret: 'secret1',
      webhookSecret: 'hook2',
      isActive: true,
    });
  });

  it('allows omitting secrets (keep stored values) and defaults isActive', () => {
    const parsed = UpdatePaymentConfigSchema.parse({ keyId: 'rzp_test_abc' });
    expect(parsed.keySecret).toBeUndefined();
    expect(parsed.webhookSecret).toBeUndefined();
    expect(parsed.isActive).toBe(true);
  });

  it('rejects secrets shorter than 4 chars when provided', () => {
    expect(() =>
      UpdatePaymentConfigSchema.parse({ keyId: 'rzp_test_abc', keySecret: 'ab' })
    ).toThrow();
  });

  it('rejects a missing keyId', () => {
    expect(() => UpdatePaymentConfigSchema.parse({ keySecret: 'abcd' })).toThrow();
  });

  it('rejects unknown gateways', () => {
    expect(() =>
      UpdatePaymentConfigSchema.parse({ gateway: 'payu', keyId: 'k123' })
    ).toThrow();
  });
});

describe('ListOrdersQuerySchema (accountant reconciliation)', () => {
  it('applies defaults (limit 50, offset 0)', () => {
    expect(ListOrdersQuerySchema.parse({})).toEqual({ limit: 50, offset: 0 });
  });

  it('coerces numeric strings', () => {
    expect(ListOrdersQuerySchema.parse({ limit: '25', offset: '75' })).toEqual({
      limit: 25,
      offset: 75,
    });
  });

  it('rejects limit above 100', () => {
    expect(() => ListOrdersQuerySchema.parse({ limit: 101 })).toThrow();
  });

  it('rejects limit below 1', () => {
    expect(() => ListOrdersQuerySchema.parse({ limit: 0 })).toThrow();
    expect(() => ListOrdersQuerySchema.parse({ limit: -5 })).toThrow();
  });

  it('accepts only known statuses', () => {
    expect(ListOrdersQuerySchema.parse({ status: 'paid' }).status).toBe('paid');
    expect(ListOrdersQuerySchema.parse({ status: 'partially_refunded' }).status).toBe(
      'partially_refunded'
    );
    expect(() => ListOrdersQuerySchema.parse({ status: 'settled' })).toThrow();
  });

  it('validates YYYY-MM-DD date filters', () => {
    expect(ListOrdersQuerySchema.parse({ from: '2026-10-01', to: '2026-10-15' })).toMatchObject({
      from: '2026-10-01',
      to: '2026-10-15',
    });
    expect(() => ListOrdersQuerySchema.parse({ from: '01-10-2026' })).toThrow();
    expect(() => ListOrdersQuerySchema.parse({ to: '2026/10/15' })).toThrow();
  });
});

describe('RefundOrderSchema', () => {
  it('accepts an optional reason', () => {
    expect(RefundOrderSchema.parse({ reason: 'duplicate charge' })).toEqual({
      reason: 'duplicate charge',
    });
    expect(RefundOrderSchema.parse({})).toEqual({});
  });

  it('rejects reasons longer than 255 chars', () => {
    expect(() => RefundOrderSchema.parse({ reason: 'x'.repeat(256) })).toThrow();
  });
});
