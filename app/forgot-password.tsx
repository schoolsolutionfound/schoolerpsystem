import React, { useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { forgotPasswordApi } from '../api/auth';
import { FontFamily, FontSize } from '../constants/fonts';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const emailRef = useRef<React.ComponentRef<typeof TextInput> | null>(null);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setError(null);

    if (!normalizedEmail) {
      setError('Enter the email address linked to your account.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      // The server answers identically for unknown addresses (no account
      // enumeration), so success always means "if it exists, a code is on its
      // way". Dev mode may return the code so the flow works without SES.
      const res = await forgotPasswordApi(normalizedEmail);
      router.push({
        pathname: '/reset-password',
        params: {
          email: normalizedEmail,
          ...(res?.devCode ? { devCode: res.devCode } : {}),
        },
      });
    } catch (err: any) {
      setError(err?.message || 'Could not send the reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.replace('/auth')}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Feather name="arrow-left" size={22} color="#F4C430" />
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>Reset Password</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.headerCard}>
              <Text style={styles.title}>Forgot your password?</Text>
              <Text style={styles.subtitle}>
                Enter the email address linked to your account. We&apos;ll email you a 6-digit
                code to choose a new password — no links to click.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#6B6B6B" />
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={handleSendCode}
                  editable={!loading}
                />
              </View>
            </View>

            {error && (
              <View style={styles.errorPill}>
                <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleSendCode}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#1A1B1C" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Send Code</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#1A1B1C" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="shield-lock-outline" size={15} color="#9CA3AF" />
              <Text style={styles.infoText}>
                The code expires in 10 minutes. Check your spam folder if it doesn&apos;t arrive.
              </Text>
            </View>

            <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/auth')}>
              <Text style={styles.loginLinkText}>Back to Login</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  },
  title: {
    fontSize: FontSize.cardTitle,
    fontWeight: '800',
    fontFamily: FontFamily.extrabold,
    color: '#111827',
  },
  subtitle: {
    fontSize: FontSize.sub,
    color: '#6B7280',
    lineHeight: 19,
    marginTop: 4,
    fontFamily: FontFamily.regular,
  },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: FontSize.sub, fontWeight: '600', fontFamily: FontFamily.semibold, color: '#6B7280' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 52,
  },
  inputRowError: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  input: { flex: 1, fontSize: FontSize.body, color: '#111827', fontFamily: FontFamily.regular },
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
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: FontSize.body, fontWeight: '700', fontFamily: FontFamily.bold, color: '#1A1B1C' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  infoText: {
    fontSize: FontSize.caption,
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 17,
    flexShrink: 1,
  },
  loginLink: { alignItems: 'center', paddingVertical: 10 },
  loginLinkText: { fontSize: FontSize.sub, fontFamily: FontFamily.medium, color: '#6B7280' },
});
