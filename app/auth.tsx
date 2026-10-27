import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LoginForm } from '../features/auth/components/LoginForm';
import { FontFamily } from '../constants/fonts';
import { debugLog, debugWarn } from '../utils/debugLogger';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0));
  const slideAnim = useRef(new Animated.Value(24));
  const logoScale = useRef(new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim.current, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(slideAnim.current, { toValue: 0, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(logoScale.current, { toValue: 1, tension: 50, friction: 7, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, []);

  const handleAuth = async () => {
    setErrorMessage(null);
    if (!email.trim() || !password) {
      const msg = 'Please fill in all required fields.';
      setErrorMessage(msg);
      Alert.alert('Missing Fields', msg);
      return;
    }

    setLoading(true);
    debugLog('AUTH', 'sign-in attempt', { emailLength: email.trim().length, hasPassword: !!password });
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      debugLog('AUTH', 'sign-in success', { uid: credential.user.uid });
    } catch (e: any) {
      const code = e?.code || '';
      debugWarn('AUTH', 'sign-in failed', { code, message: e?.message ?? null });
      const msg = code === 'auth/user-not-found'
        ? 'No account found with this email.'
        : code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials'
          ? 'Incorrect email or password. Please verify your credentials.'
          : code === 'auth/invalid-email'
            ? 'Please enter a valid email address.'
            : code === 'auth/too-many-requests'
              ? 'Too many failed login attempts. Please wait a moment and try again.'
              : e?.message || 'Authentication failed. Please try again.';
      setErrorMessage(msg);
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* eslint-disable-next-line react-hooks/refs */}
            <Animated.View style={[styles.inner, { opacity: fadeAnim.current, transform: [{ translateY: slideAnim.current }] }]}>

              {/* Top Brand Section */}
              <View style={styles.brandSection}>
                <LinearGradient
                  colors={['#171717', '#1A1B1C']}
                  style={styles.headerBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* eslint-disable-next-line react-hooks/refs */}
                  <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale.current }] }]}>
                    <View style={styles.logoCircle}>
                      <Image source={require('../assets/logo-transparent.png')} style={styles.logoImage} resizeMode="contain" />
                    </View>
                  </Animated.View>
                  <Text style={styles.brandName}>KIVQUO</Text>
                  <Text style={styles.brandTagline}>Smart School Management</Text>

                  {/* Decorative gold accent */}
                  <View style={styles.goldBar} />
                </LinearGradient>
              </View>

              {/* Login Form Section */}
              <View style={styles.formSection}>
                <Text style={styles.welcomeText}>Welcome back</Text>
                <Text style={styles.subtitle}>
                  Sign in to your account to continue
                </Text>

                <LoginForm
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  onSubmit={handleAuth}
                  loading={loading}
                  errorMessage={errorMessage}
                />
              </View>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: { flex: 1 },

  // Brand header
  brandSection: {},
  headerBg: {
    paddingTop: 60,
    paddingBottom: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoWrap: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244,196,48,0.3)',
  },
  logoImage: {
    width: 68,
    height: 68,
  },
  brandName: {
    fontSize: 28,
    fontFamily: FontFamily.extrabold,
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  goldBar: {
    width: 40,
    height: 3,
    backgroundColor: '#F4C430',
    borderRadius: 2,
    marginTop: 20,
  },

  // Form section
  formSection: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
  },
  welcomeText: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: '#171717',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#6B6B6B',
    marginBottom: 24,
  },
});
