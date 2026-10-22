import { db } from '../shared/db/index.js';
import * as schema from '../shared/db/schema.js';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';

function requireDb() {
  if (!db) {
    throw Object.assign(new Error('Database not available'), { statusCode: 500, code: 'DB_UNAVAILABLE' });
  }
  return db;
}

// ============================================================================
// Verification Tokens
//
// Only the SHA-256 hash is stored. consume() is a guarded UPDATE so a token
// can be redeemed exactly once even under concurrent requests.
// ============================================================================

export interface InsertTokenInput {
  institutionCode: string;
  email: string;
  firebaseUid: string;
  tokenHash: string;
  expiresAt: Date;
}

export async function insertToken(input: InsertTokenInput): Promise<void> {
  const d = requireDb();
  await d.insert(schema.emailVerificationTokens).values({
    institutionCode: input.institutionCode,
    email: input.email,
    firebaseUid: input.firebaseUid,
    tokenHash: input.tokenHash,
    sentAt: new Date(),
    expiresAt: input.expiresAt,
  });
}

/** Count sends for an address within the last hour (resend rate limit). */
export async function countRecentSends(email: string, since: Date): Promise<number> {
  const d = requireDb();
  const rows = await d
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.emailVerificationTokens)
    .where(and(eq(schema.emailVerificationTokens.email, email), gt(schema.emailVerificationTokens.sentAt, since)));
  return rows[0]?.n ?? 0;
}

/**
 * Atomically consume a token by hash. Returns the row only if it was
 * unexpired AND unconsumed — the guarded UPDATE makes double redemption
 * impossible without needing a transaction.
 */
export async function consumeToken(tokenHash: string): Promise<{
  id: string;
  institutionCode: string;
  email: string;
  firebaseUid: string;
} | null> {
  const d = requireDb();
  const rows = await d
    .update(schema.emailVerificationTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(schema.emailVerificationTokens.tokenHash, tokenHash),
        isNull(schema.emailVerificationTokens.consumedAt),
        gt(schema.emailVerificationTokens.expiresAt, new Date())
      )
    )
    .returning({
      id: schema.emailVerificationTokens.id,
      institutionCode: schema.emailVerificationTokens.institutionCode,
      email: schema.emailVerificationTokens.email,
      firebaseUid: schema.emailVerificationTokens.firebaseUid,
    });
  const row = rows[0];
  if (!row) return null;
  // firebaseUid is nullable in the schema; the service treats a missing uid as
  // "resolve it from email" rather than an error.
  return {
    id: row.id,
    institutionCode: row.institutionCode,
    email: row.email,
    firebaseUid: row.firebaseUid || '',
  };
}

// ============================================================================
// OTP operations
//
// OTP differs from the old link token: the code is low-entropy (6 digits), so
// we (a) store an HMAC keyed by a server secret instead of a bare hash, and
// (b) bound online guessing with a per-code attempt counter. A new send
// invalidates every prior unconsumed code for that address so only the latest
// one is live.
// ============================================================================

/** Latest live (unconsumed, unexpired) code for an address, or null. */
export async function findActiveOtp(email: string): Promise<{
  id: string;
  tokenHash: string;
  attempts: number;
  institutionCode: string;
  firebaseUid: string;
  email: string;
} | null> {
  const d = requireDb();
  const rows = await d
    .select({
      id: schema.emailVerificationTokens.id,
      tokenHash: schema.emailVerificationTokens.tokenHash,
      attempts: schema.emailVerificationTokens.attempts,
      institutionCode: schema.emailVerificationTokens.institutionCode,
      firebaseUid: schema.emailVerificationTokens.firebaseUid,
      email: schema.emailVerificationTokens.email,
    })
    .from(schema.emailVerificationTokens)
    .where(
      and(
        eq(schema.emailVerificationTokens.email, email),
        isNull(schema.emailVerificationTokens.consumedAt),
        gt(schema.emailVerificationTokens.expiresAt, new Date())
      )
    )
    .orderBy(sql`${schema.emailVerificationTokens.sentAt} desc`)
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { ...row, firebaseUid: row.firebaseUid || '' };
}

/**
 * Record a failed guess. Returns the new attempt count. When the cap is
 * reached the code is consumed in the same statement, so the row can never
 * be tried again — the user must request a fresh code.
 */
export async function failOtpAttempt(id: string, maxAttempts: number): Promise<number> {
  const d = requireDb();
  const rows = await d
    .update(schema.emailVerificationTokens)
    .set({
      attempts: sql`${schema.emailVerificationTokens.attempts} + 1`,
      // Consume at the cap so a locked-out code is dead even if guesses stop.
      consumedAt: sql`CASE WHEN ${schema.emailVerificationTokens.attempts} + 1 >= ${maxAttempts} THEN now() ELSE ${schema.emailVerificationTokens.consumedAt} END`,
    })
    .where(and(eq(schema.emailVerificationTokens.id, id), isNull(schema.emailVerificationTokens.consumedAt)))
    .returning({ attempts: schema.emailVerificationTokens.attempts });
  return rows[0]?.attempts ?? maxAttempts;
}

/** Invalidate every live code for an address (latest-code-only semantics). */
export async function invalidateOtpsForEmail(email: string): Promise<void> {
  const d = requireDb();
  await d
    .update(schema.emailVerificationTokens)
    .set({ consumedAt: new Date() })
    .where(and(eq(schema.emailVerificationTokens.email, email), isNull(schema.emailVerificationTokens.consumedAt)));
}

/** Delete tokens that expired before the given cutoff (housekeeping). */
export async function deleteExpiredTokensBefore(cutoff: Date): Promise<number> {
  const d = requireDb();
  const rows = await d
    .delete(schema.emailVerificationTokens)
    .where(sql`${schema.emailVerificationTokens.expiresAt} < ${cutoff}`)
    .returning({ id: schema.emailVerificationTokens.id });
  return rows.length;
}

// ============================================================================
// Suppressions
// ============================================================================

export async function isSuppressed(institutionCode: string, email: string): Promise<boolean> {
  const d = requireDb();
  const rows = await d
    .select({ id: schema.emailSuppressions.id })
    .from(schema.emailSuppressions)
    .where(and(eq(schema.emailSuppressions.institutionCode, institutionCode), eq(schema.emailSuppressions.email, email)))
    .limit(1);
  return rows.length > 0;
}

/** Idempotent — a repeat bounce on the same address is a no-op. */
export async function addSuppression(input: {
  institutionCode: string;
  email: string;
  reason: 'bounce' | 'complaint' | 'manual';
  sesEventId?: string;
  detail?: string;
}): Promise<void> {
  const d = requireDb();
  await d
    .insert(schema.emailSuppressions)
    .values({
      institutionCode: input.institutionCode,
      email: input.email,
      reason: input.reason,
      sesEventId: input.sesEventId || '',
      detail: input.detail || '',
    })
    .onConflictDoNothing({ target: [schema.emailSuppressions.institutionCode, schema.emailSuppressions.email] });
}

// ============================================================================
// Per-tenant email identity
// ============================================================================

export async function getEmailConfig(institutionCode: string): Promise<{
  fromEmail: string;
  fromName: string;
  replyTo: string;
  configurationSet: string;
} | null> {
  const d = requireDb();
  const rows = await d
    .select()
    .from(schema.institutionEmailConfig)
    .where(and(eq(schema.institutionEmailConfig.institutionCode, institutionCode), eq(schema.institutionEmailConfig.isActive, true)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    fromEmail: row.fromEmail,
    fromName: row.fromName || '',
    replyTo: row.replyTo || '',
    configurationSet: row.configurationSet || '',
  };
}

export async function upsertEmailConfig(input: {
  institutionCode: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  configurationSet?: string;
  domain?: string;
}): Promise<void> {
  const d = requireDb();
  await d
    .insert(schema.institutionEmailConfig)
    .values({
      institutionCode: input.institutionCode,
      fromEmail: input.fromEmail,
      fromName: input.fromName || '',
      replyTo: input.replyTo || '',
      configurationSet: input.configurationSet || '',
      domain: input.domain || '',
    })
    .onConflictDoUpdate({
      target: schema.institutionEmailConfig.institutionCode,
      set: {
        fromEmail: input.fromEmail,
        fromName: input.fromName || '',
        replyTo: input.replyTo || '',
        configurationSet: input.configurationSet || '',
        domain: input.domain || '',
        updatedAt: new Date(),
      },
    });
}

/** Resolve a user's email + firebase uid by institution-scoped lookup. */
export async function findUserByEmail(
  institutionCode: string,
  email: string
): Promise<{ firebaseUid: string; email: string; emailVerified: boolean } | null> {
  const d = requireDb();
  const rows = await d
    .select({
      firebaseUid: schema.users.firebaseUid,
      email: schema.users.email,
      emailVerified: schema.users.emailVerified,
    })
    .from(schema.users)
    .where(and(eq(schema.users.institutionCode, institutionCode), eq(schema.users.email, email)))
    .limit(1);
  return rows[0] ?? null;
}

export async function findUserByUid(firebaseUid: string): Promise<{
  email: string;
  institutionCode: string;
  institutionName: string;
} | null> {
  const d = requireDb();
  const rows = await d
    .select({
      email: schema.users.email,
      institutionCode: schema.users.institutionCode,
      institutionName: schema.users.institutionName,
    })
    .from(schema.users)
    .where(eq(schema.users.firebaseUid, firebaseUid))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  // institutionCode is nullable on users; normalize so callers get a string.
  return {
    email: row.email,
    institutionCode: row.institutionCode || '',
    institutionName: row.institutionName || '',
  };
}

/** Resolve the owning tenant for a single address (emails are globally unique). */
export async function findInstitutionCodeByEmail(email: string): Promise<string | null> {
  const d = requireDb();
  const rows = await d
    .select({ institutionCode: schema.users.institutionCode })
    .from(schema.users)
    .where(eq(schema.users.email, email.trim().toLowerCase()))
    .limit(1);
  return rows[0]?.institutionCode || null;
}

export async function markUserEmailVerified(firebaseUid: string): Promise<void> {
  const d = requireDb();
  await d
    .update(schema.users)
    .set({ emailVerified: true, emailVerifiedAt: new Date() })
    .where(eq(schema.users.firebaseUid, firebaseUid));
}
