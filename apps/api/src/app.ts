import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { prismaPlugin } from './plugins/prisma.js';
import { redisPlugin } from './plugins/redis.js';
import { jwtPlugin } from './plugins/jwt.js';
import meiliSearchPlugin from './plugins/meilisearch.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth/index.js';
import { locationRoutes } from './routes/locations/index.js';
import { categoryRoutes } from './routes/categories/index.js';
import { userRoutes } from './routes/users/index.js';
import { businessRoutes } from './routes/businesses/index.js';
import { claimRoutes } from './routes/businesses/claim.js';
import { reviewRoutes } from './routes/reviews/index.js';
import { searchRoutes } from './routes/search/index.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // ── Security & CORS ────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
  });

  await app.register(cors, {
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // ── Core plugins ───────────────────────────────────────
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(jwtPlugin);
  await app.register(meiliSearchPlugin);

  // ── Routes ─────────────────────────────────────────────
  await app.register(healthRoutes, { prefix: '/api/v1' });
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(locationRoutes, { prefix: '/api/v1/locations' });
  await app.register(categoryRoutes, { prefix: '/api/v1/categories' });
  await app.register(userRoutes, { prefix: '/api/v1/users' });
  await app.register(businessRoutes, { prefix: '/api/v1/businesses' });
  await app.register(claimRoutes, { prefix: '/api/v1/businesses' });
  await app.register(reviewRoutes, { prefix: '/api/v1/reviews' });
  await app.register(searchRoutes, { prefix: '/api/v1/search' });

  return app;
}
