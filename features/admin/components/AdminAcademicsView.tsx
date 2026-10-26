import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DropdownSelect } from './DropdownSelect';
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
  fetchMarksForClassApi,
  saveMarksApi,
  createAcademicSessionApi,
  setCurrentAcademicSessionApi,
  deleteAcademicSessionApi,
} from '../../../api/academics';
import { AdminTimetableView } from './AdminTimetableView';
import { AdminAttendanceView } from './AdminAttendanceView';

const pad2 = (n: number) => String(n).padStart(2, '0');
const parseISODate = (value: string): Date | null => {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
};
const toISODate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  style?: any;
}

const DateField: React.FC<DateFieldProps> = ({ label, value, onChange, placeholder = 'YYYY-MM-DD', style }) => {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(new Date());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const openPicker = () => {
    const d = parseISODate(value) || new Date();
    setTemp(d);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setOpen(true);
  };

  const shiftMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const isSelectedDay = (d: number) =>
    temp.getFullYear() === viewYear && temp.getMonth() === viewMonth && temp.getDate() === d;
  const isToday = (d: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;

  return (
    <View style={[styles.formGroup, style]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.inputWithIcon} activeOpacity={0.7} onPress={openPicker}>
        <MaterialCommunityIcons name="calendar-blank-outline" size={16} color="#9CA3AF" />
        <Text style={[styles.inputIconText, !value && styles.inputPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        {!!value && (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close-circle" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.dateModalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View onStartShouldSetResponder={() => true} style={styles.dateModalCard}>
            <Text style={styles.dateModalTitle}>{label.replace(' *', '')}</Text>
            <View style={styles.dateMonthNav}>
              <TouchableOpacity style={styles.dateMonthBtn} onPress={() => shiftMonth(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="chevron-left" size={18} color="#6B6B6B" />
              </TouchableOpacity>
              <Text style={styles.dateMonthLabel}>{`${MONTH_NAMES[viewMonth]} ${viewYear}`}</Text>
              <TouchableOpacity style={styles.dateMonthBtn} onPress={() => shiftMonth(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateDowRow}>
              {WEEK_DAYS.map((d, i) => (
                <Text key={`dow-${i}`} style={styles.dateDowText}>{d}</Text>
              ))}
            </View>

            <View style={styles.dateGrid}>
              {cells.map((d, i) => {
                if (d === null) return <View key={`pad-${i}`} style={styles.dateDayCell} />;
                const sel = isSelectedDay(d);
                return (
                  <TouchableOpacity
                    key={`day-${d}`}
                    style={[styles.dateDayCell, sel ? styles.dateDaySelected : isToday(d) ? styles.dateDayToday : null]}
                    onPress={() => setTemp(new Date(viewYear, viewMonth, d))}
                  >
                    <Text style={[styles.dateDayText, sel && styles.dateDayTextSelected]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.dateModalActions}>
              {value ? (
                <TouchableOpacity
                  onPress={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  <Text style={styles.dateClearText}>Clear</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <View style={styles.dateActionBtns}>
                <TouchableOpacity style={styles.dateCancelBtn} onPress={() => setOpen(false)}>
                  <Text style={styles.dateCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateConfirmBtn}
                  onPress={() => {
                    onChange(toISODate(temp));
                    setOpen(false);
                  }}
                >
                  <Text style={styles.dateConfirmText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

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
  academicSessions?: any[];
  onDataChange: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const TABS = [
  ['sessions', 'Academic Year'],
  ['classes', 'Classes'],
  ['subjects', 'Subjects'],
  ['assign', 'Assign'],
  ['periods', 'Periods'],
  ['timetable', 'Timetable'],
  ['attendance', 'Attendance'],
  ['terms', 'Terms'],
  ['holidays', 'Holidays'],
  ['marks', 'Marks'],
] as const;

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
  academicSessions = [],
  onDataChange,
  refreshing = false,
  onRefresh,
}) => {
  const [tab, setTab] = useState<'sessions' | 'classes' | 'subjects' | 'assign' | 'periods' | 'timetable' | 'attendance' | 'terms' | 'holidays' | 'marks'>('sessions');

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Academics</Text>
          <Text style={styles.pageSubtitle}>
            {classSections.length} classes · {subjects.length} subjects · {periods.length} periods
          </Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{classSections.length}</Text>
          <Text style={styles.statLabel}>Classes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{subjects.length}</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{periods.length}</Text>
          <Text style={styles.statLabel}>Periods</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{subjectTeachers.length}</Text>
          <Text style={styles.statLabel}>Assigned</Text>
        </View>
      </View>

      <View style={styles.tabBarWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarRow}>
          {TABS.map(([key, label]) => (
            <TouchableOpacity key={key} style={styles.tabItem} onPress={() => setTab(key)} activeOpacity={0.7}>
              <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
              <View style={[styles.tabUnderline, tab === key && styles.tabUnderlineActive]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} />}
      >
        {tab === 'sessions' && <SessionsTab sessions={academicSessions} onDataChange={onDataChange} />}
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
        {tab === 'timetable' && (
          <AdminTimetableView
            classSections={classSections}
            subjects={subjects}
            subjectTeachers={subjectTeachers}
            periods={periods}
            teachers={teachers}
          />
        )}
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

function SectionHeader({ title, count, actionLabel, onAction }: { title: string; count?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!count && <Text style={styles.sectionCount}>{count}</Text>}
      </View>
      {!!actionLabel && !!onAction && (
        <TouchableOpacity style={styles.addBtn} onPress={onAction} activeOpacity={0.7}>
          <MaterialCommunityIcons name="plus" size={15} color="#1A1B1C" />
          <Text style={styles.addBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MicroLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.microLabel}>{children}</Text>;
}

function IconAction({ name, color = '#1A1B1C', onPress }: { name: string; color?: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.iconBtn} onPress={onPress} activeOpacity={0.6} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
      <MaterialCommunityIcons name={name as any} size={17} color={color} />
    </TouchableOpacity>
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
      <View style={styles.emptyIconTile}>
        <MaterialCommunityIcons name={icon} size={30} color="#F4C430" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

function ModalShell({ visible, title, onClose, children, footer }: any) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          <View style={styles.modalFooter}>{footer}</View>
        </View>
      </View>
    </Modal>
  );
}

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
      // Canonical storage: school department = class, academicYear = section
      // letter; college department = department, academicYear = year.
      await createClassSectionApi(
        isSchool
          ? { name, department: academicYear, academicYear: section, section, classTeacherId }
          : { name, department, academicYear, section, classTeacherId }
      );
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
      await updateClassSectionApi(
        editTarget.id,
        isSchool
          ? {
              name: editName,
              department: editAcademicYear,
              academicYear: editSection,
              section: editSection,
              classTeacherId: editClassTeacherId,
            }
          : {
              name: editName,
              department: editDepartment,
              academicYear: editAcademicYear,
              section: editSection,
              classTeacherId: editClassTeacherId,
            }
      );
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
  const teacherOptions = [{ key: '', label: 'Unassigned' }, ...teachers.map((t: any) => ({ key: t.id, label: t.fullName }))];
  const isSchool = institutionType !== 'college';

  const classFields = (isEdit: boolean) => {
    const deptVal = isEdit ? editDepartment : department;
    const setDeptVal = isEdit ? setEditDepartment : setDepartment;
    const yearVal = isEdit ? editAcademicYear : academicYear;
    const setYearVal = isEdit ? setEditAcademicYear : setAcademicYear;
    const secVal = isEdit ? editSection : section;
    const setSecVal = isEdit ? setEditSection : setSection;
    return (
      <>
        {isSchool ? (
          <>
            {academicYears.length > 0 ? (
              <DropdownSelect
                variant="inline"
                label="Class"
                value={yearVal}
                onChange={setYearVal}
                placeholder="Select class"
                options={academicYears}
                menuTitle="Class"
              />
            ) : (
              <FormGroup label="Class">
                <TextInput style={styles.input} placeholder="e.g. Class 10" value={yearVal} onChangeText={setYearVal} placeholderTextColor="#9CA3AF" />
              </FormGroup>
            )}
            {sections.length > 0 ? (
              <DropdownSelect
                variant="inline"
                label="Section"
                value={secVal}
                onChange={setSecVal}
                placeholder="Select section"
                options={sections}
                menuTitle="Section"
              />
            ) : (
              <FormGroup label="Section">
                <TextInput style={styles.input} placeholder="e.g. A" value={secVal} onChangeText={setSecVal} placeholderTextColor="#9CA3AF" />
              </FormGroup>
            )}
          </>
        ) : (
          <>
            {departments.length > 0 ? (
              <DropdownSelect
                variant="inline"
                label="Department"
                value={deptVal}
                onChange={setDeptVal}
                placeholder="Select department"
                options={departments}
                menuTitle="Department"
              />
            ) : (
              <FormGroup label="Department">
                <TextInput style={styles.input} placeholder="Department" value={deptVal} onChangeText={setDeptVal} placeholderTextColor="#9CA3AF" />
              </FormGroup>
            )}
            {academicYears.length > 0 ? (
              <DropdownSelect
                variant="inline"
                label="Year of Study"
                value={yearVal}
                onChange={setYearVal}
                placeholder="Select year"
                options={academicYears}
                menuTitle="Year of Study"
              />
            ) : (
              <FormGroup label="Year of Study">
                <TextInput style={styles.input} placeholder="e.g. 3rd Year" value={yearVal} onChangeText={setYearVal} placeholderTextColor="#9CA3AF" />
              </FormGroup>
            )}
            {sections.length > 0 ? (
              <DropdownSelect
                variant="inline"
                label="Section"
                value={secVal}
                onChange={setSecVal}
                placeholder="Select section"
                options={sections}
                menuTitle="Section"
              />
            ) : (
              <FormGroup label="Section">
                <TextInput style={styles.input} placeholder="e.g. Section A" value={secVal} onChangeText={setSecVal} placeholderTextColor="#9CA3AF" />
              </FormGroup>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <View>
      <SectionHeader
        title={isSchool ? 'Classes & Sections' : 'Class Sections'}
        count={`${classSections.length} total`}
        actionLabel="Add"
        onAction={() => setModalOpen(true)}
      />

      {classSections.length === 0 ? (
        <EmptyState icon="school-outline" title="No classes yet" sub="Create classes/sections and assign a class teacher." />
      ) : (
        classSections.map((cs: any) => (
          <View key={cs.id} style={styles.card}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name="school-outline" size={20} color="#F4C430" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{cs.name}</Text>
              <Text style={styles.cardMeta}>
                {isSchool
                  ? [cs.department || 'General', cs.section ? `Section ${cs.section}` : ''].filter(Boolean).join(' / ')
                  : [cs.department, cs.academicYear, cs.section].filter(Boolean).join(' · ')}
              </Text>
              <Text style={styles.cardMeta}>Class teacher · {teacherName(cs.classTeacherId)}</Text>
            </View>
            <View style={styles.cardActions}>
              <IconAction name="pencil-outline" onPress={() => openEdit(cs)} />
              <IconAction name="trash-can-outline" color="#EF4444" onPress={() => handleDelete(cs.id)} />
            </View>
          </View>
        ))
      )}

      <ModalShell
        visible={modalOpen}
        title="Add Class / Section"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create'}</Text>
            </TouchableOpacity>
          </>
        }
      >
        <FormGroup label="Name *">
          <TextInput
            style={styles.input}
            placeholder={isSchool ? 'e.g. Class 10 A' : 'e.g. CSE 1st Year A'}
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9CA3AF"
          />
        </FormGroup>
        {classFields(false)}
        <DropdownSelect
          variant="inline"
          label="Class Teacher"
          value={classTeacherId}
          onChange={setClassTeacherId}
          placeholder="Unassigned"
          options={teacherOptions}
          menuTitle="Class Teacher"
        />
      </ModalShell>

      <ModalShell
        visible={!!editTarget}
        title="Edit Class / Section"
        onClose={closeEdit}
        footer={
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeEdit}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveEdit} disabled={editSubmitting}>
              <Text style={styles.submitText}>{editSubmitting ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>
          </>
        }
      >
        <FormGroup label="Name *">
          <TextInput style={styles.input} placeholder="Class / section name" value={editName} onChangeText={setEditName} placeholderTextColor="#9CA3AF" />
        </FormGroup>
        {classFields(true)}
        <View style={styles.inlineRow}>
          <Text style={styles.cardMeta}>
            {editClassTeacherId ? `Current · ${teacherName(editClassTeacherId)}` : 'Currently unassigned'}
          </Text>
          {editClassTeacherId ? (
            <TouchableOpacity onPress={handleUnassignTeacher} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.unassignText}>Unassign</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <DropdownSelect
          variant="inline"
          label="Class Teacher"
          value={editClassTeacherId}
          onChange={setEditClassTeacherId}
          placeholder="Unassigned"
          options={teacherOptions}
          menuTitle="Class Teacher"
        />
      </ModalShell>
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
      <SectionHeader title="Subjects" count={`${subjects.length} total`} actionLabel="Add" onAction={() => setModalOpen(true)} />
      {subjects.length === 0 ? (
        <EmptyState icon="book-open-variant" title="No subjects yet" sub="Create subjects like Mathematics, Science, DS, etc." />
      ) : (
        subjects.map((s: any) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name="book-open-variant" size={20} color="#F4C430" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{s.name}</Text>
              {s.code ? <Text style={styles.cardMeta}>Code · {s.code}</Text> : null}
            </View>
          </View>
        ))
      )}

      <ModalShell
        visible={modalOpen}
        title="Add Subject"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create'}</Text>
            </TouchableOpacity>
          </>
        }
      >
        <FormGroup label="Subject Name *">
          <TextInput style={styles.input} placeholder="e.g. Mathematics" value={name} onChangeText={setName} placeholderTextColor="#9CA3AF" />
        </FormGroup>
        <FormGroup label="Code (optional)">
          <TextInput style={styles.input} placeholder="e.g. MAT101" value={code} onChangeText={setCode} autoCapitalize="characters" placeholderTextColor="#9CA3AF" />
        </FormGroup>
      </ModalShell>
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

  const label = (rows: any[], id: string, key: string) => rows.find((x: any) => x.id === id)?.[key] || '';

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

  const classOptions = classSections.map((c: any) => ({ key: c.id, label: c.name }));
  const subjectOptions = subjects.map((s: any) => ({ key: s.id, label: s.name }));
  const teacherOptions = teachers.map((t: any) => ({ key: t.id, label: t.fullName }));

  return (
    <View>
      <SectionHeader title="Subject Teachers" count={`${subjectTeachers.length} assignments`} />
      <Text style={styles.hintText}>Each subject per class/section gets one teacher.</Text>

      <DropdownSelect
        label="Class / Section"
        value={classSectionId}
        onChange={setClassSectionId}
        placeholder="Select class"
        options={classOptions}
        menuTitle="Class / Section"
        leadingIcon="school-outline"
      />

      {cls ? (
        <View style={{ marginTop: 12, gap: 10 }}>
          <DropdownSelect
            label="Subject"
            value={subjectId}
            onChange={setSubjectId}
            placeholder="Select subject"
            options={subjectOptions}
            menuTitle="Subject"
            leadingIcon="book-open-variant"
          />
          <DropdownSelect
            label="Teacher"
            value={teacherId}
            onChange={setTeacherId}
            placeholder="Select teacher"
            options={teacherOptions}
            menuTitle="Teacher"
            leadingIcon="account-tie-outline"
          />

          <TouchableOpacity style={styles.fullBtn} onPress={handleAssign} disabled={submitting} activeOpacity={0.8}>
            <Text style={styles.fullBtnText}>{submitting ? 'Assigning...' : 'Assign Subject Teacher'}</Text>
          </TouchableOpacity>

          <MicroLabel>{`Current assignments · ${cls.name} · ${list.length}`}</MicroLabel>
          {list.length === 0 ? (
            <EmptyState icon="account-search" title="No assignments yet" sub="Assign subjects above." />
          ) : (
            list.map((st: any) => (
              <View key={st.id} style={styles.card}>
                <View style={styles.iconTile}>
                  <MaterialCommunityIcons name="account-tie-outline" size={20} color="#F4C430" />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{label(subjects, st.subjectId, 'name')}</Text>
                  <Text style={styles.cardMeta}>Teacher · {label(teachers, st.teacherId, 'fullName') || 'Unassigned'}</Text>
                </View>
                <View style={styles.cardActions}>
                  <IconAction name="account-switch-outline" onPress={() => openReassign(st)} />
                  <IconAction name="trash-can-outline" color="#EF4444" onPress={() => handleRemove(st.id)} />
                </View>
              </View>
            ))
          )}
        </View>
      ) : (
        <EmptyState icon="school-outline" title="No classes" sub="Create a class first." />
      )}

      {/* Bulk assign — one teacher + one subject, many class/sections */}
      <View style={styles.bulkCard}>
        <View style={styles.bulkHeader}>
          <View style={styles.iconTile}>
            <MaterialCommunityIcons name="account-multiple-plus-outline" size={20} color="#F4C430" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Bulk Assign</Text>
            <Text style={styles.cardMeta}>One teacher · one subject · many classes</Text>
          </View>
        </View>

        <DropdownSelect
          label="Subject"
          value={bulkSubjectId}
          onChange={setBulkSubjectId}
          placeholder="Select subject"
          options={subjectOptions}
          menuTitle="Subject"
        />
        <View style={{ height: 10 }} />
        <DropdownSelect
          label="Teacher"
          value={bulkTeacherId}
          onChange={setBulkTeacherId}
          placeholder="Select teacher"
          options={teacherOptions}
          menuTitle="Teacher"
        />

        <View style={styles.bulkMetaRow}>
          <Text style={styles.cardMeta}>
            {bulkSelected.size} selected · {bulkExistingSet.size} already assigned
          </Text>
          <View style={styles.bulkTextActions}>
            <TouchableOpacity onPress={selectAllVisible} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={styles.bulkActionText}>Select all available</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearBulkSelection} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={[styles.bulkActionText, { color: '#6B6B6B' }]}>Clear</Text>
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
                style={[styles.checkboxRow, isSelected && styles.checkboxRowActive, isExisting && { opacity: 0.6 }]}
              >
                <MaterialCommunityIcons
                  name={isExisting ? 'check-circle' : isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={18}
                  color={isExisting ? '#16A34A' : isSelected ? '#F4C430' : '#9A9A9A'}
                />
                <Text style={styles.checkboxLabel}>{c.name}</Text>
                {isExisting ? <Text style={styles.checkboxMeta}>Assigned</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bulkFooter}>
          <Text style={[styles.cardMeta, { flex: 1 }]}>
            {bulkSubmitting && bulkProgress
              ? `Working… ${bulkProgress.done + bulkProgress.skipped + bulkProgress.failed}/${bulkSelected.size}`
              : `${bulkSubjectName} → ${bulkTeacherName}`}
          </Text>
          <TouchableOpacity
            style={[styles.submitBtn, bulkSelected.size === 0 && { opacity: 0.5 }]}
            onPress={handleBulkAssign}
            disabled={bulkSubmitting || bulkSelected.size === 0}
          >
            <Text style={styles.submitText}>
              {bulkSubmitting ? 'Assigning…' : `Assign ${bulkSelected.size}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ModalShell
        visible={!!reassignId}
        title="Reassign Teacher"
        onClose={cancelReassign}
        footer={
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelReassign}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, (reassignSubmitting || reassignTeacherId === '') && { opacity: 0.5 }]}
              onPress={handleSaveReassign}
              disabled={reassignSubmitting || !reassignTeacherId}
            >
              <Text style={styles.submitText}>{reassignSubmitting ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </>
        }
      >
        <DropdownSelect
          variant="inline"
          label="Teacher"
          value={reassignTeacherId}
          onChange={setReassignTeacherId}
          placeholder="Select teacher"
          options={teacherOptions}
          menuTitle="Pick a new teacher"
        />
      </ModalShell>
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
      <SectionHeader title="Period Slots" count={`${periods.length} slots`} actionLabel="Add" onAction={() => setModalOpen(true)} />
      <Text style={styles.hintText}>Period timing slots used by the timetable (e.g. 6–8 per day).</Text>
      {periods.length === 0 ? (
        <EmptyState icon="clock-outline" title="No periods yet" sub="Define period time slots first." />
      ) : (
        periods.map((p: any) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#F4C430" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{p.label}</Text>
              <Text style={styles.cardMeta}>{p.startTime} – {p.endTime}</Text>
            </View>
          </View>
        ))
      )}

      <ModalShell
        visible={modalOpen}
        title="Add Period"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </>
        }
      >
        <FormGroup label="Label *">
          <TextInput style={styles.input} placeholder="e.g. Period 1" value={label} onChangeText={setLabel} placeholderTextColor="#9CA3AF" />
        </FormGroup>
        <View style={styles.nameRow}>
          <FormGroup label="Start * (24h)">
            <TextInput style={styles.input} placeholder="09:00" value={startTime} onChangeText={setStartTime} placeholderTextColor="#9CA3AF" />
          </FormGroup>
          <FormGroup label="End * (24h)">
            <TextInput style={styles.input} placeholder="09:50" value={endTime} onChangeText={setEndTime} placeholderTextColor="#9CA3AF" />
          </FormGroup>
        </View>
        <FormGroup label="Order">
          <TextInput style={styles.input} placeholder="1" value={sortOrder} onChangeText={setSortOrder} keyboardType="numeric" placeholderTextColor="#9CA3AF" />
        </FormGroup>
      </ModalShell>
    </View>
  );
}

function SessionsTab({ sessions, onDataChange }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const current = (sessions || []).find((s: any) => s.isCurrent);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) { Alert.alert('Missing', 'Enter an academic year name, e.g. 2026-27'); return; }
    setSubmitting(true);
    try {
      await createAcademicSessionApi({ name: trimmed, startDate: startDate.trim(), endDate: endDate.trim() });
      setModalOpen(false);
      setName('');
      setStartDate('');
      setEndDate('');
      onDataChange();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetCurrent = async (id: string, sessionName: string) => {
    try {
      await setCurrentAcademicSessionApi(id);
      onDataChange();
      Alert.alert('Current Year', `"${sessionName}" is now the current academic year. New classes, exams and timetables will belong to it.`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = (id: string, sessionName: string) => {
    Alert.alert('Delete', `Remove academic year "${sessionName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAcademicSessionApi(id);
            onDataChange();
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  return (
    <View>
      <SectionHeader
        title="Academic Year"
        count={`${(sessions || []).length} years`}
        actionLabel="Add"
        onAction={() => setModalOpen(true)}
      />
      <Text style={styles.hintText}>Classes, exams and timetables belong to a year. New records are stamped with the current year.</Text>

      {current ? (
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <MaterialCommunityIcons name="calendar-star" size={20} color="#F4C430" />
            <Text style={styles.heroValue}>{current.name}</Text>
          </View>
          <Text style={styles.heroMicro}>Current academic year</Text>
          {(current.startDate || current.endDate) ? (
            <Text style={styles.heroMeta}>{current.startDate || '...'} to {current.endDate || '...'}</Text>
          ) : null}
        </View>
      ) : (
        <EmptyState icon="calendar-blank-outline" title="No academic year yet" sub="Add the year below — the first one becomes current automatically." />
      )}

      <MicroLabel>All years</MicroLabel>
      {(sessions || []).map((s: any) => (
        <View key={s.id} style={styles.card}>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{s.name}</Text>
            {(s.startDate || s.endDate) ? <Text style={styles.cardMeta}>{s.startDate || '...'} to {s.endDate || '...'}</Text> : null}
            {s.isCurrent ? <Text style={styles.cardMeta}>Current</Text> : null}
          </View>
          <View style={styles.cardActions}>
            {!s.isCurrent && (
              <TouchableOpacity style={styles.smallBtn} onPress={() => handleSetCurrent(s.id, s.name)} activeOpacity={0.7}>
                <Text style={styles.smallBtnText}>Make Current</Text>
              </TouchableOpacity>
            )}
            {!s.isCurrent && (
              <IconAction name="trash-can-outline" color="#EF4444" onPress={() => handleDelete(s.id, s.name)} />
            )}
          </View>
        </View>
      ))}

      <ModalShell
        visible={modalOpen}
        title="Add Academic Year"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Adding...' : 'Add Year'}</Text>
            </TouchableOpacity>
          </>
        }
      >
        <FormGroup label="Year Name *">
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="2026-27" placeholderTextColor="#9CA3AF" />
        </FormGroup>
        <FormGroup label="Start (YYYY-MM-DD, optional)">
          <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="2026-04-01" placeholderTextColor="#9CA3AF" />
        </FormGroup>
        <FormGroup label="End (YYYY-MM-DD, optional)">
          <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="2027-03-31" placeholderTextColor="#9CA3AF" />
        </FormGroup>
      </ModalShell>
    </View>
  );
}

function TermsTab({ terms, onDataChange }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [termsInput, setTermsInput] = useState('Semester 1, Semester 2');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    const list = termsInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (!academicYear || list.length === 0) { Alert.alert('Missing', 'Academic year and at least one term are required'); return; }
    setSubmitting(true);
    try {
      await updateTermsApi({ academicYear, terms: list });
      setModalOpen(false);
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
      <SectionHeader title="Academic Terms" count={`${terms.length} years`} actionLabel="Add" onAction={() => setModalOpen(true)} />
      <Text style={styles.hintText}>Attendance statistics reset at the start of each term.</Text>
      {terms.length === 0 ? (
        <EmptyState icon="text-box-check-outline" title="No terms yet" sub="Add terms for an academic year." />
      ) : (
        terms.map((t: any, i: number) => (
          <View key={i} style={styles.card}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name="text-box-check-outline" size={20} color="#F4C430" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{t.academicYear}</Text>
              <Text style={styles.cardMeta}>{t.terms.join(' · ')}</Text>
            </View>
          </View>
        ))
      )}

      <ModalShell
        visible={modalOpen}
        title="Update Academic Terms"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Saving...' : 'Save Terms'}</Text>
            </TouchableOpacity>
          </>
        }
      >
        <FormGroup label="Academic Year">
          <TextInput style={styles.input} value={academicYear} onChangeText={setAcademicYear} placeholder="2026-27" placeholderTextColor="#9CA3AF" />
        </FormGroup>
        <FormGroup label="Terms (comma separated)">
          <TextInput style={styles.input} value={termsInput} onChangeText={setTermsInput} placeholder="Semester 1, Semester 2" placeholderTextColor="#9CA3AF" />
        </FormGroup>
      </ModalShell>
    </View>
  );
}

function HolidaysTab({ blockedDates, onDataChange }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!date) { Alert.alert('Missing', 'Date is required'); return; }
    setSubmitting(true);
    try {
      await updateHolidaysApi({ blockedDates: [...(blockedDates || []), { date, reason }] });
      setModalOpen(false);
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
      <SectionHeader title="Holiday Calendar" count={`${blockedDates.length} blocked`} actionLabel="Add" onAction={() => setModalOpen(true)} />
      <Text style={styles.hintText}>No classes on blocked dates — attendance is prevented and reports exclude them.</Text>
      {blockedDates.length === 0 ? (
        <EmptyState icon="calendar-remove" title="No blocked dates" sub="Add holidays, festivals and exam days." />
      ) : (
        blockedDates.map((b: any) => (
          <View key={b.date} style={styles.card}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name="calendar-remove" size={20} color="#EF4444" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{b.date}</Text>
              {b.reason ? <Text style={styles.cardMeta}>{b.reason}</Text> : null}
            </View>
            <View style={styles.cardActions}>
              <IconAction name="trash-can-outline" color="#EF4444" onPress={() => handleRemove(b.date)} />
            </View>
          </View>
        ))
      )}

      <ModalShell
        visible={modalOpen}
        title="Add Blocked Date"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Adding...' : 'Add Date'}</Text>
            </TouchableOpacity>
          </>
        }
      >
        <DateField label="Date *" value={date} onChange={setDate} placeholder="Pick a date" />
        <FormGroup label="Reason">
          <TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="e.g. Independence Day" placeholderTextColor="#9CA3AF" />
        </FormGroup>
      </ModalShell>
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  const examSubjectOptions = (marksExam?.subjects || []).map((es: any) => ({
    key: es.id,
    label: examSubjectName(es.subjectId),
  }));
  const classOptions = classSections.map((c: any) => ({ key: c.id, label: c.name }));

  return (
    <View>
      <SectionHeader title="Marks & Exams" count={`${exams.length} exams`} actionLabel="New Exam" onAction={openCreate} />
      <Text style={styles.hintText}>Create an exam, then enter marks per subject for each class.</Text>

      {loadingExams ? (
        <View style={{ padding: 30, alignItems: 'center' }}>
          <ActivityIndicator color="#F4C430" size="large" />
        </View>
      ) : exams.length === 0 ? (
        <EmptyState icon="certificate-outline" title="No exams yet" sub="Tap New Exam to create one." />
      ) : (
        exams.map((exam: any) => (
          <View key={exam.id} style={styles.card}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name="certificate-outline" size={20} color="#F4C430" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{exam.name}</Text>
              <Text style={styles.cardMeta}>
                {[
                  exam.term,
                  `${(exam.subjects || []).length} subjects`,
                  exam.startDate && exam.endDate ? `${exam.startDate} – ${exam.endDate}` : exam.startDate,
                  capitalize(exam.status),
                ].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <IconAction name="clipboard-edit-outline" onPress={() => openMarksEntry(exam)} />
              {exam.status === 'draft' && (
                <IconAction name="check-circle-outline" color="#F4C430" onPress={() => handlePublish(exam)} />
              )}
              {exam.status === 'published' && (
                <IconAction name="lock-outline" onPress={() => handleLock(exam)} />
              )}
            </View>
          </View>
        ))
      )}

      {/* Create Exam Modal */}
      <ModalShell
        visible={createOpen}
        title="Create Exam"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Creating…' : 'Create'}</Text>
            </TouchableOpacity>
          </>
        }
      >
        <FormGroup label="Name *">
          <TextInput style={styles.input} placeholder="e.g. Unit Test 1" value={examName} onChangeText={setExamName} placeholderTextColor="#9CA3AF" />
        </FormGroup>
        <FormGroup label="Term">
          <TextInput style={styles.input} placeholder="Term 1 / Mid-term" value={examTerm} onChangeText={setExamTerm} placeholderTextColor="#9CA3AF" />
        </FormGroup>
        <View style={styles.nameRow}>
          <DateField label="Start date" value={examStart} onChange={setExamStart} placeholder="YYYY-MM-DD" style={{ flex: 1 }} />
          <DateField label="End date" value={examEnd} onChange={setExamEnd} placeholder="YYYY-MM-DD" style={{ flex: 1 }} />
        </View>
        <MicroLabel>Subjects & marks</MicroLabel>
        {subjects.length === 0 ? (
          <Text style={styles.hintText}>No subjects yet — add them under the Subjects tab first.</Text>
        ) : subjects.map((s: any) => {
          const v = examSubjects[s.id] || { max: '100', pass: '35', selected: true };
          return (
            <View key={s.id} style={styles.examSubjectRow}>
              <TouchableOpacity
                onPress={() => setExamSubjects((p) => ({ ...p, [s.id]: { ...v, selected: !v.selected } }))}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={v.selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={18}
                  color={v.selected ? '#F4C430' : '#9A9A9A'}
                />
                <Text style={styles.examSubjectName}>{s.name}</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TextInput
                  style={styles.smallInput}
                  value={v.max}
                  keyboardType="numeric"
                  editable={v.selected}
                  onChangeText={(t) => setExamSubjects((p) => ({ ...p, [s.id]: { ...v, max: t } }))}
                />
                <TextInput
                  style={styles.smallInput}
                  value={v.pass}
                  keyboardType="numeric"
                  editable={v.selected}
                  onChangeText={(t) => setExamSubjects((p) => ({ ...p, [s.id]: { ...v, pass: t } }))}
                />
              </View>
            </View>
          );
        })}
      </ModalShell>

      {/* Marks Entry Modal */}
      <ModalShell
        visible={marksOpen}
        title={`Enter Marks · ${marksExam?.name || ''}`}
        onClose={() => setMarksOpen(false)}
        footer={
          <>
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
          </>
        }
      >
        <DropdownSelect
          variant="inline"
          label="Subject"
          value={marksExamSubjectId}
          onChange={(id) => {
            setMarksExamSubjectId(id);
            refreshRoster(marksExam, id, marksClassId);
          }}
          placeholder="Select subject"
          options={examSubjectOptions}
          menuTitle="Subject"
        />
        <View style={{ height: 10 }} />
        <DropdownSelect
          variant="inline"
          label="Class / Section"
          value={marksClassId}
          onChange={(id) => {
            setMarksClassId(id);
            refreshRoster(marksExam, marksExamSubjectId, id);
          }}
          placeholder="Select class"
          options={classOptions}
          menuTitle="Class / Section"
        />

        <View style={{ marginTop: 12 }}>
          {marksLoading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator color="#F4C430" size="large" />
            </View>
          ) : marksRoster.length === 0 ? (
            <EmptyState icon="account-multiple" title="No students" sub="Pick a class with enrolled students." />
          ) : (
            <View style={{ maxHeight: 320 }}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <MicroLabel>{`${marksRoster.length} students`}</MicroLabel>
                {marksRoster.map((r) => (
                  <View key={r.studentId} style={styles.rosterRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rosterName}>{r.fullName}</Text>
                      <Text style={styles.cardMeta}>{r.rollNoOrUSN || '—'}</Text>
                    </View>
                    <TextInput
                      style={styles.marksInput}
                      keyboardType="numeric"
                      value={marksDraft[r.studentId] || ''}
                      onChangeText={(t) => setMarksDraft((p) => ({ ...p, [r.studentId]: t }))}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ModalShell>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: 0.2 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  statsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E8E5DC',
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 9, color: '#6B7280', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  statDivider: { width: 1, height: 26, backgroundColor: '#F1F5F9' },

  tabBarWrap: { borderBottomWidth: 1, borderBottomColor: '#E8E5DC', marginBottom: 14 },
  tabBarRow: { paddingRight: 20 },
  tabItem: { marginRight: 20, paddingTop: 4 },
  tabLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', paddingBottom: 9 },
  tabLabelActive: { color: '#1A1B1C', fontWeight: '800' },
  tabUnderline: { height: 2.5, borderRadius: 5, backgroundColor: 'transparent' },
  tabUnderlineActive: { backgroundColor: '#F4C430' },

  content: { paddingBottom: 60 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  sectionCount: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F4C430',
    borderRadius: 5, paddingHorizontal: 14, height: 40, justifyContent: 'center',
    shadowColor: '#171717', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2,
  },
  addBtnText: { color: '#1A1B1C', fontWeight: '800', fontSize: 13 },

  microLabel: {
    fontSize: 10, color: '#8A8A8A', fontWeight: '800', textTransform: 'uppercase',
    letterSpacing: 0.6, marginTop: 12, marginBottom: 6,
  },
  hintText: { fontSize: 11, color: '#6B6B6B', marginBottom: 12, lineHeight: 15 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E8E5DC',
    marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#1A1B1C', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  iconTile: {
    width: 40, height: 40, borderRadius: 5, backgroundColor: '#1A1B1C',
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1A1B1C' },
  cardMeta: { fontSize: 11.5, color: '#6B6B6B', marginTop: 3, lineHeight: 16 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 5, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  inlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  unassignText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },

  heroCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#E8E5DC',
    marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroValue: { fontSize: 24, fontWeight: '900', color: '#111827' },
  heroMicro: {
    fontSize: 10, color: '#6B7280', marginTop: 6, textTransform: 'uppercase',
    letterSpacing: 0.6, fontWeight: '700',
  },
  heroMeta: { fontSize: 11, color: '#6B7280', marginTop: 4 },

  smallBtn: { backgroundColor: '#FFF4C7', borderRadius: 5, borderWidth: 1, borderColor: '#F4C430', paddingHorizontal: 12, height: 32, justifyContent: 'center', alignItems: 'center' },
  smallBtnText: { fontSize: 11, fontWeight: '700', color: '#92400E' },

  bulkCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E8E5DC',
    marginTop: 18,
    shadowColor: '#1A1B1C', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  bulkHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  bulkMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 },
  bulkTextActions: { flexDirection: 'row', gap: 14 },
  bulkActionText: { color: '#1A1B1C', fontSize: 12, fontWeight: '700' },
  bulkFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12 },

  checkboxRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 5, borderWidth: 1, borderColor: '#E8E5DC', backgroundColor: '#FFFFFF',
  },
  checkboxRowActive: { backgroundColor: '#FFFDF7', borderColor: '#F4C430' },
  checkboxLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1A1B1C' },
  checkboxMeta: { fontSize: 11, color: '#6B6B6B', fontWeight: '600' },

  emptyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E5DC', marginTop: 8,
  },
  emptyIconTile: {
    width: 56, height: 56, borderRadius: 5, backgroundColor: '#1A1B1C',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#1A1B1C', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 4, lineHeight: 17 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#E8E5DC',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1B1C' },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },

  formGroup: { gap: 4, marginBottom: 12 },
  nameRow: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1B1C' },
  input: {
    height: 44, borderWidth: 1, borderColor: '#E8E5DC', borderRadius: 5,
    paddingHorizontal: 12, fontSize: 13, backgroundColor: '#FFFFFF', color: '#111827',
  },
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderWidth: 1,
    borderColor: '#E5E7EB', borderRadius: 5, paddingHorizontal: 12, backgroundColor: '#FFFFFF',
  },
  inputIconText: { flex: 1, fontSize: 13, color: '#1A1B1C' },
  inputPlaceholder: { color: '#9CA3AF' },

  fullBtn: {
    backgroundColor: '#F4C430', borderRadius: 5, height: 46,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  fullBtnText: { color: '#1A1B1C', fontWeight: '800', fontSize: 14 },
  cancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#6B6B6B', fontWeight: '700', fontSize: 13 },
  submitBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#F4C430', borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#1A1B1C', fontWeight: '800', fontSize: 13 },

  examSubjectRow: {
    backgroundColor: '#FFFFFF', borderRadius: 5, borderWidth: 1, borderColor: '#E8E5DC',
    paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 6,
  },
  examSubjectName: { fontSize: 13, fontWeight: '700', color: '#1A1B1C' },
  smallInput: {
    width: 58, height: 36, borderWidth: 1, borderColor: '#E8E5DC', borderRadius: 5,
    paddingHorizontal: 6, fontSize: 13, backgroundColor: '#FFFFFF', color: '#111827', textAlign: 'center',
  },
  rosterRow: {
    backgroundColor: '#FFFFFF', borderRadius: 5, borderWidth: 1, borderColor: '#E8E5DC',
    paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 6,
  },
  rosterName: { fontSize: 13, fontWeight: '700', color: '#1A1B1C' },
  marksInput: {
    width: 76, height: 36, borderWidth: 1, borderColor: '#E8E5DC', borderRadius: 5,
    paddingHorizontal: 8, fontSize: 13, backgroundColor: '#FFFFFF', color: '#111827', textAlign: 'right',
  },

  dateModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center',
    justifyContent: 'center', padding: 24,
  },
  dateModalCard: {
    width: '100%', maxWidth: 340, backgroundColor: '#FFFFFF',
    borderRadius: 5, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  dateModalTitle: { fontSize: 13, fontWeight: '800', color: '#1A1B1C', marginBottom: 4 },
  dateMonthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 6 },
  dateMonthBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  dateMonthLabel: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '800', color: '#1A1B1C' },
  dateDowRow: { flexDirection: 'row', marginBottom: 4 },
  dateDowText: { width: '14.28%', textAlign: 'center', fontSize: 10, fontWeight: '800', color: '#9CA3AF' },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateDayCell: { width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center' },
  dateDaySelected: { backgroundColor: '#F4C430', borderRadius: 5},
  dateDayToday: { borderWidth: 1, borderColor: '#F4C430', borderRadius: 5},
  dateDayText: { fontSize: 13, fontWeight: '600', color: '#1A1B1C' },
  dateDayTextSelected: { fontWeight: '800', color: '#1A1B1C' },
  dateModalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  dateActionBtns: { flexDirection: 'row', gap: 8 },
  dateClearText: { fontSize: 13, fontWeight: '700', color: '#6B6B6B' },
  dateCancelBtn: { height: 38, paddingHorizontal: 16, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  dateCancelText: { fontSize: 13, fontWeight: '700', color: '#6B6B6B' },
  dateConfirmBtn: { height: 38, paddingHorizontal: 20, borderRadius: 5, backgroundColor: '#F4C430', justifyContent: 'center', alignItems: 'center' },
  dateConfirmText: { fontSize: 13, fontWeight: '800', color: '#1A1B1C' },
});
