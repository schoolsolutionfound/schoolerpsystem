import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { fetchMyTimetableApi } from '../../../api/academics';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const StudentTimetableView: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'day' | 'week'>('day');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyTimetableApi(date);
      setData(res);
    } catch (err: any) {
      console.warn('[StudentTimetable]', err.message);
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

  const dayLabel = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const slots = data?.slots || [];
  const todaySlots = slots.filter((s: any) => s.dayOfWeek === new Date(`${date}T00:00:00Z`).getUTCDay());

  const weekDays: number[] = [...new Set<number>(slots.map((s: any) => Number(s.dayOfWeek)))].sort((a, b) => a - b);
  const weekPeriods = [...new Map(slots.map((s: any) => [s.period?.id, s.period])).values()].sort(
    (a: any, b: any) => (a?.startTime || '').localeCompare(b?.startTime || '')
  );
  const slotFor = (d: number, p: any) => slots.find((s: any) => s.dayOfWeek === d && s.period?.id === p?.id);

  return (
    <View style={styles.container}>
      <View style={styles.dateBar}>
        <TouchableOpacity onPress={() => shiftDay(-1)}><MaterialCommunityIcons name="chevron-left" size={24} color="#7E57C2" /></TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.dateTitle}>{dayLabel}</Text>
          <Text style={styles.dateSub}>{data?.classSection?.name || 'My Schedule'}</Text>
        </View>
        <TouchableOpacity onPress={() => shiftDay(1)}><MaterialCommunityIcons name="chevron-right" size={24} color="#7E57C2" /></TouchableOpacity>
      </View>

      <View style={styles.viewRow}>
        <TouchableOpacity style={[styles.viewChip, view === 'day' && styles.viewChipActive]} onPress={() => setView('day')}>
          <MaterialCommunityIcons name="calendar-today" size={15} color={view === 'day' ? '#7E57C2' : '#64748B'} />
          <Text style={[styles.viewChipText, view === 'day' && styles.viewChipTextActive]}>Day</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.viewChip, view === 'week' && styles.viewChipActive]} onPress={() => setView('week')}>
          <MaterialCommunityIcons name="calendar-week" size={15} color={view === 'week' ? '#7E57C2' : '#64748B'} />
          <Text style={[styles.viewChipText, view === 'week' && styles.viewChipTextActive]}>Week</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}><ActivityIndicator size="large" color="#7E57C2" /></View>
      ) : !data?.effective ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="timetable" size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No timetable published</Text>
          <Text style={styles.emptySub}>Your class teacher has not built the timetable yet.</Text>
        </View>
      ) : view === 'week' ? (
        weekDays.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-blank" size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No classes scheduled</Text>
          </View>
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
                    const isToday = d === new Date(`${date}T00:00:00Z`).getUTCDay();
                    return (
                      <View key={`${d}-${p.id}`} style={[styles.cell, styles.slotCell, s && styles.slotCellFilled, isToday && styles.slotCellToday]}>
                        {s ? (
                          <>
                            <Text style={styles.slotSubject}>{s.subject?.name || 'Subject'}</Text>
                            {s.room ? <Text style={styles.slotRoom}>{s.room}</Text> : null}
                          </>
                        ) : (
                          <Text style={styles.slotEmpty}>—</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        )
      ) : todaySlots.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="calendar-blank" size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No classes today</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {todaySlots.map((s: any, i: number) => (
            <View key={s.id || i} style={styles.slotCard}>
              <View style={styles.timeCol}>
                <Text style={styles.timeStart}>{s.period?.startTime}</Text>
                <Text style={styles.timeEnd}>{s.period?.endTime}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.subject}>{s.subject?.name || 'Subject'}</Text>
                <Text style={styles.detail}>{s.teacher?.fullName || ''}</Text>
                {s.room ? <Text style={styles.detail}>Room {s.room}</Text> : null}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
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
  slotCard: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, borderWidth: 1, borderColor: '#E2E8F0',
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  timeCol: { width: 52, gap: 2 },
  timeStart: { fontSize: 14, fontWeight: '800', color: '#7E57C2' },
  timeEnd: { fontSize: 11, color: '#94A3B8' },
  infoCol: { flex: 1 },
  subject: { fontSize: 14, fontWeight: '700', color: '#1A202C' },
  detail: { fontSize: 12, color: '#718096', marginTop: 2 },
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
  slotCellToday: { borderWidth: 1.5, borderColor: '#7E57C2' },
  slotSubject: { fontSize: 11, fontWeight: '700', color: '#7E57C2', textAlign: 'center' },
  slotRoom: { fontSize: 9, color: '#94A3B8' },
  slotEmpty: { fontSize: 13, color: '#CBD5E1' },
});
