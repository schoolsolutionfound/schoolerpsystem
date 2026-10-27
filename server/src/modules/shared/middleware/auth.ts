import { FastifyRequest, FastifyReply } from 'fastify';
import { admin, isFirebaseAdminInitialized } from '../config/firebase.js';
import { dbFindByUid } from '../db/index.js';
import { getCachedAuth, setCachedAuth } from './authCache.js';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role?: string;
  displayName?: string;
  institutionCode?: string;
  emailVerified?: boolean;
  mustChangePassword?: boolean;
  department?: string;
  placementAccess?: 'head' | 'member' | null;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Routes a user with mustChangePassword=true is still allowed to hit.
 * Everything else returns 403 PASSWORD_CHANGE_REQUIRED until the password
 * is rotated. Kept minimal on purpose: logout (cleanup), change-password
 * (the fix), login-sync (post-login bootstrap), and the own-profile
 * endpoints the client needs to run its first-login redirect flow
 * (useAuthGuard reads /users/me, then redirects through verify-email,
 * change-password, and complete-profile).
 */
const PASSWORD_GATE_EXEMPT_ROUTES = new Set([
  '/api/v1/auth/login-sync',
  '/api/v1/auth/logout',
  '/api/v1/auth/verify-email/verify',
  '/api/v1/auth/verify-email/resend',
  '/api/v1/auth/verify-email/status',
  '/api/v1/auth/change-password',
  '/api/v1/users/me',
  '/api/v1/users/complete-profile',
]);

/**
 * Routes an unverified user may still hit when EMAIL_VERIFICATION_ENFORCED is
 * on. Kept minimal: the verify screen needs to resend and poll status, the
 * user needs logout, and login-sync is the post-auth bootstrap the client runs
 * before it knows verification is outstanding. Verification is the first
 * onboarding step, so the later password/profile routes are not exempt.
 */
const EMAIL_GATE_EXEMPT_ROUTES = new Set([
  '/api/v1/auth/login-sync',
  '/api/v1/auth/logout',
  // The verify route MUST be exempt �?" it is the one call an unverified user
  // makes, so gating it would make verification impossible.
  '/api/v1/auth/verify-email/verify',
  '/api/v1/auth/verify-email/resend',
  '/api/v1/auth/verify-email/status',
  '/api/v1/users/me',
]);

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      error: {
        message: 'Unauthorized: Missing or invalid Authorization header',
        code: 'UNAUTHORIZED',
      },
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();

  if (!token) {
    return reply.status(401).send({
      success: false,
      error: {
        message: 'Unauthorized: Empty token provided',
        code: 'EMPTY_TOKEN',
      },
    });
  }

  let firebaseUid = '';
  let email = '';

  if (isFirebaseAdminInitialized) {
    try {
      // Check revocation so logout, password reset, and password change end
      // sessions immediately instead of waiting for the ID token to expire.
      const decodedToken = await admin.auth().verifyIdToken(token, true);
      firebaseUid = decodedToken.uid;
      email = decodedToken.email || '';
    } catch (error: any) {
      console.warn('[Auth Middleware Warning] Firebase Token verification failed:', error.message);
    }
  }

  if (!firebaseUid) {
    return reply.status(401).send({
      success: false,
      error: {
        message: 'Unauthorized: Invalid Firebase ID token',
        code: 'INVALID_TOKEN',
      },
    });
  }

  // Robust Flow: Fetch User from PostgreSQL to retrieve authoritative Role & Institution mapping
  let dbUserRole = '';
  let institutionCode = '';
  let mustChangePassword = false;
  let emailVerified = true;
  let department = '';
  let placementAccess: 'head' | 'member' | null | undefined;

  const cached = getCachedAuth(firebaseUid);
  if (cached) {
    dbUserRole = cached.role;
    institutionCode = cached.institutionCode;
    mustChangePassword = cached.mustChangePassword;
    emailVerified = cached.emailVerified;
    department = cached.department || '';
    placementAccess = cached.placementAccess;
  } else {
    try {
      const dbUser = await dbFindByUid(firebaseUid);
      if (dbUser) {
        dbUserRole = dbUser.role || '';
        institutionCode = dbUser.institutionCode || '';
        mustChangePassword = Boolean(dbUser.mustChangePassword);
        emailVerified = dbUser.emailVerified ?? true;
        let scope: any = dbUser.scope;
        if (typeof scope === 'string') {
          try { scope = JSON.parse(scope); } catch { scope = {}; }
        }
        department = (dbUser as any).department || scope?.department || scope?.dept || '';
        placementAccess =
          dbUser.role === 'placement_officer' || dbUser.role === 'admin' ? 'head' : undefined;
        setCachedAuth(
          firebaseUid,
          dbUserRole,
          institutionCode,
          mustChangePassword,
          emailVerified,
          department,
          placementAccess
        );
      }
    } catch (err: any) {
      // Fail closed: a DB outage must not silently produce an empty-tenant principal.
      console.error('[Auth Middleware] PostgreSQL user lookup failed:', err.message);
      return reply.status(503).send({
        success: false,
        error: {
          message: 'Service temporarily unavailable. Please try again.',
          code: 'SERVICE_UNAVAILABLE',
        },
      });
    }
  }

  if (!dbUserRole) {
    return reply.status(403).send({
      success: false,
      error: {
        message: 'No role assigned to this user. Contact your administrator.',
        code: 'NO_ROLE_ASSIGNED',
      },
    });
  }

  if (mustChangePassword) {
    const routeUrl = (request.routeOptions?.url || request.url || '').split('?')[0];
    if (!PASSWORD_GATE_EXEMPT_ROUTES.has(routeUrl)) {
      return reply.status(403).send({
        success: false,
        error: {
          message: 'Password change required. Please set a new password before continuing.',
          code: 'PASSWORD_CHANGE_REQUIRED',
        },
      });
    }
  }

  // Email-verification gate (Phase 2). Off unless EMAIL_VERIFICATION_ENFORCED
  // is truthy, so the ~28 pre-existing accounts (all defaulting to
  // email_verified=true... but any that were flagged) never break on deploy.
  // Exempt the routes the verify screen itself needs: resend, status, logout,
  // and login-sync (which is how the client boots post-auth).
  const enforceEmailVerification =
    process.env.EMAIL_VERIFICATION_ENFORCED === 'true' ||
    process.env.EMAIL_VERIFICATION_ENFORCED === '1';

  if (enforceEmailVerification && !emailVerified) {
    const routeUrl = (request.routeOptions?.url || request.url || '').split('?')[0];
    if (!EMAIL_GATE_EXEMPT_ROUTES.has(routeUrl)) {
      return reply.status(403).send({
        success: false,
        error: {
          message: 'Please verify your email address before continuing.',
          code: 'EMAIL_VERIFICATION_REQUIRED',
        },
      });
    }
  }

  request.user = {
    uid: firebaseUid,
    email: email,
    role: dbUserRole,
    institutionCode,
    emailVerified,
    mustChangePassword,
    department,
    placementAccess,
  };
}

export async function requireDeveloper(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: {
        message: 'Unauthorized: User authentication required',
        code: 'UNAUTHORIZED',
      },
    });
  }

  const role = normalizeRole(request.user.role);

  // normalizeRole folds 'developer' → 'dev'.
  if (role !== 'dev') {
    return reply.status(403).send({
      success: false,
      error: {
        message: 'Access denied: Developer privileges required',
        code: 'FORBIDDEN',
      },
    });
  }
}

export function normalizeRole(role: string | undefined): string {
  const normalized = (role || '').toLowerCase().trim();
  if (normalized === 'institution admin') return 'admin';
  // Canonical developer role is 'dev'; fold the docs spelling so guards and
  // client checks stay consistent.
  if (normalized === 'developer') return 'dev';
  if (normalized === 'hid') return 'hod';
  return normalized;
}

export function isValidRole(role: string): boolean {
  const validRoles = [
    'admin', 'principal', 'hod', 'teacher', 'student', 'parent',
    'librarian', 'accountant', 'staff', 'driver', 'placement_officer',
    'admission_officer', 'counselor', 'coordinator', 'professor',
    'assistant_professor', 'associate_professor', 'lab_instructor', 'dev'
  ];
  return validRoles.includes(normalizeRole(role));
}

export function getTenantInstitutionCode(request: FastifyRequest): string {
  const code = request.user?.institutionCode;
  if (!code) {
    throw new Error('TENANT_REQUIRED: No institution assigned to current user account.');
  }
  return code;
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  const role = normalizeRole(request.user?.role);
  if (role !== 'admin') {
    return reply.status(403).send({
      success: false,
      error: {
        message: 'Access denied: Institution Administrator privileges required',
        code: 'FORBIDDEN',
      },
    });
  }
}

export async function requireAdminOrPrincipal(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  const role = normalizeRole(request.user?.role);
  if (role !== 'admin' && role !== 'principal') {
    return reply.status(403).send({
      success: false,
      error: {
        message: 'Access denied: Administrator or Principal privileges required',
        code: 'FORBIDDEN',
      },
    });
  }
}

export async function requireHODOrAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  const role = normalizeRole(request.user?.role);
  if (role !== 'admin' && role !== 'principal' && role !== 'hod') {
    return reply.status(403).send({
      success: false,
      error: {
        message: 'Access denied: HOD or Administrator privileges required',
        code: 'FORBIDDEN',
      },
    });
  }
}

export async function requireTeacherOrAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  const role = normalizeRole(request.user?.role);
  if (role !== 'admin' && role !== 'teacher' && role !== 'hod' && role !== 'principal') {
    return reply.status(403).send({
      success: false,
      error: {
        message: 'Access denied: Teacher, HOD, Principal, or Administrator privileges required',
        code: 'FORBIDDEN',
      },
    });
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;

    const role = normalizeRole(request.user?.role);
    if (!roles.includes(role)) {
      return reply.status(403).send({
        success: false,
        error: {
          message: `Access denied: requires one of: ${roles.join(', ')}`,
          code: 'FORBIDDEN',
        },
      });
    }
  };
}

export async function requireStaff(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  const role = normalizeRole(request.user?.role);
  if (!['admin', 'hod', 'principal', 'teacher', 'librarian', 'accountant', 'staff'].includes(role)) {
    return reply.status(403).send({
      success: false,
      error: {
        message: 'Access denied: Staff privileges required',
        code: 'FORBIDDEN',
      },
    });
  }
}

/**
 * Library module gate: institution staff + the dedicated librarian role.
 */
export async function requireLibraryStaff(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  const role = normalizeRole(request.user?.role);
  if (!['admin', 'hod', 'principal', 'teacher', 'librarian'].includes(role)) {
    return reply.status(403).send({
      success: false,
      error: {
        message: 'Access denied: Library staff privileges required',
        code: 'FORBIDDEN',
      },
    });
  }
}
