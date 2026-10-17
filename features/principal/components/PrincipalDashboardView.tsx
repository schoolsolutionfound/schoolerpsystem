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
  PrincipalKPIs,
  PrincipalTab,
  HomeroomSection,
  SchoolNotice,
  CounselingRecord,
} from '../types/principal.types';

interface PrincipalDashboardViewProps {
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

export const PrincipalDashboardView: React.FC<PrincipalDashboardViewProps> = ({
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
  const unassignedSections = homerooms.filter((h) => !h.homeroomTeacherId);
  const firstUnassigned = unassignedSections[0];
  const urgentCases = counseling.filter((c) => c.severity === 'high' && c.status !== 'resolved');

  const safeStudentPct = Math.min(100, Math.max(0, kpis.studentAttendancePct || 0));
  const safeFacultyPct = Math.min(100, Math.max(0, kpis.facultyAttendancePct || 0));
  const safePeriodPct = Math.min(100, Math.max(0, kpis.periodCoveragePct || 0));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D97706']} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1-CLICK CAMPUS MASTER DOSSIER (All details in just 1 button press!) */}
      {onOpenDossierModal && (
        <TouchableOpacity
          style={styles.masterDossierCard}
          onPress={onOpenDossierModal}
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
              <Text style={styles.masterDossierTitle}>Campus Master Dossier</Text>
              <Text style={styles.masterDossierSub}>Get all institutional details in 1 single tap</Text>
            </View>
          </View>
          <View style={styles.masterDossierArrowWrap}>
            <MaterialCommunityIcons name="arrow-right-bold" size={20} color="#0F172A" />
          </View>
        </TouchableOpacity>
      )}

      {/* EDUCATOR & TEACHING ACCESS (Principals are educators & teachers too!) */}
      <View style={styles.educatorHubCard}>
        <View style={styles.educatorHeaderRow}>
          <View style={styles.educatorTitleWrap}>
            <View style={styles.educatorBadge}>
              <MaterialCommunityIcons name="school" size={13} color="#047857" />
              <Text style={styles.educatorBadgeText}>EDUCATOR PRIVILEGES</Text>
            </View>
            <Text style={styles.educatorCardTitle}>Teaching & Classroom Operations</Text>
            <Text style={styles.educatorCardSub}>As an educator, manage your lectures, timetable, and attendance</Text>
          </View>
        </View>

        <View style={styles.educatorButtonsRow}>
          <TouchableOpacity
            style={[styles.largeEduBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
            onPress={onNavigateToTeacherTimetable}
            activeOpacity={0.8}
          >
            <View style={[styles.largeEduIcon, { backgroundColor: '#DBEAFE' }]}>
              <MaterialCommunityIcons name="calendar-clock" size={22} color="#1D4ED8" />
            </View>
            <View style={styles.largeEduTextWrap}>
              <Text style={[styles.largeEduTitle, { color: '#1E40AF' }]}>My Timetable</Text>
              <Text style={styles.largeEduSub}>Teaching schedule</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.largeEduBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
            onPress={onNavigateToTeacherAttendance}
            activeOpacity={0.8}
          >
            <View style={[styles.largeEduIcon, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="clipboard-check" size={22} color="#15803D" />
            </View>
            <View style={styles.largeEduTextWrap}>
              <Text style={[styles.largeEduTitle, { color: '#166534' }]}>Take Attendance</Text>
              <Text style={styles.largeEduSub}>Mark class roster</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.switchTeacherPortalBtn}
          onPress={onSwitchToTeacherPortal}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="account-convert" size={18} color="#FFFFFF" />
          <Text style={styles.switchTeacherPortalText}>Switch to Classroom Teacher Portal</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      {/* Alert Banners (Actionable) */}
      {firstUnassigned && (
        <TouchableOpacity
          style={styles.alertCard}
          onPress={() => onOpenAssignModal(firstUnassigned)}
          activeOpacity={0.8}
        >
          <View style={styles.alertIconBox}>
            <MaterialCommunityIcons name="alert-decagram" size={24} color="#D97706" />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>
              {unassignedSections.length > 1
                ? `${unassignedSections.length} Classes Need Homeroom Mentors`
                : 'Homeroom Attention Required'}
            </Text>
            <Text style={styles.alertBody}>
              {unassignedSections.length > 1
                ? `${firstUnassigned.name} and ${unassignedSections.length - 1} other section(s) have no assigned Class Teacher.`
                : `${firstUnassigned.name} currently has no assigned Class Teacher.`}
            </Text>
          </View>
          <View style={styles.alertActionBtn}>
            <Text style={styles.alertActionText}>Assign Now</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#B45309" />
          </View>
        </TouchableOpacity>
      )}

      {/* Attendance & Period Coverage Pulse */}
      <View style={styles.pulseCard}>
        <View style={styles.pulseHeader}>
          <View>
            <Text style={styles.pulseTitle}>Today&apos;s Operational Pulse</Text>
            <Text style={styles.pulseSub}>Live campus attendance & teacher deployment</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.barsContainer}>
          {/* Student Attendance Bar */}
          <View style={styles.barGroup}>
            <View style={styles.barHeader}>
              <View style={styles.barLabelRow}>
                <MaterialCommunityIcons name="account-school" size={16} color="#0284C7" />
                <Text style={styles.barLabel}>Student Attendance</Text>
              </View>
              <Text style={styles.barPercent}>{safeStudentPct}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${safeStudentPct}%`, backgroundColor: '#0284C7' }]} />
            </View>
            <Text style={styles.barCount}>
              {kpis.presentStudents} present of {kpis.totalStudents} enrolled
            </Text>
          </View>

          {/* Faculty Attendance Bar */}
          <View style={styles.barGroup}>
            <View style={styles.barHeader}>
              <View style={styles.barLabelRow}>
                <MaterialCommunityIcons name="human-male-board" size={16} color="#16A34A" />
                <Text style={styles.barLabel}>Faculty Attendance</Text>
              </View>
              <Text style={styles.barPercent}>{safeFacultyPct}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${safeFacultyPct}%`, backgroundColor: '#16A34A' }]} />
            </View>
            <Text style={styles.barCount}>
              {kpis.presentFaculty} present of {kpis.totalFaculty} staff members
            </Text>
          </View>

          {/* Period Coverage Bar */}
          <View style={styles.barGroup}>
            <View style={styles.barHeader}>
              <View style={styles.barLabelRow}>
                <MaterialCommunityIcons name="clock-check-outline" size={16} color="#D97706" />
                <Text style={styles.barLabel}>Class Period Coverage</Text>
              </View>
              <Text style={styles.barPercent}>{safePeriodPct}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${safePeriodPct}%`, backgroundColor: '#D97706' }]} />
            </View>
            <Text style={styles.barCount}>
              All scheduled instructional blocks covered with substitutes deployed
            </Text>
          </View>
        </View>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        <TouchableOpacity
          style={[styles.kpiCard, { borderLeftColor: '#0284C7' }]}
          onPress={() => onNavigateTab('homerooms')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiTop}>
            <Text style={styles.kpiLabel}>ACTIVE CLASSES</Text>
            <MaterialCommunityIcons name="google-classroom" size={20} color="#0284C7" />
          </View>
          <Text style={styles.kpiValue}>{kpis.activeSections}</Text>
          <Text style={styles.kpiFoot}>Homeroom Sections</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, { borderLeftColor: '#16A34A' }]}
          onPress={() => onNavigateTab('staff')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiTop}>
            <Text style={styles.kpiLabel}>TOTAL FACULTY</Text>
            <MaterialCommunityIcons name="badge-account-outline" size={20} color="#16A34A" />
          </View>
          <Text style={styles.kpiValue}>{kpis.totalFaculty}</Text>
          <Text style={styles.kpiFoot}>Teachers & Counselors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, { borderLeftColor: '#9D174D' }]}
          onPress={() => onNavigateTab('counseling')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiTop}>
            <Text style={styles.kpiLabel}>GUIDANCE CASES</Text>
            <MaterialCommunityIcons name="heart-pulse" size={20} color="#9D174D" />
          </View>
          <Text style={styles.kpiValue}>{kpis.counselingCasesActive}</Text>
          <Text style={styles.kpiFoot}>
            {urgentCases.length > 0 ? `⚠️ ${urgentCases.length} high priority` : 'Active pastoral cases'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, { borderLeftColor: '#D97706' }]}
          onPress={() => onNavigateTab('notices')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiTop}>
            <Text style={styles.kpiLabel}>CIRCULARS</Text>
            <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#D97706" />
          </View>
          <Text style={styles.kpiValue}>{notices.length}</Text>
          <Text style={styles.kpiFoot}>Official Notices Live</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Executive Actions */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>EXECUTIVE ACTIONS</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => onNavigateTab('homerooms')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="account-tie" size={22} color="#0284C7" />
            </View>
            <Text style={styles.actionTileTitle}>Homeroom Roster</Text>
            <Text style={styles.actionTileSub}>Assign class teachers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => onNavigateTab('staff')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
              <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#16A34A" />
            </View>
            <Text style={styles.actionTileTitle}>Staff Directory</Text>
            <Text style={styles.actionTileSub}>Designations & contact</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={onOpenNoticeModal}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="bullhorn" size={22} color="#D97706" />
            </View>
            <Text style={styles.actionTileTitle}>Publish Circular</Text>
            <Text style={styles.actionTileSub}>To campus or faculty</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => onNavigateTab('attendance')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#F3E8FF' }]}>
              <MaterialCommunityIcons name="chart-box-outline" size={22} color="#7E22CE" />
            </View>
            <Text style={styles.actionTileTitle}>Attendance Deep-dive</Text>
            <Text style={styles.actionTileSub}>Daily reports & logs</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent School Notices Snippet */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>ACTIVE CIRCULARS & NOTICES</Text>
          <TouchableOpacity onPress={() => onNavigateTab('notices')}>
            <Text style={styles.seeAllText}>View All ({notices.length})</Text>
          </TouchableOpacity>
        </View>

        {notices.length === 0 ? (
          <View style={styles.emptyNoticeSnippet}>
            <MaterialCommunityIcons name="bullhorn-outline" size={24} color="#9CA3AF" />
            <Text style={styles.emptyNoticeText}>No circulars published yet</Text>
            <TouchableOpacity onPress={onOpenNoticeModal} activeOpacity={0.7}>
              <Text style={styles.createNoticeLink}>+ Draft School Circular</Text>
            </TouchableOpacity>
          </View>
        ) : (
          notices.slice(0, 2).map((notice) => (
            <View key={notice.id} style={styles.noticeSnippetCard}>
              <View style={styles.noticeSnippetHeader}>
                <View style={styles.noticeAudiencePill}>
                  <Text style={styles.noticeAudienceText}>{notice.targetAudience.toUpperCase()}</Text>
                </View>
                {notice.priority === 'urgent' && (
                  <View style={styles.urgentPill}>
                    <Text style={styles.urgentText}>URGENT</Text>
                  </View>
                )}
                <Text style={styles.noticeDate}>{notice.publishedDate}</Text>
              </View>
              <Text style={styles.noticeSnippetTitle}>{notice.title}</Text>
              <Text style={styles.noticeSnippetBody} numberOfLines={2}>
                {notice.content}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: BorderRadius.card,
    padding: 12,
    gap: 12,
  },
  alertIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    fontFamily: FontFamily.bold,
  },
  alertBody: {
    fontSize: 12,
    color: '#B45309',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  alertActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 2,
  },
  alertActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    fontFamily: FontFamily.bold,
  },
  masterDossierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
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
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#D97706',
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
    fontSize: 16,
    fontWeight: '800',
    fontFamily: FontFamily.extrabold,
    color: '#FFFFFF',
  },
  masterDossierSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: FontFamily.regular,
  },
  masterDossierArrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  educatorHubCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  educatorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  educatorTitleWrap: {
    flex: 1,
    gap: 2,
  },
  educatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  educatorBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    fontWeight: '800',
    color: '#047857',
  },
  educatorCardTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    fontWeight: '800',
    color: '#0F172A',
  },
  educatorCardSub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: FontFamily.regular,
  },
  educatorButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  largeEduBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  largeEduIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeEduTextWrap: {
    flex: 1,
  },
  largeEduTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
  },
  largeEduSub: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  switchTeacherPortalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 12,
  },
  switchTeacherPortalText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pulseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pulseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pulseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.extrabold,
  },
  pulseSub: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    fontFamily: FontFamily.bold,
  },
  barsContainer: {
    gap: 14,
  },
  barGroup: {
    gap: 4,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  barPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.extrabold,
  },
  track: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  barCount: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.extrabold,
    marginTop: 4,
  },
  kpiFoot: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
  sectionWrap: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B6B6B',
    fontFamily: FontFamily.bold,
    letterSpacing: 0.6,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    fontFamily: FontFamily.bold,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionTile: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionTileTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: FontFamily.bold,
  },
  actionTileSub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: FontFamily.regular,
  },
  noticeSnippetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  noticeSnippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noticeAudiencePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  noticeAudienceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },
  urgentPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  noticeDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  noticeSnippetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  noticeSnippetBody: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    fontFamily: FontFamily.regular,
  },
  emptyNoticeSnippet: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyNoticeText: {
    fontSize: 13,
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
  },
  createNoticeLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    fontFamily: FontFamily.bold,
  },
});
