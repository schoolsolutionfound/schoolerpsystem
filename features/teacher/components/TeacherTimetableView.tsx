import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { fetchTeacherTimetableApi } from '../../../api/academics';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface TeacherTimetableViewProps {
  onOpenAttendance?: (slotId: string, subjectName: string) => void;
}

export const TeacherTimetableView: React.FC<TeacherTimetableViewProps> = ({ onOpenAttendance }) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'day' | 'week'>('day');
  const [weekMap, setWeekMap] = useState<Record<number, any[]>>({});
  const [weekLoading, setWeekLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTeacherTimetableApi(date);
      setData(res);
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

  return (
    <View style={styles.container}>
      <View style={styles.dateBar}>
        <TouchableOpacity onPress={() => shiftDay(-1)}><MaterialCommunityIcons name="chevron-left" size={24} color="#7E57C2" /></TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.dateTitle}>{dayLabel}</Text>
          <Text style={styles.dateSub}>{periods.length} periods today</Text>
        </View>
        <TouchableOpacity onPress={() => shiftDay(1)}><MaterialCommunityIcons name="chevron-right" size={24} color="#7E57C2" /></TouchableOpacity>
      </View>

      <View style={styles.viewRow}>
        <TouchableOpacity style={[styles.viewChip, view === 'day' && styles.viewChipActive]} onPress={() => switchView('day')}>
          <MaterialCommunityIcons name="calendar-today" size={15} color={view === 'day' ? '#7E57C2' : '#64748B'} />
          <Text style={[styles.viewChipText, view === 'day' && styles.viewChipTextActive]}>Day</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.viewChip, view === 'week' && styles.viewChipActive]} onPress={() => switchView('week')}>
          <MaterialCommunityIcons name="calendar-week" size={15} color={view === 'week' ? '#7E57C2' : '#64748B'} />
          <Text style={[styles.viewChipText, view === 'week' && styles.viewChipTextActive]}>Week</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}><ActivityIndicator size="large" color="#7E57C2" /></View>
      ) : view === 'week' ? (
        weekLoading ? (
          <View style={styles.centerBox}><ActivityIndicator size="large" color="#7E57C2" /></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekWrap}>
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
          <MaterialCommunityIcons name="calendar-blank" size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No classes scheduled</Text>
          <Text style={styles.emptySub}>You have no periods assigned on this day.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {periods.map((p: any, i: number) => (
            <View key={p.id || i} style={styles.periodCard}>
              <View style={styles.timeCol}>
                <Text style={styles.timeStart}>{p.period?.startTime}</Text>
                <Text style={styles.timeEnd}>{p.period?.endTime}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.subject}>{p.subject?.name || 'Subject'}</Text>
                <Text style={styles.detail}>{p.classSectionName || p.classSection?.name || ''}</Text>
                {p.room ? <Text style={styles.detail}>Room {p.room}</Text> : null}
              </View>
              {onOpenAttendance && (
                <TouchableOpacity
                  style={styles.markBtn}
                  onPress={() => onOpenAttendance(p.id, p.subject?.name || 'Subject')}
                >
                  <MaterialCommunityIcons name="checkbox-marked-circle-plus-outline" size={20} color="#FFFFFF" />
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
  container: { flex: 1 },
  dateBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  dateTitle: { fontSize: 15, fontWeight: '800', color: '#1A202C' },
  dateSub: { fontSize: 11, color: '#718096', marginTop: 2 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  periodCard: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, borderWidth: 1, borderColor: '#E2E8F0',
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  timeCol: { width: 52, gap: 2 },
  timeStart: { fontSize: 14, fontWeight: '800', color: '#7E57C2' },
  timeEnd: { fontSize: 11, color: '#94A3B8' },
  infoCol: { flex: 1 },
  subject: { fontSize: 14, fontWeight: '700', color: '#1A202C' },
  detail: { fontSize: 12, color: '#718096', marginTop: 2 },
  markBtn: {
    backgroundColor: '#7E57C2', borderRadius: BorderRadius.button, paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  markBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', margin: 16, marginTop: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#718096', textAlign: 'center', marginTop: 4 },
  viewRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  viewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewChipActive: { backgroundColor: '#EDE7F6', borderColor: '#7E57C2' },
  viewChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  viewChipTextActive: { color: '#7E57C2' },
  weekWrap: { padding: 16, paddingBottom: 40 },
  gridHeaderRow: { flexDirection: 'row' },
  gridRow: { flexDirection: 'row' },
  cell: { width: 88, minHeight: 52, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  dayHeaderCell: { backgroundColor: '#EDE7F6' },
  dayHeaderText: { fontSize: 12, fontWeight: '800', color: '#7E57C2' },
  periodCell: { backgroundColor: '#F8F9FB', width: 80, alignItems: 'flex-start', paddingLeft: 10 },
  periodLabel: { fontSize: 11, fontWeight: '700', color: '#1A202C' },
  periodTime: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  slotCell: { gap: 2, paddingHorizontal: 4 },
  slotCellFilled: { backgroundColor: '#F5F3FF' },
  slotSubject: { fontSize: 11, fontWeight: '700', color: '#7E57C2', textAlign: 'center' },
  slotRoom: { fontSize: 9, color: '#94A3B8' },
  slotEmpty: { fontSize: 13, color: '#CBD5E1' },
});
