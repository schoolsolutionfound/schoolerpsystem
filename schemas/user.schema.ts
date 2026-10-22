import { z } from 'zod';

// Must match server shared/utils/password.ts (min 8 + upper/lower/digit).
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be at most 100 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a digit');

export const ChangePasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string().min(8, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const CompleteProfileSchema = z.object({
  phone: z.string().optional(),
  parentPhone: z.string().min(10, 'Valid 10-digit parent phone number is required'),
  profilePicUrl: z.string().optional(),
  institutionType: z.enum(['school', 'college']),
  tenthPercentage: z.string().optional(),
  twelfthPercentage: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.institutionType === 'college') {
    if (data.tenthPercentage && (isNaN(Number(data.tenthPercentage)) || Number(data.tenthPercentage) < 0 || Number(data.tenthPercentage) > 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '10th percentage must be a valid number between 0 and 100',
        path: ['tenthPercentage'],
      });
    }
    if (data.twelfthPercentage && (isNaN(Number(data.twelfthPercentage)) || Number(data.twelfthPercentage) < 0 || Number(data.twelfthPercentage) > 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '12th percentage must be a valid number between 0 and 100',
        path: ['twelfthPercentage'],
      });
    }
  }
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type CompleteProfileInput = z.infer<typeof CompleteProfileSchema>;
