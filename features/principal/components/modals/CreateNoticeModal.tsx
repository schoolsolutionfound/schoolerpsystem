import React, { useState } from 'react';
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
import { Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../../constants/fonts';
import { SchoolNotice } from '../../types/principal.types';

interface CreateNoticeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (notice: Omit<SchoolNotice, 'id' | 'publishedDate' | 'acknowledgedCount'>) => Promise<void>;
}

const INSTITUTION_DEPARTMENTS = [
  'Computer Science',
  'AIML',
  'Electronics & Comm',
  'Mechanical Eng',
  'Civil Eng',
  'Commerce & Mgmt',
  'Applied Sciences',
];

export const CreateNoticeModal: React.FC<CreateNoticeModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<SchoolNotice['priority']>('important');
  const [targetAudience, setTargetAudience] = useState<SchoolNotice['targetAudience']>('all');
  const [department, setDepartment] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle('');
    setContent('');
    setPriority('important');
    setTargetAudience('all');
    setDepartment('');
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        priority,
        targetAudience,
        department: department.trim() === 'all' ? '' : department.trim(),
        author: 'Principal Office',
      });
      reset();
      onClose();
    } finally {
      setSaving(false);
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
            <View style={styles.headerTitleWrap}>
              <View>
                <Text style={styles.title}>New Announcement</Text>
                <Text style={styles.subTitle}>Publish circular to campus community</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notice Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Schedule for Mid-Term Assessments 2026"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Target Audience */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Audience *</Text>
              <View style={styles.chipsWrap}>
                {(
                  [
                    { key: 'all' as const, label: 'All Campus' },
                    { key: 'teachers' as const, label: 'Faculty' },
                    { key: 'students' as const, label: 'Students' },
                    { key: 'parents' as const, label: 'Parents' },
                  ] as const
                ).map((aud) => {
                  const active = targetAudience === aud.key;
                  return (
                    <TouchableOpacity
                      key={aud.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setTargetAudience(aud.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {aud.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Target Department */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Departments</Text>
              <View style={styles.chipsWrap}>
                {[
                  { key: '', label: 'All Departments' },
                  ...INSTITUTION_DEPARTMENTS.map((d) => ({ key: d, label: d })),
                ].map((dept) => {
                  const active = (department || '').toLowerCase() === dept.key.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={dept.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setDepartment(dept.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {dept.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Priority */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Circular Priority</Text>
              <View style={styles.priorityRow}>
                {(['normal', 'important', 'urgent'] as const).map((p) => {
                  const active = priority === p;
                  const label =
                    p === 'normal'
                      ? 'Routine / Info'
                      : p === 'important'
                      ? 'Important'
                      : 'Urgent';

                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityBtn,
                        active && (p === 'urgent' ? styles.priorityBtnUrgent : styles.priorityBtnActive),
                      ]}
                      onPress={() => setPriority(p)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          active && (p === 'urgent' ? styles.priorityTextUrgent : styles.priorityTextActive),
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Content Body */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Circular Details *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Draft instructions, dates, deadlines, or official guidelines..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={content}
                onChangeText={setContent}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePublish}
              disabled={!title.trim() || !content.trim() || saving}
              style={[
                styles.saveBtn,
                (!title.trim() || !content.trim() || saving) && styles.saveBtnDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#F3F4F6" />
              ) : (
                <>
                  <Feather
                    name="send"
                    size={13}
                    color={!title.trim() || !content.trim() || saving ? '#9CA3AF' : '#F3F4F6'}
                  />
                  <Text
                    style={[
                      styles.saveText,
                      (!title.trim() || !content.trim() || saving) && styles.saveTextDisabled,
                    ]}
                  >
                    Publish
                  </Text>
                </>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  subTitle: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    maxHeight: 400,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 4,
  },
  fieldGroup: {
    gap: 5,
  },
  label: {
    fontSize: 11.5,
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  input: {
    height: 38,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#111827',
    fontFamily: FontFamily.regular,
  },
  textArea: {
    height: 84,
    paddingVertical: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  chipText: {
    fontSize: 11.5,
    color: '#4B5563',
    fontFamily: FontFamily.medium,
  },
  chipTextActive: {
    color: '#000000',
    fontFamily: FontFamily.bold,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 5,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityBtnActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  priorityBtnUrgent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  priorityText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FontFamily.medium,
  },
  priorityTextActive: {
    color: '#000000',
    fontFamily: FontFamily.bold,
  },
  priorityTextUrgent: {
    color: '#DC2626',
    fontFamily: FontFamily.bold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
  },
  cancelText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: FontFamily.medium,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 5,
  },
  saveBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveText: {
    fontSize: 12,
    color: '#F3F4F6',
    fontFamily: FontFamily.bold,
  },
  saveTextDisabled: {
    color: '#9CA3AF',
  },
});
