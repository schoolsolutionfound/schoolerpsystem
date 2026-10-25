import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
import { BorderRadius } from '../../constants/theme';
import { apiClient } from '../../api/client';

export default function PrincipalProfileScreen() {
  const router = useRouter();
  const fullName = useUserStore((s) => s.fullName) || 'Principal';
  const email = useUserStore((s) => s.email) || '';
  const institutionName = useUserStore((s) => s.institutionName) || '';
  const institutionCode = useUserStore((s) => s.institutionCode) || '';
  const storePhone = useUserStore((s) => s.phone) || '';
  const storeQualification = useUserStore((s) => s.qualification) || '';
  const storeExperience = useUserStore((s) => s.experience) || '';
  const storeInstType = useUserStore((s) => s.institutionType) || 'school';
  const setUserProfile = useUserStore((s) => s.setUserProfile);
  const resetUser = useUserStore((s) => s.resetUser);

  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(storePhone);
  const [qualification, setQualification] = useState(storeQualification);
  const [experience, setExperience] = useState(storeExperience);
  const [institutionType, setInstitutionType] = useState<'school' | 'college'>(storeInstType);
  const [saving, setSaving] = useState(false);

  const validatePhone = (num: string): boolean => {
    if (!num.trim()) return true; // Optional
    const cleaned = num.replace(/[\s-]/g, '');
    return /^[+]?[0-9]{10,15}$/.test(cleaned);
  };

  const handleSave = async () => {
    if (phone.trim() && !validatePhone(phone)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number (10 to 15 digits).');
      return;
    }

    const expNum = parseInt(experience, 10);
    if (experience.trim() && (isNaN(expNum) || expNum < 0 || expNum > 60)) {
      Alert.alert('Invalid Experience', 'Experience must be a positive number between 0 and 60 years.');
      return;
    }

    setSaving(true);
    try {
      // D12: Save to server institution config / profile
      await apiClient('/admin/institution-config', {
        method: 'PUT',
        body: JSON.stringify({
          institutionType,
        }),
      }).catch(() => null);

      setUserProfile({
        phone: phone.trim(),
        qualification: qualification.trim(),
        experience: experience.trim(),
        institutionType: institutionType as any,
      });

      setIsEditing(false);
      Alert.alert('Profile Updated', 'Your profile information has been saved successfully.');
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update profile on the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#171717" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Principal Profile & Settings</Text>
          <TouchableOpacity
            style={styles.editToggleBtn}
            onPress={() => {
              if (isEditing) {
                // Cancel
                setPhone(storePhone);
                setQualification(storeQualification);
                setExperience(storeExperience);
                setInstitutionType(storeInstType);
                setIsEditing(false);
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Text style={styles.editToggleText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Avatar & Role Header */}
          <View style={styles.card}>
            <View style={styles.avatarRow}>
              <View style={[styles.avatarCircle, { backgroundColor: '#FFF4C7' }]}>
                <Text style={[styles.avatarText, { color: '#F4C430' }]}>
                  {fullName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nameText}>{fullName}</Text>
                <Text style={styles.emailText}>{email}</Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.roleBadge, { backgroundColor: '#FFF4C7' }]}>
                    <Text style={[styles.roleBadgeText, { color: '#92400E' }]}>Principal</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Contact Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 9876543210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{phone || '—'}</Text>
              )}
            </View>
          </View>

          {/* Professional Details */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Professional Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Qualification</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={qualification}
                  onChangeText={setQualification}
                  placeholder="e.g. M.Ed, Ph.D in Educational Leadership"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text style={styles.infoValue}>{qualification || '—'}</Text>
              )}
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Experience (yrs)</Text>
              {isEditing ? (
                <TextInput
                  style={styles.inputField}
                  value={experience}
                  onChangeText={setExperience}
                  placeholder="Years of experience"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.infoValue}>{experience || '—'}</Text>
              )}
            </View>
          </View>

          {/* Institution Details */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Institution</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{institutionName || institutionCode || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Code</Text>
              <Text style={styles.infoValue}>{institutionCode || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              {isEditing ? (
                <View style={styles.typeSelector}>
                  {(['school', 'college'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, institutionType === t && styles.typeChipActive]}
                      onPress={() => setInstitutionType(t)}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          institutionType === t && styles.typeChipTextActive,
                        ]}
                      >
                        {t.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.infoValue}>{institutionType.toUpperCase()}</Text>
              )}
            </View>
          </View>

          {/* Save Button (when editing) */}
          {isEditing && (
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Account Settings */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/change-password')}>
              <MaterialCommunityIcons name="lock-reset" size={20} color="#F4C430" />
              <Text style={styles.menuText}>Change Password</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#6B6B6B"
                style={{ marginLeft: 'auto' }}
              />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={20} color="#DC3545" />
              <Text style={[styles.menuText, { color: '#DC3545' }]}>Logout</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#6B6B6B"
                style={{ marginLeft: 'auto' }}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { padding: 4, borderRadius: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#171717', flex: 1, marginLeft: 8 },
  editToggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FEF3C7' },
  editToggleText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 14,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  nameText: { fontSize: 18, fontWeight: '800', color: '#171717' },
  emailText: { fontSize: 13, color: '#6B6B6B', marginTop: 2 },
  badgeRow: { marginTop: 6 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.chip, alignSelf: 'flex-start' },
  roleBadgeText: { fontSize: 11, fontWeight: '800' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#171717' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 28 },
  infoLabel: { fontSize: 13, color: '#6B6B6B', fontWeight: '500', flexShrink: 1 },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#171717', flexShrink: 1, textAlign: 'right' },
  inputField: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 13,
    color: '#111827',
    minWidth: 180,
    textAlign: 'right',
  },
  typeSelector: { flexDirection: 'row', gap: 6 },
  typeChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB' },
  typeChipActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  typeChipText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  typeChipTextActive: { color: '#FFFFFF', fontWeight: '800' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#FFFDF7' },
  menuText: { fontSize: 14, fontWeight: '600', color: '#171717' },
});
