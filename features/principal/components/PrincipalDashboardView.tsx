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
  PrincipalKPIs,
  PrincipalTab,
  HomeroomSection,
  SchoolNotice,
  PrincipalStaffMember,
} from '../types/principal.types';
import { MOCK_STUDENT_FEES, generateAllInstitutionalStudentFees } from '../constants/feeLedgerData';
import { INITIAL_EVENTS } from '../../shared/components/AcademicCalendarEventsView';
import { FACULTY_ASSIGNED_CLASSES } from '../../teacher/components/AttendanceMarkingView';

interface PrincipalDashboardViewProps {
  fullName?: string;
  kpis: PrincipalKPIs;
  homerooms: HomeroomSection[];
  staffList?: PrincipalStaffMember[];
  notices: SchoolNotice[];
  refreshing: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: PrincipalTab) => void;
  onOpenAssignModal: (section: HomeroomSection) => void;
  onOpenNoticeModal: () => void;
  onNavigateToTeacherTimetable?: () => void;
  onNavigateToTeacherAttendance?: () => void;
  onSwitchToTeacherPortal?: () => void;
}

const getFormattedDate = (): string => {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning,';
  if (hour < 17) return 'Good Afternoon,';
  return 'Good Evening,';
};

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



const FALLBACK_DEPARTMENT_CLASSES: HomeroomSection[] = [
  {
    id: 'dyn-cse-1',
    name: 'CSE 1st Year · Sec A',
    grade: '1st Year',
    section: 'A',
    homeroomTeacherName: 'Dr. Emily Watson',
    studentCount: 42,
    presentCount: 40,
    attendanceRate: 95.2,
  },
  {
    id: 'dyn-cse-2',
    name: 'CSE 2nd Year · Sec B',
    grade: '2nd Year',
    section: 'B',
    homeroomTeacherName: 'Prof. David Vance',
    studentCount: 40,
    presentCount: 37,
    attendanceRate: 92.5,
  },
  {
    id: 'dyn-ece-1',
    name: 'ECE 1st Year · Sec A',
    grade: '1st Year',
    section: 'A',
    homeroomTeacherName: 'Dr. Sarah Connor',
    studentCount: 38,
    presentCount: 35,
    attendanceRate: 92.1,
  },
  {
    id: 'dyn-ece-2',
    name: 'ECE 3rd Year · Sec A',
    grade: '3rd Year',
    section: 'A',
    homeroomTeacherName: 'Prof. Alan Turing',
    studentCount: 36,
    presentCount: 33,
    attendanceRate: 91.7,
  },
  {
    id: 'dyn-mech-1',
    name: 'Mechanical Eng 2nd Year · Sec A',
    grade: '2nd Year',
    section: 'A',
    roomNumber: 'Workshop B',
    homeroomTeacherName: 'Dr. Henry Ford',
    studentCount: 35,
    presentCount: 31,
    attendanceRate: 88.6,
  },
  {
    id: 'dyn-civil-1',
    name: 'Civil Eng 3rd Year · Sec A',
    grade: '3rd Year',
    section: 'A',
    roomNumber: 'Survey Hall',
    homeroomTeacherName: 'Prof. Marcus Bell',
    studentCount: 34,
    presentCount: 29,
    attendanceRate: 85.3,
  },
  {
    id: 'dyn-math-1',
    name: 'Applied Sciences · Maths Honors',
    grade: '1st Year',
    section: 'A',
    roomNumber: 'Auditorium 2',
    homeroomTeacherName: 'Dr. S. Ramanujan',
    studentCount: 45,
    presentCount: 43,
    attendanceRate: 95.6,
  },
];

const FALLBACK_STAFF_MEMBERS: PrincipalStaffMember[] = [
  {
    id: 'st-01',
    fullName: 'Dr. Emily Watson',
    email: 'e.watson@institution.edu',
    phone: '+91 98451 23456',
    department: 'Computer Science',
    designation: 'hod',
    assignedClass: 'CSE 1st Year · Sec A',
    attendanceToday: 'present',
    experienceYears: 14,
  },
  {
    id: 'st-02',
    fullName: 'Prof. David Vance',
    email: 'd.vance@institution.edu',
    phone: '+91 98452 34567',
    department: 'Electronics & Comm',
    designation: 'subject_teacher',
    assignedClass: 'ECE 2nd Year · Sec A',
    attendanceToday: 'present',
    experienceYears: 10,
  },
  {
    id: 'st-03',
    fullName: 'Dr. Henry Ford',
    email: 'h.ford@institution.edu',
    phone: '+91 98453 45678',
    department: 'Mechanical Eng',
    designation: 'homeroom_teacher',
    assignedClass: 'Mechanical 2nd Year',
    attendanceToday: 'present',
    experienceYears: 12,
  },
  {
    id: 'st-04',
    fullName: 'Dr. Marie Curie',
    email: 'm.curie@institution.edu',
    phone: '+91 98454 56789',
    department: 'Applied Sciences',
    designation: 'subject_teacher',
    assignedClass: 'Applied Physics Honors',
    attendanceToday: 'on_leave',
    experienceYears: 7,
  },
];

// Department-wise Fee Analytics (Paid vs Unpaid)
const DEPT_FEE_ANALYTICS_TERM = [
  { label: 'CSE', fullName: 'Computer Science', paid: 385000, unpaid: 42000 },
  { label: 'ECE', fullName: 'Electronics & Comm', paid: 290000, unpaid: 38000 },
  { label: 'MECH', fullName: 'Mechanical Eng', paid: 215000, unpaid: 55000 },
  { label: 'CIVIL', fullName: 'Civil Eng', paid: 180000, unpaid: 48000 },
  { label: 'AIML', fullName: 'AI & Data Science', paid: 340000, unpaid: 28000 },
  { label: 'APS', fullName: 'Applied Sciences', paid: 155000, unpaid: 35000 },
];

const DEPT_FEE_ANALYTICS_ANNUAL = [
  { label: 'CSE', fullName: 'Computer Science', paid: 1420000, unpaid: 180000 },
  { label: 'ECE', fullName: 'Electronics & Comm', paid: 1150000, unpaid: 145000 },
  { label: 'MECH', fullName: 'Mechanical Eng', paid: 860000, unpaid: 195000 },
  { label: 'CIVIL', fullName: 'Civil Eng', paid: 720000, unpaid: 160000 },
  { label: 'AIML', fullName: 'AI & Data Science', paid: 1280000, unpaid: 110000 },
  { label: 'APS', fullName: 'Applied Sciences', paid: 620000, unpaid: 125000 },
];

export const PrincipalDashboardView: React.FC<PrincipalDashboardViewProps> = ({
  fullName = 'Muhammad Samran',
  kpis,
  homerooms,
  staffList,
  notices,
  refreshing,
  onRefresh,
  onNavigateTab,
  onOpenAssignModal,
  onOpenNoticeModal,
  onNavigateToTeacherTimetable,
  onNavigateToTeacherAttendance,
  onSwitchToTeacherPortal,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const maxContentWidth = Math.min(windowWidth, 1200);
  const isTabletOrDesktop = maxContentWidth >= 768;
  const isMobile = windowWidth < 480;

  const horizontalPadding = 16;
  const cardGap = 10;
  // 4 columns on tablet & desktop, 2 on mobile
  const metricCols = isTabletOrDesktop ? 4 : 2;
  const metricColWidth = Math.floor(
    (maxContentWidth - (horizontalPadding * 2) - (cardGap * (metricCols - 1))) / metricCols
  );
  const topActionWidth = Math.floor(
    (maxContentWidth - (horizontalPadding * 2) - cardGap) / 2
  );

  // Dynamic fallback ensures zero blank space and consistent attendance summary
  const rawHomerooms = homerooms && homerooms.length > 0 ? homerooms : FALLBACK_DEPARTMENT_CLASSES;
  const activeStaffList = staffList && staffList.length > 0 ? staffList : FALLBACK_STAFF_MEMBERS;

  // Dynamic stats calculated live from actual class records
  const dynamicTotalEnrolled = useMemo(() => {
    const sum = rawHomerooms.reduce((acc, h) => acc + (h.studentCount || 0), 0);
    return sum > 0 ? sum : (kpis.totalStudents || 0);
  }, [rawHomerooms, kpis.totalStudents]);

  const dynamicTotalPresent = useMemo(() => {
    const sum = rawHomerooms.reduce((acc, h) => acc + (h.presentCount !== undefined ? h.presentCount : Math.round((h.studentCount || 0) * 0.92)), 0);
    return sum > 0 ? sum : (kpis.presentStudents || 0);
  }, [rawHomerooms, kpis.presentStudents]);

  const dynamicTotalAbsent = Math.max(0, dynamicTotalEnrolled - dynamicTotalPresent);

  const dynamicAttendancePct = useMemo(() => {
    if (dynamicTotalEnrolled > 0) {
      return Math.round((dynamicTotalPresent / dynamicTotalEnrolled) * 100);
    }
    return kpis.studentAttendancePct || 0;
  }, [dynamicTotalEnrolled, dynamicTotalPresent, kpis.studentAttendancePct]);

  // Dynamic Department-wise Fees Paid vs Unpaid Analytics from active institutional students
  const dynamicDeptFeeAnalytics = useMemo(() => {
    try {
      const allFees = generateAllInstitutionalStudentFees(rawHomerooms);
      const deptMap: Record<string, { label: string; fullName: string; paid: number; unpaid: number }> = {
        'Computer Science': { label: 'CSE', fullName: 'Computer Science', paid: 0, unpaid: 0 },
        'Electronics & Comm': { label: 'ECE', fullName: 'Electronics & Comm', paid: 0, unpaid: 0 },
        'Mechanical Eng': { label: 'MECH', fullName: 'Mechanical Eng', paid: 0, unpaid: 0 },
        'Civil Eng': { label: 'CIVIL', fullName: 'Civil Eng', paid: 0, unpaid: 0 },
        'AIML': { label: 'AIML', fullName: 'AI & Data Science', paid: 0, unpaid: 0 },
        'Applied Sciences': { label: 'APS', fullName: 'Applied Sciences', paid: 0, unpaid: 0 },
      };

      allFees.forEach((fee) => {
        let dept = fee.department || 'Computer Science';
        if (dept.toLowerCase().includes('comp') || dept.toLowerCase().includes('cse')) dept = 'Computer Science';
        else if (dept.toLowerCase().includes('elec') || dept.toLowerCase().includes('ece')) dept = 'Electronics & Comm';
        else if (dept.toLowerCase().includes('mech')) dept = 'Mechanical Eng';
        else if (dept.toLowerCase().includes('civil')) dept = 'Civil Eng';
        else if (dept.toLowerCase().includes('ai')) dept = 'AIML';
        else if (dept.toLowerCase().includes('math') || dept.toLowerCase().includes('sci')) dept = 'Applied Sciences';
        else dept = 'Computer Science';

        if (!deptMap[dept]) {
          deptMap[dept] = { label: dept.slice(0, 4).toUpperCase(), fullName: dept, paid: 0, unpaid: 0 };
        }
        deptMap[dept].paid += (fee.paidAmount || 0);
        deptMap[dept].unpaid += (fee.dueAmount || 0);
      });

      const term = Object.values(deptMap);
      const annual = term.map((t) => ({
        ...t,
        paid: Math.round(t.paid * 2.8),
        unpaid: Math.round(t.unpaid * 1.5),
      }));
      return { term, annual };
    } catch {
      return { term: DEPT_FEE_ANALYTICS_TERM, annual: DEPT_FEE_ANALYTICS_ANNUAL };
    }
  }, [rawHomerooms]);

  // Department-wise Fees Paid vs Unpaid Analytics State
  const [chartPeriod, setChartPeriod] = useState<'term' | 'annual'>('term');
  const chartData = chartPeriod === 'term' ? dynamicDeptFeeAnalytics.term : dynamicDeptFeeAnalytics.annual;

  // Highlights: Upcoming Events & Today's Classes
  const todayDateObj = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => todayDateObj.toISOString().slice(0, 10), [todayDateObj]);
  const currentDayOfWeek = useMemo(() => todayDateObj.getDay(), [todayDateObj]); // 0 = Sun, 1 = Mon ...

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

      {/* 2. ATTENDANCE SUMMARY (Soft Lighter Fade, Circular Status Ring Gauge) */}
      <View style={styles.overallAttendanceCard}>
        <View style={styles.overallCardMain}>
          {/* Circular Status Ring Gauge */}
          <View style={styles.circularGaugeBox}>
            <View style={styles.circularGaugeOuter}>
              <Text style={styles.circularGaugeVal}>{dynamicAttendancePct}%</Text>
              <Text style={styles.circularGaugeLabel}>ATTENDANCE</Text>
            </View>
          </View>

          <View style={styles.overallDivider} />

          {/* Attendance Breakdown Stats */}
          <View style={styles.overallStatsRow}>
            <View style={styles.overallStatCol}>
              <Text style={styles.overallStatVal}>{dynamicTotalPresent}</Text>
              <Text style={styles.overallStatLabel}>PRESENT</Text>
            </View>
            <View style={styles.overallStatDivider} />
            <View style={styles.overallStatCol}>
              <Text style={styles.overallStatVal}>{dynamicTotalAbsent}</Text>
              <Text style={styles.overallStatLabel}>ABSENT</Text>
            </View>
            <View style={styles.overallStatDivider} />
            <View style={styles.overallStatCol}>
              <Text style={styles.overallStatVal}>{dynamicTotalEnrolled}</Text>
              <Text style={styles.overallStatLabel}>ENROLLED</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Add Announcement Button (Below Attendance & Highlights) */}
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

      {/* 3. QUICK NAVIGATION CARDS */}
      <View style={styles.topActionsGroup}>
        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={[styles.topActionCard, { width: topActionWidth }]}
            onPress={() => onNavigateTab('homerooms')}
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

        {/* Second Row: Faculty & Fee Dues */}
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
            onPress={() => onNavigateTab('fees')}
            activeOpacity={0.85}
          >
            <View style={styles.topActionContent}>
              <Text style={styles.topActionTitle} numberOfLines={1}>Fee Dues</Text>
            </View>
            <Feather name="arrow-right" size={14} color="#171717" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. FEES PAID & UNPAID ANALYTICS CHART */}
      <View style={styles.feeAnalyticsCard}>
        {/* Header */}
        <View style={styles.feeAnalyticsHeader}>
          <Text style={styles.feeAnalyticsTitle}>Fees Stats</Text>
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
            const maxVal = Math.max(...chartData.map((d) => Math.max(d.paid, d.unpaid)));
            const maxBarHeight = 95;
            const paidHeight = Math.max(8, Math.round((item.paid / maxVal) * maxBarHeight));
            const unpaidHeight = Math.max(8, Math.round((item.unpaid / maxVal) * maxBarHeight));

            return (
              <View key={item.label} style={styles.dayColumn}>
                <View style={styles.barsPair}>
                  <View style={[styles.paidBar, { height: paidHeight }]} />
                  <View style={[styles.unpaidBar, { height: unpaidHeight }]} />
                </View>
                <Text style={styles.dayLabel}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Legend & View Ledger Link (bottom right side) */}
        <View style={styles.chartFooterRow}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F4C430' }]} />
              <Text style={styles.legendText}>Paid</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#171717' }]} />
              <Text style={styles.legendText}>Unpaid</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewLedgerBtn}
            onPress={() => onNavigateTab('fees')}
            activeOpacity={0.85}
          >
            <Text style={styles.viewLedgerBtnText}>View Ledger</Text>
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

          {hasTodayClasses && firstClass && (
            <View style={[
              styles.highlightCol,
              bothCardsVisible && !isMobile ? styles.highlightColHalf : styles.highlightColFull,
            ]}>
              <Text style={styles.highlightSectionTitle}>Today's Classes</Text>
              <TouchableOpacity
                style={styles.highlightCard}
                onPress={() => onNavigateTab('schedule')}
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
  dateText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  greetingText: {
    fontFamily: FontFamily.regular,
    fontSize: 18,
    color: '#334155',
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
    marginBottom: 10,
  },
  pageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pageTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 22,
    color: '#171717',
    letterSpacing: -0.3,
  },
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

  // 2.5 UPCOMING EVENTS & TODAY'S CLASSES (TWO BOXES IN A LINE - BOTTOM HIGHLIGHTS)
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
  highlightCardHalf: {
    flex: 1,
  },
  highlightCardFull: {
    width: '100%',
  },
  highlightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  highlightEventBadgeLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#171717',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  highlightClassesBadgeLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#171717',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    fontSize: 8.5,
    color: '#171717',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
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

  // Common Section Styling
  sectionContainer: {
    gap: 10,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#171717',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  sectionHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  sectionHeaderBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#171717',
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
  topActionCardFull: {
    width: '100%',
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

  // 4. Fees Paid & Unpaid Analytics Card (Clean minimal display with spacious layout)
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
    paddingVertical: 4,
  },
  barsPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 100,
    marginBottom: 10,
  },
  paidBar: {
    width: 8,
    backgroundColor: '#F4C430',
    borderRadius: 2,
  },
  unpaidBar: {
    width: 8,
    backgroundColor: '#171717',
    borderRadius: 2,
  },
  dayLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.3,
  },
  chartFooterRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#334155',
  },
  viewLedgerBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'transparent',
    paddingVertical: 2,
  },
  viewLedgerBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#171717',
  },
});
