import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { resetUserPasswordApi, fetchFeesApi } from '../../../api/admin';
import { DropdownSelect } from './DropdownSelect';
import { BulkImportModal } from './BulkImportModal';

// Roles with their own dedicated workspace (Add Student / Add Teacher / Add
// Parent) are intentionally excluded from the Add User role grid.
// Must match server SCHOOL_ROLES / COLLEGE_ROLES in admin.service.ts
// (minus student/teacher/parent which have dedicated screens).
const SCHOOL_ROLES = [
  { key: 'admin', label: 'Admin', icon: 'shield-account-outline' },
  { key: 'principal', label: 'Principal', icon: 'account-tie-outline' },
  { key: 'accountant', label: 'Accountant', icon: 'calculator' },
  { key: 'librarian', label: 'Librarian', icon: 'book-outline' },
  { key: 'driver', label: 'Driver', icon: 'bus' },
  { key: 'admission_officer', label: 'Admission Officer', icon: 'card-account-details-outline' },
] as const;

const COLLEGE_ROLES = [
  { key: 'admin', label: 'Admin', icon: 'shield-account-outline' },
  { key: 'hod', label: 'HOD', icon: 'account-tie-outline' },
  { key: 'accountant', label: 'Accountant', icon: 'calculator' },
  { key: 'librarian', label: 'Librarian', icon: 'book-outline' },
  { key: 'driver', label: 'Driver', icon: 'bus' },
  { key: 'admission_officer', label: 'Admission Officer', icon: 'card-account-details-outline' },
] as const;

// Students / teachers / parents have their own dedicated workspaces (Add
// Student, Add Teacher, Parents) — they are never listed on the Users page.

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  title?: string;
  rollNoOrUSN?: string;
  department?: string;
  scope?: string;
}

interface FeeStructureItem {
  id: string;
  classSectionId?: string | null;
  title?: string;
  amount: string | number;
  term?: string | null;
}

interface AdminUsersViewProps {
  users: UserItem[];
  institutionType: 'school' | 'college';
  classSections?: { id?: string; name?: string }[];
  pendingCreateRole?: string | null;
  onPendingCreateRoleConsumed?: () => void;
  onCreateUser: (user: {
    fullName: string;
    email: string;
    role: string;
    phone?: string;
    password?: string;
    categoryName?: string;
    seats?: number;
    feeStructureIds?: string[];
  }) => Promise<void>;
  onSearchChange?: (q: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  users,
  institutionType,
  classSections = [],
  pendingCreateRole,
  onPendingCreateRoleConsumed,
  onCreateUser,
  onSearchChange,
  hasMore = false,
  onLoadMore,
  totalCount,
  refreshing = false,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const updateSearch = (q: string) => {
    setSearch(q);
    onSearchChange?.(q);
  };
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [seats, setSeats] = useState('');
  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>([]);
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const roleOptions = institutionType === 'college' ? COLLEGE_ROLES : SCHOOL_ROLES;
  const isOfficer = role === 'admission_officer';

  // Fee structures (class + amount) for the officer's "Fee Structures" section.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchFeesApi();
        if (!cancelled && Array.isArray(res)) setFeeStructures(res as FeeStructureItem[]);
      } catch { /* section renders its empty state */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const feeClassName = (fee: FeeStructureItem) => {
    if (!fee.classSectionId) return 'All classes';
    return classSections.find((c) => c.id === fee.classSectionId)?.name || 'Unknown class';
  };

  // Open create modal with role pre-selected when launched from dashboard quick actions
  useEffect(() => {
    if (!pendingCreateRole) return;
    const valid = roleOptions.some((r) => r.key === pendingCreateRole);
    if (valid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRole(pendingCreateRole);
      setModalOpen(true);
    }
    onPendingCreateRoleConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCreateRole]);

  // Students / teachers / parents are managed in their own workspaces —
  // never list them here (this page only shows users created via Create User).
  const HIDDEN_ROLES = ['parent', 'student', 'teacher'];
  const visibleUsers = users.filter((u) => !HIDDEN_ROLES.includes((u.role || '').toLowerCase()));
  const filteredUsers = visibleUsers.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = visibleUsers.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setRole('admin');
    setPhone('');
    setPassword('');
    setCategoryName('');
    setSeats('');
    setSelectedFeeIds([]);
  };

  const handleCreate = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert('Missing Fields', 'First Name, Last Name, and Email are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res: any = await onCreateUser({
        fullName: `${firstName} ${lastName}`.trim(),
        email: email.trim().toLowerCase(),
        role,
        phone: phone || undefined,
        password: password || undefined,
        ...(role === 'admission_officer'
          ? {
              categoryName: categoryName.trim() || undefined,
              seats: /^\d+$/.test(seats.trim()) ? Number(seats.trim()) : undefined,
              feeStructureIds: selectedFeeIds.length ? selectedFeeIds : undefined,
            }
          : {}),
      });
      setModalOpen(false);
      resetForm();
      const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
      const message = res?.tempPassword
        ? `${roleLabel} account created! Temporary password (shown once): ${res.tempPassword}\n\nShare it securely — the user must change it at first login.`
        : password
          ? `${roleLabel} account created! They can log in with the password you set.`
          : `${roleLabel} account created! They can log in with the institution default password.`;
      Alert.alert('Success', message);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = (u: UserItem) => {
    Alert.alert(
      'Reset Password',
      `Generate a new temporary password for ${u.fullName}? Their current password stops working immediately, all sessions are signed out, and they must change the password at next login.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setResettingId(u.id);
            try {
              const res: any = await resetUserPasswordApi(u.id);
              const message = res?.tempPassword
                ? `New temporary password (shown once): ${res.tempPassword}\n\nShare it securely — the user must change it at next login.`
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

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Users</Text>
          <Text style={styles.pageSubtitle}>{visibleUsers.length} users</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.importBtn} onPress={() => setImportOpen(true)}>
            <MaterialCommunityIcons name="file-import-outline" size={18} color="#1A1B1C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalOpen(true); }}>
            <MaterialCommunityIcons name="plus" size={16} color="#1A1B1C" />
            <Text style={styles.addBtnText}>Create User</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.headerBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6B6B6B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email..."
            value={search}
            onChangeText={updateSearch}
          />
        </View>
      </View>

      {/* Role Filter */}
      <DropdownSelect
        leadingIcon="filter-variant"
        style={{ marginBottom: 12 }}
        value={roleFilter}
        onChange={setRoleFilter}
        menuTitle="Filter by Role"
        options={[
          { key: 'all', label: `All (${visibleUsers.length})` },
          ...roleOptions.map((r) => ({ key: r.key as string, label: `${r.label} (${roleCounts[r.key] || 0})` })),
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} />}
      >
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-group-outline" size={40} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptySub}>
              {roleFilter !== 'all'
                ? `No users with role "${roleFilter}" exist yet.`
                : 'Click "+ Create User" above to onboard someone.'}
            </Text>
          </View>
        ) : (
          filteredUsers.map((u) => {
            const userMeta = [
              u.role.charAt(0).toUpperCase() + u.role.slice(1),
              u.rollNoOrUSN,
              u.department,
            ].filter(Boolean);
            return (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{u.fullName.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{u.fullName}</Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  {userMeta.length > 0 && <Text style={styles.userMeta}>{userMeta.join('  ·  ')}</Text>}
                </View>
                <TouchableOpacity
                  style={styles.resetPwdBtn}
                  onPress={() => handleResetPassword(u)}
                  disabled={resettingId === u.id}
                  accessibilityLabel={`Reset password for ${u.fullName}`}
                >
                  <MaterialCommunityIcons
                    name={resettingId === u.id ? 'loading' : 'key-variant'}
                    size={18}
                    color="#6B6B6B"
                  />
                </TouchableOpacity>
              </View>
            );
          })
        )}
        {hasMore && onLoadMore && (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={onLoadMore}>
            <Text style={styles.loadMoreText}>
              Load more ({users.length}{totalCount != null ? ` of ${totalCount}` : ''})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add {roleOptions.find((r) => r.key === role)?.label || 'User'}</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeader}>Role</Text>
              <DropdownSelect
                variant="inline"
                value={role}
                options={roleOptions.map((r) => ({ key: r.key as string, label: r.label }))}
                onChange={setRole}
                placeholder="Select role"
                menuTitle="Select Role"
              />

              <View style={styles.formDivider} />
              <Text style={styles.sectionHeader}>Account</Text>
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput style={styles.input} placeholder="e.g. Aarav" placeholderTextColor="#9CA3AF" value={firstName} onChangeText={setFirstName} />
                </View>
                <View style={styles.nameField}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput style={styles.input} placeholder="e.g. Sharma" placeholderTextColor="#9CA3AF" value={lastName} onChangeText={setLastName} />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email *</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="email-outline" size={16} color="#9CA3AF" />
                  <TextInput style={styles.inputIconText} placeholder="user@institution.edu" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="phone-outline" size={16} color="#9CA3AF" />
                  <TextInput style={styles.inputIconText} placeholder="+91 98765 43210" placeholderTextColor="#9CA3AF" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Temporary Password</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="lock-outline" size={16} color="#9CA3AF" />
                  <TextInput
                    style={styles.inputIconText}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Leave empty for institution default"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <Text style={styles.hintText}>User will be prompted to change password on first login.</Text>
              </View>

              {isOfficer && (
                <>
                  <View style={styles.formDivider} />
                  <Text style={styles.sectionHeader}>Admission Setup</Text>
                  <View style={styles.nameRow}>
                    <View style={styles.nameField}>
                      <Text style={styles.label}>Category Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Management Quota"
                        placeholderTextColor="#9CA3AF"
                        value={categoryName}
                        onChangeText={setCategoryName}
                      />
                    </View>
                    <View style={styles.nameField}>
                      <Text style={styles.label}>No. of Seats</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 10"
                        placeholderTextColor="#9CA3AF"
                        value={seats}
                        onChangeText={(t) => setSeats(t.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.formDivider} />
                  <Text style={styles.sectionHeader}>Fee Structures</Text>
                  {feeStructures.length === 0 ? (
                    <Text style={styles.hintText}>
                      No fee structures yet — create them in Fees first, then assign them here.
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.hintText}>Tick the fee structures (class + amount) this officer handles.</Text>
                      {feeStructures.map((fee) => {
                        const ticked = selectedFeeIds.includes(fee.id);
                        const feeMeta = [fee.title, fee.term].filter(Boolean).join(' · ');
                        return (
                          <TouchableOpacity
                            key={fee.id}
                            style={styles.feeRow}
                            activeOpacity={0.7}
                            onPress={() =>
                              setSelectedFeeIds((prev) =>
                                prev.includes(fee.id) ? prev.filter((x) => x !== fee.id) : [...prev, fee.id]
                              )
                            }
                          >
                            <MaterialCommunityIcons
                              name={ticked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                              size={20}
                              color={ticked ? '#1A1B1C' : '#9CA3AF'}
                            />
                            <View style={styles.feeRowBody}>
                              <Text style={styles.feeRowTitle} numberOfLines={1}>{feeClassName(fee)}</Text>
                              {!!feeMeta && <Text style={styles.feeRowMeta} numberOfLines={1}>{feeMeta}</Text>}
                            </View>
                            <Text style={styles.feeRowAmount}>₹{(Number(fee.amount) || 0).toLocaleString('en-IN')}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </>
                  )}
                </>
              )}

            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                <MaterialCommunityIcons name="check" size={15} color="#1A1B1C" />
                <Text style={styles.submitText}>{submitting ? 'Creating...' : `Create ${roleOptions.find((r) => r.key === role)?.label || 'User'}`}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BulkImportModal
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        type="user"
        userRole={role}
        roleOptions={roleOptions.map((r) => ({ key: r.key as string, label: r.label }))}
        onImported={onRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#1A1B1C' },
  pageSubtitle: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  headerBar: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1A1B1C' },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  loadMoreText: { fontSize: 13, fontWeight: '700', color: '#F4C430' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    paddingHorizontal: 14,
    height: 38,
    justifyContent: 'center',
  },
  addBtnText: { color: '#1A1B1C', fontWeight: '800', fontSize: 13 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  importBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.button,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#1A1B1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: { gap: 8, paddingBottom: 40 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1A1B1C', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 4, lineHeight: 16 },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: '#1A1B1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  userDetails: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '700', color: '#1A1B1C' },
  userEmail: { fontSize: 12, color: '#6B6B6B', marginTop: 1 },
  userMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  resetPwdBtn: {
    width: 34,
    height: 34,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 20, gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1B1C' },
  sectionHeader: { fontSize: 11, fontWeight: '800', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  formDivider: { height: 1, backgroundColor: '#F0EDE4', marginVertical: 12 },
  nameRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  nameField: { flex: 1, gap: 4 },
  formGroup: { gap: 4, marginBottom: 10 },
  formRow: { marginBottom: 0 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1B1C' },
  input: { height: 44, borderWidth: 1, borderColor: '#E8E5DC', borderRadius: BorderRadius.input, paddingHorizontal: 12, fontSize: 13, backgroundColor: '#FFFDF7', color: '#1A1B1C' },
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderWidth: 1,
    borderColor: '#E8E5DC', borderRadius: BorderRadius.input, paddingHorizontal: 12, backgroundColor: '#FFFDF7',
  },
  inputIconText: { flex: 1, fontSize: 13, color: '#1A1B1C' },
  hintText: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 6,
  },
  feeRowBody: { flex: 1, marginLeft: 10, marginRight: 8 },
  feeRowTitle: { fontSize: 13, fontWeight: '700', color: '#1A1B1C' },
  feeRowMeta: { fontSize: 11, color: '#6B6B6B', marginTop: 1 },
  feeRowAmount: { fontSize: 13, fontWeight: '800', color: '#1A1B1C' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#6B6B6B', fontWeight: '700', fontSize: 13 },
  submitBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#F4C430', borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  submitText: { color: '#1A1B1C', fontWeight: '800', fontSize: 13 },
});