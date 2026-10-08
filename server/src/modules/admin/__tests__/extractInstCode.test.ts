import { describe, it, expect } from 'vitest';
import { extractInstCode } from '../admin.controller.js';

function mockReq(institutionCode?: string) {
  return { user: institutionCode !== undefined ? { institutionCode } : undefined } as any;
}

describe('extractInstCode (IDOR regression)', () => {
  it('returns session institutionCode when present', () => {
    expect(extractInstCode(mockReq('DPS'))).toBe('DPS');
  });

  it('trims whitespace on institutionCode', () => {
    expect(extractInstCode(mockReq('  DPS  '))).toBe('DPS');
  });

  it('throws 403 NO_INSTITUTION when user is missing', () => {
    try {
      extractInstCode({} as any);
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('NO_INSTITUTION');
    }
  });

  it('throws 403 NO_INSTITUTION when institutionCode is empty', () => {
    try {
      extractInstCode(mockReq(''));
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('NO_INSTITUTION');
    }
  });

  it('throws when institutionCode is only whitespace', () => {
    try {
      extractInstCode(mockReq('   '));
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
    }
  });

  it('does not read institutionCode from body/query', () => {
    const req: any = {
      user: { institutionCode: 'FROM_SESSION' },
      body: { institutionCode: 'FROM_BODY' },
      query: { institutionCode: 'FROM_QUERY' },
    };
    expect(extractInstCode(req)).toBe('FROM_SESSION');
  });
});
