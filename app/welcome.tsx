import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.inner,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Logo */}
            <View style={styles.logoWrap}>
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons name="school" size={40} color="#7E57C2" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>Welcome to{'\n'}SchoolHub</Text>
            <Text style={styles.subtitle}>
              Select your role to continue
            </Text>

            {/* Role Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.adminBtn}
                onPress={() => router.push('/auth')}
                activeOpacity={0.7}
              >
                <View style={styles.btnIconWrap}>
                  <MaterialCommunityIcons name="shield-crown" size={20} color="#7E57C2" />
                </View>
                <View style={styles.btnTextWrap}>
                  <Text style={styles.btnTitle}>Admin</Text>
                  <Text style={styles.btnDesc}>Manage school settings</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E0" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.teacherBtn}
                onPress={() => router.push('/auth')}
                activeOpacity={0.7}
              >
                <View style={styles.btnIconWrap}>
                  <MaterialCommunityIcons name="account-tie" size={20} color="#7E57C2" />
                </View>
                <View style={styles.btnTextWrap}>
                  <Text style={styles.btnTitle}>Teacher</Text>
                  <Text style={styles.btnDesc}>Manage classes & students</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E0" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.studentBtn}
                onPress={() => router.push('/auth')}
                activeOpacity={0.7}
              >
                <View style={styles.btnIconWrap}>
                  <MaterialCommunityIcons name="book-open-variant" size={20} color="#7E57C2" />
                </View>
                <View style={styles.btnTextWrap}>
                  <Text style={styles.btnTitle}>Student</Text>
                  <Text style={styles.btnDesc}>Access your dashboard</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E0" />
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
              Made with care for modern schools
            </Text>
          </Animated.View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  inner: {
    alignItems: 'center',
  },

  // Logo
  logoWrap: {
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: '#A0AEC0',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 40,
    fontWeight: '500',
  },

  // Buttons
  buttons: {
    width: '100%',
    gap: 12,
  },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  teacherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  btnTextWrap: {
    flex: 1,
  },
  btnTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A202C',
  },
  btnDesc: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 2,
  },

  // Footer
  footer: {
    fontSize: 12,
    color: '#CBD5E0',
    marginTop: 48,
    textAlign: 'center',
  },
});
