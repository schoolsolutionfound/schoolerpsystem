import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import {
  createClassSectionApi,
  deleteClassSectionApi,
  createSubjectApi,
  createSubjectTeacherApi,
  deleteSubjectTeacherApi,
  createPeriodApi,
  updateTermsApi,
  updateHolidaysApi,
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
  const [tab, setTab] = useState<'classes' | 'subjects' | 'assign' | 'periods' | 'timetable' | 'attendance' | 'terms' | 'holidays'>('classes');

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
                <MaterialCommunityIcons name="school-outline" size={18} color="#7E57C2" />
                <Text style={styles.cardTitle}>{cs.name}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(cs.id)}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
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
              <TouchableOpacity onPress={() => setModalOpen(false)}><MaterialCommunityIcons name="close" size={22} color="#64748B" /></TouchableOpacity>
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
              <MaterialCommunityIcons name="book-open-variant" size={18} color="#7E57C2" />
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
              <TouchableOpacity onPress={() => setModalOpen(false)}><MaterialCommunityIcons name="close" size={22} color="#64748B" /></TouchableOpacity>
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

  const label = (list: any[], id: string, key: string) => list.find((x: any) => x.id === id)?.[key] || '';

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
                  <MaterialCommunityIcons name="account-tie" size={18} color="#7E57C2" />
                  <Text style={styles.cardTitle}>{label(subjects, st.subjectId, 'name')}</Text>
                </View>
                <Text style={styles.cardSub}>{label(teachers, st.teacherId, 'fullName')}</Text>
                <TouchableOpacity onPress={() => handleRemove(st.id)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </>
      ) : (
        <EmptyState icon="school-outline" title="No classes" sub="Create a class first." />
      )}
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
              <MaterialCommunityIcons name="clock-outline" size={18} color="#7E57C2" />
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
              <TouchableOpacity onPress={() => setModalOpen(false)}><MaterialCommunityIcons name="close" size={22} color="#64748B" /></TouchableOpacity>
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
      <MaterialCommunityIcons name={icon} size={40} color="#94A3B8" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tabChip: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.button, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 7 },
  tabChipActive: { backgroundColor: '#7E57C2', borderColor: '#7E57C2' },
  tabChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tabChipTextActive: { color: '#FFFFFF' },
  content: { paddingBottom: 60, gap: 6 },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A202C', marginBottom: 6 },
  hintText: { fontSize: 11, color: '#718096', marginBottom: 10, lineHeight: 15 },
  addBtn: { backgroundColor: '#7E57C2', borderRadius: BorderRadius.button, paddingHorizontal: 16, height: 40, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 14, borderWidth: 1, borderColor: '#E2E8F0',
    marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1A202C', flexShrink: 1 },
  cardSub: { fontSize: 12, color: '#718096', marginTop: 3 },
  timeText: { fontSize: 12, color: '#7E57C2', fontWeight: '700' },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  badge: { backgroundColor: '#EDE7F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 10, fontWeight: '700', color: '#7E57C2' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 26, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#718096', textAlign: 'center', marginTop: 4, lineHeight: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 20, gap: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A202C' },
  formGroup: { gap: 4, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A202C' },
  input: { height: 44, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: BorderRadius.input, paddingHorizontal: 12, fontSize: 13, backgroundColor: '#F8F9FB' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F1F5F9', borderRadius: BorderRadius.button, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { backgroundColor: '#EDE7F6' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#7E57C2', fontWeight: '700' },
  fullBtn: { backgroundColor: '#7E57C2', borderRadius: BorderRadius.button, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  submitBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#7E57C2', borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});
