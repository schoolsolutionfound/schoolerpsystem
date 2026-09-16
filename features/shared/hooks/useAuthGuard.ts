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

    const isPublicAuthRoute = [
      '/',
      '/auth',
      '/index',
      '/welcome',
      '/change-password',
      '/complete-profile',
      '/verify-email',
      '/notifications',
      '/select-school',
    ].includes(pathname);

    if (userSession) {
      // Still waiting for profile sync
      if (!isProfileSynced && userRole === 'loading') return;

      if (isPublicAuthRoute) {
        const state = useUserStore.getState();
        let targetRoute = '/auth';

        if (state.mustChangePassword) {
          targetRoute = '/change-password';
        } else if (!state.profileCompleted) {
          targetRoute = '/complete-profile';
        } else {
          targetRoute = getHomeRouteForRole(state.userRole || userRole);
        }

        if (pathname !== targetRoute && targetRoute !== '/auth') {
          router.replace(targetRoute as any);
        }
        return;
      }

      if (!isRouteAllowedForRole(pathname, userRole)) {
        const targetRoute = getHomeRouteForRole(userRole);
        if (pathname !== targetRoute) {
          router.replace(targetRoute as any);
        }
      }
    } else {
      if (!isPublicAuthRoute && !isRouteAllowedForRole(pathname, userRole)) {
        if (pathname !== '/auth') {
          router.replace('/auth');
        }
      }
    }
  }, [pathname, userRole, userSession?.uid, _hasHydrated, authLoading, isProfileSynced, router]);

  return false;
}
