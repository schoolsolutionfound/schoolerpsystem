-- 0012_payment_refund_accumulation_baseline_drift
--
-- Restores two columns that exist in drizzle/0000_full_schema.sql and in the
-- Drizzle table definitions but were never applied to the PostgreSQL 18
-- database (it predates the baseline). Without them every payment_orders read
-- fails with 42703 "column refunded_paise does not exist", breaking the
-- accountant Online Payments tab and refunds.
--
-- Idempotent: safe to re-run.

BEGIN;

ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS refunded_paise bigint NOT NULL DEFAULT 0;

ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS gateway_refund_id text;

-- Backfill: fully refunded orders have been refunded in full. Partially
-- refunded orders keep the sum of their processed refund rows.
UPDATE payment_orders o
SET refunded_paise = o.amount_paise
WHERE o.status = 'refunded'
  AND o.refunded_paise = 0;

UPDATE payment_orders o
SET refunded_paise = LEAST(agg.total, o.amount_paise)
FROM (
  SELECT payment_order_id, SUM(amount_paise) AS total
  FROM payment_transactions
  WHERE status = 'refund_processed'
  GROUP BY payment_order_id
) agg
WHERE agg.payment_order_id = o.id
  AND (o.status = 'partially_refunded' OR o.status = 'refunded')
  AND o.refunded_paise < LEAST(agg.total, o.amount_paise);

COMMIT;
