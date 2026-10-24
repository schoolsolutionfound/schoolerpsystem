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
import { ProfileCustomFields } from '../../shared/formFields/ProfileCustomFields';
import { useProfileCustomFields } from '../../shared/formFields/useProfileCustomFields';

export interface DriverProfilePatch {
  fullName?: string;
  phone?: string;
  designation?: string;
  profilePicUrl?: string;
}

export interface DriverProfileTabProps {
  fullName: string;
  email: string;
  phone?: string;
  institutionName?: string;
  institutionCode?: string;
  designation?: string;
  profilePic?: string;
  refreshControl?: React.ReactElement<any>;
  onChangePassword?: () => void;
  onLogout: () => void;
  onSaveProfile: (patch: DriverProfilePatch) => Promise<boolean>;
}

export const DriverProfileTab: React.FC<DriverProfileTabProps> = ({
  fullName,
  email,
  phone,
  institutionName,
  institutionCode,
  designation,
  profilePic,
  refreshControl,
  onChangePassword,
  onLogout,
  onSaveProfile,
}) => {
  const { fields: roleFields, values: roleFieldValues, save: saveRoleFields } = useProfileCustomFields();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameVal, setNameVal] = useState(fullName);
  const [phoneVal, setPhoneVal] = useState(phone || '');
  const [designationVal, setDesignationVal] = useState(designation || '');
  const [pickedPhotoUri, setPickedPhotoUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const displayName = isEditing ? nameVal : fullName;
  const displayDesignation = (isEditing ? designationVal : designation) || 'School Transport Driver';
  const displayPhoto = pickedPhotoUri || profilePic || '';

  const initials =
    (displayName || 'Driver')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'DR';

  const details = [
    { id: 'email', icon: 'email-outline', label: 'Official Email', value: email },
    { id: 'phone', icon: 'phone-outline', label: 'Contact Phone', value: phone || '' },
    { id: 'institution', icon: 'office-building-outline', label: 'Institution', value: institutionName || institutionCode || '' },
    { id: 'role', icon: 'steering', label: 'Role', value: 'Driver' },
  ];

  const startEditing = () => {
    setNameVal(fullName);
    setPhoneVal(phone || '');
    setDesignationVal(designation || '');
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

  const handleSaveProfile = async () => {
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

      const ok = await onSaveProfile({
        fullName: trimmedName,
        phone: trimmedPhone,
        designation: designationVal.trim(),
        ...(uploadedPhotoUrl ? { profilePicUrl: uploadedPhotoUrl } : {}),
      });

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
        refreshControl={refreshControl}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {displayPhoto && !imageError ? (
              <Image
                source={{ uri: displayPhoto }}
                style={styles.avatar}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={20} color="#F4C430" />
            </View>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.roleTitle}>{displayDesignation}</Text>
          {institutionName ? (
            <View style={styles.institutionPill}>
              <MaterialCommunityIcons name="office-building" size={13} color="#B45309" />
              <Text style={styles.institutionText}>{institutionName}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.editToggleBtn}
            onPress={isEditing ? cancelEditing : startEditing}
            activeOpacity={0.8}
            disabled={saving}
          >
            <MaterialCommunityIcons
              name={isEditing ? 'close' : 'pencil-outline'}
              size={16}
              color="#171717"
            />
            <Text style={styles.editToggleText}>
              {isEditing ? 'Cancel Editing' : 'Edit Profile Info'}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.editCard}>
            <Text style={styles.editCardTitle}>Edit Driver Profile</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Profile Photo</Text>
              <TouchableOpacity style={styles.photoUploadBtn} onPress={pickProfilePhoto} activeOpacity={0.8}>
                {displayPhoto && !imageError ? (
                  <Image source={{ uri: displayPhoto }} style={styles.uploadThumb} />
                ) : (
                  <View style={styles.uploadThumbFallback}>
                    <Text style={styles.uploadThumbInitials}>{initials}</Text>
                  </View>
                )}
                <View style={styles.uploadTextWrap}>
                  <View style={styles.uploadTextRow}>
                    <MaterialCommunityIcons name="camera-plus-outline" size={18} color="#D97706" />
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
                placeholder="e.g. School Transport Driver"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.readOnlyGroup}>
              <Text style={styles.formLabel}>Official Email</Text>
              <Text style={styles.readOnlyValue}>{email || 'Not Provided'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#171717" />
              ) : (
                <Text style={styles.saveBtnText}>Save Profile Updates</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionHeader}>Driver Details</Text>
            <View style={styles.infoCard}>
              {details.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.detailRow, index === details.length - 1 && styles.detailRowLast]}
                >
                  <View style={styles.detailIconWrap}>
                    <MaterialCommunityIcons name={item.icon as any} size={18} color="#D97706" />
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
          {onChangePassword ? (
            <TouchableOpacity style={styles.accountRow} onPress={onChangePassword} activeOpacity={0.7}>
              <MaterialCommunityIcons name="lock-reset" size={20} color="#F4C430" />
              <Text style={styles.accountText}>Change Password</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#6B6B6B" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          ) : null}
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
    backgroundColor: '#FFF4C7',
    borderWidth: 2.5,
    borderColor: '#F4C430',
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF4C7',
    borderWidth: 2.5,
    borderColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
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
  name: { fontSize: 20, fontFamily: FontFamily.extrabold, color: '#171717', textAlign: 'center' },
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
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
    marginTop: 12,
  },
  institutionText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#B45309' },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 5,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  editToggleText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
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
  readOnlyValue: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: '#6B6B6B',
  },
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
  uploadThumb: {
    width: 50,
    height: 50,
    borderRadius: 5,
    backgroundColor: '#FFF4C7',
  },
  uploadThumbFallback: {
    width: 50,
    height: 50,
    borderRadius: 5,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadThumbInitials: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
  },
  uploadTextWrap: { flex: 1, gap: 2 },
  uploadTextRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  uploadText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  saveBtn: {
    backgroundColor: '#F4C430',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 13, fontFamily: FontFamily.bold, color: '#171717' },
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
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEF08A',
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
