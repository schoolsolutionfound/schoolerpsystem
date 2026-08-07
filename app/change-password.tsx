import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, Modal, Animated, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { changePasswordApi } from '../api/auth';
import { useUserStore } from '../store/useUserStore';
import { BorderRadius } from '../constants/theme';
import { handleGlobalError } from '../utils/errorHandler';
import { ChangePasswordForm } from '../features/auth/components/ChangePasswordForm';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const passedChecksCount = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
  
  let strengthLabel = 'Weak';
  let strengthColor = '#E53E3E';
  if (passedChecksCount >= 4) {
    strengthLabel = 'Strong';
    strengthColor = '#38A169';
  } else if (passedChecksCount >= 2) {
    strengthLabel = 'Medium';
    strengthColor = '#DD6B20';
  }

  const handleContinue = async () => {
    if (!newPassword || !confirmPassword) {
      handleGlobalError(new Error('Please fill in both password fields.'));
      return;
    }

    if (newPassword !== confirmPassword) {
      handleGlobalError(new Error('Passwords do not match.'));
      return;
    }

    if (passedChecksCount < 2) {
      handleGlobalError(new Error('Please choose a stronger password meeting the requirements below.'));
      return;
    }

    setLoading(true);

    try {
      await changePasswordApi(newPassword);

      useUserStore.getState().setUserProfile({
        mustChangePassword: false,
      });

      setShowSuccessModal(true);
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();

      setTimeout(() => {
        setShowSuccessModal(false);
        router.replace('/complete-profile');
      }, 700);
    } catch (error: any) {
      handleGlobalError(error, 'Failed to change password. Please try again.');
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
              <Text style={styles.stepText}>Step 1 of 2</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '50%' }]} />
              </View>
            </View>

            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="lock-outline" size={32} color="#7E57C2" />
              </View>
              <Text style={styles.title}>Secure Your Account</Text>
              <Text style={styles.subtitle}>
                This is your first login. For security reasons, please create a new password to secure your account.
              </Text>
            </View>

            <ChangePasswordForm
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              showPassword1={showPassword1}
              setShowPassword1={setShowPassword1}
              showPassword2={showPassword2}
              setShowPassword2={setShowPassword2}
              hasMinLength={hasMinLength}
              hasUppercase={hasUppercase}
              hasNumber={hasNumber}
              hasSpecial={hasSpecial}
              passedChecksCount={passedChecksCount}
              strengthLabel={strengthLabel}
              strengthColor={strengthColor}
              loading={loading}
              onSubmit={handleContinue}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.checkCircleBig}>
              <MaterialCommunityIcons name="check" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Password Changed!</Text>
            <Text style={styles.modalSub}>Your password has been updated securely. Proceeding to profile setup...</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 16 },
  progressContainer: { gap: 4, marginBottom: 4 },
  stepText: { fontSize: 12, fontWeight: '700', color: '#7E57C2' },
  barTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#7E57C2', borderRadius: 3 },
  header: { alignItems: 'center', textAlign: 'center', gap: 6 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EDE9F6', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A202C' },
  subtitle: { fontSize: 13, color: '#718096', textAlign: 'center', lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 24, alignItems: 'center', width: '100%', gap: 12 },
  checkCircleBig: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  modalSub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 },
});
