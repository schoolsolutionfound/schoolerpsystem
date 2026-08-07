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

      {loading ? (
        <View style={styles.centerBox}><ActivityIndicator size="large" color="#7E57C2" /></View>
      ) : !data?.effective ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="timetable" size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No timetable published</Text>
          <Text style={styles.emptySub}>Your class teacher has not built the timetable yet.</Text>
        </View>
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
});
