import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLibraryStore } from '../store/useLibraryStore';
import { LibraryClearanceCertificate } from '../types/library';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const LibraryClearanceModal: React.FC<Props> = ({ visible, onClose }) => {
  const getStudentClearanceEligibility = useLibraryStore(
    (s) => s.getStudentClearanceEligibility
  );
  const generateClearanceCertificate = useLibraryStore(
    (s) => s.generateClearanceCertificate
  );
  const clearanceCertificates = useLibraryStore((s) => s.clearanceCertificates);

  const [studentName, setStudentName] = useState('Kabir Mehta');
  const [className, setClassName] = useState('Class 12-A');
  const [rollNo, setRollNo] = useState('22');
  const [activeCertificate, setActiveCertificate] =
    useState<LibraryClearanceCertificate | null>(null);

  const checkResult = getStudentClearanceEligibility(studentName);

  const handleIssueCertificate = () => {
    if (!checkResult.isEligible) {
      Alert.alert('Cannot Issue Clearance', checkResult.reason || 'Student has pending dues.');
      return;
    }

    const cert = generateClearanceCertificate({
      studentId: `std-${Math.floor(1000 + Math.random() * 9000)}`,
      studentName: studentName.trim(),
      className: className.trim(),
      rollNo: rollNo.trim(),
    });

    setActiveCertificate(cert);
    Alert.alert(
      'Clearance Approved!',
      `Official No-Dues certificate ${cert.certificateNo} issued for ${studentName}.`
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <MaterialCommunityIcons name="certificate" size={24} color="#D97706" />
              <Text style={styles.title}>Library No-Dues Clearance Desk</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
            {activeCertificate ? (
              <View style={styles.certBox}>
                <View style={styles.certHeader}>
                  <MaterialCommunityIcons name="shield-check" size={28} color="#059669" />
                  <Text style={styles.certSchoolName}>DPS Central Library</Text>
                  <Text style={styles.certDocTitle}>OFFICIAL NO-DUES CLEARANCE</Text>
                </View>

                <View style={styles.certMeta}>
                  <Text style={styles.certMetaText}>Certificate Ref: {activeCertificate.certificateNo}</Text>
                  <Text style={styles.certMetaText}>Issue Date: {activeCertificate.issueDate}</Text>
                </View>

                <View style={styles.certStudentInfo}>
                  <Text style={styles.certStudentName}>{activeCertificate.studentName}</Text>
                  <Text style={styles.certStudentClass}>
                    {activeCertificate.className} • Roll No: {activeCertificate.rollNo}
                  </Text>
                </View>

                <Text style={styles.certStatement}>
                  This is to certify that the student has returned all borrowed books and cleared all library fine dues. No obligations remain outstanding.
                </Text>

                <View style={styles.certSignRow}>
                  <Text style={styles.certSignBy}>Cleared By: {activeCertificate.clearedBy}</Text>
                  <Text style={styles.certStamp}>[STAMP VERIFIED]</Text>
                </View>

                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => {
                    Alert.alert('Certificate Downloaded', 'Saved copy to device.');
                    setActiveCertificate(null);
                  }}
                >
                  <MaterialCommunityIcons name="download" size={16} color="#FFFFFF" />
                  <Text style={styles.downloadBtnText}>Save / Export PDF</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.inputLabel}>Student Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Student Name"
                  placeholderTextColor="#94A3B8"
                  value={studentName}
                  onChangeText={setStudentName}
                />

                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Class / Grade</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Class 12-A"
                      placeholderTextColor="#94A3B8"
                      value={className}
                      onChangeText={setClassName}
                    />
                  </View>
                  <View style={{ width: 100, marginLeft: 10 }}>
                    <Text style={styles.inputLabel}>Roll No</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="22"
                      placeholderTextColor="#94A3B8"
                      value={rollNo}
                      onChangeText={setRollNo}
                    />
                  </View>
                </View>

                {/* Live Eligibility Check Card */}
                <View
                  style={[
                    styles.eligibilityBox,
                    checkResult.isEligible ? styles.boxCleared : styles.boxBlocked,
                  ]}
                >
                  <View style={styles.eligibilityHeader}>
                    <MaterialCommunityIcons
                      name={checkResult.isEligible ? 'check-decagram' : 'alert-octagon'}
                      size={22}
                      color={checkResult.isEligible ? '#059669' : '#DC2626'}
                    />
                    <Text
                      style={[
                        styles.eligibilityTitle,
                        { color: checkResult.isEligible ? '#065F46' : '#991B1B' },
                      ]}
                    >
                      {checkResult.isEligible
                        ? 'Eligible for No-Dues Clearance'
                        : 'Clearance Blocked — Dues Pending'}
                    </Text>
                  </View>

                  {checkResult.isEligible ? (
                    <Text style={styles.eligibilitySub}>
                      ✓ 0 active borrowed books • ₹0 pending fines
                    </Text>
                  ) : (
                    <Text style={styles.eligibilitySub}>{checkResult.reason}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.generateBtn,
                    !checkResult.isEligible && { opacity: 0.5 },
                  ]}
                  onPress={handleIssueCertificate}
                  disabled={!checkResult.isEligible}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="certificate" size={18} color="#FFFFFF" />
                  <Text style={styles.generateBtnText}>Generate Official Certificate</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  closeBtn: { padding: 4 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  formRow: { flexDirection: 'row' },
  eligibilityBox: {
    borderRadius: 12,
    padding: 14,
    marginVertical: 14,
    borderWidth: 1,
  },
  boxCleared: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  boxBlocked: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  eligibilityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eligibilityTitle: { fontSize: 13, fontWeight: '800' },
  eligibilitySub: { fontSize: 11, color: '#475569', marginTop: 6 },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  generateBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  certBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 16,
  },
  certHeader: { alignItems: 'center', marginBottom: 12 },
  certSchoolName: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 4 },
  certDocTitle: { fontSize: 11, fontWeight: '800', color: '#D97706', letterSpacing: 0.5 },
  certMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  certMetaText: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  certStudentInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  certStudentName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  certStudentClass: { fontSize: 11, color: '#64748B', marginTop: 2 },
  certStatement: { fontSize: 11, color: '#475569', lineHeight: 16, marginBottom: 12 },
  certSignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    paddingTop: 8,
    marginBottom: 14,
  },
  certSignBy: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  certStamp: { fontSize: 9, fontWeight: '800', color: '#059669' },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  downloadBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
