import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../store/useUserStore';
import {
  verifyEmailStatusApi,
  verifyEmailOtpApi,
  resendVerificationEmailApi,
} from '../api/auth';
import { getHomeRouteForRole } from '../features/shared/utils/routeGuards';
import { handleGlobalError } from '../utils/errorHandler';
import { performLogout } from '../utils/logout';
import { FontFamily, FontSize } from '../constants/fonts';
import { ShimmerProvider, ShimmerSkeleton } from '../features/student/components/ShimmerSkeleton';

type Status = 'checking' | 'unverified' | 'verified';

const CODE_LENGTH = 6;
// Dev codes are surfaced by the server only when SES is unconfigured, so this
// is safe to gate on __DEV__ (it can never leak a production code).
const SHOW_DEV_CODE = __DEV__;

const OtpSkeleton: React.FC = () => (
  <ShimmerProvider>
    <View style={styles.verifySkeleton}>
      <View style={styles.otpRow}>
        {Array.from({ length: CODE_LENGTH }).map((_, i) => (
          <View key={i} style={styles.otpSkeleton}>
            <ShimmerSkeleton width="100%" height={56} borderRadius={10} />
          </View>
        ))}
      </View>
      <ShimmerSkeleton width="100%" height={48} borderRadius={14} />
      <ShimmerSkeleton width="100%" height={46} borderRadius={14} />
      <ShimmerSkeleton width="62%" height={12} borderRadius={4} style={styles.skeletonNote} />
    </View>
  </ShimmerProvider>
);

export default function VerifyEmailScreen() {
  const router = useRouter();
  const email = useUserStore((s) => s.email);
  const mustChangePassword = useUserStore((s) => s.mustChangePassword);
  const profileCompleted = useUserStore((s) => s.profileCompleted);
  const setUserProfile = useUserStore((s) => s.setUserProfile);
  const continueLabel = mustChangePassword
    ? 'Set new password'
    : !profileCompleted
      ? 'Complete profile'
      : 'Go to dashboard';
  const successMessage = mustChangePassword
    ? 'Next, set a new password to keep your account secure.'
    : !profileCompleted
      ? 'Next, complete your profile to activate your account.'
      : 'Your account is ready. Continue to your dashboard.';

  const [status, setStatus] = useState<Status>('checking');
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [resendAt, setResendAt] = useState(0);

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [focusedBox, setFocusedBox] = useState(-1);

  // Refs for the six boxes so focus can be driven imperatively on
  // auto-advance / backspace without re-rendering the whole list.
  const inputs = useRef<(React.ComponentRef<typeof TextInput> | null)[]>([]);

  const [successScale] = useState(() => new Animated.Value(0.6));
  const [successOpacity] = useState(() => new Animated.Value(0));
  const [successLift] = useState(() => new Animated.Value(12));
  const [pulseScale] = useState(() => new Animated.Value(1));
  const [pulseOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (status !== 'verified') return;

    const useNativeDriver = Platform.OS !== 'web';
    successScale.setValue(0.6);
    successOpacity.setValue(0);
    successLift.setValue(12);
    pulseScale.setValue(1);
    pulseOpacity.setValue(0.5);

    const entrance = Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.ease),
        useNativeDriver,
      }),
      Animated.timing(successLift, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
    ]);

    const pulse = Animated.sequence([
      Animated.delay(160),
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 1.5,
          duration: 750,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 750,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
      ]),
    ]);

    entrance.start();
    pulse.start();

    return () => {
      entrance.stop();
      pulse.stop();
    };
  }, [status, successScale, successOpacity, successLift, pulseScale, pulseOpacity]);

  // Server-side resend is rate-limited (3/hour); surface a local cooldown so
  // the user isn't hammered with 429s while they mash the button.
  const [now, setNow] = useState(() => Date.now());
  const cooldown = resendAt > now ? Math.ceil((resendAt - now) / 1000) : 0;

  useEffect(() => {
    if (resendAt <= now) return;
    const t = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(t);
  }, [resendAt, now]);

  const syncStatus = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await verifyEmailStatusApi();
      if (res?.verified) {
        setStatus('verified');
        setUserProfile({ isEmailVerified: true });
      } else {
        setStatus('unverified');
      }
    } catch {
      setStatus('unverified');
    } finally {
      setRefreshing(false);
    }
  }, [setUserProfile]);

  useEffect(() => {
    const id = setTimeout(() => { void syncStatus(); }, 0);
    return () => clearTimeout(id);
  }, [syncStatus]);

  const handleResend = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await resendVerificationEmailApi();
      if (res?.alreadyVerified) {
        setStatus('verified');
        setUserProfile({ isEmailVerified: true });
        return;
      }
      setResendAt(Date.now() + 30_000);
      // A resend invalidates any code in progress server-side — clear it so
      // the user doesn't submit a dead code.
      setDigits(Array(CODE_LENGTH).fill(''));
      setAttemptsLeft(null);
      // Dev convenience: the server returns the fresh code when SES is off.
      if (SHOW_DEV_CODE && res?.devCode) {
        setDevCode(res.devCode);
        setDigits(res.devCode.split(''));
      } else {
        setDevCode(null);
      }
      inputs.current[0]?.focus();
    } catch (error: any) {
      handleGlobalError(error, 'Could not send the verification email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const submitCode = useCallback(
    async (value: string) => {
      setSubmitting(true);
      setError(null);
      try {
        await verifyEmailOtpApi(value);
        setStatus('verified');
        setUserProfile({ isEmailVerified: true });
      } catch (err: any) {
        // apiClient throws AppError { message, code, status } — the server's
        // attemptsLeft is not forwarded, so the remaining-attempt copy comes
        // from the message the route returns.
        setError(err?.message || 'Incorrect code. Please try again.');
        const match = /(\d+)\s+attempt/.exec(err?.message || '');
        setAttemptsLeft(match ? Number(match[1]) : null);
        // Clear the boxes for a fresh attempt but keep focus on the first.
        setDigits(Array(CODE_LENGTH).fill(''));
        inputs.current[0]?.focus();
      } finally {
        setSubmitting(false);
      }
    },
    [setUserProfile]
  );

  // Auto-submit is triggered from setDigit once the sixth digit lands (one
  // less tap). It is deliberately not an effect: submitCode calls setState
  // synchronously, which the set-state-in-effect rule forbids.
  const setDigit = (index: number, raw: string) => {
    setError(null);
    // Accept only the last digit typed; a pasted/typed multi-char string is
    // distributed across the following boxes below.
    const clean = raw.replace(/[^0-9]/g, '');
    if (clean.length === 0) {
      // Backspace / delete.
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      if (index > 0) inputs.current[index - 1]?.focus();
      return;
    }

    if (clean.length > 1) {
      // Paste / autofill distribute left-to-right from the focused box.
      const next = [...digits];
      let i = index;
      for (const ch of clean) {
        if (i >= CODE_LENGTH) break;
        next[i] = ch;
        i += 1;
      }
      setDigits(next);
      const pasted = next.join('');
      if (pasted.length === CODE_LENGTH && next.every((d) => d !== '')) {
        void submitCode(pasted);
        return;
      }
      const focusAt = Math.min(i, CODE_LENGTH - 1);
      inputs.current[focusAt]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
      return;
    }
    // Last box just filled — submit.
    const filled = next.join('');
    if (filled.length === CODE_LENGTH && next.every((d) => d !== '')) {
      void submitCode(filled);
    }
  };

  const handleKeyPress = (index: number, e: { nativeEvent: { key: string } }) => {
    // Android fires keyPress for backspace even on an empty box; use it to
    // walk focus backwards.
    if (e.nativeEvent.key === 'Backspace' && digits[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleContinue = () => {
    if (status === 'verified') {
      setUserProfile({ isEmailVerified: true });
      const state = useUserStore.getState();
      if (state.mustChangePassword) {
        router.replace('/change-password');
      } else if (!state.profileCompleted) {
        router.replace('/complete-profile');
      } else {
        router.replace(getHomeRouteForRole(state.userRole) as any);
      }
    }
  };

  const handleSignOut = async () => {
    await performLogout();
    router.replace('/auth');
  };

  const handleVerify = () => {
    if (submitting) return;
    const typed = digits.join('');
    if (typed.length === CODE_LENGTH && digits.every((d) => d !== '')) {
      void submitCode(typed);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={handleSignOut} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <MaterialCommunityIcons name="logout" size={22} color="#1A1B1C" />
          </Pressable>
          <Text style={styles.topBarTitle}>Step 1 of 3</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={syncStatus} />}
        >
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Verify Email</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: '33%' }]} />
            </View>
          </View>

          {status !== 'verified' && (
            <View style={styles.headerSection}>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code we emailed you to activate your account.
              </Text>
              {!!email && (
                <Text style={styles.emailText} numberOfLines={1}>{email}</Text>
              )}
            </View>
          )}

          {status === 'checking' && <OtpSkeleton />}

          {status === 'unverified' && (
            <View style={styles.otpSection}>
              {submitting ? (
                <OtpSkeleton />
              ) : (
                <>
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
                    editable={!submitting}
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

              {error && (
                <View style={styles.errorPill}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#DC2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              {attemptsLeft !== null && attemptsLeft > 0 && !error && (
                <Text style={styles.attempts}>
                  {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining
                </Text>
              )}

              <Pressable
                onPress={handleVerify}
                disabled={submitting || digits.some((d) => d === '')}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  (submitting || digits.some((d) => d === '')) && styles.btnDisabled,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.primaryBtnText}>Verify Code</Text>
              </Pressable>

              <Pressable
                onPress={handleResend}
                disabled={sending || cooldown > 0}
                style={({ pressed }) => [
                  styles.resendBtn,
                  (sending || cooldown > 0) && styles.btnDisabled,
                  pressed && styles.btnPressed,
                ]}
              >
                {sending ? (
                  <ShimmerProvider>
                    <ShimmerSkeleton width={96} height={12} borderRadius={4} />
                  </ShimmerProvider>
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

              <Text style={styles.note}>
                Didn&apos;t get it? Check your spam folder. The code expires in 10 minutes.
              </Text>
                </>
              )}
            </View>
          )}

          {status === 'verified' && (
            <View style={styles.successSection}>
              <View style={styles.successHero}>
                <Animated.View
                  style={[
                    styles.successPulse,
                    { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.successCircle,
                    { opacity: successOpacity, transform: [{ scale: successScale }] },
                  ]}
                >
                  <MaterialCommunityIcons name="check" size={40} color="#171717" />
                </Animated.View>
              </View>

              <Animated.View
                style={[
                  styles.successCopy,
                  { opacity: successOpacity, transform: [{ translateY: successLift }] },
                ]}
              >
                <Text style={styles.successTitle}>Email verified</Text>
                <Text style={styles.successSub}>{successMessage}</Text>
                {!!email && <Text style={styles.successEmail} numberOfLines={1}>{email}</Text>}
              </Animated.View>

              <Animated.View
                style={[
                  styles.successAction,
                  { opacity: successOpacity, transform: [{ translateY: successLift }] },
                ]}
              >
                <Pressable onPress={handleContinue} style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
                  <Text style={styles.primaryBtnText}>{continueLabel}</Text>
                  <MaterialCommunityIcons name="arrow-right" size={18} color="#171717" />
                </Pressable>
              </Animated.View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 14, gap: 20 },
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
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
    fontFamily: FontFamily.extrabold,
    color: '#111827',
  },
  progressContainer: { gap: 8, marginBottom: 4, paddingHorizontal: 4 },
  progressLabel: { fontSize: FontSize.caption, fontWeight: '700', fontFamily: FontFamily.bold, color: '#1A1B1C' },
  barTrack: { height: 5, backgroundColor: '#FDE68A', borderRadius: 2.5, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#F4C430', borderRadius: 2.5 },
  headerSection: { paddingTop: 4 },
  title: { fontSize: FontSize.cardTitle, fontWeight: '800', fontFamily: FontFamily.extrabold, color: '#111827' },
  subtitle: { fontSize: FontSize.sub, fontFamily: FontFamily.regular, color: '#6B7280', lineHeight: 19, marginTop: 2 },
  emailText: { fontSize: FontSize.sub, fontFamily: FontFamily.bold, color: '#1A1B1C', marginTop: 8 },
  otpSection: { gap: 16 },
  verifySkeleton: { gap: 16 },
  otpSkeleton: { flex: 1 },
  skeletonNote: { alignSelf: 'center' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  otpBox: {
    flex: 1,
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
  attempts: { fontSize: FontSize.caption, color: '#9CA3AF', textAlign: 'center' },
  primaryBtn: {
    backgroundColor: '#F4C430',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    shadowColor: '#F4C430',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.85 },
  primaryBtnText: { fontSize: FontSize.body, fontFamily: FontFamily.bold, color: '#1A1B1C' },
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
  note: { fontSize: FontSize.caption, fontFamily: FontFamily.regular, color: '#9CA3AF', textAlign: 'center', lineHeight: 17 },
  successSection: {
    alignItems: 'center',
    gap: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  successHero: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  successPulse: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#F4C430',
    backgroundColor: 'rgba(244, 196, 48, 0.18)',
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F4C430',
    borderWidth: 1,
    borderColor: '#EAB308',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F4C430',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  successCopy: { alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  successTitle: { fontSize: FontSize.headerTitle, fontFamily: FontFamily.extrabold, color: '#111827' },
  successSub: {
    fontSize: FontSize.sub,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  successEmail: { fontSize: FontSize.caption, fontFamily: FontFamily.medium, color: '#9CA3AF', marginTop: 2 },
  successAction: { width: '100%' },
});
