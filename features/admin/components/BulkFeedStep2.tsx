import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';

export interface BulkFeedStep2Props {
  feedType: 'student_bulk' | 'teacher_bulk' | 'individual';
  selectedFile: { name: string; size: string; uri?: string } | null;
  totalRows: number;
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
  totalRows,
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
          <MaterialCommunityIcons name="chevron-left" size={24} color="#1A1B1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview Data</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.previewHeaderCard}>
        <View style={styles.bannerIconCircle}>
          <MaterialCommunityIcons name="file-document-outline" size={24} color="#F4C430" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.previewCardTitle}>
            {feedType === 'teacher_bulk' ? 'Teachers Bulk Feed' : feedType === 'individual' ? 'Individual Feed' : 'Students Bulk Feed'}
          </Text>
          <Text style={styles.previewCardSub}>
            {selectedFile ? `File: ${selectedFile.name} (Total Rows: ${totalRows})` : 'Total Rows: 1'}
          </Text>
        </View>
      </View>
      <Text style={styles.previewNoticeText}>Previewing first 5 rows</Text>

      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.colHeader, { flex: 1 }]}>Type</Text>
          <Text style={[styles.colHeader, { width: 80, textAlign: 'right' }]}>Count</Text>
        </View>
        <View style={styles.tableDataRow}>
          <Text style={styles.rowNameText}>{feedType === 'teacher_bulk' ? 'Teachers' : feedType === 'individual' ? 'Individual' : 'Students'}</Text>
          <Text style={[styles.rowRollText, { textAlign: 'right' }]}>{totalRows}</Text>
        </View>
      </View>
      <Text style={styles.tableFooterHint}>Please verify your data before importing.</Text>

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
            <Text style={styles.optionSub}>Sends an email with the temporary password when email (SES) is configured. Otherwise passwords are shown once after import.</Text>
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
            <Text style={styles.optionSub}>If the email already exists, the account password is reset to this import and profile details are updated. Leave off to skip duplicates.</Text>
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
  scroll: { paddingHorizontal: 16, paddingVertical: 14, gap: 16 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: FontFamily.extrabold, color: '#111827' },
  previewHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1B1C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCardTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: '#111827' },
  previewCardSub: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#92400E', marginTop: 2 },
  previewNoticeText: { fontSize: 13, fontFamily: FontFamily.regular, color: '#6B7280', marginVertical: 4 },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  colHeader: { fontSize: 12, fontFamily: FontFamily.bold, color: '#6B6B6B' },
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
  avatarTextSmall: { fontSize: 12, fontFamily: FontFamily.bold },
  rowNameText: { flex: 1, fontSize: 13, fontFamily: FontFamily.semibold, color: '#1A1B1C', marginLeft: 10 },
  rowRollText: { width: 70, fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.chip,
  },
  typeBadgeText: { fontSize: 11, fontFamily: FontFamily.bold },
  tableFooterHint: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B', textAlign: 'center', marginVertical: 4 },
  sectionCard: { gap: 12 },
  sectionHeader: { fontSize: 15, fontFamily: FontFamily.bold, color: '#111827', marginBottom: 4 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E8E5DC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  optionTitle: { fontSize: 13, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  optionSub: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B', marginTop: 2 },
  primaryActionBtn: {
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  primaryActionText: { color: '#1A1B1C', fontSize: 15, fontFamily: FontFamily.extrabold },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.button,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 4,
    width: '100%',
  },
  cancelBtnText: { color: '#6B6B6B', fontSize: 14, fontFamily: FontFamily.semibold },
});