import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LoginForm } from '../features/auth/components/LoginForm';
import { FontFamily } from '../constants/fonts';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      const msg = e.code === 'auth/user-not-found'
        ? 'No account found with this email.'
        : e.code === 'auth/wrong-password'
          ? 'Incorrect password.'
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

              {/* Top Brand Section */}
              <View style={styles.brandSection}>
                <LinearGradient
                  colors={['#171717', '#1A1B1C']}
                  style={styles.headerBg}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }] }]}>
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
