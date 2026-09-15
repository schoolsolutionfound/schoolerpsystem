import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchParentAttendanceApi } from '../../../api/academics';
import { useUserStore } from '../../../store/useUserStore';
import { FontFamily } from '../../../constants/fonts';

type ViewMode = 'list' | 'calendar';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
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

export const ParentAttendanceView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<ViewMode>('list');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const childName = useUserStore((s) => s.childName) || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchParentAttendanceApi();
      setData(res);
    } catch (err: any) {
      console.warn('[ParentAttendance]', err.message);
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

  if (loading && !refreshing) {
    return (
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.loadingCard}>
          <MaterialCommunityIcons name="book-check-outline" size={32} color="#E8E5DC" />
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      </ScrollView>
    );
  }

  const overall = data?.overall;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} progressBackgroundColor="#FFFFFF" />
      }
    >
      {/* Overall Card */}
      <View style={styles.overallCard}>
        <View style={styles.ring}>
          <Text style={styles.ringValue}>{overall?.percentage ?? 0}%</Text>
          <Text style={styles.ringLabel}>Attendance</Text>
        </View>
        <View style={styles.overallStats}>
          <Stat label="Present" value={overall?.present ?? 0} color="#16A34A" />
          <Stat label="Absent" value={(overall?.total ?? 0) - (overall?.present ?? 0)} color="#DC2626" />
          <Stat label="Total" value={overall?.total ?? 0} color="#6B6B6B" />
        </View>
      </View>

      {childName ? (
        <View style={styles.childTag}>
          <MaterialCommunityIcons name="account-heart" size={14} color="#F4C430" />
          <Text style={styles.childTagText}>{childName}'s Attendance</Text>
        </View>
      ) : null}

      {/* View Toggle */}
      <View style={styles.toggleRow}>
        {(['list', 'calendar'] as ViewMode[]).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.toggleBtn, mode === v && styles.toggleBtnActive]}
            onPress={() => setMode(v)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={v === 'list' ? 'format-list-bulleted' : 'calendar-month-outline'}
              size={16}
              color={mode === v ? '#FFFFFF' : '#6B6B6B'}
            />
            <Text style={[styles.toggleText, mode === v && styles.toggleTextActive]}>
              {v === 'list' ? 'List' : 'Calendar'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'list' ? (
        <ListView data={data} />
      ) : (
        <CalendarView
          calMonth={calMonth}
          calYear={calYear}
          setCalMonth={setCalMonth}
          setCalYear={setCalYear}
          data={data}
        />
      )}
    </ScrollView>
  );
};

/* ─── List View ──────────────────────────────────────────────────────────── */

const ListView: React.FC<{ data: any }> = ({ data }) => {
  const perSubject = data?.perSubject || [];

  if (perSubject.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <MaterialCommunityIcons name="chart-donut" size={40} color="#6B6B6B" />
        <Text style={styles.emptyTitle}>No attendance records</Text>
        <Text style={styles.emptySub}>Attendance appears once teachers mark classes.</Text>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.sectionTitle}>Per Subject</Text>
      {perSubject.map((row: any, i: number) => (
        <View key={i} style={styles.subjectCard}>
          <View style={styles.subjectHeader}>
            <Text style={styles.subjectName}>{row.subject?.name || 'Subject'}</Text>
            <Text style={[styles.subjectPct, { color: row.percentage >= 75 ? '#16A34A' : '#DC2626' }]}>
              {row.percentage}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(row.percentage, 100)}%`, backgroundColor: row.percentage >= 75 ? '#16A34A' : '#DC2626' }]} />
          </View>
          <Text style={styles.subjectDetail}>{row.present} present / {row.total} total</Text>
        </View>
      ))}
    </>
  );
};

/* ─── Calendar View ──────────────────────────────────────────────────────── */

interface CalendarViewProps {
  calMonth: number;
  calYear: number;
  setCalMonth: (m: number) => void;
  setCalYear: (y: number) => void;
  data: any;
}

const CalendarView: React.FC<CalendarViewProps> = ({ calMonth, calYear, setCalMonth, setCalYear, data }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('__all__');
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
    const map: Record<string, { present: number; absent: number; total: number }> = {};
    for (const r of filteredDaily) {
      if (!map[r.date]) map[r.date] = { present: 0, absent: 0, total: 0 };
      map[r.date].total++;
      if (r.status === 'absent') map[r.date].absent++;
      else map[r.date].present++;
    }
    return map;
  }, [filteredDaily]);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const today = new Date();
  const todayStr = toDateStr(today);

  const goPrev = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const goNext = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedLabel = selectedSubjectId === '__all__'
    ? 'All Subjects'
    : subjectMap[selectedSubjectId] || 'All Subjects';

  return (
    <>
      {/* Subject Dropdown */}
      <View style={styles.dropdownWrap}>
        <TouchableOpacity
          style={styles.dropdownBtn}
          onPress={() => setDropdownOpen(!dropdownOpen)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="book-open-variant" size={16} color="#F4C430" />
          <Text style={styles.dropdownText} numberOfLines={1}>{selectedLabel}</Text>
          <MaterialCommunityIcons
            name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        {dropdownOpen && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={[styles.dropdownItem, selectedSubjectId === '__all__' && styles.dropdownItemActive]}
              onPress={() => { setSelectedSubjectId('__all__'); setDropdownOpen(false); }}
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
                  onPress={() => { setSelectedSubjectId(id); setDropdownOpen(false); }}
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

      {/* Month Nav */}
      <View style={styles.calNav}>
        <TouchableOpacity onPress={goPrev} style={styles.calNavBtn}>
          <MaterialCommunityIcons name="chevron-left" size={22} color="#1A1B1C" />
        </TouchableOpacity>
        <Text style={styles.calMonthText}>{MONTHS[calMonth]} {calYear}</Text>
        <TouchableOpacity onPress={goNext} style={styles.calNavBtn}>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#1A1B1C" />
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
          const allPresent = info && info.absent === 0;
          const hasAbsent = info && info.absent > 0;

          return (
            <View key={idx} style={styles.calCell}>
              <View
                style={[
                  styles.calDayCircle,
                  isToday && styles.calDayCircleToday,
                  allPresent && styles.calDayCirclePresent,
                  hasAbsent && styles.calDayCircleAbsent,
                ]}
              >
                <Text style={styles.calDayText}>{day}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
          <Text style={styles.legendText}>Present</Text>
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

      {/* Month Summary */}
      {Object.keys(dailyByDate).length > 0 && (
        <View style={styles.calSummaryCard}>
          <Text style={styles.calSummaryTitle}>Monthly Summary</Text>
          {Object.entries(dailyByDate)
            .filter(([d]) => {
              const dt = new Date(d);
              return dt.getMonth() === calMonth && dt.getFullYear() === calYear;
            })
            .sort(([a], [b]) => (a > b ? -1 : 1))
            .slice(0, 8)
            .map(([d, info]) => (
              <View key={d} style={styles.calSummaryRow}>
                <Text style={styles.calSummaryDate}>{d}</Text>
                <Text style={[styles.calSummaryStatus, { color: info.absent > 0 ? '#DC2626' : '#16A34A' }]}>
                  {info.absent > 0 ? `${info.absent} absent` : `${info.present} present`}
                </Text>
              </View>
            ))}
        </View>
      )}
    </>
  );
};

/* ─── Shared ─────────────────────────────────────────────────────────────── */

const Stat = ({ label, value, color }: any) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { padding: 12, paddingBottom: 40, gap: 12 },

  loadingCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E8E5DC' },
  loadingText: { fontSize: 13, fontFamily: FontFamily.medium, color: '#6B6B6B', marginTop: 8 },

  childTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(244,196,48,0.1)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(244,196,48,0.2)',
  },
  childTagText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#F4C430' },

  overallCard: {
    backgroundColor: '#1A1B1C', borderRadius: 10, padding: 18, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#2A2B2C',
  },
  ring: { alignItems: 'center' },
  ringValue: { fontSize: 32, fontFamily: FontFamily.extrabold, color: '#F4C430' },
  ringLabel: { fontSize: 10, fontFamily: FontFamily.bold, color: '#8A8A8A', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 },
  overallStats: { flexDirection: 'row', gap: 18 },
  statValue: { fontSize: 20, fontFamily: FontFamily.extrabold },
  statLabel: { fontSize: 10, fontFamily: FontFamily.bold, color: '#8A8A8A', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 },

  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    gap: 4,
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
    backgroundColor: '#1A1B1C',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: { fontSize: 13, fontFamily: FontFamily.bold, color: '#6B6B6B' },
  toggleTextActive: { color: '#FFFFFF' },

  sectionTitle: { fontSize: 10, fontFamily: FontFamily.bold, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8, marginBottom: 4, paddingHorizontal: 4 },

  subjectCard: {
    backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E8E5DC',
    padding: 14, marginBottom: 8,
  },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectName: { fontSize: 14, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  subjectPct: { fontSize: 14, fontFamily: FontFamily.extrabold },
  progressTrack: { height: 6, backgroundColor: '#F3F1EA', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  subjectDetail: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B', marginTop: 6 },

  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E8E5DC', marginTop: 10 },
  emptyTitle: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#1A1B1C', marginTop: 8 },
  emptySub: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', textAlign: 'center', marginTop: 4 },

  calNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  calNavBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  calMonthText: { fontSize: 16, fontFamily: FontFamily.extrabold, color: '#1A1B1C' },

  calDayHeaders: { flexDirection: 'row' },
  calDayHeaderCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  calDayHeaderText: { fontSize: 10, fontFamily: FontFamily.bold, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.5 },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: '14.28%', aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  calDayCircle: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  calDayCircleToday: { borderColor: '#1A1B1C' },
  calDayCirclePresent: { backgroundColor: 'rgba(22, 163, 74, 0.18)' },
  calDayCircleAbsent: { backgroundColor: 'rgba(220, 38, 38, 0.18)' },
  calDayText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#1A1B1C' },

  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: FontFamily.semibold, color: '#6B6B6B' },

  calSummaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#E8E5DC', gap: 8,
  },
  calSummaryTitle: { fontSize: 12, fontFamily: FontFamily.extrabold, color: '#1A1B1C', marginBottom: 2 },
  calSummaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#F3F1EA',
  },
  calSummaryDate: { fontSize: 12, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  calSummaryStatus: { fontSize: 12, fontFamily: FontFamily.bold },

  dropdownWrap: { position: 'relative', zIndex: 10 },
  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1A1B1C', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  dropdownText: { flex: 1, fontSize: 13, fontFamily: FontFamily.bold, color: '#FFFFFF' },
  dropdownMenu: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    backgroundColor: '#1A1B1C', borderRadius: 10,
    shadowColor: '#171717', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
    zIndex: 20, marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#2A2B2C',
  },
  dropdownItemActive: { backgroundColor: '#2A2B2C' },
  dropdownItemText: { fontSize: 13, fontFamily: FontFamily.semibold, color: '#FFFFFF' },
  dropdownItemTextActive: { color: '#F4C430' },
  dropdownItemPct: { fontSize: 12, fontFamily: FontFamily.bold, color: '#8A8A8A' },
});
