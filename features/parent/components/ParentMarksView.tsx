import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchParentMarksApi, fetchSubjectsApi } from '../../../api/academics';
import { useUserStore } from '../../../store/useUserStore';
import { FontFamily } from '../../../constants/fonts';

export const ParentMarksView: React.FC = () => {
  const [data, setData] = useState<{ exams: any[]; totals: { present: number; total: number; percentage: number } } | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const childName = useUserStore((s) => s.childName) || '';

  const subjectName = (id: string) => subjects.find((s: any) => s.id === id)?.name || `Subject ${id.slice(-4)}`;

  const load = useCallback(async () => {
    setError(null);
    try {
      const [marksRes, subjectsRes] = await Promise.all([
        fetchParentMarksApi(),
        subjects.length === 0 ? fetchSubjectsApi() : Promise.resolve(null),
      ]);
      setData(marksRes?.data || marksRes || null);
      if (subjectsRes) {
        const list = Array.isArray(subjectsRes?.data) ? subjectsRes.data : Array.isArray(subjectsRes) ? subjectsRes : [];
        setSubjects(list);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load marks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [subjects.length]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  if (loading && !refreshing) {
    return (
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.loadingCard}>
          <MaterialCommunityIcons name="certificate-outline" size={32} color="#E8E5DC" />
          <Text style={styles.loadingText}>Loading marks...</Text>
        </View>
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView
        contentContainerStyle={styles.center}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} progressBackgroundColor="#FFFFFF" />
        }
      >
        <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#DC3545" />
        <Text style={styles.errorTitle}>Could not load marks</Text>
        <Text style={styles.errorSub}>{error}</Text>
      </ScrollView>
    );
  }

  const exams = data?.exams || [];
  const totals = data?.totals || { present: 0, total: 0, percentage: 0 };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} progressBackgroundColor="#FFFFFF" />
      }
    >
      {/* Hero */}
      <View style={styles.heroBlock}>
        <View style={styles.heroHeader}>
          <MaterialCommunityIcons name="certificate-outline" size={36} color="#F4C430" />
          <View>
            <Text style={styles.heroTitle}>Marks & Grades</Text>
            <Text style={styles.heroSub}>{childName ? `${childName}'s exam results` : 'Exam results across subjects'}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statNum}>{totals.percentage}%</Text>
            <Text style={styles.statLabel}>Overall</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statNum}>{totals.present}</Text>
            <Text style={styles.statLabel}>Marks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statNum}>{exams.length}</Text>
            <Text style={styles.statLabel}>Exams</Text>
          </View>
        </View>
      </View>

      {/* Exam list */}
      {exams.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="chart-line-variant" size={36} color="#E8E5DC" />
          <Text style={styles.emptyTitle}>No marks yet</Text>
          <Text style={styles.emptySub}>Marks will appear once teachers enter exam results.</Text>
        </View>
      ) : (
        exams.map((exam: any) => {
          const pct = exam.percentage ?? 0;
          const passed = pct >= 35;
          return (
            <View key={exam.exam?.id || Math.random()} style={styles.examCard}>
              <View style={styles.examHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.examName}>{exam.exam?.name || 'Exam'}</Text>
                  <Text style={styles.examSub}>
                    {[exam.exam?.term, exam.exam?.academicYear].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.pctBadge,
                    { backgroundColor: passed ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 53, 69, 0.12)' },
                  ]}
                >
                  <Text style={[styles.pctText, { color: passed ? '#16A34A' : '#DC3545' }]}>{pct}%</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, pct)}%`, backgroundColor: passed ? '#16A34A' : '#DC3545' },
                  ]}
                />
              </View>

              <View style={styles.subjectsList}>
                {exam.subjects?.map((s: any) => {
                  const subjPct = s.maxMarks > 0 ? Math.round((s.marksObtained / s.maxMarks) * 100) : 0;
                  const subjectPassed = s.marksObtained >= s.passMarks;
                  return (
                    <View key={s.subjectId} style={styles.subjectRow}>
                      <Text style={styles.subjectName}>{subjectName(s.subjectId)}</Text>
                      <View style={styles.subjectScore}>
                        <Text style={[styles.scoreNum, { color: subjectPassed ? '#16A34A' : '#DC3545' }]}>
                          {s.marksObtained}
                        </Text>
                        <Text style={styles.scoreMax}>/{s.maxMarks}</Text>
                        <Text style={styles.scorePct}>{subjPct}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Total</Text>
                <Text style={styles.totalsValue}>
                  {exam.totalObtained} / {exam.totalMax}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: 12, paddingBottom: 40, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 8 },

  loadingCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E8E5DC' },
  loadingText: { fontSize: 13, fontFamily: FontFamily.medium, color: '#6B6B6B', marginTop: 8 },

  errorTitle: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  errorSub: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', textAlign: 'center' },

  heroBlock: {
    backgroundColor: '#1A1B1C', borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: '#2A2B2C', gap: 12,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroTitle: { fontSize: 17, fontFamily: FontFamily.extrabold, color: '#FFFFFF' },
  heroSub: { fontSize: 11, fontFamily: FontFamily.bold, color: '#8A8A8A', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 },

  statsRow: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: '#232425', borderRadius: 8, paddingVertical: 12,
    borderWidth: 1, borderColor: '#2A2B2C',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  statNum: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#FFFFFF' },
  statLabel: { fontSize: 9, fontFamily: FontFamily.bold, color: '#8A8A8A', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#2F3031', marginVertical: 4 },

  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: '#E8E5DC' },
  emptyTitle: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#1A1B1C', marginTop: 8 },
  emptySub: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', textAlign: 'center', marginTop: 4, lineHeight: 16 },

  examCard: {
    backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: '#E8E5DC', gap: 10,
  },
  examHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  examName: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  examSub: { fontSize: 11, fontFamily: FontFamily.bold, color: '#6B6B6B', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  pctBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#E8E5DC' },
  pctText: { fontSize: 14, fontFamily: FontFamily.extrabold },

  progressTrack: { height: 6, backgroundColor: '#F3F1EA', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  subjectsList: { gap: 6 },
  subjectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: '#F7F5EE', borderRadius: 6,
  },
  subjectName: { fontSize: 13, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  subjectScore: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  scoreNum: { fontSize: 14, fontFamily: FontFamily.extrabold },
  scoreMax: { fontSize: 11, fontFamily: FontFamily.bold, color: '#6B6B6B' },
  scorePct: { fontSize: 10, fontFamily: FontFamily.bold, color: '#6B6B6B', marginLeft: 6 },

  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F3F1EA' },
  totalsLabel: { fontSize: 11, fontFamily: FontFamily.bold, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalsValue: { fontSize: 13, fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
});
