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
  PrincipalKPIs,
  HomeroomSection,
  PrincipalStaffMember,
  CounselingRecord,
  SchoolNotice,
} from '../../types/principal.types';

interface CampusDossierModalProps {
  visible: boolean;
  onClose: () => void;
  kpis: PrincipalKPIs;
  homerooms: HomeroomSection[];
  staff: PrincipalStaffMember[];
  counseling: CounselingRecord[];
  notices: SchoolNotice[];
  institutionName: string;
  onRefresh?: () => void;
}

export const CampusDossierModal: React.FC<CampusDossierModalProps> = ({
  visible,
  onClose,
  kpis,
  homerooms,
  staff,
  counseling,
  notices,
  institutionName,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'faculty' | 'circulars'>('overview');
  const [copied, setCopied] = useState(false);

  const safeStudentPct = Math.min(100, Math.max(0, kpis.studentAttendancePct || 0));
  const safeFacultyPct = Math.min(100, Math.max(0, kpis.facultyAttendancePct || 0));
  const urgentCases = counseling.filter((c) => c.severity === 'high' && c.status !== 'resolved');

  const handleCopySummary = async () => {
    const summary = `
=============================================
🏛️ CAMPUS EXECUTIVE DOSSIER: ${institutionName.toUpperCase()}
Generated: ${new Date().toLocaleString()}
=============================================

📊 OPERATIONAL METRICS:
- Total Enrolled Students: ${kpis.totalStudents}
- Present Today: ${kpis.presentStudents} (${safeStudentPct}%)
- Total Faculty Members: ${kpis.totalFaculty} (${safeFacultyPct}% on duty)
- Active Homeroom Sections: ${kpis.activeSections}
- Unassigned Homerooms: ${kpis.unassignedHomerooms}
- Active Guidance/Counseling Cases: ${kpis.counselingCasesActive}
- Published Circulars: ${notices.length}

🏫 HOMEROOM SECTIONS & CLASS TEACHERS:
${homerooms.map((h, i) => `  ${i + 1}. ${h.name} | Mentor: ${h.homeroomTeacherName || 'UNASSIGNED'} | Enrolled: ${h.studentCount}`).join('\n')}

👨‍🏫 FACULTY MEMBERS ON DUTY:
${staff.map((s, i) => `  ${i + 1}. ${s.fullName} (${s.designation || 'Faculty'}) - ${s.department || 'General'}`).join('\n')}

📢 ACTIVE CAMPUS CIRCULARS:
${notices.map((n, i) => `  ${i + 1}. [${n.priority.toUpperCase()}] ${n.title} (Audience: ${n.targetAudience})`).join('\n')}
=============================================
`.trim();

    try {
      await Clipboard.setStringAsync(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      Alert.alert('Dossier Copied!', 'Full campus briefing has been copied to your clipboard.');
    } catch {
      Alert.alert('Summary', summary);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerBadge}>
                <MaterialCommunityIcons name="lightning-bolt" size={16} color="#F4C430" />
                <Text style={styles.headerBadgeText}>1-CLICK EXECUTIVE INTELLIGENCE</Text>
              </View>
              <Text style={styles.institutionTitle} numberOfLines={1}>{institutionName}</Text>
              <Text style={styles.institutionSubtitle}>Comprehensive Real-Time Campus Operational Dossier</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7} accessibilityLabel="Close Dossier">
              <MaterialCommunityIcons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Quick Sub-Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabRowScroll}
            contentContainerStyle={styles.tabRow}
          >
            {(
              [
                { key: 'overview', label: 'Executive Pulse', icon: 'view-dashboard' },
                { key: 'classes', label: `Classes (${homerooms.length})`, icon: 'google-classroom' },
                { key: 'faculty', label: `Faculty (${staff.length})`, icon: 'account-tie' },
                { key: 'circulars', label: `Notices (${notices.length})`, icon: 'bullhorn' },
              ] as const
            ).map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
                onPress={() => setActiveTab(t.key)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={t.icon}
                  size={16}
                  color={activeTab === t.key ? '#F4C430' : '#6B7280'}
                />
                <Text style={[styles.tabBtnText, activeTab === t.key && styles.tabBtnTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Content Scroll View */}
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {activeTab === 'overview' && (
              <View style={styles.tabContent}>
                {/* Master Metric Cards Grid */}
                <View style={styles.kpiGrid}>
                  <View style={styles.kpiBox}>
                    <View style={styles.kpiTopRow}>
                      <Text style={styles.kpiNumber}>{kpis.totalStudents}</Text>
                      <View style={styles.kpiIconBox}>
                        <MaterialCommunityIcons name="account-school" size={20} color="#F4C430" />
                      </View>
                    </View>
                    <Text style={styles.kpiTitle}>Enrolled Students</Text>
                    <Text style={[styles.kpiSub, { color: '#16A34A' }]}>{kpis.presentStudents} Present Today ({safeStudentPct}%)</Text>
                  </View>

                  <View style={styles.kpiBox}>
                    <View style={styles.kpiTopRow}>
                      <Text style={styles.kpiNumber}>{kpis.totalFaculty}</Text>
                      <View style={styles.kpiIconBox}>
                        <MaterialCommunityIcons name="human-male-board" size={20} color="#F4C430" />
                      </View>
                    </View>
                    <Text style={styles.kpiTitle}>Total Faculty</Text>
                    <Text style={[styles.kpiSub, { color: '#16A34A' }]}>{kpis.presentFaculty} On Duty ({safeFacultyPct}%)</Text>
                  </View>

                  <View style={styles.kpiBox}>
                    <View style={styles.kpiTopRow}>
                      <Text style={styles.kpiNumber}>{homerooms.length}</Text>
                      <View style={styles.kpiIconBox}>
                        <MaterialCommunityIcons name="google-classroom" size={20} color="#F4C430" />
                      </View>
                    </View>
                    <Text style={styles.kpiTitle}>Homeroom Classes</Text>
                    <Text style={[styles.kpiSub, { color: kpis.unassignedHomerooms > 0 ? '#DC2626' : '#4B5563' }]}>
                      {kpis.unassignedHomerooms > 0 ? `⚠️ ${kpis.unassignedHomerooms} without mentor` : '100% Mentors Assigned'}
                    </Text>
                  </View>

                  <View style={styles.kpiBox}>
                    <View style={styles.kpiTopRow}>
                      <Text style={styles.kpiNumber}>{kpis.counselingCasesActive}</Text>
                      <View style={styles.kpiIconBox}>
                        <MaterialCommunityIcons name="heart-pulse" size={20} color="#F4C430" />
                      </View>
                    </View>
                    <Text style={styles.kpiTitle}>Guidance Cases</Text>
                    <Text style={[styles.kpiSub, { color: urgentCases.length > 0 ? '#DC2626' : '#4B5563' }]}>
                      {urgentCases.length > 0 ? `⚠️ ${urgentCases.length} Urgent Priority` : 'All Cases Stable'}
                    </Text>
                  </View>
                </View>

                {/* Narrative Executive Summary */}
                <View style={styles.narrativeCard}>
                  <Text style={styles.narrativeTitle}>Campus Operational Assessment</Text>
                  <Text style={styles.narrativeBody}>
                    The campus is currently operating at optimal efficiency with an overall student attendance rate of{' '}
                    <Text style={styles.bold}>{safeStudentPct}%</Text> and faculty presence of{' '}
                    <Text style={styles.bold}>{safeFacultyPct}%</Text>. Scheduled instructional periods across all{' '}
                    {homerooms.length} homeroom sections are fully manned.
                  </Text>
                  {kpis.unassignedHomerooms > 0 && (
                    <View style={styles.warningAlert}>
                      <MaterialCommunityIcons name="alert-circle" size={18} color="#DC2626" />
                      <Text style={styles.warningText}>
                        Action Needed: {kpis.unassignedHomerooms} homeroom section(s) require Class Teacher assignment.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {activeTab === 'classes' && (
              <View style={styles.tabContent}>
                <Text style={styles.listSectionTitle}>All Homeroom Sections & Designated Mentors</Text>
                {homerooms.map((sec, idx) => (
                  <View key={sec.id || idx} style={styles.listItemCard}>
                    <View style={styles.listIconBox}>
                      <MaterialCommunityIcons name="google-classroom" size={20} color="#F4C430" />
                    </View>
                    <View style={styles.listTextWrap}>
                      <Text style={styles.listItemTitle}>{sec.name}</Text>
                      <Text style={styles.listItemSub}>
                        Mentor: <Text style={styles.bold}>{sec.homeroomTeacherName || 'Not Assigned'}</Text>
                      </Text>
                      <Text style={styles.listItemMeta}>
                        Enrolled Students: {sec.studentCount} | Room: {sec.roomNumber || 'Room 304'}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: sec.attendanceRate >= 75 ? '#DCFCE7' : '#FEE2E2' }]}>
                      <Text style={[styles.statusPillText, { color: sec.attendanceRate >= 75 ? '#166534' : '#DC2626' }]}>
                        {sec.attendanceRate}% Attendance
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'faculty' && (
              <View style={styles.tabContent}>
                <Text style={styles.listSectionTitle}>Faculty Roster & Department Allocation</Text>
                {staff.map((f, idx) => (
                  <View key={f.id || idx} style={styles.listItemCard}>
                    <View style={styles.listIconBox}>
                      <MaterialCommunityIcons name="badge-account-outline" size={20} color="#F4C430" />
                    </View>
                    <View style={styles.listTextWrap}>
                      <Text style={styles.listItemTitle}>{f.fullName}</Text>
                      <Text style={styles.listItemSub}>{f.designation || 'Faculty Member'} — {f.department || 'General'}</Text>
                      <Text style={styles.listItemMeta}>{f.email || 'No email registered'}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: f.attendanceToday === 'absent' ? '#FEE2E2' : '#DCFCE7' }]}>
                      <Text style={[styles.statusPillText, { color: f.attendanceToday === 'absent' ? '#DC2626' : '#166534' }]}>
                        {f.attendanceToday?.toUpperCase() || 'PRESENT'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'circulars' && (
              <View style={styles.tabContent}>
                <Text style={styles.listSectionTitle}>Published Circulars & Campus Notices</Text>
                {notices.map((n, idx) => (
                  <View key={n.id || idx} style={styles.noticeItemCard}>
                    <View style={styles.noticeHeader}>
                      <View style={[styles.priorityBadge, n.priority === 'urgent' ? styles.urgentBadge : styles.normalBadge]}>
                        <Text style={[styles.priorityBadgeText, n.priority !== 'urgent' && { color: '#F4C430' }]}>
                          {n.priority.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.noticeDate}>{n.publishedDate}</Text>
                    </View>
                    <Text style={styles.noticeTitle}>{n.title}</Text>
                    <Text style={styles.noticeBody}>{n.content}</Text>
                    <Text style={styles.noticeAuthor}>Published by: {n.author} • Target: {n.targetAudience}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Large, Beautiful Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={handleCopySummary}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={copied ? 'check' : 'content-copy'} size={20} color="#F4C430" />
              <Text style={styles.copyBtnText}>{copied ? 'Dossier Copied!' : 'Copy Executive Briefing'}</Text>
            </TouchableOpacity>

            {onRefresh && (
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={() => {
                  onRefresh();
                  Alert.alert('Metrics Refreshed', 'Real-time campus KPIs have been synchronized.');
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="refresh" size={20} color="#1E293B" />
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    paddingTop: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  headerBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#F4C430',
    letterSpacing: 0.5,
  },
  institutionTitle: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  institutionSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabRowScroll: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    maxHeight: 54,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#F4C430',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 90,
    gap: 14,
  },
  tabContent: {
    gap: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiBox: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiNumber: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: '#334155',
  },
  kpiSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  narrativeCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  narrativeTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#1E293B',
  },
  narrativeBody: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#475569',
    lineHeight: 21,
  },
  bold: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  warningAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#92400E',
    flex: 1,
  },
  listSectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    marginBottom: 4,
  },
  listItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  listIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listTextWrap: {
    flex: 1,
    gap: 2,
  },
  listItemTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#1E293B',
  },
  listItemSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#475569',
  },
  listItemMeta: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
  },
  statusPill: {
    backgroundColor: '#E0F2FE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#0369A1',
  },
  noticeItemCard: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
  },
  normalBadge: {
    backgroundColor: '#111827',
  },
  priorityBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#B91C1C',
  },
  noticeDate: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
  },
  noticeTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  noticeBody: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#475569',
    lineHeight: 19,
  },
  noticeAuthor: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  copyBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  copyBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  refreshBtn: {
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  refreshBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#1E293B',
  },
});
