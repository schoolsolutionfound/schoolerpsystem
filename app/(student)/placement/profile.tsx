import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPlacementProfile, updatePlacementProfile, PlacementProfile } from '../../../api/placement';
import { LoadingView } from '../../../features/shared/components/LoadingView';
import { AppInput } from '../../../features/shared/components/AppInput';
import { AppButton } from '../../../features/shared/components/AppButton';
import { FontFamily } from '../../../constants/fonts';

export default function PlacementProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlacementProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        resumeUrl,
        portfolioUrl,
        linkedinUrl,
        githubUrl,
        leetcodeUrl,
      });
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingView message="Loading profile..." />;
  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1B1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Placement Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Information</Text>
          <View style={styles.readOnlyGrid}>
            <View style={styles.readOnlyItem}>
              <Text style={styles.readOnlyLabel}>Branch</Text>
              <Text style={styles.readOnlyValue}>{profile.branch || 'N/A'}</Text>
            </View>
            <View style={styles.readOnlyItem}>
              <Text style={styles.readOnlyLabel}>Year</Text>
              <Text style={styles.readOnlyValue}>{profile.year || 'N/A'}</Text>
            </View>
            <View style={styles.readOnlyItem}>
              <Text style={styles.readOnlyLabel}>CGPA</Text>
              <Text style={styles.readOnlyValue}>{profile.cgpa !== null ? profile.cgpa : 'N/A'}</Text>
            </View>
            <View style={styles.readOnlyItem}>
              <Text style={styles.readOnlyLabel}>Active Backlogs</Text>
              <Text style={styles.readOnlyValue}>{profile.activeBacklogs}</Text>
            </View>
          </View>
          <Text style={styles.readOnlyHint}>
            * Academic details are managed by the institution. Contact your placement cell if these are incorrect.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Materials</Text>
          <AppInput
            label="Resume / CV (PDF URL)"
            value={resumeUrl}
            onChangeText={setResumeUrl}
            placeholder="https://firebasestorage.googleapis.com/.../resume.pdf"
            helperText="Upload your resume to Firebase Storage and paste the URL here. Make sure it's a valid link."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Links & Portfolio</Text>
          <AppInput
            label="LinkedIn URL"
            value={linkedinUrl}
            onChangeText={setLinkedinUrl}
            placeholder="https://linkedin.com/in/..."
          />
          <AppInput
            label="GitHub URL"
            value={githubUrl}
            onChangeText={setGithubUrl}
            placeholder="https://github.com/..."
          />
          <AppInput
            label="LeetCode URL"
            value={leetcodeUrl}
            onChangeText={setLeetcodeUrl}
            placeholder="https://leetcode.com/u/..."
          />
          <AppInput
            label="Personal Portfolio URL"
            value={portfolioUrl}
            onChangeText={setPortfolioUrl}
            placeholder="https://..."
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <AppButton
          title="Save Profile"
          variant="primary"
          onPress={handleSave}
          loading={saving}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  
  scroll: { padding: 20, paddingBottom: 100 },
  
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#111827', marginBottom: 16 },
  
  readOnlyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  readOnlyItem: { width: '45%', marginBottom: 8 },
  readOnlyLabel: { fontSize: 12, fontFamily: FontFamily.medium, color: '#6B7280', marginBottom: 4 },
  readOnlyValue: { fontSize: 15, fontFamily: FontFamily.semibold, color: '#111827' },
  readOnlyHint: { fontSize: 11, fontFamily: FontFamily.regular, color: '#9CA3AF', marginTop: 12, fontStyle: 'italic' },
  
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});
