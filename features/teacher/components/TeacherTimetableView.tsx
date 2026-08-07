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

  const dayLabel = (() => {
    const d = new Date(`${date}T00:00:00Z`);
    const opts: any = { weekday: 'short', month: 'short', day: 'numeric' };
    return d.toLocaleDateString('en-US', opts);
  })();

  const periods = data?.periods || [];

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

      {loading ? (
        <View style={styles.centerBox}><ActivityIndicator size="large" color="#7E57C2" /></View>
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
});
