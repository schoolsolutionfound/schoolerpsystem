import React from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

export interface BulkFeedStep1Props {
  router: any;
  feedType: 'student_bulk' | 'teacher_bulk' | 'individual';
  setFeedType: (type: 'student_bulk' | 'teacher_bulk' | 'individual') => void;
  selectedFile: { name: string; size: string; uri?: string } | null;
  setSelectedFile: (file: { name: string; size: string; uri?: string } | null) => void;
  handlePickDocument: () => Promise<void>;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  rollNoOrUSN: string;
  setRollNoOrUSN: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  onNextStep: () => void;
}

export const BulkFeedStep1: React.FC<BulkFeedStep1Props> = ({
  router,
  feedType,
  setFeedType,
  selectedFile,
  setSelectedFile,
  handlePickDocument,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  rollNoOrUSN,
  setRollNoOrUSN,
  email,
  setEmail,
  onNextStep,
}) => {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bulk Feed Users</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="help-circle-outline" size={22} color="#718096" />
        </TouchableOpacity>
      </View>

      <View style={styles.bannerCard}>
        <View style={styles.bannerIconCircle}>
          <MaterialCommunityIcons name="cloud-upload-outline" size={26} color="#7E57C2" />
        </View>
        <View style={styles.bannerTextWrap}>
          <Text style={styles.bannerTitle}>Import Users</Text>
          <Text style={styles.bannerSub}>Add multiple students or teachers using CSV / Excel file</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>1. Select Feed Type</Text>

        <TouchableOpacity
          style={[styles.radioCard, feedType === 'student_bulk' && styles.radioCardActive]}
          onPress={() => setFeedType('student_bulk')}
          activeOpacity={0.8}
        >
          <View style={styles.radioIconCircle}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color="#7E57C2" />
          </View>
          <View style={styles.radioTextWrap}>
            <Text style={styles.radioTitle}>Student Bulk Feed</Text>
            <Text style={styles.radioSub}>Import multiple students at once</Text>
          </View>
          <View style={[styles.radioOuter, feedType === 'student_bulk' && styles.radioOuterActive]}>
            {feedType === 'student_bulk' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.radioCard, feedType === 'teacher_bulk' && styles.radioCardActive]}
          onPress={() => setFeedType('teacher_bulk')}
          activeOpacity={0.8}
        >
          <View style={[styles.radioIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="account-tie-outline" size={22} color="#16A34A" />
          </View>
          <View style={styles.radioTextWrap}>
            <Text style={styles.radioTitle}>Teacher Bulk Feed</Text>
            <Text style={styles.radioSub}>Import multiple teachers at once</Text>
          </View>
          <View style={[styles.radioOuter, feedType === 'teacher_bulk' && styles.radioOuterActive]}>
            {feedType === 'teacher_bulk' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.radioCard, feedType === 'individual' && styles.radioCardActive]}
          onPress={() => setFeedType('individual')}
          activeOpacity={0.8}
        >
          <View style={[styles.radioIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="account-plus-outline" size={22} color="#D97706" />
          </View>
          <View style={styles.radioTextWrap}>
            <Text style={styles.radioTitle}>Individual Feed</Text>
            <Text style={styles.radioSub}>Add single student or teacher</Text>
          </View>
          <View style={[styles.radioOuter, feedType === 'individual' && styles.radioOuterActive]}>
            {feedType === 'individual' && <View style={styles.radioInner} />}
          </View>
        </TouchableOpacity>
      </View>

      {feedType !== 'individual' ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>2. Upload CSV / Excel File</Text>

          <View style={styles.dashedUploadBox}>
            <View style={styles.cloudCircle}>
              <MaterialCommunityIcons name="cloud-upload" size={28} color="#7E57C2" />
            </View>

            {!selectedFile ? (
              <>
                <Text style={styles.uploadDragText}>Drag and drop your file here or</Text>
                
                <TouchableOpacity style={styles.chooseFileBtn} onPress={handlePickDocument}>
                  <Text style={styles.chooseFileText}>Choose File</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.demoFileBtn}
                  onPress={() => setSelectedFile({ name: 'students_bulk_feed.csv', size: '23 KB' })}
                >
                  <MaterialCommunityIcons name="lightning-bolt" size={14} color="#4F46E5" />
                  <Text style={styles.demoFileBtnText}>Load Demo CSV File</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.fileAttachedCard}>
                <MaterialCommunityIcons name="file-excel-box" size={28} color="#16A34A" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                  <Text style={styles.fileSize}>{selectedFile.size}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFile(null)}>
                  <MaterialCommunityIcons name="close-circle-outline" size={22} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <Text style={styles.fileSupportText}>Supported formats: CSV, XLSX. Maximum file size: 5MB</Text>

          <TouchableOpacity
            style={[styles.primaryActionBtn, !selectedFile && styles.disabledActionBtn]}
            onPress={() => {
              if (!selectedFile) {
                Alert.alert('Select File', 'Please select a CSV or Excel file to preview.');
                return;
              }
              onNextStep();
            }}
          >
            <Text style={styles.primaryActionText}>Preview Data</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>2. Individual Feed Details</Text>
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Aarav" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Sharma" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="aarav@college.edu" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>USN / Roll No</Text>
            <TextInput style={styles.input} value={rollNoOrUSN} onChangeText={setRollNoOrUSN} placeholder="101" />
          </View>

          <TouchableOpacity
            style={styles.seedBtn}
            onPress={() => {
              setFirstName('Aarav');
              setLastName('Sharma');
              setEmail('aarav.sharma@college.edu');
              setRollNoOrUSN('101');
            }}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={16} color="#4F46E5" />
            <Text style={styles.seedBtnText}>Auto-Fill Demo Student Record</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryActionBtn} onPress={onNextStep}>
            <Text style={styles.primaryActionText}>Preview Data</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 16 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  bannerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextWrap: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: '700', color: '#1A202C' },
  bannerSub: { fontSize: 12, color: '#718096', marginTop: 2 },
  sectionCard: { gap: 12 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#1A202C', marginBottom: 4 },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  radioCardActive: { borderColor: '#7E57C2', backgroundColor: '#FAF5FF' },
  radioIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EDE9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioTextWrap: { flex: 1 },
  radioTitle: { fontSize: 14, fontWeight: '700', color: '#1A202C' },
  radioSub: { fontSize: 12, color: '#718096', marginTop: 2 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: { borderColor: '#7E57C2' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7E57C2' },
  dashedUploadBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  cloudCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EDE9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadDragText: { fontSize: 13, color: '#718096' },
  chooseFileBtn: {
    backgroundColor: '#7E57C2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  chooseFileText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  demoFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
    marginTop: 4,
  },
  demoFileBtnText: { fontSize: 12, color: '#4F46E5', fontWeight: '600' },
  fileAttachedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: BorderRadius.card,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    gap: 10,
  },
  fileName: { fontSize: 13, fontWeight: '600', color: '#1A202C' },
  fileSize: { fontSize: 11, color: '#A0AEC0' },
  fileSupportText: { fontSize: 11, color: '#A0AEC0', textAlign: 'center' },
  rowInputs: { flexDirection: 'row' },
  inputGroup: { marginBottom: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#4A5568', marginBottom: 4 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: '#1A202C',
  },
  seedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginVertical: 4,
    gap: 6,
  },
  seedBtnText: { color: '#4F46E5', fontSize: 13, fontWeight: '600' },
  primaryActionBtn: {
    backgroundColor: '#7E57C2',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  disabledActionBtn: { opacity: 0.5 },
  primaryActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
