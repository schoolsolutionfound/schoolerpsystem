import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { usePlacementStore } from '../store/usePlacementStore';
import { CandidateApplication, ApplicationStatus } from '../types/placement';

export const CandidatePipelineView: React.FC = () => {
  const applications = usePlacementStore((s) => s.applications);
  const updateApplicationStatus = usePlacementStore((s) => s.updateApplicationStatus);
  const scheduleInterview = usePlacementStore((s) => s.scheduleInterview);

  const [activeFilter, setActiveFilter] = useState<'all' | ApplicationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<CandidateApplication | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Schedule Interview Form
  const [roundName, setRoundName] = useState('Technical Round 1');
  const [interviewDate, setInterviewDate] = useState('12 Sep 2026');
  const [interviewTime, setInterviewTime] = useState('02:30 PM');
  const [interviewLink, setInterviewLink] = useState('https://meet.google.com/xyz-abc');

  // Offer Form
  const [offerCTC, setOfferCTC] = useState('28.5 LPA');
  const [offerNotes, setOfferNotes] = useState('Cleared all rounds with distinction.');

  const filteredApps = applications.filter((a) => {
    if (activeFilter !== 'all' && a.status !== activeFilter) return false;
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      a.studentName.toLowerCase().includes(q) ||
      a.companyName.toLowerCase().includes(q) ||
      a.roleTitle.toLowerCase().includes(q) ||
      a.branch.toLowerCase().includes(q)
    );
  });

  const handleOpenSchedule = (app: CandidateApplication) => {
    setSelectedApp(app);
    setRoundName('Technical Interview');
    setInterviewDate('12 Sep 2026');
    setInterviewTime('11:00 AM');
    setInterviewLink('https://meet.google.com/xyz-placement');
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = () => {
    if (!selectedApp) return;
    const slotString = `${interviewDate}, ${interviewTime} (${interviewLink})`;
    scheduleInterview(selectedApp.id, slotString, roundName);
    Alert.alert(
      'Interview Scheduled',
      `Interview scheduled for ${selectedApp.studentName} with ${selectedApp.companyName}.`
    );
    setShowScheduleModal(false);
  };

  const handleOpenOffer = (app: CandidateApplication) => {
    setSelectedApp(app);
    setOfferCTC('32.0 LPA');
    setShowOfferModal(true);
  };

  const handleConfirmOffer = () => {
    if (!selectedApp) return;
    updateApplicationStatus(selectedApp.id, {
      status: 'offered',
      currentRound: 'Offer Extended',
      offerCTC,
      notes: offerNotes,
    });
    Alert.alert(
      'Offer Issued!',
      `Official offer letter recorded for ${selectedApp.studentName} at ${selectedApp.companyName} (${offerCTC}).`
    );
    setShowOfferModal(false);
  };

  const handleShortlist = (app: CandidateApplication) => {
    updateApplicationStatus(app.id, {
      status: 'shortlisted',
      currentRound: 'Shortlisted for Assessment',
    });
    Alert.alert('Candidate Shortlisted', `${app.studentName} marked as Shortlisted.`);
  };

  const handleReject = (app: CandidateApplication) => {
    Alert.alert('Reject Application', `Mark application for ${app.studentName} as Rejected?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          updateApplicationStatus(app.id, {
            status: 'rejected',
            notes: 'Did not clear current evaluation stage.',
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Top Search Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search candidate by name, company, branch..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Pipeline Status Filter */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {[
            { label: 'All Applicants', value: 'all', count: applications.length },
            {
              label: 'Shortlisted',
              value: 'shortlisted',
              count: applications.filter((a) => a.status === 'shortlisted').length,
            },
            {
              label: 'Interview',
              value: 'interview_scheduled',
              count: applications.filter((a) => a.status === 'interview_scheduled').length,
            },
            {
              label: 'Offered',
              value: 'offered',
              count: applications.filter((a) => a.status === 'offered').length,
            },
            {
              label: 'Rejected',
              value: 'rejected',
              count: applications.filter((a) => a.status === 'rejected').length,
            },
          ].map((f) => {
            const isSelected = activeFilter === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[styles.filterTab, isSelected && styles.filterTabActive]}
                onPress={() => setActiveFilter(f.value as any)}
              >
                <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                  {f.label} ({f.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Candidate Pipeline List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filteredApps.map((app) => {
          const isOffered = app.status === 'offered';
          const isInterview = app.status === 'interview_scheduled';
          const isShortlisted = app.status === 'shortlisted';
          const isRejected = app.status === 'rejected';

          return (
            <View key={app.id} style={styles.appCard}>
              <View style={styles.appHeader}>
                <View style={styles.candidateGroup}>
                  <View style={styles.candidateAvatar}>
                    <Text style={styles.avatarText}>{app.studentName.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.candidateName}>{app.studentName}</Text>
                    <Text style={styles.candidateBranch}>
                      {app.branch} • Roll #{app.rollNo} • GPA: {app.percentage}%
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isOffered
                      ? styles.badgeOffered
                      : isInterview
                      ? styles.badgeInterview
                      : isShortlisted
                      ? styles.badgeShortlisted
                      : isRejected
                      ? styles.badgeRejected
                      : styles.badgeApplied,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isOffered
                        ? { color: '#059669' }
                        : isInterview
                        ? { color: '#4F46E5' }
                        : isShortlisted
                        ? { color: '#D97706' }
                        : isRejected
                        ? { color: '#DC2626' }
                        : { color: '#64748B' },
                    ]}
                  >
                    {app.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Target Company & Role */}
              <View style={styles.targetRoleBox}>
                <MaterialCommunityIcons name="domain" size={16} color="#059669" />
                <Text style={styles.targetCompanyText}>{app.companyName}</Text>
                <Text style={styles.targetRoleText}>• {app.roleTitle}</Text>
              </View>

              {/* Current Stage / Round */}
              <View style={styles.stageRow}>
                <Text style={styles.stageLabel}>Current Stage:</Text>
                <Text style={styles.stageValue}>{app.currentRound}</Text>
              </View>

              {/* Interview Slot or Offer Package if any */}
              {app.interviewSlot ? (
                <View style={styles.slotBox}>
                  <MaterialCommunityIcons name="calendar-clock" size={14} color="#4F46E5" />
                  <Text style={styles.slotText}>{app.interviewSlot}</Text>
                </View>
              ) : null}

              {app.offerCTC ? (
                <View style={styles.offerBox}>
                  <MaterialCommunityIcons name="seal" size={16} color="#059669" />
                  <Text style={styles.offerText}>Offer Extended: {app.offerCTC}</Text>
                </View>
              ) : null}

              {/* Action Toolbar for TPO */}
              <View style={styles.toolbarRow}>
                {app.status === 'applied' && (
                  <TouchableOpacity
                    style={styles.actionBtnShortlist}
                    onPress={() => handleShortlist(app)}
                  >
                    <Text style={styles.actionTextShortlist}>Shortlist</Text>
                  </TouchableOpacity>
                )}

                {(isShortlisted || app.status === 'applied') && (
                  <TouchableOpacity
                    style={styles.actionBtnSchedule}
                    onPress={() => handleOpenSchedule(app)}
                  >
                    <MaterialCommunityIcons name="calendar-plus" size={14} color="#FFFFFF" />
                    <Text style={styles.actionTextSchedule}>Schedule Interview</Text>
                  </TouchableOpacity>
                )}

                {isInterview && (
                  <TouchableOpacity
                    style={styles.actionBtnOffer}
                    onPress={() => handleOpenOffer(app)}
                  >
                    <MaterialCommunityIcons name="gift-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.actionTextOffer}>Extend Offer</Text>
                  </TouchableOpacity>
                )}

                {!isOffered && !isRejected && (
                  <TouchableOpacity
                    style={styles.actionBtnReject}
                    onPress={() => handleReject(app)}
                  >
                    <Text style={styles.actionTextReject}>Reject</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Schedule Interview Modal */}
      <Modal visible={showScheduleModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Candidate Interview</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedApp && (
              <View>
                <View style={styles.applicantSummary}>
                  <Text style={styles.summaryName}>{selectedApp.studentName}</Text>
                  <Text style={styles.summaryRole}>
                    {selectedApp.companyName} • {selectedApp.roleTitle}
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Interview Round Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Technical Round 1 / System Design"
                  placeholderTextColor="#94A3B8"
                  value={roundName}
                  onChangeText={setRoundName}
                />

                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Date</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="12 Sep 2026"
                      placeholderTextColor="#94A3B8"
                      value={interviewDate}
                      onChangeText={setInterviewDate}
                    />
                  </View>
                  <View style={{ width: 110, marginLeft: 10 }}>
                    <Text style={styles.inputLabel}>Time</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="02:30 PM"
                      placeholderTextColor="#94A3B8"
                      value={interviewTime}
                      onChangeText={setInterviewTime}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Meeting Link / Room</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="https://meet.google.com/..."
                  placeholderTextColor="#94A3B8"
                  value={interviewLink}
                  onChangeText={setInterviewLink}
                />

                <TouchableOpacity
                  style={styles.confirmScheduleBtn}
                  onPress={handleConfirmSchedule}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="calendar-check" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmScheduleText}>Confirm & Send Interview Invite</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Offer Modal */}
      <Modal visible={showOfferModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Extend Placement Offer</Text>
              <TouchableOpacity onPress={() => setShowOfferModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedApp && (
              <View>
                <View style={styles.applicantSummary}>
                  <Text style={styles.summaryName}>{selectedApp.studentName}</Text>
                  <Text style={styles.summaryRole}>
                    {selectedApp.companyName} • {selectedApp.roleTitle}
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Offered CTC Package *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="32.0 LPA"
                  placeholderTextColor="#94A3B8"
                  value={offerCTC}
                  onChangeText={setOfferCTC}
                />

                <Text style={styles.inputLabel}>Evaluation Remarks</Text>
                <TextInput
                  style={[styles.modalInput, { height: 60 }]}
                  placeholder="Notes on performance..."
                  placeholderTextColor="#94A3B8"
                  value={offerNotes}
                  onChangeText={setOfferNotes}
                  multiline
                />

                <TouchableOpacity
                  style={styles.confirmOfferBtn}
                  onPress={handleConfirmOffer}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="trophy" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmOfferText}>Record & Extend Job Offer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { paddingHorizontal: 16, paddingTop: 12 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10 },
  filterTab: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: { backgroundColor: '#059669', borderColor: '#059669' },
  filterTabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  filterTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  candidateGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  candidateAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#059669' },
  candidateName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  candidateBranch: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeOffered: { backgroundColor: '#ECFDF5' },
  badgeInterview: { backgroundColor: '#EEF2FF' },
  badgeShortlisted: { backgroundColor: '#FEF3C7' },
  badgeRejected: { backgroundColor: '#FEE2E2' },
  badgeApplied: { backgroundColor: '#F1F5F9' },
  statusBadgeText: { fontSize: 9, fontWeight: '800' },
  targetRoleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    gap: 6,
  },
  targetCompanyText: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
  targetRoleText: { fontSize: 11, color: '#64748B' },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  stageLabel: { fontSize: 11, color: '#64748B' },
  stageValue: { fontSize: 11, fontWeight: '700', color: '#0F172A' },
  slotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    padding: 6,
    marginBottom: 8,
    gap: 6,
  },
  slotText: { fontSize: 11, color: '#4F46E5', fontWeight: '600' },
  offerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    padding: 6,
    marginBottom: 8,
    gap: 6,
  },
  offerText: { fontSize: 12, color: '#059669', fontWeight: '800' },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 8,
    gap: 8,
  },
  actionBtnShortlist: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionTextShortlist: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  actionBtnSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionTextSchedule: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  actionBtnOffer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  actionTextOffer: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  actionBtnReject: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionTextReject: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  applicantSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  summaryName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  summaryRole: { fontSize: 12, color: '#64748B', marginTop: 2 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 8, marginBottom: 4 },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  formRow: { flexDirection: 'row' },
  confirmScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    gap: 6,
  },
  confirmScheduleText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  confirmOfferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    gap: 6,
  },
  confirmOfferText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
