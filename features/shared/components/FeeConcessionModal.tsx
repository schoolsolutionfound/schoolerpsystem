import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { FontFamily } from '../../../constants/fonts';
import { StudentFeeRecord } from '../../principal/types/principal.types';

export interface FeeConcessionPayload {
  studentId: string;
  studentName: string;
  rollNumber: string;
  concessionAmount: number;
  reason: string;
  notes: string;
  previousDue: number;
  newDue: number;
  timestamp: string;
}

interface FeeConcessionModalProps {
  visible: boolean;
  student: StudentFeeRecord | null;
  onClose: () => void;
  onApplyConcession: (payload: FeeConcessionPayload) => void;
}

export const FeeConcessionModal: React.FC<FeeConcessionModalProps> = ({
  visible,
  student,
  onClose,
  onApplyConcession,
}) => {
  const [concessionAmountStr, setConcessionAmountStr] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Reset form when modal opens with a new student
  useEffect(() => {
    if (visible && student) {
      setConcessionAmountStr('');
      setNotes('');
      setErrorMsg('');
    }
  }, [visible, student]);

  if (!student) return null;

  const currentDue = student.dueAmount;
  const concessionAmount = Math.max(0, parseInt(concessionAmountStr, 10) || 0);
  const newDue = Math.max(0, currentDue - concessionAmount);
  const newTotal = Math.max(0, student.totalFee - concessionAmount);

  const handleQuickPercent = (pct: number) => {
    const calculated = Math.round((currentDue * pct) / 100);
    setConcessionAmountStr(calculated.toString());
    setErrorMsg('');
  };

  const handleFullWaiver = () => {
    setConcessionAmountStr(currentDue.toString());
    setErrorMsg('');
  };

  const handleSubmit = () => {
    if (concessionAmount <= 0) {
      setErrorMsg('Please enter a valid concession amount greater than ₹0.');
      return;
    }
    if (concessionAmount > currentDue) {
      setErrorMsg(`Concession cannot exceed the active due balance of ₹${currentDue.toLocaleString()}.`);
      return;
    }

    Alert.alert(
      'Confirm Fee Concession',
      `Grant ₹${concessionAmount.toLocaleString()} concession to ${student.studentName} (${student.rollNumber})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Grant Concession',
          onPress: () => {
            const payload: FeeConcessionPayload = {
              studentId: student.id,
              studentName: student.studentName,
              rollNumber: student.rollNumber,
              concessionAmount,
              reason: 'Principal Concession',
              notes: notes.trim() || 'Principal concession granted.',
              previousDue: currentDue,
              newDue,
              timestamp: new Date().toISOString(),
            };

            onApplyConcession(payload);
            onClose();

            Alert.alert(
              'Concession Granted',
              `Concession of ₹${concessionAmount.toLocaleString()} applied to ${student.studentName}. Updated due: ₹${newDue.toLocaleString()}.`
            );
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Grant Fee Concession</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Student Info Box */}
            <View style={styles.studentInfoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Student Name</Text>
                <Text style={styles.infoVal}>{student.studentName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Roll Number / Department</Text>
                <Text style={styles.infoVal}> {student.rollNumber} · {student.department}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Academic Year / Campus</Text>
                <Text style={styles.infoVal}> {student.year}{student.institution}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Total Fee</Text>
                <Text style={styles.infoVal}>₹{student.totalFee.toLocaleString()}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: '#B45309' }]}>Current Outstanding Due</Text>
                <Text style={[styles.infoVal, { color: '#DC2626' }]}>₹{currentDue.toLocaleString()}</Text>
              </View>
            </View>

            {/* Concession Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Concession</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={concessionAmountStr}
                onChangeText={(text) => {
                  setConcessionAmountStr(text.replace(/[^0-9]/g, ''));
                  setErrorMsg('');
                }}
              />

              {/* Quick Percent Buttons */}
              {/* <View style={styles.quickPercentRow}>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => handleQuickPercent(10)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickBtnText}>10% Off</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => handleQuickPercent(25)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickBtnText}>25% Off</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => handleQuickPercent(50)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickBtnText}>50% Off</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickBtn, styles.quickBtnFull]}
                  onPress={handleFullWaiver}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.quickBtnText, styles.quickBtnTextFull]}>Full Waiver</Text>
                </TouchableOpacity>
              </View> */}
            </View>

            {/* Error Message */}
            {errorMsg.length > 0 && (
              <Text style={styles.errorText}>{errorMsg}</Text>
            )}

            {/* Live Balance Update Preview */}
            {concessionAmount > 0 && concessionAmount <= currentDue && (
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>POST-CONCESSION BALANCE PREVIEW</Text>
                <View style={styles.previewRow}>
                  <View style={styles.previewCol}>
                    <Text style={styles.previewLabel}>New Total Fee</Text>
                    <Text style={styles.previewVal}>₹{newTotal.toLocaleString()}</Text>
                  </View>
                  <View style={styles.previewCol}>
                    <Text style={styles.previewLabel}>Waiver Amount</Text>
                    <Text style={[styles.previewVal, { color: '#047857' }]}>
                      -₹{concessionAmount.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.previewCol}>
                    <Text style={styles.previewLabel}>New Due Balance</Text>
                    <Text style={[styles.previewVal, { color: newDue > 0 ? '#DC2626' : '#047857' }]}>
                      ₹{newDue.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Optional Remarks Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Remarks / Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="e.g., Approved principal concession..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Submit Action */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>Grant Concession</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '88%',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#111827',
  },
  headerSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  closeBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#374151',
  },
  scrollContent: {
    paddingVertical: 12,
    gap: 14,
  },
  studentInfoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#6B7280',
  },
  infoVal: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  inputGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#374151',
  },
  amountInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  quickPercentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickBtnFull: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  quickBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#374151',
  },
  quickBtnTextFull: {
    fontFamily: FontFamily.bold,
    color: '#92400E',
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#DC2626',
  },
  previewBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  previewTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#166534',
    letterSpacing: 0.5,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewCol: {
    alignItems: 'center',
  },
  previewLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#15803D',
  },
  previewVal: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
    marginTop: 2,
  },
  reasonWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonChip: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reasonChipSelected: {
    backgroundColor: '#FFF4C7',
    borderColor: '#F4C430',
  },
  reasonChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#4B5563',
  },
  reasonChipTextSelected: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#111827',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#F4C430',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#000000',
  },
});
