import { z } from 'zod';
export { institutions, InstitutionRecord, NewInstitutionRecord } from '../shared/db/schema.js';

const stringArray = z.array(z.string().max(200)).max(100).default([]);

const termEntrySchema = z.object({
  academicYear: z.string().min(1).max(100),
  terms: z.array(z.string().max(100)).max(12),
});

const blockedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  reason: z.string().max(200).default(''),
});

export const CreateInstitutionSchema = z.object({
  institutionCode: z.string().min(1, 'Institution code is required').max(50),
  institutionName: z.string().min(1, 'Institution name is required').max(200),
  institutionType: z.enum(['school', 'college']).default('college'),
  subscriptionStatus: z.enum(['active', 'inactive', 'suspended', 'trial']).default('active'),
  departments: stringArray,
  academicYears: stringArray,
  courses: stringArray,
  terms: z.array(termEntrySchema).max(20).default([]),
  blockedDates: z.array(blockedDateSchema).max(365).default([]),
});

export const UpdateInstitutionSchema = z.object({
  institutionName: z.string().min(1, 'Institution name cannot be empty').max(200).optional(),
  institutionType: z.enum(['school', 'college']).optional(),
  subscriptionStatus: z.enum(['active', 'inactive', 'suspended', 'trial']).optional(),
  departments: stringArray.optional(),
  academicYears: stringArray.optional(),
  courses: stringArray.optional(),
  terms: z.array(termEntrySchema).max(20).optional(),
  blockedDates: z.array(blockedDateSchema).max(365).optional(),
});

export type CreateInstitutionInput = z.infer<typeof CreateInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof UpdateInstitutionSchema>;
