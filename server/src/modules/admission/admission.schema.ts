import { z } from 'zod';

export const QuotaItemSchema = z.object({
  quotaName: z.string().min(1, 'Quota name is required'),
  seats: z.number().int().min(0, 'Seats must be >= 0'),
});

export const CreateCourseSchema = z.object({
  academicYear: z.string().min(1, 'Academic year / batch is required'),
  courseCode: z.string().min(1, 'Course code is required').max(50),
  courseName: z.string().min(1, 'Course name is required').max(200),
  programType: z.enum(['school', 'pu', 'engineering', 'degree']).default('engineering'),
  totalSeats: z.number().int().min(1, 'Total seats must be at least 1'),
  quotas: z.array(QuotaItemSchema).default([]),
});
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;

export const UpdateCourseSchema = CreateCourseSchema.partial();
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;

export const CreateApplicationSchema = z.object({
  academicYear: z.string().min(1, 'Academic year / batch is required'),
  fullName: z.string().min(1, 'Full name is required').max(200),
  parentPhone: z.string().min(5, 'Parent phone is required').max(20),
  dob: z.string().optional().default(''),
  fatherName: z.string().optional().default(''),
  motherName: z.string().optional().default(''),
  guardianPhone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  bloodGroup: z.string().optional().default(''),
  programType: z.string().optional().default('engineering'),
  preferredCourseId: z.string().optional().nullable(),
  preferredCourseName: z.string().optional().default(''),
  customFields: z.record(z.any()).optional().default({}),
  notes: z.string().optional().default(''),
});
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;

export const UpdateApplicationSchema = CreateApplicationSchema.partial();
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;

export const AllocateSeatSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  quota: z.string().min(1, 'Quota name is required'),
  notes: z.string().optional().default(''),
});
export type AllocateSeatInput = z.infer<typeof AllocateSeatSchema>;

export const UpdateStatusSchema = z.object({
  status: z.enum(['waiting_list', 'allocated', 'confirmed', 'cancelled']),
  notes: z.string().optional().default(''),
});
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

export const FormConfigSchema = z.object({
  programType: z.enum(['school', 'pu', 'engineering', 'degree', 'all']).default('all'),
  fieldKey: z.string().min(1, 'Field key is required'),
  label: z.string().min(1, 'Label is required'),
  fieldType: z.enum(['text', 'number', 'date', 'select', 'boolean', 'textarea']).default('text'),
  options: z.array(z.string()).optional().default([]),
  placeholder: z.string().optional().default(''),
  isRequired: z.boolean().optional().default(false),
  order: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});
export type FormConfigInput = z.infer<typeof FormConfigSchema>;
