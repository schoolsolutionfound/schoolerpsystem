import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FontFamily } from '../../../constants/fonts';
import { uploadProfilePictureApi } from '../../../api/upload';
import { ProfileCustomFields } from '../formFields/ProfileCustomFields';
import { useProfileCustomFields } from '../formFields/useProfileCustomFields';

export interface StaffProfilePatch {
  fullName?: string;
  phone?: string;
  designation?: string;
  profilePicUrl?: string;
  qualification?: string;
  experience?: string;
}

export interface StaffProfileDetail {
  id: string;
  icon: string;
  label: string;
  value: string;
}

export interface StaffProfileExtraField {
  key: 'qualification' | 'experience';
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
}

interface StaffProfileViewProps {
  roleLabel: string;
  fullName: string;
  email: string;
  phone?: string;
  designation?: string;
  institutionName?: string;
  institutionCode?: string;
  profilePic?: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  avatarBg: string;
  avatarTextColor: string;
  buttonTextColor: string;
  details: StaffProfileDetail[];
  extraFields?: StaffProfileExtraField[];
  extraValues?: Record<string, string>;
  onSaveProfile: (patch: StaffProfilePatch) => Promise<boolean>;
  onChangePassword: () => void;
  onLogout: () => void;
}

const initialsFrom = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'ST';

export const StaffProfileView: React.FC<StaffProfileViewProps> = ({
  roleLabel,
  fullName,
  email,
  phone = '',
  designation = '',
  institutionName = '',
  institutionCode = '',
  profilePic = '',
  accent,
  accentSoft,
  accentText,
  avatarBg,
  avatarTextColor,
  buttonTextColor,
  details,
  extraFields = [],
  extraValues = {},
  onSaveProfile,
  onChangePassword,
  onLogout,
}) => {
  const { fields: roleFields, values: roleFieldValues, save: saveRoleFields } = useProfileCustomFields();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameVal, setNameVal] = useState(fullName);
  const [phoneVal, setPhoneVal] = useState(phone);
  const [designationVal, setDesignationVal] = useState(designation);
  const [extraVals, setExtraVals] = useState<Record<string, string>>(extraValues);
  const [pickedPhotoUri, setPickedPhotoUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const displayName = isEditing ? nameVal : fullName;
  const displayDesignation = (isEditing ? designationVal : designation) || roleLabel;
  const displayPhoto = pickedPhotoUri || profilePic || '';
  const initials = initialsFrom(displayName || roleLabel);

  const startEditing = () => {
    setNameVal(fullName);
    setPhoneVal(phone);
    setDesignationVal(designation);
    setExtraVals(extraValues);
    setPickedPhotoUri(null);
    setImageError(false);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setPickedPhotoUri(null);
    setImageError(false);
    setIsEditing(false);
  };

  const pickProfilePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access your photos is required to select a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setPickedPhotoUri(result.assets[0].uri);
        setImageError(false);
      }
    } catch {
      Alert.alert('Image Selection Error', 'Could not select a photo from your library.');
    }
  };

  const handleSave = async () => {
    const trimmedName = nameVal.trim();
    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Full name must be at least 2 characters.');
      return;
    }

    const trimmedPhone = phoneVal.trim();
    if (trimmedPhone && !/^\+?[\d\s-]{7,20}$/.test(trimmedPhone)) {
      Alert.alert('Invalid Phone', 'Phone number must be 7-20 digits (may include +, spaces or dashes).');
      return;
    }

    setSaving(true);
    try {
      let uploadedPhotoUrl: string | undefined;
      if (pickedPhotoUri) {
        try {
          uploadedPhotoUrl = await uploadProfilePictureApi(pickedPhotoUri);
        } catch {
          Alert.alert('Photo Upload Failed', 'Could not upload your profile photo. Please try again.');
          return;
        }
      }

      const patch: StaffProfilePatch = {
        fullName: trimmedName,
        phone: trimmedPhone,
        designation: designationVal.trim(),
        ...(uploadedPhotoUrl ? { profilePicUrl: uploadedPhotoUrl } : {}),
      };

      for (const field of extraFields) {
        const value = (extraVals[field.key] || '').trim();
        if (field.key === 'qualification') patch.qualification = value;
        if (field.key === 'experience') patch.experience = value;
      }

      const ok = await onSaveProfile(patch);
      if (ok) {
        setPickedPhotoUri(null);
        setImageError(false);
        setIsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {displayPhoto && !imageError ? (
              <Image
                source={{ uri: displayPhoto }}
                style={[styles.avatar, { borderColor: accent, backgroundColor: avatarBg }]}
                onError={() => setImageError(true)}
              />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  { borderColor: accent, backgroundColor: avatarBg },
                ]}
              >
                <Text style={[styles.avatarInitials, { color: avatarTextColor }]}>{initials}</Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={20} color={accent} />
            </View>
          </View>

          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.roleTitle}>{displayDesignation}</Text>

          {institutionName || institutionCode ? (
            <View
              style={[
                styles.institutionPill,
                { backgroundColor: accentSoft, borderColor: accentSoft },
              ]}
            >
              <MaterialCommunityIcons name="office-building" size={13} color={accentText} />
              <Text style={[styles.institutionText, { color: accentText }]}>
                {institutionName || institutionCode}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.editToggleBtn, { backgroundColor: accent }]}
            onPress={isEditing ? cancelEditing : startEditing}
            activeOpacity={0.8}
            disabled={saving}
          >
            <MaterialCommunityIcons
              name={isEditing ? 'close' : 'pencil-outline'}
              size={16}
              color={buttonTextColor}
            />
            <Text style={[styles.editToggleText, { color: buttonTextColor }]}>
              {isEditing ? 'Cancel Editing' : 'Edit Profile Info'}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.editCard}>
            <Text style={styles.editCardTitle}>Edit {roleLabel} Profile</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Profile Photo</Text>
              <TouchableOpacity style={styles.photoUploadBtn} onPress={pickProfilePhoto} activeOpacity={0.8}>
                {displayPhoto && !imageError ? (
                  <Image source={{ uri: displayPhoto }} style={styles.uploadThumb} />
                ) : (
                  <View style={[styles.uploadThumbFallback, { backgroundColor: avatarBg }]}>
                    <Text style={[styles.uploadThumbInitials, { color: avatarTextColor }]}>
                      {initials}
                    </Text>
                  </View>
                )}
                <View style={styles.uploadTextWrap}>
                  <View style={styles.uploadTextRow}>
                    <MaterialCommunityIcons name="camera-plus-outline" size={18} color={accent} />
                    <Text style={styles.uploadText}>Upload New Photo</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.formInput}
                value={nameVal}
                onChangeText={setNameVal}
                placeholder="Your full name"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                value={phoneVal}
                onChangeText={setPhoneVal}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Designation / Role Title</Text>
              <TextInput
                style={styles.formInput}
                value={designationVal}
                onChangeText={setDesignationVal}
                placeholder={roleLabel}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>

            {extraFields.map((field) => (
              <View key={field.key} style={styles.formGroup}>
                <Text style={styles.formLabel}>{field.label}</Text>
                <TextInput
                  style={styles.formInput}
                  value={extraVals[field.key] || ''}
                  onChangeText={(text) =>
                    setExtraVals((current) => ({ ...current, [field.key]: text }))
                  }
                  placeholder={field.placeholder}
                  placeholderTextColor="#9CA3AF"
                  keyboardType={field.keyboardType || 'default'}
                />
              </View>
            ))}

            <View style={styles.readOnlyGroup}>
              <Text style={styles.formLabel}>Official Email</Text>
              <Text style={styles.readOnlyValue}>{email || 'Not Provided'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: accent }, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color={buttonTextColor} />
              ) : (
                <Text style={[styles.saveBtnText, { color: buttonTextColor }]}>
                  Save Profile Updates
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionHeader}>{roleLabel} Details</Text>
            <View style={styles.infoCard}>
              {details.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.detailRow, index === details.length - 1 && styles.detailRowLast]}
                >
                  <View style={[styles.detailIconWrap, { backgroundColor: accentSoft }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={18} color={accent} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue} selectable>
                      {item.value || 'Not Provided'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {roleFields.length > 0 && (
              <ProfileCustomFields fields={roleFields} values={roleFieldValues} onSave={saveRoleFields} />
            )}
          </>
        )}

        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.accountCard}>
          <TouchableOpacity style={styles.accountRow} onPress={onChangePassword} activeOpacity={0.7}>
            <MaterialCommunityIcons name="lock-reset" size={20} color={accent} />
            <Text style={styles.accountText}>Change Password</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color="#6B6B6B"
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtnLarge} onPress={onLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={20} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 110 },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  name: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
    textAlign: 'center',
  },
  roleTitle: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#6B6B6B',
    marginTop: 4,
    textAlign: 'center',
  },
  institutionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    marginTop: 12,
  },
  institutionText: { fontSize: 11, fontFamily: FontFamily.bold },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 5,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  editToggleText: { fontSize: 12, fontFamily: FontFamily.bold },
  editCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
  },
  editCardTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#171717',
    marginBottom: 2,
  },
  formGroup: { gap: 5 },
  formLabel: { fontSize: 12, fontFamily: FontFamily.bold, color: '#374151' },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#111827',
  },
  readOnlyGroup: {
    gap: 5,
    backgroundColor: '#F9FAFB',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyValue: { fontSize: 13, fontFamily: FontFamily.semibold, color: '#6B6B6B' },
  photoUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    borderStyle: 'dashed',
    borderRadius: 5,
    padding: 10,
  },
  uploadThumb: { width: 50, height: 50, borderRadius: 5 },
  uploadThumbFallback: {
    width: 50,
    height: 50,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadThumbInitials: { fontSize: 16, fontFamily: FontFamily.extrabold },
  uploadTextWrap: { flex: 1, gap: 2 },
  uploadTextRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  uploadText: { fontSize: 13, fontFamily: FontFamily.bold, color: '#171717' },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 13, fontFamily: FontFamily.bold },
  sectionHeader: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: '#171717',
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: { flex: 1, justifyContent: 'center' },
  detailLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#171717',
    marginTop: 2,
    lineHeight: 18,
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  accountText: { fontSize: 14, fontFamily: FontFamily.semibold, color: '#171717' },
  logoutBtnLarge: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    borderRadius: 5,
    marginTop: 6,
  },
  logoutBtnText: { color: '#DC2626', fontSize: 15, fontFamily: FontFamily.bold },
});
