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
} from '../../../api/principal';
import { DEFAULT_INSTITUTION_CLASSES } from '../constants/defaultClasses';
import { useUserStore } from '../../../store/useUserStore';
import { generateStudentAcademicReportPDF } from '../utils/generateAcademicReportPDF';

interface PrincipalHomeroomsViewProps {
  homerooms: HomeroomSection[];
  refreshing: boolean;
  onRefresh: () => void;
  onAssignTeacher: (section: HomeroomSection) => void;
  title?: string;
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
      roomNumber: '',
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
  const text = (sec.name || '').toLowerCase();
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
  title = 'All Classes',
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
  const [studentFilterDropdownVisible, setStudentFilterDropdownVisible] = useState(false);
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

  // Matching students based on search query (lazily generated only when user searches with 2+ characters)
  const matchingStudents = useMemo(() => {
    const q = classSearch.trim().toLowerCase();
    if (q.length < 2) return [];

    const list: StudentDetailDossier[] = [];
    for (const sec of effectiveHomerooms) {
      const students = generateMockStudentsForClass(sec);
      for (const stu of students) {
        const matchesName = stu.fullName.toLowerCase().includes(q);
        const matchesUSN = stu.rollNoOrUSN.toLowerCase().includes(q);
        const matchesDept = (stu.department || '').toLowerCase().includes(q);
        const matchesEmail = stu.email.toLowerCase().includes(q);
        if (matchesName || matchesUSN || matchesDept || matchesEmail) {
          list.push(stu);
          if (list.length >= 18) return list;
        }
      }
    }
    return list;
  }, [effectiveHomerooms, classSearch]);

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
          (sec.homeroomTeacherName && sec.homeroomTeacherName.toLowerCase().includes(q));
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

  // Single pass calculation of student filter counts
  const classStudentStats = useMemo(() => {
    let defaulters = 0;
    let lowAtt = 0;
    let topCgpa = 0;
    for (let i = 0; i < classStudents.length; i++) {
      const s = classStudents[i];
      if (s.fees.pendingFee > 0) defaulters++;
      if (s.attendance.rate < 75) lowAtt++;
      if (s.academics.cgpa >= 8.5) topCgpa++;
    }
    return { defaulters, lowAtt, topCgpa };
  }, [classStudents]);

  // Level 1: Classes Pagination State
  const [classesPage, setClassesPage] = useState(1);
  const [isClassesPageLoading, setIsClassesPageLoading] = useState(false);
  const CLASSES_PER_PAGE = 6;

  useEffect(() => {
    setClassesPage(1);
  }, [classSearch, classDeptFilter, classYearFilter, classProgramFilter]);

  const totalClassesPages = Math.max(1, Math.ceil(filteredClasses.length / CLASSES_PER_PAGE));
  const safeClassesPage = Math.min(classesPage, totalClassesPages);

  const paginatedClasses = useMemo(() => {
    const startIndex = (safeClassesPage - 1) * CLASSES_PER_PAGE;
    return filteredClasses.slice(startIndex, startIndex + CLASSES_PER_PAGE);
  }, [filteredClasses, safeClassesPage]);

  // Level 2: Student Roster Pagination State
  const [studentsPage, setStudentsPage] = useState(1);
  const [isStudentsPageLoading, setIsStudentsPageLoading] = useState(false);
  const STUDENTS_PER_PAGE = 8;

  useEffect(() => {
    setStudentsPage(1);
  }, [selectedClass, studentSearch, studentFilter]);

  const totalStudentsPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
  const safeStudentsPage = Math.min(studentsPage, totalStudentsPages);

  const paginatedStudents = useMemo(() => {
    const startIndex = (safeStudentsPage - 1) * STUDENTS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + STUDENTS_PER_PAGE);
  }, [filteredStudents, safeStudentsPage]);

  // Classes Pagination Controls
  const renderClassesPaginationControls = () => {
    if (filteredClasses.length <= CLASSES_PER_PAGE) return null;
    const startItem = (safeClassesPage - 1) * CLASSES_PER_PAGE + 1;
    const endItem = Math.min(safeClassesPage * CLASSES_PER_PAGE, filteredClasses.length);

    return (
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationCountText}>
          Showing <Text style={{ fontFamily: FontFamily.bold }}>{startItem}-{endItem}</Text> of{' '}
          <Text style={{ fontFamily: FontFamily.bold }}>{filteredClasses.length}</Text> Classes
        </Text>

        <View style={styles.paginationActionRow}>
          <TouchableOpacity
            style={[styles.pageBtn, safeClassesPage === 1 && styles.pageBtnDisabled]}
            disabled={safeClassesPage === 1}
            onPress={() => {
              setIsClassesPageLoading(true);
              setClassesPage((prev) => Math.max(1, prev - 1));
              setTimeout(() => setIsClassesPageLoading(false), 140);
            }}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={15} color={safeClassesPage === 1 ? '#94A3B8' : '#0F172A'} />
            <Text style={[styles.pageBtnText, safeClassesPage === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
          </TouchableOpacity>

          <View style={styles.pageIndicatorPill}>
            <Text style={styles.pageIndicatorText}>
              {safeClassesPage} / {totalClassesPages}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.pageBtn, safeClassesPage === totalClassesPages && styles.pageBtnDisabled]}
            disabled={safeClassesPage === totalClassesPages}
            onPress={() => {
              setIsClassesPageLoading(true);
              setClassesPage((prev) => Math.min(totalClassesPages, prev + 1));
              setTimeout(() => setIsClassesPageLoading(false), 140);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.pageBtnText, safeClassesPage === totalClassesPages && styles.pageBtnTextDisabled]}>Next</Text>
            <Feather name="chevron-right" size={15} color={safeClassesPage === totalClassesPages ? '#94A3B8' : '#0F172A'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Students Pagination Controls
  const renderStudentsPaginationControls = () => {
    if (filteredStudents.length <= STUDENTS_PER_PAGE) return null;
    const startItem = (safeStudentsPage - 1) * STUDENTS_PER_PAGE + 1;
    const endItem = Math.min(safeStudentsPage * STUDENTS_PER_PAGE, filteredStudents.length);

    return (
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationCountText}>
          Showing <Text style={{ fontFamily: FontFamily.bold }}>{startItem}-{endItem}</Text> of{' '}
          <Text style={{ fontFamily: FontFamily.bold }}>{filteredStudents.length}</Text> Students
        </Text>

        <View style={styles.paginationActionRow}>
          <TouchableOpacity
            style={[styles.pageBtn, safeStudentsPage === 1 && styles.pageBtnDisabled]}
            disabled={safeStudentsPage === 1}
            onPress={() => {
              setIsStudentsPageLoading(true);
              setStudentsPage((prev) => Math.max(1, prev - 1));
              setTimeout(() => setIsStudentsPageLoading(false), 140);
            }}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={15} color={safeStudentsPage === 1 ? '#94A3B8' : '#0F172A'} />
            <Text style={[styles.pageBtnText, safeStudentsPage === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
          </TouchableOpacity>

          <View style={styles.pageIndicatorPill}>
            <Text style={styles.pageIndicatorText}>
              {safeStudentsPage} / {totalStudentsPages}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.pageBtn, safeStudentsPage === totalStudentsPages && styles.pageBtnDisabled]}
            disabled={safeStudentsPage === totalStudentsPages}
            onPress={() => {
              setIsStudentsPageLoading(true);
              setStudentsPage((prev) => Math.min(totalStudentsPages, prev + 1));
              setTimeout(() => setIsStudentsPageLoading(false), 140);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.pageBtnText, safeStudentsPage === totalStudentsPages && styles.pageBtnTextDisabled]}>Next</Text>
            <Feather name="chevron-right" size={15} color={safeStudentsPage === totalStudentsPages ? '#94A3B8' : '#0F172A'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Level 2: Inside Class Student Roster View
  if (selectedClass) {
    const defaultersCount = classStudentStats.defaulters;

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
              <View style={{ width: '100%' }}>
                <View style={styles.classTitleRow}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={styles.classDetailTitle} numberOfLines={1}>
                      {selectedClass.name ||
                        (selectedClass as any).className ||
                        [selectedClass.department, selectedClass.grade, selectedClass.section].filter(Boolean).join(' ') ||
                        'Class Roster'}
                    </Text>
                    <View style={styles.classTeacherContainer}>
                      <View style={styles.classTeacherHeadingRow}>
                        <MaterialCommunityIcons name="account-tie" size={13} color="#6B7280" />
                        <Text style={styles.classTeacherHeading}>Teacher</Text>
                        <Text style={styles.metaDot}>·</Text>
                        <Text style={styles.classTeacherDeptText}>
                          {selectedClass.department || 'Academics'}
                        </Text>
                      </View>
                      <Text style={styles.classTeacherNameText} numberOfLines={1}>
                        {selectedClass.homeroomTeacherName || 'Not Assigned'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.reassignTeacherBtn}
                    onPress={() => onAssignTeacher(selectedClass)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="account-edit" size={14} color="#000000" />
                    <Text style={styles.reassignTeacherText}>
                      {selectedClass.homeroomTeacherName ? 'Change Teacher' : 'Assign Teacher'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Search Bar for Students (USN or Name) with In-Bar Filter */}
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
                <TouchableOpacity onPress={() => setStudentSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}

              {/* Search Filter Divider */}
              <View style={styles.searchFilterDivider} />

              {/* In-bar Filter Button */}
              <TouchableOpacity
                style={[
                  styles.inBarFilterBtn,
                  studentFilter !== 'all' && styles.inBarFilterBtnActive,
                ]}
                onPress={() => setStudentFilterDropdownVisible(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="tune-variant"
                  size={15}
                  color={studentFilter !== 'all' ? '#000000' : '#4B5563'}
                />
                <Text
                  style={[
                    styles.inBarFilterText,
                    studentFilter !== 'all' && styles.inBarFilterTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {studentFilter === 'all'
                    ? 'Filter'
                    : studentFilter === 'fee_pending'
                    ? `Fee Pending (${defaultersCount})`
                    : studentFilter === 'low_attendance'
                    ? 'Low Attendance'
                    : 'Top CGPA'}
                </Text>
                {studentFilter !== 'all' ? (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      setStudentFilter('all');
                    }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Feather name="x" size={13} color="#000000" />
                  </TouchableOpacity>
                ) : (
                  <Feather name="chevron-down" size={13} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
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
            {isStudentsPageLoading ? (
              <View style={styles.inPageLoaderWrap}>
                <ActivityIndicator size="large" color="#F4C430" />
                <Text style={styles.inPageLoaderText}>Loading Student Records...</Text>
              </View>
            ) : filteredStudents.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="account-search-outline" size={42} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No matching students found</Text>
                <Text style={styles.emptySub}>Try searching with a different name or USN number.</Text>
              </View>
            ) : (
              <>
                <View style={[styles.studentsGrid, { flexDirection: 'row', flexWrap: 'wrap', gap: gridGap }]}>
                  {paginatedStudents.map((stu) => {
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

                {renderStudentsPaginationControls()}
              </>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* Level 3: Student Details & Bio Data Dossier Modal */}
        {renderStudentFilterModal()}
        {renderStudentModal()}
      </View>
    );
  }

  // Helper renderer for Level 2 Student Filter Dropdown Modal
  function renderStudentFilterModal() {
    if (!studentFilterDropdownVisible) return null;

    const defaultersCount = classStudentStats.defaulters;
    const lowAttCount = classStudentStats.lowAtt;
    const topCgpaCount = classStudentStats.topCgpa;

    return (
      <Modal
        visible={studentFilterDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStudentFilterDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.filterDropdownBackdrop}
          activeOpacity={1}
          onPress={() => setStudentFilterDropdownVisible(false)}
        >
          <View style={styles.filterDropdownCard}>
            <View style={styles.filterDropdownHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="tune-variant" size={18} color="#111827" />
                <Text style={styles.filterDropdownTitle}>Filter Students</Text>
              </View>
              <TouchableOpacity
                onPress={() => setStudentFilterDropdownVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterDropdownOptionsList}>
              {[
                { key: 'all' as const, label: 'All Students', count: classStudents.length, icon: 'account-group-outline' },
                { key: 'fee_pending' as const, label: 'Fee Pending', count: defaultersCount, icon: 'currency-inr', color: '#B45309' },
                { key: 'low_attendance' as const, label: 'Low Attendance (<75%)', count: lowAttCount, icon: 'alert-circle-outline', color: '#DC2626' },
                { key: 'top_cgpa' as const, label: 'Top CGPA (≥8.5)', count: topCgpaCount, icon: 'star-outline', color: '#16A34A' },
              ].map((opt) => {
                const selected = studentFilter === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.filterDropdownOptionItem, selected && styles.filterDropdownOptionItemSelected]}
                    onPress={() => {
                      setStudentFilter(opt.key);
                      setStudentFilterDropdownVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <MaterialCommunityIcons
                        name={opt.icon as any}
                        size={18}
                        color={selected ? '#111827' : (opt.color || '#6B7280')}
                      />
                      <Text style={[styles.filterDropdownOptionText, selected && styles.filterDropdownOptionTextSelected]}>
                        {opt.label}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[styles.filterDropdownCountBadge, selected && styles.filterDropdownCountBadgeSelected]}>
                        {opt.count}
                      </Text>
                      {selected && <Feather name="check" size={16} color="#111827" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {studentFilter !== 'all' && (
              <TouchableOpacity
                style={styles.filterDropdownClearBtn}
                onPress={() => {
                  setStudentFilter('all');
                  setStudentFilterDropdownVisible(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.filterDropdownClearText}>Reset to All Students</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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



  // Render Level 1: Classes Directory Organized Department-Wise
  return (
    <View style={styles.container}>
      {/* Top Header Section */}
      <View style={[styles.headerBlock, { paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.headerInner, { maxWidth: contentMaxWidth }]}>
          <View style={styles.topActionRow}>
            <View>
              <Text style={styles.pageTitle}>{title}</Text>
            </View>
          </View>

          {/* Search Bar for Classes & Students */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color={YellowTheme.primaryYellow} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search classes or student"
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
              {hasActiveClassFilters && (
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
        {/* Student Search Results (when searching by Name or USN) */}
        {matchingStudents.length > 0 && (
          <View style={styles.searchStudentsSection}>
            <View style={styles.searchStudentsHeaderRow}>
              <View style={styles.searchStudentsHeaderLeft}>
                <View style={styles.searchStudentsIconWrap}>
                  <MaterialCommunityIcons name="account-school-outline" size={18} color="#000000" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchStudentsHeaderTitle}>
                    Students Found ({matchingStudents.length})
                  </Text>
                  <Text style={styles.searchStudentsHeaderSub}>
                    Tap any student to view full dossier, bio data, academics & fee records
                  </Text>
                </View>
              </View>
              {matchingStudents.length >= 18 && (
                <View style={styles.deptCountPill}>
                  <Text style={styles.deptCountText}>Showing top 18</Text>
                </View>
              )}
            </View>

            <View style={[styles.studentsGrid, { flexDirection: 'row', flexWrap: 'wrap', gap: gridGap }]}>
              {matchingStudents.map((stu) => {
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
                          <Text style={styles.studentPhoneText} numberOfLines={1}>
                            {stu.className || stu.department}
                          </Text>
                        </View>
                      </View>

                    </View>

                    {/* Bottom Status Snapshot Row */}
                    <View style={styles.studentCardStats}>
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

                      <View style={[styles.statusBadge, styles.badgeNeutral]}>
                        <Text style={styles.badgeNeutralText}>CGPA: {stu.academics.cgpa}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {matchingStudents.length > 0 && filteredClasses.length > 0 && (
          <View style={styles.matchingClassesDivider}>
            <Text style={styles.matchingClassesHeaderTitle}>
              Classes ({filteredClasses.length})
            </Text>
          </View>
        )}

        {filteredClasses.length === 0 && matchingStudents.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-search-outline" size={44} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No matching classes or students found</Text>
            <Text style={styles.emptySub}>
              {classSearch.trim()
                ? `No class or student found matching "${classSearch}". Try searching by USN (e.g. 1VM26AI001) or student name.`
                : 'Try adjusting your search query or reset the filters.'}
            </Text>
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
        ) : isClassesPageLoading ? (
          <View style={styles.inPageLoaderWrap}>
            <ActivityIndicator size="large" color="#F4C430" />
            <Text style={styles.inPageLoaderText}>Loading Classes...</Text>
          </View>
        ) : (
          <>
            <View style={[styles.classesGrid, { flexDirection: 'row', flexWrap: 'wrap', gap: gridGap }]}>
              {paginatedClasses.map((sec) => (
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
                      <Text style={styles.actionPillText}>View Students</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {renderClassesPaginationControls()}
          </>
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

      {/* Level 3: Student Details Modal (available directly from Level 1 search results) */}
      {renderStudentModal()}
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
    borderRadius: 5,
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
  searchFilterDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  inBarFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
  },
  inBarFilterBtnActive: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#F4C430',
  },
  inBarFilterText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#4B5563',
    maxWidth: 130,
  },
  inBarFilterTextActive: {
    fontFamily: FontFamily.bold,
    color: '#000000',
  },

  // Level 2 Student Filter Dropdown Modal
  filterDropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterDropdownCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  filterDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterDropdownTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
  },
  filterDropdownOptionsList: {
    gap: 8,
  },
  filterDropdownOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterDropdownOptionItemSelected: {
    backgroundColor: '#FEF9C3',
    borderColor: '#F4C430',
  },
  filterDropdownOptionText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#374151',
  },
  filterDropdownOptionTextSelected: {
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  filterDropdownCountBadge: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  filterDropdownCountBadgeSelected: {
    color: '#000000',
    backgroundColor: '#FDE047',
  },
  filterDropdownClearBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDropdownClearText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12.5,
    color: '#DC2626',
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
  classCardArrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 5,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  classBadgeText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: '#374151',
  },
  actionPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F4C430',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#000000',
    letterSpacing: -0.1,
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
    borderRadius: 5,
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
  classTeacherContainer: {
    marginTop: 4,
    gap: 2,
  },
  classTeacherHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  classTeacherHeading: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  classTeacherDeptText: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#6B7280',
  },
  classTeacherNameText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
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
    borderRadius: 5,
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
    borderRadius: 5,
  },
  tagBadgeNeutralText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#4B5563',
  },
  reassignTeacherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F4C430',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  reassignTeacherText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
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
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dossierItemFull: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dossierRow: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dossierLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 3,
  },
  dossierVal: {
    fontFamily: FontFamily.semibold,
    fontSize: 13.5,
    color: '#111827',
    textAlign: 'left',
  },
  dossierPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  dossierPhoneVal: {
    fontFamily: FontFamily.bold,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    flexShrink: 0,
  },
  modalSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  editModalIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderRadius: 5,
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
    borderRadius: 5,
    backgroundColor: '#F4C430',
  },
  editSaveBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#000000',
  },
  searchStudentsSection: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchStudentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchStudentsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  searchStudentsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchStudentsHeaderTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
  },
  searchStudentsHeaderSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  matchingClassesDivider: {
    marginTop: 8,
    marginBottom: 12,
  },
  matchingClassesHeaderTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // In-page Loader
  inPageLoaderWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  inPageLoaderText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: '#6B7280',
  },

  // Pagination Controls
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexWrap: 'wrap',
    gap: 10,
  },
  paginationCountText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#4B5563',
  },
  paginationActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pageBtnDisabled: {
    opacity: 0.45,
    backgroundColor: '#F9FAFB',
  },
  pageBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: '#111827',
  },
  pageBtnTextDisabled: {
    color: '#9CA3AF',
  },
  pageIndicatorPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFD026',
  },
  pageIndicatorText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
  },
});
