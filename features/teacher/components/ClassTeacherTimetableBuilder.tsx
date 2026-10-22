import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from './common/Icons';
import { FontFamily } from '../../../constants/fonts';
import {
  fetchMyClassSectionApi,
  fetchClassTimetableApi,
  createTimetableApi,
  fetchSubjectsApi,
  fetchSubjectTeachersApi,
  fetchPeriodsApi,
} from '../../../api/academics';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_TO_EDIT = [1, 2, 3, 4, 5];

interface ClassTeacherTimetableBuilderProps {
  classSectionId?: string;
  classSectionName?: string;
}

export const ClassTeacherTimetableBuilder: React.FC<ClassTeacherTimetableBuilderProps> = ({
  classSectionId,
  classSectionName,
}) => {
  const [classSection, setClassSection] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [, setExisting] = useState<any[]>([]);
  const [grid, setGrid] = useState<Record<string, string>>({});
  const [effectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<{ key: string; options: { id: string; label: string }[] } | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let cls: any = null;
      if (classSectionId) {
        cls = { id: classSectionId, name: classSectionName || 'Class' };
      } else {
        cls = await fetchMyClassSectionApi().catch(() => null);
      }
      setClassSection(cls);

      const [periodsRes, subjectsRes, assignmentsRes] = await Promise.all([
        fetchPeriodsApi().catch(() => []),
        fetchSubjectsApi().catch(() => []),
        fetchSubjectTeachersApi().catch(() => []),
      ]);
      setPeriods(Array.isArray(periodsRes) ? periodsRes : []);
      setSubjects(Array.isArray(subjectsRes) ? subjectsRes : []);
      setAssignments(Array.isArray(assignmentsRes) ? assignmentsRes : []);

      if (cls) {
        const tt = await fetchClassTimetableApi(cls.id).catch(() => null);
        setExisting(tt?.slots || []);
        const g: Record<string, string> = {};
        for (const s of tt?.slots || []) {
          g[`${s.dayOfWeek}:${s.period?.id || s.periodId}`] = s.subject?.id || s.subjectId;
        }
        setGrid(g);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [classSectionId, classSectionName]);

  useEffect(() => {
    load();
  }, [load]);

  const getSubjectOptions = (day: number, periodId: string) => {
    const key = `${day}:${periodId}`;
    const current = grid[key];
    const assignedSubjectIds = new Set(assignments.map((a: any) => a.subjectId));
    const usedInThisSlot = subjects.filter((s: any) => assignedSubjectIds.has(s.id));
    return usedInThisSlot.map((s: any) => ({
      id: s.id,
      label: `${s.name}${current === s.id ? ' ✓' : ''}`,
    }));
  };

  const handleSave = async () => {
    if (!classSection) return;
    const slots = [];
    for (const day of DAYS_TO_EDIT) {
      for (const p of periods) {
        const subjectId = grid[`${day}:${p.id}`];
        if (!subjectId) continue;
        const assignment = assignments.find((a: any) => a.subjectId === subjectId && a.classSectionId === classSection.id);
        slots.push({
          subjectId,
          teacherId: assignment?.teacherId || '',
          periodId: p.id,
          dayOfWeek: day,
          room: '',
        });
      }
    }
    if (slots.length === 0) {
      Alert.alert('Empty Timetable', 'Assign at least one subject to a period first.');
      return;
    }
    const missingTeacher = slots.filter((s) => !s.teacherId);
    if (missingTeacher.length > 0) {
      Alert.alert('Missing Teacher', 'All assigned subjects must have a subject teacher. Use the Admin Academics "Assign" tab.');
      return;
    }
    setSaving(true);
    try {
      const res = await createTimetableApi({
        classSectionId: classSection.id,
        effectiveFrom,
        slots,
      });
      Alert.alert('Saved', `Timetable version ${res?.timetable?.version} published.`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.centerBox}><ActivityIndicator size="large" color="#F4C430" /></View>;
  }

  if (!classSection) {
    return (
      <View style={styles.emptyCard}>
        <MaterialCommunityIcons name="school-outline" size={38} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No class assigned to you</Text>
        <Text style={styles.emptySub}>Your administrator has not assigned you as class teacher for any class/section.</Text>
      </View>
    );
  }

  const openPicker = (day: number, periodId: string) => {
    const options = getSubjectOptions(day, periodId);
    if (options.length === 0) {
      Alert.alert(
        'No Subjects Available',
        'No subject teachers have been assigned to this class yet. Ask your Administrator to assign teachers under Academics > Assign.'
      );
      return;
    }
    setPicker({ key: `${day}:${periodId}`, options });
  };

  const selectSubject = (subjectId: string) => {
    if (!picker) return;
    setGrid((prev) => {
      const copy = { ...prev };
      if (copy[picker.key] === subjectId) {
        delete copy[picker.key];
      } else {
        copy[picker.key] = subjectId;
      }
      return copy;
    });
    setPicker(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Timetable Builder</Text>
          <Text style={styles.sub}>{classSection.name}</Text>
        </View>
        <View style={styles.viewRow}>
          <TouchableOpacity
            style={[styles.viewChip, view === 'grid' && styles.viewChipActive]}
            onPress={() => setView('grid')}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewChipText, view === 'grid' && styles.viewChipTextActive]}>Grid</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewChip, view === 'list' && styles.viewChipActive]}
            onPress={() => setView('list')}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewChipText, view === 'list' && styles.viewChipTextActive]}>List</Text>
          </TouchableOpacity>
        </View>
      </View>

      {view === 'grid' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gridWrap}>
          <View style={styles.gridCard}>
            <View style={styles.gridHeaderRow}>
              <View style={[styles.cell, styles.dayHeaderCell]}>
                <Text style={styles.dayHeaderText}>Period</Text>
              </View>
              {DAYS_TO_EDIT.map((d) => (
                <View key={d} style={[styles.cell, styles.dayHeaderCell]}>
                  <Text style={styles.dayHeaderText}>{DAY_LABELS[d]}</Text>
                </View>
              ))}
            </View>
            {periods.map((p) => (
              <View key={p.id} style={styles.gridRow}>
                <View style={[styles.cell, styles.periodCell]}>
                  <Text style={styles.periodLabel}>{p.label}</Text>
                  <Text style={styles.periodTime}>{p.startTime}</Text>
                </View>
                {DAYS_TO_EDIT.map((d) => {
                  const key = `${d}:${p.id}`;
                  const subjectId = grid[key];
                  const sub = subjects.find((s) => s.id === subjectId);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.cell, styles.slotCell, subjectId && styles.slotCellFilled]}
                      onPress={() => openPicker(d, p.id)}
                      activeOpacity={0.7}
                    >
                      {sub ? (
                        <Text style={styles.slotSubject} numberOfLines={2}>
                          {sub.name}
                        </Text>
                      ) : (
                        <Text style={styles.slotHint}>+ Set</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {DAYS_TO_EDIT.map((d) => (
            <View key={d} style={styles.listDayCard}>
              <Text style={styles.listDayTitle}>{DAY_LABELS[d]}</Text>
              {periods.map((p) => {
                const key = `${d}:${p.id}`;
                const subjectId = grid[key];
                const sub = subjects.find((s) => s.id === subjectId);
                const assignment = assignments.find((a) => a.subjectId === subjectId && a.classSectionId === classSection.id);
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.listRow}
                    onPress={() => openPicker(d, p.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.listTimeCol}>
                      <Text style={styles.listTime}>{p.startTime}</Text>
                      <Text style={styles.listTimeEnd}>{p.endTime}</Text>
                    </View>
                    <View style={styles.listInfoCol}>
                      <Text style={styles.listSubject}>{sub ? sub.name : '— Empty Slot —'}</Text>
                      {sub && assignment?.teacherName ? (
                        <Text style={styles.listMeta}>Teacher: {assignment.teacherName}</Text>
                      ) : null}
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <Text style={styles.saveText}>{saving ? 'Publishing...' : 'Publish Timetable'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!picker} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPicker(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Subject</Text>
            {picker?.options.map((opt) => (
              <TouchableOpacity key={opt.id} style={styles.optionRow} onPress={() => selectSubject(opt.id)}>
                <MaterialCommunityIcons name="book-outline" size={18} color="#F4C430" />
                <Text style={styles.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.hint}>Tap selected subject again to clear the slot.</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#111827' },
  sub: { fontSize: 12, fontFamily: FontFamily.medium, color: '#6B7280', marginTop: 2 },
  gridWrap: { padding: 16, paddingBottom: 40 },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  viewRow: { flexDirection: 'row', gap: 6 },
  viewChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewChipActive: { backgroundColor: '#FEF08A', borderColor: '#EAB308' },
  viewChipText: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#4B5563' },
  viewChipTextActive: { color: '#121316', fontFamily: FontFamily.bold },
  listContainer: { padding: 16, gap: 12, paddingBottom: 20 },
  listDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  listDayTitle: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontSize: 13,
    fontFamily: FontFamily.bold,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#F3F4F6',
  },
  listTimeCol: { width: 56 },
  listTime: { fontSize: 13, fontFamily: FontFamily.bold, color: '#B45309' },
  listTimeEnd: { fontSize: 10.5, fontFamily: FontFamily.regular, color: '#6B7280' },
  listInfoCol: { flex: 1 },
  listSubject: { fontSize: 13, fontFamily: FontFamily.bold, color: '#111827' },
  listMeta: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 2 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    margin: 16,
    marginTop: 40,
    gap: 6,
  },
  emptyTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: '#111827', marginTop: 4 },
  emptySub: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B7280', textAlign: 'center', lineHeight: 16 },
  gridHeaderRow: { flexDirection: 'row' },
  gridRow: { flexDirection: 'row' },
  cell: { width: 74, minHeight: 56, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: '#E8E5DC', backgroundColor: '#FFFFFF' },
  dayHeaderCell: { backgroundColor: '#FEF3C7' },
  dayHeaderText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#92400E' },
  periodCell: { backgroundColor: '#F9FAFB', width: 80, alignItems: 'flex-start', paddingLeft: 10 },
  periodLabel: { fontSize: 11, fontFamily: FontFamily.bold, color: '#111827' },
  periodTime: { fontSize: 10, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 2 },
  slotCell: { gap: 2, paddingHorizontal: 4 },
  slotCellFilled: { backgroundColor: '#FFFBEA' },
  slotSubject: { fontSize: 11, fontFamily: FontFamily.bold, color: '#111827', textAlign: 'center' },
  slotHint: { fontSize: 9.5, fontFamily: FontFamily.bold, color: '#B45309' },
  footer: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
  },
  saveBtn: {
    backgroundColor: '#F4C430',
    borderRadius: 5,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  saveText: { color: '#171717', fontFamily: FontFamily.bold, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 30 },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#111827', marginBottom: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  optionText: { fontSize: 13.5, fontFamily: FontFamily.medium, color: '#111827', flex: 1 },
  hint: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 10 },
});
