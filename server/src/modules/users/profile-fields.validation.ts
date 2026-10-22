import type { ProfileFormField } from '../admin/profileFields.schema.js';

export type CustomFieldValues = Record<string, any>;

export type CustomFieldValidation =
  | { ok: true; values: CustomFieldValues }
  | { ok: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s-]{7,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isEmptyValue(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'boolean') return value === false;
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.length === 0;
    return !String((value as any).url || '').trim();
  }
  return false;
}

/**
 * Validates + normalizes submitted custom profile-field values against the
 * institution's configured fields for the user's role.
 *
 * - Unknown field ids are ignored (client config may be stale).
 * - When `onlyEditable` is set (self-service profile edit), non-editable
 *   fields are dropped from the result instead of erroring.
 */
export function validateCustomFields(
  fields: ProfileFormField[],
  rawValues: unknown,
  opts: { onlyEditable?: boolean } = {}
): CustomFieldValidation {
  if (rawValues === null || rawValues === undefined) {
    return { ok: true, values: {} };
  }
  if (typeof rawValues !== 'object' || Array.isArray(rawValues)) {
    return { ok: false, message: 'customFields must be an object of field id → value.' };
  }

  const input = rawValues as CustomFieldValues;
  const values: CustomFieldValues = {};

  for (const field of fields) {
    if (opts.onlyEditable && !field.editable) continue;
    if (!(field.id in input)) continue;

    const raw = input[field.id];

    switch (field.type) {
      case 'checkbox': {
        if (raw !== null && raw !== undefined && typeof raw !== 'boolean') {
          return { ok: false, message: `"${field.label}" must be a yes/no value.` };
        }
        values[field.id] = raw === true;
        break;
      }
      case 'document': {
        if (isEmptyValue(raw)) {
          values[field.id] = null;
          break;
        }
        if (typeof raw !== 'object' || Array.isArray(raw)) {
          return { ok: false, message: `"${field.label}" must be an uploaded document.` };
        }
        const name = String((raw as any).name || '').trim();
        const url = String((raw as any).url || '').trim();
        if (!url) {
          return { ok: false, message: `"${field.label}" must be an uploaded document.` };
        }
        values[field.id] = { name: name || 'document', url };
        break;
      }
      case 'number': {
        if (isEmptyValue(raw)) {
          values[field.id] = '';
          break;
        }
        const asString = String(raw).trim();
        const asNumber = Number(asString);
        if (asString === '' || Number.isNaN(asNumber) || !Number.isFinite(asNumber)) {
          return { ok: false, message: `"${field.label}" must be a valid number.` };
        }
        values[field.id] = asString;
        break;
      }
      case 'email': {
        if (isEmptyValue(raw)) {
          values[field.id] = '';
          break;
        }
        const email = String(raw).trim();
        if (!EMAIL_RE.test(email)) {
          return { ok: false, message: `"${field.label}" must be a valid email address.` };
        }
        values[field.id] = email;
        break;
      }
      case 'phone': {
        if (isEmptyValue(raw)) {
          values[field.id] = '';
          break;
        }
        const phone = String(raw).trim();
        if (!PHONE_RE.test(phone)) {
          return { ok: false, message: `"${field.label}" must be a valid phone number (7-20 digits).` };
        }
        values[field.id] = phone;
        break;
      }
      case 'date': {
        if (isEmptyValue(raw)) {
          values[field.id] = '';
          break;
        }
        const date = String(raw).trim();
        if (!DATE_RE.test(date)) {
          return { ok: false, message: `"${field.label}" must be a date in YYYY-MM-DD format.` };
        }
        values[field.id] = date;
        break;
      }
      case 'dropdown': {
        if (isEmptyValue(raw)) {
          values[field.id] = '';
          break;
        }
        const option = String(raw).trim();
        const allowed = (field.options || []).map((o) => o.trim());
        if (!allowed.includes(option)) {
          return { ok: false, message: `"${field.label}" must be one of: ${allowed.join(', ')}.` };
        }
        values[field.id] = option;
        break;
      }
      case 'textarea':
      case 'text':
      default: {
        if (raw !== null && raw !== undefined && typeof raw !== 'string' && typeof raw !== 'number') {
          return { ok: false, message: `"${field.label}" must be text.` };
        }
        values[field.id] = raw === null || raw === undefined ? '' : String(raw).trim();
        break;
      }
    }
  }

  if (!opts.onlyEditable) {
    for (const field of fields) {
      if (field.required && isEmptyValue(values[field.id])) {
        return { ok: false, message: `"${field.label}" is required.` };
      }
    }
  } else {
    // On self-service edit, required fields must not be blanked out.
    for (const field of fields) {
      if (!field.editable) continue;
      if (field.required && field.id in values && isEmptyValue(values[field.id])) {
        return { ok: false, message: `"${field.label}" is required.` };
      }
    }
  }

  return { ok: true, values };
}

/** Merges validated values over the user's existing customFields blob. */
export function mergeCustomFields(
  existing: CustomFieldValues | null | undefined,
  validated: CustomFieldValues
): CustomFieldValues {
  return { ...(existing && typeof existing === 'object' ? existing : {}), ...validated };
}
