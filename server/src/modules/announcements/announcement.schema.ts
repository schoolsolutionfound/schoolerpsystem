import { z } from 'zod';

export const AnnouncementTypes = ['GENERAL', 'ACADEMIC', 'EVENT', 'URGENT', 'NOTICE'] as const;
export const AnnouncementPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const;
export const AnnouncementStatuses = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'EXPIRED', 'CANCELLED'] as const;
export const TargetTypes = ['all', 'role', 'class', 'section'] as const;
export const CreateActions = ['draft', 'publish', 'schedule'] as const;

export const TargetInputSchema = z.object({
  targetType: z.enum(TargetTypes).optional().default('all'),
  targetRole: z.string().optional().default(''),
  classId: z.string().optional().default(''),
  sectionId: z.string().optional().default(''),
});

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(AnnouncementTypes).optional().default('GENERAL'),
  priority: z.enum(AnnouncementPriorities).optional().default('NORMAL'),
  action: z.enum(CreateActions).optional().default('publish'),
  publishAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  imageUrl: z.string().optional().default(''),
  attachmentUrl: z.string().optional().default(''),
  targets: z.array(TargetInputSchema).optional().default([{ targetType: 'all', targetRole: '' }]),
});

export const UpdateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(300).optional(),
  content: z.string().min(1, 'Content cannot be empty').optional(),
  type: z.enum(AnnouncementTypes).optional(),
  priority: z.enum(AnnouncementPriorities).optional(),
  action: z.enum(CreateActions).optional(),
  publishAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  imageUrl: z.string().optional(),
  attachmentUrl: z.string().optional(),
  targets: z.array(TargetInputSchema).optional(),
});

export const AnnouncementQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(AnnouncementStatuses).optional(),
  type: z.enum(AnnouncementTypes).optional(),
  priority: z.enum(AnnouncementPriorities).optional(),
  audience: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof UpdateAnnouncementSchema>;
export type AnnouncementQueryInput = z.infer<typeof AnnouncementQuerySchema>;
export type TargetInput = z.infer<typeof TargetInputSchema>;
