import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import {
  HODKPIs,
  HODTab,
  DepartmentCourse,
  ExamEligibilityRecord,
  DepartmentNotice,
} from '../types/hod.types';
import {
  HomeroomSection,
  PrincipalStaffMember,
} from '../../principal/types/principal.types';
import { INITIAL_EVENTS } from '../../shared/components/AcademicCalendarEventsView';
import { FACULTY_ASSIGNED_CLASSES } from '../../teacher/components/AttendanceMarkingView';

// Department Academic Performance / Syllabus Stats
const DEPT_ACADEMIC_STATS_TERM = [
  { label: 'SEM 1', fullName: '1st Semester', completed: 88, inProgress: 12 },
  { label: 'SEM 3', fullName: '3rd Semester', completed: 84, inProgress: 16 },
  { label: 'SEM 5', fullName: '5th Semester', completed: 80, inProgress: 20 },
  { label: 'SEM 7', fullName: '7th Semester', completed: 86, inProgress: 14 },
  { label: 'LABS', fullName: 'Practical Labs', completed: 90, inProgress: 10 },
  { label: 'ELECT', fullName: 'Elective Tracks', completed: 74, inProgress: 26 },
];

const DEPT_ACADEMIC_STATS_ANNUAL = [
  { label: 'SEM 1', fullName: '1st Semester', completed: 92, inProgress: 8 },
  { label: 'SEM 3', fullName: '3rd Semester', completed: 86, inProgress: 14 },
  { label: 'SEM 5', fullName: '5th Semester', completed: 82, inProgress: 18 },
  { label: 'SEM 7', fullName: '7th Semester', completed: 89, inProgress: 11 },
  { label: 'LABS', fullName: 'Practical Labs', completed: 94, inProgress: 6 },
  { label: 'ELECT', fullName: 'Elective Tracks', completed: 80, inProgress: 20 },
];

interface HODDashboardViewProps {
  fullName?: string;
  department?: string;
  kpis: HODKPIs;
  homerooms?: HomeroomSection[];
  staffList?: PrincipalStaffMember[];
  courses?: DepartmentCourse[];
  eligibility?: ExamEligibilityRecord[];
  notices?: any[];
  refreshing: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: HODTab) => void;
  onOpenAssignModal?: (course: DepartmentCourse) => void;
  onOpenEligibilityModal?: (record: ExamEligibilityRecord) => void;
  onOpenNoticeModal: () => void;
  onOpenDeptDossierModal?: () => void;
  onNavigateToTeacherTimetable?: () => void;
  onNavigateToTeacherAttendance?: () => void;
}

const formatUpcomingEventDate = (startDate: string, endDate?: string): string => {
  try {
    const d = new Date(`${startDate}T00:00:00Z`);
    const now = new Date();
    const todayYMD = now.toISOString().slice(0, 10);
    if (startDate === todayYMD) return 'Today';

    const diffMs = d.getTime() - new Date(`${todayYMD}T00:00:00Z`).getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dateFormatted = `${d.getUTCDate()} ${monthNames[d.getUTCMonth()]}`;

    if (diffDays === 1) return `Tomorrow (${dateFormatted})`;
    if (diffDays > 1 && diffDays <= 14) return `${dateFormatted} (in ${diffDays}d)`;
    return dateFormatted;
  } catch {
    return startDate;
  }
};

export const HODDashboardView: React.FC<HODDashboardViewProps> = ({
  fullName = 'Muhammad Samran',
  department = 'Computer Science & Engineering',
  kpis,
  homerooms,
  staffList,
  courses,
  eligibility,
  notices,
  refreshing,
  onRefresh,
  onNavigateTab,
  onOpenAssignModal,
  onOpenEligibilityModal,
  onOpenNoticeModal,
  onOpenDeptDossierModal,
  onNavigateToTeacherTimetable,
  onNavigateToTeacherAttendance,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const maxContentWidth = Math.min(windowWidth, 1200);
  const isTabletOrDesktop = maxContentWidth >= 768;
  const isMobile = windowWidth < 480;

  const horizontalPadding = 16;
  const cardGap = 10;
  const topActionWidth = Math.floor(
    (maxContentWidth - (horizontalPadding * 2) - cardGap) / 2
  );

  // Dynamic stats calculated live from department homeroom and faculty records
  const totalEnrolled = useMemo(() => {
    if (homerooms && homerooms.length > 0) {
      return homerooms.reduce((acc, h) => acc + (h.studentCount || 0), 0);
    }
    return Number(kpis.totalStudents) || 180;
  }, [homerooms, kpis.totalStudents]);

  const totalPresent = useMemo(() => {
    if (homerooms && homerooms.length > 0) {
      return homerooms.reduce(
        (acc, h) =>
          acc + (h.presentCount !== undefined ? h.presentCount : Math.round((h.studentCount || 0) * 0.94)),
        0
      );
    }
    return Math.round(totalEnrolled * 0.94);
  }, [homerooms, totalEnrolled]);

  const totalAbsent = Math.max(0, totalEnrolled - totalPresent);
  const attendancePct = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 94;

  // Dynamic Academic Syllabus Progress per semester calculated from actual department courses
  const dynamicDeptAcademicStats = useMemo(() => {
    if (!courses || courses.length === 0) {
      return { term: DEPT_ACADEMIC_STATS_TERM, annual: DEPT_ACADEMIC_STATS_ANNUAL };
    }
    const calcAvg = (crList: DepartmentCourse[], defaultVal: number) => {
      if (crList.length === 0) return defaultVal;
      const total = crList.reduce((acc, c) => acc + (c.syllabusProgressPct || 0), 0);
      return Math.round(total / crList.length);
    };

    const sem1Courses = courses.filter((c) => (c.semester || '').includes('1'));
    const sem3Courses = courses.filter((c) => (c.semester || '').includes('3'));
    const sem5Courses = courses.filter((c) => (c.semester || '').includes('5'));
    const sem7Courses = courses.filter((c) => (c.semester || '').includes('7'));
    const labCourses = courses.filter(
      (c) => c.type === 'practical_lab' || (c.name || '').toLowerCase().includes('lab')
    );
    const electCourses = courses.filter((c) => c.type === 'elective' || (c.code || '').includes('E'));

    const term = [
      { label: 'SEM 1', fullName: '1st Semester', completed: calcAvg(sem1Courses, 88), inProgress: 100 - calcAvg(sem1Courses, 88) },
      { label: 'SEM 3', fullName: '3rd Semester', completed: calcAvg(sem3Courses, 84), inProgress: 100 - calcAvg(sem3Courses, 84) },
      { label: 'SEM 5', fullName: '5th Semester', completed: calcAvg(sem5Courses, 80), inProgress: 100 - calcAvg(sem5Courses, 80) },
      { label: 'SEM 7', fullName: '7th Semester', completed: calcAvg(sem7Courses, 86), inProgress: 100 - calcAvg(sem7Courses, 86) },
      { label: 'LABS', fullName: 'Practical Labs', completed: calcAvg(labCourses, 90), inProgress: 100 - calcAvg(labCourses, 90) },
      { label: 'ELECT', fullName: 'Elective Tracks', completed: calcAvg(electCourses, 74), inProgress: 100 - calcAvg(electCourses, 74) },
    ];

    const annual = term.map((t) => {
      const annualDone = Math.min(98, t.completed + 4);
      return { ...t, completed: annualDone, inProgress: 100 - annualDone };
    });

    return { term, annual };
  }, [courses]);

  // Department Academic Analytics State (Term vs Annual)
  const [chartPeriod, setChartPeriod] = useState<'term' | 'annual'>('term');
  const chartData = chartPeriod === 'term' ? dynamicDeptAcademicStats.term : dynamicDeptAcademicStats.annual;

  // Highlights: Upcoming Events & Today's Classes
  const todayDateObj = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => todayDateObj.toISOString().slice(0, 10), [todayDateObj]);
  const currentDayOfWeek = useMemo(() => todayDateObj.getDay(), [todayDateObj]);

  const todayClasses = useMemo(() => {
    return FACULTY_ASSIGNED_CLASSES.filter((c) => c.scheduledDays.includes(currentDayOfWeek));
  }, [currentDayOfWeek]);

  const upcomingEvents = useMemo(() => {
    return (INITIAL_EVENTS || [])
      .filter((evt) => {
        const end = evt.endDate || evt.startDate;
        return end >= todayStr;
      })
      .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  }, [todayStr]);

  const nextUpcomingEvent = upcomingEvents[0] || null;
  const hasUpcomingEvent = !!nextUpcomingEvent;
  const hasTodayClasses = todayClasses.length > 0;
  const bothCardsVisible = hasUpcomingEvent && hasTodayClasses;
  const showHighlightsRow = hasUpcomingEvent || hasTodayClasses;
  const firstClass = todayClasses[0] || null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#000000']} tintColor="#000000" />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. GREETING HEADER */}
      <View style={styles.greetingSection}>
        <Text style={styles.userNameText}>Hello, {fullName}</Text>
      </View>

      {/* 2. ATTENDANCE SUMMARY (Circular Status Ring Gauge) */}
      <TouchableOpacity
        style={styles.overallAttendanceCard}
        onPress={() => onNavigateTab('students')}
        activeOpacity={0.9}
      >
        <View style={styles.overallCardMain}>
          {/* Circular Status Ring Gauge */}
          <View style={styles.circularGaugeBox}>
            <View style={styles.circularGaugeOuter}>
              <Text style={styles.circularGaugeVal}>{attendancePct}%</Text>
              <Text style={styles.circularGaugeLabel}>ATTENDANCE</Text>
            </View>
          </View>

          <View style={styles.overallDivider} />

          {/* Attendance Breakdown Stats */}
          <View style={styles.overallStatsRow}>
            <View style={styles.overallStatCol}>
              <Text style={styles.overallStatVal}>{totalPresent}</Text>
              <Text style={styles.overallStatLabel}>PRESENT</Text>
            </View>
            <View style={styles.overallStatDivider} />
            <View style={styles.overallStatCol}>
              <Text style={styles.overallStatVal}>{totalAbsent}</Text>
              <Text style={styles.overallStatLabel}>ABSENT</Text>
            </View>
            <View style={styles.overallStatDivider} />
            <View style={styles.overallStatCol}>
              <Text style={styles.overallStatVal}>{totalEnrolled}</Text>
              <Text style={styles.overallStatLabel}>ENROLLED</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Add Announcement Button (Below Attendance) */}
      <View style={styles.announcementActionRow}>
        <TouchableOpacity
          style={styles.primaryCtaBtn}
          onPress={onOpenNoticeModal}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={16} color="#171717" style={{ marginRight: 6 }} />
          <Text style={styles.primaryCtaBtnText}>Add Announcement</Text>
        </TouchableOpacity>
      </View>

      {/* 3. QUICK NAVIGATION CARDS (Classes, Timetable, Faculty, Fee Dues) */}
      <View style={styles.topActionsGroup}>
        {/* Row 1: Classes & Timetable */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={[styles.topActionCard, { width: topActionWidth }]}
            onPress={() => onNavigateTab('students')}
            activeOpacity={0.85}
          >
            <View style={styles.topActionContent}>
              <Text style={styles.topActionTitle} numberOfLines={1}>Classes</Text>
            </View>
            <Feather name="arrow-right" size={14} color="#171717" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.topActionCard, { width: topActionWidth }]}
            onPress={() => onNavigateTab('timetable')}
            activeOpacity={0.85}
          >
            <View style={styles.topActionContent}>
              <Text style={styles.topActionTitle} numberOfLines={1}>Timetable</Text>
            </View>
            <Feather name="arrow-right" size={14} color="#171717" />
          </TouchableOpacity>
        </View>

        {/* Row 2: Faculty & Reviews */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={[styles.topActionCard, { width: topActionWidth }]}
            onPress={() => onNavigateTab('staff')}
            activeOpacity={0.85}
          >
            <View style={styles.topActionContent}>
              <Text style={styles.topActionTitle} numberOfLines={1}>Faculty</Text>
            </View>
            <Feather name="arrow-right" size={14} color="#171717" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.topActionCard, { width: topActionWidth }]}
            onPress={() => onNavigateTab('reviews')}
            activeOpacity={0.85}
          >
            <View style={styles.topActionContent}>
              <Text style={styles.topActionTitle} numberOfLines={1}>Reviews</Text>
            </View>
            <Feather name="arrow-right" size={14} color="#171717" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. ACADEMIC SYLLABUS & ATTENDANCE ANALYTICS CHART */}
      <View style={styles.feeAnalyticsCard}>
        {/* Header */}
        <View style={styles.feeAnalyticsHeader}>
          <Text style={styles.feeAnalyticsTitle}>Academic Stats</Text>
          <TouchableOpacity
            style={styles.periodPillBtn}
            onPress={() => setChartPeriod((prev: 'term' | 'annual') => (prev === 'term' ? 'annual' : 'term'))}
            activeOpacity={0.85}
          >
            <Text style={styles.periodPillText}>
              {chartPeriod === 'term' ? 'This Term' : 'Annual'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart Bars Area */}
        <View style={styles.chartContainer}>
          {chartData.map((item) => {
            const maxVal = 100;
            const maxBarHeight = 95;
            const completedHeight = Math.max(8, Math.round((item.completed / maxVal) * maxBarHeight));
            const inProgressHeight = Math.max(8, Math.round((item.inProgress / maxVal) * maxBarHeight));

            return (
              <View key={item.label} style={styles.dayColumn}>
                <View style={styles.barsPair}>
                  <View style={[styles.paidBar, { height: completedHeight }]} />
                  <View style={[styles.unpaidBar, { height: inProgressHeight }]} />
                </View>
                <Text style={styles.dayLabel}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Legend & View Courses Link */}
        <View style={styles.chartFooterRow}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F4C430' }]} />
              <Text style={styles.legendText}>Syllabus Done</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#171717' }]} />
              <Text style={styles.legendText}>In Progress</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewLedgerBtn}
            onPress={() => onNavigateTab('timetable')}
            activeOpacity={0.85}
          >
            <Text style={styles.viewLedgerBtnText}>View Timetable</Text>
            <Feather name="arrow-right" size={13} color="#171717" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. BOTTOM HIGHLIGHTS: UPCOMING EVENT & TODAY'S CLASSES */}
      {showHighlightsRow && (
        <View style={[
          styles.dashboardHighlightsRow,
          isMobile && { flexDirection: 'column' }
        ]}>
          {hasUpcomingEvent && (
            <View style={[
              styles.highlightCol,
              bothCardsVisible && !isMobile ? styles.highlightColHalf : styles.highlightColFull,
            ]}>
              <Text style={styles.highlightSectionTitle}>Upcoming Events</Text>
              <TouchableOpacity
                style={styles.highlightCard}
                onPress={() => onNavigateTab('events')}
                activeOpacity={0.85}
              >
                <View style={styles.highlightBodySection}>
                  <Text style={styles.highlightMainTitle} numberOfLines={2}>
                    {nextUpcomingEvent.title}
                  </Text>
                </View>

                <View style={styles.highlightFooterRow}>
                  <Text style={styles.eventDateText}>
                    {formatUpcomingEventDate(nextUpcomingEvent.startDate, nextUpcomingEvent.endDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {Boolean(hasTodayClasses && firstClass) && (
            <View style={[
              styles.highlightCol,
              bothCardsVisible && !isMobile ? styles.highlightColHalf : styles.highlightColFull,
            ]}>
              <Text style={styles.highlightSectionTitle}>Today's Classes</Text>
              <TouchableOpacity
                style={styles.highlightCard}
                onPress={onNavigateToTeacherTimetable || (() => onNavigateTab('attendance'))}
                activeOpacity={0.85}
              >
                <View style={styles.highlightBodySection}>
                  <Text style={styles.highlightMainTitle} numberOfLines={1}>
                    {todayClasses.length} {todayClasses.length === 1 ? 'Class' : 'Classes'} Scheduled
                  </Text>
                  <Text style={styles.highlightSubText} numberOfLines={1}>
                    Next: {firstClass.subjectName}
                  </Text>
                </View>

                <View style={styles.highlightFooterRow}>
                  <Text style={styles.classTimeText}>{firstClass.periodTime}</Text>
                  <Text style={styles.classRoomText}>{firstClass.studentCount} Students</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 14,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },

  // 1. Greeting
  greetingSection: {
    gap: 2,
    marginBottom: 2,
  },
  userNameText: {
    fontFamily: FontFamily.bold,
    fontSize: 19,
    color: '#171717',
    letterSpacing: -0.4,
  },
  subGreetingText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 6,
  },

  // 2. Attendance Summary Card (Transparent bg, #F4C430 ring, charcoal black text)
  overallAttendanceCard: {
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
  },
  overallCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circularGaugeBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularGaugeOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 5,
    borderColor: '#F4C430',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularGaugeVal: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    color: '#171717',
    lineHeight: 28,
  },
  circularGaugeLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 8,
    color: '#171717',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
    textAlign: 'center',
  },
  overallDivider: {
    width: 1,
    height: 56,
    backgroundColor: '#E8E5DC',
    marginHorizontal: 10,
  },
  overallStatsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  overallStatCol: {
    alignItems: 'center',
  },
  overallStatVal: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    lineHeight: 22,
    color: '#171717',
  },
  overallStatLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 9.5,
    color: '#171717',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 3,
  },
  overallStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E8E5DC',
  },

  // Announcement Action
  announcementActionRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  primaryCtaBtn: {
    width: '100%',
    backgroundColor: '#F4C430',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryCtaBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#171717',
    letterSpacing: -0.1,
  },

  // 3. Quick Action Cards (Clean White Card, Compact Slim Height)
  topActionsGroup: {
    gap: 8,
  },
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minHeight: 38,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  topActionContent: {
    flex: 1,
  },
  topActionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13.5,
    color: '#171717',
  },

  // 4. Analytics Card
  feeAnalyticsCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 2,
    marginTop: 10,
    marginBottom: 6,
  },
  feeAnalyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  feeAnalyticsTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: '#171717',
    letterSpacing: -0.3,
  },
  periodPillBtn: {
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FFFDF7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 1,
    elevation: 1,
  },
  periodPillText: {
    fontFamily: FontFamily.semibold,
    fontSize: 9,
    lineHeight: 12,
    color: '#171717',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 135,
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barsPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 95,
  },
  paidBar: {
    width: 10,
    backgroundColor: '#F4C430',
    borderRadius: 2,
  },
  unpaidBar: {
    width: 10,
    backgroundColor: '#171717',
    borderRadius: 2,
  },
  dayLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#64748B',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  chartFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#64748B',
  },
  viewLedgerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewLedgerBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#171717',
  },

  // 5. Highlights Row
  dashboardHighlightsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  highlightCol: {
    gap: 8,
  },
  highlightColHalf: {
    flex: 1,
  },
  highlightColFull: {
    width: '100%',
  },
  highlightSectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: '#171717',
    letterSpacing: -0.3,
  },
  highlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FDE047',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  highlightBodySection: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 6,
  },
  highlightMainTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#171717',
    lineHeight: 22,
  },
  highlightSubText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#334155',
    marginTop: 4,
  },
  highlightFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventDateText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: '#334155',
  },
  classTimeText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: '#334155',
  },
  classRoomText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: '#334155',
  },
});
