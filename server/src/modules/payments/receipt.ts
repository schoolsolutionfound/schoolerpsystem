import { eq } from 'drizzle-orm';
import { paymentReceiptSequences } from '../shared/db/schema.js';

/**
 * Per-institution receipt number generator.
 *
 * Must be called INSIDE a transaction: the sequence row is locked with
 * SELECT ... FOR UPDATE, so concurrent payments for the same school can never
 * receive the same receipt number (the old timestamp-derived generator could).
 *
 * Format: REC-<YYYYMM>-<seq>   e.g. REC-202610-0007
 * The sequence resets each calendar month per institution.
 */
export async function nextReceiptNo(tx: any, institutionCode: string): Promise<string> {
  const now = new Date();
  const period = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

  await tx
    .insert(paymentReceiptSequences)
    .values({ institutionCode, period, nextSeq: 0 })
    .onConflictDoNothing();

  const rows = await tx
    .select()
    .from(paymentReceiptSequences)
    .where(eq(paymentReceiptSequences.institutionCode, institutionCode))
    .for('update');
  const row = rows[0];
  if (!row) {
    throw Object.assign(new Error('Could not allocate receipt number.'), {
      statusCode: 500,
      code: 'RECEIPT_SEQUENCE_FAILED',
    });
  }

  let next: number;
  if (row.period !== period) {
    next = 1;
    await tx
      .update(paymentReceiptSequences)
      .set({ period, nextSeq: next, updatedAt: new Date() })
      .where(eq(paymentReceiptSequences.institutionCode, institutionCode));
  } else {
    next = (row.nextSeq || 0) + 1;
    await tx
      .update(paymentReceiptSequences)
      .set({ nextSeq: next, updatedAt: new Date() })
      .where(eq(paymentReceiptSequences.institutionCode, institutionCode));
  }

  return `REC-${period}-${String(next).padStart(4, '0')}`;
}
