import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { institutionRoutes } from './modules/institutions/institution.routes.js';
import { developerRoutes } from './modules/developer/developer.routes.js';

dotenv.config();

const port = Number(process.env.PORT) || 5000;
const host = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
  logger: true,
});

async function main() {
  try {
    await fastify.register(cors, {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
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
