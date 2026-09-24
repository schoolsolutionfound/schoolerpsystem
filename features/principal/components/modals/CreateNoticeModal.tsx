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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../../constants/theme';
import { FontFamily } from '../../../../constants/fonts';
import { SchoolNotice } from '../../types/principal.types';

interface CreateNoticeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (notice: Omit<SchoolNotice, 'id' | 'publishedDate' | 'acknowledgedCount'>) => Promise<void>;
}

export const CreateNoticeModal: React.FC<CreateNoticeModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<SchoolNotice['priority']>('important');
  const [targetAudience, setTargetAudience] = useState<SchoolNotice['targetAudience']>('all');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle('');
    setContent('');
    setPriority('important');
    setTargetAudience('all');
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
        author: 'Principal / Headmaster',
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
                <MaterialCommunityIcons name="bullhorn" size={22} color="#D97706" />
              </View>
              <View>
                <Text style={styles.title}>Publish School Circular</Text>
                <Text style={styles.subTitle}>Official broadcast to faculty, parents & students</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={20} color="#6B6B6B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notice Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Schedule for Annual Science Exhibition 2026"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Target Audience */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Target Audience *</Text>
              <View style={styles.chipsWrap}>
                {(
                  [
                    { key: 'all', label: '📢 All Campus' },
                    { key: 'teachers', label: '👨‍🏫 Teachers Only' },
                    { key: 'parents', label: '👨‍👩‍👧 Parents' },
                    { key: 'students', label: '🎒 Students' },
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
                      ? '⭐ Important'
                      : '🚨 High Alert / Urgent';

                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.priorityBtn, active && styles.priorityBtnActive]}
                      onPress={() => setPriority(p)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.priorityText, active && styles.priorityTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Content Body */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Circular Content & Details *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Draft circular body, instructions, deadlines, or dress code guidelines..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={5}
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
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={16} color="#FFFFFF" />
                  <Text style={styles.saveText}>Publish Notice</Text>
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
    backgroundColor: '#FEF3C7',
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
    maxHeight: 380,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 6,
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
    height: 100,
    paddingVertical: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: FontFamily.semibold,
  },
  chipTextActive: {
    color: '#B45309',
    fontWeight: '700',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.button,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityBtnActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#D97706',
  },
  priorityText: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
  },
  priorityTextActive: {
    color: '#D97706',
    fontWeight: '700',
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
    backgroundColor: '#D97706',
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
