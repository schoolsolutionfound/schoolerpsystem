import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  FlatList,
  Modal,
  Alert,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { StudentFeeRecord, HomeroomSection } from '../types/principal.types';
import {
  MOCK_STUDENT_FEES,
  generateAllInstitutionalStudentFees,
} from '../constants/feeLedgerData';
import { DEFAULT_INSTITUTION_CLASSES } from '../constants/defaultClasses';
import {
  FeeConcessionModal,
  FeeConcessionPayload,
} from '../../shared/components/FeeConcessionModal';
import { useUserStore } from '../../../store/useUserStore';

// Detection helper functions shared with PrincipalHomeroomsView
function detectClassDepartment(sec: { department?: string; name?: string; roomNumber?: string }): string {
  if (sec.department && sec.department.trim().length > 0) {
    const d = sec.department.toLowerCase();
    if (d.includes('cse') || d.includes('computer')) return 'Computer Science';
    if (d.includes('ece') || d.includes('electronic')) return 'Electronics & Comm';
    if (d.includes('mech')) return 'Mechanical Eng';
    if (d.includes('civil')) return 'Civil Eng';
    if (d.includes('aiml') || d.includes('ai') || d.includes('machine') || d.includes('artificial')) return 'AIML';
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

function detectClassYear(sec: { name?: string; grade?: string; year?: string }): string {
  const text = `${sec.name || ''} ${sec.grade || ''} ${sec.year || ''}`.toLowerCase();
  if (text.includes('1st') || text.includes('first') || text.includes('1 year')) return '1st Year';
  if (text.includes('2nd') || text.includes('second') || text.includes('2 year')) return '2nd Year';
  if (text.includes('3rd') || text.includes('third') || text.includes('3 year')) return '3rd Year';
  if (text.includes('4th') || text.includes('fourth') || text.includes('4 year')) return '4th Year';
  return sec.grade || sec.year || 'All Years';
}

function detectClassProgram(sec: { name?: string; grade?: string; className?: string }): string {
  const text = `${sec.name || ''} ${sec.grade || ''} ${sec.className || ''}`.toLowerCase();
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

// Intelligent deduplication helpers to avoid repeating department (e.g. AIML), grade (e.g. 2nd Year), etc.
function getCleanSection(rawSection?: string, classTitle?: string): string {
  if (!rawSection) return '';
  const s = rawSection.trim();
  const sLower = s.toLowerCase();
  const titleLower = (classTitle || '').toLowerCase();

  // If section string contains year, grade, tech, dept, or any words in classTitle, ignore it
  if (
    sLower.includes('year') ||
    sLower.includes('grade') ||
    sLower.includes('tech') ||
    sLower.includes('all') ||
    sLower.includes('class') ||
    sLower.includes('aiml') ||
    sLower.includes('cse') ||
    sLower.includes('ece') ||
    sLower.includes('mech') ||
    sLower.includes('civil') ||
    titleLower.includes(sLower)
  ) {
    return '';
  }

  // Strip leading "Sec", "Sec.", "Section"
  const clean = s.replace(/^(section|sec\.?)\s*/i, '').trim().toUpperCase();

  // A genuine section code is typically 1 or 2 characters: e.g. "A", "B", "C", "A1", "B2"
  if (clean.length >= 1 && clean.length <= 3) {
    // If title already has "Sec A" or "Section A", ignore it
    if (
      titleLower.includes(`sec ${clean.toLowerCase()}`) ||
      titleLower.includes(`section ${clean.toLowerCase()}`) ||
      titleLower.includes(`· ${clean.toLowerCase()}`) ||
      titleLower.includes(`- ${clean.toLowerCase()}`)
    ) {
      return '';
    }
    return clean;
  }

  return '';
}

function getClassCardDeduplicatedMeta(item: {
  name: string;
  department: string;
  grade: string;
  program?: string;
  section?: string;
  homeroomTeacherName?: string;
  roomNumber?: string;
  studentCount?: number;
}) {
  const nameLower = (item.name || '').toLowerCase();
  const deptLower = (item.department || '').toLowerCase();

  // 1. Department acronym
  let deptCode = 'APS';
  if (deptLower.includes('aiml') || deptLower.includes('ai') || deptLower.includes('machine') || deptLower.includes('artificial')) {
    deptCode = 'AIML';
  } else if (deptLower.includes('computer') || deptLower.includes('cse')) {
    deptCode = 'CSE';
  } else if (deptLower.includes('electronics') || deptLower.includes('ece') || deptLower.includes('comm')) {
    deptCode = 'ECE';
  } else if (deptLower.includes('mechanical') || deptLower.includes('mech')) {
    deptCode = 'MECH';
  } else if (deptLower.includes('civil')) {
    deptCode = 'CIVIL';
  }

  // Check what is already present in item.name
  const hasDeptInName =
    nameLower.includes(deptCode.toLowerCase()) ||
    (deptLower.length > 0 && nameLower.includes(deptLower));

  const cleanSec = getCleanSection(item.section, item.name);

  // Badge Text:
  // - If department is NOT in the title, show deptCode (e.g. 'AIML' for 'Robotics & Vision')
  // - If department IS in title, show Section only if a genuine section exists (e.g. 'Sec A') and isn't in title
  // - Otherwise, DO NOT show any badge (keeps the card clean and zero-redundancy)
  let badgeText = '';
  if (!hasDeptInName) {
    badgeText = deptCode;
  } else if (cleanSec) {
    badgeText = `Sec ${cleanSec}`;
  }

  // Determine Subtitle Text (under title)
  const subParts: string[] = [];

  // Teacher name is highest value, unique information
  if (item.homeroomTeacherName && !nameLower.includes(item.homeroomTeacherName.toLowerCase())) {
    subParts.push(item.homeroomTeacherName);
  }

  // Room number if available and not in title
  if (item.roomNumber && !nameLower.includes(item.roomNumber.toLowerCase())) {
    subParts.push(`Room: ${item.roomNumber}`);
  }

  // If clean section exists and is not shown on the badge
  if (cleanSec && badgeText !== `Sec ${cleanSec}` && !nameLower.includes(`sec ${cleanSec.toLowerCase()}`)) {
    subParts.push(`Sec ${cleanSec}`);
  }

  // If subtitle has no teacher/room, show clean student count
  if (subParts.length === 0) {
    subParts.push(`${item.studentCount || 0} Students Enrolled`);
  }

  return {
    badgeText,
    subtitle: subParts.join(' · '),
  };
}

function getSelectedClassSubtitle(cls: {
  name?: string;
  department?: string;
  grade?: string;
  section?: string;
  studentCount?: number;
  homeroomTeacherName?: string;
  roomNumber?: string;
}): string {
  const titleLower = (cls.name || '').toLowerCase();
  const cleanSec = getCleanSection(cls.section, cls.name);
  const parts: string[] = [`${cls.studentCount || 0} Students`];

  // If there is an authentic section (e.g. 'A' or 'B') not already in the title:
  if (cleanSec && !titleLower.includes(`sec ${cleanSec.toLowerCase()}`)) {
    parts.push(`Sec ${cleanSec}`);
  }

  // Teacher name or room number adds valuable info without repeating department/year
  if (cls.homeroomTeacherName && !titleLower.includes(cls.homeroomTeacherName.toLowerCase())) {
    parts.push(cls.homeroomTeacherName);
  } else if (cls.roomNumber && !titleLower.includes(cls.roomNumber.toLowerCase())) {
    parts.push(`Room ${cls.roomNumber}`);
  }

  return parts.join(' · ');
}

function getStudentDeduplicatedMeta(item: StudentFeeRecord): string {
  const base = (item.className || item.department || '').trim();
  const yr = (item.year || '').trim();
  if (!yr || yr === 'All Years') return base || 'All Years';

  const baseLower = base.toLowerCase();
  const yrLower = yr.toLowerCase();
  const yrNum = yrLower.replace(/[^0-9]/g, '');

  if (
    baseLower.includes(yrLower) ||
    baseLower.includes(yrLower.replace(' year', '')) ||
    baseLower.includes(yrLower.replace(/\./g, '')) ||
    (yrNum && (
      baseLower.includes(`${yrNum}nd`) ||
      baseLower.includes(`${yrNum}st`) ||
      baseLower.includes(`${yrNum}rd`) ||
      baseLower.includes(`${yrNum}th`)
    ))
  ) {
    return base;
  }
  return base ? `${base} · ${yr}` : yr;
}

interface PrincipalFeeLedgerViewProps {
  onBack?: () => void;
  homerooms?: HomeroomSection[];
  lockedDepartment?: string;
}

export const PrincipalFeeLedgerView: React.FC<PrincipalFeeLedgerViewProps> = ({
  onBack,
  homerooms,
  lockedDepartment,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const institutionName = useUserStore((state) => state.institutionName) || 'KIVQUO Institute of Technology';

  const [searchQuery, setSearchQuery] = useState('');

  // Class Selection State (null = show all classes; string = show students of this class)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Filter states - identical categories to PrincipalHomeroomsView + Due/No Due
  const [classDeptFilter, setClassDeptFilter] = useState<string>(
    lockedDepartment ? detectClassDepartment({ department: lockedDepartment }) : 'all'
  );
  const [classYearFilter, setClassYearFilter] = useState<string>('all');
  const [classProgramFilter, setClassProgramFilter] = useState<string>('all');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'all' | 'due' | 'no_due'>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Summary Pop-Up Modal state ('dues' | 'collected' | null)
  const [summaryModalType, setSummaryModalType] = useState<'dues' | 'collected' | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Detail Modal state
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeRecord | null>(null);

  // Modular Fee Concession State
  const [concessionStudent, setConcessionStudent] = useState<StudentFeeRecord | null>(null);

  // State to support live fee updates when concessions are granted
  const [updatedFeeRecords, setUpdatedFeeRecords] = useState<StudentFeeRecord[] | null>(null);

  // All student fee records (from active homerooms or full institutional classes)
  const baseFeeRecords = useMemo(() => {
    if (homerooms && homerooms.length > 0) {
      return generateAllInstitutionalStudentFees(homerooms);
    }
    return MOCK_STUDENT_FEES;
  }, [homerooms]);

  const allFeeRecords = updatedFeeRecords || baseFeeRecords;

  // Active classes (from homerooms prop or DEFAULT_INSTITUTION_CLASSES)
  const activeHomerooms = useMemo(() => {
    if (homerooms && homerooms.length > 0) return homerooms;
    return DEFAULT_INSTITUTION_CLASSES;
  }, [homerooms]);

  // Derived categories matching HomeroomsView
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    activeHomerooms.forEach((h) => {
      const d = detectClassDepartment(h);
      if (d) set.add(d);
    });
    return ['all', ...Array.from(set)];
  }, [activeHomerooms]);

  const availableYears = ['all', '1st Year', '2nd Year', '3rd Year', '4th Year'];
  const availablePrograms = ['all', 'B.Tech', 'M.Tech', 'MBA', 'Diploma'];

  const hasActiveClassFilters =
    classDeptFilter !== 'all' ||
    classYearFilter !== 'all' ||
    classProgramFilter !== 'all' ||
    feeStatusFilter !== 'all';

  // Class-wise summary calculations
  const classSummaries = useMemo(() => {
    return activeHomerooms.map((sec) => {
      const dept = detectClassDepartment(sec);
      const grade = detectClassYear(sec);
      const program = detectClassProgram(sec);

      const students = allFeeRecords.filter(
        (s) =>
          s.classId === sec.id ||
          s.className === sec.name ||
          (detectClassDepartment(s) === dept && detectClassYear(s) === grade)
      );

      let totalFee = 0;
      let totalPaid = 0;
      let totalDue = 0;
      let dueCount = 0;
      let overdueCount = 0;

      students.forEach((s) => {
        totalFee += s.totalFee;
        totalPaid += s.paidAmount;
        totalDue += s.dueAmount;
        if (s.dueAmount > 0) dueCount++;
        if (s.status === 'overdue') overdueCount++;
      });

      // Sort students inside class: dues first
      const sortedStudents = [...students].sort((a, b) => {
        const aHas = a.dueAmount > 0 ? 1 : 0;
        const bHas = b.dueAmount > 0 ? 1 : 0;
        if (aHas !== bHas) return bHas - aHas;
        return b.dueAmount - a.dueAmount;
      });

      return {
        id: sec.id,
        name: sec.name,
        department: dept,
        grade: grade,
        program: program,
        section: sec.section || 'A',
        studentCount: sortedStudents.length,
        totalFee,
        totalPaid,
        totalDue,
        dueCount,
        overdueCount,
        students: sortedStudents,
        homeroomTeacherName: sec.homeroomTeacherName,
        roomNumber: sec.roomNumber,
      };
    });
  }, [activeHomerooms, allFeeRecords]);

  // Filtered Class List (when viewing classes)
  const filteredClasses = useMemo(() => {
    return classSummaries.filter((cls) => {
      if (classDeptFilter !== 'all' && cls.department !== classDeptFilter) {
        return false;
      }
      if (classYearFilter !== 'all' && cls.grade !== classYearFilter) {
        return false;
      }
      if (classProgramFilter !== 'all' && cls.program !== classProgramFilter) {
        return false;
      }
      if (feeStatusFilter === 'due' && cls.dueCount === 0) {
        return false;
      }
      if (feeStatusFilter === 'no_due' && cls.dueCount > 0) {
        return false;
      }
      return true;
    });
  }, [classSummaries, classDeptFilter, classYearFilter, classProgramFilter, feeStatusFilter]);

  // Selected Class object
  const selectedClass = useMemo(() => {
    if (!selectedClassId) return null;
    return classSummaries.find((c) => c.id === selectedClassId) || null;
  }, [selectedClassId, classSummaries]);

  // Students in selected class (filtered by search if query entered)
  const selectedClassStudents = useMemo(() => {
    if (!selectedClass) return [];
    let list = selectedClass.students;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q)
      );
    }
    if (feeStatusFilter === 'due') {
      list = list.filter((s) => s.dueAmount > 0);
    } else if (feeStatusFilter === 'no_due') {
      list = list.filter((s) => s.dueAmount === 0);
    }
    return list;
  }, [selectedClass, searchQuery, feeStatusFilter]);

  // Search Results across institution by USN / Roll number or Student Name
  const searchFilteredStudents = useMemo(() => {
    if (searchQuery.trim().length === 0) return [];
    const q = searchQuery.toLowerCase().trim();

    let list = allFeeRecords.filter((student) => {
      const matchesRoll = student.rollNumber.toLowerCase().includes(q);
      const matchesName = student.studentName.toLowerCase().includes(q);
      return matchesRoll || matchesName;
    });

    if (classDeptFilter !== 'all') {
      list = list.filter((s) => detectClassDepartment(s) === classDeptFilter);
    }
    if (classYearFilter !== 'all') {
      list = list.filter((s) => detectClassYear(s) === classYearFilter);
    }
    if (classProgramFilter !== 'all') {
      list = list.filter((s) => detectClassProgram(s) === classProgramFilter);
    }
    if (feeStatusFilter === 'due') {
      list = list.filter((s) => s.dueAmount > 0);
    } else if (feeStatusFilter === 'no_due') {
      list = list.filter((s) => s.dueAmount === 0);
    }

    return list.sort((a, b) => {
      const aHas = a.dueAmount > 0 ? 1 : 0;
      const bHas = b.dueAmount > 0 ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      return b.dueAmount - a.dueAmount;
    });
  }, [allFeeRecords, searchQuery, classDeptFilter, classYearFilter, classProgramFilter, feeStatusFilter]);

  // Summary Metrics calculated from active dataset
  const stats = useMemo(() => {
    let totalDue = 0;
    let totalPaid = 0;
    let dueCount = 0;
    let paidCount = 0;

    allFeeRecords.forEach((s) => {
      totalDue += s.dueAmount;
      totalPaid += s.paidAmount;
      if (s.dueAmount > 0) {
        dueCount++;
      }
      if (s.paidAmount > 0) {
        paidCount++;
      }
    });

    return { totalDue, totalPaid, dueCount, paidCount, totalStudents: allFeeRecords.length };
  }, [allFeeRecords]);

  // Computed list for the summary pop-up modal
  const summaryModalList = useMemo(() => {
    if (!summaryModalType) return [];
    const source =
      summaryModalType === 'dues'
        ? allFeeRecords.filter((s) => s.dueAmount > 0)
        : allFeeRecords.filter((s) => s.paidAmount > 0);

    if (modalSearchQuery.trim().length === 0) return source;

    const q = modalSearchQuery.toLowerCase().trim();
    return source.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
    );
  }, [allFeeRecords, summaryModalType, modalSearchQuery]);

  // Broadcast reminder to ALL overdue students
  const handleRemindAll = () => {
    Alert.alert(
      'Remind All Students with Dues',
      `Send automated payment reminder SMS & WhatsApp notifications to all ${stats.dueCount} students with outstanding balances?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Send to All (${stats.dueCount})`,
          onPress: () => {
            Alert.alert(
              'Reminders Dispatched',
              `Fee reminder broadcast successfully sent to all ${stats.dueCount} students and parent contacts.`
            );
          },
        },
      ]
    );
  };

  // Handle granting fee concession & live update
  const handleApplyConcession = (payload: FeeConcessionPayload) => {
    const updatedList = (updatedFeeRecords || [...allFeeRecords]).map((student) => {
      if (student.id === payload.studentId) {
        const updatedTotal = Math.max(0, student.totalFee - payload.concessionAmount);
        const updatedDue = payload.newDue;
        return {
          ...student,
          totalFee: updatedTotal,
          dueAmount: updatedDue,
          status: (updatedDue === 0 ? 'paid' : student.status) as 'due' | 'paid' | 'overdue',
          dueDate: updatedDue === 0 ? 'Completed (Concession)' : student.dueDate,
        };
      }
      return student;
    });

    setUpdatedFeeRecords(updatedList);
  };

  const renderClassCard = ({ item }: { item: (typeof classSummaries)[0] }) => {
    const hasDues = item.totalDue > 0;
    const { badgeText, subtitle } = getClassCardDeduplicatedMeta(item);

    return (
      <TouchableOpacity
        style={styles.classCard}
        onPress={() => setSelectedClassId(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.classCardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.classCardTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.classCardSubtitle}>
              {subtitle}
            </Text>
          </View>
          {badgeText ? (
            <View style={styles.classDeptBadge}>
              <Text style={styles.classDeptBadgeText}>
                {badgeText}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.classCardDivider} />

        <View style={styles.classCardStatsRow}>
          <View style={styles.classStatItem}>
            <Text style={styles.classStatLabel}>STUDENTS</Text>
            <Text style={styles.classStatValue}>{item.studentCount}</Text>
          </View>

          <View style={styles.classStatDivider} />

          <View style={styles.classStatItem}>
            <Text style={styles.classStatLabel}>COLLECTED</Text>
            <Text style={styles.classStatValue}>
              ₹
              {item.totalPaid >= 100000
                ? `${(item.totalPaid / 100000).toFixed(1)}L`
                : item.totalPaid.toLocaleString()}
            </Text>
          </View>

          <View style={styles.classStatDivider} />

          <View style={styles.classStatItem}>
            <Text style={styles.classStatLabel}>OUTSTANDING</Text>
            <Text
              style={[
                styles.classStatValue,
                { color: hasDues ? '#D97706' : '#6B7280' },
              ]}
            >
              {hasDues
                ? `₹${
                    item.totalDue >= 100000
                      ? `${(item.totalDue / 100000).toFixed(1)}L`
                      : item.totalDue.toLocaleString()
                  }`
                : '₹0'}
            </Text>
          </View>
        </View>

        <View style={styles.classCardFooter}>
          <Text style={styles.classCardDueCount}>
            {item.dueCount > 0 ? `${item.dueCount} students with dues` : 'All dues cleared'}
          </Text>
          <View style={styles.classViewBtn}>
            <Text style={styles.classViewBtnText}>View Ledger</Text>
            <Feather name="chevron-right" size={14} color="#374151" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStudentCard = ({ item }: { item: StudentFeeRecord }) => {
    const hasDue = item.dueAmount > 0;
    const studentSubtitle = isClassSelected
      ? (item.contactPhone ? `Parent: ${item.guardianName || 'Contact'} · ${item.contactPhone}` : item.guardianName || '')
      : getStudentDeduplicatedMeta(item);

    return (
      <TouchableOpacity
        style={styles.studentCard}
        onPress={() => setSelectedStudent(item)}
        activeOpacity={0.7}
      >
        {/* Top Header: Student info & Due status */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.studentInfoCol}>
            <View style={styles.nameRow}>
              <Text style={styles.studentNameText}>{item.studentName}</Text>
              <View style={styles.rollBadge}>
                <Text style={styles.rollBadgeText}>{item.rollNumber}</Text>
              </View>
            </View>
            {studentSubtitle ? (
              <Text style={styles.studentMetaText}>
                {studentSubtitle}
              </Text>
            ) : null}
          </View>

          <View
            style={[
              styles.statusBadge,
              hasDue ? styles.statusBadgeDue : styles.statusBadgePaid,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                hasDue ? styles.statusTextDue : styles.statusTextPaid,
              ]}
            >
              {hasDue ? 'DUE' : 'PAID'}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Financial Overview Figures (Shortened Space, Neutral Colors) */}
        <View style={styles.feeFiguresRow}>
          <View style={styles.feeCol}>
            <Text style={styles.feeLabel}>TOTAL FEE</Text>
            <Text style={styles.feeValue}>₹{item.totalFee.toLocaleString()}</Text>
          </View>

          <View style={styles.feeColDivider} />

          <View style={styles.feeCol}>
            <Text style={styles.feeLabel}>PAID</Text>
            <Text style={styles.feeValue}>
              ₹{item.paidAmount.toLocaleString()}
            </Text>
          </View>

          <View style={styles.feeColDivider} />

          <View style={styles.feeCol}>
            <Text style={styles.feeLabel}>OUTSTANDING</Text>
            <Text
              style={[
                styles.feeValue,
                { color: hasDue ? '#DC2626' : '#111827' },
              ]}
            >
              {hasDue ? `₹${item.dueAmount.toLocaleString()}` : '₹0'}
            </Text>
          </View>
        </View>

        {/* Bottom Action Footer */}
        <View style={styles.cardFooterRow}>
          <View style={styles.dateMeta}>
            <Text style={styles.dateMetaText}>
              {hasDue ? `Due: ${item.dueDate}` : `Paid: ${item.lastPaymentDate || 'Aug 2026'}`}
            </Text>
          </View>

          {hasDue && (
            <TouchableOpacity
              style={styles.concessionBtn}
              onPress={() => setConcessionStudent(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.concessionBtnText}>Grant Concession</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const isSearching = searchQuery.trim().length > 0;
  const isClassSelected = !isSearching && selectedClassId !== null;

  // Active list data and rendering depending on mode
  const activeListData: any[] = isSearching
    ? searchFilteredStudents
    : isClassSelected
    ? selectedClassStudents
    : filteredClasses;

  return (
    <View style={styles.container}>
      {/* 1. Header (Flush left, zero back button) */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Fee Ledger</Text>
        </View>
      </View>

      <FlatList
        data={activeListData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (isSearching || isClassSelected) {
            return renderStudentCard({ item: item as StudentFeeRecord });
          }
          return renderClassCard({ item: item as (typeof classSummaries)[0] });
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={7}
        removeClippedSubviews={true}
        ListHeaderComponent={
          <>
            {/* 2. SUMMARY STAT CARDS */}
            <View style={styles.summaryContainer}>
              <TouchableOpacity
                style={styles.summaryCard}
                onPress={() => {
                  setModalSearchQuery('');
                  setSummaryModalType('dues');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.summaryValText, { color: '#D97706' }]}>
                  {stats.totalDue >= 10000000
                    ? `₹${(stats.totalDue / 10000000).toFixed(2)}Cr`
                    : stats.totalDue >= 100000
                    ? `₹${(stats.totalDue / 100000).toFixed(1)}L`
                    : `₹${(stats.totalDue / 1000).toFixed(0)}k`}
                </Text>
                <Text style={styles.summaryLabelText}>Total Dues</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.summaryCard}
                onPress={() => {
                  setModalSearchQuery('');
                  setSummaryModalType('collected');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.summaryValText, { color: '#111827' }]}>
                  {stats.totalPaid >= 10000000
                    ? `₹${(stats.totalPaid / 10000000).toFixed(2)}Cr`
                    : `₹${(stats.totalPaid / 100000).toFixed(1)}L`}
                </Text>
                <Text style={styles.summaryLabelText}>Collected</Text>
              </TouchableOpacity>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryValText}>{stats.totalStudents.toLocaleString()}</Text>
                <Text style={styles.summaryLabelText}>Total Students</Text>
              </View>
            </View>

            {/* BROADCAST REMINDER ACTION */}
            {stats.dueCount > 0 && (
              <TouchableOpacity
                style={styles.remindAllBannerBtn}
                onPress={handleRemindAll}
                activeOpacity={0.8}
              >
                <Text style={styles.remindAllBannerBtnText}>
                  Remind All Students with Dues ({stats.dueCount})
                </Text>
              </TouchableOpacity>
            )}

            {/* 3. SEARCH BAR */}
            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={20} color="#F4C430" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by USN or Name"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
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
                    {feeStatusFilter !== 'all' && (
                      <View style={styles.activeTagPill}>
                        <Text style={styles.activeTagPillText}>
                          {feeStatusFilter === 'due' ? 'With Dues' : 'No Dues'}
                        </Text>
                        <TouchableOpacity onPress={() => setFeeStatusFilter('all')}>
                          <Feather name="x" size={12} color="#111827" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </ScrollView>
                ) : (
                  <Text style={styles.filterSummaryText}>
                    {filteredClasses.length} classes available
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

            {/* Mode 1: Searching by USN or Name */}
            {isSearching && (
              <View style={styles.searchResultsBanner}>
                <Text style={styles.searchResultsText}>
                  Showing {searchFilteredStudents.length} results for "{searchQuery}"
                </Text>
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchLink}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Mode 2: Particular Class Selected */}
            {isClassSelected && selectedClass && (
              <View style={styles.selectedClassBanner}>
                <TouchableOpacity
                  style={styles.backToClassesBtn}
                  onPress={() => setSelectedClassId(null)}
                  activeOpacity={0.7}
                >
                  <Feather name="arrow-left" size={16} color="#111827" />
                  <Text style={styles.backToClassesBtnText}>All Classes</Text>
                </TouchableOpacity>

                <View style={styles.selectedClassInfoRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.selectedClassTitle}>{selectedClass.name}</Text>
                    <Text style={styles.selectedClassSubtitle}>
                      {getSelectedClassSubtitle(selectedClass)}
                    </Text>
                  </View>
                  <View style={styles.selectedClassDueBadge}>
                    <Text style={styles.selectedClassDueText}>
                      Due: ₹
                      {selectedClass.totalDue >= 100000
                        ? `${(selectedClass.totalDue / 100000).toFixed(1)}L`
                        : selectedClass.totalDue.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {!isSearching && !isClassSelected && <View style={{ height: 10 }} />}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {isSearching
                ? 'No students found'
                : isClassSelected
                ? 'No students found in this class'
                : 'No classes found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isSearching
                ? `No matching student found for USN or name "${searchQuery}".`
                : 'Try adjusting your search or active filters.'}
            </Text>
            {(searchQuery.length > 0 || hasActiveClassFilters) && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setClassDeptFilter('all');
                  setClassYearFilter('all');
                  setClassProgramFilter('all');
                  setFeeStatusFilter('all');
                }}
                style={styles.emptyResetBtn}
              >
                <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* SUMMARY LIST POPUP MODAL (Scrollable list of pending or collected students) */}
      <Modal
        visible={!!summaryModalType}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSummaryModalType(null);
          setModalSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setSummaryModalType(null);
              setModalSearchQuery('');
            }}
          />
          <View
            style={[
              styles.summaryModalCard,
              isDesktop && styles.summaryModalCardDesktop,
            ]}
          >
            {/* Header */}
            <View style={styles.summaryModalHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.summaryModalTitle}>
                  {summaryModalType === 'dues' ? 'Unpaid Dues' : 'Collected Fees'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSummaryModalType(null);
                    setModalSearchQuery('');
                  }}
                  style={styles.modalCloseBtn}
                >
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* In-Modal Search Input */}
            <View style={styles.modalSearchSection}>
              <TextInput
                style={styles.modalSearchInput}
                placeholder={
                  summaryModalType === 'dues'
                    ? 'Search unpaid students by name, roll, dept...'
                    : 'Search paid students by name, roll, dept...'
                }
                placeholderTextColor="#9CA3AF"
                value={modalSearchQuery}
                onChangeText={setModalSearchQuery}
                autoCorrect={false}
              />
            </View>

            {/* Scrollable list */}
            <FlatList
              data={summaryModalList}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 460 }}
              contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={7}
              removeClippedSubviews={true}
              ListEmptyComponent={
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ fontFamily: FontFamily.medium, color: '#6B7280', fontSize: 13 }}>
                    No students match your query
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isDue = summaryModalType === 'dues';
                return (
                  <TouchableOpacity
                    style={styles.popupStudentItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSummaryModalType(null);
                      setSelectedStudent(item);
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.popupStudentName}>{item.studentName}</Text>
                        <View style={styles.popupRollPill}>
                          <Text style={styles.popupRollText}>{item.rollNumber}</Text>
                        </View>
                      </View>
                      <Text style={styles.popupMetaText}>
                        {getStudentDeduplicatedMeta(item)}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <Text
                        style={[
                          styles.popupAmountText,
                          { color: isDue ? '#D97706' : '#111827' },
                        ]}
                      >
                        ₹{(isDue ? item.dueAmount : item.paidAmount).toLocaleString()}
                      </Text>
                      <Text style={styles.popupStatusText}>
                        {isDue
                          ? `Due ${item.dueDate}`
                          : item.dueAmount === 0
                            ? 'Fully Paid'
                            : `Paid (₹${item.dueAmount.toLocaleString()} Due)`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* REUSABLE MODULAR FEE CONCESSION MODAL */}
      <FeeConcessionModal
        visible={!!concessionStudent}
        student={concessionStudent}
        onClose={() => setConcessionStudent(null)}
        onApplyConcession={handleApplyConcession}
      />

      {/* STUDENT DETAIL MODAL (Zero icons) */}
      <Modal
        visible={!!selectedStudent}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStudent(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedStudent(null)}
        >
          <View style={styles.detailModalCard} onStartShouldSetResponder={() => true}>
            {selectedStudent && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.detailStudentName}>{selectedStudent.studentName}</Text>
                    <Text style={styles.detailStudentRoll}>
                      Roll No: {selectedStudent.rollNumber} · {selectedStudent.year}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedStudent(null)}
                    style={styles.modalCloseBtn}
                  >
                    <Text style={styles.modalCloseBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Department:</Text>
                    <Text style={styles.detailVal}>{selectedStudent.department}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Campus:</Text>
                    <Text style={styles.detailVal}>{selectedStudent.institution}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Guardian:</Text>
                    <Text style={styles.detailVal}>{selectedStudent.guardianName || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailVal}>{selectedStudent.contactPhone || 'N/A'}</Text>
                  </View>

                  <View style={styles.detailFinancialBox}>
                    <View style={styles.detailFinCol}>
                      <Text style={styles.detailFinLabel}>Total Fee</Text>
                      <Text style={styles.detailFinVal}>₹{selectedStudent.totalFee.toLocaleString()}</Text>
                    </View>
                    <View style={styles.detailFinCol}>
                      <Text style={styles.detailFinLabel}>Amount Paid</Text>
                      <Text style={[styles.detailFinVal, { color: '#047857' }]}>
                        ₹{selectedStudent.paidAmount.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.detailFinCol}>
                      <Text style={styles.detailFinLabel}>Due Balance</Text>
                      <Text
                        style={[
                          styles.detailFinVal,
                          { color: selectedStudent.dueAmount > 0 ? '#DC2626' : '#047857' },
                        ]}
                      >
                        ₹{selectedStudent.dueAmount.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {selectedStudent.dueAmount > 0 ? (
                    <View style={styles.detailActionBtnRow}>
                      <TouchableOpacity
                        style={styles.detailConcessionBtn}
                        onPress={() => {
                          const stu = selectedStudent;
                          setSelectedStudent(null);
                          setConcessionStudent(stu);
                        }}
                      >
                        <Text style={styles.detailConcessionBtnText}>Grant Concession</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.clearedBanner}>
                      <Text style={styles.clearedBannerText}>Fee fully settled for this term</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FILTER MODAL */}
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
              <Text style={styles.filterModalTitle}>Filter Classes</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.filterModalCloseBtn}
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
              {/* Fee / Due Status Filter */}
              <Text style={[styles.filterGroupTitle, { marginTop: 14 }]}>DUE / PAYMENT STATUS</Text>
              <View style={styles.filterChipsWrap}>
                {[
                  { key: 'all' as const, label: 'All' },
                  { key: 'due' as const, label: 'Due' },
                  { key: 'no_due' as const, label: 'No Due' },
                ].map((item) => {
                  const active = feeStatusFilter === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.modalChip, active && styles.modalChipActive]}
                      onPress={() => setFeeStatusFilter(item.key)}
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
                onPress={() => {
                  setClassDeptFilter('all');
                  setClassYearFilter('all');
                  setClassProgramFilter('all');
                  setFeeStatusFilter('all');
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#111827',
  },
  headerSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },

  // Summary Metrics Banner (Zero icons, fully responsive)
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    minWidth: 95,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryValText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  summaryLabelText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },
  summaryCardClickable: {
    borderColor: '#E5E7EB',
  },
  summaryTapHint: {
    fontFamily: FontFamily.bold,
    fontSize: 9.5,
    color: '#9CA3AF',
    marginTop: 4,
  },
  remindAllBannerBtn: {
    backgroundColor: '#F4C430',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  remindAllBannerBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13.5,
    color: '#111827',
    letterSpacing: 0.2,
  },
  summaryModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  summaryModalCardDesktop: {
    borderRadius: 20,
    maxWidth: 640,
    width: '92%',
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  summaryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryModalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: '#111827',
  },
  summaryModalSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modalSearchSection: {
    marginTop: 12,
    marginBottom: 10,
  },
  modalSearchInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#111827',
  },
  popupStudentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  popupStudentName: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },
  popupRollPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popupRollText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#4B5563',
  },
  popupMetaText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  popupAmountText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  popupStatusText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#6B7280',
  },


  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 44,
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
    marginBottom: 12,
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
    borderRadius: 5,
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
    borderRadius: 5,
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

  // Search Results Banner
  searchResultsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchResultsText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#1E40AF',
  },
  clearSearchLink: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#1D4ED8',
  },

  // Selected Class Banner
  selectedClassBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  backToClassesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backToClassesBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
  },
  selectedClassInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedClassTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  selectedClassSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  selectedClassDueBadge: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  selectedClassDueText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#D97706',
  },
  summaryCardDownloadBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  modalExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F4C430',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
  },
  modalExportBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#000000',
  },

  // Department Quick Chips
  deptChipsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  deptChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deptChipSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  deptChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#4B5563',
  },
  deptChipTextSelected: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  // List Heading
  listHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 12,
  },
  listHeadingText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
  },
  listSubHeadingText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
  },

  // Class Card
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 10,
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  classCardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
  },
  classCardSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  classDeptBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  classDeptBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#374151',
  },
  classCardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  classCardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  classStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  classStatLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  classStatValue: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
  },
  classStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
  },
  classCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  classCardDueCount: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#6B7280',
  },
  classViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classViewBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#374151',
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
  filterModalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  filterModalCloseBtn: {
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


  // Student Card (Reverted, Space-Shortened, Color-Neutral)
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  studentNameText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
  },
  rollBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rollBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: '#4B5563',
  },
  studentMetaText: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusBadgeDue: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusBadgePaid: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
  },
  statusTextDue: {
    color: '#DC2626',
  },
  statusTextPaid: {
    color: '#16A34A',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 6,
  },
  feeFiguresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feeCol: {
    flex: 1,
    alignItems: 'center',
  },
  feeColDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E5E7EB',
  },
  feeLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: '#9CA3AF',
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  feeValue: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#111827',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  dateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateMetaText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
  },
  cardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  concessionBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 5,
  },
  concessionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#000000',
  },

  // Empty State
  emptyContainer: {
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
  emptySubtitle: {
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalCloseBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  modalCloseBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#374151',
  },

  // Detail Modal
  detailModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  detailStudentName: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#111827',
  },
  detailStudentRoll: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  detailBody: {
    marginTop: 10,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#6B7280',
  },
  detailVal: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },
  detailFinancialBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailFinCol: {
    flex: 1,
    alignItems: 'center',
  },
  detailFinLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailFinVal: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
  },
  detailActionBtnRow: {
    marginTop: 12,
  },
  detailConcessionBtn: {
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  detailConcessionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#000000',
  },
  clearedBanner: {
    marginTop: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  clearedBannerText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#047857',
  },
});

