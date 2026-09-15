import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface TeacherItem {
  id: string;
  fullName: string;
  email: string;
  department?: string;
  employeeId?: string;
  scope?: string;
}

interface AdminTeachersViewProps {
  teachers: TeacherItem[];
  departments: string[];
  onCreateTeacher: (teacher: {
    firstName: string;
    lastName: string;
    email: string;
    employeeId: string;
    department: string;
    password?: string;
  }) => Promise<void>;
  onUpdateTeacher: (id: string, payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    employeeId?: string;
    department?: string;
  }) => Promise<void>;
  onDeleteTeacher: (id: string) => Promise<void>;
}

export const AdminTeachersView: React.FC<AdminTeachersViewProps> = ({
  teachers,
  departments,
  onCreateTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
}) => {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editModal, setEditModal] = useState<TeacherItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TeacherItem | null>(null);

  // Create form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [dept, setDept] = useState(departments[0] || 'Computer Science');
  const [password, setPassword] = useState('TempPass123!');
  const [submitting, setSubmitting] = useState(false);

  // Edit form
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editDept, setEditDept] = useState('');

  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (t: TeacherItem) => {
    const nameParts = t.fullName.split(' ');
    setEditFirstName(nameParts[0] || '');
    setEditLastName(nameParts.slice(1).join(' ') || '');
    setEditEmail(t.email);
    const scope = typeof t.scope === 'string' ? JSON.parse(t.scope || '{}') : (t.scope || {});
    setEditEmployeeId(scope.employeeId || t.employeeId || '');
    setEditDept(scope.department || t.department || '');
    setEditModal(t);
  };

  const handleCreate = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert('Missing Fields', 'First Name, Last Name, and Email are required.');
      return;
    }
    setSubmitting(true);
    try {
      await onCreateTeacher({ firstName, lastName, email, employeeId, department: dept, password });
      setCreateOpen(false);
      setFirstName(''); setLastName(''); setEmail(''); setEmployeeId('');
      Alert.alert('Success', 'Teacher account created!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editModal || !editFirstName || !editLastName || !editEmail) {
      Alert.alert('Missing Fields', 'First Name, Last Name, and Email are required.');
      return;
    }
    setSubmitting(true);
    try {
      await onUpdateTeacher(editModal.id, {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        employeeId: editEmployeeId,
        department: editDept,
      });
      setEditModal(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await onDeleteTeacher(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete teacher');
    }
  };

  const renderFormFields = (isEdit: boolean) => {
    const fn = isEdit ? editFirstName : firstName;
    const ln = isEdit ? editLastName : lastName;
    const em = isEdit ? editEmail : email;
    const eid = isEdit ? editEmployeeId : employeeId;
    const d = isEdit ? editDept : dept;
    const setFn = isEdit ? setEditFirstName : setFirstName;
    const setLn = isEdit ? setEditLastName : setLastName;
    const setEm = isEdit ? setEditEmail : setEmail;
    const setEid = isEdit ? setEditEmployeeId : setEmployeeId;
    const setD = isEdit ? setEditDept : setDept;

    return (
      <>
        <View style={styles.formGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput style={styles.input} placeholder="e.g. Vikram" value={fn} onChangeText={setFn} />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput style={styles.input} placeholder="e.g. Patel" value={ln} onChangeText={setLn} />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput style={styles.input} placeholder="vikram@school.edu" value={em} onChangeText={setEm} keyboardType="email-address" />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Employee ID</Text>
          <TextInput style={styles.input} placeholder="EMP101" value={eid} onChangeText={setEid} />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Department</Text>
          {departments.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {departments.map((dp) => (
                  <TouchableOpacity key={dp} style={[styles.chip, d === dp && styles.chipActive]} onPress={() => setD(dp)}>
                    <Text style={[styles.chipText, d === dp && styles.chipTextActive]}>{dp}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            <TextInput style={styles.input} placeholder="e.g. Electronics" value={d} onChangeText={setD} />
          )}
        </View>
        {!isEdit && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Temporary Password *</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} />
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search & Action Bar */}
      <View style={styles.headerBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6B6B6B" />
          <TextInput style={styles.searchInput} placeholder="Search by name, email..." value={search} onChangeText={setSearch} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateOpen(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Teacher List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredTeachers.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="human-male-board" size={40} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No Teachers Found</Text>
            <Text style={styles.emptySub}>Click &quot;+ Add&quot; to onboard a teacher.</Text>
          </View>
        ) : (
          filteredTeachers.map((t) => (
            <View key={t.id} style={styles.teacherCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{t.fullName.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.teacherDetails}>
                <Text style={styles.teacherName}>{t.fullName}</Text>
                <Text style={styles.teacherEmail}>{t.email}</Text>
                <View style={styles.badgeRow}>
                  <Text style={styles.roleBadge}>Teacher</Text>
                  {t.employeeId && <Text style={styles.empBadge}>{t.employeeId}</Text>}
                  {t.department && <Text style={styles.deptBadge}>{t.department}</Text>}
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(t)}>
                  <MaterialCommunityIcons name="pencil" size={16} color="#6B6B6B" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setDeleteConfirm(t)}>
                  <MaterialCommunityIcons name="delete-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={createOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Teacher</Text>
              <TouchableOpacity onPress={() => setCreateOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {renderFormFields(false)}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Teacher'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Teacher</Text>
              <TouchableOpacity onPress={() => setEditModal(null)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {renderFormFields(true)}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleEdit} disabled={submitting}>
                <Text style={styles.submitText}>{submitting ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal visible={!!deleteConfirm} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Teacher</Text>
              <TouchableOpacity onPress={() => setDeleteConfirm(null)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.deleteText}>
              Are you sure you want to delete <Text style={{ fontWeight: '700' }}>{deleteConfirm?.fullName}</Text>? This will remove their account permanently.
            </Text>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteConfirm(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Text style={styles.deleteBtnText}>Delete</Text>
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
  headerBar: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input, borderWidth: 1, borderColor: '#E8E5DC', paddingHorizontal: 12, height: 44, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#171717', fontFamily: FontFamily.regular },
  addBtn: { backgroundColor: '#F4C430', borderRadius: BorderRadius.button, paddingHorizontal: 16, height: 44, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, fontFamily: FontFamily.bold },
  listContainer: { gap: 10, paddingBottom: 40 },
  emptyCard: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 30, alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E5DC', marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#171717', marginTop: 10, fontFamily: FontFamily.bold },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 4, lineHeight: 16, fontFamily: FontFamily.regular },
  teacherCard: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 16,
    borderWidth: 1, borderColor: '#E8E5DC', flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFDF7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#171717', fontFamily: FontFamily.extrabold },
  teacherDetails: { flex: 1 },
  teacherName: { fontSize: 15, fontWeight: '700', color: '#171717', fontFamily: FontFamily.bold },
  teacherEmail: { fontSize: 12, color: '#6B6B6B', marginTop: 2, fontFamily: FontFamily.regular },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  roleBadge: { backgroundColor: '#FFFDF7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontWeight: '700', color: '#171717', fontFamily: FontFamily.bold },
  empBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontWeight: '700', color: '#D97706', fontFamily: FontFamily.bold },
  deptBadge: { backgroundColor: '#FFF4C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontWeight: '700', color: '#F4C430', fontFamily: FontFamily.bold },
  actions: { gap: 6 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E8E5DC',
    alignItems: 'center', justifyContent: 'center',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 20, gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#171717', fontFamily: FontFamily.extrabold },
  formGroup: { gap: 4, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#171717', fontFamily: FontFamily.bold },
  input: { height: 44, borderWidth: 1, borderColor: '#E8E5DC', borderRadius: BorderRadius.input, paddingHorizontal: 12, fontSize: 13, backgroundColor: '#FFFDF7', fontFamily: FontFamily.regular },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.chip, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E5DC' },
  chipActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B6B6B', fontFamily: FontFamily.semibold },
  chipTextActive: { color: '#FFFFFF' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#6B6B6B', fontWeight: '700', fontSize: 13, fontFamily: FontFamily.bold },
  submitBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#F4C430', borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, fontFamily: FontFamily.bold },
  deleteText: { fontSize: 14, color: '#171717', lineHeight: 22, fontFamily: FontFamily.regular },
  deleteBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#DC2626', borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, fontFamily: FontFamily.bold },
});
