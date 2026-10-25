import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { Feather } from '../common/Icons';
import { InlineSearchDropdown } from '../common/InlineSearchDropdown';
import { FontFamily } from '../../../../constants/fonts';
import { useUserStore } from '../../../../store/useUserStore';
import {
  generateStudentMarksCardPdf,
  generateClassMarksLedgerPdf,
  calculateGrade,
  SubjectMarksRecord,
} from '../../utils/marksCardPdfGenerator';

export interface StudentRosterItem {
  id: string;
  rollNo: string;
  name: string;
  subjects: SubjectMarksRecord[];
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  gradeText: string;
  rank: number;
  isPassed: boolean;
  attendancePct: number;
  attendancePresent: number;
  attendanceTotal: number;
  teacherRemarks: string;
}

const DEFAULT_EXAMS = [
  'Overall',
  'Unit Test 1',
  'Unit Test 2',
  'Mid-Term Exam',
  'Final Exam',
];


const BASE_STUDENTS = [
  { rollNo: '08A01', name: 'Ayesha Khan', base: 92, remarks: 'Outstanding academic dedication and brilliant grasp of analytical concepts.' },
  { rollNo: '08A02', name: 'Mohammed Rafi', base: 78, remarks: 'Good grasp of fundamentals, encourage more practice in Mathematics.' },
  { rollNo: '08A03', name: 'Sana Fatima', base: 85, remarks: 'Very attentive and consistent across all theoretical and practical subjects.' },
  { rollNo: '08A04', name: 'Fahad Ali', base: 64, remarks: 'Shows genuine interest. Advised to focus on written examination clarity.' },
  { rollNo: '08A05', name: 'Zara Begum', base: 95, remarks: 'Exemplary performance. Demonstrates true leadership and intellectual curiosity.' },
  { rollNo: '08A06', name: 'Irshad Ahmed', base: 71, remarks: 'Good improvement observed in science and language subjects this term.' },
  { rollNo: '08A07', name: 'Nida Rahman', base: 82, remarks: 'Hardworking student with keen eye for detail. Excellent homework submission.' },
  { rollNo: '08A08', name: 'Adnan Shaikh', base: 58, remarks: 'Capable of higher marks with structured revision and extra attention in core subjects.' },
  { rollNo: '08A09', name: 'Kavya Menon', base: 94, remarks: 'Exceptional creative reasoning and consistently tops class discussions.' },
  { rollNo: '08A10', name: 'Arjun Reddy', base: 68, remarks: 'Active classroom participation. Needs regular revision in science formulas.' },
  { rollNo: '08A11', name: 'Bilal Siddiqui', base: 79, remarks: 'Consistently completes coursework with diligence and neat presentation.' },
  { rollNo: '08A12', name: 'Chhavi Sharma', base: 91, remarks: 'Remarkable consistency and excellent analytical skills in problem solving.' },
  { rollNo: '08A13', name: 'Devika Pillai', base: 86, remarks: 'Very disciplined, polite, and scores high marks in all language assessments.' },
  { rollNo: '08A14', name: 'Faizan Qureshi', base: 55, remarks: 'Needs to maintain regular attendance and focus on core examination modules.' },
  { rollNo: '08A15', name: 'Gaurav Joshi', base: 96, remarks: 'Top-tier analytical aptitude. Outstanding scores across all subjects.' },
  { rollNo: '08A16', name: 'Hafsa Mariam', base: 77, remarks: 'Well-mannered and sincere student. Good progress this term.' },
  { rollNo: '08A17', name: 'Imran Hashmi', base: 69, remarks: 'Regular student. Advised to spend additional time on structured mock tests.' },
  { rollNo: '08A18', name: 'Juhi Chawla', base: 88, remarks: 'Brilliant comprehension and articulate expression in assignments.' },
  { rollNo: '08A19', name: 'Karan Mehra', base: 83, remarks: 'Very energetic and enthusiastic learner. Great performance in science.' },
  { rollNo: '08A20', name: 'Laila Majnu', base: 52, remarks: 'Special remedial tutoring recommended in mathematics and science.' },
  { rollNo: '08A21', name: 'Manish Malhotra', base: 93, remarks: 'Exemplary project work and superb score in computer science & math.' },
  { rollNo: '08A22', name: 'Nusrat Jahan', base: 76, remarks: 'Diligent learner with steady progress throughout the semester.' },
  { rollNo: '08A23', name: 'Omer Farooq', base: 72, remarks: 'Shows great enthusiasm in practical labs. Maintain this momentum.' },
  { rollNo: '08A24', name: 'Pooja Bhatt', base: 89, remarks: 'Strong conceptual clarity and very neat handwriting in all subjects.' },
  { rollNo: '08A25', name: 'Rohan Sethi', base: 81, remarks: 'Good analytical skills and reliable team member in group activities.' },
  { rollNo: '08A26', name: 'Sameera Reddy', base: 98, remarks: 'Academic topper with near flawless scores in all major subject papers!' },
  { rollNo: '08A27', name: 'Tariq Mansoor', base: 66, remarks: 'Encouraging progress. Should practice time management during examinations.' },
  { rollNo: '08A28', name: 'Uzma Parveen', base: 87, remarks: 'Extremely polite and sincere. High standard maintained in all subjects.' },
  { rollNo: '08A29', name: 'Varun Grover', base: 80, remarks: 'Creative thinker with strong vocabulary and consistent exam marks.' },
  { rollNo: '08A30', name: 'Wasim Akram', base: 60, remarks: 'Needs to prioritize regular study habits and clarify doubt topics early.' },
  { rollNo: '08A31', name: 'Yasmin Bano', base: 94, remarks: 'Superior mastery in science and language subjects. Outstanding effort!' },
  { rollNo: '08A32', name: 'Zainab Qazi', base: 88, remarks: 'Hardworking, proactive, and demonstrates high academic integrity.' },
];

function buildClassData(className: string, sectionName: string, examName: string): StudentRosterItem[] {
  const isUnitTest = examName.toLowerCase().includes('unit');
  const maxPerSubject = isUnitTest ? 50 : 100;
  const passMarks = isUnitTest ? 18 : 35;
  const factor = isUnitTest ? 0.5 : 1.0;

  const subjectsList = [
    'Mathematics',
    'Science',
    'English',
    'Social Science',
    'Hindi',
    'Computer Science',
  ];

  const cleanSec = sectionName.replace('Section ', '').trim() || 'A';
  const cleanCls = className.replace(/[^0-9]/g, '') || '08';

  const studentsUnranked = BASE_STUDENTS.map((item, index) => {
    const offsets = [3, -2, 4, -3, 2, 5];
    const subjects: SubjectMarksRecord[] = subjectsList.map((subName, sIdx) => {
      const raw = Math.round(item.base * factor + (offsets[(index + sIdx) % offsets.length] * factor));
      const marksObtained = Math.max(isUnitTest ? 14 : 32, Math.min(maxPerSubject, raw));
      const g = calculateGrade(marksObtained, maxPerSubject);
      return {
        subjectName: subName,
        maxMarks: maxPerSubject,
        passMarks,
        marksObtained,
        grade: g.grade,
        remarks: g.text,
      };
    });

    const totalMarks = subjects.reduce((s, sub) => s + sub.marksObtained, 0);
    const maxMarks = subjects.length * maxPerSubject;
    const percentage = Number(((totalMarks / maxMarks) * 100).toFixed(1));
    const gradeInfo = calculateGrade(totalMarks, maxMarks);
    const isPassed = subjects.every((s) => s.marksObtained >= passMarks);

    const totalDays = 150;
    const daysOffset = (index * 7) % 18;
    const daysPresent = Math.min(totalDays, Math.max(110, totalDays - daysOffset));
    const attendancePct = Number(((daysPresent / totalDays) * 100).toFixed(1));
    const rollNo = `${cleanCls.padStart(2, '0')}${cleanSec}${String(index + 1).padStart(2, '0')}`;

    return {
      id: `std-${className}-${cleanSec}-${index + 1}`,
      rollNo,
      name: item.name,
      subjects,
      totalMarks,
      maxMarks,
      percentage,
      grade: gradeInfo.grade,
      gradeText: gradeInfo.text,
      rank: 1,
      isPassed,
      attendancePct,
      attendancePresent: daysPresent,
      attendanceTotal: totalDays,
      teacherRemarks: item.remarks,
    };
  });

  studentsUnranked.sort((a, b) => b.totalMarks - a.totalMarks);
  studentsUnranked.forEach((st, idx) => {
    st.rank = idx + 1;
  });

  return studentsUnranked;
}

export interface StudentMarksCardReportProps {
  initialClass?: string;
  initialSection?: string;
}

export const StudentMarksCardReport: React.FC<StudentMarksCardReportProps> = ({
  initialClass = 'Class 8',
  initialSection = 'Section A',
}) => {
  const userStore = useUserStore();
  const institutionName = userStore.institutionName || userStore.schoolName || 'Kivquo Academy of Excellence';

  // Fixed class and section from screen 1
  const [selectedClass, setSelectedClass] = useState(() => initialClass);
  const [selectedSection, setSelectedSection] = useState(() => {
    return initialSection.toLowerCase().startsWith('section')
      ? initialSection
      : `Section ${initialSection}`;
  });

  // Dropdown State: Exam filter matching TeacherMarksView
  const [selectedExam, setSelectedExam] = useState('Unit Test 2');
  const [isExamOpen, setIsExamOpen] = useState(false);

  // Search Bar States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);

  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingLedger, setExportingLedger] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // Sync if props change
  useEffect(() => {
    if (initialClass) setSelectedClass(initialClass);
  }, [initialClass]);

  useEffect(() => {
    if (initialSection) {
      setSelectedSection(
        initialSection.toLowerCase().startsWith('section')
          ? initialSection
          : `Section ${initialSection}`
      );
    }
  }, [initialSection]);

  // Computed students roster
  const allStudents = useMemo(() => {
    return buildClassData(selectedClass, selectedSection, selectedExam);
  }, [selectedClass, selectedSection, selectedExam]);

  // Filtered students displayed in the main list based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return allStudents;
    const q = searchQuery.toLowerCase().trim();
    return allStudents.filter(
      (s) => s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
    );
  }, [allStudents, searchQuery]);

  // Currently active student for single PDF download
  const activeStudent = useMemo(() => {
    const clamped = Math.max(0, Math.min(selectedStudentIndex, filteredStudents.length - 1));
    return filteredStudents[clamped] || allStudents[0] || null;
  }, [filteredStudents, allStudents, selectedStudentIndex]);

  // Export student marks card to PDF
  const handleExportSinglePdf = async (studentToExport?: StudentRosterItem) => {
    const target = studentToExport || activeStudent || allStudents[0];
    if (!target || exportingPdf) return;
    setExportingPdf(true);
    try {
      await generateStudentMarksCardPdf({
        studentName: target.name,
        rollNoOrUSN: target.rollNo,
        className: selectedClass,
        sectionName: selectedSection.replace('Section ', ''),
        examName: selectedExam,
        academicYear: '2025 - 2026',
        classRank: target.rank,
        totalStudentsInClass: allStudents.length,
        attendancePercentage: target.attendancePct,
        attendanceDaysPresent: target.attendancePresent,
        attendanceTotalDays: target.attendanceTotal,
        subjects: target.subjects,
        teacherRemarks: target.teacherRemarks,
      });
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'Could not generate Marks Card PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  // Export official simple, organized, and professional class marks ledger to PDF
  const handleExportClassLedger = async () => {
    if (exportingLedger) return;
    setExportingLedger(true);
    try {
      await generateClassMarksLedgerPdf({
        className: selectedClass,
        sectionName: selectedSection.replace('Section ', ''),
        examName: selectedExam,
        academicYear: '2025 - 2026',
        students: allStudents.map((s) => ({
          rank: s.rank,
          rollNo: s.rollNo,
          name: s.name,
          subjects: s.subjects.map((sub) => ({
            subjectName: sub.subjectName,
            marksObtained: sub.marksObtained,
            maxMarks: sub.maxMarks,
          })),
          totalMarks: s.totalMarks,
          maxMarks: s.maxMarks,
          percentage: s.percentage,
          grade: s.grade,
          isPassed: s.isPassed,
          attendancePct: s.attendancePct,
        })),
      });
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'Could not generate Class Marks Ledger PDF.');
    } finally {
      setExportingLedger(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
        {/* Exam Filter (Matches screenshot style) */}
        <View style={styles.filtersWrapper}>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>Exam</Text>
            <TouchableOpacity
              style={[
                styles.filterBox,
                isExamOpen && styles.filterBoxActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setIsExamOpen(!isExamOpen)}
            >
              <Text
                style={[
                  styles.filterVal,
                  isExamOpen && styles.filterValActive,
                ]}
                numberOfLines={1}
              >
                {selectedExam}
              </Text>
              <Feather
                name={isExamOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={isExamOpen ? '#0284C7' : '#4B5563'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline Dropdown for Exam - Matches Image with search & badges */}
        {isExamOpen && (
          <View style={styles.inlineFilterWrapper}>
            <InlineSearchDropdown
              placeholder="Search exam..."
              selectedValue={selectedExam}
              options={DEFAULT_EXAMS.map((e) => {
                const isOverall = e.toLowerCase().includes('overall');
                const isTerm = e.toLowerCase().includes('term') || e.toLowerCase().includes('final');
                return {
                  label: e,
                  value: e,
                  subtext: isOverall ? 'Overall Cumulative Assessment' : isTerm ? 'Term Examination' : 'Periodic Assessment',
                  badge: isOverall ? 'Overall' : isTerm ? 'Max 100' : 'Max 50',
                  badgeColor: isOverall ? '#171717' : '#047857',
                };
              })}
              isOpen={true}
              menuOnly={true}
              onToggle={() => setIsExamOpen(false)}
              onSelect={(e) => {
                setSelectedExam(e);
                setIsExamOpen(false);
              }}
              iconName="file-document-edit-outline"
              iconType="material"
            />
          </View>
        )}

        {/* Search Bar & Students Count Badge */}
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
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={15} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {filteredStudents.length} Students
            </Text>
          </View>
        </View>

        {/* Students List Displayed Vertically One Below The Other with internal scroll */}
        <View style={styles.studentsListCard}>
          <ScrollView
            style={styles.studentsListScroll}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {filteredStudents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No Students Found</Text>
                <Text style={styles.emptySub}>No student matches your search query.</Text>
              </View>
            ) : (
              filteredStudents.map((st, idx) => {
                const isSelected = activeStudent?.id === st.id;
                return (
                  <TouchableOpacity
                    key={st.id}
                    style={[
                      styles.studentRowItem,
                      isSelected && styles.studentRowItemSelected,
                      idx === filteredStudents.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      const originalIdx = filteredStudents.findIndex((s) => s.id === st.id);
                      if (originalIdx !== -1) setSelectedStudentIndex(originalIdx);
                    }}
                  >
                    {/* Number (No background box, black color) */}
                    <Text style={styles.studentIndexText}>{idx + 1}</Text>

                    {/* Student Name and USN (Only these, both black text) */}
                    <View style={styles.studentInfoCol}>
                      <Text style={styles.studentNameText} numberOfLines={1}>
                        {st.name}
                      </Text>
                      <Text style={styles.studentUsnText}>{st.rollNo}</Text>
                    </View>

                    {/* Download Button (No background box, black text) */}
                    <TouchableOpacity
                      style={styles.downloadRowBtn}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => handleExportSinglePdf(st)}
                    >
                      <Text style={styles.downloadRowBtnText}>Download</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Download Buttons Kept Below (Always Visible) */}
        <View style={styles.bottomDownloadContainer}>
          <TouchableOpacity
            style={[styles.pdfButton, exportingPdf && { opacity: 0.7 }]}
            onPress={() => handleExportSinglePdf(activeStudent || allStudents[0])}
            disabled={exportingPdf}
            activeOpacity={0.85}
          >
            <Text style={styles.pdfButtonText}>
              {exportingPdf ? 'Generating PDF...' : 'Download'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.csvButton, exportingLedger && { opacity: 0.7 }]}
            onPress={handleExportClassLedger}
            disabled={exportingLedger}
            activeOpacity={0.85}
          >
            <Text style={styles.csvButtonText}>
              {exportingLedger ? 'Generating Ledger...' : 'Download Class Marks Ledger'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
    gap: 12,
  },

  /* Exam Filter (Matches screenshot) */
  filtersWrapper: {
    marginBottom: 2,
  },
  filterCol: {
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
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
    flex: 1,
    paddingRight: 2,
  },
  filterValActive: {
    color: '#0284C7',
  },
  inlineFilterWrapper: {
    marginBottom: 6,
  },

  /* Search Section */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    color: '#000000',
    fontFamily: FontFamily.medium,
    paddingVertical: 0,
  },
  countBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },

  /* Vertical Students List with Internal Scroll */
  studentsListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  studentsListScroll: {
    maxHeight: 280,
  },
  studentRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  studentRowItemSelected: {
    backgroundColor: '#FFFBEB',
  },

  /* Number: No background box, color black */
  studentIndexText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
    width: 26,
    textAlign: 'left',
  },

  /* Student Info: Name and USN only, all black text */
  studentInfoCol: {
    flex: 1,
    paddingHorizontal: 8,
    gap: 2,
  },
  studentNameText: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  studentUsnText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#000000',
  },

  /* Download Button on row: No background box, renamed to Download, color black */
  downloadRowBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  downloadRowBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },

  /* Empty state */
  emptyCard: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  emptySub: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 3,
  },

  /* Bottom Download Buttons */
  bottomDownloadContainer: {
    marginTop: 4,
    gap: 8,
  },
  pdfButton: {
    backgroundColor: '#F4C430',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pdfButtonText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  csvButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  csvButtonText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
});
