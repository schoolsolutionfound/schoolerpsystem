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
import { AdmissionApplication, AdmissionCourse, allocateAdmissionSeat } from '../../../api/admission';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';

interface AdmissionAllocationModalProps {
  visible: boolean;
  onClose: () => void;
  application: AdmissionApplication | null;
  courses: AdmissionCourse[];
  onSuccess: () => void;
}

export const AdmissionAllocationModal: React.FC<AdmissionAllocationModalProps> = ({
  visible,
  onClose,
  application,
  courses,
  onSuccess,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedQuota, setSelectedQuota] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (application) {
      // Pre-select preferred course if available
      const match = courses.find((c) => c.id === application.preferredCourseId);
      if (match) {
        setSelectedCourseId(match.id);
        if (match.quotas && match.quotas.length > 0) {
          setSelectedQuota(match.quotas[0].quotaName);
        } else {
          setSelectedQuota('General');
        }
      } else if (courses.length > 0) {
        setSelectedCourseId(courses[0].id);
        if (courses[0].quotas && courses[0].quotas.length > 0) {
          setSelectedQuota(courses[0].quotas[0].quotaName);
        } else {
          setSelectedQuota('General');
        }
      }
      setNotes('');
    }
  }, [application, courses]);

  if (!application) return null;

  const currentCourse = courses.find((c) => c.id === selectedCourseId);
  const quotas = currentCourse?.quotaSummaries || [];

  const handleAllocate = async () => {
    if (!selectedCourseId) {
      Alert.alert('Required', 'Please select a branch / course');
      return;
    }
    if (!selectedQuota) {
      Alert.alert('Required', 'Please select a quota (e.g. CET, Management)');
      return;
    }

    try {
      setSubmitting(true);
      await allocateAdmissionSeat(application.id, {
        courseId: selectedCourseId,
        quota: selectedQuota,
        notes,
      });
      Alert.alert('Allocated', `${application.fullName} has been allocated a seat in ${currentCourse?.courseName} under ${selectedQuota} quota.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Allocation Failed', err?.message || 'Could not allocate seat.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.dialogCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Allocate Student Seat</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {application.fullName} • {application.applicationNumber}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
              <Feather name="x" size={18} color="#171717" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Step 1: Select Branch */}
            <Text style={styles.fieldLabel}>1. SELECT BRANCH / COURSE</Text>
            {courses.length === 0 ? (
              <Text style={styles.emptyText}>No branches configured for this batch yet.</Text>
            ) : (
              <View style={styles.courseList}>
                {courses.map((course) => {
                  const isSelected = selectedCourseId === course.id;
                  const isFull = course.availableSeats <= 0;
                  return (
                    <TouchableOpacity
                      key={course.id}
                      style={[
                        styles.courseOption,
                        isSelected && styles.courseOptionSelected,
                        isFull && styles.courseOptionFull,
                      ]}
                      onPress={() => {
                        setSelectedCourseId(course.id);
                        if (course.quotas && course.quotas.length > 0) {
                          setSelectedQuota(course.quotas[0].quotaName);
                        } else {
                          setSelectedQuota('General');
                        }
                      }}
                      activeOpacity={0.7}
                      disabled={isFull}
                    >
                      <View style={styles.courseOptionHeader}>
                        <Text style={[styles.courseCode, isSelected && styles.courseCodeSelected]}>
                          {course.courseCode}
                        </Text>
                        <Text style={[styles.seatsAvailable, isFull && styles.seatsFull]}>
                          {course.availableSeats} of {course.totalSeats} seats left
                        </Text>
                      </View>
                      <Text style={styles.courseNameText} numberOfLines={1}>
                        {course.courseName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Step 2: Select Quota */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>2. SELECT QUOTA CATEGORY</Text>
            {quotas.length === 0 ? (
              <TouchableOpacity
                style={[styles.quotaOption, styles.quotaOptionSelected]}
                onPress={() => setSelectedQuota('General')}
              >
                <Text style={styles.quotaNameSelected}>General Quota</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.quotaGrid}>
                {quotas.map((q) => {
                  const isSelected = selectedQuota === q.quotaName;
                  const isQuotaFull = q.available <= 0;
                  return (
                    <TouchableOpacity
                      key={q.quotaName}
                      style={[
                        styles.quotaOption,
                        isSelected && styles.quotaOptionSelected,
                        isQuotaFull && styles.quotaOptionFull,
                      ]}
                      onPress={() => setSelectedQuota(q.quotaName)}
                      disabled={isQuotaFull}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.quotaName, isSelected && styles.quotaNameSelected]}>
                        {q.quotaName}
                      </Text>
                      <Text style={[styles.quotaCount, isSelected && styles.quotaCountSelected]}>
                        {q.available}/{q.total} available
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Step 3: Notes */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>3. ALLOCATION NOTES (OPTIONAL)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. Special management approval, provisional token #12"
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, submitting && { opacity: 0.6 }]}
              onPress={handleAllocate}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#1A1B1C" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Allocation</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B6B6B',
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
  body: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A8A8A',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  courseList: {
    gap: 8,
  },
  courseOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 10,
  },
  courseOptionSelected: {
    borderColor: '#F4C430',
    backgroundColor: '#FFFBEB',
  },
  courseOptionFull: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB',
  },
  courseOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  courseCodeSelected: {
    color: '#B45309',
  },
  seatsAvailable: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  seatsFull: {
    color: '#DC2626',
  },
  courseNameText: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
  },
  quotaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quotaOption: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 10,
  },
  quotaOptionSelected: {
    borderColor: '#F4C430',
    backgroundColor: '#F4C430',
  },
  quotaOptionFull: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB',
  },
  quotaName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1B1C',
  },
  quotaNameSelected: {
    color: '#1A1B1C',
    fontWeight: '800',
  },
  quotaCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B6B6B',
    marginTop: 2,
  },
  quotaCountSelected: {
    color: '#374151',
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 10,
    fontSize: 12,
    color: '#1A1B1C',
    minHeight: 50,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 5,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  confirmBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1B1C',
  },
});
