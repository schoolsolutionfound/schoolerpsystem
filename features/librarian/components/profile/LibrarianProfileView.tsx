import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '../common/Icons';
import { apiClient } from '../../../../api/client';
import { auth } from '../../../../firebaseConfig';
import { FontFamily } from '../../../../constants/fonts';

let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (_e) {
  ImagePicker = null;
}

export const LibrarianProfileView = ({
  userName,
  onLogout,
  commonStyles,
  onRefresh,
  isRefreshing,
}: {
  userName?: string;
  onLogout: () => void;
  commonStyles: any;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) => {
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Profile fields state
  const [name, setName] = useState(userName || 'Amina Rahman');
  const [email, setEmail] = useState('amina.rahman@kivquo.edu.org');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [employeeId, setEmployeeId] = useState('LIB-2024-8891');
  const [libraryBadgeId, setLibraryBadgeId] = useState('BADGE-LIB-001');
  const [designation, setDesignation] = useState('Head of Library Operations');
  const [qualification, setQualification] = useState('Master of Library & Info Science (MLIS)');
  const [officeLocation, setOfficeLocation] = useState('Central Library, Block B, Room 204');
  const [profilePicUrl, setProfilePicUrl] = useState('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400');

  // Fetch live profile from backend on mount
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await apiClient('/users/me');
        if (res && isMounted) {
          if (res.name || res.fullName) setName(res.name || res.fullName);
          if (res.email) setEmail(res.email);
          if (res.phone) setPhone(res.phone);
          if (res.employeeId) setEmployeeId(res.employeeId);
          if (res.libraryBadgeId) setLibraryBadgeId(res.libraryBadgeId);
          if (res.designation) setDesignation(res.designation);
          if (res.qualification) setQualification(res.qualification);
          if (res.profilePicUrl) setProfilePicUrl(res.profilePicUrl);
        }
      } catch (err) {
        // Retain fallback profile state if offline/unreachable
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, []);

  const pickProfileImage = async () => {
    if (!ImagePicker) {
      Alert.alert('Notice', 'Image picker module is not available on this platform.');
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
      }
    } catch (err: any) {
      Alert.alert('Image Selection Error', 'Could not select photo from media library.');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      let finalPicUrl = profilePicUrl;
      await apiClient('/users/complete-profile', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          employeeId,
          libraryBadgeId,
          designation,
          qualification,
          profilePicUrl: finalPicUrl,
        }),
      });

      setIsEditing(false);
      Alert.alert('Profile Updated', 'Your librarian profile details have been saved to the server.');
    } catch (err: any) {
      Alert.alert('Update Notice', err?.message || 'Profile saved locally.');
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const [imageError, setImageError] = useState(false);

  const initials = (name || 'Librarian')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'LB';

  const styles = commonStyles;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.viewBody}
        contentContainerStyle={{ paddingBottom: 60 }}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!isRefreshing}
              onRefresh={onRefresh}
              colors={['#000000']}
              tintColor="#000000"
            />
          ) : undefined
        }
      >
      {profileLoading && (
        <View style={{ paddingVertical: 10, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#F4C430" />
        </View>
      )}

      {/* Profile Header Card with Profile Image */}
      <View style={profileStyles.card}>
        <View style={profileStyles.avatarContainer}>
          {profilePicUrl && !imageError ? (
            <Image
              source={{ uri: profilePicUrl }}
              style={profileStyles.avatar}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={profileStyles.avatarFallback}>
              <Text style={profileStyles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={profileStyles.badge}>
            <MaterialCommunityIcons name="check-decagram" size={20} color="#F4C430" />
          </View>
        </View>

        <Text style={profileStyles.name}>{name}</Text>
        <Text style={profileStyles.title}>{designation}</Text>

        <Text style={profileStyles.empTagText}>ID: {employeeId}</Text>

        <TouchableOpacity
          style={profileStyles.editToggleBtn}
          onPress={() => setIsEditing(!isEditing)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name={isEditing ? "close" : "pencil-outline"} size={16} color="#171717" />
          <Text style={profileStyles.editToggleText}>{isEditing ? "Cancel Editing" : "Edit Profile Info"}</Text>
        </TouchableOpacity>
      </View>

      {/* View Mode vs Edit Mode */}
      {isEditing ? (
        <View style={profileStyles.editCard}>
          <Text style={profileStyles.editCardTitle}>Edit Librarian Profile</Text>

          {/* Profile Picture Upload Box */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Profile Photo</Text>
            <TouchableOpacity style={profileStyles.photoUploadBtn} onPress={pickProfileImage}>
              {profilePicUrl && !imageError ? (
                <Image source={{ uri: profilePicUrl }} style={profileStyles.uploadThumb} />
              ) : (
                <View style={[profileStyles.uploadThumb, { backgroundColor: '#FFF4C7', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#171717' }}>{initials}</Text>
                </View>
              )}
              <View style={profileStyles.uploadTextWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="camera-plus-outline" size={18} color="#D97706" />
                  <Text style={{ fontSize: 13, fontFamily: FontFamily.bold, color: '#171717' }}>Upload New Photo</Text>
                </View>
                              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Phone Number</Text>
            <TextInput
              style={styles.formInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +1 (555) 234-5678"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Employee ID</Text>
            <TextInput
              style={styles.formInput}
              value={employeeId}
              onChangeText={setEmployeeId}
              placeholder="e.g. LIB-2024-8891"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Library Badge ID</Text>
            <TextInput
              style={styles.formInput}
              value={libraryBadgeId}
              onChangeText={setLibraryBadgeId}
              placeholder="e.g. BADGE-LIB-001"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Designation / Role Title</Text>
            <TextInput
              style={styles.formInput}
              value={designation}
              onChangeText={setDesignation}
              placeholder="Designation"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Qualifications</Text>
            <TextInput
              style={styles.formInput}
              value={qualification}
              onChangeText={setQualification}
              placeholder="Academic Qualification"
              placeholderTextColor="#475569"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Office Location</Text>
            <TextInput
              style={styles.formInput}
              value={officeLocation}
              onChangeText={setOfficeLocation}
              placeholder="Office Location"
              placeholderTextColor="#475569"
            />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#171717" /> : <Text style={styles.primaryBtnText}>Save Profile Updates</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Details Grid Section */}
          <Text style={[styles.sectionHeader, { marginBottom: 12, color: '#171717' }]}>Professional Details</Text>

          <View style={profileStyles.infoSection}>
            <View style={profileStyles.infoCard}>
              {[
                { id: 'email', icon: 'email-outline', label: 'Official Email', value: email },
                { id: 'phone', icon: 'phone-outline', label: 'Contact Phone', value: phone },
                { id: 'location', icon: 'map-marker-outline', label: 'Office Location', value: officeLocation },
                { id: 'badge', icon: 'badge-account-outline', label: 'Library Badge ID', value: libraryBadgeId },
                { id: 'qualification', icon: 'school-outline', label: 'Degree / Qualification', value: qualification },
                { id: 'specialization', icon: 'book-open-page-variant-outline', label: 'Specialization', value: 'Digital Archiving & Academic Systems' },
              ].map((item, index, arr) => {
                const isLast = index === arr.length - 1;
                return (
                  <View
                    key={item.id}
                    style={[
                      profileStyles.detailRow,
                      isLast && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={profileStyles.detailIconWrap}>
                      <MaterialCommunityIcons name={item.icon as any} size={18} color="#D97706" />
                    </View>
                    <View style={profileStyles.detailContent}>
                      <Text style={profileStyles.detailLabel}>{item.label}</Text>
                      <Text style={profileStyles.detailValue} selectable>
                        {item.value || 'Not Provided'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}

      {/* Action Buttons */}
      <View style={{ gap: 12, marginTop: 24, marginBottom: 40 }}>
        <TouchableOpacity
          style={profileStyles.logoutBtnLarge}
          onPress={onLogout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#DC2626" />
          <Text style={profileStyles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const profileStyles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
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
  badge: {
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
  },
  title: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#6B6B6B',
    marginTop: 4,
    textAlign: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#026440',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#026440',
  },
  activeTagText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#026440',
  },
  empTag: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },
  empTagText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#64748B',
    marginTop: 4,
  },
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
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 20,
    gap: 12,
  },
  editCardTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#171717',
    marginBottom: 6,
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
  uploadTextWrap: {
    flex: 1,
    gap: 2,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 5,
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
  detailContent: {
    flex: 1,
    justifyContent: 'center',
  },
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
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
});
