import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { useLibraryStore } from '../store/useLibraryStore';
import { LibraryFine } from '../types/library';

export const LibraryFinesLedgerView: React.FC = () => {
  const fines = useLibraryStore((s) => s.fines);
  const collectFine = useLibraryStore((s) => s.collectFine);
  const waiveFine = useLibraryStore((s) => s.waiveFine);
  const pendingTotal = useLibraryStore((s) => s.getPendingFinesTotal());
  const collectedTotal = useLibraryStore((s) => s.getCollectedFinesTotal());

  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'waived'>('all');
  const [selectedFine, setSelectedFine] = useState<LibraryFine | null>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showWaiveModal, setShowWaiveModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [viewingFine, setViewingFine] = useState<LibraryFine | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [waiveReason, setWaiveReason] = useState('Approved by School Principal');

  const filteredFines = fines.filter((f) => {
    if (filter === 'pending') return f.status === 'pending';
    if (filter === 'paid') return f.status === 'paid';
    if (filter === 'waived') return f.status === 'waived';
    return true;
  });

  const handleOpenCollect = (fine: LibraryFine) => {
    setSelectedFine(fine);
    setShowCollectModal(true);
  };

  const handleConfirmCollect = () => {
    if (!selectedFine) return;
    collectFine(selectedFine.id, paymentMethod);
    Alert.alert(
      'Fine Collected',
      `₹${selectedFine.amount} received from ${selectedFine.borrowerName}. Recorded in Central Accounts.`
    );
    setShowCollectModal(false);
  };

  const handleOpenWaive = (fine: LibraryFine) => {
    setSelectedFine(fine);
    setWaiveReason('Principal / HOD approval');
    setShowWaiveModal(true);
  };

  const handleConfirmWaive = () => {
    if (!selectedFine) return;
    waiveFine(selectedFine.id, waiveReason);
    Alert.alert('Fine Waived', `₹${selectedFine.amount} fine waived for ${selectedFine.borrowerName}.`);
    setShowWaiveModal(false);
  };

  const handleOpenReceipt = (fine: LibraryFine) => {
    setViewingFine(fine);
    setShowReceiptModal(true);
  };

  return (
    <View style={styles.container}>
      {/* KPI Balance Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroSub}>LIBRARY FINES & PENALTIES</Text>
            <Text style={styles.heroAmount}>₹{pendingTotal}</Text>
            <Text style={styles.heroPendingLabel}>Outstanding Pending Dues</Text>
          </View>

          <View style={styles.collectedBox}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
            <Text style={styles.collectedText}>₹{collectedTotal} Collected</Text>
          </View>
        </View>

        <Text style={styles.ruleText}>Rate: ₹5.00 per day overdue after 14-day loan cycle.</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { label: 'All Records', value: 'all', count: fines.length },
          {
            label: 'Pending',
            value: 'pending',
            count: fines.filter((f) => f.status === 'pending').length,
          },
          {
            label: 'Collected',
            value: 'paid',
            count: fines.filter((f) => f.status === 'paid').length,
          },
          {
            label: 'Waived',
            value: 'waived',
            count: fines.filter((f) => f.status === 'waived').length,
          },
        ].map((f) => {
          const isSelected = filter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterTab, isSelected && styles.filterTabActive]}
              onPress={() => setFilter(f.value as any)}
            >
              <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                {f.label} ({f.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Fines List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filteredFines.map((fine) => {
          const isPending = fine.status === 'pending';
          const isPaid = fine.status === 'paid';
          const isWaived = fine.status === 'waived';

          return (
            <View key={fine.id} style={styles.fineCard}>
              <View style={styles.fineTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookTitle}>{fine.bookTitle}</Text>
                  <Text style={styles.borrowerName}>
                    {fine.borrowerName} • {fine.className || fine.borrowerRole}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusTag,
                    isPending
                      ? styles.tagPending
                      : isPaid
                      ? styles.tagPaid
                      : styles.tagWaived,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isPending
                        ? { color: '#DC2626' }
                        : isPaid
                        ? { color: '#059669' }
                        : { color: '#64748B' },
                    ]}
                  >
                    {isPending ? 'Pending' : isPaid ? 'Collected' : 'Waived'}
                  </Text>
                </View>
              </View>

              <View style={styles.fineDetailRow}>
                <Text style={styles.lateDetail}>
                  {fine.daysLate} days overdue @ ₹5/day
                </Text>
                <Text style={[styles.amountText, isPaid && { color: '#059669' }]}>
                  ₹{fine.amount}
                </Text>
              </View>

              {fine.waiveReason && (
                <Text style={styles.waiverNote}>Waiver reason: {fine.waiveReason}</Text>
              )}

              {fine.receiptNo && (
                <Text style={styles.receiptNote}>Receipt: {fine.receiptNo}</Text>
              )}

              {/* Action Buttons */}
              <View style={styles.cardFooter}>
                <Text style={styles.dateText}>Recorded: {fine.date}</Text>

                {isPending && (
                  <View style={styles.actionBtnsRow}>
                    <TouchableOpacity
                      style={styles.waiveBtn}
                      onPress={() => handleOpenWaive(fine)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.waiveBtnText}>Waive</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.collectBtn}
                      onPress={() => handleOpenCollect(fine)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="cash-check" size={14} color="#FFFFFF" />
                      <Text style={styles.collectBtnText}>Collect ₹{fine.amount}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isPaid && (
                  <TouchableOpacity
                    style={styles.viewReceiptBtn}
                    onPress={() => handleOpenReceipt(fine)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="file-document-outline" size={14} color="#4F46E5" />
                    <Text style={styles.viewReceiptText}>View Receipt</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Collect Fine Modal */}
      <Modal visible={showCollectModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Collect Library Fine</Text>
              <TouchableOpacity onPress={() => setShowCollectModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedFine && (
              <View>
                <View style={styles.collectSummary}>
                  <Text style={styles.collectBorrower}>{selectedFine.borrowerName}</Text>
                  <Text style={styles.collectBook}>{selectedFine.bookTitle}</Text>
                  <Text style={styles.collectLate}>
                    {selectedFine.daysLate} days late @ ₹5/day
                  </Text>
                  <View style={styles.divider} />
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Total Fine Payable</Text>
                    <Text style={styles.totalAmountVal}>₹{selectedFine.amount}</Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Select Payment Mode</Text>
                <View style={styles.paymentMethodRow}>
                  <TouchableOpacity
                    style={[styles.payMethodBtn, paymentMethod === 'upi' && styles.payMethodActive]}
                    onPress={() => setPaymentMethod('upi')}
                  >
                    <MaterialCommunityIcons
                      name="qrcode-scan"
                      size={18}
                      color={paymentMethod === 'upi' ? '#FFFFFF' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.payMethodText,
                        paymentMethod === 'upi' && styles.payMethodTextActive,
                      ]}
                    >
                      Instant UPI / QR
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.payMethodBtn, paymentMethod === 'cash' && styles.payMethodActive]}
                    onPress={() => setPaymentMethod('cash')}
                  >
                    <MaterialCommunityIcons
                      name="cash"
                      size={18}
                      color={paymentMethod === 'cash' ? '#FFFFFF' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.payMethodText,
                        paymentMethod === 'cash' && styles.payMethodTextActive,
                      ]}
                    >
                      Cash Desk
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.confirmCollectBtn}
                  onPress={handleConfirmCollect}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="check-all" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmCollectBtnText}>
                    Confirm Receipt of ₹{selectedFine.amount}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Waive Fine Modal */}
      <Modal visible={showWaiveModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Waive Library Fine</Text>
              <TouchableOpacity onPress={() => setShowWaiveModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedFine && (
              <View>
                <Text style={styles.waiveAlertText}>
                  You are about to waive ₹{selectedFine.amount} fine for {selectedFine.borrowerName}.
                </Text>

                <Text style={styles.inputLabel}>Reason for Waiver *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Medical grounds / Principal approval..."
                  placeholderTextColor="#94A3B8"
                  value={waiveReason}
                  onChangeText={setWaiveReason}
                />

                <TouchableOpacity
                  style={styles.confirmWaiveBtn}
                  onPress={handleConfirmWaive}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmWaiveBtnText}>Confirm Waiver</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Official Fine Receipt Modal */}
      <Modal visible={showReceiptModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptTop}>
              <View style={styles.receiptBrand}>
                <MaterialCommunityIcons name="school" size={24} color="#D97706" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.receiptSchoolName}>DPS Central Library</Text>
                  <Text style={styles.receiptDocTitle}>Library Fine Payment Receipt</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptMetaRow}>
              <View>
                <Text style={styles.receiptMetaLabel}>Receipt No</Text>
                <Text style={styles.receiptMetaVal}>{viewingFine?.receiptNo}</Text>
              </View>
              <View>
                <Text style={styles.receiptMetaLabel}>Date</Text>
                <Text style={styles.receiptMetaVal}>{viewingFine?.date}</Text>
              </View>
            </View>

            <View style={styles.receiptMemberBox}>
              <Text style={styles.receiptMemberName}>Member: {viewingFine?.borrowerName}</Text>
              <Text style={styles.receiptMemberClass}>Class: {viewingFine?.className || 'Student'}</Text>
            </View>

            <View style={styles.receiptItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.receiptItemTitle}>Late Return Fine</Text>
                <Text style={styles.receiptItemSub}>{viewingFine?.bookTitle}</Text>
                <Text style={styles.receiptItemSub}>({viewingFine?.daysLate} days overdue @ ₹5/day)</Text>
              </View>
              <Text style={styles.receiptItemAmount}>₹{viewingFine?.amount}</Text>
            </View>

            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>Amount Paid</Text>
              <Text style={styles.receiptTotalAmount}>₹{viewingFine?.amount}.00</Text>
            </View>

            <Text style={styles.receiptStatusText}>✓ Paid & Posted to School Accounts</Text>

            <TouchableOpacity
              style={styles.doneReceiptBtn}
              onPress={() => {
                Alert.alert('Receipt Exported', 'Saved copy to device documents.');
                setShowReceiptModal(false);
              }}
            >
              <MaterialCommunityIcons name="download" size={16} color="#FFFFFF" />
              <Text style={styles.doneReceiptBtnText}>Save / Share Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.card,
    padding: 16,
    margin: 16,
    marginBottom: 10,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroSub: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
  heroAmount: { fontSize: 32, fontWeight: '900', color: '#EF4444', marginTop: 2 },
  heroPendingLabel: { fontSize: 11, color: '#94A3B8' },
  collectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  collectedText: { fontSize: 12, fontWeight: '800', color: '#10B981' },
  ruleText: { fontSize: 11, color: '#94A3B8', marginTop: 12 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterTab: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  filterTabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  filterTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  fineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  fineTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bookTitle: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  borrowerName: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagPending: { backgroundColor: '#FEE2E2' },
  tagPaid: { backgroundColor: '#ECFDF5' },
  tagWaived: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 10, fontWeight: '800' },
  fineDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  lateDetail: { fontSize: 11, color: '#64748B' },
  amountText: { fontSize: 16, fontWeight: '900', color: '#DC2626' },
  waiverNote: { fontSize: 11, color: '#D97706', fontStyle: 'italic', marginBottom: 4 },
  receiptNote: { fontSize: 10, color: '#059669', fontWeight: '700', marginBottom: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
  },
  dateText: { fontSize: 10, color: '#94A3B8' },
  actionBtnsRow: { flexDirection: 'row', gap: 8 },
  waiveBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  waiveBtnText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  collectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  collectBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  viewReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  viewReceiptText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  collectSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  collectBorrower: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  collectBook: { fontSize: 12, color: '#64748B', marginTop: 2 },
  collectLate: { fontSize: 11, color: '#DC2626', marginTop: 2, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountLabel: { fontSize: 12, fontWeight: '700', color: '#475569' },
  totalAmountVal: { fontSize: 20, fontWeight: '900', color: '#D97706' },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 6 },
  paymentMethodRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  payMethodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  payMethodActive: { backgroundColor: '#D97706' },
  payMethodText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  payMethodTextActive: { color: '#FFFFFF' },
  confirmCollectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  confirmCollectBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  waiveAlertText: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 16,
  },
  confirmWaiveBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmWaiveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  receiptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  receiptBrand: { flexDirection: 'row', alignItems: 'center' },
  receiptSchoolName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  receiptDocTitle: { fontSize: 11, color: '#64748B' },
  receiptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  receiptMetaLabel: { fontSize: 10, color: '#64748B' },
  receiptMetaVal: { fontSize: 11, fontWeight: '700', color: '#1E293B', marginTop: 1 },
  receiptMemberBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  receiptMemberName: { fontSize: 12, fontWeight: '800', color: '#3730A3' },
  receiptMemberClass: { fontSize: 10, color: '#4F46E5', marginTop: 1 },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  receiptItemTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  receiptItemSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  receiptItemAmount: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#0F172A',
  },
  receiptTotalLabel: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  receiptTotalAmount: { fontSize: 16, fontWeight: '900', color: '#059669' },
  receiptStatusText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginVertical: 12,
  },
  doneReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  doneReceiptBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
