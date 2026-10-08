import { describe, it, expect } from 'vitest';
import { CreateAdminSchema, UpdateAdminSchema, ADMIN_ROLES } from '../developer.schema.js';

const base = {
  fullName: 'Test Driver',
  email: 'driver@example.com',
  password: 'Passw0rd',
  institutionCode: 'TST001',
};

describe('CreateAdminSchema role handling', () => {
  it('accepts the driver role', () => {
    const res = CreateAdminSchema.safeParse({ ...base, role: 'driver' });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.role).toBe('driver');
  });

  it('accepts every known role exactly once', () => {
    expect(new Set(ADMIN_ROLES).size).toBe(ADMIN_ROLES.length);
    for (const role of ADMIN_ROLES) {
      expect(CreateAdminSchema.safeParse({ ...base, role }).success).toBe(true);
    }
  });

  it('rejects unknown roles', () => {
    expect(CreateAdminSchema.safeParse({ ...base, role: 'hacker' }).success).toBe(false);
  });

  it('requires an explicit role — no silent admin default', () => {
    expect(CreateAdminSchema.safeParse(base).success).toBe(false);
    expect(CreateAdminSchema.safeParse({ ...base, role: '' }).success).toBe(false);
  });

  it('partial updates may omit the role, but must use a known one when present', () => {
    expect(UpdateAdminSchema.safeParse({ fullName: 'Renamed' }).success).toBe(true);
    expect(UpdateAdminSchema.safeParse({ role: 'driver' }).success).toBe(true);
    expect(UpdateAdminSchema.safeParse({ role: 'hacker' }).success).toBe(false);
  });
});
