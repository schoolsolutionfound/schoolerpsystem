import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  encryptSecret,
  decryptSecret,
  safeEqual,
  isEncryptionReady,
} from '../encryption.js';

const VALID_KEY = Buffer.alloc(32, 7).toString('base64');
const SHORT_KEY = Buffer.from('too-short').toString('base64');
const OTHER_KEY = Buffer.alloc(32, 9).toString('base64');

const originalKey = process.env.PAYMENT_CONFIG_MASTER_KEY;

beforeAll(() => {
  process.env.PAYMENT_CONFIG_MASTER_KEY = VALID_KEY;
});

afterAll(() => {
  if (originalKey === undefined) delete process.env.PAYMENT_CONFIG_MASTER_KEY;
  else process.env.PAYMENT_CONFIG_MASTER_KEY = originalKey;
});

describe('encryptSecret / decryptSecret (AES-256-GCM)', () => {
  it('round-trips a secret', () => {
    const packed = encryptSecret('rzp_test_abc123');
    expect(decryptSecret(packed)).toBe('rzp_test_abc123');
  });

  it('never stores the plaintext and uses the versioned packed format', () => {
    const packed = encryptSecret('super-secret-value');
    expect(packed).not.toContain('super-secret-value');
    const parts = packed.split(':');
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe('v1');
    // base64 iv (12 bytes), auth tag (16 bytes), ciphertext
    expect(Buffer.from(parts[1], 'base64')).toHaveLength(12);
    expect(Buffer.from(parts[2], 'base64')).toHaveLength(16);
    expect(Buffer.from(parts[3], 'base64').length).toBeGreaterThan(0);
  });

  it('uses a fresh IV per encryption (same plaintext → different ciphertext)', () => {
    const a = encryptSecret('same-input');
    const b = encryptSecret('same-input');
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(decryptSecret(b));
  });

  it('rejects a tampered ciphertext (GCM auth tag check)', () => {
    const packed = encryptSecret('rzp_secret_1');
    const parts = packed.split(':');
    const data = Buffer.from(parts[3], 'base64');
    data[0] ^= 0xff;
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${data.toString('base64')}`;
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it('rejects a tampered auth tag', () => {
    const packed = encryptSecret('rzp_secret_2');
    const parts = packed.split(':');
    const tag = Buffer.from(parts[2], 'base64');
    tag[0] ^= 0xff;
    const tampered = `${parts[0]}:${parts[1]}:${tag.toString('base64')}:${parts[3]}`;
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it('fails to decrypt with a different master key', () => {
    const packed = encryptSecret('key-rotation-check');
    process.env.PAYMENT_CONFIG_MASTER_KEY = OTHER_KEY;
    try {
      expect(() => decryptSecret(packed)).toThrow();
    } finally {
      process.env.PAYMENT_CONFIG_MASTER_KEY = VALID_KEY;
    }
  });

  it('rejects malformed packed values with PAYMENT_SECRET_CORRUPT', () => {
    for (const bad of ['', 'v1:only:two', 'v2:a:b:c', 'plain-text']) {
      try {
        decryptSecret(bad);
        expect.unreachable(`should have thrown for ${JSON.stringify(bad)}`);
      } catch (err: any) {
        expect(err.code).toBe('PAYMENT_SECRET_CORRUPT');
        expect(err.statusCode).toBe(500);
      }
    }
  });
});

describe('master key handling', () => {
  it('encryptSecret throws PAYMENT_KEY_MISSING without a key', () => {
    delete process.env.PAYMENT_CONFIG_MASTER_KEY;
    try {
      encryptSecret('x');
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('PAYMENT_KEY_MISSING');
    } finally {
      process.env.PAYMENT_CONFIG_MASTER_KEY = VALID_KEY;
    }
  });

  it('throws PAYMENT_KEY_INVALID for a non-32-byte key', () => {
    process.env.PAYMENT_CONFIG_MASTER_KEY = SHORT_KEY;
    try {
      encryptSecret('x');
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('PAYMENT_KEY_INVALID');
    } finally {
      process.env.PAYMENT_CONFIG_MASTER_KEY = VALID_KEY;
    }
  });

  it('isEncryptionReady reflects key presence without throwing', () => {
    expect(isEncryptionReady()).toBe(true);
    delete process.env.PAYMENT_CONFIG_MASTER_KEY;
    expect(isEncryptionReady()).toBe(false);
    process.env.PAYMENT_CONFIG_MASTER_KEY = VALID_KEY;
  });
});

describe('safeEqual (timing-safe compare)', () => {
  it('returns true for identical strings', () => {
    expect(safeEqual('abc123', 'abc123')).toBe(true);
  });

  it('returns false for different content of the same length', () => {
    expect(safeEqual('abc123', 'abc124')).toBe(false);
  });

  it('returns false for different lengths (no throw)', () => {
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });

  it('handles empty inputs', () => {
    expect(safeEqual('', '')).toBe(true);
    expect(safeEqual('', 'x')).toBe(false);
    // undefined normalizes to an empty buffer — never equal to real input
    expect(safeEqual(undefined as any, 'sig')).toBe(false);
  });
});
