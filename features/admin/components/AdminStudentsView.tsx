import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { DropdownSelect } from './DropdownSelect';
import { BulkImportModal } from './BulkImportModal';
import { fetchFeesApi, createFeePaymentApi } from '../../../api/admin';

interface CreateFeeOption {
  id: string;
  classSectionId?: string | null;
  title: string;
  amount: string | number;
  term?: string | null;
  dueDate?: string | null;
}

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

const CLASS_KEY_SEP = '\u0001';
const tripleKey = (department: string, academicYear: string, section: string) =>
  `${department.trim()}${CLASS_KEY_SEP}${academicYear.trim()}${CLASS_KEY_SEP}${section.trim()}`;
const parseTripleKey = (key: string) => {
  const [department = '', academicYear = '', section = ''] = key.split(CLASS_KEY_SEP);
  return { department, academicYear, section };
};
const joinClassLabel = (department: string, section: string) => {
  const d = department.trim();
  const s = section.trim();
  if (!s) return d;
  return /\d$/.test(d) ? `${d}${s}` : `${d} ${s}`;
};
const optionsWithCurrent = (
  options: { key: string; label: string }[],
  currentKey: string,
  currentLabel: string
) => (currentKey && !options.some((o) => o.key === currentKey) ? [{ key: currentKey, label: currentLabel }, ...options] : options);

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  style?: any;
}

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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
  dob?: string;
  gender?: string;
  admissionNo?: string;
  admissionDate?: string;
  sessionId?: string;
  address?: string;
  city?: string;
  pincode?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianEmail?: string;
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
    rollNoOrUSN?: string;
    phone?: string;
    department: string;
    academicYear: string;
    section: string;
    password?: string;
    sessionId?: string;
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
    dob?: string;
    gender?: string;
    admissionNo?: string;
    admissionDate?: string;
    sessionId?: string;
    tenthPercentage?: string;
    twelfthPercentage?: string;
  }) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onPromoteStudents: (studentIds: string[], targetClassSectionId: string, academicYear: string) => Promise<void>;
  onGraduateStudents: (studentIds: string[]) => Promise<void>;
  onFetchDocuments: (studentId: string) => Promise<StudentDocument[]>;
  onAddDocument: (studentId: string, payload: { documentType: string; fileName: string; fileUrl: string }) => Promise<void>;
  onDeleteDocument: (studentId: string, docId: string) => Promise<void>;
  refreshing?: boolean;
  onRefresh?: () => void;
  academicSessions?: any[];
  /** Debounced server-side search (in addition to local filter). */
  onSearchChange?: (q: string) => void;
  /** True when more pages exist on the server. */
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number;
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
  refreshing = false,
  onRefresh,
  academicSessions = [],
  onSearchChange,
  hasMore = false,
  onLoadMore,
  totalCount,
}) => {
  const isCollege = institutionType === 'college';
  // College levels are years of study; the academic session (2026-27) is separate.
  const yearLabel = isCollege ? 'Year of Study' : 'Academic Year';
  const currentSession = (academicSessions || []).find((s: any) => s.isCurrent);
  const sessionNames: string[] = (academicSessions || []).map((s: any) => s.name);
  const sessionIdByName = (name: string): string | undefined =>
    (academicSessions || []).find((s: any) => s.name === name)?.id;
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [showAlumni, setShowAlumni] = useState(false);

  const updateSearch = (q: string) => {
    setSearch(q);
    onSearchChange?.(q);
  };

  // Multi-select
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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
  const [phone, setPhone] = useState('');
  const [rollNoOrUSN, setRollNoOrUSN] = useState('');
  const [dept, setDept] = useState(departments[0] || '');
  const [year, setYear] = useState(academicYears[0] || '');
  const [section, setSection] = useState(sections[0] || '');
  const [sessionName, setSessionName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fees the admin can tick when creating a student (deselections only).
  const [feeStructures, setFeeStructures] = useState<CreateFeeOption[]>([]);
  const [excludedFeeIds, setExcludedFeeIds] = useState<Set<string>>(new Set());

  // Edit form
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editAdmissionNo, setEditAdmissionNo] = useState('');
  const [editAdmissionDate, setEditAdmissionDate] = useState('');
  const [editSessionName, setEditSessionName] = useState('');
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

  // School classes: class-sections table stores the class name in `department`
  const classOptions = useMemo(() => {
    const fromSections = Array.from(new Set(classSections.map((c) => (c.department || '').trim()).filter(Boolean)));
    return fromSections.length > 0 ? fromSections : academicYears;
  }, [classSections, academicYears]);

  // Class / Section dropdown options — one entry per class-section row so the
  // pick resolves to a single class (e.g. "1A", "1B"). Falls back to classes ×
  // section letters when no class-section rows exist yet.
  const classSectionOptions = useMemo(() => {
    const opts: { key: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const cs of classSections) {
      const d = (cs.department || '').trim();
      if (!d) continue;
      const y = (cs.academicYear || '').trim();
      const s = (cs.section || '').trim();
      const key = tripleKey(d, y, s);
      if (seen.has(key)) continue;
      seen.add(key);
      opts.push({ key, label: joinClassLabel(d, s || y) });
    }
    if (opts.length > 0) return opts;
    const sectionLetters = sections.filter((x) => (x || '').trim());
    for (const c of classOptions) {
      if (sectionLetters.length === 0) {
        opts.push({ key: tripleKey(c, '', ''), label: c });
        continue;
      }
      for (const sec of sectionLetters) opts.push({ key: tripleKey(c, sec, sec), label: joinClassLabel(c, sec) });
    }
    return opts;
  }, [classSections, classOptions, sections]);

  useEffect(() => {
    let alive = true;
    fetchFeesApi()
      .then((res: any) => {
        if (alive) setFeeStructures(Array.isArray(res) ? res : []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Fees that apply to the class currently picked in the create form:
  // structures bound to that class-section plus institution-wide ones.
  const createTriple = tripleKey(dept, year, section);
  const createClassSectionId = useMemo(() => {
    const match = classSections.find(
      (c) => tripleKey(c.department || '', c.academicYear || '', c.section || '') === createTriple
    );
    return match?.id || '';
  }, [classSections, createTriple]);
  const applicableFees = useMemo(
    () => feeStructures.filter((f) => !f.classSectionId || f.classSectionId === createClassSectionId),
    [feeStructures, createClassSectionId]
  );

  const toggleFee = (id: string) =>
    setExcludedFeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const editTriple = tripleKey(editDept, editYear, editSection);
  const editClassOptions = optionsWithCurrent(
    classSectionOptions,
    editTriple,
    joinClassLabel(editDept, editSection || editYear)
  );

  // Filtering
  const filterOptions = isCollege ? departments : classOptions;
  const activeFilter = filterOptions.includes(deptFilter) ? deptFilter : '';
  const hasAlumni = students.some((s) => !!s.graduatedAt);
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (showAlumni && !s.graduatedAt) return false;
      if (!showAlumni && s.graduatedAt) return false;
      const matchesSearch =
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.rollNoOrUSN.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = !activeFilter || s.department === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [students, search, activeFilter, showAlumni]);

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
    setEditDob(s.dob || '');
    setEditGender(s.gender || '');
    setEditAdmissionNo(s.admissionNo || '');
    setEditAdmissionDate(s.admissionDate || '');
    setEditSessionName((academicSessions || []).find((sess: any) => sess.id === s.sessionId)?.name || '');
    setEditDept(s.department || '');
    setEditYear(s.academicYear || '');
    setEditSection(s.section || '');
    setEditPhone(s.phone || '');
    setEditParentPhone(s.parentPhone || '');
    setEditTenth(s.tenthPercentage || '');
    setEditTwelfth(s.twelfthPercentage || '');
    setEditModal(s);
  };

  const openCreate = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setRollNoOrUSN('');
    setPassword('');
    setShowPassword(false);
    setExcludedFeeIds(new Set());
    if (isCollege) {
      setDept(departments[0] || '');
      setYear(academicYears[0] || '');
      setSection(sections[0] || '');
    } else {
      const first = classSectionOptions[0];
      if (first) {
        const t = parseTripleKey(first.key);
        setDept(t.department);
        setYear(t.academicYear);
        setSection(t.section);
      } else {
        setDept('');
        setYear('');
        setSection('');
      }
    }
    setSessionName(currentSession?.name || sessionNames[0] || '');
    setCreateModalOpen(true);
  };

  const handleCreate = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert('Missing Fields', 'First Name, Last Name, and Email are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res: any = await onCreateStudent({
        firstName,
        lastName,
        email,
        phone: phone.trim() || undefined,
        rollNoOrUSN: rollNoOrUSN.trim() || undefined,
        department: dept,
        academicYear: isCollege ? year : (section || year),
        section,
        password: password || undefined,
        sessionId: sessionIdByName(sessionName),
      });
      // Create a pending due for every fee the admin left ticked.
      const studentId = res?.id || res?.user?.id;
      let feesAdded = 0;
      let feeFailures = 0;
      if (studentId) {
        for (const fee of applicableFees) {
          if (excludedFeeIds.has(fee.id)) continue;
          try {
            await createFeePaymentApi({
              feeStructureId: fee.id,
              studentId,
              amount: Number(fee.amount) || 0,
              status: 'pending',
              notes: 'Assigned when the student was created',
            });
            feesAdded += 1;
          } catch {
            feeFailures += 1;
          }
        }
      }
      setCreateModalOpen(false);
      setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setRollNoOrUSN('');
      setSessionName('');
      setPassword('');
      setExcludedFeeIds(new Set());
      const message = res?.tempPassword
        ? `Student account created! Temporary password (shown once): ${res.tempPassword}\n\nShare it securely — the student must change it at first login.`
        : password
          ? 'Student account created! They can log in with the password you set.'
          : 'Student account created! They can log in with the institution default password.';
      const feeNote =
        feesAdded > 0
          ? `\n\n${feesAdded} fee due${feesAdded === 1 ? '' : 's'} added for this student.` +
            (feeFailures > 0 ? ` ${feeFailures} could not be added — add them from Fees.` : '')
          : feeFailures > 0
            ? `\n\n${feeFailures} fee could not be added — add them from Fees.`
            : '';
      Alert.alert('Success', message + feeNote);
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
        academicYear: isCollege ? editYear : (editSection || editYear),
        section: editSection,
        phone: editPhone,
        parentPhone: editParentPhone,
        dob: editDob.trim(),
        gender: editGender,
        admissionNo: editAdmissionNo.trim(),
        admissionDate: editAdmissionDate.trim(),
        sessionId: sessionIdByName(editSessionName),
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
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Students</Text>
          <Text style={styles.pageSubtitle}>{students.length} {showAlumni ? 'alumni' : 'students'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.importBtn} onPress={() => setImportOpen(true)}>
            <MaterialCommunityIcons name="file-import-outline" size={18} color="#1A1B1C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <MaterialCommunityIcons name="plus" size={16} color="#1A1B1C" />
            <Text style={styles.addBtnText}>Add Student</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Action Bar */}
      <View style={styles.headerBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6B6B6B" />
          <TextInput style={styles.searchInput} placeholder="Search by name, email, USN..." value={search} onChangeText={updateSearch} />
        </View>
      </View>

      {/* Filter Row */}
      <View style={[styles.filterWrap, filterOpen && styles.filterWrapOpen]}>
        <TouchableOpacity style={styles.filterSelect} onPress={() => setFilterOpen(!filterOpen)}>
          <MaterialCommunityIcons name="filter-variant" size={16} color="#6B6B6B" />
          <Text style={styles.filterSelectText} numberOfLines={1}>{activeFilter || 'All'}</Text>
          <MaterialCommunityIcons name={filterOpen ? 'menu-up' : 'menu-down'} size={16} color="#9CA3AF" />
        </TouchableOpacity>
        {hasAlumni && (
          <TouchableOpacity style={[styles.alumniToggle, showAlumni && styles.alumniToggleActive]} onPress={() => setShowAlumni(!showAlumni)}>
            <MaterialCommunityIcons name="school" size={16} color={showAlumni ? '#F4C430' : '#6B6B6B'} />
            <Text style={[styles.alumniToggleText, showAlumni && styles.alumniToggleTextActive]}>Alumni</Text>
          </TouchableOpacity>
        )}

        {filterOpen && (
          <>
            <TouchableOpacity style={styles.filterBackdrop} activeOpacity={1} onPress={() => setFilterOpen(false)} />
            <View style={styles.filterMenu}>
              <Text style={styles.filterMenuTitle}>Filter by {isCollege ? 'Department' : 'Class'}</Text>
              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.filterMenuItem} onPress={() => { setDeptFilter(''); setFilterOpen(false); }}>
                  <Text style={[styles.filterMenuText, !activeFilter && styles.filterMenuTextActive]}>All</Text>
                  {!activeFilter && <MaterialCommunityIcons name="check" size={16} color="#1A1B1C" />}
                </TouchableOpacity>
                {filterOptions.map((d) => (
                  <TouchableOpacity key={d} style={styles.filterMenuItem} onPress={() => { setDeptFilter(d); setFilterOpen(false); }}>
                    <Text style={[styles.filterMenuText, activeFilter === d && styles.filterMenuTextActive]} numberOfLines={1}>{d}</Text>
                    {activeFilter === d && <MaterialCommunityIcons name="check" size={16} color="#1A1B1C" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}
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
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} />}
      >
        {filteredStudents.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-school-outline" size={40} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>{showAlumni ? 'No Alumni Yet' : 'No Students Enrolled'}</Text>
            <Text style={styles.emptySub}>{showAlumni ? 'Graduated students will appear here.' : 'Click "+ Add" above to onboard a student.'}</Text>
          </View>
        ) : (
          filteredStudents.map((stud) => {
            const isSelected = selectedIds.has(stud.id);
            const meta = [stud.rollNoOrUSN, stud.department || null, isCollege ? stud.academicYear : null, stud.section ? `Sec ${stud.section}` : null, stud.graduatedAt ? 'Alumni' : null]
              .filter(Boolean)
              .join('  ·  ');
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
                    {isSelected && <MaterialCommunityIcons name="check" size={14} color="#1A1B1C" />}
                  </View>
                )}
                <View style={[styles.avatarCircle, stud.graduatedAt && styles.avatarCircleMuted]}>
                  <Text style={styles.avatarText}>{stud.fullName.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName} numberOfLines={1}>{stud.fullName}</Text>
                  <Text style={styles.studentEmail} numberOfLines={1}>{stud.email}</Text>
                  {!!meta && <Text style={styles.studentMeta} numberOfLines={1}>{meta}</Text>}
                </View>
                {!selectMode && <MaterialCommunityIcons name="chevron-right" size={20} color="#C9C5B8" />}
              </TouchableOpacity>
            );
          })
        )}
        {hasMore && onLoadMore && !showAlumni && (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={onLoadMore}>
            <Text style={styles.loadMoreText}>
              Load more ({students.length}{totalCount != null ? ` of ${totalCount}` : ''})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ─── Create Modal ─── */}
      <Modal visible={createModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Student</Text>
              <TouchableOpacity onPress={() => setCreateModalOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeader}>Basic Details</Text>
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput style={styles.input} placeholder="e.g. Aarav" placeholderTextColor="#9CA3AF" value={firstName} onChangeText={setFirstName} />
                </View>
                <View style={styles.nameField}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput style={styles.input} placeholder="e.g. Sharma" placeholderTextColor="#9CA3AF" value={lastName} onChangeText={setLastName} />
                </View>
              </View>

              <View style={styles.formDivider} />
              <Text style={styles.sectionHeader}>Account</Text>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="email-outline" size={16} color="#9CA3AF" />
                  <TextInput style={styles.inputIconText} placeholder="aarav@school.edu" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="phone-outline" size={16} color="#9CA3AF" />
                  <TextInput style={styles.inputIconText} placeholder="e.g. 98765 43210" placeholderTextColor="#9CA3AF" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Temporary Password</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="lock-outline" size={16} color="#9CA3AF" />
                  <TextInput
                    style={styles.inputIconText}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Leave empty for institution default"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color="#6B6B6B" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.hintText}>Student will change password on first login.</Text>
              </View>

              <View style={styles.formDivider} />
              <Text style={styles.sectionHeader}>Academic Details</Text>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{isCollege ? 'USN' : 'Roll Number'}</Text>
                <View style={styles.inputWithIcon}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={16} color="#9CA3AF" />
                  <TextInput style={styles.inputIconText} placeholder={isCollege ? 'e.g. USN23CS101' : 'e.g. Roll 101'} placeholderTextColor="#9CA3AF" value={rollNoOrUSN} onChangeText={setRollNoOrUSN} />
                </View>
                <Text style={styles.hintText}>Optional — you can add it later from the student's profile.</Text>
              </View>
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  {isCollege ? (
                    <DropdownSelect
                      variant="inline"
                      label="Department"
                      value={dept}
                      options={departments}
                      onChange={setDept}
                      placeholder="Select department"
                      menuTitle="Department"
                    />
                  ) : (
                    <DropdownSelect
                      variant="inline"
                      label="Class / Section"
                      value={tripleKey(dept, year, section)}
                      options={classSectionOptions}
                      onChange={(key) => {
                        const t = parseTripleKey(key);
                        setDept(t.department);
                        setYear(t.academicYear);
                        setSection(t.section);
                      }}
                      placeholder="Select class"
                      menuTitle="Class / Section"
                    />
                  )}
                </View>
              </View>
              {isCollege && (
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                    <DropdownSelect variant="inline" label={yearLabel} value={year} options={academicYears} onChange={setYear} placeholder="Select year" menuTitle={yearLabel} />
                  </View>
                  <View style={styles.nameField}>
                    <DropdownSelect variant="inline" label="Section" value={section} options={sections} onChange={setSection} placeholder="Select section" menuTitle="Section" />
                  </View>
                </View>
              )}
              {!isCollege && classSectionOptions.length === 0 && (
                <Text style={styles.hintText}>No classes configured yet — add classes under Institution → Classes.</Text>
              )}

              {applicableFees.length > 0 && (
                <>
                  <View style={styles.formDivider} />
                  <Text style={styles.sectionHeader}>Fees</Text>
                  <Text style={styles.hintText}>
                    Each ticked fee becomes a pending due when the student is created.
                  </Text>
                  {applicableFees.map((fee) => {
                    const ticked = !excludedFeeIds.has(fee.id);
                    const feeMeta = [fee.term, fee.dueDate ? `Due ${fee.dueDate}` : ''].filter(Boolean).join(' · ');
                    return (
                      <TouchableOpacity key={fee.id} style={styles.feeRow} activeOpacity={0.7} onPress={() => toggleFee(fee.id)}>
                        <MaterialCommunityIcons
                          name={ticked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={20}
                          color={ticked ? '#1A1B1C' : '#9CA3AF'}
                        />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.feeRowTitle} numberOfLines={1}>{fee.title}</Text>
                          {!!feeMeta && <Text style={styles.feeRowMeta}>{feeMeta}</Text>}
                        </View>
                        <Text style={styles.feeRowAmount}>₹{(Number(fee.amount) || 0).toLocaleString('en-IN')}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateModalOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleCreate} disabled={submitting}>
                <MaterialCommunityIcons name="check" size={15} color="#1A1B1C" />
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
            {detailSheet && (
              <View style={styles.detailHeader}>
                <View style={styles.detailHeaderLeft}>
                  <View style={styles.detailAvatar}>
                    <Text style={styles.detailAvatarText}>{detailSheet.fullName.substring(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailName} numberOfLines={1}>{detailSheet.fullName}</Text>
                    <Text style={styles.detailEmail} numberOfLines={1}>{detailSheet.email}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setDetailSheet(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
                </TouchableOpacity>
              </View>
            )}
            {detailSheet && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Academic Info</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Joined Session</Text>
                    <Text style={styles.detailValue}>
                      {(academicSessions || []).find((sess: any) => sess.id === detailSheet.sessionId)?.name || '—'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{isCollege ? 'USN' : 'Roll No'}</Text>
                    <Text style={styles.detailValue}>{detailSheet.rollNoOrUSN || '—'}</Text>
                  </View>
                  {isCollege && detailSheet.department && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Department</Text>
                      <Text style={styles.detailValue}>{detailSheet.department}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{yearLabel}</Text>
                    <Text style={styles.detailValue}>{detailSheet.academicYear || '—'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Section</Text>
                    <Text style={styles.detailValue}>{detailSheet.section || '—'}</Text>
                  </View>
                  {isCollege && (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>10th %</Text>
                        <Text style={styles.detailValue}>{detailSheet.tenthPercentage || '—'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>12th %</Text>
                        <Text style={styles.detailValue}>{detailSheet.twelfthPercentage || '—'}</Text>
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Personal Info</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date of Birth</Text>
                    <Text style={styles.detailValue}>{detailSheet.dob || '—'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gender</Text>
                    <Text style={styles.detailValue}>{detailSheet.gender || '—'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Admission No</Text>
                    <Text style={styles.detailValue}>{detailSheet.admissionNo || '—'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Admission Date</Text>
                    <Text style={styles.detailValue}>{detailSheet.admissionDate || '—'}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Contact</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>{detailSheet.phone || '—'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Parent Phone</Text>
                    <Text style={styles.detailValue}>{detailSheet.parentPhone || '—'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>{[detailSheet.address, detailSheet.city, detailSheet.pincode].filter(Boolean).join(', ') || '—'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Guardian</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>
                      {[detailSheet.guardianName, detailSheet.guardianRelation].filter(Boolean).join(' · ') || '—'}
                    </Text>
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
                          <MaterialCommunityIcons name="file-document-outline" size={14} color="#6B6B6B" />
                          <Text style={styles.detailLabel}>{doc.documentType}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.detailValue} numberOfLines={1}>{doc.fileName}</Text>
                          <TouchableOpacity onPress={() => handleDeleteDocument(doc.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput style={styles.input} value={editFirstName} onChangeText={setEditFirstName} />
                </View>
                <View style={styles.nameField}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput style={styles.input} value={editLastName} onChangeText={setEditLastName} />
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.nameRow}>
                <DateField style={styles.nameField} label="Date of Birth" value={editDob} onChange={setEditDob} />
                <DateField style={styles.nameField} label="Admission Date" value={editAdmissionDate} onChange={setEditAdmissionDate} />
              </View>
              {renderChipRow('Gender', editGender, setEditGender, ['Male', 'Female', 'Other'])}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Admission Number</Text>
                <TextInput style={styles.input} value={editAdmissionNo} onChangeText={setEditAdmissionNo} />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>{isCollege ? 'USN' : 'Roll Number'}</Text>
                <TextInput style={styles.input} value={editRollNo} onChangeText={setEditRollNo} />
              </View>
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  {isCollege ? (
                    <DropdownSelect
                      variant="inline"
                      label="Department"
                      value={editDept}
                      options={departments}
                      onChange={setEditDept}
                      placeholder="Select department"
                      menuTitle="Department"
                    />
                  ) : (
                    <DropdownSelect
                      variant="inline"
                      label="Class / Section"
                      value={editTriple}
                      options={editClassOptions}
                      onChange={(key) => {
                        const t = parseTripleKey(key);
                        setEditDept(t.department);
                        setEditYear(t.academicYear);
                        setEditSection(t.section);
                      }}
                      placeholder="Select class"
                      menuTitle="Class / Section"
                    />
                  )}
                </View>
                {sessionNames.length > 0 && (
                  <View style={styles.nameField}>
                    <DropdownSelect
                      variant="inline"
                      label="Joined Session"
                      value={editSessionName}
                      options={sessionNames}
                      onChange={setEditSessionName}
                      placeholder="Select session"
                      menuTitle="Academic session"
                    />
                  </View>
                )}
              </View>
              {isCollege && (
                <View style={styles.nameRow}>
                  <View style={styles.nameField}>
                    <DropdownSelect variant="inline" label={yearLabel} value={editYear} options={academicYears} onChange={setEditYear} placeholder="Select year" menuTitle={yearLabel} />
                  </View>
                  <View style={styles.nameField}>
                    <DropdownSelect variant="inline" label="Section" value={editSection} options={sections} onChange={setEditSection} placeholder="Select section" menuTitle="Section" />
                  </View>
                </View>
              )}
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
              <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleEdit} disabled={submitting}>
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
                {renderChipRow(yearLabel, promoteYear, setPromoteYear, academicYears)}
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
              Are you sure you want to delete <Text style={{ fontFamily: FontFamily.bold }}>{deleteConfirm?.fullName}</Text>? This action cannot be undone.
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

      <BulkImportModal
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        type="student"
        onImported={onRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  pageTitle: { fontSize: 20, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#111827', letterSpacing: 0.2 },
  pageSubtitle: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 2 },
  headerBar: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input, borderWidth: 1, borderColor: '#E8E5DC', paddingHorizontal: 12, height: 44, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: FontFamily.medium, color: '#1A1B1C' },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  loadMoreText: { fontSize: 13, fontFamily: FontFamily.bold, color: '#F4C430' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F4C430', borderRadius: BorderRadius.button, paddingHorizontal: 14, height: 40, justifyContent: 'center', shadowColor: '#171717', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2 },
  addBtnText: { color: '#1A1B1C', fontWeight: '800', fontSize: 13, fontFamily: FontFamily.extrabold },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  importBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.button,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterWrap: { position: 'relative', zIndex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  filterWrapOpen: { zIndex: 30 },
  filterBackdrop: { position: 'absolute', top: -40, left: -400, right: -400, bottom: -2000, backgroundColor: 'transparent' },
  filterSelect: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, height: 38,
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.input, borderWidth: 1, borderColor: '#E8E5DC', paddingHorizontal: 12,
  },
  filterSelectText: { flex: 1, fontSize: 12, fontFamily: FontFamily.semibold, color: '#1A1B1C' },
  filterMenu: {
    position: 'absolute', top: 42, left: 0, width: 250,
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E8E5DC',
    paddingVertical: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  filterMenuTitle: { fontSize: 11, fontFamily: FontFamily.extrabold, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 16, paddingVertical: 8 },
  filterMenuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11 },
  filterMenuText: { fontSize: 13, fontFamily: FontFamily.regular, color: '#1A1B1C', flexShrink: 1 },
  filterMenuTextActive: { fontFamily: FontFamily.bold },
  alumniToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.chip, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E5DC' },
  alumniToggleActive: { backgroundColor: '#1A1B1C', borderColor: '#1A1B1C' },
  alumniToggleText: { fontSize: 11, fontFamily: FontFamily.semibold, color: '#6B6B6B' },
  alumniToggleTextActive: { color: '#FFFFFF', fontFamily: FontFamily.bold },

  selectBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F4C430', borderRadius: BorderRadius.card, padding: 10, marginBottom: 10 },
  selectCount: { fontSize: 13, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  selectActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  selectAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectActionText: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#1A1B1C' },
  selectCancel: { paddingLeft: 8 },
  selectCancelText: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#6B6B6B' },

  listContainer: { gap: 10, paddingBottom: 40 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: '#E8E5DC', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontFamily: FontFamily.extrabold, color: '#1A1B1C', marginTop: 10 },
  emptySub: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', textAlign: 'center', marginTop: 4, lineHeight: 16 },

  studentCard: {
    backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E8E5DC',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  studentCardSelected: { borderColor: '#F4C430', backgroundColor: '#FFFDF7' },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#E8E5DC', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  avatarCircleMuted: { backgroundColor: '#E5E7EB' },
  avatarText: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#D97706' },
  studentDetails: { flex: 1 },
  studentName: { fontSize: 14, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  studentEmail: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', marginTop: 1 },
  studentMeta: { fontSize: 11, fontFamily: FontFamily.regular, color: '#9CA3AF', marginTop: 3 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, gap: 14, borderWidth: 1, borderColor: '#E8E5DC', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  sectionHeader: { fontSize: 11, fontFamily: FontFamily.extrabold, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  formDivider: { height: 1, backgroundColor: '#F0EDE4', marginVertical: 12 },
  nameRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  nameField: { flex: 1, gap: 4 },
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderWidth: 1,
    borderColor: '#E5E7EB', borderRadius: BorderRadius.input, paddingHorizontal: 12, backgroundColor: '#FFFFFF',
  },
  inputIconText: { flex: 1, fontSize: 13, fontFamily: FontFamily.regular, color: '#1A1B1C' },
  inputPlaceholder: { color: '#9CA3AF' },
  dateModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center',
    justifyContent: 'center', padding: 24,
  },
  dateModalCard: {
    width: '100%', maxWidth: 340, backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#E8E5DC',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  dateModalTitle: { fontSize: 13, fontFamily: FontFamily.extrabold, color: '#1A1B1C', marginBottom: 4 },
  dateMonthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 6 },
  dateMonthBtn: {
    width: 32, height: 32, borderRadius: 5, borderWidth: 1, borderColor: '#E8E5DC',
    backgroundColor: '#FFFDF7', alignItems: 'center', justifyContent: 'center',
  },
  dateMonthLabel: { flex: 1, textAlign: 'center', fontSize: 14, fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  dateDowRow: { flexDirection: 'row', marginBottom: 4 },
  dateDowText: { width: '14.28%', textAlign: 'center', fontSize: 10, fontFamily: FontFamily.extrabold, color: '#9CA3AF' },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateDayCell: { width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center' },
  dateDaySelected: { backgroundColor: '#F4C430', borderRadius: 5},
  dateDayToday: { borderWidth: 1, borderColor: '#F4C430', borderRadius: 5},
  dateDayText: { fontSize: 13, fontFamily: FontFamily.semibold, color: '#1A1B1C' },
  dateDayTextSelected: { fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  dateModalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  dateActionBtns: { flexDirection: 'row', gap: 8 },
  dateClearText: { fontSize: 13, fontFamily: FontFamily.bold, color: '#6B6B6B' },
  dateCancelBtn: { height: 38, paddingHorizontal: 16, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  dateCancelText: { fontSize: 13, fontFamily: FontFamily.bold, color: '#6B6B6B' },
  dateConfirmBtn: { height: 38, paddingHorizontal: 20, borderRadius: 5, backgroundColor: '#F4C430', justifyContent: 'center', alignItems: 'center' },
  dateConfirmText: { fontSize: 13, fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  formGroup: { gap: 4, marginBottom: 10 },
  label: { fontSize: 12, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  input: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: BorderRadius.input, paddingHorizontal: 12, fontSize: 13, fontFamily: FontFamily.regular, backgroundColor: '#FFFFFF', color: '#111827' },
  hintText: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B', marginTop: 2 },
  feeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0EDE4' },
  feeRowTitle: { fontSize: 13, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  feeRowMeta: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B', marginTop: 1 },
  feeRowAmount: { fontSize: 13, fontFamily: FontFamily.extrabold, color: '#1A1B1C', marginLeft: 8 },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.chip, borderWidth: 1, borderColor: '#E8E5DC', backgroundColor: '#FFFDF7', marginRight: 6 },
  chipSelected: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  chipText: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#6B6B6B' },
  chipTextSelected: { color: '#1A1B1C', fontFamily: FontFamily.bold },
  chipHint: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B', paddingVertical: 4 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#6B6B6B', fontFamily: FontFamily.bold, fontSize: 13 },
  submitBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#F4C430', borderRadius: BorderRadius.button, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  submitBtnDisabled: { backgroundColor: '#E8E5DC' },
  submitText: { color: '#1A1B1C', fontFamily: FontFamily.extrabold, fontSize: 13 },

  // Detail sheet
  detailSheet: { maxHeight: '85%' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  detailHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  detailBody: { paddingBottom: 20 },
  detailAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  detailAvatarText: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#D97706' },
  detailName: { fontSize: 16, fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  detailEmail: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', marginTop: 1 },
  detailSection: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E8E5DC', padding: 14, gap: 6, marginTop: 10 },
  detailSectionTitle: { fontSize: 11, fontFamily: FontFamily.extrabold, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  detailLabel: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  detailValue: { fontSize: 13, fontFamily: FontFamily.semibold, color: '#1A1B1C' },
  detailActions: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E8E5DC' },
  detailActionBtn: { alignItems: 'center', gap: 4 },
  detailActionText: { fontSize: 11, fontFamily: FontFamily.semibold, color: '#1A1B1C' },

  deleteText: { fontSize: 14, fontFamily: FontFamily.regular, color: '#1A1B1C', lineHeight: 20, marginVertical: 10 },
});