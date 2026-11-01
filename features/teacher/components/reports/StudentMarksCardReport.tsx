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


export interface StudentMarksCardReportProps {
  initialClass?: string;
  initialSection?: string;
}

export const StudentMarksCardReport: React.FC<StudentMarksCardReportProps> = ({
  initialClass = '',
  initialSection = '',
}) => {
  const userStore = useUserStore();
  const institutionName = userStore.institutionName || userStore.schoolName || '';

  // Fixed class and section from screen 1
  const [selectedClass, setSelectedClass] = useState(() => initialClass);
  const [selectedSection, setSelectedSection] = useState(() => {
    return initialSection.toLowerCase().startsWith('section')
      ? initialSection
      : `Section ${initialSection}`;
  });

  // Dropdown State: Exam filter matching TeacherMarksView
  const [selectedExam, setSelectedExam] = useState('');
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

  const allStudents: StudentRosterItem[] = [];

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
              options={[]}
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
