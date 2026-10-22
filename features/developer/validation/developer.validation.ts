import { z } from 'zod';

const stringArray = z.array(z.string().max(200)).max(100);
const sectionsArray = z.array(z.string().trim().max(50)).max(50);
const termsArray = z
  .array(
    z.object({
      academicYear: z.string().trim().min(1).max(100),
      terms: z.array(z.string().trim().max(100)).max(12),
    })
  )
  .max(20);

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
  yearsOfStudy: stringArray.optional(),
  courses: stringArray.optional(),
  subjects: stringArray.optional(),
  classes: stringArray.optional(),
  programs: stringArray.optional(),
  sections: sectionsArray.optional(),
  terms: termsArray.optional(),
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
  yearsOfStudy: stringArray.optional(),
  courses: stringArray.optional(),
  subjects: stringArray.optional(),
  classes: stringArray.optional(),
  programs: stringArray.optional(),
  sections: sectionsArray.optional(),
  terms: termsArray.optional(),
  convert: z.boolean().optional(),
});

export type CreateInstitutionFormValues = z.infer<typeof CreateInstitutionZodSchema>;
export type UpdateInstitutionFormValues = z.infer<typeof UpdateInstitutionZodSchema>;
