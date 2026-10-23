import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
import { FontFamily } from '../../constants/fonts';
import { BorderRadius } from '../../constants/theme';
import {
  HODTab,
  HODKPIs,
  HODFacultyMember,
  DepartmentCourse,
} from '../../features/hod/types/hod.types';
import {
  fetchHODKPIsApi,
  fetchHODFacultyApi,
  fetchDepartmentCoursesApi,
} from '../../api/hod';
import { HODHeader } from '../../features/hod/components/HODHeader';
import { HODDrawer } from '../../features/hod/components/HODDrawer';
import { HODDashboardView } from '../../features/hod/components/HODDashboardView';
import { PrincipalStaffDirectoryView } from '../../features/principal/components/PrincipalStaffDirectoryView';
import { PrincipalHomeroomsView } from '../../features/principal/components/PrincipalHomeroomsView';
import { PrincipalNoticesView } from '../../features/principal/components/PrincipalNoticesView';
import { AdminAttendanceView } from '../../features/admin/components/AdminAttendanceView';
import { AdminTimetableView } from '../../features/admin/components/AdminTimetableView';
import { StudentFeedbackReviewManagerView } from '../../features/shared/components/StudentFeedbackReviewManagerView';
import { AcademicCalendarEventsView } from '../../features/shared/components/AcademicCalendarEventsView';
import { LeaveApprovalView } from '../../features/shared/components/LeaveApprovalView';
import { DocumentRequestsManagerView } from '../../features/shared/components/DocumentRequestsManagerView';
import { AccessRestrictedModuleCard } from '../../features/shared/components/AccessRestrictedModuleCard';
import { AssignHomeroomModal } from '../../features/principal/components/modals/AssignHomeroomModal';
import { CreateNoticeModal } from '../../features/principal/components/modals/CreateNoticeModal';
import { TeacherTimetableView } from '../../features/teacher/components/TeacherTimetableView';
import { AttendanceMarkingView } from '../../features/teacher/components/AttendanceMarkingView';
import { TeacherMarksView } from '../../features/teacher/components/TeacherMarksView';
import { TeacherHomeworkView } from '../../features/teacher/components/TeacherHomeworkView';
import {
  HomeroomSection,
  PrincipalStaffMember,
  StaffDesignation,
  SchoolNotice,
} from '../../features/principal/types/principal.types';
import { DEFAULT_INSTITUTION_CLASSES } from '../../features/principal/constants/defaultClasses';

const BOTTOM_TABS: {
  key: HODTab;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconActive: keyof typeof MaterialCommunityIcons.glyphMap;
}[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home-outline', iconActive: 'home' },
  { key: 'homerooms', label: 'Students', icon: 'account-group-outline', iconActive: 'account-group' },
  { key: 'timetable', label: 'Timetable', icon: 'calendar-clock-outline', iconActive: 'calendar-clock' },
  { key: 'staff', label: 'Faculty', icon: 'account-tie-outline', iconActive: 'account-tie' },
  { key: 'profile', label: 'Account', icon: 'account-outline', iconActive: 'account' },
];

const VMHS_DEFAULT_COURSES: DepartmentCourse[] = [
  { id: 'crs-cs501', code: 'CS501', name: 'Operating Systems & System Programming', department: 'Computer Science & Engineering', semester: 'Semester 5', type: 'theory', credits: 4, instructorName: 'Dr. Linus Torvalds', enrolledStudentsCount: 64, syllabusProgressPct: 80, totalPlannedHours: 52, completedHours: 42 },
  { id: 'crs-cs502', code: 'CS502', name: 'Database Management Systems & SQL', department: 'Computer Science & Engineering', semester: 'Semester 5', type: 'theory', credits: 4, instructorName: 'Prof. Dennis Ritchie', enrolledStudentsCount: 64, syllabusProgressPct: 76, totalPlannedHours: 50, completedHours: 38 },
  { id: 'crs-cs505l', code: 'CS505L', name: 'Advanced Algorithms & Problem Solving Lab', department: 'Computer Science & Engineering', semester: 'Semester 5', type: 'practical_lab', credits: 2, instructorName: 'Dr. Donald Knuth', enrolledStudentsCount: 64, syllabusProgressPct: 83, totalPlannedHours: 36, completedHours: 30, labBatchesCount: 3 },
  { id: 'crs-cs506l', code: 'CS506L', name: 'Database Systems & Query Optimization Lab', department: 'Computer Science & Engineering', semester: 'Semester 5', type: 'practical_lab', credits: 2, instructorName: 'Prof. Ada Lovelace', enrolledStudentsCount: 64, syllabusProgressPct: 88, totalPlannedHours: 36, completedHours: 32, labBatchesCount: 3 },
  { id: 'crs-cs701', code: 'CS701', name: 'Cloud Computing & Distributed Architecture', department: 'Computer Science & Engineering', semester: 'Semester 7', type: 'theory', credits: 3, instructorName: 'Dr. Tim Berners-Lee', enrolledStudentsCount: 58, syllabusProgressPct: 86, totalPlannedHours: 45, completedHours: 39 },
  { id: 'crs-cs704e', code: 'CS704E', name: 'Applied Machine Learning & Neural Networks', department: 'Computer Science & Engineering', semester: 'Semester 7', type: 'elective', credits: 3, instructorName: 'Dr. Bjarne Stroustrup', enrolledStudentsCount: 42, syllabusProgressPct: 70, totalPlannedHours: 40, completedHours: 28 },
  { id: 'crs-cs301', code: 'CS301', name: 'Data Structures & Algorithms', department: 'Computer Science & Engineering', semester: 'Semester 3', type: 'theory', credits: 4, instructorName: 'Prof. James Gosling', enrolledStudentsCount: 68, syllabusProgressPct: 88, totalPlannedHours: 52, completedHours: 46 },
  { id: 'crs-cs302', code: 'CS302', name: 'Object Oriented Programming with Java & C++', department: 'Computer Science & Engineering', semester: 'Semester 3', type: 'theory', credits: 4, instructorName: 'Dr. Guido van Rossum', enrolledStudentsCount: 68, syllabusProgressPct: 84, totalPlannedHours: 50, completedHours: 42 },
  { id: 'crs-cs305l', code: 'CS305L', name: 'Data Structures Lab (C & C++)', department: 'Computer Science & Engineering', semester: 'Semester 3', type: 'practical_lab', credits: 2, instructorName: 'Prof. Ken Thompson', enrolledStudentsCount: 68, syllabusProgressPct: 90, totalPlannedHours: 36, completedHours: 32, labBatchesCount: 3 },
  { id: 'crs-cs101', code: 'CS101', name: 'Introduction to Computational Thinking & C', department: 'Computer Science & Engineering', semester: 'Semester 1', type: 'theory', credits: 3, instructorName: 'Dr. Vint Cerf', enrolledStudentsCount: 72, syllabusProgressPct: 92, totalPlannedHours: 45, completedHours: 41 },
];

const VMHS_DEFAULT_FACULTY: HODFacultyMember[] = [
  { id: 'fac-1', name: 'Dr. Linus Torvalds', employeeId: 'EMP-CSE-001', email: 'hod.cse@vmhs.com', phone: '+91 98450 00001', rank: 'professor', department: 'Computer Science & Engineering', specialization: 'Operating Systems & Linux Kernel', maxCreditsPerWeek: 18, assignedCredits: 8, assignedCourses: ['CS501'], status: 'present', cabinNumber: 'CSB-301' },
  { id: 'fac-2', name: 'Prof. Dennis Ritchie', employeeId: 'EMP-CSE-002', email: 'dennis.ritchie.vmhs001002@faculty.school.com', phone: '+91 98450 00002', rank: 'professor', department: 'Computer Science & Engineering', specialization: 'C Programming & Systems', maxCreditsPerWeek: 18, assignedCredits: 12, assignedCourses: ['CS502'], status: 'in_lecture', cabinNumber: 'CSB-302' },
  { id: 'fac-3', name: 'Dr. Donald Knuth', employeeId: 'EMP-CSE-003', email: 'donald.knuth.vmhs001002@faculty.school.com', phone: '+91 98450 00003', rank: 'professor', department: 'Computer Science & Engineering', specialization: 'Algorithm Analysis & TeX', maxCreditsPerWeek: 18, assignedCredits: 10, assignedCourses: ['CS505L'], status: 'in_lab', cabinNumber: 'CSB-303' },
  { id: 'fac-4', name: 'Prof. Ada Lovelace', employeeId: 'EMP-CSE-004', email: 'ada.lovelace.vmhs001002@faculty.school.com', phone: '+91 98450 00004', rank: 'associate_professor', department: 'Computer Science & Engineering', specialization: 'Computational Logic & Databases', maxCreditsPerWeek: 18, assignedCredits: 14, assignedCourses: ['CS506L'], status: 'present', cabinNumber: 'CSB-304' },
  { id: 'fac-5', name: 'Dr. Tim Berners-Lee', employeeId: 'EMP-CSE-005', email: 'tim.berners.lee.vmhs001002@faculty.school.com', phone: '+91 98450 00005', rank: 'associate_professor', department: 'Computer Science & Engineering', specialization: 'Distributed Systems & WWW', maxCreditsPerWeek: 18, assignedCredits: 12, assignedCourses: ['CS701'], status: 'present', cabinNumber: 'CSB-305' },
  { id: 'fac-6', name: 'Dr. Bjarne Stroustrup', employeeId: 'EMP-CSE-006', email: 'bjarne.stroustrup.vmhs001002@faculty.school.com', phone: '+91 98450 00006', rank: 'associate_professor', department: 'Computer Science & Engineering', specialization: 'C++ & Object Oriented Design', maxCreditsPerWeek: 18, assignedCredits: 10, assignedCourses: ['CS704E'], status: 'present', cabinNumber: 'CSB-306' },
];

const DEFAULT_DEPT_NOTICES: SchoolNotice[] = [
  {
    id: 'not-01',
    title: 'Department Faculty Meeting — Curriculum Review',
    content: 'All faculty members are requested to attend the odd semester curriculum and syllabus coverage review meeting in CSB-301.',
    priority: 'urgent',
    targetAudience: 'staff',
    department: 'Computer Science & Engineering',
    publishedDate: '2026-10-20',
    author: 'Dr. Linus Torvalds',
    acknowledgedCount: 10,
  },
  {
    id: 'not-02',
    title: 'Mid-Term Lab Practical Schedule & Rubrics',
    content: 'Laboratory practical examinations and project code evaluations will commence next week. Lab instructors must ensure student terminal configurations.',
    priority: 'important',
    targetAudience: 'all',
    department: 'Computer Science & Engineering',
    publishedDate: '2026-10-18',
    author: 'Dr. Linus Torvalds',
    acknowledgedCount: 54,
  },
  {
    id: 'not-03',
    title: 'Final Year Capstone Project Review Phase 1',
    content: '7th Semester students are required to submit their system architecture design document and Git repository links to their assigned guides.',
    priority: 'normal',
    targetAudience: 'students',
    department: 'Computer Science & Engineering',
    publishedDate: '2026-10-15',
    author: 'Prof. Dennis Ritchie',
    acknowledgedCount: 52,
  },
];

export default function HODHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // User store
  const rawFullName = useUserStore((state) => state.fullName);
  const fullName = rawFullName && rawFullName !== 'Head of Department' ? rawFullName : 'Dr. Linus Torvalds';
  const rawDepartment = useUserStore((state) => state.department);
  const department = rawDepartment?.trim() && rawDepartment !== 'Department not set'
    ? rawDepartment.trim()
    : 'Computer Science & Engineering';
  const rawInstName = useUserStore((state) => state.institutionName);
  const institutionName = rawInstName?.trim() && rawInstName !== 'Institution not set'
    ? rawInstName.trim()
    : 'VM Memorial Higher Secondary & Degree College';
  const profilePic = useUserStore((state) => state.profilePic);
  const resetUser = useUserStore((state) => state.resetUser);
  const hasModuleAccess = useUserStore((state) => state.hasModuleAccess);
  const grantModuleAccess = useUserStore((state) => state.grantModuleAccess);

  // Tab & drawer navigation
  const [activeTab, setActiveTab] = useState<HODTab>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabLoadingTitle, setTabLoadingTitle] = useState('Loading Department...');
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  // Tab transition loader helper
  const getHODTabTitle = (tab: HODTab): string => {
    switch (tab) {
      case 'dashboard': return 'Loading Department Dashboard...';
      case 'homerooms':
      case 'students': return 'Loading Department Classes...';
      case 'timetable': return 'Loading Department Timetable...';
      case 'staff':
      case 'faculty': return 'Loading Department Faculty...';
      case 'reviews': return 'Loading Student Feedback & Reviews...';
      case 'notices': return 'Loading Department Announcements...';
      case 'attendance': return 'Loading Attendance Desk...';
      case 'events': return 'Loading Academic Calendar...';
      case 'leaves': return 'Loading Leave Approvals Desk...';
      case 'document_requests': return 'Loading Document Desk...';
      case 'schedule': return 'Loading Teaching Schedule...';
      case 'mark_attendance': return 'Loading Attendance Marking...';
      case 'marks': return 'Loading Student Marks...';
      case 'homework': return 'Loading Assignments & Homework...';
      default: return 'Loading View...';
    }
  };

  const switchTab = useCallback((targetTab: HODTab) => {
    if (targetTab === activeTab) return;
    setTabLoadingTitle(getHODTabTitle(targetTab));
    setTabLoading(true);
    setActiveTab(targetTab);
    setTimeout(() => {
      if (isMountedRef.current) {
        setTabLoading(false);
      }
    }, 180);
  }, [activeTab]);

  // Departmental Data with VMHS defaults so screen is never blank
  const [kpis, setKpis] = useState<HODKPIs>({
    totalStudents: 180,
    facultyOnDuty: 11,
    totalFaculty: 12,
    activeCourses: 10,
    practicalLabsCount: 4,
    averageSyllabusProgress: 82,
    detentionAlertsCount: 2,
    unassignedCoursesCount: 1,
    todayLabSessions: 3,
  });
  const [faculty, setFaculty] = useState<HODFacultyMember[]>(VMHS_DEFAULT_FACULTY);
  const [courses, setCourses] = useState<DepartmentCourse[]>(VMHS_DEFAULT_COURSES);
  const [notices, setNotices] = useState<SchoolNotice[]>(DEFAULT_DEPT_NOTICES);

  // Modals state (matching Principal)
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState<HomeroomSection | null>(null);
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ slotId: string; subjectName: string } | null>(null);

  // Homerooms restricted to HOD's department
  const deptHomerooms: HomeroomSection[] = useMemo(() => {
    const depKey = department.toLowerCase();
    const matched = DEFAULT_INSTITUTION_CLASSES.filter((sec) => {
      const secDept = (sec.department || '').toLowerCase();
      const secName = (sec.name || '').toLowerCase();
      if (depKey.includes('computer') || depKey.includes('cse')) {
        return secDept.includes('computer') || secDept.includes('cse') || secName.includes('cse');
      }
      if (depKey.includes('electronic') || depKey.includes('ece')) {
        return secDept.includes('electronic') || secDept.includes('ece') || secName.includes('ece');
      }
      if (depKey.includes('mech')) {
        return secDept.includes('mech') || secName.includes('mech');
      }
      if (depKey.includes('civil')) {
        return secDept.includes('civil') || secName.includes('civil');
      }
      if (depKey.includes('ai') || depKey.includes('aiml')) {
        return secDept.includes('ai') || secName.includes('ai');
      }
      return secDept.includes(depKey);
    });

    if (matched.length > 0) {
      return matched.map((sec, idx) => ({
        ...sec,
        department,
        homeroomTeacherName: faculty[idx % faculty.length]?.name || sec.homeroomTeacherName,
      }));
    }

    const depCode = department.includes('Computer')
      ? 'CSE'
      : department.includes('Electronic')
      ? 'ECE'
      : department.includes('Mech')
      ? 'MECH'
      : department.includes('Civil')
      ? 'CIVIL'
      : department.includes('AI')
      ? 'AIML'
      : 'CSE';

    return [
      {
        id: `sec-${depCode.toLowerCase()}-1a`,
        name: `${depCode} 1st Year · Sec A`,
        grade: '1st Year',
        section: 'A',
        department,
        roomNumber: 'Room 101',
        homeroomTeacherName: faculty[0]?.name || 'Dr. Linus Torvalds',
        studentCount: 42,
        presentCount: 40,
        attendanceRate: 95.2,
      },
      {
        id: `sec-${depCode.toLowerCase()}-1b`,
        name: `${depCode} 1st Year · Sec B`,
        grade: '1st Year',
        section: 'B',
        department,
        roomNumber: 'Room 102',
        homeroomTeacherName: faculty[1]?.name || 'Prof. Dennis Ritchie',
        studentCount: 40,
        presentCount: 38,
        attendanceRate: 95.0,
      },
      {
        id: `sec-${depCode.toLowerCase()}-2a`,
        name: `${depCode} 2nd Year · Sec A`,
        grade: '2nd Year',
        section: 'A',
        department,
        roomNumber: 'Room 201',
        homeroomTeacherName: faculty[2]?.name || 'Dr. Donald Knuth',
        studentCount: 44,
        presentCount: 41,
        attendanceRate: 93.1,
      },
      {
        id: `sec-${depCode.toLowerCase()}-2b`,
        name: `${depCode} 2nd Year · Sec B`,
        grade: '2nd Year',
        section: 'B',
        department,
        roomNumber: 'Room 202',
        homeroomTeacherName: faculty[3]?.name || 'Prof. Ada Lovelace',
        studentCount: 40,
        presentCount: 37,
        attendanceRate: 92.5,
      },
      {
        id: `sec-${depCode.toLowerCase()}-3a`,
        name: `${depCode} 3rd Year · Sec A`,
        grade: '3rd Year',
        section: 'A',
        department,
        roomNumber: 'Room 301',
        homeroomTeacherName: faculty[4]?.name || 'Dr. Tim Berners-Lee',
        studentCount: 42,
        presentCount: 39,
        attendanceRate: 92.8,
      },
      {
        id: `sec-${depCode.toLowerCase()}-3b`,
        name: `${depCode} 3rd Year · Sec B`,
        grade: '3rd Year',
        section: 'B',
        department,
        roomNumber: 'Room 302',
        homeroomTeacherName: faculty[5]?.name || 'Dr. Bjarne Stroustrup',
        studentCount: 40,
        presentCount: 38,
        attendanceRate: 95.0,
      },
      {
        id: `sec-${depCode.toLowerCase()}-4a`,
        name: `${depCode} 4th Year · Sec A`,
        grade: '4th Year',
        section: 'A',
        department,
        roomNumber: 'Room 401',
        homeroomTeacherName: faculty[0]?.name || 'Dr. Linus Torvalds',
        studentCount: 45,
        presentCount: 42,
        attendanceRate: 93.3,
      },
      {
        id: `sec-${depCode.toLowerCase()}-4b`,
        name: `${depCode} 4th Year · Sec B`,
        grade: '4th Year',
        section: 'B',
        department,
        roomNumber: 'Room 402',
        homeroomTeacherName: faculty[1]?.name || 'Prof. Dennis Ritchie',
        studentCount: 43,
        presentCount: 40,
        attendanceRate: 93.0,
      },
    ];
  }, [department, faculty]);

  // Faculty formatted for PrincipalStaffDirectoryView
  const deptStaffList: PrincipalStaffMember[] = useMemo(() => {
    return faculty.map((f, idx) => {
      let desig: StaffDesignation = 'subject_teacher';
      const rank = (f.rank || '').toLowerCase();
      if (rank === 'professor') {
        desig = idx === 0 || f.email?.includes('hod') ? 'hod' : 'academic_coordinator';
      } else if (rank === 'associate_professor') {
        desig = 'homeroom_teacher';
      } else if (rank === 'assistant_professor') {
        desig = 'subject_teacher';
      } else if (rank === 'lab_instructor') {
        desig = 'lab_instructor';
      }

      return {
        id: f.id || `fac-${idx}`,
        fullName: f.name,
        employeeId: f.employeeId,
        cabinNumber: f.cabinNumber,
        email: f.email,
        phone: f.phone,
        department: f.department || department,
        designation: desig,
        assignedClass: deptHomerooms[idx % deptHomerooms.length]?.name,
        assignedSubjects: f.assignedCourses,
        attendanceToday: f.status === 'present' || f.status === 'in_lecture' || f.status === 'in_lab' ? 'present' : 'on_leave',
        experienceYears: 10 + (idx * 2),
        qualification: 'Ph.D in Computer Science & Engineering',
      };
    });
  }, [faculty, department, deptHomerooms]);

  // Dynamic KPIs calculated live from departmental classes and faculty
  const dynamicKPIs: HODKPIs = useMemo(() => {
    const totalStudents =
      deptHomerooms.reduce((acc, h) => acc + (h.studentCount || 0), 0) || kpis.totalStudents || 180;
    const totalFaculty = faculty.length || kpis.totalFaculty || 12;
    const facultyOnDuty =
      faculty.filter(
        (f) => f.status === 'present' || f.status === 'in_lecture' || f.status === 'in_lab'
      ).length || kpis.facultyOnDuty || 11;
    const activeCourses = courses.length || kpis.activeCourses || 10;
    const practicalLabsCount =
      courses.filter(
        (c) => c.type === 'practical_lab' || (c.name || '').toLowerCase().includes('lab')
      ).length || kpis.practicalLabsCount || 4;
    const averageSyllabusProgress =
      courses.length > 0
        ? Math.round(
            courses.reduce((acc, c) => acc + (c.syllabusProgressPct || 0), 0) / courses.length
          )
        : kpis.averageSyllabusProgress || 82;

    return {
      ...kpis,
      totalStudents,
      totalFaculty,
      facultyOnDuty,
      activeCourses,
      practicalLabsCount,
      averageSyllabusProgress,
    };
  }, [deptHomerooms, faculty, courses, kpis]);

  // Load HOD Data
  const loadData = useCallback(async () => {
    try {
      const targetDept = department || 'Computer Science & Engineering';
      const results = await Promise.allSettled([
        fetchHODKPIsApi(targetDept),
        fetchHODFacultyApi(targetDept),
        fetchDepartmentCoursesApi(targetDept),
      ]);

      if (!isMountedRef.current) return;
      if (results[0].status === 'fulfilled' && results[0].value && results[0].value.totalStudents > 0) {
        setKpis(results[0].value);
      }
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value) && results[1].value.length > 0) {
        setFaculty(results[1].value);
      }
      if (results[2].status === 'fulfilled' && Array.isArray(results[2].value) && results[2].value.length > 0) {
        setCourses(results[2].value);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.warn('HOD data load error:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [department]);

  useEffect(() => {
    isMountedRef.current = true;
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Sign out handler
  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of the HOD Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch {}
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  // Assign homeroom teacher
  const handleOpenAssignModal = (section: HomeroomSection) => {
    setSelectedSection(section);
    setAssignModalVisible(true);
  };

  const handleConfirmAssign = async (sectionId: string, teacherId: string, teacherName: string) => {
    Alert.alert('Homeroom Assigned', `${teacherName || 'Teacher'} assigned to ${selectedSection?.name || 'this class'}.`);
  };

  // Notice handlers
  const handlePublishNotice = async (
    notice: Omit<SchoolNotice, 'id' | 'publishedDate' | 'acknowledgedCount'>
  ) => {
    const created: SchoolNotice = {
      ...notice,
      id: `not-${Date.now()}`,
      publishedDate: new Date().toISOString().slice(0, 10),
      acknowledgedCount: 0,
    };
    setNotices((prev) => [created, ...prev]);
    Alert.alert('Announcement Broadcasted', `"${notice.title}" has been published.`);
  };

  const handleDeleteNotice = async (id: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  const handleUpdateNotice = async (updatedNotice: SchoolNotice) => {
    setNotices((prev) =>
      prev.map((n) => (n.id === updatedNotice.id ? { ...n, ...updatedNotice } : n))
    );
    Alert.alert('Announcement Updated', `"${updatedNotice.title}" has been updated.`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F4C430" />
        <Text style={styles.loadingText}>Loading Department Dashboard...</Text>
      </View>
    );
  }

  const unreadNoticeCount = notices.filter(
    (n) => n.priority === 'urgent' || n.priority === 'important'
  ).length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <HODHeader
          fullName={fullName}
          department={department}
          institutionName={institutionName}
          profilePic={profilePic}
          activeTab={activeTab}
          noticeBadgeCount={unreadNoticeCount}
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => switchTab('notices')}
          onProfilePress={() => router.push('/(hod)/profile')}
          onBackToDashboard={() => switchTab('dashboard')}
        />

        {/* View Switcher or Error Screen */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#DC2626" />
            <Text style={styles.errorTitle}>Unable to load department</Text>
            <Text style={styles.errorSubtitle}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData} activeOpacity={0.8}>
              <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.body}>
            {tabLoading ? (
              <View style={styles.tabLoaderWrap}>
                <ActivityIndicator size="large" color="#F4C430" />
                <Text style={styles.tabLoaderText}>{tabLoadingTitle}</Text>
              </View>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <HODDashboardView
                    fullName={fullName}
                    department={department}
                    kpis={dynamicKPIs}
                    homerooms={deptHomerooms}
                    staffList={deptStaffList}
                    courses={courses}
                    notices={notices}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    onNavigateTab={(tab) => {
                      if (tab === 'profile') router.push('/(hod)/profile');
                      else switchTab(tab);
                    }}
                    onOpenNoticeModal={() => setNoticeModalVisible(true)}
                    onNavigateToTeacherTimetable={() => switchTab('schedule')}
                    onNavigateToTeacherAttendance={() => switchTab('mark_attendance')}
                  />
                )}

                {(activeTab === 'homerooms' || activeTab === 'students') && (
                  <PrincipalHomeroomsView
                    homerooms={deptHomerooms}
                    title="Department Classes"
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    onAssignTeacher={handleOpenAssignModal}
                  />
                )}

                {(activeTab === 'staff' || activeTab === 'faculty') && (
                  <PrincipalStaffDirectoryView
                    staffList={deptStaffList}
                    restrictDepartment={department}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                  />
                )}

                {activeTab === 'reviews' && (
                  <StudentFeedbackReviewManagerView
                    userRole="hod"
                    userDepartment={department}
                    currentUserName={fullName}
                  />
                )}

                {activeTab === 'notices' && (
                  <PrincipalNoticesView
                    notices={notices}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    onOpenCreateModal={() => setNoticeModalVisible(true)}
                    onDeleteNotice={handleDeleteNotice}
                    onUpdateNotice={handleUpdateNotice}
                  />
                )}

                {activeTab === 'timetable' && (
                  <AdminTimetableView
                    classSections={deptHomerooms}
                  />
                )}

                {activeTab === 'attendance' && (
                  <AdminAttendanceView
                    classSections={deptHomerooms}
                  />
                )}

                {activeTab === 'events' && (
                  <AcademicCalendarEventsView
                    userRole="hod"
                    userDepartment={department}
                    canManageAll={false}
                    canManageDeptOnly={true}
                  />
                )}

                {activeTab === 'leaves' && (
                  !hasModuleAccess('leaves') ? (
                    <AccessRestrictedModuleCard
                      moduleTitle="Department Leave Approvals Desk"
                      moduleDescription="Department Leave Approvals is an optional workflow. Access is granted to department authorities."
                      moduleKey="leaves"
                      onGrantAccess={() => grantModuleAccess('leaves')}
                      onBack={() => switchTab('dashboard')}
                    />
                  ) : (
                    <LeaveApprovalView
                      userRole="hod"
                      userDepartment={department}
                      reviewerName={fullName}
                    />
                  )
                )}

                {activeTab === 'document_requests' && (
                  !hasModuleAccess('document_requests') ? (
                    <AccessRestrictedModuleCard
                      moduleTitle="Document Desk"
                      moduleDescription="Document Desk is an optional service for departmental certificates and document verifications."
                      moduleKey="document_requests"
                      onGrantAccess={() => grantModuleAccess('document_requests')}
                      onBack={() => switchTab('dashboard')}
                    />
                  ) : (
                    <DocumentRequestsManagerView
                      userRole="hod"
                      userDepartment={department}
                      institutionName={institutionName}
                    />
                  )
                )}

                {/* Teaching & Classroom Operations (from Principal codebase) */}
                {activeTab === 'schedule' && (
                  <TeacherTimetableView
                    onOpenAttendance={(slotId, subjectName) => {
                      setActiveSlot({ slotId, subjectName });
                      switchTab('mark_attendance');
                    }}
                  />
                )}

                {activeTab === 'mark_attendance' && (
                  <AttendanceMarkingView
                    slotId={activeSlot?.slotId}
                    subjectName={activeSlot?.subjectName}
                    onSaved={() => {
                      setActiveSlot(null);
                      handleRefresh();
                    }}
                    onBack={() => {
                      setActiveSlot(null);
                      switchTab('dashboard');
                    }}
                  />
                )}

                {activeTab === 'marks' && (
                  <TeacherMarksView />
                )}

                {activeTab === 'homework' && (
                  <TeacherHomeworkView />
                )}
              </>
            )}
          </View>
        )}

        {/* Floating Oval Pill Bottom Tab Bar (matching Principal) */}
        <View
          style={[
            styles.ovalBottomBar,
            { marginBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          {BOTTOM_TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabBtn}
                onPress={() => {
                  if (tab.key === 'profile') {
                    router.push('/(hod)/profile');
                  } else {
                    switchTab(tab.key);
                  }
                }}
                activeOpacity={0.7}
              >
                {active ? (
                  <View style={styles.activeIconCircle}>
                    <MaterialCommunityIcons
                      name={tab.iconActive}
                      size={20}
                      color="#000000"
                    />
                  </View>
                ) : (
                  <View style={styles.inactiveIconWrap}>
                    <MaterialCommunityIcons
                      name={tab.icon}
                      size={20}
                      color="#9CA3AF"
                    />
                  </View>
                )}
                <Text
                  style={[
                    styles.tabLabel,
                    active && styles.tabLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Drawer */}
        <HODDrawer
          visible={drawerOpen}
          activeTab={activeTab}
          onClose={() => setDrawerOpen(false)}
          onNavigate={(t) => {
            if (t === 'profile') router.push('/(hod)/profile');
            else switchTab(t);
            setDrawerOpen(false);
          }}
          onLogout={handleLogout}
        />

        {/* Modals matching Principal */}
        <AssignHomeroomModal
          visible={assignModalVisible}
          section={selectedSection}
          staffList={deptStaffList}
          onClose={() => {
            setAssignModalVisible(false);
            setSelectedSection(null);
          }}
          onAssign={handleConfirmAssign}
        />

        <CreateNoticeModal
          visible={noticeModalVisible}
          onClose={() => setNoticeModalVisible(false)}
          onSubmit={handlePublishNotice}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFDF7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
  },
  body: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  tabLoaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  tabLoaderText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#111827',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4C430',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  retryText: {
    color: '#111827',
    fontSize: 14,
    fontFamily: FontFamily.semibold,
  },
  ovalBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 12,
    maxWidth: 620,
    width: '94%',
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 8,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  activeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFD026',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: '#FFD026',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  inactiveIconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: FontFamily.medium,
  },
  tabLabelActive: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
});
