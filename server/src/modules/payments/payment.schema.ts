import { z } from 'zod';

/** Client-submitted checkout: ONLY fee line ids — never amounts, never tenant, never student. */
export const CreateOrderSchema = z.object({
  feeStructureIds: z
    .array(z.string().min(1).max(100))
    .min(1, 'Select at least one fee to pay.')
    .max(50, 'Too many fee lines in one payment.'),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

/** Admin/tenant payment credential management (secrets encrypted server-side).
 *  Secrets are write-only: omitted fields KEEP the stored value, so an admin can
 *  rotate the webhook secret without re-typing the key secret (never echoed back). */
export const UpdatePaymentConfigSchema = z.object({
  gateway: z.enum(['razorpay']).default('razorpay'),
  keyId: z.string().min(4).max(255),
  keySecret: z.string().min(4).max(512).optional(),
  webhookSecret: z.string().min(4).max(512).optional(),
  isActive: z.boolean().default(true),
});

export type UpdatePaymentConfigInput = z.infer<typeof UpdatePaymentConfigSchema>;

/** Refund of a captured order. Omit `amountPaise` to refund the remaining
 *  refundable balance in full; supply it for a partial refund. The service
 *  validates it against the order total minus everything already refunded, so
 *  partial refunds accumulate and can never exceed the captured amount. */
export const RefundOrderSchema = z.object({
  reason: z.string().max(255).optional(),
  amountPaise: z
    .number()
    .int('Refund amount must be a whole number of paise.')
    .positive('Refund amount must be greater than zero.')
    .optional(),
});

export type RefundOrderInput = z.infer<typeof RefundOrderSchema>;

const dateLike = /^\d{4}-\d{2}-\d{2}$/;

/** Accountant reconciliation list filters. */
export const ListOrdersQuerySchema = z.object({
  status: z
    .enum(['created', 'authorized', 'paid', 'failed', 'expired', 'cancelled', 'refunded', 'partially_refunded'])
    .optional(),
  studentId: z.string().min(1).max(100).optional(),
  from: z.string().regex(dateLike).optional(),
  to: z.string().regex(dateLike).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListOrdersQuery = z.infer<typeof ListOrdersQuerySchema>;
