import React, { useState, useMemo } from 'react';
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

  const empId = `EMP-${(staff.department?.slice(0, 3) || 'FAC').toUpperCase()}-${(100 + (posHash % 900))}`;
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
  const cabinRoom = `${blockLetter}, Cabin ${100 + (posHash % 250)}`;
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
function normalizeFacultyDepartment(staff: PrincipalStaffMember, index: number): string {
  if (staff.department && staff.department.trim()) {
    return staff.department.trim();
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

export const PrincipalStaffDirectoryView: React.FC<PrincipalStaffDirectoryViewProps> = ({
  staffList,
  refreshing,
  onRefresh,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const maxContentWidth = Math.min(windowWidth, 1200);
  const isDesktop = windowWidth >= 768;
  const isTablet = windowWidth >= 540 && windowWidth < 768;
  const cardGap = 12;
  const cardWidth = isDesktop ? Math.floor((maxContentWidth - 32 - cardGap) / 2) : '100%';
  const modalMaxWidth = isDesktop ? 580 : isTablet ? 500 : Math.min(windowWidth - 24, 440);
  const modalHeight = Math.min(Math.round(windowHeight * 0.86), 660);

  // Active roster data with department normalization
  const activeStaffList = useMemo(() => {
    let rawList: PrincipalStaffMember[] = COMPREHENSIVE_STAFF_ROSTER;
    if (staffList && staffList.length >= 8) {
      rawList = staffList;
    } else if (staffList && staffList.length > 0) {
      const existingIds = new Set(staffList.map((s) => s.id));
      const additions = COMPREHENSIVE_STAFF_ROSTER.filter((s) => !existingIds.has(s.id));
      rawList = [...staffList, ...additions];
    }
    return rawList.map((staff, idx) => ({
      ...staff,
      department: normalizeFacultyDepartment(staff, idx),
    }));
  }, [staffList]);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Faculty Detail Dossier Modal State
  const [selectedStaff, setSelectedStaff] = useState<PrincipalStaffMember | null>(null);
  const [staffModalTab, setStaffModalTab] = useState<'biodata' | 'leaves' | 'workload'>('biodata');

  // Dynamic filter lists - always include all institutional departments
  const availableDepartments = useMemo(() => {
    const set = new Set<string>(INSTITUTION_DEPARTMENTS);
    activeStaffList.forEach((s) => {
      if (s.department && s.department.trim()) {
        set.add(s.department.trim());
      }
    });
    return ['all', ...Array.from(set)];
  }, [activeStaffList]);

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

  // Group filtered staff department-wise
  const departmentSections = useMemo(() => {
    const map = new Map<string, PrincipalStaffMember[]>();
    // Pre-populate with standard institutional departments
    INSTITUTION_DEPARTMENTS.forEach((dept) => map.set(dept, []));

    filteredStaff.forEach((staff) => {
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
  }, [filteredStaff]);

  const presentCount = activeStaffList.filter((s) => s.attendanceToday === 'present').length;
  const absentCount = activeStaffList.filter((s) => s.attendanceToday !== 'present').length;

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
              { width: modalMaxWidth, maxWidth: modalMaxWidth, height: modalHeight },
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
                  <Text style={styles.modalStaffName} numberOfLines={1}>
                    {selectedStaff.fullName}
                  </Text>
                  <Text style={styles.modalEmpIdText} numberOfLines={1}>
                    {details.empId} · {selectedStaff.department || 'Faculty'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <View style={styles.designationBadgeSmall}>
                      <Text style={styles.designationTextSmall}>
                        {DESIGNATION_LABELS[selectedStaff.designation] || selectedStaff.designation}
                      </Text>
                    </View>
                  </View>
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

            {/* Modal Navigation Tabs - Responsive Flex Row */}
            <View style={styles.modalTabBar}>
              {[
                { key: 'biodata' as const, label: 'Bio Data' },
                { key: 'leaves' as const, label: 'Leaves' },
                { key: 'workload' as const, label: 'Workload' },
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
                  <Text style={styles.dossierSectionTitle}>BIO DATA</Text>

                  <View style={styles.dossierGrid}>
                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Full Name</Text>
                      <Text style={styles.dossierVal}>{selectedStaff.fullName}</Text>
                    </View>

                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Employee Code</Text>
                      <Text style={[styles.dossierVal, { fontFamily: FontFamily.bold }]}>
                        {details.empId}
                      </Text>
                    </View>

                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Designation</Text>
                      <Text style={styles.dossierVal}>
                        {DESIGNATION_LABELS[selectedStaff.designation] || selectedStaff.designation}
                      </Text>
                    </View>

                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Department</Text>
                      <Text style={styles.dossierVal}>{selectedStaff.department || 'Not Assigned'}</Text>
                    </View>

                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Highest Qualification</Text>
                      <Text style={styles.dossierVal}>
                        {selectedStaff.qualification || 'M.Tech / Ph.D.'}
                      </Text>
                    </View>

                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Teaching Experience</Text>
                      <Text style={styles.dossierVal}>
                        {selectedStaff.experienceYears || 8} Years
                      </Text>
                    </View>

                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Date of Joining</Text>
                      <Text style={styles.dossierVal}>{details.dateOfJoining}</Text>
                    </View>

                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Cabin / Office Room</Text>
                      <Text style={styles.dossierVal}>{details.cabinRoom}</Text>
                    </View>

                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Official Email</Text>
                      <TouchableOpacity
                        onPress={() => handleEmail(selectedStaff.email)}
                        style={styles.dossierEmailBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dossierEmailVal} numberOfLines={1}>
                          {selectedStaff.email}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Direct Contact</Text>
                      <TouchableOpacity
                        onPress={() => handleCall(selectedStaff.phone)}
                        style={styles.dossierPhoneBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dossierPhoneVal}>
                          {selectedStaff.phone || '+91 98450 00000'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* TAB 2: LEAVES & ATTENDANCE */}
              {staffModalTab === 'leaves' && (
                <View style={styles.dossierSection}>
                  <Text style={styles.dossierSectionTitle}>TODAY'S CAMPUS ATTENDANCE</Text>

                  {/* Today's Punch Banner */}
                  <View
                    style={[
                      styles.attendanceBanner,
                      {
                        backgroundColor: isPresent ? '#F0FDF4' : '#FEF2F2',
                        borderColor: isPresent ? '#BBF7D0' : '#FECACA',
                      },
                    ]}
                  >
                    <View style={styles.attBannerLeft}>
                      <View
                        style={[
                          styles.attBannerDot,
                          { backgroundColor: isPresent ? '#16A34A' : '#DC2626' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.attBannerTitle,
                          { color: isPresent ? '#166534' : '#991B1B' },
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
                  <View style={styles.leaveSummaryBox}>
                    <View style={styles.leaveSummaryCol}>
                      <Text style={[styles.leaveSummaryVal, { color: '#DC2626' }]}>
                        {details.totalTaken}d
                      </Text>
                      <Text style={styles.leaveSummaryLabel}>Taken</Text>
                    </View>
                    <View style={styles.leaveSummaryDivider} />
                    <View style={styles.leaveSummaryCol}>
                      <Text style={[styles.leaveSummaryVal, { color: '#16A34A' }]}>
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
                          <Text style={styles.leaveValNumRed}>{details.clTaken}</Text>
                          <Text style={styles.leaveSubText}>Taken</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.leaveValNumGreen}>{details.clAvailable}</Text>
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
                          <Text style={styles.leaveValNumRed}>{details.slTaken}</Text>
                          <Text style={styles.leaveSubText}>Taken</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.leaveValNumGreen}>{details.slAvailable}</Text>
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
                          <Text style={styles.leaveValNumRed}>{details.elTaken}</Text>
                          <Text style={styles.leaveSubText}>Taken</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.leaveValNumGreen}>{details.elAvailable}</Text>
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
                          <Text style={[styles.leaveValNumRed, { color: '#2563EB' }]}>
                            {details.odTaken}
                          </Text>
                          <Text style={styles.leaveSubText}>Taken</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.leaveValNumGreen, { color: '#16A34A' }]}>Approved</Text>
                          <Text style={styles.leaveSubText}>Status</Text>
                        </View>
                      </View>
                      <View style={styles.leaveProgressBarBg}>
                        <View
                          style={[
                            styles.leaveProgressBarFill,
                            { width: '100%', backgroundColor: '#3B82F6' },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* TAB 3: WORKLOAD & CLASSES */}
              {staffModalTab === 'workload' && (
                <View style={styles.dossierSection}>
                  <Text style={styles.dossierSectionTitle}>WORKLOAD</Text>

                  <View style={styles.dossierGrid}>
                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Class Advisor / Homeroom</Text>
                      <Text style={[styles.dossierVal, { fontFamily: FontFamily.bold, color: '#166534' }]}>
                        {selectedStaff.assignedClass || 'No Homeroom Class Assigned'}
                      </Text>
                    </View>

                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Weekly Teaching Load</Text>
                      <Text style={styles.dossierVal}>{details.weeklyHours} Hours / Week</Text>
                    </View>

                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Mentorship Batch</Text>
                      <Text style={styles.dossierVal}>{details.menteesCount} Students Assigned</Text>
                    </View>

                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierLabel}>Cabin Consultation</Text>
                      <Text style={styles.dossierVal}>Mon, Wed, Fri (03:30 PM - 05:00 PM)</Text>
                    </View>
                  </View>

                  <Text style={[styles.dossierSectionTitle, { marginTop: 14 }]}>
                    SUBJECTS
                  </Text>

                  <View style={styles.subjectsWrap}>
                    {(selectedStaff.assignedSubjects && selectedStaff.assignedSubjects.length > 0
                      ? selectedStaff.assignedSubjects
                      : ['Advanced Course Specialization', 'Laboratory Practical Session']
                    ).map((subj, idx) => (
                      <View key={idx} style={styles.subjectPillItem}>
                        <Text style={styles.subjectPillItemText}>{subj}</Text>
                      </View>
                    ))}
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
        <Text style={styles.pageHeading}>Faculty Directory</Text>
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
              >
                <Text style={styles.filterResetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterApplyBtn}
                onPress={() => setFilterModalVisible(false)}
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
        {departmentSections.map((section) => (
          <View key={section.department} style={styles.deptSectionWrap}>
            <View style={styles.deptHeaderRow}>
              <Text style={styles.deptHeaderTitle}>{section.department}</Text>
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
                        {staff.phone && (
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
                        )}
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
                          Leaves Available: <Text style={{ fontFamily: FontFamily.bold, color: '#16A34A' }}>{details.totalAvailable}d</Text>
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  filterResetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterResetText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#6B7280',
  },
  filterApplyBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
    color: '#166534',
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
    maxWidth: 680,
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
    position: 'relative',
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
  modalEmpIdText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
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
  },
  modalTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    flexGrow: 0,
    flexShrink: 0,
    height: 46,
  },
  modalTabBtn: {
    flex: 1,
    height: 46,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  dossierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dossierLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#6B7280',
    flexShrink: 0,
    marginRight: 8,
  },
  dossierVal: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#111827',
    textAlign: 'right',
    flex: 1,
  },
  dossierPhoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  dossierPhoneVal: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#16A34A',
    includeFontPadding: false,
  },
  dossierEmailBtn: {
    alignItems: 'flex-end',
    maxWidth: '65%',
  },
  dossierEmailVal: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: '#0284C7',
    textAlign: 'right',
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
  leaveValNumRed: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#DC2626',
  },
  leaveValNumGreen: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#16A34A',
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
    backgroundColor: '#EF4444',
    borderRadius: 3,
  },

  // Workload tab
  subjectsWrap: {
    gap: 8,
  },
  subjectPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  subjectPillItemText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#854D0E',
  },

  // Modal Footer Actions
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
    color: '#111827',
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
});
