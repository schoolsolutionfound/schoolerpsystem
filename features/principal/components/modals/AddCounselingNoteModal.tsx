import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../../constants/theme';
import { FontFamily } from '../../../../constants/fonts';
import {
  CounselingRecord,
  CounselingConcernCategory,
  CONCERN_LABELS,
} from '../../types/principal.types';

interface AddCounselingNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (record: Omit<CounselingRecord, 'id'>) => Promise<void>;
}

const CATEGORIES: CounselingConcernCategory[] = [
  'attendance_issue',
  'academic_stress',
  'behavioral',
  'peer_conflict',
  'career_guidance',
  'family',
  'wellbeing',
];

export const AddCounselingNoteModal: React.FC<AddCounselingNoteModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [studentName, setStudentName] = useState('');
  const [gradeSection, setGradeSection] = useState('');
  const [counselorName, setCounselorName] = useState('Dr. Evelyn Reed (Guidance Lead)');
  const [concernCategory, setConcernCategory] = useState<CounselingConcernCategory>('attendance_issue');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [actionPlan, setActionPlan] = useState('');
  const [parentContacted, setParentContacted] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStudentName('');
    setGradeSection('');
    setActionPlan('');
    setParentContacted(false);
    setSeverity('medium');
  };

  const handleSubmit = async () => {
    if (!studentName.trim() || !gradeSection.trim() || !actionPlan.trim()) return;

    setSaving(true);
    try {
      await onSubmit({
        studentId: `std-${Date.now().toString().slice(-4)}`,
        studentName: studentName.trim(),
        gradeSection: gradeSection.trim(),
        counselorName: counselorName.trim(),
        concernCategory,
        severity,
        actionPlan: actionPlan.trim(),
        parentContacted,
        status: 'active',
        date: new Date().toISOString().split('T')[0],
      });
      reset();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="heart-pulse" size={22} color="#9D174D" />
              </View>
              <View>
                <Text style={styles.title}>Student Guidance & Counseling Log</Text>
                <Text style={styles.subTitle}>Pastoral care, attendance & wellbeing tracking</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color="#6B6B6B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Student & Grade row */}
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Student Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Aarav Sharma"
                  placeholderTextColor="#9CA3AF"
                  value={studentName}
                  onChangeText={setStudentName}
                />
              </View>
              <View style={styles.flexHalf}>
                <Text style={styles.label}>Class / Section *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Grade 9-A"
                  placeholderTextColor="#9CA3AF"
                  value={gradeSection}
                  onChangeText={setGradeSection}
                />
              </View>
            </View>

            {/* Concern Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Concern Domain *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {CATEGORIES.map((cat) => {
                  const active = concernCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setConcernCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {CONCERN_LABELS[cat]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Severity Level */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Urgency / Severity Level</Text>
              <View style={styles.severityRow}>
                {(['low', 'medium', 'high'] as const).map((sev) => {
                  const active = severity === sev;
                  const colors = {
                    low: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
                    medium: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
                    high: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
                  }[sev];

                  return (
                    <TouchableOpacity
                      key={sev}
                      style={[
                        styles.severityBtn,
                        active && { backgroundColor: colors.bg, borderColor: colors.border },
                      ]}
                      onPress={() => setSeverity(sev)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.severityText,
                          active && { color: colors.text, fontWeight: '700' },
                        ]}
                      >
                        {sev === 'low' ? '🟢 Low / Preventive' : sev === 'medium' ? '🟡 Moderate / Review' : '🔴 High Urgency'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Parent Contact Switch */}
            <View style={styles.switchRow}>
              <View style={styles.flex1}>
                <Text style={styles.switchLabel}>Guardian / Parent Contacted?</Text>
                <Text style={styles.switchSub}>Recorded in student pastoral file</Text>
              </View>
              <Switch
                value={parentContacted}
                onValueChange={setParentContacted}
                trackColor={{ false: '#E5E7EB', true: '#9D174D' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Action Plan & Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Counselor Notes & Action Plan *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Detail meeting discussion, behavioral findings, interventions planned, or teacher follow-up..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={actionPlan}
                onChangeText={setActionPlan}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!studentName.trim() || !gradeSection.trim() || !actionPlan.trim() || saving}
              style={[
                styles.saveBtn,
                (!studentName.trim() || !gradeSection.trim() || !actionPlan.trim() || saving) &&
                  styles.saveBtnDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save" size={16} color="#FFFFFF" />
                  <Text style={styles.saveText}>Log Guidance Case</Text>
                </>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.modal,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FCE7F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.extrabold,
  },
  subTitle: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  scrollArea: {
    maxHeight: 400,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flexHalf: {
    width: '40%',
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  input: {
    height: 42,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#171717',
    fontFamily: FontFamily.regular,
  },
  textArea: {
    height: 90,
    paddingVertical: 10,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#FCE7F3',
    borderColor: '#F472B6',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: FontFamily.semibold,
  },
  chipTextActive: {
    color: '#9D174D',
    fontWeight: '700',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  severityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.button,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityText: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.card,
    padding: 12,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  switchSub: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6B6B',
    fontFamily: FontFamily.semibold,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#9D174D',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  saveBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
});
