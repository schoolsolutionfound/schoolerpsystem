import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '../common/Icons';
import { StudentProfile } from '../../types';

export const MemberFormModal = ({
  visible,
  editingStudent,
  onClose,
  onSave,
  modalStyles,
  commonStyles,
}: {
  visible: boolean;
  editingStudent: StudentProfile | null;
  onClose: () => void;
  onSave: (studentData: Partial<StudentProfile>) => void;
  modalStyles: any;
  commonStyles: any;
}) => {
  const [fullName, setFullName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [classSection, setClassSection] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingStudent) {
      setFullName(editingStudent.fullName || '');
      setAdmissionNo(editingStudent.admissionNo || '');
      setClassSection(editingStudent.classSection || '');
      setEmail(editingStudent.email || '');
      setPhone(editingStudent.phone || '');
    } else {
      setFullName('');
      const randNo = String(Math.floor(100 + Math.random() * 900));
      setAdmissionNo(`ADM-2026-${randNo}`);
      setClassSection('Class 10-A');
      setEmail('');
      setPhone('');
    }
  }, [editingStudent, visible]);

  const handleSave = () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Member full name is required.');
      return;
    }
    if (!admissionNo.trim()) {
      Alert.alert('Required Field', 'Admission / Member ID is required.');
      return;
    }

    setSubmitting(true);
    onSave({
      fullName: fullName.trim(),
      admissionNo: admissionNo.trim(),
      classSection: classSection.trim() || 'General',
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@school.com`,
      phone: phone.trim() || undefined,
    });
    setSubmitting(false);
  };

  const styles = commonStyles;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '90%' }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>{editingStudent ? 'Edit Member Details' : 'Register New Member'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.formInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Rahul Mehta"
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Admission No / Member ID *</Text>
                <TextInput
                  style={styles.formInput}
                  value={admissionNo}
                  onChangeText={setAdmissionNo}
                  placeholder="e.g. ADM-2026-001"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Class & Section</Text>
                <TextInput
                  style={styles.formInput}
                  value={classSection}
                  onChangeText={setClassSection}
                  placeholder="e.g. Class 10-A"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email Address</Text>
              <TextInput
                style={styles.formInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="e.g. student@school.com"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Contact Phone</Text>
              <TextInput
                style={styles.formInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="e.g. +1 555-0192"
              />
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { marginVertical: 16 }]} onPress={handleSave} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#121316" /> : <Text style={styles.primaryBtnText}>{editingStudent ? 'Save Member Updates' : 'Register Member'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
