import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
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
import { FontFamily } from '../constants/fonts';
import { BorderRadius } from '../constants/theme';

type Status = 'checking' | 'unverified' | 'verified';

const CODE_LENGTH = 6;
// Dev codes are surfaced by the server only when SES is unconfigured, so this
// is safe to gate on __DEV__ (it can never leak a production code).
const SHOW_DEV_CODE = __DEV__;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const userRole = useUserStore((s) => s.userRole);
  const email = useUserStore((s) => s.email);
  const setUserProfile = useUserStore((s) => s.setUserProfile);

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
  const inputs = useRef<(TextInput | null)[]>([]);

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
      // Continue the first-login chain: profile still pending → complete it.
      if (!useUserStore.getState().profileCompleted) {
        router.replace('/complete-profile');
      } else {
        router.replace(getHomeRouteForRole(userRole) as any);
      }
    }
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={syncStatus} />}
        >
          <Pressable style={styles.topRow} onPress={() => router.replace('/complete-profile')}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#171717" />
            <Text style={styles.topRowText}>Back</Text>
          </Pressable>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="email-check-outline" size={36} color="#1A1B1C" />
            </View>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              {status === 'verified'
                ? 'Your email address has been verified. You can continue to your dashboard.'
                : 'Enter the 6-digit code we emailed you to activate your account.'}
            </Text>
            {!!email && (
              <View style={styles.emailPill}>
                <MaterialCommunityIcons name="email-outline" size={13} color="#1A1B1C" />
                <Text style={styles.emailText} numberOfLines={1}>{email}</Text>
              </View>
            )}
          </View>

          {status === 'checking' && (
            <View style={styles.center}>
              <ActivityIndicator color="#F4C430" />
              <Text style={styles.hint}>Checking verification status…</Text>
            </View>
          )}

          {status === 'unverified' && (
            <View style={styles.card}>
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

              {submitting && (
                <View style={styles.center}>
                  <ActivityIndicator color="#F4C430" />
                  <Text style={styles.hint}>Verifying…</Text>
                </View>
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
                <MaterialCommunityIcons name="shield-check-outline" size={18} color="#171717" />
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
                  <ActivityIndicator color="#6B6B6B" />
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
            </View>
          )}

          {status === 'verified' && (
            <View style={styles.card}>
              <View style={styles.successWrap}>
                <View style={styles.successCircle}>
                  <MaterialCommunityIcons name="check" size={34} color="#16A34A" />
                </View>
                <Text style={styles.successTitle}>Email Verified</Text>
                <Text style={styles.successSub}>Your email is confirmed. You&apos;re all set.</Text>
              </View>
              <Pressable onPress={handleContinue} style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
                <Text style={styles.primaryBtnText}>Continue to dashboard</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#171717" />
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32, gap: 24 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 },
  topRowText: { fontSize: 14, fontFamily: FontFamily.bold, color: '#171717' },
  header: { alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,27,28,0.08)',
    shadowColor: '#F4C430',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: { fontSize: 25, fontFamily: FontFamily.extrabold, color: '#171717' },
  subtitle: { fontSize: 14, fontFamily: FontFamily.regular, color: '#6B6B6B', textAlign: 'center', lineHeight: 20 },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 2,
    maxWidth: '100%',
  },
  emailText: { fontSize: 13, fontFamily: FontFamily.bold, color: '#1A1B1C', flexShrink: 1 },
  center: { alignItems: 'center', gap: 8, paddingVertical: 4 },
  hint: { fontSize: 13, color: '#6B6B6B' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 20,
    gap: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  otpBox: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#D6D3C9',
    borderRadius: 10,
    backgroundColor: '#FFFDF7',
    textAlign: 'center',
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: '#171717',
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
  errorText: { fontSize: 13, fontFamily: FontFamily.medium, color: '#DC2626', textAlign: 'center', flexShrink: 1 },
  attempts: { fontSize: 12, color: '#9A9A9A', textAlign: 'center' },
  primaryBtn: {
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.card,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.85 },
  primaryBtnText: { fontSize: 15, fontFamily: FontFamily.bold, color: '#171717' },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFDF7',
    paddingVertical: 13,
    minHeight: 46,
  },
  resendText: { fontSize: 14, fontFamily: FontFamily.semibold, color: '#6B6B6B' },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  devText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#92400E' },
  note: { fontSize: 12, fontFamily: FontFamily.regular, color: '#9A9A9A', textAlign: 'center', lineHeight: 17 },
  successWrap: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: { fontSize: 20, fontFamily: FontFamily.extrabold, color: '#171717' },
  successSub: { fontSize: 13, fontFamily: FontFamily.regular, color: '#6B6B6B', textAlign: 'center' },
});
