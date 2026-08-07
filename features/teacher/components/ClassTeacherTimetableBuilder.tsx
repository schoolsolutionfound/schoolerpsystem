import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
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

export const ClassTeacherTimetableBuilder: React.FC = () => {
  const [classSection, setClassSection] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [existing, setExisting] = useState<any[]>([]);
  const [grid, setGrid] = useState<Record<string, string>>({});
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<{ key: string; options: { id: string; label: string }[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cls = await fetchMyClassSectionApi().catch(() => null);
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
  }, []);

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
    return <View style={styles.centerBox}><ActivityIndicator size="large" color="#7E57C2" /></View>;
  }

  if (!classSection) {
    return (
      <View style={styles.emptyCard}>
        <MaterialCommunityIcons name="school-outline" size={40} color="#94A3B8" />
        <Text style={styles.emptyTitle}>No class assigned to you</Text>
        <Text style={styles.emptySub}>Your administrator has not assigned you as class teacher for any class/section.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{classSection.name} — Weekly Timetable</Text>
        <Text style={styles.sub}>Tap a cell to assign a subject. Only subjects with a subject teacher appear.</Text>
        <Text style={styles.effectiveLabel}>Effective from: {effectiveFrom}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
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
                const subject = subjects.find((s: any) => s.id === subjectId);
                const isFilled = !!subject;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.cell, styles.slotCell, isFilled && styles.slotCellFilled]}
                    onPress={() => {
                      const options = getSubjectOptions(d, p.id);
                      setPicker({ key, options });
                    }}
                  >
                    {subject ? (
                      <>
                        <Text style={styles.slotSubject}>{subject.name}</Text>
                        <Text style={styles.slotHint}>tap to change</Text>
                      </>
                    ) : (
                      <MaterialCommunityIcons name="plus" size={20} color="#CBD5E1" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'Publishing...' : 'Publish New Version'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!picker} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Subject</Text>
            {picker?.options.length === 0 ? (
              <Text style={styles.hint}>No subjects assigned to this class. Ask the administrator to assign subject teachers first.</Text>
            ) : (
              picker?.options.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.optionRow}
                  onPress={() => {
                    setGrid((prev) => ({ ...prev, [picker.key]: opt.id }));
                    setPicker(null);
                  }}
                >
                  <MaterialCommunityIcons name="book-open-variant" size={16} color="#7E57C2" />
                  <Text style={styles.optionText}>{opt.label.replace(' ✓', '')}</Text>
                  {grid[picker.key] === opt.id && <MaterialCommunityIcons name="check" size={16} color="#16A34A" />}
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              style={[styles.optionRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 8, paddingTop: 10 }]}
              onPress={() => {
                if (picker) setGrid((prev) => { const c = { ...prev }; delete c[picker.key]; return c; });
                setPicker(null);
              }}
            >
              <MaterialCommunityIcons name="close" size={16} color="#EF4444" />
              <Text style={[styles.optionText, { color: '#EF4444' }]}>Clear slot</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 15, fontWeight: '800', color: '#1A202C' },
  sub: { fontSize: 11, color: '#718096', marginTop: 4, lineHeight: 15 },
  effectiveLabel: { fontSize: 11, color: '#7E57C2', fontWeight: '700', marginTop: 6 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', margin: 16, marginTop: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#718096', textAlign: 'center', marginTop: 4, lineHeight: 16 },
  gridHeaderRow: { flexDirection: 'row' },
  gridRow: { flexDirection: 'row' },
  cell: { width: 72, minHeight: 56, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  dayHeaderCell: { backgroundColor: '#EDE7F6' },
  dayHeaderText: { fontSize: 12, fontWeight: '800', color: '#7E57C2' },
  periodCell: { backgroundColor: '#F8F9FB', width: 80, alignItems: 'flex-start', paddingLeft: 10 },
  periodLabel: { fontSize: 11, fontWeight: '700', color: '#1A202C' },
  periodTime: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  slotCell: { gap: 2, paddingHorizontal: 4 },
  slotCellFilled: { backgroundColor: '#F5F3FF' },
  slotSubject: { fontSize: 11, fontWeight: '700', color: '#7E57C2', textAlign: 'center' },
  slotHint: { fontSize: 9, color: '#A5B4FC' },
  footer: { padding: 14, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  saveBtn: { backgroundColor: '#7E57C2', borderRadius: BorderRadius.button, height: 48, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 30 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 18 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1A202C', marginBottom: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  optionText: { fontSize: 14, color: '#1A202C', flex: 1 },
  hint: { fontSize: 12, color: '#718096', lineHeight: 17 },
});
