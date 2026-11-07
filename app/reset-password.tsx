import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { forgotPasswordApi, resetPasswordApi } from '../api/auth';
import { ChangePasswordForm } from '../features/auth/components/ChangePasswordForm';
import { performLogout } from '../utils/logout';
import { FontFamily, FontSize } from '../constants/fonts';

const CODE_LENGTH = 6;
// Dev codes are surfaced by the server only when SES is unconfigured, so this
// is safe to gate on __DEV__ (it can never leak a production code).
const SHOW_DEV_CODE = __DEV__;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const emailParam = params?.email;
  const email = (Array.isArray(emailParam) ? emailParam[0] : emailParam || '').trim().toLowerCase();
  const devCodeParam = params?.devCode;
  const initialDevCode = (Array.isArray(devCodeParam) ? devCodeParam[0] : devCodeParam || '').trim();

  const [digits, setDigits] = useState<string[]>(() =>
    SHOW_DEV_CODE && initialDevCode.length === CODE_LENGTH
      ? initialDevCode.split('')
      : Array(CODE_LENGTH).fill('')
  );
  const [devCode, setDevCode] = useState<string | null>(
    SHOW_DEV_CODE && initialDevCode.length === CODE_LENGTH ? initialDevCode : null
  );
  const [focusedBox, setFocusedBox] = useState(-1);
  const inputs = useRef<(React.ComponentRef<typeof TextInput> | null)[]>([]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);

  const [scaleAnim] = useState(() => new Animated.Value(0.8));

  // Local cooldown mirrors the server's 3/hour/address cap so the user isn't
  // hammered with 429s while mashing "Resend".
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const cooldown = resendAt > now ? Math.ceil((resendAt - now) / 1000) : 0;

  useEffect(() => {
    if (resendAt <= now) return;
    const t = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(t);
  }, [resendAt, now]);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const checks = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial];
  const passedChecksCount = checks.filter(Boolean).length;

  let strengthLabel = 'Weak';
  let strengthColor = '#DC2626';
  if (passedChecksCount === 5) {
    strengthLabel = 'Very Strong';
    strengthColor = '#16A34A';
  } else if (passedChecksCount === 4) {
    strengthLabel = 'Strong';
    strengthColor = '#16A34A';
  } else if (passedChecksCount >= 2) {
    strengthLabel = 'Medium';
    strengthColor = '#D97706';
  }

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/forgot-password');
  };

  const handleResend = async () => {
    if (!email) return;
    setSending(true);
    setError(null);
    try {
      const res = await forgotPasswordApi(email);
      setResendAt(Date.now() + 30_000);
      // A resend invalidates the previous code server-side.
      setDigits(Array(CODE_LENGTH).fill(''));
      setAttemptsLeft(null);
      if (SHOW_DEV_CODE && res?.devCode) {
        setDevCode(res.devCode);
        setDigits(res.devCode.split(''));
      } else {
        setDevCode(null);
      }
      inputs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || 'Could not send a new code. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // No auto-submit on the sixth digit: the code is validated together with the
  // new password, and a valid code must not be consumed before that.
  const setDigit = (index: number, raw: string) => {
    setError(null);
    const clean = raw.replace(/[^0-9]/g, '');
    if (clean.length === 0) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      if (index > 0) inputs.current[index - 1]?.focus();
      return;
    }

    if (clean.length > 1) {
      const next = [...digits];
      let i = index;
      for (const ch of clean) {
        if (i >= CODE_LENGTH) break;
        next[i] = ch;
        i += 1;
      }
      setDigits(next);
      inputs.current[Math.min(i, CODE_LENGTH - 1)]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index: number, e: { nativeEvent: { key: string } }) => {
    if (e.nativeEvent.key === 'Backspace' && digits[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async () => {
    if (loading) return;
    const code = digits.join('');

    if (code.length !== CODE_LENGTH || digits.some((d) => d === '')) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError('Enter and confirm your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      return;
    }
    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!hasUppercase) {
      setError('Password must contain at least one uppercase letter (A-Z).');
      return;
    }
    if (!hasLowercase) {
      setError('Password must contain at least one lowercase letter (a-z).');
      return;
    }
    if (!hasNumber) {
      setError('Password must contain at least one number (0-9).');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPasswordApi({ email, code, newPassword });
      setSuccess(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      // The server revoked every refresh token; clear the local session too so
      // the next screen is a clean sign-in.
      setTimeout(async () => {
        await performLogout();
        router.replace('/auth');
      }, 1400);
    } catch (err: any) {
      const message = err?.message || 'Could not reset the password. Please try again.';
      setError(message);
      const match = /(\d+)\s+attempt/.exec(message);
      setAttemptsLeft(match ? Number(match[1]) : null);
      if (err?.code === 'OTP_INVALID' || err?.code === 'OTP_EXPIRED' || err?.code === 'OTP_LOCKED') {
        setDigits(Array(CODE_LENGTH).fill(''));
        inputs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/auth')} activeOpacity={0.7}>
              <Feather name="arrow-left" size={22} color="#F4C430" />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Reset Password</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="email-alert-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Missing email</Text>
            <Text style={styles.emptyText}>
              This reset session has no account email. Start again with your email address.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.replace('/forgot-password')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Start Over</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#1A1B1C" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={handleBack}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Feather name="arrow-left" size={22} color="#F4C430" />
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>Set New Password</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.headerCard}>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code we sent to choose a new password.
              </Text>
              <View style={styles.emailRow}>
                <MaterialCommunityIcons name="email-outline" size={14} color="#6B7280" />
                <Text style={styles.emailText} numberOfLines={1}>{email}</Text>
              </View>
              <TouchableOpacity onPress={() => router.replace('/forgot-password')}>
                <Text style={styles.changeEmail}>Use a different email</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.otpSection}>
              <Text style={styles.sectionLabel}>Verification Code</Text>
              <View style={styles.otpRow}>
                {digits.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    value={d}
                    onChangeText={(t) => setDigit(i, t)}
                    onKeyPress={(e) => handleKeyPress(i, e)}
                    onFocus={() => setFocusedBox(i)}
                    onBlur={() => setFocusedBox((prev) => (prev === i ? -1 : prev))}
                    keyboardType="number-pad"
                    textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : 'none'}
                    autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                    maxLength={CODE_LENGTH}
                    editable={!loading && !success}
                    selectTextOnFocus
                    style={[
                      styles.otpBox,
                      focusedBox === i && !error && styles.otpBoxFocus,
                      error && styles.otpBoxError,
                    ]}
                    accessibilityLabel={`Digit ${i + 1}`}
                  />
                ))}
              </View>

              <Pressable
                onPress={handleResend}
                disabled={sending || cooldown > 0 || success}
                style={({ pressed }) => [
                  styles.resendBtn,
                  (sending || cooldown > 0 || success) && styles.btnDisabled,
                  pressed && styles.btnPressed,
                ]}
              >
                {sending ? (
                  <ActivityIndicator color="#6B7280" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="refresh" size={15} color="#6B6B6B" />
                    <Text style={styles.resendText}>
                      {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend code'}
                    </Text>
                  </>
                )}
              </Pressable>

              {SHOW_DEV_CODE && !!devCode && (
                <View style={styles.devBanner}>
                  <MaterialCommunityIcons name="flask-outline" size={14} color="#92400E" />
                  <Text style={styles.devText}>Dev mode — code: {devCode}</Text>
                </View>
              )}

              {attemptsLeft !== null && attemptsLeft > 0 && !error && (
                <Text style={styles.attempts}>
                  {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining
                </Text>
              )}
            </View>

            {error && (
              <View style={styles.errorPill}>
                <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.strengthCard}>
              <View style={styles.strengthHeader}>
                <Text style={styles.strengthTitle}>Password Strength</Text>
                <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
              </View>
              <View style={styles.strengthBars}>
                {checks.map((check, i) => (
                  <View key={i} style={[styles.strengthBar, check && styles.strengthBarActive]} />
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
              setNewPassword={(v) => {
                setNewPassword(v);
                if (error) setError(null);
              }}
              confirmPassword={confirmPassword}
              setConfirmPassword={(v) => {
                setConfirmPassword(v);
                if (error) setError(null);
              }}
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
              onSubmit={handleResetPassword}
              submitButtonText="Reset Password"
              theme="light"
              hideStrengthMeter
            />

            <Text style={styles.footerHint}>
              Signing in elsewhere will be required after the reset. The code expires in 10 minutes.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={success} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.checkCircleBig}>
              <MaterialCommunityIcons name="check" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.modalTitle}>Password Reset!</Text>
            <Text style={styles.modalSub}>
              Your password has been updated. Signing you out to sign in with the new password...
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 20 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topBarTitle: {
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
    fontFamily: FontFamily.extrabold,
    color: '#111827',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    gap: 4,
  },
  title: { fontSize: FontSize.cardTitle, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#111827' },
  subtitle: { fontSize: FontSize.sub, color: '#6B7280', lineHeight: 19, marginTop: 2, fontFamily: FontFamily.regular },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  emailText: { fontSize: FontSize.sub, fontFamily: FontFamily.bold, color: '#1A1B1C', flexShrink: 1 },
  changeEmail: { fontSize: FontSize.caption, fontFamily: FontFamily.semibold, color: '#B45309', marginTop: 8 },
  otpSection: { gap: 12 },
  sectionLabel: { fontSize: FontSize.sub, fontWeight: '600', fontFamily: FontFamily.semibold, color: '#6B7280' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  otpBox: {
    flex: 1,
    minWidth: 0,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: '#111827',
    paddingVertical: 0,
  },
  otpBoxFocus: { borderColor: '#F4C430', backgroundColor: '#FFFFFF', borderWidth: 2 },
  otpBoxError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#F9FAFB',
    paddingVertical: 13,
    minHeight: 46,
  },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.85 },
  resendText: { fontSize: FontSize.sub, fontFamily: FontFamily.semibold, color: '#6B7280' },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  devText: { fontSize: FontSize.caption, fontFamily: FontFamily.bold, color: '#92400E' },
  attempts: { fontSize: FontSize.caption, color: '#9CA3AF', textAlign: 'center' },
  errorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FADCDC',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  errorText: { fontSize: FontSize.sub, fontFamily: FontFamily.medium, color: '#DC2626', textAlign: 'center', flexShrink: 1 },
  strengthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  strengthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strengthTitle: { fontSize: FontSize.sub, fontWeight: '700', fontFamily: FontFamily.bold, color: '#111827' },
  strengthLabel: { fontSize: FontSize.caption, fontWeight: '600', fontFamily: FontFamily.semibold },
  strengthBars: { flexDirection: 'row', gap: 6, marginTop: 4 },
  strengthBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#F3F4F6' },
  strengthBarActive: { backgroundColor: '#F4C430' },
  strengthLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  strengthBarLabel: { fontSize: 9, color: '#9CA3AF', fontFamily: FontFamily.medium, textAlign: 'center', flex: 1 },
  footerHint: {
    fontSize: FontSize.caption,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 8,
  },
  primaryBtn: {
    backgroundColor: '#F4C430',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    shadowColor: '#F4C430',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  primaryBtnText: { fontSize: FontSize.body, fontWeight: '700', fontFamily: FontFamily.bold, color: '#1A1B1C' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: FontSize.headerTitle, fontFamily: FontFamily.extrabold, color: '#111827' },
  emptyText: { fontSize: FontSize.sub, fontFamily: FontFamily.regular, color: '#6B7280', textAlign: 'center', lineHeight: 19 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    gap: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#000',
    shadowOpacity: 0.2,
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
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalTitle: { fontSize: FontSize.headerTitle, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#111827' },
  modalSub: { fontSize: FontSize.sub, color: '#6B7280', textAlign: 'center', lineHeight: 20, fontFamily: FontFamily.regular },
});
