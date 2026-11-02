-- 0011_payment_refund_accumulation
--
-- Makes refunds idempotent and lets partial refunds accumulate.
--
-- Before this migration an order had no memory of how much had already been
-- refunded: `refundOrder` always refunded the full amount, and the
-- refund.processed webhook decided "fully refunded" from the current event's
-- amount alone. Two 50% refunds therefore never finalized the order, and the
-- same refund webhook delivered twice would be counted twice.
--
-- All statements are idempotent so this can be re-run safely.

BEGIN;

-- Running total refunded, in paise. Monotonically increasing; never decremented.
ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS refunded_paise bigint NOT NULL DEFAULT 0;

-- Gateway refund id (`rfnd_...`) so a replayed refund webhook is recognised.
ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS gateway_refund_id text;

-- One row per gateway refund per tenant. Postgres treats NULLs as distinct, so
-- non-refund transactions (which have no refund id) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_transactions_gateway_refund
  ON payment_transactions (institution_code, gateway_refund_id);

-- Backfill: orders already marked refunded have, by definition, been refunded
-- in full. Orders marked partially_refunded keep whatever sum of their
-- processed refund rows we can reconstruct, so a later partial refund is
-- measured against the correct remaining balance instead of the full amount.
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
  AND o.status = 'partially_refunded'
  AND o.refunded_paise = 0;

COMMIT;
