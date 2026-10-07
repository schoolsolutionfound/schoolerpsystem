import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../../constants/theme';
import { FontFamily } from '../../../../constants/fonts';
import { DepartmentNotice } from '../../types/hod.types';

interface CreateDeptNoticeModalProps {
  visible: boolean;
  department: string;
  authorName: string;
  onClose: () => void;
  onSubmit: (notice: Omit<DepartmentNotice, 'id' | 'publishedDate'>) => Promise<void>;
}

export const CreateDeptNoticeModal: React.FC<CreateDeptNoticeModalProps> = ({
  visible,
  department,
  authorName,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<DepartmentNotice['priority']>('important');
  const [targetAudience, setTargetAudience] = useState<DepartmentNotice['targetAudience']>('all');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPriority('important');
    setTargetAudience('all');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        department,
        priority,
        targetAudience,
        authorName: authorName || 'Head of Department',
        authorRole: 'Head of Department',
      });
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const priorityOptions: { key: DepartmentNotice['priority']; label: string; color: string }[] = [
    { key: 'normal', label: 'General Memo', color: '#10B981' },
    { key: 'important', label: 'Important', color: '#F59E0B' },
    { key: 'urgent', label: 'Urgent / Action Required', color: '#EF4444' },
  ];

  const audienceOptions: { key: DepartmentNotice['targetAudience']; label: string; icon: string }[] = [
    { key: 'all', label: 'All Department', icon: 'account-group' },
    { key: 'faculty', label: 'Faculty Only', icon: 'human-male-board' },
    { key: 'students', label: 'Students', icon: 'school' },
    { key: 'lab_assistants', label: 'Lab Instructors', icon: 'flask' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Publish Department Memo</Text>
              <Text style={styles.subtitle}>{department || 'Department Administration'}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={styles.fieldLabel}>Memo Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., IA-2 Question Paper Submission Guidelines"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
            />

            {/* Target Audience */}
            <Text style={styles.fieldLabel}>Circulate To</Text>
            <View style={styles.audienceGrid}>
              {audienceOptions.map((opt) => {
                const isSelected = targetAudience === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.audienceChip, isSelected && styles.audienceChipSelected]}
                    onPress={() => setTargetAudience(opt.key)}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon as any}
                      size={15}
                      color={isSelected ? '#EA580C' : '#6B6B6B'}
                    />
                    <Text
                      style={[styles.audienceChipText, isSelected && styles.audienceChipTextSelected]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Priority */}
            <Text style={styles.fieldLabel}>Priority Level</Text>
            <View style={styles.priorityRow}>
              {priorityOptions.map((opt) => {
                const isSelected = priority === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.priorityChip,
                      isSelected && {
                        borderColor: opt.color,
                        backgroundColor: `${opt.color}15`,
                      },
                    ]}
                    onPress={() => setPriority(opt.key)}
                  >
                    <View
                      style={[styles.priorityDot, { backgroundColor: isSelected ? opt.color : '#D1D5DB' }]}
                    />
                    <Text
                      style={[
                        styles.priorityChipText,
                        isSelected && { color: opt.color, fontWeight: '700' },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Memo Content */}
            <Text style={styles.fieldLabel}>Notice Content & Instructions *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Type your official announcement, deadlines, or curriculum instructions here..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              value={content}
              onChangeText={setContent}
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={saving}>
              <Text style={styles.cancelBtnText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!title.trim() || !content.trim() || saving) && styles.submitBtnDisabled,
              ]}
              onPress={handlePublish}
              disabled={!title.trim() || !content.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Post Memo</Text>
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
    marginBottom: 6,
    fontFamily: FontFamily.poppins,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  audienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  audienceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  audienceChipSelected: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  audienceChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: FontFamily.poppins,
  },
  audienceChipTextSelected: {
    color: '#EA580C',
    fontWeight: '700',
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: FontFamily.poppins,
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.input,
    padding: 12,
    fontSize: 13,
    color: '#171717',
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: FontFamily.poppins,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 10,
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
  submitBtn: {
    backgroundColor: '#EA580C',
    borderRadius: BorderRadius.button,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 130,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#FED7AA',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FontFamily.poppins,
  },
});
