import { z } from 'zod';
export { institutions, InstitutionRecord, NewInstitutionRecord } from '../shared/db/schema.js';

export const CreateInstitutionSchema = z.object({
  institutionCode: z.string().min(1, 'Institution code is required'),
  institutionName: z.string().min(1, 'Institution name is required'),
  institutionType: z.enum(['school', 'college']).default('college'),
  subscriptionStatus: z.enum(['active', 'inactive', 'suspended', 'trial']).default('active'),
});

export const UpdateInstitutionSchema = z.object({
  institutionName: z.string().min(1, 'Institution name cannot be empty').optional(),
  institutionType: z.enum(['school', 'college']).optional(),
  subscriptionStatus: z.enum(['active', 'inactive', 'suspended', 'trial']).optional(),
});

export type CreateInstitutionInput = z.infer<typeof CreateInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof UpdateInstitutionSchema>;
