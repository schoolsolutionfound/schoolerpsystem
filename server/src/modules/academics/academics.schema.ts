import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const CreateClassSectionSchema = z.object({
  name: z.string().min(1, 'Class/section name is required').max(200),
  department: z.string().max(200).optional().default(''),
  academicYear: z.string().max(100).optional().default(''),
  section: z.string().max(50).optional().default(''),
  classTeacherId: z.string().max(100).optional().default(''),
});

export const UpdateClassSectionSchema = CreateClassSectionSchema.partial();

export const CreateSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(200),
  code: z.string().max(50).optional().default(''),
});

export const CreateSubjectTeacherSchema = z.object({
  classSectionId: z.string().min(1, 'classSectionId is required').max(100),
  subjectId: z.string().min(1, 'subjectId is required').max(100),
  teacherId: z.string().min(1, 'teacherId is required').max(100),
});

export const CreatePeriodSchema = z.object({
  label: z.string().min(1, 'Period label is required').max(100),
  startTime: z.string().regex(timeRegex, 'startTime must be in HH:MM 24h format'),
  endTime: z.string().regex(timeRegex, 'endTime must be in HH:MM 24h format'),
  sortOrder: z.number().int().min(0).max(100).optional().default(0),
});

export const UpdateInstitutionTermsSchema = z.object({
  academicYear: z.string().min(1, 'Academic year is required').max(100),
  terms: z.array(z.string().min(1).max(100)).max(12, 'At most 12 terms per academic year'),
});

export const UpdateHolidayCalendarSchema = z.object({
  blockedDates: z
    .array(
      z.object({
        date: z.string().regex(dateRegex, 'date must be in YYYY-MM-DD format'),
        reason: z.string().max(200).default(''),
      })
    )
    .max(365, 'At most 365 blocked dates'),
});

export type CreateClassSectionInput = z.infer<typeof CreateClassSectionSchema>;
export type UpdateClassSectionInput = z.infer<typeof UpdateClassSectionSchema>;
export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>;
export type CreateSubjectTeacherInput = z.infer<typeof CreateSubjectTeacherSchema>;
export type CreatePeriodInput = z.infer<typeof CreatePeriodSchema>;
export type UpdateInstitutionTermsInput = z.infer<typeof UpdateInstitutionTermsSchema>;
export type UpdateHolidayCalendarInput = z.infer<typeof UpdateHolidayCalendarSchema>;
