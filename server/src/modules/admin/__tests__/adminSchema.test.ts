import { describe, it, expect } from 'vitest';
import {
  CreateFeeSchema,
  CreateFeePaymentSchema,
  UpdateFeeSchema,
  UpdateFeePaymentSchema,
} from '../admin.schema.js';

describe('CreateFeeSchema', () => {
  it('accepts a valid fee payload', () => {
    const result = CreateFeeSchema.safeParse({
      title: 'Term 1 Tuition',
      amount: 15000,
      category: 'student_fee',
      status: 'active',
      dueDate: '2026-10-15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = CreateFeeSchema.safeParse({ amount: 100 });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive amount', () => {
    expect(CreateFeeSchema.safeParse({ title: 'T', amount: 0 }).success).toBe(false);
    expect(CreateFeeSchema.safeParse({ title: 'T', amount: -5 }).success).toBe(false);
  });

  it('rejects invalid dueDate format', () => {
    expect(
      CreateFeeSchema.safeParse({ title: 'T', amount: 100, dueDate: '15-10-2026' }).success
    ).toBe(false);
  });

  it('rejects invalid status enum', () => {
    expect(
      CreateFeeSchema.safeParse({ title: 'T', amount: 100, status: 'weird' }).success
    ).toBe(false);
  });

  it('coerces numeric strings for amount', () => {
    const result = CreateFeeSchema.safeParse({ title: 'T', amount: '123.45' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBeCloseTo(123.45);
  });
});

describe('CreateFeePaymentSchema', () => {
  it('accepts a valid payment payload', () => {
    const result = CreateFeePaymentSchema.safeParse({
      feeStructureId: 'fs_1',
      studentId: 'usr_1',
      amount: 5000,
      paymentMethod: 'upi',
      status: 'paid',
      paymentDate: '2026-09-20',
    });
    expect(result.success).toBe(true);
  });

  it('requires feeStructureId and studentId', () => {
    expect(CreateFeePaymentSchema.safeParse({ amount: 100 }).success).toBe(false);
    expect(
      CreateFeePaymentSchema.safeParse({ feeStructureId: 'fs_1', amount: 100 }).success
    ).toBe(false);
  });

  it('rejects invalid paymentMethod', () => {
    const result = CreateFeePaymentSchema.safeParse({
      feeStructureId: 'fs_1',
      studentId: 'usr_1',
      amount: 100,
      paymentMethod: 'bitcoin',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = CreateFeePaymentSchema.safeParse({
      feeStructureId: 'fs_1',
      studentId: 'usr_1',
      amount: 100,
      status: 'maybe',
    });
    expect(result.success).toBe(false);
  });
});

describe('Update schemas (partial)', () => {
  it('UpdateFeeSchema allows partial payloads', () => {
    expect(UpdateFeeSchema.safeParse({ title: 'New Title' }).success).toBe(true);
    expect(UpdateFeeSchema.safeParse({}).success).toBe(true);
    expect(UpdateFeeSchema.safeParse({ amount: -1 }).success).toBe(false);
  });

  it('UpdateFeePaymentSchema allows partial payloads', () => {
    expect(UpdateFeePaymentSchema.safeParse({ status: 'paid' }).success).toBe(true);
    expect(UpdateFeePaymentSchema.safeParse({ amount: 0 }).success).toBe(false);
  });
});
