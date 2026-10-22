/**
 * @file payrollUtils.ts
 * @description Shared payroll display helpers and picker options.
 */

import { PayrollFrequency } from '../types/finance';

export const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

export const FREQUENCY_OPTIONS: { value: PayrollFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'days_of_month', label: 'Specific days of month' },
  { value: 'daily', label: 'Daily' },
];

export interface PayrollFrequencyDisplay {
  frequency: PayrollFrequency;
  dayOfMonth?: number | null;
  daysOfMonth?: number[] | null;
  weekday?: number | null;
}

export function payrollFrequencyLabel(s: PayrollFrequencyDisplay): string {
  if (s.frequency === 'monthly') return `Monthly · ${s.dayOfMonth || 1}`;
  if (s.frequency === 'weekly') {
    const wd = WEEKDAYS.find((w) => w.value === s.weekday);
    return `Weekly · ${wd ? wd.label : '—'}`;
  }
  if (s.frequency === 'days_of_month') {
    const days = Array.isArray(s.daysOfMonth) && s.daysOfMonth.length ? s.daysOfMonth.join(', ') : '1';
    return `On day ${days}`;
  }
  return 'Daily';
}

/** Row status chip for a payroll history row (PAID / PARTIAL / PENDING / OVERDUE). */
export function payrollRowStatus(
  row: { status: string; amount: number; paidAmount?: number },
): { label: string; bg: string; text: string } {
  if (row.status === 'paid') return { label: 'PAID', bg: '#DCFCE7', text: '#16A34A' };
  if (row.status === 'overdue') return { label: 'OVERDUE', bg: '#FEE2E2', text: '#DC3545' };
  const paid = row.paidAmount || 0;
  if (paid > 0 && paid < row.amount) {
    return { label: 'PARTIAL', bg: '#FEF3C7', text: '#D97706' };
  }
  return { label: 'PENDING', bg: '#FEF3C7', text: '#D97706' };
}
