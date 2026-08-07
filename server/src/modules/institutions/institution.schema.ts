import { z } from 'zod';
export { institutions, InstitutionRecord, NewInstitutionRecord } from '../shared/db/schema.js';

const stringArray = z.array(z.string().max(200)).max(100).default([]);

export const CreateInstitutionSchema = z.object({
  institutionCode: z.string().min(1, 'Institution code is required').max(50),
  institutionName: z.string().min(1, 'Institution name is required').max(200),
  institutionType: z.enum(['school', 'college']).default('college'),
  subscriptionStatus: z.enum(['active', 'inactive', 'suspended', 'trial']).default('active'),
  departments: stringArray,
  academicYears: stringArray,
  courses: stringArray,
});

export const UpdateInstitutionSchema = z.object({
  institutionName: z.string().min(1, 'Institution name cannot be empty').max(200).optional(),
  institutionType: z.enum(['school', 'college']).optional(),
  subscriptionStatus: z.enum(['active', 'inactive', 'suspended', 'trial']).optional(),
  departments: stringArray.optional(),
  academicYears: stringArray.optional(),
  courses: stringArray.optional(),
});

export type CreateInstitutionInput = z.infer<typeof CreateInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof UpdateInstitutionSchema>;
