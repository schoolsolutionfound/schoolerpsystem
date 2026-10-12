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
 * (useAuthGuard reads /users/me, then redirects to /change-password →
 * /complete-profile).
 */
const PASSWORD_GATE_EXEMPT_ROUTES = new Set([
  '/api/v1/auth/login-sync',
  '/api/v1/auth/logout',
  '/api/v1/auth/change-password',
  '/api/v1/users/me',
  '/api/v1/users/complete-profile',
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
  let tokenRole = '';

  if (isFirebaseAdminInitialized) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      // Email verification check disabled — can be re-enabled later
      firebaseUid = decodedToken.uid;
      email = decodedToken.email || '';
      tokenRole = (decodedToken.role as string) || '';
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
  let dbUserRole = tokenRole;
  let institutionCode = '';
  let mustChangePassword = false;

  const cached = getCachedAuth(firebaseUid);
  if (cached) {
    dbUserRole = cached.role || tokenRole;
    institutionCode = cached.institutionCode;
    mustChangePassword = cached.mustChangePassword;
  } else {
    try {
      const dbUser = await dbFindByUid(firebaseUid);
      if (dbUser) {
        dbUserRole = dbUser.role || tokenRole || '';
        institutionCode = dbUser.institutionCode || '';
        mustChangePassword = Boolean(dbUser.mustChangePassword);
        setCachedAuth(firebaseUid, dbUserRole, institutionCode, mustChangePassword);
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

  request.user = {
    uid: firebaseUid,
    email: email,
    role: dbUserRole,
    institutionCode,
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

  // Accept both spellings: 'dev' (short form) and 'developer' (docs/roles.md form).
  if (role !== 'dev' && role !== 'developer') {
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
  return normalized;
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

export async function requireTeacherOrAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  const role = normalizeRole(request.user?.role);
  if (role !== 'admin' && role !== 'teacher' && role !== 'hod') {
    return reply.status(403).send({
      success: false,
      error: {
        message: 'Access denied: Teacher or Administrator privileges required',
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
  if (!['admin', 'hod', 'principal', 'teacher'].includes(role)) {
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
