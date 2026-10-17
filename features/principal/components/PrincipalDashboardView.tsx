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
  const [classSearch, setClassSearch] = useState('');
  const [showAllClasses, setShowAllClasses] = useState(false);

  // Filter classes based on search
  const filteredHomerooms = useMemo(() => {
    if (!classSearch.trim()) return homerooms;
    const q = classSearch.toLowerCase().trim();
    return homerooms.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        (h.homeroomTeacherName && h.homeroomTeacherName.toLowerCase().includes(q)) ||
        (h.roomNumber && h.roomNumber.toLowerCase().includes(q))
    );
  }, [homerooms, classSearch]);

  const displayedHomerooms = showAllClasses
    ? filteredHomerooms
    : filteredHomerooms.slice(0, 6);

  // Safe KPI percentages
  const safeStudentPct = Math.min(100, Math.max(0, kpis.studentAttendancePct || 0));
  const safeFacultyPct = Math.min(100, Math.max(0, kpis.facultyAttendancePct || 0));
  const urgentCases = counseling.filter((c) => c.severity === 'high' && c.status !== 'resolved');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D97706']} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. EDUCATOR BANNER WITH COMPACT SWITCH BUTTON */}
      <View style={styles.educatorBar}>
        <View style={styles.educatorLeft}>
          <View style={styles.educatorIconWrap}>
            <MaterialCommunityIcons name="school" size={20} color="#047857" />
          </View>
          <View>
            <Text style={styles.educatorTitle}>Educator Privileges</Text>
            <Text style={styles.educatorSub}>Teach, schedule & take attendance</Text>
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

      {/* Teaching Shortcut Buttons */}
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

      {/* 2. 1-CLICK CAMPUS DOSSIER BUTTON */}
      {onOpenDossierModal && (
        <TouchableOpacity
          style={styles.dossierBanner}
          onPress={onOpenDossierModal}
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
              <Text style={styles.dossierTitle}>Institutional Overview Dossier</Text>
              <Text style={styles.dossierSub}>Press once to inspect all institution details</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="arrow-right-circle" size={28} color="#D97706" />
        </TouchableOpacity>
      )}

      {/* 3. SIMPLIFIED 4-CARD METRIC GRID */}
      <View style={styles.metricsGrid}>
        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: '#0284C7' }]}
          onPress={() => onNavigateTab('homerooms')}
          activeOpacity={0.8}
        >
          <View style={styles.metricCardTop}>
            <Text style={styles.metricLabel}>STUDENTS</Text>
            <MaterialCommunityIcons name="account-school" size={20} color="#0284C7" />
          </View>
          <Text style={styles.metricVal}>{kpis.totalStudents.toLocaleString()}</Text>
          <Text style={styles.metricSub}>{safeStudentPct}% Present Today</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: '#16A34A' }]}
          onPress={() => onNavigateTab('staff')}
          activeOpacity={0.8}
        >
          <View style={styles.metricCardTop}>
            <Text style={styles.metricLabel}>FACULTY</Text>
            <MaterialCommunityIcons name="human-male-board" size={20} color="#16A34A" />
          </View>
          <Text style={styles.metricVal}>{kpis.totalFaculty}</Text>
          <Text style={styles.metricSub}>{safeFacultyPct}% On Duty</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: '#D97706' }]}
          onPress={() => onNavigateTab('homerooms')}
          activeOpacity={0.8}
        >
          <View style={styles.metricCardTop}>
            <Text style={styles.metricLabel}>CLASSES</Text>
            <MaterialCommunityIcons name="google-classroom" size={20} color="#D97706" />
          </View>
          <Text style={styles.metricVal}>{homerooms.length || kpis.activeSections}</Text>
          <Text style={styles.metricSub}>Active Sections (40+ each)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, { borderLeftColor: '#9D174D' }]}
          onPress={() => onNavigateTab('notices')}
          activeOpacity={0.8}
        >
          <View style={styles.metricCardTop}>
            <Text style={styles.metricLabel}>CIRCULARS</Text>
            <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#9D174D" />
          </View>
          <Text style={styles.metricVal}>{notices.length}</Text>
          <Text style={styles.metricSub}>Official Notices</Text>
        </TouchableOpacity>
      </View>

      {/* 4. CLASS-WISE STUDENT ATTENDANCE (PRIMARY FOCUS) */}
      <View style={styles.classAttendanceSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconBox}>
              <MaterialCommunityIcons name="clipboard-text-clock" size={22} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Class-Wise Student Attendance</Text>
              <Text style={styles.sectionSubtitle}>
                Live breakdown per class • Minimum 40 students enrolled per section
              </Text>
            </View>
          </View>
        </View>

        {/* Search / Filter for Classes */}
        <View style={styles.searchBarWrap}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search class name, room, or teacher..."
            placeholderTextColor="#9CA3AF"
            value={classSearch}
            onChangeText={setClassSearch}
          />
          {classSearch.length > 0 && (
            <TouchableOpacity onPress={() => setClassSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Class-wise Attendance Cards */}
        <View style={styles.classListWrap}>
          {displayedHomerooms.map((sec) => {
            const studentCount = sec.studentCount || 40;
            const presentCount =
              sec.presentCount !== undefined
                ? sec.presentCount
                : Math.round(studentCount * 0.92);
            const absentCount = Math.max(0, studentCount - presentCount);
            const attendancePct =
              sec.attendanceRate !== undefined
                ? Math.round(sec.attendanceRate)
                : Math.round((presentCount / studentCount) * 100);

            const isHigh = attendancePct >= 90;
            const isMedium = attendancePct >= 75 && attendancePct < 90;
            const statusColor = isHigh ? '#16A34A' : isMedium ? '#D97706' : '#DC2626';
            const statusBg = isHigh ? '#DCFCE7' : isMedium ? '#FEF3C7' : '#FEE2E2';

            return (
              <View key={sec.id} style={styles.classAttendanceCard}>
                <View style={styles.classCardHeader}>
                  <View style={styles.classTitleWrap}>
                    <View style={styles.classBadge}>
                      <Text style={styles.classBadgeText}>{sec.name}</Text>
                    </View>
                    <Text style={styles.classRoomText}>
                      Room: {sec.roomNumber || 'Main Block'}
                    </Text>
                  </View>

                  <View style={[styles.pctBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.pctBadgeText, { color: statusColor }]}>
                      {attendancePct}% Present
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, attendancePct)}%`, backgroundColor: statusColor },
                    ]}
                  />
                </View>

                {/* Bottom Details Row */}
                <View style={styles.classCardFooter}>
                  <View style={styles.countsRow}>
                    <Text style={styles.enrolledText}>
                      <Text style={styles.boldText}>{studentCount}</Text> Enrolled
                    </Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={[styles.presentText, { color: '#16A34A' }]}>
                      <Text style={styles.boldText}>{presentCount}</Text> Present
                    </Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={[styles.absentText, { color: absentCount > 0 ? '#DC2626' : '#6B7280' }]}>
                      <Text style={styles.boldText}>{absentCount}</Text> Absent
                    </Text>
                  </View>

                  <View style={styles.teacherInfoRow}>
                    <MaterialCommunityIcons name="account-tie" size={14} color="#6B7280" />
                    <Text style={styles.teacherNameText} numberOfLines={1}>
                      {sec.homeroomTeacherName || 'No Class Mentor'}
                    </Text>
                    {!sec.homeroomTeacherId && (
                      <TouchableOpacity
                        style={styles.quickAssignBtn}
                        onPress={() => onOpenAssignModal(sec)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.quickAssignText}>Assign</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}

          {displayedHomerooms.length === 0 && (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="text-box-search-outline" size={36} color="#9CA3AF" />
              <Text style={styles.emptyText}>No classes matched your search "{classSearch}"</Text>
            </View>
          )}

          {/* Toggle View More Classes */}
          {filteredHomerooms.length > 6 && (
            <TouchableOpacity
              style={styles.viewMoreBtn}
              onPress={() => setShowAllClasses((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewMoreBtnText}>
                {showAllClasses
                  ? 'Show Fewer Classes'
                  : `View All ${filteredHomerooms.length} Classes (Class-Wise Attendance)`}
              </Text>
              <MaterialCommunityIcons
                name={showAllClasses ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#0284C7"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 5. QUICK DIRECTORY & ACTIONS (Clean 4-Button Grid) */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.quickActionsTitle}>Executive Shortcuts</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionGridBtn}
            onPress={() => onNavigateTab('homerooms')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="google-classroom" size={22} color="#0284C7" />
            </View>
            <Text style={styles.actionBtnTitle}>All Classes</Text>
            <Text style={styles.actionBtnSub}>{homerooms.length} Sections</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionGridBtn}
            onPress={() => onNavigateTab('staff')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="account-group" size={22} color="#16A34A" />
            </View>
            <Text style={styles.actionBtnTitle}>Faculty Roster</Text>
            <Text style={styles.actionBtnSub}>{kpis.totalFaculty} Educators</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionGridBtn}
            onPress={onOpenNoticeModal}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="bullhorn-outline" size={22} color="#D97706" />
            </View>
            <Text style={styles.actionBtnTitle}>New Circular</Text>
            <Text style={styles.actionBtnSub}>Broadcast</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionGridBtn}
            onPress={() => onNavigateTab('counseling')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FCE7F3' }]}>
              <MaterialCommunityIcons name="heart-pulse" size={22} color="#BE185D" />
            </View>
            <Text style={styles.actionBtnTitle}>Guidance Care</Text>
            <Text style={styles.actionBtnSub}>
              {urgentCases.length > 0 ? `${urgentCases.length} urgent` : 'All quiet'}
            </Text>
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

  // Teaching Shortcuts Row
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
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dossierTextWrap: {
    flex: 1,
  },
  dossierBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(217, 119, 6, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  dossierBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#FBBF24',
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

  // Class Attendance Section
  classAttendanceSection: {
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
    backgroundColor: '#E0F2FE',
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

  // Class List
  classListWrap: {
    gap: 10,
  },
  classAttendanceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  classRoomText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#64748B',
  },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pctBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  classCardFooter: {
    gap: 4,
  },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  enrolledText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#475569',
  },
  presentText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  absentText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  boldText: {
    fontFamily: FontFamily.bold,
  },
  dotSeparator: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  teacherInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  teacherNameText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#64748B',
  },
  quickAssignBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  quickAssignText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#B45309',
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
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  viewMoreBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#0284C7',
  },

  // Quick Actions Section
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
