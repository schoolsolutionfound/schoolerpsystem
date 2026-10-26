import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchClassAttendanceApi } from '../../../api/academics';
import { ShimmerSkeleton, ShimmerProvider } from '../../student/components/ShimmerSkeleton';
import { DropdownSelect } from './DropdownSelect';

interface AdminAttendanceViewProps {
  classSections: any[];
}

type ViewMode = 'calendar' | 'students' | 'subjects';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pctColor(pct?: number): string {
  if (pct === undefined || pct === null) return '#E8E5DC';
  if (pct >= 85) return '#16A34A';
  if (pct >= 60) return '#D97706';
  return '#DC2626';
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const AdminAttendanceView: React.FC<AdminAttendanceViewProps> = ({ classSections }) => {
  const [selectedId, setSelectedId] = useState<string>(classSections[0]?.id || '');
  const [mode, setMode] = useState<ViewMode>('calendar');
  const [monthOffset, setMonthOffset] = useState(0);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const month = (() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  })();

  const rangeForMonth = () => {
    const fromDate = dateKey(month);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const today = new Date();
    const isCurrent = monthOffset === 0;
    const end = isCurrent && today < lastDay ? today : lastDay;
    return { fromDate, toDate: dateKey(end) };
  };

  const load = useCallback(async (classSectionId: string, fromDate: string, toDate: string, offset: number, append: boolean) => {
    try {
      const res = await fetchClassAttendanceApi({ classSectionId, fromDate, toDate, limit: 100, offset });
      if (append) {
        setStudents((prev) => [...prev, ...(res?.students || [])]);
      } else {
        setStudents(res?.students || []);
      }
      setData(res);
    } catch (err: any) {
      console.warn('[AdminAttendance]', err.message);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const { fromDate, toDate } = rangeForMonth();
    setSelectedDay(null);
    load(selectedId, fromDate, toDate, 0, false).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, monthOffset]);

  const handleLoadMore = async () => {
    if (!selectedId || loadingMore) return;
    const { fromDate, toDate } = rangeForMonth();
    setLoadingMore(true);
    try {
      await load(selectedId, fromDate, toDate, students.length, true);
    } finally {
      setLoadingMore(false);
    }
  };

  const daysMap = new Map<string, any>((data?.days || []).map((d: any) => [d.date, d]));

  const calendarCells = (() => {
    const firstWeekday = month.getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(month.getFullYear(), month.getMonth(), day));
    return cells;
  })();

  const summary = data?.summary;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Class Attendance</Text>
          <Text style={styles.sectionCount}>{classSections.length} classes</Text>
        </View>
      </View>
      {classSections.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconTile}>
            <MaterialCommunityIcons name="account-school-outline" size={30} color="#F4C430" />
          </View>
          <Text style={styles.emptyTitle}>No classes yet</Text>
          <Text style={styles.emptySub}>Create a class/section first. Attendance appears once teachers mark classes.</Text>
        </View>
      ) : (
        <>
          <DropdownSelect
            label="Class / Section"
            value={selectedId}
            onChange={setSelectedId}
            placeholder="Select class"
            options={classSections.map((c: any) => ({ key: c.id, label: c.name }))}
            menuTitle="Class / Section"
            leadingIcon="school-outline"
          />

          {!selectedId ? null : (
            <>
              <View style={styles.toggleRow}>
                {(['calendar', 'students', 'subjects'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
                    onPress={() => setMode(m)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={m === 'calendar' ? 'calendar-month' : m === 'students' ? 'account-multiple' : 'book-open-variant'}
                      size={15}
                      color={mode === m ? '#FFFFFF' : '#6B6B6B'}
                    />
                    <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                      {m === 'calendar' ? 'Calendar' : m === 'students' ? 'Students' : 'Subjects'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.monthBar}>
                <TouchableOpacity style={styles.monthBtn} onPress={() => setMonthOffset((o) => o - 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="chevron-left" size={20} color="#6B6B6B" />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>{MONTHS[month.getMonth()]} {month.getFullYear()}</Text>
                <TouchableOpacity style={styles.monthBtn} onPress={() => setMonthOffset((o) => o + 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#6B6B6B" />
                </TouchableOpacity>
              </View>

              {summary ? (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryAvg}>
                    <Text style={styles.summaryAvgValue}>{summary.averagePercentage}%</Text>
                    <Text style={styles.summaryAvgLabel}>Avg Attendance</Text>
                  </View>
                  <View style={styles.summaryStats}>
                    <SummaryStat label="Present" value={summary.present} color="#16A34A" />
                    <SummaryStat label="Absent" value={summary.absent} color="#DC2626" />
                    <SummaryStat label="Late" value={summary.late} color="#D97706" />
                    <SummaryStat label="Excused" value={summary.excused} color="#6B6B6B" />
                  </View>
                </View>
              ) : null}

              {loading ? (
                <ShimmerProvider>
                  <View style={{ gap: 12 }}>
                    <ShimmerSkeleton width="100%" height={90} borderRadius={5} />
                    <ShimmerSkeleton width="30%" height={12} borderRadius={5} />
                    <ShimmerSkeleton width="100%" height={280} borderRadius={5} />
                  </View>
                </ShimmerProvider>
              ) : mode === 'calendar' ? (
                <CalendarView cells={calendarCells} daysMap={daysMap} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
              ) : mode === 'students' ? (
                <StudentsView
                  students={students}
                  total={data?.total || 0}
                  loadingMore={loadingMore}
                  onLoadMore={handleLoadMore}
                />
              ) : (
                <SubjectsView subjects={data?.subjects || []} />
              )}
            </>
          )}
        </>
      )}
    </View>
  );
};

function SummaryStat({ label, value, color }: any) {
  return (
    <View style={styles.summaryStatItem}>
      <Text style={[styles.summaryStatValue, { color }]}>{value}</Text>
      <Text style={styles.summaryStatLabel}>{label}</Text>
    </View>
  );
}

function CalendarView({ cells, daysMap, selectedDay, onSelectDay }: any) {
  const selected = selectedDay ? daysMap.get(selectedDay) : null;
  return (
    <>
      <View style={styles.calendarCard}>
        <View style={styles.calWeekRow}>
          {WEEKDAY_LABELS.map((w) => (
            <Text key={w} style={styles.calWeekLabel}>{w}</Text>
          ))}
        </View>
        <View style={styles.calGrid}>
          {cells.map((day: Date | null, i: number) => {
            if (!day) {
              return <View key={`blank-${i}`} style={styles.calCell} />;
            }
            const key = dateKey(day);
            const stat = daysMap.get(key);
            const isSelected = selectedDay === key;
            const isToday = key === dateKey(new Date());
            return (
              <TouchableOpacity
                key={key}
                style={[styles.calCell, isSelected && styles.calCellSelected]}
                onPress={() => onSelectDay(isSelected ? null : key)}
              >
                <Text style={[styles.calDayNum, isToday && styles.calDayToday]}>{day.getDate()}</Text>
                <View style={[styles.calDot, { backgroundColor: pctColor(stat?.percentage) }]} />
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <LegendItem color="#16A34A" label="≥85%" />
          <LegendItem color="#D97706" label="60–84%" />
          <LegendItem color="#DC2626" label="<60%" />
          <LegendItem color="#E8E5DC" label="No data" />
        </View>
      </View>

      {selected ? (
        <View style={styles.dayDetailCard}>
          <View style={styles.dayDetailHeader}>
            <Text style={styles.dayDetailTitle}>{formatDayTitle(selectedDay)}</Text>
            <Text style={[styles.dayDetailPct, { color: pctColor(selected.percentage) }]}>{selected.percentage}%</Text>
          </View>
          <View style={styles.dayDetailStats}>
            <Text style={styles.dayDetailText}>✓ {selected.present} present</Text>
            <Text style={styles.dayDetailText}>✗ {selected.absent} absent</Text>
            <Text style={styles.dayDetailText}>⏰ {selected.late} late</Text>
            <Text style={styles.dayDetailText}>• {selected.excused} excused</Text>
          </View>
        </View>
      ) : (
        <View style={styles.dayDetailCard}>
          <Text style={styles.dayDetailHint}>Tap a day in the calendar to see its attendance breakdown.</Text>
        </View>
      )}
    </>
  );
}

function LegendItem({ color, label }: any) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function formatDayTitle(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return `${DAY_NAMES[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}`;
}

function StudentsView({ students, total, loadingMore, onLoadMore }: any) {
  return (
    <View>
      <Text style={styles.listMeta}>{total} students in this class</Text>
      {students.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="account-multiple-outline" size={40} color="#6B6B6B" />
          <Text style={styles.emptyTitle}>No students enrolled</Text>
        </View>
      ) : (
        students.map((s: any) => (
          <View key={s.studentId} style={styles.studentCard}>
            <View style={styles.studentAvatar}>
              <Text style={styles.studentAvatarText}>{s.fullName?.substring(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{s.fullName}</Text>
              <Text style={styles.studentSub}>
                {s.rollNoOrUSN || 'USN'} · {s.total} classes
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(s.percentage, 100)}%`, backgroundColor: pctColor(s.percentage) }]} />
              </View>
            </View>
            <Text style={[styles.studentPct, { color: pctColor(s.percentage) }]}>{s.percentage}%</Text>
          </View>
        ))
      )}
      {students.length < total ? (
        <TouchableOpacity style={styles.loadMoreBtn} onPress={onLoadMore} disabled={loadingMore}>
          <Text style={styles.loadMoreText}>{loadingMore ? 'Loading...' : `Load more (${total - students.length} remaining)`}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function SubjectsView({ subjects }: any) {
  return (
    <View>
      {subjects.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="book-open-variant" size={40} color="#6B6B6B" />
          <Text style={styles.emptyTitle}>No attendance recorded</Text>
          <Text style={styles.emptySub}>Once teachers mark classes, subject-wise attendance shows here.</Text>
        </View>
      ) : (
        subjects.map((s: any) => (
          <View key={s.subjectId} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectName}>{s.subjectName}</Text>
              <Text style={[styles.subjectPct, { color: pctColor(s.percentage) }]}>{s.percentage}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(s.percentage, 100)}%`, backgroundColor: pctColor(s.percentage) }]} />
            </View>
            <Text style={styles.subjectDetail}>
              {s.present} present · {s.absent} absent · {s.late} late · {s.total} total
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  sectionCount: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    gap: 4,
    marginTop: 14,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#F4C430',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  toggleTextActive: { color: '#1A1B1C' },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 10,
    marginTop: 14,
    marginBottom: 10,
  },
  monthBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center',
  },
  monthTitle: { fontSize: 15, fontWeight: '800', color: '#1A1B1C' },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  summaryAvg: { alignItems: 'center' },
  summaryAvgValue: { fontSize: 24, fontWeight: '900', color: '#111827' },
  summaryAvgLabel: { fontSize: 9, color: '#6B7280', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  summaryStats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  summaryStatItem: { alignItems: 'center' },
  summaryStatValue: { fontSize: 16, fontWeight: '800', color: '#111827' },
  summaryStatLabel: { fontSize: 9, color: '#6B7280', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    shadowColor: '#1A1B1C', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  calWeekRow: { flexDirection: 'row', marginBottom: 6 },
  calWeekLabel: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.5 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  calCellSelected: { backgroundColor: '#F4C430', borderRadius: 10},
  calDayNum: { fontSize: 13, fontWeight: '600', color: '#1A1B1C' },
  calDayToday: { color: '#F4C430', fontWeight: '800' },
  calDot: { width: 7, height: 7, borderRadius: 5},
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 5},
  legendText: { fontSize: 10, color: '#6B6B6B' },
  dayDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    marginTop: 12,
    gap: 8,
    shadowColor: '#1A1B1C', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  dayDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayDetailTitle: { fontSize: 14, fontWeight: '800', color: '#1A1B1C' },
  dayDetailPct: { fontSize: 18, fontWeight: '900' },
  dayDetailStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  dayDetailText: { fontSize: 12, color: '#6B6B6B', fontWeight: '600' },
  dayDetailHint: { fontSize: 12, color: '#6B6B6B', textAlign: 'center' },
  listMeta: { fontSize: 10, color: '#8A8A8A', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '800' },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#1A1B1C', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 5,
    backgroundColor: '#1A1B1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  studentInfo: { flex: 1, gap: 4 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1A1B1C' },
  studentSub: { fontSize: 11, color: '#6B6B6B' },
  progressTrack: { height: 6, backgroundColor: '#F3F1EA', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 5},
  studentPct: { fontSize: 14, fontWeight: '800', width: 52, textAlign: 'right' },
  loadMoreBtn: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F4C430',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: { fontSize: 13, fontWeight: '700', color: '#F4C430' },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    marginBottom: 8,
    shadowColor: '#1A1B1C', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectName: { fontSize: 14, fontWeight: '700', color: '#1A1B1C' },
  subjectPct: { fontSize: 14, fontWeight: '800' },
  subjectDetail: { fontSize: 11, color: '#6B6B6B', marginTop: 6 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 20,
  },
  emptyIconTile: {
    width: 56, height: 56, borderRadius: 12, backgroundColor: '#1A1B1C',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4, lineHeight: 16 },
});