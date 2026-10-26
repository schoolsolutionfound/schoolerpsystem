import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { DropdownSelect } from '../../admin/components/DropdownSelect';
import { DateField } from './DateField';
import { uploadDocumentApi } from '../../../api/upload';
import type { ProfileFormField, CustomFieldValues, CustomFieldValueDocument } from './types';

interface DynamicProfileFieldsFormProps {
  fields: ProfileFormField[];
  values: CustomFieldValues;
  onChange: (fieldId: string, value: any) => void;
  theme?: 'light' | 'dark';
}

/**
 * Renders the admin-configured Settings → Form Fields for a role, Google-Forms
 * style: each field has a name, a type from the dropdown (text / number /
 * document / ...), and a required marker. Used by complete-profile.
 */
export const DynamicProfileFieldsForm: React.FC<DynamicProfileFieldsFormProps> = ({ fields, values, onChange, theme = 'light' }) => {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const dark = theme === 'dark';
  const inputStyle = [styles.input, dark && styles.inputDark];

  if (!fields.length) return null;

  const handlePickDocument = async (field: ProfileFormField) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploadingId(field.id);
      try {
        const uploaded = await uploadDocumentApi(asset.uri, asset.name || 'document');
        onChange(field.id, uploaded);
      } finally {
        setUploadingId(null);
      }
    } catch (err: any) {
      setUploadingId(null);
      Alert.alert('Upload Failed', err?.message || 'Could not upload the document. Please try again.');
    }
  };

  const renderInput = (field: ProfileFormField) => {
    const rawValue = values[field.id];
    const strValue = typeof rawValue === 'string' ? rawValue : '';

    switch (field.type) {
      case 'textarea':
        return (
          <TextInput
            style={[styles.input, styles.textarea, dark && styles.inputDark, dark && styles.textareaDark]}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            placeholderTextColor={dark ? '#6B6B6B' : '#9CA3AF'}
            multiline
            value={strValue}
            onChangeText={(v) => onChange(field.id, v)}
          />
        );
      case 'number':
        return (
          <TextInput
            style={inputStyle}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            placeholderTextColor={dark ? '#6B6B6B' : '#9CA3AF'}
            keyboardType="numeric"
            value={strValue}
            onChangeText={(v) => onChange(field.id, v)}
          />
        );
      case 'phone':
        return (
          <TextInput
            style={inputStyle}
            placeholder={field.placeholder || 'Enter phone number'}
            placeholderTextColor={dark ? '#6B6B6B' : '#9CA3AF'}
            keyboardType="phone-pad"
            value={strValue}
            onChangeText={(v) => onChange(field.id, v)}
          />
        );
      case 'email':
        return (
          <TextInput
            style={inputStyle}
            placeholder={field.placeholder || 'Enter email address'}
            placeholderTextColor={dark ? '#6B6B6B' : '#9CA3AF'}
            keyboardType="email-address"
            autoCapitalize="none"
            value={strValue}
            onChangeText={(v) => onChange(field.id, v)}
          />
        );
      case 'date':
        return (
          <DateField
            label=""
            value={strValue}
            onChange={(v) => onChange(field.id, v)}
            placeholder={field.placeholder || 'YYYY-MM-DD'}
            theme={theme}
          />
        );
      case 'dropdown':
        return (
          <DropdownSelect
            value={strValue}
            options={field.options || []}
            onChange={(v) => onChange(field.id, v)}
            placeholder={field.placeholder || 'Select an option'}
            variant="dialog"
            menuTitle={field.label}
            theme={theme}
          />
        );
      case 'checkbox':
        return (
          <TouchableOpacity
            style={styles.checkRow}
            activeOpacity={0.7}
            onPress={() => onChange(field.id, rawValue !== true)}
          >
            <View style={[styles.checkBox, dark && styles.checkBoxDark, rawValue === true && styles.checkBoxOn]}>
              {rawValue === true && <MaterialCommunityIcons name="check" size={14} color="#1A1B1C" />}
            </View>
            <Text style={[styles.checkText, dark && styles.checkTextDark]}>{rawValue === true ? 'Yes' : 'No'}</Text>
          </TouchableOpacity>
        );
      case 'document': {
        const doc = rawValue && typeof rawValue === 'object' ? (rawValue as CustomFieldValueDocument) : null;
        const uploading = uploadingId === field.id;
        return (
          <TouchableOpacity
            style={[styles.docBox, dark && styles.docBoxDark, uploading && styles.docBoxBusy]}
            activeOpacity={0.8}
            disabled={uploading}
            onPress={() => handlePickDocument(field)}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#F4C430" />
            ) : doc?.url ? (
              <>
                <MaterialCommunityIcons name="file-check-outline" size={20} color="#F4C430" />
                <Text style={[styles.docName, dark && styles.docNameDark]} numberOfLines={1}>{doc.name}</Text>
                <Text style={[styles.docHint, dark && styles.docHintDark]}>Tap to replace</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="file-upload-outline" size={22} color="#F4C430" />
                <Text style={[styles.docHint, dark && styles.docHintDark]}>Tap to upload a document</Text>
              </>
            )}
          </TouchableOpacity>
        );
      }
      case 'text':
      default:
        return (
          <TextInput
            style={inputStyle}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            placeholderTextColor={dark ? '#6B6B6B' : '#9CA3AF'}
            value={strValue}
            onChangeText={(v) => onChange(field.id, v)}
          />
        );
    }
  };

  return (
    <View style={[styles.sectionCard, dark && styles.sectionCardDark]}>
      <Text style={[styles.sectionHeaderTitle, dark && styles.sectionHeaderTitleDark]}>Profile Details</Text>
      {fields.map((field) => (
        <View key={field.id} style={styles.inputGroup}>
          <Text style={[styles.inputLabel, dark && styles.inputLabelDark]}>
            {field.label}
            {field.required && <Text style={styles.reqMark}> *</Text>}
          </Text>
          {renderInput(field)}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: '#171717',
    marginBottom: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#F4C430',
    paddingLeft: 8,
    marginLeft: -2,
  },
  inputGroup: { gap: 4 },
  inputLabel: { fontSize: 12, fontWeight: '600', fontFamily: FontFamily.semibold, color: '#6B6B6B' },
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
  docBoxBusy: { opacity: 0.7 },
  docName: { flexShrink: 1, fontSize: 13, color: '#171717', fontWeight: '600', fontFamily: FontFamily.semibold },
  docHint: { fontSize: 12, color: '#1A1B1C', fontWeight: '600', fontFamily: FontFamily.semibold },
  sectionCardDark: { backgroundColor: '#1F1F1F', borderColor: 'rgba(244,196,48,0.12)' },
  sectionHeaderTitleDark: { color: '#E5E7EB' },
  inputLabelDark: { color: '#9CA3AF' },
  inputDark: { backgroundColor: '#171717', borderColor: 'rgba(244,196,48,0.15)', color: '#E5E7EB' },
  textareaDark: { color: '#E5E7EB' },
  checkBoxDark: { backgroundColor: '#171717', borderColor: 'rgba(244,196,48,0.25)' },
  checkTextDark: { color: '#E5E7EB' },
  docBoxDark: { backgroundColor: '#171717', borderColor: 'rgba(244,196,48,0.25)' },
  docNameDark: { color: '#E5E7EB' },
  docHintDark: { color: '#9CA3AF' },
});
