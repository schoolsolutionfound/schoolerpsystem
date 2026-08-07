import { z } from 'zod';

export const ROLES = ['admin', 'teacher', 'student', 'principal', 'parent', 'accountant', 'hod', 'librarian'] as const;

export const CreateAdminSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  institutionCode: z.string().min(1, 'Please select an institution'),
  role: z.enum(ROLES).optional(),
  title: z.string().optional(),
  scope: z
    .object({
      departments: z.array(z.string()).optional(),
      academicYears: z.array(z.string()).optional(),
    })
    .optional(),
  permissions: z.array(z.string()).optional(),
});

export const UpdateAdminSchema = CreateAdminSchema.partial();

export type CreateAdminSchemaType = z.infer<typeof CreateAdminSchema>;
export type UpdateAdminSchemaType = z.infer<typeof UpdateAdminSchema>;
