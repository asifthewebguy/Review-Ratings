import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_request, reply) => {
    const checks: Record<string, string> = {};

    // Check PostgreSQL
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      checks.database = 'healthy';
    } catch {
      checks.database = 'unhealthy';
    }

    // Check Redis
    try {
      const pong = await app.redis.ping();
      checks.redis = pong === 'PONG' ? 'healthy' : 'unhealthy';
    } catch {
      checks.redis = 'unhealthy';
    }

    const allHealthy = Object.values(checks).every((v) => v === 'healthy');

    return reply.status(allHealthy ? 200 : 503).send({
      success: allHealthy,
      data: {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: checks,
      },
    });
  });
}
