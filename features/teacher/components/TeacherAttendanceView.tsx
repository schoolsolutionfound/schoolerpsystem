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
} from 'react-native';
import { MaterialCommunityIcons, Feather } from './common/Icons';
import { TeacherLeaveSkeleton } from './skeletons/TeacherLeaveSkeleton';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { useUserStore } from '../../../store/useUserStore';

interface TeacherAttendanceViewProps {
  onBack?: () => void;
}

interface AttendanceDayLog {
  date: string;
  dayName: string;
  status: 'PRESENT' | 'LATE' | 'ON_LEAVE' | 'HOLIDAY';
  checkIn: string;
  checkOut: string;
  hours: string;
}

const INITIAL_LOGS: AttendanceDayLog[] = [
  {
    date: '2026-10-20',
    dayName: 'Tue',
    status: 'PRESENT',
    checkIn: '08:42 AM',
    checkOut: '04:30 PM',
    hours: '7h 48m',
  },
  {
    date: '2026-10-19',
    dayName: 'Mon',
    status: 'PRESENT',
    checkIn: '08:40 AM',
    checkOut: '04:35 PM',
    hours: '7h 55m',
  },
  {
    date: '2026-10-17',
    dayName: 'Sat',
    status: 'PRESENT',
    checkIn: '08:55 AM',
    checkOut: '01:30 PM',
    hours: '4h 35m',
  },
  {
    date: '2026-10-16',
    dayName: 'Fri',
    status: 'LATE',
    checkIn: '09:15 AM',
    checkOut: '04:30 PM',
    hours: '7h 15m',
  },
  {
    date: '2026-10-15',
    dayName: 'Thu',
    status: 'PRESENT',
    checkIn: '08:38 AM',
    checkOut: '04:30 PM',
    hours: '7h 52m',
  },
  {
    date: '2026-10-14',
    dayName: 'Wed',
    status: 'ON_LEAVE',
    checkIn: '--',
    checkOut: '--',
    hours: '0h',
  },
  {
    date: '2026-10-13',
    dayName: 'Tue',
    status: 'PRESENT',
    checkIn: '08:44 AM',
    checkOut: '04:32 PM',
    hours: '7h 48m',
  },
  {
    date: '2026-10-12',
    dayName: 'Mon',
    status: 'PRESENT',
    checkIn: '08:41 AM',
    checkOut: '04:30 PM',
    hours: '7h 49m',
  },
  {
    date: '2026-10-10',
    dayName: 'Sat',
    status: 'PRESENT',
    checkIn: '08:50 AM',
    checkOut: '01:30 PM',
    hours: '4h 40m',
  },
  {
    date: '2026-10-09',
    dayName: 'Fri',
    status: 'PRESENT',
    checkIn: '08:39 AM',
    checkOut: '04:30 PM',
    hours: '7h 51m',
  },
];

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({ onBack }) => {
  const fullName = useUserStore((s) => s.fullName) || 'Teacher';
  const employeeId = useUserStore((s) => s.employeeId) || 'EMP-2024';
  const designation = useUserStore((s) => s.designation) || 'Senior Faculty';

  const [logs] = useState<AttendanceDayLog[]>(INITIAL_LOGS);

  // Leave Modal State
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState<'Casual' | 'Sick' | 'Earned'>('Casual');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Leave Balances
  const [leaveBalances, setLeaveBalances] = useState({
    casual: 8,
    sick: 6,
    earned: 14,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  const handleApplyLeave = () => {
    if (!leaveFrom.trim() || !leaveReason.trim()) {
      Alert.alert('Missing Details', 'Please specify the start date and reason for leave.');
      return;
    }

    // Deduct leave balance
    setLeaveBalances((prev) => ({
      ...prev,
      [leaveType.toLowerCase()]: Math.max(0, (prev as any)[leaveType.toLowerCase()] - 1),
    }));

    setLeaveModalVisible(false);
    setLeaveFrom('');
    setLeaveTo('');
    setLeaveReason('');

    Alert.alert('Leave Application Submitted', 'Your leave request has been submitted to the Administration for approval.');
  };

  const stats = useMemo(() => {
    const present = logs.filter((l) => l.status === 'PRESENT' || l.status === 'LATE').length;
    const late = logs.filter((l) => l.status === 'LATE').length;
    const leave = logs.filter((l) => l.status === 'ON_LEAVE').length;
    const totalWorking = 24;
    const percentage = '96.2';
    return { present, late, leave, totalWorking, percentage };
  }, [logs]);

  const getStatusBadge = (status: AttendanceDayLog['status']) => {
    switch (status) {
      case 'PRESENT':
        return {
          bg: '#DCFCE7',
          text: '#15803D',
          label: 'Present',
        };
      case 'LATE':
        return {
          bg: '#FEF3C7',
          text: '#B45309',
          label: 'Late',
        };
      case 'ON_LEAVE':
        return {
          bg: '#DBEAFE',
          text: '#1E40AF',
          label: 'On Leave',
        };
      case 'HOLIDAY':
      default:
        return {
          bg: '#F3F4F6',
          text: '#4B5563',
          label: 'Holiday',
        };
    }
  };

  const formatDateDisplay = (isoStr: string) => {
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parseInt(parts[1], 10) - 1;
      return `${day} ${months[monthIdx] || ''}`;
    }
    return isoStr;
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
              <Feather name="arrow-left" size={20} color="#171717" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>My Attendance</Text>
        </View>

        <TouchableOpacity
          style={styles.leaveActionBtn}
          onPress={() => setLeaveModalVisible(true)}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={15} color="#171717" />
          <Text style={styles.leaveActionBtnText}>Apply Leave</Text>
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
            {/* 2. Faculty Profile Card */}
            <View style={styles.profileCard}>
          <View style={styles.profileInfoRow}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account-tie" size={22} color="#171717" />
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName} numberOfLines={1}>{fullName}</Text>
              <Text style={styles.profileSub} numberOfLines={1}>
                {designation} · {employeeId}
              </Text>
            </View>
            <View style={styles.todayBadge}>
              <View style={styles.todayDot} />
              <Text style={styles.todayBadgeText}>Present Today</Text>
            </View>
          </View>
        </View>

        {/* 3. Monthly Metrics Grid */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Attendance</Text>
            <Text style={styles.metricVal}>{stats.percentage}%</Text>
            <View style={[styles.metricBar, { backgroundColor: '#F4C430' }]} />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Working Days</Text>
            <Text style={styles.metricVal}>{stats.totalWorking}</Text>
            <View style={[styles.metricBar, { backgroundColor: '#E8E5DC' }]} />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Present</Text>
            <Text style={[styles.metricVal, { color: '#15803D' }]}>{stats.present}</Text>
            <View style={[styles.metricBar, { backgroundColor: '#15803D' }]} />
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Leaves</Text>
            <Text style={[styles.metricVal, { color: '#D97706' }]}>{stats.leave}</Text>
            <View style={[styles.metricBar, { backgroundColor: '#D97706' }]} />
          </View>
        </View>

        {/* 4. Leave Balances Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Leave Balances</Text>
          <Text style={styles.sectionSub}>AY 2026 - 2027</Text>
        </View>

        <View style={styles.leaveBalanceRow}>
          <View style={styles.leaveBalCard}>
            <Text style={styles.leaveBalTitle}>Casual (CL)</Text>
            <Text style={styles.leaveBalCount}>{leaveBalances.casual}</Text>
            <Text style={styles.leaveBalSub}>of 12 remaining</Text>
          </View>

          <View style={styles.leaveBalCard}>
            <Text style={styles.leaveBalTitle}>Sick (SL)</Text>
            <Text style={styles.leaveBalCount}>{leaveBalances.sick}</Text>
            <Text style={styles.leaveBalSub}>of 10 remaining</Text>
          </View>

          <View style={styles.leaveBalCard}>
            <Text style={styles.leaveBalTitle}>Earned (EL)</Text>
            <Text style={styles.leaveBalCount}>{leaveBalances.earned}</Text>
            <Text style={styles.leaveBalSub}>of 15 remaining</Text>
          </View>
        </View>

        {/* 5. Attendance History Logs Table */}
        <View style={[styles.sectionHeaderRow, { marginTop: 6 }]}>
          <Text style={styles.sectionTitle}>Monthly Attendance Log</Text>
          <View style={styles.monthPill}>
            <Text style={styles.monthPillText}>October 2026</Text>
          </View>
        </View>

        <View style={styles.tableCard}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thText, styles.colDate]}>Date</Text>
            <Text style={[styles.thText, styles.colDay]}>Day</Text>
            <Text style={[styles.thText, styles.colTime]}>Check-In</Text>
            <Text style={[styles.thText, styles.colTime]}>Check-Out</Text>
            <Text style={[styles.thText, styles.colStatus]}>Status</Text>
          </View>

          {/* Table Rows */}
          {logs.map((item, idx) => {
            const badge = getStatusBadge(item.status);
            const isLast = idx === logs.length - 1;
            return (
              <View
                key={item.date}
                style={[styles.tableRow, isLast && { borderBottomWidth: 0 }]}
              >
                <Text style={[styles.tdDate, styles.colDate]} numberOfLines={1}>
                  {formatDateDisplay(item.date)}
                </Text>
                <Text style={[styles.tdDay, styles.colDay]} numberOfLines={1}>
                  {item.dayName}
                </Text>
                <Text style={[styles.tdTime, styles.colTime]} numberOfLines={1}>
                  {item.checkIn}
                </Text>
                <Text style={[styles.tdTime, styles.colTime]} numberOfLines={1}>
                  {item.checkOut}
                </Text>
                <View style={styles.colStatus}>
                  <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgePillText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
          </>
        )}
      </ScrollView>

      {/* 6. Apply Leave Modal */}
      <Modal visible={leaveModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply for Leave</Text>
              <TouchableOpacity onPress={() => setLeaveModalVisible(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Leave Type Selector */}
            <Text style={styles.inputLabel}>Leave Type</Text>
            <View style={styles.typeRow}>
              {(['Casual', 'Sick', 'Earned'] as const).map((type) => {
                const isSel = leaveType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeBtn, isSel && styles.typeBtnActive]}
                    onPress={() => setLeaveType(type)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typeBtnText, isSel && styles.typeBtnTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Date Inputs */}
            <View style={styles.dateInputsRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  value={leaveFrom}
                  onChangeText={setLeaveFrom}
                />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.inputLabel}>End Date (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  value={leaveTo}
                  onChangeText={setLeaveTo}
                />
              </View>
            </View>

            {/* Reason Input */}
            <View style={{ gap: 4 }}>
              <Text style={styles.inputLabel}>Reason / Remarks</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Reason for requesting leave..."
                placeholderTextColor="#9CA3AF"
                value={leaveReason}
                onChangeText={setLeaveReason}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleApplyLeave}
              activeOpacity={0.85}
            >
              <Text style={styles.modalSubmitBtnText}>Submit Leave Application</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  leaveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 5,
  },
  leaveActionBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 110,
  },

  // Faculty Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  profileSub: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
  },
  todayBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#15803D',
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
    marginTop: 2,
  },
  metricBar: {
    width: 20,
    height: 2.5,
    borderRadius: 2,
    marginTop: 3,
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  sectionSub: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FontFamily.medium,
  },
  monthPill: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  monthPillText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#854D0E',
  },

  // Leave Balances
  leaveBalanceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  leaveBalCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 10,
    gap: 1,
  },
  leaveBalTitle: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#6B7280',
  },
  leaveBalCount: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
    marginTop: 2,
  },
  leaveBalSub: {
    fontSize: 9.5,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
  },

  // Attendance History Table
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  thText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tdDate: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  tdDay: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  tdTime: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#374151',
  },

  colDate: {
    width: 65,
  },
  colDay: {
    width: 45,
  },
  colTime: {
    flex: 1,
  },
  colStatus: {
    width: 68,
    alignItems: 'flex-end',
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  inputLabel: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#4B5563',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeBtnActive: {
    backgroundColor: '#FEF9C3',
    borderColor: '#F4C430',
  },
  typeBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  typeBtnTextActive: {
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 12.5,
    color: '#171717',
    backgroundColor: '#FFFFFF',
  },
  modalTextArea: {
    height: 68,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  modalSubmitBtn: {
    backgroundColor: '#F4C430',
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalSubmitBtnText: {
    color: '#171717',
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
  },
});
