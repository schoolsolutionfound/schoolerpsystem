import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import {
  createClassSectionApi,
  updateClassSectionApi,
  deleteClassSectionApi,
  createSubjectApi,
  createSubjectTeacherApi,
  updateSubjectTeacherApi,
  deleteSubjectTeacherApi,
  createPeriodApi,
  updateTermsApi,
  updateHolidaysApi,
  fetchExamsApi,
  createExamApi,
  updateExamApi,
  fetchExamApi,
  fetchMarksForClassApi,
  saveMarksApi,
} from '../../../api/academics';
import { AdminTimetableView } from './AdminTimetableView';
import { AdminAttendanceView } from './AdminAttendanceView';

interface AdminAcademicsViewProps {
  institutionType: string;
  departments: string[];
  academicYears: string[];
  sections: string[];
  classSections: any[];
  subjects: any[];
  subjectTeachers: any[];
  periods: any[];
  teachers: any[];
  terms: any[];
  blockedDates: any[];
  onDataChange: () => void;
}

export const AdminAcademicsView: React.FC<AdminAcademicsViewProps> = ({
  institutionType,
  departments,
  academicYears,
  sections,
  classSections,
  subjects,
  subjectTeachers,
  periods,
  teachers,
  terms,
  blockedDates,
  onDataChange,
}) => {
  const [tab, setTab] = useState<'classes' | 'subjects' | 'assign' | 'periods' | 'timetable' | 'attendance' | 'terms' | 'holidays' | 'marks'>('classes');

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {([
          ['classes', 'Classes'],
          ['subjects', 'Subjects'],
          ['assign', 'Assign'],
          ['periods', 'Periods'],
          ['timetable', 'Timetable'],
          ['attendance', 'Attendance'],
          ['terms', 'Terms'],
          ['holidays', 'Holidays'],
          ['marks', 'Marks'],
        ] as const).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.tabChip, tab === key && styles.tabChipActive]} onPress={() => setTab(key)}>
            <Text style={[styles.tabChipText, tab === key && styles.tabChipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'classes' && (
          <ClassesTab
            institutionType={institutionType}
            departments={departments}
            academicYears={academicYears}
            sections={sections}
            classSections={classSections}
            teachers={teachers}
            onDataChange={onDataChange}
          />
        )}
        {tab === 'subjects' && <SubjectsTab subjects={subjects} onDataChange={onDataChange} />}
        {tab === 'assign' && (
          <AssignTab
            classSections={classSections}
            subjects={subjects}
            teachers={teachers}
            subjectTeachers={subjectTeachers}
            onDataChange={onDataChange}
          />
        )}
        {tab === 'periods' && <PeriodsTab periods={periods} onDataChange={onDataChange} />}
        {tab === 'timetable' && <AdminTimetableView classSections={classSections} />}
        {tab === 'attendance' && <AdminAttendanceView classSections={classSections} />}
        {tab === 'terms' && <TermsTab terms={terms} onDataChange={onDataChange} />}
        {tab === 'holidays' && <HolidaysTab blockedDates={blockedDates} onDataChange={onDataChange} />}
        {tab === 'marks' && (
          <MarksTab
            classSections={classSections}
            subjects={subjects}
            onDataChange={onDataChange}
          />
        )}
      </ScrollView>
    </View>
  );
};

function ClassesTab({ institutionType, departments, academicYears, sections, classSections, teachers, onDataChange }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState(departments[0] || '');
  const [academicYear, setAcademicYear] = useState(academicYears[0] || '');
  const [section, setSection] = useState(sections[0] || '');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name) { Alert.alert('Missing', 'Class/section name is required'); return; }
    setSubmitting(true);
    try {
      await createClassSectionApi({
        name,
        department,
        academicYear,
        section,
        classTeacherId,
      });
      setModalOpen(false);
      setName('');
      setClassTeacherId('');
      onDataChange();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Class', 'Remove this class/section?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteClassSectionApi(id); onDataChange(); } catch (e: any) { Alert.alert('Error', e.message); } } },
    ]);
  };

  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAcademicYear, setEditAcademicYear] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editClassTeacherId, setEditClassTeacherId] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const openEdit = (cs: any) => {
    setEditTarget(cs);
    setEditName(cs.name || '');
    setEditDepartment(cs.department || '');
    setEditAcademicYear(cs.academicYear || '');
    setEditSection(cs.section || '');
    setEditClassTeacherId(cs.classTeacherId || '');
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditName('');
    setEditDepartment('');
    setEditAcademicYear('');
    setEditSection('');
    setEditClassTeacherId('');
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    if (!editName) { Alert.alert('Missing', 'Class/section name is required'); return; }
    setEditSubmitting(true);
    try {
      await updateClassSectionApi(editTarget.id, {
        name: editName,
        department: editDepartment,
        academicYear: editAcademicYear,
        section: editSection,
        classTeacherId: editClassTeacherId,
      });
      closeEdit();
      onDataChange();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleUnassignTeacher = () => {
    if (!editTarget) return;
    Alert.alert('Unassign Class Teacher', 'Remove the current class teacher for this class?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unassign',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateClassSectionApi(editTarget.id, { classTeacherId: '' });
            setEditClassTeacherId('');
            onDataChange();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const teacherName = (id: string) => teachers.find((t: any) => t.id === id)?.fullName || 'Unassigned';

  return (
    <View>
      <View style={styles.headerBar}>
        <Text style={styles.sectionTitle}>{institutionType === 'college' ? 'Class Sections' : 'Classes & Sections'}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {classSections.length === 0 ? (
        <EmptyState icon="school-outline" title="No classes yet" sub="Create classes/sections and assign a class teacher." />
      ) : (
        classSections.map((cs: any) => (
          <View key={cs.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <MaterialCommunityIcons name="school-outline" size={18} color="#F4C430" />
                <Text style={styles.cardTitle}>{cs.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => openEdit(cs)}>
                  <MaterialCommunityIcons name="pencil-outline" size={18} color="#1A1B1C" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(cs.id)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
            {institutionType === 'college' ? (
              <Text style={styles.cardSub}>{cs.department} · {cs.academicYear} · {cs.section}</Text>
            ) : (
              <Text style={styles.cardSub}>{cs.department || 'General'} · {cs.academicYear || ''} · Section {cs.section}</Text>
            )}
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>Class Teacher: {teacherName(cs.classTeacherId)}</Text>
            </View>
          </View>
        ))
      )}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Class/Section</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}><MaterialCommunityIcons name="close" size={22} color="#6B6B6B" /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              <FormGroup label="Name *">
                <TextInput style={styles.input} placeholder={institutionType === 'college' ? 'e.g. CSE 1st Year A' : 'e.g. Science Class 10 A'} value={name} onChangeText={setName} />
              </FormGroup>
              {institutionType === 'college' ? (
                <>
                  <FormGroup label="Department"><TextInput style={styles.input} placeholder="Department" value={department} onChangeText={setDepartment} /></FormGroup>
                  <FormGroup label="Academic Year"><TextInput style={styles.input} placeholder="e.g. 3rd Year" value={academicYear} onChangeText={setAcademicYear} /></FormGroup>
                  <FormGroup label="Section"><TextInput style={styles.input} placeholder="e.g. Section A" value={section} onChangeText={setSection} /></FormGroup>
                </>
              ) : (
                <>
                  <FormGroup label="Department / Stream"><TextInput style={styles.input} placeholder="e.g. Science" value={department} onChangeText={setDepartment} /></FormGroup>
                  <FormGroup label="Class"><TextInput style={styles.input} placeholder="e.g. Class 10" value={academicYear} onChangeText={setAcademicYear} /></FormGroup>
                  <FormGroup label="Section"><TextInput style={styles.input} placeholder="e.g. A" value={section} onChangeText={setSection} /></FormGroup>
                </>
              )}
              <FormGroup label="Class Teacher">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {teachers.map((t: any) => (
                    <TouchableOpacity key={t.id} style={[styles.chip, classTeacherId === t.id && styles.chipActive]} onPress={() => setClassTeacherId(t.id)}>
                      <Text style={[styles.chipText, classTeacherId === t.id && styles.chipTextActive]}>{t.fullName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </FormGroup>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Class Modal */}
      <Modal visible={!!editTarget} animationType="slide" transparent onRequestClose={closeEdit}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Class / Section</Text>
              <TouchableOpacity onPress={closeEdit}><MaterialCommunityIcons name="close" size={22} color="#6B6B6B" /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              <FormGroup label="Name *">
                <TextInput style={styles.input} placeholder="Class / section name" value={editName} onChangeText={setEditName} />
              </FormGroup>
              {institutionType === 'college' ? (
                <>
                  <FormGroup label="Department"><TextInput style={styles.input} placeholder="Department" value={editDepartment} onChangeText={setEditDepartment} /></FormGroup>
                  <FormGroup label="Academic Year"><TextInput style={styles.input} placeholder="e.g. 3rd Year" value={editAcademicYear} onChangeText={setEditAcademicYear} /></FormGroup>
                  <FormGroup label="Section"><TextInput style={styles.input} placeholder="e.g. Section A" value={editSection} onChangeText={setEditSection} /></FormGroup>
                </>
              ) : (
                <>
                  <FormGroup label="Department / Stream"><TextInput style={styles.input} placeholder="e.g. Science" value={editDepartment} onChangeText={setEditDepartment} /></FormGroup>
                  <FormGroup label="Class"><TextInput style={styles.input} placeholder="e.g. Class 10" value={editAcademicYear} onChangeText={setEditAcademicYear} /></FormGroup>
                  <FormGroup label="Section"><TextInput style={styles.input} placeholder="e.g. A" value={editSection} onChangeText={setEditSection} /></FormGroup>
                </>
              )}
              <FormGroup label="Class Teacher">
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.cardSub}>
                    {editClassTeacherId
                      ? `Current: ${teacherName(editClassTeacherId)}`
                      : 'Currently unassigned'}
                  </Text>
                  {editClassTeacherId ? (
                    <TouchableOpacity onPress={handleUnassignTeacher}>
                      <Text style={{ color: '#DC3545', fontSize: 12, fontWeight: '700' }}>Unassign</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {teachers.map((t: any) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.chip, editClassTeacherId === t.id && styles.chipActive]}
                      onPress={() => setEditClassTeacherId(t.id)}
                    >
                      <Text style={[styles.chipText, editClassTeacherId === t.id && styles.chipTextActive]}>{t.fullName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </FormGroup>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeEdit}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSaveEdit} disabled={editSubmitting}>
                <Text style={styles.submitText}>{editSubmitting ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SubjectsTab({ subjects, onDataChange }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name) { Alert.alert('Missing', 'Subject name is required'); return; }
    setSubmitting(true);
    try {
      await createSubjectApi({ name, code });
      setModalOpen(false);
      setName('');
      setCode('');
      onDataChange();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <View style={styles.headerBar}>
        <Text style={styles.sectionTitle}>Subjects</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}><Text style={styles.addBtnText}>+ Add</Text></TouchableOpacity>
      </View>
      {subjects.length === 0 ? (
        <EmptyState icon="book-open-variant" title="No subjects yet" sub="Create subjects like Mathematics, Science, DS, etc." />
      ) : (
        subjects.map((s: any) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name="book-open-variant" size={18} color="#F4C430" />
              <Text style={styles.cardTitle}>{s.name}</Text>
            </View>
            {s.code ? <Text style={styles.cardSub}>Code: {s.code}</Text> : null}
          </View>
        ))
      )}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Subject</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}><MaterialCommunityIcons name="close" size={22} color="#6B6B6B" /></TouchableOpacity>
            </View>
            <FormGroup label="Subject Name *"><TextInput style={styles.input} placeholder="e.g. Mathematics" value={name} onChangeText={setName} /></FormGroup>
            <FormGroup label="Code (optional)"><TextInput style={styles.input} placeholder="e.g. MAT101" value={code} onChangeText={setCode} /></FormGroup>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AssignTab({ classSections, subjects, teachers, subjectTeachers, onDataChange }: any) {
  const [classSectionId, setClassSectionId] = useState(classSections[0]?.id || '');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [teacherId, setTeacherId] = useState(teachers[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);
  const [reassignId, setReassignId] = useState<string | null>(null);
  const [reassignTeacherId, setReassignTeacherId] = useState<string>('');
  const [reassignSubmitting, setReassignSubmitting] = useState(false);

  const list = subjectTeachers.filter((st: any) => st.classSectionId === classSectionId);
  const cls = classSections.find((c: any) => c.id === classSectionId);

  const handleAssign = async () => {
    if (!classSectionId || !subjectId || !teacherId) { Alert.alert('Missing', 'Select class, subject and teacher'); return; }
    setSubmitting(true);
    try {
      await createSubjectTeacherApi({ classSectionId, subjectId, teacherId });
      onDataChange();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = (id: string) => {
    Alert.alert('Remove Assignment', 'Unassign this subject teacher?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { try { await deleteSubjectTeacherApi(id); onDataChange(); } catch (e: any) { Alert.alert('Error', e.message); } } },
    ]);
  };

  const openReassign = (st: any) => {
    setReassignId(st.id);
    setReassignTeacherId(st.teacherId || '');
  };

  const cancelReassign = () => {
    setReassignId(null);
    setReassignTeacherId('');
  };

  const handleSaveReassign = async () => {
    if (!reassignId || !reassignTeacherId) return;
    setReassignSubmitting(true);
    try {
      await updateSubjectTeacherApi(reassignId, { teacherId: reassignTeacherId });
      cancelReassign();
      onDataChange();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setReassignSubmitting(false);
    }
  };

  const label = (list: any[], id: string, key: string) => list.find((x: any) => x.id === id)?.[key] || '';

  // ---- Bulk assign (one teacher + one subject, many class/sections) ----
  const [bulkTeacherId, setBulkTeacherId] = useState(teachers[0]?.id || '');
  const [bulkSubjectId, setBulkSubjectId] = useState(subjects[0]?.id || '');
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; skipped: number; failed: number } | null>(null);

  const bulkExistingSet = new Set(
    subjectTeachers
      .filter((st: any) => st.subjectId === bulkSubjectId)
      .map((st: any) => st.classSectionId)
  );

  const toggleBulkClass = (id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      for (const c of classSections) {
        if (!bulkExistingSet.has(c.id)) next.add(c.id);
      }
      return next;
    });
  };

  const clearBulkSelection = () => setBulkSelected(new Set());

  const handleBulkAssign = async () => {
    if (!bulkTeacherId || !bulkSubjectId) {
      Alert.alert('Missing', 'Pick a subject and a teacher first.');
      return;
    }
    if (bulkSelected.size === 0) {
      Alert.alert('Nothing selected', 'Tick at least one class/section to assign.');
      return;
    }
    setBulkSubmitting(true);
    setBulkProgress({ done: 0, skipped: 0, failed: 0 });
    let done = 0, skipped = 0, failed = 0;
    for (const csId of bulkSelected) {
      if (bulkExistingSet.has(csId)) { skipped++; setBulkProgress({ done, skipped, failed }); continue; }
      try {
        await createSubjectTeacherApi({ classSectionId: csId, subjectId: bulkSubjectId, teacherId: bulkTeacherId });
        done++;
      } catch (err: any) {
        // 409 = already assigned (race / pre-existing). Treat as skipped.
        if (err && (err.status === 409 || /SUBJECT_TEACHER_EXISTS|already/i.test(String(err.message)))) {
          skipped++;
        } else {
          failed++;
        }
      }
      setBulkProgress({ done, skipped, failed });
    }
    setBulkSubmitting(false);
    clearBulkSelection();
    onDataChange();
    if (failed > 0) {
      Alert.alert('Bulk assign finished', `${done} created, ${skipped} already assigned, ${failed} failed.`);
    } else if (skipped > 0) {
      Alert.alert('Bulk assign finished', `${done} created, ${skipped} already assigned.`);
    }
  };

  const bulkSubjectName = label(subjects, bulkSubjectId, 'name') || '—';
  const bulkTeacherName = label(teachers, bulkTeacherId, 'fullName') || '—';

  return (
    <View>
      <Text style={styles.sectionTitle}>Assign Subject Teachers</Text>
      <Text style={styles.hintText}>Each subject per class/section gets one teacher.</Text>

      <FormGroup label="Class / Section">
        <View style={styles.chipWrap}>
          {classSections.map((c: any) => (
            <TouchableOpacity key={c.id} style={[styles.chip, classSectionId === c.id && styles.chipActive]} onPress={() => setClassSectionId(c.id)}>
              <Text style={[styles.chipText, classSectionId === c.id && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </FormGroup>

      {cls ? (
        <>
          <FormGroup label="Subject">
            <View style={styles.chipWrap}>
              {subjects.map((s: any) => (
                <TouchableOpacity key={s.id} style={[styles.chip, subjectId === s.id && styles.chipActive]} onPress={() => setSubjectId(s.id)}>
                  <Text style={[styles.chipText, subjectId === s.id && styles.chipTextActive]}>{s.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormGroup>

          <FormGroup label="Teacher">
            <View style={styles.chipWrap}>
              {teachers.map((t: any) => (
                <TouchableOpacity key={t.id} style={[styles.chip, teacherId === t.id && styles.chipActive]} onPress={() => setTeacherId(t.id)}>
                  <Text style={[styles.chipText, teacherId === t.id && styles.chipTextActive]}>{t.fullName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormGroup>

          <TouchableOpacity style={styles.fullBtn} onPress={handleAssign} disabled={submitting}>
            <Text style={styles.submitText}>{submitting ? 'Assigning...' : 'Assign Subject Teacher'}</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Current Assignments for {cls.name}</Text>
          {list.length === 0 ? (
            <EmptyState icon="account-search" title="No assignments yet" sub="Assign subjects above." />
          ) : (
            list.map((st: any) => (
              <View key={st.id} style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <MaterialCommunityIcons name="account-tie" size={18} color="#F4C430" />
                  <Text style={styles.cardTitle}>{label(subjects, st.subjectId, 'name')}</Text>
                </View>
                <Text style={styles.cardSub}>
                  Current: {label(teachers, st.teacherId, 'fullName') || 'Unassigned'}
                </Text>

                {reassignId === st.id ? (
                  <View style={{ marginTop: 10, gap: 8 }}>
                    <Text style={[styles.cardSub, { fontWeight: '700' }]}>Pick a new teacher</Text>
                    <View style={styles.chipWrap}>
                      {teachers.map((t: any) => (
                        <TouchableOpacity
                          key={t.id}
                          style={[styles.chip, reassignTeacherId === t.id && styles.chipActive]}
                          onPress={() => setReassignTeacherId(t.id)}
                        >
                          <Text style={[styles.chipText, reassignTeacherId === t.id && styles.chipTextActive]}>{t.fullName}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.modalFooter}>
                      <TouchableOpacity style={styles.cancelBtn} onPress={cancelReassign}>
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={handleSaveReassign}
                        disabled={reassignSubmitting || reassignTeacherId === st.teacherId}
                      >
                        <Text style={styles.submitText}>
                          {reassignSubmitting ? 'Saving...' : 'Save'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 }}>
                    <TouchableOpacity onPress={() => openReassign(st)}>
                      <MaterialCommunityIcons name="account-switch-outline" size={18} color="#1A1B1C" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRemove(st.id)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </>
      ) : (
        <EmptyState icon="school-outline" title="No classes" sub="Create a class first." />
      )}

      {/* Bulk assign — one teacher + one subject, many class/sections */}
      <View style={[styles.card, { marginTop: 22 }]}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="account-multiple-plus-outline" size={18} color="#F4C430" />
          <Text style={styles.sectionTitle}>Bulk Assign</Text>
        </View>
        <Text style={styles.hintText}>
          Assign one teacher to one subject across many class/sections in one go. Already-assigned
          ones are skipped automatically.
        </Text>

        <FormGroup label="Subject">
          <View style={styles.chipWrap}>
            {subjects.map((s: any) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, bulkSubjectId === s.id && styles.chipActive]}
                onPress={() => setBulkSubjectId(s.id)}
              >
                <Text style={[styles.chipText, bulkSubjectId === s.id && styles.chipTextActive]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormGroup>

        <FormGroup label="Teacher">
          <View style={styles.chipWrap}>
            {teachers.map((t: any) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.chip, bulkTeacherId === t.id && styles.chipActive]}
                onPress={() => setBulkTeacherId(t.id)}
              >
                <Text style={[styles.chipText, bulkTeacherId === t.id && styles.chipTextActive]}>{t.fullName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormGroup>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 8 }}>
          <Text style={styles.cardSub}>
            {bulkSelected.size} selected · {bulkExistingSet.size} already assigned
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={selectAllVisible}>
              <Text style={{ color: '#1A1B1C', fontSize: 12, fontWeight: '700' }}>Select all available</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearBulkSelection}>
              <Text style={{ color: '#6B6B6B', fontSize: 12, fontWeight: '700' }}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ gap: 6 }}>
          {classSections.map((c: any) => {
            const isExisting = bulkExistingSet.has(c.id);
            const isSelected = bulkSelected.has(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => !isExisting && toggleBulkClass(c.id)}
                activeOpacity={isExisting ? 1 : 0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isSelected ? '#F4C430' : '#E8E5DC',
                  backgroundColor: isSelected ? '#FFF4C7' : '#FFFFFF',
                  opacity: isExisting ? 0.55 : 1,
                }}
              >
                <MaterialCommunityIcons
                  name={isExisting ? 'check-circle' : isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={18}
                  color={isExisting ? '#16A34A' : isSelected ? '#F4C430' : '#9A9A9A'}
                />
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: '#1A1B1C' }}>
                  {c.name}
                </Text>
                {isExisting ? (
                  <Text style={{ fontSize: 10, color: '#16A34A', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Already
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.modalFooter}>
          <Text style={[styles.cardSub, { flex: 1 }]}>
            {bulkSubmitting && bulkProgress
              ? `Working… ${bulkProgress.done + bulkProgress.skipped + bulkProgress.failed}/${bulkSelected.size}`
              : `Will assign ${bulkSubjectName} → ${bulkTeacherName}`}
          </Text>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleBulkAssign}
            disabled={bulkSubmitting || bulkSelected.size === 0}
          >
            <Text style={styles.submitText}>
              {bulkSubmitting ? 'Assigning…' : `Assign ${bulkSelected.size}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function PeriodsTab({ periods, onDataChange }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:50');
  const [sortOrder, setSortOrder] = useState(String(periods.length + 1));
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!label || !startTime || !endTime) { Alert.alert('Missing', 'Label and times are required'); return; }
    setSubmitting(true);
    try {
      await createPeriodApi({ label, startTime, endTime, sortOrder: Number(sortOrder) || 0 });
      setModalOpen(false);
      setLabel('');
      onDataChange();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <View style={styles.headerBar}>
        <Text style={styles.sectionTitle}>Period Slots</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalOpen(true)}><Text style={styles.addBtnText}>+ Add</Text></TouchableOpacity>
      </View>
      <Text style={styles.hintText}>Period timing slots used by the timetable (e.g. 6–8 per day).</Text>
      {periods.length === 0 ? (
        <EmptyState icon="clock-outline" title="No periods yet" sub="Define period time slots first." />
      ) : (
        periods.map((p: any) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#F4C430" />
              <Text style={styles.cardTitle}>{p.label}</Text>
              <Text style={styles.timeText}>{p.startTime} – {p.endTime}</Text>
            </View>
          </View>
        ))
      )}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Period</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}><MaterialCommunityIcons name="close" size={22} color="#6B6B6B" /></TouchableOpacity>
            </View>
            <FormGroup label="Label *"><TextInput style={styles.input} placeholder="e.g. Period 1" value={label} onChangeText={setLabel} /></FormGroup>
            <FormGroup label="Start Time * (24h)"><TextInput style={styles.input} placeholder="09:00" value={startTime} onChangeText={setStartTime} /></FormGroup>
            <FormGroup label="End Time * (24h)"><TextInput style={styles.input} placeholder="09:50" value={endTime} onChangeText={setEndTime} /></FormGroup>
            <FormGroup label="Order"><TextInput style={styles.input} placeholder="1" value={sortOrder} onChangeText={setSortOrder} keyboardType="numeric" /></FormGroup>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Saving...' : 'Save'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TermsTab({ terms, onDataChange }: any) {
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [termsInput, setTermsInput] = useState('Semester 1, Semester 2');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    const list = termsInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (!academicYear || list.length === 0) { Alert.alert('Missing', 'Academic year and at least one term are required'); return; }
    setSubmitting(true);
    try {
      await updateTermsApi({ academicYear, terms: list });
      onDataChange();
      Alert.alert('Saved', 'Academic terms updated. Attendance resets at the start of each term.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Academic Terms</Text>
      <Text style={styles.hintText}>Attendance statistics reset at the start of each term.</Text>
      {terms.map((t: any, i: number) => (
        <View key={i} style={styles.card}>
          <Text style={styles.cardTitle}>{t.academicYear}</Text>
          <Text style={styles.cardSub}>{t.terms.join(', ')}</Text>
        </View>
      ))}
      <FormGroup label="Academic Year"><TextInput style={styles.input} value={academicYear} onChangeText={setAcademicYear} placeholder="2026-27" /></FormGroup>
      <FormGroup label="Terms (comma separated)"><TextInput style={styles.input} value={termsInput} onChangeText={setTermsInput} placeholder="Semester 1, Semester 2" /></FormGroup>
      <TouchableOpacity style={styles.fullBtn} onPress={handleSave} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Saving...' : 'Save Terms'}</Text></TouchableOpacity>
    </View>
  );
}

function HolidaysTab({ blockedDates, onDataChange }: any) {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!date) { Alert.alert('Missing', 'Date is required (YYYY-MM-DD)'); return; }
    setSubmitting(true);
    try {
      await updateHolidaysApi({ blockedDates: [...(blockedDates || []), { date, reason }] });
      setDate('');
      setReason('');
      onDataChange();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (removeDate: string) => {
    try {
      await updateHolidaysApi({ blockedDates: (blockedDates || []).filter((b: any) => b.date !== removeDate) });
      onDataChange();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Holiday Calendar</Text>
      <Text style={styles.hintText}>No classes on blocked dates — attendance is prevented and reports exclude them.</Text>
      {blockedDates.length === 0 ? (
        <EmptyState icon="calendar-remove" title="No blocked dates" sub="Add holidays, festivals and exam days." />
      ) : (
        blockedDates.map((b: any) => (
          <View key={b.date} style={styles.card}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons name="calendar-remove" size={18} color="#EF4444" />
              <Text style={styles.cardTitle}>{b.date}</Text>
              {b.reason ? <Text style={styles.cardSub}> · {b.reason}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => handleRemove(b.date)}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))
      )}
      <FormGroup label="Date (YYYY-MM-DD)"><TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2026-08-15" /></FormGroup>
      <FormGroup label="Reason"><TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="e.g. Independence Day" /></FormGroup>
      <TouchableOpacity style={styles.fullBtn} onPress={handleAdd} disabled={submitting}><Text style={styles.submitText}>{submitting ? 'Adding...' : 'Add Blocked Date'}</Text></TouchableOpacity>
    </View>
  );
}

function FormGroup({ label, children }: any) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function EmptyState({ icon, title, sub }: any) {
  return (
    <View style={styles.emptyCard}>
      <MaterialCommunityIcons name={icon} size={40} color="#6B6B6B" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

function MarksTab({ classSections, subjects, onDataChange }: any) {
  const [exams, setExams] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [examName, setExamName] = useState('');
  const [examTerm, setExamTerm] = useState('');
  const [examStart, setExamStart] = useState('');
  const [examEnd, setExamEnd] = useState('');
  const [examSubjects, setExamSubjects] = useState<Record<string, { max: string; pass: string; selected: boolean }>>({});
  const [submitting, setSubmitting] = useState(false);

  const [marksOpen, setMarksOpen] = useState(false);
  const [marksExam, setMarksExam] = useState<any | null>(null);
  const [marksClassId, setMarksClassId] = useState(classSections[0]?.id || '');
  const [marksExamSubjectId, setMarksExamSubjectId] = useState('');
  const [marksRoster, setMarksRoster] = useState<any[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksDraft, setMarksDraft] = useState<Record<string, string>>({});
  const [marksSaving, setMarksSaving] = useState(false);

  const loadExams = async () => {
    setLoadingExams(true);
    try {
      const res = await fetchExamsApi();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setExams(list);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load exams');
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const openCreate = () => {
    setExamName('');
    setExamTerm('');
    setExamStart('');
    setExamEnd('');
    const init: Record<string, { max: string; pass: string; selected: boolean }> = {};
    for (const s of subjects) {
      init[s.id] = { max: '100', pass: '35', selected: true };
    }
    setExamSubjects(init);
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!examName) { Alert.alert('Missing', 'Exam name is required'); return; }
    const selected = Object.entries(examSubjects)
      .filter(([, v]) => v.selected)
      .map(([subjectId, v]) => ({
        subjectId,
        maxMarks: Number(v.max) || 100,
        passMarks: Number(v.pass) || 35,
      }));
    if (selected.length === 0) { Alert.alert('Missing', 'Pick at least one subject'); return; }
    setSubmitting(true);
    try {
      await createExamApi({
        name: examName,
        term: examTerm,
        startDate: examStart || undefined,
        endDate: examEnd || undefined,
        subjects: selected,
      });
      setCreateOpen(false);
      await loadExams();
      onDataChange?.();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openMarksEntry = async (exam: any) => {
    setMarksExam(exam);
    setMarksExamSubjectId(exam.subjects?.[0]?.id || '');
    setMarksClassId(classSections[0]?.id || '');
    setMarksDraft({});
    setMarksOpen(true);
    await refreshRoster(exam, exam.subjects?.[0]?.id || '', classSections[0]?.id || '');
  };

  const refreshRoster = async (exam: any, examSubjectId: string, classSectionId: string) => {
    if (!examSubjectId || !classSectionId) {
      setMarksRoster([]);
      return;
    }
    setMarksLoading(true);
    try {
      const res = await fetchMarksForClassApi(examSubjectId, classSectionId);
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setMarksRoster(list);
      const draft: Record<string, string> = {};
      for (const row of list) draft[row.studentId] = String(row.marksObtained ?? 0);
      setMarksDraft(draft);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setMarksLoading(false);
    }
  };

  const handleSaveMarks = async () => {
    if (!marksExam || !marksExamSubjectId || !marksClassId) return;
    if (marksExam.status === 'locked') {
      Alert.alert('Locked', 'This exam is locked and cannot be modified.');
      return;
    }
    setMarksSaving(true);
    try {
      const entries = marksRoster.map((r) => ({
        studentId: r.studentId,
        marksObtained: Number(marksDraft[r.studentId] || 0),
      }));
      await saveMarksApi({
        examSubjectId: marksExamSubjectId,
        classSectionId: marksClassId,
        entries,
      });
      Alert.alert('Saved', `${entries.length} marks saved.`);
      await refreshRoster(marksExam, marksExamSubjectId, marksClassId);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setMarksSaving(false);
    }
  };

  const handlePublish = async (exam: any) => {
    try {
      await updateExamApi(exam.id, { status: 'published' });
      await loadExams();
    } catch (err: any) { Alert.alert('Error', err.message); }
  };

  const handleLock = async (exam: any) => {
    Alert.alert('Lock exam?', 'Once locked, marks cannot be edited.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Lock', style: 'destructive', onPress: async () => {
          try {
            await updateExamApi(exam.id, { status: 'locked' });
            await loadExams();
          } catch (err: any) { Alert.alert('Error', err.message); }
        },
      },
    ]);
  };

  const examSubjectName = (id: string) => subjects.find((s: any) => s.id === id)?.name || '—';

  return (
    <View>
      <View style={styles.headerBar}>
        <Text style={styles.sectionTitle}>Marks & Exams</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ New Exam</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hintText}>Create an exam, then enter marks per subject for each class.</Text>

      {loadingExams ? (
        <View style={{ padding: 30, alignItems: 'center' }}>
          <ActivityIndicator color="#F4C430" />
        </View>
      ) : exams.length === 0 ? (
        <EmptyState icon="certificate-outline" title="No exams yet" sub="Tap + New Exam to create one." />
      ) : (
        exams.map((exam: any) => (
          <View key={exam.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <View style={styles.cardTitleRow}>
                <MaterialCommunityIcons name="certificate-outline" size={18} color="#F4C430" />
                <Text style={styles.cardTitle}>{exam.name}</Text>
              </View>
              <Text style={styles.cardSub}>
                {exam.term ? `${exam.term} · ` : ''}{(exam.subjects || []).length} subject(s){exam.startDate ? ` · ${exam.startDate}` : ''}
              </Text>
              <View style={styles.badgeRow}>
                <Text style={[styles.badge, { backgroundColor: exam.status === 'locked' ? '#F3F1EA' : exam.status === 'published' ? '#FFF4C7' : '#FFFFFF', color: exam.status === 'locked' ? '#6B6B6B' : '#F4C430', borderWidth: 1, borderColor: '#E8E5DC' }]}>
                  {exam.status}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <TouchableOpacity onPress={() => openMarksEntry(exam)}>
                <MaterialCommunityIcons name="clipboard-edit-outline" size={18} color="#1A1B1C" />
              </TouchableOpacity>
              {exam.status === 'draft' ? (
                <TouchableOpacity onPress={() => handlePublish(exam)}>
                  <MaterialCommunityIcons name="check-circle-outline" size={18} color="#16A34A" />
                </TouchableOpacity>
              ) : exam.status === 'published' ? (
                <TouchableOpacity onPress={() => handleLock(exam)}>
                  <MaterialCommunityIcons name="lock-outline" size={18} color="#DC3545" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))
      )}

      {/* Create Exam Modal */}
      <Modal visible={createOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Exam</Text>
              <TouchableOpacity onPress={() => setCreateOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput style={styles.input} placeholder="e.g. Unit Test 1" value={examName} onChangeText={setExamName} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Term</Text>
                <TextInput style={styles.input} placeholder="Term 1 / Mid-term" value={examTerm} onChangeText={setExamTerm} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
                <TextInput style={styles.input} placeholder="2026-09-10" value={examStart} onChangeText={setExamStart} autoCapitalize="none" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>End date (YYYY-MM-DD)</Text>
                <TextInput style={styles.input} placeholder="2026-09-15" value={examEnd} onChangeText={setExamEnd} autoCapitalize="none" />
              </View>
              <Text style={[styles.label, { marginBottom: 6 }]}>Subjects & marks</Text>
              {subjects.map((s: any) => {
                const v = examSubjects[s.id] || { max: '100', pass: '35', selected: true };
                return (
                  <View key={s.id} style={[styles.card, { alignItems: 'center', paddingVertical: 10 }]}>
                    <TouchableOpacity
                      onPress={() => setExamSubjects((p) => ({ ...p, [s.id]: { ...v, selected: !v.selected } }))}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
                    >
                      <MaterialCommunityIcons
                        name={v.selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={18}
                        color={v.selected ? '#F4C430' : '#9A9A9A'}
                      />
                      <Text style={[styles.cardTitle, { fontSize: 13 }]}>{s.name}</Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TextInput
                        style={[styles.input, { width: 60, height: 36, paddingHorizontal: 6 }]}
                        value={v.max}
                        keyboardType="numeric"
                        editable={v.selected}
                        onChangeText={(t) => setExamSubjects((p) => ({ ...p, [s.id]: { ...v, max: t } }))}
                      />
                      <TextInput
                        style={[styles.input, { width: 60, height: 36, paddingHorizontal: 6 }]}
                        value={v.pass}
                        keyboardType="numeric"
                        editable={v.selected}
                        onChangeText={(t) => setExamSubjects((p) => ({ ...p, [s.id]: { ...v, pass: t } }))}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                <Text style={styles.submitText}>{submitting ? 'Creating…' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Marks Entry Modal */}
      <Modal visible={marksOpen} animationType="slide" transparent onRequestClose={() => setMarksOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Marks · {marksExam?.name}</Text>
              <TouchableOpacity onPress={() => setMarksOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <View style={styles.chipWrap}>
                {(marksExam?.subjects || []).map((es: any) => (
                  <TouchableOpacity
                    key={es.id}
                    style={[styles.chip, marksExamSubjectId === es.id && styles.chipActive]}
                    onPress={() => {
                      setMarksExamSubjectId(es.id);
                      refreshRoster(marksExam, es.id, marksClassId);
                    }}
                  >
                    <Text style={[styles.chipText, marksExamSubjectId === es.id && styles.chipTextActive]}>
                      {examSubjectName(es.subjectId)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <View style={styles.chipWrap}>
                {classSections.map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, marksClassId === c.id && styles.chipActive]}
                    onPress={() => {
                      setMarksClassId(c.id);
                      refreshRoster(marksExam, marksExamSubjectId, c.id);
                    }}
                  >
                    <Text style={[styles.chipText, marksClassId === c.id && styles.chipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {marksLoading ? (
              <View style={{ padding: 20 }}><ActivityIndicator color="#F4C430" /></View>
            ) : marksRoster.length === 0 ? (
              <EmptyState icon="account-multiple" title="No students" sub="Pick a class with enrolled students." />
            ) : (
              <View style={{ maxHeight: 360 }}>
                <ScrollView>
                  {marksRoster.map((r) => (
                    <View key={r.studentId} style={[styles.card, { paddingVertical: 8 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { fontSize: 13 }]}>{r.fullName}</Text>
                        <Text style={styles.cardSub}>{r.rollNoOrUSN || '—'}</Text>
                      </View>
                      <TextInput
                        style={[styles.input, { width: 80, height: 36, paddingHorizontal: 8, textAlign: 'right' }]}
                        keyboardType="numeric"
                        value={marksDraft[r.studentId] || ''}
                        onChangeText={(t) => setMarksDraft((p) => ({ ...p, [r.studentId]: t }))}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setMarksOpen(false)}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveMarks}
                disabled={marksSaving || marksRoster.length === 0}
              >
                <Text style={styles.submitText}>{marksSaving ? 'Saving…' : 'Save Marks'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tabChip: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.button, borderWidth: 1, borderColor: '#E8E5DC', paddingHorizontal: 14, paddingVertical: 7 },
  tabChipActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  tabChipText: { fontSize: 12, fontWeight: '700', color: '#6B6B6B' },
  tabChipTextActive: { color: '#FFFFFF' },
  content: { paddingBottom: 60, gap: 6 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#171717', marginBottom: 6 },
  hintText: { fontSize: 11, color: '#6B6B6B', marginBottom: 10, lineHeight: 15 },
  addBtn: { backgroundColor: '#F4C430', borderRadius: BorderRadius.button, paddingHorizontal: 16, height: 40, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 14, borderWidth: 1, borderColor: '#E8E5DC',
    marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#171717', flexShrink: 1 },
  cardSub: { fontSize: 12, color: '#6B6B6B', marginTop: 3 },
  timeText: { fontSize: 12, color: '#F4C430', fontWeight: '700' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  badge: { backgroundColor: '#FFF4C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontWeight: '700', color: '#F4C430' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 26, alignItems: 'center', borderWidth: 1, borderColor: '#E8E5DC', marginTop: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#171717', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 4, lineHeight: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 20, gap: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#171717' },
  formGroup: { gap: 4, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#171717' },
  input: { height: 44, borderWidth: 1, borderColor: '#E8E5DC', borderRadius: BorderRadius.input, paddingHorizontal: 12, fontSize: 13, backgroundColor: '#FFFDF7' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#FFFDF7', borderRadius: BorderRadius.button, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: '#FFF4C7' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },
  chipTextActive: { color: '#F4C430', fontWeight: '700' },
  fullBtn: { backgroundColor: '#F4C430', borderRadius: BorderRadius.button, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#6B6B6B', fontWeight: '700', fontSize: 13 },
  submitBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#F4C430', borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
