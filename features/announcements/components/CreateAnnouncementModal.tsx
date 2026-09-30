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

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setType(initialData.type || 'GENERAL');
      setPriority(initialData.priority || 'NORMAL');
      setImageUrl(initialData.imageUrl || '');
      setAttachmentUrl(initialData.attachmentUrl || '');
      setPublishAt(initialData.publishAt ? new Date(initialData.publishAt).toISOString().slice(0, 16) : '');
      setExpiresAt(initialData.expiresAt ? new Date(initialData.expiresAt).toISOString().slice(0, 16) : '');
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
      Alert.alert('Upload Error', 'Failed to upload image attachment');
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
        const name = result.assets[0].name || 'document.pdf';
        const res = await fetch(uri);
        const blob = await res.blob();
        const storageRef = ref(storage, `announcements/docs/${Date.now()}_${name}`);
        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);
        setAttachmentUrl(url);
      }
    } catch (err: any) {
      Alert.alert('Upload Error', 'Failed to upload document attachment');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmitAction = async (action: 'draft' | 'publish' | 'schedule') => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title is required');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Validation Error', 'Content is required');
      return;
    }

    if (action === 'schedule') {
      if (!publishAt) {
        Alert.alert('Validation Error', 'Publication date is required when scheduling');
        return;
      }
      const pDate = new Date(publishAt);
      if (isNaN(pDate.getTime()) || pDate <= new Date()) {
        Alert.alert('Validation Error', 'Scheduled publication date must be in the future (e.g. YYYY-MM-DDTHH:mm)');
        return;
      }
    }

    if (expiresAt && publishAt) {
      const pDate = new Date(publishAt);
      const eDate = new Date(expiresAt);
      if (!isNaN(pDate.getTime()) && !isNaN(eDate.getTime()) && eDate <= pDate) {
        Alert.alert('Validation Error', 'Expiration date must be after publication date');
        return;
      }
    }

    const payload = {
      title: title.trim(),
      content: content.trim(),
      type,
      priority,
      action,
      publishAt: publishAt ? new Date(publishAt).toISOString() : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      imageUrl,
      attachmentUrl,
      targets,
    };

    await onSubmit(payload);
    onClose();
  };

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
        />

        <AppInput
          label="Content / Announcement Body *"
          value={content}
          onChangeText={setContent}
          placeholder="Enter full announcement details..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        {/* Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Announcement Type</Text>
          <View style={styles.chipRow}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, type === t && styles.chipSelected]}
                onPress={() => setType(t)}
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
                onPress={() => setPriority(p)}
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
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput
              label="Expiry Date (Optional)"
              value={expiresAt}
              onChangeText={setExpiresAt}
              placeholder="YYYY-MM-DDTHH:mm"
            />
          </View>
        </View>

        {/* Media / Attachments */}
        <View style={styles.attachmentSection}>
          <Text style={styles.sectionLabel}>Attachments (Firebase Storage)</Text>
          <View style={styles.uploadRow}>
            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage} disabled={uploadingImage}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="image-outline" size={20} color={Colors.light.primary} />
                  <Text style={styles.uploadBtnText}>Cover Image</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickDocument} disabled={uploadingDoc}>
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
              <TouchableOpacity onPress={() => setImageUrl('')} style={styles.removeIcon}>
                <MaterialCommunityIcons name="close-circle" size={20} color={Colors.light.danger} />
              </TouchableOpacity>
            </View>
          ) : null}

          {attachmentUrl ? (
            <View style={styles.fileBox}>
              <MaterialCommunityIcons name="file-check-outline" size={18} color={Colors.light.success} />
              <Text style={styles.fileText} numberOfLines={1}>Document attached</Text>
              <TouchableOpacity onPress={() => setAttachmentUrl('')}>
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
            loading={loading}
            style={{ flex: 1 }}
          />

          <AppButton
            title="Schedule"
            variant="secondary"
            onPress={() => handleSubmitAction('schedule')}
            loading={loading}
            style={{ flex: 1 }}
          />

          <AppButton
            title="Publish Now"
            variant="primary"
            onPress={() => handleSubmitAction('publish')}
            loading={loading}
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
