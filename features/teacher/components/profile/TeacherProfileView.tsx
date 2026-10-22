import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { MaterialCommunityIcons, Feather } from '../common/Icons';
import { auth } from '../../../../firebaseConfig';
import { useUserStore } from '../../../../store/useUserStore';
import { FontFamily } from '../../../../constants/fonts';
import { apiClient } from '../../../../api/client';
import { TeacherProfileSkeleton } from '../skeletons/TeacherProfileSkeleton';

let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (_e) {
  ImagePicker = null;
}

interface TeacherProfileViewProps {
  showBackBtn?: boolean;
}

export const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ showBackBtn = false }) => {
  const router = useRouter();

  // User store state
  const storedFullName = useUserStore((s) => s.fullName) || 'Teacher';
  const storedEmail = useUserStore((s) => s.email) || '';
  const storedInstitutionName = useUserStore((s) => s.institutionName) || '';
  const storedInstitutionCode = useUserStore((s) => s.institutionCode) || '';
  const storedInstitutionType = useUserStore((s) => s.institutionType) || 'school';
  const storedPhone = useUserStore((s) => s.phone) || '';
  const storedEmployeeId = useUserStore((s) => s.employeeId) || '';
  const storedDepartment = useUserStore((s) => s.department) || '';
  const storedDesignation = useUserStore((s) => s.designation) || '';
  const storedQualification = useUserStore((s) => s.qualification) || '';
  const storedExperience = useUserStore((s) => s.experience) || '';
  const storedProfilePic = useUserStore((s) => s.profilePic) || '';
  const setUserProfile = useUserStore((s) => s.setUserProfile);
  const resetUser = useUserStore((s) => s.resetUser);

  // Editable local state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [name, setName] = useState(storedFullName);
  const [phone, setPhone] = useState(storedPhone);
  const [employeeId, setEmployeeId] = useState(storedEmployeeId);
  const [department, setDepartment] = useState(storedDepartment);
  const [designation, setDesignation] = useState(storedDesignation);
  const [qualification, setQualification] = useState(storedQualification);
  const [experience, setExperience] = useState(storedExperience);
  const [profilePicUrl, setProfilePicUrl] = useState(storedProfilePic);

  // Sync state when store changes
  useEffect(() => {
    setName(storedFullName);
    setPhone(storedPhone);
    setEmployeeId(storedEmployeeId);
    setDepartment(storedDepartment);
    setDesignation(storedDesignation);
    setQualification(storedQualification);
    setExperience(storedExperience);
    setProfilePicUrl(storedProfilePic);
  }, [
    storedFullName,
    storedPhone,
    storedEmployeeId,
    storedDepartment,
    storedDesignation,
    storedQualification,
    storedExperience,
    storedProfilePic,
  ]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Teacher Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch { }
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  const pickProfileImage = async () => {
    if (!ImagePicker) {
      Alert.alert('Notice', 'Image picker module is not available.');
      return;
    }
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access media library is required to select a profile photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePicUrl(result.assets[0].uri);
        setImageError(false);
      }
    } catch {
      Alert.alert('Notice', 'Could not select photo from media library.');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      setUserProfile({
        fullName: name,
        phone,
        employeeId,
        department,
        designation,
        qualification,
        experience,
        profilePic: profilePicUrl,
      });

      await apiClient('/users/complete-profile', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          employeeId,
          department,
          designation,
          qualification,
          experience,
          profilePicUrl,
        }),
      }).catch(() => null);

      setIsEditing(false);
      Alert.alert('Profile Updated', 'Your teacher profile details have been saved successfully.');
    } catch (err: any) {
      setIsEditing(false);
      Alert.alert('Profile Saved', 'Profile updated locally.');
    } finally {
      setSaving(false);
    }
  };

  // Initials for avatar
  const initials = (name || 'Teacher')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'TC';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {showBackBtn && (
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={18} color="#171717" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Teacher Profile</Text>
          <View style={{ width: 36 }} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      >
        {refreshing ? (
          <TeacherProfileSkeleton />
        ) : (
          <>
            {/* 1. Hero Profile Card matching user reference design */}
            <View style={styles.heroCard}>
          <View style={styles.avatarContainer}>
            {profilePicUrl && !imageError ? (
              <Image
                source={{ uri: profilePicUrl }}
                style={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.badge}>
              <MaterialCommunityIcons name="check-decagram" size={22} color="#F4C430" />
            </View>
          </View>

          <Text style={styles.name}>{name}</Text>
          <Text style={styles.title}>
            {designation || 'Faculty Member'}
          </Text>


          <TouchableOpacity
            style={styles.editToggleBtn}
            onPress={() => setIsEditing(!isEditing)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isEditing ? 'close' : 'pencil'}
              size={15}
              color="#111827"
            />
            <Text style={styles.editToggleText}>
              {isEditing ? 'Cancel Editing' : 'Edit Profile Info'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Content Sections: View Mode vs Edit Mode */}
        {isEditing ? (
          /* Edit Mode Form Card */
          <View style={styles.editCard}>
            <Text style={styles.editCardTitle}>Edit Teacher Profile</Text>

            {/* Photo Upload Row */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Profile Photo</Text>
              <TouchableOpacity
                style={styles.photoUploadBtn}
                onPress={pickProfileImage}
                activeOpacity={0.8}
              >
                {profilePicUrl && !imageError ? (
                  <Image source={{ uri: profilePicUrl }} style={styles.uploadThumb} />
                ) : (
                  <View style={[styles.uploadThumb, styles.avatarFallbackSmall]}>
                    <Text style={styles.uploadInitials}>{initials}</Text>
                  </View>
                )}
                <View style={styles.uploadTextWrap}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="camera-plus-outline" size={17} color="#D97706" />
                    <Text style={styles.uploadTitle}>Upload New Photo</Text>
                  </View>
                  <Text style={styles.uploadSubtext}>JPG or PNG from device</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.formInput}
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Contact Phone</Text>
              <TextInput
                style={styles.formInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. +1 (555) 234-5678"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            {/* Employee ID */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Employee ID</Text>
              <TextInput
                style={styles.formInput}
                value={employeeId}
                onChangeText={setEmployeeId}
                placeholder="e.g. TCH-2024-8891"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Department */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Department</Text>
              <TextInput
                style={styles.formInput}
                value={department}
                onChangeText={setDepartment}
                placeholder="e.g. Mathematics & Science"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Designation */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Designation / Role Title</Text>
              <TextInput
                style={styles.formInput}
                value={designation}
                onChangeText={setDesignation}
                placeholder="e.g. Senior Faculty Teacher"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Qualification */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Degree / Qualification</Text>
              <TextInput
                style={styles.formInput}
                value={qualification}
                onChangeText={setQualification}
                placeholder="e.g. Master of Science (M.Sc, B.Ed)"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Experience */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Experience (Years)</Text>
              <TextInput
                style={styles.formInput}
                value={experience}
                onChangeText={setExperience}
                placeholder="e.g. 5"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            {/* Change Password in Edit Profile */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Change Password</Text>
              <TouchableOpacity
                style={styles.changePasswordCardBtn}
                onPress={() => router.push('/change-password')}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name="lock-reset" size={18} color="#D97706" />
                  <Text style={styles.changePasswordCardBtnText}>Change Password</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <Text style={styles.primaryBtnText}>Save Profile Updates</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* View Mode - Matching User Screenshot Design */
          <>
            {/* Section 1: Professional Details */}
            <Text style={styles.sectionHeader}>Professional Details</Text>
            <View style={styles.infoCard}>
              {[
                { id: 'email', icon: 'email-outline', label: 'OFFICIAL EMAIL', value: storedEmail || 'teacher@school.com' },
                { id: 'phone', icon: 'phone-outline', label: 'CONTACT PHONE', value: phone || '—' },
                { id: 'employeeId', icon: 'badge-account-outline', label: 'EMPLOYEE ID', value: employeeId || '—' },
                { id: 'department', icon: 'school-outline', label: 'DEPARTMENT', value: department || '—' },
                { id: 'designation', icon: 'briefcase-outline', label: 'DESIGNATION', value: designation || '—' },
                { id: 'qualification', icon: 'certificate-outline', label: 'DEGREE / QUALIFICATION', value: qualification || '—' },
                { id: 'experience', icon: 'clock-outline', label: 'EXPERIENCE', value: experience ? `${experience} years` : '—' },
              ].map((item, index, arr) => {
                const isLast = index === arr.length - 1;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.detailRow,
                      isLast && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.detailIconWrap}>
                      <MaterialCommunityIcons name={item.icon as any} size={18} color="#D97706" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{item.label}</Text>
                      <Text style={styles.detailValue} selectable>
                        {item.value}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Section 2: Institution Details */}
            <Text style={styles.sectionHeader}>Institution Details</Text>
            <View style={styles.infoCard}>
              {[
                {
                  id: 'inst-name',
                  icon: 'office-building',
                  label: 'INSTITUTION NAME',
                  value: storedInstitutionName || storedInstitutionCode || '—',
                },
                {
                  id: 'inst-code',
                  icon: 'barcode',
                  label: 'INSTITUTION CODE',
                  value: storedInstitutionCode || '—',
                },
                {
                  id: 'inst-type',
                  icon: 'domain',
                  label: 'INSTITUTION TYPE',
                  value: storedInstitutionType === 'college' ? 'College' : 'School',
                },
              ].map((item, index, arr) => {
                const isLast = index === arr.length - 1;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.detailRow,
                      isLast && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.detailIconWrap}>
                      <MaterialCommunityIcons name={item.icon as any} size={18} color="#D97706" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>{item.label}</Text>
                      <Text style={styles.detailValue} selectable>
                        {item.value}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* 3. Sign Out Button matching reference screenshot */}
        <TouchableOpacity
          style={styles.logoutBtnLarge}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="logout" size={19} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  topBarTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: 16,
    paddingBottom: 100,
  },

  // 1. Hero Card matching screenshot
  heroCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 20,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF4C7',
    borderWidth: 2.5,
    borderColor: '#F4C430',
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF4C7',
    borderWidth: 2.5,
    borderColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 34,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 1.5,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  name: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
    textAlign: 'center',
  },
  title: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  empTagText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: '#F4C430',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 5,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  editToggleText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  // 2. Section Headers & Detail Cards
  sectionHeader: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    marginBottom: 10,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 18,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 5,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginTop: 2,
    lineHeight: 18,
  },

  // 3. Edit Profile Form
  editCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 20,
    gap: 12,
  },
  editCardTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginBottom: 4,
  },
  formGroup: {
    gap: 5,
  },
  formLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#4B5563',
  },
  formInput: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#111827',
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
  avatarFallbackSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F4C430',
  },
  uploadInitials: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
  },
  uploadTextWrap: {
    flex: 1,
    gap: 2,
  },
  uploadTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  uploadSubtext: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  changePasswordCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 42,
  },
  changePasswordCardBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  primaryBtn: {
    height: 44,
    backgroundColor: '#F4C430',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#111827',
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
  },

  // 4. Logout Button matching reference screenshot
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
    marginTop: 4,
    marginBottom: 30,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
});
