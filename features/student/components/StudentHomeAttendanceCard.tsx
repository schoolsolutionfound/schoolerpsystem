import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { ShimmerSkeleton } from './ShimmerSkeleton';

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
      <View style={[styles.gridCard, styles.attendanceCard]}>
        <View style={styles.metricHeader}>
          <Text style={[styles.metricTitle, { color: '#A0A0A0' }]}>Attendance</Text>
        </View>
        <View style={styles.attendanceGaugeWrap}>
          {loading ? (
            <ShimmerSkeleton width={60} height={32} borderRadius={4} />
          ) : (
            <Text style={styles.metricValue}>{pct === undefined ? '—' : `${pct}%`}</Text>
          )}
          <View style={styles.circleProgressRing}>
            <MaterialCommunityIcons name="calendar-check" size={24} color="#F4C430" />
          </View>
        </View>
        {loading ? (
          <ShimmerSkeleton width="70%" height={10} borderRadius={4} />
        ) : (
          <Text style={[styles.metricSub, { color: '#A0A0A0' }]}>
            {overall && overall.total > 0 ? `${overall.present} of ${overall.total} classes` : 'No classes marked yet'}
          </Text>
        )}
      </View>

      {/* Current Period Card */}
      <View style={[styles.gridCard, styles.periodCard]}>
        <Text style={[styles.metricTitle, { color: '#1A1B1C' }]}>Current Period</Text>
        {loading ? (
          <View style={{ gap: 6, marginTop: 4 }}>
            <ShimmerSkeleton width="80%" height={16} borderRadius={4} />
            <ShimmerSkeleton width="50%" height={10} borderRadius={4} />
          </View>
        ) : (
          <>
            <Text style={styles.periodSubject}>
              {currentSlot?.subject?.name || 'No class now'}
            </Text>
            {currentSlot ? (
              <Text style={styles.periodTime}>
                {periodStart}
                {periodEnd ? ` – ${periodEnd}` : ''}
              </Text>
            ) : (
              <Text style={styles.periodTime}>Free period</Text>
            )}
            {currentSlot?.room ? (
              <View style={styles.roomTag}>
                <Text style={styles.roomTagText}>Room {currentSlot.room}</Text>
              </View>
            ) : null}
          </>
        )}
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
  attendanceCard: {
    backgroundColor: '#1A1B1C',
    borderColor: '#2A2B2C',
  },
  periodCard: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricTitle: { fontSize: 12, fontWeight: '700' },
  attendanceGaugeWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 4 },
  metricValue: { fontSize: 26, fontWeight: '800', color: '#F4C430' },
  circleProgressRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricSub: { fontSize: 11 },
  periodSubject: { fontSize: 16, fontWeight: '800', color: '#1A1B1C', marginTop: 4 },
  periodTime: { fontSize: 11, color: '#1A1B1C', opacity: 0.7 },
  roomTag: {
    backgroundColor: 'rgba(26, 27, 28, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.chip,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roomTagText: { fontSize: 11, fontWeight: '700', color: '#1A1B1C' },
});
