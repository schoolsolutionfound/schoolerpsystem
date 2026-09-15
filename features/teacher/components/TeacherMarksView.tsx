import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { fetchExamsApi, fetchExamApi, fetchMarksForClassApi, fetchMyClassSectionApi } from '../../../api/academics';
import { useUserStore } from '../../../store/useUserStore';

export const TeacherMarksView: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marksLoading, setMarksLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [classSectionId, setClassSectionId] = useState('');

  const loadExams = useCallback(async () => {
    setLoading(true);
    try {
      const [res, clsRes] = await Promise.all([
        fetchExamsApi().catch(() => null),
        fetchMyClassSectionApi().catch(() => null),
      ]);
      if (clsRes) {
        const cls = (clsRes as any)?.classSection || clsRes;
        setClassSectionId(cls?.id || '');
      }
      const list = Array.isArray(res) ? res : (res as any)?.data || [];
      setExams(list);
      if (list.length > 0 && !selectedExam) {
        setSelectedExam(list[0]);
      }
    } catch (err: any) {
      console.warn('[Marks] Could not load exams:', err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedExam]);

  const loadMarks = useCallback(async () => {
    if (!selectedExam) return;
    setMarksLoading(true);
    try {
      const res = await fetchExamApi(selectedExam.id);
      const subjects = (res as any)?.subjects || [];
      const allMarks: any[] = [];
      for (const sub of subjects) {
        try {
          const mRes = await fetchMarksForClassApi(sub.id, classSectionId);
          const mList = Array.isArray(mRes) ? mRes : (mRes as any)?.data || [];
          allMarks.push({ subject: sub, marks: mList });
        } catch {}
      }
      setMarks(allMarks);
    } catch (err: any) {
      console.warn('[Marks] Could not load marks:', err.message);
    } finally {
      setMarksLoading(false);
    }
  }, [selectedExam, classSectionId]);

  useEffect(() => { loadExams(); }, []);
  useEffect(() => { if (selectedExam) loadMarks(); }, [selectedExam, loadMarks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadExams();
    if (selectedExam) await loadMarks();
    setRefreshing(false);
  }, [loadExams, loadMarks, selectedExam]);

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} progressBackgroundColor="#FFFFFF" />}
    >
      {/* Exam Selector */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <MaterialCommunityIcons name="file-document-outline" size={16} color="#F4C430" />
          <Text style={styles.sectionTitle}>Exams</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="#F4C430" />
        ) : exams.length === 0 ? (
          <Text style={styles.emptyText}>No exams created yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {exams.map((ex) => (
              <View
                key={ex.id}
                style={[styles.chip, selectedExam?.id === ex.id && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, selectedExam?.id === ex.id && styles.chipTextActive]}
                  onPress={() => setSelectedExam(ex)}
                >
                  {ex.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Marks by Subject */}
      {marksLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#F4C430" />
        </View>
      ) : marks.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="certificate-outline" size={40} color="#E8E5DC" />
          <Text style={styles.emptyTitle}>No marks data</Text>
          <Text style={styles.emptySub}>Enter marks for this exam to see them here.</Text>
        </View>
      ) : (
        marks.map((group, gi) => (
          <View key={gi} style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="book-open-page-variant-outline" size={15} color="#F4C430" />
              <Text style={styles.cardTitle}>{group.subject?.subjectName || group.subject?.name || 'Subject'}</Text>
              <Text style={styles.cardBadge}>{group.marks.length}</Text>
            </View>
            {group.marks.length === 0 ? (
              <Text style={styles.noData}>No marks entered</Text>
            ) : (
              group.marks.slice(0, 5).map((m: any, mi: number) => (
                <View key={mi} style={styles.markRow}>
                  <View style={styles.markInfo}>
                    <Text style={styles.markName}>{m.studentName || m.studentId}</Text>
                    <Text style={styles.markUSN}>{m.rollNoOrUSN || ''}</Text>
                  </View>
                  <View style={styles.markScore}>
                    <Text style={[styles.markValue, (m.marksObtained || 0) >= (group.subject?.passMarks || 35) ? styles.markPass : styles.markFail]}>
                      {m.marksObtained ?? '—'}
                    </Text>
                    <Text style={styles.markMax}>/ {group.subject?.maxMarks || 100}</Text>
                  </View>
                </View>
              ))
            )}
            {group.marks.length > 5 && (
              <Text style={styles.moreText}>+{group.marks.length - 5} more students</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 14, paddingBottom: 40 },
  section: { gap: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#171717' },
  chipRow: { gap: 8 },
  chip: {
    backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E8E5DC',
  },
  chipActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#6B6B6B' },
  chipTextActive: { color: '#1A1B1C' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 16,
    borderWidth: 1, borderColor: '#E8E5DC',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#171717', flex: 1 },
  cardBadge: { fontSize: 11, fontWeight: '700', color: '#F4C430', backgroundColor: '#FFF4C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },

  markRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  markInfo: { flex: 1 },
  markName: { fontSize: 12, fontWeight: '700', color: '#171717' },
  markUSN: { fontSize: 10, color: '#6B6B6B' },
  markScore: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  markValue: { fontSize: 16, fontWeight: '800' },
  markPass: { color: '#16A34A' },
  markFail: { color: '#DC2626' },
  markMax: { fontSize: 11, color: '#9CA3AF' },

  noData: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },
  moreText: { fontSize: 11, color: '#F4C430', textAlign: 'center', marginTop: 8, fontWeight: '700' },
  emptyText: { fontSize: 12, color: '#9CA3AF' },

  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  emptyCard: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 30, alignItems: 'center',
    borderWidth: 1, borderColor: '#E8E5DC', gap: 6,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#171717' },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center' },
});
