import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, TextInput, Modal, RefreshControl, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { createHomeworkApi, fetchMyHomeworkApi, fetchClassSectionsApi, fetchClassSubjectsApi, deleteHomeworkApi, updateHomeworkApi } from '../../../api/academics';
import { useUserStore } from '../../../store/useUserStore';

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classSectionId: string;
  dueDate: string;
  priority: string;
  status: string;
  createdAt: string;
}

export const TeacherHomeworkView: React.FC = () => {
  const institutionCode = useUserStore((s) => s.institutionCode) || '';
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [hwRes, clsRes] = await Promise.allSettled([
        fetchMyHomeworkApi(),
        fetchClassSectionsApi(),
      ]);
      if (hwRes.status === 'fulfilled') setHomework(hwRes.value || []);
      if (clsRes.status === 'fulfilled') setClasses(clsRes.value || []);
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

  const loadSubjects = async (classSectionId: string) => {
    setSelectedClass(classSectionId);
    try {
      const res = await fetchClassSubjectsApi(classSectionId);
      setSubjects(res || []);
    } catch { setSubjects([]); }
  };

  const handleCreate = async () => {
    if (!selectedClass || !selectedSubject || !title.trim() || !dueDate.trim()) return;
    setCreating(true);
    try {
      await createHomeworkApi({
        classSectionId: selectedClass,
        subjectId: selectedSubject,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate.trim(),
        priority,
      });
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('normal');
      setSelectedClass('');
      setSelectedSubject('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create homework');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Homework', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteHomeworkApi(id); fetchData(); } catch {}
      }},
    ]);
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return '#DC3545';
      case 'high': return '#F97316';
      case 'normal': return '#F4C430';
      case 'low': return '#16A34A';
      default: return '#9CA3AF';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Homework</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
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
            <MaterialCommunityIcons name="book-plus-outline" size={48} color="#E8E5DC" />
            <Text style={styles.emptyTitle}>No Homework Yet</Text>
            <Text style={styles.emptySub}>Tap "New" to assign homework to your classes.</Text>
          </View>
        ) : (
          homework.map((hw) => (
            <View key={hw.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor(hw.priority) }]} />
                <Text style={styles.cardTitle} numberOfLines={1}>{hw.title}</Text>
                <TouchableOpacity onPress={() => handleDelete(hw.id)} hitSlop={8}>
                  <MaterialCommunityIcons name="delete-outline" size={18} color="#DC3545" />
                </TouchableOpacity>
              </View>
              {hw.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>{hw.description}</Text>
              ) : null}
              <View style={styles.cardMeta}>
                <View style={styles.metaChip}>
                  <MaterialCommunityIcons name="calendar" size={12} color="#6B6B6B" />
                  <Text style={styles.metaText}>Due: {hw.dueDate}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: priorityColor(hw.priority) + '18' }]}>
                  <Text style={[styles.priorityBadgeText, { color: priorityColor(hw.priority) }]}>{hw.priority}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreate(false)} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#1A1B1C" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Homework</Text>
            <TouchableOpacity onPress={handleCreate} disabled={creating} style={styles.saveBtn}>
              <Text style={[styles.saveBtnText, creating && { opacity: 0.5 }]}>{creating ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Class *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {classes.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, selectedClass === c.id && styles.chipActive]}
                  onPress={() => loadSubjects(c.id)}
                >
                  <Text style={[styles.chipText, selectedClass === c.id && styles.chipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedClass ? (
              <>
                <Text style={styles.label}>Subject *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {subjects.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.chip, selectedSubject === s.id && styles.chipActive]}
                      onPress={() => setSelectedSubject(s.id)}
                    >
                      <Text style={[styles.chipText, selectedSubject === s.id && styles.chipTextActive]}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Homework title" placeholderTextColor="#9CA3AF" />

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholder="Optional description" placeholderTextColor="#9CA3AF" />

            <Text style={styles.label}>Due Date * (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="2026-09-15" placeholderTextColor="#9CA3AF" />

            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {(['low', 'normal', 'high', 'urgent'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityBtn, { borderColor: priorityColor(p) }, priority === p && { backgroundColor: priorityColor(p) }]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.priorityBtnText, { color: priority === p ? '#FFFFFF' : priorityColor(p) }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEFE' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#171717' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4C430',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.chip,
  },
  addBtnText: { fontSize: 13, fontFamily: FontFamily.bold, color: '#FFFFFF' },
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
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: { flex: 1, fontSize: 14, fontFamily: FontFamily.bold, color: '#171717' },
  cardDesc: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', lineHeight: 17 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityBadgeText: { fontSize: 10, fontFamily: FontFamily.bold },
  modal: { flex: 1, backgroundColor: '#FFFEFE' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#F4C430', borderRadius: BorderRadius.chip },
  saveBtnText: { fontSize: 13, fontFamily: FontFamily.bold, color: '#FFFFFF' },
  modalBody: { padding: 20, gap: 8 },
  label: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#6B6B6B', marginTop: 8, marginBottom: 4 },
  chipRow: { gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  chipText: { fontSize: 12, fontFamily: FontFamily.medium, color: '#6B6B6B' },
  chipTextActive: { color: '#FFFFFF', fontFamily: FontFamily.bold },
  input: {
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#171717',
    backgroundColor: '#FFFFFF',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  priorityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.chip,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  priorityBtnText: { fontSize: 11, fontFamily: FontFamily.bold, textTransform: 'capitalize' },
});
