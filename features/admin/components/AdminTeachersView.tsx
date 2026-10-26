import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DropdownSelect } from './DropdownSelect';
import { BulkImportModal } from './BulkImportModal';
import { createSubjectTeacherApi, updateClassSectionApi } from '../../../api/academics';
import { createPayrollSchedulesApi } from '../../../api/payroll';

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

const CLASS_KEY_SEP = String.fromCharCode(1);
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

const SCHOOL_DESIGNATIONS = ['Principal', 'Vice Principal', 'Head of Department', 'Senior Teacher', 'Teacher', 'Coordinator'];
const COLLEGE_DESIGNATIONS = ['Dean', 'Head of Department', 'Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Visiting'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

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

interface TeacherItem {
  id: string;
  fullName: string;
  email: string;
  department?: string;
  employeeId?: string;
  title?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  scope?: string;
}

interface AdminTeachersViewProps {
  teachers: TeacherItem[];
  departments: string[];
  institutionType: 'school' | 'college';
  classSections?: { id: string; name: string; department?: string; academicYear?: string; section?: string }[];
  courses?: string[];
  academicYears?: string[];
  subjects?: { id: string; name: string }[];
  onCreateTeacher: (teacher: {
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    phone?: string;
    classSection?: { department: string; academicYear: string; section: string };
    password?: string;
  }) => Promise<void>;
  onUpdateTeacher: (id: string, payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    employeeId?: string;
    department?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    designation?: string;
    employmentType?: string;
    joiningDate?: string;
    classSection?: { department: string; academicYear: string; section: string };
    program?: string;
    semester?: string;
  }) => Promise<void>;
  onDeleteTeacher: (id: string) => Promise<void>;
  onSearchChange?: (q: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  onDataChange?: () => void;
}

export const AdminTeachersView: React.FC<AdminTeachersViewProps> = ({
  teachers,
  departments,
  institutionType,
  classSections = [],
  courses = [],
  academicYears = [],
  subjects = [],
  onCreateTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onSearchChange,
  hasMore = false,
  onLoadMore,
  totalCount,
  refreshing = false,
  onRefresh,
  onDataChange,
}) => {
  const [search, setSearch] = useState('');
  const updateSearch = (q: string) => {
    setSearch(q);
    onSearchChange?.(q);
  };
  const [deptFilter, setDeptFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editModal, setEditModal] = useState<TeacherItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TeacherItem | null>(null);

  // Create form — 5 basics + assignments + salary
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState(departments[0] || '');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Create-only assignments (write subject_teachers + class teacher after create)
  const [selSubjects, setSelSubjects] = useState<string[]>([]);
  const [selClasses, setSelClasses] = useState<string[]>([]);
  const [selClassTeacher, setSelClassTeacher] = useState('');

  // Edit form
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editEmploymentType, setEditEmploymentType] = useState('');
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [editClassKey, setEditClassKey] = useState('');
  const [editClassLabel, setEditClassLabel] = useState('');
  const [editProgram, setEditProgram] = useState('');
  const [editSemester, setEditSemester] = useState('');

  const filteredTeachers = teachers.filter(
    (t) =>
      (t.fullName.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase())) &&
      (!deptFilter || t.department === deptFilter)
  );

  const openEdit = (t: TeacherItem) => {
    const nameParts = t.fullName.split(' ');
    setEditFirstName(nameParts[0] || '');
    setEditLastName(nameParts.slice(1).join(' ') || '');
    setEditEmail(t.email);
    const scope = typeof t.scope === 'string' ? JSON.parse(t.scope || '{}') : (t.scope || {});
    setEditEmployeeId(scope.employeeId || t.employeeId || '');
    setEditDept(scope.department || t.department || '');
    setEditPhone(t.phone || '');
    setEditDob(t.dob || '');
    setEditGender(t.gender || '');
    setEditDesignation(scope.designation || t.title || '');
    setEditEmploymentType(scope.employmentType || '');
    setEditJoiningDate(scope.joiningDate || '');
    setEditProgram(scope.program || '');
    setEditSemester(scope.semester || '');
    const cs = scope.classSection;
    if (cs && ((cs.department || '') || (cs.academicYear || '') || (cs.section || ''))) {
      setEditClassKey(tripleKey(cs.department || '', cs.academicYear || '', cs.section || ''));
      setEditClassLabel(scope.classSectionName || joinClassLabel(cs.department || '', cs.section || ''));
    } else {
      setEditClassKey('');
      setEditClassLabel(scope.classSectionName || '');
    }
    setEditModal(t);
  };

  const resetCreateForm = () => {
    setFirstName(''); setLastName(''); setEmail('');
    setPhone(''); setSalary(''); setPassword('');
    setDept(departments[0] || '');
    setSelSubjects([]); setSelClasses([]); setSelClassTeacher('');
  };

  const handleCreate = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert('Missing Fields', 'First Name, Last Name, and Email are required.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Missing Fields', 'Phone number is required.');
      return;
    }
    setSubmitting(true);
    try {
      const primaryCs = classSections.find(
        (c: any) => c.id === (institutionType === 'school' ? selClassTeacher || selClasses[0] || '' : selClassTeacher || '')
      );
      const academic: any = primaryCs
        ? { classSection: { department: primaryCs.department || '', academicYear: primaryCs.academicYear || '', section: primaryCs.section || '' } }
        : {};
      const res: any = await onCreateTeacher({
        firstName, lastName, email,
        department: institutionType === 'school' ? (selSubjects[0] || dept) : dept,
        phone: phone.trim(),
        ...academic,
        password: password || undefined,
      });

      // Write subject_teachers rows + class-teacher assignment (create-only)
      let assignNote = '';
      if (res?.id && (selClasses.length > 0 || selClassTeacher)) {
        const warns: string[] = [];
        let created = 0;
        let already = 0;
        const csName = (id: string) => classSections.find((c: any) => c.id === id)?.name || '';
        for (const csId of selClasses) {
          for (const subName of selSubjects) {
            const sub = subjects.find((s) => s.name === subName);
            if (!sub) {
              warns.push(`${subName}: no matching subject row in Academics → Subjects`);
              continue;
            }
            try {
              await createSubjectTeacherApi({ classSectionId: csId, subjectId: sub.id, teacherId: res.id });
              created++;
            } catch (e: any) {
              if (e?.code === 'SUBJECT_TEACHER_EXISTS' || /already assigned/i.test(String(e?.message || ''))) already++;
              else warns.push(`${subName} × ${csName(csId)}: ${e?.message || 'failed'}`);
            }
          }
        }
        if (selClassTeacher) {
          try {
            await updateClassSectionApi(selClassTeacher, { classTeacherId: res.id });
            assignNote = `Class teacher · ${csName(selClassTeacher)}`;
          } catch (e: any) {
            warns.push(`Class teacher · ${csName(selClassTeacher)}: ${e?.message || 'failed'}`);
          }
        }
        if (created || already) {
          assignNote += `${assignNote ? '\n' : ''}Assignments: ${created} created${already ? `, ${already} already assigned` : ''}`;
        }
        if (warns.length) assignNote += `${assignNote ? '\n' : ''}Skipped:\n• ${warns.join('\n• ')}`;
        onDataChange?.();
      }

      // Monthly salary → payroll schedule (create-only)
      let payrollNote = '';
      const salaryAmount = Number(String(salary).replace(/[^0-9.]/g, '')) || 0;
      if (res?.id && salaryAmount > 0) {
        try {
          await createPayrollSchedulesApi({ userIds: [res.id], amount: salaryAmount, frequency: 'monthly' });
          payrollNote = `Salary schedule: ₹${salaryAmount.toLocaleString('en-IN')} / month`;
        } catch (e: any) {
          payrollNote = `Salary schedule could not be created (${e?.message || 'failed'}) — add it from Payroll.`;
        }
      }

      setCreateOpen(false);
      resetCreateForm();
      const message = res?.tempPassword
        ? `Teacher account created! Temporary password (shown once): ${res.tempPassword}\n\nShare it securely — the teacher must change it at first login.`
        : password
          ? 'Teacher account created! They can log in with the password you set.'
          : 'Teacher account created! They can log in with the institution default password.';
      const notes = [assignNote, payrollNote].filter(Boolean).join('\n');
      Alert.alert('Success', message + (notes ? `\n\n${notes}` : ''));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editModal || !editFirstName || !editLastName || !editEmail) {
      Alert.alert('Missing Fields', 'First Name, Last Name, and Email are required.');
      return;
    }
    setSubmitting(true);
    try {
      const academic: any = institutionType === 'school'
        ? (editClassKey ? { classSection: parseTripleKey(editClassKey) } : {})
        : { program: editProgram || '', semester: editSemester || '' };
      await onUpdateTeacher(editModal.id, {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        employeeId: editEmployeeId,
        department: editDept,
        phone: editPhone.trim(),
        dob: editDob,
        gender: editGender,
        designation: editDesignation,
        employmentType: editEmploymentType,
        joiningDate: editJoiningDate,
        ...academic,
      });
      setEditModal(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await onDeleteTeacher(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete teacher');
    }
  };

  const renderCreateFields = () => {
    const subjectChipNames = (() => {
      const names: string[] = subjects.map((s) => s.name);
      if (institutionType !== 'college') {
        for (const dep of departments) if (!names.includes(dep)) names.push(dep);
      }
      return names;
    })();

    const chip = (label: string, selected: boolean, onPress: () => void, key?: string) => (
      <TouchableOpacity key={key ?? label} style={[styles.chipOption, selected && styles.chipOptionActive]} onPress={onPress} activeOpacity={0.7}>
        {selected && <MaterialCommunityIcons name="check" size={12} color="#1A1B1C" />}
        <Text style={[styles.chipOptionText, selected && styles.chipOptionTextActive]}>{label}</Text>
      </TouchableOpacity>
    );

    const assignmentBlocks = (
      <>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Subjects {selSubjects.length > 0 ? `· ${selSubjects.length} selected` : ''}</Text>
          {subjectChipNames.length === 0 ? (
            <Text style={styles.hintText}>No subjects yet — add them in Academics → Subjects first.</Text>
          ) : (
            <View style={styles.chipGrid}>
              {subjectChipNames.map((name) =>
                chip(name, selSubjects.includes(name), () =>
                  setSelSubjects((prev) => (prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]))
                )
              )}
            </View>
          )}
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Classes {selClasses.length > 0 ? `· ${selClasses.length} selected` : ''}</Text>
          {classSections.length === 0 ? (
            <Text style={styles.hintText}>No classes configured yet — add classes under Institution → Classes.</Text>
          ) : (
            <View style={styles.chipGrid}>
              {classSections.map((c: any) =>
                chip(c.name, selClasses.includes(c.id), () =>
                  setSelClasses((prev) => {
                    const next = prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id];
                    if (!next.includes(selClassTeacher)) setSelClassTeacher('');
                    return next;
                  }),
                  c.id
                )
              )}
            </View>
          )}
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Class teacher of</Text>
          {selClasses.length === 0 ? (
            <Text style={styles.hintText}>Select a class above to also make this teacher its class teacher (optional).</Text>
          ) : (
            <View style={styles.chipGrid}>
              {classSections
                .filter((c: any) => selClasses.includes(c.id))
                .map((c: any) =>
                  chip(c.name, selClassTeacher === c.id, () => setSelClassTeacher(selClassTeacher === c.id ? '' : c.id), c.id)
                )}
            </View>
          )}
        </View>
      </>
    );

    return (
      <>
        <Text style={styles.sectionHeader}>A. Basic Details</Text>
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Vikram" placeholderTextColor="#9CA3AF" value={firstName} onChangeText={setFirstName} />
          </View>
          <View style={styles.nameField}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Patel" placeholderTextColor="#9CA3AF" value={lastName} onChangeText={setLastName} />
          </View>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <View style={styles.inputWithIcon}>
            <MaterialCommunityIcons name="email-outline" size={16} color="#9CA3AF" />
            <TextInput style={styles.inputIconText} placeholder="vikram@school.edu" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <View style={styles.inputWithIcon}>
            <MaterialCommunityIcons name="phone-outline" size={16} color="#9CA3AF" />
            <TextInput style={styles.inputIconText} placeholder="+91 98765 43210" placeholderTextColor="#9CA3AF" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>
        </View>

        <View style={styles.formDivider} />
        <Text style={styles.sectionHeader}>B. Assignments</Text>
        {assignmentBlocks}

        <View style={styles.formDivider} />
        <Text style={styles.sectionHeader}>C. Salary</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Monthly Salary (₹)</Text>
          <View style={styles.inputWithIcon}>
            <MaterialCommunityIcons name="cash" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.inputIconText}
              placeholder="e.g. 35000"
              placeholderTextColor="#9CA3AF"
              value={salary}
              onChangeText={(v) => setSalary(v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.hintText}>Optional — creates a monthly payroll schedule for this teacher.</Text>
        </View>

        <View style={styles.formDivider} />
        <Text style={styles.sectionHeader}>D. Account Access</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Temporary Password</Text>
          <View style={styles.inputWithIcon}>
            <MaterialCommunityIcons name="lock-outline" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.inputIconText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Leave empty for institution default"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <Text style={styles.hintText}>Invitation is emailed; the teacher changes this password on first login.</Text>
        </View>
      </>
    );
  };

  const renderEditFields = () => {
    const fn = editFirstName;
    const ln = editLastName;
    const em = editEmail;
    const eid = editEmployeeId;
    const d = editDept;
    const ph = editPhone;
    const db = editDob;
    const gn = editGender;
    const dsg = editDesignation;
    const emp = editEmploymentType;
    const doj = editJoiningDate;
    const ck = editClassKey;
    const pg = editProgram;
    const sm = editSemester;
    const setFn = setEditFirstName;
    const setLn = setEditLastName;
    const setEm = setEditEmail;
    const setEid = setEditEmployeeId;
    const setD = setEditDept;
    const setPh = setEditPhone;
    const setDb = setEditDob;
    const setGn = setEditGender;
    const setDsg = setEditDesignation;
    const setEmp = setEditEmploymentType;
    const setDoj = setEditJoiningDate;
    const setCk = setEditClassKey;
    const setPg = setEditProgram;
    const setSm = setEditSemester;

    const designationOptions = (institutionType === 'school' ? SCHOOL_DESIGNATIONS : COLLEGE_DESIGNATIONS).map((x) => ({ key: x, label: x }));
    const classOptions = classSections.map((cs) => ({
      key: tripleKey(cs.department || '', cs.academicYear || '', cs.section || ''),
      label: joinClassLabel(cs.department || '', cs.section || '') || cs.name,
    }));
    const currentClassLabel = editClassLabel || 'Selected class';

    return (
      <>
        <Text style={styles.sectionHeader}>A. Personal Details</Text>
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Vikram" placeholderTextColor="#9CA3AF" value={fn} onChangeText={setFn} />
          </View>
          <View style={styles.nameField}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Patel" placeholderTextColor="#9CA3AF" value={ln} onChangeText={setLn} />
          </View>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <View style={styles.inputWithIcon}>
            <MaterialCommunityIcons name="email-outline" size={16} color="#9CA3AF" />
            <TextInput style={styles.inputIconText} placeholder="vikram@school.edu" placeholderTextColor="#9CA3AF" value={em} onChangeText={setEm} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <View style={styles.inputWithIcon}>
            <MaterialCommunityIcons name="phone-outline" size={16} color="#9CA3AF" />
            <TextInput style={styles.inputIconText} placeholder="+91 98765 43210" placeholderTextColor="#9CA3AF" value={ph} onChangeText={setPh} keyboardType="phone-pad" />
          </View>
        </View>
        <View style={styles.nameRow}>
          <DateField label="Date of Birth" value={db} onChange={setDb} style={{ flex: 1 }} />
          <View style={{ flex: 1 }}>
            <DropdownSelect
              variant="inline"
              label="Gender"
              value={gn}
              onChange={setGn}
              placeholder="Select gender"
              options={GENDER_OPTIONS.map((x) => ({ key: x, label: x }))}
            />
          </View>
        </View>

        <View style={styles.formDivider} />
        <Text style={styles.sectionHeader}>B. Employment Details</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Employee ID *</Text>
          <View style={styles.inputWithIcon}>
            <MaterialCommunityIcons name="card-account-details-outline" size={16} color="#9CA3AF" />
            <TextInput style={styles.inputIconText} placeholder="EMP101" placeholderTextColor="#9CA3AF" value={eid} onChangeText={setEid} />
          </View>
        </View>
        <View style={styles.nameRow}>
          <DateField label="Date of Joining *" value={doj} onChange={setDoj} style={{ flex: 1 }} />
          <View style={{ flex: 1 }}>
            <DropdownSelect
              variant="inline"
              label="Designation *"
              value={dsg}
              onChange={setDsg}
              placeholder="Select designation"
              options={designationOptions}
            />
          </View>
        </View>
        <DropdownSelect
          variant="inline"
          style={styles.formGroup}
          label="Employment Type"
          value={emp}
          onChange={setEmp}
          placeholder="Select employment type"
          options={EMPLOYMENT_TYPES.map((x) => ({ key: x, label: x }))}
        />

        <View style={styles.formDivider} />
        <Text style={styles.sectionHeader}>C. Academic Assignments</Text>
        {institutionType === 'school' ? (
          <>
            {departments.length > 0 ? (
              <DropdownSelect
                variant="inline"
                style={styles.formGroup}
                label="Subject"
                value={d}
                onChange={setD}
                placeholder="Select subject"
                options={departments}
              />
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Subject</Text>
                <TextInput style={styles.input} placeholder="e.g. Science" placeholderTextColor="#9CA3AF" value={d} onChangeText={setD} />
              </View>
            )}
            {classSections.length > 0 ? (
              <DropdownSelect
                variant="inline"
                style={styles.formGroup}
                label="Class / Section"
                value={ck}
                onChange={setCk}
                placeholder="Select class (optional)"
                options={optionsWithCurrent(classOptions, ck, currentClassLabel)}
                menuTitle="Class / Section"
              />
            ) : (
              <Text style={styles.hintText}>No classes configured yet — add classes under Institution → Classes.</Text>
            )}
          </>
        ) : (
          <>
            {departments.length > 0 ? (
              <DropdownSelect
                variant="inline"
                style={styles.formGroup}
                label="Department"
                value={d}
                onChange={setD}
                placeholder="Select department"
                options={departments}
              />
            ) : (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Department</Text>
                <TextInput style={styles.input} placeholder="e.g. Computer Science" placeholderTextColor="#9CA3AF" value={d} onChangeText={setD} />
              </View>
            )}
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <DropdownSelect
                  variant="inline"
                  label="Program"
                  value={pg}
                  onChange={setPg}
                  placeholder="Select program"
                  options={courses}
                />
              </View>
              <View style={{ flex: 1 }}>
                <DropdownSelect
                  variant="inline"
                  label="Semester / Year"
                  value={sm}
                  onChange={setSm}
                  placeholder="Select year"
                  options={academicYears}
                />
              </View>
            </View>
          </>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Teachers</Text>
          <Text style={styles.pageSubtitle}>{teachers.length} teachers</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.importBtn} onPress={() => setImportOpen(true)}>
            <MaterialCommunityIcons name="file-import-outline" size={18} color="#1A1B1C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => { resetCreateForm(); setCreateOpen(true); }}>
            <MaterialCommunityIcons name="plus" size={16} color="#1A1B1C" />
            <Text style={styles.addBtnText}>Add Teacher</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.headerBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6B6B6B" />
          <TextInput style={styles.searchInput} placeholder="Search by name, email..." value={search} onChangeText={updateSearch} />
        </View>
      </View>

      {/* Subject / Department Filter */}
      <DropdownSelect
        leadingIcon="filter-variant"
        style={{ marginBottom: 12 }}
        value={deptFilter}
        onChange={setDeptFilter}
        menuTitle={`Filter by ${institutionType === 'school' ? 'Subject' : 'Department'}`}
        placeholder={`All ${institutionType === 'school' ? 'subjects' : 'departments'}`}
        options={[
          { key: '', label: 'All' },
          ...departments.map((dp) => ({ key: dp, label: dp })),
        ]}
      />

      {/* Teacher List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} />}
      >
        {filteredTeachers.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="human-male-board" size={40} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No Teachers Found</Text>
            <Text style={styles.emptySub}>Click &quot;Add Teacher&quot; to onboard a teacher.</Text>
          </View>
        ) : (
          filteredTeachers.map((t) => (
            <View key={t.id} style={styles.teacherCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{t.fullName.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.teacherDetails}>
                <Text style={styles.teacherName}>{t.fullName}</Text>
                <Text style={styles.teacherEmail}>{t.email}</Text>
                {!![t.employeeId, t.title, t.department].filter(Boolean).length && (
                  <Text style={styles.teacherMeta}>
                    {[t.employeeId, t.title, t.department].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(t)}>
                  <MaterialCommunityIcons name="pencil" size={16} color="#6B6B6B" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => setDeleteConfirm(t)}>
                  <MaterialCommunityIcons name="delete-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        {hasMore && onLoadMore && (
          <TouchableOpacity style={styles.loadMoreBtn} onPress={onLoadMore}>
            <Text style={styles.loadMoreText}>
              Load more ({teachers.length}{totalCount != null ? ` of ${totalCount}` : ''})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={createOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Teacher</Text>
              <TouchableOpacity onPress={() => setCreateOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 560 }} showsVerticalScrollIndicator={false}>
              {renderCreateFields()}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                <MaterialCommunityIcons name="check" size={15} color="#1A1B1C" />
                <Text style={styles.submitText}>{submitting ? 'Creating...' : 'Create Teacher'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Teacher</Text>
              <TouchableOpacity onPress={() => setEditModal(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 560 }} showsVerticalScrollIndicator={false}>
              {renderEditFields()}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModal(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleEdit} disabled={submitting}>
                <MaterialCommunityIcons name="check" size={15} color="#1A1B1C" />
                <Text style={styles.submitText}>{submitting ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal visible={!!deleteConfirm} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Teacher</Text>
              <TouchableOpacity onPress={() => setDeleteConfirm(null)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.deleteText}>
              Are you sure you want to delete <Text style={{ fontWeight: '700' }}>{deleteConfirm?.fullName}</Text>? This will remove their account permanently.
            </Text>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteConfirm(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#DC3545' }]} onPress={handleDelete}>
                <Text style={styles.submitText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BulkImportModal
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        type="teacher"
        onImported={onRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: 0.2 },
  pageSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  headerBar: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 5, borderWidth: 1, borderColor: '#E8E5DC', paddingHorizontal: 12, height: 44, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1A1B1C' },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  loadMoreText: { fontSize: 13, fontWeight: '700', color: '#F4C430' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F4C430', borderRadius: 5, paddingHorizontal: 14, height: 40, justifyContent: 'center', shadowColor: '#171717', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2 },
  addBtnText: { color: '#1A1B1C', fontWeight: '800', fontSize: 13 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  importBtn: {
    width: 38,
    height: 38,
    borderRadius: 5,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: { gap: 10, paddingBottom: 40 },
  emptyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 30, alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E5DC', marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1A1B1C', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 4, lineHeight: 16 },
  teacherCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E8E5DC', flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1A1B1C', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  teacherDetails: { flex: 1 },
  teacherName: { fontSize: 14, fontWeight: '700', color: '#1A1B1C' },
  teacherEmail: { fontSize: 12, color: '#6B6B6B', marginTop: 1 },
  teacherMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  actions: { gap: 6 },
  actionBtn: {
    width: 34, height: 34, borderRadius: 5, backgroundColor: '#FFFDF7', borderWidth: 1, borderColor: '#E8E5DC',
    alignItems: 'center', justifyContent: 'center',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, gap: 14, borderWidth: 1, borderColor: '#E8E5DC', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A1B1C' },
  sectionHeader: { fontSize: 11, fontWeight: '800', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  formDivider: { height: 1, backgroundColor: '#F0EDE4', marginVertical: 12 },
  nameRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  nameField: { flex: 1, gap: 4 },
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderWidth: 1,
    borderColor: '#E5E7EB', borderRadius: 5, paddingHorizontal: 12, backgroundColor: '#FFFFFF',
  },
  inputIconText: { flex: 1, fontSize: 13, color: '#1A1B1C' },
  formGroup: { gap: 4, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#1A1B1C' },
  input: { height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 5, paddingHorizontal: 12, fontSize: 13, backgroundColor: '#FFFFFF', color: '#111827' },
  hintText: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chipOption: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 5, borderWidth: 1, borderColor: '#E8E5DC', backgroundColor: '#FFFFFF',
  },
  chipOptionActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  chipOptionText: { fontSize: 12, fontWeight: '600', color: '#6B6B6B' },
  chipOptionTextActive: { color: '#1A1B1C', fontWeight: '800' },
  inputPlaceholder: { color: '#9CA3AF' },
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
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancelBtn: { height: 40, paddingHorizontal: 16, borderRadius: 5, justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#6B6B6B', fontWeight: '700', fontSize: 13 },
  submitBtn: { height: 40, paddingHorizontal: 20, backgroundColor: '#F4C430', borderRadius: 5, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6 },
  submitText: { color: '#1A1B1C', fontWeight: '800', fontSize: 13 },
  deleteText: { fontSize: 14, color: '#1A1B1C', lineHeight: 20, marginVertical: 10 },
});
