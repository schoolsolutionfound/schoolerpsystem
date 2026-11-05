/**
 * Short-TTL LRU cache for role/institution resolution used by the auth middleware.
 * Reduces Postgres load on every authenticated request while keeping
 * authorization fresh (60s window). Invalidate on user writes that change
 * role / institutionCode / mustChangePassword.
 *
 * Eviction is true LRU (Map preserves insertion order; access moves the key
 * to the end, overflow evicts the oldest key) instead of clearing the whole
 * cache — at the 10k-entry cap a full clear would cause a thundering herd
 * back to Postgres + Firebase on the next burst of requests.
 */
const AUTH_CACHE_TTL_MS = 60_000;
const MAX_CACHE_ENTRIES = 10_000;

interface CachedAuthEntry {
  role: string;
  institutionCode: string;
  mustChangePassword: boolean;
  emailVerified: boolean;
  department?: string;
  placementAccess?: 'head' | 'member' | null;
  /**
   * The full user row resolved with this entry, so a handler that needs the
   * whole profile (login-sync) does not issue the same lookup again this
   * request already paid for. Null when the entry was seeded from a write.
   */
  user?: unknown;
  expiresAt: number;
}

export interface CachedAuth {
  role: string;
  institutionCode: string;
  mustChangePassword: boolean;
  emailVerified: boolean;
  department?: string;
  placementAccess?: 'head' | 'member' | null;
}

const cache = new Map<string, CachedAuthEntry>();

/** The user row cached alongside an auth entry, if one was resolved. */
export function getCachedUserByUid<T>(uid: string): T | undefined {
  const entry = cache.get(uid);
  if (!entry || Date.now() > entry.expiresAt) return undefined;
  return entry.user as T | undefined;
}

export function getCachedAuth(uid: string): CachedAuth | undefined {
  const entry = cache.get(uid);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(uid);
    return undefined;
  }
  // Touch: move to the most-recently-used end.
  cache.delete(uid);
  cache.set(uid, entry);
  return {
    role: entry.role,
    institutionCode: entry.institutionCode,
    mustChangePassword: entry.mustChangePassword,
    emailVerified: entry.emailVerified,
    department: entry.department,
    placementAccess: entry.placementAccess,
  };
}

export function setCachedAuth(
  uid: string,
  role: string,
  institutionCode: string,
  mustChangePassword: boolean,
  emailVerified: boolean,
  department?: string,
  placementAccess?: 'head' | 'member' | null,
  user?: unknown
) {
  if (cache.has(uid)) cache.delete(uid);
  cache.set(uid, {
    role,
    institutionCode,
    mustChangePassword: Boolean(mustChangePassword),
    emailVerified: Boolean(emailVerified),
    department,
    placementAccess,
    user,
    expiresAt: Date.now() + AUTH_CACHE_TTL_MS,
  });
  // Evict least-recently-used entries beyond the cap (Map iterates oldest-first).
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

export function invalidateCachedAuth(uid?: string) {
  if (uid) {
    cache.delete(uid);
  } else {
    cache.clear();
  }
}

/** Test/maintenance hook. */
export function __authCacheSize(): number {
  return cache.size;
}
