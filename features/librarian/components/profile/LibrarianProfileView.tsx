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
} from 'react-native';
import { MaterialCommunityIcons } from '../common/Icons';
import { apiClient } from '../../../../api/client';
import { auth } from '../../../../firebaseConfig';

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
}: {
  userName?: string;
  onLogout: () => void;
  commonStyles: any;
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

  const styles = commonStyles;

  return (
    <ScrollView style={styles.viewBody} showsVerticalScrollIndicator={false}>
      {profileLoading && (
        <View style={{ paddingVertical: 10, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#EAB308" />
        </View>
      )}

      {/* Profile Header Card with Profile Image */}
      <View style={profileStyles.card}>
        <View style={profileStyles.avatarContainer}>
          <Image
            source={{ uri: profilePicUrl }}
            style={profileStyles.avatar}
          />
          <View style={profileStyles.badge}>
            <MaterialCommunityIcons name="check-decagram" size={20} color="#EAB308" />
          </View>
        </View>

        <Text style={profileStyles.name}>{name}</Text>
        <Text style={profileStyles.title}>{designation}</Text>

        <View style={profileStyles.tagRow}>
          <View style={profileStyles.activeTag}>
            <View style={profileStyles.activeDot} />
            <Text style={profileStyles.activeTagText}>Active Staff</Text>
          </View>
          <View style={profileStyles.empTag}>
            <Text style={profileStyles.empTagText}>ID: {employeeId}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={profileStyles.editToggleBtn}
          onPress={() => setIsEditing(!isEditing)}
        >
          <MaterialCommunityIcons name={isEditing ? "close" : "pencil-outline"} size={16} color="#111827" />
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
              <Image source={{ uri: profilePicUrl }} style={profileStyles.uploadThumb} />
              <View style={profileStyles.uploadTextWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="camera-plus-outline" size={18} color="#EAB308" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>Upload New Photo</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>Tap to select an image file from your device</Text>
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
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Employee ID</Text>
            <TextInput
              style={styles.formInput}
              value={employeeId}
              onChangeText={setEmployeeId}
              placeholder="e.g. LIB-2024-8891"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Library Badge ID</Text>
            <TextInput
              style={styles.formInput}
              value={libraryBadgeId}
              onChangeText={setLibraryBadgeId}
              placeholder="e.g. BADGE-LIB-001"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Designation / Role Title</Text>
            <TextInput
              style={styles.formInput}
              value={designation}
              onChangeText={setDesignation}
              placeholder="Designation"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Qualifications</Text>
            <TextInput
              style={styles.formInput}
              value={qualification}
              onChangeText={setQualification}
              placeholder="Academic Qualification"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Office Location</Text>
            <TextInput
              style={styles.formInput}
              value={officeLocation}
              onChangeText={setOfficeLocation}
              placeholder="Office Location"
            />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#121316" /> : <Text style={styles.primaryBtnText}>Save Profile Updates</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Details Grid Section */}
          <Text style={[styles.sectionHeader, { marginBottom: 12 }]}>Library Head Profile & Details</Text>

          <View style={profileStyles.infoSection}>
            {/* Contact Information */}
            <View style={profileStyles.infoCard}>
              <View style={profileStyles.infoCardHeader}>
                <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#EAB308" />
                <Text style={profileStyles.infoCardTitle}>Contact & Designation</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Official Email:</Text>
                <Text style={profileStyles.infoValue}>{email}</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Contact Phone:</Text>
                <Text style={profileStyles.infoValue}>{phone}</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Office Location:</Text>
                <Text style={profileStyles.infoValue}>{officeLocation}</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Library Badge ID:</Text>
                <Text style={profileStyles.infoValue}>{libraryBadgeId}</Text>
              </View>
            </View>

            {/* Qualifications */}
            <View style={profileStyles.infoCard}>
              <View style={profileStyles.infoCardHeader}>
                <MaterialCommunityIcons name="school-outline" size={20} color="#EAB308" />
                <Text style={profileStyles.infoCardTitle}>Qualifications & Credentials</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Degree / Credential:</Text>
                <Text style={profileStyles.infoValue}>{qualification}</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Specialization:</Text>
                <Text style={profileStyles.infoValue}>Digital Archiving & Academic Systems</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Certifications:</Text>
                <Text style={profileStyles.infoValue}>Certified Library Specialist (CSLMS)</Text>
              </View>
            </View>

            {/* Administrative Scope */}
            <View style={profileStyles.infoCard}>
              <View style={profileStyles.infoCardHeader}>
                <MaterialCommunityIcons name="shield-check-outline" size={20} color="#EAB308" />
                <Text style={profileStyles.infoCardTitle}>Administrative Scope</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>System Role:</Text>
                <Text style={profileStyles.infoValue}>Head Librarian / Administrator</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Catalog Managed:</Text>
                <Text style={profileStyles.infoValue}>12,460 Volumes & Serials</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Registered Members:</Text>
                <Text style={profileStyles.infoValue}>1,238 Active Members</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Action Buttons */}
      <View style={{ gap: 12, marginTop: 24, marginBottom: 40 }}>
        <TouchableOpacity style={styles.logoutBtnLarge} onPress={onLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const profileStyles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 20 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E5E7EB' },
  badge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 2 },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  title: { fontSize: 13, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  activeTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  activeTagText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  empTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  empTagText: { fontSize: 11, fontWeight: '700', color: '#4B5563' },
  editToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, backgroundColor: '#FEF08A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FDE047' },
  editToggleText: { fontSize: 12, fontWeight: '700', color: '#111827' },
  editCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 14, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 20, gap: 12 },
  editCardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 6 },
  photoUploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFDF7', borderWidth: 1.5, borderColor: '#FEF08A', borderStyle: 'dashed', borderRadius: 12, padding: 10 },
  uploadThumb: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E5E7EB' },
  uploadTextWrap: { flex: 1, gap: 2 },
  infoSection: { gap: 14 },
  infoCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#F3F4F6', gap: 10 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoCardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  infoLabel: { fontSize: 12, color: '#6B7280' },
  infoValue: { fontSize: 12, fontWeight: '700', color: '#111827' },
});
