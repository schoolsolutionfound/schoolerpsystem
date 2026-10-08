import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { storage } from '../../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AppModal } from '../../shared/components/AppModal';
import { AppButton } from '../../shared/components/AppButton';
import { AppInput } from '../../shared/components/AppInput';
import { AudienceSelector } from './AudienceSelector';
import { Announcement, AnnouncementType, AnnouncementPriority, AnnouncementTarget } from '../types';
import { Colors, BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface CreateAnnouncementModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  initialData?: Announcement | null;
  loading?: boolean;
}

const TYPES: AnnouncementType[] = ['GENERAL', 'ACADEMIC', 'EVENT', 'URGENT', 'NOTICE'];
const PRIORITIES: AnnouncementPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const formatToLocalISOString = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatInputToIsoString = (inputStr: string): string | null => {
  if (!inputStr || !inputStr.trim()) return null;
  const trimmed = inputStr.trim();
  if (trimmed.endsWith('Z')) return trimmed;

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (match) {
    const [, year, month, day, hour, minute] = match.map(Number);
    const localDate = new Date(year, month - 1, day, hour, minute);
    if (isNaN(localDate.getTime())) return null;
    return localDate.toISOString();
  }

  const fallbackDate = new Date(trimmed);
  if (isNaN(fallbackDate.getTime())) return null;
  return fallbackDate.toISOString();
};

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('GENERAL');
  const [priority, setPriority] = useState<AnnouncementPriority>('NORMAL');
  const [imageUrl, setImageUrl] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [publishAt, setPublishAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [targets, setTargets] = useState<AnnouncementTarget[]>([{ targetType: 'all', targetRole: '' }]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = React.useRef(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setType(initialData.type || 'GENERAL');
      setPriority(initialData.priority || 'NORMAL');
      setImageUrl(initialData.imageUrl || '');
      setAttachmentUrl(initialData.attachmentUrl || '');
      setPublishAt(formatToLocalISOString(initialData.publishAt));
      setExpiresAt(formatToLocalISOString(initialData.expiresAt));
      setTargets(initialData.targets && initialData.targets.length > 0 ? initialData.targets : [{ targetType: 'all', targetRole: '' }]);
    } else {
      resetForm();
    }
  }, [initialData, visible]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setType('GENERAL');
    setPriority('NORMAL');
    setImageUrl('');
    setAttachmentUrl('');
    setPublishAt('');
    setExpiresAt('');
    setTargets([{ targetType: 'all', targetRole: '' }]);
    setIsSubmitting(false);
    isSubmittingRef.current = false;
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setUploadingImage(true);
        const uri = result.assets[0].uri;
        const res = await fetch(uri);
        const blob = await res.blob();
        const storageRef = ref(storage, `announcements/images/${Date.now()}.jpg`);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        setImageUrl(url);
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.message || 'Failed to upload image attachment');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setUploadingDoc(true);
        const uri = result.assets[0].uri;
        const res = await fetch(uri);
        const blob = await res.blob();
        const storageRef = ref(storage, `announcements/docs/${Date.now()}_${result.assets[0].name || 'file'}`);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        setAttachmentUrl(url);
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.message || 'Failed to upload document attachment');
    } finally {
      setUploadingDoc(false);
    }
  };

  const validateForm = (action: 'draft' | 'publish' | 'schedule'): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title is required.');
      return false;
    }
    if (!content.trim()) {
      Alert.alert('Validation Error', 'Content is required.');
      return false;
    }

    let pubDate: Date | null = null;
    let expDate: Date | null = null;

    if (publishAt && publishAt.trim()) {
      const parsedIso = formatInputToIsoString(publishAt);
      if (!parsedIso) {
        Alert.alert('Validation Error', 'Please enter a valid scheduled date and time.');
        return false;
      }
      pubDate = new Date(parsedIso);
    }

    if (expiresAt && expiresAt.trim()) {
      const parsedIso = formatInputToIsoString(expiresAt);
      if (!parsedIso) {
        Alert.alert('Validation Error', 'Please enter a valid expiry date and time.');
        return false;
      }
      expDate = new Date(parsedIso);
    }

    if (pubDate && expDate) {
      if (expDate.getTime() <= pubDate.getTime()) {
        Alert.alert('Validation Error', 'Expiry date/time cannot be earlier than the scheduled date/time.');
        return false;
      }
    }

    if (action === 'schedule') {
      if (!pubDate) {
        Alert.alert('Validation Error', 'Please enter a valid scheduled date and time.');
        return false;
      }
      if (pubDate.getTime() <= Date.now()) {
        Alert.alert('Validation Error', 'Scheduled publication date must be in the future.');
        return false;
      }
    }

    return true;
  };

  const handleSubmitAction = async (action: 'draft' | 'publish' | 'schedule') => {
    if (isSubmittingRef.current || isSubmitting || loading) return;
    if (!validateForm(action)) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        type,
        priority,
        action,
        publishAt: publishAt.trim() ? formatInputToIsoString(publishAt) : null,
        expiresAt: expiresAt.trim() ? formatInputToIsoString(expiresAt) : null,
        imageUrl,
        attachmentUrl,
        targets,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      Alert.alert('Announcement Error', err?.message || 'Failed to save announcement.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };


  const isBusy = loading || isSubmitting;

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={initialData ? 'Edit Announcement' : 'New Announcement'}
    >
      <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
        <AppInput
          label="Title *"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Annual Sports Day Schedule"
          editable={!isBusy}
        />

        <AppInput
          label="Content / Announcement Body *"
          value={content}
          onChangeText={setContent}
          placeholder="Enter full announcement details..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
          editable={!isBusy}
        />

        {/* Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Announcement Type</Text>
          <View style={styles.chipRow}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, type === t && styles.chipSelected]}
                onPress={() => !isBusy && setType(t)}
                disabled={isBusy}
              >
                <Text style={[styles.chipText, type === t && styles.chipTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Priority</Text>
          <View style={styles.chipRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, priority === p && styles.chipSelected]}
                onPress={() => !isBusy && setPriority(p)}
                disabled={isBusy}
              >
                <Text style={[styles.chipText, priority === p && styles.chipTextSelected]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Audience Selector */}
        <AudienceSelector targets={targets} onChange={setTargets} />

        {/* Schedule & Expiry Dates */}
        <View style={styles.dateRow}>
          <View style={{ flex: 1 }}>
            <AppInput
              label="Publish Date (Optional)"
              value={publishAt}
              onChangeText={setPublishAt}
              placeholder="YYYY-MM-DDTHH:mm"
              editable={!isBusy}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput
              label="Expiry Date (Optional)"
              value={expiresAt}
              onChangeText={setExpiresAt}
              placeholder="YYYY-MM-DDTHH:mm"
              editable={!isBusy}
            />
          </View>
        </View>

        {/* Media / Attachments */}
        <View style={styles.attachmentSection}>
          <Text style={styles.sectionLabel}>Attachments (Firebase Storage)</Text>
          <View style={styles.uploadRow}>
            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage} disabled={uploadingImage || isBusy}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="image-outline" size={20} color={Colors.light.primary} />
                  <Text style={styles.uploadBtnText}>Cover Image</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickDocument} disabled={uploadingDoc || isBusy}>
              {uploadingDoc ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="file-document-outline" size={20} color={Colors.light.primary} />
                  <Text style={styles.uploadBtnText}>PDF / Document</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {imageUrl ? (
            <View style={styles.previewBox}>
              <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
              <TouchableOpacity onPress={() => !isBusy && setImageUrl('')} disabled={isBusy} style={styles.removeIcon}>
                <MaterialCommunityIcons name="close-circle" size={20} color={Colors.light.danger} />
              </TouchableOpacity>
            </View>
          ) : null}

          {attachmentUrl ? (
            <View style={styles.fileBox}>
              <MaterialCommunityIcons name="file-check-outline" size={18} color={Colors.light.success} />
              <Text style={styles.fileText} numberOfLines={1}>Document attached</Text>
              <TouchableOpacity onPress={() => !isBusy && setAttachmentUrl('')} disabled={isBusy}>
                <MaterialCommunityIcons name="close-circle" size={18} color={Colors.light.danger} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <AppButton
            title="Save Draft"
            variant="outline"
            onPress={() => handleSubmitAction('draft')}
            loading={isBusy}
            disabled={isBusy}
            style={{ flex: 1 }}
          />

          <AppButton
            title="Schedule"
            variant="secondary"
            onPress={() => handleSubmitAction('schedule')}
            loading={isBusy}
            disabled={isBusy}
            style={{ flex: 1 }}
          />

          <AppButton
            title="Publish Now"
            variant="primary"
            onPress={() => handleSubmitAction('publish')}
            loading={isBusy}
            disabled={isBusy}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  formContent: {
    gap: 14,
    paddingBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: Colors.light.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.light.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  attachmentSection: {
    gap: 8,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  uploadBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.light.text,
  },
  previewBox: {
    position: 'relative',
    marginTop: 6,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  removeIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  fileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  fileText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.light.success,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
});
