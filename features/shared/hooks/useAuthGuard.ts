import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../../store/useUserStore';
import { getHomeRouteForRole, isRouteAllowedForRole } from '../utils/routeGuards';

interface AuthGuardProps {
  userSession: any;
  userRole: string;
  isEmailVerified: boolean;
  pathname: string;
  authLoading: boolean;
  _hasHydrated: boolean;
  isProfileSynced: boolean;
}

export function useAuthGuard({
  userSession,
  userRole,
  isEmailVerified,
  pathname,
  authLoading,
  _hasHydrated,
  isProfileSynced,
}: AuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated || authLoading) return;

    const isBypassUser = useUserStore.getState().isBypassUser;

    if (userSession && !isProfileSynced) return;
    if (isBypassUser && isProfileSynced) return;

    const isPublicAuthRoute = ['/', '/auth', '/index', '/verify-email'].includes(pathname);

    if (userSession || isBypassUser) {
      if (userRole === 'loading') return;

      const isUnverified = userRole === 'student' && isEmailVerified === false;

      if (isUnverified && !isPublicAuthRoute && pathname !== '/verify-email') {
        router.replace('/verify-email');
        return;
      }

      if (!isUnverified && pathname === '/verify-email') {
        router.replace('/home');
        return;
      }

      if (isPublicAuthRoute) {
        router.replace(getHomeRouteForRole(userRole) as any);
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
  }, [pathname, userRole, userSession, _hasHydrated, authLoading, isEmailVerified, isProfileSynced, router]);

  return false;
}
