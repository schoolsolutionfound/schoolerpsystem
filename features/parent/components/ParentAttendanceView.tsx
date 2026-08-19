import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { fetchParentAttendanceApi } from '../../../api/academics';

export const ParentAttendanceView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchParentAttendanceApi();
      setData(res);
    } catch (err: any) {
      setError(err.message);
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

  if (error) {
    return (
      <View style={styles.emptyCard}>
        <MaterialCommunityIcons name="account-question" size={40} color="#F59E0B" />
        <Text style={styles.emptyTitle}>No linked student</Text>
        <Text style={styles.emptySub}>{error}</Text>
      </View>
    );
  }

  const overall = data?.overall;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Linked Student&apos;s Attendance</Text>
      <View style={styles.overallCard}>
        <Text style={styles.ringValue}>{overall?.percentage ?? 0}%</Text>
        <Text style={styles.ringLabel}>Overall</Text>
        <Text style={styles.overallDetail}>{overall?.present ?? 0} present / {overall?.total ?? 0} total</Text>
      </View>

      <Text style={styles.sectionTitle}>Per Subject</Text>
      {(!data?.perSubject || data.perSubject.length === 0) ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No attendance records yet</Text>
        </View>
      ) : (
        data.perSubject.map((row: any, i: number) => (
          <View key={i} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectName}>{row.subject?.name || 'Subject'}</Text>
              <Text style={[styles.subjectPct, { color: row.percentage >= 75 ? '#16A34A' : '#DC2626' }]}>{row.percentage}%</Text>
            </View>
            <Text style={styles.subjectDetail}>{row.present} present / {row.total} total</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  title: { fontSize: 16, fontWeight: '800', color: '#1A202C', marginBottom: 12 },
  overallCard: {
    backgroundColor: '#7E57C2', borderRadius: BorderRadius.card, padding: 20, alignItems: 'center',
  },
  ringValue: { fontSize: 36, fontWeight: '900', color: '#FFFFFF' },
  ringLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  overallDetail: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A202C', marginTop: 18, marginBottom: 10 },
  subjectCard: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, borderWidth: 1, borderColor: '#E2E8F0',
    padding: 14, marginBottom: 10,
  },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectName: { fontSize: 14, fontWeight: '700', color: '#1A202C' },
  subjectPct: { fontSize: 14, fontWeight: '800' },
  subjectDetail: { fontSize: 11, color: '#94A3B8', marginTop: 6 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 26, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginTop: 8, textAlign: 'center' },
  emptySub: { fontSize: 12, color: '#718096', textAlign: 'center', marginTop: 6, lineHeight: 16 },
});
