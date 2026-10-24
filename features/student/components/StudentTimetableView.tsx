import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchMyTimetableApi } from '../../../api/academics';
import { TimetableSkeleton } from './skeletons';
import { ShimmerProvider } from './ShimmerSkeleton';
import { FontFamily } from '../../../constants/fonts';
import { useUserStore } from '../../../store/useUserStore';

interface PeriodItem {
  id: string;
  label: string;
  timeRange: string;
  startTime: string;
  endTime: string;
}

interface DefaultSlot {
  periodId: string;
  dayOfWeek: number; // 1 to 5
  subjectName: string;
}

const DEFAULT_PERIODS: PeriodItem[] = [
  { id: 'p1', label: 'Period 1', timeRange: '09:00 AM – 10:00 AM', startTime: '09:00', endTime: '10:00' },
  { id: 'p2', label: 'Period 2', timeRange: '10:00 AM – 11:00 AM', startTime: '10:00', endTime: '11:00' },
  { id: 'p3', label: 'Period 3', timeRange: '11:00 AM – 12:00 PM', startTime: '11:00', endTime: '12:00' },
  { id: 'p4', label: 'Period 4', timeRange: '12:00 PM – 01:00 PM', startTime: '12:00', endTime: '13:00' },
  { id: 'p5', label: 'Period 5', timeRange: '02:00 PM – 03:00 PM', startTime: '14:00', endTime: '15:00' },
  { id: 'p6', label: 'Period 6', timeRange: '03:00 PM – 04:00 PM', startTime: '15:00', endTime: '16:00' },
];

const DEFAULT_SUBJECTS_MAP: Record<string, string> = {
  p1: 'English',
  p2: 'Science',
  p3: 'Social Studies',
  p4: 'Mathematics',
  p5: 'Computer',
  p6: 'English',
};

function getWeekDays(baseDate: Date) {
  const current = new Date(baseDate);
  const day = current.getDay();
  // distance to Monday: if day is 0 (Sunday), diff is -6; else 1 - day
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMon);

  const days = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push({
      dateObj: d,
      dayNumber: d.getDate(),
      dayName: dayNames[i],
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
      dateString: d.toISOString().slice(0, 10),
      dayOfWeek: i + 1, // 1 for Mon ... 5 for Fri
    });
  }
  return days;
}

function formatFullDate(d: Date): string {
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNum = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  return `${weekday}, ${dayNum} ${month} ${year}`;
}

export const StudentTimetableView: React.FC = () => {
  // Dynamically default to current system date
  const [baseDate, setBaseDate] = useState<Date>(() => new Date());

  // Dynamically select today's weekday index (Mon=0..Fri=4, default to 0 on weekends)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const day = new Date().getDay(); // 0 is Sun, 1 is Mon, 2 is Tue, 3 is Wed, 4 is Thu, 5 is Fri, 6 is Sat
    if (day >= 1 && day <= 5) return day - 1;
    return 0; // Default to Mon
  });
  const [view, setView] = useState<'day' | 'week'>('day');
  const [weekModalOpen, setWeekModalOpen] = useState(false);
  const [selectedWeekLabel, setSelectedWeekLabel] = useState('This Week');

  // API State
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);
  const activeDay = weekDays[selectedDayIndex] || weekDays[0];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyTimetableApi(activeDay?.dateString);
      setData(res);
    } catch (err: any) {
      console.warn('[StudentTimetableView] error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeDay?.dateString]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const shiftWeek = (weeksDelta: number) => {
    setBaseDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + weeksDelta * 7);
      return next;
    });
  };

  const userDept = useUserStore((s) => s.department);
  const className = data?.classSection?.name || userDept || 'Class 6 A';

  // Extract slots from API if available, else use default schedule
  const slotsFromApi = data?.slots || [];

  // Dynamically extract periods from API if available, else fallback to defaults
  const periods: PeriodItem[] = useMemo(() => {
    if (slotsFromApi.length > 0) {
      const periodMap = new Map<string, PeriodItem>();
      slotsFromApi.forEach((s: any) => {
        const pId = s.period?.id || s.periodId;
        if (pId && !periodMap.has(pId)) {
          const startTime = s.period?.startTime || '09:00';
          const endTime = s.period?.endTime || '10:00';
          const label = s.period?.label || `Period ${periodMap.size + 1}`;
          periodMap.set(pId, {
            id: pId,
            label,
            timeRange: `${startTime} – ${endTime}`,
            startTime,
            endTime,
          });
        }
      });
      if (periodMap.size > 0) {
        return Array.from(periodMap.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
      }
    }
    return DEFAULT_PERIODS;
  }, [slotsFromApi]);

  const getSubjectForSlot = (dayOfWeek: number, periodId: string) => {
    if (slotsFromApi.length > 0) {
      const found = slotsFromApi.find(
        (s: any) =>
          s.dayOfWeek === dayOfWeek &&
          (s.period?.id === periodId || s.period?.label?.toLowerCase().includes(periodId))
      );
      if (found) {
        return found.subject?.name || 'Subject';
      }
    }
    return DEFAULT_SUBJECTS_MAP[periodId] || 'Subject';
  };

  if (loading && !refreshing) {
    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ShimmerProvider>
          <TimetableSkeleton />
        </ShimmerProvider>
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#111827"
            colors={['#111827']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      >
        {/* ─── Page Title & Week Selector Row ─────────────────────────── */}
        <View style={styles.titleSection}>
          <View style={styles.titleLeft}>
            <Text style={styles.pageTitle}>Class Timetable</Text>
            <Text style={styles.pageSubtitle}>{className}</Text>
          </View>

          {/* This Week Dropdown Pill */}
          <TouchableOpacity
            style={styles.weekPill}
            onPress={() => setWeekModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.weekPillText}>{selectedWeekLabel}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* ─── Week Days Strip Carousel ─────────────────────────────────── */}
        <View style={styles.weekStripCard}>
          {/* Previous Week Arrow */}
          <TouchableOpacity
            style={styles.arrowCircleBtn}
            onPress={() => shiftWeek(-1)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-left" size={20} color="#111827" />
          </TouchableOpacity>

          {/* 5 Day Pills (Mon - Fri) */}
          <View style={styles.daysRow}>
            {weekDays.map((d, index) => {
              const isSelected = selectedDayIndex === index;
              return (
                <TouchableOpacity
                  key={d.dateString}
                  style={[styles.dayItem, isSelected && styles.dayItemActive]}
                  onPress={() => setSelectedDayIndex(index)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayItemName, isSelected && styles.dayItemNameActive]}>
                    {d.dayName}
                  </Text>
                  <Text style={[styles.dayItemNumber, isSelected && styles.dayItemNumberActive]}>
                    {d.dayNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Next Week Arrow */}
          <TouchableOpacity
            style={styles.arrowCircleBtn}
            onPress={() => shiftWeek(1)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-right" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* ─── View Switcher Segmented Control (Day View / Week View) ───── */}
        <View style={styles.viewToggleRow}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, view === 'day' && styles.viewToggleBtnActive]}
            onPress={() => setView('day')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.viewToggleBtnText,
                view === 'day' && styles.viewToggleBtnTextActive,
              ]}
            >
              Day View
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewToggleBtn, view === 'week' && styles.viewToggleBtnActive]}
            onPress={() => setView('week')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.viewToggleBtnText,
                view === 'week' && styles.viewToggleBtnTextActive,
              ]}
            >
              Week View
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Mode 1: Day View ────────────────────────────────────────── */}
        {view === 'day' ? (
          <View style={styles.dayViewContainer}>
            {/* Day Title & Class */}
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitleText}>{formatFullDate(activeDay.dateObj)}</Text>
              <Text style={styles.daySubtitleText}>{className}</Text>
            </View>

            {/* Timetable Table Card */}
            <View style={styles.dayTableCard}>
              {/* Header Row */}
              <View style={styles.dayTableHeader}>
                <View style={[styles.dayTableCol, { flex: 1.1 }]}>
                  <Text style={styles.dayTableColHeader}>Period</Text>
                </View>
                <View style={styles.dayTableColDivider} />
                <View style={[styles.dayTableCol, { flex: 1.7 }]}>
                  <Text style={styles.dayTableColHeader}>Time</Text>
                </View>
                <View style={styles.dayTableColDivider} />
                <View style={[styles.dayTableCol, { flex: 1.4 }]}>
                  <Text style={styles.dayTableColHeader}>Subject</Text>
                </View>
              </View>

              {/* Data Rows */}
              <View style={styles.dayTableBody}>
                {periods.map((period, idx) => {
                  const subjectName = getSubjectForSlot(activeDay.dayOfWeek, period.id);

                  return (
                    <View
                      key={period.id}
                      style={[
                        styles.dayTableRow,
                        idx % 2 === 1 && styles.dayTableRowAlt,
                        idx === periods.length - 1 && styles.dayTableRowLast,
                      ]}
                    >
                      <View style={[styles.dayTableCol, { flex: 1.1 }]}>
                        <Text style={styles.periodText}>{period.label}</Text>
                      </View>
                      <View style={styles.dayTableColDivider} />
                      <View style={[styles.dayTableCol, { flex: 1.7 }]}>
                        <Text style={styles.timeText}>{period.timeRange}</Text>
                      </View>
                      <View style={styles.dayTableColDivider} />
                      <View style={[styles.dayTableCol, { flex: 1.4 }]}>
                        <Text style={styles.subjectText}>{subjectName}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        ) : (
          /* ─── Mode 2: Week View ──────────────────────────────────────── */
          <View style={styles.weekViewContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weekGridScroll}
            >
              <View style={styles.weekTableCard}>
                {/* Column Headers */}
                <View style={styles.weekTableHeader}>
                  <View style={[styles.weekHeaderCell, styles.cornerCell]}>
                    <Text style={styles.weekHeaderCellText}>Period</Text>
                  </View>
                  {weekDays.map((d) => (
                    <View key={d.dateString} style={styles.weekHeaderCell}>
                      <Text style={styles.weekHeaderCellText}>{d.dayName}</Text>
                      <Text style={styles.weekHeaderDateText}>{d.dayNumber} {d.monthName}</Text>
                    </View>
                  ))}
                </View>

                {/* Rows for each period */}
                {periods.map((period) => (
                  <View key={period.id} style={styles.weekTableRow}>
                    {/* Period label column */}
                    <View style={[styles.weekSlotCell, styles.periodLabelCell]}>
                      <Text style={styles.weekPeriodLabel}>{period.label}</Text>
                      <Text style={styles.weekPeriodTime}>{period.startTime}</Text>
                    </View>

                    {/* Monday to Friday slots */}
                    {weekDays.map((d) => {
                      const subject = getSubjectForSlot(d.dayOfWeek, period.id);
                      return (
                        <View key={d.dateString} style={styles.weekSlotCell}>
                          <Text style={styles.weekSlotSubjectText} numberOfLines={2}>
                            {subject}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ─── Week Selection Modal ─────────────────────────────────────── */}
      <Modal visible={weekModalOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setWeekModalOpen(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Week</Text>
              <TouchableOpacity onPress={() => setWeekModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {['This Week', 'Next Week', 'Previous Week'].map((item) => {
              const isSelected = selectedWeekLabel === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalItem, isSelected && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedWeekLabel(item);
                    if (item === 'This Week') {
                      setBaseDate(new Date());
                    } else if (item === 'Next Week') {
                      shiftWeek(1);
                    } else if (item === 'Previous Week') {
                      shiftWeek(-1);
                    }
                    setWeekModalOpen(false);
                  }}
                >
                  <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons name="check" size={20} color="#111827" />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 14,
  },

  /* ─── Title Section ──────────────────────────────────────────────── */
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  titleLeft: {
    gap: 2,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  weekPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7D8',
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  weekPillText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },

  /* ─── Week Days Strip Carousel ───────────────────────────────────── */
  weekStripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF6',
    borderWidth: 1,
    borderColor: '#EFE7D8',
    borderRadius: 5,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  arrowCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7D8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    flex: 1,
    paddingHorizontal: 4,
  },
  dayItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    gap: 4,
    minWidth: 46,
  },
  dayItemActive: {
    backgroundColor: '#FDC836',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dayItemName: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#000000',
  },
  dayItemNameActive: {
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  dayItemNumber: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#000000',
  },
  dayItemNumberActive: {
    fontFamily: FontFamily.bold,
    color: '#000000',
  },

  /* ─── Segmented View Switcher ────────────────────────────────────── */
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 2,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  viewToggleBtnActive: {
    backgroundColor: '#FDC836',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  viewToggleBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: '#111827',
  },
  viewToggleBtnTextActive: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  /* ─── Day View Styles ────────────────────────────────────────────── */
  dayViewContainer: {
    gap: 10,
  },
  dayHeader: {
    marginTop: 4,
    marginBottom: 2,
  },
  dayTitleText: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  daySubtitleText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 2,
  },
  dayTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#EFE7D8',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  dayTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E7',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7D8',
  },
  dayTableColHeader: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
    textAlign: 'center',
  },
  dayTableBody: {
    backgroundColor: '#FFFFFF',
  },
  dayTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE8',
    backgroundColor: '#FFFFFF',
  },
  dayTableRowAlt: {
    backgroundColor: '#FCFBF9',
  },
  dayTableRowLast: {
    borderBottomWidth: 0,
  },
  dayTableCol: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  dayTableColDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#EFE7D8',
  },
  periodText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
    textAlign: 'center',
  },
  timeText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#000000',
    textAlign: 'center',
  },
  subjectText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#000000',
    textAlign: 'center',
  },

  /* ─── Week View Styles ───────────────────────────────────────────── */
  weekViewContainer: {
    marginTop: 4,
  },
  weekGridScroll: {
    paddingBottom: 8,
  },
  weekTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#EFE7D8',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  weekTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E7',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7D8',
  },
  weekHeaderCell: {
    width: 80,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#EFE7D8',
  },
  cornerCell: {
    width: 76,
  },
  weekHeaderCellText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#000000',
    textAlign: 'center',
  },
  weekHeaderDateText: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#000000',
    marginTop: 2,
    textAlign: 'center',
  },
  weekTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE8',
  },
  weekSlotCell: {
    width: 80,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#F3EFE8',
    backgroundColor: '#FFFFFF',
  },
  periodLabelCell: {
    width: 76,
    backgroundColor: '#FFFDF9',
    borderRightColor: '#EFE7D8',
  },
  weekPeriodLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#000000',
    textAlign: 'center',
  },
  weekPeriodTime: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#000000',
    marginTop: 2,
    textAlign: 'center',
  },
  weekSlotSubjectText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 14,
  },

  /* ─── Modal Styles ───────────────────────────────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  modalItemActive: {
    backgroundColor: '#FEF3C7',
  },
  modalItemText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: '#1F2937',
  },
  modalItemTextActive: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
});
