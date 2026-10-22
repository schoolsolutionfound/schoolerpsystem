import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { DropdownSelect } from '../../admin/components/DropdownSelect';
import { DateField } from './DateField';
import { validateDynamicFields } from './types';
import type { ProfileFormField, CustomFieldValues, CustomFieldValueDocument } from './types';

interface ProfileCustomFieldsProps {
  fields: ProfileFormField[];
  values: CustomFieldValues;
  /** Persists edited values (PATCH /users/me with customFields). Return false/throw on failure. */
  onSave: (customFields: CustomFieldValues) => Promise<boolean>;
  saving?: boolean;
}

function formatValue(field: ProfileFormField, value: any): string {
  if (value === null || value === undefined) return '—';
  if (field.type === 'checkbox') return value === true ? 'Yes' : 'No';
  if (field.type === 'document') {
    const doc = value as CustomFieldValueDocument;
    return doc?.name || (doc?.url ? 'Document' : '—');
  }
  const str = String(value).trim();
  return str || '—';
}

/**
 * Role profile → admin-configured fields. Plain label/value rows (no section
 * title); fields flagged editable can be updated in place, the rest stay
 * read-only. Renders nothing when the role has no configured fields.
 */
export const ProfileCustomFields: React.FC<ProfileCustomFieldsProps> = ({ fields, values, onSave, saving }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CustomFieldValues>({});
  const [pending, setPending] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setDraft({});
  }, [editing]);

  if (!fields?.length) return null;

  const editableFields = fields.filter((f) => f.editable);
  const isSaving = saving || pending;

  const openEdit = () => {
    const initial: CustomFieldValues = {};
    for (const f of editableFields) initial[f.id] = values?.[f.id] ?? (f.type === 'checkbox' ? false : f.type === 'document' ? null : '');
    setDraft(initial);
    setEditing(true);
  };

  const handleSave = async () => {
    const error = validateDynamicFields(editableFields, draft);
    if (error) {
      Alert.alert('Check the form', error);
      return;
    }
    setPending(true);
    try {
      const ok = await onSave(draft);
      if (ok !== false) setEditing(false);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not save your details. Please try again.');
    } finally {
      setPending(false);
    }
  };

  const handlePickDocument = async (field: ProfileFormField) => {
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setUploadingId(field.id);
      try {
        const { uploadDocumentApi } = await import('../../../api/upload');
        const uploaded = await uploadDocumentApi(asset.uri, asset.name || 'document');
        setDraft((prev) => ({ ...prev, [field.id]: uploaded }));
      } finally {
        setUploadingId(null);
      }
    } catch (err: any) {
      setUploadingId(null);
      Alert.alert('Upload Failed', err?.message || 'Could not upload the document.');
    }
  };

  const openDocument = (doc: CustomFieldValueDocument) => {
    if (doc?.url) Linking.openURL(doc.url).catch(() => {});
  };

  const renderViewRow = (field: ProfileFormField) => {
    const value = values?.[field.id];
    const text = formatValue(field, value);
    const isDoc = field.type === 'document' && value && typeof value === 'object' && (value as CustomFieldValueDocument).url;
    return (
      <View key={field.id} style={styles.row}>
        <Text style={styles.rowLabel}>{field.label}</Text>
        {isDoc ? (
          <TouchableOpacity onPress={() => openDocument(value as CustomFieldValueDocument)} style={styles.docLink}>
            <MaterialCommunityIcons name="file-pdf-box" size={16} color="#F4C430" />
            <Text style={styles.docLinkText} numberOfLines={1}>{text}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.rowValue} numberOfLines={3}>{text}</Text>
        )}
      </View>
    );
  };

  const renderEditInput = (field: ProfileFormField) => {
    const rawValue = draft[field.id];
    const strValue = typeof rawValue === 'string' ? rawValue : '';

    switch (field.type) {
      case 'textarea':
        return (
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="#9CA3AF"
            multiline
            value={strValue}
            onChangeText={(v) => setDraft((prev) => ({ ...prev, [field.id]: v }))}
          />
        );
      case 'number':
        return (
          <TextInput
            style={styles.input}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={strValue}
            onChangeText={(v) => setDraft((prev) => ({ ...prev, [field.id]: v }))}
          />
        );
      case 'phone':
        return (
          <TextInput
            style={styles.input}
            placeholder={field.placeholder || 'Enter phone number'}
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={strValue}
            onChangeText={(v) => setDraft((prev) => ({ ...prev, [field.id]: v }))}
          />
        );
      case 'email':
        return (
          <TextInput
            style={styles.input}
            placeholder={field.placeholder || 'Enter email address'}
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={strValue}
            onChangeText={(v) => setDraft((prev) => ({ ...prev, [field.id]: v }))}
          />
        );
      case 'date':
        return (
          <DateField
            label=""
            value={strValue}
            onChange={(v) => setDraft((prev) => ({ ...prev, [field.id]: v }))}
          />
        );
      case 'dropdown':
        return (
          <DropdownSelect
            value={strValue}
            options={field.options || []}
            onChange={(v) => setDraft((prev) => ({ ...prev, [field.id]: v }))}
            placeholder={field.placeholder || 'Select an option'}
            variant="inline"
            menuTitle={field.label}
          />
        );
      case 'checkbox':
        return (
          <TouchableOpacity
            style={styles.checkRow}
            activeOpacity={0.7}
            onPress={() => setDraft((prev) => ({ ...prev, [field.id]: prev[field.id] !== true }))}
          >
            <View style={[styles.checkBox, rawValue === true && styles.checkBoxOn]}>
              {rawValue === true && <MaterialCommunityIcons name="check" size={14} color="#1A1B1C" />}
            </View>
            <Text style={styles.checkText}>{rawValue === true ? 'Yes' : 'No'}</Text>
          </TouchableOpacity>
        );
      case 'document': {
        const doc = rawValue && typeof rawValue === 'object' ? (rawValue as CustomFieldValueDocument) : null;
        const uploading = uploadingId === field.id;
        return (
          <TouchableOpacity
            style={[styles.docBox, uploading && { opacity: 0.7 }]}
            activeOpacity={0.8}
            disabled={uploading}
            onPress={() => handlePickDocument(field)}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#F4C430" />
            ) : doc?.url ? (
              <>
                <MaterialCommunityIcons name="file-check-outline" size={20} color="#F4C430" />
                <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                <Text style={styles.docHint}>Tap to replace</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="file-upload-outline" size={22} color="#F4C430" />
                <Text style={styles.docHint}>Tap to upload a document</Text>
              </>
            )}
          </TouchableOpacity>
        );
      }
      case 'text':
      default:
        return (
          <TextInput
            style={styles.input}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            placeholderTextColor="#9CA3AF"
            value={strValue}
            onChangeText={(v) => setDraft((prev) => ({ ...prev, [field.id]: v }))}
          />
        );
    }
  };

  return (
    <View style={styles.card}>
      {editableFields.length > 0 && (
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />
          {editing ? (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setEditing(false)} style={styles.headerBtn} disabled={isSaving}>
                <Text style={styles.headerBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={[styles.headerBtn, styles.headerBtnPrimary]} disabled={isSaving}>
                {isSaving ? <ActivityIndicator size="small" color="#1A1B1C" /> : <Text style={styles.headerBtnTextPrimary}>Save</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={openEdit} style={styles.headerBtn} disabled={isSaving}>
              <MaterialCommunityIcons name="pencil-outline" size={14} color="#1A1B1C" />
              <Text style={styles.headerBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {fields.map((field) => {
        if (!editing || !field.editable) return renderViewRow(field);
        return (
          <View key={field.id} style={styles.editGroup}>
            <Text style={styles.editLabel}>
              {field.label}
              {field.required && <Text style={styles.reqMark}> *</Text>}
            </Text>
            {renderEditInput(field)}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', minHeight: 24 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFDF7',
  },
  headerBtnPrimary: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  headerBtnText: { fontSize: 12, fontWeight: '700', fontFamily: FontFamily.bold, color: '#1A1B1C' },
  headerBtnTextPrimary: { fontSize: 12, fontWeight: '700', fontFamily: FontFamily.bold, color: '#1A1B1C' },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  rowLabel: { flexShrink: 1, fontSize: 13, color: '#6B6B6B', fontFamily: FontFamily.medium, paddingTop: 1 },
  rowValue: { flexShrink: 1, fontSize: 13, color: '#171717', fontWeight: '600', fontFamily: FontFamily.semibold, textAlign: 'right' },
  docLink: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  docLinkText: { fontSize: 13, color: '#F4C430', fontWeight: '600', fontFamily: FontFamily.semibold },
  editGroup: { gap: 4 },
  editLabel: { fontSize: 12, fontWeight: '600', fontFamily: FontFamily.semibold, color: '#6B6B6B' },
  reqMark: { color: '#D64545' },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: '#171717',
  },
  textarea: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C9C4B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkBoxOn: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  checkText: { fontSize: 13, color: '#171717', fontFamily: FontFamily.medium },
  docBox: {
    minHeight: 72,
    backgroundColor: '#FFFDF7',
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    borderColor: '#FFF4C7',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  docName: { flexShrink: 1, fontSize: 13, color: '#171717', fontWeight: '600', fontFamily: FontFamily.semibold },
  docHint: { fontSize: 12, color: '#F4C430', fontWeight: '600', fontFamily: FontFamily.semibold },
});
