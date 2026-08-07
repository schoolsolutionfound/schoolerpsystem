import { z } from 'zod';

export const ChangePasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
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
