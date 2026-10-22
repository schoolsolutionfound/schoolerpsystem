import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, Modal, Animated, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { changePasswordApi } from '../api/auth';
import { useUserStore } from '../store/useUserStore';
import { FontFamily } from '../constants/fonts';
import { handleGlobalError } from '../utils/errorHandler';
import { ChangePasswordForm } from '../features/auth/components/ChangePasswordForm';
import { getHomeRouteForRole } from '../features/shared/utils/routeGuards';
import { performLogout } from '../utils/logout';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const userRole = useUserStore((s) => s.userRole);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);

  const mustChangePassword = useUserStore((s) => s.mustChangePassword);
  const profileCompleted = useUserStore((s) => s.profileCompleted);
  const isEmailVerified = useUserStore((s) => s.isEmailVerified);

  // Voluntary change (from profile/drawer): current password is optional.
  // Forced first-login flow (mustChangePassword=true): field is hidden entirely.
  const requireCurrentPassword = !mustChangePassword;

  const scaleAnim = useMemo(() => new Animated.Value(0.8), []);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const passedChecksCount = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
  
  let strengthLabel = 'Weak';
  let strengthColor = '#DC2626';
  if (passedChecksCount >= 4) {
    strengthLabel = 'Strong';
    strengthColor = '#1A1B1C';
  } else if (passedChecksCount >= 2) {
    strengthLabel = 'Medium';
    strengthColor = '#F4C430';
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
      await changePasswordApi(newPassword, requireCurrentPassword ? currentPassword : undefined);

      useUserStore.getState().setUserProfile({
        mustChangePassword: false,
      });

      setShowSuccessModal(true);
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();

      setTimeout(() => {
        setShowSuccessModal(false);
        if (!profileCompleted) {
          router.replace('/complete-profile');
        } else if (!isEmailVerified) {
          router.replace('/verify-email');
        } else {
          router.replace(getHomeRouteForRole(userRole) as any);
        }
      }, 700);
    } catch (error: any) {
      handleGlobalError(error, 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await performLogout();
    router.replace('/auth');
  };

  const handleBack = () => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace(getHomeRouteForRole(userRole) as any);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              style={styles.topRow}
              activeOpacity={0.7}
              onPress={mustChangePassword ? handleSignOut : handleBack}
            >
              <MaterialCommunityIcons
                name={mustChangePassword ? 'logout' : 'arrow-left'}
                size={20}
                color={mustChangePassword ? '#DC3545' : '#171717'}
              />
              <Text style={[styles.topRowText, mustChangePassword && styles.topRowTextDanger]}>
                {mustChangePassword ? 'Sign out' : 'Back'}
              </Text>
            </TouchableOpacity>
            {!mustChangePassword && (
              <View style={styles.progressContainer}>
                <Text style={styles.stepText}>Change Password</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '100%' }]} />
                </View>
              </View>
            )}
            {mustChangePassword && (
              <View style={styles.progressContainer}>
                <Text style={styles.stepText}>Step 1 of 2</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '50%' }]} />
                </View>
              </View>
            )}

            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="lock-outline" size={32} color="#1A1B1C" />
              </View>
              <Text style={styles.title}>{mustChangePassword ? 'Secure Your Account' : 'Change Password'}</Text>
              <Text style={styles.subtitle}>
                {mustChangePassword
                  ? 'Create a new password to continue.'
                  : 'Enter your current password and choose a new one.'}
              </Text>
            </View>

            <ChangePasswordForm
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              requireCurrentPassword={requireCurrentPassword}
              showCurrentPw={showCurrentPw}
              setShowCurrentPw={setShowCurrentPw}
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
              <MaterialCommunityIcons name="check" size={40} color="#1A1B1C" />
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
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 8, minHeight: 40 },
  topRowText: { fontSize: 14, fontWeight: '700', fontFamily: FontFamily.bold, color: '#171717' },
  topRowTextDanger: { color: '#DC3545' },
  progressContainer: { gap: 4, marginBottom: 4 },
  stepText: { fontSize: 12, fontWeight: '700', fontFamily: FontFamily.bold, color: '#1A1B1C' },
  barTrack: { height: 6, backgroundColor: '#E8E5DC', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#F4C430', borderRadius: 3 },
  header: { alignItems: 'center', textAlign: 'center', gap: 6 },
  iconCircle: { width: 64, height: 64, borderRadius: 5, backgroundColor: '#F4C430', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  subtitle: { fontSize: 13, color: '#6B6B6B', textAlign: 'center', lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 5, padding: 24, alignItems: 'center', width: '100%', gap: 12 },
  checkCircleBig: { width: 72, height: 72, borderRadius: 5, backgroundColor: '#F4C430', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  modalSub: { fontSize: 13, color: '#6B6B6B', textAlign: 'center', lineHeight: 18 },
});
