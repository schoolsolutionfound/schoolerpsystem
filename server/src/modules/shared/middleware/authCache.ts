/**
 * Short-TTL cache for role/institution resolution used by the auth middleware.
 * Reduces Postgres load on every authenticated request while keeping
 * authorization fresh (60s window). Invalidate on user writes that change
 * role / institutionCode.
 */
const AUTH_CACHE_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 10_000;

const cache = new Map<string, { role: string; institutionCode: string; department?: string; expiresAt: number }>();

export function getCachedAuth(uid: string): { role: string; institutionCode: string; department?: string } | undefined {
  const entry = cache.get(uid);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(uid);
    return undefined;
  }
  return { role: entry.role, institutionCode: entry.institutionCode, department: entry.department };
}

export function setCachedAuth(uid: string, role: string, institutionCode: string, department?: string) {
  if (cache.size > MAX_CACHE_ENTRIES) cache.clear();
  cache.set(uid, { role, institutionCode, department, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
}

export function invalidateCachedAuth(uid?: string) {
  if (uid) {
    cache.delete(uid);
  } else {
    cache.clear();
  }
}