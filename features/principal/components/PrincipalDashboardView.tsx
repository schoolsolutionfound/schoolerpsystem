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
}) => {
  const unassignedSection = homerooms.find((h) => !h.homeroomTeacherId);
  const urgentCases = counseling.filter((c) => c.severity === 'high' && c.status !== 'resolved');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D97706']} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Alert Banners (Actionable) */}
      {unassignedSection && (
        <TouchableOpacity
          style={styles.alertCard}
          onPress={() => onOpenAssignModal(unassignedSection)}
          activeOpacity={0.8}
        >
          <View style={styles.alertIconBox}>
            <MaterialCommunityIcons name="alert-decagram" size={24} color="#D97706" />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>Homeroom Attention Required</Text>
            <Text style={styles.alertBody}>
              {unassignedSection.name} currently has no assigned Class Teacher.
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
            <Text style={styles.pulseTitle}>Today's Operational Pulse</Text>
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
              <Text style={styles.barPercent}>{kpis.studentAttendancePct}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${kpis.studentAttendancePct}%`, backgroundColor: '#0284C7' }]} />
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
              <Text style={styles.barPercent}>{kpis.facultyAttendancePct}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${kpis.facultyAttendancePct}%`, backgroundColor: '#16A34A' }]} />
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
              <Text style={styles.barPercent}>{kpis.periodCoveragePct}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${kpis.periodCoveragePct}%`, backgroundColor: '#D97706' }]} />
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

        {notices.slice(0, 2).map((notice) => (
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
        ))}
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
    borderRadius: BorderRadius.card,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionTileTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  actionTileSub: {
    fontSize: 11,
    color: '#6B6B6B',
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
});
