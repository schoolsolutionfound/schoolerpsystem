import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, Colors } from '../../../constants/theme';

interface AdminInstitutionViewProps {
  config: {
    institutionCode: string;
    institutionName: string;
    institutionType: string;
    subscriptionStatus?: string;
    departments: string[];
    academicYears: string[];
    courses: string[];
    sections: string[];
  };
  onSaveConfig: (updated: {
    departments: string[];
    academicYears: string[];
    courses: string[];
    sections: string[];
  }) => Promise<void>;
}

export const AdminInstitutionView: React.FC<AdminInstitutionViewProps> = ({ config, onSaveConfig }) => {
  const [departments, setDepartments] = useState<string[]>(config.departments || []);
  const [academicYears, setAcademicYears] = useState<string[]>(config.academicYears || []);
  const [courses, setCourses] = useState<string[]>(config.courses || []);
  const [sections, setSections] = useState<string[]>(config.sections || []);

  const [newDept, setNewDept] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newSection, setNewSection] = useState('');
  const [saving, setSaving] = useState(false);

  const addItem = (item: string, setItem: (v: string) => void, list: string[], setList: (l: string[]) => void) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    if (list.includes(trimmed)) {
      Alert.alert('Duplicate Item', `"${trimmed}" already exists.`);
      return;
    }
    setList([...list, trimmed]);
    setItem('');
  };

  const removeItem = (index: number, list: string[], setList: (l: string[]) => void) => {
    const updated = [...list];
    updated.splice(index, 1);
    setList(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveConfig({ departments, academicYears, courses, sections });
      Alert.alert('Success', 'Academic structure configuration updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Institution Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Institution Name:</Text>
          <Text style={styles.infoValue}>{config.institutionName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Institution Code:</Text>
          <Text style={[styles.infoValue, styles.codeText]}>{config.institutionCode}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{config.subscriptionStatus || 'Active'}</Text>
          </View>
        </View>
      </View>

      {/* Departments Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Departments Setup</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Computer Science"
            value={newDept}
            onChangeText={setNewDept}
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => addItem(newDept, setNewDept, departments, setDepartments)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chipContainer}>
          {departments.map((dept, idx) => (
            <View key={idx} style={styles.chip}>
              <Text style={styles.chipText}>{dept}</Text>
              <TouchableOpacity onPress={() => removeItem(idx, departments, setDepartments)}>
                <MaterialCommunityIcons name="close-circle" size={16} color="#7E57C2" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Academic Years Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Academic Years Setup</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1st Year"
            value={newYear}
            onChangeText={setNewYear}
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => addItem(newYear, setNewYear, academicYears, setAcademicYears)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chipContainer}>
          {academicYears.map((year, idx) => (
            <View key={idx} style={[styles.chip, { backgroundColor: '#E0F2FE' }]}>
              <Text style={[styles.chipText, { color: '#0284C7' }]}>{year}</Text>
              <TouchableOpacity onPress={() => removeItem(idx, academicYears, setAcademicYears)}>
                <MaterialCommunityIcons name="close-circle" size={16} color="#0284C7" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Courses Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Courses Setup</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. B.Tech"
            value={newCourse}
            onChangeText={setNewCourse}
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => addItem(newCourse, setNewCourse, courses, setCourses)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.chipContainer}>
          {courses.map((course, idx) => (
            <View key={idx} style={[styles.chip, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.chipText, { color: '#D97706' }]}>{course}</Text>
              <TouchableOpacity onPress={() => removeItem(idx, courses, setCourses)}>
                <MaterialCommunityIcons name="close-circle" size={16} color="#D97706" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Academic Structure'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1A202C' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 13, color: '#718096', fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#1A202C' },
  codeText: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#7E57C2' },
  statusBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.chip },
  statusBadgeText: { fontSize: 11, fontWeight: '800', color: '#16A34A' },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#F8F9FB',
  },
  addBtn: {
    backgroundColor: '#7E57C2',
    height: 42,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: '#7E57C2' },
  saveBtn: {
    backgroundColor: '#7E57C2',
    height: 48,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
