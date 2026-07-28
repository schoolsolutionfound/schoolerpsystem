import { isDeveloper, isTeacher, isAdmin, isMaintainer } from '../permissions/permissions';

export function getHomeRouteForRole(role?: string): string {
  const norm = (role || '').toLowerCase();
  switch (norm) {
    case 'dev':
    case 'developer':
      return '/(developer)/dashboard';
    case 'admin':
    case 'institution admin':
    case 'maintainer':
      return '/admin-home';
    case 'teacher':
      return '/teacher-home';
    case 'student':
      return '/home';
    default:
      return '/auth';
  }
}

export function isRouteAllowedForRole(pathname: string, role?: string): boolean {
  const isDevRoute =
    pathname.startsWith('/dev-') ||
    pathname.startsWith('/(developer)') ||
    pathname.includes('dashboard') ||
    pathname.includes('institutions');

  if (isDevRoute && !isDeveloper(role)) {
    return false;
  }

  const isTeacherRoute = pathname.startsWith('/teacher-');
  if (isTeacherRoute && !isTeacher(role)) {
    return false;
  }

  const isAdminRoute = pathname.startsWith('/admin-');
  if (isAdminRoute && !isAdmin(role)) {
    return false;
  }

  const isMaintainerRoute = pathname.startsWith('/(maintainer)');
  if (isMaintainerRoute && !isMaintainer(role)) {
    return false;
  }

  return true;
}
