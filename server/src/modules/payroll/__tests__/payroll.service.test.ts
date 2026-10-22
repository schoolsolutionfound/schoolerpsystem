import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../payroll.repository.js', () => ({
  payrollRepository: {
    listStaff: vi.fn(),
    listUsersByIds: vi.fn(),
    listActiveByUserIds: vi.fn(),
    createSchedule: vi.fn(),
    listSchedules: vi.fn(),
    getSchedule: vi.fn(),
    listActiveSchedulesAll: vi.fn(),
    updateSchedule: vi.fn(),
    getScheduleBalances: vi.fn(),
    listRowsForSchedule: vi.fn(),
    listPendingRowsForSchedule: vi.fn(),
    listDueDates: vi.fn(),
    insertExpenseRow: vi.fn(),
    updateExpenseRow: vi.fn(),
    bumpLastGeneratedKey: vi.fn(),
    markOverduePast: vi.fn(),
  },
}));

import {
  computeDuePeriods,
  computeNextDueDate,
  allocatePayment,
  validateScheduleConfig,
  clampDay,
  dateKey,
  round2,
  ScheduleConfig,
} from '../payroll.service.js';

const d = (s: string) => new Date(s + 'T00:00:00');

describe('computeDuePeriods — monthly', () => {
  const today = d('2026-10-19');

  it('returns every due month up to today, oldest first (start month skipped when payday < start)', () => {
    const cfg: ScheduleConfig = { frequency: 'monthly', startDate: '2026-07-15', dayOfMonth: 5 };
    const periods = computeDuePeriods(cfg, today, null);
    expect(periods.map((p) => p.key)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(periods[0].date).toBe('2026-08-05');
    expect(periods[2].date).toBe('2026-10-05');
  });

  it('skips the start month when its payday is before the start date', () => {
    const cfg: ScheduleConfig = { frequency: 'monthly', startDate: '2026-10-20', dayOfMonth: 5 };
    const periods = computeDuePeriods(cfg, today, null);
    expect(periods.map((p) => p.key)).toEqual([]); // Oct 5 < start; Nov 5 > today
  });

  it('includes a payday falling on/after the start date', () => {
    const cfg: ScheduleConfig = { frequency: 'monthly', startDate: '2026-10-05', dayOfMonth: 5 };
    expect(computeDuePeriods(cfg, today, null).map((p) => p.date)).toEqual(['2026-10-05']);
  });

  it('clamps day 31 to shorter months (Feb = 28/29)', () => {
    const cfg: ScheduleConfig = { frequency: 'monthly', startDate: '2026-12-01', dayOfMonth: 31 };
    const periods = computeDuePeriods(cfg, d('2027-04-10'), null);
    const byKey = Object.fromEntries(periods.map((p) => [p.key, p.date]));
    expect(byKey['2027-01']).toBe('2027-01-31');
    expect(byKey['2027-02']).toBe('2027-02-28'); // 2027 not a leap year
    expect(byKey['2027-03']).toBe('2027-03-31');
    expect(byKey['2027-04']).toBeUndefined(); // Apr 30 > today (Apr 10)
  });

  it('only returns periods newer than lastGeneratedKey (no duplicates)', () => {
    const cfg: ScheduleConfig = { frequency: 'monthly', startDate: '2026-07-01', dayOfMonth: 5 };
    const periods = computeDuePeriods(cfg, today, '2026-08');
    expect(periods.map((p) => p.key)).toEqual(['2026-09', '2026-10']);
  });

  it('respects the flood cap', () => {
    const cfg: ScheduleConfig = { frequency: 'monthly', startDate: '1990-01-01', dayOfMonth: 1 };
    expect(computeDuePeriods(cfg, today, null, 10).length).toBe(10);
  });
});

describe('computeDuePeriods — days_of_month', () => {
  it('generates 1st and 15th of each month', () => {
    const cfg: ScheduleConfig = { frequency: 'days_of_month', startDate: '2026-09-20', daysOfMonth: [1, 15] };
    const periods = computeDuePeriods(cfg, d('2026-10-19'), null);
    expect(periods.map((p) => p.date)).toEqual(['2026-10-01', '2026-10-15']);
  });

  it('skips days before the start date and clamps invalid days', () => {
    const cfg: ScheduleConfig = { frequency: 'days_of_month', startDate: '2026-10-01', daysOfMonth: [15, 31] };
    const periods = computeDuePeriods(cfg, d('2026-11-30'), null);
    expect(periods.map((p) => p.date)).toEqual(['2026-10-15', '2026-10-31', '2026-11-15', '2026-11-30']);
  });
});

describe('computeDuePeriods — weekly', () => {
  it('aligns to the requested weekday (Mon=1) then steps 7 days', () => {
    // start Wed 2026-10-14, payday Monday
    const cfg: ScheduleConfig = { frequency: 'weekly', startDate: '2026-10-14', weekday: 1 };
    const periods = computeDuePeriods(cfg, d('2026-11-04'), null);
    expect(periods.map((p) => p.date)).toEqual(['2026-10-19', '2026-10-26', '2026-11-02']);
    for (const p of periods) expect(d(p.date).getDay()).toBe(1);
  });

  it('weekday equal to the start weekday starts on the start date', () => {
    const cfg: ScheduleConfig = { frequency: 'weekly', startDate: '2026-10-19', weekday: 1 }; // Monday
    expect(computeDuePeriods(cfg, d('2026-10-25'), null).map((p) => p.date)).toEqual(['2026-10-19']);
  });
});

describe('computeDuePeriods — daily', () => {
  it('generates one row per day from start to today', () => {
    const cfg: ScheduleConfig = { frequency: 'daily', startDate: '2026-10-17' };
    expect(computeDuePeriods(cfg, today20261019(), null).map((p) => p.date)).toEqual([
      '2026-10-17',
      '2026-10-18',
      '2026-10-19',
    ]);
  });
});

function today20261019() {
  return d('2026-10-19');
}

describe('computeNextDueDate', () => {
  const today = d('2026-10-19');

  it('monthly: next future payday (clamped)', () => {
    expect(
      computeNextDueDate({ frequency: 'monthly', startDate: '2026-01-01', dayOfMonth: 25 }, today),
    ).toBe('2026-10-25');
    expect(
      computeNextDueDate({ frequency: 'monthly', startDate: '2026-01-01', dayOfMonth: 10 }, today),
    ).toBe('2026-11-10');
    expect(
      computeNextDueDate({ frequency: 'monthly', startDate: '2026-01-01', dayOfMonth: 31 }, today),
    ).toBe('2026-10-31');
  });

  it('weekly: next occurrence of the weekday', () => {
    expect(
      computeNextDueDate({ frequency: 'weekly', startDate: '2026-10-14', weekday: 1 }, today),
    ).toBe('2026-10-26');
  });

  it('daily: tomorrow, or the start date if later', () => {
    expect(computeNextDueDate({ frequency: 'daily', startDate: '2026-09-01' }, today)).toBe('2026-10-20');
    expect(computeNextDueDate({ frequency: 'daily', startDate: '2026-11-02' }, today)).toBe('2026-11-02');
  });

  it('daily: start date today yields tomorrow', () => {
    expect(computeNextDueDate({ frequency: 'daily', startDate: '2026-10-19' }, today)).toBe('2026-10-20');
  });
});

describe('allocatePayment — oldest-first ledger', () => {
  const rows = [
    { id: 'old-2', amount: '1000.00', paidAmount: '400.00' }, // partial, older
    { id: 'old-1', amount: '500.00', paidAmount: '500.00' }, // already paid → skipped
    { id: 'new-1', amount: '800.00', paidAmount: '0' },
    { id: 'new-2', amount: '300.00', paidAmount: null },
  ];

  it('allocates oldest-first and completes partially paid rows first', () => {
    const { allocations, applied, unallocated } = allocatePayment(rows, 700);
    expect(allocations.map((a) => [a.id, a.allocate, a.complete])).toEqual([
      ['old-2', 600, true], // clears 600 remaining, then
      ['new-1', 100, false], // 100 spills to the next row
    ]);
    expect(applied).toBe(700);
    expect(unallocated).toBe(0);
  });

  it('stops when payment exceeds total pending (unallocated reported)', () => {
    const { allocations, applied, unallocated } = allocatePayment(rows, 5000);
    expect(applied).toBe(round2(600 + 800 + 300));
    expect(unallocated).toBe(round2(5000 - 1700));
    expect(allocations.every((a) => a.complete)).toBe(true);
  });

  it('partial payment leaves the row unpaid with correct new paid amount', () => {
    const { allocations } = allocatePayment([{ id: 'x', amount: '1000', paidAmount: '0' }], 250);
    expect(allocations[0]).toMatchObject({ id: 'x', allocate: 250, newPaid: 250, complete: false });
  });

  it('ignores paidAmount of 0 strings and nulls correctly', () => {
    const { applied } = allocatePayment([{ id: 'a', amount: 50, paidAmount: '0.00' }], 50);
    expect(applied).toBe(50);
  });

  it('rounds to 2 decimals without float noise', () => {
    const { allocations } = allocatePayment(
      [{ id: 'a', amount: '100.10', paidAmount: '0' }],
      33.37,
    );
    expect(allocations[0].newPaid).toBe(33.37);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});

describe('validateScheduleConfig', () => {
  it('rejects monthly without dayOfMonth', () => {
    expect(() =>
      validateScheduleConfig('monthly', { frequency: 'monthly', startDate: '2026-10-01' }),
    ).toThrowError(/day of month/i);
  });

  it('rejects days_of_month without days', () => {
    expect(() =>
      validateScheduleConfig('days_of_month', {
        frequency: 'days_of_month',
        startDate: '2026-10-01',
        daysOfMonth: [],
      }),
    ).toThrowError(/at least one day/i);
  });

  it('rejects weekly without weekday', () => {
    expect(() =>
      validateScheduleConfig('weekly', { frequency: 'weekly', startDate: '2026-10-01', weekday: null }),
    ).toThrowError(/weekday/i);
  });

  it('accepts valid configs', () => {
    expect(() =>
      validateScheduleConfig('daily', { frequency: 'daily', startDate: '2026-10-01' }),
    ).not.toThrow();
    expect(() =>
      validateScheduleConfig('weekly', { frequency: 'weekly', startDate: '2026-10-01', weekday: 0 }),
    ).not.toThrow();
  });
});

describe('helpers', () => {
  it('clampDay caps to month length', () => {
    expect(clampDay(31, 2027, 1)).toBe(28);
    expect(clampDay(31, 2028, 1)).toBe(29);
    expect(clampDay(5, 2026, 9)).toBe(5);
    expect(clampDay(0, 2026, 9)).toBe(1);
  });

  it('dateKey pads month/day', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
