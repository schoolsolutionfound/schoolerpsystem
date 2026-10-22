import React from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from './common/Icons';
import { FontFamily } from '../../../constants/fonts';

interface TeacherCompleteProfileFormProps {
  fullName: string;
  email: string;
  phone: string;
  setPhone: (val: string) => void;
  employeeId: string;
  setEmployeeId: (val: string) => void;
  department: string;
  setDepartment: (val: string) => void;
  profilePicUri: string | null;
  onPickImage: () => void;
  loading: boolean;
  onSubmit: () => void;
}

export const TeacherCompleteProfileForm: React.FC<TeacherCompleteProfileFormProps> = ({
  fullName,
  email,
  phone,
  setPhone,
  employeeId,
  setEmployeeId,
  department,
  setDepartment,
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
            <MaterialCommunityIcons name="lock-outline" size={16} color="#9CA3AF" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.readOnlyWrapper}>
            <Text style={styles.readOnlyText}>{email}</Text>
            <MaterialCommunityIcons name="lock-outline" size={16} color="#9CA3AF" />
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Employment Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Employee ID</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="card-account-details-outline" size={18} color="#B45309" style={styles.iconPrefix} />
            <TextInput
              style={styles.input}
              placeholder="e.g. EMP-001"
              placeholderTextColor="#9CA3AF"
              value={employeeId}
              onChangeText={setEmployeeId}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Department</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="school-outline" size={18} color="#B45309" style={styles.iconPrefix} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Mathematics"
              placeholderTextColor="#9CA3AF"
              value={department}
              onChangeText={setDepartment}
            />
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Contact & Profile</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="phone-outline" size={18} color="#B45309" style={styles.iconPrefix} />
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Profile Picture</Text>
          <TouchableOpacity style={styles.photoUploadBox} onPress={onPickImage} activeOpacity={0.8}>
            {profilePicUri ? (
              <Image source={{ uri: profilePicUri }} style={styles.previewImage} />
            ) : (
              <>
                <MaterialCommunityIcons name="camera-plus-outline" size={26} color="#D97706" />
                <Text style={styles.uploadText}>Upload Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={onSubmit} disabled={loading} activeOpacity={0.85}>
        {loading ? (
          <ActivityIndicator color="#171717" size="small" />
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
    borderRadius: 5,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginBottom: 2,
  },
  inputGroup: { gap: 5 },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#374151',
  },
  readOnlyWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 42,
  },
  readOnlyText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 42,
  },
  iconPrefix: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#111827',
  },
  photoUploadBox: {
    height: 90,
    backgroundColor: '#FFFDF7',
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  uploadText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#B45309',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  saveBtn: {
    backgroundColor: '#F4C430',
    borderRadius: 5,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  saveBtnText: {
    color: '#171717',
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
});
