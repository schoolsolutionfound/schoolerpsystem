/**
 * Settings → Form Fields: per-role dynamic profile fields configured by the
 * institution admin. Mirrors server/src/modules/admin/profileFields.schema.ts.
 * The 5 account basics (First Name, Last Name, Email, Phone Number, Password)
 * are always collected at creation and are NOT part of this config.
 */
export const PROFILE_FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Yes / No' },
  { value: 'document', label: 'Document Upload' },
] as const;

export type ProfileFieldType = (typeof PROFILE_FIELD_TYPES)[number]['value'];

export interface ProfileFormField {
  id: string;
  label: string;
  type: ProfileFieldType;
  required: boolean;
  editable: boolean;
  options?: string[];
  placeholder?: string;
}

export interface CustomFieldValueDocument {
  name: string;
  url: string;
}

export type CustomFieldValues = Record<string, string | boolean | CustomFieldValueDocument | null>;

/** Roles whose fields can be configured in Settings (admin/dev excluded). */
export const CONFIGURABLE_ROLES = [
  { key: 'student', label: 'Student', icon: 'account-school-outline' },
  { key: 'teacher', label: 'Teacher', icon: 'human-male-board' },
  { key: 'parent', label: 'Parent', icon: 'account-multiple-outline' },
  { key: 'principal', label: 'Principal', icon: 'account-tie-outline' },
  { key: 'hod', label: 'HOD', icon: 'head-cog-outline' },
  { key: 'accountant', label: 'Accountant', icon: 'calculator' },
  { key: 'librarian', label: 'Librarian', icon: 'bookshelf' },
  { key: 'driver', label: 'Driver', icon: 'bus-school' },
  { key: 'admission_officer', label: 'Admission Officer', icon: 'card-account-details-outline' },
] as const;

export type ConfigurableRoleKey = (typeof CONFIGURABLE_ROLES)[number]['key'];

export function newFieldId(): string {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function fieldLabelForType(type: ProfileFieldType): string {
  return PROFILE_FIELD_TYPES.find((t) => t.value === type)?.label || type;
}

function isEmptyValue(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'boolean') return value === false;
  if (typeof value === 'object') {
    return !String((value as CustomFieldValueDocument).url || '').trim();
  }
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{7,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Client-side mirror of the server's validateCustomFields — returns the first
 * validation error for the given fields, or null when everything is valid.
 */
export function validateDynamicFields(
  fields: ProfileFormField[],
  values: CustomFieldValues
): string | null {
  for (const field of fields) {
    const value = values[field.id];

    if (field.type === 'checkbox') {
      // Mirrors the server: a required yes/no must be ticked.
      if (field.required && value !== true) return `"${field.label}" must be ticked.`;
      continue;
    }

    if (field.type === 'document') {
      if (field.required && isEmptyValue(value)) return `"${field.label}" is required.`;
      continue;
    }

    const str = typeof value === 'string' ? value.trim() : '';

    if (field.required && str === '') return `"${field.label}" is required.`;

    if (str === '') continue;

    switch (field.type) {
      case 'number':
        if (Number.isNaN(Number(str))) return `"${field.label}" must be a valid number.`;
        break;
      case 'email':
        if (!EMAIL_RE.test(str)) return `"${field.label}" must be a valid email address.`;
        break;
      case 'phone':
        if (!PHONE_RE.test(str)) return `"${field.label}" must be a valid phone number (7-20 digits).`;
        break;
      case 'date':
        if (!DATE_RE.test(str)) return `"${field.label}" must be a valid date.`;
        break;
      case 'dropdown':
        if (field.options && !field.options.includes(str)) return `"${field.label}" has an invalid selection.`;
        break;
      default:
        break;
    }
  }
  return null;
}
