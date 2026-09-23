const ROLE_ROUTES: Record<string, string> = {
  dev: '/(developer)/home',
  developer: '/(developer)/home',
  admin: '/(admin)/home',
  'institution admin': '/(admin)/home',
  teacher: '/(teacher)/home',
  student: '/(student)/home',
  principal: '/(principal)/home',
  parent: '/(parent)/home',
  accountant: '/(accountant)/home',
  hod: '/(hod)/home',
  librarian: '/(librarian)/home',
  driver: '/(driver)/home',
  admission_officer: '/(admin)/admissions',
  'admission officer': '/(admin)/admissions',
};

const ROLE_GROUP: Record<string, string> = {
  dev: '/(developer)',
  developer: '/(developer)',
  admin: '/(admin)',
  'institution admin': '/(admin)',
  teacher: '/(teacher)',
  student: '/(student)',
  principal: '/(principal)',
  parent: '/(parent)',
  accountant: '/(accountant)',
  hod: '/(hod)',
  librarian: '/(librarian)',
  driver: '/(driver)',
  admission_officer: '/(admin)',
  'admission officer': '/(admin)',
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

export function isRouteAllowedForRole(pathname: string, role?: string, roles?: string[]): boolean {
  if (SHARED_ROUTES.includes(pathname)) return true;
  const pathGroup = extractGroup(pathname);
  if (!pathGroup) return true;

  const allRoles = Array.from(new Set([
    ...(role ? [role.toLowerCase().trim()] : []),
    ...(roles ? roles.map((r) => r.toLowerCase().trim()) : []),
  ]));

  if (allRoles.length === 0 || allRoles.includes('loading')) return false;

  return allRoles.some((r) => ROLE_GROUP[r] === pathGroup);
}
