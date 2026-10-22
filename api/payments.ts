import { apiClient } from './client';

/**
 * Payments API — online fee checkout (see PAYMENTS.md).
 *
 * Trust rules mirrored from the server:
 *  - the client only ever sends fee line IDs (amounts come back from server)
 *  - `paid` is only ever observed via GET status (fed by the webhook), never
 *    assumed from the gateway SDK callback.
 */

export interface CreatePaymentOrderResult {
  orderId: string;
  gatewayOrderId: string;
  keyId: string;
  amountPaise: number;
  currency: string;
  expiresAt: string;
}

export interface PaymentOrderStatus {
  orderId: string;
  status: 'created' | 'authorized' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'refunded' | 'partially_refunded';
  amountPaise: number;
  currency: string;
  method: string;
  failureReason: string;
  expiresAt: string;
  paidAt: string | null;
  feeStructureIds: string[];
}

export interface PaymentOrderListItem {
  orderId: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  payerRole: string;
  amountPaise: number;
  currency: string;
  status: string;
  gateway: string;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  method: string | null;
  failureReason: string | null;
  feeStructureIds: string[];
  expiresAt: string;
  paidAt: string | null;
  createdAt: string | null;
}

export interface PaymentOrdersPage {
  total: number;
  limit: number;
  offset: number;
  orders: PaymentOrderListItem[];
}

export interface PublicPaymentConfig {
  gateway: string;
  keyId: string;
  hasKeySecret: boolean;
  hasWebhookSecret: boolean;
  isActive: boolean;
  webhookUrl: string;
}

/** Start (or resume) a checkout for the given unpaid fee lines. */
export async function createPaymentOrderApi(feeStructureIds: string[]): Promise<CreatePaymentOrderResult> {
  return apiClient('/payments/order', {
    method: 'POST',
    body: JSON.stringify({ feeStructureIds }),
  });
}

/** UX status poll — server truth (fed by webhook). */
export async function getPaymentOrderApi(orderId: string): Promise<PaymentOrderStatus> {
  return apiClient(`/payments/${encodeURIComponent(orderId)}`);
}

/** Frees the one-open-order slot (safe even if payment is in flight). */
export async function cancelPaymentOrderApi(orderId: string): Promise<{ orderId: string; status: string }> {
  return apiClient(`/payments/${encodeURIComponent(orderId)}/cancel`, { method: 'POST' });
}

/** Accountant/admin reconciliation list. */
export async function fetchPaymentOrdersApi(params?: {
  status?: string;
  studentId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<PaymentOrdersPage> {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return apiClient(`/payments/orders${qs ? `?${qs}` : ''}`);
}

/** Admin full refund of a captured order. */
export async function refundPaymentOrderApi(orderId: string, reason?: string): Promise<{
  orderId: string;
  refundId: string;
  status: string;
  note: string;
}> {
  return apiClient(`/payments/${encodeURIComponent(orderId)}/refund`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  });
}

/** Admin: read payment settings (secrets are never returned). */
export async function fetchPaymentConfigApi(): Promise<PublicPaymentConfig | null> {
  return apiClient('/payments/config');
}

/** Admin: save payment settings (secrets encrypted server-side, write-only —
 *  omit a secret to keep the stored value). */
export async function savePaymentConfigApi(payload: {
  gateway?: 'razorpay';
  keyId: string;
  keySecret?: string;
  webhookSecret?: string;
  isActive?: boolean;
}): Promise<PublicPaymentConfig> {
  return apiClient('/payments/config', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
