/**
 * @file StudentHomeFeeSummary.tsx
 * @description Student Fee Statements, Receipts, and Pending Dues Widget.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { formatINR } from '../../accountant/utils/financeUtils';
import { fetchMyFeesApi } from '../../../api/academics';
import { mapParentFees } from '../../accountant/utils/feeMappers';
import { IncomeRecord } from '../../accountant/types/finance';
import { useUserStore } from '../../../store/useUserStore';
import { FeeCheckoutView, FeeCheckoutLine } from '../../shared/payments/FeeCheckoutView';

export const StudentHomeFeeSummary: React.FC = () => {
  const institutionName = useUserStore((s) => s.institutionName) || 'School';
  const [fees, setFees] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<IncomeRecord | null>(null);
  const [checkoutLines, setCheckoutLines] = useState<FeeCheckoutLine[] | null>(null);

  const loadFees = useCallback(async () => {
    try {
      const res = await fetchMyFeesApi();
      setFees(mapParentFees(Array.isArray(res) ? res : []));
      setFetchError(null);
    } catch (err: any) {
      setFetchError(err?.message || 'Could not load fee statement.');
      setFees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchMyFeesApi();
        if (cancelled) return;
        setFees(mapParentFees(Array.isArray(res) ? res : []));
        setFetchError(null);
      } catch (err: any) {
        if (cancelled) return;
        setFetchError(err?.message || 'Could not load fee statement.');
        setFees([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingAmount = fees
    .filter((f) => f.status !== 'paid')
    .reduce((sum, f) => sum + f.amount, 0);

  const pendingCount = fees.filter((f) => f.status !== 'paid').length;

  /** Checkout uses FEE STRUCTURE ids — the server derives amounts from them. */
  const toCheckoutLine = (fee: IncomeRecord): FeeCheckoutLine => ({
    id: fee.feeStructureId || fee.id,
    title: fee.title,
    amount: fee.amount,
  });

  const handlePayFee = (fee: IncomeRecord) => setCheckoutLines([toCheckoutLine(fee)]);

  const handlePayAll = () => {
    const due = fees.filter((f) => f.status !== 'paid');
    if (due.length === 0) return;
    setCheckoutLines(due.map(toCheckoutLine));
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#F4C430" />
        <Text style={styles.centerText}>Loading fee statement…</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.centerBox}>
        <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#DC3545" />
        <Text style={styles.centerText}>{fetchError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadFees(); }}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="wallet-outline" size={20} color="#16A34A" />
          <Text style={styles.headerTitle}>Fee Invoices & Dues</Text>
        </View>
        {pendingAmount > 0 ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Pending: {formatINR(pendingAmount)}</Text>
          </View>
        ) : (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>All Dues Cleared</Text>
          </View>
        )}
      </View>

      {pendingCount > 0 && pendingAmount > 0 ? (
        <TouchableOpacity style={styles.payAllBtn} onPress={handlePayAll} activeOpacity={0.8}>
          <MaterialCommunityIcons name="lightning-bolt" size={14} color="#1A1B1C" />
          <Text style={styles.payAllBtnText}>Pay All Dues • {formatINR(pendingAmount)}</Text>
        </TouchableOpacity>
      ) : null}

      {/* Fee List */}
      <View style={styles.list}>
        {fees.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="receipt-text-outline" size={36} color="#E8E5DC" />
            <Text style={styles.emptyTitle}>No fee records</Text>
            <Text style={styles.emptySub}>No fees are assigned to you yet.</Text>
          </View>
        ) : (
          fees.map((fee) => {
            const isPaid = fee.status === 'paid';

            return (
              <View key={fee.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.feeTitle}>{fee.title}</Text>
                    <Text style={styles.feeSub}>
                      {fee.category || 'Fee'} • {isPaid ? `Paid on ${fee.paymentDate || fee.dueDate}` : `Due by ${fee.dueDate || 'N/A'}`}
                    </Text>
                  </View>

                  <View style={styles.cardRight}>
                    <Text style={[styles.amountText, isPaid ? styles.paidText : styles.dueText]}>
                      {formatINR(fee.amount)}
                    </Text>
                    <View style={[styles.statusTag, isPaid ? styles.statusPaid : styles.statusPending]}>
                      <Text style={[styles.statusTagText, isPaid ? styles.statusTextPaid : styles.statusTextPending]}>
                        {isPaid ? 'PAID' : 'PENDING'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  {isPaid ? (
                    <TouchableOpacity style={styles.receiptBtn} onPress={() => setSelectedReceipt(fee)}>
                      <MaterialCommunityIcons name="file-document-outline" size={14} color="#F4C430" />
                      <Text style={styles.receiptBtnText}>View Receipt{fee.receiptNo ? ` (${fee.receiptNo})` : ''}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.payRow}>
                      <TouchableOpacity
                        style={styles.payNowBtn}
                        onPress={() => handlePayFee(fee)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="lightning-bolt" size={13} color="#FFFFFF" />
                        <Text style={styles.payNowBtnText}>Pay Now</Text>
                      </TouchableOpacity>
                      <View style={styles.payNote}>
                        <MaterialCommunityIcons name="information-outline" size={13} color="#6B6B6B" />
                        <Text style={styles.payNoteText}>or at the accounts office</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <Modal visible={!!selectedReceipt} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.receiptBox}>
              <View style={styles.receiptHeader}>
                <MaterialCommunityIcons name="school" size={28} color="#F4C430" />
                <Text style={styles.receiptSchoolName}>{institutionName || 'School'}</Text>
                <Text style={styles.receiptSubtitle}>Official Fee Payment Receipt</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.receiptBody}>
                <View style={styles.receiptRow}>
                  <Text style={styles.rLabel}>Receipt No:</Text>
                  <Text style={styles.rVal}>{selectedReceipt.receiptNo || '—'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.rLabel}>Fee Head:</Text>
                  <Text style={styles.rVal}>{selectedReceipt.title}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.rLabel}>Payment Date:</Text>
                  <Text style={styles.rVal}>{selectedReceipt.paymentDate || selectedReceipt.dueDate || '—'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.rLabel}>Payment Channel:</Text>
                  <Text style={styles.rVal}>{selectedReceipt.paymentMethod || 'School Office'}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.rLabel}>Status:</Text>
                  <Text style={[styles.rVal, { color: '#16A34A', fontWeight: '800' }]}>SUCCESS / PAID</Text>
                </View>

                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Amount Paid</Text>
                  <Text style={styles.totalVal}>{formatINR(selectedReceipt.amount)}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedReceipt(null)}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Online checkout — Razorpay, webhook-confirmed */}
      <FeeCheckoutView
        visible={checkoutLines !== null}
        lines={checkoutLines || []}
        merchantName={institutionName}
        studentLabel={undefined}
        onClose={() => setCheckoutLines(null)}
        onPaid={() => loadFees()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  centerText: { fontSize: 13, color: '#6B6B6B', fontFamily: FontFamily.regular, textAlign: 'center', paddingHorizontal: 20 },
  retryBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', fontFamily: FontFamily.bold },
  emptyBox: { alignItems: 'center', paddingVertical: 30, gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.extrabold },
  emptySub: { fontSize: 12, color: '#6B6B6B', fontFamily: FontFamily.regular },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.extrabold },
  pendingBadge: { backgroundColor: 'rgba(220,53,69,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: '#DC3545', fontFamily: FontFamily.bold },
  paidBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  paidBadgeText: { fontSize: 11, fontWeight: '700', color: '#15803D', fontFamily: FontFamily.bold },
  list: { gap: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, marginRight: 10 },
  feeTitle: { fontSize: 14, fontWeight: '700', color: '#1A1B1C', marginBottom: 3, fontFamily: FontFamily.bold },
  feeSub: { fontSize: 11, color: '#6B6B6B', fontFamily: FontFamily.regular },
  cardRight: { alignItems: 'flex-end' },
  amountText: { fontSize: 15, fontWeight: '800', fontFamily: FontFamily.extrabold },
  paidText: { color: '#16A34A' },
  dueText: { color: '#DC3545' },
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  statusPaid: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: 'rgba(220,53,69,0.08)' },
  statusTagText: { fontSize: 9, fontWeight: '800', fontFamily: FontFamily.extrabold },
  statusTextPaid: { color: '#16A34A' },
  statusTextPending: { color: '#DC3545' },
  actionRow: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F7F5EE' },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(244,196,48,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  receiptBtnText: { fontSize: 11, fontWeight: '700', color: '#F4C430', fontFamily: FontFamily.bold },
  payNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  payNoteText: { fontSize: 11, color: '#6B6B6B', fontFamily: FontFamily.regular },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1B1C',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  payNowBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', fontFamily: FontFamily.extrabold },
  payAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.card,
    paddingVertical: 10,
    marginBottom: 10,
  },
  payAllBtnText: {
    color: '#1A1B1C',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FontFamily.extrabold,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  receiptHeader: { alignItems: 'center' },
  receiptSchoolName: { fontSize: 17, fontWeight: '800', color: '#1A1B1C', marginTop: 4, fontFamily: FontFamily.extrabold },
  receiptSubtitle: { fontSize: 11, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FontFamily.regular },
  divider: { height: 1, backgroundColor: '#E8E5DC', marginVertical: 12 },
  receiptBody: { gap: 6 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rLabel: { fontSize: 12, color: '#6B6B6B', fontFamily: FontFamily.regular },
  rVal: { fontSize: 12, fontWeight: '700', color: '#1A1B1C', fontFamily: FontFamily.bold },
  totalBox: { backgroundColor: '#DCFCE7', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  totalLabel: { fontSize: 11, color: '#15803D', textTransform: 'uppercase', fontWeight: '700', fontFamily: FontFamily.bold },
  totalVal: { fontSize: 20, fontWeight: '800', color: '#15803D', marginTop: 2, fontFamily: FontFamily.extrabold },
  closeBtn: { backgroundColor: '#F4C430', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 14 },
  closeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, fontFamily: FontFamily.bold },
});
