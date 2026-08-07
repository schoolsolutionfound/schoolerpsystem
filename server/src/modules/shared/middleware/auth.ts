import { FastifyRequest, FastifyReply } from 'fastify';
import { admin, isFirebaseAdminInitialized } from '../config/firebase.js';
import { dbFindByUid } from '../db/index.js';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  role?: string;
  institutionCode?: string;
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

  try {
    const dbUser = await dbFindByUid(firebaseUid);
    if (dbUser) {
      dbUserRole = dbUser.role || tokenRole || '';
      institutionCode = dbUser.institutionCode || '';
    }
  } catch (err: any) {
    console.warn('[Auth Middleware Warning] PostgreSQL user lookup failed:', err.message);
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
  const normalizedRole = (role === 'maintainer' || role === 'institution admin') ? 'admin' : role;

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
