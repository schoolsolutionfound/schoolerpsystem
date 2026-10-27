/**
 * @file payroll.service.ts
 * @description Recurring payroll engine.
 *
 * A schedule describes WHO gets paid, HOW MUCH, and WHEN. On every due day the
 * sweep (and the accountant-login catch-up) inserts a PENDING salary expense row
 * linked to the schedule — visible immediately in Pending Dues. Payments allocate
 * OLDEST-FIRST across those rows (partial payments supported via paid_amount);
 * bonuses are one-off rows created PAID on the spot.
 *
 * Pure helpers (computeDuePeriods / computeNextDueDate / allocatePayment) are
 * exported for unit tests.
 */

import { payrollRepository } from './payroll.repository.js';
import {
  CreatePayrollScheduleInput,
  UpdatePayrollScheduleInput,
  PayScheduleInput,
  AddBonusInput,
} from './payroll.schema.js';
import { PayrollScheduleRow } from '../shared/db/schema.js';

export type PayrollFrequency = 'monthly' | 'weekly' | 'daily' | 'days_of_month';

export interface ScheduleConfig {
  frequency: PayrollFrequency;
  startDate: string; // YYYY-MM-DD (local)
  dayOfMonth?: number | null;
  daysOfMonth?: number[];
  weekday?: number | null; // 0 = Sunday … 6 = Saturday (JS getDay)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => String(n).padStart(2, '0');

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseLocalDate(s: string): Date {
  const [y, m, d] = (s || '').split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d);
}

export function clampDay(day: number, year: number, monthIndex: number): number {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(Math.max(1, day), daysInMonth);
}

function err(statusCode: number, code: string, message: string) {
  return Object.assign(new Error(message), { statusCode, code });
}

export function validateScheduleConfig(frequency: PayrollFrequency, cfg: ScheduleConfig): void {
  if (frequency === 'monthly' && (!cfg.dayOfMonth || cfg.dayOfMonth < 1 || cfg.dayOfMonth > 31)) {
    throw err(400, 'VALIDATION_ERROR', 'Monthly payroll needs a day of month (1-31).');
  }
  if (frequency === 'days_of_month' && (!cfg.daysOfMonth || cfg.daysOfMonth.length === 0)) {
    throw err(400, 'VALIDATION_ERROR', 'Select at least one day of month for payroll.');
  }
  if (frequency === 'weekly' && (cfg.weekday === null || cfg.weekday === undefined)) {
    throw err(400, 'VALIDATION_ERROR', 'Weekly payroll needs a weekday.');
  }
}

/**
 * Every due period with due date in [startDate, today] whose key is newer than
 * `lastKey` (string comparison is monotonic for all key formats). Oldest first,
 * capped to avoid floods after long downtime.
 */
export function computeDuePeriods(
  cfg: ScheduleConfig,
  today: Date,
  lastKey: string | null,
  cap = 240,
): { key: string; date: string }[] {
  const start = parseLocalDate(cfg.startDate);
  if (isNaN(start.getTime())) return [];
  const out: { key: string; date: string }[] = [];
  const push = (d: Date, key: string) => {
    if (d.getTime() >= start.getTime() && d.getTime() <= today.getTime()) out.push({ key, date: dateKey(d) });
  };

  if (cfg.frequency === 'monthly') {
    const day = cfg.dayOfMonth || start.getDate();
    let y = start.getFullYear();
    let m = start.getMonth();
    for (let guard = 0; guard < 720; guard++) {
      const monthStart = new Date(y, m, 1);
      if (monthStart.getTime() > today.getTime()) break;
      const d = new Date(y, m, clampDay(day, y, m));
      push(d, `${y}-${pad(m + 1)}`);
      m += 1;
      if (m > 11) { m = 0; y += 1; }
    }
  } else if (cfg.frequency === 'days_of_month') {
    const days = [...new Set(cfg.daysOfMonth || [])].sort((a, b) => a - b);
    let y = start.getFullYear();
    let m = start.getMonth();
    for (let guard = 0; guard < 720; guard++) {
      const monthStart = new Date(y, m, 1);
      if (monthStart.getTime() > today.getTime()) break;
      for (const dd of days) push(new Date(y, m, clampDay(dd, y, m)), dateKey(new Date(y, m, clampDay(dd, y, m))));
      m += 1;
      if (m > 11) { m = 0; y += 1; }
    }
  } else if (cfg.frequency === 'weekly') {
    const target = cfg.weekday ?? start.getDay();
    const d = new Date(start);
    while (d.getDay() !== target) d.setDate(d.getDate() + 1);
    for (let guard = 0; guard < 3000; guard++) {
      if (d.getTime() > today.getTime()) break;
      push(new Date(d), dateKey(d));
      d.setDate(d.getDate() + 7);
    }
  } else {
    const d = new Date(start);
    for (let guard = 0; guard < cap * 4; guard++) {
      if (d.getTime() > today.getTime()) break;
      push(new Date(d), dateKey(d));
      d.setDate(d.getDate() + 1);
    }
  }

  const filtered = out.filter((p) => lastKey === null || lastKey === '' || p.key > lastKey);
  filtered.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return filtered.slice(0, cap);
}

/** First due date strictly after `today` (for "Next due" display). */
export function computeNextDueDate(cfg: ScheduleConfig, today: Date): string | null {
  const start = parseLocalDate(cfg.startDate);
  if (isNaN(start.getTime())) return null;

  if (cfg.frequency === 'monthly') {
    const day = cfg.dayOfMonth || start.getDate();
    for (let add = 0; add < 3; add++) {
      const base = new Date(today.getFullYear(), today.getMonth() + add, 1);
      const d = new Date(base.getFullYear(), base.getMonth(), clampDay(day, base.getFullYear(), base.getMonth()));
      if (d.getTime() >= start.getTime() && d.getTime() > today.getTime()) return dateKey(d);
    }
    return null;
  }

  if (cfg.frequency === 'days_of_month') {
    const days = [...new Set(cfg.daysOfMonth || [])].sort((a, b) => a - b);
    for (let add = 0; add < 3; add++) {
      const base = new Date(today.getFullYear(), today.getMonth() + add, 1);
      for (const dd of days) {
        const d = new Date(base.getFullYear(), base.getMonth(), clampDay(dd, base.getFullYear(), base.getMonth()));
        if (d.getTime() >= start.getTime() && d.getTime() > today.getTime()) return dateKey(d);
      }
    }
    return null;
  }

  if (cfg.frequency === 'weekly') {
    const target = cfg.weekday ?? start.getDay();
    const d = new Date(start);
    while (d.getDay() !== target) d.setDate(d.getDate() + 1);
    for (let guard = 0; guard < 3000; guard++) {
      if (d.getTime() > today.getTime()) return dateKey(d);
      d.setDate(d.getDate() + 7);
    }
    return null;
  }

  // daily
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const first = start.getTime() > tomorrow.getTime() ? start : tomorrow;
  return dateKey(first);
}

export interface AllocatableRow {
  id: string;
  amount: string | number;
  paidAmount?: string | number | null;
  notes?: string | null;
}

export interface Allocation {
  id: string;
  allocate: number;
  newPaid: number;
  complete: boolean;
  notes: string | null;
}

/** Oldest-first allocation of a payment across pending rows. */
export function allocatePayment(
  rows: AllocatableRow[],
  payment: number,
): { allocations: Allocation[]; applied: number; unallocated: number } {
  let remaining = round2(payment);
  const allocations: Allocation[] = [];
  for (const row of rows) {
    if (remaining <= 0) break;
    const amount = round2(Number(row.amount));
    const paid = round2(Number(row.paidAmount || 0));
    const due = round2(amount - paid);
    if (due <= 0) continue;
    const allocate = round2(Math.min(remaining, due));
    const newPaid = round2(paid + allocate);
    allocations.push({ id: row.id, allocate, newPaid, complete: newPaid >= amount, notes: row.notes ?? null });
    remaining = round2(remaining - allocate);
  }
  const applied = round2(payment - remaining);
  return { allocations, applied, unallocated: remaining };
}

function configFromRow(row: PayrollScheduleRow): ScheduleConfig {
  return {
    frequency: row.frequency as PayrollFrequency,
    startDate: String(row.startDate),
    dayOfMonth: row.dayOfMonth,
    daysOfMonth: Array.isArray(row.daysOfMonth) ? (row.daysOfMonth as number[]) : [],
    weekday: row.weekday,
  };
}

function makeInvoiceNo(): string {
  return `EXP-${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
}

function periodTitle(dateStr: string, frequency: PayrollFrequency): string {
  if (frequency === 'monthly') {
    const [y, m] = dateStr.split('-');
    return `Salary · ${MONTHS[Number(m) - 1]} ${y}`;
  }
  const [y, m, d] = dateStr.split('-');
  return `Salary · ${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

export class PayrollService {
  listStaff(institutionCode: string, role?: string) {
    return payrollRepository.listStaff(institutionCode, role);
  }

  async createSchedules(
    institutionCode: string,
    input: CreatePayrollScheduleInput,
    createdBy?: string,
  ) {
    validateScheduleConfig(input.frequency, input as ScheduleConfig);
    const staff = await payrollRepository.listUsersByIds(institutionCode, input.userIds);
    const foundIds = new Set(staff.map((s) => s.id));
    const notFound = input.userIds.filter((id) => !foundIds.has(id));

    const active = await payrollRepository.listActiveByUserIds(institutionCode, staff.map((s) => s.id));
    const activeIds = new Set(active.map((a) => a.userId));

    const startDate = input.startDate || dateKey(new Date());
    let created = 0;
    for (const person of staff) {
      if (activeIds.has(person.id)) continue;
      try {
        await payrollRepository.createSchedule({
          institutionCode,
          userId: person.id,
          payeeName: person.fullName,
          role: person.role || '',
          department: null,
          amount: String(input.amount),
          frequency: input.frequency,
          dayOfMonth: input.dayOfMonth ?? null,
          daysOfMonth: input.daysOfMonth ?? [],
          weekday: input.weekday ?? null,
          startDate,
          active: true,
          notes: input.notes ?? null,
          lastGeneratedKey: null,
          createdBy: createdBy || null,
        });
        created += 1;
      } catch (err: any) {
        if (err?.code === '23505') continue; // active-schedule race
        throw err;
      }
    }
    return { created, skipped: staff.length - created, notFound };
  }

  async listSchedules(institutionCode: string) {
    const schedules = await payrollRepository.listSchedules(institutionCode);
    const balances = await payrollRepository.getScheduleBalances(institutionCode);
    const map = new Map<string, { pending: number; periods: number; paid: number }>();
    for (const b of balances) {
      if (!b.scheduleId) continue;
      const e = map.get(b.scheduleId) || { pending: 0, periods: 0, paid: 0 };
      const amount = round2(Number(b.amount));
      const paid = round2(Number(b.paidAmount || 0));
      if (b.status !== 'paid') {
        e.pending = round2(e.pending + Math.max(0, amount - paid));
        e.periods += 1;
      }
      e.paid = round2(e.paid + paid);
      map.set(b.scheduleId, e);
    }
    const today = new Date();
    return schedules.map((s) => {
      const bal = map.get(s.id) || { pending: 0, periods: 0, paid: 0 };
      return {
        ...s,
        amount: round2(Number(s.amount)),
        pendingAmount: bal.pending,
        pendingPeriods: bal.periods,
        paidTotal: bal.paid,
        nextDue: s.active ? computeNextDueDate(configFromRow(s), today) : null,
      };
    });
  }

  async getDetail(institutionCode: string, id: string) {
    const schedule = await payrollRepository.getSchedule(id, institutionCode);
    if (!schedule) throw err(404, 'NOT_FOUND', 'Payroll schedule not found.');
    const rows = await payrollRepository.listRowsForSchedule(id);
    let pendingAmount = 0;
    let pendingPeriods = 0;
    let paidTotal = 0;
    for (const r of rows) {
      const amount = round2(Number(r.amount));
      const paid = round2(Number(r.paidAmount || 0));
      paidTotal = round2(paidTotal + paid);
      if (r.status !== 'paid') {
        pendingAmount = round2(pendingAmount + Math.max(0, amount - paid));
        pendingPeriods += 1;
      }
    }
    const today = new Date();
    return {
      schedule: {
        ...schedule,
        amount: round2(Number(schedule.amount)),
      },
      rows,
      balance: {
        pendingAmount,
        pendingPeriods,
        paidTotal,
        nextDue: schedule.active ? computeNextDueDate(configFromRow(schedule), today) : null,
      },
    };
  }

  async updateSchedule(
    institutionCode: string,
    id: string,
    patch: UpdatePayrollScheduleInput,
  ) {
    const existing = await payrollRepository.getSchedule(id, institutionCode);
    if (!existing) throw err(404, 'NOT_FOUND', 'Payroll schedule not found.');

    const merged: ScheduleConfig = {
      frequency: (patch.frequency ?? existing.frequency) as PayrollFrequency,
      startDate: String(existing.startDate),
      dayOfMonth: patch.dayOfMonth !== undefined ? patch.dayOfMonth : existing.dayOfMonth,
      daysOfMonth: patch.daysOfMonth ?? (Array.isArray(existing.daysOfMonth) ? (existing.daysOfMonth as number[]) : []),
      weekday: patch.weekday !== undefined ? patch.weekday : existing.weekday,
    };
    validateScheduleConfig(merged.frequency, merged);

    const update: Record<string, any> = { updatedAt: new Date() };
    if (patch.amount !== undefined) update.amount = String(patch.amount);
    if (patch.frequency !== undefined) update.frequency = patch.frequency;
    if (patch.dayOfMonth !== undefined) update.dayOfMonth = patch.dayOfMonth;
    if (patch.daysOfMonth !== undefined) update.daysOfMonth = patch.daysOfMonth;
    if (patch.weekday !== undefined) update.weekday = patch.weekday;
    if (patch.active !== undefined) update.active = patch.active;
    if (patch.notes !== undefined) update.notes = patch.notes;

    const updated = await payrollRepository.updateSchedule(id, institutionCode, update);
    return { ...updated, amount: round2(Number(updated?.amount ?? 0)) };
  }

  async pay(institutionCode: string, id: string, input: PayScheduleInput) {
    const schedule = await payrollRepository.getSchedule(id, institutionCode);
    if (!schedule) throw err(404, 'NOT_FOUND', 'Payroll schedule not found.');

    const pendingRows = await payrollRepository.listPendingRowsForSchedule(id);
    const { allocations, applied, unallocated } = allocatePayment(pendingRows, input.amount);
    if (applied <= 0) throw err(400, 'NOTHING_DUE', 'No pending amount available to pay.');

    const todayK = dateKey(new Date());
    for (const a of allocations) {
      const row = pendingRows.find((r) => r.id === a.id);
      const notes = input.reference
        ? `${row?.notes ? `${row.notes} · ` : ''}${input.reference}`
        : row?.notes ?? null;
      await payrollRepository.updateExpenseRow(a.id, {
        paidAmount: String(a.newPaid),
        status: a.complete ? 'paid' : 'pending',
        paymentMethod: input.paymentMethod,
        paymentDate: todayK,
        notes,
        updatedAt: new Date(),
      });
    }
    return { applied, unallocated, updatedRows: allocations.length };
  }

  async addBonus(institutionCode: string, id: string, input: AddBonusInput, createdBy?: string) {
    const schedule = await payrollRepository.getSchedule(id, institutionCode);
    if (!schedule) throw err(404, 'NOT_FOUND', 'Payroll schedule not found.');

    const todayK = dateKey(new Date());
    const row = await payrollRepository.insertExpenseRow({
      institutionCode,
      title: `Bonus — ${input.note}`.slice(0, 255),
      category: 'salary',
      payeeName: schedule.payeeName,
      amount: String(input.amount),
      paymentMethod: input.paymentMethod,
      paymentDate: todayK,
      dueDate: todayK,
      status: 'paid',
      invoiceNo: makeInvoiceNo(),
      notes: input.note,
      createdBy: createdBy || null,
      scheduleId: schedule.id,
      userId: schedule.userId,
      periodKey: `bonus_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      paidAmount: String(input.amount),
      payrollType: 'bonus',
    });
    if (!row) throw err(500, 'BONUS_FAILED', 'Could not record bonus.');
    return row;
  }

  /**
   * Generate all due pending periods (per schedule: guarded by lastGeneratedKey
   * AND by existing due dates, so cadence edits can never double-create a day),
   * then flip unpaid rows past the 7-day grace window to OVERDUE.
   */
  async generateDue(institutionCode?: string): Promise<number> {
    const schedules = institutionCode
      ? (await payrollRepository.listSchedules(institutionCode)).filter((s) => s.active)
      : await payrollRepository.listActiveSchedulesAll();

    const today = new Date();
    let generated = 0;

    for (const s of schedules) {
      const cfg = configFromRow(s);
      let periods: { key: string; date: string }[];
      try {
        periods = computeDuePeriods(cfg, today, s.lastGeneratedKey || null);
      } catch {
        continue;
      }
      if (periods.length === 0) continue;

      const existing = new Set(await payrollRepository.listDueDates(s.id, periods.map((p) => p.date)));
      for (const p of periods) {
        if (existing.has(p.date)) continue;
        const row = await payrollRepository.insertExpenseRow({
          institutionCode: s.institutionCode,
          title: periodTitle(p.date, cfg.frequency),
          category: 'salary',
          payeeName: s.payeeName,
          amount: String(s.amount),
          paymentMethod: 'bank_transfer',
          paymentDate: p.date,
          dueDate: p.date,
          status: 'pending',
          invoiceNo: makeInvoiceNo(),
          notes: s.notes ?? null,
          createdBy: 'payroll-sweep',
          scheduleId: s.id,
          userId: s.userId,
          periodKey: p.key,
          paidAmount: '0',
          payrollType: 'salary',
        });
        if (row) generated += 1;
      }

      const maxKey = periods.reduce((max, p) => (p.key > max ? p.key : max), s.lastGeneratedKey || '');
      if (maxKey && maxKey !== s.lastGeneratedKey) {
        await payrollRepository.bumpLastGeneratedKey(s.id, maxKey);
      }
    }

    const grace = new Date(today);
    grace.setDate(grace.getDate() - 7);
    try {
      await payrollRepository.markOverduePast(dateKey(grace), institutionCode);
    } catch {
      /* overdue flip is best-effort */
    }
    return generated;
  }
}

export const payrollService = new PayrollService();
