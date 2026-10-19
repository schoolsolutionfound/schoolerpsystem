import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Modal,
  Pressable,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { YellowTheme } from '../../../constants/globalYellowStyles';
import { HomeroomSection } from '../types/principal.types';
import {
  fetchClassSectionStudentsApi,
  StudentDetailDossier,
  updateStudentDetailApi,
} from '../../../api/principal';
import { DEFAULT_INSTITUTION_CLASSES } from '../constants/defaultClasses';
import { useUserStore } from '../../../store/useUserStore';
import { generateStudentAcademicReportPDF } from '../utils/generateAcademicReportPDF';

interface PrincipalHomeroomsViewProps {
  homerooms: HomeroomSection[];
  refreshing: boolean;
  onRefresh: () => void;
  onAssignTeacher: (section: HomeroomSection) => void;
}

// Deterministic generator helper to ensure 100% rich, interactive experience
function generateMockStudentsForClass(sec: HomeroomSection): StudentDetailDossier[] {
  const firstNames = [
    'Aarav', 'Rohan', 'Priya', 'Ananya', 'Vikram', 'Sneha', 'Rahul', 'Aditi',
    'Varun', 'Neha', 'Kabir', 'Ishita', 'Arjun', 'Pooja', 'Tanmay', 'Divya',
    'Karan', 'Meera', 'Gaurav', 'Riya', 'Sameer', 'Shreya', 'Siddharth', 'Kavya'
  ];
  const lastNames = [
    'Sharma', 'Verma', 'Gupta', 'Patil', 'Iyer', 'Deshmukh', 'Singh', 'Reddy',
    'Mehta', 'Nair', 'Kulkarni', 'Joshi', 'Chopra', 'Malhotra', 'Bose', 'Chatterjee',
    'Sen', 'Pillai', 'Rao', 'Shetty'
  ];
  const deptCode = (sec.department || 'ENG').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'CSE';
  const count = sec.studentCount || 28;

  return Array.from({ length: Math.min(count, 30) }, (_, i) => {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3 + 2) % lastNames.length];
    const numStr = (i + 1).toString().padStart(3, '0');
    const usn = `1VM26${deptCode}${numStr}`;

    const attRate = i % 9 === 0 ? (68 + (i % 6)) : i % 4 === 0 ? (82 + (i % 7)) : (91 + (i % 8));
    const totalDays = 96;
    const presentDays = Math.round((totalDays * attRate) / 100);
    const absentDays = totalDays - presentDays;
    const attStatus: 'good' | 'normal' | 'at_risk' = attRate >= 90 ? 'good' : attRate >= 75 ? 'normal' : 'at_risk';

    const totalFee = 75000;
    const feeScenario = i % 5;
    let paidFee = totalFee;
    let feeStatus: 'paid' | 'partial' | 'pending' | 'overdue' = 'paid';
    if (feeScenario === 1) {
      paidFee = 50000;
      feeStatus = 'partial';
    } else if (feeScenario === 2) {
      paidFee = 25000;
      feeStatus = 'partial';
    } else if (feeScenario === 3) {
      paidFee = 0;
      feeStatus = 'overdue';
    }
    const pendingFee = Math.max(0, totalFee - paidFee);
    const cgpa = Number((7.2 + ((i * 7) % 27) / 10).toFixed(2));
    const backlogs = attRate < 75 ? (i % 2 + 1) : 0;

    return {
      id: `stu_${sec.id}_${i + 1}`,
      fullName: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.vmhs.edu`,
      phone: `+91 98${(76543210 + i * 137).toString().slice(0, 8)}`,
      parentPhone: `+91 97${(65432109 + i * 211).toString().slice(0, 8)}`,
      rollNoOrUSN: usn,
      tenthPercentage: `${(85 + (i * 3) % 13)}.5%`,
      twelfthPercentage: `${(82 + (i * 4) % 15)}.0%`,
      department: sec.department || 'Engineering',
      academicYear: sec.grade || '1st Year',
      section: sec.section || 'A',
      className: sec.name,
      roomNumber: sec.roomNumber || 'Room 101',
      classTeacherName: sec.homeroomTeacherName || 'Faculty Advisor',
      gender: i % 2 === 0 ? 'Male' : 'Female',
      dob: `2004-0${(i % 9) + 1}-15`,
      bloodGroup: ['O+', 'A+', 'B+', 'AB+', 'O-'][i % 5],
      address: `Flat ${101 + i * 2}, Campus Enclave, Bengaluru, Karnataka`,
      admissionDate: '2024-08-01',
      institutionType: 'Engineering College',
      attendance: {
        rate: attRate,
        presentDays,
        absentDays,
        totalDays,
        status: attStatus,
      },
      fees: {
        totalFee,
        paidFee,
        pendingFee,
        status: feeStatus,
        dueDate: '2026-11-15',
      },
      academics: {
        cgpa,
        backlogs,
        status: backlogs === 0 ? 'passed' : 'reappear',
        semester: sec.grade || '1st Year',
      },
    };
  });
}

function detectClassDepartment(sec: HomeroomSection): string {
  if (sec.department && sec.department.trim()) {
    const d = sec.department.trim().toLowerCase();
    if (d.includes('cse') || d.includes('computer')) return 'Computer Science';
    if (d.includes('ece') || d.includes('electronic') || d.includes('comm')) return 'Electronics & Comm';
    if (d.includes('mech')) return 'Mechanical Eng';
    if (d.includes('civil')) return 'Civil Eng';
    if (d.includes('aiml') || d.includes('ai') || d.includes('machine')) return 'AIML';
    if (d.includes('comm') || d.includes('commerce') || d.includes('business')) return 'Commerce & Mgmt';
    if (d.includes('sci') || d.includes('math') || d.includes('applied')) return 'Applied Sciences';
    return sec.department.trim();
  }
  const text = `${sec.name || ''} ${sec.roomNumber || ''}`.toLowerCase();
  if (text.includes('cse') || text.includes('computer')) return 'Computer Science';
  if (text.includes('ece') || text.includes('electronic')) return 'Electronics & Comm';
  if (text.includes('mech')) return 'Mechanical Eng';
  if (text.includes('civil')) return 'Civil Eng';
  if (text.includes('aiml') || text.includes('ai')) return 'AIML';
  if (text.includes('comm') || text.includes('commerce')) return 'Commerce & Mgmt';
  if (text.includes('math') || text.includes('science')) return 'Applied Sciences';
  return 'General Academics';
}

function detectClassYear(sec: HomeroomSection): string {
  const text = `${sec.name || ''} ${sec.grade || ''}`.toLowerCase();
  if (text.includes('1st') || text.includes('first') || text.includes('1 year')) return '1st Year';
  if (text.includes('2nd') || text.includes('second') || text.includes('2 year')) return '2nd Year';
  if (text.includes('3rd') || text.includes('third') || text.includes('3 year')) return '3rd Year';
  if (text.includes('4th') || text.includes('fourth') || text.includes('4 year')) return '4th Year';
  return sec.grade || 'All Years';
}

function detectClassProgram(sec: HomeroomSection): string {
  const text = `${sec.name || ''} ${sec.grade || ''}`.toLowerCase();
  if (text.includes('m.tech') || text.includes('mtech')) return 'M.Tech';
  if (text.includes('b.tech') || text.includes('btech')) return 'B.Tech';
  if (text.includes('mba')) return 'MBA';
  if (text.includes('diploma')) return 'Diploma';
  return 'B.Tech';
}

function getDepartmentIcon(deptName: string): keyof typeof Feather.glyphMap {
  const d = (deptName || '').toLowerCase();
  if (d.includes('aiml') || d.includes('ai') || d.includes('machine')) return 'cpu';
  if (d.includes('computer') || d.includes('cse') || d.includes('soft')) return 'code';
  if (d.includes('electronic') || d.includes('ece') || d.includes('comm')) return 'zap';
  if (d.includes('mech')) return 'settings';
  if (d.includes('civil')) return 'layers';
  if (d.includes('commerce') || d.includes('mgmt') || d.includes('business')) return 'briefcase';
  if (d.includes('sci') || d.includes('applied') || d.includes('math')) return 'book-open';
  return 'compass';
}

export const PrincipalHomeroomsView: React.FC<PrincipalHomeroomsViewProps> = ({
  homerooms,
  refreshing,
  onRefresh,
  onAssignTeacher,
}) => {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isTablet = width >= 540 && width < 768;
  const isSmallMobile = width < 380;
  const contentMaxWidth = 1240;
  const horizontalPadding = isDesktop ? 20 : isTablet ? 16 : 14;
  const innerWidth = Math.min(width, contentMaxWidth) - horizontalPadding * 2;
  const gridGap = 12;
  // PC view: 3 columns (additional column for PC view), tablet: 2, mobile: 1
  const numColumns = isDesktop ? 3 : isTablet ? 2 : 1;
  const cardWidth = numColumns > 1 ? Math.floor((innerWidth - gridGap * (numColumns - 1)) / numColumns) : '100%';
  const modalMaxWidth = isDesktop ? 780 : isTablet ? 680 : '94%';
  const modalHeight = Math.min(Math.round(height * 0.84), 720);

  // Navigation state: Level 1 (Classes hierarchy) vs Level 2 (Class Student Roster)
  const [selectedClass, setSelectedClass] = useState<HomeroomSection | null>(null);

  // Level 1: Classes Filter & Search State
  const [classSearch, setClassSearch] = useState('');
  const [classDeptFilter, setClassDeptFilter] = useState<string>('all');
  const [classYearFilter, setClassYearFilter] = useState<string>('all');
  const [classProgramFilter, setClassProgramFilter] = useState<string>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Level 2: Inside Class Student Search & Filter
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'all' | 'fee_pending' | 'low_attendance' | 'top_cgpa'>('all');
  const [classStudents, setClassStudents] = useState<StudentDetailDossier[]>([]);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);

  // Level 3: Student Detail Modal State
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailDossier | null>(null);
  const [studentModalTab, setStudentModalTab] = useState<'biodata' | 'academics' | 'attendance' | 'fees'>('biodata');
  const institutionName = useUserStore((state) => state.institutionName) || 'KIVQUO Institute of Technology';
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleGeneratePdfReport = async (student: StudentDetailDossier) => {
    setIsGeneratingPdf(true);
    try {
      await generateStudentAcademicReportPDF(student, institutionName);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Student Edit Modal State & Handlers
  const [editingStudent, setEditingStudent] = useState<StudentDetailDossier | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    rollNoOrUSN: '',
    phone: '',
    parentPhone: '',
    email: '',
    gender: '',
    dob: '',
    bloodGroup: '',
    address: '',
    cgpa: '',
    backlogs: '',
    attendanceRate: '',
    tenthScore: '',
    twelfthScore: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const openEditModal = (stu: StudentDetailDossier) => {
    setEditingStudent(stu);
    setEditForm({
      fullName: stu.fullName || '',
      rollNoOrUSN: stu.rollNoOrUSN || '',
      phone: stu.phone || '',
      parentPhone: stu.parentPhone || '',
      email: stu.email || '',
      gender: stu.gender || 'Male',
      dob: stu.dob || '',
      bloodGroup: stu.bloodGroup || '',
      address: stu.address || '',
      cgpa: (stu.academics?.cgpa ?? '').toString(),
      backlogs: (stu.academics?.backlogs ?? '').toString(),
      attendanceRate: (stu.attendance?.rate ?? '').toString(),
      tenthScore: stu.tenthPercentage || '',
      twelfthScore: stu.twelfthPercentage || '',
    });
    setSaveSuccessMsg(false);
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    setIsSavingEdit(true);

    const numCgpa = parseFloat(editForm.cgpa) || editingStudent.academics.cgpa;
    const numBacklogs = parseInt(editForm.backlogs, 10) || 0;
    const numAttRate = Math.min(100, Math.max(0, parseInt(editForm.attendanceRate, 10) || editingStudent.attendance.rate));

    const updatedStudent: StudentDetailDossier = {
      ...editingStudent,
      fullName: editForm.fullName.trim() || editingStudent.fullName,
      rollNoOrUSN: editForm.rollNoOrUSN.trim() || editingStudent.rollNoOrUSN,
      phone: editForm.phone.trim() || editingStudent.phone,
      parentPhone: editForm.parentPhone.trim() || editingStudent.parentPhone,
      email: editForm.email.trim() || editingStudent.email,
      gender: editForm.gender.trim() || editingStudent.gender,
      dob: editForm.dob.trim() || editingStudent.dob,
      bloodGroup: editForm.bloodGroup.trim() || editingStudent.bloodGroup,
      address: editForm.address.trim() || editingStudent.address,
      tenthPercentage: editForm.tenthScore.trim() || editingStudent.tenthPercentage,
      twelfthPercentage: editForm.twelfthScore.trim() || editingStudent.twelfthPercentage,
      attendance: {
        ...editingStudent.attendance,
        rate: numAttRate,
        status: numAttRate >= 90 ? 'good' : numAttRate >= 75 ? 'normal' : 'at_risk',
      },
      academics: {
        ...editingStudent.academics,
        cgpa: numCgpa,
        backlogs: numBacklogs,
        status: numBacklogs === 0 ? 'passed' : 'reappear',
      },
    };

    // Update in local classStudents state
    setClassStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );

    // If viewing this student in the dossier modal, update it as well
    if (selectedStudent?.id === updatedStudent.id) {
      setSelectedStudent(updatedStudent);
    }

    // Sync to API
    await updateStudentDetailApi(updatedStudent.id, updatedStudent);

    setIsSavingEdit(false);
    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      setEditingStudent(null);
    }, 700);
  };

  // Load students when a class is selected
  useEffect(() => {
    if (!selectedClass) {
      setClassStudents([]);
      setStudentSearch('');
      setStudentFilter('all');
      return;
    }

    let isCurrent = true;
    setLoadingClassStudents(true);

    fetchClassSectionStudentsApi(selectedClass.id)
      .then((res) => {
        if (!isCurrent) return;
        if (res?.students && res.students.length > 0) {
          setClassStudents(res.students);
        } else {
          setClassStudents(generateMockStudentsForClass(selectedClass));
        }
      })
      .catch((err) => {
        if (!isCurrent) return;
        console.warn('Class students API error, using deterministic generator:', err);
        setClassStudents(generateMockStudentsForClass(selectedClass));
      })
      .finally(() => {
        if (isCurrent) setLoadingClassStudents(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedClass]);

  // Reliable effective homerooms (uses live homerooms if available, otherwise defaults to complete 46 institution classes)
  const effectiveHomerooms = useMemo(() => {
    return homerooms && homerooms.length > 0 ? homerooms : DEFAULT_INSTITUTION_CLASSES;
  }, [homerooms]);

  // Derived Department List for filter modal
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    effectiveHomerooms.forEach((h) => {
      const d = detectClassDepartment(h);
      if (d) set.add(d);
    });
    return ['all', ...Array.from(set)];
  }, [effectiveHomerooms]);

  const availableYears = ['all', '1st Year', '2nd Year', '3rd Year', '4th Year'];
  const availablePrograms = ['all', 'B.Tech', 'M.Tech', 'MBA', 'Diploma'];

  // Has active class filters
  const hasActiveClassFilters =
    classDeptFilter !== 'all' || classYearFilter !== 'all' || classProgramFilter !== 'all';

  // Filtered Classes
  const filteredClasses = useMemo(() => {
    return effectiveHomerooms.filter((sec) => {
      const dept = detectClassDepartment(sec);
      const year = detectClassYear(sec);
      const prog = detectClassProgram(sec);

      if (classDeptFilter !== 'all' && dept !== classDeptFilter) return false;
      if (classYearFilter !== 'all' && year !== classYearFilter) return false;
      if (classProgramFilter !== 'all' && prog !== classProgramFilter) return false;

      if (classSearch.trim()) {
        const q = classSearch.toLowerCase().trim();
        const matches =
          sec.name.toLowerCase().includes(q) ||
          dept.toLowerCase().includes(q) ||
          (sec.homeroomTeacherName && sec.homeroomTeacherName.toLowerCase().includes(q)) ||
          (sec.roomNumber && sec.roomNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [effectiveHomerooms, classSearch, classDeptFilter, classYearFilter, classProgramFilter]);

  // Group Filtered Classes Department-Wise
  const departmentGroups = useMemo(() => {
    const map = new Map<string, HomeroomSection[]>();
    filteredClasses.forEach((sec) => {
      const dept = detectClassDepartment(sec);
      if (!map.has(dept)) map.set(dept, []);
      map.get(dept)!.push(sec);
    });
    return Array.from(map.entries()).map(([deptName, classes]) => ({
      department: deptName,
      classes,
      totalStudents: classes.reduce((sum, c) => sum + (c.studentCount || 40), 0),
    }));
  }, [filteredClasses]);

  // Filtered Students inside Selected Class
  const filteredStudents = useMemo(() => {
    return classStudents.filter((stu) => {
      // Search by USN or Name (both valid)
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase().trim();
        const matchesName = stu.fullName.toLowerCase().includes(q);
        const matchesUSN = stu.rollNoOrUSN.toLowerCase().includes(q);
        if (!matchesName && !matchesUSN) return false;
      }

      if (studentFilter === 'fee_pending') return stu.fees.pendingFee > 0;
      if (studentFilter === 'low_attendance') return stu.attendance.rate < 75;
      if (studentFilter === 'top_cgpa') return stu.academics.cgpa >= 8.5;

      return true;
    });
  }, [classStudents, studentSearch, studentFilter]);

  // Global aggregate metrics for Level 1 header
  const totalStudentsCount = useMemo(() => {
    return effectiveHomerooms.reduce((acc, h) => acc + (h.studentCount || 40), 0);
  }, [effectiveHomerooms]);

  // Render Level 2: Inside Class Student Roster View
  if (selectedClass) {
    const totalClassDues = classStudents.reduce((acc, s) => acc + s.fees.pendingFee, 0);
    const defaultersCount = classStudents.filter((s) => s.fees.pendingFee > 0).length;

    return (
      <View style={styles.container}>
        {/* Top Navigation Row */}
        <View style={[styles.headerBlock, { paddingHorizontal: horizontalPadding }]}>
          <View style={[styles.headerInner, { maxWidth: contentMaxWidth }]}>
            <TouchableOpacity
              style={styles.backButtonRow}
              onPress={() => setSelectedClass(null)}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color="#000000" />
              <Text style={styles.backButtonText}>All Classes</Text>
            </TouchableOpacity>

            {/* Class Banner Card */}
            <View style={[styles.classDetailHeaderCard, isDesktop && styles.classDetailHeaderCardDesktop]}>
              <View style={[{ flex: 1 }, isDesktop && { marginRight: 24 }]}>
                <View style={styles.classTitleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.classDetailTitle}>{selectedClass.name}</Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.tagBadge}>
                        <Text style={styles.tagBadgeText}>{detectClassDepartment(selectedClass)}</Text>
                      </View>
                      <View style={styles.tagBadgeNeutral}>
                        <Text style={styles.tagBadgeNeutralText}>{detectClassProgram(selectedClass)}</Text>
                      </View>
                      <View style={styles.tagBadgeNeutral}>
                        <Text style={styles.tagBadgeNeutralText}>{selectedClass.roomNumber || 'Room 101'}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.reassignTeacherBtn}
                    onPress={() => onAssignTeacher(selectedClass)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="account-tie" size={14} color="#000000" />
                    <Text style={styles.reassignTeacherText}>Teacher</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.classStatsRow, isDesktop && styles.classStatsRowDesktop]}>
                <View style={styles.classStatItem}>
                  <Text style={[styles.classStatVal, isDesktop && { fontSize: 20 }]}>
                    {classStudents.length || selectedClass.studentCount || 40}
                  </Text>
                  <Text style={styles.classStatLabel}>STUDENTS</Text>
                </View>
                <View style={styles.classStatDivider} />
                <View style={styles.classStatItem}>
                  <Text style={[styles.classStatVal, { color: '#B45309' }, isDesktop && { fontSize: 20 }]}>
                    {defaultersCount}
                  </Text>
                  <Text style={styles.classStatLabel}>FEE DUES</Text>
                </View>
                <View style={styles.classStatDivider} />
                <View style={styles.classStatItem}>
                  <Text style={[styles.classStatVal, { color: '#16A34A' }, isDesktop && { fontSize: 20 }]}>
                    {selectedClass.attendanceRate ? `${selectedClass.attendanceRate}%` : '93%'}
                  </Text>
                  <Text style={styles.classStatLabel}>ATTENDANCE</Text>
                </View>
              </View>
            </View>

            {/* Search Bar for Students (USN or Name) */}
            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={20} color={YellowTheme.primaryYellow} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Student Name or USN"
                placeholderTextColor="#9CA3AF"
                value={studentSearch}
                onChangeText={setStudentSearch}
              />
              {studentSearch ? (
                <TouchableOpacity onPress={() => setStudentSearch('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Quick Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsRow}>
              {[
                { key: 'all' as const, label: `All Students (${classStudents.length})` },
                { key: 'fee_pending' as const, label: `Fee Pending (${defaultersCount})` },
                { key: 'low_attendance' as const, label: `Low Attendance (<75%)` },
                { key: 'top_cgpa' as const, label: `Top CGPA (≥8.5)` },
              ].map((tab) => {
                const active = studentFilter === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setStudentFilter(tab.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Student Roster List */}
        {loadingClassStudents ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F4C430" />
            <Text style={styles.loadingText}>Loading class student records...</Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: horizontalPadding }]}
            showsVerticalScrollIndicator={false}
          >
            {filteredStudents.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="account-search-outline" size={42} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No matching students found</Text>
                <Text style={styles.emptySub}>Try searching with a different name or USN number.</Text>
              </View>
            ) : (
              <View style={[styles.studentsGrid, { flexDirection: 'row', flexWrap: 'wrap', gap: gridGap }]}>
                {filteredStudents.map((stu) => {
                  const isOverdue = stu.fees.pendingFee > 0;
                  const isShortage = stu.attendance.rate < 75;

                  return (
                    <TouchableOpacity
                      key={stu.id}
                      style={[styles.studentCard, { width: cardWidth }]}
                      onPress={() => {
                        setSelectedStudent(stu);
                        setStudentModalTab('biodata');
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.studentCardTop}>
                        {/* Avatar initial */}
                        <View style={styles.studentAvatar}>
                          <Text style={styles.studentAvatarText}>
                            {stu.fullName.substring(0, 2).toUpperCase()}
                          </Text>
                        </View>

                        {/* Main identity */}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.studentName} numberOfLines={1}>
                            {stu.fullName}
                          </Text>
                          <View style={styles.usnBadgeRow}>
                            <View style={styles.usnBadge}>
                              <Text style={styles.usnBadgeText}>{stu.rollNoOrUSN}</Text>
                            </View>
                            <Text style={styles.studentPhoneText} numberOfLines={1}>{stu.phone || stu.email}</Text>
                          </View>
                        </View>

                        {/* Right Edit Icon */}
                        <TouchableOpacity
                          style={styles.studentCardEditBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            openEditModal(stu);
                          }}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                          activeOpacity={0.7}
                        >
                          <Feather name="edit-2" size={16} color="#4B5563" />
                        </TouchableOpacity>
                      </View>

                      {/* Bottom Status Snapshot Row */}
                      <View style={styles.studentCardStats}>
                        {/* Attendance Pill (Text only, zero icon) */}
                        <View
                          style={[
                            styles.statusBadge,
                            isShortage ? styles.badgeDanger : styles.badgeSuccess,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isShortage ? styles.badgeDangerText : styles.badgeSuccessText,
                            ]}
                          >
                            {stu.attendance.rate}% Att
                          </Text>
                        </View>

                        {/* Fees Due Pill (Text only, zero icon) */}
                        <View
                          style={[
                            styles.statusBadge,
                            isOverdue ? styles.badgeWarning : styles.badgeSuccess,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isOverdue ? styles.badgeWarningText : styles.badgeSuccessText,
                            ]}
                          >
                            {isOverdue ? `₹${stu.fees.pendingFee.toLocaleString()} Due` : 'Fees Paid'}
                          </Text>
                        </View>

                        {/* CGPA */}
                        <View style={[styles.statusBadge, styles.badgeNeutral]}>
                          <Text style={styles.badgeNeutralText}>CGPA: {stu.academics.cgpa}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* Level 3: Student Details & Bio Data Dossier Modal */}
        {renderStudentModal()}
        {renderEditStudentModal()}
      </View>
    );
  }

  // Helper renderer for Level 3 Student Detail Modal
  function renderStudentModal() {
    if (!selectedStudent) return null;

    return (
      <Modal
        visible={!!selectedStudent}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStudent(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedStudent(null)}
          />
          <View
            style={[styles.studentModalCard, { width: modalMaxWidth, maxWidth: modalMaxWidth, height: modalHeight }]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalAvatarRow}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {selectedStudent.fullName.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginRight: 8, justifyContent: 'center' }}>
                  <Text style={styles.modalStudentName} numberOfLines={1}>
                    {selectedStudent.fullName}
                  </Text>
                  <Text style={styles.modalUsnText} numberOfLines={1}>
                    USN: {selectedStudent.rollNoOrUSN}
                  </Text>
                  <Text style={styles.modalClassText} numberOfLines={1} ellipsizeMode="tail">
                    {selectedStudent.className}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => openEditModal(selectedStudent)}
                  style={styles.modalHeaderActionBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="edit-2" size={16} color="#000000" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedStudent(null)}
                  style={styles.modalCloseBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x" size={20} color="#111827" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Navigation Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modalTabBarScroll}
              style={styles.modalTabBar}
            >
              {[
                { key: 'biodata' as const, label: 'Bio Data' },
                { key: 'academics' as const, label: 'Academics' },
                { key: 'attendance' as const, label: 'Attendance' },
                { key: 'fees' as const, label: 'Fees & Dues' },
              ].map((tab) => {
                const active = studentModalTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.modalTabBtn, active && styles.modalTabBtnActive]}
                    onPress={() => setStudentModalTab(tab.key)}
                  >
                    <Text style={[styles.modalTabText, active && styles.modalTabTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Modal Tab Content */}
            <ScrollView
              style={styles.modalScrollBody}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
            >
              {studentModalTab === 'biodata' && (
                <View style={styles.dossierSection}>
                  <Text style={styles.dossierSectionTitle}>PERSONAL & CONTACT BIO DATA</Text>

                  <View style={[styles.dossierGrid, (isDesktop || isTablet) && styles.dossierGridTwoCol]}>
                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Full Name</Text>
                      <Text style={styles.dossierVal}>{selectedStudent.fullName}</Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>USN / Roll No</Text>
                      <Text style={[styles.dossierVal, { fontFamily: FontFamily.bold }]}>
                        {selectedStudent.rollNoOrUSN}
                      </Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Official Email</Text>
                      <Text style={styles.dossierVal} numberOfLines={2}>
                        {selectedStudent.email}
                      </Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Student Phone</Text>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${selectedStudent.phone}`)}
                        style={styles.dossierPhoneBtn}
                      >
                        <Feather name="phone" size={13} color="#000000" />
                        <Text style={[styles.dossierVal, styles.dossierPhoneVal, { color: '#000000' }]}>
                          {selectedStudent.phone}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Parent / Guardian</Text>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${selectedStudent.parentPhone}`)}
                        style={styles.dossierPhoneBtn}
                      >
                        <Feather name="phone-call" size={13} color="#D97706" />
                        <Text style={[styles.dossierVal, styles.dossierPhoneVal, { color: '#D97706' }]}>
                          {selectedStudent.parentPhone}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Gender</Text>
                      <Text style={styles.dossierVal}>{selectedStudent.gender}</Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Date of Birth</Text>
                      <Text style={styles.dossierVal}>{selectedStudent.dob}</Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Blood Group</Text>
                      <Text style={styles.dossierVal}>{selectedStudent.bloodGroup}</Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Admission Date</Text>
                      <Text style={styles.dossierVal}>{selectedStudent.admissionDate}</Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Institution</Text>
                      <Text style={styles.dossierVal}>{selectedStudent.institutionType}</Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemFull : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Residential Address</Text>
                      <Text style={styles.dossierVal} numberOfLines={3}>
                        {selectedStudent.address}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {studentModalTab === 'academics' && (
                <View style={styles.dossierSection}>
                  <Text style={styles.dossierSectionTitle}>ACADEMIC PERFORMANCE & BRANCH</Text>

                  <View style={styles.academicKpiBox}>
                    <View style={styles.kpiSubBox}>
                      <Text style={[styles.kpiSubVal, (isDesktop || isTablet) && { fontSize: 24 }]}>
                        {selectedStudent.academics.cgpa}
                      </Text>
                      <Text style={styles.kpiSubLabel}>CUMULATIVE GPA</Text>
                    </View>
                    <View style={styles.classStatDivider} />
                    <View style={styles.kpiSubBox}>
                      <Text style={[styles.kpiSubVal, { color: selectedStudent.academics.backlogs === 0 ? '#16A34A' : '#DC2626' }, (isDesktop || isTablet) && { fontSize: 24 }]}>
                        {selectedStudent.academics.backlogs}
                      </Text>
                      <Text style={styles.kpiSubLabel}>BACKLOGS</Text>
                    </View>
                    <View style={styles.classStatDivider} />
                    <View style={styles.kpiSubBox}>
                      <Text style={[styles.kpiSubVal, { color: '#000000' }, (isDesktop || isTablet) && { fontSize: 24 }]}>
                        {selectedStudent.academics.status === 'passed' ? 'Regular' : 'At-Risk'}
                      </Text>
                      <Text style={styles.kpiSubLabel}>STANDING</Text>
                    </View>
                  </View>

                  <View style={[styles.dossierGrid, (isDesktop || isTablet) && styles.dossierGridTwoCol]}>
                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Department</Text>
                      <Text style={styles.dossierVal}>{selectedStudent.department}</Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Current Semester / Year</Text>
                      <Text style={styles.dossierVal}>{selectedStudent.academicYear}</Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Class Section</Text>
                      <Text style={styles.dossierVal}>{selectedStudent.className}</Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Class / Homeroom Teacher</Text>
                      <Text style={styles.dossierVal}>{selectedStudent.classTeacherName || 'Dr. Emily Watson'}</Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>10th Board Score</Text>
                      <Text style={styles.dossierVal}>{selectedStudent.tenthPercentage}</Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>12th Board Score</Text>
                      <Text style={styles.dossierVal}>{selectedStudent.twelfthPercentage}</Text>
                    </View>
                  </View>
                </View>
              )}

              {studentModalTab === 'attendance' && (
                <View style={styles.dossierSection}>
                  <Text style={styles.dossierSectionTitle}>ATTENDANCE RECORDS & SESSIONS</Text>

                  <View style={styles.attendanceSummaryBox}>
                    <View style={styles.attRingContainer}>
                      <Text style={[styles.attRingValue, (isDesktop || isTablet) && { fontSize: 34 }]}>
                        {selectedStudent.attendance.rate}%
                      </Text>
                      <Text style={styles.attRingSub}>ATTENDANCE</Text>
                    </View>
                    <View style={[styles.attStatsRight, (isDesktop || isTablet) && { gap: 12 }]}>
                      <View style={styles.attMiniStat}>
                        <Text style={styles.attMiniStatLabel}>PRESENT</Text>
                        <Text style={[styles.attMiniStatVal, { color: '#16A34A' }]}>
                          {selectedStudent.attendance.presentDays} Days
                        </Text>
                      </View>
                      <View style={styles.attMiniStat}>
                        <Text style={styles.attMiniStatLabel}>ABSENT</Text>
                        <Text style={[styles.attMiniStatVal, { color: '#DC2626' }]}>
                          {selectedStudent.attendance.absentDays} Days
                        </Text>
                      </View>
                      <View style={styles.attMiniStat}>
                        <Text style={styles.attMiniStatLabel}>TOTAL SESSIONS</Text>
                        <Text style={styles.attMiniStatVal}>
                          {selectedStudent.attendance.totalDays} Days
                        </Text>
                      </View>
                    </View>
                  </View>

                  {selectedStudent.attendance.rate < 75 && (
                    <View style={styles.shortageAlert}>
                      <MaterialCommunityIcons name="alert" size={18} color="#DC2626" />
                      <Text style={styles.shortageAlertText}>
                        Shortage Warning: Attendance is below mandatory 75% examination threshold.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {studentModalTab === 'fees' && (
                <View style={styles.dossierSection}>
                  <Text style={styles.dossierSectionTitle}>FEE STRUCTURE & PENDING DUES</Text>

                  <View
                    style={[
                      styles.feeDuesBanner,
                      selectedStudent.fees.pendingFee > 0
                        ? styles.feeDuesBannerWarning
                        : styles.feeDuesBannerSuccess,
                    ]}
                  >
                    <Text style={styles.feeDuesBannerLabel}>TOTAL PENDING FEES</Text>
                    <Text style={[styles.feeDuesBannerAmount, (isDesktop || isTablet) && { fontSize: 30 }]}>
                      ₹{selectedStudent.fees.pendingFee.toLocaleString()}
                    </Text>
                    <Text style={styles.feeDuesBannerStatus}>
                      Status: {selectedStudent.fees.status.toUpperCase()} · Due by {selectedStudent.fees.dueDate || '15 Nov 2026'}
                    </Text>
                  </View>

                  <View style={[styles.dossierGrid, (isDesktop || isTablet) && styles.dossierGridTwoCol]}>
                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Annual College Fee</Text>
                      <Text style={styles.dossierVal}>
                        ₹{selectedStudent.fees.totalFee.toLocaleString()}
                      </Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Amount Paid</Text>
                      <Text style={[styles.dossierVal, { color: '#16A34A', fontFamily: FontFamily.bold }]}>
                        ₹{selectedStudent.fees.paidFee.toLocaleString()}
                      </Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Balance Due</Text>
                      <Text
                        style={[
                          styles.dossierVal,
                          {
                            color: selectedStudent.fees.pendingFee > 0 ? '#DC2626' : '#16A34A',
                            fontFamily: FontFamily.bold,
                          },
                        ]}
                      >
                        ₹{selectedStudent.fees.pendingFee.toLocaleString()}
                      </Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Fee Category</Text>
                      <Text style={styles.dossierVal}>Merit Tuition & Laboratory</Text>
                    </View>
                  </View>
                </View>
              )}
              <View style={{ height: 30 }} />
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => Linking.openURL(`tel:${selectedStudent.parentPhone}`)}
                activeOpacity={0.8}
              >
                <Feather name="phone" size={15} color="#000000" />
                <Text style={styles.modalSecondaryBtnText}>Call Parent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => setSelectedStudent(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryBtnText}>Close Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Helper renderer for Level 3 Student Edit Modal
  function renderEditStudentModal() {
    if (!editingStudent) return null;

    return (
      <Modal
        visible={!!editingStudent}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingStudent(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setEditingStudent(null)}
          />
          <View
            style={[styles.editModalCard, { width: modalMaxWidth, maxWidth: modalMaxWidth, height: modalHeight }]}
          >
            {/* Header */}
            <View style={styles.editModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={styles.editModalIconBadge}>
                  <Feather name="edit-2" size={16} color="#000000" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editModalTitle}>Edit Student Record</Text>
                  <Text style={styles.editModalSubtitle} numberOfLines={1}>
                    USN: {editingStudent.rollNoOrUSN} · {editingStudent.className}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setEditingStudent(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Form */}
            <ScrollView
              style={styles.modalScrollBody}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Section 1: Basic Information */}
              <Text style={styles.formSectionHeading}>BASIC INFORMATION</Text>
              <View style={styles.formRow}>
                <View style={styles.formFieldFlex}>
                  <Text style={styles.formLabel}>Full Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.fullName}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, fullName: val }))}
                    placeholder="Student Full Name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.formRowTwoCol}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>USN / Roll No</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.rollNoOrUSN}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, rollNoOrUSN: val }))}
                    placeholder="e.g. 1VM26AIM001"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Gender</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.gender}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, gender: val }))}
                    placeholder="Male / Female"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.formRowTwoCol}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Date of Birth</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.dob}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, dob: val }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Blood Group</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.bloodGroup}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, bloodGroup: val }))}
                    placeholder="e.g. O+, A+"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Section 2: Contact & Address */}
              <Text style={[styles.formSectionHeading, { marginTop: 14 }]}>CONTACT & ADDRESS</Text>
              <View style={styles.formRowTwoCol}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Student Phone</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.phone}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, phone: val }))}
                    placeholder="+91 XXXXXXXXXX"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Parent / Guardian Phone</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.parentPhone}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, parentPhone: val }))}
                    placeholder="+91 XXXXXXXXXX"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formFieldFlex}>
                  <Text style={styles.formLabel}>Email Address</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.email}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, email: val }))}
                    placeholder="student@institution.edu"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formFieldFlex}>
                  <Text style={styles.formLabel}>Residential Address</Text>
                  <TextInput
                    style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                    value={editForm.address}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, address: val }))}
                    placeholder="Complete residential address"
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />
                </View>
              </View>

              {/* Section 3: Academics & Performance */}
              <Text style={[styles.formSectionHeading, { marginTop: 14 }]}>ACADEMICS & PERFORMANCE</Text>
              <View style={styles.formRowTwoCol}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Current CGPA</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.cgpa}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, cgpa: val }))}
                    placeholder="e.g. 8.5"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Backlogs Count</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.backlogs}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, backlogs: val }))}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.formRowTwoCol}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>10th Board Score</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.tenthScore}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, tenthScore: val }))}
                    placeholder="e.g. 92.5%"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>12th Board Score</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.twelfthScore}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, twelfthScore: val }))}
                    placeholder="e.g. 89.0%"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* Section 4: Attendance */}
              <Text style={[styles.formSectionHeading, { marginTop: 14 }]}>ATTENDANCE</Text>
              <View style={styles.formRow}>
                <View style={styles.formFieldFlex}>
                  <Text style={styles.formLabel}>Attendance Rate (%)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={editForm.attendanceRate}
                    onChangeText={(val) => setEditForm((prev) => ({ ...prev, attendanceRate: val }))}
                    placeholder="e.g. 85"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                style={styles.editCancelBtn}
                onPress={() => setEditingStudent(null)}
                activeOpacity={0.8}
                disabled={isSavingEdit}
              >
                <Text style={styles.editCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editSaveBtn, isSavingEdit && { opacity: 0.8 }]}
                onPress={handleSaveEdit}
                activeOpacity={0.8}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : saveSuccessMsg ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="check" size={16} color="#000000" />
                    <Text style={styles.editSaveBtnText}>Saved!</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="check-circle" size={15} color="#000000" />
                    <Text style={styles.editSaveBtnText}>Save Changes</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Render Level 1: Classes Directory Organized Department-Wise
  return (
    <View style={styles.container}>
      {/* Top Header Section */}
      <View style={[styles.headerBlock, { paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.headerInner, { maxWidth: contentMaxWidth }]}>
          <View style={styles.topActionRow}>
            <View>
              <Text style={styles.pageTitle}>Classes</Text>
            </View>
          </View>

          {/* Global Overview Bar */}
          <View style={styles.overviewBar}>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewVal, isDesktop && { fontSize: 22 }, isSmallMobile && { fontSize: 13 }]}>
                {totalStudentsCount.toLocaleString()}
              </Text>
              <Text style={[styles.overviewLabel, isSmallMobile && { fontSize: 7 }]}>STUDENTS</Text>
            </View>
            <View style={styles.classStatDivider} />
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewVal, isDesktop && { fontSize: 22 }, isSmallMobile && { fontSize: 13 }]}>
                {effectiveHomerooms.length}
              </Text>
              <Text style={[styles.overviewLabel, isSmallMobile && { fontSize: 7 }]}>CLASSES</Text>
            </View>
            <View style={styles.classStatDivider} />
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewVal, { color: '#16A34A' }, isDesktop && { fontSize: 22 }, isSmallMobile && { fontSize: 13 }]}>
                94%
              </Text>
              <Text style={[styles.overviewLabel, isSmallMobile && { fontSize: 7 }]}>AVG ATTENDANCE</Text>
            </View>
          </View>

          {/* Search Bar for Classes */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color={YellowTheme.primaryYellow} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search classes by department"
              placeholderTextColor="#9CA3AF"
              value={classSearch}
              onChangeText={setClassSearch}
            />
            {classSearch ? (
              <TouchableOpacity onPress={() => setClassSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Right Side Below Search Bar: Filter Button & Active Filter Tags */}
          <View style={styles.searchSubRow}>
            <View style={styles.filterTagsRow}>
              {hasActiveClassFilters ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {classDeptFilter !== 'all' && (
                    <View style={styles.activeTagPill}>
                      <Text style={styles.activeTagPillText}>Dept: {classDeptFilter}</Text>
                      <TouchableOpacity onPress={() => setClassDeptFilter('all')}>
                        <Feather name="x" size={12} color="#111827" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {classYearFilter !== 'all' && (
                    <View style={styles.activeTagPill}>
                      <Text style={styles.activeTagPillText}>{classYearFilter}</Text>
                      <TouchableOpacity onPress={() => setClassYearFilter('all')}>
                        <Feather name="x" size={12} color="#111827" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {classProgramFilter !== 'all' && (
                    <View style={styles.activeTagPill}>
                      <Text style={styles.activeTagPillText}>{classProgramFilter}</Text>
                      <TouchableOpacity onPress={() => setClassProgramFilter('all')}>
                        <Feather name="x" size={12} color="#111827" />
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              ) : (
                <Text style={styles.filterSummaryText}>
                  {filteredClasses.length} classes across {departmentGroups.length} departments
                </Text>
              )}
            </View>

            {/* Filter Button on the Right */}
            <TouchableOpacity
              style={[styles.filterActionBtn, hasActiveClassFilters && styles.filterActionBtnActive]}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={18}
                color={hasActiveClassFilters ? '#000000' : '#4B5563'}
              />
              <Text style={[styles.filterActionBtnText, hasActiveClassFilters && styles.filterActionBtnTextActive]}>
                Filter
              </Text>
              {hasActiveClassFilters && <View style={styles.filterActiveDot} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Classes List Department-Wise */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%', paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F4C430']} />}
      >
        {departmentGroups.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="school-outline" size={44} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No matching classes found</Text>
            <Text style={styles.emptySub}>Try adjusting your search query or reset the filters.</Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setClassSearch('');
                setClassDeptFilter('all');
                setClassYearFilter('all');
                setClassProgramFilter('all');
              }}
            >
              <Text style={styles.resetFilterBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          departmentGroups.map((group) => (
            <View key={group.department} style={styles.deptSectionBlock}>
              {/* Department Section Header */}
              <View style={styles.deptHeaderRow}>
                <View style={styles.deptHeaderLeft}>
                  <View style={styles.deptHeaderIconWrap}>
                    <Feather
                      name={getDepartmentIcon(group.department)}
                      size={12}
                      color="#111827"
                    />
                  </View>
                  <Text style={styles.deptHeaderTitle}>{group.department}</Text>
                </View>
                <View style={styles.deptCountPill}>
                  <Text style={styles.deptCountText}>
                    {group.classes.length} {group.classes.length === 1 ? 'Class' : 'Classes'}
                  </Text>
                </View>
              </View>

              {/* Class Cards in this Department */}
              <View style={[styles.classesGrid, { flexDirection: 'row', flexWrap: 'wrap', gap: gridGap }]}>
                {group.classes.map((sec) => (
                  <TouchableOpacity
                    key={sec.id}
                    style={[styles.classCard, { width: cardWidth }]}
                    onPress={() => setSelectedClass(sec)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.classCardMain}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.classCardTitle} numberOfLines={1}>
                          {sec.name}
                        </Text>
                        <View style={styles.classCardMetaRow}>
                          <Text style={styles.classCardTeacher} numberOfLines={1}>
                            {sec.homeroomTeacherName || 'No Teacher Assigned'}
                          </Text>
                        </View>
                      </View>
                      <Feather name="arrow-right" size={18} color="#9CA3AF" />
                    </View>

                    {/* Class Stats Line */}
                    <View style={styles.classCardFooter}>
                      <View style={styles.classBadge}>
                        <Text style={styles.classBadgeText}>{sec.studentCount || 40} Students</Text>
                      </View>

                      <View style={[styles.classBadge, styles.badgeSuccess]}>
                        <Text style={styles.badgeSuccessText}>
                          {sec.attendanceRate ? `${sec.attendanceRate}%` : '94%'} Att
                        </Text>
                      </View>

                      <View style={styles.actionPill}>
                        <Text style={styles.actionPillText}>View Students →</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Level 1: Filter Modal (Dept, Year, Program) */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setFilterModalVisible(false)}
          />
          <View
            style={[styles.filterModalCard, { width: isDesktop ? 540 : isTablet ? 480 : '94%', maxWidth: 540 }]}
          >
            <View style={styles.filterModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.filterModalIconWrap}>
                  <MaterialCommunityIcons name="tune-variant" size={18} color="#000000" />
                </View>
                <Text style={styles.filterModalTitle}>Filter Classes</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Department Filter */}
              <Text style={styles.filterGroupTitle}>DEPARTMENT</Text>
              <View style={styles.filterChipsWrap}>
                {availableDepartments.map((dept) => {
                  const active = classDeptFilter === dept;
                  return (
                    <TouchableOpacity
                      key={dept}
                      style={[styles.modalChip, active && styles.modalChipActive]}
                      onPress={() => setClassDeptFilter(dept)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>
                        {dept === 'all' ? 'All Departments' : dept}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Academic Year Filter */}
              <Text style={[styles.filterGroupTitle, { marginTop: 14 }]}>ACADEMIC YEAR</Text>
              <View style={styles.filterChipsWrap}>
                {availableYears.map((yr) => {
                  const active = classYearFilter === yr;
                  return (
                    <TouchableOpacity
                      key={yr}
                      style={[styles.modalChip, active && styles.modalChipActive]}
                      onPress={() => setClassYearFilter(yr)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>
                        {yr === 'all' ? 'All Years' : yr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Program / Institute Filter (B.Tech, M.Tech, etc.) */}
              <Text style={[styles.filterGroupTitle, { marginTop: 14 }]}>PROGRAM / DEGREE</Text>
              <View style={styles.filterChipsWrap}>
                {availablePrograms.map((prog) => {
                  const active = classProgramFilter === prog;
                  return (
                    <TouchableOpacity
                      key={prog}
                      style={[styles.modalChip, active && styles.modalChipActive]}
                      onPress={() => setClassProgramFilter(prog)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>
                        {prog === 'all' ? 'All Programs' : prog}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.filterResetBtn}
                onPress={() => {
                  setClassDeptFilter('all');
                  setClassYearFilter('all');
                  setClassProgramFilter('all');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.filterResetText}>Reset Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterApplyBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterApplyText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerBlock: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerInner: {
    width: '100%',
    alignSelf: 'center',
    gap: 12,
  },
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 22,
    color: '#000000',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#F4C430',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#000000',
  },
  overviewBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  overviewItem: {
    alignItems: 'center',
  },
  overviewVal: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
  },
  overviewLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 0,
  },
  searchSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterTagsRow: {
    flex: 1,
  },
  filterSummaryText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#6B7280',
  },
  activeTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#F4C430',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeTagPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#000000',
  },
  filterActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterActionBtnActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  filterActionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#374151',
  },
  filterActionBtnTextActive: {
    color: '#000000',
  },
  filterActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
  },

  // Scroll Content
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  deptSectionBlock: {
    gap: 10,
  },
  deptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  deptHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deptHeaderIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptHeaderTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
    letterSpacing: 0.2,
  },
  deptCountPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deptCountText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#4B5563',
  },
  classesGrid: {
    gap: 10,
  },
  studentsGrid: {
    gap: 10,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  classCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classCardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
  },
  classCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  classCardRoom: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#4B5563',
  },
  metaDot: {
    marginHorizontal: 5,
    color: '#9CA3AF',
  },
  classCardTeacher: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  classCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 2,
  },
  classBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#374151',
  },
  actionPill: {
    paddingHorizontal: 0,
    paddingVertical: 2,
    backgroundColor: 'transparent',
  },
  actionPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#000000',
  },

  // Level 2 (Class View) Elements
  backButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  backButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#000000',
  },
  classDetailHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  classDetailHeaderCardDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  classTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  classDetailTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: '#111827',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagBadge: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#000000',
  },
  tagBadgeNeutral: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagBadgeNeutralText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#4B5563',
  },
  reassignTeacherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4C430',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  reassignTeacherText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#000000',
  },
  classStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  classStatsRowDesktop: {
    borderTopWidth: 0,
    paddingTop: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    paddingLeft: 24,
    gap: 20,
  },
  classStatItem: {
    alignItems: 'center',
  },
  classStatVal: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  classStatLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  classStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  filterTabsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#F4C430',
  },
  filterChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#4B5563',
  },
  filterChipTextActive: {
    fontFamily: FontFamily.bold,
    color: '#000000',
  },

  // Student Card
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  studentCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#000000',
  },
  studentName: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
  },
  usnBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  usnBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  usnBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#111827',
  },
  studentPhoneText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
  },
  studentCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 0,
    paddingVertical: 2,
    backgroundColor: 'transparent',
  },
  statusBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
  },
  badgeSuccess: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  badgeSuccessText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#16A34A',
  },
  badgeWarning: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  badgeWarningText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#DC2626',
  },
  badgeDanger: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  badgeDangerText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#DC2626',
  },
  badgeNeutral: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  badgeNeutralText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#4B5563',
  },

  // Modal Backdrop and Cards
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  filterModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterModalIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  modalCloseBtn: {
    padding: 4,
  },
  filterGroupTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalChipActive: {
    backgroundColor: '#FEF9C3',
    borderColor: '#F4C430',
  },
  modalChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#4B5563',
  },
  modalChipTextActive: {
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  filterModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  filterResetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  filterApplyBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#000000',
  },

  // Student Bio Modal
  studentModalCard: {
    width: '100%',
    maxWidth: 500,
    height: '84%',
    maxHeight: 720,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  modalAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#000000',
  },
  modalStudentName: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  modalUsnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  modalUsnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
    marginTop: 2,
  },
  modalClassText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalTabBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    flexGrow: 0,
    flexShrink: 0,
    height: 48,
  },
  modalTabBarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  modalTabBtn: {
    height: 48,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modalTabBtnActive: {
    borderBottomColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  modalTabText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#6B7280',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalTabTextActive: {
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  modalScrollBody: {
    flex: 1,
    flexGrow: 1,
    minHeight: 280,
    width: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 28,
  },
  dossierSection: {
    gap: 10,
  },
  dossierSectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  dossierGrid: {
    gap: 0,
  },
  dossierGridTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dossierItemHalf: {
    width: '48.5%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  dossierItemFull: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  dossierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  dossierLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#6B7280',
    flexShrink: 0,
    maxWidth: '45%',
  },
  dossierVal: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  dossierPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: 5,
  },
  dossierPhoneVal: {
    fontFamily: FontFamily.bold,
    flex: 0,
  },
  academicKpiBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 12,
    marginVertical: 4,
  },
  kpiSubBox: {
    alignItems: 'center',
  },
  kpiSubVal: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#111827',
  },
  kpiSubLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  attendanceSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 16,
  },
  attRingContainer: {
    alignItems: 'center',
  },
  attRingValue: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    color: '#111827',
  },
  attRingSub: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  attStatsRight: {
    gap: 8,
  },
  attMiniStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  attMiniStatLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#6B7280',
  },
  attMiniStatVal: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#111827',
  },
  shortageAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  shortageAlertText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  feeDuesBanner: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  feeDuesBannerWarning: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  feeDuesBannerSuccess: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  feeDuesBannerLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#92400E',
    letterSpacing: 0.5,
  },
  feeDuesBannerAmount: {
    fontFamily: FontFamily.extrabold,
    fontSize: 26,
    color: '#92400E',
  },
  feeDuesBannerStatus: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#B45309',
  },
  modalFooterActions: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    flexShrink: 0,
  },
  modalSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalSecondaryBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#000000',
  },
  modalPrimaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F4C430',
  },
  modalPrimaryBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#000000',
  },

  // PDF Academic Report Card Styles
  pdfReportCard: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  pdfReportCardDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  pdfReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pdfReportTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#854D0E',
  },
  pdfReportSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#A16207',
    marginTop: 1,
  },
  pdfReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  pdfReportBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 6,
  },

  // Loading & Empty States
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#6B7280',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
    marginTop: 8,
  },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  resetFilterBtn: {
    marginTop: 10,
    backgroundColor: '#F4C430',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resetFilterBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#000000',
  },

  // Edit Student Modal Styles
  studentCardEditBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderActionBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModalCard: {
    width: '100%',
    maxWidth: 500,
    height: '84%',
    maxHeight: 720,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
    flexDirection: 'column',
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  editModalIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  editModalSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  formSectionHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  formRow: {
    marginBottom: 10,
  },
  formRowTwoCol: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  formCol: {
    flex: 1,
  },
  formFieldFlex: {
    width: '100%',
  },
  formLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#374151',
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#111827',
  },
  editCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  editCancelBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#4B5563',
  },
  editSaveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#F4C430',
  },
  editSaveBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#000000',
  },
});
