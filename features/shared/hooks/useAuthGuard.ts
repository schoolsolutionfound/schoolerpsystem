import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../../store/useUserStore';
import { getHomeRouteForRole, isRouteAllowedForRole } from '../utils/routeGuards';

interface AuthGuardProps {
  userSession: any;
  userRole: string;
  pathname: string;
  authLoading: boolean;
  _hasHydrated: boolean;
  isProfileSynced: boolean;
}

export function useAuthGuard({
  userSession,
  userRole,
  pathname,
  authLoading,
  _hasHydrated,
  isProfileSynced,
}: AuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated || authLoading) return;

    const isPublicAuthRoute = ['/', '/auth', '/index', '/welcome', '/change-password', '/complete-profile', '/verify-email', '/notifications', '/select-school'].includes(pathname);

    if (userSession) {
      if (!isProfileSynced && userRole === 'loading') return;

      // Email verification check disabled — can be re-enabled later

      if (isPublicAuthRoute) {
        const state = useUserStore.getState();
        if (state.mustChangePassword) {
          router.replace('/change-password');
        } else if (!state.profileCompleted) {
          router.replace('/complete-profile');
        } else {
          router.replace(getHomeRouteForRole(state.userRole) as any);
        }
        return;
      }

      if (!isRouteAllowedForRole(pathname, userRole)) {
        router.replace(getHomeRouteForRole(userRole) as any);
      }
    } else {
      if (!isPublicAuthRoute && !isRouteAllowedForRole(pathname, userRole)) {
        router.replace('/auth');
      }
    }
  }, [pathname, userRole, userSession, _hasHydrated, authLoading, isProfileSynced, router]);

  return false;
}
