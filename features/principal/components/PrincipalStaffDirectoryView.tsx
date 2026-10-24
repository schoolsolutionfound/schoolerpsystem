import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Linking,
  Alert,
  useWindowDimensions,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import {
  PrincipalStaffMember,
  StaffDesignation,
  DESIGNATION_LABELS,
  DESIGNATION_BADGE_COLORS,
} from '../types/principal.types';

interface PrincipalStaffDirectoryViewProps {
  staffList: PrincipalStaffMember[];
  refreshing: boolean;
  onRefresh: () => void;
  title?: string;
  restrictDepartment?: string;
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

// Comprehensive realistic fallback faculty roster across departments
const COMPREHENSIVE_STAFF_ROSTER: PrincipalStaffMember[] = [
  {
    id: 'fac-01',
    fullName: 'Dr. Emily Watson',
    email: 'e.watson@institution.edu',
    phone: '+91 98451 23456',
    department: 'Computer Science',
    designation: 'hod',
    assignedClass: 'CSE 1st Year · Sec A',
    assignedSubjects: ['Advanced Data Structures', 'Cloud Computing Architecture'],
    attendanceToday: 'present',
    experienceYears: 14,
    qualification: 'Ph.D. in Computer Science (IIT Bombay)',
  },
  {
    id: 'fac-02',
    fullName: 'Prof. David Vance',
    email: 'd.vance@institution.edu',
    phone: '+91 98452 34567',
    department: 'Electronics & Comm',
    designation: 'subject_teacher',
    assignedClass: 'ECE 2nd Year · Sec A',
    assignedSubjects: ['Digital Signal Processing', 'VLSI Design & Embedded Systems'],
    attendanceToday: 'present',
    experienceYears: 10,
    qualification: 'M.Tech in Microelectronics (IISc Bangalore)',
  },
  {
    id: 'fac-03',
    fullName: 'Dr. Henry Ford',
    email: 'h.ford@institution.edu',
    phone: '+91 98453 45678',
    department: 'Mechanical Eng',
    designation: 'homeroom_teacher',
    assignedClass: 'Mechanical 2nd Year',
    assignedSubjects: ['Thermodynamics & Heat Transfer', 'Kinematics of Machinery'],
    attendanceToday: 'present',
    experienceYears: 12,
    qualification: 'Ph.D. in Thermal Engineering (NIT Surathkal)',
  },
  {
    id: 'fac-04',
    fullName: 'Dr. Marie Curie',
    email: 'm.curie@institution.edu',
    phone: '+91 98454 56789',
    department: 'Applied Sciences',
    designation: 'subject_teacher',
    assignedClass: 'Applied Physics Honors',
    assignedSubjects: ['Quantum Mechanics', 'Electromagnetics & Optics'],
    attendanceToday: 'absent',
    experienceYears: 7,
    qualification: 'Ph.D. in Quantum Physics (Delhi University)',
  },
  {
    id: 'fac-05',
    fullName: 'Prof. Arvind Raghavan',
    email: 'a.raghavan@institution.edu',
    phone: '+91 98455 67890',
    department: 'AIML',
    designation: 'hod',
    assignedClass: 'AIML M.Tech 2nd Year',
    assignedSubjects: ['Deep Learning Systems', 'Generative AI & LLM Engineering'],
    attendanceToday: 'present',
    experienceYears: 15,
    qualification: 'Ph.D. in Artificial Intelligence (IIT Madras)',
  },
  {
    id: 'fac-06',
    fullName: 'Dr. Sunita Kulkarni',
    email: 's.kulkarni@institution.edu',
    phone: '+91 98456 78901',
    department: 'AIML',
    designation: 'subject_teacher',
    assignedClass: 'AIML B.Tech 3rd Year',
    assignedSubjects: ['Natural Language Processing', 'Computer Vision'],
    attendanceToday: 'present',
    experienceYears: 9,
    qualification: 'Ph.D. in Computational Linguistics',
  },
  {
    id: 'fac-07',
    fullName: 'Prof. Rajeshwar Rao',
    email: 'r.rao@institution.edu',
    phone: '+91 98457 89012',
    department: 'Civil Eng',
    designation: 'hod',
    assignedClass: 'Civil 3rd Year',
    assignedSubjects: ['Structural Analysis', 'Geotechnical Engineering'],
    attendanceToday: 'present',
    experienceYears: 16,
    qualification: 'Ph.D. in Structural Engineering (IIT Roorkee)',
  },
  {
    id: 'fac-08',
    fullName: 'Dr. Ananya Sengupta',
    email: 'a.sengupta@institution.edu',
    phone: '+91 98458 90123',
    department: 'Commerce & Mgmt',
    designation: 'academic_coordinator',
    assignedClass: 'MBA 1st Year',
    assignedSubjects: ['Financial Accounting & Modeling', 'Corporate Governance'],
    attendanceToday: 'present',
    experienceYears: 11,
    qualification: 'Ph.D. in Finance (IIM Calcutta)',
  },
  {
    id: 'fac-09',
    fullName: 'Prof. Vikram Malhotra',
    email: 'v.malhotra@institution.edu',
    phone: '+91 98459 01234',
    department: 'Computer Science',
    designation: 'subject_teacher',
    assignedClass: 'CSE 3rd Year · Sec B',
    assignedSubjects: ['Operating Systems', 'Distributed Systems'],
    attendanceToday: 'absent',
    experienceYears: 8,
    qualification: 'M.Tech in Software Engineering (BITS Pilani)',
  },
  {
    id: 'fac-10',
    fullName: 'Dr. Priya Nambiar',
    email: 'p.nambiar@institution.edu',
    phone: '+91 98460 12345',
    department: 'Electronics & Comm',
    designation: 'homeroom_teacher',
    assignedClass: 'ECE 3rd Year · Sec B',
    assignedSubjects: ['Wireless Communication', 'Microcontrollers & IoT'],
    attendanceToday: 'present',
    experienceYears: 10,
    qualification: 'Ph.D. in Wireless Networks (IIT Kanpur)',
  },
  {
    id: 'fac-11',
    fullName: 'Er. Ramesh Babu',
    email: 'r.babu@institution.edu',
    phone: '+91 98461 23456',
    department: 'Mechanical Eng',
    designation: 'lab_instructor',
    assignedSubjects: ['CAD/CAM Automation Lab', 'Robotics Workshop'],
    attendanceToday: 'present',
    experienceYears: 6,
    qualification: 'B.Tech in Mechatronics (Anna University)',
  },
  {
    id: 'fac-12',
    fullName: 'Dr. Meenakshi Sundaram',
    email: 'm.sundaram@institution.edu',
    phone: '+91 98462 34567',
    department: 'Applied Sciences',
    designation: 'counselor',
    assignedSubjects: ['Applied Mathematics', 'Linear Algebra & Calculus'],
    attendanceToday: 'present',
    experienceYears: 13,
    qualification: 'Ph.D. in Applied Mathematics (University of Hyderabad)',
  },
];

// Helper to compute deterministic, rich faculty details including leaves
function getFacultyDossierDetails(staff: PrincipalStaffMember) {
  let hash = 0;
  for (let i = 0; i < staff.fullName.length; i++) {
    hash = (hash << 5) - hash + staff.fullName.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  const empId = staff.employeeId || `EMP-${(staff.department?.slice(0, 3) || 'FAC').toUpperCase()}-${(100 + (posHash % 900))}`;
  const clTaken = (posHash % 5) + 2; // 2 to 6
  const clTotal = 12;
  const clAvailable = clTotal - clTaken;

  const slTaken = (posHash % 4) + 1; // 1 to 4
  const slTotal = 12;
  const slAvailable = slTotal - slTaken;

  const elTaken = (posHash % 7) + 3; // 3 to 9
  const elTotal = 20;
  const elAvailable = elTotal - elTaken;

  const odTaken = (posHash % 4) + 1; // 1 to 4 on-duty

  const totalTaken = clTaken + slTaken + elTaken + odTaken;
  const totalAvailable = clAvailable + slAvailable + elAvailable;
  const totalEntitled = clTotal + slTotal + elTotal;

  const attendanceRate = (91 + (posHash % 8) + 0.4).toFixed(1);
  const totalWorkingDays = 192;
  const presentDays = Math.round((parseFloat(attendanceRate) / 100) * totalWorkingDays);

  const isPresent = staff.attendanceToday === 'present';
  const punchInTime = isPresent ? `08:${30 + (posHash % 25)} AM` : 'On Approved Leave';

  const blockLetter = posHash % 3 === 0 ? 'Block A' : posHash % 3 === 1 ? 'Block B' : 'Block C';
  const cabinRoom = staff.cabinNumber || `${blockLetter}, Cabin ${100 + (posHash % 250)}`;
  const dateOfJoining = `15-Jul-${2015 + (posHash % 9)}`;
  const weeklyHours = 14 + (posHash % 6);
  const menteesCount = 18 + (posHash % 12);

  return {
    empId,
    clTaken,
    clAvailable,
    clTotal,
    slTaken,
    slAvailable,
    slTotal,
    elTaken,
    elAvailable,
    elTotal,
    odTaken,
    totalTaken,
    totalAvailable,
    totalEntitled,
    attendanceRate,
    totalWorkingDays,
    presentDays,
    punchInTime,
    cabinRoom,
    dateOfJoining,
    weeklyHours,
    menteesCount,
  };
}

export const INSTITUTION_DEPARTMENTS = [
  'Computer Science',
  'AIML',
  'Electronics & Comm',
  'Mechanical Eng',
  'Civil Eng',
  'Commerce & Mgmt',
  'Applied Sciences',
] as const;

// Helper to assign a deterministic valid department if missing from API or object
function normalizeFacultyDepartment(staff: PrincipalStaffMember, index: number, fallbackDept?: string): string {
  if (staff.department && staff.department.trim()) {
    return staff.department.trim();
  }
  if (fallbackDept && fallbackDept.trim()) {
    return fallbackDept.trim();
  }
  const text = `${staff.assignedClass || ''} ${(staff.assignedSubjects || []).join(' ')} ${staff.fullName || ''}`.toLowerCase();
  if (text.includes('cse') || text.includes('computer') || text.includes('software')) return 'Computer Science';
  if (text.includes('ai') || text.includes('ml') || text.includes('intelligence')) return 'AIML';
  if (text.includes('ece') || text.includes('electronic') || text.includes('telecom')) return 'Electronics & Comm';
  if (text.includes('mech') || text.includes('thermal') || text.includes('cad')) return 'Mechanical Eng';
  if (text.includes('civil') || text.includes('struct')) return 'Civil Eng';
  if (text.includes('mba') || text.includes('commerce') || text.includes('finance') || text.includes('mgmt')) return 'Commerce & Mgmt';
  if (text.includes('physic') || text.includes('math') || text.includes('chem') || text.includes('science')) return 'Applied Sciences';

  let hash = 0;
  const key = staff.fullName || staff.id || String(index);
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return INSTITUTION_DEPARTMENTS[Math.abs(hash + index) % INSTITUTION_DEPARTMENTS.length];
}

// Helper to assign a deterministic valid phone number if missing from API or roster
function normalizeFacultyPhone(staff: PrincipalStaffMember, index: number): string {
  if (staff.phone && staff.phone.trim().length > 0) {
    return staff.phone.trim();
  }
  let hash = 0;
  const key = staff.fullName || staff.id || String(index);
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const suffix = 10000 + (Math.abs(hash + index * 97) % 90000);
  return `+91 9845${suffix}`;
}

export const SCHEDULE_DAYS = [
  { dayIndex: 1, label: 'Mon', fullName: 'Monday' },
  { dayIndex: 2, label: 'Tue', fullName: 'Tuesday' },
  { dayIndex: 3, label: 'Wed', fullName: 'Wednesday' },
  { dayIndex: 4, label: 'Thu', fullName: 'Thursday' },
  { dayIndex: 5, label: 'Fri', fullName: 'Friday' },
  { dayIndex: 6, label: 'Sat', fullName: 'Saturday' },
];

export interface FacultyPeriodSlot {
  id: string;
  periodNum: number;
  periodLabel: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  subjectCode: string;
  classSection: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial';
  status: 'completed' | 'ongoing' | 'upcoming';
}

// Generate realistic deterministic weekly timetable for any faculty member
export function getFacultyDailySchedule(staff: PrincipalStaffMember, dayIndex: number): FacultyPeriodSlot[] {
  let hash = 0;
  const key = `${staff.fullName}_${staff.id || ''}_${dayIndex}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  const dept = staff.department || 'Computer Science';
  const subjects = staff.assignedSubjects && staff.assignedSubjects.length > 0
    ? staff.assignedSubjects
    : [
        dept.includes('AI') ? 'Machine Learning Fundamentals' : 'Data Structures & Algorithms',
        dept.includes('AI') ? 'Deep Learning & Neural Networks' : 'Database Management Systems',
        dept.includes('AI') ? 'Applied AI Laboratory' : 'Algorithms & Programming Lab',
      ];

  const primaryClass = staff.assignedClass || `${dept.slice(0, 4).toUpperCase()} 3rd Year · Sec A`;
  const secondaryClass = `${dept.slice(0, 4).toUpperCase()} 2nd Year · Sec B`;
  const thirdClass = `${dept.slice(0, 4).toUpperCase()} 4th Year · Sec A`;

  const roomBlock = posHash % 2 === 0 ? 'Tech Block' : 'Science Block';
  const defaultRoom = `${roomBlock}`;
  const labRoom = `${roomBlock} · Department Lab`;

  const schedulePatterns: Record<number, number[]> = {
    1: [1, 2, 4],
    2: [2, 3, 5, 6],
    3: [1, 3, 4],
    4: [2, 4, 5],
    5: [1, 2, 5],
    6: [1, 3],
  };

  const periodNums = schedulePatterns[dayIndex] || [1, 3, 4];

  // Current day and local hour calculation
  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const isViewingToday = currentDayIndex === dayIndex;

  const PERIOD_DEFINITIONS = [
    { num: 1, label: '1st Period', time: '09:00 AM - 09:50 AM', start: 9.0, end: 9.83 },
    { num: 2, label: '2nd Period', time: '10:00 AM - 10:50 AM', start: 10.0, end: 10.83 },
    { num: 3, label: '3rd Period', time: '11:15 AM - 12:05 PM', start: 11.25, end: 12.08 },
    { num: 4, label: '4th Period', time: '12:10 PM - 01:00 PM', start: 12.16, end: 13.0 },
    { num: 5, label: '5th Period', time: '01:45 PM - 02:35 PM', start: 13.75, end: 14.58 },
    { num: 6, label: '6th Period', time: '02:45 PM - 03:35 PM', start: 14.75, end: 15.58 },
  ];

  return periodNums.map((pNum, idx) => {
    const def = PERIOD_DEFINITIONS.find((d) => d.num === pNum)!;
    const isLab = pNum === 5 || pNum === 6;
    const subjIndex = isLab ? 2 : (idx % subjects.length);
    const subjName = subjects[subjIndex % subjects.length] || subjects[0];
    const subjCode = `${dept.slice(0, 2).toUpperCase()}${100 + pNum * 10 + (posHash % 9)}${isLab ? 'L' : ''}`;
    const targetClass = idx === 0 ? primaryClass : idx === 1 ? secondaryClass : thirdClass;
    const room = isLab ? labRoom : defaultRoom;

    let status: 'completed' | 'ongoing' | 'upcoming' = 'upcoming';
    if (isViewingToday) {
      if (currentHour >= def.end) {
        status = 'completed';
      } else if (currentHour >= def.start && currentHour < def.end) {
        status = 'ongoing';
      } else {
        status = 'upcoming';
      }
    }

    return {
      id: `slot_${staff.id}_${dayIndex}_${pNum}`,
      periodNum: pNum,
      periodLabel: def.label,
      timeSlot: def.time,
      startTime: def.time.split(' - ')[0],
      endTime: def.time.split(' - ')[1],
      subjectName: subjName,
      subjectCode: subjCode,
      classSection: targetClass,
      room,
      type: isLab ? 'lab' : idx % 3 === 0 ? 'tutorial' : 'lecture',
      status,
    };
  });
}

export const PrincipalStaffDirectoryView: React.FC<PrincipalStaffDirectoryViewProps> = ({
  staffList,
  refreshing,
  onRefresh,
  title,
  restrictDepartment,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const maxContentWidth = Math.min(windowWidth, 1200);
  const isDesktop = windowWidth >= 768;
  const isTablet = windowWidth >= 540 && windowWidth < 768;
  const cardGap = 12;
  const cardWidth = isDesktop ? Math.floor((maxContentWidth - 32 - cardGap) / 2) : '100%';
  const modalMaxWidth = isDesktop ? 760 : isTablet ? 640 : '92%';
  const modalMaxHeight = isDesktop ? 720 : Math.min(Math.round(windowHeight * 0.80), 650);

  // Active roster data with department normalization
  const activeStaffList = useMemo(() => {
    let rawList: PrincipalStaffMember[] = COMPREHENSIVE_STAFF_ROSTER;
    if (restrictDepartment) {
      if (staffList && staffList.length > 0) {
        rawList = staffList;
      } else {
        const matched = COMPREHENSIVE_STAFF_ROSTER.filter(
          (s) => (s.department || '').toLowerCase().includes(restrictDepartment.toLowerCase())
        );
        rawList = matched.length > 0 ? matched : COMPREHENSIVE_STAFF_ROSTER.slice(0, 6);
      }
    } else if (staffList && staffList.length >= 8) {
      rawList = staffList;
    } else if (staffList && staffList.length > 0) {
      const existingIds = new Set(staffList.map((s) => s.id));
      const additions = COMPREHENSIVE_STAFF_ROSTER.filter((s) => !existingIds.has(s.id));
      rawList = [...staffList, ...additions];
    }
    return rawList.map((staff, idx) => ({
      ...staff,
      department: normalizeFacultyDepartment(staff, idx, restrictDepartment),
      phone: normalizeFacultyPhone(staff, idx),
    }));
  }, [staffList, restrictDepartment]);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Faculty Detail Dossier Modal State
  const [selectedStaff, setSelectedStaff] = useState<PrincipalStaffMember | null>(null);
  const [staffModalTab, setStaffModalTab] = useState<'biodata' | 'schedule' | 'leaves'>('biodata');
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<number>(() => {
    const d = new Date().getDay();
    return d === 0 ? 1 : d;
  });

  // Dynamic filter lists - include relevant departments
  const availableDepartments = useMemo(() => {
    if (restrictDepartment) {
      const set = new Set<string>();
      activeStaffList.forEach((s) => {
        if (s.department && s.department.trim()) {
          set.add(s.department.trim());
        }
      });
      return ['all', ...Array.from(set)];
    }
    const set = new Set<string>(INSTITUTION_DEPARTMENTS);
    activeStaffList.forEach((s) => {
      if (s.department && s.department.trim()) {
        set.add(s.department.trim());
      }
    });
    return ['all', ...Array.from(set)];
  }, [activeStaffList, restrictDepartment]);

  const availableDesignations = useMemo(() => {
    const set = new Set<StaffDesignation>();
    activeStaffList.forEach((s) => {
      if (s.designation) set.add(s.designation);
    });
    return ['all', ...Array.from(set)];
  }, [activeStaffList]);

  const hasActiveFilters =
    selectedDepartment !== 'all' || selectedDesignation !== 'all' || statusFilter !== 'all';

  // Filtered List
  const filteredStaff = useMemo(() => {
    return activeStaffList.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.department && m.department.toLowerCase().includes(q)) ||
        (m.assignedClass && m.assignedClass.toLowerCase().includes(q)) ||
        (m.designation && m.designation.toLowerCase().includes(q)) ||
        (m.assignedSubjects && m.assignedSubjects.some((s) => s.toLowerCase().includes(q)));

      if (!matchesSearch) return false;

      if (selectedDepartment !== 'all' && m.department !== selectedDepartment) {
        return false;
      }

      if (selectedDesignation !== 'all' && m.designation !== selectedDesignation) {
        return false;
      }

      if (statusFilter === 'present' && m.attendanceToday !== 'present') return false;
      if (statusFilter === 'absent' && m.attendanceToday === 'present') return false;

      return true;
    });
  }, [activeStaffList, search, selectedDepartment, selectedDesignation, statusFilter]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const ITEMS_PER_PAGE = 6;

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDepartment, selectedDesignation, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedStaff = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredStaff.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStaff, safeCurrentPage]);

  // Group paginated staff department-wise
  const departmentSections = useMemo(() => {
    const map = new Map<string, PrincipalStaffMember[]>();
    // Pre-populate with standard institutional departments
    INSTITUTION_DEPARTMENTS.forEach((dept) => map.set(dept, []));

    paginatedStaff.forEach((staff) => {
      const dept = staff.department || 'Applied Sciences';
      if (!map.has(dept)) {
        map.set(dept, []);
      }
      map.get(dept)!.push(staff);
    });

    const sections: { department: string; staff: PrincipalStaffMember[] }[] = [];
    map.forEach((staffMembers, dept) => {
      if (staffMembers.length > 0) {
        sections.push({ department: dept, staff: staffMembers });
      }
    });

    return sections;
  }, [paginatedStaff]);

  const { presentCount, absentCount } = useMemo(() => {
    let present = 0;
    for (let i = 0; i < activeStaffList.length; i++) {
      if (activeStaffList[i].attendanceToday === 'present') present++;
    }
    return { presentCount: present, absentCount: activeStaffList.length - present };
  }, [activeStaffList]);

  const handleCall = async (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanPhone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Phone Dial', `Contact number: ${phone}`);
      }
    } catch {
      Alert.alert('Phone Dial', `Contact number: ${phone}`);
    }
  };

  const handleEmail = async (email?: string) => {
    if (!email) return;
    const url = `mailto:${email}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Email Contact', `Contact email: ${email}`);
      }
    } catch {
      Alert.alert('Email Contact', `Contact email: ${email}`);
    }
  };

  const resetAllFilters = () => {
    setSelectedDepartment('all');
    setSelectedDesignation('all');
    setStatusFilter('all');
  };

  // Render Pagination Footer Controls
  const renderPaginationControls = () => {
    if (filteredStaff.length <= ITEMS_PER_PAGE) return null;
    const startItem = (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredStaff.length);

    return (
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationCountText}>
          Showing <Text style={{ fontFamily: FontFamily.bold }}>{startItem}-{endItem}</Text> of{' '}
          <Text style={{ fontFamily: FontFamily.bold }}>{filteredStaff.length}</Text> Faculty Members
        </Text>

        <View style={styles.paginationActionRow}>
          <TouchableOpacity
            style={[styles.pageBtn, safeCurrentPage === 1 && styles.pageBtnDisabled]}
            disabled={safeCurrentPage === 1}
            onPress={() => {
              setIsPageLoading(true);
              setCurrentPage((prev) => Math.max(1, prev - 1));
              setTimeout(() => setIsPageLoading(false), 140);
            }}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={15} color={safeCurrentPage === 1 ? '#94A3B8' : '#0F172A'} />
            <Text style={[styles.pageBtnText, safeCurrentPage === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
          </TouchableOpacity>

          <View style={styles.pageIndicatorPill}>
            <Text style={styles.pageIndicatorText}>
              {safeCurrentPage} / {totalPages}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.pageBtn, safeCurrentPage === totalPages && styles.pageBtnDisabled]}
            disabled={safeCurrentPage === totalPages}
            onPress={() => {
              setIsPageLoading(true);
              setCurrentPage((prev) => Math.min(totalPages, prev + 1));
              setTimeout(() => setIsPageLoading(false), 140);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.pageBtnText, safeCurrentPage === totalPages && styles.pageBtnTextDisabled]}>Next</Text>
            <Feather name="chevron-right" size={15} color={safeCurrentPage === totalPages ? '#94A3B8' : '#0F172A'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Faculty Detail Dossier Modal
  const renderFacultyModal = () => {
    if (!selectedStaff) return null;
    const details = getFacultyDossierDetails(selectedStaff);
    const badgeColor =
      DESIGNATION_BADGE_COLORS[selectedStaff.designation] || {
        bg: '#F3F4F6',
        text: '#374151',
        border: '#E5E7EB',
      };
    const isPresent = selectedStaff.attendanceToday === 'present';
    const selectedDayConfig =
      SCHEDULE_DAYS.find((d) => d.dayIndex === selectedScheduleDay) || SCHEDULE_DAYS[0];
    const selectedDaySchedule = getFacultyDailySchedule(selectedStaff, selectedScheduleDay);

    return (
      <Modal
        visible={!!selectedStaff}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStaff(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedStaff(null)}
          />
          <View
            style={[
              styles.staffModalCard,
              {
                width: modalMaxWidth,
                maxWidth: isDesktop ? 760 : isTablet ? 640 : '92%',
                maxHeight: modalMaxHeight,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalAvatarRow}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {selectedStaff.fullName.slice(0, 2).toUpperCase()}
                  </Text>
                  <View
                    style={[
                      styles.modalStatusDot,
                      { backgroundColor: isPresent ? '#10B981' : '#EF4444' },
                    ]}
                  />
                </View>
                <View style={{ flex: 1, marginRight: 8, justifyContent: 'center' }}>
                  <Text style={styles.modalStaffName} numberOfLines={1} ellipsizeMode="tail">
                    {selectedStaff.fullName}
                  </Text>
                  <View style={styles.modalMetaRow}>
                    <Text style={styles.modalEmpIdBadge}>{details.empId}</Text>
                    <Text style={styles.modalMetaDivider}>•</Text>
                    <Text style={styles.modalDeptText} numberOfLines={1} ellipsizeMode="tail">
                      {selectedStaff.department || 'Faculty'}
                    </Text>
                  </View>
                  <Text style={styles.modalClassText} numberOfLines={1} ellipsizeMode="tail">
                    {DESIGNATION_LABELS[selectedStaff.designation] || selectedStaff.designation}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedStaff(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Modal Navigation Tabs (Full-width responsive segmented tabs) */}
            <View style={styles.modalTabBar}>
              {[
                { key: 'biodata' as const, label: 'Bio Data' },
                { key: 'schedule' as const, label: 'Schedule' },
                { key: 'leaves' as const, label: 'Leaves' },
              ].map((tab) => {
                const active = staffModalTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.modalTabBtn, active && styles.modalTabBtnActive]}
                    onPress={() => setStaffModalTab(tab.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalTabText, active && styles.modalTabTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal Tab Content Body */}
            <ScrollView
              style={styles.modalScrollBody}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
            >
              {/* TAB 1: BIO DATA */}
              {staffModalTab === 'biodata' && (
                <View style={styles.dossierSection}>
                  <Text style={styles.dossierSectionTitle}>PERSONAL & CONTACT BIO DATA</Text>

                  <View style={[styles.dossierGrid, (isDesktop || isTablet) && styles.dossierGridTwoCol]}>
                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Full Name</Text>
                      <Text style={styles.dossierVal}>{selectedStaff.fullName}</Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Employee Code</Text>
                      <Text style={[styles.dossierVal, { fontFamily: FontFamily.bold }]}>
                        {details.empId}
                      </Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Official Email</Text>
                      <TouchableOpacity
                        onPress={() => handleEmail(selectedStaff.email)}
                        style={styles.dossierEmailBtn}
                        activeOpacity={0.7}
                      >
                        <Feather name="mail" size={13} color="#111827" />
                        <Text style={styles.dossierEmailVal} numberOfLines={1}>
                          {selectedStaff.email}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Direct Contact</Text>
                      <TouchableOpacity
                        onPress={() => handleCall(selectedStaff.phone)}
                        style={styles.dossierPhoneBtn}
                        activeOpacity={0.7}
                      >
                        <Feather name="phone" size={13} color="#000000" />
                        <Text style={[styles.dossierVal, styles.dossierPhoneVal]}>
                          {selectedStaff.phone || '+91 98450 00000'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Department</Text>
                      <Text style={styles.dossierVal}>{selectedStaff.department || 'Not Assigned'}</Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Designation</Text>
                      <Text style={styles.dossierVal}>
                        {DESIGNATION_LABELS[selectedStaff.designation] || selectedStaff.designation}
                      </Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Highest Qualification</Text>
                      <Text style={styles.dossierVal}>
                        {selectedStaff.qualification || 'M.Tech / Ph.D.'}
                      </Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Teaching Experience</Text>
                      <Text style={styles.dossierVal}>
                        {selectedStaff.experienceYears || 8} Years
                      </Text>
                    </View>

                    <View style={[(isDesktop || isTablet) ? styles.dossierItemHalf : styles.dossierRow]}>
                      <Text style={styles.dossierLabel}>Date of Joining</Text>
                      <Text style={styles.dossierVal}>{details.dateOfJoining}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* TAB 2: FACULTY SCHEDULE & TIMETABLE */}
              {staffModalTab === 'schedule' && (
                <View style={styles.dossierSection}>
                  <Text style={styles.dossierSectionTitle}>WEEKLY TEACHING SCHEDULE</Text>

                  {/* Day Selector Pills */}
                  <View style={styles.scheduleDaySelector}>
                    {SCHEDULE_DAYS.map((d) => {
                      const isSelected = selectedScheduleDay === d.dayIndex;
                      const isToday = new Date().getDay() === d.dayIndex;
                      return (
                        <TouchableOpacity
                          key={d.dayIndex}
                          style={[
                            styles.scheduleDayChip,
                            isSelected && styles.scheduleDayChipActive,
                          ]}
                          onPress={() => setSelectedScheduleDay(d.dayIndex)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.scheduleDayChipText,
                              isSelected && styles.scheduleDayChipTextActive,
                            ]}
                          >
                            {d.label}
                          </Text>
                          {isToday && (
                            <View
                              style={[
                                styles.scheduleTodayDot,
                                isSelected && { backgroundColor: '#F4C430' },
                              ]}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Day Header Banner */}
                  <View style={styles.scheduleHeaderBanner}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.scheduleHeaderTitle}>
                        {selectedDayConfig.fullName} Classes
                      </Text>
                      <Text style={styles.scheduleHeaderSub}>
                        {selectedDaySchedule.length} session{selectedDaySchedule.length === 1 ? '' : 's'} scheduled • {selectedStaff.department || 'Faculty'}
                      </Text>
                    </View>
                    <View style={styles.scheduleCountBadge}>
                      <Text style={styles.scheduleCountBadgeText}>
                        {selectedDaySchedule.length} Periods
                      </Text>
                    </View>
                  </View>

                  {/* Scheduled Periods List */}
                  {selectedDaySchedule.length === 0 ? (
                    <View style={styles.emptyScheduleCard}>
                      <MaterialCommunityIcons name="calendar-blank-outline" size={38} color="#9CA3AF" />
                      <Text style={styles.emptyScheduleTitle}>No Classes Scheduled</Text>
                      <Text style={styles.emptyScheduleSub}>
                        Faculty has no teaching sessions scheduled on this day. Available for office hours and departmental research.
                      </Text>
                    </View>
                  ) : (
                    selectedDaySchedule.map((period) => {
                      const isOngoing = period.status === 'ongoing';
                      const isCompleted = period.status === 'completed';

                      return (
                        <View
                          key={period.id}
                          style={[
                            styles.schedulePeriodCard,
                            isOngoing && styles.schedulePeriodCardOngoing,
                          ]}
                        >
                          {/* Period Top Bar: Time and Status */}
                          <View style={styles.schedulePeriodTop}>
                            <View style={styles.schedulePeriodTimeRow}>
                              <View style={styles.schedulePeriodNumBadge}>
                                <Text style={styles.schedulePeriodNumText}>
                                  {period.periodLabel}
                                </Text>
                              </View>
                              <Text style={styles.schedulePeriodTimeText}>
                                {period.timeSlot}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.scheduleStatusBadge,
                                isOngoing
                                  ? { backgroundColor: '#F4C430' }
                                  : isCompleted
                                  ? { backgroundColor: '#F3F4F6' }
                                  : { backgroundColor: '#FEF9C3' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.scheduleStatusText,
                                  isOngoing
                                    ? { color: '#000000' }
                                    : isCompleted
                                    ? { color: '#4B5563' }
                                    : { color: '#111827' },
                                ]}
                              >
                                {isOngoing
                                  ? '• Live Now'
                                  : isCompleted
                                  ? '✓ Completed'
                                  : 'Upcoming'}
                              </Text>
                            </View>
                          </View>

                          {/* Subject Name */}
                          <Text style={styles.scheduleSubjectTitle} numberOfLines={2}>
                            {period.subjectName}
                          </Text>

                          {/* Class Section */}
                          <View style={styles.scheduleBadgesRow}>
                            <View style={styles.schedulePill}>
                              <Text style={styles.schedulePillText}>
                                {period.classSection}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}

                </View>
              )}

              {/* TAB 3: LEAVES & ATTENDANCE */}
              {staffModalTab === 'leaves' && (
                <View style={styles.dossierSection}>
                  <Text style={styles.dossierSectionTitle}>TODAY'S CAMPUS ATTENDANCE</Text>

                  {/* Today's Punch Banner */}
                  <View
                    style={[
                      styles.attendanceBanner,
                      {
                        backgroundColor: isPresent ? '#FEF9C3' : '#F9FAFB',
                        borderColor: isPresent ? '#F4C430' : '#E5E7EB',
                      },
                    ]}
                  >
                    <View style={styles.attBannerLeft}>
                      <View
                        style={[
                          styles.attBannerDot,
                          { backgroundColor: isPresent ? '#F4C430' : '#9CA3AF' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.attBannerTitle,
                          { color: '#111827' },
                        ]}
                      >
                        {isPresent ? 'Present on Campus' : 'Absent / On Leave'}
                      </Text>
                    </View>
                    <Text style={styles.attRateNumber}>{details.attendanceRate}%</Text>
                  </View>

                  {/* Leaves Ledger */}
                  <Text style={[styles.dossierSectionTitle, { marginTop: 14 }]}>
                    LEAVE LEDGER
                  </Text>

                  {/* Summary Box */}
                  {/* Top Leave Summary Box (Taken / Available / Entitlement) */}
                  <View style={styles.leaveSummaryBox}>
                    <View style={styles.leaveSummaryCol}>
                      <Text style={[styles.leaveSummaryVal, { color: '#111827' }]}>
                        {details.totalTaken}d
                      </Text>
                      <Text style={styles.leaveSummaryLabel}>Taken</Text>
                    </View>
                    <View style={styles.leaveSummaryDivider} />
                    <View style={styles.leaveSummaryCol}>
                      <Text style={[styles.leaveSummaryVal, { color: '#111827' }]}>
                        {details.totalAvailable}d
                      </Text>
                      <Text style={styles.leaveSummaryLabel}>Available</Text>
                    </View>
                    <View style={styles.leaveSummaryDivider} />
                    <View style={styles.leaveSummaryCol}>
                      <Text style={[styles.leaveSummaryVal, { color: '#111827' }]}>
                        {details.totalEntitled}d
                      </Text>
                      <Text style={styles.leaveSummaryLabel}>Allowance</Text>
                    </View>
                  </View>

                  {/* Breakdown Cards */}
                  <View style={styles.leaveGrid}>
                    {/* Casual Leave */}
                    <View style={styles.leaveCard}>
                      <View style={styles.leaveCardHeader}>
                        <Text style={styles.leaveCardTitle}>Casual Leave (CL)</Text>
                      </View>
                      <View style={styles.leaveNumbersRow}>
                        <View>
                          <Text style={styles.leaveValNum}>{details.clTaken}</Text>
                          <Text style={styles.leaveSubText}>Taken</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.leaveValNum}>{details.clAvailable}</Text>
                          <Text style={styles.leaveSubText}>Available</Text>
                        </View>
                      </View>
                      <View style={styles.leaveProgressBarBg}>
                        <View
                          style={[
                            styles.leaveProgressBarFill,
                            { width: `${Math.round((details.clTaken / details.clTotal) * 100)}%` },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Sick Leave */}
                    <View style={styles.leaveCard}>
                      <View style={styles.leaveCardHeader}>
                        <Text style={styles.leaveCardTitle}>Sick Leave (SL)</Text>
                      </View>
                      <View style={styles.leaveNumbersRow}>
                        <View>
                          <Text style={styles.leaveValNum}>{details.slTaken}</Text>
                          <Text style={styles.leaveSubText}>Taken</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.leaveValNum}>{details.slAvailable}</Text>
                          <Text style={styles.leaveSubText}>Available</Text>
                        </View>
                      </View>
                      <View style={styles.leaveProgressBarBg}>
                        <View
                          style={[
                            styles.leaveProgressBarFill,
                            { width: `${Math.round((details.slTaken / details.slTotal) * 100)}%` },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Earned Leave */}
                    <View style={styles.leaveCard}>
                      <View style={styles.leaveCardHeader}>
                        <Text style={styles.leaveCardTitle}>Earned Leave (EL)</Text>
                      </View>
                      <View style={styles.leaveNumbersRow}>
                        <View>
                          <Text style={styles.leaveValNum}>{details.elTaken}</Text>
                          <Text style={styles.leaveSubText}>Taken</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.leaveValNum}>{details.elAvailable}</Text>
                          <Text style={styles.leaveSubText}>Available</Text>
                        </View>
                      </View>
                      <View style={styles.leaveProgressBarBg}>
                        <View
                          style={[
                            styles.leaveProgressBarFill,
                            { width: `${Math.round((details.elTaken / details.elTotal) * 100)}%` },
                          ]}
                        />
                      </View>
                    </View>

                    {/* On Duty Leave */}
                    <View style={styles.leaveCard}>
                      <View style={styles.leaveCardHeader}>
                        <Text style={styles.leaveCardTitle}>On-Duty Leave (OD)</Text>
                      </View>
                      <View style={styles.leaveNumbersRow}>
                        <View>
                          <Text style={styles.leaveValNum}>{details.odTaken}</Text>
                          <Text style={styles.leaveSubText}>Taken</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.leaveValNum}>Approved</Text>
                          <Text style={styles.leaveSubText}>Status</Text>
                        </View>
                      </View>
                      <View style={styles.leaveProgressBarBg}>
                        <View
                          style={[
                            styles.leaveProgressBarFill,
                            { width: '100%' },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}


            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => handleCall(selectedStaff.phone)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSecondaryBtnText}>Call Faculty</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => setSelectedStaff(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryBtnText}>Close Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Page Heading (Clean, no description below) */}
      <View style={styles.pageHeaderArea}>
        <Text style={styles.pageHeading}>{title || 'Faculty Directory'}</Text>
      </View>

      {/* 2. Top Search & Filter Bar (Matching Fee Ledger) */}
      <View style={styles.searchSectionWrap}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#F4C430" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search faculty by name, department, or role..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Sub-row: Active Filter Tags & Filter Action Button */}
        <View style={styles.searchSubRow}>
          <View style={styles.filterTagsRow}>
            {hasActiveFilters ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {selectedDepartment !== 'all' && (
                  <View style={styles.activeTagPill}>
                    <Text style={styles.activeTagPillText}>Dept: {selectedDepartment}</Text>
                    <TouchableOpacity onPress={() => setSelectedDepartment('all')}>
                      <Feather name="x" size={12} color="#111827" />
                    </TouchableOpacity>
                  </View>
                )}
                {selectedDesignation !== 'all' && (
                  <View style={styles.activeTagPill}>
                    <Text style={styles.activeTagPillText}>
                      {DESIGNATION_LABELS[selectedDesignation as StaffDesignation] || selectedDesignation}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedDesignation('all')}>
                      <Feather name="x" size={12} color="#111827" />
                    </TouchableOpacity>
                  </View>
                )}
                {statusFilter !== 'all' && (
                  <View style={styles.activeTagPill}>
                    <Text style={styles.activeTagPillText}>
                      {statusFilter === 'present' ? 'Present' : 'Absent'}
                    </Text>
                    <TouchableOpacity onPress={() => setStatusFilter('all')}>
                      <Feather name="x" size={12} color="#111827" />
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            ) : (
              <Text style={styles.filterSummaryText}>
                {filteredStaff.length} faculty members listed
              </Text>
            )}
          </View>

          {/* Filter Button on the Right */}
          <TouchableOpacity
            style={[styles.filterActionBtn, hasActiveFilters && styles.filterActionBtnActive]}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="tune-variant"
              size={18}
              color={hasActiveFilters ? '#000000' : '#4B5563'}
            />
            <Text style={[styles.filterActionBtnText, hasActiveFilters && styles.filterActionBtnTextActive]}>
              Filters
            </Text>
            {hasActiveFilters && <View style={styles.filterActiveDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Filter Modal (Matching Fee Ledger & Homerooms) */}
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
          <View style={styles.filterModalCard}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Faculty</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.filterModalCloseBtn}
              >
                <Feather name="x" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Category 1: Department */}
              <Text style={styles.filterGroupTitle}>DEPARTMENT</Text>
              <View style={styles.filterChipsWrap}>
                {availableDepartments.map((dept) => {
                  const active = selectedDepartment === dept;
                  return (
                    <TouchableOpacity
                      key={dept}
                      style={[styles.modalChip, active && styles.modalChipActive]}
                      onPress={() => setSelectedDepartment(dept)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>
                        {dept === 'all' ? 'All Departments' : dept}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Category 2: Designation / Role */}
              <Text style={[styles.filterGroupTitle, { marginTop: 14 }]}>DESIGNATION / ROLE</Text>
              <View style={styles.filterChipsWrap}>
                {availableDesignations.map((desig) => {
                  const active = selectedDesignation === desig;
                  const label =
                    desig === 'all'
                      ? 'All Designations'
                      : DESIGNATION_LABELS[desig as StaffDesignation] || desig;
                  return (
                    <TouchableOpacity
                      key={desig}
                      style={[styles.modalChip, active && styles.modalChipActive]}
                      onPress={() => setSelectedDesignation(desig)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Category 3: Attendance Status (all, present, absent) - Last Category */}
              <Text style={[styles.filterGroupTitle, { marginTop: 14 }]}>ATTENDANCE STATUS</Text>
              <View style={styles.filterChipsWrap}>
                {[
                  { key: 'all' as const, label: `All (${activeStaffList.length})` },
                  { key: 'present' as const, label: `Present (${presentCount})` },
                  { key: 'absent' as const, label: `Absent (${absentCount})` },
                ].map((item) => {
                  const active = statusFilter === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.modalChip, active && styles.modalChipActive]}
                      onPress={() => setStatusFilter(item.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>
                        {item.label}
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
                onPress={resetAllFilters}
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

      {/* 4. Faculty Detail Dossier Modal */}
      {renderFacultyModal()}

      {/* 5. Faculty Cards Roster Grouped Department-Wise */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F4C430']} />}
        showsVerticalScrollIndicator={false}
      >
        {isPageLoading ? (
          <View style={styles.inPageLoaderWrap}>
            <ActivityIndicator size="large" color="#F4C430" />
            <Text style={styles.inPageLoaderText}>Loading Faculty Records...</Text>
          </View>
        ) : (
          <>
            {departmentSections.map((section) => (
          <View key={section.department} style={styles.deptSectionWrap}>
            <View style={styles.deptHeaderRow}>
              <View style={styles.deptHeaderLeft}>
                <View style={styles.deptHeaderIconWrap}>
                  <Feather
                    name={getDepartmentIcon(section.department)}
                    size={12}
                    color="#111827"
                  />
                </View>
                <Text style={styles.deptHeaderTitle}>{section.department}</Text>
              </View>
              <View style={styles.deptCountPill}>
                <Text style={styles.deptCountText}>
                  {section.staff.length} {section.staff.length === 1 ? 'Faculty' : 'Faculties'}
                </Text>
              </View>
            </View>

            <View style={styles.cardsGrid}>
              {section.staff.map((staff) => {
                const badgeColor =
                  DESIGNATION_BADGE_COLORS[staff.designation] || {
                    bg: '#F3F4F6',
                    text: '#374151',
                    border: '#E5E7EB',
                  };
                const isPresent = staff.attendanceToday === 'present';
                const details = getFacultyDossierDetails(staff);

                return (
                  <TouchableOpacity
                    key={staff.id}
                    style={[styles.card, { width: cardWidth }]}
                    onPress={() => {
                      setSelectedStaff(staff);
                      setStaffModalTab('biodata');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.avatarWrap}>
                        <Text style={styles.avatarText}>{staff.fullName.slice(0, 2).toUpperCase()}</Text>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: isPresent ? '#10B981' : '#EF4444' },
                          ]}
                        />
                      </View>

                      <View style={styles.staffMainInfo}>
                        <Text style={styles.staffName} numberOfLines={1}>
                          {staff.fullName}
                        </Text>
                        <Text style={styles.staffEmpId}>{details.empId}</Text>
                      </View>

                      {/* Quick Phone & Email Actions */}
                      <View style={styles.quickContactRow}>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleCall(staff.phone);
                          }}
                          activeOpacity={0.7}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Feather name="phone" size={15} color="#000000" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleEmail(staff.email);
                          }}
                          activeOpacity={0.7}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Feather name="mail" size={17} color="#000000" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Role and Department Row */}
                    <View style={styles.metaRow}>
                      <View style={styles.designationBadge}>
                        <Text style={styles.designationText} numberOfLines={1}>
                          {DESIGNATION_LABELS[staff.designation] || staff.designation}
                        </Text>
                      </View>

                      <Text style={styles.metaDot}>·</Text>

                      <View style={styles.deptPill}>
                        <Text style={styles.deptPillText} numberOfLines={1}>
                          {staff.department || 'Faculty'}
                        </Text>
                      </View>
                    </View>

                    {/* Class Advisor & Quick Leaves strip */}
                    <View style={styles.cardBottomRow}>
                      <View style={{ flex: 1, marginRight: 6 }}>
                        {staff.assignedClass ? (
                          <Text style={styles.cardClassAdvisorText} numberOfLines={1}>
                            Class Teacher: <Text style={{ fontFamily: FontFamily.bold }}>{staff.assignedClass}</Text>
                          </Text>
                        ) : (
                          <Text style={styles.cardExpText} numberOfLines={1}>
                            {staff.experienceYears || 8} yrs exp · {staff.qualification?.split(' ')[0] || 'Ph.D.'}
                          </Text>
                        )}
                      </View>

                      <View style={styles.cardLeavesBadge}>
                        <Text style={styles.cardLeavesBadgeText}>
                          Leaves Available: <Text style={{ fontFamily: FontFamily.bold, color: '#111827' }}>{details.totalAvailable}d</Text>
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
            ))}

            {renderPaginationControls()}

            {filteredStaff.length === 0 && (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="account-search" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No faculty members found</Text>
                <Text style={styles.emptySub}>Try adjusting your search query or active filters</Text>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={resetAllFilters} style={styles.emptyResetBtn}>
                    <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  pageHeaderArea: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  pageHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: '#111827',
  },

  // Search Section (Matching Fee Ledger)
  searchSectionWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 8,
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
    gap: 10,
  },
  filterTagsRow: {
    flex: 1,
  },
  activeTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#F4C430',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeTagPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#000000',
  },
  filterSummaryText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  filterActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterActionBtnActive: {
    backgroundColor: '#FEF9C3',
    borderColor: '#F4C430',
  },
  filterActionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#4B5563',
  },
  filterActionBtnTextActive: {
    color: '#000000',
  },
  filterActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
    marginLeft: 2,
  },

  // Filter Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  filterModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterModalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
  },
  filterModalCloseBtn: {
    padding: 4,
  },
  filterGroupTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
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
    alignItems: 'center',
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

  // Faculty Roster Cards
  list: {
    flex: 1,
  },
  listContent: {
    padding: 14,
    paddingBottom: 30,
  },
  deptSectionWrap: {
    marginBottom: 20,
  },
  deptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
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
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#000000',
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  staffMainInfo: {
    flex: 1,
  },
  staffName: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
  },
  staffEmpId: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  quickContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaDot: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#9CA3AF',
  },
  designationBadge: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  designationText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#000000',
  },
  deptPill: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  deptPillText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#000000',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cardClassAdvisorText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#111827',
  },
  cardExpText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
  },
  cardLeavesBadge: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  cardLeavesBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#16A34A',
  },

  // Faculty Detail Dossier Modal
  staffModalCard: {
    width: '100%',
    maxWidth: 760,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    flexDirection: 'column',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    position: 'relative',
    flexShrink: 0,
  },
  modalAvatarText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#000000',
  },
  modalStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modalStaffName: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  modalEmpIdBadge: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
  },
  modalMetaDivider: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#9CA3AF',
    marginHorizontal: 1,
  },
  modalDeptText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: '#4B5563',
    flexShrink: 1,
  },
  modalEmpIdText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
    marginTop: 2,
  },
  modalClassText: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  designationBadgeSmall: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  designationTextSmall: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#000000',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    flexShrink: 0,
    marginLeft: 6,
  },
  modalTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    flexShrink: 0,
    height: 44,
  },
  modalTabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2.5,
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
    width: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
    padding: 14,
    paddingBottom: 22,
  },
  dossierSection: {
    gap: 12,
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
    fontSize: 13,
    color: '#000000',
  },
  dossierEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    marginTop: 2,
  },
  dossierEmailVal: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#111827',
  },

  // Attendance & Leaves Styles
  attendanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  attBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  attBannerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  attBannerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  attBannerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  attBannerRight: {
    alignItems: 'flex-end',
  },
  attRateNumber: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#111827',
  },
  attRateLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    color: '#6B7280',
    textTransform: 'uppercase',
  },

  leaveSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leaveSummaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  leaveSummaryVal: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
  },
  leaveSummaryLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  leaveSummaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  leaveGrid: {
    gap: 10,
  },
  leaveCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  leaveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaveCardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },
  leaveQuotaText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
  },
  leaveNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leaveValNum: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  leaveValNumRed: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  leaveValNumGreen: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  leaveSubText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#6B7280',
  },
  leaveProgressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  leaveProgressBarFill: {
    height: '100%',
    backgroundColor: '#F4C430',
    borderRadius: 3,
  },



  // Modal Footer Actions
  modalFooterActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexShrink: 0,
  },
  modalSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalSecondaryBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },
  modalPrimaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#F4C430',
  },
  modalPrimaryBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#000000',
  },

  // Empty state
  emptyWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#374151',
    marginTop: 12,
  },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  emptyResetBtn: {
    marginTop: 14,
    backgroundColor: '#F4C430',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyResetBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#000000',
  },

  // Faculty Schedule Styles
  scheduleDaySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
    marginBottom: 12,
  },
  scheduleDayChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleDayChipActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  scheduleDayChipText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#4B5563',
  },
  scheduleDayChipTextActive: {
    color: '#FFFFFF',
  },
  scheduleTodayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F4C430',
    marginTop: 2,
  },
  scheduleHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  scheduleHeaderTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },
  scheduleHeaderSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  scheduleCountBadge: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  scheduleCountBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#111827',
  },
  emptyScheduleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 8,
  },
  emptyScheduleTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#374151',
  },
  emptyScheduleSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 320,
  },
  schedulePeriodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  schedulePeriodCardOngoing: {
    borderColor: '#F4C430',
    borderWidth: 1.5,
    backgroundColor: '#FEF9C3',
  },
  schedulePeriodTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  schedulePeriodTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  schedulePeriodNumBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  schedulePeriodNumText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: '#111827',
  },
  schedulePeriodTimeText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#374151',
  },
  scheduleStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  scheduleStatusText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
  },
  scheduleSubjectTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13.5,
    color: '#111827',
    marginBottom: 6,
  },
  scheduleBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 0,
  },
  schedulePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  schedulePillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#111827',
  },
  scheduleCabinNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEFCE8',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FEF08A',
    marginTop: 6,
  },
  scheduleCabinNoticeTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#854D0E',
  },
  scheduleCabinNoticeSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#A16207',
    marginTop: 2,
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
