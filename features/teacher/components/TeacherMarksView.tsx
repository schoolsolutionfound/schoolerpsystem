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
  Modal,
  RefreshControl,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';
import { Feather, MaterialCommunityIcons } from './common/Icons';
import { InlineSearchDropdown } from './common/InlineSearchDropdown';
import { FontFamily } from '../../../constants/fonts';
import {
  fetchExamsApi,
  fetchClassSectionsApi,
  fetchSubjectsApi,
  saveMarksApi,
  fetchTeacherTimetableApi,
} from '../../../api/academics';
import { useTeacherSettingsStore } from '../services/teacherSettingsStore';
import { TeacherMarksSkeleton } from './skeletons';

interface ParsedCsvStudent {
  rollNo: string;
  name: string;
  marks: number;
  matchedStudentId?: string;
}

interface StudentMarkRecord {
  id: string;
  rollNo: string;
  studentName: string;
  marksObtained: number;
}

interface TeacherClassCard {
  id: string;
  className: string;
  sectionName: string;
  subjectName?: string;
  studentCount?: number;
}

const DEFAULT_TEACHER_CLASSES: TeacherClassCard[] = [
  { id: 'tc-1', className: 'Class 8', sectionName: 'A', subjectName: 'Mathematics', studentCount: 32 },
  { id: 'tc-2', className: 'Class 9', sectionName: 'B', subjectName: 'Algebra', studentCount: 30 },
  { id: 'tc-3', className: 'Class 9', sectionName: 'C', subjectName: 'Algebra', studentCount: 28 },
  { id: 'tc-4', className: 'Class 10', sectionName: 'A', subjectName: 'Mathematics', studentCount: 34 },
  { id: 'tc-5', className: 'Class 10', sectionName: 'B', subjectName: 'Geometry', studentCount: 31 },
  { id: 'tc-6', className: 'Class 11', sectionName: 'B', subjectName: 'Physics', studentCount: 29 },
  { id: 'tc-7', className: 'Class 12', sectionName: 'A', subjectName: 'Chemistry', studentCount: 27 },
];

const DEFAULT_CLASSES = [
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
];

const DEFAULT_SECTIONS = ['A', 'B', 'C', 'D'];

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Social Science',
  'Hindi',
  'Computer Science',
];

const DEFAULT_EXAMS = [
  'Unit Test 1',
  'Unit Test 2',
  'Mid Term Exam',
  'Final Exam',
];

const DEFAULT_EVAL_LIST = [
  'Test',
  'Project 1',
  'Project 2',
];


// Mock 32 students list matching user reference screenshot
const INITIAL_STUDENTS_CLASS_8A: StudentMarkRecord[] = [
  { id: 'st-01', rollNo: '08A01', studentName: 'Ayesha Khan', marksObtained: 42 },
  { id: 'st-02', rollNo: '08A02', studentName: 'Mohammed Rafi', marksObtained: 0 },
  { id: 'st-03', rollNo: '08A03', studentName: 'Sana Fatima', marksObtained: 38 },
  { id: 'st-04', rollNo: '08A04', studentName: 'Fahad Ali', marksObtained: 0 },
  { id: 'st-05', rollNo: '08A05', studentName: 'Zara Begum', marksObtained: 46 },
  { id: 'st-06', rollNo: '08A06', studentName: 'Irshad Ahmed', marksObtained: 29 },
  { id: 'st-07', rollNo: '08A07', studentName: 'Nida Rahman', marksObtained: 33 },
  { id: 'st-08', rollNo: '08A08', studentName: 'Adnan Shaikh', marksObtained: 0 },
  { id: 'st-09', rollNo: '08A09', studentName: 'Kavya Menon', marksObtained: 47 },
  { id: 'st-10', rollNo: '08A10', studentName: 'Arjun Reddy', marksObtained: 21 },
  { id: 'st-11', rollNo: '08A11', studentName: 'Bilal Siddiqui', marksObtained: 35 },
  { id: 'st-12', rollNo: '08A12', studentName: 'Chhavi Sharma', marksObtained: 44 },
  { id: 'st-13', rollNo: '08A13', studentName: 'Devika Pillai', marksObtained: 39 },
  { id: 'st-14', rollNo: '08A14', studentName: 'Faizan Qureshi', marksObtained: 18 },
  { id: 'st-15', rollNo: '08A15', studentName: 'Gaurav Joshi', marksObtained: 48 },
  { id: 'st-16', rollNo: '08A16', studentName: 'Hafsa Mariam', marksObtained: 31 },
  { id: 'st-17', rollNo: '08A17', studentName: 'Imran Hashmi', marksObtained: 26 },
  { id: 'st-18', rollNo: '08A18', studentName: 'Juhi Chawla', marksObtained: 41 },
  { id: 'st-19', rollNo: '08A19', studentName: 'Karan Mehra', marksObtained: 37 },
  { id: 'st-20', rollNo: '08A20', studentName: 'Laila Majnu', marksObtained: 14 },
  { id: 'st-21', rollNo: '08A21', studentName: 'Manish Malhotra', marksObtained: 45 },
  { id: 'st-22', rollNo: '08A22', studentName: 'Nusrat Jahan', marksObtained: 32 },
  { id: 'st-23', rollNo: '08A23', studentName: 'Omer Farooq', marksObtained: 28 },
  { id: 'st-24', rollNo: '08A24', studentName: 'Pooja Bhatt', marksObtained: 43 },
  { id: 'st-25', rollNo: '08A25', studentName: 'Rohan Sethi', marksObtained: 36 },
  { id: 'st-26', rollNo: '08A26', studentName: 'Sameera Reddy', marksObtained: 50 },
  { id: 'st-27', rollNo: '08A27', studentName: 'Tariq Mansoor', marksObtained: 22 },
  { id: 'st-28', rollNo: '08A28', studentName: 'Uzma Parveen', marksObtained: 40 },
  { id: 'st-29', rollNo: '08A29', studentName: 'Varun Grover', marksObtained: 34 },
  { id: 'st-30', rollNo: '08A30', studentName: 'Wasim Akram', marksObtained: 19 },
  { id: 'st-31', rollNo: '08A31', studentName: 'Yasmin Bano', marksObtained: 46 },
  { id: 'st-32', rollNo: '08A32', studentName: 'Zainab Qazi', marksObtained: 41 },
];

function generateStudentsForClass(className: string, sectionName: string): StudentMarkRecord[] {
  if (className === 'Class 8' && sectionName === 'A') {
    return INITIAL_STUDENTS_CLASS_8A;
  }
  const cleanCls = className.replace(/[^0-9]/g, '') || '09';
  const paddedCls = cleanCls.padStart(2, '0');
  const count = 30;
  return Array.from({ length: count }, (_, i) => {
    const rollNo = `${paddedCls}${sectionName}${String(i + 1).padStart(2, '0')}`;
    const baseStudent = INITIAL_STUDENTS_CLASS_8A[i % INITIAL_STUDENTS_CLASS_8A.length];
    return {
      id: `st-${cleanCls}-${sectionName}-${i + 1}`,
      rollNo,
      studentName: baseStudent.studentName,
      marksObtained: (baseStudent.marksObtained + (i % 7) * 3) % 51,
    };
  });
}

export const TeacherMarksView: React.FC = () => {
  // Step 1 Selection State: which class card is selected.
  // Initially null so first it shows the rectangular container list of classes taken by this teacher!
  const [selectedClassCard, setSelectedClassCard] = useState<TeacherClassCard | null>(null);

  // Teacher Assigned Classes
  const [teacherClasses, setTeacherClasses] = useState<TeacherClassCard[]>(DEFAULT_TEACHER_CLASSES);
  const [classSearchQuery, setClassSearchQuery] = useState('');

  // Top Filter Selections (Class, Section, Exam, List)
  const [selectedClass, setSelectedClass] = useState('Class 8');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedExam, setSelectedExam] = useState('Unit Test 2');
  const [selectedList, setSelectedList] = useState('Test');

  // Search in student roster
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown options
  const [classesList, setClassesList] = useState<string[]>(DEFAULT_CLASSES);
  const [sectionsList, setSectionsList] = useState<string[]>(DEFAULT_SECTIONS);
  const [subjectsList, setSubjectsList] = useState<string[]>(DEFAULT_SUBJECTS);
  const [examsList, setExamsList] = useState<string[]>(DEFAULT_EXAMS);
  const [evalList, setEvalList] = useState<string[]>(DEFAULT_EVAL_LIST);

  // Sync with Teacher Settings (Exam Types & List Types)
  const storeExamTypes = useTeacherSettingsStore((s) => s.examTypes);
  const storeListTypes = useTeacherSettingsStore((s) => s.listTypes);

  useEffect(() => {
    if (storeExamTypes && storeExamTypes.length > 0) {
      const names = storeExamTypes.map((e) => e.name);
      setExamsList(names);
      if (!names.includes(selectedExam)) {
        setSelectedExam(names[0]);
      }
    }
  }, [storeExamTypes]);

  useEffect(() => {
    if (storeListTypes && storeListTypes.length > 0) {
      const activeNames = storeListTypes.filter((l) => l.enabled).map((l) => l.name);
      if (activeNames.length > 0) {
        setEvalList(activeNames);
        if (!activeNames.includes(selectedList)) {
          setSelectedList(activeNames[0]);
        }
      }
    }
  }, [storeListTypes]);

  // Active inline dropdown filter
  const [openFilter, setOpenFilter] = useState<'exam' | 'list' | null>(null);

  const currentKey = `${selectedClass}_${selectedSection}_${selectedSubject}_${selectedExam}_${selectedList}`;

  // CSV / Excel Import State
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCsvStudent[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Editing state: track single student edit or all edit
  const [editingStudentIds, setEditingStudentIds] = useState<Set<string>>(new Set());
  const [isAllEditing, setIsAllEditing] = useState(false);

  const toggleStudentEdit = (studentId: string) => {
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

  // Set tracking entered combinations
  const [enteredKeys, setEnteredKeys] = useState<Set<string>>(() => {
    const s = new Set<string>();
    s.add('Class 8_A_Mathematics_Unit Test 2_Test');
    return s;
  });

  const isEntered = enteredKeys.has(currentKey);

  // Total Marks dynamic limit (e.g. from store config or 50/100 fallback)
  const totalMarks = useMemo(() => {
    const matched = storeExamTypes?.find((e) => e.name.toLowerCase() === selectedExam.toLowerCase());
    if (matched) {
      return matched.maxMarks;
    }
    if (selectedExam.toLowerCase().includes('final') || selectedExam.toLowerCase().includes('mid')) {
      return 100;
    }
    return 50;
  }, [selectedExam, storeExamTypes]);

  const [marksDatabase, setMarksDatabase] = useState<Record<string, Record<string, number>>>(() => {
    const initialMap: Record<string, number> = {};
    INITIAL_STUDENTS_CLASS_8A.forEach((s) => {
      initialMap[s.id] = s.marksObtained;
    });
    return {
      'Class 8_A_Mathematics_Unit Test 2_Test': initialMap,
    };
  });

  // Current students list
  const [students, setStudents] = useState<StudentMarkRecord[]>(INITIAL_STUDENTS_CLASS_8A);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load API options and teacher's timetable classes if available
  const loadInitialData = useCallback(async () => {
    try {
      const [csRes, subRes, exRes, ttRes] = await Promise.all([
        fetchClassSectionsApi().catch(() => null),
        fetchSubjectsApi().catch(() => null),
        fetchExamsApi().catch(() => null),
        fetchTeacherTimetableApi().catch(() => null),
      ]);
      if (Array.isArray(csRes) && csRes.length > 0) {
        const cSet = new Set<string>(DEFAULT_CLASSES);
        const sSet = new Set<string>(DEFAULT_SECTIONS);
        csRes.forEach((cs: any) => {
          if (cs.name) {
            const parts = cs.name.split('-');
            if (parts[0]) cSet.add(parts[0].trim());
            if (parts[1]) sSet.add(parts[1].trim());
          }
          if (cs.section) sSet.add(cs.section.trim());
        });
        setClassesList(Array.from(cSet));
        setSectionsList(Array.from(sSet));
      }
      if (Array.isArray(subRes) && subRes.length > 0) {
        const subNames = subRes.map((s: any) => s.name || s.subjectName).filter(Boolean);
        if (subNames.length) setSubjectsList(Array.from(new Set([...subNames, ...DEFAULT_SUBJECTS])));
      }
      if (Array.isArray(exRes) && exRes.length > 0) {
        const exNames = exRes.map((e: any) => e.name).filter(Boolean);
        if (exNames.length) setExamsList(Array.from(new Set([...exNames, ...DEFAULT_EXAMS])));
      }
      // Populate teacher's dynamic classes from timetable
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
            const key = `${fullCls}_${sName}`;
            if (!cardMap.has(key)) {
              cardMap.set(key, {
                id: `tc-dyn-${idx}`,
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
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, [loadInitialData]);

  // Sync students and marks when class or section changes
  useEffect(() => {
    setEditingStudentIds(new Set());
    setIsAllEditing(false);
    const classStudents = generateStudentsForClass(selectedClass, selectedSection);
    setStudents(classStudents);

    // If no marks exist for this combination, generate initial marks
    setMarksDatabase((prev) => {
      if (prev[currentKey]) return prev;
      const newMap: Record<string, number> = {};
      classStudents.forEach((st) => {
        newMap[st.id] = st.marksObtained;
      });
      return { ...prev, [currentKey]: newMap };
    });
  }, [selectedClass, selectedSection, currentKey]);

  // Current marks map for active key
  const activeMarksMap = useMemo(() => {
    return marksDatabase[currentKey] || {};
  }, [marksDatabase, currentKey]);

  // Filtered students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Filtered classes taken by teacher for initial screen
  const filteredTeacherClasses = useMemo(() => {
    if (!classSearchQuery.trim()) return teacherClasses;
    const q = classSearchQuery.toLowerCase().trim();
    return teacherClasses.filter(
      (tc) =>
        tc.className.toLowerCase().includes(q) ||
        tc.sectionName.toLowerCase().includes(q) ||
        (tc.subjectName && tc.subjectName.toLowerCase().includes(q))
    );
  }, [teacherClasses, classSearchQuery]);

  // Handle clicking a rectangular class container to open current marks entry page
  const handleSelectClass = (item: TeacherClassCard) => {
    setSelectedClass(item.className);
    setSelectedSection(item.sectionName);
    if (item.subjectName && subjectsList.includes(item.subjectName)) {
      setSelectedSubject(item.subjectName);
    }
    setSelectedClassCard(item);
  };

  // Update mark for a student in Enter Marks mode
  const handleMarkChange = (studentId: string, val: string) => {
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    const validNum = isNaN(num) ? 0 : Math.min(totalMarks, Math.max(0, num));
    setMarksDatabase((prev) => ({
      ...prev,
      [currentKey]: {
        ...(prev[currentKey] || {}),
        [studentId]: validNum,
      },
    }));
  };

  // Save Marks handler
  const handleSaveMarks = async () => {
    setSaving(true);
    try {
      const entries = students.map((s) => ({
        studentId: s.id,
        marksObtained: activeMarksMap[s.id] ?? 0,
      }));
      await saveMarksApi({
        examSubjectId: `${selectedExam}-${selectedSubject}`,
        classSectionId: `${selectedClass}-${selectedSection}`,
        entries,
      }).catch(() => null);

      setEnteredKeys((prev) => {
        const next = new Set(prev);
        next.add(currentKey);
        return next;
      });
      setEditingStudentIds(new Set());
      setIsAllEditing(false);

      Alert.alert(
        'Marks Saved',
        `Marks for ${selectedClass} - Section ${selectedSection} (${selectedSubject}) - ${selectedExam} [${selectedList}] have been saved successfully!`
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not save marks');
    } finally {
      setSaving(false);
    }
  };

  // CSV & Excel Extraction Helpers (Extracts USN, Student Name, Marks)
  const extractRowsData = (rawRows: any[][]) => {
    if (!rawRows || rawRows.length === 0) {
      setParsedRows([]);
      return;
    }

    const nonEmptyRows = rawRows.filter(
      (r) => Array.isArray(r) && r.some((c) => c !== null && c !== undefined && String(c).trim() !== '')
    );

    if (nonEmptyRows.length === 0) {
      setParsedRows([]);
      setCsvError('No rows found in the spreadsheet.');
      return;
    }

    let startIdx = 0;
    let usnCol = -1;
    let nameCol = -1;
    let marksCol = -1;

    // Detect header row if present
    for (let r = 0; r < Math.min(3, nonEmptyRows.length); r++) {
      const row = nonEmptyRows[r];
      const strRow = row.map((cell) => String(cell || '').trim().toLowerCase());

      const foundUsn = strRow.findIndex((c) => /usn|roll|reg|adm|id|student\s*id/i.test(c));
      const foundName = strRow.findIndex((c) => /name|student\s*name/i.test(c) && !/exam|sub/i.test(c));
      const foundMarks = strRow.findIndex((c) => /mark|score|total|obtained|points/i.test(c));

      if (foundUsn !== -1 || foundMarks !== -1) {
        usnCol = foundUsn;
        nameCol = foundName;
        marksCol = foundMarks;
        startIdx = r + 1;
        break;
      }
    }

    const results: ParsedCsvStudent[] = [];

    for (let i = startIdx; i < nonEmptyRows.length; i++) {
      const row = nonEmptyRows[i];
      if (!row || row.length < 2) continue;

      let roll = '';
      let name = '';
      let marks = 0;

      if (usnCol !== -1 && row[usnCol] !== undefined) {
        roll = String(row[usnCol]).trim().replace(/^["']|["']$/g, '');
      }
      if (nameCol !== -1 && row[nameCol] !== undefined) {
        name = String(row[nameCol]).trim().replace(/^["']|["']$/g, '');
      }
      if (marksCol !== -1 && row[marksCol] !== undefined) {
        const val = parseFloat(String(row[marksCol]).trim().replace(/[^0-9.]/g, ''));
        marks = isNaN(val) ? 0 : Math.round(val);
      }

      // Fallback heuristics if column headers are missing or not fully matched
      if (!roll || usnCol === -1 || marksCol === -1) {
        const tokens = row
          .map((c) => String(c || '').trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);

        if (tokens.length === 2) {
          const num = parseFloat(tokens[1].replace(/[^0-9.]/g, ''));
          if (!isNaN(num)) {
            roll = tokens[0];
            marks = Math.round(num);
          } else {
            const num0 = parseFloat(tokens[0].replace(/[^0-9.]/g, ''));
            if (!isNaN(num0)) {
              marks = Math.round(num0);
              roll = tokens[1];
            }
          }
        } else if (tokens.length >= 3) {
          const lastNum = parseFloat(tokens[tokens.length - 1].replace(/[^0-9.]/g, ''));
          if (!isNaN(lastNum)) {
            marks = Math.round(lastNum);
            if (tokens.length === 3) {
              roll = tokens[0];
              name = tokens[1];
            } else {
              roll = tokens[1];
              name = tokens[2];
            }
          } else {
            roll = tokens[0];
            name = tokens[1];
            marks = parseInt(tokens[2], 10) || 0;
          }
        }
      }

      if (!roll) continue;

      const rollLower = roll.toLowerCase();
      const matched = students.find(
        (s) =>
          s.rollNo.toLowerCase() === rollLower ||
          (name && s.studentName.toLowerCase() === name.toLowerCase())
      );

      results.push({
        rollNo: roll,
        name: name || (matched ? matched.studentName : 'Student'),
        marks: Math.max(0, marks),
        matchedStudentId: matched?.id,
      });
    }

    setParsedRows(results);
    if (results.length === 0) {
      setCsvError('No valid student data found. Please ensure file contains USN, Student Name, and Marks.');
    } else {
      setCsvError(null);
    }
  };

  const parseCsvText = (raw: string) => {
    setCsvText(raw);
    setCsvError(null);
    if (!raw.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const rows = lines.map((line) =>
      line.split(/[,\t;]+/).map((t) => t.trim().replace(/^["']|["']$/g, ''))
    );
    extractRowsData(rows);
  };

  const processWorkbook = (workbook: XLSX.WorkBook) => {
    try {
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setCsvError('The Excel file contains no sheets.');
        return;
      }
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      if (!rawRows || rawRows.length === 0) {
        setCsvError('The Excel sheet is empty.');
        return;
      }

      extractRowsData(rawRows);
    } catch (err: any) {
      setCsvError('Error parsing Excel sheet: ' + (err?.message || 'Invalid format'));
    }
  };

  const handlePickCsvFile = async () => {
    try {
      setCsvError(null);
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/comma-separated-values',
          'text/tab-separated-values',
          'text/plain',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setCsvFileName(file.name);

        const isExcel = /\.(xlsx|xls)$/i.test(file.name);

        if (isExcel) {
          if (Platform.OS === 'web') {
            const resp = await fetch(file.uri);
            const arrayBuffer = await resp.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            processWorkbook(workbook);
          } else {
            const base64Data = await FileSystem.readAsStringAsync(file.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const workbook = XLSX.read(base64Data, { type: 'base64' });
            processWorkbook(workbook);
          }
        } else {
          let content = '';
          try {
            if (Platform.OS === 'web') {
              const resp = await fetch(file.uri);
              content = await resp.text();
            } else {
              content = await FileSystem.readAsStringAsync(file.uri);
            }
          } catch {
            const resp = await fetch(file.uri);
            content = await resp.text();
          }

          if (content) {
            parseCsvText(content);
          } else {
            setCsvError('Could not read file content.');
          }
        }
      }
    } catch (err: any) {
      setCsvError(err?.message || 'Failed to pick file');
    }
  };

  const handleApplyCsvMarks = () => {
    const matchedItems = parsedRows.filter((r) => r.matchedStudentId);
    if (matchedItems.length === 0) {
      Alert.alert('No Matches', 'None of the rows matched students in this class roster.');
      return;
    }

    setMarksDatabase((prev) => {
      const current = { ...(prev[currentKey] || {}) };
      matchedItems.forEach((r) => {
        if (r.matchedStudentId) {
          current[r.matchedStudentId] = Math.min(totalMarks, Math.max(0, r.marks));
        }
      });
      return { ...prev, [currentKey]: current };
    });

    Alert.alert(
      'Marks Auto-Filled!',
      `Successfully populated marks for ${matchedItems.length} students from the imported file.`
    );
    setShowCsvModal(false);
    setCsvText('');
    setParsedRows([]);
    setCsvFileName(null);
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
            <Text style={styles.classesHeaderTitle}>Marks</Text>
          </View>

          {/* Search Box */}
          <View style={styles.classSearchBox}>
            <Feather name="search" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.classSearchInput}
              placeholder="Search class or section..."
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
            {loading ? (
              <TeacherMarksSkeleton />
            ) : filteredTeacherClasses.length === 0 ? (
              <View style={styles.emptyClassesCard}>
                <Text style={styles.emptyClassesText}>No matching classes found</Text>
              </View>
            ) : (
              filteredTeacherClasses.map((item) => (
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
                        <Text style={styles.cardSubjectText}>{item.subjectName || 'Mathematics'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.classCardRight}>
                    <View style={styles.enterMarksBtn}>
                      <Text style={styles.enterMarksBtnText}>Enter Marks</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // =========================================================================
  // VIEW 2: CURRENT MARKS ENTRY PAGE (OPENS AFTER CLICKING A RECTANGULAR BOX)
  // =========================================================================
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
        {/* Top Navigation Bar: Back button to return to the rectangular class selection */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => setSelectedClassCard(null)}
          >
            <Feather name="arrow-left" size={18} color="#171717" />
          </TouchableOpacity>
          <View style={styles.topNavTextWrap}>
            <Text style={styles.topNavTitle}>
              {selectedClass} · Section {selectedSection}
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

        {/* Exam & List Filters (Interchanged: Exam first, List second) */}
        <View style={styles.filtersWrapper}>
          <View style={styles.filtersRow}>
            {/* Exam Filter (First) */}
            <View style={[styles.filterCol, { flex: 1.25 }]}>
              <Text style={styles.filterLabel}>Exam</Text>
              <TouchableOpacity
                style={[
                  styles.filterBox,
                  openFilter === 'exam' && styles.filterBoxActive,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setOpenFilter(openFilter === 'exam' ? null : 'exam');
                }}
              >
                <Text
                  style={[
                    styles.filterVal,
                    openFilter === 'exam' && styles.filterValActive,
                  ]}
                  numberOfLines={1}
                >
                  {selectedExam}
                </Text>
                <Feather
                  name={openFilter === 'exam' ? 'chevron-up' : 'chevron-down'}
                  size={13}
                  color={openFilter === 'exam' ? '#0284C7' : '#4B5563'}
                />
              </TouchableOpacity>
            </View>

            {/* List Filter (Second - Interchanged) */}
            <View style={[styles.filterCol, { flex: 1.25 }]}>
              <Text style={styles.filterLabel}>List</Text>
              <TouchableOpacity
                style={[
                  styles.filterBox,
                  openFilter === 'list' && styles.filterBoxActive,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setOpenFilter(openFilter === 'list' ? null : 'list');
                }}
              >
                <Text
                  style={[
                    styles.filterVal,
                    openFilter === 'list' && styles.filterValActive,
                  ]}
                  numberOfLines={1}
                >
                  {selectedList}
                </Text>
                <Feather
                  name={openFilter === 'list' ? 'chevron-up' : 'chevron-down'}
                  size={13}
                  color={openFilter === 'list' ? '#0284C7' : '#4B5563'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Inline Dropdown for Exam - Single Search with Dropdown */}
        {openFilter === 'exam' && (
          <View style={styles.inlineFilterWrapper}>
            <InlineSearchDropdown
              placeholder="Search exam..."
              selectedValue={selectedExam}
              options={examsList.map((e) => {
                const isTerm = e.toLowerCase().includes('final') || e.toLowerCase().includes('mid');
                return {
                  label: e,
                  value: e,
                  subtext: isTerm ? 'Term Examination' : 'Periodic Assessment',
                  badge: isTerm ? 'Max 100' : 'Max 50',
                  badgeColor: '#047857',
                };
              })}
              isOpen={true}
              menuOnly={true}
              onToggle={() => setOpenFilter(null)}
              onSelect={(e) => {
                setSelectedExam(e);
                setOpenFilter(null);
              }}
              iconName="file-document-edit-outline"
              iconType="material"
            />
          </View>
        )}

        {/* Inline Dropdown for List - Single Search with Dropdown */}
        {openFilter === 'list' && (
          <View style={styles.inlineFilterWrapper}>
            <InlineSearchDropdown
              placeholder="Search list..."
              selectedValue={selectedList}
              options={evalList.map((item) => ({
                label: item,
                value: item,
                subtext: item === 'Test' ? 'Assessment' : 'Assignment / Submission',
                badge: item === 'Test' ? 'Default' : undefined,
                badgeColor: item === 'Test' ? '#0284C7' : undefined,
              }))}
              isOpen={true}
              menuOnly={true}
              onToggle={() => setOpenFilter(null)}
              onSelect={(item) => {
                setSelectedList(item);
                setOpenFilter(null);
              }}
              iconName="format-list-bulleted"
              iconType="material"
            />
          </View>
        )}

        {/* Quick Tools Row: Import CSV */}
        <View style={styles.toolsRow}>
          <TouchableOpacity
            style={styles.toolBtn}
            activeOpacity={0.8}
            onPress={() => setShowCsvModal(true)}
          >
            <MaterialCommunityIcons name="file-excel-outline" size={17} color="#047857" />
            <Text style={styles.toolBtnText}>Import CSV / Excel</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Search Bar & Students Count Badge */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search student by name or USN..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <Feather name="x" size={15} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredStudents.length} Students</Text>
          </View>
        </View>

        {/* 4. Marks Table */}
        <View style={styles.tableCard}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thText, styles.colRollNo]} numberOfLines={1}>
              USN
            </Text>
            <Text style={[styles.thText, styles.colName]} numberOfLines={1}>
              Student Name
            </Text>
            <Text style={[styles.thText, styles.colMarksHeader]} numberOfLines={1}>
              Marks ( / {totalMarks} )
            </Text>
            <View style={styles.colActionHeader}>
              {isEntered && (
                <TouchableOpacity
                  style={styles.pencilBtn}
                  activeOpacity={0.6}
                  hitSlop={8}
                  onPress={() => {
                    if (isAllEditing) {
                      setIsAllEditing(false);
                      setEditingStudentIds(new Set());
                    } else {
                      setIsAllEditing(true);
                    }
                  }}
                >
                  <Feather
                    name={isAllEditing ? 'check' : 'edit-2'}
                    size={14}
                    color={isAllEditing ? '#16A34A' : '#64748B'}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Table Rows */}
          {filteredStudents.length === 0 ? (
            <View style={styles.emptyTableBox}>
              <Text style={styles.emptyTableText}>No students found</Text>
            </View>
          ) : (
            filteredStudents.map((st) => {
              const currentScore = activeMarksMap[st.id] ?? 0;
              const isRowEditing = !isEntered || isAllEditing || editingStudentIds.has(st.id);
              const isSingleActive = editingStudentIds.has(st.id);

              return (
                <View key={st.id} style={styles.tableRow}>
                  <Text style={[styles.tdRollNo, styles.colRollNo]} numberOfLines={1}>
                    {st.rollNo}
                  </Text>
                  <Text style={[styles.tdName, styles.colName]} numberOfLines={1}>
                    {st.studentName}
                  </Text>

                  {/* Marks Column */}
                  <View style={[styles.colMarksWrap, styles.colMarksHeader]}>
                    {!isRowEditing ? (
                      <Text style={styles.viewMarksText}>{currentScore}</Text>
                    ) : (
                      <TextInput
                        style={styles.marksInputBox}
                        value={String(currentScore)}
                        keyboardType="numeric"
                        maxLength={3}
                        onChangeText={(val) => handleMarkChange(st.id, val)}
                        selectTextOnFocus
                      />
                    )}
                  </View>

                  {/* Action Column */}
                  <View style={styles.colAction}>
                    {isEntered && !isAllEditing && (
                      <TouchableOpacity
                        style={styles.pencilBtn}
                        activeOpacity={0.6}
                        hitSlop={8}
                        onPress={() => toggleStudentEdit(st.id)}
                      >
                        <Feather
                          name={isSingleActive ? 'check' : 'edit-2'}
                          size={14}
                          color={isSingleActive ? '#16A34A' : '#64748B'}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* 5. Save Marks Button */}
        {(!isEntered || isAllEditing || editingStudentIds.size > 0) && (
          <TouchableOpacity
            style={styles.saveBtn}
            activeOpacity={0.85}
            onPress={handleSaveMarks}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <Text style={styles.saveBtnText}>
                {isEntered ? 'Update Marks' : 'Save Marks'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* CSV / Excel Import Modal with Automatic Filling */}
      <Modal
        visible={showCsvModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCsvModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.csvCard}>
            <View style={styles.csvHeaderRow}>
              <Text style={styles.csvHeaderTitle}>Import CSV file </Text>
              <TouchableOpacity onPress={() => setShowCsvModal(false)} hitSlop={8}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* File Pick Button */}
            <TouchableOpacity
              style={styles.csvPickBtn}
              activeOpacity={0.8}
              onPress={handlePickCsvFile}
            >
              <Text style={styles.csvPickBtnText}>Select CSV</Text>
            </TouchableOpacity>

            {csvFileName && (
              <Text style={styles.csvSelectedFile}>Selected: {csvFileName}</Text>
            )}

            {csvError && <Text style={styles.csvErrorText}>{csvError}</Text>}

            {/* Match summary */}
            {parsedRows.length > 0 && (
              <View style={styles.csvSummaryRow}>
                <Text style={styles.csvSummaryText}>
                  {parsedRows.filter((r) => r.matchedStudentId).length} of {parsedRows.length} matched
                </Text>
                <Text style={{ fontSize: 11, color: '#0369A1', fontFamily: FontFamily.medium }}>
                  Max score: {totalMarks}
                </Text>
              </View>
            )}

            {/* Preview List with Table Header */}
            {parsedRows.length > 0 && (
              <View style={styles.csvTableWrap}>
                <View style={styles.csvTableHeader}>
                  <Text style={[styles.csvThText, styles.csvItemRoll]}>USN</Text>
                  <Text style={[styles.csvThText, styles.csvItemName]}>Student Name</Text>
                  <Text style={[styles.csvThText, styles.csvItemMarks]}>Marks</Text>
                </View>
                <ScrollView style={styles.csvPreviewList}>
                  {parsedRows.map((r, i) => (
                    <View key={i} style={styles.csvPreviewItem}>
                      <Text style={styles.csvItemRoll}>{r.rollNo}</Text>
                      <Text style={styles.csvItemName} numberOfLines={1}>
                        {r.name}
                      </Text>
                      <Text
                        style={[
                          styles.csvItemMarks,
                          !r.matchedStudentId && { color: '#DC2626' },
                        ]}
                      >
                        {r.matchedStudentId ? `${r.marks} pts` : 'No Match'}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Actions */}
            <View style={styles.csvModalActions}>
              <TouchableOpacity
                style={styles.csvCancelBtn}
                onPress={() => setShowCsvModal(false)}
              >
                <Text style={styles.csvCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.csvApplyBtn,
                  parsedRows.filter((r) => r.matchedStudentId).length === 0 &&
                  styles.csvApplyBtnDisabled,
                ]}
                disabled={parsedRows.filter((r) => r.matchedStudentId).length === 0}
                onPress={handleApplyCsvMarks}
              >
                <Text
                  style={[
                    styles.csvApplyText,
                    parsedRows.filter((r) => r.matchedStudentId).length === 0 &&
                    styles.csvApplyTextDisabled,
                  ]}
                >
                  {parsedRows.filter((r) => r.matchedStudentId).length > 0
                    ? `Auto- fill (${parsedRows.filter((r) => r.matchedStudentId).length})`
                    : 'Auto- fill'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>


    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },

  // ==========================================
  // VIEW 1: Classes Taken Selection Styles
  // ==========================================
  classesScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  classesHeader: {
    marginBottom: 14,
  },
  classesHeaderTitle: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  classesHeaderSubtitle: {
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
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
    color: '#171717',
    fontFamily: FontFamily.regular,
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
  classBadgeCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: FontFamily.semibold,
    color: '#4B5563',
  },
  cardSubText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  classCardRight: {
    marginLeft: 10,
  },
  enterMarksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4C430',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
  },
  enterMarksBtnText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#171717',
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

  // ==========================================
  // VIEW 2: Top Nav Bar on Marks Entry Page
  // ==========================================
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
  backBtn: {
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
  topNavSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1,
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

  // 1. Top Filters
  filtersWrapper: {
    marginBottom: 10,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterCol: {
    flex: 1,
    gap: 3,
  },
  filterLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#4B5563',
    paddingLeft: 1,
  },
  filterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 8,
    height: 38,
  },
  filterBoxActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  filterVal: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
    flex: 1,
    paddingRight: 2,
  },
  filterValActive: {
    color: '#0284C7',
  },
  inlineFilterWrapper: {
    marginBottom: 10,
  },


  // 3. Search Bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#111827',
    fontFamily: FontFamily.medium,
    paddingVertical: 0,
  },
  countBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 8,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#4B5563',
  },

  // 4. Marks Table
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 14,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  thText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tdRollNo: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  tdName: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  viewMarksText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
    textAlign: 'center',
  },

  // Column Dimensions
  colRollNo: {
    width: 65,
  },
  colName: {
    flex: 1,
    paddingHorizontal: 4,
  },
  colMarksHeader: {
    width: 100,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colMarksWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  colActionHeader: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colAction: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pencilBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marksInputBox: {
    width: 50,
    height: 30,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
    paddingVertical: 0,
  },

  emptyTableBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
  },

  // 5. Save Marks Button
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
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#111827',
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },

  // Subject display styles
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
  topNavSubjectBadge: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  topNavSubjectText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#6B7280',
  },
  marksContextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  contextPillLabel: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  contextPillVal: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  // Tools row (CSV & Reference Images)
  toolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  toolBtnActive: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  toolBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#1E293B',
  },

  // Reference Images Card
  refImagesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  refHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  refTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refCardTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#1E293B',
  },
  refCountBadge: {
    backgroundColor: '#E0F2FE',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  refCountText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#0284C7',
  },
  refBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 5,
  },
  addPhotosBtnText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  cameraIconBtn: {
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  refEmptyWrap: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  refEmptyText: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  refEmptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  refEmptyActionText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#0284C7',
  },
  refScrollRow: {
    gap: 10,
    paddingVertical: 4,
  },
  refThumbItem: {
    width: 76,
    alignItems: 'center',
    position: 'relative',
  },
  refImageThumb: {
    width: 72,
    height: 72,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  refZoomIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 3,
    padding: 2,
  },
  refDeleteBtn: {
    position: 'absolute',
    top: -4,
    right: 0,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refImageLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    width: 72,
  },

  // CSV Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  csvCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: '100%',
    maxHeight: '88%',
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  csvHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  csvHeaderTitle: {
    fontSize: 15.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  csvPickBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 6,
    paddingVertical: 11,
    marginBottom: 6,
  },
  csvPickBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#065F46',
  },
  csvSelectedFile: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#047857',
    textAlign: 'center',
    marginBottom: 6,
  },
  csvDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 8,
  },
  csvDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  csvDividerText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#9CA3AF',
  },
  csvTableWrap: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 10,
    overflow: 'hidden',
  },
  csvTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  csvThText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  csvInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 10,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#111827',
    height: 75,
    textAlignVertical: 'top',
    marginBottom: 6,
  },
  csvErrorText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#DC2626',
    marginBottom: 6,
  },
  csvSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 6,
  },
  csvSummaryText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#0284C7',
  },
  csvPreviewList: {
    maxHeight: 110,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 10,
  },
  csvPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  csvItemRoll: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#374151',
    width: 65,
  },
  csvItemName: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#111827',
    flex: 1,
    paddingHorizontal: 4,
  },
  csvItemMarks: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#047857',
  },
  csvModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  csvCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  csvCancelText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#4B5563',
  },
  csvApplyBtn: {
    flex: 1.5,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  csvApplyBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  csvApplyText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  csvApplyTextDisabled: {
    color: '#9CA3AF',
  },

  // Image preview modal
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFullImage: {
    width: '100%',
    height: '75%',
    borderRadius: 8,
  },
});
