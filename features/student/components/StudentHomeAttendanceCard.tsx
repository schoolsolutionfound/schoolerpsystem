import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

interface StudentHomeAttendanceCardProps {
  loading?: boolean;
  overall?: { present: number; total: number; percentage: number } | null;
  currentSlot?: any;
}

export const StudentHomeAttendanceCard: React.FC<StudentHomeAttendanceCardProps> = ({
  loading,
  overall,
  currentSlot,
}) => {
  const pct = overall?.percentage;
  const periodStart = currentSlot?.period?.startTime || '';
  const periodEnd = currentSlot?.period?.endTime || '';

  return (
    <View style={styles.gridRow}>
      {/* Attendance Card */}
      <View style={[styles.gridCard, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricTitle}>Attendance</Text>
        </View>
        <View style={styles.attendanceGaugeWrap}>
          <Text style={styles.metricValue}>{loading || pct === undefined ? '—' : `${pct}%`}</Text>
          <View style={styles.circleProgressRing}>
            <MaterialCommunityIcons name="calendar-check" size={24} color="#16A34A" />
          </View>
        </View>
        <Text style={styles.metricSub}>
          {loading ? 'Loading…' : overall && overall.total > 0 ? `${overall.present} of ${overall.total} classes` : 'No classes marked yet'}
        </Text>
      </View>

      {/* Current Period Card */}
      <View style={[styles.gridCard, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
        <Text style={styles.metricTitle}>Current Period</Text>
        <Text style={styles.periodSubject}>
          {currentSlot?.subject?.name || (loading ? '—' : 'No class now')}
        </Text>
        {currentSlot ? (
          <Text style={styles.periodTime}>
            {periodStart}
            {periodEnd ? ` – ${periodEnd}` : ''}
          </Text>
        ) : (
          <Text style={styles.periodTime}>{loading ? 'Loading…' : 'Free period'}</Text>
        )}
        {currentSlot?.room ? (
          <View style={styles.roomTag}>
            <Text style={styles.roomTagText}>Room {currentSlot.room}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridRow: { flexDirection: 'row', gap: 12 },
  gridCard: {
    flex: 1,
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricTitle: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  attendanceGaugeWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 4 },
  metricValue: { fontSize: 26, fontWeight: '800', color: '#16A34A' },
  circleProgressRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricSub: { fontSize: 11, color: '#A0AEC0' },
  periodSubject: { fontSize: 16, fontWeight: '800', color: '#7E57C2', marginTop: 4 },
  periodTime: { fontSize: 11, color: '#64748B' },
  roomTag: {
    backgroundColor: '#EDE9F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.chip,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roomTagText: { fontSize: 11, fontWeight: '700', color: '#7E57C2' },
});
