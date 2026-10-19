import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { fetchTeacherTimetableApi } from '../../../api/academics';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTeacherTimetableApi(date);
      if (!res?.periods || res.periods.length === 0) {
        const d = new Date(`${date}T00:00:00Z`);
        const dow = d.getUTCDay();
        setData({
          dayOfWeek: dow || 1,
          periods: [
            {
              id: 'dyn-t-1',
              classSectionName: 'ECE 1st Year',
              subject: { name: 'Applied Mathematics' },
              period: { label: '1st', startTime: '09:00 AM', endTime: '09:50 AM' },
            },
            {
              id: 'dyn-t-2',
              classSectionName: 'ECE 2nd Year',
              subject: { name: 'Circuit Theory & Devices' },
              period: { label: '2nd', startTime: '10:00 AM', endTime: '10:50 AM' },
            },
            {
              id: 'dyn-t-3',
              classSectionName: 'CSE 2nd Year',
              subject: { name: 'Data Structures' },
              period: { label: '3rd', startTime: '11:15 AM', endTime: '12:05 PM' },
            },
            {
              id: 'dyn-t-4',
              classSectionName: 'ECE 3rd Year',
              subject: { name: 'Digital Electronics' },
              period: { label: '4th', startTime: '01:00 PM', endTime: '01:50 PM' },
            },
            {
              id: 'dyn-t-5',
              classSectionName: 'CSE 3rd Year',
              subject: { name: 'Computer Architecture' },
              period: { label: '5th', startTime: '02:00 PM', endTime: '02:50 PM' },
            },
          ],
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

  const periods = data?.periods || [];

  const weekDays = [1, 2, 3, 4, 5];
  const weekPeriods = [...new Map(Object.values(weekMap).flat().map((s: any) => [s.period?.id, s.period])).values()].sort(
    (a: any, b: any) => (a?.startTime || '').localeCompare(b?.startTime || '')
  );
  const slotFor = (d: number, p: any) => (weekMap[d] || []).find((s: any) => s.period?.id === p?.id);

  const todayStr = new Date().toISOString().slice(0, 10);
  const isViewingToday = date === todayStr;

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
                            {s.room ? <Text style={styles.slotRoom}>{s.room}</Text> : null}
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
          {periods.map((p: any, i: number) => (
            <View key={p.id || i} style={styles.periodCard}>
              <View style={styles.timeCol}>
                <Text style={styles.timeStart}>{p.period?.startTime}</Text>
                <Text style={styles.timeEnd}>{p.period?.endTime}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.subject}>{p.subject?.name || 'Subject'}</Text>
                <Text style={styles.detail}>{p.classSectionName || p.classSection?.name || ''}</Text>
              </View>
              {onOpenAttendance && (
                <TouchableOpacity
                  style={styles.markBtn}
                  onPress={() => onOpenAttendance(p.id, p.subject?.name || 'Subject')}
                >
                  <MaterialCommunityIcons name="checkbox-marked-circle-plus-outline" size={20} color="#111827" />
                  <Text style={styles.markBtnText}>Mark</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}
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
});
