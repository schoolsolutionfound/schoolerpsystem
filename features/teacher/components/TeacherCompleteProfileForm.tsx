import React from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

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
            <MaterialCommunityIcons name="lock-outline" size={18} color="#A0AEC0" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.readOnlyWrapper}>
            <Text style={styles.readOnlyText}>{email}</Text>
            <MaterialCommunityIcons name="lock-outline" size={18} color="#A0AEC0" />
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Employment Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Employee ID</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="card-account-details-outline" size={18} color="#7E57C2" style={styles.iconPrefix} />
            <TextInput
              style={styles.input}
              placeholder="e.g. EMP-001"
              placeholderTextColor="#A0AEC0"
              value={employeeId}
              onChangeText={setEmployeeId}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Department</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="school-outline" size={18} color="#7E57C2" style={styles.iconPrefix} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Computer Science"
              placeholderTextColor="#A0AEC0"
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
            <MaterialCommunityIcons name="phone-outline" size={18} color="#7E57C2" style={styles.iconPrefix} />
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#A0AEC0"
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
                <MaterialCommunityIcons name="camera-plus-outline" size={28} color="#7E57C2" />
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
    borderColor: '#E2E8F0',
    gap: 12,
  },
  sectionHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#1A202C', marginBottom: 2 },
  inputGroup: { gap: 4 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#4A5568' },
  readOnlyWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FB',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
  },
  readOnlyText: { fontSize: 13, color: '#718096', fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
  },
  iconPrefix: { marginRight: 8 },
  input: { flex: 1, fontSize: 13, color: '#1A202C' },
  photoUploadBox: {
    height: 90,
    backgroundColor: '#F8F9FB',
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  uploadText: { fontSize: 12, color: '#7E57C2', fontWeight: '600' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  saveBtn: {
    backgroundColor: '#7E57C2',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
