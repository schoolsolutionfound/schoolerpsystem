/**
 * Payment gateway abstraction — every payment operation in the codebase goes
 * through this interface so a second gateway (Cashfree, PhonePe) can be added
 * without touching order/webhook business logic.
 *
 * Multi-tenant rule: ALL methods receive per-tenant credentials explicitly.
 * No module-level singleton credentials — each institution's keys come from
 * institution_payment_config at call time.
 */

export interface MerchantCredentials {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

export interface CreateGatewayOrderInput {
  amountPaise: number;
  currency: string;
  /** Our payment_orders.id — echoed back in webhooks for reconciliation. */
  receipt: string;
  notes: Record<string, string>;
  /** Unix seconds — aligns gateway-side expiry with our expires_at. */
  expireBy?: number;
}

export interface GatewayOrderResult {
  gatewayOrderId: string;
}

export interface GatewayRefundResult {
  refundId: string;
  status: string;
}

export type GatewayEventType =
  | 'payment.authorized'
  | 'payment.captured'
  | 'payment.failed'
  | 'refund.processed'
  | 'unknown';

export interface GatewayPaymentEvent {
  type: GatewayEventType;
  paymentId: string;
  orderId: string | null;
  amountPaise: number | null;
  currency: string | null;
  method: string | null;
  failureReason: string | null;
  /** PII-minimised subset of the gateway payload, safe to persist for audit. */
  callback: Record<string, unknown>;
  /** fallback pointer to our order (from gateway notes) when the
   *  gateway_order_id column hasn't been written yet (webhook race). */
  notesOrderId: string | null;
  /** refund events only */
  refundAmountPaise: number | null;
}

export interface PaymentGateway {
  readonly name: string;
  createOrder(creds: MerchantCredentials, input: CreateGatewayOrderInput): Promise<GatewayOrderResult>;
  /** Constant-time HMAC-SHA256 verification over the RAW request body bytes. */
  verifyWebhookSignature(rawBody: Buffer, signature: string, webhookSecret: string): boolean;
  fetchPayment(creds: MerchantCredentials, paymentId: string): Promise<{ id: string; status: string; amountPaise: number }>;
  refund(creds: MerchantCredentials, input: { paymentId: string; amountPaise: number; reason?: string }): Promise<GatewayRefundResult>;
  parseWebhook(rawBody: Buffer): GatewayPaymentEvent;
}
