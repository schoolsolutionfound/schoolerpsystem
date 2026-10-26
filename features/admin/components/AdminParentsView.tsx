import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert, Switch, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DropdownSelect } from './DropdownSelect';
import { BulkImportModal } from './BulkImportModal';
import { fetchStudentsApi, resetUserPasswordApi } from '../../../api/admin';
import { BorderRadius } from '../../../constants/theme';

interface LinkedChild {
  studentId: string;
  name: string;
  rollNoOrUSN?: string;
  relationship: string;
  permissions: string[];
}

interface ParentChildView {
  studentId: string;
  name?: string;
  relationship?: string;
}

export interface ParentItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  scope?: any;
  children?: ParentChildView[];
  childrenCount?: number;
  profileCompleted?: boolean;
  createdAt?: string;
}

interface AdminParentsViewProps {
  parents: ParentItem[];
  onCreateParent: (payload: {
    fullName: string;
    email: string;
    role: string;
    phone?: string;
    alternatePhone?: string;
    occupation?: string;
    address?: string;
    city?: string;
    pincode?: string;
    emergencyContact?: string;
    preferredLanguage?: string;
    relation: string;
    children: { studentId: string; relationship: string; permissions: string[] }[];
    notificationPrefs: { pushEnabled: boolean; disabledTypes: string[] };
  }) => Promise<any>;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const RELATIONS = ['Father', 'Mother', 'Guardian'];
const PERMISSION_KEYS = ['view_attendance', 'view_marks', 'view_fees', 'pay_fees', 'receive_alerts'];
const PERMISSION_LABELS: Record<string, string> = {
  view_attendance: 'Attendance',
  view_marks: 'Marks',
  view_fees: 'Fees',
  pay_fees: 'Pay Fees',
  receive_alerts: 'Alerts',
};
const PARENT_NOTIFICATION_TYPES = ['attendance', 'fee', 'exam', 'homework', 'announcement', 'bus', 'timetable'];
const NOTIFICATION_LABELS: Record<string, string> = {
  attendance: 'Attendance',
  fee: 'Fees',
  exam: 'Exams',
  homework: 'Homework',
  announcement: 'Announcements',
  bus: 'Transport',
  timetable: 'Timetable',
};
const LANGUAGES = ['English', 'Hindi', 'Malayalam', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Marathi', 'Gujarati'];

export const AdminParentsView: React.FC<AdminParentsViewProps> = ({
  parents,
  onCreateParent,
  refreshing = false,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  // Create form — Personal / Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [relation, setRelation] = useState('Father');

  // Link children
  const [childSearch, setChildSearch] = useState('');
  const [childResults, setChildResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [children, setChildren] = useState<LinkedChild[]>([]);

  const onChildSearchChange = (value: string) => {
    setChildSearch(value);
    if (!value.trim()) {
      setChildResults([]);
      setSearching(false);
    }
  };

  // Additional details
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');

  // Notifications
  const [pushEnabled, setPushEnabled] = useState(true);
  const [disabledTypes, setDisabledTypes] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = childSearch.trim();
    if (!q) return;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res: any = await fetchStudentsApi(q);
        const list = (Array.isArray(res) ? res : res?.data || []) as any[];
        const linked = new Set(children.map((c) => c.studentId));
        setChildResults(list.filter((s) => !linked.has(s.id)).slice(0, 5));
      } catch {
        setChildResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [childSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setAlternatePhone('');
    setOccupation('');
    setRelation('Father');
    setChildSearch('');
    setChildResults([]);
    setChildren([]);
    setAddress('');
    setCity('');
    setPincode('');
    setEmergencyContact('');
    setPreferredLanguage('English');
    setPushEnabled(true);
    setDisabledTypes([]);
  };

  const addChild = (student: any) => {
    setChildren((prev) => [
      ...prev,
      {
        studentId: student.id,
        name: student.fullName || '',
        rollNoOrUSN: student.rollNoOrUSN || '',
        relationship: relation || 'Guardian',
        permissions: [...PERMISSION_KEYS],
      },
    ]);
    setChildSearch('');
    setChildResults([]);
  };

  const updateChild = (studentId: string, patch: Partial<LinkedChild>) => {
    setChildren((prev) => prev.map((c) => (c.studentId === studentId ? { ...c, ...patch } : c)));
  };

  const removeChild = (studentId: string) => {
    setChildren((prev) => prev.filter((c) => c.studentId !== studentId));
  };

  const toggleChildPermission = (studentId: string, key: string) => {
    setChildren((prev) =>
      prev.map((c) => {
        if (c.studentId !== studentId) return c;
        const has = c.permissions.includes(key);
        const permissions = has ? c.permissions.filter((p) => p !== key) : [...c.permissions, key];
        return { ...c, permissions };
      })
    );
  };

  const toggleNotificationType = (type: string) => {
    setDisabledTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const handleCreate = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Missing Fields', 'Full Name and Email are required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert('Invalid Email', 'Enter a valid email address.');
      return;
    }
    if (!relation) {
      Alert.alert('Missing Relationship', 'Select the relationship to the student(s).');
      return;
    }
    if (children.length === 0) {
      Alert.alert('No Children Linked', 'Search and link at least one student.');
      return;
    }
    const emptyPerms = children.find((c) => c.permissions.length === 0);
    if (emptyPerms) {
      Alert.alert('Permissions Required', `Keep at least one permission enabled for ${emptyPerms.name || 'each linked student'}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res: any = await onCreateParent({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: 'parent',
        phone: phone.trim() || undefined,
        alternatePhone: alternatePhone.trim() || undefined,
        occupation: occupation.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        pincode: pincode.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        preferredLanguage: preferredLanguage || undefined,
        relation,
        children: children.map((c) => ({
          studentId: c.studentId,
          relationship: c.relationship,
          permissions: c.permissions,
        })),
        notificationPrefs: { pushEnabled, disabledTypes },
      });
      setCreateModalOpen(false);
      resetForm();
      if (res?.inviteSent) {
        Alert.alert('Parent Created', `Invite email with the temporary password was sent to ${email.trim().toLowerCase()}.`);
      } else if (res?.tempPassword) {
        Alert.alert(
          'Parent Created',
          `Email delivery is not configured in this environment.\n\nTemporary password (shown once): ${res.tempPassword}\n\nShare it securely — they must change it at first login.`
        );
      } else {
        Alert.alert(
          'Parent Created',
          'The account was created, but the invite email could not be sent. Use Reset Password on the parent row to issue credentials.'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create parent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = (p: ParentItem) => {
    Alert.alert(
      'Reset Password',
      `Generate a new temporary password for ${p.fullName}? Their current password stops working immediately, all sessions are signed out, and they must change the password at next login.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResettingId(p.id);
            try {
              const res: any = await resetUserPasswordApi(p.id);
              const message = res?.tempPassword
                ? `New temporary password (shown once): ${res.tempPassword}\n\nShare it securely — they must change it at first login.`
                : res?.usingInstitutionDefaultPassword
                  ? 'Password reset to the institution default. The user must change it at next login.'
                  : 'Password has been reset. The user must change it at next login.';
              Alert.alert('Password Reset', message);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reset password');
            } finally {
              setResettingId(null);
            }
          },
        },
      ]
    );
  };

  const filteredParents = parents.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const childNames = (p.children || []).map((c) => c.name || '').join(' ').toLowerCase();
    return (
      (p.fullName || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      childNames.includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Parents</Text>
          <Text style={styles.pageSubtitle}>{parents.length} parent accounts</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.importBtn} onPress={() => setImportOpen(true)}>
            <MaterialCommunityIcons name="file-import-outline" size={18} color="#1A1B1C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setCreateModalOpen(true); }}>
            <MaterialCommunityIcons name="plus" size={16} color="#1A1B1C" />
            <Text style={styles.addBtnText}>Add Parent</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.headerBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6B6B6B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, child..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Parent List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} />}
      >
        {filteredParents.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-multiple-outline" size={40} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No Parent Accounts</Text>
            <Text style={styles.emptySub}>Use Add Parent above to create an account linked to one or more students.</Text>
          </View>
        ) : (
          filteredParents.map((p) => {
            const relationLabel = (p.children || [])[0]?.relationship || 'Parent';
            const childNames = (p.children || []).map((c) => c.name).filter(Boolean);
            const meta = [relationLabel, childNames.length > 0 ? childNames.join(', ') : 'No students linked']
              .filter(Boolean)
              .join('  ·  ');
            return (
              <View key={p.id} style={styles.parentCard}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{(p.fullName || '?').substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.parentDetails}>
                  <Text style={styles.parentName} numberOfLines={1}>{p.fullName}</Text>
                  <Text style={styles.parentEmail} numberOfLines={1}>{p.email}</Text>
                  <Text style={styles.parentMeta} numberOfLines={1}>{meta}</Text>
                </View>
                <TouchableOpacity
                  style={styles.resetIconBtn}
                  onPress={() => handleResetPassword(p)}
                  disabled={resettingId === p.id}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {resettingId === p.id ? (
                    <MaterialCommunityIcons name="loading" size={18} color="#6B6B6B" />
                  ) : (
                    <MaterialCommunityIcons name="key-variant" size={18} color="#6B6B6B" />
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ─── Add Parent Modal ─── */}
      <Modal visible={createModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Parent</Text>
              <TouchableOpacity onPress={() => setCreateModalOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              {/* 1 · Personal */}
              <Text style={styles.sectionHeader}>Personal Details</Text>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="account-outline" size={16} color="#9CA3AF" />
                  <TextInput style={styles.inputIconText} placeholder="e.g. Rajesh Sharma" placeholderTextColor="#9CA3AF" value={fullName} onChangeText={setFullName} />
                </View>
              </View>
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput style={styles.input} placeholder="+91 9876543210" placeholderTextColor="#9CA3AF" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
                <View style={styles.nameField}>
                  <Text style={styles.label}>Alternate Phone</Text>
                  <TextInput style={styles.input} placeholder="Optional" placeholderTextColor="#9CA3AF" value={alternatePhone} onChangeText={setAlternatePhone} keyboardType="phone-pad" />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Occupation</Text>
                <TextInput style={styles.input} placeholder="e.g. Engineer" placeholderTextColor="#9CA3AF" value={occupation} onChangeText={setOccupation} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Relationship *</Text>
                <View style={styles.chipRowWrap}>
                  {RELATIONS.map((r) => {
                    const selected = relation === r;
                    return (
                      <TouchableOpacity key={r} style={[styles.chip, selected && styles.chipSelected]} onPress={() => setRelation(r)}>
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{r}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formDivider} />

              {/* 2 · Account */}
              <Text style={styles.sectionHeader}>Account</Text>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="email-outline" size={16} color="#9CA3AF" />
                  <TextInput style={styles.inputIconText} placeholder="parent@example.com" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Parent ID</Text>
                <View style={styles.disabledInput}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={16} color="#9CA3AF" />
                  <TextInput
                    style={styles.disabledInputText}
                    value=""
                    placeholder="Assigned automatically on save"
                    placeholderTextColor="#6B6B6B"
                    editable={false}
                  />
                </View>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Account Status</Text>
                <View style={styles.statusChip}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusChipText}>Active</Text>
                </View>
              </View>
              <Text style={styles.hintText}>No password is set here — an invite email with a temporary password is sent after saving.</Text>

              <View style={styles.formDivider} />

              {/* 3 · Link Children */}
              <Text style={styles.sectionHeader}>Link Children</Text>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Search Students</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="magnify" size={16} color="#9CA3AF" />
                  <TextInput
                    style={styles.inputIconText}
                    placeholder="Search by name, roll number, admission no..."
                    placeholderTextColor="#9CA3AF"
                    value={childSearch}
                    onChangeText={onChildSearchChange}
                    autoCapitalize="none"
                  />
                  {searching && <ActivityIndicator size="small" color="#6B6B6B" />}
                </View>
                {childResults.length > 0 && (
                  <View style={styles.resultsBox}>
                    {childResults.map((s) => (
                      <TouchableOpacity key={s.id} style={styles.resultRow} onPress={() => addChild(s)}>
                        <View style={styles.resultAvatar}>
                          <Text style={styles.resultAvatarText}>{(s.fullName || '?').substring(0, 2).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.resultName} numberOfLines={1}>{s.fullName}</Text>
                          <Text style={styles.resultMeta} numberOfLines={1}>
                            {[s.rollNoOrUSN, s.department, s.section ? `Sec ${s.section}` : null].filter(Boolean).join(' · ') || s.email}
                          </Text>
                        </View>
                        <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#1A1B1C" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {children.length === 0 ? (
                <Text style={styles.hintText}>No students linked yet — search above to add one.</Text>
              ) : (
                children.map((c) => (
                  <View key={c.studentId} style={styles.childCard}>
                    <View style={styles.childCardHeader}>
                      <View style={styles.childInfo}>
                        <Text style={styles.childName} numberOfLines={1}>{c.name}</Text>
                        {!!c.rollNoOrUSN && <Text style={styles.childMeta} numberOfLines={1}>{c.rollNoOrUSN}</Text>}
                      </View>
                      <TouchableOpacity onPress={() => removeChild(c.studentId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialCommunityIcons name="close-circle-outline" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                    <DropdownSelect
                      value={c.relationship}
                      options={RELATIONS}
                      onChange={(key) => updateChild(c.studentId, { relationship: key })}
                      label="Relationship"
                      placeholder="Select"
                      menuTitle="Relationship"
                      variant="inline"
                      style={styles.childDropdown}
                    />
                    <Text style={styles.permLabel}>Permissions</Text>
                    <View style={styles.chipRowWrap}>
                      {PERMISSION_KEYS.map((key) => {
                        const on = c.permissions.includes(key);
                        return (
                          <TouchableOpacity
                            key={key}
                            style={[styles.permChip, on && styles.permChipOn]}
                            onPress={() => toggleChildPermission(c.studentId, key)}
                          >
                            <MaterialCommunityIcons name={on ? 'check-circle' : 'circle-outline'} size={12} color={on ? '#1A1B1C' : '#9CA3AF'} />
                            <Text style={[styles.permChipText, on && styles.permChipTextOn]}>{PERMISSION_LABELS[key]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))
              )}

              <View style={styles.formDivider} />

              {/* 4 · Additional */}
              <Text style={styles.sectionHeader}>Additional Details</Text>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput style={styles.input} placeholder="House, street, area" placeholderTextColor="#9CA3AF" value={address} onChangeText={setAddress} />
              </View>
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Text style={styles.label}>City</Text>
                  <TextInput style={styles.input} placeholder="City" placeholderTextColor="#9CA3AF" value={city} onChangeText={setCity} />
                </View>
                <View style={styles.nameField}>
                  <Text style={styles.label}>Pincode</Text>
                  <TextInput style={styles.input} placeholder="6-digit pincode" placeholderTextColor="#9CA3AF" value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Emergency Contact</Text>
                <TextInput style={styles.input} placeholder="Name · Phone" placeholderTextColor="#9CA3AF" value={emergencyContact} onChangeText={setEmergencyContact} />
              </View>
              <DropdownSelect
                value={preferredLanguage}
                options={LANGUAGES}
                onChange={setPreferredLanguage}
                label="Preferred Language"
                placeholder="Select language"
                menuTitle="Preferred Language"
                variant="inline"
              />

              <View style={styles.formDivider} />

              {/* Notifications */}
              <Text style={styles.sectionHeader}>Notifications</Text>
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Push Notifications</Text>
                  <Text style={styles.hintText}>Receive updates on this device.</Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: '#E8E5DC', true: '#F4C430' }}
                  thumbColor={pushEnabled ? '#1A1B1C' : '#FFFFFF'}
                />
              </View>
              <View style={styles.chipRowWrap}>
                {PARENT_NOTIFICATION_TYPES.map((type) => {
                  const on = !disabledTypes.includes(type);
                  return (
                    <TouchableOpacity key={type} style={[styles.permChip, on && styles.permChipOn]} onPress={() => toggleNotificationType(type)}>
                      <MaterialCommunityIcons name={on ? 'bell-ring' : 'bell-off'} size={12} color={on ? '#1A1B1C' : '#9CA3AF'} />
                      <Text style={[styles.permChipText, on && styles.permChipTextOn]}>{NOTIFICATION_LABELS[type]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                <MaterialCommunityIcons name="check" size={15} color="#1A1B1C" />
                <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Parent'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BulkImportModal
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        type="parent"
        onImported={onRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: 0.2 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F4C430', borderRadius: BorderRadius.button, paddingHorizontal: 14, height: 40, justifyContent: 'center', shadowColor: '#171717', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2 },
  addBtnText: { color: '#1A1B1C', fontWeight: '800', fontSize: 13 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  importBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.button,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerBar: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input, borderWidth: 1, borderColor: '#E8E5DC', paddingHorizontal: 12, height: 44, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1A1B1C' },

  listContainer: { gap: 10, paddingBottom: 40 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E8E5DC', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1A1B1C', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 4, lineHeight: 16 },

  parentCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E8E5DC',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1A1B1C', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  parentDetails: { flex: 1 },
  parentName: { fontSize: 14, fontWeight: '700', color: '#1A1B1C' },
  parentEmail: { fontSize: 12, color: '#6B6B6B', marginTop: 1 },
  parentMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  resetIconBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#E8E5DC', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFDF7' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, gap: 14, borderWidth: 1, borderColor: '#E8E5DC', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1B1C' },
  sectionHeader: { fontSize: 11, fontWeight: '800', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  formDivider: { height: 1, backgroundColor: '#F0EDE4', marginVertical: 12 },
  nameRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  nameField: { flex: 1, gap: 4 },
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderWidth: 1,
    borderColor: '#E5E7EB', borderRadius: BorderRadius.input, paddingHorizontal: 12, backgroundColor: '#FFFFFF',
  },
  inputIconText: { flex: 1, fontSize: 13, color: '#1A1B1C' },
  formGroup: { gap: 4, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1B1C' },
  input: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: BorderRadius.input, paddingHorizontal: 12, fontSize: 13, backgroundColor: '#FFFFFF', color: '#111827' },
  hintText: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },

  disabledInput: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderWidth: 1,
    borderColor: '#E8E5DC', borderRadius: BorderRadius.input, paddingHorizontal: 12, backgroundColor: '#F5F4F0',
  },
  disabledInputText: { flex: 1, fontSize: 13, color: '#6B6B6B' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, marginBottom: 4 },
  statusLabel: { fontSize: 12, fontWeight: '700', color: '#1A1B1C' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.chip, backgroundColor: '#F4C430' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A' },
  statusChipText: { fontSize: 11, fontWeight: '800', color: '#1A1B1C' },

  chipRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.chip, borderWidth: 1, borderColor: '#E8E5DC', backgroundColor: '#FFFDF7' },
  chipSelected: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },
  chipTextSelected: { color: '#1A1B1C', fontWeight: '800' },

  resultsBox: { borderWidth: 1, borderColor: '#E8E5DC', borderRadius: BorderRadius.card, backgroundColor: '#FFFFFF', marginTop: 6 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderBottomWidth: 1, borderBottomColor: '#F0EDE4' },
  resultAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1A1B1C', alignItems: 'center', justifyContent: 'center' },
  resultAvatarText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  resultName: { fontSize: 13, fontWeight: '700', color: '#1A1B1C' },
  resultMeta: { fontSize: 11, color: '#6B6B6B', marginTop: 1 },

  childCard: { borderWidth: 1, borderColor: '#E8E5DC', borderRadius: BorderRadius.card, backgroundColor: '#FFFDF7', padding: 12, marginTop: 8, gap: 6 },
  childCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  childInfo: { flex: 1 },
  childName: { fontSize: 13, fontWeight: '700', color: '#1A1B1C' },
  childMeta: { fontSize: 11, color: '#6B6B6B', marginTop: 1 },
  childDropdown: { marginTop: 2 },
  permLabel: { fontSize: 11, fontWeight: '700', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },
  permChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 6,
    borderRadius: BorderRadius.chip, borderWidth: 1, borderColor: '#E8E5DC', backgroundColor: '#FFFFFF',
  },
  permChipOn: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  permChipText: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  permChipTextOn: { color: '#1A1B1C', fontWeight: '800' },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },

  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#6B6B6B', fontWeight: '700', fontSize: 13 },
  submitBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#F4C430', borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  submitText: { color: '#1A1B1C', fontWeight: '800', fontSize: 13 },
});