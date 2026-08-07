import { z } from 'zod';

const stringArray = z.array(z.string().max(200)).max(100);

export const CreateInstitutionZodSchema = z.object({
  institutionCode: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code cannot exceed 50 characters')
    .toUpperCase(),
  institutionName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(150, 'Name cannot exceed 150 characters'),
  institutionType: z.enum(['school', 'college']),
  subscriptionStatus: z.enum(['active', 'inactive', 'suspended', 'trial']),
  departments: stringArray.optional(),
  academicYears: stringArray.optional(),
  courses: stringArray.optional(),
});

export const UpdateInstitutionZodSchema = z.object({
  institutionName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(150, 'Name cannot exceed 150 characters'),
  institutionType: z.enum(['school', 'college']),
  subscriptionStatus: z.enum(['active', 'inactive', 'suspended', 'trial']),
  departments: stringArray.optional(),
  academicYears: stringArray.optional(),
  courses: stringArray.optional(),
});

export type CreateInstitutionFormValues = z.infer<typeof CreateInstitutionZodSchema>;
export type UpdateInstitutionFormValues = z.infer<typeof UpdateInstitutionZodSchema>;
