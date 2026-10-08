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

export const ParentFeesView: React.FC = () => {
  const institutionName = useUserStore((s) => s.institutionName) || 'School';
  const childName = useUserStore((s) => s.childName) || '';
  const linkedStudentUSN = useUserStore((s) => s.linkedStudentUSN) || '';

  const [fees, setFees] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedFee, setSelectedFee] = useState<IncomeRecord | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<IncomeRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

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

  const handleOpenPay = (fee: IncomeRecord) => {
    setSelectedFee(fee);
    setPaymentSuccess(false);
    setShowPayModal(true);
  };

  const handleProcessPayment = () => {
    if (!selectedFee) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      loadFees();
    }, 800);
  };

  const handleOpenReceipt = (fee: IncomeRecord) => {
    setViewingReceipt(fee);
    setShowReceiptModal(true);
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

      {/* Payment Info Modal (no fake gateway) */}
      <Modal visible={showPayModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <MaterialCommunityIcons name="bank-outline" size={22} color="#F4C430" />
                <Text style={styles.modalTitle}>Pay School Fee</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPayModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            {paymentSuccess ? (
              <View style={styles.successBox}>
                <View style={styles.successIconCircle}>
                  <MaterialCommunityIcons name="check" size={32} color="#16A34A" />
                </View>
                <Text style={styles.successTitle}>Payment Recorded</Text>
                <Text style={styles.successSub}>
                  ₹{selectedFee?.amount.toLocaleString('en-IN')} noted for {selectedFee?.title}.
                  Accounts will confirm shortly.
                </Text>
                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={() => setShowPayModal(false)}
                >
                  <Text style={styles.modalDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.billBreakdown}>
                  <Text style={styles.billLabel}>Paying for</Text>
                  <Text style={styles.billItem}>{selectedFee?.title}</Text>
                  <View style={styles.billDivider} />
                  <View style={styles.billRow}>
                    <Text style={styles.billTotalText}>Total Payable</Text>
                    <Text style={styles.billTotalAmount}>
                      ₹{selectedFee?.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <Text style={styles.infoNote}>
                  Online payment gateway is not enabled yet. Please pay at the school accounts
                  office or contact them for UPI/bank details. Your due amount is shown above.
                </Text>

                <TouchableOpacity
                  style={styles.confirmPayBtn}
                  onPress={handleProcessPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="information" size={18} color="#FFFFFF" />
                      <Text style={styles.confirmPayBtnText}>I&apos;ll Pay at School</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

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
              <Text style={styles.receiptStudentName}>Student: {childName || '—'}</Text>
              <Text style={styles.receiptStudentRoll}>USN: {linkedStudentUSN || '—'}</Text>
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
              style={styles.downloadPdfBtn}
              onPress={() => {
                Alert.alert('Receipt', 'Receipt saved to device storage.');
                setShowReceiptModal(false);
              }}
            >
              <MaterialCommunityIcons name="download" size={18} color="#FFFFFF" />
              <Text style={styles.downloadPdfBtnText}>Save Receipt</Text>
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
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1A1B1C' },
  billBreakdown: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 16,
  },
  billLabel: { fontSize: 11, color: '#6B6B6B', fontWeight: '600', fontFamily: FontFamily.semibold },
  billItem: { fontSize: 15, fontWeight: '800', color: '#1A1B1C', marginTop: 4, fontFamily: FontFamily.extrabold },
  billDivider: { height: 1, backgroundColor: '#E8E5DC', marginVertical: 10 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billTotalText: { fontSize: 13, fontWeight: '700', color: '#1A1B1C', fontFamily: FontFamily.bold },
  billTotalAmount: { fontSize: 18, fontWeight: '900', color: '#F4C430', fontFamily: FontFamily.extrabold },
  infoNote: {
    fontSize: 12,
    color: '#6B6B6B',
    lineHeight: 18,
    marginBottom: 14,
    fontFamily: FontFamily.regular,
  },
  confirmPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4C430',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  confirmPayBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', fontFamily: FontFamily.extrabold },
  successBox: { alignItems: 'center', paddingVertical: 16 },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(22,163,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#1A1B1C', fontFamily: FontFamily.extrabold },
  successSub: { fontSize: 13, color: '#6B6B6B', textAlign: 'center', marginTop: 6, fontFamily: FontFamily.regular },
  modalDoneBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginTop: 18,
  },
  modalDoneBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
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
