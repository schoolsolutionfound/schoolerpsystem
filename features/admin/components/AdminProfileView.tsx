import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { ProfileCustomFields } from '../../shared/formFields/ProfileCustomFields';
import { useProfileCustomFields } from '../../shared/formFields/useProfileCustomFields';

export interface AdminProfileData {
  fullName: string;
  email: string;
  institutionName: string;
  institutionCode: string;
  roleName: string;
  designation: string;
  phone?: string;
  address?: string;
}

export interface AdminProfilePatch {
  fullName?: string;
  phone?: string;
  designation?: string;
  address?: string;
}

interface AdminProfileViewProps {
  fullName: string;
  email: string;
  institutionName: string;
  institutionCode: string;
  roleName: string;
  designation: string;
  phone?: string;
  address?: string;
  onChangePassword: () => void;
  onLogout: () => void;
  onSaveProfile?: (patch: AdminProfilePatch) => Promise<boolean>;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  fullName,
  email,
  institutionName,
  institutionCode,
  roleName,
  designation,
  phone = '',
  address = '',
  onChangePassword,
  onLogout,
  onSaveProfile,
  refreshing = false,
  onRefresh,
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { fields: roleFields, values: roleFieldValues, save: saveRoleFields } = useProfileCustomFields();
  const [nameVal, setNameVal] = useState(fullName);
  const [phoneVal, setPhoneVal] = useState(phone);
  const [designationVal, setDesignationVal] = useState(designation);
  const [addressVal, setAddressVal] = useState(address);

  const startEdit = () => {
    setNameVal(fullName);
    setPhoneVal(phone);
    setDesignationVal(designation);
    setAddressVal(address);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    if (!onSaveProfile) return;
    if (nameVal.trim().length < 2) {
      Alert.alert('Invalid Name', 'Full name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      const ok = await onSaveProfile({
        fullName: nameVal.trim(),
        phone: phoneVal.trim() || undefined,
        designation: designationVal.trim() || undefined,
        address: addressVal.trim() || undefined,
      });
      if (ok) setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const renderInfoRow = (label: string, value: string, mono?: boolean) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.codeText]}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} />}
    >
      {/* Profile Header */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{fullName.substring(0, 2).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{fullName}</Text>
            <Text style={styles.emailText}>{email}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{roleName || 'Institution Admin'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Personal Details — view or edit */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          {onSaveProfile && !editing && (
            <TouchableOpacity style={styles.editBtn} onPress={startEdit} accessibilityLabel="Edit profile">
              <MaterialCommunityIcons name="pencil" size={14} color="#F4C430" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={nameVal}
                onChangeText={setNameVal}
                placeholder="Your full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phoneVal}
                onChangeText={setPhoneVal}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Designation</Text>
              <TextInput
                style={styles.input}
                value={designationVal}
                onChangeText={setDesignationVal}
                placeholder="e.g. Principal, HR"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                value={addressVal}
                onChangeText={setAddressVal}
                placeholder="Your address"
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#1A1B1C" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {designation ? renderInfoRow('Designation', designation) : null}
            {phone ? renderInfoRow('Phone', phone) : null}
            {address ? renderInfoRow('Address', address) : null}
            {!designation && !phone && !address && (
              <Text style={styles.emptyHint}>No personal details yet — tap Edit to add them.</Text>
            )}
          </>
        )}
      </View>

      {/* Institutional Scoping */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Role & Institution</Text>
        {renderInfoRow('Assigned Institution', institutionName)}
        {renderInfoRow('Institution Code', institutionCode || 'N/A', true)}
      </View>

      {/* Admin-configured form fields (admission officer etc.); empty for admin/dev */}
      {roleFields.length > 0 && (
        <ProfileCustomFields fields={roleFields} values={roleFieldValues} onSave={saveRoleFields} />
      )}

      {/* Account Settings & Controls */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account & Security</Text>
        <TouchableOpacity style={styles.menuItem} onPress={onChangePassword}>
          <MaterialCommunityIcons name="lock-reset" size={20} color="#F4C430" />
          <Text style={styles.menuText}>Change Password</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#6B6B6B" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={onLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#DC3545" />
          <Text style={[styles.menuText, { color: '#DC3545' }]}>Logout</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#6B6B6B" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF4C7',
    borderWidth: 2,
    borderColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#171717' },
  nameText: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#111827' },
  emailText: { fontSize: 13, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 2 },
  badgeRow: { marginTop: 6 },
  roleBadge: { backgroundColor: '#FFF4C7', borderWidth: 1, borderColor: '#F4C430', paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.chip, alignSelf: 'flex-start' },
  roleBadgeText: { fontSize: 11, fontFamily: FontFamily.extrabold, color: '#92400E' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#111827' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.chip, backgroundColor: '#FFF4C7', borderWidth: 1, borderColor: '#F4C430' },
  editBtnText: { fontSize: 12, fontFamily: FontFamily.extrabold, color: '#92400E' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 28 },
  infoLabel: { fontSize: 13, fontFamily: FontFamily.medium, color: '#6B6B6B', flexShrink: 1 },
  infoValue: { fontSize: 13, fontFamily: FontFamily.bold, color: '#1A1B1C', flexShrink: 1, textAlign: 'right' },
  codeText: { color: '#92400E' },
  emptyHint: { fontSize: 13, fontFamily: FontFamily.regular, color: '#9CA3AF', fontStyle: 'italic' },
  formGroup: { gap: 6 },
  label: { fontSize: 12, fontFamily: FontFamily.bold, color: '#6B6B6B' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: BorderRadius.chip, borderWidth: 1, borderColor: '#E8E5DC' },
  cancelBtnText: { fontSize: 14, fontFamily: FontFamily.bold, color: '#6B6B6B' },
  saveBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: BorderRadius.chip, backgroundColor: '#F4C430' },
  saveBtnText: { fontSize: 14, fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuText: { fontSize: 14, fontFamily: FontFamily.semibold, color: '#1A1B1C' },
});