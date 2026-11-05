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
import { fetchParentMarksApi, fetchSubjectsApi } from '../../../api/academics';
import { MarksSkeleton } from './skeletons';
import { ShimmerProvider } from './ShimmerSkeleton';
import { FontFamily } from '../../../constants/fonts';

export interface ParentMarksViewProps {
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
  academicYear: string;
  dateStr: string;
  term: string;
  totalMax: number;
  totalObtained: number;
  percentage: number;
  subjects: ExamSubjectMark[];
  activities: ActivityMark[];
}

export const ParentMarksView: React.FC<ParentMarksViewProps> = ({ onBack }) => {
  const router = useRouter();

  const [selectedYear, setSelectedYear] = useState('');
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [showYearModal, setShowYearModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [showExamDropdownModal, setShowExamDropdownModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [examsData, setExamsData] = useState<ExamItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const loadMarks = useCallback(async () => {
    try {
      const [marksRes, subjectsRes] = await Promise.all([
        fetchParentMarksApi(),
        fetchSubjectsApi().catch(() => []),
      ]);
      const subjectsList: any[] = Array.isArray(subjectsRes)
        ? subjectsRes
        : Array.isArray((subjectsRes as any)?.data)
          ? (subjectsRes as any).data
          : [];
      const subjectNames = new Map<string, string>();
      subjectsList.forEach((subject) => {
        if (subject?.id && subject?.name) subjectNames.set(String(subject.id), subject.name);
      });

      const responseExams: any[] = Array.isArray((marksRes as any)?.exams)
        ? (marksRes as any).exams
        : [];
      const builtExams: ExamItem[] = responseExams.map((row, index) => {
        const subjects: ExamSubjectMark[] = (Array.isArray(row?.subjects) ? row.subjects : []).map(
          (subject: any) => {
            const maxMarks = Number(subject?.maxMarks ?? 0);
            const obtained = Number(subject?.marksObtained ?? 0);
            return {
              name:
                subjectNames.get(String(subject?.subjectId || '')) ||
                String(subject?.subjectId || 'Unnamed subject'),
              obtained,
              maxMarks,
              percentage: maxMarks > 0 ? Math.round((obtained / maxMarks) * 100) : 0,
            };
          }
        );
        const totalMax = Number(row?.totalMax ?? subjects.reduce((sum, item) => sum + item.maxMarks, 0));
        const totalObtained = Number(
          row?.totalObtained ?? subjects.reduce((sum, item) => sum + item.obtained, 0)
        );
        const academicYear = String(row?.exam?.academicYear || '');
        return {
          id: String(row?.exam?.id || `exam-${index}`),
          name: String(row?.exam?.name || 'Unnamed exam'),
          academicYear,
          dateStr: academicYear,
          term: String(row?.exam?.term || ''),
          totalMax,
          totalObtained,
          percentage:
            totalMax > 0
              ? Number(row?.percentage ?? ((totalObtained / totalMax) * 100).toFixed(1))
              : 0,
          subjects,
          activities: [],
        };
      });
      const years = Array.from(
        new Set(builtExams.map((exam) => exam.academicYear).filter(Boolean))
      );
      setExamsData(builtExams);
      setAcademicYears(years);
      setSelectedYear((current) => (current && years.includes(current) ? current : years[0] || ''));
      setErrorMessage('');
    } catch (error: any) {
      setExamsData([]);
      setAcademicYears([]);
      setSelectedYear('');
      setErrorMessage(error?.message || 'Could not load marks.');
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

  const handleHeaderBack = useCallback(() => {
    if (selectedExamId !== null) {
      setSelectedExamId(null);
    }
  }, [selectedExamId]);

  const visibleExams = useMemo(
    () => (selectedYear ? examsData.filter((exam) => exam.academicYear === selectedYear) : examsData),
    [examsData, selectedYear]
  );

  const overallSummary = useMemo(() => {
    const subjectNames = new Set<string>();
    let totalObt = 0;
    let totalMax = 0;

    visibleExams.forEach((exam) => {
      exam.subjects.forEach((s) => subjectNames.add(s.name));
      totalObt += exam.totalObtained;
      totalMax += exam.totalMax;
    });

    const avg = totalMax > 0 ? Number(((totalObt / totalMax) * 100).toFixed(1)) : 0;
    return {
      totalSubjects: subjectNames.size,
      totalObtained: totalObt,
      totalMax,
      averagePct: avg,
    };
  }, [visibleExams]);

  const activeExam = useMemo(() => {
    if (!selectedExamId) return null;
    return visibleExams.find((e) => e.id === selectedExamId) || null;
  }, [selectedExamId, visibleExams]);

  if (loading) {
    return (
      <ShimmerProvider>
        <MarksSkeleton />
      </ShimmerProvider>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.yearPickerRow}>
        {activeExam !== null ? (
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={handleHeaderBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { marginLeft: 8 }]}>Back</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.yearPill}
            activeOpacity={0.8}
            onPress={() => setShowYearModal(true)}
          >
            <Text style={styles.yearPillText}>{selectedYear || 'Academic year'}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#111827" />
          </TouchableOpacity>
        )}
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
        {errorMessage ? (
          <View style={styles.statusCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={30} color="#B91C1C" />
            <Text style={styles.statusTitle}>Marks unavailable</Text>
            <Text style={styles.statusText}>{errorMessage}</Text>
          </View>
        ) : visibleExams.length === 0 ? (
          <View style={styles.statusCard}>
            <MaterialCommunityIcons name="file-document-outline" size={30} color="#6B7280" />
            <Text style={styles.statusTitle}>No marks published</Text>
            <Text style={styles.statusText}>Published exam results will appear here.</Text>
          </View>
        ) : activeExam === null ? (
          <>
            {/* Top 3-Metric Summary Card */}
            <View style={styles.topSummaryCard}>
              <View style={styles.topSummaryCell}>
                <Text style={styles.topSummaryLabel}>Total Subjects</Text>
                <Text style={styles.topSummaryValue}>{overallSummary.totalSubjects}</Text>
              </View>

              <View style={styles.topSummaryDivider} />

              <View style={styles.topSummaryCell}>
                <Text style={styles.topSummaryLabel}>Total Marks</Text>
                <Text style={styles.topSummaryValue}>
                  {overallSummary.totalObtained} / {overallSummary.totalMax}
                </Text>
              </View>

              <View style={styles.topSummaryDivider} />

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
              {visibleExams.map((exam) => (
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
              <View style={styles.topSummaryCell}>
                <Text style={styles.topSummaryLabel}>Total Marks</Text>
                <Text style={styles.topSummaryValue}>{activeExam.totalMax}</Text>
              </View>

              <View style={styles.topSummaryDivider} />

              <View style={styles.topSummaryCell}>
                <Text style={styles.topSummaryLabel}>Obtained Marks</Text>
                <Text style={styles.topSummaryValue}>{activeExam.totalObtained}</Text>
              </View>

              <View style={styles.topSummaryDivider} />

              <View style={styles.topSummaryCell}>
                <Text style={styles.topSummaryLabel}>Percentage</Text>
                <Text style={styles.topSummaryValue}>{activeExam.percentage}%</Text>
              </View>
            </View>

            {/* Subject Marks Table */}
            <View style={styles.tableCard}>
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

                <View style={styles.tableBody}>
                  {(activeExam.activities || []).map((act, idx, arr) => (
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

      {/* Academic Year Picker Modal */}
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

            {academicYears.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.modalItem, selectedYear === year && styles.modalItemActive]}
                onPress={() => {
                  setSelectedYear(year);
                  setSelectedExamId(null);
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

      {/* Exam Dropdown Picker Modal */}
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

            {visibleExams.map((exam) => (
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
  yearPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
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
    marginBottom: 4,
  },
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
  activitiesSection: {
    marginTop: 6,
  },
  activitiesSectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginBottom: 8,
  },
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
  statusCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginTop: 20,
    padding: 24,
  },
  statusTitle: {
    color: '#111827',
    fontFamily: FontFamily.bold,
    fontSize: 16,
  },
  statusText: {
    color: '#6B7280',
    fontFamily: FontFamily.regular,
    fontSize: 12,
    textAlign: 'center',
  },
});
