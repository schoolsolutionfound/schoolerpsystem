import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
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
}) => {
  const unassignedCourses = courses.filter((c) => !c.instructorId);
  const firstUnassigned = unassignedCourses[0];
  const pendingDetentions = eligibility.filter((e) => e.hallTicketStatus !== 'eligible');
  const criticalCases = pendingDetentions.slice(0, 3);
  const activeCoursesPreview = courses.slice(0, 4);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Actionable Alert Banner: Unassigned Courses */}
      {firstUnassigned && (
        <TouchableOpacity
          style={styles.alertCard}
          onPress={() => onOpenAssignModal(firstUnassigned)}
          activeOpacity={0.8}
        >
          <View style={styles.alertIconBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#EA580C" />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>Course Instructor Allocation</Text>
            <Text style={styles.alertBody}>
              {unassignedCourses.length > 1
                ? `${firstUnassigned.code} and ${unassignedCourses.length - 1} other course(s) need faculty allocation.`
                : `${firstUnassigned.code} (${firstUnassigned.name}) currently has no assigned instructor.`}
            </Text>
          </View>
          <View style={styles.alertActionBtn}>
            <Text style={styles.alertActionText}>Assign</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#C2410C" />
          </View>
        </TouchableOpacity>
      )}

      {/* Actionable Alert Banner: Attendance / Hall Ticket Shortage */}
      {pendingDetentions.length > 0 && (
        <TouchableOpacity
          style={styles.detentionAlertCard}
          onPress={() => onNavigateTab('eligibility')}
          activeOpacity={0.8}
        >
          <View style={[styles.alertIconBox, { backgroundColor: '#FEE2E2' }]}>
            <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#DC2626" />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={[styles.alertTitle, { color: '#991B1B' }]}>
              {pendingDetentions.length} Students Below 75% Attendance Bar
            </Text>
            <Text style={styles.alertBody}>
              Semester examination hall tickets withheld. Condonation endorsements required before deadline.
            </Text>
          </View>
          <View style={[styles.alertActionBtn, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.alertActionText, { color: '#B91C1C' }]}>Review</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#B91C1C" />
          </View>
        </TouchableOpacity>
      )}

      {/* Department Pulse Card */}
      <View style={styles.pulseCard}>
        <View style={styles.pulseHeader}>
          <View>
            <Text style={styles.pulseTitle}>Department Operational Pulse</Text>
            <Text style={styles.pulseSub}>Live curriculum progress & faculty deployment</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>ACTIVE</Text>
          </View>
        </View>

        {/* Progress Meters */}
        <View style={styles.meterContainer}>
          <View style={styles.meterRow}>
            <View style={styles.meterInfo}>
              <Text style={styles.meterLabel}>Average Syllabus Completion</Text>
              <Text style={styles.meterValue}>{kpis.averageSyllabusProgress}%</Text>
            </View>
            <View style={styles.meterTrack}>
              <View
                style={[
                  styles.meterFill,
                  { width: `${Math.min(100, kpis.averageSyllabusProgress)}%`, backgroundColor: '#EA580C' },
                ]}
              />
            </View>
          </View>

          <View style={styles.meterRow}>
            <View style={styles.meterInfo}>
              <Text style={styles.meterLabel}>Faculty On Duty Today</Text>
              <Text style={styles.meterValue}>
                {kpis.facultyOnDuty} / {kpis.totalFaculty}
              </Text>
            </View>
            <View style={styles.meterTrack}>
              <View
                style={[
                  styles.meterFill,
                  {
                    width: `${Math.round((kpis.facultyOnDuty / (kpis.totalFaculty || 1)) * 100)}%`,
                    backgroundColor: '#10B981',
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <View style={styles.kpiIconWrap}>
            <MaterialCommunityIcons name="account-group" size={20} color="#EA580C" />
          </View>
          <Text style={styles.kpiValue}>{kpis.totalStudents}</Text>
          <Text style={styles.kpiLabel}>Enrolled Students</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrap, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="human-male-board" size={20} color="#059669" />
          </View>
          <Text style={styles.kpiValue}>{kpis.totalFaculty}</Text>
          <Text style={styles.kpiLabel}>Faculty Members</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
            <MaterialCommunityIcons name="book-open-variant" size={20} color="#2563EB" />
          </View>
          <Text style={styles.kpiValue}>{kpis.activeCourses}</Text>
          <Text style={styles.kpiLabel}>Active Courses</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrap, { backgroundColor: '#FDF4FF' }]}>
            <MaterialCommunityIcons name="flask-outline" size={20} color="#9333EA" />
          </View>
          <Text style={styles.kpiValue}>{kpis.practicalLabsCount}</Text>
          <Text style={styles.kpiLabel}>Practical Labs</Text>
        </View>
      </View>

      {/* Quick Action Shortcuts */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Executive Shortcuts</Text>
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => onNavigateTab('courses')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FFF7ED' }]}>
              <MaterialCommunityIcons name="book-cog-outline" size={22} color="#EA580C" />
            </View>
            <Text style={styles.actionBtnText}>Curriculum</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => onNavigateTab('faculty')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="account-tie" size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionBtnText}>Workload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => onNavigateTab('eligibility')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FEF2F2' }]}>
              <MaterialCommunityIcons name="card-bulleted-settings-outline" size={22} color="#DC2626" />
            </View>
            <Text style={styles.actionBtnText}>Detentions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={onOpenNoticeModal}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
              <MaterialCommunityIcons name="bullhorn" size={22} color="#059669" />
            </View>
            <Text style={styles.actionBtnText}>Post Memo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Courses Progress Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Course Syllabus Pace</Text>
            <Text style={styles.sectionSub}>Progress metrics for current semester courses</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigateTab('courses')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.coursesList}>
          {activeCoursesPreview.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={styles.courseRow}
              onPress={() => onOpenAssignModal(c)}
              activeOpacity={0.7}
            >
              <View style={styles.courseMain}>
                <View style={styles.courseMeta}>
                  <Text style={styles.courseCode}>{c.code}</Text>
                  <Text style={styles.courseSem}>{c.semester}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {c.type === 'practical_lab' ? 'LAB' : c.type.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.courseName}>{c.name}</Text>
                <Text style={styles.instructorText}>
                  Instructor: <Text style={{ fontWeight: '700', color: '#171717' }}>{c.instructorName || 'Unassigned'}</Text>
                </Text>
              </View>

              <View style={styles.courseProgressWrap}>
                <Text style={styles.progressPct}>{c.syllabusProgressPct}%</Text>
                <View style={styles.miniProgressBar}>
                  <View
                    style={[
                      styles.miniProgressFill,
                      {
                        width: `${c.syllabusProgressPct}%`,
                        backgroundColor: c.syllabusProgressPct >= 70 ? '#10B981' : '#F59E0B',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.hoursText}>
                  {c.completedHours}/{c.totalPlannedHours} hrs
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Critical Detention & Hall Ticket Attention */}
      {criticalCases.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Attendance Detention Flag</Text>
              <Text style={styles.sectionSub}>Students requiring HOD condonation review</Text>
            </View>
            <TouchableOpacity onPress={() => onNavigateTab('eligibility')}>
              <Text style={styles.seeAllText}>Manage All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detentionList}>
            {criticalCases.map((rec) => (
              <TouchableOpacity
                key={rec.id}
                style={styles.detentionRow}
                onPress={() => onOpenEligibilityModal(rec)}
                activeOpacity={0.7}
              >
                <View style={styles.detentionAvatar}>
                  <Text style={styles.avatarLetter}>{rec.studentName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentNameText}>{rec.studentName}</Text>
                  <Text style={styles.usnSub}>
                    USN: {rec.usn} • {rec.semester}
                  </Text>
                  {rec.condonationReason ? (
                    <Text style={styles.reasonPreview} numberOfLines={1}>
                      Grounds: {rec.condonationReason}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.attendanceCol}>
                  <Text style={styles.attendancePctText}>{rec.overallAttendancePct}%</Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          rec.hallTicketStatus === 'detained'
                            ? '#FEE2E2'
                            : '#FEF3C7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color:
                            rec.hallTicketStatus === 'detained'
                              ? '#DC2626'
                              : '#D97706',
                        },
                      ]}
                    >
                      {rec.hallTicketStatus === 'detained' ? 'Detained' : 'Condonation'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Latest Department Circulars */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recent Department Memos</Text>
            <Text style={styles.sectionSub}>Official departmental communications</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigateTab('notices')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noticeList}>
          {notices.slice(0, 2).map((n) => (
            <View key={n.id} style={styles.noticeItem}>
              <View style={styles.noticeTop}>
                <View
                  style={[
                    styles.priorityTag,
                    {
                      backgroundColor:
                        n.priority === 'urgent'
                          ? '#FEE2E2'
                          : n.priority === 'important'
                          ? '#FEF3C7'
                          : '#ECFDF5',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityTagText,
                      {
                        color:
                          n.priority === 'urgent'
                            ? '#DC2626'
                            : n.priority === 'important'
                            ? '#D97706'
                            : '#059669',
                      },
                    ]}
                  >
                    {n.priority.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.noticeDate}>{n.publishedDate}</Text>
              </View>
              <Text style={styles.noticeTitle}>{n.title}</Text>
              <Text style={styles.noticeContent} numberOfLines={2}>
                {n.content}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: BorderRadius.card,
    padding: 14,
    gap: 12,
  },
  detentionAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.card,
    padding: 14,
    gap: 12,
  },
  alertIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
    fontFamily: FontFamily.poppins,
  },
  alertBody: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
    fontFamily: FontFamily.poppins,
  },
  alertActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  alertActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
    fontFamily: FontFamily.poppins,
  },
  pulseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pulseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  pulseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  pulseSub: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
    fontFamily: FontFamily.poppins,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    fontFamily: FontFamily.poppins,
  },
  meterContainer: {
    gap: 12,
  },
  meterRow: {
    gap: 6,
  },
  meterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meterLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
    fontFamily: FontFamily.poppins,
  },
  meterValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  meterTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
    fontFamily: FontFamily.poppins,
  },
  quickActionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  quickActionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    fontFamily: FontFamily.poppins,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  sectionSub: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 1,
    fontFamily: FontFamily.poppins,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    fontFamily: FontFamily.poppins,
  },
  coursesList: {
    gap: 10,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 10,
  },
  courseMain: {
    flex: 1,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA580C',
    fontFamily: FontFamily.poppins,
  },
  courseSem: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  typeBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#374151',
    fontFamily: FontFamily.poppins,
  },
  courseName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  instructorText: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
    fontFamily: FontFamily.poppins,
  },
  courseProgressWrap: {
    alignItems: 'flex-end',
    width: 75,
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  miniProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginVertical: 4,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  hoursText: {
    fontSize: 9,
    color: '#9CA3AF',
    fontFamily: FontFamily.poppins,
  },
  detentionList: {
    gap: 8,
  },
  detentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 10,
  },
  detentionAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FontFamily.poppins,
  },
  studentNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  usnSub: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  reasonPreview: {
    fontSize: 10,
    color: '#92400E',
    marginTop: 2,
    fontFamily: FontFamily.poppins,
  },
  attendanceCol: {
    alignItems: 'flex-end',
  },
  attendancePctText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: FontFamily.poppins,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FontFamily.poppins,
  },
  noticeList: {
    gap: 8,
  },
  noticeItem: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  noticeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityTagText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FontFamily.poppins,
  },
  noticeDate: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: FontFamily.poppins,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.poppins,
    marginBottom: 2,
  },
  noticeContent: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
});
