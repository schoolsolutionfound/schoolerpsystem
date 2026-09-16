/**
 * @file StudentHomeFeeSummary.tsx
 * @description Student Fee Statements, Receipts, and Pending Dues Widget.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { formatINR } from '../../accountant/utils/financeUtils';
import { showAlert } from '../../shared/utils/showAlert';

interface FeeItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  status: 'paid' | 'pending';
  dueDate: string;
  receiptNo?: string;
  method?: string;
}

const SAMPLE_FEES: FeeItem[] = [
  {
    id: 'f-1',
    title: 'Term 1 Tuition & Laboratory Fee',
    category: 'Tuition Fee',
    amount: 24500,
    status: 'paid',
    dueDate: '2026-08-20',
    receiptNo: 'REC-2026-0801',
    method: 'UPI (PhonePe)',
  },
  {
    id: 'f-2',
    title: 'Term 2 Tuition & Smart Class Fee',
    category: 'Tuition Fee',
    amount: 22000,
    status: 'pending',
    dueDate: '2026-09-15',
  },
  {
    id: 'f-3',
    title: 'Annual Transport Route #4 Bus Pass',
    category: 'Bus Fee',
    amount: 12000,
    status: 'paid',
    dueDate: '2026-08-18',
    receiptNo: 'REC-2026-0802',
    method: 'Bank Transfer',
  },
];

export const StudentHomeFeeSummary: React.FC = () => {
  const [fees, setFees] = useState<FeeItem[]>(SAMPLE_FEES);
  const [selectedReceipt, setSelectedReceipt] = useState<FeeItem | null>(null);

  const pendingAmount = fees
    .filter((f) => f.status === 'pending')
    .reduce((sum, f) => sum + f.amount, 0);

  const handlePayNow = (item: FeeItem) => {
    showAlert(
      'Online Payment Gateway',
      `Proceeding to pay ₹${item.amount.toLocaleString('en-IN')} for ${item.title} via UPI / Net Banking?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay ₹' + item.amount.toLocaleString('en-IN'),
          onPress: () => {
            setFees((prev) =>
              prev.map((f) =>
                f.id === item.id
                  ? {
                      ...f,
                      status: 'paid',
                      receiptNo: `REC-${Date.now().toString().slice(-6)}`,
                      method: 'UPI Online',
                    }
                  : f
              )
            );
            showAlert('Payment Successful', `Receipt generated for ${item.title}.`);
          },
        },
      ]
    );
  };

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

      {/* Fee List */}
      <View style={styles.list}>
        {fees.map((fee) => {
          const isPaid = fee.status === 'paid';

          return (
            <View key={fee.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.feeTitle}>{fee.title}</Text>
                  <Text style={styles.feeSub}>
                    {fee.category} • {isPaid ? `Paid on ${fee.dueDate}` : `Due by ${fee.dueDate}`}
                  </Text>
                </View>

                <View style={styles.cardRight}>
                  <Text style={[styles.amountText, isPaid ? styles.paidText : styles.dueText]}>
                    {formatINR(fee.amount)}
                  </Text>
                  <View style={[styles.statusTag, isPaid ? styles.statusPaid : styles.statusPending]}>
                    <Text style={[styles.statusTagText, isPaid ? styles.statusTextPaid : styles.statusTextPending]}>
                      {fee.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionRow}>
                {isPaid ? (
                  <TouchableOpacity style={styles.receiptBtn} onPress={() => setSelectedReceipt(fee)}>
                    <MaterialCommunityIcons name="file-document-outline" size={14} color="#7E57C2" />
                    <Text style={styles.receiptBtnText}>View Receipt ({fee.receiptNo})</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.payBtn} onPress={() => handlePayNow(fee)}>
                    <MaterialCommunityIcons name="shield-check" size={14} color="#FFFFFF" />
                    <Text style={styles.payBtnText}>Pay Online via UPI</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <Modal visible={!!selectedReceipt} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.receiptBox}>
              <View style={styles.receiptHeader}>
                <MaterialCommunityIcons name="school" size={28} color="#7E57C2" />
                <Text style={styles.receiptSchoolName}>SchoolHub Academy</Text>
                <Text style={styles.receiptSubtitle}>Official Fee Payment Receipt</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.receiptBody}>
                <View style={styles.receiptRow}>
                  <Text style={styles.rLabel}>Receipt No:</Text>
                  <Text style={styles.rVal}>{selectedReceipt.receiptNo}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.rLabel}>Fee Head:</Text>
                  <Text style={styles.rVal}>{selectedReceipt.title}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.rLabel}>Payment Date:</Text>
                  <Text style={styles.rVal}>{selectedReceipt.dueDate}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.rLabel}>Payment Channel:</Text>
                  <Text style={styles.rVal}>{selectedReceipt.method || 'Online UPI'}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  pendingBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: '#B45309' },
  paidBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  paidBadgeText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  list: { gap: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, marginRight: 10 },
  feeTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 3 },
  feeSub: { fontSize: 11, color: '#64748B' },
  cardRight: { alignItems: 'flex-end' },
  amountText: { fontSize: 15, fontWeight: '800' },
  paidText: { color: '#16A34A' },
  dueText: { color: '#DC2626' },
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  statusPaid: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEE2E2' },
  statusTagText: { fontSize: 9, fontWeight: '800' },
  statusTextPaid: { color: '#16A34A' },
  statusTextPending: { color: '#DC2626' },
  actionRow: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  receiptBtnText: { fontSize: 11, fontWeight: '700', color: '#7E57C2' },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  payBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

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
  receiptSchoolName: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginTop: 4 },
  receiptSubtitle: { fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  receiptBody: { gap: 6 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rLabel: { fontSize: 12, color: '#64748B' },
  rVal: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  totalBox: { backgroundColor: '#DCFCE7', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  totalLabel: { fontSize: 11, color: '#15803D', textTransform: 'uppercase', fontWeight: '700' },
  totalVal: { fontSize: 20, fontWeight: '800', color: '#15803D', marginTop: 2 },
  closeBtn: { backgroundColor: '#7E57C2', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 14 },
  closeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
