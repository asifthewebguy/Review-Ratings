import fp from 'fastify-plugin';
import Redis from 'ioredis';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

async function redis(app: FastifyInstance) {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  client.on('connect', () => {
    app.log.info('Connected to Redis');
  });

  client.on('error', (err) => {
    app.log.error({ err }, 'Redis connection error');
  });

  app.decorate('redis', client);

  app.addHook('onClose', async () => {
    await client.quit();
    app.log.info('Disconnected from Redis');
  });
}

export const redisPlugin = fp(redis, {
  name: 'redis',
});
