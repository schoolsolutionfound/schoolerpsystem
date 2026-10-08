import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { fetchParentTimetableApi } from '../../../api/academics';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ParentScheduleView: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'day' | 'week'>('day');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchParentTimetableApi(date);
      setData(res);
    } catch (err: any) {
      console.warn('[ParentSchedule]', err.message);
      setError(err?.message || 'Could not load the schedule.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const shiftDay = (delta: number) => {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  };

  const dayLabel = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const slots: any[] = data?.slots || [];
  const todaySlots = slots.filter(
    (s) => s.dayOfWeek === new Date(`${date}T00:00:00Z`).getUTCDay()
  );

  const weekDays: number[] = [...new Set<number>(slots.map((s) => Number(s.dayOfWeek)))].sort(
    (a, b) => a - b
  );
  const sortedWeekPeriods = Array.from(
    new Map(slots.map((s) => [s.period?.id, s.period])).values()
  ).sort((a: any, b: any) => (a?.startTime || '').localeCompare(b?.startTime || ''));
  const slotFor = (d: number, p: any) =>
    slots.find((s) => s.dayOfWeek === d && s.period?.id === p?.id);

  const classLabel = data?.classSection?.name || "Child's Schedule";

  return (
    <View style={styles.container}>
      <View style={styles.heroBlock}>
        <View style={styles.heroDateRow}>
          <TouchableOpacity onPress={() => shiftDay(-1)} style={styles.heroDateBtn}>
            <MaterialCommunityIcons name="chevron-left" size={20} color="#F4C430" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.heroDateTitle}>{dayLabel}</Text>
            <Text style={styles.heroDateSub}>{classLabel}</Text>
          </View>
          <TouchableOpacity onPress={() => shiftDay(1)} style={styles.heroDateBtn}>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#F4C430" />
          </TouchableOpacity>
        </View>
        <View style={styles.viewRow}>
          <TouchableOpacity
            style={[styles.viewChip, view === 'day' && styles.viewChipActive]}
            onPress={() => setView('day')}
          >
            <MaterialCommunityIcons
              name="calendar-today"
              size={14}
              color={view === 'day' ? '#F4C430' : '#8A8A8A'}
            />
            <Text style={[styles.viewChipText, view === 'day' && styles.viewChipTextActive]}>Day</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewChip, view === 'week' && styles.viewChipActive]}
            onPress={() => setView('week')}
          >
            <MaterialCommunityIcons
              name="calendar-week"
              size={14}
              color={view === 'week' ? '#F4C430' : '#8A8A8A'}
            />
            <Text style={[styles.viewChipText, view === 'week' && styles.viewChipTextActive]}>Week</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="link-off" size={40} color="#DC3545" />
          <Text style={styles.emptyTitle}>Unable to load schedule</Text>
          <Text style={styles.emptySub}>{error}</Text>
        </View>
      ) : !data?.effective ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="timetable" size={40} color="#6B6B6B" />
          <Text style={styles.emptyTitle}>No timetable published</Text>
          <Text style={styles.emptySub}>Your child&apos;s class teacher has not built the timetable yet.</Text>
        </View>
      ) : view === 'week' ? (
        weekDays.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="calendar-blank" size={40} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No classes scheduled</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekWrap}
          >
            <View>
              <View style={styles.gridHeaderRow}>
                <View style={[styles.cell, styles.cornerHeaderCell]}>
                  <Text style={styles.cornerHeaderText}>Period</Text>
                </View>
                {weekDays.map((d) => {
                  const isToday = d === new Date().getUTCDay();
                  return (
                    <View
                      key={d}
                      style={[styles.cell, isToday ? styles.dayHeaderCellToday : styles.dayHeaderCell]}
                    >
                      <Text style={[styles.dayHeaderText, isToday && { color: '#1A1B1C' }]}>
                        {DAY_LABELS[d]}
                      </Text>
                      {isToday ? <Text style={styles.todayPill}>Today</Text> : null}
                    </View>
                  );
                })}
              </View>
              {sortedWeekPeriods.map((p: any) => (
                <View key={p.id} style={styles.gridRow}>
                  <View style={[styles.cell, styles.periodCell]}>
                    <Text style={styles.periodLabel}>{p.label}</Text>
                    <Text style={styles.periodTime}>{p.startTime}</Text>
                  </View>
                  {weekDays.map((d) => {
                    const s = slotFor(d, p);
                    const isToday = d === new Date().getUTCDay();
                    return (
                      <View
                        key={`${d}-${p.id}`}
                        style={[
                          styles.cell,
                          styles.slotCell,
                          s && styles.slotCellFilled,
                          isToday && styles.slotCellToday,
                        ]}
                      >
                        {s ? (
                          <>
                            <Text
                              style={[styles.slotSubject, isToday && styles.slotSubjectToday]}
                              numberOfLines={1}
                            >
                              {s.subject?.name || 'Subject'}
                            </Text>
                            {s.room ? (
                              <Text
                                style={[styles.slotRoom, isToday && styles.slotRoomToday]}
                                numberOfLines={1}
                              >
                                {s.room}
                              </Text>
                            ) : null}
                          </>
                        ) : (
                          <Text style={[styles.slotEmpty, isToday && { color: '#8A6A00' }]}>—</Text>
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
          <MaterialCommunityIcons name="calendar-blank" size={40} color="#6B6B6B" />
          <Text style={styles.emptyTitle}>No classes today</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1A1B1C"
              colors={['#1A1B1C']}
              progressBackgroundColor="#FFFFFF"
            />
          }
        >
          {todaySlots.map((s: any, i: number) => (
            <View key={s.id || i} style={styles.slotCard}>
              <View style={styles.timePill}>
                <Text style={styles.timeStart}>{s.period?.startTime}</Text>
                <Text style={styles.timeEnd}>{s.period?.endTime}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.subject}>{s.subject?.name || 'Subject'}</Text>
                <Text style={styles.detail}>{s.teacher?.fullName || ''}</Text>
                {s.room ? <Text style={styles.roomChip}>Room {s.room}</Text> : null}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#9A9A9A" />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, gap: 12, backgroundColor: '#FFFEFE' },
  heroBlock: {
    backgroundColor: '#1A1B1C',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2B2C',
    gap: 10,
  },
  heroDateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroDateBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#232425',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  heroDateTitle: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#FFFFFF' },
  heroDateSub: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#8A8A8A',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  list: { padding: 0, gap: 8, paddingBottom: 40 },

  // Day list slot card
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timePill: {
    width: 64,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1A1B1C',
    borderWidth: 1,
    borderColor: '#2A2B2C',
    alignItems: 'center',
  },
  timeStart: { fontSize: 12, fontFamily: FontFamily.extrabold, color: '#F4C430', letterSpacing: 0.2 },
  timeEnd: { fontSize: 9, fontFamily: FontFamily.bold, color: '#8A8A8A', marginTop: 2 },
  infoCol: { flex: 1, gap: 3 },
  subject: { fontSize: 14, fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  detail: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  roomChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#8A6A00',
    fontSize: 11,
    fontFamily: FontFamily.bold,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 20,
  },
  loadingText: { fontSize: 13, fontFamily: FontFamily.regular, color: '#9CA3AF' },
  emptyTitle: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#1A1B1C', marginTop: 8 },
  emptySub: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },

  // Day / Week toggle
  viewRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  viewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#232425',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  viewChipActive: { backgroundColor: '#1A1B1C', borderColor: '#F4C430' },
  viewChipText: {
    fontSize: 11,
    fontFamily: FontFamily.extrabold,
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewChipTextActive: { color: '#F4C430' },

  // Week grid
  weekWrap: { padding: 0, paddingBottom: 40 },
  gridHeaderRow: { flexDirection: 'row' },
  gridRow: { flexDirection: 'row' },
  cell: {
    width: 92,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#EFE9D6',
    backgroundColor: '#F7F5EE',
  },
  cornerHeaderCell: {
    backgroundColor: '#1A1B1C',
    borderColor: '#2A2B2C',
    width: 84,
  },
  cornerHeaderText: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: '#F4C430',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dayHeaderCell: {
    backgroundColor: '#1A1B1C',
    borderColor: '#2A2B2C',
  },
  dayHeaderCellToday: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  dayHeaderText: { fontSize: 12, fontFamily: FontFamily.extrabold, color: '#FFFFFF' },
  todayPill: {
    marginTop: 3,
    fontSize: 8,
    fontFamily: FontFamily.extrabold,
    color: '#1A1B1C',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: 'hidden',
    letterSpacing: 0.6,
  },
  periodCell: {
    backgroundColor: '#1A1B1C',
    width: 84,
    alignItems: 'flex-start',
    paddingLeft: 10,
    paddingVertical: 6,
    borderColor: '#2A2B2C',
  },
  periodLabel: { fontSize: 11, fontFamily: FontFamily.extrabold, color: '#F4C430' },
  periodTime: { fontSize: 10, fontFamily: FontFamily.bold, color: '#8A8A8A', marginTop: 2 },
  slotCell: { gap: 2, paddingHorizontal: 6, paddingVertical: 4 },
  slotCellFilled: { backgroundColor: '#FFF4C7' },
  slotCellToday: { backgroundColor: '#F4C430' },
  slotSubject: { fontSize: 11, fontFamily: FontFamily.extrabold, color: '#8A6A00', textAlign: 'center' },
  slotSubjectToday: { color: '#1A1B1C' },
  slotRoom: { fontSize: 9, fontFamily: FontFamily.regular, color: '#6B6B6B', textAlign: 'center' },
  slotRoomToday: { color: '#1A1B1C' },
  slotEmpty: { fontSize: 13, fontFamily: FontFamily.regular, color: '#C9C4B5' },
});
