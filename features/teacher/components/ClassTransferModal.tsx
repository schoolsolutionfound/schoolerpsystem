import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from './common/Icons';
import { FontFamily } from '../../../constants/fonts';
import {
  useClassTransferStore,
  getTeachersBySubject,
  TeacherDirectoryItem,
  ClassTransferRequest,
} from '../services/classTransferStore';

interface TransferTargetSlot {
  periodId: string;
  periodLabel: string;
  startTime: string;
  endTime: string;
  date: string;
  className: string;
  subject: string;
  room?: string;
}

interface ClassTransferModalProps {
  visible: boolean;
  onClose: () => void;
  targetSlot?: TransferTargetSlot | null;
  currentTeacherName?: string;
}

export const ClassTransferModal: React.FC<ClassTransferModalProps> = ({
  visible,
  onClose,
  targetSlot,
  currentTeacherName = 'You (Teacher)',
}) => {
  const { requests, sendTransferRequest, respondToRequest, cancelTransferRequest } =
    useClassTransferStore();

  // Mode: 'send' (transferring a specific slot) or 'manage' (viewing incoming / outgoing requests)
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent'>('incoming');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [transferReason, setTransferReason] = useState<string>('');
  const [searchTeacher, setSearchTeacher] = useState<string>('');

  // When targetSlot is provided, we default to sending a request for that slot
  const isSendMode = Boolean(targetSlot);

  // Set of teacher IDs and names who have rejected a transfer for this exact slot on this date
  const rejectedTeacherIdentifiers = useMemo(() => {
    if (!targetSlot) return new Set<string>();
    const rejectedSet = new Set<string>();

    requests.forEach((r) => {
      if (r.status !== 'rejected') return;
      if (r.date !== targetSlot.date) return;

      const isSameSlot =
        (r.periodId && targetSlot.periodId && r.periodId === targetSlot.periodId) ||
        (Boolean(r.periodLabel) &&
          Boolean(targetSlot.periodLabel) &&
          r.periodLabel.trim().toLowerCase() === targetSlot.periodLabel.trim().toLowerCase());

      if (isSameSlot) {
        if (r.toTeacherId) rejectedSet.add(r.toTeacherId);
        if (r.toTeacherName) rejectedSet.add(r.toTeacherName.trim().toLowerCase());
      }
    });

    return rejectedSet;
  }, [requests, targetSlot]);

  // Eligible teachers filtered STRICTLY based on the subject of the class
  // AND excluding any teacher who has previously rejected this same timetable slot on this date
  const eligibleTeachers = useMemo(() => {
    if (!targetSlot?.subject) return [];
    const list = getTeachersBySubject(targetSlot.subject);

    // Filter out teachers who previously rejected this slot for this date, and current teacher
    const available = list.filter((t) => {
      if (t.id === 'current-user') return false;
      if (currentTeacherName && t.name.trim().toLowerCase() === currentTeacherName.trim().toLowerCase()) return false;
      if (rejectedTeacherIdentifiers.has(t.id)) return false;
      if (rejectedTeacherIdentifiers.has(t.name.trim().toLowerCase())) return false;
      return true;
    });

    if (!searchTeacher.trim()) return available;
    const q = searchTeacher.toLowerCase();
    return available.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q)
    );
  }, [targetSlot?.subject, targetSlot?.date, targetSlot?.periodId, targetSlot?.periodLabel, searchTeacher, rejectedTeacherIdentifiers, currentTeacherName]);

  const selectedTeacher = useMemo(() => {
    return eligibleTeachers.find((t) => t.id === selectedTeacherId);
  }, [eligibleTeachers, selectedTeacherId]);

  // Outgoing requests sent by this teacher
  const outgoingRequests = useMemo(() => {
    return requests.filter((r) => r.fromTeacherName === currentTeacherName || r.fromTeacherId === 'current-user');
  }, [requests, currentTeacherName]);

  // Incoming requests received by this teacher from other teachers
  const incomingRequests = useMemo(() => {
    return requests.filter((r) => r.toTeacherId === 'current-user' || r.toTeacherName.includes('You'));
  }, [requests]);

  const handleSend = () => {
    if (!targetSlot) return;
    if (!selectedTeacher) {
      Alert.alert('Select Teacher', 'Please choose a substitute teacher for this class transfer.');
      return;
    }

    sendTransferRequest({
      periodId: targetSlot.periodId,
      periodLabel: targetSlot.periodLabel,
      startTime: targetSlot.startTime,
      endTime: targetSlot.endTime,
      date: targetSlot.date,
      className: targetSlot.className,
      subject: targetSlot.subject,
      room: targetSlot.room,
      fromTeacherId: 'current-user',
      fromTeacherName: currentTeacherName,
      toTeacherId: selectedTeacher.id,
      toTeacherName: selectedTeacher.name,
      toTeacherSubject: selectedTeacher.subject,
      reason: transferReason.trim() || 'Requested class coverage',
    });

    Alert.alert(
      'Transfer Request Sent!',
      `Transfer request for ${targetSlot.className} (${targetSlot.subject}) sent to ${selectedTeacher.name}. They will receive a notification to Accept or Reject.`
    );

    setSelectedTeacherId(null);
    setTransferReason('');
    setSearchTeacher('');
    onClose();
  };

  const handleAccept = (req: ClassTransferRequest) => {
    respondToRequest(req.id, 'accepted');
    Alert.alert(
      'Request Accepted',
      `You accepted the class transfer for ${req.className} (${req.subject}). ${req.fromTeacherName} has been updated in their schedule.`
    );
  };

  const handleReject = (req: ClassTransferRequest) => {
    respondToRequest(req.id, 'rejected');
    Alert.alert(
      'Request Declined',
      `You declined the class transfer request from ${req.fromTeacherName}.`
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.cardContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.modalTitle}>
                {isSendMode ? 'Class Transfer' : 'Class Transfer Requests'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {isSendMode
                  ? 'Request another teacher to cover your scheduled class'
                  : 'Manage incoming and sent substitution requests'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {isSendMode && targetSlot ? (
            /* SEND TRANSFER REQUEST VIEW */
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Slot Summary Card */}
              <View style={styles.slotSummaryCard}>
                <View style={styles.slotTopRow}>
                  <View style={styles.slotClassRow}>
                    <Text style={styles.slotClass}>{targetSlot.className}</Text>
                    <View style={styles.subjectBadge}>
                      <Text style={styles.subjectBadgeText}>{targetSlot.subject}</Text>
                    </View>
                  </View>
                  <View style={styles.slotPeriodPill}>
                    <Text style={styles.slotPeriodPillText}>{targetSlot.periodLabel}</Text>
                  </View>
                </View>

                <View style={styles.slotMetaRow}>
                  <View style={styles.slotMetaItem}>
                    <MaterialCommunityIcons name="clock-outline" size={13} color="#4B5563" />
                    <Text style={styles.slotMetaText}>
                      {targetSlot.startTime} - {targetSlot.endTime}
                    </Text>
                  </View>
                  <View style={styles.slotMetaItem}>
                    <MaterialCommunityIcons name="calendar-outline" size={13} color="#4B5563" />
                    <Text style={styles.slotMetaText}>{targetSlot.date}</Text>
                  </View>
                </View>
              </View>

              {/* Subject Filter Notice */}
              <View style={styles.filterNoticeBox}>
                <MaterialCommunityIcons name="filter-variant" size={15} color="#0369A1" />
                <Text style={styles.filterNoticeText}>
                  Showing faculty teaching{' '}
                  <Text style={styles.filterNoticeBold}>{targetSlot.subject}</Text> only.
                </Text>
              </View>

              {/* Previously Declined Filter Notice */}
              {rejectedTeacherIdentifiers.size > 0 && (
                <View style={styles.declinedNoticeBox}>
                  <Feather name="user-x" size={14} color="#B91C1C" />
                  <Text style={styles.declinedNoticeText}>
                    {rejectedTeacherIdentifiers.size === 1
                      ? '1 faculty member who declined this slot is hidden.'
                      : `${rejectedTeacherIdentifiers.size} faculty members who declined this slot are hidden.`}
                  </Text>
                </View>
              )}

              {/* Teacher Search */}
              <View style={styles.teacherSearchBox}>
                <Feather name="search" size={15} color="#9CA3AF" />
                <TextInput
                  style={styles.teacherSearchInput}
                  placeholder={`Search ${targetSlot.subject} teachers...`}
                  placeholderTextColor="#9CA3AF"
                  value={searchTeacher}
                  onChangeText={setSearchTeacher}
                />
                {searchTeacher.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchTeacher('')}>
                    <Feather name="x" size={14} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Teacher List */}
              <Text style={styles.sectionLabel}>Select Substitute Teacher *</Text>
              {eligibleTeachers.length === 0 ? (
                <View style={styles.emptyTeachersBox}>
                  <Text style={styles.emptyTeachersText}>
                    No other teachers found teaching {targetSlot.subject}.
                  </Text>
                </View>
              ) : (
                <View style={styles.teacherList}>
                  {eligibleTeachers.map((t) => {
                    const isSelected = selectedTeacherId === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[
                          styles.teacherCard,
                          isSelected && styles.teacherCardSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setSelectedTeacherId(t.id)}
                      >
                        <View style={styles.teacherCardLeft}>
                          <View
                            style={[
                              styles.teacherAvatarCircle,
                              isSelected && styles.teacherAvatarSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.teacherAvatarText,
                                isSelected && styles.teacherAvatarTextSelected,
                              ]}
                            >
                              {t.name
                                .replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s*/i, '')
                                .slice(0, 2)
                                .toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.teacherInfoWrap}>
                            <Text style={styles.teacherName}>{t.name}</Text>
                            <View style={styles.teacherSubRow}>
                              <Text style={styles.teacherDept}>{t.department}</Text>
                              <Text style={styles.teacherDot}>•</Text>
                              <Text style={styles.teacherAvail}>{t.availability || 'Available'}</Text>
                            </View>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioInnerDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Reason Input */}
              <Text style={styles.sectionLabel}>Reason for Transfer (Optional)</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="e.g., Medical leave, official meeting, family emergency..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={transferReason}
                onChangeText={setTransferReason}
              />

              {/* Action Buttons */}
              <View style={styles.sendActionRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    !selectedTeacherId && styles.sendBtnDisabled,
                  ]}
                  disabled={!selectedTeacherId}
                  onPress={handleSend}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="send-outline" size={16} color="#111827" />
                  <Text style={styles.sendBtnText}>Send Transfer Request</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* MANAGE TRANSFERS HUB VIEW (INCOMING & SENT TABS) */
            <View style={{ flex: 1 }}>
              {/* Tab Selector */}
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[
                    styles.tabItem,
                    activeTab === 'incoming' && styles.tabItemActive,
                  ]}
                  onPress={() => setActiveTab('incoming')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabItemText,
                      activeTab === 'incoming' && styles.tabItemTextActive,
                    ]}
                  >
                    Incoming Requests
                  </Text>
                  {incomingRequests.filter((r) => r.status === 'pending').length > 0 && (
                    <View style={styles.badgeCount}>
                      <Text style={styles.badgeCountText}>
                        {incomingRequests.filter((r) => r.status === 'pending').length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabItem,
                    activeTab === 'sent' && styles.tabItemActive,
                  ]}
                  onPress={() => setActiveTab('sent')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabItemText,
                      activeTab === 'sent' && styles.tabItemTextActive,
                    ]}
                  >
                    My Sent Requests
                  </Text>
                  {outgoingRequests.length > 0 && (
                    <View style={styles.badgeCountNeutral}>
                      <Text style={styles.badgeCountTextNeutral}>
                        {outgoingRequests.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.scrollBody}
                showsVerticalScrollIndicator={false}
              >
                {activeTab === 'incoming' ? (
                  /* INCOMING REQUESTS LIST (WITH ACCEPT & REJECT BUTTONS) */
                  incomingRequests.length === 0 ? (
                    <View style={styles.emptyRequestsBox}>
                      <MaterialCommunityIcons
                        name="inbox-outline"
                        size={40}
                        color="#9CA3AF"
                      />
                      <Text style={styles.emptyTitle}>No Incoming Requests</Text>
                      <Text style={styles.emptySub}>
                        When another teacher asks you to cover their class, it will appear here.
                      </Text>
                    </View>
                  ) : (
                    incomingRequests.map((req) => (
                      <View key={req.id} style={styles.requestCard}>
                        {/* Request Header */}
                        <View style={styles.reqTopRow}>
                          <View style={styles.reqSenderWrap}>
                            <Text style={styles.reqFromLabel}>From</Text>
                            <Text style={styles.reqFromName}>{req.fromTeacherName}</Text>
                          </View>
                          <View
                            style={[
                              styles.statusPill,
                              req.status === 'accepted' && styles.statusPillAccepted,
                              req.status === 'rejected' && styles.statusPillRejected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                req.status === 'accepted' && styles.statusPillTextAccepted,
                                req.status === 'rejected' && styles.statusPillTextRejected,
                              ]}
                            >
                              {req.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        {/* Class Info */}
                        <View style={styles.reqClassBox}>
                          <View style={styles.reqClassHeader}>
                            <Text style={styles.reqClassName}>{req.className}</Text>
                            <View style={styles.subjectBadge}>
                              <Text style={styles.subjectBadgeText}>{req.subject}</Text>
                            </View>
                          </View>
                          <Text style={styles.reqPeriodTime}>
                            {req.periodLabel} • {req.startTime} - {req.endTime}
                          </Text>
                          <Text style={styles.reqDate}>Date: {req.date}</Text>
                        </View>

                        {/* Reason */}
                        {req.reason ? (
                          <View style={styles.reasonQuoteBox}>
                            <Text style={styles.reasonQuoteText}>
                              &ldquo;{req.reason}&rdquo;
                            </Text>
                          </View>
                        ) : null}

                        {/* Accept / Reject Action Buttons for Pending Requests */}
                        {req.status === 'pending' ? (
                          <View style={styles.decisionRow}>
                            <TouchableOpacity
                              style={styles.rejectBtn}
                              onPress={() => handleReject(req)}
                              activeOpacity={0.8}
                            >
                              <Feather name="x" size={16} color="#DC2626" />
                              <Text style={styles.rejectBtnText}>Reject</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.acceptBtn}
                              onPress={() => handleAccept(req)}
                              activeOpacity={0.8}
                            >
                              <Feather name="check" size={16} color="#FFFFFF" />
                              <Text style={styles.acceptBtnText}>Accept</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.resolvedInfoBox}>
                            <Text style={styles.resolvedText}>
                              {req.status === 'accepted'
                                ? '✓ You accepted this class coverage'
                                : '✕ You declined this request'}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))
                  )
                ) : (
                  /* MY SENT REQUESTS LIST (STATUS UPDATES FOR REQUESTED TEACHER) */
                  outgoingRequests.length === 0 ? (
                    <View style={styles.emptyRequestsBox}>
                      <MaterialCommunityIcons
                        name="send-check-outline"
                        size={40}
                        color="#9CA3AF"
                      />
                      <Text style={styles.emptyTitle}>No Sent Requests</Text>
                      <Text style={styles.emptySub}>
                        Tap &ldquo;Class Transfer&rdquo; on any scheduled period to request coverage.
                      </Text>
                    </View>
                  ) : (
                    outgoingRequests.map((req) => (
                      <View key={req.id} style={styles.requestCard}>
                        {/* Header */}
                        <View style={styles.reqTopRow}>
                          <View style={styles.reqSenderWrap}>
                            <Text style={styles.reqFromLabel}>Requested To</Text>
                            <Text style={styles.reqFromName}>{req.toTeacherName}</Text>
                          </View>
                          <View
                            style={[
                              styles.statusPill,
                              req.status === 'accepted' && styles.statusPillAccepted,
                              req.status === 'rejected' && styles.statusPillRejected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                req.status === 'accepted' && styles.statusPillTextAccepted,
                                req.status === 'rejected' && styles.statusPillTextRejected,
                              ]}
                            >
                              {req.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        {/* Class Info */}
                        <View style={styles.reqClassBox}>
                          <View style={styles.reqClassHeader}>
                            <Text style={styles.reqClassName}>{req.className}</Text>
                            <View style={styles.subjectBadge}>
                              <Text style={styles.subjectBadgeText}>{req.subject}</Text>
                            </View>
                          </View>
                          <Text style={styles.reqPeriodTime}>
                            {req.periodLabel} • {req.startTime} - {req.endTime}
                          </Text>
                          <Text style={styles.reqDate}>Date: {req.date}</Text>
                        </View>

                        {/* Live Update Status Banner */}
                        <View
                          style={[
                            styles.statusUpdateBanner,
                            req.status === 'accepted' && styles.statusBannerAccepted,
                            req.status === 'rejected' && styles.statusBannerRejected,
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={
                              req.status === 'accepted'
                                ? 'check-circle'
                                : req.status === 'rejected'
                                ? 'close-circle'
                                : 'clock-outline'
                            }
                            size={16}
                            color={
                              req.status === 'accepted'
                                ? '#059669'
                                : req.status === 'rejected'
                                ? '#DC2626'
                                : '#D97706'
                            }
                          />
                          <Text
                            style={[
                              styles.statusUpdateText,
                              req.status === 'accepted' && { color: '#059669' },
                              req.status === 'rejected' && { color: '#DC2626' },
                            ]}
                          >
                            {req.status === 'accepted'
                              ? `${req.toTeacherName} ACCEPTED your class transfer! Your schedule is updated.`
                              : req.status === 'rejected'
                              ? `${req.toTeacherName} REJECTED this request. You can transfer to another teacher.`
                              : `Waiting for ${req.toTeacherName} to accept or reject.`}
                          </Text>
                        </View>

                        {/* Testing Simulation Shortcuts for Instant Feedback */}
                        {req.status === 'pending' && (
                          <View style={styles.simRow}>
                            <Text style={styles.simLabel}>Demo Simulation:</Text>
                            <TouchableOpacity
                              style={styles.simBtnAccept}
                              onPress={() => {
                                respondToRequest(req.id, 'accepted');
                                Alert.alert('Updated', `${req.toTeacherName} accepted! Check your schedule card.`);
                              }}
                            >
                              <Text style={styles.simBtnTextAccept}>Simulate Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.simBtnReject}
                              onPress={() => {
                                respondToRequest(req.id, 'rejected');
                                Alert.alert(
                                  'Transfer Declined',
                                  `${req.toTeacherName} declined the transfer request. In Schedule, you can tap Transfer again to choose another teacher.`
                                );
                              }}
                            >
                              <Text style={styles.simBtnTextReject}>Simulate Reject</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))
                  )
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxHeight: '90%',
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingVertical: 4,
    gap: 12,
  },

  // Slot summary
  slotSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotClassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotClass: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  subjectBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#1D4ED8',
  },
  slotPeriodPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  slotPeriodPillText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#92400E',
  },
  slotMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  slotMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotMetaText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },

  // Filter notice box
  filterNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  filterNoticeText: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: '#0369A1',
    flex: 1,
  },
  filterNoticeBold: {
    fontFamily: FontFamily.bold,
    color: '#0284C7',
  },
  declinedNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  declinedNoticeText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#B91C1C',
    flex: 1,
  },

  // Search
  teacherSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  teacherSearchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    color: '#0F172A',
    paddingVertical: 0,
  },

  sectionLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#334155',
    marginTop: 4,
  },

  // Teacher list
  teacherList: {
    gap: 8,
  },
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
  },
  teacherCardSelected: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  teacherCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  teacherAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarSelected: {
    backgroundColor: '#0284C7',
  },
  teacherAvatarText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#475569',
  },
  teacherAvatarTextSelected: {
    color: '#FFFFFF',
  },
  teacherInfoWrap: {
    flex: 1,
  },
  teacherName: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  teacherSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  teacherDept: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
  },
  teacherDot: {
    fontSize: 10,
    color: '#94A3B8',
  },
  teacherAvail: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#059669',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#0284C7',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0284C7',
  },
  emptyTeachersBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
  },
  emptyTeachersText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
    textAlign: 'center',
  },

  // Reason
  reasonInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 10,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#0F172A',
    height: 65,
    textAlignVertical: 'top',
  },

  // Actions
  sendActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  sendBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 6,
    backgroundColor: '#F4C430',
  },
  sendBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  sendBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  // Manage tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 10,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#0284C7',
  },
  tabItemText: {
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  tabItemTextActive: {
    fontFamily: FontFamily.bold,
    color: '#0284C7',
  },
  badgeCount: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeCountText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  badgeCountNeutral: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeCountTextNeutral: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#475569',
  },

  // Request Cards
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  reqTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reqSenderWrap: {
    gap: 1,
  },
  reqFromLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  reqFromName: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  statusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusPillAccepted: {
    backgroundColor: '#DCFCE7',
  },
  statusPillRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#D97706',
  },
  statusPillTextAccepted: {
    color: '#15803D',
  },
  statusPillTextRejected: {
    color: '#DC2626',
  },
  reqClassBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 9,
    gap: 3,
  },
  reqClassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqClassName: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  reqPeriodTime: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#475569',
  },
  reqDate: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
  },
  reasonQuoteBox: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    padding: 8,
    borderRadius: 4,
  },
  reasonQuoteText: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: '#78350F',
    fontStyle: 'italic',
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#DC2626',
  },
  acceptBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  acceptBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  resolvedInfoBox: {
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  resolvedText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#475569',
  },

  // Sent updates
  statusUpdateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 6,
  },
  statusBannerAccepted: {
    backgroundColor: '#ECFDF5',
  },
  statusBannerRejected: {
    backgroundColor: '#FEF2F2',
  },
  statusUpdateText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#92400E',
    flex: 1,
  },

  // Simulation
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  simLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.medium,
    color: '#94A3B8',
  },
  simBtnAccept: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  simBtnTextAccept: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#065F46',
  },
  simBtnReject: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  simBtnTextReject: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#991B1B',
  },

  emptyRequestsBox: {
    paddingVertical: 35,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#475569',
  },
  emptySub: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
