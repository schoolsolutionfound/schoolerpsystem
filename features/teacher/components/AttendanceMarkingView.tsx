import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { fetchRosterApi, fetchAttendanceForSlotApi, markAttendanceApi } from '../../../api/academics';

type Status = 'present' | 'absent' | 'late' | 'excused';

const STATUS_META: Record<Status, { label: string; color: string; icon: string }> = {
  present: { label: 'Present', color: '#16A34A', icon: 'check-circle' },
  absent: { label: 'Absent', color: '#DC2626', icon: 'close-circle' },
  late: { label: 'Late', color: '#F59E0B', icon: 'clock-alert' },
  excused: { label: 'Excused', color: '#3B82F6', icon: 'shield-check' },
};

interface AttendanceMarkingViewProps {
  slotId: string;
  subjectName: string;
  onSaved?: () => void;
}

export const AttendanceMarkingView: React.FC<AttendanceMarkingViewProps> = ({ slotId, subjectName, onSaved }) => {
  const [date] = useState(new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [classSection, setClassSection] = useState<any>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rosterRes, existingRes] = await Promise.all([
        fetchRosterApi(slotId),
        fetchAttendanceForSlotApi(slotId, date).catch(() => null),
      ]);
      setRoster(rosterRes?.students || []);
      setClassSection(rosterRes?.classSection || null);

      const initial: Record<string, Status> = {};
      if (existingRes?.record) {
        setLocked(existingRes.record.status === 'locked');
        for (const e of existingRes.entries || []) {
          initial[e.studentId] = e.attendanceStatus;
        }
      }
      for (const s of rosterRes?.students || []) {
        if (!initial[s.id]) initial[s.id] = 'present';
      }
      setMarks(initial);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [slotId, date]);

  useEffect(() => {
    load();
  }, [load]);

  const setAllPresent = () => {
    const all: Record<string, Status> = {};
    for (const s of roster) all[s.id] = 'present';
    setMarks(all);
  };

  const cycleStatus = (studentId: string) => {
    if (locked) return;
    const order: Status[] = ['present', 'absent', 'late', 'excused'];
    const current = marks[studentId] || 'present';
    const next = order[(order.indexOf(current) + 1) % order.length];
    setMarks((prev) => ({ ...prev, [studentId]: next }));
  };

  const countByStatus = () => {
    const counts: Record<string, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const s of roster) {
      counts[marks[s.id] || 'present']++;
    }
    return counts;
  };

  const handleSave = async () => {
    if (roster.length === 0) return;
    setSaving(true);
    try {
      const entries = roster.map((s) => ({ studentId: s.id, attendanceStatus: marks[s.id] || 'present' }));
      await markAttendanceApi({ timetableSlotId: slotId, date, entries });
      Alert.alert('Saved', `Attendance recorded (${entries.length} students).`);
      onSaved?.();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const counts = countByStatus();
  const dateLabel = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subject}>{subjectName}</Text>
        {classSection?.name ? <Text style={styles.className}>{classSection.name}</Text> : null}
        <Text style={styles.date}>{dateLabel}</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}><ActivityIndicator size="large" color="#7E57C2" /></View>
      ) : roster.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="account-group-outline" size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No students in this class</Text>
          <Text style={styles.emptySub}>Add students to the matching class/section in the Admin Academics screen.</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.markAllBtn} onPress={setAllPresent} disabled={locked}>
                <MaterialCommunityIcons name="check-all" size={18} color="#FFFFFF" />
                <Text style={styles.markAllText}>Mark All Present</Text>
              </TouchableOpacity>
              <View style={styles.summary}>
                <Text style={[styles.summaryText, { color: '#16A34A' }]}>P {counts.present}</Text>
                <Text style={[styles.summaryText, { color: '#DC2626' }]}>A {counts.absent}</Text>
                <Text style={[styles.summaryText, { color: '#F59E0B' }]}>L {counts.late}</Text>
                <Text style={[styles.summaryText, { color: '#3B82F6' }]}>E {counts.excused}</Text>
              </View>
            </View>

            {locked && (
              <View style={styles.lockedBanner}>
                <MaterialCommunityIcons name="lock" size={14} color="#DC2626" />
                <Text style={styles.lockedText}>Attendance for this class is locked and can no longer be edited.</Text>
              </View>
            )}

            {roster.map((s: any) => {
              const status = marks[s.id] || 'present';
              const meta = STATUS_META[status];
              return (
                <TouchableOpacity key={s.id} style={styles.studentRow} onPress={() => cycleStatus(s.id)} disabled={locked} activeOpacity={0.7}>
                  <View style={styles.studentInfo}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{s.fullName?.substring(0, 2).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{s.fullName}</Text>
                      <Text style={styles.studentRoll}>{s.rollNoOrUSN || ''}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: `${meta.color}18` }]}>
                    <MaterialCommunityIcons name={meta.icon as any} size={14} color={meta.color} />
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving || locked}>
              <Text style={styles.saveText}>{locked ? 'Locked' : saving ? 'Saving...' : 'Save Attendance'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  subject: { fontSize: 18, fontWeight: '800', color: '#1A202C' },
  className: { fontSize: 13, color: '#718096', marginTop: 3 },
  date: { fontSize: 12, color: '#7E57C2', fontWeight: '700', marginTop: 6 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  list: { padding: 16, paddingBottom: 20 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  markAllBtn: { backgroundColor: '#16A34A', borderRadius: BorderRadius.button, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  markAllText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  summary: { flexDirection: 'row', gap: 10 },
  summaryText: { fontSize: 12, fontWeight: '800' },
  lockedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, marginBottom: 12 },
  lockedText: { fontSize: 12, color: '#DC2626', flex: 1 },
  studentRow: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, borderWidth: 1, borderColor: '#E2E8F0',
    padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EDE7F6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '800', color: '#7E57C2' },
  studentName: { fontSize: 13, fontWeight: '700', color: '#1A202C' },
  studentRoll: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  statusText: { fontSize: 11, fontWeight: '800' },
  footer: { padding: 14, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  saveBtn: { backgroundColor: '#7E57C2', borderRadius: BorderRadius.button, height: 48, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', margin: 16, marginTop: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#718096', textAlign: 'center', marginTop: 4, lineHeight: 16 },
});
