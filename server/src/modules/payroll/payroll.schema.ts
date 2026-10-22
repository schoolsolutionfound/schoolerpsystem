/**
 * @file payroll.schema.ts
 * @description Zod request schemas for the Payroll module (recurring staff salary).
 */

import { z } from 'zod';

export const PaymentMethodSchema = z.enum(['upi', 'cash', 'card', 'bank_transfer', 'cheque']);
export const PayrollFrequencySchema = z.enum(['monthly', 'weekly', 'daily', 'days_of_month']);

export const CreatePayrollScheduleSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(200),
  amount: z.number().positive().max(100_000_000),
  frequency: PayrollFrequencySchema,
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  daysOfMonth: z.array(z.number().int().min(1).max(31)).min(1).max(31).optional(),
  weekday: z.number().int().min(0).max(6).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
});

export const UpdatePayrollScheduleSchema = z.object({
  amount: z.number().positive().max(100_000_000).optional(),
  frequency: PayrollFrequencySchema.optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  daysOfMonth: z.array(z.number().int().min(1).max(31)).min(1).max(31).optional(),
  weekday: z.number().int().min(0).max(6).nullable().optional(),
  active: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const PayScheduleSchema = z.object({
  amount: z.number().positive().max(100_000_000),
  paymentMethod: PaymentMethodSchema,
  reference: z.string().max(120).optional(),
});

export const AddBonusSchema = z.object({
  amount: z.number().positive().max(100_000_000),
  note: z.string().min(1).max(200),
  paymentMethod: PaymentMethodSchema,
});

export type CreatePayrollScheduleInput = z.infer<typeof CreatePayrollScheduleSchema>;
export type UpdatePayrollScheduleInput = z.infer<typeof UpdatePayrollScheduleSchema>;
export type PayScheduleInput = z.infer<typeof PayScheduleSchema>;
export type AddBonusInput = z.infer<typeof AddBonusSchema>;
