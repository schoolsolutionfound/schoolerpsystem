import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { useUserStore } from '../../../store/useUserStore';
import { useRouter } from 'expo-router';
import { uploadProfilePictureApi } from '../../../api/upload';
import { completeProfileApi } from '../../../api/users';

export function AdmissionProfileView() {
  const fullName = useUserStore((state) => state.fullName);
  const email = useUserStore((state) => state.email);
  const phone = useUserStore((state) => state.phone);
  const userRole = useUserStore((state) => state.userRole);
  const profilePic = useUserStore((state) => state.profilePic);
  const institutionName = useUserStore((state) => state.institutionName);
  const institutionCode = useUserStore((state) => state.institutionCode);
  const resetUser = useUserStore((state) => state.resetUser);
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const router = useRouter();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const handlePickPhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Denied', 'Permission to access photos is required.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const uri = result.assets[0].uri;
      setUploadingPhoto(true);

      const url = await uploadProfilePictureApi(uri);
      setUserProfile({ profilePic: url });

      try {
        await completeProfileApi({ profilePicUrl: url });
      } catch (err) {
        console.warn('Failed to sync profile pic to backend:', err);
      }

      if (Platform.OS === 'web') {
        window.alert('Profile photo updated successfully!');
      } else {
        Alert.alert('Success', 'Profile photo updated successfully!');
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Failed to upload photo');
      } else {
        Alert.alert('Error', err.message || 'Failed to upload photo');
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleOpenEditModal = () => {
    setEditName(fullName || '');
    setEditPhone(phone || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Full name is required.');
      } else {
        Alert.alert('Required', 'Full name is required.');
      }
      return;
    }

    try {
      setSavingProfile(true);
      await completeProfileApi({
        phone: editPhone.trim(),
      });

      setUserProfile({
        fullName: editName.trim(),
        phone: editPhone.trim(),
      });

      setEditModalVisible(false);

      if (Platform.OS === 'web') {
        window.alert('Profile details updated successfully!');
      } else {
        Alert.alert('Success', 'Profile details updated successfully!');
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Failed to save profile changes');
      } else {
        Alert.alert('Error', err.message || 'Failed to save profile changes');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) {
        (async () => {
          try {
            await signOut(auth);
          } catch {}
          resetUser();
          router.replace('/auth');
        })();
      }
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch {}
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  const roleTitle = 'Admission Officer';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section — Matching Placement Profile Theme */}
        <View style={styles.heroSection}>
          <View style={styles.heroRow}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                style={styles.avatarWrap}
                onPress={handlePickPhoto}
                activeOpacity={0.8}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <View style={styles.avatarPlaceholder}>
                    <ActivityIndicator size="small" color="#1A1B1C" />
                  </View>
                ) : profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialCommunityIcons name="account-school" size={36} color="#1A1B1C" />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cameraOverlay}
                onPress={handlePickPhoto}
                activeOpacity={0.8}
                disabled={uploadingPhoto}
              >
                <MaterialCommunityIcons name="camera" size={14} color="#171717" />
              </TouchableOpacity>
            </View>

            <View style={styles.heroMain}>
              <Text style={styles.heroHandle} numberOfLines={1}>{fullName || 'Admission Officer'}</Text>
              <Text style={styles.heroEmail} numberOfLines={1}>{email || '—'}</Text>
              <Text style={styles.heroRoleText}>{roleTitle}</Text>
            </View>
          </View>

          {/* Quick stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statNum}>ADM</Text>
              <Text style={styles.statLabel}>Role</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statNum} numberOfLines={1}>{institutionCode || 'Campus'}</Text>
              <Text style={styles.statLabel}>Inst Code</Text>
            </View>
          </View>
        </View>

        {/* Professional Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Professional Details</Text>
            <TouchableOpacity style={styles.headerActionBtn} onPress={handleOpenEditModal} activeOpacity={0.7}>
              <Text style={styles.headerActionBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{fullName || '—'}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.infoLabel}>Designation</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{roleTitle}</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{email || '—'}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{phone || '—'}</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={[styles.gridCell, styles.gridFull]}>
              <Text style={styles.infoLabel}>Institution</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {institutionName || institutionCode || '—'}
              </Text>
            </View>
          </View>
          <View style={[styles.gridRow, { borderBottomWidth: 0 }]}>
            <View style={styles.gridCell}>
              <Text style={styles.infoLabel}>Institution Code</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{institutionCode || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleOpenEditModal} activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <MaterialCommunityIcons name="account-edit-outline" size={20} color="#F4C430" />
            </View>
            <Text style={styles.menuText}>Edit Profile Information</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#B5B5B5" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/change-password')} activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <MaterialCommunityIcons name="lock-reset" size={20} color="#F4C430" />
            </View>
            <Text style={styles.menuText}>Change Password</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#B5B5B5" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')} activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <MaterialCommunityIcons name="bell-outline" size={20} color="#F4C430" />
            </View>
            <Text style={styles.menuText}>Notifications</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#B5B5B5" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout} activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <MaterialCommunityIcons name="logout" size={20} color="#DC3545" />
            </View>
            <Text style={[styles.menuText, { color: '#DC3545' }]}>Logout</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#B5B5B5" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Information</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={20} color="#171717" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Full name"
                placeholderTextColor="#9A9A9A"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor="#9A9A9A"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={savingProfile}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#1A1B1C" />
                ) : (
                  <Text style={styles.submitText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingBottom: 40 },

  // Hero Section — Crisp White Theme with High Contrast & Legibility
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: { position: 'relative', width: 72, height: 72 },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E5DC',
  },
  heroMain: { flex: 1, minWidth: 0 },
  heroHandle: { fontSize: 19, fontWeight: '800', color: '#171717', flexShrink: 1 },
  heroEmail: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  heroRoleText: { fontSize: 12, fontWeight: '700', color: '#6B6B6B', marginTop: 4 },

  // Stats row inside hero
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 5,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  statNum: { fontSize: 13, fontWeight: '800', color: '#171717' },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8A8A',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: { width: 1, backgroundColor: '#E8E5DC', marginVertical: 4 },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    marginHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1A1B1C', letterSpacing: 0.3 },
  headerActionBtn: {
    marginLeft: 'auto',
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  headerActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1B1C',
    textDecorationLine: 'underline',
  },

  // Grid rows (2-column layout)
  gridRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  gridCell: { flex: 1, paddingRight: 8 },
  gridFull: { flex: 1, paddingRight: 0 },
  infoLabel: {
    fontSize: 10,
    color: '#8A8A8A',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#1A1B1C' },
  divider: { height: 1, backgroundColor: '#E8E5DC', marginBottom: 4 },

  // Menu Items inside Account Card
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  menuIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1B1C',
  },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 18,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1B1C',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1A1B1C',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  submitBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1B1C',
  },
});
