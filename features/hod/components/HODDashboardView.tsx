import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import {
  HODKPIs,
  HODTab,
  DepartmentCourse,
  ExamEligibilityRecord,
  DepartmentNotice,
} from '../types/hod.types';

interface HODDashboardViewProps {
  fullName?: string;
  department?: string;
  kpis: HODKPIs;
  courses: DepartmentCourse[];
  eligibility: ExamEligibilityRecord[];
  notices: DepartmentNotice[];
  refreshing: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: HODTab) => void;
  onOpenAssignModal: (course: DepartmentCourse) => void;
  onOpenEligibilityModal: (record: ExamEligibilityRecord) => void;
  onOpenNoticeModal: () => void;
  onOpenDeptDossierModal?: () => void;
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

export const HODDashboardView: React.FC<HODDashboardViewProps> = ({
  fullName = 'Muhammad Samran',
  department = 'Computer Science',
  kpis,
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
  onSwitchToTeacherPortal,
}) => {
  const [courseSearch, setCourseSearch] = useState('');
  const [showAllCourses, setShowAllCourses] = useState(false);

  // Filter courses based on search
  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return courses;
    const q = courseSearch.toLowerCase().trim();
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.instructorName && c.instructorName.toLowerCase().includes(q)) ||
        (c.semester && c.semester.toLowerCase().includes(q))
    );
  }, [courses, courseSearch]);

  const displayedCourses = showAllCourses
    ? filteredCourses
    : filteredCourses.slice(0, 4);

  const pendingDetentions = eligibility.filter((e) => e.hallTicketStatus !== 'eligible');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F59E0B']} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. GREETING HEADER */}
      <View style={styles.greetingSection}>
        <Text style={styles.dateText}>{getFormattedDate()}</Text>
        <Text style={styles.greetingText}>{getGreeting()}</Text>
        <Text style={styles.userNameText}>{fullName}</Text>
        <Text style={styles.subGreetingText}>
          Here's what's happening in {department || 'your department'} today.
        </Text>
      </View>

      {/* 2. TOP 2 EDUCATIONAL & TIMETABLE ACTION CARDS */}
      <View style={styles.topActionsRow}>
        <TouchableOpacity
          style={styles.topActionCard}
          onPress={onOpenDeptDossierModal || (() => onNavigateTab('courses'))}
          activeOpacity={0.8}
        >
          <View style={styles.blackIconBox}>
            <MaterialCommunityIcons name="book-open-outline" size={22} color="#F59E0B" />
          </View>
          <View style={styles.topActionContent}>
            <Text style={styles.topActionTitle}>Educational Tools</Text>
            <Text style={styles.topActionSub} numberOfLines={2}>
              Manage courses, syllabus and academic labs.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.topActionCard}
          onPress={onNavigateToTeacherTimetable}
          activeOpacity={0.8}
        >
          <View style={styles.blackIconBox}>
            <MaterialCommunityIcons name="calendar-clock" size={22} color="#F59E0B" />
          </View>
          <View style={styles.topActionContent}>
            <Text style={styles.topActionTitle}>My Timetable</Text>
            <Text style={styles.topActionSub} numberOfLines={2}>
              View your schedule for the day.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* 3. METRICS (2x2 GRID) */}
      <View style={styles.metricsGrid}>
        {/* Card 1: Students */}
        <TouchableOpacity
          style={styles.metricCard}
          onPress={() => onNavigateTab('courses')}
          activeOpacity={0.8}
        >
          <View style={styles.blackIconBox}>
            <MaterialCommunityIcons name="account-group" size={22} color="#F59E0B" />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricVal}>{kpis.totalStudents || 350}</Text>
            <Text style={styles.metricLabel}>Students</Text>
            <Text style={styles.metricSub}>92% Present Today</Text>
          </View>
        </TouchableOpacity>

        {/* Card 2: Faculty */}
        <TouchableOpacity
          style={styles.metricCard}
          onPress={() => onNavigateTab('faculty')}
          activeOpacity={0.8}
        >
          <View style={styles.blackIconBox}>
            <MaterialCommunityIcons name="account" size={22} color="#F59E0B" />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricVal}>{kpis.facultyOnDuty || kpis.totalFaculty || 8}</Text>
            <Text style={styles.metricLabel}>Faculty</Text>
            <Text style={styles.metricSub}>100% On Duty</Text>
          </View>
        </TouchableOpacity>

        {/* Card 3: Classes / Courses */}
        <TouchableOpacity
          style={styles.metricCard}
          onPress={() => onNavigateTab('courses')}
          activeOpacity={0.8}
        >
          <View style={styles.blackIconBox}>
            <MaterialCommunityIcons name="book-open-outline" size={22} color="#F59E0B" />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricVal}>{courses.length || kpis.activeCourses || 7}</Text>
            <Text style={styles.metricLabel}>Courses</Text>
            <Text style={styles.metricSub}>Active Classes (40+ each)</Text>
          </View>
        </TouchableOpacity>

        {/* Card 4: Detentions */}
        <TouchableOpacity
          style={styles.metricCard}
          onPress={() => onNavigateTab('eligibility')}
          activeOpacity={0.8}
        >
          <View style={styles.blackIconBox}>
            <MaterialCommunityIcons name="file-document-outline" size={22} color="#F59E0B" />
          </View>
          <View style={styles.metricContent}>
            <Text style={styles.metricVal}>{pendingDetentions.length || kpis.detentionAlertsCount || 0}</Text>
            <Text style={styles.metricLabel}>Detentions</Text>
            <Text style={styles.metricSub}>Low Attendance ({'< 75%'})</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 4. CLASS & COURSE-WISE STUDENT ATTENDANCE SECTION */}
      <View style={styles.classSectionCard}>
        {/* Section Header */}
        <View style={styles.classSectionHeader}>
          <View style={styles.blackSquareSm}>
            <MaterialCommunityIcons name="chart-bar" size={20} color="#F59E0B" />
          </View>
          <View style={styles.classSectionHeaderTitles}>
            <Text style={styles.classSectionTitle}>Class-Wise Student Attendance</Text>
            <Text style={styles.classSectionSubtitle}>Monitor attendance and manage classes easily.</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search class name, room, or teacher..."
            placeholderTextColor="#9CA3AF"
            value={courseSearch}
            onChangeText={setCourseSearch}
          />
          {courseSearch.length > 0 && (
            <TouchableOpacity onPress={() => setCourseSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Course / Class List */}
        <View style={styles.classList}>
          {displayedCourses.map((c, idx) => {
            const studentCount = c.enrolledStudentsCount || 40;
            const presentCount = Math.round(studentCount * 0.92);
            const absentCount = Math.max(0, studentCount - presentCount);

            return (
              <View
                key={c.id}
                style={[
                  styles.classItem,
                  idx < displayedCourses.length - 1 && styles.classItemBorder,
                ]}
              >
                {/* Top Row: Title + Room/Semester & Assign Button */}
                <View style={styles.classItemTop}>
                  <View style={styles.classItemTitleWrap}>
                    <Text style={styles.classNameText}>{c.code} - {c.name}</Text>
                    <Text style={styles.classRoomText}>
                      Room: Main Block • {c.semester}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.assignPillBtn}
                    onPress={() => onOpenAssignModal(c)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.assignPillText}>
                      {c.instructorName ? 'Assigned' : 'Assign'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#B45309" />
                  </TouchableOpacity>
                </View>

                {/* Bottom Row: Stats */}
                <View style={styles.classItemStats}>
                  <View style={styles.statChip}>
                    <MaterialCommunityIcons name="account-group" size={14} color="#6B7280" />
                    <Text style={styles.statText}>{studentCount} Enrolled</Text>
                  </View>

                  <View style={styles.statChip}>
                    <View style={[styles.statusDot, { backgroundColor: '#16A34A' }]} />
                    <Text style={styles.statText}>{presentCount} Present</Text>
                  </View>

                  <View style={styles.statChip}>
                    <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.statText}>{absentCount} Absent</Text>
                  </View>
                </View>
              </View>
            );
          })}

          {displayedCourses.length === 0 && (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="book-search-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No classes matched "{courseSearch}"</Text>
            </View>
          )}
        </View>

        {/* View All Footer */}
        {filteredCourses.length > 0 && (
          <TouchableOpacity
            style={styles.viewAllFooter}
            onPress={() => setShowAllCourses((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewAllText}>
              {showAllCourses
                ? 'Show Fewer Classes'
                : `View All ${filteredCourses.length} Classes`}
            </Text>
            <MaterialCommunityIcons
              name={showAllCourses ? 'chevron-up' : 'chevron-right'}
              size={20}
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
          {/* Card 1: All Classes / Courses */}
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => onNavigateTab('courses')}
            activeOpacity={0.8}
          >
            <View style={styles.blackIconBoxSm}>
              <MaterialCommunityIcons name="book-open-outline" size={18} color="#F59E0B" />
            </View>
            <View style={styles.quickCardText}>
              <Text style={styles.quickCardTitle}>All Courses</Text>
              <Text style={styles.quickCardSub}>{courses.length} Subjects</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Card 2: Faculty Roster */}
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => onNavigateTab('faculty')}
            activeOpacity={0.8}
          >
            <View style={styles.blackIconBoxSm}>
              <MaterialCommunityIcons name="account-group" size={18} color="#F59E0B" />
            </View>
            <View style={styles.quickCardText}>
              <Text style={styles.quickCardTitle}>Faculty Load</Text>
              <Text style={styles.quickCardSub}>{kpis.totalFaculty} Instructors</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Card 3: Detentions / Hall Tickets */}
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => onNavigateTab('eligibility')}
            activeOpacity={0.8}
          >
            <View style={styles.blackIconBoxSm}>
              <MaterialCommunityIcons name="file-document-outline" size={18} color="#F59E0B" />
            </View>
            <View style={styles.quickCardText}>
              <Text style={styles.quickCardTitle}>Hall Tickets</Text>
              <Text style={styles.quickCardSub}>{pendingDetentions.length} Flagged</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Card 4: Post Memo */}
          <TouchableOpacity
            style={styles.quickCard}
            onPress={onOpenNoticeModal}
            activeOpacity={0.8}
          >
            <View style={styles.blackIconBoxSm}>
              <MaterialCommunityIcons name="bullhorn-outline" size={18} color="#F59E0B" />
            </View>
            <View style={styles.quickCardText}>
              <Text style={styles.quickCardTitle}>Department Memo</Text>
              <Text style={styles.quickCardSub}>Create Notice</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },

  // 1. Greeting
  greetingSection: {
    gap: 2,
    marginBottom: 4,
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
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },

  // 2. Top Action Cards
  topActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  topActionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  blackIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#111827',
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
    color: '#6B7280',
    lineHeight: 14,
    marginTop: 2,
  },

  // 3. Metrics Grid (2x2)
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48.2%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  metricContent: {
    flex: 1,
  },
  metricVal: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: '#111827',
    lineHeight: 26,
  },
  metricLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },
  metricSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },

  // 4. Class-Wise Student Attendance Card
  classSectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  classSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blackSquareSm: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#111827',
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
    color: '#6B7280',
    marginTop: 1,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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

  // Class List Items
  classList: {
    gap: 12,
  },
  classItem: {
    paddingVertical: 8,
    gap: 8,
  },
  classItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
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
    color: '#6B7280',
    marginTop: 2,
  },
  assignPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  assignPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#B45309',
  },
  classItemStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#4B5563',
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
    color: '#6B7280',
  },

  viewAllFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewAllText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#111827',
  },

  // 5. Quick Access
  quickAccessSection: {
    gap: 12,
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
    color: '#6B7280',
  },
  quickAccessScroll: {
    gap: 10,
    paddingRight: 16,
  },
  quickCard: {
    width: 150,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  blackIconBoxSm: {
    width: 34,
    height: 34,
    borderRadius: 8,
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
    fontSize: 13,
    color: '#111827',
  },
  quickCardSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
  },
});
