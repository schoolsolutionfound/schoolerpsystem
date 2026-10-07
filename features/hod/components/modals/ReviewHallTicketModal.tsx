import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../../constants/theme';
import { FontFamily } from '../../../../constants/fonts';
import { ExamEligibilityRecord, HallTicketStatus } from '../../types/hod.types';

interface ReviewHallTicketModalProps {
  visible: boolean;
  record: ExamEligibilityRecord | null;
  onClose: () => void;
  onUpdateStatus: (
    recordId: string,
    status: HallTicketStatus,
    note?: string
  ) => Promise<void>;
}

export const ReviewHallTicketModal: React.FC<ReviewHallTicketModalProps> = ({
  visible,
  record,
  onClose,
  onUpdateStatus,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<HallTicketStatus>('detained');
  const [hodRemarks, setHodRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setSelectedStatus(record.hallTicketStatus);
      setHodRemarks(record.remarks || '');
    }
  }, [record]);

  if (!record) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateStatus(record.id, selectedStatus, hodRemarks.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: HallTicketStatus) => {
    switch (status) {
      case 'eligible':
        return '#10B981';
      case 'condonation_needed':
        return '#F59E0B';
      case 'detained':
        return '#EF4444';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Hall Ticket Clearance Review</Text>
              <Text style={styles.subtitle}>
                USN: {record.usn} • {record.semester}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Student Snapshot Card */}
            <View style={styles.studentCard}>
              <View style={styles.studentRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{record.studentName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{record.studentName}</Text>
                  <Text style={styles.departmentText}>{record.department}</Text>
                </View>
              </View>

              <View style={styles.metricGrid}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Attendance</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: record.overallAttendancePct < 75 ? '#DC2626' : '#16A34A' },
                    ]}
                  >
                    {record.overallAttendancePct}%
                  </Text>
                  <Text style={styles.metricSub}>Min. 75% required</Text>
                </View>

                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Deficit Subjects</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: record.coursesBelowThreshold > 0 ? '#DC2626' : '#16A34A' },
                    ]}
                  >
                    {record.coursesBelowThreshold}
                  </Text>
                  <Text style={styles.metricSub}>Below 75% bar</Text>
                </View>

                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Internal Marks</Text>
                  <Text style={styles.metricValue}>
                    {record.internalAssessmentScore}
                    <Text style={{ fontSize: 11, color: '#6B6B6B' }}>/50</Text>
                  </Text>
                  <Text style={styles.metricSub}>Continuous Eval</Text>
                </View>
              </View>
            </View>

            {/* Submitted Condonation / Grounds */}
            {record.condonationReason ? (
              <View style={styles.reasonCard}>
                <View style={styles.reasonHeader}>
                  <MaterialCommunityIcons name="file-document-outline" size={16} color="#D97706" />
                  <Text style={styles.reasonTitle}>Student / Faculty Justification</Text>
                </View>
                <Text style={styles.reasonBody}>{record.condonationReason}</Text>
              </View>
            ) : null}

            {/* Status Selection */}
            <Text style={styles.sectionHeading}>HOD Decision & Status</Text>
            <View style={styles.statusOptionsContainer}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  selectedStatus === 'eligible' && { borderColor: '#10B981', backgroundColor: '#ECFDF5' },
                ]}
                onPress={() => setSelectedStatus('eligible')}
              >
                <MaterialCommunityIcons
                  name={selectedStatus === 'eligible' ? 'check-circle' : 'circle-outline'}
                  size={18}
                  color={selectedStatus === 'eligible' ? '#10B981' : '#9CA3AF'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusOptionTitle, selectedStatus === 'eligible' && { color: '#065F46' }]}>
                    Approve Clearance (Eligible)
                  </Text>
                  <Text style={styles.statusOptionDesc}>
                    Grant hall ticket. Attendance condonation formally accepted.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusOption,
                  selectedStatus === 'condonation_needed' && { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
                ]}
                onPress={() => setSelectedStatus('condonation_needed')}
              >
                <MaterialCommunityIcons
                  name={selectedStatus === 'condonation_needed' ? 'check-circle' : 'circle-outline'}
                  size={18}
                  color={selectedStatus === 'condonation_needed' ? '#F59E0B' : '#9CA3AF'}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.statusOptionTitle,
                      selectedStatus === 'condonation_needed' && { color: '#92400E' },
                    ]}
                  >
                    Condonation Pending (Under Review)
                  </Text>
                  <Text style={styles.statusOptionDesc}>
                    Awaiting Dean approval or parent medical verification.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusOption,
                  selectedStatus === 'detained' && { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
                ]}
                onPress={() => setSelectedStatus('detained')}
              >
                <MaterialCommunityIcons
                  name={selectedStatus === 'detained' ? 'check-circle' : 'circle-outline'}
                  size={18}
                  color={selectedStatus === 'detained' ? '#EF4444' : '#9CA3AF'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusOptionTitle, selectedStatus === 'detained' && { color: '#991B1B' }]}>
                    Detain from Semester Exams
                  </Text>
                  <Text style={styles.statusOptionDesc}>
                    Hall ticket withheld due to insufficient attendance / coursework.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Official HOD Remarks Input */}
            <Text style={styles.sectionHeading}>HOD Endorsement Note / Action Taken</Text>
            <TextInput
              style={styles.remarksInput}
              placeholder="e.g., Medical cert verified with College CMO. Allowed for exams conditionally."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              value={hodRemarks}
              onChangeText={setHodRemarks}
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: getStatusColor(selectedStatus) },
                saving && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Decision</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B6B6B',
    marginTop: 2,
    fontFamily: FontFamily.poppins,
  },
  closeBtn: {
    padding: 4,
  },
  contentScroll: {
    maxHeight: 460,
  },
  studentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FontFamily.poppins,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  departmentText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B6B6B',
    fontWeight: '600',
    fontFamily: FontFamily.poppins,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
    marginVertical: 2,
    fontFamily: FontFamily.poppins,
  },
  metricSub: {
    fontSize: 9,
    color: '#9CA3AF',
    fontFamily: FontFamily.poppins,
  },
  reasonCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: BorderRadius.card,
    padding: 12,
    marginBottom: 14,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reasonTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    fontFamily: FontFamily.poppins,
  },
  reasonBody: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
    fontFamily: FontFamily.poppins,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
    fontFamily: FontFamily.poppins,
  },
  statusOptionsContainer: {
    gap: 8,
    marginBottom: 14,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.chip,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  statusOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: FontFamily.poppins,
  },
  statusOptionDesc: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 1,
    fontFamily: FontFamily.poppins,
  },
  remarksInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.input,
    padding: 12,
    fontSize: 13,
    color: '#171717',
    minHeight: 64,
    textAlignVertical: 'top',
    fontFamily: FontFamily.poppins,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  saveBtn: {
    borderRadius: BorderRadius.button,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 140,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FontFamily.poppins,
  },
});
