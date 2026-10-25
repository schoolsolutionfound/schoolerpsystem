import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import { FontFamily } from '../../../constants/fonts';
import { fetchStudentAttendanceHistoryApi } from '../../../api/academics';
import { AttendanceSkeleton } from './skeletons';
import { ShimmerProvider } from './ShimmerSkeleton';

type ViewMode = 'subject' | 'monthly';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const TERMS = [
  `${currentYear - 1} - ${currentYear}`,
  `${currentYear} - ${currentYear + 1}`,
  `${currentYear - 2} - ${currentYear - 1}`,
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDateFull(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayName = DAYS_FULL[dt.getDay()] || 'Day';
    const monthName = MONTHS[m - 1] || 'Month';
    return `${dayName}, ${d} ${monthName} ${y}`;
  } catch {
    return dateStr;
  }
}

function getAttendanceColor(pct: number): string {
  if (pct >= 85) return '#16A34A'; // Green
  if (pct > 75) return '#FDC836'; // Dashboard Yellow
  return '#DC2626'; // Red
}

/* ─── Circular Progress Donut Ring ───────────────────────────────────────── */

const AttendanceDonutRing: React.FC<{ percentage: number; size?: number; strokeWidth?: number }> = ({
  percentage,
  size = 76,
  strokeWidth = 7,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, percentage)) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#F3EFE8"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#FDC836"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.donutCenterText}>
            {percentage.toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
};

/* ─── Main View ──────────────────────────────────────────────────────────── */

export const StudentAttendanceView: React.FC = () => {
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<ViewMode>('subject');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);
  const [termDropdownOpen, setTermDropdownOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStudentAttendanceHistoryApi();
      setData(res);
    } catch (err: any) {
      console.warn('[StudentAttendance]', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const handleScrollToDetail = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });
  }, []);

  if (loading && !refreshing) {
    return (
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ShimmerProvider><AttendanceSkeleton /></ShimmerProvider>
      </ScrollView>
    );
  }

  const overall = data?.overall;
  const overallPct = typeof overall?.percentage === 'number' ? overall.percentage : 86.2;
  const overallPresent = overall?.present ?? 155;
  const overallTotal = overall?.total ?? 180;

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" colors={['#000000']} progressBackgroundColor="#FFFFFF" />
      }
    >
      {/* Header Section */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Attendance</Text>

      </View>

      {/* Term Selector */}
      <View style={styles.termSelectorWrap}>
        <TouchableOpacity
          style={styles.termSelector}
          onPress={() => setTermDropdownOpen(!termDropdownOpen)}
          activeOpacity={0.8}
        >
          <Text style={styles.termText}>{selectedTerm}</Text>
          <MaterialCommunityIcons
            name={termDropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#111827"
          />
        </TouchableOpacity>

        {termDropdownOpen && (
          <View style={styles.termDropdownMenu}>
            {TERMS.map((term) => {
              const active = term === selectedTerm;
              return (
                <TouchableOpacity
                  key={term}
                  style={[styles.termDropdownItem, active && styles.termDropdownItemActive]}
                  onPress={() => {
                    setSelectedTerm(term);
                    setTermDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.termDropdownItemText, active && styles.termDropdownItemTextActive]}>
                    {term}
                  </Text>
                  {active && <MaterialCommunityIcons name="check" size={16} color="#111827" />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Overall Attendance Card matching screenshot */}
      <View style={styles.overallCard}>
        <View style={styles.overallLeftCol}>
          <Text style={styles.overallLabel}>Overall Attendance</Text>
          <Text style={styles.overallValue}>{overallPct.toFixed(1)}%</Text>
          <Text style={styles.overallSub}>
            Present: {overallPresent} <Text style={styles.overallDivider}>|</Text> Total: {overallTotal}
          </Text>
        </View>

        <AttendanceDonutRing percentage={overallPct} size={78} strokeWidth={7} />
      </View>

      {/* Segmented View Toggle Buttons */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'subject' ? styles.toggleBtnActive : styles.toggleBtnInactive]}
          onPress={() => setMode('subject')}
          activeOpacity={0.85}
        >
          <Text style={[styles.toggleText, mode === 'subject' ? styles.toggleTextActive : styles.toggleTextInactive]}>
            Subject Wise
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'monthly' ? styles.toggleBtnActive : styles.toggleBtnInactive]}
          onPress={() => setMode('monthly')}
          activeOpacity={0.85}
        >
          <Text style={[styles.toggleText, mode === 'monthly' ? styles.toggleTextActive : styles.toggleTextInactive]}>
            Monthly View
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'subject' ? (
        <SubjectWiseListView data={data} />
      ) : (
        <MonthlyCalendarView
          calMonth={calMonth}
          calYear={calYear}
          setCalMonth={setCalMonth}
          setCalYear={setCalYear}
          data={data}
          onDateSelect={handleScrollToDetail}
        />
      )}
    </ScrollView>
  );
};

/* ─── Subject Wise List View ─────────────────────────────────────────────── */

const SubjectWiseListView: React.FC<{ data: any }> = ({ data }) => {
  const perSubject = data?.perSubject || [];

  if (perSubject.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <MaterialCommunityIcons name="chart-donut" size={40} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No attendance records</Text>
        <Text style={styles.emptySub}>Attendance appears once your teachers mark classes.</Text>
      </View>
    );
  }

  return (
    <View style={styles.subjectList}>
      {perSubject.map((row: any, i: number) => {
        const code = row.subject?.code || `CS${101 + i}`;
        const name = row.subject?.name || 'Subject';
        const present = row.present ?? 0;
        const total = row.total ?? 0;
        const pctNum = typeof row.percentage === 'number' ? row.percentage : 0;
        const pctFormatted = pctNum.toFixed(1);
        const color = getAttendanceColor(pctNum);

        return (
          <TouchableOpacity key={row.subject?.id || i} style={styles.subjectCard} activeOpacity={0.7}>
            <View style={styles.subjectCardLeft}>
              <Text style={styles.subjectCode}>{code}</Text>
              <Text style={styles.subjectName} numberOfLines={1}>{name}</Text>
              <Text style={styles.subjectClasses}>{present} / {total} Classes</Text>
            </View>

            <View style={styles.subjectCardRight}>
              <View style={styles.subjectMetrics}>
                <Text style={[styles.subjectPct, { color: color === '#FDC836' ? '#111827' : color }]}>{pctFormatted}%</Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, Math.max(0, pctNum))}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
              </View>

              <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

/* ─── Monthly Calendar View ──────────────────────────────────────────────── */

interface MonthlyCalendarViewProps {
  calMonth: number;
  calYear: number;
  setCalMonth: (m: number) => void;
  setCalYear: (y: number) => void;
  data: any;
  onDateSelect?: () => void;
}

const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  calMonth,
  calYear,
  setCalMonth,
  setCalYear,
  data,
  onDateSelect,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('__all__');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const perSubject = data?.perSubject || [];
  const daily = data?.daily || [];

  const subjectMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of perSubject) m[s.subject?.id] = s.subject?.name || 'Subject';
    return m;
  }, [perSubject]);

  const filteredDaily = useMemo(() => {
    if (selectedSubjectId === '__all__') return daily;
    return daily.filter((r: any) => r.subjectId === selectedSubjectId);
  }, [daily, selectedSubjectId]);

  const dailyByDate = useMemo(() => {
    const map: Record<string, { present: number; absent: number; total: number; sessions: any[] }> = {};
    for (const r of filteredDaily) {
      if (!map[r.date]) map[r.date] = { present: 0, absent: 0, total: 0, sessions: [] };
      map[r.date].total++;
      if (r.status === 'absent') map[r.date].absent++;
      else map[r.date].present++;
      map[r.date].sessions.push(r);
    }
    return map;
  }, [filteredDaily]);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const today = new Date();
  const todayStr = toDateStr(today);

  const goPrev = () => {
    setSelectedDate(null);
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const goNext = () => {
    setSelectedDate(null);
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isAllSubjects = selectedSubjectId === '__all__';
  const showMarks = !isAllSubjects;

  const selectedLabel = isAllSubjects
    ? 'All Subjects'
    : subjectMap[selectedSubjectId] || 'All Subjects';

  const selectedDayInfo = selectedDate ? dailyByDate[selectedDate] : null;

  return (
    <View style={styles.calendarContainer}>
      {/* Subject Filter Dropdown */}
      <View style={styles.dropdownWrap}>
        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() => setDropdownOpen(!dropdownOpen)}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownText} numberOfLines={1}>{selectedLabel}</Text>
          <MaterialCommunityIcons
            name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#111827"
          />
        </TouchableOpacity>

        {dropdownOpen && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={[styles.dropdownItem, selectedSubjectId === '__all__' && styles.dropdownItemActive]}
              onPress={() => { setSelectedSubjectId('__all__'); setDropdownOpen(false); setSelectedDate(null); }}
            >
              <Text style={[styles.dropdownItemText, selectedSubjectId === '__all__' && styles.dropdownItemTextActive]}>
                All Subjects
              </Text>
            </TouchableOpacity>
            {perSubject.map((s: any) => {
              const id = s.subject?.id;
              const name = s.subject?.name || 'Subject';
              const active = selectedSubjectId === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                  onPress={() => { setSelectedSubjectId(id); setDropdownOpen(false); setSelectedDate(null); }}
                >
                  <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>
                    {name}
                  </Text>
                  <Text style={styles.dropdownItemPct}>{s.percentage}%</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Month Navigation */}
      <View style={styles.calNav}>
        <TouchableOpacity onPress={goPrev} style={styles.calNavBtn}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.calMonthText}>{MONTHS[calMonth]} {calYear}</Text>
        <TouchableOpacity onPress={goNext} style={styles.calNavBtn}>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.calDayHeaders}>
        {DAYS_SHORT.map((d) => (
          <View key={d} style={styles.calDayHeaderCell}>
            <Text style={styles.calDayHeaderText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calGrid}>
        {cells.map((day, idx) => {
          if (day === null) return <View key={`e-${idx}`} style={styles.calCell} />;

          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const info = dailyByDate[dateStr];
          const isToday = dateStr === todayStr;
          const isSelected = selectedDate === dateStr;
          const hasRecords = Boolean(info && info.total > 0);
          const isAllPresent = showMarks && hasRecords && info.absent === 0;
          const isAllAbsent = showMarks && hasRecords && info.present === 0;
          const isPartial = showMarks && hasRecords && info.present > 0 && info.absent > 0;

          return (
            <TouchableOpacity
              key={idx}
              style={styles.calCell}
              onPress={() => {
                if (!isAllSubjects) {
                  const nextDate = isSelected ? null : dateStr;
                  setSelectedDate(nextDate);
                  if (nextDate) {
                    onDateSelect?.();
                  }
                }
              }}
              activeOpacity={isAllSubjects ? 1 : 0.7}
            >
              <View
                style={[
                  styles.calDayCircle,
                  isToday && styles.calDayCircleToday,
                  isAllPresent && styles.calDayCirclePresent,
                  isAllAbsent && styles.calDayCircleAbsent,
                  isPartial && styles.calDayCirclePartial,
                  isSelected && styles.calDayCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.calDayText,
                    isAllPresent && styles.calDayTextPresent,
                    isAllAbsent && styles.calDayTextAbsent,
                    isPartial && styles.calDayTextPartial,
                    isSelected && styles.calDayTextSelected,
                  ]}
                >
                  {day}
                </Text>

                {/* Multi-session dots row under day number (only shown when a specific subject is selected) */}
                {showMarks && hasRecords && info.total > 1 && (
                  <View style={styles.sessionDotsRow}>
                    {info.sessions.map((sess: any, sIdx: number) => {
                      const isP = sess.status !== 'absent';
                      return (
                        <View
                          key={sIdx}
                          style={[
                            styles.sessionMiniDot,
                            { backgroundColor: isP ? '#16A34A' : '#DC2626' },
                          ]}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend for Subject View */}
      {!isAllSubjects && (
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
            <Text style={styles.legendText}>Present</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FDC836' }]} />
            <Text style={styles.legendText}>Partial</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.legendText}>Absent</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#D1D5DB' }]} />
            <Text style={styles.legendText}>No record</Text>
          </View>
        </View>
      )}

      {/* Interactive Day Details Card when a date is selected for a subject */}
      {selectedDate && !isAllSubjects && (
        <View
          style={styles.dayDetailCard}
          onLayout={() => {
            onDateSelect?.();
          }}
        >
          <View style={styles.dayDetailHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.dayDetailTitleRow}>
                <Text style={styles.dayDetailDateTitle}>{formatDateFull(selectedDate)}</Text>
              </View>
              <Text style={styles.dayDetailSubjectSubtitle}>{selectedLabel}</Text>
            </View>

            {selectedDayInfo && selectedDayInfo.total > 0 ? (
              <View style={styles.dayDetailBadge}>
                <Text
                  style={[
                    styles.dayDetailBadgeText,
                    selectedDayInfo.absent === 0
                      ? styles.badgeTextPresent
                      : selectedDayInfo.present === 0
                      ? styles.badgeTextAbsent
                      : styles.badgeTextPartial,
                  ]}
                >
                  {selectedDayInfo.absent === 0
                    ? selectedDayInfo.total > 1 ? `All Present (${selectedDayInfo.present}/${selectedDayInfo.total})` : 'Present'
                    : selectedDayInfo.present === 0
                    ? selectedDayInfo.total > 1 ? `All Absent (0/${selectedDayInfo.total})` : 'Absent'
                    : `${selectedDayInfo.present}/${selectedDayInfo.total} Present`}
                </Text>
              </View>
            ) : (
              <View style={styles.dayDetailBadge}>
                <Text style={[styles.dayDetailBadgeText, styles.badgeTextNeutral]}>
                  No Class
                </Text>
              </View>
            )}
          </View>

          {/* Attendance Count Highlight Box */}
          <View style={styles.attendanceCountBox}>
            <View style={styles.attendanceCountLeft}>
              <View>
                <Text style={styles.attendanceCountMain}>
                  {selectedDayInfo && selectedDayInfo.total > 0
                    ? selectedDayInfo.total === 1
                      ? '1 Attendance Marked'
                      : `${selectedDayInfo.total} Attendances Marked`
                    : '0 Attendances Marked'}
                </Text>
                <Text style={styles.attendanceCountSub}>
                  {selectedDayInfo && selectedDayInfo.total > 0
                    ? `${selectedDayInfo.present} Present • ${selectedDayInfo.absent} Absent`
                    : `No attendance record for ${selectedLabel}`}
                </Text>
              </View>
            </View>

            {selectedDayInfo && selectedDayInfo.total > 1 && (
              <View style={styles.multiplePill}>
                <Text style={styles.multiplePillText}>{selectedDayInfo.total} Sessions</Text>
              </View>
            )}
          </View>

          <View style={styles.sessionsDivider} />

          {/* Breakdown for each attendance on this day (e.g. 2 attendances displayed below calendar) */}
          {selectedDayInfo && selectedDayInfo.total > 0 ? (
            <View style={styles.sessionsList}>
              {selectedDayInfo.sessions.map((sess: any, sIdx: number) => {
                const isP = sess.status !== 'absent';
                return (
                  <View key={sIdx} style={styles.sessionRow}>
                    <View style={styles.sessionRowLeft}>
                      <View style={styles.sessionIndexBadge}>
                        <Text style={styles.sessionIndexBadgeText}>
                          #{sIdx + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sessionSubjName}>
                          {selectedDayInfo.total > 1 ? `Attendance ${sIdx + 1}` : selectedLabel}
                        </Text>
                        {selectedDayInfo.total > 1 && (
                          <Text style={styles.sessionTimeLabel}>
                            {selectedLabel} • Session {sIdx + 1}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.sessionStatusPill}>
                      <Text
                        style={[
                          styles.sessionPillText,
                          isP ? styles.sessionPillTextPresent : styles.sessionPillTextAbsent,
                        ]}
                      >
                        {isP ? 'Present' : 'Absent'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.dayDetailEmpty}>
              <MaterialCommunityIcons name="calendar-remove-outline" size={28} color="#9CA3AF" />
              <Text style={styles.dayDetailEmptyText}>
                No attendance marked for {selectedLabel} on {formatDateFull(selectedDate)}.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    backgroundColor: '#FAF8F5',
  },

  /* Page Header */
  pageHeader: {
    paddingHorizontal: 2,
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 3,
    lineHeight: 18,
  },

  /* Term Selector */
  termSelectorWrap: {
    position: 'relative',
    zIndex: 20,
    marginBottom: 12,
  },
  termSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  termText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },
  termDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 4,
    overflow: 'hidden',
    zIndex: 30,
  },
  termDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE8',
  },
  termDropdownItemActive: {
    backgroundColor: '#FEF9ED',
  },
  termDropdownItemText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#374151',
  },
  termDropdownItemTextActive: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },

  /* Overall Card matching screenshot */
  overallCard: {
    backgroundColor: '#FFFDF9',
    borderRadius: 5,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3EFE8',
    marginBottom: 14,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  overallLeftCol: {
    flex: 1,
    paddingRight: 12,
  },
  overallLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginBottom: 2,
  },
  overallValue: {
    fontSize: 30,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginVertical: 2,
  },
  overallSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 2,
  },
  overallDivider: {
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  donutCenterText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  /* Segmented Toggle Buttons matching screenshot */
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#FDC836',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleBtnInactive: {
    backgroundColor: '#F3EFE8',
  },
  toggleText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
  },
  toggleTextActive: {
    color: '#111827',
  },
  toggleTextInactive: {
    color: '#6B7280',
  },

  /* Subject Wise List */
  subjectList: {
    gap: 10,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F3EFE8',
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  subjectCardLeft: {
    flex: 1,
    paddingRight: 10,
  },
  subjectCode: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
  },
  subjectName: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginTop: 1,
  },
  subjectClasses: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
  },
  subjectCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectMetrics: {
    alignItems: 'flex-end',
    gap: 5,
  },
  subjectPct: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  progressTrack: {
    width: 72,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },

  /* Empty State */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 8,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Calendar Monthly View */
  calendarContainer: {
    gap: 12,
  },
  dropdownWrap: {
    position: 'relative',
    zIndex: 10,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: '#111827',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE8',
  },
  dropdownItemActive: {
    backgroundColor: '#FEF9ED',
  },
  dropdownItemText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },
  dropdownItemTextActive: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  dropdownItemPct: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#6B7280',
  },

  calNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calMonthText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  calDayHeaders: {
    flexDirection: 'row',
  },
  calDayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  calDayHeaderText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: '#6B7280',
    textTransform: 'uppercase',
  },

  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  calDayCircleToday: {
    borderColor: '#FDC836',
  },
  calDayCircleSelected: {
    borderColor: '#111827',
    borderWidth: 2,
  },
  calDayCirclePresent: {
    backgroundColor: 'rgba(22, 163, 74, 0.16)',
  },
  calDayCircleAbsent: {
    backgroundColor: 'rgba(220, 38, 38, 0.16)',
  },
  calDayCirclePartial: {
    backgroundColor: 'rgba(253, 200, 54, 0.22)',
    borderColor: '#FDC836',
  },
  calDayText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },
  calDayTextPresent: {
    color: '#15803D',
    fontFamily: FontFamily.bold,
  },
  calDayTextAbsent: {
    color: '#DC2626',
    fontFamily: FontFamily.bold,
  },
  calDayTextPartial: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  calDayTextSelected: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  sessionDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2.5,
    marginTop: 1,
  },
  sessionMiniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },

  /* Day Detail Card */
  dayDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 12,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  dayDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayDetailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayDetailDateTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  dayDetailSubjectSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 2,
  },
  dayDetailBadge: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  dayDetailBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  badgeTextPresent: {
    color: '#15803D',
  },
  badgeTextAbsent: {
    color: '#DC2626',
  },
  badgeTextPartial: {
    color: '#D97706',
  },
  badgeTextNeutral: {
    color: '#6B7280',
  },

  /* Attendance Count Box */
  attendanceCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attendanceCountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  attendanceCountMain: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  attendanceCountSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1,
  },
  multiplePill: {
    backgroundColor: '#FEF9ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FDC836',
  },
  multiplePillText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#92400E',
  },

  sessionsDivider: {
    height: 1,
    backgroundColor: '#F3EFE8',
  },
  sessionsList: {
    gap: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  sessionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sessionIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3EFE8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionIndexBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  sessionSubjName: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  sessionTimeLabel: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1,
  },
  sessionStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sessionPillText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
  },
  sessionPillTextPresent: {
    color: '#15803D',
  },
  sessionPillTextAbsent: {
    color: '#DC2626',
  },
  dayDetailEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  dayDetailEmptyText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
  },
});

