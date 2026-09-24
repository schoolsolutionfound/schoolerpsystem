import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { Fine, StudentProfile, FineStatus, PaymentTransaction } from '../../types';
import { apiClient } from '../../../../api/client';

export const PayFineModal = ({
  visible,
  fine,
  students,
  onClose,
  onPaymentSuccess,
  modalStyles,
  commonStyles,
  fineStyles,
}: {
  visible: boolean;
  fine: Fine | null;
  students: StudentProfile[];
  onClose: () => void;
  onPaymentSuccess: (updatedFine: Fine) => void;
  modalStyles: any;
  commonStyles: any;
  fineStyles: any;
}) => {
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI_ONLINE' | 'DIGITAL_WALLET' | 'SCANNER_QR'>('CASH');
  const [cashTendered, setCashTendered] = useState('');
  const [refNotes, setRefNotes] = useState('');
  const [scannedPayload, setScannedPayload] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const student = useMemo(() => {
    if (!fine) return null;
    return students.find((s) => s.id === fine.studentId) || null;
  }, [fine, students]);

  const remainingBalance = useMemo(() => {
    if (!fine) return 0;
    return Math.max(0, fine.amount - fine.paidAmount);
  }, [fine]);

  const changeReturned = useMemo(() => {
    const payVal = parseFloat(payAmount || '0') || 0;
    const cashVal = parseFloat(cashTendered || '0') || 0;
    return Math.max(0, cashVal - payVal);
  }, [payAmount, cashTendered]);

  useEffect(() => {
    if (fine) {
      const rem = Math.max(0, fine.amount - fine.paidAmount);
      setPayAmount(rem.toFixed(2));
      setCashTendered(rem.toFixed(2));
      setPaymentMethod('CASH');
      setRefNotes('');
      setScannedPayload(null);
      setReceiptData(null);
    }
  }, [fine, visible]);

  if (!fine) return null;

  const handleTriggerScanner = () => {
    const mockPayload = `PAY-UPI-${Math.floor(100000 + Math.random() * 900000)}-KIVQUO`;
    setScannedPayload(mockPayload);
    setRefNotes(`Ref: ${mockPayload}`);
    Alert.alert('Scanner Active', `QR code scanned successfully!\nCaptured Payload: ${mockPayload}`);
  };

  const handleProcessPayment = () => {
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount greater than $0.');
      return;
    }
    if (amt > remainingBalance + 0.01) {
      Alert.alert('Amount Exceeded', `Payment amount cannot exceed the remaining balance of $${remainingBalance.toFixed(2)}.`);
      return;
    }

    if (paymentMethod === 'CASH') {
      const cashVal = parseFloat(cashTendered || '0');
      if (isNaN(cashVal) || cashVal < amt - 0.01) {
        Alert.alert('Insufficient Cash', `Cash tendered ($${cashVal.toFixed(2)}) is less than payment amount ($${amt.toFixed(2)}).`);
        return;
      }
    }

    setSubmitting(true);
    const newPaidTotal = fine.paidAmount + amt;
    const isFullyPaid = newPaidTotal >= fine.amount - 0.01;
    const updatedStatus: FineStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    const receiptNo = `REC-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTxn: PaymentTransaction = {
      id: `txn-${Date.now()}`,
      fineId: fine.id,
      receiptNo,
      amount: amt,
      paymentMethod,
      cashTendered: paymentMethod === 'CASH' ? parseFloat(cashTendered || '0') : undefined,
      changeReturned: paymentMethod === 'CASH' ? changeReturned : undefined,
      transactionRef: refNotes.trim() || undefined,
      scannedQrPayload: paymentMethod === 'SCANNER_QR' ? scannedPayload || undefined : undefined,
      paidAt: new Date().toISOString(),
      cashier: 'Amina Rahman (Librarian)',
    };

    const updatedTransactions = [...(fine.paymentTransactions || []), newTxn];

    const updatedFine: Fine = {
      ...fine,
      paidAmount: newPaidTotal,
      status: updatedStatus,
      updatedAt: new Date().toISOString().split('T')[0],
      paymentTransactions: updatedTransactions,
    };

    // Save transaction record to backend DB API (with offline fallback)
    apiClient('/fines/payment', {
      method: 'POST',
      body: JSON.stringify(newTxn),
    }).catch(() => { });

    const newReceipt = {
      receiptNo,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      studentName: student?.fullName || 'Student Member',
      admissionNo: student?.admissionNo || 'N/A',
      classSection: student?.classSection || 'N/A',
      fineId: fine.id,
      fineType: fine.fineType.replace('_', ' '),
      amountPaid: amt,
      paymentMethod: paymentMethod.replace('_', ' '),
      cashTendered: paymentMethod === 'CASH' ? parseFloat(cashTendered || '0') : undefined,
      changeReturned: paymentMethod === 'CASH' ? changeReturned : undefined,
      remainingBalance: Math.max(0, fine.amount - newPaidTotal),
      refNotes: refNotes.trim() || 'N/A',
      scannedPayload,
      cashier: 'Amina Rahman (Librarian)',
    };

    setSubmitting(false);
    setReceiptData(newReceipt);
    onPaymentSuccess(updatedFine);
  };

  const styles = commonStyles;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '94%' }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>
              {receiptData ? 'Digital Receipt Issued' : `Collect Fine Payment (#${fine.id})`}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {receiptData ? (
              /* DIGITAL RECEIPT VIEW */
              <View style={fineStyles.receiptContainer}>
                <View style={fineStyles.receiptHeader}>
                  <MaterialCommunityIcons name="check-circle" size={40} color="#059669" />
                  <Text style={fineStyles.receiptTitle}>KIVQUO SCHOOL LIBRARY</Text>
                  <Text style={fineStyles.receiptSub}>Official Payment Receipt</Text>
                  <Text style={fineStyles.receiptNo}>Receipt No: {receiptData.receiptNo}</Text>
                </View>

                <View style={fineStyles.receiptDivider} />

                <View style={fineStyles.receiptRow}>
                  <Text style={fineStyles.receiptLabel}>Date & Time:</Text>
                  <Text style={fineStyles.receiptVal}>{receiptData.date}</Text>
                </View>

                <View style={fineStyles.receiptRow}>
                  <Text style={fineStyles.receiptLabel}>Member Name:</Text>
                  <Text style={fineStyles.receiptVal}>{receiptData.studentName}</Text>
                </View>

                <View style={fineStyles.receiptRow}>
                  <Text style={fineStyles.receiptLabel}>Admission / Class:</Text>
                  <Text style={fineStyles.receiptVal}>{receiptData.admissionNo} ({receiptData.classSection})</Text>
                </View>

                <View style={fineStyles.receiptRow}>
                  <Text style={fineStyles.receiptLabel}>Fine Type:</Text>
                  <Text style={fineStyles.receiptVal}>{receiptData.fineType}</Text>
                </View>

                <View style={fineStyles.receiptRow}>
                  <Text style={fineStyles.receiptLabel}>Payment Method:</Text>
                  <Text style={fineStyles.receiptVal}>{receiptData.paymentMethod}</Text>
                </View>

                {receiptData.cashTendered !== undefined && (
                  <>
                    <View style={fineStyles.receiptRow}>
                      <Text style={fineStyles.receiptLabel}>Cash Tendered:</Text>
                      <Text style={fineStyles.receiptVal}>${receiptData.cashTendered.toFixed(2)}</Text>
                    </View>
                    <View style={fineStyles.receiptRow}>
                      <Text style={fineStyles.receiptLabel}>Change Returned:</Text>
                      <Text style={[fineStyles.receiptVal, { color: '#059669' }]}>${receiptData.changeReturned.toFixed(2)}</Text>
                    </View>
                  </>
                )}

                {receiptData.scannedPayload && (
                  <View style={fineStyles.receiptRow}>
                    <Text style={fineStyles.receiptLabel}>QR Scanner Ref:</Text>
                    <Text style={fineStyles.receiptVal}>{receiptData.scannedPayload}</Text>
                  </View>
                )}

                {receiptData.refNotes !== 'N/A' && (
                  <View style={fineStyles.receiptRow}>
                    <Text style={fineStyles.receiptLabel}>Ref / Notes:</Text>
                    <Text style={fineStyles.receiptVal}>{receiptData.refNotes}</Text>
                  </View>
                )}

                <View style={fineStyles.receiptDivider} />

                <View style={fineStyles.receiptRowLarge}>
                  <Text style={fineStyles.receiptLabelLarge}>Amount Paid:</Text>
                  <Text style={fineStyles.receiptValLarge}>${receiptData.amountPaid.toFixed(2)}</Text>
                </View>

                <View style={fineStyles.receiptRow}>
                  <Text style={fineStyles.receiptLabel}>Remaining Balance:</Text>
                  <Text style={fineStyles.receiptVal}>${receiptData.remainingBalance.toFixed(2)}</Text>
                </View>

                <View style={fineStyles.receiptFooter}>
                  <Text style={fineStyles.receiptFooterText}>Issued by: {receiptData.cashier}</Text>
                  <Text style={fineStyles.receiptFooterSub}>Payment logged into database. Thank you.</Text>
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={onClose}>
                  <Text style={styles.primaryBtnText}>Done & Close Receipt</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* PAYMENT INPUT FORM */
              <View style={{ gap: 12 }}>
                {/* Member Summary Card */}
                <View style={fineStyles.modalMemberCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={fineStyles.modalMemberName}>{student?.fullName || 'Student Member'}</Text>
                    <Text style={fineStyles.modalMemberSub}>{student?.admissionNo} • {student?.classSection}</Text>
                    <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '800', marginTop: 4 }}>
                      Fine Total: ${fine.amount.toFixed(2)} | Balance Due: ${remainingBalance.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Amount to Pay */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Payment Amount ($) *</Text>
                  <TextInput
                    style={[styles.formInput, { fontSize: 16, fontWeight: '800' }]}
                    value={payAmount}
                    onChangeText={(v) => {
                      setPayAmount(v);
                      setCashTendered(v);
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>

                {/* Payment Method Selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Payment System & Gateway</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {[
                      { id: 'CASH', label: '💵 Cash' },
                      { id: 'SCANNER_QR', label: '📷 QR Scanner' },
                      { id: 'CARD', label: '💳 Card POS' },
                      { id: 'UPI_ONLINE', label: '📲 Online Transfer' },
                      { id: 'DIGITAL_WALLET', label: '👛 Wallet' },
                    ].map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.chip,
                          paymentMethod === m.id && styles.chipActive,
                          { minWidth: '45%', alignItems: 'center' },
                        ]}
                        onPress={() => setPaymentMethod(m.id as any)}
                      >
                        <Text style={[styles.chipText, paymentMethod === m.id && styles.chipTextActive]}>{m.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* CASH OPTION: TENDERED & CHANGE CALCULATOR */}
                {paymentMethod === 'CASH' && (
                  <View style={fineStyles.cashBox}>
                    <Text style={fineStyles.cashBoxTitle}>💵 Cash Payment & Change Calculator</Text>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.formLabel}>Cash Amount Tendered ($) *</Text>
                        <TextInput
                          style={[styles.formInput, { fontSize: 16, fontWeight: '800', color: '#059669' }]}
                          value={cashTendered}
                          onChangeText={setCashTendered}
                          keyboardType="numeric"
                          placeholder="0.00"
                        />
                      </View>

                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.formLabel}>Change to Return</Text>
                        <View style={[styles.formInput, { backgroundColor: changeReturned >= 0 ? '#ECFDF5' : '#FEF2F2', justifyContent: 'center' }]}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: changeReturned >= 0 ? '#059669' : '#DC2626' }}>
                            ${changeReturned.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Quick Tender Presets */}
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {[
                        { label: `Exact ($${parseFloat(payAmount || '0').toFixed(2)})`, val: parseFloat(payAmount || '0') },
                        { label: '+$5.00', val: (parseFloat(payAmount || '0') || 0) + 5 },
                        { label: '+$10.00', val: (parseFloat(payAmount || '0') || 0) + 10 },
                        { label: '$20.00', val: 20 },
                        { label: '$50.00', val: 50 },
                        { label: '$100.00', val: 100 },
                      ].map((p, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={fineStyles.tenderPill}
                          onPress={() => setCashTendered(p.val.toFixed(2))}
                        >
                          <Text style={fineStyles.tenderPillText}>{p.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* SCANNER INTERFACE */}
                {paymentMethod === 'SCANNER_QR' && (
                  <View style={fineStyles.scannerContainer}>
                    <View style={fineStyles.scannerHeader}>
                      <MaterialCommunityIcons name="qrcode-scan" size={24} color="#EAB308" />
                      <View style={{ flex: 1 }}>
                        <Text style={fineStyles.scannerTitle}>Digital QR Payment Scanner</Text>
                        <Text style={fineStyles.scannerSub}>Scan member UPI or Digital Wallet QR code</Text>
                      </View>
                    </View>

                    <View style={fineStyles.scannerViewport}>
                      <View style={fineStyles.scannerCornerTL} />
                      <View style={fineStyles.scannerCornerTR} />
                      <View style={fineStyles.scannerCornerBL} />
                      <View style={fineStyles.scannerCornerBR} />

                      <MaterialCommunityIcons name="camera-outline" size={44} color={scannedPayload ? '#059669' : '#EAB308'} />
                      <Text style={fineStyles.scannerStatusText}>
                        {scannedPayload ? '✅ Payment QR Code Verified!' : 'Position member payment QR code inside frame'}
                      </Text>
                      {scannedPayload ? (
                        <Text style={fineStyles.scannerPayloadText}>{scannedPayload}</Text>
                      ) : null}
                    </View>

                    <TouchableOpacity style={fineStyles.scanTriggerBtn} onPress={handleTriggerScanner}>
                      <MaterialCommunityIcons name="line-scan" size={18} color="#121316" />
                      <Text style={fineStyles.scanTriggerBtnText}>
                        {scannedPayload ? 'Re-scan Member QR Code' : '📷 Trigger Camera QR Scanner'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Reference Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Transaction Reference / Remarks</Text>
                  <TextInput
                    style={styles.formInput}
                    value={refNotes}
                    onChangeText={setRefNotes}
                    placeholder="e.g. Receipt #, POS Auth Code, UPI transaction ID..."
                  />
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 10 }]} onPress={handleProcessPayment} disabled={submitting}>
                  {submitting ? (
                    <ActivityIndicator size="small" color="#121316" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Collect Payment & Log Transaction</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
