import React, { useState } from 'react';
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
  onOpenDeptDossierModal?: () => void;
  onNavigateToTeacherTimetable?: () => void;
  onNavigateToTeacherAttendance?: () => void;
  onSwitchToTeacherPortal?: () => void;
}

interface DropdownSectionProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  isOpen: boolean;
  onToggle: () => void;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}

const DropdownSection: React.FC<DropdownSectionProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  iconBg,
  badge,
  badgeColor = '#C2410C',
  badgeBg = '#FFEDD5',
  isOpen,
  onToggle,
  rightAction,
  children,
}) => {
  return (
    <View style={styles.dropdownCard}>
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <View style={[styles.dropdownIconBox, { backgroundColor: iconBg }]}>
          <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
        </View>

        <View style={styles.dropdownTitleWrap}>
          <View style={styles.titleWithBadge}>
            <Text style={styles.dropdownTitle}>{title}</Text>
            {badge && (
              <View style={[styles.dropdownBadgePill, { backgroundColor: badgeBg }]}>
                <Text style={[styles.dropdownBadgeText, { color: badgeColor }]}>{badge}</Text>
              </View>
            )}
          </View>
          {subtitle ? <Text style={styles.dropdownSubtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.dropdownRightWrap}>
          {rightAction}
          <View style={styles.chevronBox}>
            <MaterialCommunityIcons
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#4B5563"
            />
          </View>
        </View>
      </TouchableOpacity>

      {isOpen && <View style={styles.dropdownContent}>{children}</View>}
    </View>
  );
};

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
  // Dropdown states for each functional section
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    educator: true,
    intelligence: true,
    pulse: true,
    courses: true,
    detentions: false,
    memos: false,
    actions: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const unassignedCourses = courses.filter((c) => !c.instructorId);
  const firstUnassigned = unassignedCourses[0];
  const pendingDetentions = eligibility.filter((e) => e.hallTicketStatus !== 'eligible');
  const criticalCases = pendingDetentions.slice(0, 3);
  const activeCoursesPreview = courses.slice(0, 4);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. EDUCATOR & TEACHING ACCESS (With Small Side Button) */}
      <DropdownSection
        title="Teaching & Classroom Hub"
        subtitle="As an educator, manage your lectures & schedule"
        icon="school"
        iconColor="#047857"
        iconBg="#ECFDF5"
        badge="EDUCATOR"
        badgeBg="#DCFCE7"
        badgeColor="#15803D"
        isOpen={openSections.educator}
        onToggle={() => toggleSection('educator')}
        rightAction={
          onSwitchToTeacherPortal && (
            <TouchableOpacity
              style={styles.smallSideSwitchBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                onSwitchToTeacherPortal();
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="account-convert" size={13} color="#047857" />
              <Text style={styles.smallSideSwitchText}>Teacher</Text>
            </TouchableOpacity>
          )
        }
      >
        <View style={styles.educatorButtonsRow}>
          <TouchableOpacity
            style={[styles.largeEduBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
            onPress={onNavigateToTeacherTimetable}
            activeOpacity={0.8}
          >
            <View style={[styles.largeEduIcon, { backgroundColor: '#DBEAFE' }]}>
              <MaterialCommunityIcons name="calendar-clock" size={24} color="#1D4ED8" />
            </View>
            <View style={styles.largeEduTextWrap}>
              <Text style={[styles.largeEduTitle, { color: '#1E40AF' }]}>My Timetable</Text>
              <Text style={styles.largeEduSub}>Lecture & teaching schedule</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.largeEduBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
            onPress={onNavigateToTeacherAttendance}
            activeOpacity={0.8}
          >
            <View style={[styles.largeEduIcon, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="clipboard-check" size={24} color="#15803D" />
            </View>
            <View style={styles.largeEduTextWrap}>
              <Text style={[styles.largeEduTitle, { color: '#166534' }]}>Take Attendance</Text>
              <Text style={styles.largeEduSub}>Mark class student roster</Text>
            </View>
          </TouchableOpacity>
        </View>
      </DropdownSection>

      {/* 2. DEPARTMENT MASTER INTELLIGENCE & KEY KPIS */}
      <DropdownSection
        title="Department Master Intelligence"
        subtitle="1-Click comprehensive department dossier"
        icon="lightning-bolt"
        iconColor="#EA580C"
        iconBg="#FFF7ED"
        badge="1-CLICK"
        badgeBg="#FFEDD5"
        badgeColor="#C2410C"
        isOpen={openSections.intelligence}
        onToggle={() => toggleSection('intelligence')}
      >
        {/* 1-Click Master Dossier Launcher */}
        {onOpenDeptDossierModal && (
          <TouchableOpacity
            style={styles.masterDossierCard}
            onPress={onOpenDeptDossierModal}
            activeOpacity={0.85}
          >
            <View style={styles.masterDossierLeft}>
              <View style={styles.masterDossierIconWrap}>
                <MaterialCommunityIcons name="lightning-bolt" size={26} color="#FFFFFF" />
              </View>
              <View style={styles.masterDossierTextWrap}>
                <View style={styles.masterBadgeRow}>
                  <View style={styles.masterDossierBadge}>
                    <Text style={styles.masterDossierBadgeText}>1-CLICK INTELLIGENCE</Text>
                  </View>
                  <Text style={styles.masterLiveText}>• REAL-TIME</Text>
                </View>
                <Text style={styles.masterDossierTitle}>Open Department Dossier</Text>
                <Text style={styles.masterDossierSub}>Get all departmental metrics in 1 single tap</Text>
              </View>
            </View>
            <View style={styles.masterDossierArrowWrap}>
              <MaterialCommunityIcons name="arrow-right-bold" size={20} color="#0F172A" />
            </View>
          </TouchableOpacity>
        )}

        {/* Big KPI Metric Boxes */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconWrap}>
              <MaterialCommunityIcons name="account-group" size={22} color="#EA580C" />
            </View>
            <Text style={styles.kpiValue}>{kpis.totalStudents}</Text>
            <Text style={styles.kpiLabel}>Enrolled Students</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <MaterialCommunityIcons name="human-male-board" size={22} color="#059669" />
            </View>
            <Text style={styles.kpiValue}>{kpis.totalFaculty}</Text>
            <Text style={styles.kpiLabel}>Faculty Members</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="book-open-variant" size={22} color="#2563EB" />
            </View>
            <Text style={styles.kpiValue}>{kpis.activeCourses}</Text>
            <Text style={styles.kpiLabel}>Active Courses</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: '#FDF4FF' }]}>
              <MaterialCommunityIcons name="flask-outline" size={22} color="#9333EA" />
            </View>
            <Text style={styles.kpiValue}>{kpis.practicalLabsCount}</Text>
            <Text style={styles.kpiLabel}>Practical Labs</Text>
          </View>
        </View>
      </DropdownSection>

      {/* 3. TODAY'S OPERATIONAL PULSE */}
      <DropdownSection
        title="Department Operational Pulse"
        subtitle="Live curriculum syllabus progress & faculty deployment"
        icon="chart-line"
        iconColor="#EA580C"
        iconBg="#FFF7ED"
        badge={`${kpis.averageSyllabusProgress}% SYLLABUS`}
        badgeBg="#FFEDD5"
        badgeColor="#C2410C"
        isOpen={openSections.pulse}
        onToggle={() => toggleSection('pulse')}
      >
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
      </DropdownSection>

      {/* 4. CURRICULUM & COURSES PACE */}
      <DropdownSection
        title="Course Syllabus Pace & Allocation"
        subtitle={`${courses.length} Semester courses (${unassignedCourses.length} unassigned)`}
        icon="book-open-page-variant"
        iconColor="#2563EB"
        iconBg="#EFF6FF"
        badge={unassignedCourses.length > 0 ? `${unassignedCourses.length} UNASSIGNED` : 'ALL ALLOCATED'}
        badgeBg={unassignedCourses.length > 0 ? '#FEE2E2' : '#DCFCE7'}
        badgeColor={unassignedCourses.length > 0 ? '#DC2626' : '#166534'}
        isOpen={openSections.courses}
        onToggle={() => toggleSection('courses')}
      >
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
          <TouchableOpacity style={styles.viewMoreRow} onPress={() => onNavigateTab('courses')}>
            <Text style={styles.viewMoreText}>View all {courses.length} courses & syllabus →</Text>
          </TouchableOpacity>
        </View>
      </DropdownSection>

      {/* 5. DETENTIONS & HALL TICKETS */}
      <DropdownSection
        title="Detention & Hall Tickets Bar"
        subtitle={`${pendingDetentions.length} students below 75% attendance`}
        icon="card-account-details-outline"
        iconColor="#DC2626"
        iconBg="#FEF2F2"
        badge={pendingDetentions.length > 0 ? `${pendingDetentions.length} CRITICAL` : undefined}
        badgeBg="#FEE2E2"
        badgeColor="#991B1B"
        isOpen={openSections.detentions}
        onToggle={() => toggleSection('detentions')}
      >
        {criticalCases.length === 0 ? (
          <Text style={styles.emptyText}>All students meet attendance bar for semester exams.</Text>
        ) : (
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
                  <Text style={styles.usnSub}>USN: {rec.usn} • Sem {rec.semester}</Text>
                  {rec.condonationReason ? (
                    <Text style={styles.reasonPreview}>Reason: {rec.condonationReason}</Text>
                  ) : null}
                </View>
                <View style={styles.attendanceCol}>
                  <Text style={styles.attendancePctText}>{rec.overallAttendancePct}%</Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          rec.hallTicketStatus === 'eligible'
                            ? '#DCFCE7'
                            : rec.hallTicketStatus === 'condonation_needed'
                            ? '#FEF3C7'
                            : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color:
                            rec.hallTicketStatus === 'eligible'
                              ? '#166534'
                              : rec.hallTicketStatus === 'condonation_needed'
                              ? '#92400E'
                              : '#DC2626',
                        },
                      ]}
                    >
                      {rec.hallTicketStatus.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.viewMoreRow} onPress={() => onNavigateTab('eligibility')}>
              <Text style={styles.viewMoreText}>Manage all detention & condonation cases →</Text>
            </TouchableOpacity>
          </View>
        )}
      </DropdownSection>

      {/* 6. DEPARTMENT MEMORANDUMS */}
      <DropdownSection
        title="Department Memos & Notices"
        subtitle={`${notices.length} active memos issued to faculty & students`}
        icon="bullhorn-outline"
        iconColor="#059669"
        iconBg="#ECFDF5"
        isOpen={openSections.memos}
        onToggle={() => toggleSection('memos')}
      >
        <View style={styles.noticeList}>
          {notices.length === 0 ? (
            <Text style={styles.emptyText}>No department memos posted yet.</Text>
          ) : (
            notices.slice(0, 3).map((n) => (
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
            ))
          )}
          <TouchableOpacity style={styles.broadcastBtn} onPress={onOpenNoticeModal} activeOpacity={0.8}>
            <MaterialCommunityIcons name="bullhorn" size={18} color="#FFFFFF" />
            <Text style={styles.broadcastBtnText}>Post New Department Memo</Text>
          </TouchableOpacity>
        </View>
      </DropdownSection>

      {/* 7. EXECUTIVE SHORTCUTS */}
      <DropdownSection
        title="Executive Shortcuts & Navigation"
        subtitle="Department curriculum, workload & detentions"
        icon="view-grid-plus-outline"
        iconColor="#EA580C"
        iconBg="#FFF7ED"
        isOpen={openSections.actions}
        onToggle={() => toggleSection('actions')}
      >
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => onNavigateTab('courses')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FFF7ED' }]}>
              <MaterialCommunityIcons name="book-cog-outline" size={26} color="#EA580C" />
            </View>
            <Text style={styles.actionBtnText}>Curriculum</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => onNavigateTab('faculty')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="account-tie" size={26} color="#2563EB" />
            </View>
            <Text style={styles.actionBtnText}>Workload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => onNavigateTab('eligibility')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FEF2F2' }]}>
              <MaterialCommunityIcons name="card-bulleted-settings-outline" size={26} color="#DC2626" />
            </View>
            <Text style={styles.actionBtnText}>Detentions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={onOpenNoticeModal}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
              <MaterialCommunityIcons name="bullhorn" size={26} color="#059669" />
            </View>
            <Text style={styles.actionBtnText}>Post Memo</Text>
          </TouchableOpacity>
        </View>
      </DropdownSection>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEFE',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },

  // Dropdown Card Architecture
  dropdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dropdownIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTitleWrap: {
    flex: 1,
    gap: 2,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  dropdownBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dropdownBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  dropdownSubtitle: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
  },
  dropdownRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevronBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownContent: {
    padding: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 14,
  },

  // Small Side Switch Button
  smallSideSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  smallSideSwitchText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    fontFamily: FontFamily.bold,
  },

  // Educator Action Buttons
  educatorButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  largeEduBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  largeEduIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeEduTextWrap: {
    flex: 1,
  },
  largeEduTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
  },
  largeEduSub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },

  // Master Dossier Banner
  masterDossierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  masterDossierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  masterDossierIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  masterDossierTextWrap: {
    flex: 1,
    gap: 2,
  },
  masterBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  masterDossierBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  masterDossierBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: '#B45309',
  },
  masterLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
  },
  masterDossierTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  masterDossierSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: FontFamily.regular,
  },
  masterDossierArrowWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // KPI Metrics Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  kpiIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
    fontFamily: FontFamily.medium,
  },

  // Operational Pulse Meters
  meterContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 16,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  meterValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  meterTrack: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 5,
  },

  // Alert Card
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  alertIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C2410C',
    fontFamily: FontFamily.bold,
  },
  alertBody: {
    fontSize: 12,
    color: '#EA580C',
    fontFamily: FontFamily.regular,
    marginTop: 2,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
    fontFamily: FontFamily.bold,
  },

  // Course Rows
  coursesList: {
    gap: 10,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
    fontFamily: FontFamily.bold,
  },
  courseSem: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
  },
  typeBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  instructorText: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  courseProgressWrap: {
    alignItems: 'flex-end',
    width: 80,
  },
  progressPct: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  miniProgressBar: {
    width: '100%',
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 2.5,
    marginVertical: 4,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  hoursText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
  },

  // Detention List
  detentionList: {
    gap: 10,
  },
  detentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 10,
  },
  detentionAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  studentNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  usnSub: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
  },
  reasonPreview: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  attendanceCol: {
    alignItems: 'flex-end',
  },
  attendancePctText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: FontFamily.bold,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },

  // Notices List
  noticeList: {
    gap: 10,
  },
  noticeItem: {
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityTagText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  noticeDate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
    marginBottom: 2,
  },
  noticeContent: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: FontFamily.regular,
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    marginTop: 4,
  },
  broadcastBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },

  // Executive Shortcuts Row
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  quickActionBtn: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  actionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: FontFamily.bold,
  },

  // Helper
  viewMoreRow: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
    fontFamily: FontFamily.bold,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 12,
    fontFamily: FontFamily.regular,
  },
});
