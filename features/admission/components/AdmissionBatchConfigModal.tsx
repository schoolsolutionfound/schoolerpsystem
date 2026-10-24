import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AdmissionCourse, createAdmissionCourse, updateAdmissionCourse } from '../../../api/admission';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';

interface AdmissionBatchConfigModalProps {
  visible: boolean;
  onClose: () => void;
  activeBatch: string;
  courseToEdit?: AdmissionCourse | null;
  onSuccess: () => void;
}

interface QuotaDraft {
  quotaName: string;
  seats: string;
}

export const AdmissionBatchConfigModal: React.FC<AdmissionBatchConfigModalProps> = ({
  visible,
  onClose,
  activeBatch,
  courseToEdit,
  onSuccess,
}) => {
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [totalSeats, setTotalSeats] = useState('');
  const [programType, setProgramType] = useState<'school' | 'pu' | 'engineering' | 'degree'>('engineering');
  const [quotas, setQuotas] = useState<QuotaDraft[]>([
    { quotaName: 'CET', seats: '' },
    { quotaName: 'Management', seats: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (courseToEdit) {
      setCourseCode(courseToEdit.courseCode);
      setCourseName(courseToEdit.courseName);
      setTotalSeats(String(courseToEdit.totalSeats));
      setProgramType(courseToEdit.programType);
      if (courseToEdit.quotas && courseToEdit.quotas.length > 0) {
        setQuotas(courseToEdit.quotas.map((q) => ({ quotaName: q.quotaName, seats: String(q.seats) })));
      } else {
        setQuotas([{ quotaName: 'General', seats: String(courseToEdit.totalSeats) }]);
      }
    } else {
      setCourseCode('');
      setCourseName('');
      setTotalSeats('120');
      setProgramType('engineering');
      setQuotas([
        { quotaName: 'CET', seats: '80' },
        { quotaName: 'Management', seats: '40' },
      ]);
    }
  }, [courseToEdit, visible]);

  const addQuotaRow = () => {
    setQuotas((prev) => [...prev, { quotaName: '', seats: '' }]);
  };

  const removeQuotaRow = (index: number) => {
    setQuotas((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuota = (index: number, field: 'quotaName' | 'seats', val: string) => {
    setQuotas((prev) => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };

  const totalSeatsNum = parseInt(totalSeats, 10) || 0;
  const quotaSum = quotas.reduce((sum, q) => sum + (parseInt(q.seats, 10) || 0), 0);
  const remainingGeneral = Math.max(0, totalSeatsNum - quotaSum);
  const isOverallocated = quotaSum > totalSeatsNum;

  const handleSave = async () => {
    if (!courseCode.trim()) {
      Alert.alert('Required', 'Please enter course code (e.g. CS)');
      return;
    }
    if (!courseName.trim()) {
      Alert.alert('Required', 'Please enter course name (e.g. Computer Science & Engineering)');
      return;
    }
    if (totalSeatsNum <= 0) {
      Alert.alert('Required', 'Total seats must be greater than 0');
      return;
    }
    if (isOverallocated) {
      Alert.alert('Quota Over-allocation', `Sum of quota seats (${quotaSum}) cannot exceed total course seats (${totalSeatsNum}).`);
      return;
    }

    const cleanedQuotas = quotas
      .filter((q) => q.quotaName.trim() && parseInt(q.seats, 10) > 0)
      .map((q) => ({ quotaName: q.quotaName.trim(), seats: parseInt(q.seats, 10) }));

    try {
      setSubmitting(true);
      if (courseToEdit) {
        await updateAdmissionCourse(courseToEdit.id, {
          courseName: courseName.trim(),
          programType,
          totalSeats: totalSeatsNum,
          quotas: cleanedQuotas,
        });
        Alert.alert('Updated', 'Course seat matrix updated successfully.');
      } else {
        await createAdmissionCourse({
          academicYear: activeBatch || '2026-2027',
          courseCode: courseCode.trim().toUpperCase(),
          courseName: courseName.trim(),
          programType,
          totalSeats: totalSeatsNum,
          quotas: cleanedQuotas,
        });
        Alert.alert('Created', `Branch ${courseCode.trim().toUpperCase()} configured with ${totalSeatsNum} seats.`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save course matrix.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.title}>
                {courseToEdit ? `Configure ${courseToEdit.courseCode}` : 'Add Branch / Course Seat Matrix'}
              </Text>
              <Text style={styles.subtitle}>Batch: {activeBatch || '2026-2027'}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
              <Feather name="x" size={18} color="#171717" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Program Type */}
            <Text style={styles.sectionHeading}>PROGRAM CATEGORY</Text>
            <View style={styles.chipRow}>
              {(['engineering', 'pu', 'school', 'degree'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.progChip, programType === p && styles.progChipActive]}
                  onPress={() => setProgramType(p)}
                >
                  <Text style={[styles.progChipText, programType === p && styles.progChipTextActive]}>
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Course Code & Name */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 0.8 }]}>
                <Text style={styles.label}>Course Code *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. CS"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  value={courseCode}
                  onChangeText={setCourseCode}
                  editable={!courseToEdit}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                <Text style={styles.label}>Total Capacity *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 120"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={totalSeats}
                  onChangeText={setTotalSeats}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Course / Branch Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Computer Science & Engineering"
                placeholderTextColor="#9CA3AF"
                value={courseName}
                onChangeText={setCourseName}
              />
            </View>

            {/* QUOTAS PARTITION */}
            <View style={styles.quotaHeaderRow}>
              <Text style={styles.sectionHeading}>QUOTA PARTITIONS (WITHIN {totalSeatsNum || 0} SEATS)</Text>
              <TouchableOpacity style={styles.addQuotaBtn} onPress={addQuotaRow}>
                <Feather name="plus" size={12} color="#1A1B1C" />
                <Text style={styles.addQuotaText}>Add Quota</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quotaCard}>
              {quotas.map((q, idx) => (
                <View style={styles.quotaInputRow} key={idx}>
                  <TextInput
                    style={[styles.textInput, { flex: 1.5 }]}
                    placeholder="Quota name (e.g. CET)"
                    placeholderTextColor="#9CA3AF"
                    value={q.quotaName}
                    onChangeText={(val) => updateQuota(idx, 'quotaName', val)}
                  />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Seats"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={q.seats}
                    onChangeText={(val) => updateQuota(idx, 'seats', val)}
                  />
                  {quotas.length > 1 && (
                    <TouchableOpacity
                      style={styles.trashBtn}
                      onPress={() => removeQuotaRow(idx)}
                      hitSlop={8}
                    >
                      <Feather name="trash-2" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Arithmetic Summary Bar */}
              <View style={styles.quotaSummaryBar}>
                <View>
                  <Text style={styles.quotaSummaryLabel}>Total Partitioned:</Text>
                  <Text style={[styles.quotaSummaryVal, isOverallocated && styles.quotaSummaryValError]}>
                    {quotaSum} / {totalSeatsNum} seats
                  </Text>
                </View>
                <View>
                  <Text style={styles.quotaSummaryLabel}>Unassigned / General:</Text>
                  <Text style={styles.quotaSummaryVal}>{remainingGeneral} seats</Text>
                </View>
              </View>

              {isOverallocated && (
                <Text style={styles.errorBanner}>
                  ⚠️ Sum of quota seats cannot exceed total course capacity!
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footerBar}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (submitting || isOverallocated) && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={submitting || isOverallocated}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#1A1B1C" />
              ) : (
                <Text style={styles.saveBtnText}>Save Seat Matrix</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    minHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A8A8A',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  progChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  progChipActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  progChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  progChipTextActive: {
    color: '#1A1B1C',
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1B1C',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1A1B1C',
  },
  quotaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  addQuotaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF4C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  addQuotaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  quotaCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  quotaInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trashBtn: {
    padding: 8,
  },
  quotaSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 4,
  },
  quotaSummaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8A8A',
  },
  quotaSummaryVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1B1C',
    marginTop: 2,
  },
  quotaSummaryValError: {
    color: '#DC2626',
  },
  errorBanner: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 4,
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  saveBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 5,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1B1C',
  },
});
