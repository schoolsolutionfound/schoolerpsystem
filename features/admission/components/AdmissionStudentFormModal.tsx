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
import {
  AdmissionCourse,
  AdmissionFormField,
  createAdmissionApplication,
  getAdmissionFormConfigs,
} from '../../../api/admission';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';

interface AdmissionStudentFormModalProps {
  visible: boolean;
  onClose: () => void;
  courses: AdmissionCourse[];
  activeBatch: string;
  onSuccess: () => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const AdmissionStudentFormModal: React.FC<AdmissionStudentFormModalProps> = ({
  visible,
  onClose,
  courses,
  activeBatch,
  onSuccess,
}) => {
  // Core Fields
  const [fullName, setFullName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [dob, setDob] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [preferredCourseId, setPreferredCourseId] = useState('');
  const [programType, setProgramType] = useState('engineering');
  const [notes, setNotes] = useState('');

  // Dynamic Custom Fields Pipeline
  const [dynamicFields, setDynamicFields] = useState<AdmissionFormField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFormConfigs();
    }
  }, [visible, programType]);

  const loadFormConfigs = async () => {
    try {
      setLoadingConfig(true);
      const fields = await getAdmissionFormConfigs(programType);
      setDynamicFields(fields);
    } catch (err) {
      console.warn('Failed to load dynamic admission form config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setParentPhone('');
    setDob('');
    setFatherName('');
    setMotherName('');
    setGuardianPhone('');
    setAddress('');
    setBloodGroup('');
    setPreferredCourseId('');
    setNotes('');
    setCustomFieldValues({});
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter student full name');
      return;
    }
    if (!parentPhone.trim()) {
      Alert.alert('Required', 'Please enter parent phone number');
      return;
    }

    try {
      setSubmitting(true);
      const preferredCourse = courses.find((c) => c.id === preferredCourseId);

      await createAdmissionApplication({
        academicYear: activeBatch || '2026-2027',
        fullName: fullName.trim(),
        parentPhone: parentPhone.trim(),
        dob: dob.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        guardianPhone: guardianPhone.trim(),
        address: address.trim(),
        bloodGroup: bloodGroup.trim(),
        programType,
        preferredCourseId: preferredCourseId || null,
        preferredCourseName: preferredCourse?.courseName || '',
        notes: notes.trim(),
        customFields: customFieldValues,
      });

      Alert.alert('Student Registered', `${fullName.trim()} has been added to the Waiting List.`);
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Registration Failed', err?.message || 'Could not register student.');
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
              <Text style={styles.title}>New Student Admission</Text>
              <Text style={styles.subtitle}>Enters Waiting List • Batch {activeBatch || '2026-2027'}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
              <Feather name="x" size={20} color="#171717" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Institution Level / Program Selector */}
            <Text style={styles.sectionHeading}>ADMISSION PROGRAM TYPE</Text>
            <View style={styles.chipRow}>
              {[
                { key: 'engineering', label: 'Engineering' },
                { key: 'pu', label: 'PU / +2' },
                { key: 'school', label: 'School' },
                { key: 'degree', label: 'Degree' },
              ].map((prog) => {
                const isActive = programType === prog.key;
                return (
                  <TouchableOpacity
                    key={prog.key}
                    style={[styles.progChip, isActive && styles.progChipActive]}
                    onPress={() => setProgramType(prog.key)}
                  >
                    <Text style={[styles.progChipText, isActive && styles.progChipTextActive]}>
                      {prog.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* CORE FIELDS */}
            <Text style={styles.sectionHeading}>CANDIDATE DETAILS</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Arun Kumar"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.col]}>
                <Text style={styles.label}>Parent Mobile *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={parentPhone}
                  onChangeText={setParentPhone}
                />
              </View>
              <View style={[styles.inputGroup, styles.col]}>
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  value={dob}
                  onChangeText={setDob}
                />
              </View>
            </View>

            {/* Blood Group Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Blood Group</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bgRow}>
                {BLOOD_GROUPS.map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bgChip, bloodGroup === bg && styles.bgChipActive]}
                    onPress={() => setBloodGroup(bg === bloodGroup ? '' : bg)}
                  >
                    <Text style={[styles.bgText, bloodGroup === bg && styles.bgTextActive]}>
                      {bg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.sectionHeading}>FAMILY & CONTACTS</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.col]}>
                <Text style={styles.label}>Father's Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Ramesh Kumar"
                  placeholderTextColor="#9CA3AF"
                  value={fatherName}
                  onChangeText={setFatherName}
                />
              </View>
              <View style={[styles.inputGroup, styles.col]}>
                <Text style={styles.label}>Mother's Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Sunitha Kumar"
                  placeholderTextColor="#9CA3AF"
                  value={motherName}
                  onChangeText={setMotherName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Guardian Number (Alternative)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 9845011223"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={guardianPhone}
                onChangeText={setGuardianPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Residential Address</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Street address, city, pincode"
                placeholderTextColor="#9CA3AF"
                multiline
                value={address}
                onChangeText={setAddress}
              />
            </View>

            {/* BRANCH PREFERENCE */}
            <Text style={styles.sectionHeading}>PREFERRED BRANCH / COURSE</Text>
            {courses.length === 0 ? (
              <Text style={styles.helperText}>No branches configured yet. You can allocate later.</Text>
            ) : (
              <View style={styles.coursePills}>
                {courses.map((course) => {
                  const isSelected = preferredCourseId === course.id;
                  return (
                    <TouchableOpacity
                      key={course.id}
                      style={[styles.coursePill, isSelected && styles.coursePillActive]}
                      onPress={() => setPreferredCourseId(isSelected ? '' : course.id)}
                    >
                      <Text style={[styles.coursePillCode, isSelected && styles.coursePillCodeActive]}>
                        {course.courseCode}
                      </Text>
                      <Text style={[styles.coursePillName, isSelected && styles.coursePillNameActive]}>
                        {course.courseName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* DYNAMIC CUSTOM FIELDS PIPELINE */}
            {dynamicFields.length > 0 && (
              <>
                <Text style={styles.sectionHeading}>ADDITIONAL / CUSTOM FIELDS</Text>
                {dynamicFields.map((field) => (
                  <View style={styles.inputGroup} key={field.id}>
                    <Text style={styles.label}>
                      {field.label} {field.isRequired ? '*' : ''}
                    </Text>
                    {field.fieldType === 'select' ? (
                      <View style={styles.selectRow}>
                        {field.options.map((opt) => {
                          const isSel = customFieldValues[field.fieldKey] === opt;
                          return (
                            <TouchableOpacity
                              key={opt}
                              style={[styles.bgChip, isSel && styles.bgChipActive]}
                              onPress={() =>
                                setCustomFieldValues((prev) => ({
                                  ...prev,
                                  [field.fieldKey]: isSel ? '' : opt,
                                }))
                              }
                            >
                              <Text style={[styles.bgText, isSel && styles.bgTextActive]}>{opt}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <TextInput
                        style={styles.textInput}
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        placeholderTextColor="#9CA3AF"
                        keyboardType={field.fieldType === 'number' ? 'numeric' : 'default'}
                        value={customFieldValues[field.fieldKey] || ''}
                        onChangeText={(val) =>
                          setCustomFieldValues((prev) => ({ ...prev, [field.fieldKey]: val }))
                        }
                      />
                    )}
                  </View>
                ))}
              </>
            )}

            {/* Notes */}
            <View style={[styles.inputGroup, { marginTop: 8 }]}>
              <Text style={styles.label}>Officer Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Optional admission notes, remarks..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerBar}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#1A1B1C" />
              ) : (
                <Text style={styles.saveBtnText}>Save to Waiting List</Text>
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
    maxHeight: '92%',
    minHeight: '70%',
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
    paddingVertical: 16,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A8A8A',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
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
  col: {
    flex: 1,
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
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  bgRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bgChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  bgChipActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  bgText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  bgTextActive: {
    color: '#1A1B1C',
  },
  helperText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  coursePills: {
    gap: 6,
    marginBottom: 12,
  },
  coursePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  coursePillActive: {
    borderColor: '#F4C430',
    backgroundColor: '#FFFBEB',
  },
  coursePillCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  coursePillCodeActive: {
    color: '#B45309',
  },
  coursePillName: {
    fontSize: 11,
    color: '#6B6B6B',
    flex: 1,
  },
  coursePillNameActive: {
    color: '#1A1B1C',
    fontWeight: '600',
  },
  selectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  saveBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 20,
    height: 38,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1A1B1C',
  },
});
