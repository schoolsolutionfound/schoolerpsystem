import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../constants/fonts';

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
                <Image source={require('../assets/logo-transparent.png')} style={styles.logoImage} resizeMode="contain" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>Welcome to{'\n'}KIVQUO</Text>
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
                  <MaterialCommunityIcons name="shield-crown" size={20} color="#F4C430" />
                </View>
                <View style={styles.btnTextWrap}>
                  <Text style={styles.btnTitle}>Admin</Text>
                  <Text style={styles.btnDesc}>Manage school settings</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#E8E5DC" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.teacherBtn}
                onPress={() => router.push('/auth')}
                activeOpacity={0.7}
              >
                <View style={styles.btnIconWrap}>
                  <MaterialCommunityIcons name="account-tie" size={20} color="#F4C430" />
                </View>
                <View style={styles.btnTextWrap}>
                  <Text style={styles.btnTitle}>Teacher</Text>
                  <Text style={styles.btnDesc}>Manage classes & students</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#E8E5DC" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.studentBtn}
                onPress={() => router.push('/auth')}
                activeOpacity={0.7}
              >
                <View style={styles.btnIconWrap}>
                  <MaterialCommunityIcons name="book-open-variant" size={20} color="#F4C430" />
                </View>
                <View style={styles.btnTextWrap}>
                  <Text style={styles.btnTitle}>Student</Text>
                  <Text style={styles.btnDesc}>Access your dashboard</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#E8E5DC" />
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
    backgroundColor: '#FFFDF7',
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
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 64,
    height: 64,
  },

  // Text
  title: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    color: '#171717',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 40,
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
    borderColor: '#E8E5DC',
  },
  teacherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  studentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  btnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  btnTextWrap: {
    flex: 1,
  },
  btnTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: '#171717',
  },
  btnDesc: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B6B6B',
    marginTop: 2,
  },

  // Footer
  footer: {
    fontSize: 12,
    color: '#E8E5DC',
    marginTop: 48,
    textAlign: 'center',
  },
});
