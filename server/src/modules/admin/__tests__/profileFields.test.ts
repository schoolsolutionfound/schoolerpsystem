import { describe, it, expect } from 'vitest';
import {
  ProfileFormFieldSchema,
  RoleProfileFieldsSchema,
  isConfigurableRole,
  normalizeProfileFormField,
} from '../profileFields.schema.js';
import { validateCustomFields, mergeCustomFields } from '../../users/profile-fields.validation.js';

const textField = { id: 'f_name', label: 'Blood Group', type: 'text', required: true, editable: true };

describe('ProfileFormFieldSchema', () => {
  it('accepts a valid text field and defaults flags', () => {
    const result = ProfileFormFieldSchema.safeParse({ id: 'f1', label: 'ID Card No', type: 'text' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.required).toBe(false);
      expect(result.data.editable).toBe(true);
    }
  });

  it('rejects an empty field name', () => {
    expect(ProfileFormFieldSchema.safeParse({ id: 'f1', label: '  ', type: 'text' }).success).toBe(false);
  });

  it('rejects an unknown field type', () => {
    expect(ProfileFormFieldSchema.safeParse({ id: 'f1', label: 'X', type: 'weird' }).success).toBe(false);
  });

  it('requires options for dropdown fields', () => {
    expect(ProfileFormFieldSchema.safeParse({ id: 'f1', label: 'House', type: 'dropdown' }).success).toBe(false);
    expect(
      ProfileFormFieldSchema.safeParse({
        id: 'f1',
        label: 'House',
        type: 'dropdown',
        options: ['Red', 'Blue'],
      }).success
    ).toBe(true);
  });

  it('rejects more than 50 fields per role', () => {
    const many = Array.from({ length: 51 }, (_, i) => ({ ...textField, id: `f${i}`, label: `F${i}` }));
    expect(RoleProfileFieldsSchema.safeParse(many).success).toBe(false);
  });
});

describe('isConfigurableRole', () => {
  it('allows institution roles but not admin/dev', () => {
    expect(isConfigurableRole('teacher')).toBe(true);
    expect(isConfigurableRole('admission_officer')).toBe(true);
    expect(isConfigurableRole('admin')).toBe(false);
    expect(isConfigurableRole('dev')).toBe(false);
    expect(isConfigurableRole('')).toBe(false);
  });
});

describe('normalizeProfileFormField', () => {
  it('strips options from non-dropdown fields', () => {
    const normalized = normalizeProfileFormField({
      id: 'f1',
      label: 'X',
      type: 'text',
      required: false,
      editable: true,
      options: ['a', 'b'],
    });
    expect((normalized as any).options).toBeUndefined();
  });
});

describe('validateCustomFields', () => {
  const fields = [
    { id: 'f_text', label: 'Nickname', type: 'text' as const, required: false, editable: true },
    { id: 'f_num', label: 'Rank', type: 'number' as const, required: true, editable: true },
    { id: 'f_drop', label: 'House', type: 'dropdown' as const, required: false, editable: false, options: ['Red', 'Blue'] },
    { id: 'f_doc', label: 'ID Proof', type: 'document' as const, required: true, editable: true },
  ];

  it('fails when a required field is missing', () => {
    const result = validateCustomFields(fields, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('Rank');
  });

  it('fails on a non-numeric number value', () => {
    const result = validateCustomFields(fields, { f_num: 'abc', f_doc: { name: 'a.pdf', url: 'https://x/a.pdf' } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('Rank');
  });

  it('fails when a dropdown value is not in options', () => {
    const result = validateCustomFields(fields, {
      f_num: '3',
      f_doc: { name: 'a.pdf', url: 'https://x/a.pdf' },
      f_drop: 'Green',
    });
    expect(result.ok).toBe(false);
  });

  it('ignores unknown field ids (stale client config)', () => {
    const result = validateCustomFields(fields, {
      f_num: '3',
      f_doc: { name: 'a.pdf', url: 'https://x/a.pdf' },
      f_removed: 'whatever',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values.f_removed).toBeUndefined();
  });

  it('accepts valid values and normalizes them', () => {
    const result = validateCustomFields(fields, {
      f_text: '  Sunny  ',
      f_num: 12,
      f_drop: 'Blue',
      f_doc: { name: 'id.pdf', url: 'https://x/id.pdf' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.f_text).toBe('Sunny');
      expect(result.values.f_num).toBe('12');
      expect(result.values.f_drop).toBe('Blue');
      expect(result.values.f_doc).toEqual({ name: 'id.pdf', url: 'https://x/id.pdf' });
    }
  });

  it('only applies editable fields when onlyEditable is set', () => {
    const result = validateCustomFields(fields, { f_text: 'Hi', f_drop: 'Red' }, { onlyEditable: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.f_text).toBe('Hi');
      expect(result.values.f_drop).toBeUndefined();
    }
  });

  it('rejects blanking a required editable field on edit', () => {
    const result = validateCustomFields(fields, { f_num: '  ' }, { onlyEditable: true });
    expect(result.ok).toBe(false);
  });

  it('rejects non-object payloads', () => {
    expect(validateCustomFields(fields, []).ok).toBe(false);
    expect(validateCustomFields(fields, 'nope').ok).toBe(false);
  });
});

describe('mergeCustomFields', () => {
  it('merges over existing values and tolerates null existing', () => {
    expect(mergeCustomFields({ a: '1' }, { b: '2' })).toEqual({ a: '1', b: '2' });
    expect(mergeCustomFields(null, { b: '2' })).toEqual({ b: '2' });
  });
});
