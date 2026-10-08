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
};

const SHARED_ROUTES = [
  '/auth', '/', '/index', '/welcome', '/change-password',
  '/complete-profile', '/verify-email', '/notifications', '/select-school',
];

// Root-level routes that live outside any (group) directory but belong to
// specific roles. They must be listed here explicitly — a route without a
// group prefix is DENIED by default, so anything added to app/ later is
// blocked for all roles until scoped here or moved into a role group.
// Role sets mirror the server middleware (requireTeacherOrAdmin / requireStaff).
const ROLE_SCOPED_ROOT_ROUTES: Record<string, string[]> = {
  '/teacher-attendance': ['teacher', 'hod', 'principal', 'admin', 'institution admin'],
  '/teacher-timetable': ['teacher', 'hod', 'admin', 'institution admin'],
};

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

  // Explicitly scoped root-level routes (no group directory).
  const scopedRoles = ROLE_SCOPED_ROOT_ROUTES[pathname];
  if (scopedRoles) return scopedRoles.includes(norm);

  const allowedGroup = ROLE_GROUP[norm];
  if (!allowedGroup) return false;

  const pathGroup = extractGroup(pathname);
  // Routes without a group prefix are denied unless listed in
  // SHARED_ROUTES or ROLE_SCOPED_ROOT_ROUTES above.
  if (!pathGroup) return false;
  return pathGroup === allowedGroup;
}
