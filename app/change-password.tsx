import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, Modal, Animated, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { updatePassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { changePasswordApi } from '../api/auth';
import { useUserStore } from '../store/useUserStore';
import { BorderRadius } from '../constants/theme';
import { FontFamily } from '../constants/fonts';
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

  const mustChangePassword = useUserStore((state) => state.mustChangePassword);
  const profileCompleted = useUserStore((state) => state.profileCompleted);
  const isFirstLogin = Boolean(mustChangePassword && !profileCompleted);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const passedChecksCount = [hasMinLength, hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;
  
  let strengthLabel = 'Weak';
  let strengthColor = '#DC2626';
  if (passedChecksCount === 4 && hasSpecial) {
    strengthLabel = 'Very Strong';
    strengthColor = '#16A34A';
  } else if (passedChecksCount === 4) {
    strengthLabel = 'Strong';
    strengthColor = '#16A34A';
  } else if (passedChecksCount >= 2) {
    strengthLabel = 'Medium';
    strengthColor = '#D97706';
  }

  const handleContinue = async () => {
    if (!newPassword || !confirmPassword) {
      handleGlobalError(new Error('Please fill in both password fields.'));
      return;
    }

    if (newPassword !== confirmPassword) {
      handleGlobalError(new Error('Passwords do not match. Please verify your entries.'));
      return;
    }

    if (!hasMinLength) {
      handleGlobalError(new Error('Password must be at least 8 characters long.'));
      return;
    }

    if (!hasUppercase) {
      handleGlobalError(new Error('Password must contain at least one uppercase letter (A-Z).'));
      return;
    }

    if (!hasLowercase) {
      handleGlobalError(new Error('Password must contain at least one lowercase letter (a-z).'));
      return;
    }

    if (!hasNumber) {
      handleGlobalError(new Error('Password must contain at least one number (0-9).'));
      return;
    }

    setLoading(true);

    try {
      // 1. Update Firebase Auth client session if user is logged in
      if (auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, newPassword);
          console.log('[ChangePassword] Firebase client password updated successfully.');
        } catch (fbErr: any) {
          console.warn('[ChangePassword] Firebase client update notice:', fbErr?.message || fbErr);
        }
      }

      // 2. Call backend to update DB flag and admin auth
      await changePasswordApi(newPassword);

      useUserStore.getState().setUserProfile({
        mustChangePassword: false,
      });

      setShowSuccessModal(true);
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: Platform.OS !== 'web' }).start();

      setTimeout(() => {
        setShowSuccessModal(false);
        if (isFirstLogin) {
          router.replace('/complete-profile');
        } else if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(teacher)/home');
        }
      }, 800);
    } catch (error: any) {
      handleGlobalError(error, 'Failed to update password. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {/* Top Bar for non-first-login users */}
        {!isFirstLogin && (
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="arrow-left" size={22} color="#171717" />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Change Password</Text>
            <View style={{ width: 40 }} />
          </View>
        )}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* First-login Progress indicator */}
            {isFirstLogin && (
              <View style={styles.progressContainer}>
                <Text style={styles.stepText}>Step 1 of 2</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '50%' }]} />
                </View>
              </View>
            )}

            <View style={styles.header}>
              <View style={[styles.iconCircle, !isFirstLogin && { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons
                  name={isFirstLogin ? 'lock-outline' : 'lock-reset'}
                  size={32}
                  color={isFirstLogin ? '#F4C430' : '#D97706'}
                />
              </View>
              <Text style={styles.title}>
                {isFirstLogin ? 'Secure Your Account' : 'Change Password'}
              </Text>
              <Text style={styles.subtitle}>
                {isFirstLogin
                  ? 'This is your first login. For security reasons, please create a new password to secure your account.'
                  : 'Enter your new password below to update your security credentials.'}
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
              hasLowercase={hasLowercase}
              hasNumber={hasNumber}
              hasSpecial={hasSpecial}
              passedChecksCount={passedChecksCount}
              strengthLabel={strengthLabel}
              strengthColor={strengthColor}
              loading={loading}
              onSubmit={handleContinue}
              submitButtonText={isFirstLogin ? 'Continue' : 'Update Password'}
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
            <Text style={styles.modalTitle}>
              {isFirstLogin ? 'Password Changed!' : 'Password Updated!'}
            </Text>
            <Text style={styles.modalSub}>
              {isFirstLogin
                ? 'Your password has been updated securely. Proceeding to profile setup...'
                : 'Your password has been updated successfully.'}
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFDF7',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 16 },
  progressContainer: { gap: 4, marginBottom: 4 },
  stepText: { fontSize: 12, fontWeight: '700', fontFamily: FontFamily.bold, color: '#F4C430' },
  barTrack: { height: 6, backgroundColor: '#E8E5DC', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#F4C430', borderRadius: 3 },
  header: { alignItems: 'center', textAlign: 'center', gap: 6 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#171717' },
  subtitle: { fontSize: 13, color: '#6B6B6B', textAlign: 'center', lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.modal, padding: 24, alignItems: 'center', width: '100%', gap: 12 },
  checkCircleBig: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#171717' },
  modalSub: { fontSize: 13, color: '#6B6B6B', textAlign: 'center', lineHeight: 18 },
});
