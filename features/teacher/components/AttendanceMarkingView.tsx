import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Feather } from './common/Icons';
import { InlineSearchDropdown } from './common/InlineSearchDropdown';
import { FontFamily } from '../../../constants/fonts';
import {
  fetchClassSectionsApi,
  fetchRosterApi,
  fetchAttendanceForSlotApi,
  markAttendanceApi,
  fetchTeacherTimetableApi,
} from '../../../api/academics';
import { TeacherAttendanceSkeleton } from './skeletons';

import { useAttendanceStore } from '../services/attendanceStore';

export interface TeacherClassCard {
  id: string;
  className: string;
  sectionName: string;
  subjectName?: string;
  studentCount?: number;
}

export interface FacultyClassItem {
  id: string;
  slotId: string;
  classSectionName: string;
  subjectName: string;
  scheduledDays: number[];
  scheduledDaysText: string;
  periodTime: string;
  studentCount: number;
}

export const FACULTY_ASSIGNED_CLASSES: FacultyClassItem[] = [
  { id: 'cls-cse-3a', slotId: 'slot-cse-3a', classSectionName: 'CSE 3rd Year · Sec A', subjectName: 'Data Structures & Algorithms', scheduledDays: [1, 2, 3, 4, 5], scheduledDaysText: 'Mon - Fri', periodTime: '09:00 AM - 09:50 AM', studentCount: 42 },
  { id: 'cls-cse-2b', slotId: 'slot-cse-2b', classSectionName: 'CSE 2nd Year · Sec B', subjectName: 'Database Management Systems', scheduledDays: [1, 2, 3, 4, 5], scheduledDaysText: 'Mon - Fri', periodTime: '10:00 AM - 10:50 AM', studentCount: 38 },
  { id: 'cls-ece-1a', slotId: 'slot-ece-1a', classSectionName: 'ECE 1st Year · Sec A', subjectName: 'Digital Electronics & Circuits', scheduledDays: [1, 2, 3, 4, 5], scheduledDaysText: 'Mon - Fri', periodTime: '11:15 AM - 12:05 PM', studentCount: 40 },
  { id: 'cls-aiml-2a', slotId: 'slot-aiml-2a', classSectionName: 'AIML 2nd Year · Sec A', subjectName: 'Machine Learning Fundamentals', scheduledDays: [1, 2, 3, 4, 5], scheduledDaysText: 'Mon - Fri', periodTime: '01:00 PM - 01:50 PM', studentCount: 36 },
  { id: 'cls-cse-4a', slotId: 'slot-cse-4a', classSectionName: 'CSE 4th Year · Sec A', subjectName: 'Cloud Computing & Distributed Systems', scheduledDays: [1, 2, 3, 4, 5], scheduledDaysText: 'Mon - Fri', periodTime: '02:00 PM - 02:50 PM', studentCount: 44 },
];

const DEFAULT_TEACHER_CLASSES: TeacherClassCard[] = [
  { id: 'tc-1', className: 'Class 8', sectionName: 'A', subjectName: 'Mathematics', studentCount: 32 },
  { id: 'tc-2', className: 'Class 9', sectionName: 'B', subjectName: 'Algebra', studentCount: 30 },
  { id: 'tc-3', className: 'Class 9', sectionName: 'C', subjectName: 'Algebra', studentCount: 28 },
  { id: 'tc-4', className: 'Class 10', sectionName: 'A', subjectName: 'Mathematics', studentCount: 34 },
  { id: 'tc-5', className: 'Class 10', sectionName: 'B', subjectName: 'Geometry', studentCount: 31 },
  { id: 'tc-6', className: 'Class 11', sectionName: 'B', subjectName: 'Physics', studentCount: 29 },
  { id: 'tc-7', className: 'Class 12', sectionName: 'A', subjectName: 'Chemistry', studentCount: 27 },
];

type Status = 'present' | 'absent';

export function normalizeClassAndSection(rawClassStr?: string): { className: string; sectionName: string } {
  if (!rawClassStr) return { className: 'VIII', sectionName: 'A' };

  const clean = rawClassStr.replace(/^class\s*/i, '').trim();
  const m = clean.match(/^([IVXLCDM]+|\d+)\s*[-_/\s]?\s*([A-Za-z0-9]+)?/i);
  if (!m) return { className: 'VIII', sectionName: 'A' };

  let cls = m[1].toUpperCase();
  const sec = (m[2] || 'A').toUpperCase();

  const numToRoman: Record<string, string> = {
    '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V',
    '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X',
    '11': 'XI', '12': 'XII',
  };
  if (numToRoman[cls]) {
    cls = numToRoman[cls];
  }

  return { className: cls, sectionName: sec };
}

interface AttendanceMarkingViewProps {
  slotId?: string;
  subjectName?: string;
  className?: string;
  sectionName?: string;
  date?: string;
  onBack?: () => void;
  onSaved?: (info?: { slotId?: string; className?: string; subjectName?: string; date?: string }) => void;
}

const DEFAULT_CLASSES = ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const DEFAULT_SECTIONS = ['A', 'B', 'C', 'D'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Mockup roster for Class VIII-A (28 students, 24 Present, 4 Absent)
const ROSTER_VIII_A = [
  { id: 's-8a-1', usn: 'USN2026001', admissionNo: 'USN2026001', fullName: 'Aarav Sharma' },
  { id: 's-8a-2', usn: 'USN2026002', admissionNo: 'USN2026002', fullName: 'Aditya Nair' },
  { id: 's-8a-3', usn: 'USN2026003', admissionNo: 'USN2026003', fullName: 'Ananya Ramesh' },
  { id: 's-8a-4', usn: 'USN2026004', admissionNo: 'USN2026004', fullName: 'Devika S' },
  { id: 's-8a-5', usn: 'USN2026005', admissionNo: 'USN2026005', fullName: 'Ibrahim Khan' },
  { id: 's-8a-6', usn: 'USN2026006', admissionNo: 'USN2026006', fullName: 'Kavya B' },
  { id: 's-8a-7', usn: 'USN2026007', admissionNo: 'USN2026007', fullName: 'Mohammed Ali' },
  { id: 's-8a-8', usn: 'USN2026008', admissionNo: 'USN2026008', fullName: 'Sneha Prakash' },
  { id: 's-8a-9', usn: 'USN2026009', admissionNo: 'USN2026009', fullName: 'Rohan Varma' },
  { id: 's-8a-10', usn: 'USN2026010', admissionNo: 'USN2026010', fullName: 'Priya Menon' },
  { id: 's-8a-11', usn: 'USN2026011', admissionNo: 'USN2026011', fullName: 'Arjun Das' },
  { id: 's-8a-12', usn: 'USN2026012', admissionNo: 'USN2026012', fullName: 'Tanvi Shah' },
  { id: 's-8a-13', usn: 'USN2026013', admissionNo: 'USN2026013', fullName: 'Varun Nair' },
  { id: 's-8a-14', usn: 'USN2026014', admissionNo: 'USN2026014', fullName: 'Meera Nair' },
  { id: 's-8a-15', usn: 'USN2026015', admissionNo: 'USN2026015', fullName: 'Siddharth Rao' },
  { id: 's-8a-16', usn: 'USN2026016', admissionNo: 'USN2026016', fullName: 'Anika Patel' },
  { id: 's-8a-17', usn: 'USN2026017', admissionNo: 'USN2026017', fullName: 'Rahul Krishna' },
  { id: 's-8a-18', usn: 'USN2026018', admissionNo: 'USN2026018', fullName: 'Pooja Hegde' },
  { id: 's-8a-19', usn: 'USN2026019', admissionNo: 'USN2026019', fullName: 'Nikhil Kamath' },
  { id: 's-8a-20', usn: 'USN2026020', admissionNo: 'USN2026020', fullName: 'Sanjana Reddy' },
  { id: 's-8a-21', usn: 'USN2026021', admissionNo: 'USN2026021', fullName: 'Farhan Akhtar' },
  { id: 's-8a-22', usn: 'USN2026022', admissionNo: 'USN2026022', fullName: 'Riya Sen' },
  { id: 's-8a-23', usn: 'USN2026023', admissionNo: 'USN2026023', fullName: 'Yash Malhotra' },
  { id: 's-8a-24', usn: 'USN2026024', admissionNo: 'USN2026024', fullName: 'Ishaan Sharma' },
  { id: 's-8a-25', usn: 'USN2026025', admissionNo: 'USN2026025', fullName: 'Diya Kapoor' },
  { id: 's-8a-26', usn: 'USN2026026', admissionNo: 'USN2026026', fullName: 'Neil Fernandez' },
  { id: 's-8a-27', usn: 'USN2026027', admissionNo: 'USN2026027', fullName: 'Alisha Joseph' },
  { id: 's-8a-28', usn: 'USN2026028', admissionNo: 'USN2026028', fullName: 'Pranav Nair' },
];

const STUDENT_NAMES_POOL = [
  'Aarav Sharma', 'Aditya Nair', 'Ananya Ramesh', 'Devika S', 'Ibrahim Khan',
  'Kavya B', 'Mohammed Ali', 'Sneha Prakash', 'Rohan Varma', 'Priya Menon',
  'Arjun Das', 'Tanvi Shah', 'Varun Nair', 'Meera Nair', 'Siddharth Rao',
  'Anika Patel', 'Rahul Krishna', 'Pooja Hegde', 'Nikhil Kamath', 'Sanjana Reddy',
  'Farhan Akhtar', 'Riya Sen', 'Yash Malhotra', 'Ishaan Sharma', 'Diya Kapoor',
  'Neil Fernandez', 'Alisha Joseph', 'Pranav Nair', 'Bhavna Kulkarni', 'Chetan Bhagat',
  'Deepa Mehta', 'Eshaan Roy', 'Gauri Shinde', 'Harsh Vardhan', 'Ishita Paul',
];

// Helper to convert Roman to number for smart search
function romanToNum(roman: string): number | null {
  const map: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
    VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12,
  };
  return map[roman.toUpperCase()] || null;
}

// Helper to calculate student attendance percentage
function getStudentAttendancePercent(id: string, name: string): number {
  let hash = 0;
  const str = id + name;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 1000;
  }
  return 75 + (hash % 24);
}

// Generate dynamic roster for any class and section
function getDynamicRoster(className: string, sectionName: string): any[] {
  if (className === 'VIII' && sectionName === 'A') {
    return ROSTER_VIII_A;
  }
  const count = 22 + ((className.charCodeAt(0) + sectionName.charCodeAt(0)) % 8);
  const cleanCls = className.replace(/[^A-Za-z0-9]/g, '');
  return Array.from({ length: count }, (_, i) => {
    const nameIdx = (i + className.length + sectionName.charCodeAt(0)) % STUDENT_NAMES_POOL.length;
    const usnVal = `USN${cleanCls}${sectionName}${String(i + 1).padStart(3, '0')}`;
    return {
      id: `s-${cleanCls.toLowerCase()}${sectionName.toLowerCase()}-${i + 1}`,
      usn: usnVal,
      admissionNo: usnVal,
      fullName: STUDENT_NAMES_POOL[nameIdx],
    };
  });
}

export const AttendanceMarkingView: React.FC<AttendanceMarkingViewProps> = ({
  slotId = 'demo-1',
  subjectName,
  className,
  sectionName,
  date,
  onBack,
  onSaved,
}) => {
  const initialClassInfo = useMemo(() => normalizeClassAndSection(className), [className]);

  // Step 1 Selection State: which class card is selected.
  // Initially null when opening from Attendance tab, so first it shows the rectangular container list of classes taken by this teacher!
  // If className was passed (e.g. from Dashboard "Mark"), initialize directly to that class card.
  const [selectedClassCard, setSelectedClassCard] = useState<TeacherClassCard | null>(() => {
    if (className) {
      const parsed = normalizeClassAndSection(className);
      return {
        id: slotId || `prop-${className}-${sectionName || parsed.sectionName}`,
        className: className.toLowerCase().startsWith('class') ? className : `Class ${className}`,
        sectionName: sectionName || parsed.sectionName,
        subjectName: subjectName || 'Mathematics',
      };
    }
    return null;
  });

  // Teacher Assigned Classes & Search
  const [teacherClasses, setTeacherClasses] = useState<TeacherClassCard[]>(DEFAULT_TEACHER_CLASSES);
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(subjectName || 'Mathematics');

  // Track marked periods from Zustand store for reactive updates in VIEW 1
  const markedPeriods = useAttendanceStore((state) => state.markedPeriods);

  const [selectedDate, setSelectedDate] = useState(() => {
    if (date) return date;
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [selectedClass, setSelectedClass] = useState(initialClassInfo.className);
  const [selectedSection, setSelectedSection] = useState(sectionName || initialClassInfo.sectionName);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic available classes & sections
  const [availableClasses, setAvailableClasses] = useState<string[]>(DEFAULT_CLASSES);
  const [availableSections, setAvailableSections] = useState<string[]>(DEFAULT_SECTIONS);

  // Active inline dropdown selector: 'class' | 'section' | 'date' | null
  const [openDropdown, setOpenDropdown] = useState<'class' | 'section' | 'date' | null>(null);

  // Calendar month navigator view
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());

  // Editing state: Attendance is fixed once marked. Can only change when Edit is active.
  const [isAllEditable, setIsAllEditable] = useState(false);
  const [editingStudentIds, setEditingStudentIds] = useState<Set<string>>(new Set());

  // Dynamic attendance store keyed by: `${class}_${section}_${date}`
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<string, Status>>>(() => {
    const initialMarks: Record<string, Status> = {};
    ROSTER_VIII_A.forEach((s) => {
      if (['s-8a-3', 's-8a-7', 's-8a-14', 's-8a-21'].includes(s.id)) {
        initialMarks[s.id] = 'absent';
      } else {
        initialMarks[s.id] = 'present';
      }
    });
    const todayKey = `VIII_A_${new Date().toISOString().slice(0, 10)}`;
    return { [todayKey]: initialMarks };
  });

  // Current active roster
  const [roster, setRoster] = useState<any[]>(ROSTER_VIII_A);

  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Storage key for current selection
  const currentKey = `${selectedClass}_${selectedSection}_${selectedDate}`;

  // Formatted date label e.g. "19 Oct 2026"
  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${d} ${MONTH_SHORT[m] || ''} ${y}`;
    }
    return selectedDate;
  }, [selectedDate]);

  const [refreshing, setRefreshing] = useState(false);

  // Load teacher's dynamic classes from timetable API
  const loadTimetableClasses = useCallback(async () => {
    try {
      const ttRes: any = await fetchTeacherTimetableApi();
      if (ttRes?.periods && Array.isArray(ttRes.periods) && ttRes.periods.length > 0) {
        const cardMap = new Map<string, TeacherClassCard>();
        ttRes.periods.forEach((p: any, idx: number) => {
          const rawName = p.classSectionName || p.classSection?.name || '';
          const sub = p.subject?.name || p.subjectName || '';
          if (rawName) {
            const parts = rawName.split('-');
            const cName = parts[0]?.trim() || rawName;
            const sName = parts[1]?.trim() || 'A';
            const fullCls = cName.toLowerCase().startsWith('class') ? cName : `Class ${cName}`;
            const key = `${fullCls}_${sName}_${sub}`;
            if (!cardMap.has(key)) {
              cardMap.set(key, {
                id: p.id || `tc-dyn-${idx}`,
                className: fullCls,
                sectionName: sName,
                subjectName: sub || 'Mathematics',
                studentCount: 30 + ((idx * 3) % 6),
              });
            }
          }
        });
        if (cardMap.size > 0) {
          setTeacherClasses(Array.from(cardMap.values()));
        }
      }
    } catch {
      // Keep defaults
    }
  }, []);

  useEffect(() => {
    loadTimetableClasses();
  }, [loadTimetableClasses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTimetableClasses();
    setRefreshing(false);
  }, [loadTimetableClasses]);

  // Filter classes taken by this teacher by search query
  const filteredTeacherClasses = useMemo(() => {
    if (!classSearchQuery.trim()) return teacherClasses;
    const q = classSearchQuery.toLowerCase().trim();
    return teacherClasses.filter(
      (c) =>
        c.className.toLowerCase().includes(q) ||
        c.sectionName.toLowerCase().includes(q) ||
        (c.subjectName && c.subjectName.toLowerCase().includes(q))
    );
  }, [teacherClasses, classSearchQuery]);

  // Check if attendance is already marked today for this class card
  const isCardMarked = useCallback(
    (item: TeacherClassCard) => {
      const today = selectedDate || new Date().toISOString().slice(0, 10);
      const norm = normalizeClassAndSection(item.className);
      const fullClsStr = `${item.className}-${item.sectionName}`;
      const normClsStr = `Class ${norm.className}-${item.sectionName}`;
      return (
        useAttendanceStore.getState().isPeriodMarked(item.id, today, fullClsStr, item.subjectName) ||
        useAttendanceStore.getState().isPeriodMarked(item.id, today, normClsStr, item.subjectName) ||
        useAttendanceStore.getState().isPeriodMarked(item.id, today, `${norm.className}-${item.sectionName}`, item.subjectName)
      );
    },
    [selectedDate, markedPeriods]
  );

  // Handle card selection from rectangular class list
  const handleSelectClass = (card: TeacherClassCard) => {
    const norm = normalizeClassAndSection(card.className);
    setSelectedClass(norm.className);
    setSelectedSection(card.sectionName || norm.sectionName);
    if (card.subjectName) {
      setSelectedSubject(card.subjectName);
    }
    setSelectedClassCard(card);
  };

  // Back action from VIEW 2 (returns to VIEW 1 or caller if onBack passed)
  const handleBackFromDetail = () => {
    if (onBack) {
      onBack();
    } else {
      setSelectedClassCard(null);
    }
  };

  // Synchronize subjectName prop changes
  useEffect(() => {
    if (subjectName) {
      setSelectedSubject(subjectName);
    }
  }, [subjectName]);

  // Load backend classes and sections dynamically
  useEffect(() => {
    fetchClassSectionsApi()
      .then((res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          const classSet = new Set<string>(DEFAULT_CLASSES);
          const sectionSet = new Set<string>(DEFAULT_SECTIONS);
          res.forEach((cs: any) => {
            const name = (cs.name || '').trim();
            const parts = name.split('-');
            if (parts[0]) {
              const c = parts[0].replace(/class/i, '').trim();
              if (c) classSet.add(c);
            }
            if (parts[1]) {
              const s = parts[1].trim();
              if (s) sectionSet.add(s);
            }
            if (cs.section) sectionSet.add(cs.section.trim());
          });
          setAvailableClasses(Array.from(classSet));
          setAvailableSections(Array.from(sectionSet));
        }
      })
      .catch(() => {
        // Keep defaults on failure
      });
  }, []);

  // Synchronize class and section whenever className prop changes
  useEffect(() => {
    if (className) {
      const parsed = normalizeClassAndSection(className);
      setSelectedClass(parsed.className);
      if (sectionName) {
        setSelectedSection(sectionName);
      } else if (parsed.sectionName) {
        setSelectedSection(parsed.sectionName);
      }
      setSelectedClassCard({
        id: slotId || `prop-${className}-${sectionName || parsed.sectionName}`,
        className: className.toLowerCase().startsWith('class') ? className : `Class ${className}`,
        sectionName: sectionName || parsed.sectionName,
        subjectName: subjectName || 'Mathematics',
      });
      setAvailableClasses((prev) => {
        if (!prev.includes(parsed.className)) {
          return [...prev, parsed.className];
        }
        return prev;
      });
    }
  }, [className, sectionName, subjectName, slotId]);

  // Update dynamic roster and marks whenever class, section, or date changes
  useEffect(() => {
    setIsAllEditable(false);
    setEditingStudentIds(new Set());

    // Generate or fetch roster for class and section
    const currentRoster = getDynamicRoster(selectedClass, selectedSection);
    setRoster(currentRoster);

    // If marks do not exist for this combination, generate initial marks
    setAttendanceRecords((prev) => {
      if (prev[currentKey]) {
        return prev;
      }
      const initial: Record<string, Status> = {};
      currentRoster.forEach((s, idx) => {
        // Set realistic 10-15% absent
        if (idx % 7 === 2) {
          initial[s.id] = 'absent';
        } else {
          initial[s.id] = 'present';
        }
      });
      return { ...prev, [currentKey]: initial };
    });
  }, [selectedClass, selectedSection, selectedDate, currentKey]);

  // Restore saved attendance from useAttendanceStore if available
  useEffect(() => {
    const activeSlotId = slotId || selectedClassCard?.id;
    const activeClassName = selectedClassCard?.className
      ? `${selectedClassCard.className}-${selectedSection}`
      : className;
    const activeSub = selectedSubject || subjectName || selectedClassCard?.subjectName;

    const savedRecord = useAttendanceStore
      .getState()
      .getAttendanceRecord(activeSlotId || '', selectedDate, activeClassName, activeSub);
    if (savedRecord && savedRecord.marks) {
      setAttendanceRecords((prev) => ({
        ...prev,
        [currentKey]: { ...(prev[currentKey] || {}), ...savedRecord.marks },
      }));
    }
  }, [slotId, selectedDate, className, subjectName, currentKey, selectedClassCard, selectedSubject, selectedSection]);

  // Fetch real slot attendance if a live slot is connected
  const loadSlotData = useCallback(async () => {
    if (!slotId || slotId.startsWith('demo-')) {
      return;
    }
    setLoading(true);
    try {
      const [rosterRes, existingRes] = await Promise.all([
        fetchRosterApi(slotId).catch(() => null),
        fetchAttendanceForSlotApi(slotId, selectedDate).catch(() => null),
      ]);

      if (rosterRes?.students?.length) {
        const students = rosterRes.students.map((s: any, idx: number) => {
          const usnVal = s.rollNoOrUSN || s.studentUsn || s.rollNo || `USN2026${String(idx + 1).padStart(3, '0')}`;
          return {
            id: s.id,
            usn: usnVal,
            admissionNo: usnVal,
            fullName: s.fullName || s.name || `Student ${idx + 1}`,
          };
        });
        setRoster(students);
      }

      if (rosterRes?.classSection?.name) {
        const parts = rosterRes.classSection.name.split('-');
        if (parts[0]) setSelectedClass(parts[0].replace(/class/i, '').trim() || parts[0]);
        if (parts[1]) setSelectedSection(parts[1].trim());
      }

      if (existingRes?.record) {
        setLocked(existingRes.record.status === 'locked');
        const initial: Record<string, Status> = {};
        for (const e of existingRes.entries || []) {
          initial[e.studentId] = e.attendanceStatus === 'absent' ? 'absent' : 'present';
        }
        setAttendanceRecords((prev) => ({
          ...prev,
          [currentKey]: { ...(prev[currentKey] || {}), ...initial },
        }));
      }
    } catch {
      // Keep dynamic local data
    } finally {
      setLoading(false);
    }
  }, [slotId, selectedDate, currentKey]);

  useEffect(() => {
    loadSlotData();
  }, [loadSlotData]);

  // Current marks for selected class-section-date
  const marks = useMemo(() => {
    return attendanceRecords[currentKey] || {};
  }, [attendanceRecords, currentKey]);

  // Check if a specific student is currently editable
  const isRowEditable = (studentId: string) => {
    if (locked) return false;
    return isAllEditable || editingStudentIds.has(studentId);
  };

  // Toggle single student edit mode
  const toggleStudentEdit = (studentId: string) => {
    if (locked) return;
    if (isAllEditable) return;
    setEditingStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  // Global edit toggle
  const toggleGlobalEdit = () => {
    if (locked) return;
    if (isAllEditable) {
      setIsAllEditable(false);
      setEditingStudentIds(new Set());
    } else {
      setIsAllEditable(true);
      setEditingStudentIds(new Set());
    }
  };

  // Status toggle (only permitted when row is editable)
  const toggleStudentStatus = (studentId: string, status: Status) => {
    if (locked) return;
    if (!isRowEditable(studentId)) {
      Alert.alert(
        'Attendance Locked',
        'Click the edit pencil icon next to this student or "Edit" in the table header to modify attendance.'
      );
      return;
    }
    setAttendanceRecords((prev) => ({
      ...prev,
      [currentKey]: {
        ...(prev[currentKey] || {}),
        [studentId]: status,
      },
    }));
  };

  // Mark all present (only when editing is active)
  const markAllPresent = () => {
    if (locked) return;
    if (!isAllEditable) {
      Alert.alert(
        'Attendance Locked',
        'Click the "Edit" button in the table header to enable editing before making bulk changes.'
      );
      return;
    }
    const all: Record<string, Status> = {};
    roster.forEach((s) => {
      all[s.id] = 'present';
    });
    setAttendanceRecords((prev) => ({
      ...prev,
      [currentKey]: all,
    }));
  };

  // Mark all absent (only when editing is active)
  const markAllAbsent = () => {
    if (locked) return;
    if (!isAllEditable) {
      Alert.alert(
        'Attendance Locked',
        'Click the "Edit" button in the table header to enable editing before making bulk changes.'
      );
      return;
    }
    const all: Record<string, Status> = {};
    roster.forEach((s) => {
      all[s.id] = 'absent';
    });
    setAttendanceRecords((prev) => ({
      ...prev,
      [currentKey]: all,
    }));
  };

  // Filter students by name or USN
  const filteredRoster = useMemo(() => {
    if (!searchQuery.trim()) return roster;
    const q = searchQuery.toLowerCase().trim();
    return roster.filter(
      (s) =>
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.usn || '').toLowerCase().includes(q) ||
        (s.admissionNo || '').toLowerCase().includes(q)
    );
  }, [roster, searchQuery]);

  // Dynamic Counts (Total, Present, Absent)
  const counts = useMemo(() => {
    let p = 0;
    let a = 0;
    roster.forEach((s) => {
      if (marks[s.id] === 'absent') a++;
      else p++;
    });
    return { total: roster.length, present: p, absent: a };
  }, [roster, marks]);

  // Save Attendance
  const handleSave = async () => {
    if (roster.length === 0) return;
    setSaving(true);
    const activeSlotId = slotId || selectedClassCard?.id || `slot-${selectedClass}-${selectedSection}`;
    const activeClassName = selectedClassCard?.className
      ? `${selectedClassCard.className}-${selectedSection}`
      : (className || `Class ${selectedClass}-${selectedSection}`);
    const activeSubject = selectedSubject || subjectName || selectedClassCard?.subjectName || 'General';

    try {
      // Save locally to useAttendanceStore
      useAttendanceStore.getState().markPeriodAttendance({
        slotId: activeSlotId,
        date: selectedDate,
        className: activeClassName,
        normalizedClass: selectedClass,
        normalizedSection: selectedSection,
        subjectName: activeSubject,
        presentCount: counts.present,
        absentCount: counts.absent,
        totalStudents: roster.length,
        marks: { ...marks },
      });

      if (!slotId || slotId.startsWith('demo-') || slotId.startsWith('tc-') || slotId.startsWith('prop-')) {
        setIsAllEditable(false);
        setEditingStudentIds(new Set());
        Alert.alert(
          'Attendance Saved',
          `Attendance for Class ${selectedClass}-${selectedSection} on ${formattedDate} (${counts.present} Present, ${counts.absent} Absent) has been saved.`
        );
        onSaved?.({
          slotId: activeSlotId,
          className: activeClassName,
          subjectName: activeSubject,
          date: selectedDate,
        });
        return;
      }
      const entries = roster.map((s) => ({
        studentId: s.id,
        attendanceStatus: marks[s.id] || 'present',
      }));
      await markAttendanceApi({ timetableSlotId: slotId, date: selectedDate, entries });
      setIsAllEditable(false);
      setEditingStudentIds(new Set());
      Alert.alert(
        'Attendance Saved',
        `Attendance for Class ${selectedClass}-${selectedSection} on ${formattedDate} has been saved.`
      );
      onSaved?.({
        slotId: activeSlotId,
        className: activeClassName,
        subjectName: activeSubject,
        date: selectedDate,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };



  // Calendar Days Computation
  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const cells: { day: number; currentMonth: boolean; dateStr: string }[] = [];

    // Preceding days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const mm = String(prevM + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ day: d, currentMonth: false, dateStr: `${prevY}-${mm}-${dd}` });
    }

    // Days in current month
    for (let d = 1; d <= totalDays; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ day: d, currentMonth: true, dateStr: `${year}-${mm}-${dd}` });
    }

    // Trailing days
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextM = month === 11 ? 0 : month + 1;
        const nextY = month === 11 ? year + 1 : year;
        const mm = String(nextM + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        cells.push({ day: d, currentMonth: false, dateStr: `${nextY}-${mm}-${dd}` });
      }
    }

    return cells;
  }, [calendarViewDate]);

  const shiftCalendarMonth = (delta: number) => {
    setCalendarViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + delta);
      return d;
    });
  };

  // =========================================================================
  // VIEW 1: FIRST SHOW THE CLASSES TAKEN BY THIS TEACHER IN RECTANGULAR BOXES
  // =========================================================================
  if (!selectedClassCard) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.classesScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#000000"
              colors={['#000000']}
              progressBackgroundColor="#FFFFFF"
            />
          }
        >
          {/* Header */}
          <View style={styles.classesHeader}>
            <Text style={styles.classesHeaderTitle}>Attendance</Text>
          </View>

          {/* Search Box */}
          <View style={styles.classSearchBox}>
            <Feather name="search" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.classSearchInput}
              placeholder="Search class, section or subject..."
              placeholderTextColor="#9CA3AF"
              value={classSearchQuery}
              onChangeText={setClassSearchQuery}
              returnKeyType="search"
            />
            {classSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setClassSearchQuery('')} hitSlop={8}>
                <Feather name="x" size={15} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Assigned Classes Section */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleText}>CLASSES TAKEN BY YOU</Text>
            <View style={styles.classCountPill}>
              <Text style={styles.classCountText}>
                {filteredTeacherClasses.length} {filteredTeacherClasses.length === 1 ? 'Class' : 'Classes'}
              </Text>
            </View>
          </View>

          {/* Rectangular Containers List */}
          <View style={styles.classListWrap}>
            {filteredTeacherClasses.length === 0 ? (
              <View style={styles.emptyClassesCard}>
                <Text style={styles.emptyClassesText}>No matching classes found</Text>
              </View>
            ) : (
              filteredTeacherClasses.map((item) => {
                const marked = isCardMarked(item);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.rectangularClassCard}
                    activeOpacity={0.8}
                    onPress={() => handleSelectClass(item)}
                  >
                    <View style={styles.classCardLeft}>
                      <View style={styles.classCardTextWrap}>
                        <View style={styles.classNameSectionRow}>
                          <Text style={styles.cardClassName}>{item.className}</Text>
                          <Text style={styles.cardSectionText}>Section {item.sectionName}</Text>
                        </View>
                        {/* Subject Display */}
                        <View style={styles.cardSubjectRow}>
                          <Text style={styles.cardSubjectText}>{item.subjectName || 'General'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.classCardRight}>
                      {marked ? (
                        <View style={styles.markedBadge}>
                          <Feather name="check" size={12} color="#047857" />
                          <Text style={styles.markedBadgeText}>Marked</Text>
                        </View>
                      ) : (
                        <View style={styles.takeAttendanceBtn}>
                          <Text style={styles.takeAttendanceBtnText}>Mark Attendance</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // =========================================================================
  // VIEW 2: CURRENT ATTENDANCE PAGE (OPENS AFTER CLICKING A CLASS CARD)
  // =========================================================================
  const displayClassTitle =
    selectedClassCard?.className ||
    (selectedClass.toLowerCase().startsWith('class') ? selectedClass : `Class ${selectedClass}`);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      >
        {/* Top Navigation Bar: Back button, Class & Section, Subject badge, Change Class */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.topNavBackBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleBackFromDetail}
          >
            <Feather name="arrow-left" size={18} color="#171717" />
          </TouchableOpacity>
          <View style={styles.topNavTextWrap}>
            <Text style={styles.topNavTitle}>
              {displayClassTitle} · Section {selectedSection}
            </Text>
            {/* Subject Display in Top Nav */}
            <View style={styles.topNavSubjectBadge}>
              <Text style={styles.topNavSubjectText}>{selectedSubject}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.changeClassBtn}
            activeOpacity={0.8}
            onPress={() => setSelectedClassCard(null)}
          >
            <Text style={styles.changeClassBtnText}>Change Class</Text>
          </TouchableOpacity>
        </View>

        {/* Date Selector Row */}
        <View style={styles.dateSelectorRow}>
          <View style={styles.dateSelectorCol}>
            <Text style={styles.dateSelectorLabel}>Date</Text>
            <TouchableOpacity
              style={[
                styles.dateSelectorBox,
                openDropdown === 'date' && styles.selectorBoxActive,
              ]}
              activeOpacity={0.75}
              onPress={() => {
                if (selectedDate) {
                  const parts = selectedDate.split('-').map(Number);
                  setCalendarViewDate(new Date(parts[0], parts[1] - 1, parts[2]));
                }
                setOpenDropdown(openDropdown === 'date' ? null : 'date');
              }}
            >
              <View style={styles.dateBoxLeft}>
                <Feather name="calendar" size={14} color="#0284C7" />
                <Text style={styles.dateBoxText}>{formattedDate}</Text>
              </View>
              <Feather
                name={openDropdown === 'date' ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={openDropdown === 'date' ? '#0284C7' : '#4B5563'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline Calendar Card for Date */}
        {openDropdown === 'date' && (
          <View style={styles.inlineCardWrapper}>
            <View style={styles.inlineCalendarCard}>
              <View style={styles.calendarHeaderRow}>
                <Text style={styles.calendarHeaderTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setOpenDropdown(null)} hitSlop={8}>
                  <Feather name="chevron-up" size={17} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Month Navigation */}
              <View style={styles.calendarNavRow}>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  onPress={() => shiftCalendarMonth(-1)}
                  hitSlop={8}
                >
                  <Feather name="chevron-left" size={17} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.calMonthTitle}>
                  {MONTH_NAMES[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}
                </Text>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  onPress={() => shiftCalendarMonth(1)}
                  hitSlop={8}
                >
                  <Feather name="chevron-right" size={17} color="#1F2937" />
                </TouchableOpacity>
              </View>

              {/* Day of Week Labels */}
              <View style={styles.calWeekRow}>
                {WEEK_DAYS.map((wd) => (
                  <Text key={wd} style={styles.calWeekText}>
                    {wd}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.calGrid}>
                {calendarDays.map((cell, idx) => {
                  const isSelected = selectedDate === cell.dateStr;
                  return (
                    <TouchableOpacity
                      key={`${cell.dateStr}-${idx}`}
                      style={[
                        styles.calCell,
                        isSelected && styles.calCellSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedDate(cell.dateStr);
                        setOpenDropdown(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.calCellText,
                          !cell.currentMonth && styles.calCellTextDim,
                          isSelected && styles.calCellTextSelected,
                        ]}
                      >
                        {cell.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Quick Today & Close Footer */}
              <View style={styles.calFooter}>
                <TouchableOpacity
                  style={styles.calTodayBtn}
                  onPress={() => {
                    const d = new Date();
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    setSelectedDate(`${yyyy}-${mm}-${dd}`);
                    setOpenDropdown(null);
                  }}
                >
                  <Text style={styles.calTodayText}>Today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.calCloseBtn}
                  onPress={() => setOpenDropdown(null)}
                >
                  <Text style={styles.calCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 3. Summary Stat Cards (Dynamically computed: Total Students, Present, Absent) */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Students</Text>
            <Text style={styles.statNumber}>{counts.total}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Present</Text>
            <Text style={styles.statNumber}>{counts.present}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Absent</Text>
            <Text style={styles.statNumber}>{counts.absent}</Text>
          </View>
        </View>

        {/* 4. Student Search Bar */}
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search student name or USN..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Feather name="x" size={15} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* 5. Student Attendance Table */}
        {loading ? (
          <TeacherAttendanceSkeleton />
        ) : (
          <View style={styles.tableCard}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thText, styles.colIndex]} numberOfLines={1}>#</Text>
              <Text style={[styles.thText, styles.colUsn]} numberOfLines={1}>USN</Text>
              <Text style={[styles.thText, styles.colName]} numberOfLines={1}>Student Name</Text>
              <Text style={[styles.thText, styles.colPercent]} numberOfLines={1}>%</Text>
              <Text style={[styles.thText, styles.colAttendance]} numberOfLines={1}>Attendance</Text>
              <TouchableOpacity
                style={styles.colEditHeader}
                activeOpacity={0.6}
                hitSlop={8}
                onPress={toggleGlobalEdit}
              >
                <Feather
                  name={isAllEditable ? 'check' : 'edit-2'}
                  size={13}
                  color={isAllEditable ? '#15803D' : '#64748B'}
                />
              </TouchableOpacity>
            </View>

            {/* Table Rows */}
            {filteredRoster.map((student, i) => {
              const status = marks[student.id] || 'present';
              const isPresent = status === 'present';
              const isAbsent = status === 'absent';
              const editable = isRowEditable(student.id);
              const pct = getStudentAttendancePercent(student.id, student.fullName);

              return (
                <View key={student.id} style={styles.tableRow}>
                  <Text style={[styles.tdText, styles.colIndex]}>{i + 1}</Text>
                  <Text style={[styles.tdUsn, styles.colUsn]} numberOfLines={1}>
                    {student.usn || student.admissionNo}
                  </Text>
                  <Text style={[styles.tdName, styles.colName]} numberOfLines={1}>
                    {student.fullName}
                  </Text>
                  <View style={styles.colPercent}>
                    <Text
                      style={[
                        styles.tdPercent,
                        {
                          color: pct < 75 ? '#DC2626' : '#171717',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {pct}%
                    </Text>
                  </View>

                  {/* Attendance Toggle Buttons */}
                  <View style={styles.colAttendance}>
                    <TouchableOpacity
                      style={[
                        styles.statusBtn,
                        isPresent ? styles.presentActive : styles.btnInactive,
                        !editable && styles.statusBtnFixed,
                      ]}
                      onPress={() => toggleStudentStatus(student.id, 'present')}
                      activeOpacity={editable ? 0.8 : 1}
                    >
                      <Feather
                        name="check"
                        size={15}
                        color={isPresent ? '#15803D' : '#9CA3AF'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusBtn,
                        isAbsent ? styles.absentActive : styles.btnInactive,
                        !editable && styles.statusBtnFixed,
                      ]}
                      onPress={() => toggleStudentStatus(student.id, 'absent')}
                      activeOpacity={editable ? 0.8 : 1}
                    >
                      <Feather
                        name="x"
                        size={15}
                        color={isAbsent ? '#DC2626' : '#9CA3AF'}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Specific Student Edit Icon (without bg box) */}
                  <TouchableOpacity
                    style={styles.colEdit}
                    activeOpacity={0.6}
                    hitSlop={8}
                    onPress={() => toggleStudentEdit(student.id)}
                  >
                    <Feather
                      name={editable ? 'check' : 'edit-2'}
                      size={13}
                      color={editable ? '#15803D' : '#64748B'}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* 6. Bulk Action Controls (Mark All Present & Mark All Absent) */}
        <View style={styles.bulkRow}>
          <TouchableOpacity
            style={[
              styles.markAllPresentBtn,
              !isAllEditable && styles.bulkBtnLocked,
            ]}
            onPress={markAllPresent}
            disabled={locked}
            activeOpacity={isAllEditable ? 0.82 : 0.9}
          >
            <Text style={[styles.markAllPresentText, !isAllEditable && styles.bulkBtnLockedText]}>
              Mark All Present
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.markAllAbsentBtn,
              !isAllEditable && styles.bulkBtnLocked,
            ]}
            onPress={markAllAbsent}
            disabled={locked}
            activeOpacity={isAllEditable ? 0.82 : 0.9}
          >
            <Text style={[styles.markAllAbsentText, !isAllEditable && styles.bulkBtnLockedText]}>
              Mark All Absent
            </Text>
          </TouchableOpacity>
        </View>

        {/* 7. Save Attendance Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving || locked}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#111827" />
          ) : (
            <Text style={styles.saveBtnText}>Save Attendance</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  // VIEW 1: Classes Taken By You styles
  classesScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  classesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  classesHeaderTitle: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
  },
  classesBackBtn: {
    padding: 4,
    marginRight: 2,
  },
  classSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    marginBottom: 16,
  },
  classSearchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#171717',
    paddingVertical: 0,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  classCountPill: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  classCountText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  classListWrap: {
    gap: 10,
  },
  rectangularClassCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  classCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  classCardTextWrap: {
    flex: 1,
    gap: 2,
  },
  classNameSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardClassName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  cardSectionText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#4B5563',
  },
  cardSubjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardSubjectText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  classCardRight: {
    marginLeft: 10,
  },
  takeAttendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F4C430',
    width: 126,
    height: 32,
    borderRadius: 5,
  },
  takeAttendanceBtnText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  markedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    width: 126,
    height: 32,
    borderRadius: 5,
  },
  markedBadgeText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#047857',
  },
  emptyClassesCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 8,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyClassesText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: FontFamily.medium,
  },

  // VIEW 2: Top Nav & Date styles
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 10,
  },
  topNavBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavTextWrap: {
    flex: 1,
  },
  topNavTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  topNavSubjectBadge: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  topNavSubjectText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#6B7280',
  },
  changeClassBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  changeClassBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateSelectorCol: {
    flex: 1,
    gap: 4,
  },
  dateSelectorLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#374151',
  },
  dateSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 38,
  },
  dateBoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateBoxText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  // Clean Header following schedule page style: no icon, no subtitle
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#D97706',
    marginTop: 2,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
  },

  // Selectors row (Class, Section, Date)
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  selectorCol: {
    flex: 1,
    gap: 4,
  },
  selectorLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#374151',
  },
  selectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 38,
  },
  selectorBoxActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  selectorVal: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  selectorValActive: {
    color: '#0284C7',
  },

  // Stats cards (Total Students, Present, Absent) - reduced compact size
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingVertical: 7,
    paddingHorizontal: 8,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 1,
    elevation: 1,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  statNumber: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    marginTop: 2,
  },

  // Search input
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    color: '#111827',
    paddingVertical: 0,
  },

  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Table card
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 14,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  thText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  colEditHeader: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tdText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  tdUsn: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },
  tdName: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  // Columns sizing
  colIndex: {
    width: 18,
    textAlign: 'center',
  },
  colUsn: {
    width: 68,
    paddingLeft: 2,
  },
  colName: {
    flex: 1,
    paddingHorizontal: 3,
  },
  colPercent: {
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  tdPercent: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  colAttendance: {
    width: 82,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colEdit: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },

  // Attendance Toggle Buttons (Icon-based)
  statusBtn: {
    width: 32,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnFixed: {
    opacity: 0.95,
  },
  presentActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  absentActive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  btnInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  // Bulk actions row
  bulkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  markAllPresentBtn: {
    flex: 1,
    height: 38,
    backgroundColor: '#F4C430',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllPresentText: {
    color: '#111827',
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  markAllAbsentBtn: {
    flex: 1,
    height: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllAbsentText: {
    color: '#DC2626',
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  bulkBtnLocked: {
    opacity: 0.55,
  },
  bulkBtnLockedText: {},

  // Save button
  saveBtn: {
    height: 46,
    backgroundColor: '#F4C430',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  saveBtnText: {
    color: '#111827',
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },

  // Inline dropdown card & calendar wrapper
  inlineCardWrapper: {
    marginBottom: 12,
  },
  inlineCalendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  calendarHeaderTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  calendarNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthTitle: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  calWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  calWeekText: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#94A3B8',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  calCell: {
    width: 38,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  calCellSelected: {
    backgroundColor: '#0284C7',
  },
  calCellText: {
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: '#0F172A',
  },
  calCellTextDim: {
    color: '#CBD5E1',
  },
  calCellTextSelected: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  calFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  calTodayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  calTodayText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#0284C7',
  },
  calCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  calCloseText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
});
