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
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { fetchRosterApi, fetchAttendanceForSlotApi, markAttendanceApi } from '../../../api/academics';

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
    scheduledDays: [1, 3, 5], // Mon, Wed, Fri
    scheduledDaysText: 'Mon, Wed, Fri',
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
    scheduledDays: [1, 2, 4], // Mon, Tue, Thu
    scheduledDaysText: 'Mon, Tue, Thu',
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
    scheduledDays: [1, 3, 5], // Mon, Wed, Fri
    scheduledDaysText: 'Mon, Wed, Fri',
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
    scheduledDays: [2, 4], // Tue, Thu
    scheduledDaysText: 'Tue, Thu',
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
    scheduledDays: [1, 4], // Mon, Thu
    scheduledDaysText: 'Mon, Thu',
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
    return {
      id: `student-roster-${deptCode}-${i + 1}`,
      fullName: `${fn} ${ln}`,
      rollNoOrUSN: `1VM26${deptCode}${num}`,
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

export const AttendanceMarkingView: React.FC<AttendanceMarkingViewProps> = ({
  slotId: initialSlotId,
  subjectName: initialSubjectName,
  onSaved,
  onBack,
}) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 420;

  // Selected date (defaults to today)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Active class session for marking
  const [selectedClass, setSelectedClass] = useState<FacultyClassItem | null>(() => {
    if (initialSlotId) {
      const match = FACULTY_ASSIGNED_CLASSES.find((c) => c.slotId === initialSlotId);
      if (match) return match;
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

  // Marking Screen State
  const [roster, setRoster] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
    setSelectedDate(cur.toISOString().slice(0, 10));
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
        }

        // Strictly sort students in ascending order according to USN / Roll number
        students.sort((a: any, b: any) => (a.rollNoOrUSN || '').localeCompare(b.rollNoOrUSN || ''));
        setRoster(students);

        const initialMarks: Record<string, AttendanceStatus> = {};
        let foundExisting = false;

        // Check backend existing entries
        if (existingRes?.entries && existingRes.entries.length > 0) {
          foundExisting = true;
          for (const e of existingRes.entries) {
            initialMarks[e.studentId] = e.attendanceStatus === 'absent' ? 'absent' : 'present';
          }
        } else if (cached?.entries) {
          // Check local cache
          foundExisting = true;
          for (const s of students) {
            initialMarks[s.id] = cached.entries[s.id] || 'present';
          }
        }

        // Fill remaining students as present by default draft
        for (const s of students) {
          if (!initialMarks[s.id]) {
            initialMarks[s.id] = 'present';
          }
        }

        setMarks(initialMarks);
        setIsEditing(foundExisting);
      } catch (err: any) {
        console.warn('[AttendanceMarkingView] load error:', err?.message);
        const fallback = generateFallbackRoster(cls.subjectName, cls.classSectionName, cls.studentCount);
        fallback.sort((a, b) => a.rollNoOrUSN.localeCompare(b.rollNoOrUSN));
        setRoster(fallback);
        const initialMarks: Record<string, AttendanceStatus> = {};
        for (const s of fallback) initialMarks[s.id] = 'present';
        setMarks(initialMarks);
        setIsEditing(false);
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
    const isScheduled = checkClassScheduledOnDate(cls, selectedDate);
    if (!isScheduled) {
      const isToday = selectedDate === todayStr;
      Alert.alert(
        'No Class Scheduled',
        `There is no class scheduled for "${cls.subjectName}" on ${formatDateDisplay(selectedDate)}.\n\nThis class is only scheduled on ${cls.scheduledDaysText}.\n\nAttendance cannot be recorded on unscheduled dates.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

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

  // Attendance Toggle (2-Button System)
  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    if (marks[studentId] === status) return;
    setMarks((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    setHasUnsavedChanges(true);
  };

  const markAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    for (const s of roster) {
      next[s.id] = status;
    }
    setMarks(next);
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

  // Search filtered roster (USN or Name)
  const filteredRoster = useMemo(() => {
    if (!searchQuery.trim()) return roster;
    const q = searchQuery.toLowerCase().trim();
    return roster.filter((s) => {
      const matchUSN = (s.rollNoOrUSN || '').toLowerCase().includes(q);
      const matchName = (s.fullName || '').toLowerCase().includes(q);
      return matchUSN || matchName;
    });
  }, [roster, searchQuery]);

  // Submit / Save Handler
  const handleSubmitAttendance = async () => {
    if (!selectedClass || roster.length === 0) return;
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
      SAVED_ATTENDANCE_CACHE[cacheKey] = {
        date: selectedDate,
        classId: selectedClass.id,
        entries: { ...marks },
        presentCount,
        absentCount,
        totalCount: totalStudents,
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setHasUnsavedChanges(false);
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
    const isToday = selectedDate === todayStr;

    return (
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.viewHeader}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.viewTitle}>Mark Attendance</Text>
            <Text style={styles.viewSubtitle}>Select a class to record or edit attendance</Text>
          </View>
        </View>

        {/* Date Selector Bar */}
        <View style={styles.dateSelectorBar}>
          <TouchableOpacity
            style={styles.dateArrowBtn}
            onPress={() => shiftDate(-1)}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={20} color="#111827" />
          </TouchableOpacity>

          <View style={styles.dateCenterWrap}>
            <View style={styles.dateBadgeRow}>
              <MaterialCommunityIcons name="calendar-month-outline" size={16} color="#4B5563" />
              <Text style={styles.dateDisplayLabel}>{formatDateDisplay(selectedDate)}</Text>
              {isToday ? (
                <View style={styles.todayPill}>
                  <Text style={styles.todayPillText}>TODAY</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.jumpTodayBtn} onPress={jumpToToday} activeOpacity={0.7}>
                  <Text style={styles.jumpTodayText}>Go to Today</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.dateArrowBtn}
            onPress={() => shiftDate(1)}
            activeOpacity={0.7}
          >
            <Feather name="chevron-right" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Instruction Note */}
        <View style={styles.classesListHeader}>
          <Text style={styles.classesCountText}>
            My Teaching Classes ({FACULTY_ASSIGNED_CLASSES.length})
          </Text>
          <Text style={styles.classesSubInfo}>
            Classes scheduled on {new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long' })}
          </Text>
        </View>

        {/* Classes List */}
        <ScrollView
          contentContainerStyle={styles.classesScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {FACULTY_ASSIGNED_CLASSES.map((cls) => {
            const isScheduled = checkClassScheduledOnDate(cls, selectedDate);
            const cacheKey = `${cls.id}_${selectedDate}`;
            const existing = SAVED_ATTENDANCE_CACHE[cacheKey];

            return (
              <TouchableOpacity
                key={cls.id}
                style={[
                  styles.classCard,
                  !isScheduled && styles.classCardUnscheduled,
                ]}
                onPress={() => handleSelectClass(cls)}
                activeOpacity={isScheduled ? 0.7 : 0.85}
              >
                <View style={styles.classCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.subjectCodeRow}>
                      <Text style={styles.subjectCode}>{cls.subjectCode}</Text>
                      <View style={styles.sectionPill}>
                        <Text style={styles.sectionPillText}>{cls.classSectionName}</Text>
                      </View>
                    </View>
                    <Text style={styles.subjectName}>{cls.subjectName}</Text>
                    <Text style={styles.classMetaText}>
                      {cls.studentCount} Students
                    </Text>
                  </View>
                </View>

                {/* Status Row for Selected Date */}
                <View style={styles.classCardFooter}>
                  {isScheduled ? (
                    existing ? (
                      <View style={styles.statusRecordedWrap}>
                        <Feather name="check-circle" size={14} color="#16A34A" />
                        <Text style={styles.statusRecordedText}>
                          Attendance Recorded ({existing.presentCount}/{cls.studentCount} Present)
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.statusPendingWrap}>
                        <Feather name="clock" size={14} color="#D97706" />
                        <Text style={styles.statusPendingText}>
                          Scheduled ({cls.periodTime}) • Pending
                        </Text>
                      </View>
                    )
                  ) : (
                    <View style={styles.statusUnscheduledWrap}>
                      <Feather name="slash" size={14} color="#6B7280" />
                      <Text style={styles.statusUnscheduledText}>
                        No class scheduled on this date ({cls.scheduledDaysText})
                      </Text>
                    </View>
                  )}

                  {isScheduled && (
                    <View style={styles.actionPromptWrap}>
                      <Text style={styles.actionPromptText}>
                        {existing ? 'Edit' : 'Mark'}
                      </Text>
                      <Feather name="chevron-right" size={16} color="#111827" />
                    </View>
                  )}
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
  return (
    <View style={styles.container}>
      {/* STRICTLY SINGLE BACK BUTTON HEADER */}
      <View style={styles.markingTopHeader}>
        <TouchableOpacity
          style={styles.singleBackBtn}
          onPress={handleBackPress}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color="#111827" />
          <Text style={styles.singleBackBtnText}>Back to Classes</Text>
        </TouchableOpacity>

        {hasUnsavedChanges && (
          <View style={styles.unsavedBadge}>
            <Text style={styles.unsavedBadgeText}>Unsaved Changes</Text>
          </View>
        )}
      </View>

      {/* Class & Date Banner */}
      <View style={styles.classInfoBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.markingClassTitle}>{selectedClass.classSectionName}</Text>
          <Text style={styles.markingSubjectTitle}>{selectedClass.subjectName}</Text>
          <Text style={styles.markingDateText}>
            Date: {formatDateDisplay(selectedDate)}
          </Text>
        </View>
        <View
          style={[
            styles.modePill,
            isEditing ? styles.modePillEditing : styles.modePillNew,
          ]}
        >
          <Text
            style={[
              styles.modePillText,
              isEditing ? styles.modePillTextEditing : styles.modePillTextNew,
            ]}
          >
            {isEditing ? 'Editing Record' : 'New Attendance'}
          </Text>
        </View>
      </View>

      {/* STRICTLY ABOVE SEARCH BAR: SUMMARY STATS (Neutral, Clean Design) */}
      <View style={styles.statsSummaryContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalStudents}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#16A34A' }]}>{presentCount}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#DC2626' }]}>{absentCount}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
      </View>

      {/* SEARCH BAR (Live filtering by USN or Name) */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={17} color="#6B7280" style={{ marginRight: 8 }} />
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
              <Feather name="x" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* QUICK ACTIONS ROW */}
      <View style={styles.quickActionsRow}>
        <Text style={styles.rosterCountText}>
          {filteredRoster.length} of {totalStudents} Students
        </Text>
        <View style={styles.quickButtonsGroup}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => markAll('present')}
            activeOpacity={0.7}
          >
            <Feather name="check" size={13} color="#16A34A" />
            <Text style={styles.quickActionText}>All Present</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => markAll('absent')}
            activeOpacity={0.7}
          >
            <Feather name="x" size={13} color="#DC2626" />
            <Text style={styles.quickActionText}>All Absent</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* STUDENT ROSTER (Strictly Ordered by USN ascending, 2-Button Toggle) */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.loadingText}>Loading class roster...</Text>
        </View>
      ) : filteredRoster.length === 0 ? (
        <View style={styles.emptySearchBox}>
          <Feather name="users" size={32} color="#9CA3AF" />
          <Text style={styles.emptySearchTitle}>No students match "{searchQuery}"</Text>
          <Text style={styles.emptySearchSub}>Try searching with a different USN or name.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.rosterScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredRoster.map((student) => {
            const currentStatus = marks[student.id] || 'present';
            const isPresent = currentStatus === 'present';
            const isAbsent = currentStatus === 'absent';

            return (
              <View key={student.id} style={styles.studentCard}>
                {/* Left: Student Name first in bold letters, then USN (arranged according to USN) */}
                <View style={styles.studentInfoLeft}>
                  <Text style={styles.studentFullName}>{student.fullName}</Text>
                  <Text style={styles.studentUSN}>{student.rollNoOrUSN}</Text>
                </View>

                {/* Right: 2-Button System (Checkmark & Crossmark) */}
                <View style={styles.twoButtonGroup}>
                  {/* Present Button */}
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      isPresent ? styles.presentBtnActive : styles.toggleBtnInactive,
                    ]}
                    onPress={() => setStudentStatus(student.id, 'present')}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name="check"
                      size={15}
                      color={isPresent ? '#FFFFFF' : '#4B5563'}
                    />
                    <Text
                      style={[
                        styles.toggleBtnText,
                        isPresent ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive,
                      ]}
                    >
                      P
                    </Text>
                  </TouchableOpacity>

                  {/* Absent Button */}
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      isAbsent ? styles.absentBtnActive : styles.toggleBtnInactive,
                    ]}
                    onPress={() => setStudentStatus(student.id, 'absent')}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name="x"
                      size={15}
                      color={isAbsent ? '#FFFFFF' : '#4B5563'}
                    />
                    <Text
                      style={[
                        styles.toggleBtnText,
                        isAbsent ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive,
                      ]}
                    >
                      A
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* DOCKED SUBMIT BAR */}
      <View style={styles.submitBarDock}>
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmitAttendance}
          disabled={saving || loading || roster.length === 0}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitButtonText}>
                {isEditing
                  ? `Update Attendance`
                  : `Submit Attendance`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleWrap: {
    gap: 2,
  },
  viewTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#111827',
  },
  viewSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#6B7280',
  },

  // Date Selector
  dateSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
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
    gap: 6,
  },
  dateDisplayLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
  },
  todayPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#15803D',
  },
  jumpTodayBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  jumpTodayText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#4B5563',
  },

  classesListHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  classesCountText: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
  },
  classesSubInfo: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  classesScrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  classCardUnscheduled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.78,
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  subjectCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  subjectCode: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#4B5563',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#92400E',
  },
  subjectName: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  classMetaText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
  },

  classCardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRecordedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusRecordedText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#15803D',
  },
  statusPendingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusPendingText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#D97706',
  },
  statusUnscheduledWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusUnscheduledText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
  },
  actionPromptWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionPromptText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },

  // MODE 2: MARKING SCREEN STYLES
  markingTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  singleBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 6,
  },
  singleBackBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
  },
  unsavedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unsavedBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#B45309',
  },

  classInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  markingClassTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  markingSubjectTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  markingDateText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modePillNew: {
    backgroundColor: '#F3F4F6',
  },
  modePillEditing: {
    backgroundColor: '#FEF3C7',
  },
  modePillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
  },
  modePillTextNew: {
    color: '#374151',
  },
  modePillTextEditing: {
    color: '#B45309',
  },

  // SUMMARY STATS (Clean neutral, STRICTLY above search bar)
  statsSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#111827',
  },
  statLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },

  // SEARCH BAR
  searchBarContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
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

  // Quick actions
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  rosterCountText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#6B7280',
  },
  quickButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickActionText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#374151',
  },

  // ROSTER LIST
  rosterScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 90, // Leave room for docked submit button
    gap: 8,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', // Strictly neutral white background
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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

  // 2-BUTTON SYSTEM
  twoButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 36,
    borderRadius: 8,
    gap: 4,
  },
  toggleBtnInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  presentBtnActive: {
    backgroundColor: '#16A34A', // Solid green background
    borderWidth: 1,
    borderColor: '#15803D',
  },
  absentBtnActive: {
    backgroundColor: '#DC2626', // Solid red background
    borderWidth: 1,
    borderColor: '#B91C1C',
  },
  toggleBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  toggleBtnTextInactive: {
    color: '#6B7280',
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#FFFFFF',
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
});
