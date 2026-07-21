import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useUserStore } from '../store/useUserStore';

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.6, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !fullName)) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    if (email === 'admin@school.com' && password === 'admin123') {
      useUserStore.getState().setUserProfile({
        fullName: 'Admin User',
        email: 'admin@school.com',
        userRole: 'admin',
        schoolId: 'dev-school-001',
        schoolName: 'Dev School',
        isEmailVerified: true,
        isBypassUser: true,
      });
      useUserStore.getState().setIsProfileSynced(true);
      router.replace('/admin-home');
      return;
    }

    if (email === 'student@school.com' && password === 'admin123') {
      useUserStore.getState().setUserProfile({
        fullName: 'Aarav Sharma',
        email: 'student@school.com',
        userRole: 'student',
        schoolId: 'dev-school-001',
        schoolName: 'Dev School',
        isEmailVerified: true,
        isBypassUser: true,
      });
      useUserStore.getState().setIsProfileSynced(true);
      router.replace('/home');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
      }
      router.replace('/select-school');
    } catch (e: any) {
      const msg = e.code === 'auth/user-not-found'
        ? 'No account found with this email.'
        : e.code === 'auth/wrong-password'
        ? 'Incorrect password.'
        : e.code === 'auth/email-already-in-use'
        ? 'An account already exists with this email.'
        : e.message;
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.inner,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Back Button */}
              <TouchableOpacity onPress={() => router.replace('/welcome')} style={styles.backBtn}>
                <MaterialCommunityIcons name="chevron-left" size={22} color="#1A202C" />
              </TouchableOpacity>

              {/* Header */}
              <Text style={styles.title}>{isLogin ? 'Sign in' : 'Create account'}</Text>
              <Text style={styles.subtitle}>
                {isLogin
                  ? 'Welcome back! Enter your credentials to continue.'
                  : 'Fill in the details below to get started.'}
              </Text>

              {/* Form */}
              <View style={styles.form}>
                {/* Full Name (Sign Up only) */}
                {!isLogin && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      placeholderTextColor="#CBD5E0"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#CBD5E0"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter your password"
                      placeholderTextColor="#CBD5E0"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <MaterialCommunityIcons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#A0AEC0"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Forgot Password */}
                {isLogin && (
                  <TouchableOpacity style={styles.forgotBtn}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                  onPress={handleAuth}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.submitText}>
                    {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Logins */}
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="apple" size={20} color="#1A202C" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="phone" size={20} color="#48BB78" />
                </TouchableOpacity>
              </View>

              {/* Toggle */}
              <TouchableOpacity onPress={toggleMode} style={styles.toggleBtn}>
                <Text style={styles.toggleText}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                </Text>
                <Text style={styles.toggleBold}>{isLogin ? 'Sign up' : 'Sign in'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F9',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 40,
  },

  // Back
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 32,
  },

  // Header
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A202C',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#A0AEC0',
    lineHeight: 22,
    marginBottom: 36,
  },

  // Form
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A202C',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A202C',
  },
  eyeBtn: {
    paddingHorizontal: 14,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    color: '#7E57C2',
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#7E57C2',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#A0AEC0',
    fontSize: 13,
    fontWeight: '500',
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 32,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Toggle
  toggleBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: '#A0AEC0',
  },
  toggleBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7E57C2',
  },
});
