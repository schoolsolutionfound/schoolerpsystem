import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { ClassTeacherTimetableBuilder } from '../../teacher/components/ClassTeacherTimetableBuilder';

interface AdminTimetableViewProps {
  classSections: any[];
}

export const AdminTimetableView: React.FC<AdminTimetableViewProps> = ({ classSections }) => {
  const [selectedId, setSelectedId] = useState<string>(classSections[0]?.id || '');

  const cls = classSections.find((c: any) => c.id === selectedId) || null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Select Class / Section</Text>
      {classSections.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="school-outline" size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No classes yet</Text>
          <Text style={styles.emptySub}>Create a class/section first, then come back to build its timetable.</Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {classSections.map((c: any) => {
              const selected = c.id === selectedId;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setSelectedId(c.id)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {cls ? (
            <View style={styles.builderWrap}>
              <ClassTeacherTimetableBuilder key={cls.id} classSectionId={cls.id} classSectionName={cls.name} />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="timetable" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Select a class</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A202C', marginBottom: 10 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 6,
  },
  chipSelected: { backgroundColor: '#7E57C2', borderColor: '#7E57C2' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  chipTextSelected: { color: '#FFFFFF' },
  builderWrap: { flex: 1, marginTop: 14 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#718096', textAlign: 'center', marginTop: 4, lineHeight: 16 },
});