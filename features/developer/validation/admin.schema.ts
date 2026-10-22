import { z } from 'zod';

// Must match server developer.schema.ts ADMIN_ROLES exactly.
export const ROLES = ['admin', 'teacher', 'student', 'principal', 'parent', 'accountant', 'hod', 'librarian', 'driver', 'admission_officer'] as const;

// Must match server passwordSchema (min 8 + upper/lower/digit).
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be at most 100 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a digit');

// Must match server phone regex (same as PATCH /users/me).
const phoneSchema = z
  .string()
  .trim()
  .max(20)
  .refine((v) => v === '' || /^\+?[\d\s-]{7,20}$/.test(v), {
    error: 'Please enter a valid phone number (7-20 digits)',
  })
  .optional();

export const CreateAdminSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: passwordSchema,
  institutionCode: z.string().min(1, 'Please select an institution'),
  role: z.enum(ROLES, { error: 'Role is required' }),
  title: z.string().optional(),
  phone: phoneSchema,
  scope: z
    .object({
      departments: z.array(z.string()).optional(),
      academicYears: z.array(z.string()).optional(),
    })
    .optional(),
  permissions: z.array(z.string()).optional(),
});

export const UpdateAdminSchema = CreateAdminSchema.partial().extend({
  // Password only validated when present on update.
  password: passwordSchema.optional(),
});

export type CreateAdminSchemaType = z.infer<typeof CreateAdminSchema>;
export type UpdateAdminSchemaType = z.infer<typeof UpdateAdminSchema>;
