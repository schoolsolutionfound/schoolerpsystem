import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

interface StudentItem {
  id: string;
  fullName: string;
  email: string;
  rollNoOrUSN: string;
  department?: string;
  academicYear?: string;
  section?: string;
  phone?: string;
  parentPhone?: string;
  tenthPercentage?: string;
  twelfthPercentage?: string;
  profileCompleted?: boolean;
  createdAt?: string;
  graduatedAt?: string;
}

interface StudentDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  createdAt?: string;
}

interface AdminStudentsViewProps {
  students: StudentItem[];
  departments: string[];
  academicYears: string[];
  sections: string[];
  classSections: { id: string; name: string; department?: string; academicYear?: string; section?: string }[];
  institutionType: 'school' | 'college';
  onCreateStudent: (student: {
    firstName: string;
    lastName: string;
    email: string;
    rollNoOrUSN: string;
    department: string;
    academicYear: string;
    section: string;
    password?: string;
  }) => Promise<void>;
  onUpdateStudent: (id: string, payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    rollNoOrUSN?: string;
    department?: string;
    academicYear?: string;
    section?: string;
    phone?: string;
    parentPhone?: string;
    tenthPercentage?: string;
    twelfthPercentage?: string;
  }) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onPromoteStudents: (studentIds: string[], targetClassSectionId: string, academicYear: string) => Promise<void>;
  onGraduateStudents: (studentIds: string[]) => Promise<void>;
  onFetchDocuments: (studentId: string) => Promise<StudentDocument[]>;
  onAddDocument: (studentId: string, payload: { documentType: string; fileName: string; fileUrl: string }) => Promise<void>;
  onDeleteDocument: (studentId: string, docId: string) => Promise<void>;
}

export const AdminStudentsView: React.FC<AdminStudentsViewProps> = ({
  students,
  departments,
  academicYears,
  sections,
  classSections,
  institutionType,
  onCreateStudent,
  onUpdateStudent,
  onDeleteStudent,
  onPromoteStudents,
  onGraduateStudents,
  onFetchDocuments,
  onAddDocument,
  onDeleteDocument,
}) => {
  const isCollege = institutionType === 'college';
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showAlumni, setShowAlumni] = useState(false);

  // Multi-select
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailSheet, setDetailSheet] = useState<StudentItem | null>(null);
  const [editModal, setEditModal] = useState<StudentItem | null>(null);
  const [promoteModal, setPromoteModal] = useState<{ students: StudentItem[] } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<StudentItem | null>(null);

  // Documents
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [addDocModal, setAddDocModal] = useState(false);
  const [docType, setDocType] = useState('ID Card');
  const [docFileName, setDocFileName] = useState('');

  // Create form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNoOrUSN, setRollNoOrUSN] = useState('');
  const [dept, setDept] = useState(departments[0] || '');
  const [year, setYear] = useState(academicYears[0] || '');
  const [section, setSection] = useState(sections[0] || '');
  const [password, setPassword] = useState('TempPass123!');
  const [submitting, setSubmitting] = useState(false);

  // Edit form
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editTenth, setEditTenth] = useState('');
  const [editTwelfth, setEditTwelfth] = useState('');

  // Promote form
  const [promoteTarget, setPromoteTarget] = useState('');
  const [promoteYear, setPromoteYear] = useState(academicYears[0] || '');

  // Filtering
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (showAlumni && !s.graduatedAt) return false;
      if (!showAlumni && s.graduatedAt) return false;
      const matchesSearch =
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.rollNoOrUSN.toLowerCase().includes(search.toLowerCase());
      const matchesDept = !deptFilter || s.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [students, search, deptFilter, showAlumni]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const loadDocuments = async (studentId: string) => {
    setDocsLoading(true);
    try {
      const docs = await onFetchDocuments(studentId);
      setDocuments(docs);
    } catch {
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const openDetailSheet = (s: StudentItem) => {
    setDetailSheet(s);
    loadDocuments(s.id);
  };

  const handleAddDocument = async () => {
    if (!detailSheet || !docFileName.trim()) return;
    try {
      await onAddDocument(detailSheet.id, { documentType: docType, fileName: docFileName, fileUrl: '' });
      setAddDocModal(false);
      setDocFileName('');
      loadDocuments(detailSheet.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add document');
    }
  };

  const handleDeleteDocument = (docId: string) => {
    if (!detailSheet) return;
    Alert.alert('Delete Document', 'Remove this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await onDeleteDocument(detailSheet.id, docId);
            loadDocuments(detailSheet.id);
          } catch {}
        },
      },
    ]);
  };

  const handleBulkDelete = () => {
    const toDelete = Array.from(selectedIds);
    Alert.alert('Delete Students', `Permanently delete ${toDelete.length} student(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          for (const id of toDelete) {
            try { await onDeleteStudent(id); } catch {}
          }
          exitSelectMode();
        },
      },
    ]);
  };

  const handleBulkPromote = () => {
    const selected = filteredStudents.filter((s) => selectedIds.has(s.id));
    if (selected.length === 0) return;
    setPromoteModal({ students: selected });
  };

  const handleBulkGraduate = () => {
    const toGraduate = Array.from(selectedIds);
    Alert.alert('Graduate Students', `Mark ${toGraduate.length} student(s) as graduated?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Graduate',
        onPress: async () => {
          try { await onGraduateStudents(toGraduate); } catch {}
          exitSelectMode();
        },
      },
    ]);
  };

  // Open edit modal with pre-filled data
  const openEdit = (s: StudentItem) => {
    const nameParts = s.fullName.split(' ');
    setEditFirstName(nameParts[0] || '');
    setEditLastName(nameParts.slice(1).join(' ') || '');
    setEditEmail(s.email);
    setEditRollNo(s.rollNoOrUSN);
    setEditDept(s.department || '');
    setEditYear(s.academicYear || '');
    setEditSection(s.section || '');
    setEditPhone(s.phone || '');
    setEditParentPhone(s.parentPhone || '');
    setEditTenth(s.tenthPercentage || '');
    setEditTwelfth(s.twelfthPercentage || '');
    setEditModal(s);
  };

  const handleCreate = async () => {
    if (!firstName || !lastName || !email || !rollNoOrUSN) {
      Alert.alert('Missing Fields', 'First Name, Last Name, Email, and USN / Roll No are required.');
      return;
    }
    setSubmitting(true);
    try {
      await onCreateStudent({ firstName, lastName, email, rollNoOrUSN, department: dept, academicYear: year, section, password });
      setCreateModalOpen(false);
      setFirstName(''); setLastName(''); setEmail(''); setRollNoOrUSN('');
      Alert.alert('Success', 'Student account created!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editModal) return;
    setSubmitting(true);
    try {
      await onUpdateStudent(editModal.id, {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        rollNoOrUSN: editRollNo,
        department: editDept,
        academicYear: editYear,
        section: editSection,
        phone: editPhone,
        parentPhone: editParentPhone,
        tenthPercentage: editTenth,
        twelfthPercentage: editTwelfth,
      });
      setEditModal(null);
      Alert.alert('Success', 'Student updated!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (s: StudentItem) => {
    try { await onDeleteStudent(s.id); } catch {}
    setDeleteConfirm(null);
  };

  const handlePromote = async () => {
    if (!promoteModal || !promoteTarget) return;
    const ids = promoteModal.students.map((s) => s.id);
    setSubmitting(true);
    try {
      await onPromoteStudents(ids, promoteTarget, promoteYear);
      setPromoteModal(null);
      exitSelectMode();
      Alert.alert('Success', `${ids.length} student(s) promoted!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to promote students');
    } finally {
      setSubmitting(false);
    }
  };

  const renderChipRow = (label: string, value: string, setValue: (v: string) => void, options: string[]) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {options.length === 0 ? (
          <Text style={styles.chipHint}>No options configured.</Text>
        ) : (
          options.map((opt) => {
            const selected = value === opt;
            return (
              <TouchableOpacity key={opt} style={[styles.chip, selected && styles.chipSelected]} onPress={() => setValue(opt)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search & Action Bar */}
      <View style={styles.headerBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6B6B6B" />
          <TextInput style={styles.searchInput} placeholder="Search by name, email, USN..." value={search} onChangeText={setSearch} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateModalOpen(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Department Filter + Alumni Toggle */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
          <TouchableOpacity style={[styles.filterChip, !deptFilter && styles.filterChipActive]} onPress={() => setDeptFilter('')}>
            <Text style={[styles.filterChipText, !deptFilter && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {departments.map((d) => (
            <TouchableOpacity key={d} style={[styles.filterChip, deptFilter === d && styles.filterChipActive]} onPress={() => setDeptFilter(d)}>
              <Text style={[styles.filterChipText, deptFilter === d && styles.filterChipTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={[styles.alumniToggle, showAlumni && styles.alumniToggleActive]} onPress={() => setShowAlumni(!showAlumni)}>
          <MaterialCommunityIcons name="school" size={16} color={showAlumni ? '#FFFFFF' : '#6B6B6B'} />
          <Text style={[styles.alumniToggleText, showAlumni && styles.alumniToggleTextActive]}>Alumni</Text>
        </TouchableOpacity>
      </View>

      {/* Multi-Select Action Bar */}
      {selectMode && (
        <View style={styles.selectBar}>
          <Text style={styles.selectCount}>{selectedIds.size} selected</Text>
          <View style={styles.selectActions}>
            <TouchableOpacity style={styles.selectAction} onPress={handleBulkPromote}>
              <MaterialCommunityIcons name="arrow-up-bold" size={18} color="#F4C430" />
              <Text style={styles.selectActionText}>Promote</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectAction} onPress={handleBulkGraduate}>
              <MaterialCommunityIcons name="school" size={18} color="#16A34A" />
              <Text style={styles.selectActionText}>Graduate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectAction} onPress={handleBulkDelete}>
              <MaterialCommunityIcons name="delete" size={18} color="#DC3545" />
              <Text style={[styles.selectActionText, { color: '#DC3545' }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectCancel} onPress={exitSelectMode}>
              <Text style={styles.selectCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Student List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-school-outline" size={40} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>{showAlumni ? 'No Alumni Yet' : 'No Students Enrolled'}</Text>
            <Text style={styles.emptySub}>{showAlumni ? 'Graduated students will appear here.' : 'Click "+ Add" above to onboard a student.'}</Text>
          </View>
        ) : (
          filteredStudents.map((stud) => {
            const isSelected = selectedIds.has(stud.id);
            return (
              <TouchableOpacity
                key={stud.id}
                style={[styles.studentCard, isSelected && styles.studentCardSelected]}
                onPress={() => {
                  if (selectMode) toggleSelect(stud.id);
                  else openDetailSheet(stud);
                }}
                onLongPress={() => {
                  if (!showAlumni) {
                    setSelectMode(true);
                    setSelectedIds(new Set([stud.id]));
                  }
                }}
                activeOpacity={0.7}
              >
                {selectMode && (
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
                  </View>
                )}
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{stud.fullName.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>{stud.fullName}</Text>
                  <Text style={styles.studentEmail}>{stud.email}</Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.codeBadge}>{isCollege ? 'USN' : 'Roll'}: {stud.rollNoOrUSN || '-'}</Text>
                    {isCollege && stud.department && <Text style={styles.deptBadge}>{stud.department}</Text>}
                    {stud.academicYear && <Text style={styles.yearBadge}>{stud.academicYear}</Text>}
                    {stud.section && <Text style={styles.sectionBadge}>Sec {stud.section}</Text>}
                    {stud.graduatedAt && <Text style={styles.alumniBadge}>Alumni</Text>}
                  </View>
                </View>
                {!selectMode && !showAlumni && (
                  <TouchableOpacity style={styles.moreBtn} onPress={() => setDetailSheet(stud)}>
                    <MaterialCommunityIcons name="dots-vertical" size={20} color="#6B6B6B" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ─── Create Modal ─── */}
      <Modal visible={createModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Onboard New Student</Text>
              <TouchableOpacity onPress={() => setCreateModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput style={styles.input} placeholder="e.g. Aarav" value={firstName} onChangeText={setFirstName} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput style={styles.input} placeholder="e.g. Sharma" value={lastName} onChangeText={setLastName} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput style={styles.input} placeholder="aarav@school.edu" value={email} onChangeText={setEmail} keyboardType="email-address" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{isCollege ? 'USN *' : 'Roll Number *'}</Text>
                <TextInput style={styles.input} placeholder={isCollege ? 'USN23CS101' : 'Roll 101'} value={rollNoOrUSN} onChangeText={setRollNoOrUSN} />
              </View>
              {isCollege && renderChipRow('Department', dept, setDept, departments)}
              {renderChipRow('Academic Year', year, setYear, academicYears)}
              {renderChipRow('Section', section, setSection, sections)}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Temporary Password *</Text>
                <TextInput style={styles.input} value={password} onChangeText={setPassword} />
                <Text style={styles.hintText}>Student will change password on first login.</Text>
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Student'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Detail Bottom Sheet ─── */}
      <Modal visible={!!detailSheet} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.detailSheet]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Student Details</Text>
              <TouchableOpacity onPress={() => setDetailSheet(null)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            {detailSheet && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailBody}>
                <View style={styles.detailAvatar}>
                  <Text style={styles.detailAvatarText}>{detailSheet.fullName.substring(0, 2).toUpperCase()}</Text>
                </View>
                <Text style={styles.detailName}>{detailSheet.fullName}</Text>
                <Text style={styles.detailEmail}>{detailSheet.email}</Text>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Academic Info</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{isCollege ? 'USN' : 'Roll No'}</Text>
                    <Text style={styles.detailValue}>{detailSheet.rollNoOrUSN || '-'}</Text>
                  </View>
                  {isCollege && detailSheet.department && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Department</Text>
                      <Text style={styles.detailValue}>{detailSheet.department}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Academic Year</Text>
                    <Text style={styles.detailValue}>{detailSheet.academicYear || '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Section</Text>
                    <Text style={styles.detailValue}>{detailSheet.section || '-'}</Text>
                  </View>
                  {isCollege && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>10th %</Text>
                        <Text style={styles.detailValue}>{detailSheet.tenthPercentage || '-'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>12th %</Text>
                        <Text style={styles.detailValue}>{detailSheet.twelfthPercentage || '-'}</Text>
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Contact</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>{detailSheet.phone || '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Parent Phone</Text>
                    <Text style={styles.detailValue}>{detailSheet.parentPhone || '-'}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Status</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Profile</Text>
                    <Text style={[styles.detailValue, { color: detailSheet.profileCompleted ? '#16A34A' : '#D97706' }]}>
                      {detailSheet.profileCompleted ? 'Complete' : 'Pending'}
                    </Text>
                  </View>
                  {detailSheet.graduatedAt && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Graduated</Text>
                      <Text style={styles.detailValue}>{new Date(detailSheet.graduatedAt).toLocaleDateString()}</Text>
                    </View>
                  )}
                </View>

                {/* Documents */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Documents</Text>
                  {docsLoading ? (
                    <Text style={styles.hintText}>Loading documents...</Text>
                  ) : documents.length === 0 ? (
                    <Text style={styles.hintText}>No documents uploaded</Text>
                  ) : (
                    documents.map((doc) => (
                      <View key={doc.id} style={styles.detailRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name="file-document" size={14} color="#F4C430" />
                          <Text style={styles.detailLabel}>{doc.documentType}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.detailValue} numberOfLines={1}>{doc.fileName}</Text>
                          <TouchableOpacity onPress={() => handleDeleteDocument(doc.id)}>
                            <MaterialCommunityIcons name="delete-outline" size={14} color="#DC3545" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                {!detailSheet.graduatedAt && (
                  <View style={styles.detailActions}>
                    <TouchableOpacity style={styles.detailActionBtn} onPress={() => { setDetailSheet(null); openEdit(detailSheet); }}>
                      <MaterialCommunityIcons name="pencil" size={18} color="#F4C430" />
                      <Text style={styles.detailActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.detailActionBtn} onPress={() => { setDetailSheet(null); setPromoteModal({ students: [detailSheet] }); }}>
                      <MaterialCommunityIcons name="arrow-up-bold" size={18} color="#16A34A" />
                      <Text style={[styles.detailActionText, { color: '#16A34A' }]}>Promote</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.detailActionBtn} onPress={() => {
                      Alert.alert('Graduate', `Mark ${detailSheet.fullName} as graduated?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Graduate', onPress: async () => { await onGraduateStudents([detailSheet.id]); setDetailSheet(null); } },
                      ]);
                    }}>
                      <MaterialCommunityIcons name="school" size={18} color="#6B6B6B" />
                      <Text style={styles.detailActionText}>Graduate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.detailActionBtn} onPress={() => { setDetailSheet(null); setDeleteConfirm(detailSheet); }}>
                      <MaterialCommunityIcons name="delete" size={18} color="#DC3545" />
                      <Text style={[styles.detailActionText, { color: '#DC3545' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── Edit Modal ─── */}
      <Modal visible={!!editModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Student</Text>
              <TouchableOpacity onPress={() => setEditModal(null)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput style={styles.input} value={editFirstName} onChangeText={setEditFirstName} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput style={styles.input} value={editLastName} onChangeText={setEditLastName} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{isCollege ? 'USN' : 'Roll Number'}</Text>
                <TextInput style={styles.input} value={editRollNo} onChangeText={setEditRollNo} />
              </View>
              {isCollege && renderChipRow('Department', editDept, setEditDept, departments)}
              {renderChipRow('Academic Year', editYear, setEditYear, academicYears)}
              {renderChipRow('Section', editSection, setEditSection, sections)}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput style={styles.input} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Parent Phone</Text>
                <TextInput style={styles.input} value={editParentPhone} onChangeText={setEditParentPhone} keyboardType="phone-pad" />
              </View>
              {isCollege && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>10th %</Text>
                    <TextInput style={styles.input} value={editTenth} onChangeText={setEditTenth} keyboardType="numeric" />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>12th %</Text>
                    <TextInput style={styles.input} value={editTwelfth} onChangeText={setEditTwelfth} keyboardType="numeric" />
                  </View>
                </>
              )}
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

      {/* ─── Promote Modal ─── */}
      <Modal visible={!!promoteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Promote Student(s)</Text>
              <TouchableOpacity onPress={() => setPromoteModal(null)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            {promoteModal && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                <Text style={styles.hintText}>Promoting: {promoteModal.students.map((s) => s.fullName).join(', ')}</Text>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Target Class/Section *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {classSections.map((cs) => (
                      <TouchableOpacity
                        key={cs.id}
                        style={[styles.chip, promoteTarget === cs.id && styles.chipSelected]}
                        onPress={() => setPromoteTarget(cs.id)}
                      >
                        <Text style={[styles.chipText, promoteTarget === cs.id && styles.chipTextSelected]}>{cs.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                {renderChipRow('Academic Year', promoteYear, setPromoteYear, academicYears)}
              </ScrollView>
            )}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPromoteModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handlePromote} disabled={submitting || !promoteTarget}>
                <Text style={styles.submitText}>{submitting ? 'Promoting...' : 'Promote'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Delete Confirm ─── */}
      <Modal visible={!!deleteConfirm} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Student</Text>
              <TouchableOpacity onPress={() => setDeleteConfirm(null)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.deleteText}>
              Are you sure you want to delete <Text style={{ fontWeight: '700' }}>{deleteConfirm?.fullName}</Text>? This action cannot be undone.
            </Text>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteConfirm(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#DC3545' }]}
                onPress={() => deleteConfirm && handleDelete(deleteConfirm)}
              >
                <Text style={styles.submitText}>Delete</Text>
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
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input, borderWidth: 1, borderColor: '#E8E5DC', paddingHorizontal: 12, height: 44, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#171717' },
  addBtn: { backgroundColor: '#F4C430', borderRadius: BorderRadius.button, paddingHorizontal: 16, height: 44, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  filterChips: { flex: 1, flexDirection: 'row', gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.chip, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E5DC' },
  filterChipActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  filterChipText: { fontSize: 11, fontWeight: '600', color: '#6B6B6B' },
  filterChipTextActive: { color: '#FFFFFF' },
  alumniToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.chip, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E5DC' },
  alumniToggleActive: { backgroundColor: '#171717', borderColor: '#171717' },
  alumniToggleText: { fontSize: 11, fontWeight: '600', color: '#6B6B6B' },
  alumniToggleTextActive: { color: '#FFFFFF' },

  selectBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF4C7', borderRadius: BorderRadius.card, padding: 10, marginBottom: 10 },
  selectCount: { fontSize: 13, fontWeight: '700', color: '#171717' },
  selectActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  selectAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectActionText: { fontSize: 12, fontWeight: '600', color: '#171717' },
  selectCancel: { paddingLeft: 8 },
  selectCancelText: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },

  listContainer: { gap: 10, paddingBottom: 40 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E8E5DC', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#171717', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 4, lineHeight: 16 },

  studentCard: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 14, borderWidth: 1, borderColor: '#E8E5DC',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  studentCardSelected: { borderColor: '#F4C430', backgroundColor: '#FFFDF7' },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#E8E5DC', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF4C7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '800', color: '#F4C430' },
  studentDetails: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#171717' },
  studentEmail: { fontSize: 11, color: '#6B6B6B', marginTop: 1 },
  badgeRow: { flexDirection: 'row', gap: 5, marginTop: 5, flexWrap: 'wrap' },
  codeBadge: { backgroundColor: '#FFFDF7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, fontSize: 10, fontWeight: '600', color: '#6B6B6B' },
  deptBadge: { backgroundColor: '#FFF4C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, fontSize: 10, fontWeight: '600', color: '#F4C430' },
  yearBadge: { backgroundColor: '#FFFDF7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, fontSize: 10, fontWeight: '600', color: '#171717' },
  sectionBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, fontSize: 10, fontWeight: '600', color: '#D97706' },
  alumniBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, fontSize: 10, fontWeight: '600', color: '#16A34A' },
  moreBtn: { padding: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 20, gap: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#171717' },
  formGroup: { gap: 4, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#171717' },
  input: { height: 44, borderWidth: 1, borderColor: '#E8E5DC', borderRadius: BorderRadius.input, paddingHorizontal: 12, fontSize: 13, backgroundColor: '#FFFDF7' },
  hintText: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.chip, borderWidth: 1, borderColor: '#E8E5DC', backgroundColor: '#FFFDF7', marginRight: 6 },
  chipSelected: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  chipHint: { fontSize: 11, color: '#6B6B6B', paddingVertical: 4 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#6B6B6B', fontWeight: '700', fontSize: 13 },
  submitBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#F4C430', borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  // Detail sheet
  detailSheet: { maxHeight: '85%' },
  detailBody: { alignItems: 'center', gap: 8, paddingBottom: 20 },
  detailAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF4C7', alignItems: 'center', justifyContent: 'center' },
  detailAvatarText: { fontSize: 22, fontWeight: '800', color: '#F4C430' },
  detailName: { fontSize: 18, fontWeight: '800', color: '#171717' },
  detailEmail: { fontSize: 13, color: '#6B6B6B' },
  detailSection: { width: '100%', backgroundColor: '#FFFDF7', borderRadius: BorderRadius.card, borderWidth: 1, borderColor: '#E8E5DC', padding: 14, gap: 6, marginTop: 10 },
  detailSectionTitle: { fontSize: 12, fontWeight: '800', color: '#171717', marginBottom: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  detailLabel: { fontSize: 12, color: '#6B6B6B' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#171717' },
  detailActions: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E8E5DC' },
  detailActionBtn: { alignItems: 'center', gap: 4 },
  detailActionText: { fontSize: 11, fontWeight: '600', color: '#171717' },

  deleteText: { fontSize: 14, color: '#171717', lineHeight: 20, marginVertical: 10 },
});
