import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { fetchStudentAttendanceHistoryApi } from '../../../api/academics';

export const StudentAttendanceView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStudentAttendanceHistoryApi();
      setData(res);
    } catch (err: any) {
      console.warn('[StudentAttendance]', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <View style={styles.centerBox}><ActivityIndicator size="large" color="#7E57C2" /></View>;
  }

  const overall = data?.overall;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.overallCard}>
        <View style={styles.ring}>
          <Text style={styles.ringValue}>{overall?.percentage ?? 0}%</Text>
          <Text style={styles.ringLabel}>Attendance</Text>
        </View>
        <View style={styles.overallStats}>
          <Stat label="Present" value={overall?.present ?? 0} color="#16A34A" />
          <Stat label="Total Classes" value={overall?.total ?? 0} color="#64748B" />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Per Subject</Text>
      {(!data?.perSubject || data.perSubject.length === 0) ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="chart-donut" size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No attendance records</Text>
          <Text style={styles.emptySub}>Attendance appears once your teachers mark classes.</Text>
        </View>
      ) : (
        data.perSubject.map((row: any, i: number) => (
          <View key={i} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectName}>{row.subject?.name || 'Subject'}</Text>
              <Text style={[styles.subjectPct, { color: row.percentage >= 75 ? '#16A34A' : '#DC2626' }]}>{row.percentage}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(row.percentage, 100)}%`, backgroundColor: row.percentage >= 75 ? '#16A34A' : '#DC2626' }]} />
            </View>
            <Text style={styles.subjectDetail}>{row.present} present / {row.total} total</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const Stat = ({ label, value, color }: any) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  overallCard: {
    backgroundColor: '#7E57C2', borderRadius: BorderRadius.card, padding: 20, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  ring: { alignItems: 'center' },
  ringValue: { fontSize: 32, fontWeight: '900', color: '#FFFFFF' },
  ringLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  overallStats: { flexDirection: 'row', gap: 24 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A202C', marginTop: 18, marginBottom: 10 },
  subjectCard: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, borderWidth: 1, borderColor: '#E2E8F0',
    padding: 14, marginBottom: 10,
  },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectName: { fontSize: 14, fontWeight: '700', color: '#1A202C' },
  subjectPct: { fontSize: 14, fontWeight: '800' },
  progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  subjectDetail: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#718096', textAlign: 'center', marginTop: 4 },
});
