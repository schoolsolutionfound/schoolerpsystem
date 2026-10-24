/**
 * @file index.ts
 * @description SchoolHub Fastify backend server entry point.
 *
 * Responsibilities:
 *  - Registers @fastify/helmet for security headers
 *  - Registers @fastify/cors with environment-configured allowed origins
 *  - Registers @fastify/rate-limit (default: 300 req/min per IP)
 *  - Mounts all API v1 route modules under /api/v1
 *  - Exposes a /health endpoint for uptime checks
 *  - Provides a global error handler and 404 handler matching the API envelope
 *
 * Environment variables (see server/.env.example):
 *  PORT            — HTTP port to bind (default: 5000)
 *  HOST            — Host to bind (default: 0.0.0.0)
 *  CORS_ORIGINS    — Comma-separated list of allowed origins
 *  RATE_LIMIT_MAX  — Max requests per minute per IP
 *  TRUST_PROXY     — "true" or CIDR list — ONLY when behind a reverse proxy
 *  BODY_LIMIT      — Max request body size in bytes (default: 1 MB)
 *  REQUEST_TIMEOUT — Request timeout in ms (default: 30s)
 */

import 'dotenv/config';
import Fastify, { type FastifyError } from 'fastify';
import cors, { type OriginFunction } from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { academicsRoutes } from './modules/academics/academics.routes.js';
import { developerRoutes } from './modules/developer/developer.routes.js';
import { notificationRoutes } from './modules/notifications/notification.routes.js';
import { emailWebhookRoutes } from './modules/notifications/email.webhook.routes.js';
import { emailConfigRoutes } from './modules/notifications/email.config.routes.js';
import { startNotificationQueue, stopNotificationQueue } from './modules/notifications/notification.queue.js';
import { libraryRoutes } from './modules/library/library.routes.js';
import { announcementRoutes } from './modules/announcements/announcement.routes.js';
import { startAnnouncementScheduler, stopAnnouncementScheduler } from './modules/announcements/announcement.scheduler.js';
import { payrollRoutes } from './modules/payroll/payroll.routes.js';
import { startPayrollScheduler, stopPayrollScheduler } from './modules/payroll/payroll.scheduler.js';
import { admissionsRoutes } from './modules/admissions/admissions.routes.js';
import { paymentRoutes } from './modules/payments/payment.routes.js';
import { startPaymentOrderSweeper, stopPaymentOrderSweeper } from './modules/payments/payment.sweeper.js';
import { isEncryptionReady } from './modules/shared/utils/encryption.js';
import { transportRoutes } from './modules/transport/transport.routes.js';
import { announcementsRoutes } from './modules/announcements/announcements.routes.js';
import { counselingRoutes } from './modules/counseling/counseling.routes.js';
import { hodRoutes } from './modules/hod/hod.routes.js';

const port = Number(process.env.PORT) || 5000;
const host = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * trustProxy must be enabled only when the server sits behind a reverse proxy
 * (nginx, Caddy, CDN, Vercel/Heroku etc.) — otherwise req.ip (and therefore the
 * rate-limit keys) would come from the X-Forwarded-For header, which clients
 * can spoof.
 *
 * SECURITY: NEVER set TRUST_PROXY=true in production. Instead, set it to the
 * proxy's specific CIDR (e.g. "127.0.0.1" or "10.0.0.0/8"). Setting "true"
 * tells Fastify to trust X-Forwarded-For from ANY client, which allows an
 * attacker to spoof their IP and rotate rate-limit buckets at will.
 */
const trustProxyEnv = (process.env.TRUST_PROXY || '').trim();
const trustProxy = trustProxyEnv === '' ? false : trustProxyEnv === 'true' ? true : trustProxyEnv;

// Request body and timeout guards (slowloris protection + upload safety)
const bodyLimit = Number(process.env.BODY_LIMIT) || 1_048_576; // 1 MB
const requestTimeout = Number(process.env.REQUEST_TIMEOUT) || 30_000; // 30s
const connectionTimeout = Number(process.env.CONNECTION_TIMEOUT) || 10_000; // 10s

const fastify = Fastify({
  logger: {
    level: isProduction ? 'warn' : 'info',
  },
  trustProxy,
  bodyLimit,
  requestTimeout,
  connectionTimeout,
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
    // Security headers: X-Content-Type-Options, X-Frame-Options, HSTS, etc.
    // When behind a reverse proxy that terminates TLS, enable HSTS:
    await fastify.register(helmet, {
      contentSecurityPolicy: false, // app uses inline scripts in dev; set in proxy
      crossOriginEmbedderPolicy: false,
      // HSTS only makes sense when served over HTTPS (i.e. behind a TLS proxy)
      strictTransportSecurity: isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    });

    await fastify.register(cors, {
      origin: buildCorsOrigin(),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    });

    // Rate limiting is a production safety control only. Local development
    // bursts past per-route limits (Fast Refresh reloads and logout/login
    // testing each call POST /auth/login-sync, capped at 30/min), which used
    // to 429 the app and trigger spurious Firestore fallbacks. Note: route-level
    // `config.rateLimit` overrides are inert unless this plugin is registered.
    // To exercise rate limiting locally, run with NODE_ENV=production.
    if (isProduction) {
      await fastify.register(rateLimit, {
        max: Number(process.env.RATE_LIMIT_MAX) || 300,
        timeWindow: '1 minute',
        // With trustProxy set to a specific CIDR, req.ip correctly resolves to
        // the real client IP from X-Forwarded-For. With trustProxy=false, it
        // resolves to the socket IP (correct for direct connections).
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
    }

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
        await apiV1.register(emailWebhookRoutes, { prefix: '/email/webhook' });
        await apiV1.register(emailConfigRoutes, { prefix: '/email' });
        await apiV1.register(libraryRoutes, { prefix: '/library' });
        await apiV1.register(announcementRoutes, { prefix: '/announcements' });
        await apiV1.register(admissionsRoutes, { prefix: '/admissions' });
        await apiV1.register(paymentRoutes, { prefix: '/payments' });
        await apiV1.register(payrollRoutes, { prefix: '/payroll' });
        await apiV1.register(transportRoutes, { prefix: '/transport' });
        await apiV1.register(announcementsRoutes, { prefix: '/principal-notices' });
        await apiV1.register(counselingRoutes, { prefix: '/admin/counseling' });
        await apiV1.register(hodRoutes, { prefix: '/admin/hod' });

        // 404 handler for /api/v1/* �?" matches the API error envelope
        apiV1.setNotFoundHandler(async (request, reply) => {
          return reply.status(404).send({
            success: false,
            error: {
              message: `Route ${request.method} ${request.url} not found.`,
              code: 'NOT_FOUND',
            },
          });
        });
      },
      { prefix: '/api/v1' }
    );

    // Root-level 404 handler (for paths outside /api/v1)
    fastify.setNotFoundHandler(async (request, reply) => {
      return reply.status(404).send({
        success: false,
        error: {
          message: `Route ${request.method} ${request.url} not found.`,
          code: 'NOT_FOUND',
        },
      });
    });

    // Global error handler — never leak stack traces or internals in production
    fastify.setErrorHandler((error: FastifyError, request, reply) => {
      const statusCode = error.statusCode || 500;
      const code = error.code || 'INTERNAL_ERROR';

      // In development, include the stack for debugging.
      // In production, log it server-side but never send it to the client.
      if (isProduction) {
        fastify.log.error({ err: error, req: request.method, url: request.url }, 'Unhandled error');
      } else {
        fastify.log.error(error);
      }

      // Don't leak internals for 5xx errors in production
      const message =
        statusCode >= 500 && isProduction
          ? 'Internal server error. Please try again later.'
          : error.message || 'Internal server error';

      return reply.status(statusCode).send({
        success: false,
        error: {
          message,
          code,
          ...(isProduction ? {} : { stack: error.stack }),
        },
      });
    });

    fastify.addHook('onClose', async () => {
      stopAnnouncementScheduler();
      stopPaymentOrderSweeper();
      stopPayrollScheduler();
    });

    await fastify.listen({ port, host });
    startAnnouncementScheduler();
    startPaymentOrderSweeper();
    startPayrollScheduler();

    if (!isEncryptionReady()) {
      console.warn(
        '⚠️  PAYMENT_CONFIG_MASTER_KEY is missing/invalid — per-tenant payment credentials cannot be stored or read.'
      );
    }

    const proxyLabel =
      trustProxy === false
        ? 'disabled (direct connection)'
        : trustProxy === true
          ? 'ENABLED (all proxies — NOT recommended for production)'
          : `restricted to ${String(trustProxy)}`;

    console.log(`🚀 Fastify Backend Server running on http://${host}:${port}`);
    console.log(`   Environment:  ${isProduction ? 'production' : 'development'}`);
    console.log(`   trustProxy:   ${proxyLabel}`);
    console.log(`   rateLimit:    ${isProduction ? `enabled (${Number(process.env.RATE_LIMIT_MAX) || 300} req/min per IP)` : 'disabled (development)'}`);
    console.log(`   bodyLimit:    ${bodyLimit} bytes`);
    console.log(`   timeouts:     request=${requestTimeout}ms connection=${connectionTimeout}ms`);

    // Start notification queue processor
    startNotificationQueue();

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      stopNotificationQueue();
      stopAnnouncementScheduler();
      stopPaymentOrderSweeper();
      stopPayrollScheduler();
      try {
        await fastify.close();
        console.log('✅ Server closed cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
      }
      // Force exit if close hangs (e.g. open DB connections)
      setTimeout(() => {
        console.error('⏰ Shutdown timed out after 10s, forcing exit.');
        process.exit(1);
      }, 10_000).unref();
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
