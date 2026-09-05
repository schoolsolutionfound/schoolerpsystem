import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePlacementStore } from '../../placement/store/usePlacementStore';
import { JobDrive } from '../../placement/types/placement';

interface Props {
  visible: boolean;
  onClose: () => void;
  studentName?: string;
  studentPercentage?: number;
}

export const StudentPlacementModal: React.FC<Props> = ({
  visible,
  onClose,
  studentName = 'Rohan Verma',
  studentPercentage = 91.8,
}) => {
  const drives = usePlacementStore((s) => s.drives);
  const applications = usePlacementStore((s) => s.applications);
  const applyForDrive = usePlacementStore((s) => s.applyForDrive);

  const [activeTab, setActiveTab] = useState<'drives' | 'my_apps'>('drives');

  const myApplications = applications.filter((a) =>
    a.studentName.toLowerCase().includes(studentName.toLowerCase())
  );

  const handleApply = (drive: JobDrive) => {
    if (studentPercentage < drive.minPercentage) {
      Alert.alert(
        'Eligibility Check',
        `This drive requires a minimum of ${drive.minPercentage}% marks. Your current academic aggregate is ${studentPercentage}%.`
      );
      return;
    }

    try {
      applyForDrive({
        driveId: drive.id,
        studentId: 'std-1082',
        studentName,
        rollNo: '14',
        branch: 'Computer Science',
        percentage: studentPercentage,
      });

      Alert.alert(
        'Application Submitted!',
        `You have successfully applied for ${drive.roleTitle} at ${drive.companyName}.`
      );
    } catch (err: any) {
      Alert.alert('Application Status', err.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.logoBadge}>
                <MaterialCommunityIcons name="briefcase-check" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.title}>Career & Placements Hub</Text>
                <Text style={styles.subtitle}>Campus Recruitment 2026-27</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'drives' && styles.tabBtnActive]}
              onPress={() => setActiveTab('drives')}
            >
              <Text style={[styles.tabText, activeTab === 'drives' && styles.tabTextActive]}>
                Active Drives ({drives.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'my_apps' && styles.tabBtnActive]}
              onPress={() => setActiveTab('my_apps')}
            >
              <Text style={[styles.tabText, activeTab === 'my_apps' && styles.tabTextActive]}>
                My Applications ({myApplications.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'drives' ? (
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {drives.map((drive) => {
                const isEligible = studentPercentage >= drive.minPercentage;
                const hasApplied = myApplications.some((a) => a.driveId === drive.id);

                return (
                  <View key={drive.id} style={styles.driveCard}>
                    <View style={styles.driveHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.companyName}>{drive.companyName}</Text>
                        <Text style={styles.roleTitle}>{drive.roleTitle}</Text>
                      </View>
                      <View style={styles.packagePill}>
                        <Text style={styles.packageText}>{drive.packageCTC}</Text>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="map-marker-outline" size={12} color="#64748B" />
                        <Text style={styles.metaText}>{drive.location}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="clock-outline" size={12} color="#64748B" />
                        <Text style={styles.metaText}>Deadline: {drive.applicationDeadline}</Text>
                      </View>
                    </View>

                    <View style={styles.eligibilityRow}>
                      <Text style={styles.eligibilityLabel}>
                        Criteria: Min {drive.minPercentage}% • Your score: {studentPercentage}%
                      </Text>
                      <View
                        style={[
                          styles.eligibilityTag,
                          isEligible ? styles.tagEligible : styles.tagNotEligible,
                        ]}
                      >
                        <Text
                          style={[
                            styles.eligibilityTagText,
                            { color: isEligible ? '#059669' : '#DC2626' },
                          ]}
                        >
                          {isEligible ? 'Eligible ✓' : 'Not Eligible'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardActions}>
                      {hasApplied ? (
                        <View style={styles.appliedPill}>
                          <MaterialCommunityIcons name="check-circle" size={14} color="#059669" />
                          <Text style={styles.appliedText}>Application Submitted</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.applyBtn, !isEligible && { opacity: 0.5 }]}
                          onPress={() => handleApply(drive)}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons name="send" size={14} color="#FFFFFF" />
                          <Text style={styles.applyBtnText}>1-Tap Apply</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              {myApplications.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="folder-text-outline" size={40} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>No Active Applications</Text>
                  <Text style={styles.emptySub}>
                    Browse active campus drives and apply to open positions.
                  </Text>
                </View>
              ) : (
                myApplications.map((app) => {
                  const isOffered = app.status === 'offered';
                  const isInterview = app.status === 'interview_scheduled';

                  return (
                    <View key={app.id} style={styles.myAppCard}>
                      <View style={styles.myAppHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.myAppCompany}>{app.companyName}</Text>
                          <Text style={styles.myAppRole}>{app.roleTitle}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            isOffered
                              ? styles.badgeOffered
                              : isInterview
                              ? styles.badgeInterview
                              : styles.badgeDefault,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isOffered
                                ? { color: '#059669' }
                                : isInterview
                                ? { color: '#4F46E5' }
                                : { color: '#D97706' },
                            ]}
                          >
                            {app.status.replace('_', ' ').toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.currentStageBox}>
                        <Text style={styles.stageTitle}>Current Stage: {app.currentRound}</Text>
                        {app.interviewSlot ? (
                          <View style={styles.interviewSlotBox}>
                            <MaterialCommunityIcons name="calendar-clock" size={14} color="#4F46E5" />
                            <Text style={styles.interviewSlotText}>{app.interviewSlot}</Text>
                          </View>
                        ) : null}
                      </View>

                      {app.offerCTC ? (
                        <View style={styles.offerNoticeBox}>
                          <MaterialCommunityIcons name="trophy" size={16} color="#059669" />
                          <Text style={styles.offerNoticeText}>
                            Offer Letter Extended: {app.offerCTC}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '85%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 11, color: '#64748B' },
  closeBtn: { padding: 4 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#059669' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '800' },
  scrollBody: { flex: 1, paddingBottom: 20 },
  driveCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  driveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  companyName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  roleTitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  packagePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  packageText: { fontSize: 12, fontWeight: '800', color: '#059669' },
  metaRow: { flexDirection: 'row', gap: 12, marginVertical: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#64748B' },
  eligibilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
  },
  eligibilityLabel: { fontSize: 10, color: '#64748B' },
  eligibilityTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagEligible: { backgroundColor: '#ECFDF5' },
  tagNotEligible: { backgroundColor: '#FEF2F2' },
  eligibilityTagText: { fontSize: 9, fontWeight: '800' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  applyBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  appliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  appliedText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, maxWidth: 240 },
  myAppCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  myAppHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  myAppCompany: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  myAppRole: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeOffered: { backgroundColor: '#ECFDF5' },
  badgeInterview: { backgroundColor: '#EEF2FF' },
  badgeDefault: { backgroundColor: '#FEF3C7' },
  statusBadgeText: { fontSize: 9, fontWeight: '800' },
  currentStageBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  stageTitle: { fontSize: 11, fontWeight: '700', color: '#334155' },
  interviewSlotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
    gap: 6,
  },
  interviewSlotText: { fontSize: 11, color: '#4F46E5', fontWeight: '700' },
  offerNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  offerNoticeText: { fontSize: 12, fontWeight: '800', color: '#059669' },
});
