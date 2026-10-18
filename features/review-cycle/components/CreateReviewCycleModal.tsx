import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { CreateReviewCyclePayload, ReviewCycleScope } from '../types/reviewCycle.types';

interface CreateReviewCycleModalProps {
  visible: boolean;
  defaultDepartment?: string;
  onClose: () => void;
  onSubmit: (payload: CreateReviewCyclePayload) => Promise<void>;
}

export const CreateReviewCycleModal: React.FC<CreateReviewCycleModalProps> = ({
  visible,
  defaultDepartment,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState('Spring Semester 2026');
  const [scope, setScope] = useState<ReviewCycleScope>(defaultDepartment ? 'department' : 'all_staff');
  const [department, setDepartment] = useState(defaultDepartment || '');
  const [deadline, setDeadline] = useState('2026-04-30');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for the review cycle.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        period: period.trim(),
        scope,
        department: scope === 'department' ? department.trim() : undefined,
        deadline,
        description: description.trim(),
      });
      Alert.alert('Review Cycle Launched', `"${title}" is now active for evaluation.`);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not launch review cycle.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Initiate Review Cycle</Text>
              <Text style={styles.sub}>Setup staff appraisal period, scope & deadlines</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#171717" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Cycle Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Q1 2026 Faculty & Staff Performance Appraisal"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.inputLabel}>Academic Period / Term *</Text>
            <TextInput
              style={styles.textInput}
              value={period}
              onChangeText={setPeriod}
              placeholder="e.g. Jan 2026 - Mar 2026"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.inputLabel}>Evaluation Scope</Text>
            <View style={styles.scopeRow}>
              {(
                [
                  { key: 'all_staff', label: 'All Campus Staff' },
                  { key: 'department', label: 'Department Only' },
                  { key: 'teaching_only', label: 'Faculty Only' },
                ] as const
              ).map((s) => {
                const active = scope === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.scopeChip, active && styles.scopeChipActive]}
                    onPress={() => setScope(s.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.scopeChipText, active && styles.scopeChipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {scope === 'department' && (
              <>
                <Text style={styles.inputLabel}>Target Department</Text>
                <TextInput
                  style={styles.textInput}
                  value={department}
                  onChangeText={setDepartment}
                  placeholder="e.g. Computer Science & Engineering"
                  placeholderTextColor="#9CA3AF"
                />
              </>
            )}

            <Text style={styles.inputLabel}>Completion Deadline (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.textInput}
              value={deadline}
              onChangeText={setDeadline}
              placeholder="2026-04-30"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.inputLabel}>Cycle Objectives & Instructions</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Guidelines for reviewers, focus metrics, and submission expectations..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <>
                  <MaterialCommunityIcons name="rocket-launch-outline" size={18} color="#111827" />
                  <Text style={styles.submitText}>Launch Cycle</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#FFFDF7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  sub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B6B6B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#171717',
    marginBottom: 4,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#171717',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  scopeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  scopeChipActive: {
    backgroundColor: '#1A1B1C',
    borderColor: '#1A1B1C',
  },
  scopeChipText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: '#6B6B6B',
  },
  scopeChipTextActive: {
    color: '#F4C430',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  cancelText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: '#6B6B6B',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  submitText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
});
