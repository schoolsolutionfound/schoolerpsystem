import { z } from 'zod';

/**
 * Per-role profile form fields, configured by the institution admin from
 * Settings → Form Fields. The 5 account basics (First Name, Last Name, Email,
 * Phone Number, Password) are always collected at creation and are NOT
 * configurable here.
 */
export const PROFILE_FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'phone',
  'email',
  'date',
  'dropdown',
  'checkbox',
  'document',
] as const;

export type ProfileFieldType = (typeof PROFILE_FIELD_TYPES)[number];

export const CONFIGURABLE_ROLES = [
  'student',
  'teacher',
  'parent',
  'principal',
  'accountant',
  'hod',
  'librarian',
  'driver',
  'admission_officer',
] as const;

export type ConfigurableRole = (typeof CONFIGURABLE_ROLES)[number];

export const ProfileFormFieldSchema = z
  .object({
    id: z.string().trim().min(1).max(64),
    label: z.string().trim().min(1, 'Field name is required').max(80, 'Field name must be at most 80 characters'),
    type: z.enum(PROFILE_FIELD_TYPES),
    required: z.boolean().default(false),
    editable: z.boolean().default(true),
    options: z.array(z.string().trim().min(1).max(100)).min(1).max(50).optional(),
    placeholder: z.string().trim().max(120).optional(),
  })
  .superRefine((field, ctx) => {
    if (field.type === 'dropdown' && (!field.options || field.options.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['options'],
        message: 'Dropdown fields need at least one option',
      });
    }
  });

/** Strips options from non-dropdown fields so stored JSON stays clean. */
export function normalizeProfileFormField(field: ProfileFormField): ProfileFormField {
  if (field.type !== 'dropdown' && field.options) {
    const { options: _options, ...rest } = field;
    return rest;
  }
  return field;
}

export const RoleProfileFieldsSchema = z.array(ProfileFormFieldSchema).max(50, 'A role can have at most 50 fields');

export const ProfileFieldsMapSchema = z
  .object(
    Object.fromEntries(CONFIGURABLE_ROLES.map((role) => [role, RoleProfileFieldsSchema.optional()])) as Record<
      ConfigurableRole,
      z.ZodOptional<z.ZodArray<typeof ProfileFormFieldSchema>>
    >
  )
  .strict();

export type ProfileFormField = z.infer<typeof ProfileFormFieldSchema>;
export type RoleProfileFieldsInput = z.infer<typeof RoleProfileFieldsSchema>;
export type ProfileFieldsMap = Partial<Record<ConfigurableRole, ProfileFormField[]>>;

export function isConfigurableRole(role: string | undefined): role is ConfigurableRole {
  const normalized = (role || '').toLowerCase().trim();
  return (CONFIGURABLE_ROLES as readonly string[]).includes(normalized);
}
