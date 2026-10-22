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
    // Resolve the native SDK first — if it is unavailable (Expo Go), bail out
    // BEFORE creating an order so we never leave an orphan open order.
    const Razorpay = loadRazorpaySdk();
    if (!Razorpay || typeof Razorpay.open !== 'function') {
      setError(
        'Online payments require a development build. Build the app with `npx expo run:ios` (or EAS) — the payment SDK is not available in Expo Go.'
      );
      return;
    }
    stopPolling();
    setError(null);
    setPhaseSafe('creating');
    try {
      const order = await createPaymentOrderApi(lines.map((l) => l.id));
      orderRef.current = order;
      setPhaseSafe('checkout');
      try {
        await Razorpay.open({
          key: order.keyId,
          amount: order.amountPaise,
          currency: order.currency,
          order_id: order.gatewayOrderId,
          name: merchantName,
          description:
            lines.length === 1 ? lines[0].title : `School fees (${lines.length} items)`,
          theme: { color: '#F4C430' },
          timeout: 300,
        });
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

  const handleClose = useCallback(() => {
    stopPolling();
    // Leave the order open on purpose: an identical retry resumes it, and a
    // payment already in flight at the gateway still settles via webhook
    // (cancel is deliberately NOT called here to avoid racing a real capture).
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
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC3545" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.payBtn} onPress={handlePay} activeOpacity={0.8}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#FFFFFF" />
              <Text style={styles.payBtnText}>Pay ₹{totalRupees.toLocaleString('en-IN')}</Text>
            </TouchableOpacity>

            <View style={styles.methodsRow}>
              <MaterialCommunityIcons name="shield-check-outline" size={14} color="#16A34A" />
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
            <ActivityIndicator size="large" color="#F4C430" />
            <Text style={styles.statusTitle}>Preparing secure checkout…</Text>
            <Text style={styles.statusSub}>Creating your payment order with the school.</Text>
          </View>
        );

      case 'checkout':
        return (
          <View style={styles.statusBox}>
            <ActivityIndicator size="large" color="#F4C430" />
            <Text style={styles.statusTitle}>Complete the payment</Text>
            <Text style={styles.statusSub}>
              Finish in the payment window that opened. Keep this screen open.
            </Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleClose}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );

      case 'confirming':
        return (
          <View style={styles.statusBox}>
            <ActivityIndicator size="large" color="#F4C430" />
            <Text style={styles.statusTitle}>Confirming payment…</Text>
            <Text style={styles.statusSub}>
              We&apos;re verifying with the gateway. This usually takes a few seconds — please keep
              the app open.
            </Text>
          </View>
        );

      case 'paid':
        return (
          <View style={styles.statusBox}>
            <View style={[styles.statusIcon, { backgroundColor: 'rgba(22,163,74,0.12)' }]}>
              <MaterialCommunityIcons name="check-circle" size={44} color="#16A34A" />
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
            <View style={[styles.statusIcon, { backgroundColor: 'rgba(220,53,69,0.1)' }]}>
              <MaterialCommunityIcons name="close-circle" size={44} color="#DC3545" />
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
            <View style={[styles.statusIcon, { backgroundColor: 'rgba(244,196,48,0.15)' }]}>
              <MaterialCommunityIcons name="clock-outline" size={44} color="#B8860B" />
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
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons name="shield-lock-outline" size={18} color="#1A1B1C" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Secure Fee Payment</Text>
                <Text style={styles.headerSub}>{merchantName}</Text>
              </View>
            </View>
            {phase !== 'confirming' && phase !== 'checkout' ? (
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color="#6B6B6B" />
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.modal || 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEDE6',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.bold },
  headerSub: { fontSize: 11, color: '#6B6B6B', fontFamily: FontFamily.regular },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F4EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { padding: 18 },
  breakdownCard: {
    backgroundColor: '#FBFAF6',
    borderRadius: BorderRadius.card || 12,
    borderWidth: 1,
    borderColor: '#EFEDE6',
    padding: 14,
    gap: 8,
  },
  breakdownLabel: { fontSize: 11, fontWeight: '700', color: '#6B6B6B', textTransform: 'uppercase' },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  lineTitle: { flex: 1, fontSize: 13, color: '#1A1B1C', fontFamily: FontFamily.regular },
  lineAmount: { fontSize: 13, fontWeight: '700', color: '#1A1B1C' },
  lineDivider: { height: 1, backgroundColor: '#EFEDE6', marginVertical: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, fontWeight: '700', color: '#1A1B1C' },
  totalAmount: { fontSize: 17, fontWeight: '800', color: '#1A1B1C' },
  payBtn: {
    marginTop: 14,
    backgroundColor: '#1A1B1C',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  payBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, fontFamily: FontFamily.bold },
  secondaryBtn: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D9D6CC',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryBtnText: { color: '#1A1B1C', fontWeight: '700', fontSize: 13 },
  methodsRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'flex-start' },
  methodsText: { flex: 1, fontSize: 11, color: '#6B6B6B', lineHeight: 16, fontFamily: FontFamily.regular },
  offlineNote: {
    marginTop: 10,
    fontSize: 11,
    color: '#8A8A8A',
    textAlign: 'center',
    fontFamily: FontFamily.regular,
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
  statusTitle: { fontSize: 16, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.bold, textAlign: 'center' },
  statusSub: {
    fontSize: 12.5,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 19,
    fontFamily: FontFamily.regular,
  },
  statusBtnRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(220,53,69,0.07)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(220,53,69,0.25)',
    padding: 10,
    marginTop: 12,
  },
  errorText: { flex: 1, fontSize: 12, color: '#B02A37', lineHeight: 17, fontFamily: FontFamily.regular },
});

export default FeeCheckoutView;
