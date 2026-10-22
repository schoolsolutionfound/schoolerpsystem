import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { useUserStore } from '../../../store/useUserStore';
import { fetchParentFeesApi } from '../../../api/academics';
import { mapParentFees } from '../../accountant/utils/feeMappers';
import { IncomeRecord } from '../../accountant/types/finance';
import { generateParentFeeReceiptPdf } from '../utils/receiptPdfGenerator';
import { FeeCheckoutView, FeeCheckoutLine } from '../../shared/payments/FeeCheckoutView';

export const ParentFeesView: React.FC = () => {
  const institutionName = useUserStore((s) => s.institutionName) || 'School';
  const childName = useUserStore((s) => s.childName) || '';
  const linkedStudentUSN = useUserStore((s) => s.linkedStudentUSN) || '';

  const [fees, setFees] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [checkoutLines, setCheckoutLines] = useState<FeeCheckoutLine[] | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<IncomeRecord | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const loadFees = useCallback(async () => {
    try {
      const res = await fetchParentFeesApi();
      setFees(mapParentFees(Array.isArray(res) ? res : []));
      setFetchError(null);
    } catch (err: any) {
      setFetchError(err?.message || 'Could not load fee statement.');
      setFees([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchParentFeesApi();
        if (cancelled) return;
        setFees(mapParentFees(Array.isArray(res) ? res : []));
        setFetchError(null);
      } catch (err: any) {
        if (cancelled) return;
        setFetchError(err?.message || 'Could not load fee statement.');
        setFees([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalDue = fees
    .filter((f) => f.status !== 'paid')
    .reduce((sum, f) => sum + f.amount, 0);

  const totalPaid = fees
    .filter((f) => f.status === 'paid')
    .reduce((sum, f) => sum + f.amount, 0);

  const nextDue = useMemo(() => {
    const pending = fees
      .filter((f) => f.status !== 'paid' && f.dueDate)
      .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
    return pending[0]?.dueDate || null;
  }, [fees]);

  const pendingCount = fees.filter((f) => f.status !== 'paid').length;

  /** Checkout needs FEE STRUCTURE ids — amounts are always server-derived from them. */
  const toCheckoutLine = (fee: IncomeRecord): FeeCheckoutLine => ({
    id: fee.feeStructureId || fee.id,
    title: fee.title,
    amount: fee.amount,
  });

  const handleOpenPay = (fee: IncomeRecord) => {
    setCheckoutLines([toCheckoutLine(fee)]);
  };

  const handlePayAllDues = () => {
    const due = fees.filter((f) => f.status !== 'paid');
    if (due.length === 0) return;
    setCheckoutLines(due.map(toCheckoutLine));
  };

  const handleOpenReceipt = (fee: IncomeRecord) => {
    setViewingReceipt(fee);
    setShowReceiptModal(true);
  };

  const handleDownloadReceiptPdf = async () => {
    if (!viewingReceipt || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await generateParentFeeReceiptPdf(viewingReceipt);
      setShowReceiptModal(false);
    } catch (err: any) {
      Alert.alert('Download Failed', err?.message || 'Could not generate receipt PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
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
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadFees(); }}
          tintColor="#1A1B1C"
          colors={['#1A1B1C']}
        />
      }
    >
      {/* Balance Summary Header Card */}
      <View style={styles.heroBalanceCard}>
        <View style={styles.heroBalanceTop}>
          <View>
            <Text style={styles.heroBalanceLabel}>PENDING DUES</Text>
            <Text style={styles.heroBalanceAmount}>₹{totalDue.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.paidBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#16A34A" />
            <Text style={styles.paidBadgeText}>₹{totalPaid.toLocaleString('en-IN')} Paid</Text>
          </View>
        </View>
        <Text style={styles.heroBalanceSub}>
          {nextDue
            ? `Next due date: ${nextDue} • ${pendingCount} item${pendingCount === 1 ? '' : 's'} pending`
            : pendingCount > 0
              ? `${pendingCount} item${pendingCount === 1 ? '' : 's'} pending`
              : 'All fees are cleared.'}
        </Text>
        {pendingCount > 0 && totalDue > 0 ? (
          <TouchableOpacity style={styles.payAllBtn} onPress={handlePayAllDues} activeOpacity={0.8}>
            <MaterialCommunityIcons name="lightning-bolt" size={14} color="#1A1B1C" />
            <Text style={styles.payAllBtnText}>
              Pay All Dues • ₹{totalDue.toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {fees.length === 0 ? (
        <View style={styles.emptyBox}>
          <MaterialCommunityIcons name="receipt-text-outline" size={44} color="#E8E5DC" />
          <Text style={styles.emptyTitle}>No fee records</Text>
          <Text style={styles.emptySub}>Link a student USN on your profile to view fees.</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Fee Breakdown & Invoices</Text>
          {fees.map((fee) => {
            const isPaid = fee.status === 'paid';
            return (
              <View key={fee.id} style={styles.feeCard}>
                <View style={styles.feeCardTop}>
                  <View style={styles.feeTitleGroup}>
                    <View
                      style={[
                        styles.feeIconCircle,
                        { backgroundColor: isPaid ? 'rgba(22,163,74,0.1)' : 'rgba(220,53,69,0.08)' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={isPaid ? 'receipt-text-check' : 'receipt-text-outline'}
                        size={20}
                        color={isPaid ? '#16A34A' : '#DC3545'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.feeTitle}>{fee.title}</Text>
                      <Text style={styles.feeTerm}>{fee.category || 'Fee'}</Text>
                    </View>
                  </View>
                  <Text style={styles.feeAmount}>₹{fee.amount.toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.feeDivider} />

                <View style={styles.feeCardBottom}>
                  <View>
                    <Text style={styles.feeDateLabel}>
                      {isPaid ? `Paid on ${fee.paymentDate}` : `Due by ${fee.dueDate || 'N/A'}`}
                    </Text>
                    {isPaid && fee.receiptNo ? (
                      <Text style={styles.receiptTag}>Rec #{fee.receiptNo}</Text>
                    ) : null}
                  </View>

                  {isPaid ? (
                    <TouchableOpacity
                      style={styles.receiptBtn}
                      onPress={() => handleOpenReceipt(fee)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="download" size={14} color="#F4C430" />
                      <Text style={styles.receiptBtnText}>Receipt</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.payNowBtn}
                      onPress={() => handleOpenPay(fee)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="lightning-bolt" size={14} color="#FFFFFF" />
                      <Text style={styles.payNowBtnText}>Pay Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* Online checkout — Razorpay, webhook-confirmed (server status is truth) */}
      <FeeCheckoutView
        visible={checkoutLines !== null}
        lines={checkoutLines || []}
        merchantName={institutionName}
        studentLabel={childName || linkedStudentUSN}
        onClose={() => setCheckoutLines(null)}
        onPaid={() => loadFees()}
      />

      {/* Official Receipt Modal */}
      <Modal visible={showReceiptModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptModalCard}>
            <View style={styles.receiptTopRow}>
              <View style={styles.receiptBadge}>
                <MaterialCommunityIcons name="school" size={24} color="#F4C430" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.receiptSchoolName}>{institutionName}</Text>
                  <Text style={styles.receiptSubtext}>Official Fee Receipt</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptMeta}>
              <View>
                <Text style={styles.receiptMetaLabel}>Receipt No</Text>
                <Text style={styles.receiptMetaVal}>{viewingReceipt?.receiptNo || '—'}</Text>
              </View>
              <View>
                <Text style={styles.receiptMetaLabel}>Date of Payment</Text>
                <Text style={styles.receiptMetaVal}>{viewingReceipt?.paymentDate || '—'}</Text>
              </View>
            </View>

            <View style={styles.receiptStudentInfo}>
              <Text style={styles.receiptStudentName}>Student: {childName || viewingReceipt?.payerName || '—'}</Text>
              <Text style={styles.receiptStudentRoll}>USN: {linkedStudentUSN || viewingReceipt?.classSection || '—'}</Text>
            </View>

            <View style={styles.receiptLineItem}>
              <Text style={styles.receiptLineTitle}>{viewingReceipt?.title}</Text>
              <Text style={styles.receiptLineAmount}>
                ₹{viewingReceipt?.amount.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>Amount Received</Text>
              <Text style={styles.receiptTotalVal}>
                ₹{viewingReceipt?.amount.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.receiptFooter}>
              <Text style={styles.receiptVerified}>
                ✓ Verified by Institution Accounts Dept.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.downloadPdfBtn, { opacity: isGeneratingPdf ? 0.7 : 1 }]}
              onPress={handleDownloadReceiptPdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="download" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.downloadPdfBtnText}>
                {isGeneratingPdf ? 'Generating PDF...' : 'Save / Download PDF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  centerText: { fontSize: 13, color: '#6B6B6B', textAlign: 'center', fontFamily: FontFamily.regular },
  retryBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 30,
    gap: 6,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A1B1C', marginTop: 6 },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center' },
  heroBalanceCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: BorderRadius.card,
    padding: 20,
    marginBottom: 20,
  },
  heroBalanceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroBalanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A8A8A',
    letterSpacing: 0.8,
  },
  heroBalanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  paidBadgeText: { fontSize: 12, fontWeight: '700', color: '#16A34A', fontFamily: FontFamily.bold },
  heroBalanceSub: {
    fontSize: 12,
    color: '#8A8A8A',
    marginTop: 14,
    fontFamily: FontFamily.regular,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1B1C', marginBottom: 12, fontFamily: FontFamily.extrabold },
  feeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    marginBottom: 12,
  },
  feeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  feeTitleGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  feeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeTitle: { fontSize: 14, fontWeight: '700', color: '#1A1B1C', fontFamily: FontFamily.bold },
  feeTerm: { fontSize: 12, color: '#6B6B6B', marginTop: 2, fontFamily: FontFamily.regular },
  feeAmount: { fontSize: 16, fontWeight: '800', color: '#1A1B1C', marginLeft: 8, fontFamily: FontFamily.extrabold },
  feeDivider: { height: 1, backgroundColor: '#F7F5EE', marginVertical: 12 },
  feeCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeDateLabel: { fontSize: 11, color: '#6B6B6B', fontWeight: '500' },
  receiptTag: { fontSize: 10, color: '#16A34A', fontWeight: '700', marginTop: 2 },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4C430',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  payNowBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', fontFamily: FontFamily.bold },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244,196,48,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  receiptBtnText: { color: '#F4C430', fontSize: 12, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  payAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F4C430',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  payAllBtnText: {
    color: '#1A1B1C',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: FontFamily.extrabold,
  },
  receiptModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  receiptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptBadge: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  receiptSchoolName: { fontSize: 15, fontWeight: '800', color: '#1A1B1C' },
  receiptSubtext: { fontSize: 11, color: '#6B6B6B' },
  receiptMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  receiptMetaLabel: { fontSize: 10, color: '#6B6B6B', fontWeight: '600' },
  receiptMetaVal: { fontSize: 12, fontWeight: '700', color: '#1A1B1C', marginTop: 2 },
  receiptStudentInfo: {
    backgroundColor: 'rgba(244,196,48,0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  receiptStudentName: { fontSize: 13, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.extrabold },
  receiptStudentRoll: { fontSize: 11, color: '#F4C430', marginTop: 2, fontFamily: FontFamily.regular },
  receiptLineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F5EE',
  },
  receiptLineTitle: { fontSize: 13, fontWeight: '600', color: '#1A1B1C', fontFamily: FontFamily.semibold },
  receiptLineAmount: { fontSize: 13, fontWeight: '700', color: '#1A1B1C', fontFamily: FontFamily.bold },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1A1B1C',
  },
  receiptTotalLabel: { fontSize: 14, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.extrabold },
  receiptTotalVal: { fontSize: 16, fontWeight: '900', color: '#16A34A', fontFamily: FontFamily.extrabold },
  receiptFooter: { alignItems: 'center', marginVertical: 14 },
  receiptVerified: { fontSize: 11, color: '#16A34A', fontWeight: '600' },
  downloadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4C430',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  downloadPdfBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, fontFamily: FontFamily.bold },
});
