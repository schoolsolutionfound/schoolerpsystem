import { FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../shared/middleware/auth.js';
import { db } from '../shared/db/index.js';
import { users, placementMembers, institutions } from '../shared/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { getCachedAuth, setCachedAuth } from '../shared/middleware/authCache.js';

export async function requireCollege(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  const user = request.user;
  if (!user || !user.institutionCode) return;

  if (user.role === 'dev') return;

  // We need to check if the institution is a college
  try {
    if (!db) return;
    const inst = await db.query.institutions.findFirst({
      where: eq(institutions.institutionCode, user.institutionCode)
    });
    if (!inst || inst.institutionType !== 'college') {
      return reply.status(403).send({
        success: false,
        error: { message: 'Access denied: Placement features are only available for colleges', code: 'FORBIDDEN' },
      });
    }
  } catch (error) {
    console.warn('[Placement Middleware] Failed to check institution type:', error);
  }
}

export async function requirePlacementAccess(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  const user = request.user;
  if (!user || !user.uid || !user.institutionCode) {
    return reply.status(401).send({
      success: false,
      error: { message: 'Unauthorized: User authentication required', code: 'UNAUTHORIZED' },
    });
  }

  // Developer can access everything
  if (user.role === 'dev') return;

  // Check cache first
  const cached = getCachedAuth(user.uid);
  let accessLevel = (cached as any)?.placementAccess;

  if (accessLevel === undefined && db) {
    try {
      const dbUser = await db.query.users.findFirst({ where: eq(users.firebaseUid, user.uid) });
      if (dbUser) {
        if (dbUser.role === 'placement_officer' || dbUser.role === 'admin') {
          accessLevel = 'head';
        } else {
          const membership = await db.query.placementMembers.findFirst({
            where: and(
              eq(placementMembers.institutionCode, user.institutionCode),
              eq(placementMembers.userId, dbUser.id)
            ),
          });
          accessLevel = membership ? membership.accessLevel : null;
        }
        setCachedAuth(user.uid, user.role || '', user.institutionCode, cached?.mustChangePassword ?? false, cached?.emailVerified ?? true, cached?.department, accessLevel as 'head' | 'member' | null);
      }
    } catch (error) {
      console.warn('[Placement Middleware] Failed to check access:', error);
    }
  }

  if (accessLevel !== 'head' && accessLevel !== 'member') {
    return reply.status(403).send({
      success: false,
      error: { message: 'Access denied: Placement Cell access required', code: 'FORBIDDEN' },
    });
  }
}

export async function requirePlacementHead(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  const user = request.user;
  if (!user || !user.uid || !user.institutionCode) {
    return reply.status(401).send({
      success: false,
      error: { message: 'Unauthorized: User authentication required', code: 'UNAUTHORIZED' },
    });
  }

  // Developer can access everything
  if (user.role === 'dev') return;

  const cached = getCachedAuth(user.uid);
  let accessLevel = (cached as any)?.placementAccess;

  if (accessLevel === undefined && db) {
    try {
      const dbUser = await db.query.users.findFirst({ where: eq(users.firebaseUid, user.uid) });
      if (dbUser) {
        if (dbUser.role === 'placement_officer' || dbUser.role === 'admin') {
          accessLevel = 'head';
        } else {
          const membership = await db.query.placementMembers.findFirst({
            where: and(
              eq(placementMembers.institutionCode, user.institutionCode),
              eq(placementMembers.userId, dbUser.id)
            ),
          });
          accessLevel = membership ? membership.accessLevel : null;
        }
        setCachedAuth(user.uid, user.role || '', user.institutionCode, cached?.mustChangePassword ?? false, cached?.emailVerified ?? true, cached?.department, accessLevel as 'head' | 'member' | null);
      }
    } catch (error) {
      console.warn('[Placement Middleware] Failed to check access:', error);
    }
  }

  if (accessLevel !== 'head') {
    return reply.status(403).send({
      success: false,
      error: { message: 'Access denied: Placement Cell Head access required', code: 'FORBIDDEN' },
    });
  }
}
