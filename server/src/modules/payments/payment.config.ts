import { eq } from 'drizzle-orm';
import { db } from '../shared/db/index.js';
import { institutionPaymentConfig } from '../shared/db/schema.js';
import { decryptSecret, encryptSecret } from '../shared/utils/encryption.js';
import type { MerchantCredentials } from './gateway/adapter.js';
import type { UpdatePaymentConfigInput } from './payment.schema.js';

/**
 * Per-tenant gateway credential storage.
 *
 * SECURITY RULES:
 *  - key_secret / webhook_secret are AES-256-GCM encrypted at rest.
 *  - Decrypted secrets NEVER leave this module except into gateway calls.
 *  - API responses only ever expose the public key_id + status + webhook URL.
 */

export interface PublicPaymentConfig {
  gateway: string;
  keyId: string;
  hasKeySecret: boolean;
  hasWebhookSecret: boolean;
  isActive: boolean;
  webhookUrl: string;
}

function buildWebhookUrl(institutionCode: string): string {
  const base = (process.env.PAYMENT_WEBHOOK_BASE_URL || '').replace(/\/+$/, '');
  return `${base}/api/v1/payments/webhook/${encodeURIComponent(institutionCode)}`;
}

export async function getPaymentConfigRow(institutionCode: string) {
  if (!db || !institutionCode) return undefined;
  const [row] = await db
    .select()
    .from(institutionPaymentConfig)
    .where(eq(institutionPaymentConfig.institutionCode, institutionCode))
    .limit(1);
  return row;
}

export async function getPublicPaymentConfig(institutionCode: string): Promise<PublicPaymentConfig | null> {
  const row = await getPaymentConfigRow(institutionCode);
  if (!row) return null;
  return {
    gateway: row.gateway,
    keyId: row.keyId,
    hasKeySecret: Boolean(row.keySecretEnc),
    hasWebhookSecret: Boolean(row.webhookSecretEnc),
    isActive: row.isActive,
    webhookUrl: buildWebhookUrl(institutionCode),
  };
}

export async function savePaymentConfig(institutionCode: string, input: UpdatePaymentConfigInput): Promise<PublicPaymentConfig> {
  if (!db) {
    throw Object.assign(new Error('Database not available'), { statusCode: 500, code: 'DB_UNAVAILABLE' });
  }
  const existing = await getPaymentConfigRow(institutionCode);
  const keySecretEnc = input.keySecret
    ? encryptSecret(input.keySecret)
    : existing?.keySecretEnc;
  const webhookSecretEnc = input.webhookSecret
    ? encryptSecret(input.webhookSecret)
    : existing?.webhookSecretEnc;
  if (!keySecretEnc || !webhookSecretEnc) {
    // First save must provide BOTH secrets (they are never readable back).
    throw Object.assign(
      new Error('keySecret and webhookSecret are required for the initial setup.'),
      { statusCode: 400, code: 'PAYMENT_SECRETS_REQUIRED' }
    );
  }
  const values = {
    gateway: input.gateway,
    keyId: input.keyId.trim(),
    keySecretEnc,
    webhookSecretEnc,
    isActive: input.isActive,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(institutionPaymentConfig)
    .values({ institutionCode, ...values })
    .onConflictDoUpdate({
      target: institutionPaymentConfig.institutionCode,
      set: values,
    })
    .returning();
  return {
    gateway: row.gateway,
    keyId: row.keyId,
    hasKeySecret: Boolean(row.keySecretEnc),
    hasWebhookSecret: Boolean(row.webhookSecretEnc),
    isActive: row.isActive,
    webhookUrl: buildWebhookUrl(institutionCode),
  };
}

/**
 * Decrypted credentials for gateway calls. Internal use ONLY — never return
 * from a controller. Throws 404 when the tenant has no active configuration.
 */
export interface MerchantContext extends MerchantCredentials {
  gateway: string;
}

export async function getMerchantCredentials(institutionCode: string): Promise<MerchantContext> {
  const row = await getPaymentConfigRow(institutionCode);
  if (!row || !row.isActive) {
    throw Object.assign(
      new Error('Online payments are not configured for this institution.'),
      { statusCode: 404, code: 'PAYMENT_NOT_CONFIGURED' }
    );
  }
  const isTestMode = (process.env.PAYMENT_MODE || 'test') !== 'live';
  if (isTestMode && row.keyId.startsWith('rzp_live_')) {
    throw Object.assign(
      new Error('Live gateway keys are disabled (PAYMENT_MODE=test).'),
      { statusCode: 503, code: 'PAYMENT_LIVE_DISABLED' }
    );
  }
  if (!isTestMode && process.env.NODE_ENV !== 'production') {
    throw Object.assign(
      new Error('Live payment mode requires NODE_ENV=production.'),
      { statusCode: 503, code: 'PAYMENT_LIVE_DISABLED' }
    );
  }
  return {
    gateway: row.gateway,
    keyId: row.keyId,
    keySecret: decryptSecret(row.keySecretEnc),
    webhookSecret: decryptSecret(row.webhookSecretEnc),
  };
}

/** Webhook-only lookup: active config + secret, or null when unconfigured. */
export async function getWebhookCredentials(institutionCode: string): Promise<MerchantContext | null> {
  const row = await getPaymentConfigRow(institutionCode);
  if (!row || !row.isActive) return null;
  return {
    gateway: row.gateway,
    keyId: row.keyId,
    keySecret: decryptSecret(row.keySecretEnc),
    webhookSecret: decryptSecret(row.webhookSecretEnc),
  };
}

export async function configExists(institutionCode: string): Promise<boolean> {
  const row = await getPaymentConfigRow(institutionCode);
  return !!row;
}
