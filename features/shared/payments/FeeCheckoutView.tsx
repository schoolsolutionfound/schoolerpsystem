import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Type-only: erased at compile time, so Expo Go never evaluates the native module.
import type RazorpaySdk from 'react-native-razorpay';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import {
  createPaymentOrderApi,
  cancelPaymentOrderApi,
  getPaymentOrderApi,
  type CreatePaymentOrderResult,
} from '../../../api/payments';

/**
 * FeeCheckoutView — Zomato-style online fee checkout (PAYMENTS.md Phase 1).
 *
 * Trust model:
 *  - order + amount are created server-side; the SDK callback is NEVER treated
 *    as proof of payment — `paid` is only observed from GET /payments/:id
 *    (whose status is fed by the gateway webhook).
 *  - the SDK "success" only starts the confirmation poll; SDK "failure" runs a
 *    short poll too, because the webhook can still land (or the user retried).
 */

export interface FeeCheckoutLine {
  id: string;
  title: string;
  amount: number;
}

type Phase = 'ready' | 'creating' | 'checkout' | 'confirming' | 'paid' | 'failed' | 'timeout' | 'expired';

interface FeeCheckoutViewProps {
  visible: boolean;
  lines: FeeCheckoutLine[];
  merchantName?: string;
  studentLabel?: string;
  onClose: () => void;
  /** Fires only after the SERVER reports status=paid. */
  onPaid: () => void;
}

const CONFIRM_POLL_MS = 3000;
const CONFIRM_POLL_MAX = 30; // ~90s
const QUICK_POLL_MS = 2500;
const QUICK_POLL_MAX = 6; // ~15s after an SDK error/dismiss

/**
 * Lazy-load the native Razorpay SDK.
 *
 * `react-native-razorpay` links a native module, so a top-level `import`
 * throws the moment this file is evaluated in Expo Go (no native side) and
 * crashes every route that imports it. Requiring it only on tap keeps the rest
 * of the app running, and we surface a clear message if the module is absent.
 *
 * Returns null when the native module is unavailable (e.g. Expo Go).
 */
function loadRazorpaySdk(): typeof RazorpaySdk | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-razorpay');
    return (mod?.default || mod) as typeof RazorpaySdk;
  } catch {
    return null;
  }
}

/**
 * Web checkout (Firebase/web): loads Razorpay Checkout.js and opens it with the
 * server-created order. The `handler` result is UNTRUSTED — the caller still
 * confirms via `GET /payments/:id` (webhook truth), same as the native path.
 */
function loadWebRazorpayCtor(): Promise<any> {
  const w = (globalThis as any).window;
  const doc = (globalThis as any).document;
  if (!w || !doc) {
    return Promise.reject(new Error('Web checkout is unavailable.'));
  }
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  return new Promise((resolve, reject) => {
    const s = doc.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve((globalThis as any).window.Razorpay);
    s.onerror = () => reject(new Error('Could not load Razorpay checkout.'));
    doc.head.appendChild(s);
  });
}

function openWebCheckout(
  order: CreatePaymentOrderResult,
  merchantName: string,
  description: string
): Promise<void> {
  return loadWebRazorpayCtor().then(
    (RazorpayCtor: any) =>
      new Promise<void>((resolve, reject) => {
        let settled = false;
        const settleOk = () => {
          if (!settled) {
            settled = true;
            resolve();
          }
        };
        const settleErr = (e: any) => {
          if (!settled) {
            settled = true;
            reject(e);
          }
        };
        const options = {
          key: order.keyId,
          amount: order.amountPaise,
          currency: order.currency,
          order_id: order.gatewayOrderId,
          name: merchantName,
          description,
          theme: { color: '#FDC836' },
          timeout: 300,
          handler: (response: any) => {
            if (
              response?.razorpay_order_id &&
              response.razorpay_order_id !== order.gatewayOrderId
            ) {
              settleErr(new Error('Payment order mismatch.'));
              return;
            }
            settleOk();
          },
          modal: {
            ondismiss: () => settleErr(new Error('Payment dismissed.')),
          },
        };
        const rzp = new RazorpayCtor(options);
        if (rzp && typeof rzp.on === 'function') {
          rzp.on('payment.failed', (resp: any) => {
            settleErr(
              new Error(resp?.error?.description || 'Payment failed at the gateway.')
            );
          });
        }
        rzp.open();
      })
  );
}

export const FeeCheckoutView: React.FC<FeeCheckoutViewProps> = ({
  visible,
  lines,
  merchantName = 'School',
  studentLabel,
  onClose,
  onPaid,
}) => {
  const [phase, setPhase] = useState<Phase>('ready');
  const [error, setError] = useState<string | null>(null);

  const orderRef = useRef<CreatePaymentOrderResult | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>('ready');
  const paidNotifiedRef = useRef(false);

  const setPhaseSafe = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const totalPaise = lines.reduce((sum, l) => sum + Math.round(l.amount * 100), 0);
  const totalRupees = totalPaise / 100;

  /** Server-truth confirmation loop. fallbackPhase = where to land if still open. */
  const startConfirming = useCallback(
    (mode: 'full' | 'quick') => {
      stopPolling();
      const max = mode === 'full' ? CONFIRM_POLL_MAX : QUICK_POLL_MAX;
      const interval = mode === 'full' ? CONFIRM_POLL_MS : QUICK_POLL_MS;
      const fallback: Phase = mode === 'full' ? 'timeout' : 'ready';
      const fallbackError =
        mode === 'full'
          ? null
          : 'Payment was not completed. You can try again — you will not be charged twice.';
      paidNotifiedRef.current = false;
      setPhaseSafe('confirming');
      setError(null);

      let attempts = 0;
      pollTimer.current = setInterval(async () => {
        const order = orderRef.current;
        if (!order) {
          stopPolling();
          return;
        }
        attempts += 1;
        try {
          const status = await getPaymentOrderApi(order.orderId);
          if (status.status === 'paid') {
            stopPolling();
            setPhaseSafe('paid');
            if (!paidNotifiedRef.current) {
              paidNotifiedRef.current = true;
              onPaid();
            }
            return;
          }
          if (status.status === 'failed') {
            stopPolling();
            setPhaseSafe('failed');
            setError(status.failureReason || 'The payment failed at the gateway.');
            return;
          }
          if (status.status === 'expired' || status.status === 'cancelled') {
            stopPolling();
            setPhaseSafe('expired');
            setError('This payment session expired before completion.');
            return;
          }
          if (status.status === 'refunded' || status.status === 'partially_refunded') {
            stopPolling();
            setPhaseSafe('failed');
            setError('This payment was refunded.');
            return;
          }
          if (attempts >= max) {
            stopPolling();
            setPhaseSafe(fallback);
            setError((prev) => prev || fallbackError);
            return;
          }
        } catch {
          // Network blips are fine — keep polling until max attempts.
          if (attempts >= max) {
            stopPolling();
            setPhaseSafe(fallback);
            setError((prev) => prev || fallbackError);
          }
        }
      }, interval);
    },
    [onPaid, setPhaseSafe, stopPolling]
  );

  const handlePay = useCallback(async () => {
    if (lines.length === 0) return;
    const isWeb = Platform.OS === 'web';
    let nativeRazorpay: typeof RazorpaySdk | null = null;
    if (!isWeb) {
      // Native: bail out before creating an order if the SDK is unavailable
      // (e.g. Expo Go), so we never leave an orphan open order.
      nativeRazorpay = loadRazorpaySdk();
      if (!nativeRazorpay || typeof nativeRazorpay.open !== 'function') {
        setError(
          'Online payments require a development build. Build the app with `npx expo run:ios` (or EAS) — the payment SDK is not available in Expo Go.'
        );
        return;
      }
    }
    stopPolling();
    setError(null);
    setPhaseSafe('creating');
    try {
      let order: CreatePaymentOrderResult;
      try {
        order = await createPaymentOrderApi(lines.map((l) => l.id));
      } catch (e: any) {
        // Picking a different fee while an older checkout is still open:
        // free the old order and retry once so fee switching just works.
        if (e?.code === 'OPEN_ORDER_EXISTS' && orderRef.current) {
          try {
            await cancelPaymentOrderApi(orderRef.current.orderId);
          } catch {
            // Best-effort — the retry below decides the outcome.
          }
          orderRef.current = null;
          order = await createPaymentOrderApi(lines.map((l) => l.id));
        } else {
          throw e;
        }
      }
      orderRef.current = order;
      setPhaseSafe('checkout');
      const description =
        lines.length === 1 ? lines[0].title : `School fees (${lines.length} items)`;
      try {
        if (isWeb) {
          await openWebCheckout(order, merchantName, description);
        } else {
          await nativeRazorpay!.open({
            key: order.keyId,
            amount: order.amountPaise,
            currency: order.currency,
            order_id: order.gatewayOrderId,
            name: merchantName,
            description,
            theme: { color: '#FDC836' },
            timeout: 300,
          });
        }
        // SDK says success — UNTRUSTED. Confirm with the server (webhook truth).
        startConfirming('full');
      } catch (sdkErr: any) {
        // Dismissed / failed in checkout. A webhook may still land, so do a
        // short confirmation pass before declaring failure.
        const description =
          sdkErr?.error?.description || sdkErr?.description || sdkErr?.code || '';
        startConfirming('quick');
        if (!description) return;
        // Surface the gateway reason only if the quick poll ends in `ready`.
        setError((prev) => prev || description);
      }
    } catch (err: any) {
      setPhaseSafe('ready');
      setError(err?.message || 'Could not start the payment. Please try again.');
    }
  }, [lines, merchantName, setPhaseSafe, startConfirming, stopPolling]);

  /** Manual re-check from the timeout state. */
  const handleRecheck = useCallback(() => {
    startConfirming('full');
  }, [startConfirming]);

  const handleOpenAgain = useCallback(() => {
    setPhaseSafe('ready');
    setError(null);
    handlePay();
  }, [handlePay, setPhaseSafe]);

  const handleClose = useCallback(async () => {
    stopPolling();
    // Free the one-open-order slot so the parent can pick a different fee.
    // Cancelling only affects the local order state: if the gateway already
    // captured the money, the webhook still credits it (cancelled is still
    // creditable server-side), so this cannot lose a real payment.
    const order = orderRef.current;
    if (order) {
      try {
        await cancelPaymentOrderApi(order.orderId);
      } catch {
        // Already paid/terminal or network blip — a webhook, if any, is truth.
      }
      orderRef.current = null;
    }
    setPhaseSafe('ready');
    setError(null);
    onClose();
  }, [onClose, setPhaseSafe, stopPolling]);

  // Reset when the sheet opens.
  useEffect(() => {
    if (visible) {
      stopPolling();
      paidNotifiedRef.current = false;
      setError(null);
      setPhaseSafe('ready');
    } else {
      stopPolling();
    }
  }, [visible, setPhaseSafe, stopPolling]);

  // Stop timers on unmount.
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const renderStatusBody = () => {
    switch (phase) {
      case 'ready':
      case 'expired':
        return (
          <View>
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownLabel}>Paying for{studentLabel ? ` • ${studentLabel}` : ''}</Text>
              {lines.map((line) => (
                <View key={line.id} style={styles.lineRow}>
                  <Text style={styles.lineTitle} numberOfLines={1}>
                    {line.title}
                  </Text>
                  <Text style={styles.lineAmount}>₹{line.amount.toLocaleString('en-IN')}</Text>
                </View>
              ))}
              <View style={styles.lineDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalAmount}>₹{totalRupees.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#B91C1C" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.payBtn} onPress={handlePay} activeOpacity={0.8}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#111827" />
              <Text style={styles.payBtnText}>Pay ₹{totalRupees.toLocaleString('en-IN')}</Text>
            </TouchableOpacity>

            <View style={styles.methodsRow}>
              <MaterialCommunityIcons name="shield-check-outline" size={14} color="#15803D" />
              <Text style={styles.methodsText}>
                UPI • Cards • Netbanking — processed securely by Razorpay. Card details never touch
                this app or the school system.
              </Text>
            </View>

            <Text style={styles.offlineNote}>
              Prefer to pay in person? You can still pay at the school accounts office.
            </Text>
          </View>
        );

      case 'creating':
        return (
          <View style={styles.statusBox}>
            <ActivityIndicator size="large" color="#111827" />
            <Text style={styles.statusTitle}>Preparing secure checkout…</Text>
            <Text style={styles.statusSub}>Creating your payment order with the school.</Text>
          </View>
        );

      case 'checkout':
        return (
          <View style={styles.statusBox}>
            <ActivityIndicator size="large" color="#111827" />
            <Text style={styles.statusTitle}>Complete the payment</Text>
            <Text style={styles.statusSub}>
              Finish in the payment window that opened. Keep this screen open.
            </Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleClose}>
              <Text style={styles.secondaryBtnText}>Cancel order</Text>
            </TouchableOpacity>
          </View>
        );

      case 'confirming':
        return (
          <View style={styles.statusBox}>
            <ActivityIndicator size="large" color="#111827" />
            <Text style={styles.statusTitle}>Confirming payment…</Text>
            <Text style={styles.statusSub}>
              We&apos;re verifying with the gateway. This usually takes a few seconds — please keep
              the app open.
            </Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleClose}>
              <Text style={styles.secondaryBtnText}>Cancel order</Text>
            </TouchableOpacity>
          </View>
        );

      case 'paid':
        return (
          <View style={styles.statusBox}>
            <View style={[styles.statusIcon, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="check-circle" size={44} color="#15803D" />
            </View>
            <Text style={styles.statusTitle}>Payment successful</Text>
            <Text style={styles.statusSub}>
              ₹{totalRupees.toLocaleString('en-IN')} received. Your receipt is available in the fee
              statement.
            </Text>
            <TouchableOpacity style={styles.payBtn} onPress={handleClose} activeOpacity={0.8}>
              <Text style={styles.payBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        );

      case 'failed':
        return (
          <View style={styles.statusBox}>
            <View style={[styles.statusIcon, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="close-circle" size={44} color="#B91C1C" />
            </View>
            <Text style={styles.statusTitle}>Payment not completed</Text>
            <Text style={styles.statusSub}>{error || 'The payment could not be completed.'}</Text>
            <View style={styles.statusBtnRow}>
              <TouchableOpacity style={styles.payBtn} onPress={handleOpenAgain} activeOpacity={0.8}>
                <Text style={styles.payBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleClose}>
                <Text style={styles.secondaryBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'timeout':
        return (
          <View style={styles.statusBox}>
            <View style={[styles.statusIcon, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="clock-outline" size={44} color="#B45309" />
            </View>
            <Text style={styles.statusTitle}>Still confirming</Text>
            <Text style={styles.statusSub}>
              Your payment is being verified. If money was deducted it will reflect shortly — you
              will never be charged twice for the same fee.
            </Text>
            <View style={styles.statusBtnRow}>
              <TouchableOpacity style={styles.payBtn} onPress={handleRecheck} activeOpacity={0.8}>
                <Text style={styles.payBtnText}>Check Status</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleClose}>
                <Text style={styles.secondaryBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={styles.headerTitle}>Secure Fee Payment</Text>
              <Text style={styles.headerSub}>{merchantName}</Text>
            </View>
          </View>
            {phase !== 'confirming' && phase !== 'checkout' ? (
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.body}>{renderStatusBody()}</View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3EFE8',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE8',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827', fontFamily: FontFamily.bold },
  headerSub: { fontSize: 12, color: '#6B7280', fontFamily: FontFamily.medium },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3EFE8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { padding: 16 },
  breakdownCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: BorderRadius.card || 5,
    borderWidth: 1,
    borderColor: '#F6EEDB',
    padding: 14,
    gap: 8,
  },
  breakdownLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  lineTitle: { flex: 1, fontSize: 14, color: '#111827', fontFamily: FontFamily.medium },
  lineAmount: { fontSize: 14, fontWeight: '700', color: '#000000', fontFamily: FontFamily.bold },
  lineDivider: { height: 1, backgroundColor: '#F3EFE8', marginVertical: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#111827', fontFamily: FontFamily.bold },
  totalAmount: { fontSize: 20, fontWeight: '800', color: '#000000', fontFamily: FontFamily.bold },
  payBtn: {
    marginTop: 14,
    backgroundColor: '#FDC836',
    borderRadius: 5,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  payBtnText: { color: '#111827', fontWeight: '800', fontSize: 15, fontFamily: FontFamily.bold },
  secondaryBtn: {
    marginTop: 10,
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F3EFE8',
  },
  secondaryBtnText: { color: '#111827', fontWeight: '700', fontSize: 13, fontFamily: FontFamily.bold },
  methodsRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'flex-start' },
  methodsText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 17, fontFamily: FontFamily.medium },
  offlineNote: {
    marginTop: 10,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: FontFamily.medium,
  },
  statusBox: { alignItems: 'center', paddingVertical: 14, gap: 8 },
  statusIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusTitle: { fontSize: 16, fontWeight: '800', color: '#111827', fontFamily: FontFamily.bold, textAlign: 'center' },
  statusSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: FontFamily.medium,
  },
  statusBtnRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 10,
    marginTop: 12,
  },
  errorText: { flex: 1, fontSize: 12, color: '#B91C1C', lineHeight: 17, fontFamily: FontFamily.medium },
});

export default FeeCheckoutView;
