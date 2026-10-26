import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, Modal, Animated, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Image } from 'react-native';
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
      if (auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, newPassword);
          console.log('[ChangePassword] Firebase client password updated successfully.');
        } catch (fbErr: any) {
          console.warn('[ChangePassword] Firebase client update notice:', fbErr?.message || fbErr);
        }
      }

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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => isFirstLogin ? router.replace('/complete-profile') : router.back()}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Feather name="arrow-left" size={22} color="#F4C430" />
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>
                {isFirstLogin ? 'Step 1 of 2' : 'Change Password'}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Progress indicator for first login */}
            {isFirstLogin && (
              <View style={styles.progressContainer}>
                <Text style={styles.stepText}>Secure Your Account</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: '50%' }]} />
                </View>
              </View>
            )}

            {/* Header Card - Library Style */}
            <View style={styles.headerCard}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="shield-lock-outline" size={30} color="#F4C430" />
              </View>
              <Text style={styles.title}>
                {isFirstLogin ? 'Set New Password' : 'Change Password'}
              </Text>
              <Text style={styles.subtitle}>
                {isFirstLogin 
                  ? 'Create a strong password to protect your account. You\'ll continue to profile setup next.'
                  : 'Update your password. Use a unique combination of characters for best security.'
                }
              </Text>
            </View>

            {/* Strength Indicator Card */}
            <View style={styles.strengthCard}>
              <View style={styles.strengthHeader}>
                <Text style={styles.strengthTitle}>Password Strength</Text>
                <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
              </View>
              <View style={styles.strengthBars}>
                {[hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].map((check, i) => (
                  <View key={i} style={[
                    styles.strengthBar,
                    check && styles.strengthBarActive,
                    i === 4 && styles.strengthBarSpecial
                  ]} />
                ))}
              </View>
              <View style={styles.strengthLabels}>
                <Text style={styles.strengthBarLabel}>8+ chars</Text>
                <Text style={styles.strengthBarLabel}>Uppercase</Text>
                <Text style={styles.strengthBarLabel}>Lowercase</Text>
                <Text style={styles.strengthBarLabel}>Number</Text>
                <Text style={styles.strengthBarLabel}>Special</Text>
              </View>
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
              submitButtonText={isFirstLogin ? 'Continue to Profile' : 'Update Password'}
              theme="dark"
              hideStrengthMeter
            />

            {/* Footer Hint */}
            <Text style={styles.footerHint}>
              {isFirstLogin 
                ? 'After this step, you\'ll complete your profile with additional details.'
                : 'Your password must be different from previous passwords.'
              }
            </Text>
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
              {isFirstLogin ? 'Password Set!' : 'Password Updated!'}
            </Text>
            <Text style={styles.modalSub}>
              {isFirstLogin
                ? 'Your password has been secured. Proceeding to profile setup...'
                : 'Your password has been updated successfully.'}
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1B1C' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244,196,48,0.15)',
    backgroundColor: '#1A1B1C',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,196,48,0.10)',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: '#F4C430',
  },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 20 },
  progressContainer: { gap: 8, marginBottom: 4, paddingHorizontal: 4 },
  stepText: { fontSize: 12, fontWeight: '700', fontFamily: FontFamily.bold, color: '#F4C430' },
  barTrack: { height: 5, backgroundColor: 'rgba(244,196,48,0.2)', borderRadius: 2.5, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#F4C430', borderRadius: 2.5 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1F1F1F',
    borderRadius: BorderRadius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(244,196,48,0.15)',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1B1C',
    borderWidth: 2,
    borderColor: 'rgba(244,196,48,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: { fontSize: 22, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#F4C430' },
  subtitle: { fontSize: 13, color: '#9CA3AF', lineHeight: 19, marginTop: 2 },
  strengthCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(244,196,48,0.10)',
    gap: 12,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthTitle: { fontSize: 13, fontWeight: '700', fontFamily: FontFamily.bold, color: '#E5E7EB' },
  strengthLabel: { fontSize: 12, fontWeight: '700', fontFamily: FontFamily.bold },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(244,196,48,0.15)',
  },
  strengthBarActive: { backgroundColor: '#F4C430' },
  strengthBarSpecial: { backgroundColor: '#16A34A' },
  strengthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  strengthBarLabel: { fontSize: 9, color: '#6B6B6B', fontFamily: FontFamily.medium, textAlign: 'center', flex: 1 },
  footerHint: {
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { 
    backgroundColor: '#1F1F1F', 
    borderRadius: BorderRadius.modal, 
    padding: 28, 
    alignItems: 'center', 
    width: '100%', 
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(244,196,48,0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  checkCircleBig: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#F4C430', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#F4C430',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#F4C430' },
  modalSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
