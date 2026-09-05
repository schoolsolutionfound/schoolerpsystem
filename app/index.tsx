import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useUserStore } from '../store/useUserStore';
import { getHomeRouteForRole } from '../features/shared/utils/routeGuards';

const { width, height } = Dimensions.get('window');

const FLOATING_ICONS = [
  { name: 'book-open-variant', size: 24, x: width * 0.12, y: height * 0.18, delay: 200 },
  { name: 'pencil', size: 18, x: width * 0.8, y: height * 0.15, delay: 400 },
  { name: 'calculator-variant', size: 22, x: width * 0.88, y: height * 0.42, delay: 600 },
  { name: 'palette', size: 20, x: width * 0.1, y: height * 0.55, delay: 300 },
  { name: 'flask', size: 26, x: width * 0.82, y: height * 0.65, delay: 500 },
  { name: 'music-note', size: 18, x: width * 0.15, y: height * 0.78, delay: 700 },
  { name: 'trophy', size: 22, x: width * 0.85, y: height * 0.82, delay: 350 },
  { name: 'earth', size: 20, x: width * 0.5, y: height * 0.1, delay: 450 },
];

export default function AppSplashScreen() {
  const router = useRouter();
  const startTimeRef = useRef(Date.now());

  const progressAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const iconOpacitiesRef = useRef(FLOATING_ICONS.map(() => new Animated.Value(0)));
  const iconOpacities = iconOpacitiesRef.current;
  const iconTranslatesRef = useRef(FLOATING_ICONS.map(() => new Animated.Value(20)));
  const iconTranslates = iconTranslatesRef.current;

  const _hasHydrated = useUserStore((state) => state._hasHydrated);
  const isProfileSynced = useUserStore((state) => state.isProfileSynced);
  const userRole = useUserStore((state) => state.userRole);
  const isEmailVerified = useUserStore((state) => state.isEmailVerified);

  const [authStateResolved, setAuthStateResolved] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start();

    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    FLOATING_ICONS.forEach((icon, i) => {
      Animated.parallel([
        Animated.timing(iconOpacities[i], {
          toValue: 0.15,
          duration: 600,
          delay: icon.delay,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(iconTranslates[i], {
          toValue: 0,
          duration: 600,
          delay: icon.delay,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    });

    const unsubscribeAuth = onAuthStateChanged(auth, () => {
      setAuthStateResolved(true);
    });

    // Web-only fallback: resolve auth state after 1s if onAuthStateChanged hasn't fired.
    // On mobile, Firebase always fires the callback, so this is unnecessary and harmful
    // (it causes premature navigation on slow networks).
    let webAuthTimeout: ReturnType<typeof setTimeout> | undefined;
    if (Platform.OS === 'web') {
      webAuthTimeout = setTimeout(() => {
        setAuthStateResolved(true);
      }, 1000);
    }

    return () => {
      if (webAuthTimeout) clearTimeout(webAuthTimeout);
      unsubscribeAuth();
    };
  }, [_hasHydrated]);

  useEffect(() => {
    const user = auth.currentUser;
    const isReadyToNavigate = (authStateResolved || Platform.OS === 'web') && (_hasHydrated || Platform.OS === 'web') && (!user || isProfileSynced);

    // Don't navigate until all preconditions are met
    if (!isReadyToNavigate) return;

    let finalRoute: any = '/auth';

    if (user) {
      if (userRole === 'student' && !isEmailVerified) {
        finalRoute = '/verify-email';
      } else if (userRole === 'loading') {
        finalRoute = '/auth';
      } else {
        finalRoute = getHomeRouteForRole(userRole);
      }
    } else {
      finalRoute = '/auth';
    }

    const remaining = Platform.OS === 'web' ? 800 : Math.max(0, 1800 - (Date.now() - startTimeRef.current));

    const timer = setTimeout(() => {
      router.replace(finalRoute);
    }, remaining);

    return () => { clearTimeout(timer); };
  }, [authStateResolved, isProfileSynced, _hasHydrated, userRole, isEmailVerified, router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Floating school icons */}
      {FLOATING_ICONS.map((icon, i) => (
        <Animated.View
          key={i}
          style={[
            styles.floatingIcon,
            {
              left: icon.x,
              top: icon.y,
              opacity: iconOpacities[i],
              transform: [{ translateY: iconTranslates[i] }, { scale: logoScale }],
            },
          ]}
        >
          <MaterialCommunityIcons name={icon.name as any} size={icon.size} color="#7E57C2" />
        </Animated.View>
      ))}

      {/* Center logo */}
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
          <MaterialCommunityIcons name="school" size={48} color="#7E57C2" />
        </View>
        <Text style={styles.appName}>SchoolHub</Text>
        <Text style={styles.subtitle}>Smart School Management</Text>
      </Animated.View>

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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F9',
  },
  floatingIcon: {
    position: 'absolute',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1A202C',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 8,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  progressTrack: {
    width: 140,
    height: 2,
    backgroundColor: '#E2E8F0',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7E57C2',
    borderRadius: 1,
  },
});
