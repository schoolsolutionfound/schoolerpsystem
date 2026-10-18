import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import {
  PrincipalKPIs,
  PrincipalTab,
  HomeroomSection,
  SchoolNotice,
  CounselingRecord,
} from '../types/principal.types';

interface PrincipalDashboardViewProps {
  fullName?: string;
  kpis: PrincipalKPIs;
  homerooms: HomeroomSection[];
  notices: SchoolNotice[];
  counseling: CounselingRecord[];
  refreshing: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: PrincipalTab) => void;
  onOpenAssignModal: (section: HomeroomSection) => void;
  onOpenNoticeModal: () => void;
  onOpenDossierModal?: () => void;
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

export const PrincipalDashboardView: React.FC<PrincipalDashboardViewProps> = ({
  fullName = 'Muhammad Samran',
  kpis,
  homerooms,
  notices,
  counseling,
  refreshing,
  onRefresh,
  onNavigateTab,
  onOpenAssignModal,
  onOpenNoticeModal,
  onOpenDossierModal,
  onNavigateToTeacherTimetable,
  onNavigateToTeacherAttendance,
  onSwitchToTeacherPortal,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const maxContentWidth = Math.min(windowWidth, 1200);
  const isTabletOrDesktop = maxContentWidth >= 768;

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
  const quickCardWidth = Math.max(130, Math.floor((maxContentWidth - 32 - 10) / 2.3));

  const [classSearch, setClassSearch] = useState('');
  const [classFilter, setClassFilter] = useState<'all' | 'high' | 'normal' | 'at_risk' | 'unassigned'>('all');
  const [showAllClasses, setShowAllClasses] = useState(false);

  // Filter classes based on search and selected attendance rate filter
  const filteredHomerooms = useMemo(() => {
    return homerooms.filter((h) => {
      if (classSearch.trim()) {
        const q = classSearch.toLowerCase().trim();
        const matches =
          h.name.toLowerCase().includes(q) ||
          (h.homeroomTeacherName && h.homeroomTeacherName.toLowerCase().includes(q)) ||
          (h.roomNumber && h.roomNumber.toLowerCase().includes(q));
        if (!matches) return false;
      }
      const studentCount = h.studentCount || 40;
      const presentCount =
        h.presentCount !== undefined ? h.presentCount : Math.round(studentCount * 0.92);
      const ratePct =
        h.attendanceRate !== undefined && h.attendanceRate > 0
          ? h.attendanceRate
          : studentCount > 0
          ? Math.round((presentCount / studentCount) * 100)
          : 0;

      if (classFilter === 'high') return ratePct >= 90;
      if (classFilter === 'normal') return ratePct >= 75 && ratePct < 90;
      if (classFilter === 'at_risk') return ratePct < 75;
      if (classFilter === 'unassigned') return !h.homeroomTeacherName;
      return true;
    });
  }, [homerooms, classSearch, classFilter]);

  const displayedHomerooms = showAllClasses
    ? filteredHomerooms
    : filteredHomerooms.slice(0, 4);

  const safeStudentPct = Math.min(100, Math.max(0, kpis.studentAttendancePct || 90));
  const safeFacultyPct = Math.min(100, Math.max(0, kpis.facultyAttendancePct || 100));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F4C430']} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. GREETING HEADER */}
      <View style={styles.greetingSection}>
        <Text style={styles.dateText}>{getFormattedDate()}</Text>
        <Text style={styles.greetingText}>{getGreeting()}</Text>
        <Text style={styles.userNameText}>{fullName}</Text>
        <Text style={styles.subGreetingText}>Here's what's happening at your institution today.</Text>
      </View>

      {/* 2. ATTENDANCE HERO SUMMARY (ATTENDANCE STANDARD THEME) */}
      <View style={styles.overallAttendanceCard}>
        <View style={styles.overallCardMain}>
          <View style={styles.overallRingBox}>
            <Text style={styles.overallRingVal}>{safeStudentPct}%</Text>
            <Text style={styles.overallRingLabel}>ATTENDANCE</Text>
          </View>
          <View style={styles.overallDivider} />
          <View style={styles.overallStatsRow}>
            <View style={styles.overallStatCol}>
              <Text style={[styles.overallStatVal, { color: '#16A34A' }]}>
                {kpis.presentStudents || Math.round((kpis.totalStudents || 568) * (safeStudentPct / 100))}
              </Text>
              <Text style={styles.overallStatLabel}>PRESENT</Text>
            </View>
            <View style={styles.overallStatDivider} />
            <View style={styles.overallStatCol}>
              <Text style={[styles.overallStatVal, { color: '#DC2626' }]}>
                {Math.max(0, (kpis.totalStudents || 568) - (kpis.presentStudents || Math.round((kpis.totalStudents || 568) * (safeStudentPct / 100))))}
              </Text>
              <Text style={styles.overallStatLabel}>ABSENT</Text>
            </View>
            <View style={styles.overallStatDivider} />
            <View style={styles.overallStatCol}>
              <Text style={[styles.overallStatVal, { color: '#FFFFFF' }]}>
                {kpis.totalStudents || 568}
              </Text>
              <Text style={styles.overallStatLabel}>ENROLLED</Text>
            </View>
          </View>
        </View>
        {/* Attendance Progress Track */}
        <View style={styles.overallProgressTrack}>
          <View style={[styles.overallProgressFill, { width: `${safeStudentPct}%` }]} />
        </View>
      </View>

      {/* 3. TOP 2 EDUCATIONAL & TIMETABLE ACTION CARDS */}
      <View style={styles.topActionsRow}>
        <TouchableOpacity
          style={[styles.topActionCard, { width: topActionWidth }]}
          onPress={onOpenDossierModal || (() => onNavigateTab('homerooms'))}
          activeOpacity={0.8}
        >
          <View style={styles.blackIconBox}>
            <MaterialCommunityIcons name="book-open-outline" size={18} color="#111827" />
          </View>
          <View style={styles.topActionContent}>
            <Text style={styles.topActionTitle} numberOfLines={1}>
              Academics
            </Text>
            <Text style={styles.topActionSub} numberOfLines={1}>
              Classes & tools
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topActionCard, { width: topActionWidth }]}
          onPress={onNavigateToTeacherTimetable}
          activeOpacity={0.8}
        >
          <View style={styles.blackIconBox}>
            <MaterialCommunityIcons name="calendar-clock" size={18} color="#111827" />
          </View>
          <View style={styles.topActionContent}>
            <Text style={styles.topActionTitle} numberOfLines={1}>
              Timetable
            </Text>
            <Text style={styles.topActionSub} numberOfLines={1}>
              Today's schedule
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 3. METRIC CARDS (2x2 on mobile, 4x1 on desktop) */}
      <View style={styles.metricsGrid}>
        {/* Card 1: Students */}
        <TouchableOpacity
          style={[styles.metricCard, { width: metricColWidth }]}
          onPress={() => onNavigateTab('homerooms')}
          activeOpacity={0.8}
        >
          <View style={styles.blackIconBox}>
            <MaterialCommunityIcons name="account-group" size={20} color="#111827" />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricVal}>{kpis.totalStudents || 568}</Text>
            <Text style={styles.metricLabel} numberOfLines={1}>Students</Text>
            <Text style={styles.metricSub} numberOfLines={1}>{safeStudentPct}% Present</Text>
          </View>
        </TouchableOpacity>

        {/* Card 2: Faculty */}
        <TouchableOpacity
          style={[styles.metricCard, { width: metricColWidth }]}
          onPress={() => onNavigateTab('staff')}
          activeOpacity={0.8}
        >
          <View style={styles.blackIconBox}>
            <MaterialCommunityIcons name="account" size={20} color="#111827" />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricVal}>{kpis.totalFaculty || 4}</Text>
            <Text style={styles.metricLabel} numberOfLines={1}>Faculty</Text>
            <Text style={styles.metricSub} numberOfLines={1}>{safeFacultyPct}% On Duty</Text>
          </View>
        </TouchableOpacity>

        {/* Card 3: Classes */}
        <TouchableOpacity
          style={[styles.metricCard, { width: metricColWidth }]}
          onPress={() => onNavigateTab('homerooms')}
          activeOpacity={0.8}
        >
          <View style={styles.blackIconBox}>
            <MaterialCommunityIcons name="book-open-outline" size={20} color="#111827" />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricVal}>{homerooms.length || kpis.activeSections || 46}</Text>
            <Text style={styles.metricLabel} numberOfLines={1}>Classes</Text>
            <Text style={styles.metricSub} numberOfLines={1}>{homerooms.length || kpis.activeSections || 46} Sections</Text>
          </View>
        </TouchableOpacity>

        {/* Card 4: Circulars */}
        <TouchableOpacity
          style={[styles.metricCard, { width: metricColWidth }]}
          onPress={() => onNavigateTab('notices')}
          activeOpacity={0.8}
        >
          <View style={styles.blackIconBox}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#111827" />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricVal}>{notices.length || 6}</Text>
            <Text style={styles.metricLabel} numberOfLines={1}>Circulars</Text>
            <Text style={styles.metricSub} numberOfLines={1}>Official Notices</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 4. CLASS-WISE STUDENT ATTENDANCE SECTION */}
      <View style={styles.classSectionCard}>
        {/* Section Header */}
        <View style={styles.classSectionHeader}>
          <View style={styles.blackSquareSm}>
            <MaterialCommunityIcons name="chart-bar" size={20} color="#111827" />
          </View>
          <View style={styles.classSectionHeaderTitles}>
            <Text style={styles.classSectionTitle}>Class-Wise Student Attendance</Text>
            <Text style={styles.classSectionSubtitle}>Monitor attendance and manage classes easily.</Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchBarWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search class name, room, or teacher..."
            placeholderTextColor="#9CA3AF"
            value={classSearch}
            onChangeText={setClassSearch}
          />
          {classSearch.length > 0 && (
            <TouchableOpacity onPress={() => setClassSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Class Attendance Filters Beside/Under Search */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.classFilterChipsScroll}
        >
          {(
            [
              { key: 'all' as const, label: `All Classes (${homerooms.length})` },
              { key: 'high' as const, label: '≥90% High' },
              { key: 'normal' as const, label: '75-89% Normal' },
              { key: 'at_risk' as const, label: '<75% At-Risk' },
              { key: 'unassigned' as const, label: 'Unassigned' },
            ]
          ).map((item) => {
            const active = classFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.classFilterChip, active && styles.classFilterChipActive]}
                onPress={() => setClassFilter(item.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.classFilterChipText, active && styles.classFilterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Class Items */}
        <View style={styles.classList}>
          {displayedHomerooms.map((sec, idx) => {
            const studentCount = sec.studentCount || 40;
            const presentCount =
              sec.presentCount !== undefined
                ? sec.presentCount
                : Math.round(studentCount * 0.92);
            const absentCount = Math.max(0, studentCount - presentCount);
            const ratePct = sec.attendanceRate !== undefined && sec.attendanceRate > 0
              ? sec.attendanceRate
              : studentCount > 0 ? Math.round((presentCount / studentCount) * 100) : 0;
            const rateColor = ratePct >= 90 ? '#16A34A' : ratePct >= 75 ? '#F59E0B' : '#DC2626';

            return (
              <View
                key={sec.id}
                style={[
                  styles.classItem,
                  idx < displayedHomerooms.length - 1 && styles.classItemBorder,
                ]}
              >
                {/* Top Row: Title + Room & Rate Pill */}
                <View style={styles.classItemTop}>
                  <View style={styles.classItemTitleWrap}>
                    <Text style={styles.classNameText}>{sec.name}</Text>
                    <Text style={styles.classRoomText}>
                      Room: {sec.roomNumber || 'Main Block'}{sec.homeroomTeacherName ? ` • ${sec.homeroomTeacherName}` : ''}
                    </Text>
                  </View>

                  <View style={[styles.attendanceRatePill, { backgroundColor: `${rateColor}18` }]}>
                    <MaterialCommunityIcons
                      name={ratePct >= 90 ? 'check-circle' : ratePct >= 75 ? 'clock-alert' : 'close-circle'}
                      size={12}
                      color={rateColor}
                    />
                    <Text style={[styles.attendanceRatePillText, { color: rateColor }]}>{ratePct}%</Text>
                  </View>
                </View>

                {/* Progress Bar (Attendance Standard) */}
                <View style={styles.classProgressTrack}>
                  <View
                    style={[
                      styles.classProgressFill,
                      { width: `${Math.min(ratePct, 100)}%`, backgroundColor: rateColor },
                    ]}
                  />
                </View>

                {/* Bottom Row: Stats & Action */}
                <View style={styles.classItemBottom}>
                  <View style={styles.classItemStats}>
                    <View style={styles.statChip}>
                      <View style={[styles.statusDot, { backgroundColor: '#16A34A' }]} />
                      <Text style={styles.statText}>{presentCount} Present</Text>
                    </View>

                    <View style={styles.statChip}>
                      <View style={[styles.statusDot, { backgroundColor: '#DC2626' }]} />
                      <Text style={styles.statText}>{absentCount} Absent</Text>
                    </View>

                    <View style={styles.statChip}>
                      <Text style={styles.statSubText}>{studentCount} Enrolled</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.assignPillBtn}
                    onPress={() => onOpenAssignModal(sec)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.assignPillText}>
                      {sec.homeroomTeacherName ? 'Teacher' : 'Assign'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={13} color="#F4C430" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {displayedHomerooms.length === 0 && (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="text-box-search-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No classes matched "{classSearch}"</Text>
            </View>
          )}
        </View>

        {/* View All Classes Button */}
        {filteredHomerooms.length > 0 && (
          <TouchableOpacity
            style={styles.viewAllFooter}
            onPress={() => setShowAllClasses((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewAllText}>
              {showAllClasses
                ? 'Show Fewer Classes'
                : `View All ${filteredHomerooms.length} Classes`}
            </Text>
            <MaterialCommunityIcons
              name={showAllClasses ? 'chevron-up' : 'chevron-right'}
              size={18}
              color="#111827"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 5. QUICK ACCESS SECTION */}
      <View style={styles.quickAccessSection}>
        <View style={styles.quickAccessHeader}>
          <Text style={styles.quickAccessTitle}>Quick Access</Text>
          <Text style={styles.quickAccessSubtitle}>Common tasks, always within reach.</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickAccessScroll}
        >
          {/* Card 1: All Classes */}
          <TouchableOpacity
            style={[styles.quickCard, { width: quickCardWidth }]}
            onPress={() => onNavigateTab('homerooms')}
            activeOpacity={0.8}
          >
            <View style={styles.blackIconBoxSm}>
              <MaterialCommunityIcons name="book-open-outline" size={16} color="#F4C430" />
            </View>
            <View style={styles.quickCardText}>
              <Text style={styles.quickCardTitle} numberOfLines={1}>All Classes</Text>
              <Text style={styles.quickCardSub}>{homerooms.length} Sections</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Card 2: Faculty Roster */}
          <TouchableOpacity
            style={[styles.quickCard, { width: quickCardWidth }]}
            onPress={() => onNavigateTab('staff')}
            activeOpacity={0.8}
          >
            <View style={styles.blackIconBoxSm}>
              <MaterialCommunityIcons name="account-group" size={16} color="#F4C430" />
            </View>
            <View style={styles.quickCardText}>
              <Text style={styles.quickCardTitle} numberOfLines={1}>Faculty Roster</Text>
              <Text style={styles.quickCardSub}>{kpis.totalFaculty} Educators</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Card 3: New Circular */}
          <TouchableOpacity
            style={[styles.quickCard, { width: quickCardWidth }]}
            onPress={onOpenNoticeModal}
            activeOpacity={0.8}
          >
            <View style={styles.blackIconBoxSm}>
              <MaterialCommunityIcons name="file-document-outline" size={16} color="#F4C430" />
            </View>
            <View style={styles.quickCardText}>
              <Text style={styles.quickCardTitle} numberOfLines={1}>New Circular</Text>
              <Text style={styles.quickCardSub}>Create Notice</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Card 4: Guidance Care */}
          <TouchableOpacity
            style={[styles.quickCard, { width: quickCardWidth }]}
            onPress={() => onNavigateTab('counseling')}
            activeOpacity={0.8}
          >
            <View style={styles.blackIconBoxSm}>
              <MaterialCommunityIcons name="heart-outline" size={16} color="#F4C430" />
            </View>
            <View style={styles.quickCardText}>
              <Text style={styles.quickCardTitle} numberOfLines={1}>Guidance Care</Text>
              <Text style={styles.quickCardSub}>Student Support</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
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
    color: '#6B6B6B',
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
    color: '#6B6B6B',
    marginTop: 3,
  },

  // 2. Attendance Hero Card (Attendance Standard Theme)
  overallAttendanceCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2B2C',
    padding: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  overallCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallRingBox: {
    alignItems: 'flex-start',
    minWidth: 90,
  },
  overallRingVal: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    color: '#F4C430',
    lineHeight: 36,
  },
  overallRingLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  overallDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#2A2B2C',
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
  },
  overallStatLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  overallStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#2A2B2C',
  },
  overallProgressTrack: {
    height: 6,
    backgroundColor: '#232425',
    borderRadius: 3,
    overflow: 'hidden',
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: '#F4C430',
    borderRadius: 3,
  },

  // 3. Top Action Cards
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 8,
  },
  blackIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topActionContent: {
    flex: 1,
  },
  topActionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },
  topActionSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B6B6B',
    lineHeight: 14,
    marginTop: 2,
  },

  // 3. Metrics Grid (2x2)
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 8,
  },
  metricContent: {
    flex: 1,
  },
  metricVal: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#111827',
    lineHeight: 24,
  },
  metricLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },
  metricSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 1,
  },

  // 4. Class-Wise Student Attendance Card
  classSectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  classSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blackSquareSm: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classSectionHeaderTitles: {
    flex: 1,
  },
  classSectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
  },
  classSectionSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 1,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#111827',
    padding: 0,
  },
  classFilterChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  classFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  classFilterChipActive: {
    backgroundColor: '#1A1B1C',
    borderColor: '#1A1B1C',
  },
  classFilterChipText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: '#6B6B6B',
  },
  classFilterChipTextActive: {
    color: '#F4C430',
    fontFamily: FontFamily.bold,
  },

  // Class List Items
  classList: {
    gap: 10,
  },
  classItem: {
    paddingVertical: 6,
    gap: 6,
  },
  classItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    paddingBottom: 10,
  },
  classItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classItemTitleWrap: {
    flex: 1,
  },
  classNameText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
  },
  classRoomText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 1,
  },
  assignPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  assignPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#F4C430',
  },
  classItemStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  classProgressTrack: {
    height: 5,
    backgroundColor: '#F3F1EA',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  classProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  classItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  attendanceRatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  attendanceRatePillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B6B6B',
  },
  statSubText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#9CA3AF',
  },

  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#6B6B6B',
  },

  viewAllFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
  },
  viewAllText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#111827',
  },

  // 5. Quick Access
  quickAccessSection: {
    gap: 10,
  },
  quickAccessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  quickAccessTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
  },
  quickAccessSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B6B6B',
  },
  quickAccessScroll: {
    gap: 10,
    paddingRight: 16,
  },
  quickCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  blackIconBoxSm: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardText: {
    gap: 2,
    marginTop: 2,
  },
  quickCardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
  },
  quickCardSub: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#6B6B6B',
  },
});
