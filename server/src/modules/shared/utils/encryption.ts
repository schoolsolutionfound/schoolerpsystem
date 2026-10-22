import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'crypto';

/**
 * AES-256-GCM encryption for per-tenant payment credentials at rest.
 *
 * Packed format: "v1:<base64 iv>:<base64 tag>:<base64 ciphertext>"
 * The version prefix allows future key rotation without breaking old rows.
 *
 * Master key: PAYMENT_CONFIG_MASTER_KEY (base64, exactly 32 bytes).
 * NEVER log, return, or commit the master key or decrypted secrets.
 */

const ALGO = 'aes-256-gcm';
const VERSION = 'v1';

function getMasterKey(): Buffer {
  const raw = (process.env.PAYMENT_CONFIG_MASTER_KEY || '').trim();
  if (!raw) {
    throw Object.assign(
      new Error('PAYMENT_CONFIG_MASTER_KEY is not configured.'),
      { statusCode: 500, code: 'PAYMENT_KEY_MISSING' }
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw Object.assign(
      new Error('PAYMENT_CONFIG_MASTER_KEY must be base64 of exactly 32 bytes.'),
      { statusCode: 500, code: 'PAYMENT_KEY_INVALID' }
    );
  }
  return key;
}

/** True when a usable master key is present (used for boot-time warnings). */
export function isEncryptionReady(): boolean {
  try {
    getMasterKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptSecret(plain: string): string {
  const key = getMasterKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(packed: string): string {
  const key = getMasterKey();
  const parts = (packed || '').split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw Object.assign(
      new Error('Malformed encrypted secret.'),
      { statusCode: 500, code: 'PAYMENT_SECRET_CORRUPT' }
    );
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}

/** Constant-time string comparison for webhook signatures. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a || '', 'utf8');
  const bufB = Buffer.from(b || '', 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
