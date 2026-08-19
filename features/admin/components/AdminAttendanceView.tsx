import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { fetchClassAttendanceApi } from '../../../api/academics';

interface AdminAttendanceViewProps {
  classSections: any[];
}

type ViewMode = 'calendar' | 'students' | 'subjects';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function pctColor(pct?: number): string {
  if (pct === undefined || pct === null) return '#E2E8F0';
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
      <Text style={styles.sectionTitle}>Select Class / Section</Text>
      {classSections.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="account-school-outline" size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No classes yet</Text>
          <Text style={styles.emptySub}>Create a class/section first. Attendance appears once teachers mark classes.</Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {classSections.map((c: any) => {
              const selected = c.id === selectedId;
              return (
                <TouchableOpacity key={c.id} style={[styles.chip, selected && styles.chipSelected]} onPress={() => setSelectedId(c.id)}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {!selectedId ? null : (
            <>
              <View style={styles.modeRow}>
                {(['calendar', 'students', 'subjects'] as const).map((m) => (
                  <TouchableOpacity key={m} style={[styles.modeChip, mode === m && styles.modeChipActive]} onPress={() => setMode(m)}>
                    <MaterialCommunityIcons
                      name={m === 'calendar' ? 'calendar-month' : m === 'students' ? 'account-multiple' : 'book-open-variant'}
                      size={15}
                      color={mode === m ? '#7E57C2' : '#64748B'}
                    />
                    <Text style={[styles.modeChipText, mode === m && styles.modeChipTextActive]}>
                      {m === 'calendar' ? 'Calendar' : m === 'students' ? 'Students' : 'Subjects'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.monthBar}>
                <TouchableOpacity onPress={() => setMonthOffset((o) => o - 1)}>
                  <MaterialCommunityIcons name="chevron-left" size={24} color="#7E57C2" />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>{MONTHS[month.getMonth()]} {month.getFullYear()}</Text>
                <TouchableOpacity onPress={() => setMonthOffset((o) => o + 1)}>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#7E57C2" />
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
                    <SummaryStat label="Excused" value={summary.excused} color="#64748B" />
                  </View>
                </View>
              ) : null}

              {loading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color="#7E57C2" />
                </View>
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
          <LegendItem color="#E2E8F0" label="No data" />
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
          <MaterialCommunityIcons name="account-multiple-outline" size={40} color="#94A3B8" />
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
          <MaterialCommunityIcons name="book-open-variant" size={40} color="#94A3B8" />
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
  container: { flex: 1, padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A202C', marginBottom: 10 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 6,
  },
  chipSelected: { backgroundColor: '#7E57C2', borderColor: '#7E57C2' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  chipTextSelected: { color: '#FFFFFF' },
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modeChipActive: { backgroundColor: '#EDE7F6', borderColor: '#7E57C2' },
  modeChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  modeChipTextActive: { color: '#7E57C2' },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  monthTitle: { fontSize: 15, fontWeight: '800', color: '#1A202C' },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  summaryAvg: { alignItems: 'center' },
  summaryAvgValue: { fontSize: 24, fontWeight: '900', color: '#7E57C2' },
  summaryAvgLabel: { fontSize: 11, color: '#718096', marginTop: 2 },
  summaryStats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  summaryStatItem: { alignItems: 'center' },
  summaryStatValue: { fontSize: 16, fontWeight: '800' },
  summaryStatLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  centerBox: { justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  calWeekRow: { flexDirection: 'row', marginBottom: 6 },
  calWeekLabel: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  calCellSelected: { backgroundColor: '#EDE7F6', borderRadius: 8 },
  calDayNum: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  calDayToday: { color: '#7E57C2', fontWeight: '800' },
  calDot: { width: 7, height: 7, borderRadius: 4 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: '#64748B' },
  dayDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  dayDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayDetailTitle: { fontSize: 14, fontWeight: '800', color: '#1A202C' },
  dayDetailPct: { fontSize: 18, fontWeight: '900' },
  dayDetailStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  dayDetailText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  dayDetailHint: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
  listMeta: { fontSize: 12, color: '#718096', marginBottom: 10 },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 13, fontWeight: '800', color: '#7E57C2' },
  studentInfo: { flex: 1, gap: 4 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1A202C' },
  studentSub: { fontSize: 11, color: '#718096' },
  progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  studentPct: { fontSize: 14, fontWeight: '800', width: 52, textAlign: 'right' },
  loadMoreBtn: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: '#7E57C2',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: { fontSize: 13, fontWeight: '700', color: '#7E57C2' },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 8,
  },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectName: { fontSize: 14, fontWeight: '700', color: '#1A202C' },
  subjectPct: { fontSize: 14, fontWeight: '800' },
  subjectDetail: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#718096', textAlign: 'center', marginTop: 4, lineHeight: 16 },
});