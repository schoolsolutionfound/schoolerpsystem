/**
 * @file payroll.repository.ts
 * @description Data access for payroll schedules and their linked expense rows.
 */

import { db } from '../shared/db/index.js';
import {
  payrollSchedules,
  expenseRecords,
  users,
  NewPayrollScheduleRow,
  NewExpenseRecordRow,
} from '../shared/db/schema.js';
import {
  and,
  eq,
  ne,
  asc,
  inArray,
  isNotNull,
  sql,
} from 'drizzle-orm';

function requireDb() {
  if (!db) throw Object.assign(new Error('Database not available'), { statusCode: 500 });
  return db;
}

export const STAFF_ROLE_EXCLUSIONS = ['student', 'parent'] as const;

export const payrollRepository = {
  async listStaff(institutionCode: string, role?: string) {
    const d = requireDb();
    const conds: any[] = [
      eq(users.institutionCode, institutionCode),
      ne(users.role, STAFF_ROLE_EXCLUSIONS[0]),
      ne(users.role, STAFF_ROLE_EXCLUSIONS[1]),
    ];
    if (role) conds.push(eq(users.role, role));
    return d
      .select({
        id: users.id,
        fullName: users.fullName,
        role: users.role,
        phone: users.phone,
        profilePicUrl: users.profilePicUrl,
      })
      .from(users)
      .where(and(...conds))
      .orderBy(asc(users.fullName));
  },

  async listUsersByIds(institutionCode: string, userIds: string[]) {
    if (userIds.length === 0) return [];
    const d = requireDb();
    return d
      .select({
        id: users.id,
        fullName: users.fullName,
        role: users.role,
        phone: users.phone,
        profilePicUrl: users.profilePicUrl,
      })
      .from(users)
      .where(
        and(
          eq(users.institutionCode, institutionCode),
          inArray(users.id, userIds),
          ne(users.role, STAFF_ROLE_EXCLUSIONS[0]),
          ne(users.role, STAFF_ROLE_EXCLUSIONS[1]),
        ),
      );
  },

  async listActiveByUserIds(institutionCode: string, userIds: string[]) {
    if (userIds.length === 0) return [];
    const d = requireDb();
    return d
      .select({ id: payrollSchedules.id, userId: payrollSchedules.userId })
      .from(payrollSchedules)
      .where(
        and(
          eq(payrollSchedules.institutionCode, institutionCode),
          inArray(payrollSchedules.userId, userIds),
          eq(payrollSchedules.active, true),
        ),
      );
  },

  async createSchedule(row: NewPayrollScheduleRow) {
    const d = requireDb();
    const [result] = await d.insert(payrollSchedules).values(row).returning();
    return result;
  },

  async listSchedules(institutionCode: string) {
    const d = requireDb();
    return d
      .select()
      .from(payrollSchedules)
      .where(eq(payrollSchedules.institutionCode, institutionCode))
      .orderBy(asc(payrollSchedules.payeeName));
  },

  async getSchedule(id: string, institutionCode: string) {
    const d = requireDb();
    const [row] = await d
      .select()
      .from(payrollSchedules)
      .where(and(eq(payrollSchedules.id, id), eq(payrollSchedules.institutionCode, institutionCode)))
      .limit(1);
    return row || null;
  },

  async listActiveSchedulesAll() {
    const d = requireDb();
    return d.select().from(payrollSchedules).where(eq(payrollSchedules.active, true));
  },

  async updateSchedule(id: string, institutionCode: string, patch: Partial<NewPayrollScheduleRow>) {
    const d = requireDb();
    const [result] = await d
      .update(payrollSchedules)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(payrollSchedules.id, id), eq(payrollSchedules.institutionCode, institutionCode)))
      .returning();
    return result || null;
  },

  /** Balances for every schedule of the institution in one pass. */
  async getScheduleBalances(institutionCode: string) {
    const d = requireDb();
    const rows = await d
      .select({
        scheduleId: expenseRecords.scheduleId,
        amount: expenseRecords.amount,
        paidAmount: expenseRecords.paidAmount,
        status: expenseRecords.status,
      })
      .from(expenseRecords)
      .where(and(eq(expenseRecords.institutionCode, institutionCode), isNotNull(expenseRecords.scheduleId)));
    return rows;
  },

  async listRowsForSchedule(scheduleId: string) {
    const d = requireDb();
    return d
      .select()
      .from(expenseRecords)
      .where(eq(expenseRecords.scheduleId, scheduleId))
      .orderBy(
        sql`${expenseRecords.dueDate} asc nulls last`,
        sql`${expenseRecords.createdAt} asc`,
      );
  },

  async listPendingRowsForSchedule(scheduleId: string) {
    const d = requireDb();
    return d
      .select()
      .from(expenseRecords)
      .where(and(eq(expenseRecords.scheduleId, scheduleId), ne(expenseRecords.status, 'paid')))
      .orderBy(
        sql`${expenseRecords.dueDate} asc nulls last`,
        sql`${expenseRecords.createdAt} asc`,
      );
  },

  async listDueDates(scheduleId: string, dates: string[]) {
    if (dates.length === 0) return [] as string[];
    const d = requireDb();
    const rows = await d
      .select({ dueDate: expenseRecords.dueDate })
      .from(expenseRecords)
      .where(and(eq(expenseRecords.scheduleId, scheduleId), inArray(expenseRecords.dueDate, dates)));
    return rows.map((r) => r.dueDate).filter(Boolean) as string[];
  },

  async insertExpenseRow(values: NewExpenseRecordRow) {
    const d = requireDb();
    try {
      const [result] = await d.insert(expenseRecords).values(values).returning();
      return result;
    } catch (err: any) {
      // Unique (schedule_id, period_key) race → already generated by a concurrent sweep.
      if (err?.code === '23505') return null;
      throw err;
    }
  },

  async updateExpenseRow(id: string, patch: Record<string, any>) {
    const d = requireDb();
    const [result] = await d.update(expenseRecords).set(patch).where(eq(expenseRecords.id, id)).returning();
    return result || null;
  },

  async bumpLastGeneratedKey(scheduleId: string, key: string) {
    const d = requireDb();
    await d
      .update(payrollSchedules)
      .set({ lastGeneratedKey: key, updatedAt: new Date() })
      .where(eq(payrollSchedules.id, scheduleId));
  },

  /** Payroll rows unpaid for more than the grace window flip to OVERDUE. */
  async markOverduePast(graceDate: string, institutionCode?: string) {
    const d = requireDb();
    const conditions = [
      isNotNull(expenseRecords.scheduleId),
      eq(expenseRecords.status, 'pending'),
      sql`${expenseRecords.dueDate} < ${graceDate}`,
    ];
    if (institutionCode) conditions.push(eq(expenseRecords.institutionCode, institutionCode));
    await d
      .update(expenseRecords)
      .set({ status: 'overdue', updatedAt: new Date() })
      .where(and(...conditions));
  },
};
