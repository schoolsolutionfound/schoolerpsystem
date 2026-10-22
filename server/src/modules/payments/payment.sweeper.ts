import { paymentService } from './payment.service.js';

/**
 * Background sweeper: expires stale open payment orders so the
 * "one open order per student" partial unique index is never blocked by
 * abandoned checkouts. Lazy expiry also runs on poll/cancel/create, this job
 * is the safety net for idle orders.
 */

const INTERVAL_MS = 5 * 60 * 1000;
let timer: NodeJS.Timeout | null = null;

export function startPaymentOrderSweeper(): void {
  if (timer) return;
  timer = setInterval(() => {
    paymentService
      .expireStaleOrders()
      .then((count) => {
        if (count > 0) console.log(`[payments] expired ${count} stale order(s)`);
      })
      .catch((err) => {
        console.warn(`[payments] expiry sweep failed: ${err?.message || err}`);
      });
  }, INTERVAL_MS);
  timer.unref?.();
}

export function stopPaymentOrderSweeper(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
