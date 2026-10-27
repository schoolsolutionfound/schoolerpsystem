import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createDrive } from '../../api/placement';
import { FontFamily } from '../../constants/fonts';
import { BorderRadius } from '../../constants/theme';
import { safeGoBack } from '../../features/shared/utils/safeNavigation';

export default function CreatePlacementDriveScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(() => ({
    companyName: '',
    title: '',
    description: '',
    jobType: 'full_time',
    ctcOrStipend: '',
    location: '',
    minCgpa: '',
    maxBacklogs: '0',
    applyDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }));

  const [rounds, setRounds] = useState<{ name: string; description: string }[]>([
    { name: 'Online Assessment', description: 'Aptitude & Coding Test' },
    { name: 'Technical Interview', description: 'Core Concepts & DSA' },
    { name: 'HR Interview', description: 'Behavioral & Fitment' },
  ]);

  const addRound = () => {
    setRounds([
      ...rounds,
      { name: `Round ${rounds.length + 1}`, description: '' },
    ]);
  };

  const removeRound = (index: number) => {
    if (rounds.length <= 1) {
      Alert.alert('Notice', 'A placement drive must have at least one round.');
      return;
    }
    setRounds(rounds.filter((_, i) => i !== index));
  };

  const updateRound = (index: number, key: 'name' | 'description', value: string) => {
    const updated = [...rounds];
    updated[index][key] = value;
    setRounds(updated);
  };

  const handleSubmit = async () => {
    if (!form.companyName.trim() || !form.title.trim() || !form.applyDeadline.trim()) {
      Alert.alert('Required Fields', 'Company Name, Job Title, and Application Deadline are required.');
      return;
    }

    setLoading(true);
    try {
      await createDrive({
        companyName: form.companyName.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        jobType: form.jobType as any,
        ctcOrStipend: form.ctcOrStipend.trim(),
        location: form.location.trim(),
        minCgpa: form.minCgpa ? parseFloat(form.minCgpa) : undefined,
        maxBacklogs: form.maxBacklogs ? parseInt(form.maxBacklogs, 10) : undefined,
        applyDeadline: form.applyDeadline.trim(),
        status: 'published',
        allowedBranches: [],
        allowedYears: [],
        rounds,
      });

      if (Platform.OS === 'web') {
        window.alert('Placement drive has been successfully created and published.');
        router.replace('/(placement)/drives');
      } else {
        Alert.alert('Drive Published', 'Placement drive has been successfully created and published.', [
          { text: 'View Drives', onPress: () => router.replace('/(placement)/drives') },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create drive.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    safeGoBack(navigation, '/home');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Feather name="x" size={20} color="#171717" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Drive</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Section: Basic Info */}
          <Text style={styles.sectionHeader}>BASIC INFORMATION</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Found , Google"
                placeholderTextColor="#9A9A9A"
                value={form.companyName}
                onChangeText={(t) => setForm({ ...form, companyName: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Title / Role *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Software Engineer"
                placeholderTextColor="#9A9A9A"
                value={form.title}
                onChangeText={(t) => setForm({ ...form, title: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Bangalore"
                placeholderTextColor="#9A9A9A"
                value={form.location}
                onChangeText={(t) => setForm({ ...form, location: t })}
              />
            </View>

            {/* Job Type Toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Employment Type</Text>
              <View style={styles.typeSelector}>
                {[
                  { key: 'full_time', label: 'Full Time' },
                  { key: 'internship', label: 'Internship' },
                  { key: 'part_time', label: 'Part Time' },
                ].map((type) => {
                  const active = form.jobType === type.key;
                  return (
                    <TouchableOpacity
                      key={type.key}
                      style={[styles.typeBtn, active && styles.typeBtnActive]}
                      onPress={() => setForm({ ...form, jobType: type.key })}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.typeText, active && styles.typeTextActive]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CTC / Stipend</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 14 LPA"
                placeholderTextColor="#9A9A9A"
                value={form.ctcOrStipend}
                onChangeText={(t) => setForm({ ...form, ctcOrStipend: t })}
              />
            </View>
          </View>

          {/* Section: Eligibility Criteria */}
          <Text style={styles.sectionHeader}>ELIGIBILITY & DEADLINE</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Min CGPA</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 7.5"
                  placeholderTextColor="#9A9A9A"
                  keyboardType="decimal-pad"
                  value={form.minCgpa}
                  onChangeText={(t) => setForm({ ...form, minCgpa: t })}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Max Backlogs</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 0"
                  placeholderTextColor="#9A9A9A"
                  keyboardType="number-pad"
                  value={form.maxBacklogs}
                  onChangeText={(t) => setForm({ ...form, maxBacklogs: t })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Application Deadline</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-12-31"
                placeholderTextColor="#9A9A9A"
                value={form.applyDeadline}
                onChangeText={(t) => setForm({ ...form, applyDeadline: t })}
              />
            </View>
          </View>

          {/* Section: Selection Stages / Rounds */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>SELECTION ROUNDS ({rounds.length})</Text>
            <TouchableOpacity onPress={addRound} style={styles.addRoundBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="plus" size={16} color="#1A1B1C" />
              <Text style={styles.addRoundText}>Add Stage</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {rounds.map((round, idx) => (
              <View key={idx} style={styles.roundItem}>
                <View style={styles.roundHeaderRow}>
                  <Text style={styles.roundIndexText}>Round {idx + 1}</Text>
                  {rounds.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeRound(idx)}
                      hitSlop={8}
                      style={styles.deleteRoundBtn}
                    >
                      <Feather name="trash-2" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={[styles.input, { marginBottom: 6 }]}
                  placeholder="Round Title (e.g. Technical Interview 1)"
                  placeholderTextColor="#9A9A9A"
                  value={round.name}
                  onChangeText={(v) => updateRound(idx, 'name', v)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Round Description (optional details/format)"
                  placeholderTextColor="#9A9A9A"
                  value={round.description}
                  onChangeText={(v) => updateRound(idx, 'description', v)}
                />
              </View>
            ))}
          </View>

          {/* Section: Job Description */}
          <Text style={styles.sectionHeader}>JOB DESCRIPTION & NOTES</Text>
          <View style={styles.card}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Outline role responsibilities, required tech stack, eligibility notes, bond details..."
              placeholderTextColor="#9A9A9A"
              value={form.description}
              onChangeText={(t) => setForm({ ...form, description: t })}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Bottom Actions - Right-aligned Publish Button */}
          <View style={styles.bottomActionRow}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={styles.publishBtn}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1A1B1C" />
              ) : (
                <Text style={styles.publishText}>Publish Drive</Text>
              )}
            </TouchableOpacity>
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
    borderBottomColor: '#E8E5DC',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  bottomActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: 8,
  },
  publishBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  publishText: {
    color: '#1A1B1C',
    fontWeight: '800',
    fontSize: 13,
  },

  scroll: { padding: 14, gap: 10 },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  addRoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addRoundText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1B1C',
    textDecorationLine: 'underline',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 12,
  },
  inputGroup: { gap: 6 },
  row: { flexDirection: 'row' },
  label: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#171717',
    fontFamily: FontFamily.regular,
  },
  textArea: { minHeight: 110, paddingTop: 10 },

  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F1EA',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeBtnActive: {
    backgroundColor: '#1A1B1C',
  },
  typeText: { fontSize: 12, fontWeight: '700', color: '#6B6B6B' },
  typeTextActive: { color: '#FFFFFF', fontWeight: '800' },

  roundItem: {
    backgroundColor: '#FFFEFE',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  roundHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roundIndexText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1B1C',
    textTransform: 'uppercase',
  },
  deleteRoundBtn: { padding: 4 },
});
