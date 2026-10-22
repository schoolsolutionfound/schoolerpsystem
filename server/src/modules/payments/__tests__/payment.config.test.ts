import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';

const VALID_KEY = Buffer.alloc(32, 11).toString('base64');
const originalMasterKey = process.env.PAYMENT_CONFIG_MASTER_KEY;
const originalMode = process.env.PAYMENT_MODE;
const originalHookBase = process.env.PAYMENT_WEBHOOK_BASE_URL;

const h = vi.hoisted(() => ({
  db: null as any,
}));

vi.mock('../../shared/db/index.js', () => ({
  get db() {
    return h.db;
  },
}));

import {
  savePaymentConfig,
  getPublicPaymentConfig,
  getMerchantCredentials,
  getWebhookCredentials,
  configExists,
} from '../payment.config.js';
import { encryptSecret } from '../../shared/utils/encryption.js';

const INST = 'DPS001';

interface Op {
  op: 'select' | 'insert';
  table: any;
  values?: any;
  limit?: boolean;
}

function makeDb(opts: {
  rows: () => any[]; // select results (shift per call)
  insertRow: (op: Op) => any;
}) {
  const captured: Op[] = [];
  const selectRows = opts.rows;

  function chain(op: Op): any {
    const c: any = {
      from: (t: any) => {
        op.table = t;
        return c;
      },
      where: () => c,
      limit: () => {
        op.limit = true;
        return c;
      },
      values: (v: any) => {
        op.values = v;
        return c;
      },
      onConflictDoUpdate: () => c,
      returning: () => c,
      then: (res: any, rej: any) => {
        captured.push(op);
        const result = op.op === 'select' ? selectRows() : [opts.insertRow(op)];
        return Promise.resolve(result).then(res, rej);
      },
    };
    return c;
  }

  return {
    captured,
    db: {
      select: () => chain({ op: 'select', table: undefined }),
      insert: (t: any) => chain({ op: 'insert', table: t }),
    },
  };
}

function configRow(over: Record<string, any> = {}) {
  return {
    id: 'cfg_1',
    institutionCode: INST,
    gateway: 'razorpay',
    keyId: 'rzp_test_abc123',
    keySecretEnc: encryptSecret('row_key_secret'),
    webhookSecretEnc: encryptSecret('row_webhook_secret'),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

beforeAll(() => {
  process.env.PAYMENT_CONFIG_MASTER_KEY = VALID_KEY;
});

afterAll(() => {
  if (originalMasterKey === undefined) delete process.env.PAYMENT_CONFIG_MASTER_KEY;
  else process.env.PAYMENT_CONFIG_MASTER_KEY = originalMasterKey;
  if (originalMode === undefined) delete process.env.PAYMENT_MODE;
  else process.env.PAYMENT_MODE = originalMode;
  if (originalHookBase === undefined) delete process.env.PAYMENT_WEBHOOK_BASE_URL;
  else process.env.PAYMENT_WEBHOOK_BASE_URL = originalHookBase;
});

beforeEach(() => {
  delete process.env.PAYMENT_MODE;
  delete process.env.PAYMENT_WEBHOOK_BASE_URL;
  h.db = null;
});

describe('savePaymentConfig (encrypted at rest, write-only secrets)', () => {
  it('stores AES-256-GCM ciphertext — never the plaintext secret', async () => {
    let pending: any = null;
    const mock = makeDb({
      rows: () => [],
      insertRow: (op) => {
        pending = op.values;
        return {
          institutionCode: INST,
          gateway: 'razorpay',
          keyId: 'rzp_test_abc123',
          keySecretEnc: op.values.keySecretEnc,
          webhookSecretEnc: op.values.webhookSecretEnc,
          isActive: true,
        };
      },
    });
    h.db = mock.db;

    const result = await savePaymentConfig(INST, {
      gateway: 'razorpay',
      keyId: 'rzp_test_abc123',
      keySecret: 'PLAIN_KEY_SECRET_999',
      webhookSecret: 'PLAIN_WEBHOOK_SECRET_888',
      isActive: true,
    });

    expect(pending.keySecretEnc).toMatch(/^v1:[^:]+:[^:]+:/);
    expect(pending.keySecretEnc).not.toContain('PLAIN_KEY_SECRET_999');
    expect(pending.webhookSecretEnc).not.toContain('PLAIN_WEBHOOK_SECRET_888');
    expect(pending.webhookSecretEnc).not.toContain('PLAIN_KEY_SECRET_999');

    // Public projection: ONLY these keys — no secret material of any kind.
    expect(Object.keys(result).sort()).toEqual(
      ['gateway', 'hasKeySecret', 'hasWebhookSecret', 'isActive', 'keyId', 'webhookUrl'].sort()
    );
    expect(result.hasKeySecret).toBe(true);
    expect(result.hasWebhookSecret).toBe(true);
    expect(JSON.stringify(result)).not.toContain('PLAIN_');
  });

  it('requires BOTH secrets on first setup (they can never be read back)', async () => {
    const mock = makeDb({ rows: () => [], insertRow: () => configRow() });
    h.db = mock.db;
    try {
      await savePaymentConfig(INST, {
        gateway: 'razorpay',
        keyId: 'rzp_test_abc',
        keySecret: undefined,
        webhookSecret: undefined,
        isActive: true,
      });
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('PAYMENT_SECRETS_REQUIRED');
      expect(err.statusCode).toBe(400);
    }
    expect(mock.captured.filter((c) => c.op === 'insert')).toHaveLength(0);
  });

  it('keeps the stored secret when a rotation omits it', async () => {
    const existing = configRow(); // existing ciphertexts
    let inserted: any = null;
    const mock = makeDb({
      rows: () => [existing],
      insertRow: (op) => {
        inserted = op.values;
        return {
          institutionCode: INST,
          gateway: 'razorpay',
          keyId: op.values.keyId,
          keySecretEnc: op.values.keySecretEnc,
          webhookSecretEnc: op.values.webhookSecretEnc,
          isActive: op.values.isActive,
        };
      },
    });
    h.db = mock.db;

    await savePaymentConfig(INST, {
      gateway: 'razorpay',
      keyId: 'rzp_test_rotated',
      keySecret: undefined, // keep
      webhookSecret: 'NEW_WEBHOOK_SECRET', // rotate
      isActive: true,
    });

    expect(inserted.keySecretEnc).toBe(existing.keySecretEnc);
    expect(inserted.webhookSecretEnc).not.toBe(existing.webhookSecretEnc);
    expect(inserted.webhookSecretEnc).not.toContain('NEW_WEBHOOK_SECRET');
    expect(inserted.keyId).toBe('rzp_test_rotated');
  });

  it('throws DB_UNAVAILABLE (500) without a database', async () => {
    h.db = null;
    await expect(
      savePaymentConfig(INST, {
        gateway: 'razorpay',
        keyId: 'rzp_test_x',
        keySecret: 'abcd1234',
        webhookSecret: 'abcd1234',
        isActive: true,
      })
    ).rejects.toMatchObject({ code: 'DB_UNAVAILABLE', statusCode: 500 });
  });
});

describe('getPublicPaymentConfig', () => {
  it('returns null when the tenant has no config', async () => {
    h.db = makeDb({ rows: () => [], insertRow: () => configRow() }).db;
    expect(await getPublicPaymentConfig(INST)).toBeNull();
  });

  it('never exposes secret fields', async () => {
    h.db = makeDb({ rows: () => [configRow()], insertRow: () => configRow() }).db;
    const pub = await getPublicPaymentConfig(INST);
    expect(pub).not.toBeNull();
    expect(Object.keys(pub!).sort()).toEqual(
      ['gateway', 'hasKeySecret', 'hasWebhookSecret', 'isActive', 'keyId', 'webhookUrl'].sort()
    );
    expect(JSON.stringify(pub)).not.toContain('v1:'); // no packed ciphertext either
  });

  it('reports missing secrets from legacy rows', async () => {
    h.db = makeDb({
      rows: () => [configRow({ keySecretEnc: null, webhookSecretEnc: null })],
      insertRow: () => configRow(),
    }).db;
    const pub = await getPublicPaymentConfig(INST);
    expect(pub!.hasKeySecret).toBe(false);
    expect(pub!.hasWebhookSecret).toBe(false);
  });
});

describe('webhook URL builder', () => {
  it('uses PAYMENT_WEBHOOK_BASE_URL + tenant path', async () => {
    process.env.PAYMENT_WEBHOOK_BASE_URL = 'https://hooks.example.com/';
    h.db = makeDb({ rows: () => [configRow()], insertRow: () => configRow() }).db;
    const pub = await getPublicPaymentConfig(INST);
    expect(pub!.webhookUrl).toBe('https://hooks.example.com/api/v1/payments/webhook/DPS001');
  });

  it('falls back to a relative path (admin UI warns until base URL is set)', async () => {
    delete process.env.PAYMENT_WEBHOOK_BASE_URL;
    h.db = makeDb({ rows: () => [configRow()], insertRow: () => configRow() }).db;
    const pub = await getPublicPaymentConfig(INST);
    expect(pub!.webhookUrl).toBe('/api/v1/payments/webhook/DPS001');
  });
});

describe('getMerchantCredentials (decrypted internal use only)', () => {
  it('404s when the tenant has no config', async () => {
    h.db = makeDb({ rows: () => [], insertRow: () => configRow() }).db;
    await expect(getMerchantCredentials(INST)).rejects.toMatchObject({
      code: 'PAYMENT_NOT_CONFIGURED',
      statusCode: 404,
    });
  });

  it('404s when the config is disabled', async () => {
    h.db = makeDb({ rows: () => [configRow({ isActive: false })], insertRow: () => configRow() }).db;
    await expect(getMerchantCredentials(INST)).rejects.toMatchObject({
      code: 'PAYMENT_NOT_CONFIGURED',
      statusCode: 404,
    });
  });

  it('rejects live keys while PAYMENT_MODE=test', async () => {
    process.env.PAYMENT_MODE = 'test';
    h.db = makeDb({
      rows: () => [configRow({ keyId: 'rzp_live_xyz' })],
      insertRow: () => configRow(),
    }).db;
    await expect(getMerchantCredentials(INST)).rejects.toMatchObject({
      code: 'PAYMENT_LIVE_DISABLED',
      statusCode: 503,
    });
  });

  it('rejects live mode outside production', async () => {
    process.env.PAYMENT_MODE = 'live';
    h.db = makeDb({
      rows: () => [configRow({ keyId: 'rzp_live_xyz' })],
      insertRow: () => configRow(),
    }).db;
    await expect(getMerchantCredentials(INST)).rejects.toMatchObject({
      code: 'PAYMENT_LIVE_DISABLED',
      statusCode: 503,
    });
  });

  it('returns decrypted credentials for an active test key (internal contract)', async () => {
    process.env.PAYMENT_MODE = 'test';
    const { encryptSecret } = await import('../../shared/utils/encryption.js');
    const row = configRow({
      keySecretEnc: encryptSecret('decrypted_key_secret'),
      webhookSecretEnc: encryptSecret('decrypted_webhook_secret'),
    });
    h.db = makeDb({ rows: () => [row], insertRow: () => configRow() }).db;
    const creds = await getMerchantCredentials(INST);
    expect(creds).toEqual({
      gateway: 'razorpay',
      keyId: 'rzp_test_abc123',
      keySecret: 'decrypted_key_secret',
      webhookSecret: 'decrypted_webhook_secret',
    });
  });
});

describe('getWebhookCredentials / configExists', () => {
  it('returns null (no throw) when unconfigured or disabled', async () => {
    const dbEmpty = makeDb({ rows: () => [], insertRow: () => configRow() });
    h.db = dbEmpty.db;
    expect(await getWebhookCredentials(INST)).toBeNull();

    const dbDisabled = makeDb({
      rows: () => [configRow({ isActive: false })],
      insertRow: () => configRow(),
    });
    h.db = dbDisabled.db;
    expect(await getWebhookCredentials(INST)).toBeNull();
  });

  it('decrypts the webhook secret for signature verification', async () => {
    const { encryptSecret } = await import('../../shared/utils/encryption.js');
    h.db = makeDb({
      rows: () => [configRow({ webhookSecretEnc: encryptSecret('verify_me') })],
      insertRow: () => configRow(),
    }).db;
    const creds = await getWebhookCredentials(INST);
    expect(creds!.webhookSecret).toBe('verify_me');
  });

  it('configExists reflects row presence', async () => {
    h.db = makeDb({ rows: () => [], insertRow: () => configRow() }).db;
    expect(await configExists(INST)).toBe(false);
    h.db = makeDb({ rows: () => [configRow()], insertRow: () => configRow() }).db;
    expect(await configExists(INST)).toBe(true);
  });
});
