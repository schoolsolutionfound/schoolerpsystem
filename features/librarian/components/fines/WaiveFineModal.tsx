import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Feather } from '../common/Icons';
import { Fine, StudentProfile } from '../../types';

export const WaiveFineModal = ({
  visible,
  fine,
  students,
  onClose,
  onWaiveSuccess,
  modalStyles,
  commonStyles,
  fineStyles,
}: {
  visible: boolean;
  fine: Fine | null;
  students: StudentProfile[];
  onClose: () => void;
  onWaiveSuccess: (waivedFine: Fine) => void;
  modalStyles: any;
  commonStyles: any;
  fineStyles: any;
}) => {
  const [reason, setReason] = useState('Discretionary Waiver');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const student = useMemo(() => {
    if (!fine) return null;
    return students.find((s) => s.id === fine.studentId) || null;
  }, [fine, students]);

  useEffect(() => {
    if (fine) {
      setReason('Discretionary Waiver');
      setRemarks('');
    }
  }, [fine, visible]);

  if (!fine) return null;

  const handleConfirmWaiver = () => {
    if (!remarks.trim()) {
      Alert.alert('Required Field', 'Please provide notes/remarks justifying this fine waiver.');
      return;
    }

    setSubmitting(true);
    const waivedFine: Fine = {
      ...fine,
      status: 'WAIVED',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setSubmitting(false);
    onWaiveSuccess(waivedFine);
    Alert.alert('Fine Waived', `Fine #${fine.id} of $${fine.amount.toFixed(2)} has been waived under ${reason}.`);
  };

  const styles = commonStyles;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '90%' }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>Waive Member Fine (#{fine.id})</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 12 }}>
              <View style={[fineStyles.modalMemberCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={fineStyles.modalMemberName}>{student?.fullName || 'Student Member'}</Text>
                  <Text style={fineStyles.modalMemberSub}>{student?.admissionNo} • {student?.classSection}</Text>
                  <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: '800', marginTop: 4 }}>
                    Waiving Amount: ${fine.amount.toFixed(2)} ({fine.fineType.replace('_', ' ')})
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Exemption Category Reason *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {[
                    'Discretionary Waiver',
                    'Academic Exemption',
                    'Lost & Found Located',
                    'Financial Hardship',
                    'Admin Exemption',
                  ].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.chip, reason === r && styles.chipActive]}
                      onPress={() => setReason(r)}
                    >
                      <Text style={[styles.chipText, reason === r && styles.chipTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Exemption Justification / Remarks *</Text>
                <TextInput
                  style={[styles.formInput, { height: 80 }]}
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  placeholder="Enter official reason and notes for approving fine waiver..."
                />
              </View>

              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#2563EB', marginTop: 10 }]} onPress={handleConfirmWaiver} disabled={submitting}>
                <Text style={[styles.primaryBtnText, { color: '#FFFFFF' }]}>Approve & Log Fine Waiver</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
