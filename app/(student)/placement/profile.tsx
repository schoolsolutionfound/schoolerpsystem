import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPlacementProfile, updatePlacementProfile, PlacementProfile } from '../../../api/placement';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { safeGoBack } from '../../../features/shared/utils/safeNavigation';

export default function PlacementProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<PlacementProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [cgpa, setCgpa] = useState('');
  const [activeBacklogs, setActiveBacklogs] = useState('0');
  const [tenthPercent, setTenthPercent] = useState('');
  const [twelfthPercent, setTwelfthPercent] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getPlacementProfile();
      setProfile(data);
      setCgpa(data.cgpa !== null && data.cgpa !== undefined ? String(data.cgpa) : '');
      setActiveBacklogs(String(data.activeBacklogs ?? 0));
      setTenthPercent(data.tenthPercent !== null && data.tenthPercent !== undefined ? String(data.tenthPercent) : '');
      setTwelfthPercent(data.twelfthOrDiplomaPercent !== null && data.twelfthOrDiplomaPercent !== undefined ? String(data.twelfthOrDiplomaPercent) : '');
      setResumeUrl(data.resumeUrl || '');
      setPortfolioUrl(data.portfolioUrl || '');
      setLinkedinUrl(data.linkedinUrl || '');
      setGithubUrl(data.githubUrl || '');
      setLeetcodeUrl(data.leetcodeUrl || '');
    } catch (err) {
      console.warn('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePlacementProfile({
        cgpa: cgpa.trim() ? parseFloat(cgpa.trim()) : null,
        activeBacklogs: activeBacklogs.trim() ? parseInt(activeBacklogs.trim(), 10) : 0,
        tenthPercent: tenthPercent.trim() ? parseFloat(tenthPercent.trim()) : null,
        twelfthOrDiplomaPercent: twelfthPercent.trim() ? parseFloat(twelfthPercent.trim()) : null,
        resumeUrl: resumeUrl.trim(),
        portfolioUrl: portfolioUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        githubUrl: githubUrl.trim(),
        leetcodeUrl: leetcodeUrl.trim(),
      });
      Alert.alert('Profile Saved', 'Your placement profile has been updated successfully!');
      handleBack();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not update placement profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    safeGoBack(navigation, '/(student)/placement');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#F4C430" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#171717" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Placement Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Academic Record Card */}
          <Text style={styles.sectionHeader}>ACADEMIC RECORD</Text>
          <View style={styles.card}>
            <View style={styles.readOnlyGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.itemLabel}>Branch / Stream</Text>
                <Text style={styles.itemVal}>{profile.branch || 'General'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.itemLabel}>Academic Year</Text>
                <Text style={styles.itemVal}>{profile.year || 'Current'}</Text>
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>College CGPA *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 8.75"
                  placeholderTextColor="#9A9A9A"
                  value={cgpa}
                  onChangeText={setCgpa}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Active Backlogs *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor="#9A9A9A"
                  value={activeBacklogs}
                  onChangeText={setActiveBacklogs}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>10th Percentage (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 85.0"
                  placeholderTextColor="#9A9A9A"
                  value={tenthPercent}
                  onChangeText={setTenthPercent}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>12th / Diploma (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 88.5"
                  placeholderTextColor="#9A9A9A"
                  value={twelfthPercent}
                  onChangeText={setTwelfthPercent}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          {/* Application Materials */}
          <Text style={styles.sectionHeader}>APPLICATION MATERIALS</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Resume / CV (PDF Link) *</Text>
              <TextInput
                style={styles.input}
                placeholder="https://firebasestorage.googleapis.com/.../resume.pdf"
                placeholderTextColor="#9A9A9A"
                value={resumeUrl}
                onChangeText={setResumeUrl}
                autoCapitalize="none"
              />
              <Text style={styles.fieldHint}>
                Paste a public PDF link (such as Firebase Storage or Google Drive with viewer access).
              </Text>
            </View>
          </View>

          {/* Portfolio & Profiles */}
          <Text style={styles.sectionHeader}>PROFILES & PORTFOLIO</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>LinkedIn Profile URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://linkedin.com/in/username"
                placeholderTextColor="#9A9A9A"
                value={linkedinUrl}
                onChangeText={setLinkedinUrl}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GitHub Profile URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://github.com/username"
                placeholderTextColor="#9A9A9A"
                value={githubUrl}
                onChangeText={setGithubUrl}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>LeetCode / Coding Profile</Text>
              <TextInput
                style={styles.input}
                placeholder="https://leetcode.com/username"
                placeholderTextColor="#9A9A9A"
                value={leetcodeUrl}
                onChangeText={setLeetcodeUrl}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Personal Website / Portfolio</Text>
              <TextInput
                style={styles.input}
                placeholder="https://myportfolio.dev"
                placeholderTextColor="#9A9A9A"
                value={portfolioUrl}
                onChangeText={setPortfolioUrl}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Save Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#1A1B1C" />
          ) : (
            <Text style={styles.saveBtnText}>Save Placement Profile</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#171717', fontFamily: FontFamily.bold },

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

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 12,
  },

  readOnlyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: { width: '47%', paddingVertical: 4 },
  itemLabel: { fontSize: 11, color: '#8A8A8A', fontWeight: '600' },
  itemVal: { fontSize: 14, fontWeight: '800', color: '#171717', marginTop: 2 },

  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F1EA',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  hintText: { fontSize: 11, color: '#6B6B6B', flex: 1, lineHeight: 15 },

  inputRow: { flexDirection: 'row', gap: 12 },
  inputGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#171717',
    fontFamily: FontFamily.regular,
  },
  fieldHint: { fontSize: 10, color: '#8A8A8A', marginTop: 2 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    padding: 14,
  },
  saveBtn: {
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#1A1B1C' },
});
