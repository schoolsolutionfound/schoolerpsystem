import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Feather } from '../common/Icons';
import { InlineSearchDropdown } from '../common/InlineSearchDropdown';
import { FontFamily } from '../../../../constants/fonts';
import {
  fetchClassAttendanceReportApi,
  fetchClassAttendanceExportApi,
} from '../../../../api/academics';
import { TeacherShimmerSkeleton } from '../common/TeacherShimmer';
import { generateClassAttendancePdfReport } from '../../utils/attendancePdfGenerator';

export interface StudentAttendanceRecord {
  id: string;
  fullName: string;
  rollNoOrUSN: string;
  present: number;
  total: number;
  absent: number;
  percentage: number;
}

const DATE_RANGES = ['Current Month', 'Last 30 Days', 'Full Academic Term'];

const FALLBACK_STUDENTS: { name: string; roll: string; basePct: number }[] = [
  { name: 'Ayesha Khan', roll: '08A01', basePct: 96 },
  { name: 'Mohammed Rafi', roll: '08A02', basePct: 88 },
  { name: 'Sana Fatima', roll: '08A03', basePct: 92 },
  { name: 'Fahad Ali', roll: '08A04', basePct: 68 },
  { name: 'Zara Begum', roll: '08A05', basePct: 98 },
  { name: 'Irshad Ahmed', roll: '08A06', basePct: 82 },
  { name: 'Nida Rahman', roll: '08A07', basePct: 90 },
  { name: 'Adnan Shaikh', roll: '08A08', basePct: 62 },
  { name: 'Kavya Menon', roll: '08A09', basePct: 97 },
  { name: 'Arjun Reddy', roll: '08A10', basePct: 74 },
  { name: 'Bilal Siddiqui', roll: '08A11', basePct: 85 },
  { name: 'Chhavi Sharma', roll: '08A12', basePct: 95 },
  { name: 'Devika Pillai', roll: '08A13', basePct: 93 },
  { name: 'Faizan Qureshi', roll: '08A14', basePct: 56 },
  { name: 'Gaurav Joshi', roll: '08A15', basePct: 99 },
  { name: 'Hafsa Mariam', roll: '08A16', basePct: 86 },
  { name: 'Imran Hashmi', roll: '08A17', basePct: 78 },
  { name: 'Juhi Chawla', roll: '08A18', basePct: 91 },
  { name: 'Karan Mehra', roll: '08A19', basePct: 89 },
  { name: 'Laila Majnu', roll: '08A20', basePct: 48 },
  { name: 'Manish Malhotra', roll: '08A21', basePct: 94 },
  { name: 'Nusrat Jahan', roll: '08A22', basePct: 84 },
  { name: 'Omer Farooq', roll: '08A23', basePct: 79 },
  { name: 'Pooja Bhatt', roll: '08A24', basePct: 91 },
  { name: 'Rohan Sethi', roll: '08A25', basePct: 87 },
  { name: 'Sameera Reddy', roll: '08A26', basePct: 100 },
  { name: 'Tariq Mansoor', roll: '08A27', basePct: 71 },
  { name: 'Uzma Parveen', roll: '08A28', basePct: 93 },
  { name: 'Varun Grover', roll: '08A29', basePct: 86 },
  { name: 'Wasim Akram', roll: '08A30', basePct: 64 },
  { name: 'Yasmin Bano', roll: '08A31', basePct: 95 },
  { name: 'Zainab Qazi', roll: '08A32', basePct: 90 },
];

export interface AttendanceStudentReportProps {
  initialClass?: string;
  initialSection?: string;
}

export const AttendanceStudentReport: React.FC<AttendanceStudentReportProps> = ({
  initialClass,
  initialSection,
}) => {
  // Dropdown states matching StudentMarksCardReport
  const [selectedClass, setSelectedClass] = useState(() => initialClass || 'Class 8');
  const [selectedSection, setSelectedSection] = useState(() => {
    if (initialSection) {
      return initialSection.toLowerCase().startsWith('section')
        ? initialSection
        : `Section ${initialSection}`;
    }
    return 'Section A';
  });
  const [selectedRange, setSelectedRange] = useState('Current Month');
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);

  // Sync if initialClass or initialSection props change
  useEffect(() => {
    if (initialClass) {
      setSelectedClass(initialClass);
    }
  }, [initialClass]);

  useEffect(() => {
    if (initialSection) {
      const formatted = initialSection.toLowerCase().startsWith('section')
        ? initialSection
        : `Section ${initialSection}`;
      setSelectedSection(formatted);
    }
  }, [initialSection]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchClassAttendanceReportApi('');
      setReport(res);
    } catch (err: any) {
      console.warn('[Report] Could not load live attendance report:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReport();
    setRefreshing(false);
  }, [loadReport]);

  // Build full students list with fallback
  const studentRoster: StudentAttendanceRecord[] = useMemo(() => {
    const totalWorkingDays = selectedRange === 'Current Month' ? 24 : selectedRange === 'Last 30 Days' ? 26 : 150;
    const cleanCls = selectedClass.replace(/[^0-9]/g, '') || '08';
    const cleanSec = selectedSection.replace('Section ', '').trim();

    if (report?.students && Array.isArray(report.students) && report.students.length > 0) {
      return report.students.map((s: any, idx: number) => {
        const total = s.total || totalWorkingDays;
        const present = s.present || Math.round((s.percentage / 100) * total);
        return {
          id: s.id || `std-${idx}`,
          fullName: s.fullName || s.name || `Student ${idx + 1}`,
          rollNoOrUSN: s.rollNoOrUSN || `${cleanCls}${cleanSec}${String(idx + 1).padStart(2, '0')}`,
          present,
          total,
          absent: Math.max(0, total - present),
          percentage: s.percentage !== undefined ? s.percentage : Math.round((present / total) * 100),
        };
      });
    }

    return FALLBACK_STUDENTS.map((item, idx) => {
      const present = Math.round((item.basePct / 100) * totalWorkingDays);
      const absent = Math.max(0, totalWorkingDays - present);
      const rollNo = `${cleanCls}${cleanSec}${String(idx + 1).padStart(2, '0')}`;
      return {
        id: `att-st-${idx}`,
        fullName: item.name,
        rollNoOrUSN: rollNo,
        present,
        total: totalWorkingDays,
        absent,
        percentage: item.basePct,
      };
    });
  }, [report, selectedClass, selectedSection, selectedRange]);

  // Filter students based on search query - matches Marks Card Report
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentRoster;
    const q = searchQuery.toLowerCase().trim();
    return studentRoster.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.rollNoOrUSN.toLowerCase().includes(q)
    );
  }, [studentRoster, searchQuery]);

  // Summary counts for PDF export
  const summaryStats = useMemo(() => {
    const totalStudents = studentRoster.length;
    if (totalStudents === 0) {
      return { avgPct: 0, lowCount: 0, topCount: 0, presentToday: 0, absentToday: 0, totalStudents: 0 };
    }

    const avgPct = Math.round(
      studentRoster.reduce((sum, s) => sum + s.percentage, 0) / totalStudents
    );
    const lowCount = studentRoster.filter((s) => s.percentage < 75).length;
    const topCount = studentRoster.filter((s) => s.percentage >= 90).length;
    const presentToday = Math.round(totalStudents * (avgPct / 100));
    const absentToday = totalStudents - presentToday;

    return { avgPct, lowCount, topCount, totalStudents, presentToday, absentToday };
  }, [studentRoster]);

  const activeStudent = useMemo(() => {
    const clamped = Math.max(0, Math.min(selectedStudentIndex, filteredStudents.length - 1));
    return filteredStudents[clamped] || studentRoster[0] || null;
  }, [filteredStudents, studentRoster, selectedStudentIndex]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await fetchClassAttendanceExportApi('');
      Alert.alert('Export Ready', 'Attendance CSV data has been generated.', [{ text: 'OK' }]);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export attendance data');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      await generateClassAttendancePdfReport({
        classSection: `${selectedClass} - ${selectedSection.replace('Section ', '')}`,
        range: selectedRange,
        summary: {
          totalStudents: summaryStats.totalStudents,
          studentsCount: summaryStats.totalStudents,
          averagePercentage: summaryStats.avgPct,
          present: summaryStats.presentToday,
          absent: summaryStats.absentToday,
          lowAttendanceCount: summaryStats.lowCount,
        },
        topPerformers: studentRoster.filter((s) => s.percentage >= 90),
        lowAttendance: studentRoster.filter((s) => s.percentage < 75),
        students: studentRoster,
        dailyTrend: report?.dailyTrend,
      });
    } catch (err: any) {
      Alert.alert('PDF Export Failed', err?.message || 'Could not generate attendance PDF report.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportSingleStudentPdf = async (studentToExport?: StudentAttendanceRecord) => {
    const target = studentToExport || activeStudent || studentRoster[0];
    if (!target || exportingPdf) return;
    setExportingPdf(true);
    try {
      await generateClassAttendancePdfReport({
        classSection: `${selectedClass} - ${selectedSection.replace('Section ', '')}`,
        range: selectedRange,
        summary: {
          totalStudents: 1,
          studentsCount: 1,
          averagePercentage: target.percentage,
          present: target.present,
          absent: target.absent,
          lowAttendanceCount: target.percentage < 75 ? 1 : 0,
        },
        topPerformers: target.percentage >= 90 ? [target] : [],
        lowAttendance: target.percentage < 75 ? [target] : [],
        students: [target],
        dailyTrend: report?.dailyTrend,
      });
    } catch (err: any) {
      Alert.alert('PDF Export Failed', err?.message || 'Could not generate student attendance PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  const subjects = report?.subjects || [
    { subjectName: 'Mathematics', percentage: 88, present: 22, total: 25 },
    { subjectName: 'Science', percentage: 85, present: 21, total: 25 },
    { subjectName: 'English', percentage: 92, present: 23, total: 25 },
    { subjectName: 'Social Science', percentage: 84, present: 21, total: 25 },
    { subjectName: 'Hindi', percentage: 89, present: 22, total: 25 },
    { subjectName: 'Computer Science', percentage: 95, present: 24, total: 25 },
  ];

  const dailyTrend = report?.dailyTrend || [
    { date: '2026-10-12', percentage: 92 },
    { date: '2026-10-13', percentage: 88 },
    { date: '2026-10-14', percentage: 95 },
    { date: '2026-10-15', percentage: 84 },
    { date: '2026-10-16', percentage: 90 },
    { date: '2026-10-17', percentage: 79 },
    { date: '2026-10-19', percentage: 93 },
    { date: '2026-10-20', percentage: 87 },
  ];

  const chartHeight = 85;
  const barWidth = 24;

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
        {/* Reporting Period Filter - Matching Marks Card Report Style */}
        <View style={styles.filtersWrapper}>
          <View style={styles.filterCol}>
            <Text style={styles.filterLabel}>Reporting Period</Text>
            <TouchableOpacity
              style={[styles.filterBox, isPeriodOpen && styles.filterBoxActive]}
              activeOpacity={0.8}
              onPress={() => setIsPeriodOpen(!isPeriodOpen)}
            >
              <Text
                style={[styles.filterVal, isPeriodOpen && styles.filterValActive]}
                numberOfLines={1}
              >
                {selectedRange}
              </Text>
              <Feather
                name={isPeriodOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={isPeriodOpen ? '#111827' : '#4B5563'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline Dropdown for Period - Yellow & Black Theme */}
        {isPeriodOpen && (
          <View style={styles.inlineFilterWrapper}>
            <InlineSearchDropdown
              placeholder="Search period..."
              selectedValue={selectedRange}
              options={DATE_RANGES.map((r) => ({
                label: r,
                value: r,
                subtext:
                  r === 'Current Month'
                    ? 'Present Academic Month (24 Working Days)'
                    : r === 'Last 30 Days'
                    ? 'Previous 30 Days Duration'
                    : 'Full Academic Year / Term',
                badge: r === selectedRange ? 'Active' : undefined,
                badgeColor: '#111827',
              }))}
              isOpen={true}
              menuOnly={true}
              onToggle={() => setIsPeriodOpen(false)}
              onSelect={(val) => {
                setSelectedRange(val);
                setIsPeriodOpen(false);
              }}
              iconName="calendar-range"
              iconType="material"
            />
          </View>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <TeacherShimmerSkeleton width="100%" height={140} borderRadius={5} />
            <TeacherShimmerSkeleton width="100%" height={240} borderRadius={5} />
          </View>
        ) : (
          <>
            {/* Search Bar & Students Count Badge - Matching Marks Card Report */}
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

            {/* Scrollable Student List Card - Matching Marks Card Report */}
            <View style={styles.studentsListCard}>
              <ScrollView
                style={styles.studentsListScroll}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {filteredStudents.length === 0 ? (
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyTitle}>No Students Found</Text>
                    <Text style={styles.emptySub}>No student matches your search query.</Text>
                  </View>
                ) : (
                  filteredStudents.map((st, idx) => {
                    const isSelected = activeStudent?.id === st.id;
                    return (
                      <TouchableOpacity
                        key={st.id || idx}
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

                        {/* Student Name and USN Only (All other things removed, pure black text) */}
                        <View style={styles.studentInfoCol}>
                          <Text style={styles.studentNameText} numberOfLines={1}>
                            {st.fullName}
                          </Text>
                          <Text style={styles.studentUsnText}>
                            {st.rollNoOrUSN}
                          </Text>
                        </View>

                        {/* Download Action (No background box, black text) */}
                        <TouchableOpacity
                          style={styles.downloadRowBtn}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          onPress={() => handleExportSingleStudentPdf(st)}
                        >
                          <Text style={styles.downloadRowBtnText}>Download</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>

            {/* Download Buttons - Kept Below List and Matching Marks Card Report Style */}
            <View style={styles.bottomDownloadContainer}>
              <TouchableOpacity
                style={[styles.pdfButton, exportingPdf && { opacity: 0.7 }]}
                onPress={() => handleExportSingleStudentPdf(activeStudent || studentRoster[0])}
                disabled={exportingPdf}
                activeOpacity={0.85}
              >
                <Text style={styles.pdfButtonText}>
                  {exportingPdf ? 'Generating PDF...' : 'Download'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.csvButton, exportingPdf && { opacity: 0.7 }]}
                onPress={handleExportPdf}
                disabled={exportingPdf}
                activeOpacity={0.85}
              >
                <Text style={styles.csvButtonText}>
                  {exportingPdf ? 'Generating Ledger...' : 'Download Class Attendance Ledger'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Daily Trend Chart (Yellow & Black Theme) */}
            {dailyTrend && dailyTrend.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Daily Attendance Trend</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Svg
                    width={Math.max(300, dailyTrend.length * (barWidth + 12))}
                    height={chartHeight + 22}
                  >
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                      <Line
                        key={i}
                        x1={0}
                        y1={chartHeight * (1 - ratio)}
                        x2={Math.max(300, dailyTrend.length * (barWidth + 12))}
                        y2={chartHeight * (1 - ratio)}
                        stroke="#F3F4F6"
                        strokeWidth={0.5}
                      />
                    ))}
                    {dailyTrend.map((d: any, i: number) => {
                      const barH = (d.percentage / 100) * (chartHeight - 8);
                      const x = 12 + i * (barWidth + 12);
                      const y = chartHeight - barH;
                      const isHigh = d.percentage >= 75;
                      return (
                        <React.Fragment key={i}>
                          <Rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barH}
                            rx={3}
                            fill={isHigh ? '#F4C430' : '#111827'}
                          />
                          <SvgText
                            x={x + barWidth / 2}
                            y={chartHeight + 13}
                            textAnchor="middle"
                            fontSize={9}
                            fill="#6B7280"
                          >
                            {d.date.slice(5)}
                          </SvgText>
                        </React.Fragment>
                      );
                    })}
                  </Svg>
                </ScrollView>
              </View>
            )}

            {/* Subject Breakdown (Yellow & Black Theme) */}
            {subjects && subjects.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Subject Attendance Breakdown</Text>
                </View>
                {subjects.map((sub: any, i: number) => (
                  <View key={i} style={styles.subjectRow}>
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>{sub.subjectName}</Text>
                      <Text style={styles.subjectPct}>{sub.percentage}%</Text>
                    </View>
                    <View style={styles.subjectBar}>
                      <View style={styles.subjectBarBg}>
                        <View
                          style={[
                            styles.subjectBarFill,
                            {
                              width: `${Math.min(100, sub.percentage)}%`,
                              backgroundColor: '#F4C430',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.subjectDetail}>{sub.present}/{sub.total}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
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

  /* Period Filter - Matches Marks Card Dropdown Style */
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
    borderColor: '#F4C430',
    backgroundColor: '#FFFBEB',
  },
  filterVal: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
    flex: 1,
    paddingRight: 2,
  },
  filterValActive: {
    color: '#111827',
  },
  inlineFilterWrapper: {
    marginBottom: 6,
  },


  /* Search Row - Matches Marks Card Report */
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

  /* Vertical Students List with Internal Scroll - Matches Marks Card */
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
  studentIndexText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
    width: 28,
  },
  studentInfoCol: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  studentNameText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  studentUsnText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#000000',
  },
  downloadRowBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  downloadRowBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },

  /* Empty state */
  emptyList: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  emptySub: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },

  /* Common Cards for Trend & Breakdown */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 10,
  },
  cardHeader: {
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  subjectRow: {
    gap: 4,
    marginBottom: 6,
  },
  subjectInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subjectName: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  subjectPct: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  subjectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  subjectBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectDetail: {
    fontSize: 10.5,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    width: 36,
    textAlign: 'right',
  },

  /* Bottom Download Buttons - Matches Marks Card */
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

  loadingWrap: {
    gap: 12,
  },
});
