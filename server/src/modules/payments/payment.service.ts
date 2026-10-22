import { createHash } from 'crypto';
import { and, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm';
import {
  db,
  withTransaction,
  dbFindUserById,
  dbFindUserByIdOrUid,
  dbFindStudentClassSectionId,
} from '../shared/db/index.js';
import { getPrimaryParentChild } from '../users/parent-links.js';
import { feePayments, feeStructures, paymentOrders, paymentTransactions, users } from '../shared/db/schema.js';
import { getMerchantCredentials, getWebhookCredentials } from './payment.config.js';
import { nextReceiptNo } from './receipt.js';
import { razorpayGateway } from './gateway/razorpay.js';
import type { GatewayPaymentEvent, PaymentGateway } from './gateway/adapter.js';
import type { CreateOrderInput, ListOrdersQuery, RefundOrderInput } from './payment.schema.js';
import { notifyFeePaid } from '../notifications/notification.triggers.js';

/**
 * Payment order lifecycle + webhook processing — THE source of truth for
 * online fee payments.
 *
 * Non-negotiable rules enforced here:
 *  1. Client never supplies amount, student, or tenant — all derived from
 *     session + fee rows scoped by institution_code.
 *  2. Only a signature-verified webhook can move an order to `paid`.
 *  3. Every multi-row write runs inside withTransaction.
 *  4. Every query is tenant-scoped; ownership is re-checked in the service.
 */

const GATEWAYS: Record<string, PaymentGateway> = { razorpay: razorpayGateway };

function resolveGateway(name: string): PaymentGateway {
  const gw = GATEWAYS[name] || GATEWAYS[(process.env.PAYMENT_GATEWAY || 'razorpay').toLowerCase()];
  if (!gw) {
    throw Object.assign(new Error('Unsupported payment gateway.'), {
      statusCode: 500,
      code: 'PAYMENT_GATEWAY_UNSUPPORTED',
    });
  }
  return gw;
}

function httpError(statusCode: number, code: string, message: string) {
  return Object.assign(new Error(message), { statusCode, code });
}

function isUniqueViolation(err: any): boolean {
  return err?.code === '23505' || String(err?.message || '').includes('duplicate key');
}

function orderTtlHours(): number {
  const raw = Number(process.env.PAYMENT_ORDER_TTL_HOURS);
  if (!Number.isFinite(raw) || raw <= 0) return 24;
  return Math.min(raw, 720); // Razorpay max order lifetime is 30 days
}

// Status transition guards — evaluated AFTER the row lock inside the tx.
const OPEN_STATUSES = ['created', 'authorized'];
/** Money arrived at the gateway regardless of our local state — we MUST credit. */
const CREDITABLE_STATUSES = ['created', 'authorized', 'expired', 'cancelled'];
const FAILURE_STATUSES = ['created', 'authorized', 'expired', 'cancelled', 'failed'];
const REFUNDABLE_STATUSES = ['paid', 'partially_refunded'];

interface Payer {
  uid: string;
  role: string;
}

interface ResolvedStudent {
  id: string;
  fullName: string;
}

export class PaymentService {
  // ────────────────────────────────────────────────────────── payer resolution

  /**
   * Resolve the student this session may pay for — NEVER from client input.
   * Parent → primary child from parent_links (legacy scope fallback inside).
   * Student → session uid itself.
   */
  async resolvePayerStudent(institutionCode: string, payer: Payer): Promise<ResolvedStudent> {
    const account = await dbFindUserByIdOrUid(payer.uid);
    const role = (account?.role || '').toLowerCase();
    const sameTenant =
      !!account && (account.institutionCode || '').toLowerCase() === institutionCode.toLowerCase();

    if (payer.role === 'parent') {
      if (!account || role !== 'parent' || !sameTenant) {
        throw httpError(403, 'FORBIDDEN', 'Only parents can pay fees for their linked student.');
      }
      const link = await getPrimaryParentChild(account.id);
      if (!link) {
        throw httpError(403, 'NO_LINKED_STUDENT', 'No student is linked to this parent account.');
      }
      const student = await dbFindUserById(link.studentId);
      if (!student || (student.institutionCode || '').toLowerCase() !== institutionCode.toLowerCase()) {
        throw httpError(403, 'NO_LINKED_STUDENT', 'Linked student was not found in this institution.');
      }
      return { id: student.id, fullName: student.fullName || '' };
    }

    if (payer.role === 'student') {
      if (!account || role !== 'student' || !sameTenant) {
        throw httpError(403, 'FORBIDDEN', 'Only students can pay their own fees.');
      }
      return { id: account.id, fullName: account.fullName || '' };
    }

    throw httpError(403, 'FORBIDDEN', 'Online payment is not available for this account type.');
  }

  // ─────────────────────────────────────────────────────────────── order create

  async createOrder(institutionCode: string, payer: Payer, input: CreateOrderInput) {
    if (!db) throw httpError(503, 'DB_UNAVAILABLE', 'Database not available');

    const student = await this.resolvePayerStudent(institutionCode, payer);
    const feeIds = [...new Set(input.feeStructureIds)];

    // 1. Fee rows must exist, be active, AND belong to this tenant.
    const structures = await db
      .select()
      .from(feeStructures)
      .where(
        and(
          eq(feeStructures.institutionCode, institutionCode),
          inArray(feeStructures.id, feeIds),
          eq(feeStructures.status, 'active')
        )
      );
    if (structures.length !== feeIds.length) {
      throw httpError(400, 'FEE_NOT_FOUND', 'One or more selected fees are no longer available.');
    }

    // 2. Class eligibility (same rule as the fee statement view).
    const childClassId = await dbFindStudentClassSectionId(student.id).catch(() => undefined);
    const eligible = structures.filter((s) => !s.classSectionId || s.classSectionId === childClassId);
    if (eligible.length !== feeIds.length) {
      throw httpError(400, 'FEE_NOT_ELIGIBLE', 'One or more selected fees do not apply to this student.');
    }

    // 3. Already-paid guard (cross-tenant and double-pay protection).
    const paidRows = await db
      .select({ feeStructureId: feePayments.feeStructureId })
      .from(feePayments)
      .where(
        and(
          eq(feePayments.institutionCode, institutionCode),
          eq(feePayments.studentId, student.id),
          inArray(feePayments.feeStructureId, feeIds),
          eq(feePayments.status, 'paid')
        )
      );
    if (paidRows.length > 0) {
      throw httpError(409, 'ALREADY_PAID', 'One or more selected fees are already paid.');
    }

    // 4. Amount — server-side only, from fee rows, as integer paise.
    const lines = eligible.map((s) => {
      const amountPaise = Math.round(Number(s.amount) * 100);
      if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
        throw httpError(400, 'INVALID_FEE_AMOUNT', `Fee "${s.title}" has an invalid amount.`);
      }
      return { id: s.id, amountPaise };
    });
    const amountPaise = lines.reduce((sum, l) => sum + l.amountPaise, 0);
    if (amountPaise <= 0) throw httpError(400, 'INVALID_AMOUNT', 'Payment amount must be greater than zero.');

    // 5. Credentials BEFORE any local row (fail fast, no orphan orders).
    const merchant = await getMerchantCredentials(institutionCode);
    const gateway = resolveGateway(merchant.gateway);

    const expiresAt = new Date(Date.now() + orderTtlHours() * 3_600_000);

    // 6a. Resume fast path — same fee lines already have an open order
    // (e.g. parent closed the app mid-checkout) → hand it back instead of 409.
    const preexisting = await this.findOpenOrder(institutionCode, student.id);
    if (preexisting) {
      const resumed = await this.resumeOpenOrder(preexisting, feeIds, merchant.keyId);
      if (resumed) return resumed;
    }

    // 6b. Insert local order (lazy-expire stale ones first; one open order only).
    let orderId: string;
    try {
      orderId = await withTransaction(async (tx) => {
        await tx
          .update(paymentOrders)
          .set({ status: 'expired', updatedAt: new Date() })
          .where(
            and(
              eq(paymentOrders.institutionCode, institutionCode),
              eq(paymentOrders.studentId, student.id),
              inArray(paymentOrders.status, OPEN_STATUSES),
              lt(paymentOrders.expiresAt, new Date())
            )
          );

        const [row] = await tx
          .insert(paymentOrders)
          .values({
            institutionCode,
            studentId: student.id,
            payerUid: payer.uid,
            payerRole: payer.role,
            amountPaise,
            status: 'created',
            gateway: merchant.gateway,
            feeStructureIds: lines,
            expiresAt,
          })
          .returning({ id: paymentOrders.id });
        return row.id;
      });
    } catch (err: any) {
      if (isUniqueViolation(err)) {
        // Lost a create race — if the winner's order matches, resume it.
        const again = await this.findOpenOrder(institutionCode, student.id);
        if (again) {
          const resumed = await this.resumeOpenOrder(again, feeIds, merchant.keyId);
          if (resumed) return resumed;
        }
        throw httpError(409, 'OPEN_ORDER_EXISTS', 'An online payment is already in progress for this student.');
      }
      throw err;
    }

    // 7. Create the gateway order (network call — outside any tx).
    try {
      const result = await gateway.createOrder(merchant, {
        amountPaise,
        currency: 'INR',
        receipt: orderId,
        notes: { orderId, institutionCode, studentId: student.id },
        expireBy: Math.floor(expiresAt.getTime() / 1000),
      });
      await db
        .update(paymentOrders)
        .set({ gatewayOrderId: result.gatewayOrderId, updatedAt: new Date() })
        .where(eq(paymentOrders.id, orderId));
      return {
        orderId,
        gatewayOrderId: result.gatewayOrderId,
        keyId: merchant.keyId,
        amountPaise,
        currency: 'INR',
        expiresAt: expiresAt.toISOString(),
      };
    } catch (err: any) {
      // Free the one-open-order slot so the parent can retry immediately.
      try {
        await db!
          .update(paymentOrders)
          .set({
            status: 'failed',
            failureReason: String(err?.message || 'Gateway order creation failed').slice(0, 500),
            updatedAt: new Date(),
          })
          .where(and(eq(paymentOrders.id, orderId), inArray(paymentOrders.status, OPEN_STATUSES)));
      } catch {
        // best-effort — the sweeper/lazy expiry will clean the row up
      }
      if (err?.statusCode) throw err;
      throw httpError(502, 'GATEWAY_ERROR', 'Could not start the payment with the gateway. Please try again.');
    }
  }

  private async findOpenOrder(institutionCode: string, studentId: string) {
    if (!db) throw httpError(503, 'DB_UNAVAILABLE', 'Database not available');
    const [open] = await db
      .select()
      .from(paymentOrders)
      .where(
        and(
          eq(paymentOrders.institutionCode, institutionCode),
          eq(paymentOrders.studentId, studentId),
          inArray(paymentOrders.status, OPEN_STATUSES)
        )
      )
      .limit(1);
    return open;
  }

  /**
   * Decide what to do when the student already has an open order:
   *  - same fee lines + gateway order linked → RESUME (return it for checkout)
   *  - order never linked to the gateway and stale → clean it up (return null,
   *    caller proceeds to create a fresh one)
   *  - anything else → 409 conflict
   */
  private async resumeOpenOrder(
    order: typeof paymentOrders.$inferSelect,
    requestedFeeIds: string[],
    keyId: string
  ) {
    const existingIds = (order.feeStructureIds || []).map((l) => l.id).sort();
    const wanted = [...requestedFeeIds].sort();
    const sameLines =
      existingIds.length === wanted.length && existingIds.every((v, i) => v === wanted[i]);

    if (sameLines && order.gatewayOrderId) {
      return {
        orderId: order.id,
        gatewayOrderId: order.gatewayOrderId,
        keyId,
        amountPaise: order.amountPaise,
        currency: order.currency,
        expiresAt: order.expiresAt.toISOString(),
      };
    }

    if (!order.gatewayOrderId) {
      const ageMs = Date.now() - (order.createdAt ? new Date(order.createdAt).getTime() : 0);
      if (ageMs > 60_000) {
        // Half-created orphan (crash between insert and gateway link) — clear it.
        await db!
          .update(paymentOrders)
          .set({ status: 'failed', failureReason: 'Gateway order link missing', updatedAt: new Date() })
          .where(and(eq(paymentOrders.id, order.id), inArray(paymentOrders.status, OPEN_STATUSES)))
          .catch(() => undefined);
        return null;
      }
      throw httpError(409, 'OPEN_ORDER_RETRY', 'A payment for this student is being prepared. Please retry shortly.');
    }

    throw httpError(
      409,
      'OPEN_ORDER_EXISTS',
      `An online payment for different fees is already in progress for this student (order ${order.id}).`
    );
  }

  // ──────────────────────────────────────────────────────────────── poll/cancel

  private async getOwnedOrder(institutionCode: string, orderId: string, payerUid: string) {
    if (!db) throw httpError(503, 'DB_UNAVAILABLE', 'Database not available');
    const [order] = await db
      .select()
      .from(paymentOrders)
      .where(and(eq(paymentOrders.id, orderId), eq(paymentOrders.institutionCode, institutionCode)))
      .limit(1);
    // Ownership mismatch returns the same 404 as missing — no IDOR probing.
    if (!order || order.payerUid !== payerUid) {
      throw httpError(404, 'ORDER_NOT_FOUND', 'Payment order not found.');
    }
    return order;
  }

  private async lazyExpire(order: (typeof paymentOrders.$inferSelect)) {
    if (order.expiresAt.getTime() > Date.now()) return order;
    if (!OPEN_STATUSES.includes(order.status)) return order;
    if (!db) return order;
    const [updated] = await db
      .update(paymentOrders)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(and(eq(paymentOrders.id, order.id), inArray(paymentOrders.status, OPEN_STATUSES)))
      .returning();
    return updated || { ...order, status: 'expired' };
  }

  async pollOrder(institutionCode: string, orderId: string, payerUid: string) {
    const order = await this.getOwnedOrder(institutionCode, orderId, payerUid);
    const fresh = await this.lazyExpire(order);
    return {
      orderId: fresh.id,
      status: fresh.status,
      amountPaise: fresh.amountPaise,
      currency: fresh.currency,
      method: fresh.method || '',
      failureReason: fresh.failureReason || '',
      expiresAt: fresh.expiresAt.toISOString(),
      paidAt: fresh.paidAt ? fresh.paidAt.toISOString() : null,
      feeStructureIds: (fresh.feeStructureIds || []).map((l) => l.id),
    };
  }

  async cancelOrder(institutionCode: string, orderId: string, payerUid: string) {
    const order = await this.getOwnedOrder(institutionCode, orderId, payerUid);
    if (!db) throw httpError(503, 'DB_UNAVAILABLE', 'Database not available');
    if (!OPEN_STATUSES.includes(order.status)) {
      throw httpError(409, 'ORDER_NOT_CANCELLABLE', `Order is ${order.status} and cannot be cancelled.`);
    }
    const [updated] = await db
      .update(paymentOrders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(
        and(eq(paymentOrders.id, order.id), inArray(paymentOrders.status, OPEN_STATUSES))
      )
      .returning();
    if (!updated) {
      throw httpError(409, 'ORDER_NOT_CANCELLABLE', 'Order was already processed.');
    }
    return { orderId: updated.id, status: updated.status };
  }

  // ────────────────────────────────────────────────────────── reconciliation

  async listOrders(institutionCode: string, query: ListOrdersQuery) {
    if (!db) throw httpError(503, 'DB_UNAVAILABLE', 'Database not available');
    const conditions = [eq(paymentOrders.institutionCode, institutionCode)];
    if (query.status) conditions.push(eq(paymentOrders.status, query.status));
    if (query.studentId) conditions.push(eq(paymentOrders.studentId, query.studentId));
    if (query.from) conditions.push(gte(paymentOrders.createdAt, new Date(`${query.from}T00:00:00.000Z`)));
    if (query.to) {
      const toEnd = new Date(`${query.to}T00:00:00.000Z`);
      toEnd.setUTCDate(toEnd.getUTCDate() + 1);
      conditions.push(lt(paymentOrders.createdAt, toEnd));
    }
    const where = and(...conditions);

    const [{ totalCount }] = await db
      .select({ totalCount: sql<number>`count(*)` })
      .from(paymentOrders)
      .where(where);

    const rows = await db
      .select()
      .from(paymentOrders)
      .where(where)
      .orderBy(desc(paymentOrders.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    const studentIds = [...new Set(rows.map((r) => r.studentId))];
    const studentMap = new Map<string, { fullName: string; rollNoOrUSN: string | null }>();
    if (studentIds.length > 0) {
      const students = await db
        .select({ id: users.id, fullName: users.fullName, rollNoOrUSN: users.rollNoOrUSN })
        .from(users)
        .where(inArray(users.id, studentIds));
      for (const s of students) studentMap.set(s.id, s);
    }

    return {
      total: Number(totalCount || 0),
      limit: query.limit,
      offset: query.offset,
      orders: rows.map((r) => ({
        orderId: r.id,
        studentId: r.studentId,
        studentName: studentMap.get(r.studentId)?.fullName || '',
        rollNo: studentMap.get(r.studentId)?.rollNoOrUSN || '',
        payerRole: r.payerRole,
        amountPaise: r.amountPaise,
        currency: r.currency,
        status: r.status,
        gateway: r.gateway,
        gatewayOrderId: r.gatewayOrderId,
        gatewayPaymentId: r.gatewayPaymentId,
        method: r.method,
        failureReason: r.failureReason,
        feeStructureIds: (r.feeStructureIds || []).map((l) => l.id),
        expiresAt: r.expiresAt.toISOString(),
        paidAt: r.paidAt ? r.paidAt.toISOString() : null,
        createdAt: r.createdAt ? (r.createdAt as Date).toISOString() : null,
      })),
    };
  }

  // ────────────────────────────────────────────────────────────────── refunds

  /**
   * Full-amount refund. The order flips to `refunded` only when the gateway's
   * refund.processed webhook lands — same trust model as capture.
   */
  async refundOrder(institutionCode: string, orderId: string, input: RefundOrderInput) {
    if (!db) throw httpError(503, 'DB_UNAVAILABLE', 'Database not available');
    const [order] = await db
      .select()
      .from(paymentOrders)
      .where(and(eq(paymentOrders.id, orderId), eq(paymentOrders.institutionCode, institutionCode)))
      .limit(1);
    if (!order) throw httpError(404, 'ORDER_NOT_FOUND', 'Payment order not found.');
    if (!REFUNDABLE_STATUSES.includes(order.status)) {
      throw httpError(409, 'REFUND_NOT_ALLOWED', `Order is ${order.status} and cannot be refunded.`);
    }
    if (!order.gatewayPaymentId) {
      throw httpError(409, 'NO_GATEWAY_PAYMENT', 'Order has no captured gateway payment to refund.');
    }

    const merchant = await getMerchantCredentials(institutionCode);
    const gateway = resolveGateway(merchant.gateway);
    const result = await gateway.refund(merchant, {
      paymentId: order.gatewayPaymentId,
      amountPaise: order.amountPaise,
      reason: input.reason,
    });

    await db.insert(paymentTransactions).values({
      institutionCode,
      paymentOrderId: order.id,
      gateway: merchant.gateway,
      gatewayPaymentId: order.gatewayPaymentId,
      amountPaise: order.amountPaise,
      status: 'refund_initiated',
      failureReason: input.reason || null,
    });

    return {
      orderId: order.id,
      refundId: result.refundId,
      status: result.status,
      note: 'Refund status will finalize when the gateway confirmation webhook arrives.',
    };
  }

  // ────────────────────────────────────────────────────────────────── webhook

  /**
   * Gateway webhook — the ONLY path to `paid`.
   *
   * Tenant resolution: path :institutionCode selects which secret verifies the
   * signature; the payment_orders row (looked up by gateway ids) is the tenant
   * truth, and it must match the path tenant.
   */
  async handleWebhook(institutionCode: string, rawBody: Buffer, signature: string) {
    const merchant = await getWebhookCredentials(institutionCode);
    if (!merchant) throw httpError(404, 'PAYMENT_NOT_CONFIGURED', 'Payment configuration not found.');

    const gateway = resolveGateway(merchant.gateway);
    if (!gateway.verifyWebhookSignature(rawBody, signature, merchant.webhookSecret)) {
      throw httpError(401, 'INVALID_SIGNATURE', 'Invalid webhook signature.');
    }

    const event = gateway.parseWebhook(rawBody);
    if (event.type === 'unknown') return { result: 'ignored' as const };

    const eventKey = createHash('sha256').update(rawBody).digest('hex');

    const order = await this.findOrderForEvent(institutionCode, event);
    if (!order) {
      // Not persisted yet (gateway-order-id write race) — 500 so the gateway
      // retries shortly and the order is found on the next delivery.
      throw httpError(500, 'ORDER_NOT_FOUND', 'Order for this event is not yet available.');
    }
    if (order.institutionCode !== institutionCode) {
      throw httpError(404, 'ORDER_NOT_FOUND', 'Order for this event is not found.');
    }

    if (
      (event.type === 'payment.authorized' ||
        event.type === 'payment.captured' ||
        event.type === 'payment.failed') &&
      event.amountPaise != null &&
      event.amountPaise !== order.amountPaise
    ) {
      // Never credit a mismatched amount. This is a permanent, non-retryable
      // condition — return 200 so the gateway stops retrying (a thrown error
      // would make it redeliver for days). Ops alerting is the console.error;
      // wire a real pager/webhook here in production.
      console.error(
        `[payments] AMOUNT_MISMATCH order=${order.id} expected=${order.amountPaise} got=${event.amountPaise}`
      );
      return { result: 'ignored' as const };
    }

    let notifyInfo: { studentId: string; amount: number; receiptNo: string } | null = null;

    try {
      notifyInfo = await withTransaction(async (tx) => {
        const lockedRows = await tx
          .select()
          .from(paymentOrders)
          .where(eq(paymentOrders.id, order.id))
          .for('update');
        const row = lockedRows[0];
        if (!row) throw httpError(500, 'ORDER_NOT_FOUND', 'Order for this event is not available.');

        // Exact-retry idempotency (same delivered body).
        if (row.webhookEventId === eventKey) return null;

        if (event.type === 'payment.captured') {
          let pendingNotify: { studentId: string; amount: number; receiptNo: string } | null = null;
          const [updated] = await tx
            .update(paymentOrders)
            .set({
              status: 'paid',
              gatewayPaymentId: event.paymentId || row.gatewayPaymentId,
              method: (event.method || row.method || '').slice(0, 30) || null,
              paidAt: new Date(),
              webhookEventId: eventKey,
              gatewayCallback: event.callback,
              failureReason: null,
              updatedAt: new Date(),
            })
            .where(and(eq(paymentOrders.id, row.id), inArray(paymentOrders.status, CREDITABLE_STATUSES)))
            .returning();
          if (!updated) return null; // already paid/refunded by a prior event → 200

          // Idempotency belt: never double-insert fee rows for one order.
          const existing = await tx
            .select({ id: feePayments.id })
            .from(feePayments)
            .where(eq(feePayments.paymentOrderId, row.id))
            .limit(1);
          if (existing.length === 0) {
            const lines = row.feeStructureIds || [];
            if (lines.length === 0) {
              console.error(`[payments] order ${row.id} paid with NO fee lines snapshot`);
            }
            let lastReceipt = '';
            for (const line of lines) {
              const receiptNo = await nextReceiptNo(tx, institutionCode);
              lastReceipt = receiptNo;
              await tx.insert(feePayments).values({
                institutionCode,
                feeStructureId: line.id,
                studentId: row.studentId,
                amount: (line.amountPaise / 100).toFixed(2),
                paymentMethod: normalizeMethod(event.method),
                paymentDate: new Date().toISOString().slice(0, 10),
                status: 'paid',
                receiptNo,
                paymentOrderId: row.id,
                gatewayPaymentId: event.paymentId || null,
                notes: `Online payment (order ${row.id})`,
                createdBy: 'system:webhook',
              });
            }
            if (lines.length > 0) {
              pendingNotify = {
                studentId: row.studentId,
                amount: row.amountPaise / 100,
                receiptNo: lastReceipt,
              };
            }
          }

          await tx.insert(paymentTransactions).values({
            institutionCode,
            paymentOrderId: row.id,
            gateway: merchant.gateway,
            gatewayPaymentId: event.paymentId || null,
            amountPaise: row.amountPaise,
            method: (event.method || '').slice(0, 30) || null,
            status: 'success',
          });
          return pendingNotify;
        }

        if (event.type === 'payment.failed') {
          const [updated] = await tx
            .update(paymentOrders)
            .set({
              status: 'failed',
              failureReason: (event.failureReason || 'Payment failed').slice(0, 500),
              method: (event.method || '').slice(0, 30) || null,
              webhookEventId: eventKey,
              gatewayCallback: event.callback,
              updatedAt: new Date(),
            })
            .where(and(eq(paymentOrders.id, row.id), inArray(paymentOrders.status, FAILURE_STATUSES)))
            .returning();
          if (!updated) return null;
          await tx.insert(paymentTransactions).values({
            institutionCode,
            paymentOrderId: row.id,
            gateway: merchant.gateway,
            gatewayPaymentId: event.paymentId || null,
            amountPaise: row.amountPaise,
            method: (event.method || '').slice(0, 30) || null,
            status: 'failure',
            failureReason: (event.failureReason || 'Payment failed').slice(0, 500),
          });
          return null;
        }

        if (event.type === 'payment.authorized') {
          await tx
            .update(paymentOrders)
            .set({
              status: 'authorized',
              gatewayPaymentId: event.paymentId || row.gatewayPaymentId,
              method: (event.method || '').slice(0, 30) || null,
              webhookEventId: eventKey,
              gatewayCallback: event.callback,
              updatedAt: new Date(),
            })
            .where(and(eq(paymentOrders.id, row.id), eq(paymentOrders.status, 'created')));
          return null;
        }

        if (event.type === 'refund.processed') {
          const refundPaise = event.refundAmountPaise ?? row.amountPaise;
          const fullyRefunded = refundPaise >= row.amountPaise;
          const [updated] = await tx
            .update(paymentOrders)
            .set({
              status: fullyRefunded ? 'refunded' : 'partially_refunded',
              webhookEventId: eventKey,
              gatewayCallback: event.callback,
              updatedAt: new Date(),
            })
            .where(and(eq(paymentOrders.id, row.id), inArray(paymentOrders.status, REFUNDABLE_STATUSES)))
            .returning();
          if (!updated) return null;
          if (fullyRefunded) {
            await tx
              .update(feePayments)
              .set({ status: 'refunded', updatedAt: new Date() })
              .where(eq(feePayments.paymentOrderId, row.id));
          }
          await tx.insert(paymentTransactions).values({
            institutionCode,
            paymentOrderId: row.id,
            gateway: merchant.gateway,
            gatewayPaymentId: event.paymentId || row.gatewayPaymentId,
            amountPaise: refundPaise,
            status: 'refund_processed',
          });
        }
        return null;
      });
    } catch (err: any) {
      if (isUniqueViolation(err)) return { result: 'duplicate' as const };
      throw err;
    }

    if (notifyInfo) {
      try {
        notifyFeePaid({
          institutionCode,
          studentId: notifyInfo.studentId,
          amount: String(notifyInfo.amount),
          receiptNo: notifyInfo.receiptNo,
          paymentId: order.id,
        });
      } catch (err: any) {
        console.warn(`[payments] notifyFeePaid failed: ${err?.message || err}`);
      }
    }

    return { result: 'processed' as const };
  }

  /** Locate the local order for a gateway event (tenant-scoped). */
  private async findOrderForEvent(institutionCode: string, event: GatewayPaymentEvent) {
    if (!db) throw httpError(503, 'DB_UNAVAILABLE', 'Database not available');
    const scope = (q: any) =>
      and(eq(paymentOrders.institutionCode, institutionCode), q);

    if (event.orderId) {
      const [byGateway] = await db
        .select()
        .from(paymentOrders)
        .where(scope(eq(paymentOrders.gatewayOrderId, event.orderId)))
        .limit(1);
      if (byGateway) return byGateway;
    }
    if (event.notesOrderId) {
      const [byNotes] = await db
        .select()
        .from(paymentOrders)
        .where(scope(eq(paymentOrders.id, event.notesOrderId)))
        .limit(1);
      if (byNotes) return byNotes;
    }
    if (event.paymentId) {
      const [byPayment] = await db
        .select()
        .from(paymentOrders)
        .where(scope(eq(paymentOrders.gatewayPaymentId, event.paymentId)))
        .limit(1);
      if (byPayment) return byPayment;
    }
    return undefined;
  }

  // ─────────────────────────────────────────────────────────── expiry sweep

  /** Expires stale open orders across all tenants (sweeper + lazy paths). */
  async expireStaleOrders(): Promise<number> {
    if (!db) return 0;
    const rows = await db
      .update(paymentOrders)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(
        and(
          inArray(paymentOrders.status, OPEN_STATUSES),
          lt(paymentOrders.expiresAt, new Date())
        )
      )
      .returning({ id: paymentOrders.id });
    return rows.length;
  }
}

function normalizeMethod(method: string | null | undefined): string {
  const m = (method || '').toLowerCase();
  if (m === 'upi_collect' || m === 'upi_intent' || m === 'qr') return 'upi';
  if (m === 'netbanking' || m === 'net_banking') return 'bank_transfer';
  if (!m) return 'online';
  return m.slice(0, 30);
}

export const paymentService = new PaymentService();
