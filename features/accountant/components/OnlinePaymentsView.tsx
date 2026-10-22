/**
 * @file OnlinePaymentsView.tsx
 * @description Accountant online-payment reconciliation (PAYMENTS.md Phase 6):
 *  - lists Razorpay payment orders for this institution (server-scoped)
 *  - status filter chips + load-more pagination
 *  - summary: collected / refunded / failed
 *  - admin-only full refund action (server enforces role; UI hides for accountant)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { formatINR } from '../utils/financeUtils';
import { showAlert } from '../../shared/utils/showAlert';
import { useUserStore } from '../../../store/useUserStore';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  fetchPaymentOrdersApi,
  refundPaymentOrderApi,
  type PaymentOrderListItem,
} from '../../../api/payments';

type StatusFilter = 'all' | 'paid' | 'failed' | 'created' | 'expired' | 'refunded';

const PAGE_SIZE = 25;

const STATUS_META: Record<string, { label: string; fg: string; bg: string; icon: string }> = {
  paid: { label: 'PAID', fg: '#171717', bg: '#F4C430', icon: 'check-circle' },
  partially_refunded: { label: 'PART REFUND', fg: '#171717', bg: '#FFF4C7', icon: 'swap-horizontal' },
  refunded: { label: 'REFUNDED', fg: '#6B6B6B', bg: '#F7F5EE', icon: 'undo-variant' },
  authorized: { label: 'AUTHORIZED', fg: '#6B6B6B', bg: '#F7F5EE', icon: 'shield-check-outline' },
  created: { label: 'OPEN', fg: '#6B6B6B', bg: '#F7F5EE', icon: 'clock-outline' },
  failed: { label: 'FAILED', fg: '#FFFFFF', bg: '#171717', icon: 'close-circle' },
  expired: { label: 'EXPIRED', fg: '#6B6B6B', bg: '#F7F5EE', icon: 'clock-alert-outline' },
  cancelled: { label: 'CANCELLED', fg: '#6B6B6B', bg: '#F7F5EE', icon: 'close' },
};

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'failed', label: 'Failed' },
  { key: 'created', label: 'Open' },
  { key: 'expired', label: 'Expired' },
  { key: 'refunded', label: 'Refunded' },
];

const STATUS_ACCENT: Record<string, string> = {
  paid: '#F4C430',
  partially_refunded: '#F4C430',
  refunded: '#E8E5DC',
  authorized: '#E8E5DC',
  created: '#E8E5DC',
  failed: '#171717',
  expired: '#E8E5DC',
  cancelled: '#E8E5DC',
};

const METHOD_LABELS: Record<string, string> = {
  card: 'Card',
  upi: 'UPI',
  upi_intent: 'UPI',
  netbanking: 'Net Banking',
  wallet: 'Wallet',
  emi: 'EMI',
};

const methodLabel = (m?: string | null): string => {
  if (!m) return '—';
  const key = m.toLowerCase();
  if (METHOD_LABELS[key]) return METHOD_LABELS[key];
  return m.charAt(0).toUpperCase() + m.slice(1);
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const OnlinePaymentsView: React.FC = () => {
  const userRole = useUserStore((s) => s.userRole);
  const isSuperAdmin = userRole === 'admin';

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [orders, setOrders] = useState<PaymentOrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const load = useCallback(
    async (offset: number) => {
      if (offset > 0) setLoadingMore(true);
      else setLoading(true);
      try {
        // The server status filter is a single enum — the "Refunded" chip
        // fetches both refund states and merges them newest-first.
        let list: PaymentOrderListItem[] = [];
        let totalCount = 0;
        if (filter === 'refunded') {
          const [a, b] = await Promise.all([
            fetchPaymentOrdersApi({ status: 'refunded', limit: PAGE_SIZE, offset }),
            fetchPaymentOrdersApi({ status: 'partially_refunded', limit: PAGE_SIZE, offset }),
          ]);
          list = [...(a?.orders || []), ...(b?.orders || [])].sort((x, y) =>
            String(y.createdAt || '').localeCompare(String(x.createdAt || ''))
          );
          totalCount = (a?.total || 0) + (b?.total || 0);
        } else {
          const page = await fetchPaymentOrdersApi({
            status: filter === 'all' ? undefined : filter,
            limit: PAGE_SIZE,
            offset,
          });
          list = Array.isArray(page?.orders) ? page.orders : [];
          totalCount = page?.total ?? list.length;
        }
        setTotal(totalCount);
        setOrders((prev) => (offset === 0 ? list : [...prev, ...list]));
        setError(null);
      } catch (err: any) {
        setError(err?.message || 'Could not load online payments.');
        if (offset === 0) setOrders([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    const id = setTimeout(() => load(0), 0);
    return () => clearTimeout(id);
  }, [load]);

  // Reload when the screen-level pull-to-refresh fires.
  const refreshTick = useFinanceStore((s) => s.refreshTick);
  const lastTickRef = useRef(refreshTick);
  useEffect(() => {
    if (refreshTick !== lastTickRef.current) {
      lastTickRef.current = refreshTick;
      load(0);
    }
  }, [refreshTick, load]);

  // Summary is computed from ALL loaded rows (not just the current page).
  const paidTotal = orders
    .filter((o) => o.status === 'paid' || o.status === 'partially_refunded')
    .reduce((sum, o) => sum + o.amountPaise, 0);
  const refundedCount = orders.filter(
    (o) => o.status === 'refunded' || o.status === 'partially_refunded'
  ).length;
  const failedCount = orders.filter((o) => o.status === 'failed').length;
  const openCount = orders.filter((o) => o.status === 'created' || o.status === 'authorized').length;

  const handleRefund = (order: PaymentOrderListItem) => {
    showAlert(
      'Confirm Refund',
      `Refund ${formatINR(order.amountPaise / 100)} to ${order.studentName || 'the student'}? This is initiated on Razorpay and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refund',
          style: 'destructive',
          onPress: async () => {
            setRefundingId(order.orderId);
            try {
              const res = await refundPaymentOrderApi(order.orderId, 'Refunded by accountant');
              showAlert('Refund Initiated', res?.note || 'Refund submitted to the gateway.');
              await load(0);
            } catch (err: any) {
              showAlert('Refund Failed', err?.message || 'Could not initiate the refund.');
            } finally {
              setRefundingId(null);
            }
          },
        },
      ]
    );
  };

  const renderRow = (order: PaymentOrderListItem) => {
    const meta = STATUS_META[order.status] || STATUS_META.created;
    const when = order.paidAt || order.createdAt || '';
    const dateLabel = when ? new Date(when).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
    const canRefund = isSuperAdmin && (order.status === 'paid' || order.status === 'partially_refunded');

    return (
      <View
        key={order.orderId}
        style={[styles.row, { borderLeftWidth: 3, borderLeftColor: STATUS_ACCENT[order.status] || '#E8E5DC' }]}
      >
        <View style={styles.rowLeft}>
          <View style={styles.rowTop}>
            <Text style={styles.studentName} numberOfLines={1}>
              {order.studentName || 'Student'}
            </Text>
            <Text style={styles.amount}>{formatINR(order.amountPaise / 100)}</Text>
          </View>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {order.rollNo ? `${order.rollNo} • ` : ''}
            Via: {methodLabel(order.method)} • {order.gateway}
            {order.payerRole ? ` • by ${cap(order.payerRole)}` : ''}
          </Text>
          <View style={styles.rowBottom}>
            <View style={[styles.statusTag, { backgroundColor: meta.bg }]}>
              <MaterialCommunityIcons name={meta.icon as any} size={11} color={meta.fg} />
              <Text style={[styles.statusTagText, { color: meta.fg }]}>{meta.label}</Text>
            </View>
            <Text style={styles.dateText}>{dateLabel}</Text>
          </View>
          {order.failureReason ? (
            <Text style={styles.failureText} numberOfLines={2}>
              {order.failureReason}
            </Text>
          ) : null}
          {order.gatewayPaymentId ? (
            <Text style={styles.gatewayId} numberOfLines={1}>
              {order.gatewayPaymentId}
            </Text>
          ) : null}
          {canRefund ? (
            <TouchableOpacity
              style={[styles.refundBtn, refundingId === order.orderId && { opacity: 0.6 }]}
              onPress={() => handleRefund(order)}
              disabled={refundingId === order.orderId}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="undo-variant" size={13} color="#171717" />
              <Text style={styles.refundBtnText}>
                {refundingId === order.orderId ? 'Refunding…' : 'Refund'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Online Payments</Text>

      {/* Charcoal summary hero */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>TOTAL COLLECTED</Text>
        <Text style={styles.heroAmount}>{formatINR(paidTotal / 100)}</Text>
        <View style={styles.heroStatsRow}>
          <View style={styles.heroStatBox}>
            <Text style={styles.heroStatValue}>{failedCount}</Text>
            <Text style={styles.heroStatLabel}>Failed</Text>
          </View>
          <View style={styles.heroStatBox}>
            <Text style={styles.heroStatValue}>{openCount}</Text>
            <Text style={styles.heroStatLabel}>Open</Text>
          </View>
          <View style={styles.heroStatBox}>
            <Text style={styles.heroStatValue}>{refundedCount}</Text>
            <Text style={styles.heroStatLabel}>Refunded</Text>
          </View>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#F4C430" />
          <Text style={styles.centerText}>Loading online payments…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#171717" />
          <Text style={styles.centerText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(0)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="credit-card-off-outline" size={44} color="#9A9A9A" />
          <Text style={styles.emptyTitle}>No online payments</Text>
          <Text style={styles.centerText}>
            Orders appear here the moment a parent or student starts an online checkout.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          <Text style={styles.countText}>
            Showing {orders.length} of {total} order{total === 1 ? '' : 's'}
          </Text>
          {orders.map(renderRow)}
          {orders.length < total ? (
            <TouchableOpacity
              style={[styles.loadMoreBtn, loadingMore && { opacity: 0.6 }]}
              onPress={() => load(orders.length)}
              disabled={loadingMore}
              activeOpacity={0.8}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color="#171717" />
              ) : (
                <Text style={styles.loadMoreText}>Load more</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 6 },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.extrabold,
    marginBottom: 10,
  },
  heroCard: {
    backgroundColor: '#171717',
    borderRadius: 5,
    padding: 14,
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F4C430',
    letterSpacing: 1.2,
  },
  heroAmount: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', marginTop: 3 },
  heroStatsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  heroStatBox: {
    flex: 1,
    backgroundColor: '#232425',
    borderRadius: 5,
    paddingVertical: 8,
    alignItems: 'center',
  },
  heroStatValue: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  heroStatLabel: { fontSize: 9, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  chipRow: { flexGrow: 0, marginBottom: 10 },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 5,
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#171717', borderColor: '#171717' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#6B6B6B', fontFamily: FontFamily.bold },
  chipTextActive: { color: '#FFFFFF' },
  centerBox: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  centerText: {
    fontSize: 12.5,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#171717', fontFamily: FontFamily.extrabold },
  retryBtn: { backgroundColor: '#F4C430', paddingHorizontal: 22, paddingVertical: 9, borderRadius: 5 },
  retryBtnText: { fontSize: 13, fontWeight: '800', color: '#171717', fontFamily: FontFamily.extrabold },
  list: { paddingBottom: 24, gap: 10 },
  countText: { fontSize: 11, color: '#6B6B6B', fontFamily: FontFamily.regular },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
  },
  rowLeft: { gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  studentName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#171717', fontFamily: FontFamily.bold },
  amount: { fontSize: 15, fontWeight: '800', color: '#171717', fontFamily: FontFamily.extrabold },
  rowMeta: { fontSize: 11, color: '#6B6B6B', fontFamily: FontFamily.regular },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  statusTagText: { fontSize: 9, fontWeight: '800', fontFamily: FontFamily.extrabold, letterSpacing: 0.3 },
  dateText: { fontSize: 10.5, color: '#6B6B6B', fontFamily: FontFamily.regular },
  failureText: { fontSize: 11, color: '#171717', fontFamily: FontFamily.regular, marginTop: 2, fontStyle: 'italic' },
  gatewayId: { fontSize: 10, color: '#9A9A9A', fontFamily: FontFamily.regular, marginTop: 2 },
  refundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#171717',
    backgroundColor: '#F7F5EE',
    borderRadius: 5,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
  },
  refundBtnText: { fontSize: 12, fontWeight: '800', color: '#171717', fontFamily: FontFamily.extrabold },
  loadMoreBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  loadMoreText: { fontSize: 13, fontWeight: '700', color: '#171717', fontFamily: FontFamily.bold },
});
