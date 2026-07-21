import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useUserStore } from '../store/useUserStore';

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

    const isDevRoute = pathname.startsWith('/dev-');
    const isAdminRoute = pathname.startsWith('/admin-');
    const isTeacherRoute = pathname.startsWith('/teacher-');
    const isPublicAuthRoute = ['/', '/welcome', '/auth', '/admin-login', '/teacher-login', '/dev-login', '/index', '/verify-email'].includes(pathname);

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

      if (isAdminRoute && userRole !== 'admin') {
        router.replace('/home');
      } else if (isDevRoute && userRole !== 'dev') {
        router.replace('/home');
      } else if (isTeacherRoute && userRole !== 'teacher') {
        router.replace('/home');
      }
    } else {
      if ((isDevRoute || isAdminRoute || isTeacherRoute || pathname === '/home' || pathname === '/profile') && !isPublicAuthRoute) {
        router.replace('/welcome');
      }
    }
  }, [pathname, userRole, userSession, _hasHydrated, authLoading, isEmailVerified, isProfileSynced, router]);

  return false;
}
