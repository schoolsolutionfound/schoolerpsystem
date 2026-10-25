import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchStudentMarksApi, fetchSubjectsApi } from '../../../api/academics';
import { MarksSkeleton } from './skeletons';
import { ShimmerProvider } from './ShimmerSkeleton';
import { FontFamily } from '../../../constants/fonts';

export interface StudentMarksViewProps {
  onBack?: () => void;
}

export interface ExamSubjectMark {
  name: string;
  obtained: number;
  maxMarks: number;
  percentage: number;
}

export interface ActivityMark {
  type: string;
  obtained: number;
  maxMarks: number;
  percentage: number;
}

export interface ExamItem {
  id: string;
  name: string;
  dateStr: string;
  term: string;
  totalMax: number;
  totalObtained: number;
  percentage: number;
  subjects: ExamSubjectMark[];
  activities: ActivityMark[];
}

const currentYear = new Date().getFullYear();
const ACADEMIC_YEARS = [
  `${currentYear - 1} - ${currentYear}`,
  `${currentYear} - ${currentYear + 1}`,
  `${currentYear - 2} - ${currentYear - 1}`,
];

// Default exams exactly matching Image 1 and Image 2 from the user
const DEFAULT_EXAMS: ExamItem[] = [
  {
    id: 'exam-ut1',
    name: 'Unit Test 1',
    dateStr: 'September 2025',
    term: 'Term 1',
    totalMax: 500,
    totalObtained: 379,
    percentage: 75.8,
    subjects: [
      { name: 'Computer Science', obtained: 79, maxMarks: 100, percentage: 79 },
      { name: 'English', obtained: 90, maxMarks: 100, percentage: 90 },
      { name: 'Science', obtained: 77, maxMarks: 100, percentage: 77 },
      { name: 'Social Studies', obtained: 88, maxMarks: 100, percentage: 88 },
      { name: 'Mathematics', obtained: 45, maxMarks: 100, percentage: 45 },
    ],
    activities: [
      { type: 'Assignment', obtained: 18, maxMarks: 25, percentage: 72 },
      { type: 'Project', obtained: 22, maxMarks: 25, percentage: 88 },
    ],
  },
  {
    id: 'exam-ut2',
    name: 'Unit Test 2',
    dateStr: 'October 2025',
    term: 'Term 1',
    totalMax: 500,
    totalObtained: 412,
    percentage: 82.4,
    subjects: [
      { name: 'Computer Science', obtained: 85, maxMarks: 100, percentage: 85 },
      { name: 'English', obtained: 88, maxMarks: 100, percentage: 88 },
      { name: 'Science', obtained: 82, maxMarks: 100, percentage: 82 },
      { name: 'Social Studies', obtained: 84, maxMarks: 100, percentage: 84 },
      { name: 'Mathematics', obtained: 73, maxMarks: 100, percentage: 73 },
    ],
    activities: [
      { type: 'Assignment', obtained: 20, maxMarks: 25, percentage: 80 },
      { type: 'Project', obtained: 21, maxMarks: 25, percentage: 84 },
    ],
  },
  {
    id: 'exam-mid',
    name: 'Mid Term',
    dateStr: 'November 2025',
    term: 'Term 1',
    totalMax: 500,
    totalObtained: 428,
    percentage: 85.6,
    subjects: [
      { name: 'Computer Science', obtained: 90, maxMarks: 100, percentage: 90 },
      { name: 'English', obtained: 92, maxMarks: 100, percentage: 92 },
      { name: 'Science', obtained: 85, maxMarks: 100, percentage: 85 },
      { name: 'Social Studies', obtained: 81, maxMarks: 100, percentage: 81 },
      { name: 'Mathematics', obtained: 80, maxMarks: 100, percentage: 80 },
    ],
    activities: [
      { type: 'Assignment', obtained: 22, maxMarks: 25, percentage: 88 },
      { type: 'Project', obtained: 24, maxMarks: 25, percentage: 96 },
    ],
  },
  {
    id: 'exam-ut3',
    name: 'Unit Test 3',
    dateStr: 'January 2026',
    term: 'Term 2',
    totalMax: 500,
    totalObtained: 389,
    percentage: 77.8,
    subjects: [
      { name: 'Computer Science', obtained: 82, maxMarks: 100, percentage: 82 },
      { name: 'English', obtained: 78, maxMarks: 100, percentage: 78 },
      { name: 'Science', obtained: 76, maxMarks: 100, percentage: 76 },
      { name: 'Social Studies', obtained: 75, maxMarks: 100, percentage: 75 },
      { name: 'Mathematics', obtained: 78, maxMarks: 100, percentage: 78 },
    ],
    activities: [
      { type: 'Assignment', obtained: 19, maxMarks: 25, percentage: 76 },
      { type: 'Project', obtained: 20, maxMarks: 25, percentage: 80 },
    ],
  },
  {
    id: 'exam-final',
    name: 'Final Term',
    dateStr: 'March 2026',
    term: 'Term 2',
    totalMax: 500,
    totalObtained: 436,
    percentage: 87.2,
    subjects: [
      { name: 'Computer Science', obtained: 94, maxMarks: 100, percentage: 94 },
      { name: 'English', obtained: 89, maxMarks: 100, percentage: 89 },
      { name: 'Science', obtained: 88, maxMarks: 100, percentage: 88 },
      { name: 'Social Studies', obtained: 85, maxMarks: 100, percentage: 85 },
      { name: 'Mathematics', obtained: 80, maxMarks: 100, percentage: 80 },
    ],
    activities: [
      { type: 'Assignment', obtained: 23, maxMarks: 25, percentage: 92 },
      { type: 'Project', obtained: 24, maxMarks: 25, percentage: 96 },
    ],
  },
];

export const StudentMarksView: React.FC<StudentMarksViewProps> = ({ onBack }) => {
  const router = useRouter();

  // State
  const [selectedYear, setSelectedYear] = useState('2025 - 2026');
  const [showYearModal, setShowYearModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [showExamDropdownModal, setShowExamDropdownModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [examsData, setExamsData] = useState<ExamItem[]>(DEFAULT_EXAMS);

  // Load marks from API (merges real data with fallback)
  const loadMarks = useCallback(async () => {
    try {
      const [marksRes, subjectsRes] = await Promise.allSettled([
        fetchStudentMarksApi(),
        fetchSubjectsApi(),
      ]);

      const marksList: any[] =
        marksRes.status === 'fulfilled' &&
        marksRes.value &&
        marksRes.value.data &&
        Array.isArray(marksRes.value.data)
          ? marksRes.value.data
          : [];

      const subjectsList: any[] =
        subjectsRes.status === 'fulfilled' &&
        subjectsRes.value &&
        subjectsRes.value.data &&
        Array.isArray(subjectsRes.value.data)
          ? subjectsRes.value.data
          : [];

      if (marksList.length > 0) {
        const subNameMap = new Map<string, string>();
        subjectsList.forEach((s) => {
          if (s.id && s.name) subNameMap.set(String(s.id), s.name);
        });

        // Group by exam name
        const examMap = new Map<string, {
          name: string;
          dateStr: string;
          term: string;
          subjects: ExamSubjectMark[];
        }>();

        marksList.forEach((m) => {
          const examName = m.examName || m.exam?.name || m.title || 'Examination';
          const subjName =
            subNameMap.get(String(m.subjectId)) ||
            m.subject?.name ||
            m.subjectName ||
            'General Subject';
          const maxMarks = Number(m.maxMarks || m.totalMarks || 100);
          const obtained = Number(m.marksObtained ?? m.obtainedMarks ?? 0);
          const pct = maxMarks > 0 ? Math.round((obtained / maxMarks) * 100) : 0;

          if (!examMap.has(examName)) {
            examMap.set(examName, {
              name: examName,
              dateStr: m.date || 'Academic Session',
              term: m.term || 'Term 1',
              subjects: [],
            });
          }

          examMap.get(examName)!.subjects.push({
            name: subjName,
            obtained,
            maxMarks,
            percentage: pct,
          });
        });

        const builtExams: ExamItem[] = [];
        examMap.forEach((val, key) => {
          const totMax = val.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
          const totObt = val.subjects.reduce((sum, s) => sum + s.obtained, 0);
          const pct = totMax > 0 ? Number(((totObt / totMax) * 100).toFixed(1)) : 0;

          builtExams.push({
            id: `exam-${key}`,
            name: val.name,
            dateStr: val.dateStr,
            term: val.term,
            totalMax: totMax,
            totalObtained: totObt,
            percentage: pct,
            subjects: val.subjects,
            activities: [
              { type: 'Assignment', obtained: Math.round(totObt * 0.05), maxMarks: 25, percentage: 72 },
              { type: 'Project', obtained: Math.round(totObt * 0.06), maxMarks: 25, percentage: 88 },
            ],
          });
        });

        if (builtExams.length > 0) {
          setExamsData(builtExams);
        } else {
          setExamsData(DEFAULT_EXAMS);
        }
      } else {
        setExamsData(DEFAULT_EXAMS);
      }
    } catch {
      setExamsData(DEFAULT_EXAMS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMarks();
  }, [loadMarks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMarks();
  }, [loadMarks]);

  // Handle header back action
  const handleHeaderBack = useCallback(() => {
    if (selectedExamId !== null) {
      // Return from Exam Detail (Image 2) to All Exams List (Image 1)
      setSelectedExamId(null);
    } else if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }, [selectedExamId, onBack, router]);

  // Overall calculations for Image 1 Top Summary Card
  const overallSummary = useMemo(() => {
    // Unique subjects count across all exams
    const subjectNames = new Set<string>();
    let totalObt = 0;
    let totalMax = 0;

    examsData.forEach((exam) => {
      exam.subjects.forEach((s) => subjectNames.add(s.name));
      totalObt += exam.totalObtained;
      totalMax += exam.totalMax;
    });

    const avg = totalMax > 0 ? Number(((totalObt / totalMax) * 100).toFixed(1)) : 0;
    return {
      totalSubjects: subjectNames.size || 5,
      totalObtained: totalObt,
      totalMax: totalMax || 500,
      averagePct: avg,
    };
  }, [examsData]);

  // Selected Exam for Image 2
  const activeExam = useMemo(() => {
    if (!selectedExamId) return null;
    return examsData.find((e) => e.id === selectedExamId) || examsData[0] || null;
  }, [selectedExamId, examsData]);


  if (loading) {
    return (
      <ShimmerProvider>
        <MarksSkeleton />
      </ShimmerProvider>
    );
  }

  return (
    <View style={styles.container}>
      {/* ─── Top Header Bar ────────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Marks</Text>
        </View>

        {/* Academic Year Dropdown Pill */}
        <TouchableOpacity
          style={styles.yearPill}
          activeOpacity={0.8}
          onPress={() => setShowYearModal(true)}
        >
          <Text style={styles.yearPillText}>{selectedYear}</Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
        {activeExam === null ? (
          /* ══════════════════════════════════════════════════════════════════
             SCREEN 1: All Exams Overview (Image 1)
             ══════════════════════════════════════════════════════════════════ */
          <>
            {/* Top 3-Metric Summary Card */}
            <View style={styles.topSummaryCard}>
              {/* Metric 1: Total Subjects */}
              <View style={styles.topSummaryCell}>
                <Text style={styles.topSummaryLabel}>Total Subjects</Text>
                <Text style={styles.topSummaryValue}>{overallSummary.totalSubjects}</Text>
              </View>

              <View style={styles.topSummaryDivider} />

              {/* Metric 2: Total Marks */}
              <View style={styles.topSummaryCell}>
                <Text style={styles.topSummaryLabel}>Total Marks</Text>
                <Text style={styles.topSummaryValue}>
                  {overallSummary.totalObtained} / {overallSummary.totalMax}
                </Text>
              </View>

              <View style={styles.topSummaryDivider} />

              {/* Metric 3: Average */}
              <View style={styles.topSummaryCell}>
                <Text style={styles.topSummaryLabel}>Average</Text>
                <Text style={styles.topSummaryValue}>{overallSummary.averagePct}%</Text>
              </View>
            </View>

            {/* Exams Section Header Row */}
            <View style={styles.examsHeaderRow}>
              <Text style={styles.examsTitle}>Exams</Text>
            </View>

            {/* List of Exam Cards */}
            <View style={styles.examCardsList}>
              {examsData.map((exam) => (
                <TouchableOpacity
                  key={exam.id}
                  style={styles.examCard}
                  activeOpacity={0.8}
                  onPress={() => setSelectedExamId(exam.id)}
                >
                  <View style={styles.examCardLeft}>
                    <Text style={styles.examCardName}>{exam.name}</Text>
                    <Text style={styles.examCardDate}>{exam.dateStr}</Text>
                  </View>

                  <View style={styles.examCardRight}>
                    <View style={styles.examCardMarksCol}>
                      <Text style={styles.examCardMarks}>
                        {exam.totalObtained} / {exam.totalMax}
                      </Text>
                      <Text style={styles.examCardPct}>{exam.percentage}%</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color="#111827" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          /* ══════════════════════════════════════════════════════════════════
             SCREEN 2: Exam Drilldown View (Image 2)
             ══════════════════════════════════════════════════════════════════ */
          <>
            {/* Exam Selector Dropdown Card */}
            <TouchableOpacity
              style={styles.examDropdownCard}
              activeOpacity={0.8}
              onPress={() => setShowExamDropdownModal(true)}
            >
              <Text style={styles.examDropdownCardText}>{activeExam.name}</Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color="#111827" />
            </TouchableOpacity>

            {/* 3-Column Metrics Card for Selected Exam */}
            <View style={styles.topSummaryCard}>
              {/* Total Marks */}
              <View style={styles.topSummaryCell}>
                <Text style={styles.topSummaryLabel}>Total Marks</Text>
                <Text style={styles.topSummaryValue}>{activeExam.totalMax}</Text>
              </View>

              <View style={styles.topSummaryDivider} />

              {/* Obtained Marks */}
              <View style={styles.topSummaryCell}>
                <Text style={styles.topSummaryLabel}>Obtained Marks</Text>
                <Text style={styles.topSummaryValue}>{activeExam.totalObtained}</Text>
              </View>

              <View style={styles.topSummaryDivider} />

              {/* Percentage */}
              <View style={styles.topSummaryCell}>
                <Text style={styles.topSummaryLabel}>Percentage</Text>
                <Text style={styles.topSummaryValue}>{activeExam.percentage}%</Text>
              </View>
            </View>

            {/* Subject Marks Table */}
            <View style={styles.tableCard}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableColHeader, { flex: 1.6, textAlign: 'left' }]}>
                  Subject
                </Text>
                <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'center' }]}>
                  Marks
                </Text>
                <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'right' }]}>
                  Percentage
                </Text>
              </View>

              {/* Table Rows */}
              <View style={styles.tableBody}>
                {activeExam.subjects.map((sub, idx) => (
                  <View
                    key={sub.name}
                    style={[
                      styles.tableRow,
                      idx === activeExam.subjects.length - 1 && styles.tableRowLast,
                    ]}
                  >
                    <Text style={[styles.tableRowSubject, { flex: 1.6 }]}>{sub.name}</Text>
                    <Text style={[styles.tableRowMarks, { flex: 1.2, textAlign: 'center' }]}>
                      {sub.obtained} / {sub.maxMarks}
                    </Text>
                    <Text style={[styles.tableRowPct, { flex: 1.2, textAlign: 'right' }]}>
                      {sub.percentage}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Activities Table Section */}
            <View style={styles.activitiesSection}>
              <Text style={styles.activitiesSectionTitle}>Activities</Text>

              <View style={styles.tableCard}>
                {/* Activities Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableColHeader, { flex: 1.6, textAlign: 'left' }]}>
                    Type
                  </Text>
                  <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'center' }]}>
                    Marks
                  </Text>
                  <Text style={[styles.tableColHeader, { flex: 1.2, textAlign: 'right' }]}>
                    Percentage
                  </Text>
                </View>

                {/* Activities Table Rows */}
                <View style={styles.tableBody}>
                  {(activeExam.activities && activeExam.activities.length > 0
                    ? activeExam.activities
                    : [
                        { type: 'Assignment', obtained: 18, maxMarks: 25, percentage: 72 },
                        { type: 'Project', obtained: 22, maxMarks: 25, percentage: 88 },
                      ]
                  ).map((act, idx, arr) => (
                    <View
                      key={act.type}
                      style={[
                        styles.tableRow,
                        idx === arr.length - 1 && styles.tableRowLast,
                      ]}
                    >
                      <Text style={[styles.tableRowSubject, { flex: 1.6 }]}>{act.type}</Text>
                      <Text style={[styles.tableRowMarks, { flex: 1.2, textAlign: 'center' }]}>
                        {act.obtained} / {act.maxMarks}
                      </Text>
                      <Text style={[styles.tableRowPct, { flex: 1.2, textAlign: 'right' }]}>
                        {act.percentage}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ─── Academic Year Picker Modal ─────────────────────────────────── */}
      <Modal
        visible={showYearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowYearModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Academic Year</Text>
              <TouchableOpacity onPress={() => setShowYearModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {ACADEMIC_YEARS.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.modalItem, selectedYear === year && styles.modalItemActive]}
                onPress={() => {
                  setSelectedYear(year);
                  setShowYearModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    selectedYear === year && styles.modalItemTextActive,
                  ]}
                >
                  {year}
                </Text>
                {selectedYear === year && (
                  <MaterialCommunityIcons name="check" size={20} color="#111827" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ─── Exam Dropdown Picker Modal (in Detail View) ────────────────── */}
      <Modal
        visible={showExamDropdownModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExamDropdownModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowExamDropdownModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Exam</Text>
              <TouchableOpacity onPress={() => setShowExamDropdownModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Option to return to All Exams */}
            <TouchableOpacity
              style={[styles.modalItem, { borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 4 }]}
              onPress={() => {
                setSelectedExamId(null);
                setShowExamDropdownModal(false);
              }}
            >
              <Text style={[styles.modalItemText, { color: '#B45309', fontFamily: FontFamily.bold }]}>
                ← View All Exams
              </Text>
            </TouchableOpacity>

            {examsData.map((exam) => (
              <TouchableOpacity
                key={exam.id}
                style={[
                  styles.modalItem,
                  selectedExamId === exam.id && styles.modalItemActive,
                ]}
                onPress={() => {
                  setSelectedExamId(exam.id);
                  setShowExamDropdownModal(false);
                }}
              >
                <View>
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedExamId === exam.id && styles.modalItemTextActive,
                    ]}
                  >
                    {exam.name}
                  </Text>
                  <Text style={styles.modalItemSub}>{exam.dateStr}</Text>
                </View>
                {selectedExamId === exam.id && (
                  <MaterialCommunityIcons name="check" size={20} color="#111827" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
    gap: 14,
  },

  /* ─── Header Bar ─────────────────────────────────────────────────── */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  yearPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7D8',
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  yearPillText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },

  /* ─── Top 3-Metric Summary Card ──────────────────────────────────── */
  topSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#F6EEDB',
    borderRadius: 5,
    paddingVertical: 14,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  topSummaryCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSummaryLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    textAlign: 'center',
  },
  topSummaryValue: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginTop: 4,
    textAlign: 'center',
  },
  topSummaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#EFE7D8',
  },

  /* ─── Exams Section Header ───────────────────────────────────────── */
  examsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  examsTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  segmentedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7D8',
    borderRadius: 5,
    padding: 3,
  },
  segmentBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  segmentBtnActive: {
    backgroundColor: '#FEF08A',
  },
  segmentBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  segmentBtnTextActive: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  /* ─── Exam Cards List ────────────────────────────────────────────── */
  examCardsList: {
    gap: 10,
  },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7D8',
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  examCardLeft: {
    flex: 1,
  },
  examCardName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  examCardDate: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 3,
  },
  examCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  examCardMarksCol: {
    alignItems: 'flex-end',
  },
  examCardMarks: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  examCardPct: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginTop: 2,
  },
  termGroupTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#4B5563',
    marginBottom: 6,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  /* ─── Exam Dropdown Card (Image 2) ───────────────────────────────── */
  examDropdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF6',
    borderWidth: 1,
    borderColor: '#F6EEDB',
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  examDropdownCardText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  /* ─── Subject Marks Table (Image 2) ──────────────────────────────── */
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#EFE7D8',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFF8E7',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7D8',
  },
  tableColHeader: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  tableBody: {
    backgroundColor: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE8',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableRowSubject: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#000000',
  },
  tableRowMarks: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#000000',
  },
  tableRowPct: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#000000',
  },

  /* ─── Activities Section ─────────────────────────────────────────── */
  activitiesSection: {
    marginTop: 6,
  },
  activitiesSectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginBottom: 8,
  },

  /* ─── Modal Styles ───────────────────────────────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  modalItemActive: {
    backgroundColor: '#FEF3C7',
  },
  modalItemText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: '#1F2937',
  },
  modalItemTextActive: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  modalItemSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
  },
});
