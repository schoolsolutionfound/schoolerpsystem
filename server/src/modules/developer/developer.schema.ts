import { z } from 'zod';

export const ADMIN_ROLES = [
  'admin',
  'teacher',
  'student',
  'principal',
  'parent',
  'accountant',
  'hod',
  'librarian',
  'driver',
  'admission_officer',
  'placement_officer',
] as const;

export const adminRoleEnum = z.enum(ADMIN_ROLES);

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be at most 100 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a digit');

const scopeSchema = z
  .object({
    departments: z.array(z.string().trim().max(100)).max(100).optional(),
    academicYears: z.array(z.string().trim().max(100)).max(100).optional(),
  })
  .optional();

// Must match PATCH /users/me phone regex.
const phoneSchema = z
  .string()
  .trim()
  .max(20)
  .refine((v) => v === '' || /^\+?[\d\s-]{7,20}$/.test(v), {
    message: 'Phone number must be 7-20 digits (may include +, spaces or dashes)',
  })
  .optional();

export const CreateAdminSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  phone: phoneSchema,
  password: passwordSchema,
  institutionCode: z.string().trim().min(1, 'Institution code is required').max(50),
  // Required: omitting the role used to silently create an ADMIN (the
  // most-privileged role) via the service-level `payload.role || 'admin'` default.
  role: adminRoleEnum,
  title: z.string().trim().max(100).optional(),
  scope: scopeSchema,
  permissions: z.array(z.string().trim().max(100)).max(100).optional(),
});

export const UpdateAdminSchema = z.object({
  fullName: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email('Invalid email address').max(255).optional(),
  phone: phoneSchema,
  institutionCode: z.string().trim().min(1).max(50).optional(),
  role: adminRoleEnum.optional(),
  title: z.string().trim().max(100).optional(),
  scope: scopeSchema,
  permissions: z.array(z.string().trim().max(100)).max(100).optional(),
});

export const ResetAdminPasswordSchema = z.object({
  password: passwordSchema,
});

export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;
export type UpdateAdminInput = z.infer<typeof UpdateAdminSchema>;
export type ResetAdminPasswordInput = z.infer<typeof ResetAdminPasswordSchema>;
