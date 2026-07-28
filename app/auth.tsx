import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useUserStore } from '../store/useUserStore';
import { LoginForm } from '../features/auth/components/LoginForm';
import { AuthBypassButtons } from '../features/auth/components/AuthBypassButtons';
import { getHomeRouteForRole } from '../features/shared/utils/routeGuards';

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

  const handleAdminBypass = () => {
    useUserStore.getState().setUserProfile({
      fullName: 'Admin User',
      email: 'admin@school.com',
      userRole: 'admin',
      institutionId: 'dev-school-001',
      institutionName: 'Dev School',
      isEmailVerified: true,
      isBypassUser: true,
    });
    useUserStore.getState().setIsProfileSynced(true);
    router.replace(getHomeRouteForRole('admin') as any);
  };

  const handleStudentBypass = () => {
    useUserStore.getState().setUserProfile({
      fullName: 'Aarav Sharma',
      email: 'student@school.com',
      userRole: 'student',
      institutionId: 'CLG001',
      institutionName: 'ABC Engineering College',
      rollNoOrUSN: 'USN23CS101',
      mustChangePassword: true,
      profileCompleted: false,
      institutionType: 'college',
      isEmailVerified: true,
      isBypassUser: true,
    });
    useUserStore.getState().setIsProfileSynced(true);
    router.replace('/change-password');
  };

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !fullName)) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    if (email === 'admin@school.com' && password === 'admin123') {
      handleAdminBypass();
      return;
    }

    if (email === 'student@school.com' && password === 'admin123') {
      handleStudentBypass();
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              {/* Brand Header */}
              <View style={styles.brandHeader}>
                <View style={styles.logoCircle}>
                  <MaterialCommunityIcons name="school" size={32} color="#7E57C2" />
                </View>
                <Text style={styles.brandTitle}>SchoolHub</Text>
              </View>

              <Text style={styles.title}>{isLogin ? 'Sign in' : 'Create account'}</Text>
              <Text style={styles.subtitle}>
                {isLogin ? 'Enter your account credentials to access your portal.' : 'Fill in the details below to get started.'}
              </Text>

              <LoginForm
                isLogin={isLogin}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                fullName={fullName}
                setFullName={setFullName}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                onSubmit={handleAuth}
                onToggleMode={toggleMode}
                loading={loading}
              />

              <AuthBypassButtons
                onAdminBypass={handleAdminBypass}
                onStudentBypass={handleStudentBypass}
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 16 },
  inner: { flex: 1 },
  brandHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  logoCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EDE7F6', justifyContent: 'center', alignItems: 'center' },
  brandTitle: { fontSize: 22, fontWeight: '800', color: '#1A202C', letterSpacing: -0.5 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A202C', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#718096', marginTop: 4, marginBottom: 16 },
});
