import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ClassTeacherTimetableBuilder } from '../../teacher/components/ClassTeacherTimetableBuilder';
import { DropdownSelect } from './DropdownSelect';

interface AdminTimetableViewProps {
  classSections: any[];
  subjects?: any[];
  subjectTeachers?: any[];
  periods?: any[];
  teachers?: any[];
}

export const AdminTimetableView: React.FC<AdminTimetableViewProps> = ({
  classSections,
  subjects = [],
  subjectTeachers = [],
  periods = [],
  teachers = [],
}) => {
  const [selectedId, setSelectedId] = useState<string>(classSections[0]?.id || '');

  const cls = classSections.find((c: any) => c.id === selectedId) || null;
  const assignedCount = cls ? subjectTeachers.filter((a: any) => a.classSectionId === cls.id).length : 0;

  if (classSections.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Timetable</Text>
            <Text style={styles.sectionCount}>Weekly schedule by class</Text>
          </View>
        </View>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconTile}>
            <MaterialCommunityIcons name="timetable" size={30} color="#F4C430" />
          </View>
          <Text style={styles.emptyTitle}>No classes yet</Text>
          <Text style={styles.emptySub}>Create a class/section first, then come back to build its timetable.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Timetable</Text>
          <Text style={styles.sectionCount}>
            {subjects.length} subjects · {periods.length} periods · {teachers.length} teachers
          </Text>
        </View>
      </View>

      <DropdownSelect
        label="Class / Section"
        value={selectedId}
        onChange={setSelectedId}
        placeholder="Select class"
        options={classSections.map((c: any) => ({ key: c.id, label: c.name }))}
        menuTitle="Class / Section"
        leadingIcon="school-outline"
      />

      {cls ? (
        <>
          <Text style={styles.assignMeta}>
            {assignedCount} subject{assignedCount === 1 ? '' : 's'} assigned · tap any cell to schedule
          </Text>
          <View style={styles.builderWrap}>
            <ClassTeacherTimetableBuilder key={cls.id} classSectionId={cls.id} classSectionName={cls.name} />
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconTile}>
            <MaterialCommunityIcons name="timetable" size={30} color="#F4C430" />
          </View>
          <Text style={styles.emptyTitle}>Select a class</Text>
          <Text style={styles.emptySub}>Pick a class/section above to view or build its weekly timetable.</Text>
        </View>
      )}
    </View>
  );
};

export const PrincipalTimetableView: React.FC<{ classSections: any[] }> = ({ classSections }) => {
  const [selectedId, setSelectedId] = useState<string>(classSections[0]?.id || '');

  const cls = classSections.find((c: any) => c.id === selectedId) || null;

  return (
    <View style={principalStyles.container}>
      <Text style={principalStyles.sectionTitle}>Select Class / Section</Text>
      {classSections.length === 0 ? (
        <View style={principalStyles.emptyCard}>
          <MaterialCommunityIcons name="school-outline" size={40} color="#6B6B6B" />
          <Text style={principalStyles.emptyTitle}>No classes yet</Text>
          <Text style={principalStyles.emptySub}>Create a class/section first, then come back to build its timetable.</Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={principalStyles.chipRow}>
            {classSections.map((c: any) => {
              const selected = c.id === selectedId;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[principalStyles.chip, selected && principalStyles.chipSelected]}
                  onPress={() => setSelectedId(c.id)}
                >
                  <Text style={[principalStyles.chipText, selected && principalStyles.chipTextSelected]}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {cls ? (
            <View style={principalStyles.builderWrap}>
              <ClassTeacherTimetableBuilder key={cls.id} classSectionId={cls.id} classSectionName={cls.name} />
            </View>
          ) : (
            <View style={principalStyles.emptyCard}>
              <MaterialCommunityIcons name="timetable" size={40} color="#6B6B6B" />
              <Text style={principalStyles.emptyTitle}>Select a class</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const principalStyles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingBottom: 40, backgroundColor: '#F9FAFB' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 12 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 6,
  },
  chipSelected: { backgroundColor: '#F4C430', borderColor: '#F4C430', borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  chipTextSelected: { color: '#1A1B1C', fontWeight: '900' },
  builderWrap: { flex: 1, marginTop: 14 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4, lineHeight: 16 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  sectionCount: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  assignMeta: {
    fontSize: 10,
    color: '#8A8A8A',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 2,
  },
  builderWrap: { flex: 1, marginTop: 10 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 20,
  },
  emptyIconTile: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#1A1B1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4, lineHeight: 16 },
});
