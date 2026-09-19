import React from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface CompleteProfileFormProps {
  firstName: string;
  lastName: string;
  email: string;
  rollNoOrUSN: string;
  institutionType: string;
  phone: string;
  setPhone: (val: string) => void;
  parentPhone: string;
  setParentPhone: (val: string) => void;
  tenthPercentage: string;
  setTenthPercentage: (val: string) => void;
  twelfthPercentage: string;
  setTwelfthPercentage: (val: string) => void;
  profilePicUri: string | null;
  onPickImage: () => void;
  loading: boolean;
  onSubmit: () => void;
}

export const CompleteProfileForm: React.FC<CompleteProfileFormProps> = ({
  firstName,
  lastName,
  email,
  rollNoOrUSN,
  institutionType,
  phone,
  setPhone,
  parentPhone,
  setParentPhone,
  tenthPercentage,
  setTenthPercentage,
  twelfthPercentage,
  setTwelfthPercentage,
  profilePicUri,
  onPickImage,
  loading,
  onSubmit,
}) => {
  return (
    <View style={styles.formWrap}>
      {/* Section 1: Personal Information (Locked) */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Personal Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>First Name</Text>
          <View style={styles.readOnlyWrapper}>
            <Text style={styles.readOnlyText}>{firstName}</Text>
            <MaterialCommunityIcons name="lock-outline" size={18} color="#6B6B6B" />
          </View>
          <Text style={styles.helperText}>Imported from college records</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <View style={styles.readOnlyWrapper}>
            <Text style={styles.readOnlyText}>{lastName}</Text>
            <MaterialCommunityIcons name="lock-outline" size={18} color="#6B6B6B" />
          </View>
          <Text style={styles.helperText}>Imported from college records</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.readOnlyWrapper}>
            <Text style={styles.readOnlyText}>{email}</Text>
            <MaterialCommunityIcons name="lock-outline" size={18} color="#6B6B6B" />
          </View>
          <Text style={styles.helperText}>Imported from college records</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>USN / Roll No.</Text>
          <View style={styles.readOnlyWrapper}>
            <Text style={styles.readOnlyText}>{rollNoOrUSN}</Text>
            <MaterialCommunityIcons name="lock-outline" size={18} color="#6B6B6B" />
          </View>
          <Text style={styles.helperText}>Imported from college records</Text>
        </View>
      </View>

      {/* Section 2: Additional Information */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeaderTitle}>Additional Information</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Student Phone Number</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="phone-outline" size={18} color="#F4C430" style={styles.iconPrefix} />
            <TextInput
              style={styles.input}
              placeholder="Enter phone"
              placeholderTextColor="#6B6B6B"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Parent / Guardian Phone Number *</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="phone-outline" size={18} color="#F4C430" style={styles.iconPrefix} />
            <TextInput
              style={styles.input}
              placeholder="Enter parent's phone"
              placeholderTextColor="#6B6B6B"
              keyboardType="phone-pad"
              value={parentPhone}
              onChangeText={setParentPhone}
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
                <MaterialCommunityIcons name="camera-plus-outline" size={28} color="#F4C430" />
                <Text style={styles.uploadText}>Upload Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {institutionType === 'college' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>10th Percentage (%)</Text>
              <TextInput
                style={styles.singleInput}
                placeholder="e.g. 85.5"
                placeholderTextColor="#6B6B6B"
                keyboardType="numeric"
                value={tenthPercentage}
                onChangeText={setTenthPercentage}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>12th / Diploma Percentage (%)</Text>
              <TextInput
                style={styles.singleInput}
                placeholder="e.g. 88.0"
                placeholderTextColor="#6B6B6B"
                keyboardType="numeric"
                value={twelfthPercentage}
                onChangeText={setTwelfthPercentage}
              />
            </View>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.saveBtnText}>Save Profile & Continue</Text>
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
  sectionHeaderTitle: { fontSize: 14, fontWeight: '700', fontFamily: FontFamily.bold, color: '#171717', marginBottom: 2 },
  inputGroup: { gap: 4 },
  inputLabel: { fontSize: 12, fontWeight: '600', fontFamily: FontFamily.semibold, color: '#6B6B6B' },
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
  readOnlyText: { fontSize: 13, color: '#6B6B6B', fontWeight: '500', fontFamily: FontFamily.medium },
  helperText: { fontSize: 11, color: '#6B6B6B' },
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
  singleInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: '#171717',
  },
  photoUploadBox: {
    height: 90,
    backgroundColor: '#FFFDF7',
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    borderColor: '#FFF4C7',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  uploadText: { fontSize: 12, color: '#F4C430', fontWeight: '600', fontFamily: FontFamily.semibold },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  saveBtn: {
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontFamily: FontFamily.bold },
});
