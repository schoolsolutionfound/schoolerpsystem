import { z } from 'zod';
export { institutions, InstitutionRecord, NewInstitutionRecord } from '../shared/db/schema.js';

const stringArray = z.array(z.string().trim().min(1).max(200)).max(100).default([]);
const optionalStringArray = z.array(z.string().trim().min(1).max(200)).max(100).optional();
const sectionArray = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .max(50)
      .regex(/^[A-Za-z0-9][A-Za-z0-9 -]*$/, 'Section must be letters/numbers (e.g. A, B, Section A)')
  )
  .max(50)
  .default([]);

const termEntrySchema = z.object({
  academicYear: z.string().min(1).max(100),
  terms: z.array(z.string().max(100)).max(12),
});

const blockedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  reason: z.string().max(200).default(''),
});

/**
 * Structure input accepts BOTH canonical names (`subjects`/`classes`/
 * `programs`) and the legacy storage-shaped names (`departments`/
 * `academicYears`/`courses`). The service normalizes whichever is supplied.
 * `institutionType` is deliberately required — no silent 'college' default.
 */
export const CreateInstitutionSchema = z
  .object({
    institutionCode: z.string().min(1, 'Institution code is required').max(50),
    institutionName: z.string().min(1, 'Institution name is required').max(200),
    institutionType: z.enum(['school', 'college']),
    subscriptionStatus: z.enum(['active', 'inactive', 'suspended', 'trial']).default('active'),
    subjects: optionalStringArray,
    classes: optionalStringArray,
    programs: optionalStringArray,
    departments: stringArray,
    academicYears: stringArray,
    yearsOfStudy: stringArray,
    courses: stringArray,
    sections: sectionArray,
    terms: z.array(termEntrySchema).max(20).default([]),
    blockedDates: z.array(blockedDateSchema).max(365).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.institutionType !== 'school') return;
    const programs = value.programs ?? value.courses ?? [];
    if (programs.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['programs'],
        message: 'Schools cannot have programs/courses. Use classes and sections instead.',
      });
    }
    if ((value.yearsOfStudy ?? []).length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['yearsOfStudy'],
        message: 'Schools cannot have years of study. Use classes and sections instead.',
      });
    }
  });

export const UpdateInstitutionSchema = z
  .object({
    institutionName: z.string().min(1, 'Institution name cannot be empty').max(200).optional(),
    institutionType: z.enum(['school', 'college']).optional(),
    subscriptionStatus: z.enum(['active', 'inactive', 'suspended', 'trial']).optional(),
    subjects: optionalStringArray,
    classes: optionalStringArray,
    programs: optionalStringArray,
    departments: stringArray.optional(),
    academicYears: stringArray.optional(),
    yearsOfStudy: stringArray.optional(),
    courses: stringArray.optional(),
    sections: sectionArray.optional(),
    terms: z.array(termEntrySchema).max(20).optional(),
    blockedDates: z.array(blockedDateSchema).max(365).optional(),
    /**
     * Explicit opt-in for a school <-> college conversion. Without it the
     * service refuses to change type once users/classes/subjects exist.
     */
    convert: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.institutionType !== 'school') return;
    const programs = value.programs ?? value.courses ?? [];
    if (programs.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['programs'],
        message: 'Schools cannot have programs/courses. Use classes and sections instead.',
      });
    }
    if ((value.yearsOfStudy ?? []).length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['yearsOfStudy'],
        message: 'Schools cannot have years of study. Use classes and sections instead.',
      });
    }
  });

export type CreateInstitutionInput = z.infer<typeof CreateInstitutionSchema>;
export type UpdateInstitutionInput = z.infer<typeof UpdateInstitutionSchema>;
