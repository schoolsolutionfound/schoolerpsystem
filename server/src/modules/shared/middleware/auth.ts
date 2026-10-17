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
  department?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

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
  let department = '';

  const cached = getCachedAuth(firebaseUid);
  if (cached) {
    dbUserRole = cached.role || tokenRole;
    institutionCode = cached.institutionCode;
    department = cached.department || '';
  } else {
    try {
      const dbUser = await dbFindByUid(firebaseUid);
      if (dbUser) {
        dbUserRole = dbUser.role || tokenRole || '';
        institutionCode = dbUser.institutionCode || '';
        let scope: any = dbUser.scope;
        if (typeof scope === 'string') {
          try { scope = JSON.parse(scope); } catch { scope = {}; }
        }
        department = (dbUser as any).department || scope?.department || scope?.dept || '';
        setCachedAuth(firebaseUid, dbUserRole, institutionCode, department);
      }
    } catch (err: any) {
      console.warn('[Auth Middleware Warning] PostgreSQL user lookup failed:', err.message);
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

  request.user = {
    uid: firebaseUid,
    email: email,
    role: dbUserRole,
    institutionCode,
    department,
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

  const role = (request.user.role || '').toLowerCase().trim();
  const normalizedRole = (role === 'institution admin') ? 'admin' : role;

  if (normalizedRole !== 'dev') {
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
  if (normalized === 'hid') return 'hod';
  return normalized;
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
