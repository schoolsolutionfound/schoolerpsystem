import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
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

  const initials = (fullName || 'Administrator')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD';

  const displayRole = designation || roleName || 'Institution Administrator';

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

  const detailItems = [
    { id: 'email', icon: 'email-outline', label: 'Official Email', value: email },
    { id: 'phone', icon: 'phone-outline', label: 'Contact Phone', value: phone },
    { id: 'designation', icon: 'briefcase-outline', label: 'Designation', value: designation },
    { id: 'institution', icon: 'office-building-outline', label: 'Assigned Institution', value: institutionName },
    { id: 'code', icon: 'badge-account-outline', label: 'Institution Code', value: institutionCode },
    { id: 'role', icon: 'shield-account-outline', label: 'Role', value: roleName },
    ...(address ? [{ id: 'address', icon: 'map-marker-outline', label: 'Office Address', value: address }] : []),
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.viewBody}
        contentContainerStyle={{ paddingBottom: 60 }}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1A1B1C']}
              tintColor="#1A1B1C"
            />
          ) : undefined
        }
      >
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="check-decagram" size={20} color="#F4C430" />
            </View>
          </View>

          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.title}>{displayRole}</Text>
          <Text style={styles.empTagText}>ID: {institutionCode || 'N/A'}</Text>

          {onSaveProfile && (
            <TouchableOpacity
              style={styles.editToggleBtn}
              onPress={editing ? cancelEdit : startEdit}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={editing ? 'close' : 'pencil-outline'}
                size={16}
                color="#171717"
              />
              <Text style={styles.editToggleText}>
                {editing ? 'Cancel Editing' : 'Edit Profile Info'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <View style={styles.editCard}>
            <Text style={styles.editCardTitle}>Edit Admin Profile</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.formInput}
                value={nameVal}
                onChangeText={setNameVal}
                placeholder="Your full name"
                placeholderTextColor="#475569"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number</Text>
              <TextInput
                style={styles.formInput}
                value={phoneVal}
                onChangeText={setPhoneVal}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor="#475569"
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Designation / Role Title</Text>
              <TextInput
                style={styles.formInput}
                value={designationVal}
                onChangeText={setDesignationVal}
                placeholder="e.g. Principal, HR"
                placeholderTextColor="#475569"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address</Text>
              <TextInput
                style={[styles.formInput, styles.addressInput]}
                value={addressVal}
                onChangeText={setAddressVal}
                placeholder="Your address"
                placeholderTextColor="#475569"
                multiline
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={saveEdit} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#171717" />
              ) : (
                <Text style={styles.primaryBtnText}>Save Profile Updates</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionHeader}>Professional Details</Text>

            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                {detailItems.map((item, index, arr) => {
                  const isLast = index === arr.length - 1;
                  return (
                    <View
                      key={item.id}
                      style={[styles.detailRow, isLast && { borderBottomWidth: 0 }]}
                    >
                      <View style={styles.detailIconWrap}>
                        <MaterialCommunityIcons name={item.icon as any} size={18} color="#D97706" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>{item.label}</Text>
                        <Text style={styles.detailValue} selectable>
                          {item.value || 'Not Provided'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {roleFields.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <ProfileCustomFields
                  fields={roleFields}
                  values={roleFieldValues}
                  onSave={saveRoleFields}
                />
              </View>
            )}

            <Text style={styles.sectionHeader}>Account & Security</Text>

            <View style={styles.infoCard}>
              <TouchableOpacity
                style={[styles.detailRow, { borderBottomWidth: 0 }]}
                onPress={onChangePassword}
                activeOpacity={0.7}
              >
                <View style={styles.detailIconWrap}>
                  <MaterialCommunityIcons name="lock-reset" size={18} color="#D97706" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Password</Text>
                  <Text style={styles.detailValue}>Change Password</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.logoutWrap}>
          <TouchableOpacity style={styles.logoutBtnLarge} onPress={onLogout} activeOpacity={0.8}>
            <MaterialCommunityIcons name="logout" size={20} color="#DC2626" />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  viewBody: { flex: 1, padding: 20 },
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
    textAlign: 'center',
  },
  title: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#6B6B6B',
    marginTop: 4,
    textAlign: 'center',
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
  formGroup: { marginBottom: 14, gap: 5 },
  formLabel: { fontSize: 12, fontFamily: FontFamily.bold, color: '#374151' },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#111827',
  },
  addressInput: { minHeight: 60, textAlignVertical: 'top' },
  primaryBtn: {
    backgroundColor: '#F4C430',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#171717', fontSize: 13, fontFamily: FontFamily.bold },
  sectionHeader: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  infoSection: { marginBottom: 20 },
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
  detailContent: { flex: 1, justifyContent: 'center' },
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
  logoutWrap: { gap: 12, marginTop: 24, marginBottom: 40 },
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
