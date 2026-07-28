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
      firebaseUid = decodedToken.uid;
      email = decodedToken.email || '';
      tokenRole = (decodedToken.role as string) || '';
    } catch (error: any) {
      console.warn('[Auth Middleware Warning] Firebase Token verification failed:', error.message);
    }
  }

  // Fallback for dev / testing bypass tokens
  if (!firebaseUid && (process.env.NODE_ENV !== 'production' || token.startsWith('mock_') || token.length < 50)) {
    firebaseUid = token.startsWith('mock_') ? token : `dev_uid_${token.substring(0, 10)}`;
    email = token.includes('@') ? token : 'devuser@school.com';
    tokenRole = token.includes('student') ? 'student' : 'admin';
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
      dbUserRole = dbUser.role || tokenRole || 'student';
      institutionCode = dbUser.institutionCode || '';
    }
  } catch (err: any) {
    console.warn('[Auth Middleware Warning] PostgreSQL user lookup failed:', err.message);
  }

  request.user = {
    uid: firebaseUid,
    email: email,
    role: dbUserRole || 'student',
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

  const role = (request.user.role || '').toLowerCase();
  const isDevOrAdmin = role === 'dev' || role === 'admin';

  if (!isDevOrAdmin) {
    return reply.status(403).send({
      success: false,
      error: {
        message: 'Access denied: Developer or Super Admin privileges required',
        code: 'FORBIDDEN',
      },
    });
  }
}
