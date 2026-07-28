import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

export interface BulkFeedStep2Props {
  feedType: 'student_bulk' | 'teacher_bulk' | 'individual';
  selectedFile: { name: string; size: string; uri?: string } | null;
  previewRows: Array<{ initials: string; name: string; roll: string; type: string; bg: string; text: string }>;
  sendEmails: boolean;
  setSendEmails: (val: boolean) => void;
  overwriteUsers: boolean;
  setOverwriteUsers: (val: boolean) => void;
  loading: boolean;
  onImportUsers: () => Promise<void>;
  onBack: () => void;
}

export const BulkFeedStep2: React.FC<BulkFeedStep2Props> = ({
  feedType,
  selectedFile,
  previewRows,
  sendEmails,
  setSendEmails,
  overwriteUsers,
  setOverwriteUsers,
  loading,
  onImportUsers,
  onBack,
}) => {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview Data</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.previewHeaderCard}>
        <View style={styles.bannerIconCircle}>
          <MaterialCommunityIcons name="file-document-outline" size={24} color="#7E57C2" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.previewCardTitle}>
            {feedType === 'teacher_bulk' ? 'Teachers Bulk Feed' : feedType === 'individual' ? 'Individual Feed' : 'Students Bulk Feed'}
          </Text>
          <Text style={styles.previewCardSub}>
            {selectedFile ? `File: ${selectedFile.name} (Total Rows: 125)` : 'Total Rows: 1'}
          </Text>
        </View>
      </View>
      <Text style={styles.previewNoticeText}>Previewing first 5 rows</Text>

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.colHeader, { width: 50 }]}>Avatar</Text>
          <Text style={[styles.colHeader, { flex: 1 }]}>Name</Text>
          <Text style={[styles.colHeader, { width: 70 }]}>Roll No</Text>
          <Text style={[styles.colHeader, { width: 70, textAlign: 'right' }]}>Type</Text>
        </View>

        {previewRows.map((row, idx) => (
          <View key={idx} style={styles.tableDataRow}>
            <View style={[styles.avatarCircleSmall, { backgroundColor: row.bg }]}>
              <Text style={[styles.avatarTextSmall, { color: row.text }]}>{row.initials}</Text>
            </View>
            <Text style={styles.rowNameText}>{row.name}</Text>
            <Text style={styles.rowRollText}>{row.roll}</Text>
            <View style={[styles.typeBadge, { backgroundColor: row.bg }]}>
              <Text style={[styles.typeBadgeText, { color: row.text }]}>{row.type}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.tableFooterHint}>Showing first 5 rows. Please verify your data before importing.</Text>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>3. Additional Options</Text>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setSendEmails(!sendEmails)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxOuter, sendEmails && styles.checkboxActive]}>
            {sendEmails && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Send login credentials via email</Text>
            <Text style={styles.optionSub}>Students/Teachers will receive email with their login details.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setOverwriteUsers(!overwriteUsers)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxOuter, overwriteUsers && styles.checkboxActive]}>
            {overwriteUsers && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Overwrite existing users</Text>
            <Text style={styles.optionSub}>If email already exists, it will update the existing user details.</Text>
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryActionBtn} onPress={onImportUsers} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <MaterialCommunityIcons name="cloud-upload-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryActionText}>Import Users</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 16 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A202C' },
  previewHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCardTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  previewCardSub: { fontSize: 12, color: '#7E57C2', fontWeight: '600', marginTop: 2 },
  previewNoticeText: { fontSize: 13, color: '#718096', marginVertical: 4 },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  colHeader: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextSmall: { fontSize: 12, fontWeight: '700' },
  rowNameText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1E293B', marginLeft: 10 },
  rowRollText: { width: 70, fontSize: 12, color: '#64748B' },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.chip,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  tableFooterHint: { fontSize: 11, color: '#A0AEC0', textAlign: 'center', marginVertical: 4 },
  sectionCard: { gap: 12 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#1A202C', marginBottom: 4 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: { backgroundColor: '#7E57C2', borderColor: '#7E57C2' },
  optionTitle: { fontSize: 13, fontWeight: '700', color: '#1A202C' },
  optionSub: { fontSize: 11, color: '#718096', marginTop: 2 },
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
  primaryActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.button,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    width: '100%',
  },
  cancelBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
});
