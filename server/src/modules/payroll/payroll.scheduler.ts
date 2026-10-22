/**
 * @file payroll.scheduler.ts
 * @description Background sweep that turns due payroll periods into pending
 * salary expense rows and flips overdue ones. All-institutions sweep — each
 * schedule carries its own institution_code, no cross-tenant risk.
 */

import { payrollService } from './payroll.service.js';

const SWEEP_INTERVAL_MS = 15 * 60_000; // 15 minutes (due dates are daily-granular)

let timer: NodeJS.Timeout | null = null;

async function sweep(): Promise<void> {
  try {
    const generated = await payrollService.generateDue();
    if (generated > 0) {
      console.log(`[Payroll] Generated ${generated} pending salary row(s)`);
    }
  } catch (err: any) {
    console.warn('[Payroll] Due-row sweep failed:', err?.message || err);
  }
}

export function startPayrollScheduler(): void {
  if (timer) return;
  void sweep();
  timer = setInterval(() => void sweep(), SWEEP_INTERVAL_MS);
}

export function stopPayrollScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
