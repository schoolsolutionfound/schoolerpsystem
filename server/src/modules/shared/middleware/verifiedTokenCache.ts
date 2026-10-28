import { createHash } from 'node:crypto';
import { admin } from '../config/firebase.js';

interface CachedToken {
  uid: string;
  email: string;
  checkedUntil: number;
  tokenExpiresAt: number;
}

const DEFAULT_TTL_MS = 60_000;
const MAX_ENTRIES = 10_000;

const configuredTtl = Number(process.env.AUTH_REVOCATION_CACHE_TTL_MS ?? DEFAULT_TTL_MS);
const ttlMs = Number.isFinite(configuredTtl) && configuredTtl > 0 ? configuredTtl : 0;
const cacheEnabled = process.env.NODE_ENV !== 'test' && ttlMs > 0;

const cache = new Map<string, CachedToken>();

function cacheKey(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

function evictOverflow() {
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

export async function verifyIdTokenWithCachedRevocation(token: string): Promise<{ uid: string; email: string }> {
  const key = cacheEnabled ? cacheKey(token) : '';
  const now = Date.now();

  if (cacheEnabled) {
    const cached = cache.get(key);
    if (cached && now < cached.checkedUntil && now < cached.tokenExpiresAt) {
      cache.delete(key);
      cache.set(key, cached);
      return { uid: cached.uid, email: cached.email };
    }
    if (cached) cache.delete(key);
  }

  const decoded = await admin.auth().verifyIdToken(token, true);
  const tokenExpiresAt = typeof decoded.exp === 'number' ? decoded.exp * 1000 : now + ttlMs;

  if (cacheEnabled) {
    cache.set(key, {
      uid: decoded.uid,
      email: decoded.email || '',
      checkedUntil: now + ttlMs,
      tokenExpiresAt,
    });
    evictOverflow();
  }

  return { uid: decoded.uid, email: decoded.email || '' };
}

export function invalidateVerifiedTokensForUid(uid: string) {
  for (const [key, entry] of cache) {
    if (entry.uid === uid) cache.delete(key);
  }
}

export function __clearVerifiedTokenCache() {
  cache.clear();
}
