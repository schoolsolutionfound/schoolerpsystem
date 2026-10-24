import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { HODDepartmentStudent } from '../types/hod.types';

interface HODStudentsViewProps {
  students: HODDepartmentStudent[];
  department?: string;
  refreshing: boolean;
  onRefresh: () => void;
  onNavigateToEligibility?: () => void;
}

const SEMESTER_FILTERS = ['All', 'Semester 1', 'Semester 3', 'Semester 5', 'Semester 7'];

export const HODStudentsView: React.FC<HODStudentsViewProps> = ({
  students = [],
  department = 'Computer Science & Engineering',
  refreshing,
  onRefresh,
  onNavigateToEligibility,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'eligible' | 'risk'>('all');
  const [selectedStudent, setSelectedStudent] = useState<HODDepartmentStudent | null>(null);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Semester filter
      if (selectedSemester !== 'All') {
        if (!s.semester.toLowerCase().includes(selectedSemester.toLowerCase())) return false;
      }

      // Status filter
      if (statusFilter === 'eligible' && s.attendancePct < 75) return false;
      if (statusFilter === 'risk' && s.attendancePct >= 75) return false;

      // Search query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = s.fullName.toLowerCase().includes(q);
        const matchesUsn = s.usn.toLowerCase().includes(q);
        const matchesEmail = s.email.toLowerCase().includes(q);
        const matchesParent = (s.parentName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesUsn && !matchesEmail && !matchesParent) return false;
      }

      return true;
    });
  }, [students, selectedSemester, statusFilter, search]);

  // Overall statistics
  const totalCount = students.length;
  const eligibleCount = students.filter((s) => s.attendancePct >= 75).length;
  const detentionRiskCount = students.filter((s) => s.attendancePct < 75).length;
  const avgCgpa =
    totalCount > 0
      ? (students.reduce((sum, s) => sum + (s.cgpa || 0), 0) / totalCount).toFixed(2)
      : '0.00';

  const handleCall = (phoneNumber: string) => {
    if (!phoneNumber) return;
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const url = Platform.OS === 'web' ? `tel:${cleanNumber}` : `tel:${cleanNumber}`;
    Linking.openURL(url).catch((err) => console.warn('Cannot open phone dialer:', err));
  };

  const handleEmail = (emailAddress: string) => {
    if (!emailAddress) return;
    Linking.openURL(`mailto:${emailAddress}`).catch((err) => console.warn('Cannot open email:', err));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#000000']} tintColor="#000000" />}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Banner */}
      <View style={styles.headerBox}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Department Students</Text>
          <Text style={styles.headerSub}>{department} • Enrolled Students Directory</Text>
        </View>
        {onNavigateToEligibility && (
          <TouchableOpacity
            style={styles.eligibilityShortcutBtn}
            onPress={onNavigateToEligibility}
            activeOpacity={0.85}
          >
            <Feather name="shield" size={14} color="#171717" style={{ marginRight: 6 }} />
            <Text style={styles.eligibilityShortcutBtnText}>Hall Tickets</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Top Summary KPI Row */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{totalCount}</Text>
          <Text style={styles.kpiLabel}>TOTAL STUDENTS</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: '#16A34A' }]}>{eligibleCount}</Text>
          <Text style={styles.kpiLabel}>ELIGIBLE (&gt;75%)</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: '#DC2626' }]}>{detentionRiskCount}</Text>
          <Text style={styles.kpiLabel}>DETENTION RISK</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiVal, { color: '#171717' }]}>{avgCgpa}</Text>
          <Text style={styles.kpiLabel}>DEPT CGPA</Text>
        </View>
      </View>

      {/* 3. Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color="#71717A" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name, USN, or parent..."
            placeholderTextColor="#71717A"
            value={search}
            onChangeText={setSearch}
          />
          {search.trim().length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color="#71717A" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. Semester Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.semesterScroll}
        contentContainerStyle={styles.semesterScrollContent}
      >
        {SEMESTER_FILTERS.map((sem) => {
          const isSelected = selectedSemester === sem;
          return (
            <TouchableOpacity
              key={sem}
              style={[styles.semChip, isSelected && styles.semChipActive]}
              onPress={() => setSelectedSemester(sem)}
              activeOpacity={0.8}
            >
              <Text style={[styles.semChipText, isSelected && styles.semChipTextActive]}>
                {sem}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 5. Status Filter Pills */}
      <View style={styles.statusPillsRow}>
        <TouchableOpacity
          style={[styles.statusPill, statusFilter === 'all' && styles.statusPillActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[styles.statusPillText, statusFilter === 'all' && styles.statusPillTextActive]}>
            All ({students.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusPill, statusFilter === 'eligible' && styles.statusPillActive]}
          onPress={() => setStatusFilter('eligible')}
        >
          <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
          <Text style={[styles.statusPillText, statusFilter === 'eligible' && styles.statusPillTextActive]}>
            Eligible ({eligibleCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statusPill, statusFilter === 'risk' && styles.statusPillActive]}
          onPress={() => setStatusFilter('risk')}
        >
          <View style={[styles.dot, { backgroundColor: '#DC2626' }]} />
          <Text style={[styles.statusPillText, statusFilter === 'risk' && styles.statusPillTextActive]}>
            Detention Risk ({detentionRiskCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 6. Students List */}
      <View style={styles.listSection}>
        <Text style={styles.listSectionCount}>
          Showing {filteredStudents.length} {filteredStudents.length === 1 ? 'Student' : 'Students'}
        </Text>

        {filteredStudents.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-search-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No students found</Text>
            <Text style={styles.emptySub}>
              Try adjusting your search query, semester, or attendance filter.
            </Text>
          </View>
        ) : (
          filteredStudents.map((std) => {
            const isAtRisk = std.attendancePct < 75;
            const badgeBg = isAtRisk ? '#FEE2E2' : '#DCFCE7';
            const badgeText = isAtRisk ? '#DC2626' : '#16A34A';
            const statusLabel =
              std.hallTicketStatus === 'detained'
                ? 'DETAINED'
                : std.hallTicketStatus === 'condonation_needed'
                ? 'CONDONATION'
                : 'ELIGIBLE';

            return (
              <View key={std.id} style={styles.studentCard}>
                {/* Header row */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {std.fullName}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={styles.usnBadge}>
                        <Text style={styles.usnBadgeText}>{std.usn}</Text>
                      </View>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.metaText}>
                        {std.semester} (Sec {std.section})
                      </Text>
                    </View>
                  </View>

                  {/* Attendance Badge */}
                  <View style={[styles.attendanceBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.attendanceVal, { color: badgeText }]}>
                      {std.attendancePct}%
                    </Text>
                    <Text style={[styles.attendanceStatusText, { color: badgeText }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                {/* Info row */}
                <View style={styles.cardBody}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>ACADEMIC CGPA</Text>
                    <Text style={styles.infoVal}>{std.cgpa ? `${std.cgpa} / 10.0` : 'N/A'}</Text>
                  </View>

                  <View style={styles.infoDivider} />

                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>PARENT / GUARDIAN</Text>
                    <Text style={styles.infoVal} numberOfLines={1}>
                      {std.parentName}
                    </Text>
                  </View>

                  <View style={styles.infoDivider} />

                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>BATCH YEAR</Text>
                    <Text style={styles.infoVal}>{std.batchYear}</Text>
                  </View>
                </View>

                {/* Quick actions row */}
                <View style={styles.cardFooter}>
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleCall(std.parentPhone)}
                      activeOpacity={0.8}
                    >
                      <Feather name="phone" size={14} color="#171717" style={{ marginRight: 4 }} />
                      <Text style={styles.actionIconBtnText}>Call Parent</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleEmail(std.email)}
                      activeOpacity={0.8}
                    >
                      <Feather name="mail" size={14} color="#171717" style={{ marginRight: 4 }} />
                      <Text style={styles.actionIconBtnText}>Email</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.dossierBtn}
                    onPress={() => setSelectedStudent(std)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.dossierBtnText}>Full Dossier</Text>
                    <Feather name="chevron-right" size={14} color="#171717" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* 7. Student Dossier Modal */}
      <Modal
        visible={!!selectedStudent}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedStudent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedStudent && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <Text style={styles.modalTitle}>{selectedStudent.fullName}</Text>
                    <Text style={styles.modalSub}>
                      {selectedStudent.usn} • {selectedStudent.semester} (Sec {selectedStudent.section})
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedStudent(null)}
                  >
                    <Feather name="x" size={18} color="#171717" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {/* Attendance & Standing */}
                  <View style={styles.dossierSection}>
                    <Text style={styles.dossierSectionTitle}>Attendance & Academic Standing</Text>
                    <View style={styles.dossierGrid}>
                      <View style={styles.dossierGridItem}>
                        <Text style={styles.dossierGridLabel}>Overall Attendance</Text>
                        <Text
                          style={[
                            styles.dossierGridVal,
                            {
                              color: selectedStudent.attendancePct >= 75 ? '#16A34A' : '#DC2626',
                            },
                          ]}
                        >
                          {selectedStudent.attendancePct}%
                        </Text>
                      </View>
                      <View style={styles.dossierGridItem}>
                        <Text style={styles.dossierGridLabel}>Cumulative GPA</Text>
                        <Text style={styles.dossierGridVal}>{selectedStudent.cgpa} / 10.0</Text>
                      </View>
                      <View style={styles.dossierGridItem}>
                        <Text style={styles.dossierGridLabel}>Hall Ticket Status</Text>
                        <Text style={styles.dossierGridVal}>
                          {selectedStudent.hallTicketStatus.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.dossierGridItem}>
                        <Text style={styles.dossierGridLabel}>Batch Cohort</Text>
                        <Text style={styles.dossierGridVal}>{selectedStudent.batchYear}</Text>
                      </View>
                    </View>

                    {selectedStudent.condonationReason && (
                      <View style={styles.condonationBox}>
                        <Text style={styles.condonationTitle}>Condonation / Medical Note:</Text>
                        <Text style={styles.condonationText}>
                          {selectedStudent.condonationReason}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Student & Parent Contacts */}
                  <View style={styles.dossierSection}>
                    <Text style={styles.dossierSectionTitle}>Contact & Parent Details</Text>
                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierRowLabel}>Parent / Guardian:</Text>
                      <Text style={styles.dossierRowVal}>{selectedStudent.parentName}</Text>
                    </View>
                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierRowLabel}>Parent Phone:</Text>
                      <TouchableOpacity onPress={() => handleCall(selectedStudent.parentPhone)}>
                        <Text style={[styles.dossierRowVal, { color: '#2563EB' }]}>
                          {selectedStudent.parentPhone}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierRowLabel}>Student Phone:</Text>
                      <TouchableOpacity onPress={() => handleCall(selectedStudent.phone)}>
                        <Text style={[styles.dossierRowVal, { color: '#2563EB' }]}>
                          {selectedStudent.phone}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.dossierRow}>
                      <Text style={styles.dossierRowLabel}>Official Email:</Text>
                      <TouchableOpacity onPress={() => handleEmail(selectedStudent.email)}>
                        <Text style={[styles.dossierRowVal, { color: '#2563EB' }]}>
                          {selectedStudent.email}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalPrimaryBtn}
                    onPress={() => setSelectedStudent(null)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Close Dossier</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  headerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#171717',
  },
  headerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  eligibilityShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 5,
  },
  eligibilityShortcutBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#171717',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  kpiVal: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#171717',
  },
  kpiLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 8,
    color: '#71717A',
    marginTop: 4,
    textAlign: 'center',
  },
  searchRow: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#171717',
    paddingVertical: 0,
  },
  semesterScroll: {
    marginBottom: 12,
  },
  semesterScrollContent: {
    gap: 8,
  },
  semChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  semChipActive: {
    backgroundColor: '#171717',
    borderColor: '#171717',
  },
  semChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#71717A',
  },
  semChipTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillActive: {
    borderColor: '#171717',
    backgroundColor: '#F4F4F5',
  },
  statusPillText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#71717A',
  },
  statusPillTextActive: {
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  listSection: {},
  listSectionCount: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#71717A',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  studentName: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#171717',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  usnBadge: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  usnBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#171717',
  },
  metaDot: {
    color: '#A1A1AA',
    marginHorizontal: 6,
    fontSize: 10,
  },
  metaText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#71717A',
  },
  attendanceBadge: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 70,
  },
  attendanceVal: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
  },
  attendanceStatusText: {
    fontFamily: FontFamily.bold,
    fontSize: 8,
    marginTop: 1,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  infoCol: {
    flex: 1,
  },
  infoDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E8E5DC',
    marginHorizontal: 8,
  },
  infoLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 8,
    color: '#71717A',
  },
  infoVal: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#171717',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  actionIconBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#171717',
  },
  dossierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dossierBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#171717',
    marginRight: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#171717',
    marginTop: 12,
  },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  modalHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#171717',
  },
  modalSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  dossierSection: {
    marginBottom: 16,
  },
  dossierSectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#171717',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  dossierGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dossierGridItem: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 4,
    padding: 10,
  },
  dossierGridLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#71717A',
  },
  dossierGridVal: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#171717',
    marginTop: 4,
  },
  condonationBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 4,
    padding: 10,
    marginTop: 8,
  },
  condonationTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#92400E',
  },
  condonationText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#92400E',
    marginTop: 2,
  },
  dossierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  dossierRowLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#71717A',
  },
  dossierRowVal: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#171717',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
  },
  modalPrimaryBtn: {
    backgroundColor: '#F4C430',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#171717',
  },
});
