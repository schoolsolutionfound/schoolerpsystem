import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { onAuthStateChanged } from 'firebase/auth';
import LottieView from 'lottie-react-native';
import { auth } from '../firebaseConfig';
import { useUserStore } from '../store/useUserStore';
import { getHomeRouteForRole } from '../features/shared/utils/routeGuards';
import { FontFamily } from '../constants/fonts';

const { width } = Dimensions.get('window');

export default function AppSplashScreen() {
  const router = useRouter();
  const startTimeRef = useRef(Date.now());

  const progressAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  const _hasHydrated = useUserStore((state) => state._hasHydrated);
  const isProfileSynced = useUserStore((state) => state.isProfileSynced);
  const userRole = useUserStore((state) => state.userRole);
  const isEmailVerified = useUserStore((state) => state.isEmailVerified);

  const [authStateResolved, setAuthStateResolved] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.spring(logoScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Subtle pulsing glow behind logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const unsubscribeAuth = onAuthStateChanged(auth, () => {
      setAuthStateResolved(true);
    });

    return () => unsubscribeAuth();
  }, [_hasHydrated]);

  useEffect(() => {
    const user = auth.currentUser;
    const isReadyToNavigate = authStateResolved && _hasHydrated && (!user || isProfileSynced);
    if (!isReadyToNavigate) return;

    let finalRoute: any = '/auth';

    if (user) {
      if (userRole === 'student' && !isEmailVerified) {
        finalRoute = '/verify-email';
      } else if (userRole === 'loading') {
        return;
      } else {
        finalRoute = getHomeRouteForRole(userRole);
      }
    } else {
      finalRoute = '/auth';
    }

    const remaining = Math.max(0, 2200 - (Date.now() - startTimeRef.current));

    const failsafe = setTimeout(() => {
      if (!isReadyToNavigate) router.replace('/auth');
    }, 8000);

    const timer = setTimeout(() => {
      router.replace(finalRoute);
    }, remaining);

    return () => { clearTimeout(timer); clearTimeout(failsafe); };
  }, [authStateResolved, isProfileSynced, _hasHydrated, userRole, isEmailVerified, router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Lottie animation */}
      <View style={styles.lottieContainer}>
        <LottieView
          source={{ uri: 'https://assets9.lottiefiles.com/packages/lf20_u4yrau.json' }}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>

      {/* Center content */}
      <View style={styles.content}>
        {/* Logo with glow */}
        <Animated.View
          style={[
            styles.logoGlow,
            { opacity: glowAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <Image source={require('../assets/logo-transparent.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
        </Animated.View>

        {/* App name + subtitle */}
        <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
          <Text style={styles.appName}>KIVQUO</Text>
          <Text style={styles.subtitle}>Smart School Management</Text>
        </Animated.View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.loadingText}>Loading your experience...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  lottieContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Dimensions.get('window').height * 0.45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: width * 0.75,
    height: width * 0.75,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logoGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 40,
    backgroundColor: '#F4C430',
    top: '50%',
    marginTop: -100,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 32,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: '#6B6B6B',
    marginTop: 6,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  progressTrack: {
    width: 160,
    height: 3,
    backgroundColor: '#E8E5DC',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F4C430',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#6B6B6B',
    marginTop: 12,
    letterSpacing: 0.5,
  },
});
