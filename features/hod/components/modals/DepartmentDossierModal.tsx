import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { BorderRadius } from '../../../../constants/theme';
import { FontFamily } from '../../../../constants/fonts';
import {
  HODKPIs,
  DepartmentCourse,
  HODFacultyMember,
  ExamEligibilityRecord,
  DepartmentNotice,
} from '../../types/hod.types';

interface DepartmentDossierModalProps {
  visible: boolean;
  onClose: () => void;
  kpis: HODKPIs;
  courses: DepartmentCourse[];
  faculty: HODFacultyMember[];
  eligibility: ExamEligibilityRecord[];
  notices: DepartmentNotice[];
  departmentName: string;
  institutionName: string;
  onRefresh?: () => void;
}

export const DepartmentDossierModal: React.FC<DepartmentDossierModalProps> = ({
  visible,
  onClose,
  kpis,
  courses,
  faculty,
  eligibility,
  notices,
  departmentName,
  institutionName,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'faculty' | 'detentions' | 'memos'>('overview');
  const [copied, setCopied] = useState(false);

  const pendingDetentions = eligibility.filter((e) => e.hallTicketStatus !== 'eligible');
  const unassignedCourses = courses.filter((c) => !c.instructorId);

  const handleCopySummary = async () => {
    const summary = `
=============================================
DEPARTMENT EXECUTIVE DOSSIER: ${departmentName.toUpperCase()}
Institution: ${institutionName}
Generated: ${new Date().toLocaleString()}
=============================================

DEPARTMENT OPERATIONAL METRICS:
- Total Enrolled Students: ${kpis.totalStudents}
- Faculty On Duty: ${kpis.facultyOnDuty} / ${kpis.totalFaculty}
- Active Semester Courses: ${kpis.activeCourses}
- Practical Labs Running: ${kpis.practicalLabsCount}
- Average Syllabus Progress: ${kpis.averageSyllabusProgress}%
- Hall Ticket Detentions (<75%): ${kpis.detentionAlertsCount}
- Unallocated Courses: ${unassignedCourses.length}

ACADEMIC COURSES (${courses.length} total):
${courses
  .map(
    (c) =>
      `• [${c.code}] ${c.name} (${c.semester}) - Progress: ${c.syllabusProgressPct}% | Instructor: ${c.instructorName || 'UNASSIGNED'}`
  )
  .join('\n')}

DEPARTMENT FACULTY (${faculty.length} members):
${faculty
  .map(
    (f) =>
      `• ${f.name} (${f.rank ? f.rank.replace('_', ' ') : 'Faculty'}) - Status: ${f.status !== 'on_leave' && f.status !== 'absent' ? 'ON DUTY' : 'LEAVE'} | Workload: ${f.assignedCourses?.length || 0} courses`
  )
  .join('\n')}

DETENTION AT-RISK STUDENTS (${pendingDetentions.length} cases):
${pendingDetentions
  .map(
    (d) =>
      `• ${d.studentName} (${d.usn}) - Attendance: ${d.overallAttendancePct}% | Status: ${d.hallTicketStatus.toUpperCase()}`
  )
  .join('\n')}

RECENT DEPARTMENT MEMOS:
${notices
  .map(
    (n) =>
      `• [${n.priority.toUpperCase()}] ${n.title} (${new Date(n.publishedDate).toLocaleDateString()})`
  )
  .join('\n')}
=============================================
    `.trim();

    try {
      await Clipboard.setStringAsync(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      Alert.alert('Dossier Copied', 'Complete department operational dossier copied to clipboard.');
    } catch {
      Alert.alert('Copy Failed', 'Unable to copy dossier to clipboard.');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.titleWrap}>
              <View style={styles.badgeRow}>
                <View style={styles.deptBadge}>
                  <MaterialCommunityIcons name="domain" size={14} color="#F4C430" />
                  <Text style={styles.deptBadgeText}>{departmentName.toUpperCase()}</Text>
                </View>
                <View style={styles.oneClickBadge}>
                  <MaterialCommunityIcons name="lightning-bolt" size={12} color="#F4C430" />
                  <Text style={styles.oneClickBadgeText}>1-CLICK MASTER DOSSIER</Text>
                </View>
              </View>
              <Text style={styles.modalTitle}>Department Master Dossier</Text>
              <Text style={styles.modalSub}>{institutionName}</Text>
            </View>

            <View style={styles.topActions}>
              {onRefresh && (
                <TouchableOpacity style={styles.iconCircleBtn} onPress={onRefresh} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="refresh" size={20} color="#4B5563" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Copy Dossier Banner */}
          <TouchableOpacity style={styles.copyBanner} onPress={handleCopySummary} activeOpacity={0.85}>
            <View style={styles.copyBannerLeft}>
              <MaterialCommunityIcons
                name={copied ? 'check-circle' : 'clipboard-text-multiple-outline'}
                size={22}
                color="#F4C430"
              />
              <View>
                <Text style={styles.copyBannerTitle}>
                  {copied ? 'Dossier Copied to Clipboard!' : 'Export / Copy Department Dossier'}
                </Text>
                <Text style={styles.copyBannerSub}>
                  One-tap full executive summary for Academic Council & Dean
                </Text>
              </View>
            </View>
            <View style={styles.copyButtonPill}>
              <Text style={styles.copyButtonPillText}>{copied ? 'COPIED' : 'COPY'}</Text>
            </View>
          </TouchableOpacity>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsRowScroll}
            contentContainerStyle={styles.tabsRow}
          >
            {(
              [
                { key: 'overview', label: 'Pulse', icon: 'view-dashboard' },
                { key: 'courses', label: `Courses (${courses.length})`, icon: 'book-open-variant' },
                { key: 'faculty', label: `Faculty (${faculty.length})`, icon: 'human-male-board' },
                { key: 'detentions', label: `Detentions (${pendingDetentions.length})`, icon: 'alert-decagram' },
                { key: 'memos', label: `Memos (${notices.length})`, icon: 'bullhorn-outline' },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabItem, active && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={tab.icon as any}
                    size={16}
                    color={active ? '#F4C430' : '#6B7280'}
                  />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Content Area */}
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'overview' && (
              <View style={styles.tabSection}>
                {/* Critical Highlights */}
                {unassignedCourses.length > 0 && (
                  <View style={[styles.highlightBox, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}>
                    <MaterialCommunityIcons name="alert" size={20} color="#DC2626" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.highlightTitle, { color: '#991B1B' }]}>
                        {unassignedCourses.length} Unallocated Course(s)
                      </Text>
                      <Text style={[styles.highlightSub, { color: '#B91C1C' }]}>
                        {unassignedCourses.map((c) => c.code).join(', ')} require faculty assignment.
                      </Text>
                    </View>
                  </View>
                )}

                {pendingDetentions.length > 0 && (
                  <View style={[styles.highlightBox, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}>
                    <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#DC2626" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.highlightTitle, { color: '#991B1B' }]}>
                        {pendingDetentions.length} Student(s) Below 75% Attendance
                      </Text>
                      <Text style={[styles.highlightSub, { color: '#B91C1C' }]}>
                        Hall tickets withheld. Review medical and condonation requests.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Key Numbers Grid */}
                <Text style={styles.sectionHeader}>DEPARTMENT OPERATIONAL METRICS</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricNum}>{kpis.totalStudents}</Text>
                    <Text style={styles.metricLabel}>Total Enrolled Students</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={[styles.metricNum, { color: '#16A34A' }]}>
                      {kpis.facultyOnDuty} / {kpis.totalFaculty}
                    </Text>
                    <Text style={styles.metricLabel}>Faculty On Duty</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={[styles.metricNum, { color: '#111827' }]}>{kpis.activeCourses}</Text>
                    <Text style={styles.metricLabel}>Active Courses</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={[styles.metricNum, { color: '#111827' }]}>{kpis.practicalLabsCount}</Text>
                    <Text style={styles.metricLabel}>Practical Labs</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={[styles.metricNum, { color: '#111827' }]}>
                      {kpis.averageSyllabusProgress}%
                    </Text>
                    <Text style={styles.metricLabel}>Avg. Syllabus Pace</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={[styles.metricNum, { color: '#DC2626' }]}>
                      {kpis.detentionAlertsCount}
                    </Text>
                    <Text style={styles.metricLabel}>Detention Alerts</Text>
                  </View>
                </View>

                {/* Live Curriculum Meter */}
                <Text style={styles.sectionHeader}>CURRICULUM SYLLABUS METER</Text>
                <View style={styles.meterContainer}>
                  <View style={styles.meterRow}>
                    <Text style={styles.meterTitle}>Average Syllabus Progress</Text>
                    <Text style={styles.meterVal}>{kpis.averageSyllabusProgress}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, kpis.averageSyllabusProgress)}%`,
                          backgroundColor: '#F4C430',
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'courses' && (
              <View style={styles.tabSection}>
                <Text style={styles.sectionHeader}>SEMESTER COURSES & SYLLABUS PACE</Text>
                {courses.map((course) => (
                  <View key={course.id} style={styles.itemRow}>
                    <View style={styles.itemIconWrap}>
                      <MaterialCommunityIcons name="book-open-outline" size={20} color="#F4C430" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.itemCode}>{course.code}</Text>
                        <View style={styles.semPill}>
                          <Text style={styles.semPillText}>{course.semester}</Text>
                        </View>
                      </View>
                      <Text style={styles.itemTitle}>{course.name}</Text>
                      <Text style={styles.itemSub}>
                        Instructor: <Text style={{ fontFamily: FontFamily.bold, color: '#111827' }}>{course.instructorName || 'Unassigned'}</Text>
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', width: 70 }}>
                      <Text style={styles.progressText}>{course.syllabusProgressPct}%</Text>
                      <View style={styles.tinyProgressBar}>
                        <View
                          style={[
                            styles.tinyProgressFill,
                            {
                              width: `${course.syllabusProgressPct}%`,
                              backgroundColor: course.syllabusProgressPct >= 70 ? '#16A34A' : '#F4C430',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.hoursText}>{course.completedHours}/{course.totalPlannedHours}h</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'faculty' && (
              <View style={styles.tabSection}>
                <Text style={styles.sectionHeader}>DEPARTMENT FACULTY ROSTER</Text>
                {faculty.map((member) => (
                  <View key={member.id} style={styles.itemRow}>
                    <View style={styles.itemIconWrap}>
                      <MaterialCommunityIcons name="human-male-board" size={20} color="#F4C430" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{member.name}</Text>
                      <Text style={styles.itemSub}>{member.rank ? member.rank.replace('_', ' ').toUpperCase() : 'EDUCATOR'}</Text>
                      <Text style={styles.metaSub}>Email: {member.email}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View
                        style={[
                          styles.dutyBadge,
                          {
                            backgroundColor:
                              member.status !== 'on_leave' && member.status !== 'absent'
                                ? '#DCFCE7'
                                : '#FEE2E2',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dutyBadgeText,
                            {
                              color:
                                member.status !== 'on_leave' && member.status !== 'absent'
                                  ? '#166534'
                                  : '#991B1B',
                            },
                          ]}
                        >
                          {member.status !== 'on_leave' && member.status !== 'absent' ? 'ON DUTY' : 'LEAVE'}
                        </Text>
                      </View>
                      <Text style={styles.workloadText}>
                        {member.assignedCourses?.length || 0} active courses
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'detentions' && (
              <View style={styles.tabSection}>
                <Text style={styles.sectionHeader}>STUDENT DETENTION & ATTENDANCE CASES</Text>
                {eligibility.map((rec) => (
                  <View key={rec.id} style={styles.itemRow}>
                    <View style={[styles.itemIconWrap, { backgroundColor: '#FEF2F2' }]}>
                      <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#DC2626" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{rec.studentName}</Text>
                      <Text style={styles.itemSub}>USN: {rec.usn} | Sem {rec.semester}</Text>
                      {rec.condonationReason || rec.remarks ? (
                        <Text style={styles.detentionReason}>Note: {rec.condonationReason || rec.remarks}</Text>
                      ) : null}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={[
                          styles.attendancePct,
                          { color: rec.overallAttendancePct < 75 ? '#DC2626' : '#10B981' },
                        ]}
                      >
                        {rec.overallAttendancePct}%
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
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
                            styles.statusBadgeText,
                            {
                              color:
                                rec.hallTicketStatus === 'eligible'
                                  ? '#166534'
                                  : rec.hallTicketStatus === 'condonation_needed'
                                  ? '#92400E'
                                  : '#991B1B',
                            },
                          ]}
                        >
                          {rec.hallTicketStatus.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'memos' && (
              <View style={styles.tabSection}>
                <Text style={styles.sectionHeader}>DEPARTMENT MEMORANDUMS & NOTICES</Text>
                {notices.map((memo) => (
                  <View key={memo.id} style={styles.memoCard}>
                    <View style={styles.memoHeader}>
                      <View
                        style={[
                          styles.priorityBadge,
                          {
                            backgroundColor:
                              memo.priority === 'urgent'
                                ? '#FEE2E2'
                                : memo.priority === 'important'
                                ? '#FEF3C7'
                                : '#E5E7EB',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityBadgeText,
                            {
                              color:
                                memo.priority === 'urgent'
                                  ? '#991B1B'
                                  : memo.priority === 'important'
                                  ? '#92400E'
                                  : '#374151',
                            },
                          ]}
                        >
                          {memo.priority.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.memoDate}>
                        {new Date(memo.publishedDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.memoTitle}>{memo.title}</Text>
                    <Text style={styles.memoBody}>{memo.content}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer Close */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Close Department Dossier</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    minHeight: '80%',
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  titleWrap: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deptBadgeText: {
    fontSize: 10,
    color: '#F4C430',
    fontFamily: FontFamily.bold,
  },
  oneClickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  oneClickBadgeText: {
    fontSize: 9,
    color: '#F4C430',
    fontFamily: FontFamily.bold,
  },
  modalTitle: {
    fontSize: 20,
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  modalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#111827',
    borderRadius: BorderRadius.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#111827',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  copyBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  copyBannerTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  copyBannerSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  copyButtonPill: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyButtonPillText: {
    fontSize: 11,
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  tabsRowScroll: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 52,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#F4C430',
  },
  tabLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FontFamily.medium,
  },
  tabLabelActive: {
    color: '#F4C430',
    fontFamily: FontFamily.bold,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
    gap: 16,
  },
  tabSection: {
    gap: 12,
  },
  sectionHeader: {
    fontSize: 11,
    color: '#6B7280',
    letterSpacing: 0.8,
    fontFamily: FontFamily.bold,
    marginTop: 4,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
  },
  highlightTitle: {
    fontSize: 14,
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  highlightSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  metricNum: {
    fontSize: 24,
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: FontFamily.medium,
  },
  meterContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 8,
  },
  meterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meterTitle: {
    fontSize: 14,
    color: '#111827',
    fontFamily: FontFamily.semibold,
  },
  meterVal: {
    fontSize: 14,
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCode: {
    fontSize: 11,
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  semPill: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  semPillText: {
    fontSize: 11,
    color: '#374151',
    fontFamily: FontFamily.medium,
  },
  itemTitle: {
    fontSize: 14,
    color: '#111827',
    fontFamily: FontFamily.semibold,
  },
  itemSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  metaSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
    fontFamily: FontFamily.regular,
  },
  progressText: {
    fontSize: 13,
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  tinyProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginVertical: 3,
    overflow: 'hidden',
  },
  tinyProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  hoursText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
  },
  dutyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dutyBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  workloadText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
    fontFamily: FontFamily.regular,
  },
  detentionReason: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  attendancePct: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  memoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.card,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 4,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },
  memoDate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
  },
  memoTitle: {
    fontSize: 14,
    color: '#111827',
    fontFamily: FontFamily.semibold,
  },
  memoBody: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    fontFamily: FontFamily.regular,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  doneBtn: {
    backgroundColor: '#111827',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: FontFamily.semibold,
  },
});
