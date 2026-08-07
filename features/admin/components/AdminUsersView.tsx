import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

const SCHOOL_ROLES = [
  { key: 'admin', label: 'Admin', icon: 'shield-account-outline' },
  { key: 'principal', label: 'Principal', icon: 'account-tie-outline' },
  { key: 'teacher', label: 'Teacher', icon: 'human-male-board' },
  { key: 'student', label: 'Student', icon: 'account-school-outline' },
  { key: 'parent', label: 'Parent', icon: 'account-multiple-outline' },
  { key: 'accountant', label: 'Accountant', icon: 'calculator-outline' },
  { key: 'librarian', label: 'Librarian', icon: 'book-outline' },
] as const;

const COLLEGE_ROLES = [
  { key: 'admin', label: 'Admin', icon: 'shield-account-outline' },
  { key: 'hod', label: 'HOD', icon: 'account-tie-outline' },
  { key: 'teacher', label: 'Teacher', icon: 'human-male-board' },
  { key: 'student', label: 'Student', icon: 'account-school-outline' },
  { key: 'parent', label: 'Parent', icon: 'account-multiple-outline' },
  { key: 'accountant', label: 'Accountant', icon: 'calculator-outline' },
  { key: 'librarian', label: 'Librarian', icon: 'book-outline' },
] as const;

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

interface AdminUsersViewProps {
  users: UserItem[];
  institutionType: 'school' | 'college';
  departments: string[];
  academicYears: string[];
  sections: string[];
  onCreateUser: (user: {
    fullName: string;
    email: string;
    role: string;
    phone?: string;
    parentPhone?: string;
    employeeId?: string;
    rollNoOrUSN?: string;
    department?: string;
    academicYear?: string;
    section?: string;
    title?: string;
    password?: string;
  }) => Promise<void>;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  users,
  institutionType,
  departments,
  academicYears,
  sections,
  onCreateUser,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [rollNoOrUSN, setRollNoOrUSN] = useState('');
  const [dept, setDept] = useState(departments[0] || '');
  const [year, setYear] = useState(academicYears[0] || '');
  const [section, setSection] = useState(sections[0] || '');
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('TempPass123!');
  const [submitting, setSubmitting] = useState(false);

  const roleOptions = institutionType === 'college' ? COLLEGE_ROLES : SCHOOL_ROLES;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setRole('student');
    setPhone('');
    setParentPhone('');
    setEmployeeId('');
    setRollNoOrUSN('');
    setDept(departments[0] || '');
    setYear(academicYears[0] || '');
    setSection(sections[0] || '');
    setTitle('');
    setPassword('TempPass123!');
  };

  const handleCreate = async () => {
    if (!fullName || !email) {
      Alert.alert('Missing Fields', 'Full Name and Email are required.');
      return;
    }

    setSubmitting(true);
    try {
      await onCreateUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        phone: phone || undefined,
        parentPhone: role === 'student' ? (parentPhone || undefined) : undefined,
        employeeId: employeeId || undefined,
        rollNoOrUSN: rollNoOrUSN || undefined,
        department: dept || undefined,
        academicYear: year || undefined,
        section: section || undefined,
        title: title || undefined,
        password: password || undefined,
      });
      setModalOpen(false);
      resetForm();
      Alert.alert('Success', `${role.charAt(0).toUpperCase() + role.slice(1)} account created! They can log in using their email and temporary password.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = (r: string) => {
    const found = roleOptions.find((o) => o.key === r);
    return found?.icon || 'account-outline';
  };

  const getAvatarBg = (role: string) => {
    const colors: Record<string, string> = {
      admin: '#EDE7F6',
      principal: '#FEF3C7',
      hod: '#FEF3C7',
      teacher: '#E0F2FE',
      student: '#EDE7F6',
      parent: '#DCFCE7',
      accountant: '#FCE4EC',
      librarian: '#F3E8FF',
    };
    return colors[role] || '#F1F5F9';
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: '#7E57C2',
      principal: '#D97706',
      hod: '#D97706',
      teacher: '#0284C7',
      student: '#7E57C2',
      parent: '#16A34A',
      accountant: '#DB2777',
      librarian: '#9333EA',
    };
    return colors[role] || '#475569';
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalOpen(true); }}>
          <Text style={styles.addBtnText}>+ Create User</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, roleFilter === 'all' && styles.filterChipActive]}
          onPress={() => setRoleFilter('all')}
        >
          <Text style={[styles.filterChipText, roleFilter === 'all' && styles.filterChipTextActive]}>
            All ({users.length})
          </Text>
        </TouchableOpacity>
        {roleOptions.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.filterChip, roleFilter === r.key && styles.filterChipActive]}
            onPress={() => setRoleFilter(r.key)}
          >
            <Text style={[styles.filterChipText, roleFilter === r.key && styles.filterChipTextActive]}>
              {r.label} ({roleCounts[r.key] || 0})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-group-outline" size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptySub}>
              {roleFilter !== 'all'
                ? `No users with role "${roleFilter}" exist yet.`
                : 'Click "+ Create User" above to onboard someone.'}
            </Text>
          </View>
        ) : (
          filteredUsers.map((u) => (
            <View key={u.id} style={styles.userCard}>
              <View style={[styles.avatarCircle, { backgroundColor: getAvatarBg(u.role) }]}>
                <Text style={[styles.avatarText, { color: getRoleBadgeColor(u.role) }]}>
                  {u.fullName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{u.fullName}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
                <View style={styles.badgeRow}>
                  <Text style={[styles.roleBadge, { backgroundColor: getAvatarBg(u.role), color: getRoleBadgeColor(u.role) }]}>
                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                  </Text>
                  {u.rollNoOrUSN ? (
                    <Text style={styles.codeBadge}>{u.rollNoOrUSN}</Text>
                  ) : null}
                  {u.department ? (
                    <Text style={styles.deptBadge}>{u.department}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create User</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Role *</Text>
                <View style={styles.roleGrid}>
                  {roleOptions.map((r) => (
                    <TouchableOpacity
                      key={r.key}
                      style={[styles.roleCard, role === r.key && styles.roleCardActive]}
                      onPress={() => setRole(r.key)}
                    >
                      <MaterialCommunityIcons
                        name={r.icon as any}
                        size={20}
                        color={role === r.key ? '#7E57C2' : '#94A3B8'}
                      />
                      <Text style={[styles.roleCardLabel, role === r.key && styles.roleCardLabelActive]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput style={styles.input} placeholder="e.g. Aarav Sharma" value={fullName} onChangeText={setFullName} />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Email *</Text>
                  <TextInput style={styles.input} placeholder="user@institution.edu" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>
              </View>

              {role === 'student' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>USN / Roll Number</Text>
                    <TextInput style={styles.input} placeholder="USN23CS101" value={rollNoOrUSN} onChangeText={setRollNoOrUSN} />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Parent Phone</Text>
                    <TextInput style={styles.input} placeholder="+91 9876543210" value={parentPhone} onChangeText={setParentPhone} keyboardType="phone-pad" />
                  </View>
                </>
              )}

              {role === 'teacher' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Employee ID</Text>
                  <TextInput style={styles.input} placeholder="EMP101" value={employeeId} onChangeText={setEmployeeId} />
                </View>
              )}

              {role !== 'student' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput style={styles.input} placeholder="+1 555-0199" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
              )}

              {(role === 'principal' || role === 'hod' || role === 'admin') && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Title</Text>
                  <TextInput style={styles.input} placeholder="e.g. School Principal" value={title} onChangeText={setTitle} />
                </View>
              )}

              {departments.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Department</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {departments.map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.chip, dept === d && styles.chipActive]}
                          onPress={() => setDept(d)}
                        >
                          <Text style={[styles.chipText, dept === d && styles.chipTextActive]}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {role === 'student' && academicYears.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Academic Year</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {academicYears.map((y) => (
                        <TouchableOpacity
                          key={y}
                          style={[styles.chip, year === y && styles.chipActive]}
                          onPress={() => setYear(y)}
                        >
                          <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {role === 'student' && sections.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Section</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {sections.map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.chip, section === s && styles.chipActive]}
                          onPress={() => setSection(s)}
                        >
                          <Text style={[styles.chipText, section === s && styles.chipTextActive]}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Temporary Password</Text>
                <TextInput style={styles.input} value={password} onChangeText={setPassword} />
                <Text style={styles.hintText}>User will be prompted to change password on first login.</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create User'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerBar: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1A202C' },
  addBtn: {
    backgroundColor: '#7E57C2',
    borderRadius: BorderRadius.button,
    paddingHorizontal: 16,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  filterRow: { marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#7E57C2', borderColor: '#7E57C2' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF' },
  listContainer: { gap: 10, paddingBottom: 40 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1A202C', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#718096', textAlign: 'center', marginTop: 4, lineHeight: 16 },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800' },
  userDetails: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  userEmail: { fontSize: 12, color: '#718096', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontWeight: '700' },
  codeBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontWeight: '700', color: '#475569' },
  deptBadge: { backgroundColor: '#EDE7F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontWeight: '700', color: '#7E57C2' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 20, gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A202C' },
  formGroup: { gap: 4, marginBottom: 10 },
  formRow: { marginBottom: 0 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A202C' },
  input: { height: 44, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: BorderRadius.input, paddingHorizontal: 12, fontSize: 13, backgroundColor: '#F8F9FB' },
  hintText: { fontSize: 11, color: '#718096', marginTop: 2 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.button,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  roleCardActive: { borderColor: '#7E57C2', backgroundColor: '#FAF5FF' },
  roleCardLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  roleCardLabelActive: { color: '#7E57C2', fontWeight: '700' },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.chip, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive: { backgroundColor: '#7E57C2', borderColor: '#7E57C2' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  chipTextActive: { color: '#FFFFFF' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  submitBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#7E57C2', borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
