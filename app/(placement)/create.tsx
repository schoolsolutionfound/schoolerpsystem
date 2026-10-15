import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createDrive } from '../../api/placement';
import { FontFamily } from '../../constants/fonts';

export default function CreatePlacementDriveScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    companyName: '',
    title: '',
    description: '',
    jobType: 'full_time',
    ctcOrStipend: '',
    location: '',
    applyDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // default 1 week from now
  });

  const handleSubmit = async () => {
    if (!form.companyName || !form.title || !form.applyDeadline) {
      Alert.alert('Error', 'Company Name, Drive Title, and Deadline are required.');
      return;
    }

    setLoading(true);
    try {
      await createDrive({
        ...form,
        jobType: form.jobType as any,
        status: 'published',
        allowedBranches: [],
        allowedYears: [],
        rounds: []
      });
      Alert.alert('Success', 'Drive created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create drive.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color="#1A1B1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Drive</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.saveBtn}>
          {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveText}>Publish</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Google, Microsoft"
              value={form.companyName}
              onChangeText={(t) => setForm({ ...form, companyName: t })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Drive Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Software Engineer Fresher 2026"
              value={form.title}
              onChangeText={(t) => setForm({ ...form, title: t })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bangalore, India (or Remote)"
              value={form.location}
              onChangeText={(t) => setForm({ ...form, location: t })}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Job Type</Text>
              <View style={styles.typeSelector}>
                {['full_time', 'internship'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeBtn, form.jobType === type && styles.typeBtnActive]}
                    onPress={() => setForm({ ...form, jobType: type })}
                  >
                    <Text style={[styles.typeText, form.jobType === type && styles.typeTextActive]}>
                      {type === 'full_time' ? 'Full Time' : 'Internship'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>CTC / Stipend</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 12 LPA"
                value={form.ctcOrStipend}
                onChangeText={(t) => setForm({ ...form, ctcOrStipend: t })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Application Deadline (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-12-31"
              value={form.applyDeadline}
              onChangeText={(t) => setForm({ ...form, applyDeadline: t })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the role, responsibilities, and requirements..."
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 20 },
  headerTitle: { fontSize: 18, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  saveBtn: { backgroundColor: '#F4C430', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  saveText: { color: '#1A1B1C', fontFamily: FontFamily.bold, fontSize: 14 },
  
  scroll: { padding: 20 },
  sectionTitle: { fontSize: 18, fontFamily: FontFamily.bold, color: '#111827', marginBottom: 16 },
  
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row', marginBottom: 16 },
  label: { fontSize: 13, fontFamily: FontFamily.semibold, color: '#4B5563', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },
  textArea: { minHeight: 120, paddingTop: 12 },
  
  typeSelector: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  typeBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  typeText: { fontSize: 13, fontFamily: FontFamily.medium, color: '#6B7280' },
  typeTextActive: { color: '#111827', fontFamily: FontFamily.bold },
});
