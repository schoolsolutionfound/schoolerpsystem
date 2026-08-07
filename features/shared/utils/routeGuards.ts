const ROLE_ROUTES: Record<string, string> = {
  dev: '/(developer)/home',
  developer: '/(developer)/home',
  admin: '/(admin)/home',
  'institution admin': '/(admin)/home',
  maintainer: '/(admin)/home',
  teacher: '/(teacher)/home',
  student: '/(student)/home',
  principal: '/(principal)/home',
  parent: '/(parent)/home',
  accountant: '/(accountant)/home',
  hod: '/(hod)/home',
  librarian: '/(librarian)/home',
};

const ROLE_GROUP: Record<string, string> = {
  dev: '/(developer)',
  developer: '/(developer)',
  admin: '/(admin)',
  'institution admin': '/(admin)',
  maintainer: '/(admin)',
  teacher: '/(teacher)',
  student: '/(student)',
  principal: '/(principal)',
  parent: '/(parent)',
  accountant: '/(accountant)',
  hod: '/(hod)',
  librarian: '/(librarian)',
};

const SHARED_ROUTES = [
  '/auth', '/', '/index', '/welcome', '/change-password',
  '/complete-profile', '/verify-email', '/notifications', '/select-school',
];

export function getHomeRouteForRole(role?: string): string {
  const norm = (role || '').toLowerCase().trim();
  return ROLE_ROUTES[norm] || '/auth';
}

function extractGroup(pathname: string): string {
  const match = pathname.match(/^\/(\([^)]+\))/);
  return match ? `/${match[1]}` : '';
}

export function isRouteAllowedForRole(pathname: string, role?: string): boolean {
  const norm = (role || '').toLowerCase().trim();
  if (SHARED_ROUTES.includes(pathname)) return true;
  if (!norm || norm === 'loading') return false;

  const allowedGroup = ROLE_GROUP[norm];
  if (!allowedGroup) return false;

  const pathGroup = extractGroup(pathname);
  if (!pathGroup) return true;
  return pathGroup === allowedGroup;
}
