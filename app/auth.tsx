import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, KeyboardAvoidingView, Platform, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LoginForm } from '../features/auth/components/LoginForm';
import { showAlert } from '../features/shared/utils/showAlert';

import { useRouter } from 'expo-router';
import { useUserStore } from '../store/useUserStore';
import { getHomeRouteForRole } from '../features/shared/utils/routeGuards';

export default function AuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, []);

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('admin123');
  };

  const handleAuth = async () => {
    if (!email || !password) {
      showAlert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Determine role immediately from email
      const lower = (user.email || email).trim().toLowerCase();
      let role = 'student';
      if (lower.includes('accountant') || lower.includes('finance')) role = 'accountant';
      else if (lower.includes('admin') || lower.includes('principal')) role = 'admin';
      else if (lower.includes('teacher') || lower.includes('faculty')) role = 'teacher';
      else if (lower.includes('parent')) role = 'parent';
      else if (lower.includes('hod')) role = 'hod';
      else if (lower.includes('librarian')) role = 'librarian';
      else if (lower.includes('dev')) role = 'dev';

      useUserStore.getState().setUserProfile({
        fullName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
        email: user.email || email.trim(),
        userRole: role as any,
        profileCompleted: true,
        mustChangePassword: false,
        isEmailVerified: true,
        institutionCode: 'SCHOOL001',
        institutionName: 'SchoolHub Academy',
        institutionType: 'school',
      });
      useUserStore.getState().setProfileExists(true);
      useUserStore.getState().setIsProfileSynced(true);

      const targetRoute = getHomeRouteForRole(role);
      router.replace(targetRoute as any);
    } catch (e: any) {
      const msg = e.code === 'auth/user-not-found'
        ? 'No account found with this email.'
        : e.code === 'auth/wrong-password'
          ? 'Incorrect password.'
          : e.code === 'auth/invalid-credential'
            ? 'Invalid email or password. Please check your credentials.'
            : e.message;
      showAlert('Login Error', msg);
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

              <Text style={styles.title}>Sign in</Text>
              <Text style={styles.subtitle}>
                Enter your account credentials to access your portal.
              </Text>

              {/* Quick Demo Fill Buttons */}
              <View style={styles.demoBox}>
                <Text style={styles.demoLabel}>Demo Login Shortcuts:</Text>
                <View style={styles.demoRow}>
                  <TouchableOpacity style={styles.demoChip} onPress={() => handleFillDemo('librarian@school.com')}>
                    <MaterialCommunityIcons name="book-open-page-variant" size={14} color="#D97706" />
                    <Text style={styles.demoChipText}>Librarian</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.demoChip} onPress={() => handleFillDemo('accountant@school.com')}>
                    <MaterialCommunityIcons name="finance" size={14} color="#7E57C2" />
                    <Text style={styles.demoChipText}>Accountant</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.demoChip} onPress={() => handleFillDemo('admin@school.com')}>
                    <MaterialCommunityIcons name="shield-account" size={14} color="#16A34A" />
                    <Text style={styles.demoChipText}>Admin</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.demoChip} onPress={() => handleFillDemo('teacher@school.com')}>
                    <MaterialCommunityIcons name="human-male-board" size={14} color="#EA580C" />
                    <Text style={styles.demoChipText}>Teacher</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.demoChip} onPress={() => handleFillDemo('parent@school.com')}>
                    <MaterialCommunityIcons name="account-child" size={14} color="#4F46E5" />
                    <Text style={styles.demoChipText}>Parent</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.demoChip} onPress={() => handleFillDemo('student@school.com')}>
                    <MaterialCommunityIcons name="school" size={14} color="#0284C7" />
                    <Text style={styles.demoChipText}>Student</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <LoginForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                onSubmit={handleAuth}
                loading={loading}
              />

              {/* Security & Provisioning Note */}
              <View style={styles.adminAccessBox}>
                <MaterialCommunityIcons name="shield-lock-outline" size={16} color="#7E57C2" />
                <Text style={styles.adminAccessText}>
                  Self-registration is disabled. All login IDs & passwords are created and issued directly by your School Administrator.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  brandHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  logoCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EDE7F6', justifyContent: 'center', alignItems: 'center' },
  brandTitle: { fontSize: 22, fontWeight: '800', color: '#1A202C', letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A202C', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#718096', marginTop: 4, marginBottom: 16 },
  demoBox: { backgroundColor: '#F1F5F9', padding: 10, borderRadius: 8, marginBottom: 12 },
  demoLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  demoRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  demoChipText: { fontSize: 11, fontWeight: '700', color: '#334155' },
  adminAccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  adminAccessText: {
    flex: 1,
    fontSize: 11,
    color: '#6B21A8',
    fontWeight: '600',
    lineHeight: 15,
  },
});
