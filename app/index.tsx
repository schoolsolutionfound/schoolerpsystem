import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useUserStore } from '../store/useUserStore';
import { getHomeRouteForRole } from '../features/shared/utils/routeGuards';
import { LoadingSplash } from '../features/shared/components/LoadingSplash';

export default function AppSplashScreen() {
  const router = useRouter();
  const mountedAt = useRef<number | null>(null);
  const navigated = useRef(false);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  // Always-armed failsafe: no boot state (role stuck loading, profile sync
  // never resolving, hydration failure) may leave the looping splash up
  // forever. This must not depend on readiness — that was the hang.
  useEffect(() => {
    const failsafe = setTimeout(() => {
      if (!navigated.current) {
        navigated.current = true;
        if (__DEV__) console.warn('[BOOT] splash failsafe fired, redirecting to /auth');
        router.replace('/auth');
      }
    }, 8000);
    return () => clearTimeout(failsafe);
  }, [router]);

  const _hasHydrated = useUserStore((state) => state._hasHydrated);
  const isProfileSynced = useUserStore((state) => state.isProfileSynced);
  const userRole = useUserStore((state) => state.userRole);
  const isEmailVerified = useUserStore((state) => state.isEmailVerified);
  const mustChangePassword = useUserStore((state) => state.mustChangePassword);
  const profileCompleted = useUserStore((state) => state.profileCompleted);
  const accessBlocked = useUserStore((state) => state.accessBlocked);

  const [authStateResolved, setAuthStateResolved] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);
  const handleSplashFinished = useCallback(() => setSplashFinished(true), []);

  useEffect(() => {
    if (!_hasHydrated) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (__DEV__) console.log('[BOOT] splash auth resolved', { authenticated: !!user, uid: user?.uid ?? null });
      setAuthStateResolved(true);
    });

    return () => unsubscribeAuth();
  }, [_hasHydrated]);

  useEffect(() => {
    const user = auth.currentUser;
    const isReadyToNavigate =
      authStateResolved && _hasHydrated && splashFinished && (!user || isProfileSynced);
    if (__DEV__) {
      console.log('[BOOT] splash readiness', {
        authenticated: !!user,
        authStateResolved,
        hydrated: _hasHydrated,
        splashFinished,
        profileSynced: isProfileSynced,
        userRole,
        isEmailVerified,
        mustChangePassword,
        profileCompleted,
        accessBlocked,
        isReadyToNavigate,
      });
    }
    if (!isReadyToNavigate) return;

    let finalRoute: any = '/auth';

    if (user) {
      if (accessBlocked) {
        finalRoute = '/account-blocked';
      } else if (userRole === 'loading') {
        if (__DEV__) console.warn('[BOOT] splash waiting: authenticated but role still loading');
        return;
      } else if (!isEmailVerified) {
        finalRoute = '/verify-email';
      } else if (mustChangePassword) {
        finalRoute = '/change-password';
      } else if (!profileCompleted) {
        finalRoute = '/complete-profile';
      } else {
        finalRoute = getHomeRouteForRole(userRole);
      }
    } else {
      finalRoute = '/auth';
    }

    if (__DEV__) console.log('[BOOT] splash navigating', { finalRoute });

    const failsafe = setTimeout(() => {
      if (!navigated.current) {
        if (__DEV__) console.warn('[BOOT] splash failsafe fired, redirecting to /auth');
        navigated.current = true;
        router.replace('/auth');
      }
    }, 8000);

    const remaining = Math.max(0, 2400 - (Date.now() - (mountedAt.current ?? Date.now())));
    const timer = setTimeout(() => {
      if (navigated.current) return;
      navigated.current = true;
      if (__DEV__) console.log('[BOOT] splash navigating now', { finalRoute, remaining });
      router.replace(finalRoute);
    }, remaining);

    return () => {
      clearTimeout(timer);
      clearTimeout(failsafe);
    };
  }, [authStateResolved, isProfileSynced, _hasHydrated, splashFinished, userRole, isEmailVerified, mustChangePassword, profileCompleted, accessBlocked, router]);

  return <LoadingSplash onFinished={handleSplashFinished} />;
}





