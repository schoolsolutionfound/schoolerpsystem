import { z } from 'zod';

const urlOrEmpty = z.string().url().or(z.literal('')).optional().default('');
const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/; // Date or ISO DateTime

// Admin endpoints
export const AssignMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  accessLevel: z.enum(['head', 'member']).default('member'),
});
export type AssignMemberInput = z.infer<typeof AssignMemberSchema>;

// Student Profile endpoints
export const UpdateProfileSchema = z.object({
  phone: z.string().max(20).optional().default(''),
  photoUrl: urlOrEmpty,
  resumeUrl: urlOrEmpty,
  portfolioUrl: urlOrEmpty,
  linkedinUrl: urlOrEmpty,
  githubUrl: urlOrEmpty,
  leetcodeUrl: urlOrEmpty,
  cgpa: z
    .union([z.number(), z.string()])
    .transform((val) => (val === '' || val === null ? null : typeof val === 'string' ? parseFloat(val) : val))
    .optional()
    .nullable(),
  activeBacklogs: z
    .union([z.number(), z.string()])
    .transform((val) => (val === '' || val === null ? 0 : typeof val === 'string' ? parseInt(val, 10) : val))
    .optional()
    .default(0),
  tenthPercent: z
    .union([z.number(), z.string()])
    .transform((val) => (val === '' || val === null ? null : typeof val === 'string' ? parseFloat(val) : val))
    .optional()
    .nullable(),
  twelfthOrDiplomaPercent: z
    .union([z.number(), z.string()])
    .transform((val) => (val === '' || val === null ? null : typeof val === 'string' ? parseFloat(val) : val))
    .optional()
    .nullable(),
  otherLinks: z
    .array(
      z.object({
        name: z.string().min(1),
        url: z.string().url(),
      })
    )
    .optional()
    .default([]),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

// Drive CRUD endpoints
export const DRIVE_STATUSES = ['draft', 'published', 'closed'] as const;

export const CreateDriveSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  logoUrl: urlOrEmpty,
  bannerUrl: urlOrEmpty,
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().default(''),
  jobType: z.enum(['full_time', 'internship', 'part_time']).optional().default('full_time'),
  ctcOrStipend: z.string().max(100).optional().default(''),
  location: z.string().max(200).optional().default(''),
  rounds: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
  allowedBranches: z.array(z.string()).optional().default([]),
  allowedYears: z.array(z.string()).optional().default([]),
  minCgpa: z.number().min(0).max(10).optional(),
  maxBacklogs: z.number().int().min(0).optional(),
  applyDeadline: z.string().regex(dateRegex, 'applyDeadline must be a valid date or ISO string'),
  status: z.enum(DRIVE_STATUSES).optional().default('draft'),
});
export type CreateDriveInput = z.infer<typeof CreateDriveSchema>;

export const UpdateDriveSchema = CreateDriveSchema.partial().extend({
  status: z.enum(DRIVE_STATUSES).optional(),
});
export type UpdateDriveInput = z.infer<typeof UpdateDriveSchema>;

// Applications
export const ApplyDriveSchema = z.object({
  resumeUrl: urlOrEmpty,
});
export type ApplyDriveInput = z.infer<typeof ApplyDriveSchema>;

export const UpdateApplicationStatusSchema = z.object({
  status: z.enum(['applied', 'shortlisted', 'rejected', 'hired', 'withdrawn']),
  currentRoundIndex: z.number().int().nonnegative().optional(),
});
export type UpdateApplicationStatusInput = z.infer<typeof UpdateApplicationStatusSchema>;

