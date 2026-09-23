import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

const SCHOOL_ROLES = [
  { key: 'admin', label: 'Admin', icon: 'shield-account-outline' },
  { key: 'principal', label: 'Principal', icon: 'account-tie-outline' },
  { key: 'admission_officer', label: 'Admission Officer', icon: 'account-plus-outline' },
  { key: 'accountant', label: 'Accountant', icon: 'calculator-outline' },
  { key: 'teacher', label: 'Teacher', icon: 'human-male-board' },
  { key: 'student', label: 'Student', icon: 'account-school-outline' },
  { key: 'parent', label: 'Parent', icon: 'account-multiple-outline' },
  { key: 'librarian', label: 'Librarian', icon: 'book-outline' },
  { key: 'driver', label: 'Driver', icon: 'bus' },
] as const;

const COLLEGE_ROLES = [
  { key: 'admin', label: 'Admin', icon: 'shield-account-outline' },
  { key: 'hod', label: 'HOD', icon: 'account-tie-outline' },
  { key: 'admission_officer', label: 'Admission Officer', icon: 'account-plus-outline' },
  { key: 'accountant', label: 'Accountant', icon: 'calculator-outline' },
  { key: 'teacher', label: 'Teacher', icon: 'human-male-board' },
  { key: 'student', label: 'Student', icon: 'account-school-outline' },
  { key: 'parent', label: 'Parent', icon: 'account-multiple-outline' },
  { key: 'librarian', label: 'Librarian', icon: 'book-outline' },
  { key: 'driver', label: 'Driver', icon: 'bus' },
] as const;

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  roles?: string[];
  title?: string;
  rollNoOrUSN?: string;
  department?: string;
  phone?: string;
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
    roles?: string[];
    phone?: string;
    parentPhone?: string;
    employeeId?: string;
    rollNoOrUSN?: string;
    department?: string;
    academicYear?: string;
    section?: string;
    title?: string;
    vehicleNumber?: string;
    licenseNumber?: string;
    password?: string;
  }) => Promise<void>;
  onUpdateUser?: (
    id: string,
    updates: {
      fullName?: string;
      role?: string;
      roles?: string[];
      phone?: string;
      department?: string;
      title?: string;
    }
  ) => Promise<void>;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  users,
  institutionType,
  departments,
  academicYears,
  sections,
  onCreateUser,
  onUpdateUser,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);

  // Create form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['student']);
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [rollNoOrUSN, setRollNoOrUSN] = useState('');
  const [dept, setDept] = useState(departments[0] || '');
  const [year, setYear] = useState(academicYears[0] || '');
  const [section, setSection] = useState(sections[0] || '');
  const [title, setTitle] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [password, setPassword] = useState('TempPass123!');
  const [submitting, setSubmitting] = useState(false);

  // Edit / Promote modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editingRoles, setEditingRoles] = useState<string[]>([]);
  const [editPrimaryRole, setEditPrimaryRole] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const roleOptions = institutionType === 'college' ? COLLEGE_ROLES : SCHOOL_ROLES;

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const userRoles = (u.roles && u.roles.length > 0) ? u.roles : [u.role];
    const matchesRole = roleFilter === 'all' || u.role === roleFilter || userRoles.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  const roleCounts = users.reduce(
    (acc, u) => {
      const uRoles = (u.roles && u.roles.length > 0) ? u.roles : [u.role];
      uRoles.forEach((r) => {
        acc[r] = (acc[r] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  const toggleCreateRole = (roleKey: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleKey)) {
        if (prev.length <= 1) return prev; // keep at least one
        return prev.filter((r) => r !== roleKey);
      } else {
        return [...prev, roleKey];
      }
    });
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setSelectedRoles(['student']);
    setPhone('');
    setParentPhone('');
    setEmployeeId('');
    setRollNoOrUSN('');
    setDept(departments[0] || '');
    setYear(academicYears[0] || '');
    setSection(sections[0] || '');
    setTitle('');
    setVehicleNumber('');
    setLicenseNumber('');
    setPassword('TempPass123!');
  };

  const handleCreate = async () => {
    if (!fullName || !email) {
      Alert.alert('Missing Fields', 'Full Name and Email are required.');
      return;
    }
    if (selectedRoles.length === 0) {
      Alert.alert('Missing Role', 'Please select at least one role.');
      return;
    }

    const primaryRole = selectedRoles[0];
    setSubmitting(true);
    try {
      await onCreateUser({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: primaryRole,
        roles: selectedRoles,
        phone: phone || undefined,
        parentPhone: selectedRoles.includes('student') ? (parentPhone || undefined) : undefined,
        employeeId: employeeId || undefined,
        rollNoOrUSN: rollNoOrUSN || undefined,
        department: dept || undefined,
        academicYear: year || undefined,
        section: section || undefined,
        title: title || undefined,
        vehicleNumber: selectedRoles.includes('driver') ? (vehicleNumber || undefined) : undefined,
        licenseNumber: selectedRoles.includes('driver') ? (licenseNumber || undefined) : undefined,
        password: password || undefined,
      });
      setModalOpen(false);
      resetForm();
      Alert.alert(
        'Success',
        `User account created with ${selectedRoles.length > 1 ? `${selectedRoles.length} roles` : selectedRoles[0]}! They can log in using their email and temporary password.`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (u: UserItem) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditPhone(u.phone || '');
    setEditTitle(u.title || '');
    setEditDept(u.department || '');
    const userRoles = (u.roles && u.roles.length > 0) ? u.roles : [u.role];
    setEditingRoles(userRoles);
    setEditPrimaryRole(u.role || userRoles[0]);
    setEditModalOpen(true);
  };

  const toggleEditRole = (roleKey: string) => {
    setEditingRoles((prev) => {
      if (prev.includes(roleKey)) {
        if (prev.length <= 1) {
          Alert.alert('Minimum Role Required', 'A user must have at least one role.');
          return prev;
        }
        const filtered = prev.filter((r) => r !== roleKey);
        if (editPrimaryRole === roleKey) {
          setEditPrimaryRole(filtered[0]);
        }
        return filtered;
      } else {
        return [...prev, roleKey];
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !onUpdateUser) return;
    if (editingRoles.length === 0) {
      Alert.alert('Missing Role', 'Please select at least one role.');
      return;
    }

    setEditSubmitting(true);
    try {
      await onUpdateUser(editingUser.id, {
        fullName: editFullName.trim(),
        phone: editPhone.trim() || undefined,
        title: editTitle.trim() || undefined,
        department: editDept || undefined,
        role: editPrimaryRole || editingRoles[0],
        roles: editingRoles,
      });
      setEditModalOpen(false);
      Alert.alert('Roles Updated', 'User roles and promotion settings have been saved successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update user roles');
    } finally {
      setEditSubmitting(false);
    }
  };

  const getAvatarBg = (role: string) => {
    const colors: Record<string, string> = {
      admin: '#FFF4C7',
      principal: '#FEF3C7',
      hod: '#FEF3C7',
      teacher: '#FFFDF7',
      student: '#FFF4C7',
      parent: '#DCFCE7',
      accountant: '#FCE7F3',
      admission_officer: '#E0F2FE',
      librarian: '#FFF4C7',
      driver: '#E0F2FE',
    };
    return colors[role] || '#FFFDF7';
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: '#B45309',
      principal: '#D97706',
      hod: '#D97706',
      teacher: '#171717',
      student: '#B45309',
      parent: '#16A34A',
      accountant: '#BE185D',
      admission_officer: '#0284C7',
      librarian: '#B45309',
      driver: '#0EA5E9',
    };
    return colors[role] || '#6B6B6B';
  };

  return (
    <View style={styles.container}>
      {/* Search and Action Bar */}
      <View style={styles.headerBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6B6B6B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalOpen(true); }}>
          <MaterialCommunityIcons name="account-plus" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>+ Create User</Text>
        </TouchableOpacity>
      </View>

      {/* Role Filter Chips */}
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

      {/* User Cards List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
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
            const userRoles = (u.roles && u.roles.length > 0) ? u.roles : [u.role];
            return (
              <View key={u.id} style={styles.userCard}>
                <View style={[styles.avatarCircle, { backgroundColor: getAvatarBg(u.role) }]}>
                  <Text style={[styles.avatarText, { color: getRoleBadgeColor(u.role) }]}>
                    {u.fullName.substring(0, 2).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.userDetails}>
                  <View style={styles.userTopRow}>
                    <Text style={styles.userName}>{u.fullName}</Text>
                    {onUpdateUser ? (
                      <TouchableOpacity
                        style={styles.editActionBtn}
                        onPress={() => openEditModal(u)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="shield-edit-outline" size={15} color="#0284C7" />
                        <Text style={styles.editActionText}>Edit / Promote</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <Text style={styles.userEmail}>{u.email}</Text>

                  {/* Multi-role badges */}
                  <View style={styles.badgeRow}>
                    {userRoles.map((r) => (
                      <View
                        key={r}
                        style={[
                          styles.roleBadgeContainer,
                          { backgroundColor: getAvatarBg(r) },
                          r === u.role && styles.primaryRoleBadgeBorder,
                        ]}
                      >
                        <Text style={[styles.roleBadge, { color: getRoleBadgeColor(r) }]}>
                          {r.replace('_', ' ').toUpperCase()}
                          {userRoles.length > 1 && r === u.role ? ' (PRIMARY)' : ''}
                        </Text>
                      </View>
                    ))}
                    {u.rollNoOrUSN ? (
                      <Text style={styles.codeBadge}>{u.rollNoOrUSN}</Text>
                    ) : null}
                    {u.department ? (
                      <Text style={styles.deptBadge}>{u.department}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* CREATE USER MODAL WITH MULTI-ROLE SELECTION */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Create New User</Text>
                <Text style={styles.modalSubtitle}>Assign one or multiple roles to this account</Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <View style={styles.roleHeaderRow}>
                  <Text style={styles.label}>Select Roles * (Can select multiple)</Text>
                  <Text style={styles.selectedCountBadge}>{selectedRoles.length} selected</Text>
                </View>
                <View style={styles.roleGrid}>
                  {roleOptions.map((r) => {
                    const isSelected = selectedRoles.includes(r.key);
                    return (
                      <TouchableOpacity
                        key={r.key}
                        style={[styles.roleCard, isSelected && styles.roleCardActive]}
                        onPress={() => toggleCreateRole(r.key)}
                      >
                        <MaterialCommunityIcons
                          name={r.icon as any}
                          size={18}
                          color={isSelected ? '#0284C7' : '#6B6B6B'}
                        />
                        <Text style={[styles.roleCardLabel, isSelected && styles.roleCardLabelActive]}>
                          {r.label}
                        </Text>
                        {isSelected ? (
                          <MaterialCommunityIcons name="check-circle" size={14} color="#0284C7" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.helperTip}>
                  Tip: A staff member can be both Accountant and Admission Officer under the same login!
                </Text>
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

              {selectedRoles.includes('student') && (
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

              {selectedRoles.includes('teacher') && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Employee ID</Text>
                  <TextInput style={styles.input} placeholder="EMP101" value={employeeId} onChangeText={setEmployeeId} />
                </View>
              )}

              {selectedRoles.includes('driver') && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Vehicle Number</Text>
                    <TextInput style={styles.input} placeholder="KA01AB1234" value={vehicleNumber} onChangeText={setVehicleNumber} autoCapitalize="characters" />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>License Number</Text>
                    <TextInput style={styles.input} placeholder="KA-2023-0012345" value={licenseNumber} onChangeText={setLicenseNumber} autoCapitalize="characters" />
                  </View>
                </>
              )}

              {!selectedRoles.includes('student') && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput style={styles.input} placeholder="+91 9876543210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
              )}

              {(selectedRoles.includes('principal') || selectedRoles.includes('hod') || selectedRoles.includes('admin') || selectedRoles.includes('admission_officer')) && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Title / Designation</Text>
                  <TextInput style={styles.input} placeholder="e.g. Head of Admissions & Finance" value={title} onChangeText={setTitle} />
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

              {selectedRoles.includes('student') && academicYears.length > 0 && (
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

              {selectedRoles.includes('student') && sections.length > 0 && (
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

      {/* EDIT ROLES & PROMOTION MODAL */}
      <Modal visible={editModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Roles & Promote User</Text>
                <Text style={styles.modalSubtitle}>{editingUser?.email}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* Role toggles */}
              <View style={styles.formGroup}>
                <View style={styles.roleHeaderRow}>
                  <Text style={styles.label}>Assigned Roles (Toggle to Add/Remove)</Text>
                  <Text style={styles.selectedCountBadge}>{editingRoles.length} Active</Text>
                </View>
                <View style={styles.roleGrid}>
                  {roleOptions.map((r) => {
                    const isAssigned = editingRoles.includes(r.key);
                    const isPrimary = editPrimaryRole === r.key;
                    return (
                      <TouchableOpacity
                        key={r.key}
                        style={[
                          styles.roleCard,
                          isAssigned && styles.roleCardActive,
                          isPrimary && styles.roleCardPrimaryActive,
                        ]}
                        onPress={() => toggleEditRole(r.key)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name={r.icon as any}
                          size={18}
                          color={isAssigned ? '#0284C7' : '#6B6B6B'}
                        />
                        <Text style={[styles.roleCardLabel, isAssigned && styles.roleCardLabelActive]}>
                          {r.label}
                        </Text>
                        {isAssigned ? (
                          <MaterialCommunityIcons name="check-circle" size={14} color="#0284C7" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Primary Role Selector */}
              {editingRoles.length > 1 && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Primary Role (Default Workspace)</Text>
                  <View style={styles.chipRow}>
                    {editingRoles.map((rk) => {
                      const opt = roleOptions.find((o) => o.key === rk);
                      const isPrimary = editPrimaryRole === rk;
                      return (
                        <TouchableOpacity
                          key={rk}
                          style={[styles.primaryChip, isPrimary && styles.primaryChipActive]}
                          onPress={() => setEditPrimaryRole(rk)}
                        >
                          <Text style={[styles.primaryChipText, isPrimary && styles.primaryChipTextActive]}>
                            {opt?.label || rk} {isPrimary ? '★' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Full Name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Phone"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Title / Designation</Text>
                <TextInput
                  style={styles.input}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="e.g. Admission & Accounts Lead"
                />
              </View>

              {departments.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Department</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {departments.map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={[styles.chip, editDept === d && styles.chipActive]}
                          onPress={() => setEditDept(d)}
                        >
                          <Text style={[styles.chipText, editDept === d && styles.chipTextActive]}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveEdit} disabled={editSubmitting}>
                <Text style={styles.submitText}>{editSubmitting ? 'Saving...' : 'Save & Promote'}</Text>
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
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#171717' },
  addBtn: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#0284C7',
    borderRadius: BorderRadius.button,
    paddingHorizontal: 14,
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
    borderColor: '#E8E5DC',
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },
  filterChipTextActive: { color: '#FFFFFF' },
  listContainer: { gap: 10, paddingBottom: 40 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#171717', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 4, lineHeight: 16 },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarText: { fontSize: 14, fontWeight: '800' },
  userDetails: { flex: 1 },
  userTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: { fontSize: 15, fontWeight: '700', color: '#171717', flex: 1 },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E0F2FE',
  },
  editActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  userEmail: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  roleBadgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  primaryRoleBadgeBorder: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  roleBadge: { fontSize: 10, fontWeight: '800' },
  codeBadge: { backgroundColor: '#FFFDF7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontWeight: '700', color: '#6B6B6B' },
  deptBadge: { backgroundColor: '#FFF4C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontWeight: '700', color: '#B45309' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 20, gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#171717' },
  modalSubtitle: { fontSize: 12, color: '#6B6B6B', marginTop: 2 },
  formGroup: { gap: 4, marginBottom: 12 },
  formRow: { marginBottom: 0 },
  label: { fontSize: 12, fontWeight: '700', color: '#171717' },
  roleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedCountBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  helperTip: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 4,
    fontStyle: 'italic',
  },
  input: { height: 44, borderWidth: 1, borderColor: '#E8E5DC', borderRadius: BorderRadius.input, paddingHorizontal: 12, fontSize: 13, backgroundColor: '#FFFDF7' },
  hintText: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.button,
    borderWidth: 1.5,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  roleCardActive: { borderColor: '#0284C7', backgroundColor: '#E0F2FE' },
  roleCardPrimaryActive: { borderColor: '#B45309', backgroundColor: '#FEF3C7' },
  roleCardLabel: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },
  roleCardLabelActive: { color: '#0284C7', fontWeight: '700' },
  primaryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    marginRight: 6,
  },
  primaryChipActive: {
    borderColor: '#0284C7',
    backgroundColor: '#0284C7',
  },
  primaryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  primaryChipTextActive: {
    color: '#FFFFFF',
  },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.chip, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E5DC' },
  chipActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },
  chipTextActive: { color: '#FFFFFF' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#6B6B6B', fontWeight: '700', fontSize: 13 },
  submitBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#0284C7', borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
