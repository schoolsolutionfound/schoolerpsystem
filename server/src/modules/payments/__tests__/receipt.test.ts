import { describe, it, expect, beforeEach } from 'vitest';
import { nextReceiptNo } from '../receipt.js';

/**
 * nextReceiptNo must run inside a transaction (SELECT ... FOR UPDATE on the
 * per-institution sequence row). The mock tx simulates that locked row with
 * state that persists across calls within a test.
 */

interface SeqState {
  row: any; // null → no sequence row exists
}

function makeTx(state: SeqState) {
  const updates: any[] = [];
  const inserts: any[] = [];
  const selects: any[] = [];

  function chain(kind: 'insert' | 'select' | 'update', op: any = {}) {
    const c: any = {
      from: (t: any) => {
        op.table = t;
        return c;
      },
      where: () => c,
      for: () => {
        op.locked = true;
        return c;
      },
      values: (v: any) => {
        op.values = v;
        return c;
      },
      set: (v: any) => {
        op.set = v;
        return c;
      },
      onConflictDoNothing: () => {
        op.conflict = 'nothing';
        return c;
      },
      then: (res: any, rej: any) => {
        let result: any;
        if (kind === 'insert') {
          inserts.push(op);
          // onConflictDoNothing: the row may already exist — state untouched.
          result = undefined;
        } else if (kind === 'select') {
          selects.push(op);
          // FOR UPDATE always re-reads the current locked row.
          result = state.row ? [state.row] : [];
        } else {
          updates.push(op);
          state.row = { ...state.row, ...op.set };
          result = undefined;
        }
        return Promise.resolve(result).then(res, rej);
      },
    };
    return c;
  }

  return {
    inserts,
    updates,
    selects,
    tx: {
      insert: () => chain('insert'),
      select: () => chain('select'),
      update: () => chain('update'),
    },
  };
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

beforeEach(() => {
  // no global state — each test builds its own tx
});

describe('nextReceiptNo (per-institution sequence, FOR UPDATE)', () => {
  it('formats REC-YYYYMM-NNNN from the current UTC month', async () => {
    const state: SeqState = { row: { institutionCode: 'DPS', period: currentPeriod(), nextSeq: 6 } };
    const { tx } = makeTx(state);
    const receipt = await nextReceiptNo(tx, 'DPS');
    expect(receipt).toBe(`REC-${currentPeriod()}-0007`);
  });

  it('increments the sequence on consecutive allocations (unique receipts)', async () => {
    const state: SeqState = { row: { institutionCode: 'DPS', period: currentPeriod(), nextSeq: 0 } };
    const { tx } = makeTx(state);
    const a = await nextReceiptNo(tx, 'DPS');
    const b = await nextReceiptNo(tx, 'DPS');
    const c = await nextReceiptNo(tx, 'DPS');
    expect([a, b, c]).toEqual([
      `REC-${currentPeriod()}-0001`,
      `REC-${currentPeriod()}-0002`,
      `REC-${currentPeriod()}-0003`,
    ]);
    expect(new Set([a, b, c]).size).toBe(3);
    expect(state.row.nextSeq).toBe(3);
  });

  it('always matches the receipt format', async () => {
    const state: SeqState = { row: { institutionCode: 'DPS', period: currentPeriod(), nextSeq: 99 } };
    const { tx } = makeTx(state);
    const receipt = await nextReceiptNo(tx, 'DPS');
    expect(receipt).toMatch(/^REC-\d{6}-\d{4}$/);
  });

  it('resets the sequence when the month rolls over', async () => {
    const state: SeqState = { row: { institutionCode: 'DPS', period: '199901', nextSeq: 421 } };
    const { tx } = makeTx(state);
    const receipt = await nextReceiptNo(tx, 'DPS');
    expect(receipt).toBe(`REC-${currentPeriod()}-0001`);
    expect(state.row.period).toBe(currentPeriod());
    expect(state.row.nextSeq).toBe(1);
  });

  it('bootstraps the sequence row (insert with onConflictDoNothing) on first use', async () => {
    const state: SeqState = { row: null };
    const { tx, inserts } = makeTx(state);
    // Row already exists in DB (created concurrently) — insert is a no-op,
    // select then finds it.
    state.row = { institutionCode: 'DPS', period: currentPeriod(), nextSeq: 0 };
    const receipt = await nextReceiptNo(tx, 'DPS');
    expect(receipt).toBe(`REC-${currentPeriod()}-0001`);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].conflict).toBe('nothing');
    expect(inserts[0].values).toMatchObject({ institutionCode: 'DPS' });
  });

  it('throws RECEIPT_SEQUENCE_FAILED when the locked row is missing', async () => {
    const state: SeqState = { row: null };
    const { tx } = makeTx(state);
    try {
      await nextReceiptNo(tx, 'DPS');
      expect.unreachable('should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('RECEIPT_SEQUENCE_FAILED');
      expect(err.statusCode).toBe(500);
    }
  });

  it('locks the row with SELECT ... FOR UPDATE inside the tx', async () => {
    const state: SeqState = { row: { institutionCode: 'DPS', period: currentPeriod(), nextSeq: 0 } };
    const { tx, selects } = makeTx(state);
    await nextReceiptNo(tx, 'DPS');
    expect(selects).toHaveLength(1);
    expect(selects[0].locked).toBe(true);
    expect(state.row.nextSeq).toBe(1);
  });
});
