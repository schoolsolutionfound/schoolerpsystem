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

    // Entry screens intended only for unauthenticated users
    const isUnauthEntryRoute = ['/', '/auth', '/index', '/welcome', '/select-school'].includes(pathname);

    if (userSession) {
      if (!isProfileSynced && userRole === 'loading') return;

      const state = useUserStore.getState();

      // If user must change password, keep them on change-password
      if (state.mustChangePassword) {
        if (pathname !== '/change-password' && pathname !== '/auth') {
          router.replace('/change-password');
        }
        return;
      }

      // If profile is not completed, keep them on complete-profile
      if (!state.profileCompleted) {
        if (pathname !== '/complete-profile' && pathname !== '/change-password' && pathname !== '/auth') {
          router.replace('/complete-profile');
        }
        return;
      }

      // If already authenticated with completed profile, bounce off login/welcome pages to home
      if (isUnauthEntryRoute) {
        router.replace(getHomeRouteForRole(state.userRole) as any);
        return;
      }

      // Check role group permissions for role-specific routes
      if (!isRouteAllowedForRole(pathname, userRole)) {
        router.replace(getHomeRouteForRole(userRole) as any);
      }
    } else {
      if (!isUnauthEntryRoute && !isRouteAllowedForRole(pathname, userRole)) {
        router.replace('/auth');
      }
    }
  }, [pathname, userRole, userSession, _hasHydrated, authLoading, isProfileSynced, router]);

  return false;
}
