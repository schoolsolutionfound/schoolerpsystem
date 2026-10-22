import { describe, it, expect } from 'vitest';
import { normalizeRole } from '../auth.js';

describe('normalizeRole', () => {
  it('lowercases and trims', () => {
    expect(normalizeRole('  Admin ')).toBe('admin');
    expect(normalizeRole('TEACHER')).toBe('teacher');
  });

  it('maps "institution admin" to "admin"', () => {
    expect(normalizeRole('institution admin')).toBe('admin');
    expect(normalizeRole('Institution Admin')).toBe('admin');
    expect(normalizeRole('INSTITUTION ADMIN')).toBe('admin');
  });

  it('maps "developer" to "dev"', () => {
    expect(normalizeRole('developer')).toBe('dev');
    expect(normalizeRole('Developer')).toBe('dev');
    expect(normalizeRole('DEVELOPER')).toBe('dev');
    expect(normalizeRole('dev')).toBe('dev');
  });

  it('returns empty string for undefined/null', () => {
    expect(normalizeRole(undefined)).toBe('');
    expect(normalizeRole('')).toBe('');
  });

  it('keeps other roles as-is', () => {
    expect(normalizeRole('accountant')).toBe('accountant');
    expect(normalizeRole('parent')).toBe('parent');
    expect(normalizeRole('student')).toBe('student');
    expect(normalizeRole('hod')).toBe('hod');
  });
});
