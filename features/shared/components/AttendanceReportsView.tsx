import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { fetchDepartmentStatsApi, fetchInstitutionStatsApi } from '../../../api/academics';

interface AttendanceReportsViewProps {
  mode: 'department' | 'institution';
  department?: string;
}

export const AttendanceReportsView: React.FC<AttendanceReportsViewProps> = ({ mode, department }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = mode === 'department'
        ? await fetchDepartmentStatsApi(department)
        : await fetchInstitutionStatsApi();
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode, department]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <View style={styles.centerBox}><ActivityIndicator size="large" color="#7E57C2" /></View>;
  }

  if (error) {
    return (
      <View style={styles.emptyCard}>
        <MaterialCommunityIcons name="chart-line" size={40} color="#F59E0B" />
        <Text style={styles.emptyTitle}>Unable to load reports</Text>
        <Text style={styles.emptySub}>{error}</Text>
      </View>
    );
  }

  const sections = data?.sections || [];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>
        {mode === 'department'
          ? `${data?.department || 'Department'} Attendance`
          : 'Institution Attendance'}
      </Text>

      {sections.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="chart-donut" size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptySub}>Reports appear once attendance is recorded.</Text>
        </View>
      ) : (
        sections.map((s: any, i: number) => {
          const pct = s.averagePercentage || 0;
          const color = pct >= 90 ? '#16A34A' : pct >= 75 ? '#F59E0B' : '#DC2626';
          return (
            <View key={i} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionName}>
                    {s.section || 'All'}
                  </Text>
                  <Text style={styles.sectionMeta}>
                    {s.academicYear ? `${s.academicYear} · ` : ''}{s.studentsCount || 0} students · {s.totalClasses || 0} classes
                  </Text>
                </View>
                <View style={[styles.pctBadge, { backgroundColor: `${color}18` }]}>
                  <Text style={[styles.pctText, { color }]}>{pct}%</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
              </View>
              {s.lowAttendance?.length > 0 ? (
                <View style={styles.alertRow}>
                  <MaterialCommunityIcons name="alert" size={14} color="#DC2626" />
                  <Text style={styles.alertText}>{s.lowAttendance.length} student(s) below 75%</Text>
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  title: { fontSize: 16, fontWeight: '800', color: '#1A202C', marginBottom: 12 },
  sectionCard: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, borderWidth: 1, borderColor: '#E2E8F0',
    padding: 14, marginBottom: 10,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  sectionName: { fontSize: 14, fontWeight: '700', color: '#1A202C' },
  sectionMeta: { fontSize: 11, color: '#94A3B8', marginTop: 3 },
  pctBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  pctText: { fontSize: 14, fontWeight: '900' },
  progressTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  alertText: { fontSize: 11, color: '#DC2626', fontWeight: '600' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 26, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 20 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginTop: 8, textAlign: 'center' },
  emptySub: { fontSize: 12, color: '#718096', textAlign: 'center', marginTop: 6, lineHeight: 16 },
});
