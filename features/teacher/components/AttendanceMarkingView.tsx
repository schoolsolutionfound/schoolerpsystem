import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  useWindowDimensions,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { fetchRosterApi, fetchAttendanceForSlotApi, markAttendanceApi } from '../../../api/academics';
import { ClassTransferStore } from '../../shared/services/classTransferStore';
import { ClassTransfer } from '../../shared/types/classTransfer.types';
import { AttendanceStore } from '../../shared/services/attendanceStore';

export type AttendanceStatus = 'present' | 'absent';

export interface FacultyClassItem {
  id: string;
  slotId: string;
  classSectionName: string;
  subjectCode: string;
  subjectName: string;
  department: string;
  studentCount: number;
  periodTime: string;
  scheduledDays: number[]; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  scheduledDaysText: string;
  isTemporary?: boolean;
  transferredFrom?: string;
  transferReason?: string;
  transferDate?: string;
  transferredOutTo?: string;
  transferredOutDate?: string;
}

export interface AttendanceMarkingViewProps {
  slotId?: string;
  subjectName?: string;
  onSaved?: () => void;
  onBack?: () => void;
}

// Assigned institutional classes taught by faculty
export const FACULTY_ASSIGNED_CLASSES: FacultyClassItem[] = [
  {
    id: 'cls-cse-3a',
    slotId: 'slot-cse-3a',
    classSectionName: 'CSE 3rd Year · Sec A',
    subjectCode: 'CS301',
    subjectName: 'Data Structures & Algorithms',
    department: 'Computer Science',
    studentCount: 42,
    periodTime: '09:00 AM - 09:50 AM',
    scheduledDays: [1, 2, 3, 4, 5], // Mon - Fri
    scheduledDaysText: 'Mon - Fri',
  },
  {
    id: 'cls-cse-2b',
    slotId: 'slot-cse-2b',
    classSectionName: 'CSE 2nd Year · Sec B',
    subjectCode: 'CS204',
    subjectName: 'Database Management Systems',
    department: 'Computer Science',
    studentCount: 38,
    periodTime: '10:00 AM - 10:50 AM',
    scheduledDays: [1, 2, 3, 4, 5], // Mon - Fri
    scheduledDaysText: 'Mon - Fri',
  },
  {
    id: 'cls-ece-1a',
    slotId: 'slot-ece-1a',
    classSectionName: 'ECE 1st Year · Sec A',
    subjectCode: 'EC102',
    subjectName: 'Digital Electronics & Circuits',
    department: 'Electronics & Comm',
    studentCount: 40,
    periodTime: '11:15 AM - 12:05 PM',
    scheduledDays: [1, 2, 3, 4, 5], // Mon - Fri
    scheduledDaysText: 'Mon - Fri',
  },
  {
    id: 'cls-aiml-2a',
    slotId: 'slot-aiml-2a',
    classSectionName: 'AIML 2nd Year · Sec A',
    subjectCode: 'AI201',
    subjectName: 'Machine Learning Fundamentals',
    department: 'AIML',
    studentCount: 36,
    periodTime: '01:00 PM - 01:50 PM',
    scheduledDays: [1, 2, 3, 4, 5], // Mon - Fri
    scheduledDaysText: 'Mon - Fri',
  },
  {
    id: 'cls-cse-4a',
    slotId: 'slot-cse-4a',
    classSectionName: 'CSE 4th Year · Sec A',
    subjectCode: 'CS402',
    subjectName: 'Cloud Computing & Distributed Systems',
    department: 'Computer Science',
    studentCount: 44,
    periodTime: '02:00 PM - 02:50 PM',
    scheduledDays: [1, 2, 3, 4, 5], // Mon - Fri
    scheduledDaysText: 'Mon - Fri',
  },
];

// Persistent offline / in-memory store for marked attendance
const SAVED_ATTENDANCE_CACHE: Record<
  string,
  {
    date: string;
    classId: string;
    entries: Record<string, AttendanceStatus>;
    presentCount: number;
    absentCount: number;
    totalCount: number;
    submittedAt: string;
  }
> = {};

function generateFallbackRoster(subjectName?: string, classSectionName?: string, count: number = 32) {
  const firstNames = [
    'Aarav', 'Ananya', 'Arjun', 'Bhavya', 'Deepika', 'Divya', 'Gaurav', 'Ishita',
    'Kabir', 'Karan', 'Kavya', 'Manish', 'Meera', 'Neha', 'Nikhil', 'Pooja',
    'Priya', 'Rahul', 'Riya', 'Rohan', 'Sameer', 'Shreya', 'Siddharth', 'Sneha',
    'Tanmay', 'Varun', 'Vikram', 'Aditi', 'Pranav', 'Rhea', 'Kunal', 'Tarun',
    'Yash', 'Anushka', 'Harsh', 'Sanjana', 'Akash', 'Shruti', 'Aryan', 'Sakshi',
    'Rishabh', 'Tara', 'Ayush', 'Swati'
  ];
  const lastNames = [
    'Sharma', 'Verma', 'Gupta', 'Patil', 'Iyer', 'Deshmukh', 'Singh', 'Reddy',
    'Mehta', 'Nair', 'Kulkarni', 'Joshi', 'Chopra', 'Malhotra', 'Bose', 'Chatterjee',
    'Sen', 'Pillai', 'Rao', 'Shetty', 'Bhat', 'Kamath', 'Hegde', 'Gowda'
  ];

  const combined = `${subjectName || ''} ${classSectionName || ''}`.toUpperCase();
  const deptCode = combined.includes('ECE') || combined.includes('ELECTRONIC') || combined.includes('CIRCUIT')
    ? 'EC'
    : combined.includes('AIML') || combined.includes('MACHINE') || combined.includes('AI')
    ? 'AI'
    : combined.includes('MECH')
    ? 'ME'
    : 'CS';

  const list = Array.from({ length: count }, (_, i) => {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3 + 2) % lastNames.length];
    const num = (i + 1).toString().padStart(3, '0');
    const totalClasses = 10;
    const attendedClasses = Math.max(6, Math.min(10, 7 + ((i * 3) % 4)));
    const percentage = Math.round((attendedClasses / totalClasses) * 100);
    return {
      id: `student-roster-${deptCode}-${i + 1}`,
      fullName: `${fn} ${ln}`,
      rollNoOrUSN: `1VM26${deptCode}${num}`,
      attendanceStats: `${attendedClasses}/${totalClasses} • ${percentage}%`,
    };
  });

  // Strict ascending order according to USN
  return list.sort((a, b) => a.rollNoOrUSN.localeCompare(b.rollNoOrUSN));
}

function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(`${dateStr}T00:00:00Z`);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

const CALENDAR_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CALENDAR_DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const AttendanceMarkingView: React.FC<AttendanceMarkingViewProps> = ({
  slotId: initialSlotId,
  subjectName: initialSubjectName,
  onSaved,
  onBack,
}) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 420;
  const responsiveScheduleFontSize = Math.max(11, Math.min(13, Math.round(width * 0.032)));

  // Selected date (defaults to today)
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Interactive Calendar Picker State
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [viewingMonth, setViewingMonth] = useState<Date>(() => {
    const cur = new Date();
    return new Date(cur.getFullYear(), cur.getMonth(), 1);
  });

  const handleOpenCalendar = () => {
    try {
      const cur = new Date(`${selectedDate}T00:00:00Z`);
      setViewingMonth(new Date(cur.getUTCFullYear(), cur.getUTCMonth(), 1));
    } catch {
      const now = new Date();
      setViewingMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    }
    setCalendarModalVisible(true);
  };

  const changeViewingMonth = (delta: number) => {
    setViewingMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  // Calendar days calculation
  const calendarGrid = useMemo(() => {
    const year = viewingMonth.getFullYear();
    const month = viewingMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells: Array<{
      day: number | null;
      dateStr: string | null;
      isToday: boolean;
      isSelected: boolean;
      isFuture: boolean;
    }> = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, dateStr: null, isToday: false, isSelected: false, isFuture: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      cells.push({
        day: d,
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isFuture: dateStr > todayStr,
      });
    }

    return cells;
  }, [viewingMonth, selectedDate, todayStr]);

  const handleSelectCalendarDate = (dateStr: string) => {
    if (dateStr > todayStr) {
      Alert.alert('Future Date Restricted', 'Attendance cannot be recorded for tomorrow or future dates.');
      return;
    }
    if (dateStr === selectedDate) {
      setCalendarModalVisible(false);
      return;
    }
    if (hasUnsavedChanges) {
      setOnDiscardCallback(() => () => {
        setSelectedDate(dateStr);
        setCalendarModalVisible(false);
      });
      setShowUnsavedModal(true);
      return;
    }
    setSelectedDate(dateStr);
    setCalendarModalVisible(false);
  };

  // Shared Class Transfers subscription
  const [transfers, setTransfers] = useState<ClassTransfer[]>(() => ClassTransferStore.getAllTransfers());
  const [, setAttendanceStoreVer] = useState(0);

  useEffect(() => {
    const unsubTransfer = ClassTransferStore.subscribe(() => {
      setTransfers(ClassTransferStore.getAllTransfers());
    });
    const unsubAttendance = AttendanceStore.subscribe(() => {
      setAttendanceStoreVer((v) => v + 1);
    });
    return () => {
      unsubTransfer();
      unsubAttendance();
    };
  }, []);

  // Compute all available classes including temporary/substituted classes
  const allClasses = useMemo<FacultyClassItem[]>(() => {
    const regular = FACULTY_ASSIGNED_CLASSES.map((cls) => {
      const transferOut = transfers.find(
        (t) =>
          t.classSectionName.toLowerCase().trim() === cls.classSectionName.toLowerCase().trim() &&
          t.subjectName.toLowerCase().trim() === cls.subjectName.toLowerCase().trim() &&
          t.originalTeacherName === 'Teacher' &&
          t.substituteTeacherName !== 'Teacher'
      );
      return {
        ...cls,
        transferredOutTo: transferOut ? transferOut.substituteTeacherName : undefined,
        transferredOutDate: transferOut?.date,
      };
    });

    // Substituted classes transferred to this faculty (or available temporary sessions)
    const temporary = transfers
      .filter((t) => t.isTemporary)
      .map((t) => ({
        id: `temp-${t.id}`,
        slotId: `slot-temp-${t.id}`,
        classSectionName: t.classSectionName,
        subjectCode: 'SUB',
        subjectName: t.subjectName,
        department: 'Academic Coverage',
        studentCount: 35,
        periodTime: t.periodTime || '10:00 AM - 10:50 AM',
        scheduledDays: [0, 1, 2, 3, 4, 5, 6],
        scheduledDaysText: `Coverage on ${formatDateDisplay(t.date)}`,
        isTemporary: true,
        transferredFrom: t.originalTeacherName,
        transferReason: t.reason,
        transferDate: t.date,
      }));

    return [...regular, ...temporary];
  }, [transfers]);

  // Active class session for marking
  const [selectedClass, setSelectedClass] = useState<FacultyClassItem | null>(() => {
    if (initialSlotId) {
      const match = FACULTY_ASSIGNED_CLASSES.find((c) => c.slotId === initialSlotId || c.id === initialSlotId);
      if (match) return match;
      const allT = ClassTransferStore.getAllTransfers();
      const tempMatch = allT.find(
        (t) => `slot-temp-${t.id}` === initialSlotId || `temp-${t.id}` === initialSlotId || t.id === initialSlotId
      );
      if (tempMatch) {
        return {
          id: `temp-${tempMatch.id}`,
          slotId: `slot-temp-${tempMatch.id}`,
          classSectionName: tempMatch.classSectionName,
          subjectCode: 'SUB',
          subjectName: tempMatch.subjectName,
          department: 'Academic Coverage',
          studentCount: 35,
          periodTime: tempMatch.periodTime || '10:00 AM - 10:50 AM',
          scheduledDays: [0, 1, 2, 3, 4, 5, 6],
          scheduledDaysText: `Coverage on ${formatDateDisplay(tempMatch.date)}`,
          isTemporary: true,
          transferredFrom: tempMatch.originalTeacherName,
          transferReason: tempMatch.reason,
          transferDate: tempMatch.date,
        };
      }
      return {
        id: initialSlotId,
        slotId: initialSlotId,
        classSectionName: 'Class Section',
        subjectCode: 'GEN',
        subjectName: initialSubjectName || 'Course Lecture',
        department: 'Academics',
        studentCount: 30,
        periodTime: 'Current Period',
        scheduledDays: [0, 1, 2, 3, 4, 5, 6],
        scheduledDaysText: 'Daily',
      };
    }
    return null;
  });

  // Sync selectedClass if initialSlotId changes dynamically from My Schedule
  useEffect(() => {
    if (initialSlotId) {
      const match = FACULTY_ASSIGNED_CLASSES.find((c) => c.slotId === initialSlotId || c.id === initialSlotId);
      if (match) {
        setSelectedClass(match);
        return;
      }
      const allT = ClassTransferStore.getAllTransfers();
      const tempMatch = allT.find(
        (t) => `slot-temp-${t.id}` === initialSlotId || `temp-${t.id}` === initialSlotId || t.id === initialSlotId
      );
      if (tempMatch) {
        setSelectedClass({
          id: `temp-${tempMatch.id}`,
          slotId: `slot-temp-${tempMatch.id}`,
          classSectionName: tempMatch.classSectionName,
          subjectCode: 'SUB',
          subjectName: tempMatch.subjectName,
          department: 'Academic Coverage',
          studentCount: 35,
          periodTime: tempMatch.periodTime || '10:00 AM - 10:50 AM',
          scheduledDays: [0, 1, 2, 3, 4, 5, 6],
          scheduledDaysText: `Coverage on ${formatDateDisplay(tempMatch.date)}`,
          isTemporary: true,
          transferredFrom: tempMatch.originalTeacherName,
          transferReason: tempMatch.reason,
          transferDate: tempMatch.date,
        });
        return;
      }
      setSelectedClass({
        id: initialSlotId,
        slotId: initialSlotId,
        classSectionName: 'Class Section',
        subjectCode: 'GEN',
        subjectName: initialSubjectName || 'Course Lecture',
        department: 'Academics',
        studentCount: 30,
        periodTime: 'Current Period',
        scheduledDays: [0, 1, 2, 3, 4, 5, 6],
        scheduledDaysText: 'Daily',
      });
    }
  }, [initialSlotId, initialSubjectName]);

  // Marking Screen State
  const [roster, setRoster] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [transferredOutInfo, setTransferredOutInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Unsaved Changes Modal State
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [onDiscardCallback, setOnDiscardCallback] = useState<(() => void) | null>(null);

  // Safe Navigation Back Handler
  const navigateBack = useCallback(() => {
    setHasUnsavedChanges(false);
    setShowUnsavedModal(false);
    setOnDiscardCallback(null);
    if (initialSlotId) {
      if (onBack) {
        onBack();
      } else if (onSaved) {
        onSaved();
      }
    } else if (selectedClass) {
      setSelectedClass(null);
      onSaved?.();
    } else if (onBack) {
      onBack();
    }
  }, [initialSlotId, selectedClass, onBack, onSaved]);

  // Date Navigation Helpers
  const shiftDate = (days: number) => {
    if (days > 0 && selectedDate >= todayStr) {
      Alert.alert('Future Date Restricted', 'Attendance cannot be recorded for tomorrow or future dates.');
      return;
    }
    if (hasUnsavedChanges) {
      setOnDiscardCallback(() => () => performDateShift(days));
      setShowUnsavedModal(true);
      return;
    }
    performDateShift(days);
  };

  const performDateShift = (days: number) => {
    const cur = new Date(`${selectedDate}T00:00:00Z`);
    cur.setUTCDate(cur.getUTCDate() + days);
    const nextDate = cur.toISOString().slice(0, 10);
    if (nextDate > todayStr) {
      Alert.alert('Future Date Restricted', 'Attendance cannot be recorded for tomorrow or future dates.');
      return;
    }
    setSelectedDate(nextDate);
  };

  const jumpToToday = () => {
    if (selectedDate === todayStr) return;
    if (hasUnsavedChanges) {
      setOnDiscardCallback(() => () => setSelectedDate(todayStr));
      setShowUnsavedModal(true);
      return;
    }
    setSelectedDate(todayStr);
  };

  // Check if a class has session scheduled on selectedDate
  const checkClassScheduledOnDate = useCallback((cls: FacultyClassItem, dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00Z`);
    const dayOfWeek = d.getUTCDay(); // 0 = Sun, 1 = Mon ...
    return cls.scheduledDays.includes(dayOfWeek);
  }, []);

  // Load roster and previously saved attendance when a class is selected
  const loadClassAttendance = useCallback(
    async (cls: FacultyClassItem, dateStr: string) => {
      setLoading(true);
      setSearchQuery('');
      setStatusFilter('all');
      setHasUnsavedChanges(false);

      const cacheKey = `${cls.id}_${dateStr}`;
      const cached = SAVED_ATTENDANCE_CACHE[cacheKey];

      try {
        const [rosterRes, existingRes] = await Promise.all([
          fetchRosterApi(cls.slotId).catch(() => null),
          fetchAttendanceForSlotApi(cls.slotId, dateStr).catch(() => null),
        ]);

        let students = rosterRes?.students || [];
        if (!students || students.length === 0) {
          students = generateFallbackRoster(cls.subjectName, cls.classSectionName, cls.studentCount);
        } else {
          students = students.map((s: any, idx: number) => {
            if (!s.attendanceStats) {
              const totalClasses = 10;
              const attendedClasses = Math.max(6, Math.min(10, 7 + ((idx * 3) % 4)));
              const percentage = Math.round((attendedClasses / totalClasses) * 100);
              return {
                ...s,
                attendanceStats: `${attendedClasses}/${totalClasses} • ${percentage}%`,
              };
            }
            return s;
          });
        }

        // Strictly sort students in ascending order according to USN / Roll number
        students.sort((a: any, b: any) => (a.rollNoOrUSN || '').localeCompare(b.rollNoOrUSN || ''));
        setRoster(students);

        const initialMarks: Record<string, AttendanceStatus> = {};
        let foundExisting = false;

        // Check AttendanceStore record
        const storeRec = AttendanceStore.getAttendanceRecord({
          classId: cls.id,
          slotId: cls.slotId,
          classSectionName: cls.classSectionName,
          subjectName: cls.subjectName,
          date: dateStr,
        });

        // Check backend existing entries
        if (existingRes?.entries && existingRes.entries.length > 0) {
          foundExisting = true;
          for (const e of existingRes.entries) {
            initialMarks[e.studentId] = e.attendanceStatus === 'absent' ? 'absent' : 'present';
          }
        } else if (cached?.entries && Object.keys(cached.entries).length > 0) {
          // Check local cache
          foundExisting = true;
          for (const s of students) {
            initialMarks[s.id] = cached.entries[s.id] || 'present';
          }
        } else if (storeRec) {
          // Check shared AttendanceStore
          foundExisting = true;
          if (storeRec.entries && Object.keys(storeRec.entries).length > 0) {
            for (const s of students) {
              initialMarks[s.id] = storeRec.entries[s.id] || 'present';
            }
          } else {
            for (const s of students) {
              initialMarks[s.id] = 'present';
            }
          }
        }

        const transfer = ClassTransferStore.getTransferForClassDate(cls.classSectionName, cls.subjectName, dateStr);
        const isTransferredOut = !!transfer && transfer.originalTeacherName === 'Teacher' && transfer.substituteTeacherName !== 'Teacher';

        if (isTransferredOut) {
          setTransferredOutInfo(transfer.substituteTeacherName);
        } else {
          setTransferredOutInfo(null);
        }

        setIsAlreadyMarked(foundExisting);
        setIsEditMode(!foundExisting);
        setIsEditing(foundExisting);

        // Fill remaining students as present by default draft
        for (const s of students) {
          if (!initialMarks[s.id]) {
            initialMarks[s.id] = 'present';
          }
        }

        setMarks(initialMarks);
      } catch (err: any) {
        console.warn('[AttendanceMarkingView] load error:', err?.message);
        const fallback = generateFallbackRoster(cls.subjectName, cls.classSectionName, cls.studentCount);
        fallback.sort((a, b) => a.rollNoOrUSN.localeCompare(b.rollNoOrUSN));
        setRoster(fallback);
        const initialMarks: Record<string, AttendanceStatus> = {};
        for (const s of fallback) initialMarks[s.id] = 'present';
        setMarks(initialMarks);
        setIsAlreadyMarked(false);
        setIsEditMode(true);
        setIsEditing(false);
        setTransferredOutInfo(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Trigger loading when selectedClass or selectedDate changes
  useEffect(() => {
    if (selectedClass) {
      loadClassAttendance(selectedClass, selectedDate);
    }
  }, [selectedClass, selectedDate, loadClassAttendance]);

  // Click on a class card from the list
  const handleSelectClass = (cls: FacultyClassItem) => {
    setSelectedClass(cls);
  };

  // Safe Back Button Handler with unsaved changes verification
  const handleBackPress = () => {
    if (hasUnsavedChanges) {
      setOnDiscardCallback(null);
      setShowUnsavedModal(true);
    } else {
      navigateBack();
    }
  };

  // Attendance Toggle (Row click or status button)
  const toggleStudentStatus = (studentId: string) => {
    if (selectedDate > todayStr) {
      Alert.alert('Future Date Restricted', 'Attendance cannot be recorded for tomorrow or future dates.');
      return;
    }
    if (isAlreadyMarked && !isEditMode) {
      Alert.alert(
        'Session Marked',
        'This class attendance is already recorded. Tap "Edit Attendance" to make changes.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit Attendance', onPress: () => setIsEditMode(true) },
        ]
      );
      return;
    }
    const current = marks[studentId] || 'present';
    const nextStatus: AttendanceStatus = current === 'present' ? 'absent' : 'present';
    setMarks((prev) => ({
      ...prev,
      [studentId]: nextStatus,
    }));
    setHasUnsavedChanges(true);
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    if (selectedDate > todayStr) {
      Alert.alert('Future Date Restricted', 'Attendance cannot be recorded for tomorrow or future dates.');
      return;
    }
    if (isAlreadyMarked && !isEditMode) {
      setIsEditMode(true);
      return;
    }
    if (marks[studentId] === status) {
      // Tapping the currently active status also toggles for intuitive one-handed editing
      const nextStatus: AttendanceStatus = status === 'present' ? 'absent' : 'present';
      setMarks((prev) => ({
        ...prev,
        [studentId]: nextStatus,
      }));
      setHasUnsavedChanges(true);
      return;
    }
    setMarks((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    setHasUnsavedChanges(true);
  };

  // Calculate live counts
  const { totalStudents, presentCount, absentCount } = useMemo(() => {
    let p = 0;
    let a = 0;
    for (const s of roster) {
      if (marks[s.id] === 'absent') {
        a++;
      } else {
        p++;
      }
    }
    return {
      totalStudents: roster.length,
      presentCount: p,
      absentCount: a,
    };
  }, [roster, marks]);

  // Search and status-filtered roster (USN or Name & Present/Absent)
  const filteredRoster = useMemo(() => {
    return roster.filter((s) => {
      const currentStatus = marks[s.id] || 'present';
      if (statusFilter === 'present' && currentStatus !== 'present') return false;
      if (statusFilter === 'absent' && currentStatus !== 'absent') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchUSN = (s.rollNoOrUSN || '').toLowerCase().includes(q);
        const matchName = (s.fullName || '').toLowerCase().includes(q);
        if (!matchUSN && !matchName) return false;
      }
      return true;
    });
  }, [roster, marks, statusFilter, searchQuery]);

  // Submit / Save Handler
  const handleSubmitAttendance = async () => {
    if (!selectedClass || roster.length === 0) return;
    if (selectedDate > todayStr) {
      Alert.alert('Future Date Restricted', 'Attendance cannot be recorded for tomorrow or future dates.');
      return;
    }
    setSaving(true);
    try {
      const entries = roster.map((s) => ({
        studentId: s.id,
        attendanceStatus: marks[s.id] || 'present',
      }));

      // Call API
      try {
        await markAttendanceApi({
          timetableSlotId: selectedClass.slotId,
          date: selectedDate,
          entries,
        });
      } catch (apiErr: any) {
        console.warn('[AttendanceMarkingView] remote sync notice:', apiErr?.message);
      }

      // Save to local cache
      const cacheKey = `${selectedClass.id}_${selectedDate}`;
      const submittedTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      SAVED_ATTENDANCE_CACHE[cacheKey] = {
        date: selectedDate,
        classId: selectedClass.id,
        entries: { ...marks },
        presentCount,
        absentCount,
        totalCount: totalStudents,
        submittedAt: submittedTimeStr,
      };

      // Save to shared attendance store
      AttendanceStore.saveAttendance({
        date: selectedDate,
        classId: selectedClass.id,
        slotId: selectedClass.slotId,
        classSectionName: selectedClass.classSectionName,
        subjectName: selectedClass.subjectName,
        entries: { ...marks },
        presentCount,
        absentCount,
        totalCount: totalStudents,
        submittedAt: submittedTimeStr,
      });

      setHasUnsavedChanges(false);
      setIsAlreadyMarked(true);
      setIsEditMode(false);
      setIsEditing(true);
      setShowUnsavedModal(false);
      setOnDiscardCallback(null);

      // Automatically go back immediately upon submitting attendance
      navigateBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record attendance');
    } finally {
      setSaving(false);
    }
  };

  // =========================================================================
  // VIEW MODE 1: FACULTY CLASSES LIST (When no class is currently opened)
  // =========================================================================
  if (!selectedClass) {
    return (
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.viewHeader}>
          <Text style={styles.viewTitle}>Mark Attendance</Text>
          <View style={styles.classesCountPill}>
            <Text style={styles.classesCountPillText}>
              {allClasses.length} Classes
            </Text>
          </View>
        </View>

        {/* Classes List */}
        <ScrollView
          contentContainerStyle={styles.classesScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {allClasses.map((cls) => {
            const isScheduledToday = checkClassScheduledOnDate(cls, todayStr);
            const isMarked = AttendanceStore.isAttendanceMarked({
              classId: cls.id,
              slotId: cls.slotId,
              classSectionName: cls.classSectionName,
              subjectName: cls.subjectName,
              date: todayStr,
            });

            const isTomorrow = (() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              return cls.scheduledDays.includes(tomorrow.getDay());
            })();

            return (
              <TouchableOpacity
                key={cls.id}
                style={[
                  styles.classCard,
                  cls.isTemporary && styles.temporaryClassCard,
                  !isScheduledToday && !isMarked && styles.classCardNotToday,
                ]}
                onPress={() => handleSelectClass(cls)}
                activeOpacity={isScheduledToday || isMarked ? 0.8 : 0.65}
              >
                {/* Top Section: Pill Badge */}
                <View style={styles.cardBadgesRow}>
                  <View style={styles.sectionBadgePill}>
                    <Text style={styles.sectionBadgeText}>{cls.classSectionName}</Text>
                  </View>

                  {!isScheduledToday && !isMarked && (
                    <View style={styles.notTodayBadgeWrap}>
                      <Text style={styles.notTodayBadgeText}>
                        {isTomorrow ? 'Scheduled Tomorrow' : `Next: ${cls.scheduledDaysText}`}
                      </Text>
                    </View>
                  )}

                  {cls.isTemporary ? (
                    <View style={styles.temporaryPill}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color="#92400E" />
                      <Text style={styles.temporaryPillText}>TEMPORARY CLASS</Text>
                    </View>
                  ) : cls.transferredOutTo ? (
                    <View style={styles.transferredOutBadgeWrap}>
                      <MaterialCommunityIcons name="swap-horizontal" size={13} color="#92400E" />
                      <Text style={styles.transferredOutBadgeText}>
                        Transferred: {cls.transferredOutTo}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Subject Title */}
                <Text style={styles.cardSubjectTitle}>{cls.subjectName}</Text>

                {/* Substituted Coverage Note if temporary */}
                {cls.isTemporary && cls.transferredFrom ? (
                  <Text style={styles.temporarySubFromText}>
                    Substituted from {cls.transferredFrom}
                    {cls.transferReason ? ` • ${cls.transferReason}` : ''}
                  </Text>
                ) : null}

                {/* Student Count Text (Clean without icon) */}
                <Text style={styles.cardStudentCountText}>{cls.studentCount} Students</Text>

                {/* Subtle Divider Line */}
                <View style={styles.cardDivider} />

                {/* Bottom Row: Clock + Schedule on Left, Button on Right */}
                <View style={styles.cardBottomRow}>
                  <View style={styles.scheduleInfoWrap}>
                    <Feather name="clock" size={14} color="#D97706" />
                    <Text
                      style={[
                        styles.scheduleText,
                        { fontSize: responsiveScheduleFontSize },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {cls.periodTime || '10:00 AM - 10:50 AM'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.markCtaBtn,
                      cls.isTemporary && styles.markCtaBtnTemporary,
                      isMarked && styles.markCtaBtnMarked,
                      !isScheduledToday && !isMarked && styles.markCtaBtnNotScheduled,
                    ]}
                  >
                    {isMarked ? (
                      <>
                        <Feather name="check" size={13} color="#111827" />
                        <Text style={[styles.markCtaBtnText, styles.markCtaBtnMarkedText]}>
                          Marked · Edit
                        </Text>
                        <Feather name="chevron-right" size={13} color="#6B7280" />
                      </>
                    ) : !isScheduledToday ? (
                      <Text style={[styles.markCtaBtnText, styles.markCtaBtnNotScheduledText]}>
                        {isTomorrow ? 'Scheduled Tomorrow' : 'Not Scheduled'}
                      </Text>
                    ) : (
                      <>
                        <Text style={styles.markCtaBtnText}>
                          {cls.isTemporary ? 'Mark Coverage' : 'Mark Attendance'}
                        </Text>
                        <Feather name="chevron-right" size={14} color="#111827" />
                      </>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // =========================================================================
  // VIEW MODE 2: ATTENDANCE MARKING & EDITING SCREEN
  // =========================================================================
  const isToday = selectedDate === todayStr;

  return (
    <View style={styles.container}>
      {/* SCROLLABLE CONTENT WITH STICKY STATS HEADER */}
      <ScrollView
        style={styles.markingScrollView}
        contentContainerStyle={styles.markingScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[2]}
      >
        {/* Child 0: TOP HEADER (Moves up while scrolling!) */}
        <View style={styles.markingTopHeader}>
          <TouchableOpacity
            style={styles.smallBackBtn}
            onPress={handleBackPress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={18} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerHeadlineWrap}>
            <Text style={styles.markingClassTitle} numberOfLines={1}>
              {selectedClass.classSectionName}
            </Text>
            <Text style={styles.markingSubjectTitle} numberOfLines={1}>
              {selectedClass.subjectName}
            </Text>
          </View>

          <View style={styles.headerRightWrap}>
            {hasUnsavedChanges ? (
              <View style={styles.unsavedBadge}>
                <Text style={styles.unsavedBadgeText}>Unsaved</Text>
              </View>
            ) : isAlreadyMarked && !isEditMode ? (
              <TouchableOpacity
                style={styles.headerEditBtn}
                onPress={() => setIsEditMode(true)}
                activeOpacity={0.7}
              >
                <Feather name="edit-2" size={12} color="#111827" style={{ marginRight: 4 }} />
                <Text style={styles.headerEditBtnText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.modePill,
                  isEditMode && isAlreadyMarked ? styles.modePillEditing : styles.modePillNew,
                ]}
              >
                <Feather
                  name={isAlreadyMarked ? 'edit-2' : 'plus-circle'}
                  size={12}
                  color={isAlreadyMarked ? '#111827' : '#92400E'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.modePillText,
                    isAlreadyMarked ? styles.modePillTextEditing : styles.modePillTextNew,
                  ]}
                >
                  {isAlreadyMarked ? 'Editing' : 'New Session'}
                </Text>
              </View>
            )}
          </View>
        </View>
        {/* Child 1: DATE SELECTOR BAR (Scrolls up with the page!) */}
        <View style={styles.dateSelectorBar}>
          <TouchableOpacity
            style={styles.dateArrowBtn}
            onPress={() => shiftDate(-1)}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={18} color="#111827" />
          </TouchableOpacity>

          <View style={styles.dateCenterWrap}>
            <TouchableOpacity
              style={styles.dateBadgeRow}
              onPress={handleOpenCalendar}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="calendar-month-outline" size={17} color="#D97706" />
              <Text style={styles.dateDisplayLabel}>{formatDateDisplay(selectedDate)}</Text>
              {isToday ? (
                <View style={styles.todayPill}>
                  <Text style={styles.todayPillText}>TODAY</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            {!isToday && (
              <TouchableOpacity style={styles.jumpTodayBtn} onPress={jumpToToday} activeOpacity={0.7}>
                <Text style={styles.jumpTodayText}>Go to Today</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.dateArrowBtn, selectedDate >= todayStr && styles.dateArrowBtnDisabled]}
            onPress={() => shiftDate(1)}
            disabled={selectedDate >= todayStr}
            activeOpacity={0.7}
          >
            <Feather name="chevron-right" size={18} color={selectedDate >= todayStr ? '#D1D5DB' : '#111827'} />
          </TouchableOpacity>
        </View>

        {/* Child 2: STICKY STATS SUMMARY (STOPS AFTER REACHING THE TOP!) */}
        <View style={styles.stickyHeaderSection}>
          {/* CLICKABLE SUMMARY STATS (Total Students | Present | Absent) */}
          <View style={styles.statsSummaryContainer}>
            <TouchableOpacity
              style={[styles.statBox, statusFilter === 'all' && styles.statBoxActiveAll]}
              onPress={() => setStatusFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={styles.statNumber}>{totalStudents}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statBox, statusFilter === 'present' && styles.statBoxActivePresent]}
              onPress={() => setStatusFilter((cur) => (cur === 'present' ? 'all' : 'present'))}
              activeOpacity={0.7}
            >
              <Text style={[styles.statNumber, { color: '#16A34A' }]}>{presentCount}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statBox, statusFilter === 'absent' && styles.statBoxActiveAbsent]}
              onPress={() => setStatusFilter((cur) => (cur === 'absent' ? 'all' : 'absent'))}
              activeOpacity={0.7}
            >
              <Text style={[styles.statNumber, { color: '#DC2626' }]}>{absentCount}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Child 3: SEARCH BAR (Live filtering by USN or Name - Scrolls up to open screen space!) */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by USN or Student Name..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={16} color="#111827" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Child 4: ROSTER INFO ROW (Scrolls up) */}
        <View style={styles.rosterCountRow}>
          <Text style={styles.rosterCountText}>
            Showing {filteredRoster.length} of {totalStudents} Students
            {statusFilter === 'present' ? ' (Present Only)' : statusFilter === 'absent' ? ' (Absent Only)' : ''}
          </Text>
          {statusFilter !== 'all' && (
            <TouchableOpacity
              onPress={() => setStatusFilter('all')}
              style={styles.clearFilterBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.clearFilterText}>Show All</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* If this is a Temporary Substituted Class */}
        {selectedClass.isTemporary && (
          <View style={styles.temporaryClassTopBanner}>
            <MaterialCommunityIcons name="swap-horizontal" size={16} color="#92400E" />
            <View style={{ flex: 1 }}>
              <Text style={styles.temporaryClassBannerTitle}>
                Temporary Substituted Class Session
              </Text>
              <Text style={styles.temporaryClassBannerSub}>
                Coverage assigned from {selectedClass.transferredFrom} • Attendance responsibility delegated to you
                {selectedClass.transferReason ? ` • Note: ${selectedClass.transferReason}` : ''}
              </Text>
            </View>
          </View>
        )}

        {/* If this class was transferred out to another substitute teacher on selectedDate */}
        {transferredOutInfo && (
          <View style={styles.transferredOutBanner}>
            <MaterialCommunityIcons name="account-arrow-right" size={16} color="#1E40AF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.transferredOutBannerTitle}>
                Class Transferred to Substitute Faculty
              </Text>
              <Text style={styles.transferredOutBannerSub}>
                This class session was transferred to {transferredOutInfo} on {formatDateDisplay(selectedDate)}. Attendance responsibility was assigned to the substitute teacher.
              </Text>
            </View>
          </View>
        )}


        {/* Future Date Warning Banner */}
        {selectedDate > todayStr && (
          <View style={styles.futureDateBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#B45309" />
            <View style={{ flex: 1 }}>
              <Text style={styles.futureDateBannerTitle}>
                Future Date Session (Tomorrow / Upcoming)
              </Text>
              <Text style={styles.futureDateBannerSub}>
                Attendance cannot be recorded before a class session takes place. Please record attendance on the scheduled date.
              </Text>
            </View>
          </View>
        )}

        {/* STUDENT ROSTER (Structured Brand-Colored Roster) */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#111827" />
            <Text style={styles.loadingText}>Loading class roster...</Text>
          </View>
        ) : filteredRoster.length === 0 ? (
          <View style={styles.emptySearchBox}>
            <Feather name="users" size={32} color="#9CA3AF" />
            <Text style={styles.emptySearchTitle}>
              {statusFilter !== 'all'
                ? `No students marked as ${statusFilter}`
                : `No students match "${searchQuery}"`}
            </Text>
            <Text style={styles.emptySearchSub}>
              {statusFilter !== 'all'
                ? 'Click "Show All" or tap the summary box above to view all students.'
                : 'Try searching with a different USN or name.'}
            </Text>
          </View>
        ) : (
          <View style={styles.rosterListWrap}>
            {filteredRoster.map((student) => {
              const currentStatus = marks[student.id] || 'present';
              const isPresent = currentStatus === 'present';
              const isAbsent = currentStatus === 'absent';

              return (
                <TouchableOpacity
                  key={student.id}
                  style={styles.studentCard}
                  onPress={() => toggleStudentStatus(student.id)}
                  activeOpacity={0.8}
                >
                  {/* Left: Student Name, USN, and Brand Stat Pill */}
                  <View style={styles.studentInfoLeft}>
                    <Text style={styles.studentFullName}>{student.fullName}</Text>
                    <Text style={styles.studentUSN}>{student.rollNoOrUSN}</Text>
                    <View style={styles.studentStatsBadge}>
                      <Text style={styles.studentStatsText}>
                        {student.attendanceStats || '7/10 · 70%'}
                      </Text>
                    </View>
                  </View>

                  {/* Right: Single Badge in View Mode, or Present | Absent segmented form in Edit Mode */}
                  {isAlreadyMarked && !isEditMode ? (
                    <View
                      style={[
                        styles.singleStatusBtn,
                        isPresent ? styles.presentStatusBtn : styles.absentStatusBtn,
                      ]}
                    >
                      <Feather
                        name={isPresent ? 'check' : 'x'}
                        size={11}
                        color={isPresent ? '#111827' : '#FFFFFF'}
                      />
                      <Text
                        style={[
                          styles.singleStatusText,
                          isPresent ? styles.presentStatusText : styles.absentStatusText,
                        ]}
                      >
                        {isPresent ? 'Present' : 'Absent'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.segmentedToggleWrap}>
                      <TouchableOpacity
                        style={[
                          styles.segmentBtn,
                          styles.segmentBtnLeft,
                          isPresent ? styles.segmentPresentActive : styles.segmentInactive,
                        ]}
                        onPress={() => setStudentStatus(student.id, 'present')}
                        disabled={selectedDate > todayStr}
                        activeOpacity={0.8}
                      >
                        <Feather
                          name="check"
                          size={11}
                          color={isPresent ? '#111827' : '#9CA3AF'}
                        />
                        <Text
                          style={[
                            styles.segmentBtnText,
                            isPresent ? styles.segmentPresentTextActive : styles.segmentTextInactive,
                          ]}
                        >
                          Present
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.segmentDivider} />

                      <TouchableOpacity
                        style={[
                          styles.segmentBtn,
                          styles.segmentBtnRight,
                          isAbsent ? styles.segmentAbsentActive : styles.segmentInactive,
                        ]}
                        onPress={() => setStudentStatus(student.id, 'absent')}
                        disabled={selectedDate > todayStr}
                        activeOpacity={0.8}
                      >
                        <Feather
                          name="x"
                          size={11}
                          color={isAbsent ? '#FFFFFF' : '#9CA3AF'}
                        />
                        <Text
                          style={[
                            styles.segmentBtnText,
                            isAbsent ? styles.segmentAbsentTextActive : styles.segmentTextInactive,
                          ]}
                        >
                          Absent
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* DOCKED SUBMIT / EDIT BAR */}
      <View style={styles.submitBarDock}>
        {isAlreadyMarked && !isEditMode ? (
          <TouchableOpacity
            style={[
              styles.editAttendanceBtn,
              (loading || roster.length === 0 || selectedDate > todayStr) && styles.submitButtonDisabled,
            ]}
            onPress={() => setIsEditMode(true)}
            disabled={loading || roster.length === 0 || selectedDate > todayStr}
            activeOpacity={0.85}
          >
            <Feather name="edit-2" size={16} color="#111827" style={{ marginRight: 8 }} />
            <Text style={styles.editAttendanceBtnText}>Edit Attendance</Text>
          </TouchableOpacity>
        ) : isAlreadyMarked && isEditMode ? (
          <View style={styles.editDockRow}>
            <TouchableOpacity
              style={styles.cancelEditBtn}
              onPress={() => {
                if (hasUnsavedChanges) {
                  Alert.alert(
                    'Discard Edits',
                    'Are you sure you want to discard your changes to this attendance session?',
                    [
                      { text: 'Keep Editing', style: 'cancel' },
                      {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => {
                          if (selectedClass) loadClassAttendance(selectedClass, selectedDate);
                          setIsEditMode(false);
                        },
                      },
                    ]
                  );
                } else {
                  setIsEditMode(false);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelEditBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveChangesBtn,
                (saving || roster.length === 0) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitAttendance}
              disabled={saving || loading || roster.length === 0}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <>
                  <Feather name="check" size={17} color="#111827" style={{ marginRight: 6 }} />
                  <Text style={styles.saveChangesBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              (saving || roster.length === 0 || selectedDate > todayStr) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitAttendance}
            disabled={saving || loading || roster.length === 0 || selectedDate > todayStr}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#F4C430" />
            ) : selectedDate > todayStr ? (
              <Text style={[styles.submitButtonText, styles.submitButtonTextDisabled]}>
                Cannot Mark Future Date
              </Text>
            ) : (
              <>
                <Feather
                  name="check-circle"
                  size={18}
                  color="#F4C430"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitButtonText}>Submit Attendance</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* CALENDAR DATE PICKER MODAL */}
      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCalendarModalVisible(false)} />
          <View style={styles.calendarModalCard}>
            {/* Header */}
            <View style={styles.calendarModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.calendarModalIconWrap}>
                  <MaterialCommunityIcons name="calendar-month" size={18} color="#D97706" />
                </View>
                <Text style={styles.calendarModalTitle}>Select Attendance Date</Text>
              </View>
              <TouchableOpacity
                onPress={() => setCalendarModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Month Switcher Row */}
            <View style={styles.calendarMonthRow}>
              <TouchableOpacity
                style={styles.calendarNavBtn}
                onPress={() => changeViewingMonth(-1)}
                activeOpacity={0.7}
              >
                <Feather name="chevron-left" size={18} color="#111827" />
              </TouchableOpacity>

              <Text style={styles.calendarMonthText}>
                {CALENDAR_MONTH_NAMES[viewingMonth.getMonth()]} {viewingMonth.getFullYear()}
              </Text>

              <TouchableOpacity
                style={[
                  styles.calendarNavBtn,
                  viewingMonth.getFullYear() >= new Date().getFullYear() &&
                    viewingMonth.getMonth() >= new Date().getMonth() &&
                    styles.calendarNavBtnDisabled,
                ]}
                onPress={() => changeViewingMonth(1)}
                disabled={
                  viewingMonth.getFullYear() >= new Date().getFullYear() &&
                  viewingMonth.getMonth() >= new Date().getMonth()
                }
                activeOpacity={0.7}
              >
                <Feather
                  name="chevron-right"
                  size={18}
                  color={
                    viewingMonth.getFullYear() >= new Date().getFullYear() &&
                    viewingMonth.getMonth() >= new Date().getMonth()
                      ? '#D1D5DB'
                      : '#111827'
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Day Labels Row: Su, Mo, Tu, We, Th, Fr, Sa */}
            <View style={styles.calendarWeekRow}>
              {CALENDAR_DAY_LABELS.map((dayLabel, idx) => (
                <Text
                  key={dayLabel}
                  style={[
                    styles.calendarWeekText,
                    (idx === 0 || idx === 6) && styles.calendarWeekendText,
                  ]}
                >
                  {dayLabel}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.calendarGrid}>
              {calendarGrid.map((cell, idx) => {
                if (!cell.day || !cell.dateStr) {
                  return <View key={`empty-${idx}`} style={styles.calendarEmptyCell} />;
                }

                return (
                  <TouchableOpacity
                    key={`day-${cell.dateStr}`}
                    style={[
                      styles.calendarDayCell,
                      cell.isToday && styles.calendarDayToday,
                      cell.isSelected && styles.calendarDaySelected,
                      cell.isFuture && styles.calendarDayDisabled,
                    ]}
                    onPress={() => handleSelectCalendarDate(cell.dateStr!)}
                    disabled={cell.isFuture}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        cell.isToday && styles.calendarDayTextToday,
                        cell.isSelected && styles.calendarDayTextSelected,
                        cell.isFuture && styles.calendarDayTextDisabled,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer with Today Jump & Done */}
            <View style={styles.calendarModalFooter}>
              <TouchableOpacity
                style={styles.calendarTodayActionBtn}
                onPress={() => handleSelectCalendarDate(todayStr)}
                activeOpacity={0.8}
              >
                <Text style={styles.calendarTodayActionText}>Select Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.calendarCloseBtn}
                onPress={() => setCalendarModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.calendarCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* UNSAVED CHANGES MODAL (Light Yellow Background, Yellow & Black Buttons) */}
      <Modal
        visible={showUnsavedModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowUnsavedModal(false);
          setOnDiscardCallback(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.unsavedModalCard}>
            <View style={styles.modalIconWrap}>
              <Feather name="alert-triangle" size={24} color="#111827" />
            </View>

            <Text style={styles.modalTitle}>Unsaved Changes</Text>
            <Text style={styles.modalMessage}>
              You have unsaved attendance marks. Are you sure you want to go back without saving?
            </Text>

            <View style={styles.modalActionsColumn}>
              {/* Yellow Button: Save and Exit */}
              <TouchableOpacity
                style={styles.saveAndExitBtn}
                onPress={handleSubmitAttendance}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <Text style={styles.saveAndExitBtnText}>Save and Exit</Text>
                )}
              </TouchableOpacity>

              {/* Black Button: Don't Save */}
              <TouchableOpacity
                style={styles.dontSaveBtn}
                onPress={() => {
                  setShowUnsavedModal(false);
                  setHasUnsavedChanges(false);
                  if (onDiscardCallback) {
                    onDiscardCallback();
                    setOnDiscardCallback(null);
                  } else {
                    navigateBack();
                  }
                }}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Text style={styles.dontSaveBtnText}>Don't Save</Text>
              </TouchableOpacity>

              {/* Cancel / Keep Editing */}
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => {
                  setShowUnsavedModal(false);
                  setOnDiscardCallback(null);
                }}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelModalBtnText}>Keep Editing</Text>
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
    backgroundColor: '#F9FAFB', // Clean neutral background
  },

  // MODE 1: CLASSES OVERVIEW STYLES
  viewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  viewTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#111827',
  },
  classesCountPill: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  classesCountPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#92400E',
  },

  // Date Selector
  dateSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenterWrap: {
    flex: 1,
    alignItems: 'center',
  },
  dateBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateDisplayLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    color: '#111827',
  },
  todayPill: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  todayPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: '#92400E',
  },
  jumpTodayBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jumpTodayText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#111827',
  },

  classesScrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  classCardUnscheduled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.8,
  },
  cardBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  sectionBadgePill: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignSelf: 'flex-start',
  },
  sectionBadgeText: {
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    fontSize: 13,
    color: '#111827',
    letterSpacing: -0.1,
  },
  cardSubjectTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardStudentCountText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#64748B',
    marginBottom: 0,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 36,
  },
  scheduleInfoWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  scheduleText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    flexShrink: 1,
  },
  markCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F4C430',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    minHeight: 34,
    flexShrink: 0,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  markCtaBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
  },
  notTodayBadgeWrap: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  notTodayBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: '#6B7280',
  },
  classCardNotToday: {
    opacity: 0.88,
  },
  markCtaBtnNotScheduled: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 0,
    shadowOpacity: 0,
  },
  markCtaBtnNotScheduledText: {
    color: '#9CA3AF',
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },
  dateArrowBtnDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
    opacity: 0.45,
  },
  futureDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
  },
  futureDateBannerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#92400E',
  },
  futureDateBannerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#A16207',
    marginTop: 2,
    lineHeight: 15,
  },
  markedBadgePill: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  markedBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: '#15803D',
  },
  markCtaBtnMarked: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 0,
    shadowOpacity: 0,
  },
  markCtaBtnMarkedText: {
    color: '#111827',
  },

  // MODE 2: MARKING SCREEN STYLES
  markingTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  smallBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerHeadlineWrap: {
    flex: 1,
  },
  markingClassTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  markingSubjectTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 1,
  },
  headerRightWrap: {
    alignItems: 'flex-end',
  },
  lockedHeaderSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
  },
  stickyHeaderSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
    zIndex: 10,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  unsavedBadge: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unsavedBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#92400E',
  },
  modePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modePillNew: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE68A',
  },
  modePillEditing: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  modePillMarked: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  modePillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
  },
  modePillTextNew: {
    color: '#92400E',
  },
  modePillTextEditing: {
    color: '#374151',
  },
  modePillTextMarked: {
    color: '#15803D',
  },

  unscheduledNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  unscheduledNoticeText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },

  // SUMMARY STATS (Structured Brand Cards)
  statsSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  statBoxActiveAll: {
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
  },
  statBoxActivePresent: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  statBoxActiveAbsent: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  statNumber: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#111827',
  },
  statLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // SEARCH BAR
  searchBarContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 0,
  },

  // Roster Count & Filter info
  rosterCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
  },
  rosterCountText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#6B7280',
  },
  clearFilterBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  clearFilterText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#111827',
  },

  // ROSTER & UNIFIED SCROLL VIEW
  markingScrollView: {
    flex: 1,
  },
  markingScrollContent: {
    paddingBottom: 96, // Generous padding so last student card is completely visible above the dock
  },
  rosterListWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 8,
  },
  rosterScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 110,
    gap: 8,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  studentInfoLeft: {
    flex: 1,
    marginRight: 12,
  },
  studentFullName: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
  },
  studentUSN: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  studentStatsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  studentStatsText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#92400E',
  },

  // 2-BUTTON SYSTEM
  // SINGLE STATUS TOGGLE BUTTON (Shows either Present or Absent with smaller font)
  singleStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    gap: 4,
    minWidth: 78,
  },
  presentStatusBtn: {
    backgroundColor: '#F4C430',
    borderWidth: 1,
    borderColor: '#D97706',
  },
  absentStatusBtn: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#000000',
  },
  singleStatusText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  presentStatusText: {
    color: '#111827',
  },
  absentStatusText: {
    color: '#FFFFFF',
  },

  // SEGMENTED TOGGLE (Present | Absent in Edit Mode)
  segmentedToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5.5,
    gap: 3.5,
  },
  segmentBtnLeft: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  segmentBtnRight: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  segmentDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E5E7EB',
  },
  segmentInactive: {
    backgroundColor: '#F9FAFB',
  },
  segmentPresentActive: {
    backgroundColor: '#F4C430',
  },
  segmentAbsentActive: {
    backgroundColor: '#111827',
  },
  segmentBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  segmentPresentTextActive: {
    color: '#111827',
  },
  segmentAbsentTextActive: {
    color: '#FFFFFF',
  },
  segmentTextInactive: {
    color: '#9CA3AF',
  },

  twoButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 38,
    borderRadius: 8,
    gap: 4,
  },
  toggleBtnInactive: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  presentBtnActive: {
    backgroundColor: '#F4C430',
    borderWidth: 1.5,
    borderColor: '#D97706',
  },
  presentBtnTextActive: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },
  absentBtnActive: {
    backgroundColor: '#111827',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  absentBtnTextActive: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  toggleBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
  },
  toggleBtnTextInactive: {
    color: '#9CA3AF',
  },

  // DOCKED SUBMIT BAR
  submitBarDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  submitButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    color: '#F4C430',
  },
  submitButtonTextDisabled: {
    color: '#9CA3AF',
  },
  submitButtonEditing: {
    backgroundColor: '#F4C430',
    borderWidth: 1.5,
    borderColor: '#D97706',
  },
  submitButtonTextEditing: {
    color: '#111827',
  },
  editAttendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4C430',
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  editAttendanceBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    color: '#111827',
  },
  editDockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelEditBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#374151',
  },
  saveChangesBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4C430',
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  saveChangesBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    color: '#111827',
  },
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4C430',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  headerEditBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#111827',
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#6B7280',
    marginTop: 10,
  },
  emptySearchBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptySearchTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
  },
  emptySearchSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },

  // UNSAVED CHANGES POPUP (Light Yellow Background, Yellow & Black Buttons)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unsavedModalCard: {
    backgroundColor: '#FEF9C3', // Light yellow shade
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalMessage: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActionsColumn: {
    width: '100%',
    gap: 10,
  },
  saveAndExitBtn: {
    width: '100%',
    backgroundColor: '#F4C430', // Brand Yellow Button
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  saveAndExitBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    color: '#111827', // Black text on yellow button
    letterSpacing: -0.2,
  },
  dontSaveBtn: {
    width: '100%',
    backgroundColor: '#111827', // Black Button
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dontSaveBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    color: '#FFFFFF', // White text on black button
    letterSpacing: -0.2,
  },
  cancelModalBtn: {
    marginTop: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#4B5563',
  },

  // TEMPORARY CLASS & SUBSTITUTION STYLES
  temporaryClassCard: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#F4C430',
  },
  temporaryBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  temporaryPill: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  temporaryPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#92400E',
    letterSpacing: 0.4,
  },
  temporarySubFromText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#78350F',
  },
  temporaryReasonText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#92400E',
    marginBottom: 4,
  },
  markCtaBtnTemporary: {
    backgroundColor: '#FDE68A',
  },
  transferredOutBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  transferredOutBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: '#92400E',
  },
  temporaryClassTopBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: BorderRadius.card,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 10,
  },
  temporaryClassBannerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#92400E',
  },
  temporaryClassBannerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#78350F',
    marginTop: 2,
    lineHeight: 16,
  },
  transferredOutBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: BorderRadius.card,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 10,
  },
  transferredOutBannerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#1E40AF',
  },
  transferredOutBannerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#1E3A8A',
    marginTop: 2,
    lineHeight: 16,
  },
  autoPresentBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: BorderRadius.card,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 10,
  },
  autoPresentBannerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#15803D',
  },
  autoPresentBannerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#166534',
    marginTop: 2,
    lineHeight: 16,
  },
  dotSeparator: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 4,
  },

  // CALENDAR DATE PICKER MODAL STYLES
  calendarModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  calendarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  calendarModalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarModalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15.5,
    color: '#111827',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  calendarNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavBtnDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
  },
  calendarMonthText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  calendarWeekText: {
    width: '14.28%',
    textAlign: 'center',
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#6B7280',
  },
  calendarWeekendText: {
    color: '#EF4444',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 4,
  },
  calendarEmptyCell: {
    width: '14.28%',
    aspectRatio: 1,
  },
  calendarDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  calendarDayToday: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  calendarDaySelected: {
    backgroundColor: '#111827',
  },
  calendarDayDisabled: {
    opacity: 0.28,
  },
  calendarDayText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#1F2937',
  },
  calendarDayTextToday: {
    color: '#92400E',
    fontFamily: FontFamily.bold,
  },
  calendarDayTextSelected: {
    color: '#F4C430',
    fontFamily: FontFamily.bold,
  },
  calendarDayTextDisabled: {
    color: '#9CA3AF',
  },
  calendarModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  calendarTodayActionBtn: {
    flex: 1,
    backgroundColor: '#F4C430',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTodayActionText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },
  calendarCloseBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCloseBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#4B5563',
  },
});


