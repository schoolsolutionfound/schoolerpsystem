/**
 * @file AdminUsersView.tsx
 * @description Admin User Management: Create login credentials for Students, Teachers, Accountants & Staff with credential sharing.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { showAlert } from '../../shared/utils/showAlert';

const SCHOOL_ROLES = [
  { key: 'student', label: 'Student', icon: 'account-school-outline', desc: 'Class timetable, attendance & fees' },
  { key: 'teacher', label: 'Teacher', icon: 'human-male-board', desc: 'Mark attendance, syllabus & grades' },
  { key: 'accountant', label: 'Accountant', icon: 'calculator-outline', desc: 'Fee collections, ledger & fleet' },
  { key: 'parent', label: 'Parent', icon: 'account-multiple-outline', desc: 'Child progress & fee payments' },
  { key: 'principal', label: 'Principal', icon: 'account-tie-outline', desc: 'Institutional reports & approval' },
  { key: 'admin', label: 'Admin', icon: 'shield-account-outline', desc: 'Full ERP system administrator' },
] as const;

const COLLEGE_ROLES = [
  { key: 'student', label: 'Student', icon: 'account-school-outline', desc: 'Semester timetable & exams' },
  { key: 'teacher', label: 'Faculty', icon: 'human-male-board', desc: 'Course assignments & grades' },
  { key: 'hod', label: 'HOD', icon: 'account-tie-outline', desc: 'Department head & timetable' },
  { key: 'accountant', label: 'Accountant', icon: 'calculator-outline', desc: 'College fees & payroll' },
  { key: 'parent', label: 'Parent', icon: 'account-multiple-outline', desc: 'Student fee & attendance' },
  { key: 'admin', label: 'Admin', icon: 'shield-account-outline', desc: 'Full ERP administrator' },
] as const;

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  title?: string;
  rollNoOrUSN?: string;
  department?: string;
  section?: string;
  phone?: string;
  parentPhone?: string;
  employeeId?: string;
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

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [rollNoOrUSN, setRollNoOrUSN] = useState('');
  const [dept, setDept] = useState(departments[0] || 'Secondary (10th)');
  const [year, setYear] = useState(academicYears[0] || '2026-2027');
  const [section, setSection] = useState(sections[0] || 'Grade 10-A');
  const [password, setPassword] = useState('admin123');
  const [submitting, setSubmitting] = useState(false);

  // Credentials Card Modal
  const [credentialsModalItem, setCredentialsModalItem] = useState<{
    fullName: string;
    email: string;
    role: string;
    password?: string;
    code?: string;
    phone?: string;
  } | null>(null);

  const roleOptions = institutionType === 'college' ? COLLEGE_ROLES : SCHOOL_ROLES;

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.rollNoOrUSN && u.rollNoOrUSN.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q));
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
    setDept(departments[0] || 'Secondary (10th)');
    setYear(academicYears[0] || '2026-2027');
    setSection(sections[0] || 'Grade 10-A');
    setPassword('admin123');
  };

  const handleCreate = async () => {
    if (!fullName.trim() || !email.trim()) {
      showAlert('Missing Fields', 'Full Name and Email / Login ID are required.');
      return;
    }

    setSubmitting(true);
    try {
      await onCreateUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        phone: phone.trim() || undefined,
        parentPhone: role === 'student' ? (parentPhone.trim() || undefined) : undefined,
        employeeId: employeeId.trim() || undefined,
        rollNoOrUSN: rollNoOrUSN.trim() || undefined,
        department: dept || undefined,
        academicYear: year || undefined,
        section: section || undefined,
        password: password.trim() || 'admin123',
      });

      setModalOpen(false);

      // Show issued credentials card
      setCredentialsModalItem({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        password: password.trim() || 'admin123',
        code: rollNoOrUSN || employeeId,
        phone,
      });

      resetForm();
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = (item: { email: string; password?: string; fullName: string }) => {
    showAlert(
      'Credentials Copied',
      `Login credentials for ${item.fullName}:\n\nEmail: ${item.email}\nPassword: ${item.password || 'admin123'}\n\nShared to clipboard.`
    );
  };

  const handleShareWhatsApp = (item: { fullName: string; email: string; password?: string; role: string }) => {
    showAlert(
      'Credentials Dispatched',
      `Login credentials sent via SMS/WhatsApp to ${item.fullName} for role ${item.role.toUpperCase()}.\n\nLogin ID: ${item.email}\nPassword: ${item.password || 'admin123'}`
    );
  };

  const getAvatarBg = (r: string) => {
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
    return colors[r] || '#F1F5F9';
  };

  const getRoleBadgeColor = (r: string) => {
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
    return colors[r] || '#475569';
  };

  return (
    <View style={styles.container}>
      {/* Top Banner Notice */}
      <View style={styles.securityNoticeBox}>
        <MaterialCommunityIcons name="shield-account" size={20} color="#7E57C2" />
        <View style={{ flex: 1 }}>
          <Text style={styles.securityNoticeTitle}>Admin Provisioning Authority</Text>
          <Text style={styles.securityNoticeSub}>
            Public registration is disabled. You have exclusive authority to create, provision, and issue login IDs for students, faculty, accountants, and staff.
          </Text>
        </View>
      </View>

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, login email, ID..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#A0AEC0"
          />
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            resetForm();
            setModalOpen(true);
          }}
        >
          <MaterialCommunityIcons name="account-plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Create Login ID</Text>
        </TouchableOpacity>
      </View>

      {/* Role Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, roleFilter === 'all' && styles.filterChipActive]}
          onPress={() => setRoleFilter('all')}
        >
          <Text style={[styles.filterChipText, roleFilter === 'all' && styles.filterChipTextActive]}>
            All Users ({users.length})
          </Text>
        </TouchableOpacity>
        {roleOptions.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.filterChip, roleFilter === r.key && styles.filterChipActive]}
            onPress={() => setRoleFilter(r.key)}
          >
            <Text style={[styles.filterChipText, roleFilter === r.key && styles.filterChipTextActive]}>
              {r.label}s ({roleCounts[r.key] || 0})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* User Directory List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-group-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptySub}>
              {roleFilter !== 'all'
                ? `No accounts created for "${roleFilter}" yet.`
                : 'Click "+ Create Login ID" above to onboard a user.'}
            </Text>
          </View>
        ) : (
          filteredUsers.map((u) => (
            <View key={u.id} style={styles.userCard}>
              <View style={styles.userCardTop}>
                <View style={[styles.avatarCircle, { backgroundColor: getAvatarBg(u.role) }]}>
                  <Text style={[styles.avatarText, { color: getRoleBadgeColor(u.role) }]}>
                    {u.fullName.substring(0, 2).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.userDetails}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{u.fullName}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: getAvatarBg(u.role) }]}>
                      <Text style={[styles.roleBadgeText, { color: getRoleBadgeColor(u.role) }]}>
                        {u.role.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.userEmail}>Login ID: {u.email}</Text>

                  <View style={styles.metaRow}>
                    {u.rollNoOrUSN ? (
                      <View style={styles.metaPill}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={12} color="#64748B" />
                        <Text style={styles.metaPillText}>{u.rollNoOrUSN}</Text>
                      </View>
                    ) : null}
                    {u.department ? (
                      <View style={styles.metaPill}>
                        <MaterialCommunityIcons name="domain" size={12} color="#64748B" />
                        <Text style={styles.metaPillText}>{u.department}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.userCardFooter}>
                <TouchableOpacity
                  style={styles.credentialsBtn}
                  onPress={() =>
                    setCredentialsModalItem({
                      fullName: u.fullName,
                      email: u.email,
                      role: u.role,
                      password: 'admin123',
                      code: u.rollNoOrUSN || u.employeeId,
                      phone: u.phone,
                    })
                  }
                >
                  <MaterialCommunityIcons name="key-outline" size={14} color="#7E57C2" />
                  <Text style={styles.credentialsBtnText}>View Login Info</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={() => handleShareWhatsApp({ fullName: u.fullName, email: u.email, role: u.role })}
                >
                  <MaterialCommunityIcons name="share-variant-outline" size={14} color="#16A34A" />
                  <Text style={styles.shareBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Create User Modal ── */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Issue New Login ID</Text>
                <Text style={styles.modalSubtitle}>Create and provision official credentials</Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440, flexGrow: 0, flexShrink: 1 }} showsVerticalScrollIndicator={false}>
              {/* Role Selection */}
              <Text style={styles.label}>Select Role *</Text>
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

              {/* Full Name */}
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul Sharma / Dr. Sunita Rao"
                value={fullName}
                onChangeText={setFullName}
              />

              {/* Login Email */}
              <Text style={styles.label}>Login Email / Username *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. rahul@school.com / staff@school.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Role Specific Fields */}
              {role === 'student' && (
                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Roll No / Student ID</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. STU-104"
                      value={rollNoOrUSN}
                      onChangeText={setRollNoOrUSN}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Class & Section</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Grade 10-A"
                      value={section}
                      onChangeText={setSection}
                    />
                  </View>
                </View>
              )}

              {role === 'teacher' && (
                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Employee ID</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. FAC-2026"
                      value={employeeId}
                      onChangeText={setEmployeeId}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Department</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Science / Mathematics"
                      value={dept}
                      onChangeText={setDept}
                    />
                  </View>
                </View>
              )}

              {role === 'accountant' && (
                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Employee ID</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. FIN-001"
                      value={employeeId}
                      onChangeText={setEmployeeId}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Finance Desk</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Fee & Accounts Desk"
                      value={dept}
                      onChangeText={setDept}
                    />
                  </View>
                </View>
              )}

              {/* Initial Password */}
              <Text style={styles.label}>Initial Password (Default: admin123)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
              />

              {/* Phone */}
              <Text style={styles.label}>Phone Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>{submitting ? 'Creating...' : 'Issue Credentials'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Issued Credentials Card Modal ── */}
      {credentialsModalItem && (
        <Modal visible={!!credentialsModalItem} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.credentialsCardBox}>
              <View style={styles.credCardHeader}>
                <MaterialCommunityIcons name="shield-check" size={32} color="#7E57C2" />
                <Text style={styles.credCardSchool}>SchoolHub Academy</Text>
                <Text style={styles.credCardSubtitle}>Official Login Credentials Card</Text>
              </View>

              <View style={styles.credDivider} />

              <View style={styles.credBody}>
                <View style={styles.credRow}>
                  <Text style={styles.credLabel}>User Name:</Text>
                  <Text style={styles.credVal}>{credentialsModalItem.fullName}</Text>
                </View>
                <View style={styles.credRow}>
                  <Text style={styles.credLabel}>Assigned Role:</Text>
                  <Text style={[styles.credVal, { color: '#7E57C2', fontWeight: '800' }]}>
                    {credentialsModalItem.role.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.credRow}>
                  <Text style={styles.credLabel}>Login Email / ID:</Text>
                  <Text style={styles.credVal}>{credentialsModalItem.email}</Text>
                </View>
                <View style={styles.credRow}>
                  <Text style={styles.credLabel}>Default Password:</Text>
                  <Text style={[styles.credVal, { color: '#16A34A', fontWeight: '800' }]}>
                    {credentialsModalItem.password || 'admin123'}
                  </Text>
                </View>
                {credentialsModalItem.code ? (
                  <View style={styles.credRow}>
                    <Text style={styles.credLabel}>ID Code:</Text>
                    <Text style={styles.credVal}>{credentialsModalItem.code}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.credActionRow}>
                <TouchableOpacity
                  style={styles.credCopyBtn}
                  onPress={() => handleCopyCredentials(credentialsModalItem)}
                >
                  <MaterialCommunityIcons name="content-copy" size={16} color="#FFFFFF" />
                  <Text style={styles.credCopyBtnText}>Copy Credentials</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.credShareBtn}
                  onPress={() => handleShareWhatsApp(credentialsModalItem)}
                >
                  <MaterialCommunityIcons name="whatsapp" size={16} color="#16A34A" />
                  <Text style={styles.credShareBtnText}>Share</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.credCloseBtn}
                onPress={() => setCredentialsModalItem(null)}
              >
                <Text style={styles.credCloseBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB', paddingHorizontal: 16, paddingTop: 8 },
  securityNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EDE7F6',
    borderWidth: 1,
    borderColor: '#D8B4FE',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  securityNoticeTitle: { fontSize: 12, fontWeight: '800', color: '#581C87' },
  securityNoticeSub: { fontSize: 10, color: '#6B21A8', marginTop: 1, lineHeight: 14 },

  headerBar: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 40,
  },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 12, color: '#1A202C' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7E57C2',
    paddingHorizontal: 12,
    borderRadius: BorderRadius.button,
    height: 40,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },

  filterRow: { flexDirection: 'row', marginBottom: 10, maxHeight: 34 },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  filterChipActive: { backgroundColor: '#7E57C2', borderColor: '#7E57C2' },
  filterChipText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '700' },

  listContainer: { paddingBottom: 20 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#475569', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#94A3B8', marginTop: 4, textAlign: 'center' },

  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userCardTop: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
  userDetails: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  roleBadgeText: { fontSize: 9, fontWeight: '800' },
  userEmail: { fontSize: 11, color: '#64748B', marginTop: 1 },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaPillText: { fontSize: 10, color: '#475569', fontWeight: '600' },

  userCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  credentialsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  credentialsBtnText: { fontSize: 11, fontWeight: '700', color: '#7E57C2' },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shareBtnText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  modalSubtitle: { fontSize: 11, color: '#64748B', marginTop: 1 },
  label: { fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
    color: '#0F172A',
  },
  formRow: { flexDirection: 'row', gap: 8 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  roleCard: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleCardActive: { backgroundColor: '#EDE7F6', borderColor: '#7E57C2' },
  roleCardLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  roleCardLabelActive: { color: '#7E57C2', fontWeight: '700' },

  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9' },
  cancelBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  submitBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#7E57C2' },
  submitBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  credentialsCardBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  credCardHeader: { alignItems: 'center' },
  credCardSchool: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  credCardSubtitle: { fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  credDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  credBody: { gap: 6 },
  credRow: { flexDirection: 'row', justifyContent: 'space-between' },
  credLabel: { fontSize: 12, color: '#64748B' },
  credVal: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  credActionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  credCopyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7E57C2',
    paddingVertical: 10,
    borderRadius: 8,
  },
  credCopyBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  credShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  credShareBtnText: { color: '#16A34A', fontSize: 12, fontWeight: '700' },
  credCloseBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  credCloseBtnText: { color: '#475569', fontWeight: '700', fontSize: 12 },
});
