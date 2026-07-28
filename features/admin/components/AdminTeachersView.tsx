import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors } from '../../../constants/theme';

interface TeacherItem {
  id: string;
  fullName: string;
  email: string;
  department?: string;
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
}

export const AdminTeachersView: React.FC<AdminTeachersViewProps> = ({
  teachers,
  departments,
  onCreateTeacher,
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [dept, setDept] = useState(departments[0] || 'Computer Science');
  const [password, setPassword] = useState('TempPass123!');
  const [submitting, setSubmitting] = useState(false);

  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert('Missing Fields', 'First Name, Last Name, and Email are required.');
      return;
    }

    setSubmitting(true);
    try {
      await onCreateTeacher({
        firstName,
        lastName,
        email,
        employeeId,
        department: dept,
        password,
      });
      setModalOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setEmployeeId('');
      Alert.alert('Success', 'Teacher account created! The teacher can now log in using their email and temporary password.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create teacher account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search & Action Bar */}
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
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Text style={styles.addBtnText}>+ Add Teacher</Text>
        </TouchableOpacity>
      </View>

      {/* Teacher List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredTeachers.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="human-male-board" size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Teachers Registered</Text>
            <Text style={styles.emptySub}>Click "+ Add Teacher" above to onboard a faculty member manually.</Text>
          </View>
        ) : (
          filteredTeachers.map((teach) => (
            <View key={teach.id} style={styles.teacherCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{teach.fullName.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.teacherDetails}>
                <Text style={styles.teacherName}>{teach.fullName}</Text>
                <Text style={styles.teacherEmail}>{teach.email}</Text>
                <View style={styles.badgeRow}>
                  <Text style={styles.roleBadge}>Teacher</Text>
                  {teach.department && <Text style={styles.deptBadge}>{teach.department}</Text>}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Onboard New Teacher</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput style={styles.input} placeholder="e.g. Vikram" value={firstName} onChangeText={setFirstName} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput style={styles.input} placeholder="e.g. Patel" value={lastName} onChangeText={setLastName} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput style={styles.input} placeholder="vikram@school.edu" value={email} onChangeText={setEmail} keyboardType="email-address" />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Employee ID (Optional)</Text>
                <TextInput style={styles.input} placeholder="EMP101" value={employeeId} onChangeText={setEmployeeId} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Department</Text>
                <TextInput style={styles.input} placeholder="e.g. Electronics" value={dept} onChangeText={setDept} />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Temporary Password *</Text>
                <TextInput style={styles.input} value={password} onChangeText={setPassword} />
                <Text style={styles.hintText}>Teacher will follow the first-login password change workflow upon login.</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Teacher'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerBar: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1A202C' },
  addBtn: {
    backgroundColor: '#7E57C2',
    borderRadius: BorderRadius.button,
    paddingHorizontal: 14,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
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
  emptySub: { fontSize: 12, color: '#718096', textAlign: 'center', marginTop: 4 },
  teacherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#0284C7' },
  teacherDetails: { flex: 1 },
  teacherName: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  teacherEmail: { fontSize: 12, color: '#718096', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  roleBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 10, fontWeight: '700', color: '#0284C7' },
  deptBadge: { backgroundColor: '#EDE7F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 10, fontWeight: '700', color: '#7E57C2' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 20, gap: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1A202C' },
  formGroup: { gap: 4, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A202C' },
  input: { height: 42, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: BorderRadius.input, paddingHorizontal: 12, fontSize: 14, backgroundColor: '#F8F9FB' },
  hintText: { fontSize: 11, color: '#718096', marginTop: 2 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  submitBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#7E57C2', borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
