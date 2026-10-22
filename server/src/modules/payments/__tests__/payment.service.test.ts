import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash, createHmac } from 'crypto';
import { getTableName } from 'drizzle-orm';

/**
 * PaymentService unit tests — DB layer replaced by a queue-based chainable
 * mock keyed by (operation | table | for-update | limit | returning).
 * Signature verification uses REAL crypto (only the SDK HTTP client is mocked).
 */

const h = vi.hoisted(() => ({
  db: null as any,
  txRunner: null as ((cb: any) => any) | null,
  findUser: vi.fn(),
  findUserById: vi.fn(),
  findStudentByUsn: vi.fn(),
  findClassSectionId: vi.fn(),
  getMerchantCreds: vi.fn(),
  getWebhookCreds: vi.fn(),
  notifyFeePaid: vi.fn(),
  receiptSeq: 0,
  sdk: {
    ordersCreate: vi.fn(),
    paymentsFetch: vi.fn(),
    paymentsRefund: vi.fn(),
  },
}));

vi.mock('../../shared/db/index.js', () => ({
  get db() {
    return h.db;
  },
  withTransaction: (cb: any) => (h.txRunner ? h.txRunner(cb) : cb(h.db)),
  dbFindUserByIdOrUid: (uid: any) => h.findUser(uid),
  dbFindUserById: (id: any) => h.findUserById(id),
  dbFindStudentByUsnInInstitution: (inst: any, usn: any) => h.findStudentByUsn(inst, usn),
  dbFindStudentClassSectionId: (id: any) => h.findClassSectionId(id),
}));

vi.mock('../payment.config.js', () => ({
  getMerchantCredentials: (inst: any) => h.getMerchantCreds(inst),
  getWebhookCredentials: (inst: any) => h.getWebhookCreds(inst),
}));

vi.mock('../receipt.js', () => ({
  nextReceiptNo: vi.fn(async () => `REC-202610-${String(++h.receiptSeq).padStart(4, '0')}`),
}));

vi.mock('../../notifications/notification.triggers.js', () => ({
  notifyFeePaid: (params: any) => h.notifyFeePaid(params),
}));

vi.mock('razorpay', () => ({
  default: class MockRazorpay {
    orders = { create: h.sdk.ordersCreate };
    payments = { fetch: h.sdk.paymentsFetch, refund: h.sdk.paymentsRefund };
    constructor(_opts: any) {}
  },
}));

import { PaymentService } from '../payment.service.js';

// ────────────────────────────────────────────────────────────── test fixtures

const INST = 'DPS001';
const WH_SECRET = 'whsec_test_secret';
const MERCHANT = { gateway: 'razorpay', keyId: 'rzp_test_1', keySecret: 'ks', webhookSecret: 'ws' };

interface QOp {
  kind: 'select' | 'insert' | 'update' | 'delete';
  table?: any;
  cols?: any;
  where?: any;
  set?: any;
  values?: any;
  hasFor?: boolean;
  hasLimit?: boolean;
  hasReturning?: boolean;
  conflict?: string;
  conflictOpts?: any;
}

function newDbMock() {
  const queues = new Map<string, any[]>();
  const captured: QOp[] = [];

  const keyOf = (op: QOp) =>
    [
      op.kind,
      op.table ? getTableName(op.table) : '?',
      op.hasFor ? 'for' : '',
      op.hasLimit ? 'lim' : '',
      op.hasReturning ? 'ret' : '',
      op.conflict || '',
    ]
      .filter(Boolean)
      .join('|');

  const push = (key: string, ...vals: any[]) => {
    if (!queues.has(key)) queues.set(key, []);
    queues.get(key)!.push(...vals);
  };

  function chain(op: QOp): any {
    const c: any = {
      from: (t: any) => {
        op.table = t;
        return c;
      },
      where: (w: any) => {
        op.where = w;
        return c;
      },
      set: (v: any) => {
        op.set = v;
        return c;
      },
      values: (v: any) => {
        op.values = v;
        return c;
      },
      limit: () => {
        op.hasLimit = true;
        return c;
      },
      offset: () => c,
      orderBy: () => c,
      for: () => {
        op.hasFor = true;
        return c;
      },
      returning: () => {
        op.hasReturning = true;
        return c;
      },
      onConflictDoUpdate: (o: any) => {
        op.conflict = 'update';
        op.conflictOpts = o;
        return c;
      },
      onConflictDoNothing: () => {
        op.conflict = 'nothing';
        return c;
      },
      then: (resolve: any, reject: any) => {
        captured.push(op);
        const q = queues.get(keyOf(op));
        let result: any;
        if (q && q.length > 0) {
          result = q.shift();
        } else {
          // Drizzle semantics: SELECTs and RETURNING clauses always yield an
          // array; plain writes resolve undefined.
          result =
            op.kind === 'select' || op.hasReturning ? [] : undefined;
        }
        if (result instanceof Error) return Promise.reject(result).then(resolve, reject);
        return Promise.resolve(result).then(resolve, reject);
      },
      catch: (onRejected: any) =>
        (async () => {
          try {
            return await c;
          } catch (err) {
            return onRejected(err);
          }
        })(),
      finally: (onFinally: any) =>
        (async () => {
          try {
            return await c;
          } finally {
            onFinally();
          }
        })(),
    };
    return c;
  }

  return {
    captured,
    push,
    db: {
      select: (cols?: any) => chain({ kind: 'select', cols }),
      insert: (t: any) => chain({ kind: 'insert', table: t }),
      update: (t: any) => chain({ kind: 'update', table: t }),
      delete: (t: any) => chain({ kind: 'delete', table: t }),
    },
  };
}

type DbMock = ReturnType<typeof newDbMock>;
let dbMock: DbMock;

function feeRow(id: string, amount: any, over: Record<string, any> = {}) {
  return {
    id,
    institutionCode: INST,
    title: `Fee ${id}`,
    amount,
    status: 'active',
    classSectionId: null,
    category: 'tuition',
    dueDate: null,
    ...over,
  };
}

function orderRow(over: Record<string, any> = {}) {
  const now = new Date();
  return {
    id: 'ord_1',
    institutionCode: INST,
    studentId: 'stu_1',
    payerUid: 'uid_parent',
    payerRole: 'parent',
    amountPaise: 3075,
    currency: 'INR',
    status: 'created',
    gateway: 'razorpay',
    gatewayOrderId: 'order_GW1',
    gatewayPaymentId: null,
    method: null,
    failureReason: null,
    feeStructureIds: [
      { id: 'fs_1', amountPaise: 1050 },
      { id: 'fs_2', amountPaise: 2025 },
    ],
    webhookEventId: null,
    gatewayCallback: null,
    expiresAt: new Date(Date.now() + 3_600_000),
    paidAt: null,
    createdAt: now,
    updatedAt: now,
    ...over,
  };
}

function ops(kind: QOp['kind'], table: any, match?: (op: QOp) => boolean) {
  const name = typeof table === 'string' ? table : getTableName(table);
  return dbMock.captured.filter(
    (op) => op.kind === kind && op.table && getTableName(op.table) === name && (!match || match(op))
  );
}

function sign(body: Buffer, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

function bodyCaptured(entity: Record<string, any> = {}): Buffer {
  return Buffer.from(
    JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_1',
            order_id: 'order_GW1',
            amount: 3075,
            currency: 'INR',
            method: 'upi',
            status: 'captured',
            notes: { orderId: 'ord_1' },
            ...entity,
          },
        },
      },
    }),
    'utf8'
  );
}

function bodyFailed(): Buffer {
  return Buffer.from(
    JSON.stringify({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_f',
            order_id: 'order_GW1',
            amount: 3075,
            currency: 'INR',
            method: 'card',
            status: 'failed',
            error_description: 'Customer dropped the transaction',
            notes: { orderId: 'ord_1' },
          },
        },
      },
    }),
    'utf8'
  );
}

function bodyAuthorized(): Buffer {
  return Buffer.from(
    JSON.stringify({
      event: 'payment.authorized',
      payload: {
        payment: {
          entity: {
            id: 'pay_a',
            order_id: 'order_GW1',
            amount: 3075,
            currency: 'INR',
            method: 'upi',
            status: 'authorized',
            notes: { orderId: 'ord_1' },
          },
        },
      },
    }),
    'utf8'
  );
}

function bodyRefund(amount = 3075): Buffer {
  return Buffer.from(
    JSON.stringify({
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: 'rfnd_1',
            payment_id: 'pay_1',
            amount,
            currency: 'INR',
            notes: { orderId: 'ord_1' },
          },
        },
      },
    }),
    'utf8'
  );
}

const svc = new PaymentService();

beforeEach(() => {
  dbMock = newDbMock();
  h.db = dbMock.db;
  h.txRunner = null;
  h.receiptSeq = 0;
  h.findUser.mockReset();
  h.findUserById.mockReset();
  h.findStudentByUsn.mockReset();
  h.findClassSectionId.mockReset();
  h.getMerchantCreds.mockReset();
  h.getWebhookCreds.mockReset();
  h.notifyFeePaid.mockReset();
  h.sdk.ordersCreate.mockReset();
  h.sdk.paymentsFetch.mockReset();
  h.sdk.paymentsRefund.mockReset();
  h.getMerchantCreds.mockResolvedValue(MERCHANT);
  h.getWebhookCreds.mockImplementation(async (inst: string) =>
    inst === INST
      ? { ...MERCHANT, webhookSecret: WH_SECRET }
      : { ...MERCHANT, keyId: 'rzp_test_2', webhookSecret: 'whsec_other_tenant' }
  );
});

// ──────────────────────────────────────────────────── payer resolution

describe('resolvePayerStudent (payer NEVER comes from client input)', () => {
  it('resolves a parent through their linked student (parent_links / legacy scope fallback)', async () => {
    const parentAcct = {
      id: 'par_1',
      role: 'parent',
      institutionCode: INST,
      scope: '{"linkedStudentUSN":"USN7"}',
    };
    h.findUser.mockResolvedValue(parentAcct);
    h.findUserById.mockImplementation(async (id: any) =>
      id === 'par_1' ? parentAcct : { id, fullName: 'Kid Nine', institutionCode: INST, role: 'student' }
    );
    h.findStudentByUsn.mockResolvedValue({ id: 'stu_9', fullName: 'Kid Nine' });
    const student = await svc.resolvePayerStudent(INST, { uid: 'uid_par', role: 'parent' });
    expect(student).toEqual({ id: 'stu_9', fullName: 'Kid Nine' });
    expect(h.findStudentByUsn).toHaveBeenCalledWith(INST, 'USN7');
  });

  it('rejects a stranger parent with no linked student (403 NO_LINKED_STUDENT)', async () => {
    const parentAcct = { id: 'par_1', role: 'parent', institutionCode: INST, scope: '{}' };
    h.findUser.mockResolvedValue(parentAcct);
    h.findUserById.mockResolvedValue(parentAcct);
    await expect(
      svc.resolvePayerStudent(INST, { uid: 'uid_par', role: 'parent' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'NO_LINKED_STUDENT' });
  });

  it('rejects a parent whose linked student is missing (403)', async () => {
    const parentAcct = {
      id: 'par_1',
      role: 'parent',
      institutionCode: INST,
      scope: { linkedStudentUSN: 'GHOST' },
    };
    h.findUser.mockResolvedValue(parentAcct);
    h.findUserById.mockResolvedValue(parentAcct);
    h.findStudentByUsn.mockResolvedValue(undefined);
    await expect(
      svc.resolvePayerStudent(INST, { uid: 'uid_par', role: 'parent' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'NO_LINKED_STUDENT' });
  });

  it('rejects a parent from another tenant (403 FORBIDDEN)', async () => {
    h.findUser.mockResolvedValue({
      id: 'par_1',
      role: 'parent',
      institutionCode: 'OTHER01',
      scope: { linkedStudentUSN: 'USN7' },
    });
    await expect(
      svc.resolvePayerStudent(INST, { uid: 'uid_par', role: 'parent' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(h.findStudentByUsn).not.toHaveBeenCalled();
  });

  it('rejects a session role that is not the account role (403)', async () => {
    h.findUser.mockResolvedValue({ id: 'stu_x', role: 'student', institutionCode: INST });
    await expect(
      svc.resolvePayerStudent(INST, { uid: 'uid_x', role: 'parent' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });

  it('resolves a student payer to their own account', async () => {
    h.findUser.mockResolvedValue({ id: 'stu_1', role: 'student', institutionCode: INST, fullName: 'A Kid' });
    const student = await svc.resolvePayerStudent(INST, { uid: 'uid_stu', role: 'student' });
    expect(student).toEqual({ id: 'stu_1', fullName: 'A Kid' });
  });

  it('rejects admin/teacher sessions (403)', async () => {
    await expect(
      svc.resolvePayerStudent(INST, { uid: 'uid_admin', role: 'admin' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });

  it('rejects a student session whose account belongs to another tenant (403)', async () => {
    h.findUser.mockResolvedValue({ id: 'stu_1', role: 'student', institutionCode: 'OTHER01' });
    await expect(
      svc.resolvePayerStudent(INST, { uid: 'uid_stu', role: 'student' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });
});

// ──────────────────────────────────────────────────────── createOrder

describe('createOrder', () => {
  beforeEach(() => {
    const parentAcct = {
      id: 'uid_parent',
      role: 'parent',
      institutionCode: INST,
      scope: { linkedStudentUSN: 'USN1' },
    };
    h.findUser.mockResolvedValue(parentAcct);
    h.findUserById.mockImplementation(async (id: any) =>
      id === 'uid_parent' ? parentAcct : { id, fullName: 'Kid One', institutionCode: INST, role: 'student' }
    );
    h.findStudentByUsn.mockResolvedValue({ id: 'stu_1', fullName: 'Kid One' });
    h.findClassSectionId.mockResolvedValue('cs1');
  });

  function queueHappyFees() {
    dbMock.push('select|fee_structures', [feeRow('fs_1', 10.5), feeRow('fs_2', 20.25)]);
    dbMock.push('select|fee_payments', []);
  }

  it('throws 503 DB_UNAVAILABLE without a database', async () => {
    h.db = null;
    await expect(
      svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, { feeStructureIds: ['fs_1'] })
    ).rejects.toMatchObject({ statusCode: 503, code: 'DB_UNAVAILABLE' });
    expect(h.findUser).not.toHaveBeenCalled();
  });

  it('derives the amount server-side from fee rows (integer paise) and creates the gateway order', async () => {
    queueHappyFees();
    dbMock.push('select|payment_orders|lim', []);
    dbMock.push('insert|payment_orders|ret', [{ id: 'ord_1' }]);
    h.sdk.ordersCreate.mockResolvedValue({ id: 'order_GW1' });

    const result = await svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, {
      feeStructureIds: ['fs_1', 'fs_2'],
    });

    expect(result).toMatchObject({
      orderId: 'ord_1',
      gatewayOrderId: 'order_GW1',
      keyId: 'rzp_test_1',
      amountPaise: 3075,
      currency: 'INR',
    });
    expect(result.expiresAt).toEqual(expect.any(String));

    const [insert] = ops('insert', 'payment_orders');
    expect(insert!.values).toMatchObject({
      institutionCode: INST,
      studentId: 'stu_1',
      payerUid: 'uid_parent',
      amountPaise: 3075,
      status: 'created',
    });
    expect(insert!.values.feeStructureIds).toEqual([
      { id: 'fs_1', amountPaise: 1050 },
      { id: 'fs_2', amountPaise: 2025 },
    ]);

    expect(h.sdk.ordersCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 3075,
        currency: 'INR',
        receipt: 'ord_1',
        notes: { orderId: 'ord_1', institutionCode: INST, studentId: 'stu_1' },
        expire_by: expect.any(Number),
      })
    );
  });

  it('rejects fee rows from another tenant (400 FEE_NOT_FOUND)', async () => {
    dbMock.push('select|fee_structures', []); // tenant-scoped query finds nothing
    await expect(
      svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, { feeStructureIds: ['fs_evil'] })
    ).rejects.toMatchObject({ statusCode: 400, code: 'FEE_NOT_FOUND' });
  });

  it('rejects fees that do not apply to the student class (400 FEE_NOT_ELIGIBLE)', async () => {
    dbMock.push('select|fee_structures', [feeRow('fs_1', 10, { classSectionId: 'cs_OTHER' })]);
    dbMock.push('select|fee_payments', []);
    h.findClassSectionId.mockResolvedValue('cs1');
    await expect(
      svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, { feeStructureIds: ['fs_1'] })
    ).rejects.toMatchObject({ statusCode: 400, code: 'FEE_NOT_ELIGIBLE' });
  });

  it('blocks double-payment of already-paid lines (409 ALREADY_PAID)', async () => {
    dbMock.push('select|fee_structures', [feeRow('fs_1', 10)]);
    dbMock.push('select|fee_payments', [{ feeStructureId: 'fs_1' }]);
    await expect(
      svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, { feeStructureIds: ['fs_1'] })
    ).rejects.toMatchObject({ statusCode: 409, code: 'ALREADY_PAID' });
  });

  it('rejects a non-positive fee amount (400 INVALID_FEE_AMOUNT)', async () => {
    dbMock.push('select|fee_structures', [feeRow('fs_1', -5)]);
    dbMock.push('select|fee_payments', []);
    await expect(
      svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, { feeStructureIds: ['fs_1'] })
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_FEE_AMOUNT' });
    expect(h.getMerchantCreds).not.toHaveBeenCalled();
  });

  it('resumes an identical open order instead of creating a second one', async () => {
    dbMock.push('select|fee_structures', [feeRow('fs_1', 10.5)]);
    dbMock.push('select|fee_payments', []);
    dbMock.push('select|payment_orders|lim', [
      orderRow({
        gatewayOrderId: 'order_EXISTING',
        feeStructureIds: [{ id: 'fs_1', amountPaise: 1050 }],
      }),
    ]);

    const result = await svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, {
      feeStructureIds: ['fs_1'],
    });
    expect(result).toMatchObject({ orderId: 'ord_1', gatewayOrderId: 'order_EXISTING' });
    expect(dbMock.captured.filter((c) => c.kind === 'insert')).toHaveLength(0);
    expect(h.sdk.ordersCreate).not.toHaveBeenCalled();
  });

  it('409s when a different open order is already in progress', async () => {
    dbMock.push('select|fee_structures', [feeRow('fs_2', 10)]);
    dbMock.push('select|fee_payments', []);
    dbMock.push('select|payment_orders|lim', [
      orderRow({ gatewayOrderId: 'order_OTHER', feeStructureIds: [{ id: 'fs_1', amountPaise: 1050 }] }),
    ]);

    await expect(
      svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, { feeStructureIds: ['fs_2'] })
    ).rejects.toMatchObject({ statusCode: 409, code: 'OPEN_ORDER_EXISTS' });
  });

  it('409s with OPEN_ORDER_RETRY when the open order has no gateway link yet (<60s old)', async () => {
    dbMock.push('select|fee_structures', [feeRow('fs_1', 10)]);
    dbMock.push('select|fee_payments', []);
    dbMock.push('select|payment_orders|lim', [
      orderRow({ gatewayOrderId: null, createdAt: new Date() }),
    ]);
    await expect(
      svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, { feeStructureIds: ['fs_1'] })
    ).rejects.toMatchObject({ statusCode: 409, code: 'OPEN_ORDER_RETRY' });
  });

  it('cleans up a stale half-created orphan and proceeds with a fresh order', async () => {
    dbMock.push('select|fee_structures', [feeRow('fs_1', 10.5)]);
    dbMock.push('select|fee_payments', []);
    dbMock.push('select|payment_orders|lim', [
      orderRow({ gatewayOrderId: null, createdAt: new Date(Date.now() - 120_000) }),
    ]);
    dbMock.push('insert|payment_orders|ret', [{ id: 'ord_2' }]);
    h.sdk.ordersCreate.mockResolvedValue({ id: 'order_GW2' });

    const result = await svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, {
      feeStructureIds: ['fs_1'],
    });
    expect(result.orderId).toBe('ord_2');
    const cleanup = ops('update', 'payment_orders', (op) => op.set?.failureReason === 'Gateway order link missing');
    expect(cleanup).toHaveLength(1);
    expect(cleanup[0].set!.status).toBe('failed');
  });

  it('handles a create race (23505) by resuming the winner order', async () => {
    dbMock.push('select|fee_structures', [feeRow('fs_1', 10.5)]);
    dbMock.push('select|fee_payments', []);
    // Two sequential findOpenOrder calls: nothing yet, then the winner.
    dbMock.push('select|payment_orders|lim', []);
    dbMock.push('select|payment_orders|lim', [
      orderRow({
        id: 'ord_win',
        gatewayOrderId: 'order_WIN',
        feeStructureIds: [{ id: 'fs_1', amountPaise: 1050 }],
      }),
    ]);
    dbMock.push(
      'insert|payment_orders|ret',
      Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' })
    );

    const result = await svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, {
      feeStructureIds: ['fs_1'],
    });
    expect(result).toMatchObject({ orderId: 'ord_win', gatewayOrderId: 'order_WIN' });
    expect(h.sdk.ordersCreate).not.toHaveBeenCalled();
  });

  it('409s when the create race has no resumable winner', async () => {
    dbMock.push('select|fee_structures', [feeRow('fs_1', 10.5)]);
    dbMock.push('select|fee_payments', []);
    dbMock.push('select|payment_orders|lim', []); // before the race
    dbMock.push('select|payment_orders|lim', []); // after the race
    dbMock.push(
      'insert|payment_orders|ret',
      Object.assign(new Error('duplicate key'), { code: '23505' })
    );

    await expect(
      svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, { feeStructureIds: ['fs_1'] })
    ).rejects.toMatchObject({ statusCode: 409, code: 'OPEN_ORDER_EXISTS' });
  });

  it('frees the order slot and 502s when gateway order creation fails', async () => {
    queueHappyFees();
    dbMock.push('select|payment_orders|lim', []);
    dbMock.push('insert|payment_orders|ret', [{ id: 'ord_1' }]);
    h.sdk.ordersCreate.mockRejectedValue(new Error('gateway down'));

    await expect(
      svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, { feeStructureIds: ['fs_1', 'fs_2'] })
    ).rejects.toMatchObject({ statusCode: 502, code: 'GATEWAY_ERROR' });

    const failUpdate = ops('update', 'payment_orders', (op) => op.set?.status === 'failed');
    expect(failUpdate).toHaveLength(1);
    expect(failUpdate[0].set!.failureReason).toContain('gateway down');
  });

  it('fails fast (404) when the tenant has no merchant credentials — before any row is written', async () => {
    queueHappyFees();
    h.getMerchantCreds.mockRejectedValue(
      Object.assign(new Error('Online payments are not configured for this institution.'), {
        statusCode: 404,
        code: 'PAYMENT_NOT_CONFIGURED',
      })
    );
    await expect(
      svc.createOrder(INST, { uid: 'uid_parent', role: 'parent' }, { feeStructureIds: ['fs_1', 'fs_2'] })
    ).rejects.toMatchObject({ statusCode: 404, code: 'PAYMENT_NOT_CONFIGURED' });
    expect(dbMock.captured.filter((c) => c.kind === 'insert')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────── poll / cancel

describe('pollOrder', () => {
  it('lazy-expires a stale open order on read', async () => {
    const stale = orderRow({ expiresAt: new Date(Date.now() - 1000), status: 'created' });
    dbMock.push('select|payment_orders|lim', [stale]);
    dbMock.push('update|payment_orders|ret', [{ ...stale, status: 'expired' }]);

    const res = await svc.pollOrder(INST, 'ord_1', 'uid_parent');
    expect(res.status).toBe('expired');
    const updates = ops('update', 'payment_orders');
    expect(updates).toHaveLength(1);
    expect(updates[0].set!.status).toBe('expired');
  });

  it('404s for an order owned by someone else (no IDOR probing)', async () => {
    dbMock.push('select|payment_orders|lim', [orderRow({ payerUid: 'someone_else' })]);
    await expect(svc.pollOrder(INST, 'ord_1', 'uid_parent')).rejects.toMatchObject({
      statusCode: 404,
      code: 'ORDER_NOT_FOUND',
    });
  });

  it('returns status, amounts, and fee line ids for the owner', async () => {
    const paid = orderRow({
      status: 'paid',
      method: 'upi',
      paidAt: new Date('2026-10-15T10:00:00Z'),
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    dbMock.push('select|payment_orders|lim', [paid]);
    const res = await svc.pollOrder(INST, 'ord_1', 'uid_parent');
    expect(res).toMatchObject({
      status: 'paid',
      amountPaise: 3075,
      method: 'upi',
      feeStructureIds: ['fs_1', 'fs_2'],
    });
    expect(res.paidAt).toBe('2026-10-15T10:00:00.000Z');
    expect(ops('update', 'payment_orders')).toHaveLength(0);
  });
});

describe('cancelOrder', () => {
  it('cancels an open order (frees the one-open-order slot)', async () => {
    dbMock.push('select|payment_orders|lim', [orderRow({ status: 'created' })]);
    dbMock.push('update|payment_orders|ret', [{ ...orderRow(), status: 'cancelled' }]);
    const res = await svc.cancelOrder(INST, 'ord_1', 'uid_parent');
    expect(res).toEqual({ orderId: 'ord_1', status: 'cancelled' });
  });

  it('rejects cancelling a paid order (409 ORDER_NOT_CANCELLABLE)', async () => {
    dbMock.push('select|payment_orders|lim', [orderRow({ status: 'paid' })]);
    await expect(svc.cancelOrder(INST, 'ord_1', 'uid_parent')).rejects.toMatchObject({
      statusCode: 409,
      code: 'ORDER_NOT_CANCELLABLE',
    });
  });

  it('rejects when the cancel loses a race (409)', async () => {
    dbMock.push('select|payment_orders|lim', [orderRow({ status: 'created' })]);
    dbMock.push('update|payment_orders|ret', []); // guarded UPDATE matched nothing
    await expect(svc.cancelOrder(INST, 'ord_1', 'uid_parent')).rejects.toMatchObject({
      statusCode: 409,
      code: 'ORDER_NOT_CANCELLABLE',
    });
  });

  it('404s for orders the payer does not own', async () => {
    dbMock.push('select|payment_orders|lim', [orderRow({ payerUid: 'other' })]);
    await expect(svc.cancelOrder(INST, 'ord_1', 'uid_parent')).rejects.toMatchObject({
      statusCode: 404,
      code: 'ORDER_NOT_FOUND',
    });
  });
});

// ───────────────────────────────────────────────────── list / refunds

describe('listOrders (accountant reconciliation)', () => {
  it('throws 503 without a database', async () => {
    h.db = null;
    await expect(
      svc.listOrders(INST, { limit: 25, offset: 0 } as any)
    ).rejects.toMatchObject({ statusCode: 503, code: 'DB_UNAVAILABLE' });
  });

  it('joins student names and maps rows for the UI', async () => {
    dbMock.push('select|payment_orders', [{ totalCount: '1' }]);
    dbMock.push('select|payment_orders|lim', [
      orderRow({
        status: 'paid',
        gatewayPaymentId: 'pay_1',
        method: 'upi',
        paidAt: new Date('2026-10-15T09:30:00Z'),
        createdAt: new Date('2026-10-15T09:00:00Z'),
      }),
    ]);
    dbMock.push('select|users', [{ id: 'stu_1', fullName: 'Aarav Sharma', rollNoOrUSN: 'USN9' }]);

    const page = await svc.listOrders(INST, { limit: 25, offset: 0, status: 'paid' } as any);
    expect(page.total).toBe(1);
    expect(page.limit).toBe(25);
    expect(page.orders).toHaveLength(1);
    expect(page.orders[0]).toMatchObject({
      orderId: 'ord_1',
      studentName: 'Aarav Sharma',
      rollNo: 'USN9',
      status: 'paid',
      amountPaise: 3075,
      feeStructureIds: ['fs_1', 'fs_2'],
      paidAt: '2026-10-15T09:30:00.000Z',
      createdAt: '2026-10-15T09:00:00.000Z',
    });
  });
});

describe('refundOrder', () => {
  it('throws 503 without a database', async () => {
    h.db = null;
    await expect(svc.refundOrder(INST, 'ord_1', {})).rejects.toMatchObject({
      statusCode: 503,
      code: 'DB_UNAVAILABLE',
    });
  });

  it('404s for an unknown order', async () => {
    dbMock.push('select|payment_orders|lim', []);
    await expect(svc.refundOrder(INST, 'ghost', {})).rejects.toMatchObject({
      statusCode: 404,
      code: 'ORDER_NOT_FOUND',
    });
  });

  it('rejects refunding an order that never captured (409 REFUND_NOT_ALLOWED)', async () => {
    dbMock.push('select|payment_orders|lim', [orderRow({ status: 'created' })]);
    await expect(svc.refundOrder(INST, 'ord_1', {})).rejects.toMatchObject({
      statusCode: 409,
      code: 'REFUND_NOT_ALLOWED',
    });
    expect(h.sdk.paymentsRefund).not.toHaveBeenCalled();
  });

  it('rejects a paid order without a gateway payment id (409 NO_GATEWAY_PAYMENT)', async () => {
    dbMock.push('select|payment_orders|lim', [
      orderRow({ status: 'paid', gatewayPaymentId: null }),
    ]);
    await expect(svc.refundOrder(INST, 'ord_1', {})).rejects.toMatchObject({
      statusCode: 409,
      code: 'NO_GATEWAY_PAYMENT',
    });
  });

  it('initiates the gateway refund and records a refund_initiated transaction', async () => {
    dbMock.push('select|payment_orders|lim', [
      orderRow({ status: 'paid', gatewayPaymentId: 'pay_1' }),
    ]);
    h.sdk.paymentsRefund.mockResolvedValue({ id: 'rfnd_77', status: 'processed' });

    const res = await svc.refundOrder(INST, 'ord_1', { reason: 'requested by parent' });
    expect(res).toMatchObject({ orderId: 'ord_1', refundId: 'rfnd_77', status: 'processed' });
    expect(res.note).toContain('webhook');

    expect(h.sdk.paymentsRefund).toHaveBeenCalledWith('pay_1', {
      amount: 3075,
      notes: { reason: 'requested by parent' },
    });
    const [txInsert] = ops('insert', 'payment_transactions');
    expect(txInsert!.values).toMatchObject({
      institutionCode: INST,
      status: 'refund_initiated',
      amountPaise: 3075,
      gatewayPaymentId: 'pay_1',
    });
    // Order status must NOT flip here — only the refund.processed webhook does.
    expect(ops('update', 'payment_orders')).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────── the webhook

describe('handleWebhook (the ONLY path to paid)', () => {
  it('404s when the tenant has no webhook configuration', async () => {
    h.getWebhookCreds.mockResolvedValue(null);
    const body = bodyCaptured();
    await expect(svc.handleWebhook(INST, body, sign(body, WH_SECRET))).rejects.toMatchObject({
      statusCode: 404,
      code: 'PAYMENT_NOT_CONFIGURED',
    });
  });

  it('401s on an invalid signature (real HMAC verification)', async () => {
    const body = bodyCaptured();
    await expect(svc.handleWebhook(INST, body, sign(body, 'wrong-secret'))).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_SIGNATURE',
    });
    expect(dbMock.captured).toHaveLength(0);
  });

  it('401s when the webhook hits the wrong tenant path (path selects the secret)', async () => {
    const body = bodyCaptured();
    // signed with DPS001's secret, delivered to the other tenant's endpoint
    await expect(
      svc.handleWebhook('OTHER01', body, sign(body, WH_SECRET))
    ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_SIGNATURE' });
  });

  it('ignores unknown event types after signature verification', async () => {
    const body = Buffer.from(JSON.stringify({ event: 'some.other.event' }), 'utf8');
    const res = await svc.handleWebhook(INST, body, sign(body, WH_SECRET));
    expect(res).toEqual({ result: 'ignored' });
    expect(h.notifyFeePaid).not.toHaveBeenCalled();
  });

  it('payment.captured credits fee lines with receipts and notifies the family', async () => {
    const body = bodyCaptured();
    dbMock.push('select|payment_orders|lim', [orderRow()]);
    dbMock.push('select|payment_orders|for', [orderRow()]);
    dbMock.push('update|payment_orders|ret', [orderRow({ status: 'paid' })]);
    dbMock.push('select|fee_payments|lim', []);

    const res = await svc.handleWebhook(INST, body, sign(body, WH_SECRET));
    expect(res).toEqual({ result: 'processed' });

    const [paidUpdate] = ops('update', 'payment_orders', (op) => op.set?.status === 'paid');
    expect(paidUpdate).toBeDefined();
    expect(paidUpdate!.set).toMatchObject({
      status: 'paid',
      gatewayPaymentId: 'pay_1',
      method: 'upi',
      webhookEventId: createHash('sha256').update(body).digest('hex'),
      failureReason: null,
    });

    const feeInserts = ops('insert', 'fee_payments');
    expect(feeInserts).toHaveLength(2);
    expect(feeInserts[0].values).toMatchObject({
      feeStructureId: 'fs_1',
      amount: '10.50',
      status: 'paid',
      paymentMethod: 'upi',
      paymentOrderId: 'ord_1',
      gatewayPaymentId: 'pay_1',
      createdBy: 'system:webhook',
    });
    expect(feeInserts[1].values).toMatchObject({ feeStructureId: 'fs_2', amount: '20.25' });
    const receipts = feeInserts.map((i) => i.values.receiptNo);
    expect(receipts).toEqual(['REC-202610-0001', 'REC-202610-0002']);
    expect(new Set(receipts).size).toBe(2);

    const [txInsert] = ops('insert', 'payment_transactions');
    expect(txInsert!.values).toMatchObject({ status: 'success', amountPaise: 3075 });

    expect(h.notifyFeePaid).toHaveBeenCalledTimes(1);
    expect(h.notifyFeePaid).toHaveBeenCalledWith(
      expect.objectContaining({
        institutionCode: INST,
        studentId: 'stu_1',
        amount: '30.75',
        receiptNo: 'REC-202610-0002',
        paymentId: 'ord_1',
      })
    );
  });

  it('replay (same raw body delivered twice) credits exactly once', async () => {
    const body = bodyCaptured();
    const eventKey = createHash('sha256').update(body).digest('hex');
    dbMock.push('select|payment_orders|lim', [orderRow()], [orderRow()]);
    dbMock.push(
      'select|payment_orders|for',
      [orderRow()],
      [orderRow({ webhookEventId: eventKey })]
    );
    dbMock.push('update|payment_orders|ret', [orderRow({ status: 'paid' })]); // first delivery only
    dbMock.push('select|fee_payments|lim', []);

    const first = await svc.handleWebhook(INST, body, sign(body, WH_SECRET));
    const second = await svc.handleWebhook(INST, body, sign(body, WH_SECRET));

    expect(first).toEqual({ result: 'processed' });
    expect(second).toEqual({ result: 'processed' });
    expect(ops('insert', 'fee_payments')).toHaveLength(2); // NOT 4
    expect(h.notifyFeePaid).toHaveBeenCalledTimes(1);
  });

  it('transition guard: a paid order is never credited twice by a different event', async () => {
    const body = bodyCaptured({ id: 'pay_second_event' }); // different bytes → new eventKey
    dbMock.push('select|payment_orders|lim', [orderRow({ status: 'paid' })]);
    dbMock.push('select|payment_orders|for', [orderRow({ status: 'paid', paidAt: new Date() })]);
    dbMock.push('update|payment_orders|ret', []); // WHERE status IN creditable → no match

    const res = await svc.handleWebhook(INST, body, sign(body, WH_SECRET));
    expect(res).toEqual({ result: 'processed' });
    expect(ops('insert', 'fee_payments')).toHaveLength(0);
    expect(h.notifyFeePaid).not.toHaveBeenCalled();
  });

  it('transition guard: a refunded order is not re-credited by a late capture', async () => {
    const body = bodyCaptured();
    dbMock.push('select|payment_orders|lim', [orderRow({ status: 'refunded' })]);
    dbMock.push('select|payment_orders|for', [orderRow({ status: 'refunded' })]);
    dbMock.push('update|payment_orders|ret', []);

    const res = await svc.handleWebhook(INST, body, sign(body, WH_SECRET));
    expect(res).toEqual({ result: 'processed' });
    expect(ops('insert', 'fee_payments')).toHaveLength(0);
  });

  it('ignores an amount mismatch (200, no retry) and never enters the transaction', async () => {
    const body = bodyCaptured({ amount: 99999 });
    dbMock.push('select|payment_orders|lim', [orderRow()]);
    h.txRunner = vi.fn(() => {
      throw new Error('TX_MUST_NOT_RUN');
    });

    // Permanent condition — must resolve (not throw) so the gateway stops retrying.
    const res = await svc.handleWebhook(INST, body, sign(body, WH_SECRET));
    expect(res).toEqual({ result: 'ignored' });
    expect(h.txRunner).not.toHaveBeenCalled();
    expect(ops('insert', 'fee_payments')).toHaveLength(0);
    expect(h.notifyFeePaid).not.toHaveBeenCalled();
  });

  it('maps a create race (23505) to duplicate — safe to retry', async () => {
    const body = bodyCaptured();
    dbMock.push('select|payment_orders|lim', [orderRow()]);
    dbMock.push('select|payment_orders|for', [orderRow()]);
    dbMock.push('update|payment_orders|ret', [orderRow({ status: 'paid' })]);
    dbMock.push('select|fee_payments|lim', []);
    dbMock.push(
      'insert|fee_payments',
      Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505' })
    );

    const res = await svc.handleWebhook(INST, body, sign(body, WH_SECRET));
    expect(res).toEqual({ result: 'duplicate' });
    expect(h.notifyFeePaid).not.toHaveBeenCalled();
  });

  it('payment.failed marks the order failed with the gateway reason and never credits', async () => {
    const body = bodyFailed();
    dbMock.push('select|payment_orders|lim', [orderRow()]);
    dbMock.push('select|payment_orders|for', [orderRow()]);
    dbMock.push('update|payment_orders|ret', [orderRow({ status: 'failed' })]);

    const res = await svc.handleWebhook(INST, body, sign(body, WH_SECRET));
    expect(res).toEqual({ result: 'processed' });

    const [failUpdate] = ops('update', 'payment_orders', (op) => op.set?.status === 'failed');
    expect(failUpdate).toBeDefined();
    expect(failUpdate!.set!.failureReason).toBe('Customer dropped the transaction');
    expect(ops('insert', 'fee_payments')).toHaveLength(0);
    const [txInsert] = ops('insert', 'payment_transactions');
    expect(txInsert!.values).toMatchObject({ status: 'failure', amountPaise: 3075 });
    expect(h.notifyFeePaid).not.toHaveBeenCalled();
  });

  it('payment.authorized moves created → authorized without crediting', async () => {
    const body = bodyAuthorized();
    dbMock.push('select|payment_orders|lim', [orderRow()]);
    dbMock.push('select|payment_orders|for', [orderRow()]);

    const res = await svc.handleWebhook(INST, body, sign(body, WH_SECRET));
    expect(res).toEqual({ result: 'processed' });
    const [authUpdate] = ops('update', 'payment_orders', (op) => op.set?.status === 'authorized');
    expect(authUpdate).toBeDefined();
    expect(authUpdate!.set!.gatewayPaymentId).toBe('pay_a');
    expect(ops('insert', 'fee_payments')).toHaveLength(0);
    expect(h.notifyFeePaid).not.toHaveBeenCalled();
  });

  it('refund.processed (full) marks the order and its fee lines refunded', async () => {
    const body = bodyRefund(3075);
    const paidOrder = orderRow({ status: 'paid', gatewayPaymentId: 'pay_1' });
    dbMock.push('select|payment_orders|lim', [paidOrder]);
    dbMock.push('select|payment_orders|for', [paidOrder]);
    dbMock.push('update|payment_orders|ret', [{ ...paidOrder, status: 'refunded' }]);

    const res = await svc.handleWebhook(INST, body, sign(body, WH_SECRET));
    expect(res).toEqual({ result: 'processed' });

    const [update] = ops('update', 'payment_orders', (op) => op.set?.status === 'refunded');
    expect(update).toBeDefined();
    const [feeUpdate] = ops('update', 'fee_payments');
    expect(feeUpdate).toBeDefined();
    expect(feeUpdate!.set!.status).toBe('refunded');
    const [txInsert] = ops('insert', 'payment_transactions');
    expect(txInsert!.values).toMatchObject({ status: 'refund_processed', amountPaise: 3075 });
    expect(h.notifyFeePaid).not.toHaveBeenCalled();
  });

  it('refund.processed (partial) keeps the order partially_refunded without flipping fee lines', async () => {
    const body = bodyRefund(1000);
    const paidOrder = orderRow({ status: 'paid', gatewayPaymentId: 'pay_1' });
    dbMock.push('select|payment_orders|lim', [paidOrder]);
    dbMock.push('select|payment_orders|for', [paidOrder]);
    dbMock.push('update|payment_orders|ret', [{ ...paidOrder, status: 'partially_refunded' }]);

    const res = await svc.handleWebhook(INST, body, sign(body, WH_SECRET));
    expect(res).toEqual({ result: 'processed' });
    const [update] = ops(
      'update',
      'payment_orders',
      (op) => op.set?.status === 'partially_refunded'
    );
    expect(update).toBeDefined();
    expect(ops('update', 'fee_payments')).toHaveLength(0);
    const [txInsert] = ops('insert', 'payment_transactions');
    expect(txInsert!.values).toMatchObject({ status: 'refund_processed', amountPaise: 1000 });
  });

  it('500s (gateway retries) when the order row is not visible yet', async () => {
    const body = bodyCaptured();
    dbMock.push('select|payment_orders|lim', []);
    await expect(svc.handleWebhook(INST, body, sign(body, WH_SECRET))).rejects.toMatchObject({
      statusCode: 500,
      code: 'ORDER_NOT_FOUND',
    });
  });

  it('404s when the located order belongs to a different tenant than the path', async () => {
    const body = bodyCaptured();
    dbMock.push('select|payment_orders|lim', [orderRow({ institutionCode: 'OTHER01' })]);
    await expect(svc.handleWebhook(INST, body, sign(body, WH_SECRET))).rejects.toMatchObject({
      statusCode: 404,
      code: 'ORDER_NOT_FOUND',
    });
    // Tenant check runs before withTransaction — nothing may be written.
    expect(ops('insert', 'fee_payments')).toHaveLength(0);
    expect(ops('update', 'payment_orders')).toHaveLength(0);
  });

  it('never lets a notification failure fail the webhook', async () => {
    const body = bodyCaptured();
    dbMock.push('select|payment_orders|lim', [orderRow()]);
    dbMock.push('select|payment_orders|for', [orderRow()]);
    dbMock.push('update|payment_orders|ret', [orderRow({ status: 'paid' })]);
    dbMock.push('select|fee_payments|lim', []);
    h.notifyFeePaid.mockImplementation(() => {
      throw new Error('notification backend exploded');
    });

    const res = await svc.handleWebhook(INST, body, sign(body, WH_SECRET));
    expect(res).toEqual({ result: 'processed' });
  });
});

// ──────────────────────────────────────────────────────────── sweeper

describe('expireStaleOrders', () => {
  it('returns 0 without a database', async () => {
    h.db = null;
    expect(await svc.expireStaleOrders()).toBe(0);
  });

  it('expires stale open orders across tenants and returns the count', async () => {
    dbMock.push('update|payment_orders|ret', [{ id: 'a' }, { id: 'b' }]);
    expect(await svc.expireStaleOrders()).toBe(2);
    const updates = ops('update', 'payment_orders');
    expect(updates).toHaveLength(1);
    expect(updates[0].set!.status).toBe('expired');
  });
});
