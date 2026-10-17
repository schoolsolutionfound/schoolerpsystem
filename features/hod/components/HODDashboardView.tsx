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
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import {
  HODKPIs,
  HODTab,
  DepartmentCourse,
  ExamEligibilityRecord,
  DepartmentNotice,
} from '../types/hod.types';

interface HODDashboardViewProps {
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

export const HODDashboardView: React.FC<HODDashboardViewProps> = ({
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
    : filteredCourses.slice(0, 5);

  const pendingDetentions = eligibility.filter((e) => e.hallTicketStatus !== 'eligible');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. EDUCATOR BANNER WITH COMPACT TEACHER MODE SWITCH */}
      <View style={styles.educatorBar}>
        <View style={styles.educatorLeft}>
          <View style={styles.educatorIconWrap}>
            <MaterialCommunityIcons name="school" size={20} color="#047857" />
          </View>
          <View>
            <Text style={styles.educatorTitle}>HOD & Educator Privileges</Text>
            <Text style={styles.educatorSub}>Teach, timetable & take attendance</Text>
          </View>
        </View>

        <View style={styles.educatorRightActions}>
          {onSwitchToTeacherPortal && (
            <TouchableOpacity
              style={styles.smallTeacherSwitchBtn}
              onPress={onSwitchToTeacherPortal}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="account-convert" size={14} color="#FFFFFF" />
              <Text style={styles.smallTeacherSwitchText}>Teacher Mode</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Teaching Shortcuts */}
      <View style={styles.teachingShortcutsRow}>
        <TouchableOpacity
          style={[styles.shortcutBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
          onPress={onNavigateToTeacherTimetable}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="calendar-clock" size={20} color="#1D4ED8" />
          <Text style={[styles.shortcutBtnText, { color: '#1E40AF' }]}>My Timetable</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shortcutBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
          onPress={onNavigateToTeacherAttendance}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="clipboard-check" size={20} color="#15803D" />
          <Text style={[styles.shortcutBtnText, { color: '#166534' }]}>Take Attendance</Text>
        </TouchableOpacity>
      </View>

      {/* 2. 1-CLICK DEPARTMENT DOSSIER BUTTON */}
      {onOpenDeptDossierModal && (
        <TouchableOpacity
          style={styles.dossierBanner}
          onPress={onOpenDeptDossierModal}
          activeOpacity={0.85}
        >
          <View style={styles.dossierLeft}>
            <View style={styles.dossierIconWrap}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.dossierTextWrap}>
              <View style={styles.dossierBadge}>
                <Text style={styles.dossierBadgeText}>1-TAP INTELLIGENCE</Text>
              </View>
              <Text style={styles.dossierTitle}>Department Master Dossier</Text>
              <Text style={styles.dossierSub}>Full academic & operational breakdown in 1 tap</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="arrow-right-circle" size={28} color="#EA580C" />
        </TouchableOpacity>
      )}

      {/* 3. SIMPLIFIED 4-CARD METRIC GRID */}
      <View style={styles.metricsGrid}>
        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: '#EA580C' }]}
          onPress={() => onNavigateTab('courses')}
          activeOpacity={0.8}
        >
          <View style={styles.metricCardTop}>
            <Text style={styles.metricLabel}>ACTIVE COURSES</Text>
            <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#EA580C" />
          </View>
          <Text style={styles.metricVal}>{courses.length || kpis.activeCourses}</Text>
          <Text style={styles.metricSub}>{kpis.practicalLabsCount} Practical Labs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: '#0284C7' }]}
          onPress={() => onNavigateTab('faculty')}
          activeOpacity={0.8}
        >
          <View style={styles.metricCardTop}>
            <Text style={styles.metricLabel}>FACULTY</Text>
            <MaterialCommunityIcons name="human-male-board" size={20} color="#0284C7" />
          </View>
          <Text style={styles.metricVal}>{kpis.facultyOnDuty} / {kpis.totalFaculty}</Text>
          <Text style={styles.metricSub}>Instructors on duty</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: '#DC2626' }]}
          onPress={() => onNavigateTab('eligibility')}
          activeOpacity={0.8}
        >
          <View style={styles.metricCardTop}>
            <Text style={styles.metricLabel}>DETENTIONS</Text>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#DC2626" />
          </View>
          <Text style={[styles.metricVal, { color: '#DC2626' }]}>
            {pendingDetentions.length || kpis.detentionAlertsCount}
          </Text>
          <Text style={styles.metricSub}>Students {'< 75%'} attend</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: '#16A34A' }]}
          onPress={() => onNavigateTab('courses')}
          activeOpacity={0.8}
        >
          <View style={styles.metricCardTop}>
            <Text style={styles.metricLabel}>SYLLABUS AVG</Text>
            <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={20} color="#16A34A" />
          </View>
          <Text style={styles.metricVal}>{kpis.averageSyllabusProgress}%</Text>
          <Text style={styles.metricSub}>Curriculum completed</Text>
        </TouchableOpacity>
      </View>

      {/* 4. CLASS & COURSE-WISE STUDENT ATTENDANCE */}
      <View style={styles.courseSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconBox}>
              <MaterialCommunityIcons name="book-education-outline" size={22} color="#EA580C" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Course & Class-Wise Attendance</Text>
              <Text style={styles.sectionSubtitle}>
                Department classes • Minimum 40 students per section
              </Text>
            </View>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchBarWrap}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search course code, subject, instructor..."
            placeholderTextColor="#9CA3AF"
            value={courseSearch}
            onChangeText={setCourseSearch}
          />
          {courseSearch.length > 0 && (
            <TouchableOpacity onPress={() => setCourseSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Course Cards List */}
        <View style={styles.courseListWrap}>
          {displayedCourses.map((course) => {
            const enrolled = course.enrolledStudentsCount || 40;
            const syllabusPct = Math.min(100, Math.max(0, course.syllabusProgressPct || 0));
            const isLab = course.type === 'practical_lab';

            return (
              <View key={course.id} style={styles.courseCard}>
                <View style={styles.courseCardHeader}>
                  <View style={styles.courseTitleWrap}>
                    <View style={[styles.codeBadge, isLab && { backgroundColor: '#7C3AED' }]}>
                      <Text style={styles.codeBadgeText}>{course.code}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courseNameText} numberOfLines={1}>
                        {course.name}
                      </Text>
                      <Text style={styles.courseSubText}>
                        {course.semester} • {course.credits} Credits • {isLab ? 'Practical Lab' : 'Theory'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.enrolledBadge}>
                    <MaterialCommunityIcons name="account-group" size={14} color="#0F172A" />
                    <Text style={styles.enrolledBadgeText}>{enrolled} Students</Text>
                  </View>
                </View>

                {/* Syllabus / Completion Progress */}
                <View style={styles.progressRow}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Syllabus Progress</Text>
                    <Text style={styles.progressValue}>{syllabusPct}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${syllabusPct}%`,
                          backgroundColor: syllabusPct >= 70 ? '#16A34A' : '#EA580C',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Footer with Instructor & Action */}
                <View style={styles.courseCardFooter}>
                  <View style={styles.instructorInfoRow}>
                    <MaterialCommunityIcons name="account-tie" size={15} color="#64748B" />
                    <Text style={styles.instructorText} numberOfLines={1}>
                      {course.instructorName || 'Unassigned Instructor'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.assignBtn,
                      !course.instructorId && { backgroundColor: '#FFEDD5', borderColor: '#FDBA74' },
                    ]}
                    onPress={() => onOpenAssignModal(course)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.assignBtnText,
                        !course.instructorId && { color: '#C2410C' },
                      ]}
                    >
                      {course.instructorId ? 'Reassign' : 'Assign Faculty'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {displayedCourses.length === 0 && (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="book-search-outline" size={36} color="#9CA3AF" />
              <Text style={styles.emptyText}>No department courses match "{courseSearch}"</Text>
            </View>
          )}

          {/* Toggle View More Courses */}
          {filteredCourses.length > 5 && (
            <TouchableOpacity
              style={styles.viewMoreBtn}
              onPress={() => setShowAllCourses((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewMoreBtnText}>
                {showAllCourses
                  ? 'Show Fewer Courses'
                  : `View All ${filteredCourses.length} Courses`}
              </Text>
              <MaterialCommunityIcons
                name={showAllCourses ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#EA580C"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 5. LOW ATTENDANCE & DETENTION ALERTS */}
      {pendingDetentions.length > 0 && (
        <View style={styles.detentionSection}>
          <View style={styles.detentionHeader}>
            <View style={styles.detentionIconBox}>
              <MaterialCommunityIcons name="alert-octagon" size={20} color="#DC2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detentionTitle}>Low Attendance Alerts ({'< 75%'})</Text>
              <Text style={styles.detentionSub}>
                {pendingDetentions.length} students risk detention for upcoming exams
              </Text>
            </View>
            <TouchableOpacity onPress={() => onNavigateTab('eligibility')}>
              <Text style={styles.detentionViewAll}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detentionList}>
            {pendingDetentions.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.detentionRow}
                onPress={() => onOpenEligibilityModal(item)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentNameText}>{item.studentName}</Text>
                  <Text style={styles.studentUsnText}>
                    USN: {item.usn} • {item.semester}
                  </Text>
                </View>
                <View style={styles.attendanceChip}>
                  <Text style={styles.attendanceChipText}>{item.overallAttendancePct}%</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 6. EXECUTIVE SHORTCUTS */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.quickActionsTitle}>Department Shortcuts</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionGridBtn}
            onPress={() => onNavigateTab('courses')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FFEDD5' }]}>
              <MaterialCommunityIcons name="book-open-outline" size={22} color="#EA580C" />
            </View>
            <Text style={styles.actionBtnTitle}>All Courses</Text>
            <Text style={styles.actionBtnSub}>{courses.length} Subjects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionGridBtn}
            onPress={() => onNavigateTab('faculty')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="account-group" size={22} color="#0284C7" />
            </View>
            <Text style={styles.actionBtnTitle}>Faculty Load</Text>
            <Text style={styles.actionBtnSub}>{kpis.totalFaculty} Professors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionGridBtn}
            onPress={() => onNavigateTab('eligibility')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#DC2626" />
            </View>
            <Text style={styles.actionBtnTitle}>Hall Tickets</Text>
            <Text style={styles.actionBtnSub}>{pendingDetentions.length} Flagged</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionGridBtn}
            onPress={onOpenNoticeModal}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="bullhorn-outline" size={22} color="#D97706" />
            </View>
            <Text style={styles.actionBtnTitle}>Post Memo</Text>
            <Text style={styles.actionBtnSub}>Broadcast</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 14,
  },

  // Educator Bar
  educatorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  educatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  educatorIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  educatorTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#065F46',
  },
  educatorSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#047857',
  },
  educatorRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallTeacherSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    elevation: 2,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  smallTeacherSwitchText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Shortcuts
  teachingShortcutsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  shortcutBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
  },

  // 1-Click Dossier Banner
  dossierBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dossierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dossierIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dossierTextWrap: {
    flex: 1,
  },
  dossierBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(234, 88, 12, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  dossierBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#FDBA74',
    letterSpacing: 0.5,
  },
  dossierTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  dossierSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#94A3B8',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  metricCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  metricVal: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: '#0F172A',
    marginBottom: 2,
  },
  metricSub: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#64748B',
  },

  // Course & Class-wise Section
  courseSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
  },

  // Search Bar
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },

  // Course List
  courseListWrap: {
    gap: 10,
  },
  courseCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 10,
  },
  courseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  courseTitleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  codeBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  codeBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  courseNameText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
  },
  courseSubText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  enrolledBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#0F172A',
  },
  progressRow: {
    gap: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#64748B',
  },
  progressValue: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#0F172A',
  },
  progressTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  courseCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  instructorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  instructorText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#475569',
  },
  assignBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  assignBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#334155',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  viewMoreBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#EA580C',
  },

  // Detention Section
  detentionSection: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    gap: 10,
  },
  detentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detentionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detentionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#991B1B',
  },
  detentionSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#B91C1C',
  },
  detentionViewAll: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#DC2626',
  },
  detentionList: {
    gap: 6,
  },
  detentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  studentNameText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#0F172A',
  },
  studentUsnText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#64748B',
  },
  attendanceChip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attendanceChipText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#DC2626',
  },

  // Shortcuts
  quickActionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
  },
  quickActionsTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#0F172A',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionGridBtn: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'flex-start',
    gap: 4,
  },
  actionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionBtnTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
  },
  actionBtnSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#64748B',
  },
});
