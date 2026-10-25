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
} from 'react-native';
import { MaterialCommunityIcons, Feather } from './common/Icons';
import { FontFamily } from '../../../constants/fonts';
import { fetchTeacherTimetableApi } from '../../../api/academics';
import { useUserStore } from '../../../store/useUserStore';
import { useClassTransferStore } from '../services/classTransferStore';
import { ClassTransferModal } from './ClassTransferModal';
import { TeacherTimetableSkeleton } from './skeletons';

const TIME_SLOTS = [
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
];

const DEFAULT_TODAY_PERIODS = [
  {
    id: 'demo-slot-1',
    period: { label: '1st Period', startTime: '08:30 AM', endTime: '09:20 AM' },
    subject: { name: 'Maths' },
    classSectionName: 'Class 10-A',
  },
  {
    id: 'demo-slot-2',
    period: { label: '2nd Period', startTime: '09:30 AM', endTime: '10:20 AM' },
    subject: { name: 'Physics' },
    classSectionName: 'Class 11-B',
  },
  {
    id: 'demo-slot-3',
    period: { label: '3rd Period', startTime: '10:45 AM', endTime: '11:35 AM' },
    subject: { name: 'Algebra' },
    classSectionName: 'Class 9-C',
  },
  {
    id: 'demo-slot-4',
    period: { label: '4th Period', startTime: '11:45 AM', endTime: '12:35 PM' },
    subject: { name: 'Pract. Geom' },
    classSectionName: 'Class 10-B',
  },
  {
    id: 'demo-slot-5',
    period: { label: '5th Period', startTime: '01:30 PM', endTime: '02:20 PM' },
    subject: { name: 'Chem' },
    classSectionName: 'Class 12-A',
  },
];

interface TeacherTimetableViewProps {
  onOpenAttendance?: (slotOrId: any, subjectName?: string, className?: string) => void;
}

function formatDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getSubjectShortcut(rawName: string): string {
  if (!rawName) return 'Subject';
  const clean = rawName.trim();
  const lower = clean.toLowerCase();

  const map: Record<string, string> = {
    mathematics: 'Maths',
    maths: 'Maths',
    math: 'Maths',
    'practical geometry': 'Pract. Geom',
    geometry: 'Geometry',
    algebra: 'Algebra',
    physics: 'Physics',
    chemistry: 'Chem',
    chem: 'Chem',
    biology: 'Bio',
    bio: 'Bio',
    'computer science': 'Comp Sci',
    computer: 'Comp Sci',
    'information technology': 'IT',
    'social science': 'Social Sci',
    'social studies': 'Soc Studies',
    'environmental studies': 'EVS',
    'environmental science': 'EVS',
    'physical education': 'P.E.',
    'business studies': 'Business',
    accountancy: 'Accounts',
    accounting: 'Accounts',
    economics: 'Economics',
    'general knowledge': 'GK',
    'english language': 'English',
    'english literature': 'English',
    english: 'English',
    'hindi literature': 'Hindi',
    hindi: 'Hindi',
    history: 'History',
    geography: 'Geography',
    science: 'Science',
  };

  if (map[lower]) return map[lower];

  if (lower.startsWith('practical ')) {
    const sub = clean.slice(10).trim();
    const subShort = map[sub.toLowerCase()] || sub;
    return `Pract. ${subShort}`;
  }

  return clean;
}

function parsePeriodNum(label?: string, index: number = 0): string {
  const raw = (label || '').trim();
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
  if (raw) {
    const match = raw.match(/^(\d+)(?:st|nd|rd|th)?/i);
    if (match) {
      const n = parseInt(match[1], 10);
      return ordinals[n - 1] || `${n}th`;
    }
  }
  return ordinals[index] || `${index + 1}th`;
}

function findPeriodForHour(periodsForDay: any[], hourStr: string) {
  if (!periodsForDay || periodsForDay.length === 0) return null;
  const match = hourStr.match(/^(\d+):00\s*(AM|PM)/i);
  if (!match) return null;
  let slotH = parseInt(match[1], 10);
  const ampm = match[2].toUpperCase();
  if (ampm === 'PM' && slotH < 12) slotH += 12;
  if (ampm === 'AM' && slotH === 12) slotH = 0;

  return periodsForDay.find((p: any) => {
    const timeStr = p?.period?.startTime || p?.startTime || '';
    const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return false;
    let ph = parseInt(m[1], 10);
    const pampm = (m[3] || '').toUpperCase();
    if (pampm === 'PM' && ph < 12) ph += 12;
    if (pampm === 'AM' && ph === 12) ph = 0;
    return ph === slotH;
  });
}

export const TeacherTimetableView: React.FC<TeacherTimetableViewProps> = ({ onOpenAttendance }) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateString(new Date()));
  const [stripAnchorDate, setStripAnchorDate] = useState<Date>(() => new Date());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'day' | 'week'>('day');
  const [weekMap, setWeekMap] = useState<Record<number, any[]>>({});
  const [weekLoading, setWeekLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedTransferSlot, setSelectedTransferSlot] = useState<any>(null);

  const currentTeacherName = useUserStore((s) => s.fullName) || 'You (Teacher)';
  const { requests, getTransferForPeriod } = useClassTransferStore();

  const pendingIncomingCount = useMemo(() => {
    return requests.filter(
      (r) =>
        (r.toTeacherId === 'current-user' || r.toTeacherName.includes('You')) &&
        r.status === 'pending'
    ).length;
  }, [requests]);

  // Compute 7 days centered on stripAnchorDate
  const stripDays = useMemo(() => {
    return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
      const d = new Date(stripAnchorDate);
      d.setDate(stripAnchorDate.getDate() + offset);
      return d;
    });
  }, [stripAnchorDate]);

  // Active week working days (Mon to Fri) for the Week view grid
  const activeWeekDays = useMemo(() => {
    const base = new Date(`${selectedDate}T00:00:00`);
    const dow = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - ((dow + 6) % 7));

    return [0, 1, 2, 3, 4].map((i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  // Display Month and Year for the active strip
  const monthYearLabel = useMemo(() => {
    return stripAnchorDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [stripAnchorDate]);

  const load = useCallback(async (targetDate: string) => {
    setLoading(true);
    try {
      const res = await fetchTeacherTimetableApi(targetDate);
      if (res?.periods && Array.isArray(res.periods) && res.periods.length > 0) {
        setData(res);
      } else {
        // Guarantee today's timetable is displayed
        setData({ periods: DEFAULT_TODAY_PERIODS });
      }
    } catch {
      setData({ periods: DEFAULT_TODAY_PERIODS });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWeek = useCallback(async () => {
    setWeekLoading(true);
    try {
      const results = await Promise.all(
        activeWeekDays.map((d) => fetchTeacherTimetableApi(formatDateString(d)).catch(() => null))
      );
      const map: Record<number, any[]> = {};
      results.forEach((r, idx) => {
        const dow = activeWeekDays[idx].getDay();
        const pList =
          r?.periods && Array.isArray(r.periods) && r.periods.length > 0
            ? r.periods
            : DEFAULT_TODAY_PERIODS;
        map[dow] = pList;
      });
      setWeekMap(map);
    } finally {
      setWeekLoading(false);
    }
  }, [activeWeekDays]);

  useEffect(() => {
    load(selectedDate);
  }, [load, selectedDate]);

  useEffect(() => {
    if (view === 'week') {
      loadWeek();
    }
  }, [view, loadWeek]);

  const shiftStrip = (weeksDelta: number) => {
    const newAnchor = new Date(stripAnchorDate);
    newAnchor.setDate(stripAnchorDate.getDate() + weeksDelta * 7);
    setStripAnchorDate(newAnchor);

    const newSelected = new Date(`${selectedDate}T00:00:00`);
    newSelected.setDate(newSelected.getDate() + weeksDelta * 7);
    setSelectedDate(formatDateString(newSelected));
  };

  const handleSelectDay = (day: Date) => {
    const dateStr = formatDateString(day);
    setSelectedDate(dateStr);
    setStripAnchorDate(day);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(selectedDate);
    if (view === 'week') await loadWeek();
    setRefreshing(false);
  }, [load, loadWeek, selectedDate, view]);

  const switchView = (v: 'day' | 'week') => {
    setView(v);
  };

  const basePeriods = (data?.periods && data.periods.length > 0) ? data.periods : DEFAULT_TODAY_PERIODS;

  const periods = useMemo(() => {
    // Append any accepted incoming transfers for the selected date
    const acceptedIncoming = requests
      .filter(
        (r) =>
          r.status === 'accepted' &&
          r.date === selectedDate &&
          (r.toTeacherId === 'current-user' || r.toTeacherName.includes('You'))
      )
      .map((r) => ({
        id: r.periodId || `transfer-${r.id}`,
        period: {
          label: r.periodLabel,
          startTime: r.startTime,
          endTime: r.endTime,
        },
        subject: { name: r.subject },
        classSectionName: r.className,
        isCovering: true,
        coveringForTeacherName: r.fromTeacherName,
      }));

    return [...basePeriods, ...acceptedIncoming];
  }, [basePeriods, requests, selectedDate]);

  return (
    <ScrollView
      style={styles.container}
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
      {/* 1. Month Header & 7-Day Carousel Strip Card */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeaderRow}>
          <Text style={styles.monthTitle}>{monthYearLabel}</Text>
          <View style={styles.navButtonsRow}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => shiftStrip(-1)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="chevron-left" size={15} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => shiftStrip(1)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="chevron-right" size={15} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 7-Day Strip */}
        <View style={styles.stripRow}>
          {stripDays.map((d) => {
            const dateStr = formatDateString(d);
            const isSelected = dateStr === selectedDate;
            const weekdayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = String(d.getDate());

            return (
              <TouchableOpacity
                key={dateStr}
                style={[styles.stripItem, isSelected && styles.stripItemActive]}
                onPress={() => handleSelectDay(d)}
                activeOpacity={0.8}
              >
                <Text style={[styles.stripDayLabel, isSelected && styles.stripDayLabelActive]}>
                  {weekdayName}
                </Text>
                <Text style={[styles.stripDayNum, isSelected && styles.stripDayNumActive]}>
                  {dayNum}
                </Text>
                {isSelected && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 2. Day / Week Selector Segmented Pill */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, view === 'day' && styles.segmentBtnActive]}
          onPress={() => switchView('day')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="calendar-blank-outline"
            size={14}
            color={view === 'day' ? '#111827' : '#9CA3AF'}
          />
          <Text style={[styles.segmentText, view === 'day' && styles.segmentTextActive]}>
            Day
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, view === 'week' && styles.segmentBtnActive]}
          onPress={() => switchView('week')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="calendar-range-outline"
            size={14}
            color={view === 'week' ? '#111827' : '#9CA3AF'}
          />
          <Text style={[styles.segmentText, view === 'week' && styles.segmentTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Main Content: Day View or Week View */}
      {loading ? (
        <TeacherTimetableSkeleton />
      ) : view === 'week' ? (
        weekLoading ? (
          <TeacherTimetableSkeleton />
        ) : (
          /* Week Grid Table matching the reference screenshot */
          <View style={styles.gridCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Header Row: Time + Days */}
                <View style={styles.gridHeaderRow}>
                  <View style={[styles.timeCell, styles.headerCell]}>
                    <Text style={styles.timeHeaderTitle}>Time</Text>
                  </View>
                  {activeWeekDays.map((d) => {
                    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = String(d.getDate());
                    return (
                      <View key={formatDateString(d)} style={[styles.dayColCell, styles.headerCell]}>
                        <Text style={styles.dayColHeaderText}>{weekday}</Text>
                        <Text style={styles.dayColHeaderNum}>{dayNum}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Hour Rows */}
                {TIME_SLOTS.map((hourStr, rowIdx) => (
                  <View key={hourStr} style={styles.gridRow}>
                    <View style={styles.timeCell}>
                      <Text style={styles.timeRowText}>{hourStr}</Text>
                    </View>
                    {activeWeekDays.map((d) => {
                      const dow = d.getDay();
                      const periodsForThisDay = weekMap[dow] || [];
                      const slot = findPeriodForHour(periodsForThisDay, hourStr);

                      return (
                        <View key={`${formatDateString(d)}-${hourStr}`} style={styles.dayColCell}>
                          {slot ? (
                            <TouchableOpacity
                              style={styles.slotPill}
                              onPress={() =>
                                slot && onOpenAttendance?.(slot.id, slot.subject?.name || 'Subject')
                              }
                              activeOpacity={0.8}
                            >
                              <Text style={styles.slotSubjectText} numberOfLines={1}>
                                {getSubjectShortcut(slot.subject?.name || 'Subject')}
                              </Text>
                              <Text style={styles.slotClassText} numberOfLines={1}>
                                {slot.classSectionName || slot.classSection?.name || ''}
                              </Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )
      ) : periods.length === 0 ? (
        /* Empty State matching reference image */
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <MaterialCommunityIcons name="calendar-text-outline" size={32} color="#D97706" />
          </View>
          <Text style={styles.emptyTitle}>No classes scheduled</Text>
          <Text style={styles.emptySubtitle}>You have no periods assigned on this day.</Text>
        </View>
      ) : (
        /* List of Periods */
        <View style={styles.periodsCard}>
          {periods.map((p: any, i: number) => {
            const num = parsePeriodNum(p.period?.label, i);
            const startTime = p.period?.startTime || '00:00';
            const endTime = p.period?.endTime || '00:00';
            const rawSubject = p.subject?.shortName || p.subject?.name || p.subjectName || 'Subject';
            const subject = getSubjectShortcut(rawSubject);
            const cls = p.classSectionName || p.classSection?.name || 'Class 10-A';

            const periodId = p.id || `demo-slot-${i + 1}`;
            const periodLabel = p.period?.label || `${num} Period`;
            const transfer = getTransferForPeriod(periodId, selectedDate, periodLabel);

            // In schedule remove room number, and show accepted teacher at timetable!
            let metaLine = cls;
            if (p.isCovering) {
              metaLine = `${cls} • Covering (${p.coveringForTeacherName || 'Substitute'})`;
            } else if (transfer?.status === 'accepted') {
              metaLine = `${cls} • Covered by ${transfer.toTeacherName}`;
            }

            return (
              <View key={p.id || i}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.periodRow}>
                  {/* Column 1: Period Number & Label */}
                  <View style={styles.periodCol}>
                    <Text style={styles.periodNum}>{num}</Text>
                    <Text style={styles.periodLabel}>Period</Text>
                  </View>

                  {/* Vertical Divider */}
                  <View style={styles.verticalDivider} />

                  {/* Column 2: Start Time & End Time */}
                  <View style={styles.timeCol}>
                    <Text style={styles.timeStart}>{startTime}</Text>
                    <Text style={styles.timeEnd}>{endTime}</Text>
                  </View>

                  {/* Column 3: Subject & Class (NO ROOM NUMBER) */}
                  <TouchableOpacity
                    style={styles.subjectCol}
                    activeOpacity={onOpenAttendance ? 0.7 : 1}
                    onPress={() => onOpenAttendance?.(p.id, subject, cls)}
                  >
                    <Text
                      style={styles.subjectName}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.8}
                    >
                      {subject}
                    </Text>
                    <Text
                      style={styles.subjectClass}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.8}
                    >
                      {metaLine}
                    </Text>
                  </TouchableOpacity>

                  {/* Column 4: Golden Yellow Transfer Button matching screenshot */}
                  <View style={styles.actionsCol}>
                    <TouchableOpacity
                      style={[
                        styles.transferYellowBtn,
                        (transfer?.status === 'accepted' || p.isCovering) && styles.transferBtnAccepted,
                        transfer?.status === 'pending' && styles.transferBtnPending,
                      ]}
                      onPress={() => {
                        if (p.isCovering) {
                          onOpenAttendance?.(p.id, subject, cls);
                        } else if (transfer?.status === 'pending' || transfer?.status === 'accepted') {
                          setSelectedTransferSlot(null);
                          setTransferModalVisible(true);
                        } else {
                          setSelectedTransferSlot({
                            periodId,
                            periodLabel,
                            startTime,
                            endTime,
                            date: selectedDate,
                            className: cls,
                            subject,
                            room: '',
                          });
                          setTransferModalVisible(true);
                        }
                      }}
                      activeOpacity={0.82}
                    >
                      <Text
                        style={[
                          styles.transferYellowBtnText,
                          (transfer?.status === 'accepted' || p.isCovering) && styles.transferBtnTextAccepted,
                          transfer?.status === 'pending' && styles.transferBtnTextPending,
                        ]}
                      >
                        {p.isCovering
                          ? 'Covering'
                          : transfer?.status === 'accepted'
                          ? 'Covered'
                          : transfer?.status === 'pending'
                          ? 'Pending'
                          : 'Transfer'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Class Transfer Modal */}
      <ClassTransferModal
        visible={transferModalVisible}
        onClose={() => {
          setTransferModalVisible(false);
          setSelectedTransferSlot(null);
        }}
        targetSlot={selectedTransferSlot}
        currentTeacherName={currentTeacherName}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 100,
  },

  // 1. Calendar Strip Card with dashboard borderColor
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  navButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  navBtn: {
    width: 28,
    height: 28,
    borderRadius: 5,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Strip of 7 days
  stripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stripItem: {
    flex: 1,
    marginHorizontal: 2,
    height: 52,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  stripItemActive: {
    backgroundColor: '#F4C430',
    borderWidth: 0,
  },
  stripDayLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#9CA3AF',
  },
  stripDayLabelActive: {
    color: '#111827',
    fontFamily: FontFamily.extrabold,
  },
  stripDayNum: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginTop: 1,
  },
  stripDayNumActive: {
    color: '#111827',
  },
  activeDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#111827',
    marginTop: 2,
  },

  // 2. Day / Week Selector Pill with dashboard borderColor
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 2.5,
    alignSelf: 'flex-start',
    marginVertical: 10,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 5.5,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  segmentBtnActive: {
    backgroundColor: '#F4C430',
  },
  segmentText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#6B7280',
  },
  segmentTextActive: {
    color: '#111827',
    fontFamily: FontFamily.extrabold,
  },

  // 3. Main Content Cards
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingVertical: 46,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },

  // Period List Card when classes exist
  periodsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    marginTop: 8,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  periodCol: {
    width: 32,
    justifyContent: 'center',
  },
  periodNum: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
    letterSpacing: -0.2,
  },
  periodLabel: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
    marginTop: 0.5,
  },
  verticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  timeCol: {
    width: 66,
    justifyContent: 'center',
  },
  timeStart: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  timeEnd: {
    fontSize: 10.5,
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
    marginTop: 1,
  },
  subjectCol: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  subjectName: {
    fontSize: 13.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
    letterSpacing: -0.2,
  },
  subjectClass: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1.5,
  },
  actionsCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  transferYellowBtn: {
    backgroundColor: '#FAB82C',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  transferYellowBtnText: {
    color: '#000000',
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  transferBtnAccepted: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  transferBtnTextAccepted: {
    color: '#065F46',
  },
  transferBtnPending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  transferBtnTextPending: {
    color: '#92400E',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  // Week Grid Table matching reference image
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 20,
  },
  gridHeaderRow: {
    flexDirection: 'row',
  },
  gridRow: {
    flexDirection: 'row',
  },
  headerCell: {
    backgroundColor: '#FEF9C3',
    paddingVertical: 9,
  },
  timeCell: {
    width: 76,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  timeHeaderTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  timeRowText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  dayColCell: {
    width: 86,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  dayColHeaderText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  dayColHeaderNum: {
    fontSize: 12.5,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    marginTop: 1,
  },
  slotPill: {
    width: '100%',
    height: '84%',
    backgroundColor: '#FFFBEA',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotSubjectText: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    textAlign: 'center',
  },
  slotClassText: {
    fontSize: 8.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
  },
});
