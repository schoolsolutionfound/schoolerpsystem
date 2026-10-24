import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { useUserStore } from '../../../store/useUserStore';
import {
  fetchMyClassSectionApi,
  fetchClassSectionsApi,
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
  const userRole = useUserStore((state) => state.userRole);
  const userDepartment = useUserStore((state) => state.department);
  const isAuthority = userRole === 'hod' || userRole === 'principal' || userRole === 'admin';

  const [availableSections, setAvailableSections] = useState<any[]>([]);
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

  const loadTimetableForSection = useCallback(async (sec: any) => {
    if (!sec?.id) return;
    try {
      const tt = await fetchClassTimetableApi(sec.id).catch(() => null);
      setExisting(tt?.slots || []);
      const g: Record<string, string> = {};
      for (const s of tt?.slots || []) {
        g[`${s.dayOfWeek}:${s.period?.id || s.periodId}`] = s.subject?.id || s.subjectId;
      }
      setGrid(g);
    } catch {
      setGrid({});
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let cls: any = null;
      let sectionsList: any[] = [];

      if (classSectionId) {
        cls = { id: classSectionId, name: classSectionName || 'Class' };
      } else if (isAuthority) {
        // HOD sets timetable for whole dept; in absence of HOD, Principal sets for whole campus
        const allSections = await fetchClassSectionsApi().catch(() => []);
        if (Array.isArray(allSections) && allSections.length > 0) {
          if (userRole === 'hod' && userDepartment) {
            const deptSections = allSections.filter((s: any) =>
              s.department?.toLowerCase() === userDepartment.toLowerCase()
            );
            sectionsList = deptSections.length > 0 ? deptSections : allSections;
          } else {
            sectionsList = allSections;
          }
          setAvailableSections(sectionsList);
          cls = sectionsList[0];
        }
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
        await loadTimetableForSection(cls);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [classSectionId, classSectionName, isAuthority, userRole, userDepartment, loadTimetableForSection]);

  const handleSelectSection = async (sec: any) => {
    setClassSection(sec);
    await loadTimetableForSection(sec);
  };

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
        <MaterialCommunityIcons name="school-outline" size={40} color="#6B6B6B" />
        <Text style={styles.emptyTitle}>No class assigned to you</Text>
        <Text style={styles.emptySub}>Your administrator has not assigned you as class teacher for any class/section.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Authority Banner for HOD and Principal */}
      {isAuthority && availableSections.length > 0 && (
        <View style={styles.authorityCard}>
          <View style={styles.authorityHeader}>
            <View style={styles.authorityIconBox}>
              <MaterialCommunityIcons
                name={userRole === 'hod' ? 'account-tie-voice' : 'shield-crown'}
                size={18}
                color="#F4C430"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.authorityTitle}>
                {userRole === 'hod'
                  ? `Department Timetable Authority (${userDepartment || 'Dept'})`
                  : userRole === 'principal'
                  ? 'Campus Timetable Authority (Principal)'
                  : 'Academic Timetable Authority'}
              </Text>
              <Text style={styles.authoritySub}>
                {userRole === 'hod'
                  ? 'HOD has full authority to configure weekly schedules for all departmental classes.'
                  : 'Principal holds primary scheduling authority across all classes and cohorts.'}
              </Text>
            </View>
          </View>

          <Text style={styles.pickerLabel}>SELECT CLASS / SECTION TO CONFIGURE:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionChipsRow}>
            {availableSections.map((sec) => {
              const active = classSection?.id === sec.id;
              return (
                <TouchableOpacity
                  key={sec.id}
                  style={[styles.sectionChip, active && styles.sectionChipActive]}
                  onPress={() => handleSelectSection(sec)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sectionChipText, active && styles.sectionChipTextActive]}>
                    {sec.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>{classSection.name} — Weekly Timetable</Text>
        <Text style={styles.sub}>Tap a cell to assign a subject. Only subjects with a subject teacher appear.</Text>
        <Text style={styles.effectiveLabel}>Effective from: {effectiveFrom}</Text>
        <View style={styles.viewRow}>
          <TouchableOpacity style={[styles.viewChip, view === 'grid' && styles.viewChipActive]} onPress={() => setView('grid')}>
            <MaterialCommunityIcons name="grid" size={15} color={view === 'grid' ? '#F4C430' : '#6B6B6B'} />
            <Text style={[styles.viewChipText, view === 'grid' && styles.viewChipTextActive]}>Grid</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.viewChip, view === 'list' && styles.viewChipActive]} onPress={() => setView('list')}>
            <MaterialCommunityIcons name="format-list-bulleted" size={15} color={view === 'list' ? '#F4C430' : '#6B6B6B'} />
            <Text style={[styles.viewChipText, view === 'list' && styles.viewChipTextActive]}>List</Text>
          </TouchableOpacity>
        </View>
      </View>

      {view === 'grid' ? (
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
                      <MaterialCommunityIcons name="plus" size={20} color="#E8E5DC" />
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
                const subjectId = grid[`${d}:${p.id}`];
                const subject = subjects.find((s: any) => s.id === subjectId);
                return (
                  <View key={p.id} style={styles.listRow}>
                    <View style={styles.listTimeCol}>
                      <Text style={styles.listTime}>{p.startTime}</Text>
                      <Text style={styles.listTimeEnd}>{p.endTime}</Text>
                    </View>
                    <View style={styles.listInfoCol}>
                      {subject ? (
                        <>
                          <Text style={styles.listSubject}>{subject.name}</Text>
                          <Text style={styles.listMeta}>{p.label}</Text>
                        </>
                      ) : (
                        <Text style={styles.listFree}>Free period</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}

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
                  <MaterialCommunityIcons name="book-open-variant" size={16} color="#F4C430" />
                  <Text style={styles.optionText}>{opt.label.replace(' ✓', '')}</Text>
                  {grid[picker.key] === opt.id && <MaterialCommunityIcons name="check" size={16} color="#16A34A" />}
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              style={[styles.optionRow, { borderTopWidth: 1, borderTopColor: '#FFFDF7', marginTop: 8, paddingTop: 10 }]}
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
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8E5DC' },
  title: { fontSize: 15, fontWeight: '800', color: '#171717' },
  sub: { fontSize: 11, color: '#6B6B6B', marginTop: 4, lineHeight: 15 },
  effectiveLabel: { fontSize: 11, color: '#F4C430', fontWeight: '700', marginTop: 6 },
  viewRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  viewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFDF7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  viewChipActive: { backgroundColor: '#FFF4C7', borderColor: '#F4C430' },
  viewChipText: { fontSize: 12, fontWeight: '700', color: '#6B6B6B' },
  viewChipTextActive: { color: '#F4C430' },
  listContainer: { padding: 16, gap: 12, paddingBottom: 20 },
  listDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  listDayTitle: {
    backgroundColor: '#FFF4C7',
    color: '#F4C430',
    fontSize: 13,
    fontWeight: '800',
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
    borderTopColor: '#FFFDF7',
  },
  listTimeCol: { width: 52 },
  listTime: { fontSize: 13, fontWeight: '800', color: '#F4C430' },
  listTimeEnd: { fontSize: 10, color: '#6B6B6B' },
  listInfoCol: { flex: 1 },
  listSubject: { fontSize: 13, fontWeight: '700', color: '#171717' },
  listMeta: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },
  listFree: { fontSize: 13, color: '#6B6B6B' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E8E5DC', margin: 16, marginTop: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#171717', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 4, lineHeight: 16 },
  gridHeaderRow: { flexDirection: 'row' },
  gridRow: { flexDirection: 'row' },
  cell: { width: 72, minHeight: 56, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: '#E8E5DC', backgroundColor: '#FFFFFF' },
  dayHeaderCell: { backgroundColor: '#FFF4C7' },
  dayHeaderText: { fontSize: 12, fontWeight: '800', color: '#F4C430' },
  periodCell: { backgroundColor: '#FFFDF7', width: 80, alignItems: 'flex-start', paddingLeft: 10 },
  periodLabel: { fontSize: 11, fontWeight: '700', color: '#171717' },
  periodTime: { fontSize: 10, color: '#6B6B6B', marginTop: 2 },
  slotCell: { gap: 2, paddingHorizontal: 4 },
  slotCellFilled: { backgroundColor: '#FFF4C7' },
  slotSubject: { fontSize: 11, fontWeight: '700', color: '#F4C430', textAlign: 'center' },
  slotHint: { fontSize: 9, color: '#F4C430' },
  footer: { padding: 14, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E8E5DC' },
  saveBtn: { backgroundColor: '#F4C430', borderRadius: BorderRadius.button, height: 48, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 30 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 18 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#171717', marginBottom: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  optionText: { fontSize: 14, color: '#171717', flex: 1 },
  hint: { fontSize: 12, color: '#6B6B6B', lineHeight: 17 },
  authorityCard: {
    backgroundColor: '#1A1B1C',
    margin: 16,
    marginBottom: 8,
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2B2D',
  },
  authorityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  authorityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFDF7',
    fontFamily: FontFamily.bold,
  },
  authoritySub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#F4C430',
    marginBottom: 8,
    fontFamily: FontFamily.semibold,
  },
  sectionChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  sectionChip: {
    backgroundColor: '#2A2B2D',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3D3E40',
  },
  sectionChipActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  sectionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  sectionChipTextActive: {
    color: '#1A1B1C',
    fontWeight: '800',
  },
});
