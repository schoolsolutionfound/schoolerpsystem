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
import { MOCK_STUDENT_FEES } from '../constants/feeLedgerData';

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



const FALLBACK_DEPARTMENT_CLASSES: HomeroomSection[] = [
  {
    id: 'dyn-cse-1',
    name: 'CSE B.Tech 1st Year · Sec A',
    grade: '1st Year',
    section: 'A',
    roomNumber: 'Lab 101',
    homeroomTeacherName: 'Dr. Emily Watson',
    studentCount: 42,
    presentCount: 40,
    attendanceRate: 95.2,
  },
  {
    id: 'dyn-cse-2',
    name: 'CSE B.Tech 2nd Year · Sec B',
    grade: '2nd Year',
    section: 'B',
    roomNumber: 'Lab 203',
    homeroomTeacherName: 'Prof. David Vance',
    studentCount: 40,
    presentCount: 37,
    attendanceRate: 92.5,
  },
  {
    id: 'dyn-ece-1',
    name: 'ECE B.Tech 1st Year · Sec A',
    grade: '1st Year',
    section: 'A',
    roomNumber: 'Room 302',
    homeroomTeacherName: 'Dr. Sarah Connor',
    studentCount: 38,
    presentCount: 35,
    attendanceRate: 92.1,
  },
  {
    id: 'dyn-ece-2',
    name: 'ECE B.Tech 3rd Year · Sec A',
    grade: '3rd Year',
    section: 'A',
    roomNumber: 'VLSI Lab',
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

  // Department-wise Fees Paid vs Unpaid Analytics State
  const [chartPeriod, setChartPeriod] = useState<'term' | 'annual'>('term');
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(0); // default to CSE highlight

  const chartData = chartPeriod === 'term' ? DEPT_FEE_ANALYTICS_TERM : DEPT_FEE_ANALYTICS_ANNUAL;
  const selectedBarInfo =
    selectedBarIndex !== null && chartData[selectedBarIndex] ? chartData[selectedBarIndex] : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F4C430']} />}
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

      {/* Add Announcement Button (Below Attendance) */}
      <View style={styles.announcementActionRow}>
        <TouchableOpacity
          style={styles.primaryCtaBtn}
          onPress={onOpenNoticeModal}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={16} color="#000000" style={{ marginRight: 6 }} />
          <Text style={styles.primaryCtaBtnText}>Add Announcement</Text>
        </TouchableOpacity>
      </View>

      {/* 3. QUICK NAVIGATION CARDS */}
      <View style={styles.topActionsRow}>
        <TouchableOpacity
          style={[styles.topActionCard, { width: topActionWidth }]}
          onPress={() => onNavigateTab('homerooms')}
          activeOpacity={0.8}
        >
          <View style={styles.topActionContent}>
            <Text style={styles.topActionTitle} numberOfLines={1}>Classes</Text>
          </View>
          <Feather name="arrow-right" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topActionCard, { width: topActionWidth }]}
          onPress={() => onNavigateTab('timetable')}
          activeOpacity={0.8}
        >
          <View style={styles.topActionContent}>
            <Text style={styles.topActionTitle} numberOfLines={1}>Timetable</Text>
          </View>
          <Feather name="arrow-right" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Second Row: Faculty & Fee Dues */}
      <View style={styles.topActionsRow}>
        <TouchableOpacity
          style={[styles.topActionCard, { width: topActionWidth }]}
          onPress={() => onNavigateTab('staff')}
          activeOpacity={0.8}
        >
          <View style={styles.topActionContent}>
            <Text style={styles.topActionTitle} numberOfLines={1}>Faculty</Text>
          </View>
          <Feather name="arrow-right" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topActionCard, { width: topActionWidth }]}
          onPress={() => onNavigateTab('fees')}
          activeOpacity={0.8}
        >
          <View style={styles.topActionContent}>
            <Text style={styles.topActionTitle} numberOfLines={1}>Fee Dues</Text>
          </View>
          <Feather name="arrow-right" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* 4. FEES PAID & UNPAID ANALYTICS CHART (Matching Book Circulation aesthetics) */}
      <View style={styles.feeAnalyticsCard}>
        {/* Header */}
        <View style={styles.feeAnalyticsHeader}>
          <Text style={styles.feeAnalyticsTitle}>Fees Paid & Unpaid</Text>
          <TouchableOpacity
            style={styles.periodPillBtn}
            onPress={() => {
              setChartPeriod((prev: 'term' | 'annual') => (prev === 'term' ? 'annual' : 'term'));
              setSelectedBarIndex(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.periodPillText}>
              {chartPeriod === 'term' ? 'This Term' : 'Annual'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Selected Day/Week Metric Tooltip Quick Bar */}
        {selectedBarInfo && (
          <View style={styles.chartTooltipRow}>
            <Text style={styles.chartTooltipDay}>{selectedBarInfo.label}:</Text>
            <Text style={styles.chartTooltipPaid}>₹{selectedBarInfo.paid.toLocaleString()} Paid</Text>
            <Text style={styles.chartTooltipDot}>·</Text>
            <Text style={styles.chartTooltipUnpaid}>₹{selectedBarInfo.unpaid.toLocaleString()} Unpaid</Text>
          </View>
        )}

        {/* Chart Bars Area */}
        <View style={styles.chartContainer}>
          {chartData.map((item, index) => {
            const maxVal = Math.max(...chartData.map((d) => Math.max(d.paid, d.unpaid)));
            const maxBarHeight = 85;
            const paidHeight = Math.max(6, Math.round((item.paid / maxVal) * maxBarHeight));
            const unpaidHeight = Math.max(6, Math.round((item.unpaid / maxVal) * maxBarHeight));
            const isSelected = selectedBarIndex === index;

            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.dayColumn, isSelected && styles.dayColumnSelected]}
                onPress={() => setSelectedBarIndex(isSelected ? null : index)}
                activeOpacity={0.8}
              >
                <View style={styles.barsPair}>
                  <View style={[styles.paidBar, { height: paidHeight }]} />
                  <View style={[styles.unpaidBar, { height: unpaidHeight }]} />
                </View>
                <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFD026' }]} />
            <Text style={styles.legendText}>Paid</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0F172A' }]} />
            <Text style={styles.legendText}>Unpaid</Text>
          </View>
        </View>

        {/* View Class-wise Ledger Link */}
        <TouchableOpacity
          style={styles.viewLedgerBtn}
          onPress={() => onNavigateTab('fees')}
          activeOpacity={0.8}
        >
          <Text style={styles.viewLedgerBtnText}>View Class-wise Fee Ledger</Text>
          <Feather name="arrow-right" size={14} color="#B45309" />
        </TouchableOpacity>
      </View>

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
    color: '#6B7280',
    marginBottom: 2,
  },
  greetingText: {
    fontFamily: FontFamily.regular,
    fontSize: 18,
    color: '#374151',
  },
  userNameText: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    color: '#111827',
    letterSpacing: -0.5,
  },
  subGreetingText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#6B7280',
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
    color: '#000000',
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
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryCtaBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#000000',
    letterSpacing: -0.1,
  },

  // 2. Attendance Summary Card (Lighter fade, circular status ring)
  overallAttendanceCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4.5,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  circularGaugeVal: {
    fontFamily: FontFamily.bold,
    fontSize: 19,
    color: '#111827',
    lineHeight: 22,
  },
  circularGaugeLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 7.5,
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  overallDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(180, 83, 9, 0.15)',
    marginHorizontal: 8,
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
    fontSize: 16,
    lineHeight: 20,
    color: '#111827',
  },
  overallStatLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#854D0E',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  overallStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(180, 83, 9, 0.15)',
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
    color: '#111827',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  sectionHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  sectionHeaderBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#111827',
  },

  // 3. Quick Action Cards (Clean White Card, Subtle Border)
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
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
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
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  topActionContent: {
    flex: 1,
  },
  topActionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
  },







  // 4. Fees Paid & Unpaid Analytics Card
  feeAnalyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    marginTop: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  feeAnalyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  feeAnalyticsTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  periodPillBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  periodPillText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#334155',
  },
  chartTooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 6,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartTooltipDay: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#0F172A',
  },
  chartTooltipPaid: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#B45309',
  },
  chartTooltipDot: {
    color: '#94A3B8',
    fontSize: 12,
  },
  chartTooltipUnpaid: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#334155',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 6,
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayColumnSelected: {
    backgroundColor: '#F1F5F9',
  },
  barsPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 90,
    marginBottom: 8,
  },
  paidBar: {
    width: 7,
    backgroundColor: '#FFD026',
    borderRadius: 4,
  },
  unpaidBar: {
    width: 7,
    backgroundColor: '#0F172A',
    borderRadius: 4,
  },
  dayLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#64748B',
  },
  dayLabelSelected: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#475569',
  },
  viewLedgerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#FFFDF7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginTop: 14,
  },
  viewLedgerBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#92400E',
  },
});
