import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
import { BorderRadius } from '../../constants/theme';
import { fetchMyDocumentsApi, uploadMyDocumentApi, deleteMyDocumentApi } from '../../api/admin';
import { uploadProfilePictureApi } from '../../api/upload';

interface StudentDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  createdAt?: string;
}

const DOC_TYPES = ['ID Card', '10th Marksheet', '12th Marksheet', 'Photo', 'Other'];

export default function StudentProfileScreen() {
  const router = useRouter();
  const fullName = useUserStore((s) => s.fullName) || 'Student';
  const email = useUserStore((s) => s.email) || '';
  const rollNoOrUSN = useUserStore((s) => s.rollNoOrUSN) || '';
  const institutionName = useUserStore((s) => s.institutionName) || '';
  const institutionCode = useUserStore((s) => s.institutionCode) || '';
  const institutionType = useUserStore((s) => s.institutionType) || 'college';
  const phone = useUserStore((s) => s.phone) || '';
  const parentPhone = useUserStore((s) => s.parentPhone) || '';
  const tenthPercentage = useUserStore((s) => s.tenthPercentage) || '';
  const twelfthPercentage = useUserStore((s) => s.twelfthPercentage) || '';
  const profilePic = useUserStore((s) => s.profilePic) || '';
  const resetUser = useUserStore((s) => s.resetUser);
  const setUserProfile = useUserStore((s) => s.setUserProfile);
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try { await signOut(auth); } catch {}
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  const [refreshing, setRefreshing] = useState(false);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [addDocModal, setAddDocModal] = useState(false);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docFileName, setDocFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDocuments = async () => {
    setDocsLoading(true);
    try {
      const res = await fetchMyDocumentsApi();
      setDocuments((res as any)?.data || []);
    } catch {
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDocuments().finally(() => setRefreshing(false));
  };

  const handleAddDocument = async () => {
    if (!docFileName.trim()) {
      Alert.alert('Missing', 'Please enter a file name.');
      return;
    }
    setSubmitting(true);
    try {
      await uploadMyDocumentApi({ documentType: docType, fileName: docFileName, fileUrl: '' });
      setAddDocModal(false);
      setDocFileName('');
      loadDocuments();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = (doc: StudentDocument) => {
    Alert.alert('Delete Document', `Remove "${doc.fileName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteMyDocumentApi(doc.id); loadDocuments(); } catch {}
        },
      },
    ]);
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    try {
      const url = await uploadProfilePictureApi(uri);
      setUserProfile({ profilePic: url });
      Alert.alert('Success', 'Profile photo updated!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to upload photo');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1A1B1C"
              colors={['#1A1B1C']}
              progressBackgroundColor="#FFFFFF"
            />
          }
        >
          {/* Hero Section — LeetCode-style split header */}
          <View style={[styles.heroSection, { paddingTop: insets.top + 12 }]}>
            <View style={styles.heroRow}>
              <View style={styles.avatarContainer}>
                <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto} activeOpacity={0.8}>
                  {profilePic ? (
                    <Image source={{ uri: profilePic }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <MaterialCommunityIcons name="account" size={36} color="#1A1B1C" />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cameraOverlay} onPress={handlePickPhoto} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.heroMain}>
                <View style={styles.heroHandleRow}>
                  <Text style={styles.heroHandle}>{fullName}</Text>
                  <View style={styles.avatarBadge}>
                    <MaterialCommunityIcons name="check" size={11} color="#0E0E0E" />
                  </View>
                </View>
                <Text style={styles.heroEmail} numberOfLines={1}>{email || '—'}</Text>
                <View style={styles.heroBadgeRow}>
                  <View style={styles.heroRoleBadge}>
                    <MaterialCommunityIcons name="school" size={13} color="#F4C430" />
                    <Text style={styles.heroRoleText}>Student</Text>
                  </View>
                  {institutionName ? (
                    <View style={styles.heroInstBadge}>
                      <Text style={styles.heroInstText} numberOfLines={1}>{institutionName}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Quick stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statNum}>{rollNoOrUSN || '—'}</Text>
                <Text style={styles.statLabel}>USN / Roll</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statNum}>{institutionType === 'college' ? 'College' : 'School'}</Text>
                <Text style={styles.statLabel}>Type</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statNum} numberOfLines={1}>{institutionCode || '—'}</Text>
                <Text style={styles.statLabel}>Code</Text>
              </View>
            </View>
          </View>

          {/* Academic Info */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="book-open-variant" size={16} color="#F4C430" />
              <Text style={styles.sectionTitle}>Academic Info</Text>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>USN / Roll No</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{rollNoOrUSN || '—'}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{phone || '—'}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Parent Phone</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{parentPhone || '—'}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>10th %</Text>
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>{tenthPercentage || '—'}</Text>
                </View>
              </View>
            </View>
            {institutionType === 'college' && (
              <View style={styles.gridRow}>
                <View style={styles.gridCell}>
                  <Text style={styles.infoLabel}>12th %</Text>
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}>{twelfthPercentage || '—'}</Text>
                  </View>
                </View>
                <View style={styles.gridCell} />
              </View>
            )}
          </View>

          {/* Institution */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="office-building" size={16} color="#F4C430" />
              <Text style={styles.sectionTitle}>Institution</Text>
            </View>
            <View style={styles.gridRow}>
              <View style={[styles.gridCell, styles.gridFull]}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {institutionName || institutionCode || '—'}
                </Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Code</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{institutionCode || '—'}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>{institutionType === 'college' ? 'College' : 'School'}</Text>
              </View>
            </View>
          </View>

          {/* Documents */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="file-document-outline" size={16} color="#F4C430" />
              <Text style={styles.sectionTitle}>Documents</Text>
              <TouchableOpacity style={styles.addDocBtn} onPress={() => setAddDocModal(true)}>
                <MaterialCommunityIcons name="plus" size={16} color="#F4C430" />
                <Text style={styles.addDocBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
            {docsLoading ? (
              <Text style={styles.docsLoadingText}>Loading documents...</Text>
            ) : documents.length === 0 ? (
              <View style={styles.docsEmpty}>
                <MaterialCommunityIcons name="file-plus-outline" size={28} color="#B5B5B5" />
                <Text style={styles.docsEmptyText}>No documents uploaded yet</Text>
              </View>
            ) : (
              documents.map((doc) => (
                <View key={doc.id} style={styles.docRow}>
                  <View style={styles.docIconWrap}>
                    <MaterialCommunityIcons name="file-document" size={18} color="#F4C430" />
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docType}>{doc.documentType}</Text>
                    <Text style={styles.docName} numberOfLines={1}>{doc.fileName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteDocument(doc)}>
                    <MaterialCommunityIcons name="delete-outline" size={18} color="#DC3545" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Account */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="cog-outline" size={16} color="#F4C430" />
              <Text style={styles.sectionTitle}>Account</Text>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/change-password')}>
              <View style={styles.menuIconWrap}>
                <MaterialCommunityIcons name="lock-reset" size={17} color="#F4C430" />
              </View>
              <Text style={styles.menuText}>Change Password</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#B5B5B5" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(220, 53, 69, 0.1)' }]}>
                <MaterialCommunityIcons name="logout" size={17} color="#DC3545" />
              </View>
              <Text style={[styles.menuText, { color: '#DC3545' }]}>Logout</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#B5B5B5" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Add Document Modal */}
      <Modal visible={addDocModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Document</Text>
              <TouchableOpacity onPress={() => setAddDocModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Document Type</Text>
              <View style={styles.chipRow}>
                {DOC_TYPES.map((t) => (
                  <TouchableOpacity key={t} style={[styles.chip, docType === t && styles.chipSelected]} onPress={() => setDocType(t)}>
                    <Text style={[styles.chipText, docType === t && styles.chipTextSelected]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>File Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Aadhar Card, 10th Marksheet" value={docFileName} onChangeText={setDocFileName} />
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddDocModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddDocument} disabled={submitting}>
                <Text style={styles.submitText}>{submitting ? 'Adding...' : 'Add Document'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEFE' },
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },

  // Hero Section — LeetCode-style split
  heroSection: {
    backgroundColor: '#1A1B1C',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2C',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: { position: 'relative', width: 72, height: 72 },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', borderWidth: 2, borderColor: '#1A1B1C' },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A1B1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1A1B1C',
  },
  heroMain: { flex: 1, minWidth: 0 },
  heroHandleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroHandle: { fontSize: 19, fontWeight: '800', color: '#FFFFFF', flexShrink: 1 },
  heroEmail: { fontSize: 12, color: '#9A9A9A', marginTop: 2 },
  heroBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  heroRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244, 196, 48, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.3)',
  },
  heroRoleText: { fontSize: 11, fontWeight: '700', color: '#F4C430' },
  heroInstBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxWidth: 180,
  },
  heroInstText: { fontSize: 11, fontWeight: '600', color: '#BDBDBD' },

  // Stats strip (LeetCode progress-bar vibe)
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 16,
    backgroundColor: '#232425',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  statNum: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#8A8A8A', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#2F3031', marginVertical: 4 },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    marginHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE9D6',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1A1B1C', letterSpacing: 0.3 },

  // Info grid (2-col)
  gridRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F1EA',
  },
  gridCell: { flex: 1, paddingRight: 8 },
  gridFull: { flex: 1, paddingRight: 0 },
  infoLabel: {
    fontSize: 10,
    color: '#8A8A8A',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#1A1B1C' },
  statBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(244, 196, 48, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.5)',
  },
  statBadgeText: { fontSize: 13, fontWeight: '800', color: '#8A6A00' },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F1EA',
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { fontSize: 14, fontWeight: '600', color: '#1A1B1C', flex: 1 },
  divider: { height: 1, backgroundColor: '#F3F1EA', marginVertical: 4 },

  // Documents
  addDocBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  addDocBtnText: { fontSize: 12, fontWeight: '700', color: '#F4C430' },
  docsLoadingText: { fontSize: 12, color: '#8A8A8A', textAlign: 'center', paddingVertical: 12 },
  docsEmpty: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  docsEmptyText: { fontSize: 12, color: '#8A8A8A' },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F1EA' },
  docIconWrap: { width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(244, 196, 48, 0.15)', alignItems: 'center', justifyContent: 'center' },
  docInfo: { flex: 1 },
  docType: { fontSize: 12, fontWeight: '700', color: '#1A1B1C' },
  docName: { fontSize: 11, color: '#8A8A8A', marginTop: 1 },

  // Add Document Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 20, gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#171717' },
  formGroup: { gap: 4, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#171717' },
  input: { height: 44, borderWidth: 1, borderColor: '#E8E5DC', borderRadius: BorderRadius.input, paddingHorizontal: 12, fontSize: 13, backgroundColor: '#FFFDF7' },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.chip, borderWidth: 1, borderColor: '#E8E5DC', backgroundColor: '#FFFDF7' },
  chipSelected: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#6B6B6B', fontWeight: '700', fontSize: 13 },
  submitBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#F4C430', borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
