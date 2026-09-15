import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { fetchStudentHomeworkApi } from '../../../api/academics';

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  dueDate: string;
  priority: string;
  status: string;
  createdAt: string;
}

export const StudentHomeworkView: React.FC = () => {
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchStudentHomeworkApi();
      setHomework(res || []);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const priorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return '#DC3545';
      case 'high': return '#F97316';
      case 'normal': return '#F4C430';
      case 'low': return '#16A34A';
      default: return '#9CA3AF';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date(new Date().toISOString().slice(0, 10));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Homework</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{homework.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : homework.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="book-check-outline" size={48} color="#E8E5DC" />
            <Text style={styles.emptyTitle}>No Homework</Text>
            <Text style={styles.emptySub}>Your assignments will appear here.</Text>
          </View>
        ) : (
          homework.map((hw) => {
            const overdue = hw.status === 'active' && isOverdue(hw.dueDate);
            return (
              <View key={hw.id} style={[styles.card, overdue && styles.cardOverdue]}>
                <View style={styles.cardTop}>
                  <View style={[styles.priorityDot, { backgroundColor: priorityColor(hw.priority) }]} />
                  <Text style={styles.cardTitle} numberOfLines={1}>{hw.title}</Text>
                  {overdue && (
                    <View style={styles.overdueBadge}>
                      <Text style={styles.overdueBadgeText}>Overdue</Text>
                    </View>
                  )}
                </View>
                {hw.description ? (
                  <Text style={styles.cardDesc} numberOfLines={3}>{hw.description}</Text>
                ) : null}
                <View style={styles.cardMeta}>
                  <View style={styles.metaChip}>
                    <MaterialCommunityIcons name="calendar-clock" size={14} color="#6B6B6B" />
                    <Text style={[styles.metaText, overdue && { color: '#DC3545' }]}>
                      Due: {hw.dueDate}
                    </Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: priorityColor(hw.priority) + '18' }]}>
                    <Text style={[styles.priorityBadgeText, { color: priorityColor(hw.priority) }]}>{hw.priority}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEFE' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#171717' },
  countBadge: {
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#D4A418' },
  list: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: FontFamily.regular, color: '#9CA3AF' },
  emptyTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#6B6B6B', marginTop: 8 },
  emptySub: { fontSize: 12, fontFamily: FontFamily.regular, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 8,
  },
  cardOverdue: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFAFA',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { flex: 1, fontSize: 14, fontFamily: FontFamily.bold, color: '#171717' },
  overdueBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  overdueBadgeText: { fontSize: 10, fontFamily: FontFamily.bold, color: '#DC3545' },
  cardDesc: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', lineHeight: 17 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityBadgeText: { fontSize: 10, fontFamily: FontFamily.bold },
});
