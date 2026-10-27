import { Platform } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../../store/useUserStore';
import { getHomeRouteForRole, isRouteAllowedForRole } from '../utils/routeGuards';

interface AuthGuardProps {
  userSession: any;
  userRole: string;
  pathname: string;
  activeGroup?: string;
  authLoading: boolean;
  _hasHydrated: boolean;
  isProfileSynced: boolean;
  isBootReady?: boolean;
}

export function useAuthGuard({
  userSession,
  userRole,
  pathname,
  activeGroup,
  authLoading,
  _hasHydrated,
  isProfileSynced,
  isBootReady = true,
}: AuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    if (__DEV__) {
      console.log('[BOOT] auth guard evaluate', {
        pathname,
        activeGroup,
        authenticated: !!userSession,
        userRole,
        hydrated: _hasHydrated,
        authLoading,
        profileSynced: isProfileSynced,
      });
    }
    if (!_hasHydrated || authLoading || !isBootReady) return;

    // Entry screens intended only for unauthenticated users
    const isUnauthEntryRoute = ['/', '/auth', '/index', '/welcome', '/select-school'].includes(pathname);

    if (userSession) {
      // Never route an authenticated user from pre-sync data. The auth-claims
      // fallback is neutral (student) until login-sync resolves the real role,
      // so redirecting early briefly shows the wrong role home.
      if (!isProfileSynced) return;

      const state = useUserStore.getState();

      // Grouped role homes also resolve to pathname "/home" on native, so only
      // redirect when the active group is not the user's authoritative group.
      const homeRoute = getHomeRouteForRole(userRole);
      const homeGroup = homeRoute ? homeRoute.split('/')[1] : undefined;
      if (pathname === '/home' && Platform.OS !== 'web' && homeRoute && activeGroup !== homeGroup) {
        if (__DEV__) console.log('[BOOT] auth guard redirect /home ->', homeRoute);
        router.replace(homeRoute as any);
        return;
      }

      // First-login step 1: verify email
      if (!state.isEmailVerified) {
        if (pathname !== '/verify-email' && pathname !== '/auth') {
          if (__DEV__) console.log('[BOOT] auth guard redirect email unverified -> /verify-email');
          router.replace('/verify-email');
        }
        return;
      }

      // First-login step 2: rotate the temporary password
      if (state.mustChangePassword) {
        if (pathname !== '/change-password' && pathname !== '/auth') {
          if (__DEV__) console.log('[BOOT] auth guard redirect mustChangePassword -> /change-password');
          router.replace('/change-password');
        }
        return;
      }

      // First-login step 3: complete the profile
      if (!state.profileCompleted) {
        if (pathname !== '/complete-profile' && pathname !== '/auth') {
          if (__DEV__) console.log('[BOOT] auth guard redirect profile incomplete -> /complete-profile');
          router.replace('/complete-profile');
        }
        return;
      }

      // If already authenticated with completed profile, bounce off login/welcome pages to home
      if (isUnauthEntryRoute) {
        if (__DEV__) console.log('[BOOT] auth guard redirect unauth entry ->', getHomeRouteForRole(state.userRole));
        router.replace(getHomeRouteForRole(state.userRole) as any);
        return;
      }

      // Check role group permissions for role-specific routes
      if (!isRouteAllowedForRole(pathname, userRole, undefined, activeGroup)) {
        if (__DEV__) console.log('[BOOT] auth guard redirect disallowed route ->', getHomeRouteForRole(userRole));
        router.replace(getHomeRouteForRole(userRole) as any);
      }
    } else {
      if (!isUnauthEntryRoute && !isRouteAllowedForRole(pathname, userRole, undefined, activeGroup)) {
        if (__DEV__) console.log('[BOOT] auth guard redirect unauthenticated -> /auth');
        router.replace('/auth');
      }
    }
  }, [pathname, userRole, userSession, activeGroup, _hasHydrated, authLoading, isProfileSynced, isBootReady, router]);

  return false;
}
