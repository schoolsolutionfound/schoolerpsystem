import { Stack, usePathname, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Linking, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useUserStore } from '../store/useUserStore';
import { useConfigStore } from '../store/useConfigStore';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import * as Notifications from 'expo-notifications';

import { useAuthGuard } from '../hooks/useAuthGuard';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAppSync } from '../hooks/useAppSync';

// @ts-ignore
if (!global.appStartTime) global.appStartTime = Date.now();
// @ts-ignore
const getElapsed = () => `[${Date.now() - global.appStartTime}ms]`;

if (Platform.OS !== 'web') {
  try {
    const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
    if (sentryDsn && sentryDsn.startsWith('https://')) {
      Sentry.init({
        dsn: sentryDsn,
        sendDefaultPii: true,
        enableLogs: __DEV__,
      });
    }
  } catch (e) {
    console.error("Sentry Init failed:", e);
  }
}

const queryClient = new QueryClient();
SplashScreen.preventAutoHideAsync();

const AppLayout = function Layout() {
  const setUserProfile = useUserStore((state) => state.setUserProfile);
  const resetUser = useUserStore((state) => state.resetUser);
  const _hasHydrated = useUserStore((state) => state._hasHydrated);
  const schoolId = useUserStore((state) => state.schoolId);
  const userRole = useUserStore((state) => state.userRole);
  const isEmailVerified = useUserStore((state) => state.isEmailVerified);
  const email = useUserStore((state) => state.email);
  const language = useUserStore((state) => state.language);
  const pathname = usePathname();
  const router = useRouter();

  const [userSession, setUserSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const isProfileSynced = useUserStore((state) => state.isProfileSynced);
  const setIsProfileSynced = useUserStore((state) => state.setIsProfileSynced);
  const setProfileExists = useUserStore((state) => state.setProfileExists);
  const profileExists = useUserStore((state) => state.profileExists);

  const { maintenance: configMaintenance, _hasHydrated: _configHydrated } = useConfigStore();
  const isMaintenance = configMaintenance.enabled;
  const minVersion = configMaintenance.minVersion;
  const [isMCheckLoading, setIsMCheckLoading] = useState(true);
  const isSplashHidden = useRef(false);

  const CURRENT_APP_VERSION = '1.0.0';

  const validateAndRedirect = useCallback((data: any) => {
    if (!data?.screen) return;
    const currentRole = useUserStore.getState().userRole;
    const targetRole = data.targetRole || 'all';
    if (targetRole !== 'all' && targetRole !== currentRole) return;

    const route = data.screen.startsWith('/') ? data.screen : `/${data.screen}`;
    const isRoleMismatch =
      (route.startsWith('/admin-') && currentRole !== 'admin') ||
      (route.startsWith('/teacher-') && currentRole !== 'teacher') ||
      (route.startsWith('/dev-') && currentRole !== 'dev');

    if (isRoleMismatch) return;
    router.push({ pathname: route as any, params: data });
  }, [router]);

  usePushNotifications();
  useAppSync();

  const isRedirectPending = useAuthGuard({
    userSession,
    userRole,
    isEmailVerified,
    pathname,
    authLoading,
    _hasHydrated,
    isProfileSynced,
  });

  useEffect(() => {
    setIsMCheckLoading(false);

    const splashTimeout = setTimeout(() => {
      if (!isSplashHidden.current) {
        isSplashHidden.current = true;
        SplashScreen.hideAsync().catch(() => {});
      }
    }, Platform.OS === 'web' ? 5000 : 8000);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setUserSession(user);
      if (!user) {
        const isBypass = useUserStore.getState().isBypassUser;
        if (!isBypass) {
          setIsProfileSynced(false);
          resetUser();
        }
      }
      setAuthLoading(false);
    });

    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        const data = response.notification.request.content.data as any;
        setTimeout(() => validateAndRedirect(data), 800);
      }
    };
    if (Platform.OS !== 'web') {
      checkInitialNotification();
    }

    return () => unsubAuth();
  }, [setUserProfile, validateAndRedirect, resetUser]);

  useEffect(() => {
    if (auth.currentUser && (userRole === 'admin' || userRole === 'teacher' || userRole === 'dev')) {
      setIsProfileSynced(true);
    }
  }, [auth.currentUser, userRole]);

  const compareVersions = (v1: string, v2: string) => {
    const parts1 = v1.split('.').map(Number), parts2 = v2.split('.').map(Number);
    for (let i = 0; i < 3; i++) { if (parts1[i] > (parts2[i] || 0)) return 1; if (parts1[i] < (parts2[i] || 0)) return -1; }
    return 0;
  };

  const [loaded, fontError] = useFonts({});

  const needsUpdate = compareVersions(CURRENT_APP_VERSION, minVersion) === -1;

  const onLayoutRootView = useCallback(async () => {
    if (isSplashHidden.current) return;

    const shouldHide =
      needsUpdate ||
      isMaintenance ||
      ((loaded || fontError) && !isMCheckLoading && _hasHydrated && !authLoading);

    if (shouldHide) {
      isSplashHidden.current = true;
      await SplashScreen.hideAsync();
    }
  }, [loaded, fontError, isMCheckLoading, _hasHydrated, authLoading, needsUpdate, isMaintenance]);

  if ((!loaded && !fontError) || isMCheckLoading || !_hasHydrated || authLoading) {
    return null;
  }

  const isDevPage = pathname.includes('/dev-') || pathname === '/dev-login';

  if (needsUpdate && !isDevPage) {
    return (
      <View style={styles.maintenanceContainer} onLayout={onLayoutRootView}>
        <MaterialCommunityIcons name="rocket-launch" size={80} color="#1E3A5F" />
        <Text style={styles.maintenanceTitle}>New Update Available!</Text>
        <Text style={styles.maintenanceText}>A newer version of the app is available. Please update to continue.</Text>
      </View>
    );
  }

  if (isMaintenance && !isDevPage) {
    return (
      <View style={styles.maintenanceContainer} onLayout={onLayoutRootView}>
        <MaterialCommunityIcons name="tools" size={80} color="#F4A261" />
        <Text style={styles.maintenanceTitle}>System Maintenance</Text>
        <Text style={styles.maintenanceText}>We are currently performing scheduled maintenance. Please check back later.</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="verify-email" />
          <Stack.Screen name="admin-login" />
          <Stack.Screen name="teacher-login" />
          <Stack.Screen name="dev-login" />
          <Stack.Screen name="select-school" />
          <Stack.Screen name="home" />
          <Stack.Screen name="admin-home" />
          <Stack.Screen name="teacher-home" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="admin-profile" />
          <Stack.Screen name="notifications" />
        </Stack>
      </View>
    </QueryClientProvider>
  );
};

const RootLayout = Platform.OS === 'web' ? AppLayout : Sentry.wrap(AppLayout);
export default RootLayout;

const styles = StyleSheet.create({
  maintenanceContainer: { flex: 1, backgroundColor: '#F8F9FB', justifyContent: 'center', alignItems: 'center', padding: 40 },
  maintenanceTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E3A5F', marginTop: 20, textAlign: 'center' },
  maintenanceText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 15, lineHeight: 24 },
});
