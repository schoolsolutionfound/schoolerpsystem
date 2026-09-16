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
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { academicsRoutes } from './modules/academics/academics.routes.js';
import { institutionRoutes } from './modules/institutions/institution.routes.js';
import { developerRoutes } from './modules/developer/developer.routes.js';

const port = Number(process.env.PORT) || 5000;
const host = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
  logger: true,
});

async function main() {
  try {
    const allowedOrigins = (process.env.CORS_ORIGINS || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    await fastify.register(cors, {
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
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
        await apiV1.register(institutionRoutes, { prefix: '/institutions' });
        await apiV1.register(developerRoutes, { prefix: '/developer' });
      },
      { prefix: '/api/v1' }
    );

    await fastify.listen({ port, host });
    console.log(`🚀 Fastify Backend Server running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
