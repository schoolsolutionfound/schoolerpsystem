/**
 * @file index.ts
 * @description SchoolHub Fastify backend server entry point.
 *
 * Responsibilities:
 *  - Registers @fastify/cors with environment-configured allowed origins
 *  - Registers @fastify/rate-limit (default: 300 req/min per IP)
 *  - Mounts all API v1 route modules under /api/v1
 *  - Exposes a /health endpoint for uptime checks
 *
 * Environment variables (see server/.env.example):
 *  PORT            — HTTP port to bind (default: 5000)
 *  HOST            — Host to bind (default: 0.0.0.0)
 *  CORS_ORIGINS    — Comma-separated list of allowed origins
 *  RATE_LIMIT_MAX  — Max requests per minute per IP
 */

import 'dotenv/config'; // Loads .env file via dotenv automatically
import Fastify from 'fastify';
import cors, { type OriginFunction } from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { academicsRoutes } from './modules/academics/academics.routes.js';
import { developerRoutes } from './modules/developer/developer.routes.js';
import { notificationRoutes } from './modules/notifications/notification.routes.js';
import { startNotificationQueue, stopNotificationQueue } from './modules/notifications/notification.queue.js';
import { libraryRoutes } from './modules/library/library.routes.js';
import { announcementRoutes } from './modules/announcements/announcement.routes.js';
import { startAnnouncementScheduler, stopAnnouncementScheduler } from './modules/announcements/announcement.scheduler.js';
import { admissionsRoutes } from './modules/admissions/admissions.routes.js';

const port = Number(process.env.PORT) || 5000;
const host = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * trustProxy must be enabled only when the server sits behind a reverse proxy
 * (nginx, Caddy, CDN, Vercel/Heroku etc.) — otherwise req.ip (and therefore the
 * rate-limit keys) would come from the X-Forwarded-For header, which clients
 * can spoof. Set TRUST_PROXY=true (or a comma-separated proxy CIDR list) in
 * the production environment.
 */
const trustProxyEnv = (process.env.TRUST_PROXY || '').trim();
const trustProxy = trustProxyEnv === '' ? false : trustProxyEnv === 'true' ? true : trustProxyEnv;

const fastify = Fastify({
  logger: true,
  trustProxy,
});

/**
 * CORS policy:
 * - CORS_ORIGINS set  -> only those exact origins are allowed.
 * - CORS_ORIGINS empty + production -> the server refuses to start.
 * - CORS_ORIGINS empty + development -> localhost on common dev ports only.
 * Requests without an Origin header (mobile apps, curl, server-to-server) are
 * always allowed — CORS is a browser-enforced mechanism and does not apply to
 * them.
 */
function buildCorsOrigin(): OriginFunction {
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowedOrigins.length > 0) {
    return (origin, done) => {
      if (!origin || allowedOrigins.includes(origin)) {
        done(null, true);
        return;
      }
      done(Object.assign(new Error('Origin not allowed by CORS'), { statusCode: 403, code: 'CORS_DENIED' }), false);
    };
  }

  if (isProduction) {
    throw new Error(
      '[CORS] CORS_ORIGINS is empty in production. Set it to a comma-separated list of exact browser origins (e.g. https://console.yourdomain.com). Wildcard CORS is not permitted in production.'
    );
  }

  // Development fallback: localhost / 127.0.0.1 on the usual dev-server ports.
  const devPorts = new Set(['', '3000', '5173', '5174', '8080', '8000', '19006']);
  return (origin, done) => {
    if (!origin) {
      done(null, true);
      return;
    }
    try {
      const url = new URL(origin);
      const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]';
      if (isLocal && devPorts.has(url.port)) {
        done(null, true);
        return;
      }
    } catch {
      // malformed origin — fall through to rejection
    }
    done(Object.assign(new Error('Origin not allowed by CORS'), { statusCode: 403, code: 'CORS_DENIED' }), false);
  };
}

async function main() {
  try {
    await fastify.register(cors, {
      origin: buildCorsOrigin(),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    });

    await fastify.register(rateLimit, {
      max: Number(process.env.RATE_LIMIT_MAX) || 300,
      timeWindow: '1 minute',
      keyGenerator: (req) => req.ip,
      errorResponseBuilder: (req, context) => {
        const afterMs = context.after ? Date.parse(context.after as string) : NaN;
        const retryAfter = Number.isFinite(afterMs) ? Math.max(1, Math.ceil((afterMs - Date.now()) / 1000)) : 60;
        return {
          success: false,
          error: {
            message: `Too many requests. Try again in ${retryAfter} seconds.`,
            code: 'RATE_LIMITED',
          },
        };
      },
    });

    // Health check route
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register API v1 routes
    await fastify.register(
      async (apiV1) => {
        await apiV1.register(authRoutes, { prefix: '/auth' });
        await apiV1.register(userRoutes, { prefix: '/users' });
        await apiV1.register(adminRoutes, { prefix: '/admin' });
        await apiV1.register(academicsRoutes, { prefix: '/admin' });
        await apiV1.register(developerRoutes, { prefix: '/developer' });
        await apiV1.register(notificationRoutes, { prefix: '/notifications' });
        await apiV1.register(libraryRoutes, { prefix: '/library' });
        await apiV1.register(announcementRoutes, { prefix: '/announcements' });
        await apiV1.register(admissionsRoutes, { prefix: '/admissions' });
      },
      { prefix: '/api/v1' }
    );

    fastify.addHook('onClose', async () => {
      stopAnnouncementScheduler();
    });

    await fastify.listen({ port, host });
    startAnnouncementScheduler();
    console.log(`🚀 Fastify Backend Server running on http://${host}:${port}`);
    console.log(`   Environment: ${isProduction ? 'production' : 'development'} | trustProxy: ${String(trustProxy)}`);

    // Start notification queue processor
    startNotificationQueue();

    // Graceful shutdown
    const shutdown = async () => {
      stopNotificationQueue();
      stopAnnouncementScheduler();
      await fastify.close();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
