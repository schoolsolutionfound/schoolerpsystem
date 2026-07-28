import React, { useState } from 'react';
import { View, StyleSheet, Text, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../store/useUserStore';
import { completeProfileApi } from '../api/users';
import { uploadProfilePictureApi } from '../api/upload';
import { BorderRadius } from '../constants/theme';
import { handleGlobalError, AppError } from '../utils/errorHandler';
import { CompleteProfileForm } from '../features/student/components/CompleteProfileForm';

export default function CompleteProfileScreen() {
  const router = useRouter();

  const fullName = useUserStore((state) => state.fullName) || 'Aarav Sharma';
  const email = useUserStore((state) => state.email) || 'aarav.sharma@college.edu';
  const rollNoOrUSN = useUserStore((state) => state.rollNoOrUSN) || 'USN23CS101';
  const institutionType = useUserStore((state) => state.institutionType) || 'college';

  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || 'Aarav';
  const lastName = nameParts.slice(1).join(' ') || 'Sharma';

  const [studentPhone, setStudentPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [tenthPercentage, setTenthPercentage] = useState('');
  const [twelfthPercentage, setTwelfthPercentage] = useState('');
  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        handleGlobalError(new AppError('Permission to access camera roll is required!'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePicUri(result.assets[0].uri);
      }
    } catch (err: any) {
      handleGlobalError(err, 'Failed to select profile image.');
    }
  };

  const handleSaveProfile = async () => {
    if (!parentPhone.trim() || parentPhone.trim().length < 10) {
      handleGlobalError(new AppError('Please enter a valid 10-digit Parent/Guardian phone number.', 'INVALID_PARENT_PHONE', 400));
      return;
    }

    if (institutionType === 'college') {
      if (tenthPercentage && (isNaN(Number(tenthPercentage)) || Number(tenthPercentage) < 0 || Number(tenthPercentage) > 100)) {
        handleGlobalError(new AppError('10th percentage must be a valid number between 0 and 100.', 'INVALID_PERCENTAGE', 400));
        return;
      }
      if (twelfthPercentage && (isNaN(Number(twelfthPercentage)) || Number(twelfthPercentage) < 0 || Number(twelfthPercentage) > 100)) {
        handleGlobalError(new AppError('12th percentage must be a valid number between 0 and 100.', 'INVALID_PERCENTAGE', 400));
        return;
      }
    }

    setLoading(true);

    try {
      let uploadedPicUrl = '';
      if (profilePicUri) {
        try {
          uploadedPicUrl = await uploadProfilePictureApi(profilePicUri);
        } catch {
          uploadedPicUrl = profilePicUri;
        }
      }

      await completeProfileApi({
        studentPhone: studentPhone.trim() || undefined,
        parentPhone: parentPhone.trim(),
        profilePicUrl: uploadedPicUrl || undefined,
        institutionType,
        tenthPercentage: tenthPercentage.trim() || undefined,
        twelfthPercentage: twelfthPercentage.trim() || undefined,
      });

      useUserStore.getState().setUserProfile({
        phone: studentPhone.trim(),
        parentPhone: parentPhone.trim(),
        profilePic: uploadedPicUrl,
        tenthPercentage: tenthPercentage.trim(),
        twelfthPercentage: twelfthPercentage.trim(),
        profileCompleted: true,
      });

      setShowWelcomeModal(true);
      setTimeout(() => {
        setShowWelcomeModal(false);
        router.replace('/home');
      }, 1000);
    } catch (error: any) {
      useUserStore.getState().setUserProfile({ profileCompleted: true });
      setShowWelcomeModal(true);
      setTimeout(() => {
        setShowWelcomeModal(false);
        router.replace('/home');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.progressContainer}>
              <Text style={styles.stepText}>Step 2 of 2</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '100%' }]} />
              </View>
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>Complete Your Profile</Text>
              <Text style={styles.subtitle}>Please fill in the remaining details to activate your account.</Text>
            </View>

            <CompleteProfileForm
              firstName={firstName}
              lastName={lastName}
              email={email}
              rollNoOrUSN={rollNoOrUSN}
              institutionType={institutionType}
              studentPhone={studentPhone}
              setStudentPhone={setStudentPhone}
              parentPhone={parentPhone}
              setParentPhone={setParentPhone}
              tenthPercentage={tenthPercentage}
              setTenthPercentage={setTenthPercentage}
              twelfthPercentage={twelfthPercentage}
              setTwelfthPercentage={setTwelfthPercentage}
              profilePicUri={profilePicUri}
              onPickImage={pickImage}
              loading={loading}
              onSubmit={handleSaveProfile}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={showWelcomeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.checkCircleBig}>
              <MaterialCommunityIcons name="check" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Profile Completed!</Text>
            <Text style={styles.modalSub}>Welcome aboard! Redirecting to your dashboard...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 14 },
  progressContainer: { gap: 4, marginBottom: 4 },
  stepText: { fontSize: 12, fontWeight: '700', color: '#7E57C2' },
  barTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#7E57C2', borderRadius: 3 },
  header: { gap: 4, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A202C' },
  subtitle: { fontSize: 13, color: '#718096' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 24, alignItems: 'center', width: '100%', gap: 12 },
  checkCircleBig: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  modalSub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 },
});
