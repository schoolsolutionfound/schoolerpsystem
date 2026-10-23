import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { fetchTeacherTimetableApi } from '../../../api/academics';
import { ClassTransferStore, AVAILABLE_SUBSTITUTE_FACULTY } from '../../shared/services/classTransferStore';
import { SubstituteFaculty } from '../../shared/types/classTransfer.types';
import { AttendanceStore } from '../../shared/services/attendanceStore';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Canonical teacher assigned periods aligned with AttendanceMarkingView
export const CANONICAL_TEACHER_PERIODS = [
  {
    id: 'slot-cse-3a',
    classSectionId: 'cls-cse-3a',
    classSectionName: 'CSE 3rd Year · Sec A',
    subject: { name: 'Data Structures & Algorithms', code: 'CS301' },
    period: { label: '1st', startTime: '09:00 AM', endTime: '09:50 AM' },
  },
  {
    id: 'slot-cse-2b',
    classSectionId: 'cls-cse-2b',
    classSectionName: 'CSE 2nd Year · Sec B',
    subject: { name: 'Database Management Systems', code: 'CS204' },
    period: { label: '2nd', startTime: '10:00 AM', endTime: '10:50 AM' },
  },
  {
    id: 'slot-ece-1a',
    classSectionId: 'cls-ece-1a',
    classSectionName: 'ECE 1st Year · Sec A',
    subject: { name: 'Digital Electronics & Circuits', code: 'EC102' },
    period: { label: '3rd', startTime: '11:15 AM', endTime: '12:05 PM' },
  },
  {
    id: 'slot-aiml-2a',
    classSectionId: 'cls-aiml-2a',
    classSectionName: 'AIML 2nd Year · Sec A',
    subject: { name: 'Machine Learning Fundamentals', code: 'AI201' },
    period: { label: '4th', startTime: '01:00 PM', endTime: '01:50 PM' },
  },
  {
    id: 'slot-cse-4a',
    classSectionId: 'cls-cse-4a',
    classSectionName: 'CSE 4th Year · Sec A',
    subject: { name: 'Cloud Computing & Distributed Systems', code: 'CS402' },
    period: { label: '5th', startTime: '02:00 PM', endTime: '02:50 PM' },
  },
];

interface TeacherTimetableViewProps {
  onOpenAttendance?: (slotId: string, subjectName: string) => void;
  onBack?: () => void;
}

export const TeacherTimetableView: React.FC<TeacherTimetableViewProps> = ({ onOpenAttendance, onBack }) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'day' | 'week'>('day');
  const [weekMap, setWeekMap] = useState<Record<number, any[]>>({});
  const [weekLoading, setWeekLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Transfer Class Feature State (My Schedule Exclusive)
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferringPeriod, setTransferringPeriod] = useState<any>(null);
  const [selectedSubstitute, setSelectedSubstitute] = useState<SubstituteFaculty>(AVAILABLE_SUBSTITUTE_FACULTY[0]);
  const [transferReason, setTransferReason] = useState('');
  const [, setTransferStoreVer] = useState(0);
  const [, setAttendanceStoreVer] = useState(0);

  useEffect(() => {
    const unsubTransfer = ClassTransferStore.subscribe(() => {
      setTransferStoreVer((v) => v + 1);
    });
    const unsubAttendance = AttendanceStore.subscribe(() => {
      setAttendanceStoreVer((v) => v + 1);
    });
    return () => {
      unsubTransfer();
      unsubAttendance();
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTeacherTimetableApi(date);
      if (!res?.periods || res.periods.length === 0) {
        const d = new Date(`${date}T00:00:00Z`);
        const dow = d.getUTCDay();
        setData({
          dayOfWeek: dow || 1,
          periods: CANONICAL_TEACHER_PERIODS,
        });
      } else {
        setData(res);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const shiftDay = (delta: number) => {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  };

  const loadWeek = useCallback(async () => {
    const base = new Date(`${date}T00:00:00Z`);
    const dow = base.getUTCDay();
    const monday = new Date(base);
    monday.setUTCDate(base.getUTCDate() - ((dow + 6) % 7));
    const days = [0, 1, 2, 3, 4].map((i) => {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
    setWeekLoading(true);
    try {
      const results = await Promise.all(days.map((d) => fetchTeacherTimetableApi(d).catch(() => null)));
      const map: Record<number, any[]> = {};
      for (const r of results) {
        if (r?.dayOfWeek !== undefined) map[r.dayOfWeek] = r.periods || [];
      }
      if (Object.keys(map).length === 0 || Object.values(map).every((p) => !p || p.length === 0)) {
        for (let dow = 1; dow <= 5; dow++) {
          map[dow] = CANONICAL_TEACHER_PERIODS;
        }
      }
      setWeekMap(map);
    } finally {
      setWeekLoading(false);
    }
  }, [date]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    if (view === 'week') await loadWeek();
    setRefreshing(false);
  }, [load, loadWeek, view]);

  const switchView = (v: 'day' | 'week') => {
    setView(v);
    if (v === 'week') loadWeek();
  };

  const dayLabel = (() => {
    const d = new Date(`${date}T00:00:00Z`);
    const opts: any = { weekday: 'short', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', opts);
  })();

  // Dynamically merge regular assigned periods with temporary classes transferred to this faculty
  const periods = useMemo(() => {
    const regular = data?.periods || [];
    const allTransfers = ClassTransferStore.getAllTransfers();
    const tempTransfers = allTransfers.filter(
      (t) => t.isTemporary && t.date === date
    );
    const tempPeriods = tempTransfers.map((t) => ({
      id: `slot-temp-${t.id}`,
      classSectionId: `temp-${t.id}`,
      classSectionName: t.classSectionName,
      subject: { name: t.subjectName, code: 'SUB' },
      period: {
        label: 'Coverage',
        startTime: t.periodTime?.split('-')[0]?.trim() || '10:00 AM',
        endTime: t.periodTime?.split('-')[1]?.trim() || '10:50 AM',
      },
      isTemporaryCoverage: true,
      transferredFrom: t.originalTeacherName,
    }));
    return [...regular, ...tempPeriods];
  }, [data?.periods, date]);

  const weekDays = [1, 2, 3, 4, 5];
  const weekPeriods = [...new Map(Object.values(weekMap).flat().map((s: any) => [s.period?.id, s.period])).values()].sort(
    (a: any, b: any) => (a?.startTime || '').localeCompare(b?.startTime || '')
  );
  const slotFor = (d: number, p: any) => (weekMap[d] || []).find((s: any) => s.period?.id === p?.id);

  const todayStr = new Date().toISOString().slice(0, 10);
  const isViewingToday = date === todayStr;

  const handleOpenTransfer = (p: any) => {
    setTransferringPeriod(p);
    setSelectedSubstitute(AVAILABLE_SUBSTITUTE_FACULTY[0]);
    setTransferReason('');
    setTransferModalVisible(true);
  };

  const handleConfirmTransfer = () => {
    if (!transferringPeriod || !selectedSubstitute) return;
    const classSectionName = transferringPeriod.classSectionName || transferringPeriod.classSection?.name || 'Class Session';
    const subjectName = transferringPeriod.subject?.name || 'Subject';
    const periodTime = `${transferringPeriod.period?.startTime || ''} - ${transferringPeriod.period?.endTime || ''}`;

    ClassTransferStore.addTransfer({
      classSectionName,
      subjectName,
      originalTeacherName: 'Teacher',
      substituteTeacherName: selectedSubstitute.name,
      date,
      periodTime,
      reason: transferReason.trim() || 'Temporary academic substitution',
    });

    Alert.alert(
      'Class Transferred',
      `"${subjectName}" (${classSectionName}) for ${date} has been transferred to ${selectedSubstitute.name}. Attendance management has been reassigned to them.`
    );
    setTransferModalVisible(false);
    setTransferringPeriod(null);
  };

  const handleRevokeTransfer = (transferId: string, subjectName: string) => {
    Alert.alert('Revoke Transfer', `Cancel temporary substitution for "${subjectName}" and reclaim attendance duties?`, [
      { text: 'Keep Transferred', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: () => {
          ClassTransferStore.removeTransfer(transferId);
          Alert.alert('Transfer Revoked', 'You have reclaimed this class session.');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header with single back button if onBack provided */}
      {onBack && (
        <View style={styles.singleBackHeader}>
          <TouchableOpacity style={styles.singleBackBtn} onPress={onBack} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#111827" />
            <Text style={styles.singleBackBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.scheduleHeaderTitle}>My Schedule</Text>
          <View style={{ width: 60 }} />
        </View>
      )}

      {/* Date Navigation Bar */}
      <View style={styles.dateBar}>
        <TouchableOpacity onPress={() => shiftDay(-1)} style={styles.arrowTouch}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.dateTitle}>{dayLabel}</Text>
            {isViewingToday && (
              <View style={styles.todayPill}>
                <Text style={styles.todayPillText}>TODAY</Text>
              </View>
            )}
          </View>
          <Text style={styles.dateSub}>
            {isViewingToday ? "Today's Classes: " : ''}{periods.length} periods scheduled
          </Text>
        </View>
        <TouchableOpacity onPress={() => shiftDay(1)} style={styles.arrowTouch}>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {!isViewingToday && (
        <View style={styles.jumpTodayBar}>
          <Text style={styles.jumpTodayNote}>Viewing alternate date schedule</Text>
          <TouchableOpacity onPress={() => setDate(todayStr)} style={styles.jumpTodayActionBtn}>
            <Text style={styles.jumpTodayActionText}>Go to Today</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.viewRow}>
        <TouchableOpacity style={[styles.viewChip, view === 'day' && styles.viewChipActive]} onPress={() => switchView('day')}>
          <MaterialCommunityIcons name="calendar-today" size={15} color={view === 'day' ? '#111827' : '#6B6B6B'} />
          <Text style={[styles.viewChipText, view === 'day' && styles.viewChipTextActive]}>Day Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.viewChip, view === 'week' && styles.viewChipActive]} onPress={() => switchView('week')}>
          <MaterialCommunityIcons name="calendar-week" size={15} color={view === 'week' ? '#111827' : '#6B6B6B'} />
          <Text style={[styles.viewChipText, view === 'week' && styles.viewChipTextActive]}>Weekly Grid</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}><ActivityIndicator size="large" color="#F4C430" /></View>
      ) : view === 'week' ? (
        weekLoading ? (
          <View style={styles.centerBox}><ActivityIndicator size="large" color="#F4C430" /></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekWrap}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} progressBackgroundColor="#FFFFFF" />}
          >
            <View>
              <View style={styles.gridHeaderRow}>
                <View style={[styles.cell, styles.dayHeaderCell]}>
                  <Text style={styles.dayHeaderText}>Period</Text>
                </View>
                {weekDays.map((d) => (
                  <View key={d} style={[styles.cell, styles.dayHeaderCell]}>
                    <Text style={styles.dayHeaderText}>{DAY_LABELS[d]}</Text>
                  </View>
                ))}
              </View>
              {weekPeriods.map((p: any) => (
                <View key={p.id} style={styles.gridRow}>
                  <View style={[styles.cell, styles.periodCell]}>
                    <Text style={styles.periodLabel}>{p.label}</Text>
                    <Text style={styles.periodTime}>{p.startTime}</Text>
                  </View>
                  {weekDays.map((d) => {
                    const s = slotFor(d, p);
                    return (
                      <TouchableOpacity
                        key={`${d}-${p.id}`}
                        style={[styles.cell, styles.slotCell, s && styles.slotCellFilled]}
                        disabled={!s || !onOpenAttendance}
                        onPress={() => s && onOpenAttendance && onOpenAttendance(s.id, s.subject?.name || 'Subject')}
                      >
                        {s ? (
                          <>
                            <Text style={styles.slotSubject}>{s.subject?.name || 'Subject'}</Text>
                          </>
                        ) : (
                          <Text style={styles.slotEmpty}>—</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        )
      ) : periods.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="calendar-blank" size={40} color="#6B6B6B" />
          <Text style={styles.emptyTitle}>No classes scheduled</Text>
          <Text style={styles.emptySub}>You have no periods assigned on this day.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} progressBackgroundColor="#FFFFFF" />}
        >
          {periods.map((p: any, i: number) => {
            const classSectionName = p.classSectionName || p.classSection?.name || '';
            const subjectName = p.subject?.name || 'Subject';
            const transfer = ClassTransferStore.getTransferForClassDate(classSectionName, subjectName, date);
            const isTransferred = !!transfer;
            const isMarked = AttendanceStore.isAttendanceMarked({
              classId: p.classSectionId || p.classSection?.id,
              slotId: p.id,
              classSectionName,
              subjectName,
              date,
            });

            return (
              <View key={p.id || i} style={styles.periodCard}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeStart}>{p.period?.startTime}</Text>
                  <Text style={styles.timeEnd}>{p.period?.endTime}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.subject}>{subjectName}</Text>
                  <Text style={styles.detail}>{classSectionName}</Text>
                  {isTransferred && (
                    <View style={styles.transferredBadge}>
                      <MaterialCommunityIcons name="swap-horizontal" size={13} color="#92400E" />
                      <Text style={styles.transferredBadgeText}>
                        Transferred: {transfer.substituteTeacherName}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardActionsCol}>
                  {isTransferred ? (
                    <TouchableOpacity
                      style={styles.revokeBtn}
                      onPress={() => handleRevokeTransfer(transfer.id, subjectName)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="undo-variant" size={13} color="#DC2626" />
                      <Text style={styles.revokeBtnText}>Revoke</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.transferBtn}
                      onPress={() => handleOpenTransfer(p)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="account-arrow-right-outline" size={15} color="#111827" />
                      <Text style={styles.transferBtnText}>Transfer</Text>
                    </TouchableOpacity>
                  )}

                  {onOpenAttendance && (
                    <TouchableOpacity
                      style={[
                        styles.markBtn,
                        isTransferred && styles.markBtnSubstituted,
                        isMarked && styles.markBtnMarked,
                      ]}
                      onPress={() => onOpenAttendance(p.id, subjectName)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={
                          isMarked
                            ? 'checkbox-marked-circle'
                            : isTransferred
                            ? 'eye-outline'
                            : 'checkbox-marked-circle-plus-outline'
                        }
                        size={16}
                        color={isMarked ? '#15803D' : '#111827'}
                      />
                      <Text style={[styles.markBtnText, isMarked && styles.markBtnMarkedText]}>
                        {isMarked ? 'Marked' : isTransferred ? 'View' : 'Mark'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* TRANSFER CLASS / ASSIGN SUBSTITUTE MODAL (Kivquo Brand) */}
      <Modal visible={transferModalVisible} transparent animationType="fade" onRequestClose={() => setTransferModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <View style={styles.modalIconCircle}>
                  <MaterialCommunityIcons name="swap-horizontal" size={20} color="#92400E" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Transfer Class</Text>
                  <Text style={styles.modalSubTitle}>Assign temporary substitute faculty</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setTransferModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Class Info Card */}
            {transferringPeriod && (
              <View style={styles.modalSessionBox}>
                <Text style={styles.modalSessionTitle}>
                  {transferringPeriod.subject?.name || 'Class Session'}
                </Text>
                <Text style={styles.modalSessionSub}>
                  {transferringPeriod.classSectionName || transferringPeriod.classSection?.name} • {dayLabel} ({transferringPeriod.period?.startTime} - {transferringPeriod.period?.endTime})
                </Text>
              </View>
            )}

            {/* Select Substitute Faculty */}
            <Text style={styles.modalFieldLabel}>Select Substitute Faculty *</Text>
            <ScrollView style={styles.substituteListScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {AVAILABLE_SUBSTITUTE_FACULTY.map((fac) => {
                const isSelected = selectedSubstitute?.id === fac.id;
                return (
                  <TouchableOpacity
                    key={fac.id}
                    style={[styles.substituteCard, isSelected && styles.substituteCardSelected]}
                    onPress={() => setSelectedSubstitute(fac)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.substituteAvatar}>
                      <Text style={styles.substituteAvatarText}>{fac.name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.substituteName, isSelected && styles.substituteNameSelected]}>{fac.name}</Text>
                      <Text style={styles.substituteDept}>{fac.department}</Text>
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons name="check-circle" size={18} color="#111827" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Reason Input */}
            <Text style={[styles.modalFieldLabel, { marginTop: 12 }]}>Reason / Coverage Notes</Text>
            <TextInput
              style={styles.modalReasonInput}
              placeholder="e.g. Attending academic conference, medical leave coverage"
              placeholderTextColor="#9CA3AF"
              value={transferReason}
              onChangeText={setTransferReason}
            />

            {/* Notice */}
            <View style={styles.transferNoticeBox}>
              <MaterialCommunityIcons name="information-outline" size={14} color="#92400E" />
              <Text style={styles.transferNoticeText}>
                Attendance duty will be transferred immediately. This class will appear in their schedule as a temporary session.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setTransferModalVisible(false)} activeOpacity={0.7}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmTransfer} activeOpacity={0.85}>
                <Text style={styles.modalConfirmBtnText}>Confirm Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  singleBackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  singleBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  singleBackBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
  },
  scheduleHeaderTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  dateBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  arrowTouch: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  dateTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#171717' },
  dateSub: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', marginTop: 2 },
  todayPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todayPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#15803D',
  },
  jumpTodayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  jumpTodayNote: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#1E40AF',
  },
  jumpTodayActionBtn: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  jumpTodayActionText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  periodCard: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, borderWidth: 1, borderColor: '#E8E5DC',
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  timeCol: { width: 56, gap: 2 },
  timeStart: { fontSize: 14, fontFamily: FontFamily.bold, color: '#111827' },
  timeEnd: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  infoCol: { flex: 1 },
  subject: { fontSize: 14, fontFamily: FontFamily.semibold, color: '#171717' },
  detail: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', marginTop: 2 },
  markBtn: {
    backgroundColor: '#F4C430', borderRadius: BorderRadius.button, paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  markBtnText: { color: '#111827', fontFamily: FontFamily.bold, fontSize: 12 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E8E5DC', margin: 16, marginTop: 40 },
  emptyTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: '#171717', marginTop: 8 },
  emptySub: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', textAlign: 'center', marginTop: 4 },
  viewRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  viewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFDF7',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  viewChipActive: { backgroundColor: '#FFF4C7', borderColor: '#F4C430' },
  viewChipText: { fontSize: 12, fontFamily: FontFamily.medium, color: '#6B6B6B' },
  viewChipTextActive: { color: '#111827', fontFamily: FontFamily.bold },
  weekWrap: { padding: 16, paddingBottom: 40 },
  gridHeaderRow: { flexDirection: 'row' },
  gridRow: { flexDirection: 'row' },
  cell: { width: 88, minHeight: 52, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: '#E8E5DC', backgroundColor: '#FFFFFF' },
  dayHeaderCell: { backgroundColor: '#FFF4C7' },
  dayHeaderText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#111827' },
  periodCell: { backgroundColor: '#FFFDF7', width: 80, alignItems: 'flex-start', paddingLeft: 10 },
  periodLabel: { fontSize: 11, fontFamily: FontFamily.bold, color: '#171717' },
  periodTime: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B', marginTop: 2 },
  slotCell: { gap: 2, paddingHorizontal: 4 },
  slotCellFilled: { backgroundColor: '#FFF4C7' },
  slotSubject: { fontSize: 11, fontFamily: FontFamily.bold, color: '#111827', textAlign: 'center' },
  slotRoom: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  slotEmpty: { fontSize: 13, fontFamily: FontFamily.regular, color: '#E8E5DC' },

  // Transfer & Badge Styles
  transferredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  transferredBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: '#92400E',
  },
  cardActionsCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  transferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.button,
  },
  transferBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#111827',
  },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.button,
  },
  revokeBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#DC2626',
  },
  markBtnSubstituted: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  attendanceMarkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  attendanceMarkedBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: '#15803D',
  },
  markBtnMarked: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  markBtnMarkedText: {
    color: '#15803D',
    fontFamily: FontFamily.bold,
  },

  // Transfer Modal Styles (Kivquo Brand)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  modalSubTitle: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1,
  },
  modalSessionBox: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#F4C430',
    borderRadius: BorderRadius.button,
    padding: 10,
    marginBottom: 14,
  },
  modalSessionTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  modalSessionSub: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 2,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#374151',
    marginBottom: 6,
  },
  substituteListScroll: {
    maxHeight: 140,
    marginBottom: 4,
  },
  substituteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 6,
  },
  substituteCardSelected: {
    borderColor: '#111827',
    backgroundColor: '#FFFDF7',
  },
  substituteAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  substituteAvatarText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
  },
  substituteName: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#374151',
  },
  substituteNameSelected: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  substituteDept: {
    fontSize: 10.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  modalReasonInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.button,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  transferNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF9C3',
    padding: 8,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  transferNoticeText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#92400E',
    lineHeight: 15,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BorderRadius.button,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalCancelBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#374151',
  },
  modalConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.button,
    backgroundColor: '#F4C430',
  },
  modalConfirmBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
  },
});

