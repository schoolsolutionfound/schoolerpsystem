import React from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

interface DriverCompleteProfileFormProps {
  fullName: string;
  email: string;
  phone: string;
  setPhone: (val: string) => void;
  vehicleNumber: string;
  setVehicleNumber: (val: string) => void;
  licenseNumber: string;
  setLicenseNumber: (val: string) => void;
  profilePicUri: string | null;
  onPickImage: () => void;
  loading: boolean;
  onSubmit: () => void;
}

export const DriverCompleteProfileForm: React.FC<DriverCompleteProfileFormProps> = ({
  fullName,
  email,
  phone,
  setPhone,
  vehicleNumber,
  setVehicleNumber,
  licenseNumber,
  setLicenseNumber,
  profilePicUri,
  onPickImage,
  loading,
  onSubmit,
}) => {
  return (
    <View style={styles.formWrap}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Personal Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Name</Text>
          <View style={styles.readOnlyWrapper}>
            <Text style={styles.readOnlyText}>{fullName}</Text>
            <MaterialCommunityIcons name="lock-outline" size={18} color="#6B6B6B" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.readOnlyWrapper}>
            <Text style={styles.readOnlyText}>{email}</Text>
            <MaterialCommunityIcons name="lock-outline" size={18} color="#6B6B6B" />
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Vehicle Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Vehicle Number</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="bus" size={18} color="#0EA5E9" style={styles.iconPrefix} />
            <TextInput
              style={styles.input}
              placeholder="e.g. KA01AB1234"
              placeholderTextColor="#6B6B6B"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>License Number</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="card-account-details-outline" size={18} color="#0EA5E9" style={styles.iconPrefix} />
            <TextInput
              style={styles.input}
              placeholder="e.g. KA-2023-0012345"
              placeholderTextColor="#6B6B6B"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              autoCapitalize="characters"
            />
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Contact & Profile</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="phone-outline" size={18} color="#0EA5E9" style={styles.iconPrefix} />
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#6B6B6B"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Profile Picture</Text>
          <TouchableOpacity style={styles.photoUploadBox} onPress={onPickImage}>
            {profilePicUri ? (
              <Image source={{ uri: profilePicUri }} style={styles.previewImage} />
            ) : (
              <>
                <MaterialCommunityIcons name="camera-plus-outline" size={28} color="#0EA5E9" />
                <Text style={styles.uploadText}>Upload Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.saveBtnText}>Complete Setup</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  formWrap: { gap: 16 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
  },
  sectionHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#171717', marginBottom: 2 },
  inputGroup: { gap: 4 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },
  readOnlyWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF7',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    height: 44,
  },
  readOnlyText: { fontSize: 13, color: '#6B6B6B', fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    height: 44,
  },
  iconPrefix: { marginRight: 8 },
  input: { flex: 1, fontSize: 13, color: '#171717' },
  photoUploadBox: {
    height: 90,
    backgroundColor: '#FFFDF7',
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    borderColor: '#BFEBFA',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  uploadText: { fontSize: 12, color: '#0EA5E9', fontWeight: '600' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  saveBtn: {
    backgroundColor: '#0EA5E9',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
