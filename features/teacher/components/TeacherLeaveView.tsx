import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from './common/Icons';
import { FontFamily } from '../../../constants/fonts';
import { TeacherLeaveSkeleton } from './skeletons';

export interface TeacherLeaveViewProps {
  onBack?: () => void;
}

export interface LeaveRequest {
  id: string;
  type: 'Casual' | 'Sick' | 'Earned';
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedOn: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(monthIdx) || isNaN(day) || monthIdx < 0 || monthIdx > 11) return dateStr;
  return `${day} ${MONTH_SHORT[monthIdx]} ${year}`;
};

const formatToIso = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const INITIAL_REQUESTS: LeaveRequest[] = [
  {
    id: 'lr-1',
    type: 'Casual',
    fromDate: '2026-10-25',
    toDate: '2026-10-25',
    days: 1,
    reason: 'Personal family event',
    status: 'PENDING',
    appliedOn: '2026-10-20',
  },
  {
    id: 'lr-2',
    type: 'Sick',
    fromDate: '2026-10-14',
    toDate: '2026-10-14',
    days: 1,
    reason: 'Seasonal viral fever',
    status: 'APPROVED',
    appliedOn: '2026-10-13',
  },
  {
    id: 'lr-3',
    type: 'Casual',
    fromDate: '2026-09-18',
    toDate: '2026-09-19',
    days: 2,
    reason: 'Outstation family commitment',
    status: 'APPROVED',
    appliedOn: '2026-09-15',
  },
  {
    id: 'lr-4',
    type: 'Earned',
    fromDate: '2026-08-05',
    toDate: '2026-08-05',
    days: 1,
    reason: 'Government administrative work',
    status: 'APPROVED',
    appliedOn: '2026-08-01',
  },
];

export const TeacherLeaveView: React.FC<TeacherLeaveViewProps> = ({ onBack }) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_REQUESTS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Leave Balances
  const [leaveBalances, setLeaveBalances] = useState({
    casual: 8,
    casualTotal: 12,
    sick: 6,
    sickTotal: 10,
    earned: 14,
    earnedTotal: 15,
  });

  // Modal State
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState<'Casual' | 'Sick' | 'Earned'>('Casual');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Dropdown Date Picker State
  const [activeDatePicker, setActiveDatePicker] = useState<'FROM' | 'TO' | null>(null);
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  // Calendar Days Computation for Dropdown Picker
  const calendarDays = useMemo(() => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const cells: { day: number; currentMonth: boolean; dateStr: string }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const mm = String(prevM + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ day: d, currentMonth: false, dateStr: `${prevY}-${mm}-${dd}` });
    }

    for (let d = 1; d <= totalDays; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ day: d, currentMonth: true, dateStr: `${year}-${mm}-${dd}` });
    }

    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextM = month === 11 ? 0 : month + 1;
        const nextY = month === 11 ? year + 1 : year;
        const mm = String(nextM + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        cells.push({ day: d, currentMonth: false, dateStr: `${nextY}-${mm}-${dd}` });
      }
    }

    return cells;
  }, [calendarViewDate]);

  const shiftCalendarMonth = (delta: number) => {
    setCalendarViewDate((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + delta);
      return d;
    });
  };

  const calculatedDays = useMemo(() => {
    if (!leaveFrom) return 0;
    if (!leaveTo || leaveTo === leaveFrom) return 1;
    const f = new Date(leaveFrom);
    const t = new Date(leaveTo);
    const diffTime = t.getTime() - f.getTime();
    if (diffTime < 0) return 1;
    const d = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
    return Math.max(1, d);
  }, [leaveFrom, leaveTo]);

  const handleSelectDate = (dateStr: string) => {
    if (activeDatePicker === 'FROM') {
      setLeaveFrom(dateStr);
      if (leaveTo && leaveTo < dateStr) {
        setLeaveTo('');
      }
      setActiveDatePicker(null);
    } else if (activeDatePicker === 'TO') {
      if (leaveFrom && dateStr < leaveFrom) {
        setLeaveFrom(dateStr);
        setLeaveTo('');
      } else {
        setLeaveTo(dateStr);
      }
      setActiveDatePicker(null);
    }
  };

  const openApplyLeaveModal = () => {
    setActiveDatePicker(null);
    if (leaveFrom) {
      const [y, m] = leaveFrom.split('-').map(Number);
      if (y && m) setCalendarViewDate(new Date(y, m - 1, 1));
    } else {
      setCalendarViewDate(new Date());
    }
    setLeaveModalVisible(true);
  };

  const handleApplyLeave = () => {
    if (!leaveFrom.trim() || !leaveReason.trim()) {
      Alert.alert('Missing Details', 'Please select a start date and provide a reason for leave.');
      return;
    }

    const typeKey = leaveType.toLowerCase() as 'casual' | 'sick' | 'earned';
    const currentRemaining = leaveBalances[typeKey];
    if (currentRemaining <= 0) {
      Alert.alert('Insufficient Balance', `You have no ${leaveType} leaves remaining.`);
      return;
    }

    const daysCount = calculatedDays > 0 ? calculatedDays : 1;
    if (daysCount > currentRemaining) {
      Alert.alert(
        'Insufficient Balance',
        `You have applied for ${daysCount} ${daysCount === 1 ? 'day' : 'days'}, but only have ${currentRemaining} ${leaveType} ${currentRemaining === 1 ? 'leave' : 'leaves'} remaining.`
      );
      return;
    }

    const newRequest: LeaveRequest = {
      id: `lr-${Date.now()}`,
      type: leaveType,
      fromDate: leaveFrom.trim(),
      toDate: (leaveTo || leaveFrom).trim(),
      days: daysCount,
      reason: leaveReason.trim(),
      status: 'PENDING',
      appliedOn: formatToIso(new Date()),
    };

    setLeaveRequests((prev) => [newRequest, ...prev]);

    // Deduct leave balance
    setLeaveBalances((prev) => ({
      ...prev,
      [typeKey]: Math.max(0, prev[typeKey] - daysCount),
    }));

    setLeaveModalVisible(false);
    setActiveDatePicker(null);
    setLeaveFrom('');
    setLeaveTo('');
    setLeaveReason('');

    Alert.alert(
      'Leave Application Submitted',
      'Your leave request has been submitted to the Administration for approval.'
    );
  };

  const filteredRequests = useMemo(() => {
    if (activeTab === 'ALL') return leaveRequests;
    return leaveRequests.filter((r) => r.status === activeTab);
  }, [leaveRequests, activeTab]);

  const stats = useMemo(() => {
    const totalApplied = leaveRequests.length;
    const pending = leaveRequests.filter((r) => r.status === 'PENDING').length;
    const approved = leaveRequests.filter((r) => r.status === 'APPROVED').length;
    const rejected = leaveRequests.filter((r) => r.status === 'REJECTED').length;
    return { totalApplied, pending, approved, rejected };
  }, [leaveRequests]);

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'APPROVED':
        return {
          text: '#026440',
          label: 'Approved',
        };
      case 'PENDING':
        return {
          text: '#B45309',
          label: 'Pending',
        };
      case 'REJECTED':
      default:
        return {
          text: '#DC2626',
          label: 'Rejected',
        };
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={20} color="#000000" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Leave</Text>
        </View>

        <TouchableOpacity
          style={styles.applyActionBtn}
          onPress={openApplyLeaveModal}
          activeOpacity={0.8}
        >
          <Text style={styles.applyActionBtnText}>Apply Leave</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      >
        {refreshing ? (
          <TeacherLeaveSkeleton />
        ) : (
          <>
            {/* 2. Leave Balances Section */}
            <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>LEAVE BALANCES</Text>
        </View>

        <View style={styles.leaveBalanceRow}>
          <View style={styles.leaveBalCard}>
            <Text style={styles.leaveBalTitle}>Casual</Text>
            <Text style={styles.leaveBalCount}>{leaveBalances.casual}</Text>
            <Text style={styles.leaveBalSub}>of {leaveBalances.casualTotal} left</Text>
          </View>

          <View style={styles.leaveBalCard}>
            <Text style={styles.leaveBalTitle}>Sick</Text>
            <Text style={styles.leaveBalCount}>{leaveBalances.sick}</Text>
            <Text style={styles.leaveBalSub}>of {leaveBalances.sickTotal} left</Text>
          </View>

          <View style={styles.leaveBalCard}>
            <Text style={styles.leaveBalTitle}>Earned</Text>
            <Text style={styles.leaveBalCount}>{leaveBalances.earned}</Text>
            <Text style={styles.leaveBalSub}>of {leaveBalances.earnedTotal} left</Text>
          </View>
        </View>

        {/* 3. Quick Summary Metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{stats.totalApplied}</Text>
            <Text style={styles.metricLabel}>Total Applied</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{stats.pending}</Text>
            <Text style={styles.metricLabel}>Pending</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>{stats.approved}</Text>
            <Text style={styles.metricLabel}>Approved</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#6B7280' }]}>{stats.rejected}</Text>
            <Text style={styles.metricLabel}>Rejected</Text>
          </View>
        </View>

        {/* 4. Filter Tabs */}
        <View style={styles.filterTabsRow}>
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const count =
              tab === 'ALL'
                ? stats.totalApplied
                : tab === 'PENDING'
                ? stats.pending
                : tab === 'APPROVED'
                ? stats.approved
                : stats.rejected;

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 5. Leave Applications List */}
        <View style={styles.requestsSection}>
          {filteredRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={36} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Leave Applications</Text>
              <Text style={styles.emptySub}>No applications match your selected filter.</Text>
            </View>
          ) : (
            filteredRequests.map((req) => {
              const badge = getStatusBadge(req.status);
              return (
                <View key={req.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestTypeRow}>
                      <Text style={styles.typePillText}>{req.type} Leave</Text>
                      <Text style={styles.dotSeparator}>·</Text>
                      <Text style={styles.daysText}>
                        {req.days} {req.days === 1 ? 'Day' : 'Days'}
                      </Text>
                    </View>

                    <Text style={[styles.reqStatusText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>

                  <View style={styles.requestDatesRow}>
                    <Feather name="calendar" size={13} color="#000000" />
                    <Text style={styles.datesText}>
                      {formatDateDisplay(req.fromDate)}
                      {req.toDate && req.toDate !== req.fromDate
                        ? ` to ${formatDateDisplay(req.toDate)}`
                        : ''}
                    </Text>
                  </View>

                  <Text style={styles.reasonText}>{req.reason}</Text>

                  <View style={styles.requestFooter}>
                    <Text style={styles.appliedOnText}>
                      Applied on: {formatDateDisplay(req.appliedOn)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
            </View>
          </>
        )}
      </ScrollView>

      {/* 6. Apply Leave Modal with Dropdown Date Selection */}
      <Modal visible={leaveModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply for Leave</Text>
              <TouchableOpacity
                onPress={() => {
                  setLeaveModalVisible(false);
                  setActiveDatePicker(null);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollBody}
            >
              {/* Leave Type Selector */}
              <Text style={styles.modalFieldLabel}>LEAVE TYPE</Text>
              <View style={styles.typeSelectorRow}>
                {(['Casual', 'Sick', 'Earned'] as const).map((t) => {
                  const isSelected = leaveType === t;
                  const balance =
                    t === 'Casual'
                      ? leaveBalances.casual
                      : t === 'Sick'
                      ? leaveBalances.sick
                      : leaveBalances.earned;

                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeOptionCard,
                        isSelected && styles.typeOptionCardActive,
                      ]}
                      onPress={() => setLeaveType(t)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          isSelected && styles.typeOptionTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                      <Text
                        style={[
                          styles.typeOptionBal,
                          isSelected && styles.typeOptionBalActive,
                        ]}
                      >
                        {balance} left
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Dropdown Date Selectors */}
              <View style={styles.datesInputsRow}>
                {/* Start Date Dropdown */}
                <View style={styles.dateCol}>
                  <Text style={styles.modalFieldLabel}>START DATE</Text>
                  <TouchableOpacity
                    style={[
                      styles.dateDropdownBtn,
                      activeDatePicker === 'FROM' && styles.dateDropdownBtnActive,
                    ]}
                    onPress={() => {
                      setActiveDatePicker((prev) => (prev === 'FROM' ? null : 'FROM'));
                      if (leaveFrom) {
                        const [y, m] = leaveFrom.split('-').map(Number);
                        if (y && m) setCalendarViewDate(new Date(y, m - 1, 1));
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Feather name="calendar" size={13} color="#000000" />
                    <Text
                      style={[
                        styles.dateDropdownVal,
                        !leaveFrom && styles.dateDropdownPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {leaveFrom ? formatDateDisplay(leaveFrom) : 'Select date'}
                    </Text>
                    <Feather
                      name={activeDatePicker === 'FROM' ? 'chevron-up' : 'chevron-down'}
                      size={13}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>

                {/* End Date Dropdown */}
                <View style={styles.dateCol}>
                  <View style={styles.dateLabelRow}>
                    <Text style={styles.modalFieldLabel}>END DATE (OPTIONAL)</Text>
                    {leaveTo ? (
                      <TouchableOpacity
                        onPress={() => setLeaveTo('')}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Text style={styles.clearDateText}>Clear</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.dateDropdownBtn,
                      activeDatePicker === 'TO' && styles.dateDropdownBtnActive,
                    ]}
                    onPress={() => {
                      setActiveDatePicker((prev) => (prev === 'TO' ? null : 'TO'));
                      if (leaveTo) {
                        const [y, m] = leaveTo.split('-').map(Number);
                        if (y && m) setCalendarViewDate(new Date(y, m - 1, 1));
                      } else if (leaveFrom) {
                        const [y, m] = leaveFrom.split('-').map(Number);
                        if (y && m) setCalendarViewDate(new Date(y, m - 1, 1));
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Feather name="calendar" size={13} color="#000000" />
                    <Text
                      style={[
                        styles.dateDropdownVal,
                        !leaveTo && styles.dateDropdownPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {leaveTo ? formatDateDisplay(leaveTo) : 'Single day'}
                    </Text>
                    <Feather
                      name={activeDatePicker === 'TO' ? 'chevron-up' : 'chevron-down'}
                      size={13}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Inline Calendar Dropdown */}
              {activeDatePicker && (
                <View style={styles.inlineCalendarCard}>
                  <View style={styles.calendarHeaderRow}>
                    <View style={styles.calPickerTargetRow}>
                      <Feather name="calendar" size={13} color="#000000" />
                      <Text style={styles.calendarHeaderTitle}>
                        {activeDatePicker === 'FROM' ? 'Select Start Date' : 'Select End Date'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveDatePicker(null)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="chevron-up" size={16} color="#000000" />
                    </TouchableOpacity>
                  </View>

                  {/* Month Navigation */}
                  <View style={styles.calendarNavRow}>
                    <TouchableOpacity
                      style={styles.calNavBtn}
                      onPress={() => shiftCalendarMonth(-1)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="chevron-left" size={15} color="#000000" />
                    </TouchableOpacity>
                    <Text style={styles.calMonthTitle}>
                      {MONTH_NAMES[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}
                    </Text>
                    <TouchableOpacity
                      style={styles.calNavBtn}
                      onPress={() => shiftCalendarMonth(1)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="chevron-right" size={15} color="#000000" />
                    </TouchableOpacity>
                  </View>

                  {/* Weekday Row */}
                  <View style={styles.calWeekRow}>
                    {WEEK_DAYS.map((wd) => (
                      <Text key={wd} style={styles.calWeekText}>{wd}</Text>
                    ))}
                  </View>

                  {/* Calendar Days Grid */}
                  <View style={styles.calGrid}>
                    {calendarDays.map((cell, idx) => {
                      const isFrom = leaveFrom === cell.dateStr;
                      const isTo = leaveTo === cell.dateStr;
                      const isCurrentPicker = activeDatePicker === 'FROM' ? isFrom : isTo;
                      const isInRange =
                        leaveFrom &&
                        leaveTo &&
                        cell.dateStr > leaveFrom &&
                        cell.dateStr < leaveTo;

                      return (
                        <TouchableOpacity
                          key={`${cell.dateStr}-${idx}`}
                          style={[
                            styles.calCell,
                            isInRange && styles.calCellInRange,
                            isCurrentPicker && styles.calCellSelected,
                            (isFrom || isTo) && !isCurrentPicker && styles.calCellBoundary,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => handleSelectDate(cell.dateStr)}
                        >
                          <Text
                            style={[
                              styles.calCellText,
                              !cell.currentMonth && styles.calCellTextDim,
                              isInRange && styles.calCellTextInRange,
                              isCurrentPicker && styles.calCellTextSelected,
                              (isFrom || isTo) && !isCurrentPicker && styles.calCellTextBoundary,
                            ]}
                          >
                            {cell.day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Quick Shortcuts & Done Footer */}
                  <View style={styles.calFooter}>
                    <View style={styles.quickDateRow}>
                      <TouchableOpacity
                        style={styles.calQuickBtn}
                        onPress={() => {
                          const today = new Date();
                          handleSelectDate(formatToIso(today));
                        }}
                      >
                        <Text style={styles.calQuickText}>Today</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.calQuickBtn}
                        onPress={() => {
                          const tmrw = new Date();
                          tmrw.setDate(tmrw.getDate() + 1);
                          handleSelectDate(formatToIso(tmrw));
                        }}
                      >
                        <Text style={styles.calQuickText}>Tomorrow</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.calDoneBtn}
                      onPress={() => setActiveDatePicker(null)}
                    >
                      <Text style={styles.calDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Leave Duration Indicator */}
              {leaveFrom ? (
                <View style={styles.durationPill}>
                  <Feather name="clock" size={12} color="#000000" />
                  <Text style={styles.durationPillText}>
                    Duration: {calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'}
                    {leaveTo && leaveTo !== leaveFrom
                      ? ` (${formatDateDisplay(leaveFrom)} to ${formatDateDisplay(leaveTo)})`
                      : ` (${formatDateDisplay(leaveFrom)})`}
                  </Text>
                </View>
              ) : null}

              {/* Reason Input */}
              <Text style={styles.modalFieldLabel}>REASON FOR LEAVE</Text>
              <TextInput
                style={[styles.modalInput, styles.reasonInput]}
                placeholder="Provide reason for leave..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={leaveReason}
                onChangeText={setLeaveReason}
              />

              {/* Submit Action */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleApplyLeave}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>Submit Leave Application</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  applyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 5,
  },
  applyActionBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
    gap: 12,
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#000000',
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 10.5,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },

  /* Leave Balances */
  leaveBalanceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  leaveBalCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  leaveBalTitle: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  leaveBalCount: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#000000',
    marginVertical: 2,
  },
  leaveBalSub: {
    fontSize: 9.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },

  /* Metrics Grid */
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingVertical: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  metricLabel: {
    fontSize: 9.5,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E8E5DC',
  },

  /* Filter Tabs */
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  filterTabActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  filterTabText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#4B5563',
  },
  filterTabTextActive: {
    fontFamily: FontFamily.bold,
    color: '#000000',
  },

  /* Requests List */
  requestsSection: {
    gap: 8,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 12,
    gap: 6,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typePillText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  dotSeparator: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#9CA3AF',
  },
  daysText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  reqStatusText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  requestDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  datesText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  reasonText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#374151',
  },
  requestFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 6,
    marginTop: 2,
  },
  appliedOnText: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  emptyCard: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  emptySub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 16,
    maxHeight: '90%',
  },
  modalScrollBody: {
    gap: 12,
    paddingBottom: 24,
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  modalFieldLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#000000',
    letterSpacing: 0.5,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOptionCard: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 2,
  },
  typeOptionCardActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F4C430',
  },
  typeOptionText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#4B5563',
  },
  typeOptionTextActive: {
    color: '#000000',
  },
  typeOptionBal: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  typeOptionBalActive: {
    color: '#000000',
    fontFamily: FontFamily.bold,
  },

  /* Dropdown Date Inputs */
  datesInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateCol: {
    flex: 1,
    gap: 5,
  },
  dateDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 6,
  },
  dateDropdownBtnActive: {
    borderColor: '#000000',
    backgroundColor: '#FFFBEB',
  },
  dateDropdownVal: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  dateDropdownPlaceholder: {
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
  },
  dateLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearDateText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#EF4444',
  },

  /* Inline Calendar Dropdown */
  inlineCalendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    gap: 8,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 6,
  },
  calPickerTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarHeaderTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  calendarNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  calNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthTitle: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  calWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 4,
  },
  calWeekText: {
    width: 34,
    textAlign: 'center',
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#6B7280',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 4,
  },
  calCell: {
    width: 34,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  calCellInRange: {
    backgroundColor: '#FFFBEB',
  },
  calCellSelected: {
    backgroundColor: '#F4C430',
  },
  calCellBoundary: {
    backgroundColor: '#000000',
  },
  calCellText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#000000',
  },
  calCellTextDim: {
    color: '#D1D5DB',
  },
  calCellTextInRange: {
    color: '#000000',
    fontFamily: FontFamily.bold,
  },
  calCellTextSelected: {
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  calCellTextBoundary: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  calFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    marginTop: 2,
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 6,
  },
  calQuickBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
  },
  calQuickText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  calDoneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#000000',
  },
  calDoneText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  /* Duration Pill */
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  durationPillText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },

  modalInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#000000',
    fontFamily: FontFamily.medium,
  },
  reasonInput: {
    height: 72,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#F4C430',
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
});
