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
  activeGroup,
  authLoading,
  _hasHydrated,
  isProfileSynced,
}: AuthGuardProps) {
  const router = useRouter();

  // Authoritative first-login flags from login-sync — kept in the deps so the
  // guard re-evaluates the moment the sync lands (the pre-sync guess is never
  // used for routing because we wait on isProfileSynced below).
  const mustChangePassword = useUserStore((s) => s.mustChangePassword);
  const profileCompleted = useUserStore((s) => s.profileCompleted);
  const isEmailVerified = useUserStore((s) => s.isEmailVerified);

  useEffect(() => {
    if (!_hasHydrated || authLoading) return;

    const isPublicAuthRoute = ['/', '/auth', '/index', '/welcome', '/change-password', '/complete-profile', '/verify-email', '/select-school'].includes(pathname);
    // Shared screens that any role may open — but only while signed in.
    const isSessionRequiredSharedRoute = pathname === '/notifications';

    // usePathname() strips route groups, so role-group checks need the active
    // group from useSegments(). Without this, every non-home role route (e.g.
    // /announcements or /profile) is denied and redirected back to home.
    const rolePathname = activeGroup
      ? `/${activeGroup}${pathname === '/' ? '' : pathname}`
      : pathname;

    if (userSession) {
      // Wait for the backend login-sync. Its flags (mustChangePassword,
      // profileCompleted, isEmailVerified) decide the first-login route —
      // guessing pre-sync sent fresh users to the wrong screen.
      if (!isProfileSynced) return;

      if (isPublicAuthRoute) {
        const state = useUserStore.getState();
        let targetRoute = '/auth';

        // First-login order: set password → complete profile → verify email.
        if (state.mustChangePassword) {
          targetRoute = '/change-password';
        } else if (!state.profileCompleted) {
          targetRoute = '/complete-profile';
        } else if (!state.isEmailVerified) {
          targetRoute = '/verify-email';
        } else {
          targetRoute = getHomeRouteForRole(state.userRole || userRole);
        }

        // /change-password is reachable voluntarily when mustChangePassword is
        // false (profile/drawer "Change Password" entry points). Only force a
        // redirect away when the user must NOT be on this screen.
        if (pathname === '/change-password' && !state.mustChangePassword) {
          return;
        }

        // /complete-profile is browsable during onboarding (Back from
        // verify-email, or re-checking a step). Only push completed +
        // verified users off it (target home).
        if (
          pathname === '/complete-profile' &&
          !state.mustChangePassword &&
          (!state.profileCompleted || !state.isEmailVerified)
        ) {
          return;
        }

        // /verify-email is a dead end once verified — continue the chain:
        // complete the profile if it's still pending, otherwise go home.
        if (pathname === '/verify-email' && state.isEmailVerified) {
          const next: any = !state.profileCompleted
            ? '/complete-profile'
            : getHomeRouteForRole(state.userRole || userRole);
          router.replace(next);
          return;
        }

        if (pathname !== targetRoute && targetRoute !== '/auth') {
          router.replace(targetRoute as any);
        }
        return;
      }

      if (!isRouteAllowedForRole(rolePathname, userRole)) {
        const targetRoute = getHomeRouteForRole(userRole);
        if (pathname !== targetRoute) {
          router.replace(targetRoute as any);
        }
      }
    } else {
      if (isSessionRequiredSharedRoute) {
        router.replace('/auth');
      } else if (!isPublicAuthRoute && !isRouteAllowedForRole(rolePathname, userRole)) {
        if (pathname !== '/auth') {
          router.replace('/auth');
        }
      }
    }
  }, [pathname, activeGroup, userRole, userSession?.uid, _hasHydrated, authLoading, isProfileSynced, router, mustChangePassword, profileCompleted, isEmailVerified]);

  return false;
}
