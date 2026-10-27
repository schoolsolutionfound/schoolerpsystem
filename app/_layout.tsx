import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
} from '@expo-google-fonts/montserrat';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Platform, LogBox, AppState } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { useUserStore } from '../store/useUserStore';
import { useConfigStore } from '../store/useConfigStore';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';

import { useAuthGuard } from '../features/shared/hooks/useAuthGuard';
import { usePushNotifications } from '../features/shared/hooks/usePushNotifications';
import { useAppSync } from '../features/shared/hooks/useAppSync';
import { FontFamily } from '../constants/fonts';
import { fetchInstitutionConfigApi } from '../api/admin';
import { debugLog } from '../utils/debugLogger';
import { getApiBaseUrl } from '../api/client';

const DEBUG_APP = __DEV__;

let institutionConfigRequest: Promise<any> | null = null;

function getInstitutionConfigRequest() {
  if (institutionConfigRequest) return institutionConfigRequest;

  const request = fetchInstitutionConfigApi();
  institutionConfigRequest = request;
  const clear = () => {
    if (institutionConfigRequest === request) {
      institutionConfigRequest = null;
    }
  };
  request.then(clear, clear);
  return request;
}

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import('expo-notifications') | null = null;

async function loadNotifications() {
  if (!isExpoGo && Platform.OS !== 'web') {
    try {
      const mod = await import('expo-notifications');
      Notifications = mod;
    } catch {
      // Ignore in Expo Go or environment without native push support
    }
  }
}

loadNotifications();

// @ts-ignore
if (!global.appStartTime) global.appStartTime = Date.now();

const hasSentryDsn = Platform.OS !== 'web' && process.env.EXPO_PUBLIC_SENTRY_DSN?.startsWith('https://');

if (hasSentryDsn) {
  try {
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      sendDefaultPii: true,
      enableLogs: __DEV__,
    });
  } catch (e) {
    console.error("Sentry Init failed:", e);
  }
}

const queryClient = new QueryClient();
SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  '@firebase/firestore: Firestore',
  "WebChannelConnection RPC 'Listen' stream",
  'transport errored',
]);

// Force Montserrat font on all Text elements globally
// @ts-ignore – defaultProps exists at runtime on RN Text
if (!Text.defaultProps?.fontFamily) {
  // @ts-ignore
  Text.defaultProps = {
    // @ts-ignore
    ...(Text.defaultProps || {}),
    style: [{ fontFamily: FontFamily.regular }],
  };
}

const AppLayout = function Layout() {
  const resetUser = useUserStore((state) => state.resetUser);
  const _hasHydrated = useUserStore((state) => state._hasHydrated);
  const userRole = useUserStore((state) => state.userRole);
  const pathname = usePathname();
  const segments = useSegments();
  const router = useRouter();
  const activeGroup = segments.find((segment) => segment.startsWith('(') && segment.endsWith(')'));

  const [userSession, setUserSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const isProfileSynced = useUserStore((state) => state.isProfileSynced);
  const setIsProfileSynced = useUserStore((state) => state.setIsProfileSynced);

  const { maintenance: configMaintenance } = useConfigStore();
  const isMaintenance = configMaintenance.enabled;
  const minVersion = configMaintenance.minVersion;
  const [isMCheckLoading, setIsMCheckLoading] = useState(true);
  const isSplashHidden = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const institutionCode = useUserStore((state) => state.institutionCode);
  const setMaintenance = useConfigStore((state) => state.setMaintenance);
  const maintenanceConfigFetchedRef = useRef(false);

  const CURRENT_APP_VERSION = Constants.expoConfig?.version || '1.0.0';

  useEffect(() => {
    if (!DEBUG_APP) return;
    debugLog('APP', 'layout mounted', {
      platform: Platform.OS,
      appVersion: CURRENT_APP_VERSION,
      expoVersion: Constants.expoConfig?.sdkVersion ?? null,
      executionEnvironment: Constants.executionEnvironment,
      apiBaseUrl: getApiBaseUrl(),
      initialAppState: AppState.currentState,
    });

    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;
      debugLog('APP', 'state changed', {
        from: previousState,
        to: nextState,
        userRole: useUserStore.getState().userRole,
      });
    });

    return () => subscription.remove();
  }, [CURRENT_APP_VERSION]);

  useEffect(() => {
    if (!DEBUG_APP) return;
    const errorUtils = (global as any).ErrorUtils;
    if (!errorUtils?.setGlobalHandler) return;

    const previousHandler = errorUtils.getGlobalHandler?.();
    errorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      try {
        debugLog('ERROR', 'global JS error', {
          isFatal: !!isFatal,
          message: error?.message ?? String(error),
          stack: error?.stack ?? null,
        });
      } finally {
        previousHandler?.(error, isFatal);
      }
    });

    return () => {
      if (previousHandler) errorUtils.setGlobalHandler(previousHandler);
    };
  }, []);

  const routeDebugKey = segments.join('/');
  useEffect(() => {
    if (!DEBUG_APP) return;
    debugLog('NAV', 'route changed', {
      pathname,
      segments: routeDebugKey,
      activeGroup: activeGroup ?? null,
      userRole,
      profileSynced: isProfileSynced,
      uid: userSession?.uid ?? null,
    });
  }, [pathname, routeDebugKey, activeGroup, userRole, isProfileSynced, userSession?.uid]);

  useEffect(() => {
    if (!DEBUG_APP) return;
    const unsubscribe = useUserStore.subscribe((state, previousState) => {
      const changes: Record<string, unknown> = {};
      const keys: (keyof typeof state)[] = [
        'userRole',
        'isProfileSynced',
        'profileExists',
        'profileCompleted',
        'mustChangePassword',
        'isEmailVerified',
        'institutionCode',
        'institutionName',
        'institutionType',
        'placementAccess',
        'fullName',
      ];
      for (const key of keys) {
        if (state[key] !== previousState[key]) {
          changes[key] = { from: previousState[key], to: state[key] };
        }
      }
      if (Object.keys(changes).length > 0) {
        debugLog('STORE', 'profile state changed', changes);
      }
    });
    return unsubscribe;
  }, []);

  const validateAndRedirect = useCallback((data: any) => {
    if (!data?.screen) return;
    const currentRole = useUserStore.getState().userRole;
    const targetRole = data.targetRole || 'all';
    if (targetRole !== 'all' && targetRole !== currentRole) return;

    const route = data.screen.startsWith('/') ? data.screen : `/${data.screen}`;
    const routeGroup = route.match(/^\/(\([^)]+\))/)?.[1];
    if (routeGroup) {
      const groupToRole: Record<string, string> = {
        '/(admin)': 'admin',
        '/(teacher)': 'teacher',
        '/(student)': 'student',
        '/(principal)': 'principal',
        '/(parent)': 'parent',
        '/(accountant)': 'accountant',
        '/(hod)': 'hod',
        '/(librarian)': 'librarian',
        '/(developer)': 'dev',
        '/(driver)': 'driver',
        '/(placement)': 'placement_officer',
        '/(admission)': 'admission_officer',
      };
      const requiredRole = groupToRole[routeGroup];
      if (requiredRole && requiredRole !== currentRole) {
        if (routeGroup === '/(placement)') {
          const placementAccess = useUserStore.getState().placementAccess;
          if (
            placementAccess === 'head' ||
            placementAccess === 'member' ||
            currentRole === 'admin' ||
            currentRole === 'placement_officer'
          ) {
            // Authorized placement route
          } else {
            return;
          }
        } else if (routeGroup === '/(admission)') {
          if (currentRole === 'admin' || currentRole === 'admission_officer') {
            // Authorized admission route
          } else {
            return;
          }
        } else {
          return;
        }
      }
    }

    router.push({ pathname: route as any, params: data });
  }, [router]);

  usePushNotifications();
  useAppSync(userSession);

  useEffect(() => {
    let cancelled = false;

    const applyMaintenanceConfig = async () => {
      if (!institutionCode) {
        if (__DEV__) console.log('[BOOT] maintenance skipped: no institutionCode');
        if (!cancelled) setIsMCheckLoading(false);
        return;
      }
      if (maintenanceConfigFetchedRef.current) {
        if (__DEV__) console.log('[BOOT] maintenance already fetched, unblocking');
        if (!cancelled) setIsMCheckLoading(false);
        return;
      }
      maintenanceConfigFetchedRef.current = true;
      if (__DEV__) console.log('[BOOT] maintenance fetch start', { institutionCode });
      try {
        const res = await getInstitutionConfigRequest();
        const data = res?.data;
        if (__DEV__) console.log('[BOOT] maintenance fetch success', { enabled: data?.maintenanceEnabled, minVersion: data?.maintenanceMinVersion });
        if (!cancelled && data) {
          setMaintenance(
            data.maintenanceEnabled ?? false,
            data.maintenanceMinVersion || '0.0.0'
          );
        }
      } catch (error) {
        if (__DEV__) console.warn('[BOOT] maintenance fetch failed, continuing', error);
        // Ignore maintenance config fetch failures — app continues with local defaults.
      } finally {
        if (__DEV__) console.log('[BOOT] maintenance check finished, unblocking');
        if (!cancelled) setIsMCheckLoading(false);
      }
    };

    const splashTimeout = setTimeout(() => {
      if (!isSplashHidden.current) {
        isSplashHidden.current = true;
        SplashScreen.hideAsync().catch(() => { });
      }
    }, Platform.OS === 'web' ? 5000 : 8000);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (__DEV__) console.log('[BOOT] firebase auth resolved', { authenticated: !!user, uid: user?.uid ?? null });
      setUserSession(user);
      if (!user) {
        setIsProfileSynced(false);
        resetUser();
        setMaintenance(false, '0.0.0');
        maintenanceConfigFetchedRef.current = false;
        if (!cancelled) setIsMCheckLoading(false);
      } else {
        applyMaintenanceConfig();
      }
      setAuthLoading(false);
    });

    const checkInitialNotification = async () => {
      if (isExpoGo || !Notifications) return;
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response) {
          const data = response.notification.request.content.data as any;
          setTimeout(() => validateAndRedirect(data), 800);
        }
      } catch {
        // Ignore
      }
    };
    if (Platform.OS !== 'web' && !isExpoGo) {
      checkInitialNotification();
    }

    return () => {
      cancelled = true;
      clearTimeout(splashTimeout);
      unsubAuth();
    };
  }, [validateAndRedirect, resetUser, setIsProfileSynced, institutionCode, setMaintenance]);

  const compareVersions = (v1: string, v2: string) => {
    const parts1 = v1.split('.').map(Number), parts2 = v2.split('.').map(Number);
    for (let i = 0; i < 3; i++) { if (parts1[i] > (parts2[i] || 0)) return 1; if (parts1[i] < (parts2[i] || 0)) return -1; }
    return 0;
  };

  const [loaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Montserrat_900Black,
  });

  const needsUpdate = compareVersions(CURRENT_APP_VERSION, minVersion) === -1;
  const isBootReady = (loaded || !!fontError) && !isMCheckLoading && _hasHydrated && !authLoading;

  useAuthGuard({
    userSession,
    userRole,
    pathname,
    activeGroup,
    authLoading,
    _hasHydrated,
    isProfileSynced,
    isBootReady,
  });

  const bootGateLogRef = useRef('');
  useEffect(() => {
    if (!__DEV__) return;

    const snapshot = {
      pathname,
      fontsLoaded: loaded,
      fontError: fontError ? String(fontError) : null,
      maintenanceCheckLoading: isMCheckLoading,
      hydrated: _hasHydrated,
      authLoading,
      profileSynced: isProfileSynced,
      userRole,
      uid: userSession?.uid ?? null,
      isMaintenance,
      needsUpdate,
    };
    const key = JSON.stringify(snapshot);
    if (bootGateLogRef.current !== key) {
      bootGateLogRef.current = key;
      console.log('[BOOT] gate state', snapshot);
    }

    const isGated = (!loaded && !fontError) || isMCheckLoading || !_hasHydrated || authLoading;
    if (!isGated) return;

    const interval = setInterval(() => {
      console.warn('[BOOT] still waiting on startup gates', snapshot);
    }, 3000);
    return () => clearInterval(interval);
  }, [pathname, loaded, fontError, isMCheckLoading, _hasHydrated, authLoading, isProfileSynced, userRole, userSession?.uid, isMaintenance, needsUpdate]);

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

  const isDevPage = activeGroup === '(developer)';

  if (needsUpdate && !isDevPage) {
    return (
      <View style={styles.maintenanceContainer} onLayout={onLayoutRootView}>
        <MaterialCommunityIcons name="rocket-launch" size={80} color="#171717" />
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
          <Stack.Screen name="home" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="verify-email" />
          <Stack.Screen name="select-school" />
          <Stack.Screen name="change-password" />
          <Stack.Screen name="complete-profile" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="teacher-attendance" />
          <Stack.Screen name="leave" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(teacher)" />
          <Stack.Screen name="(student)" />
          <Stack.Screen name="(principal)" />
          <Stack.Screen name="(parent)" />
          <Stack.Screen name="(accountant)" />
          <Stack.Screen name="(hod)" />
          <Stack.Screen name="(librarian)" />
          <Stack.Screen name="(developer)" />
          <Stack.Screen name="(driver)" />
          <Stack.Screen name="(placement)" />
          <Stack.Screen name="(admission)" />
        </Stack>
      </View>
    </QueryClientProvider>
  );
};

const RootLayout = hasSentryDsn ? Sentry.wrap(AppLayout) : AppLayout;
export default RootLayout;

const styles = StyleSheet.create({
  maintenanceContainer: { flex: 1, backgroundColor: '#FFFDF7', justifyContent: 'center', alignItems: 'center', padding: 40 },
  maintenanceTitle: { fontSize: 24, fontFamily: FontFamily.bold, color: '#171717', marginTop: 20, textAlign: 'center' },
  maintenanceText: { fontSize: 16, fontFamily: FontFamily.regular, color: '#666', textAlign: 'center', marginTop: 15, lineHeight: 24 },
});
