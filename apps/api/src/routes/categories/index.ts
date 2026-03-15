import type { FastifyInstance } from 'fastify';
import { cached } from '../../lib/cache.js';

export async function categoryRoutes(app: FastifyInstance) {
  // GET /api/v1/categories — all active categories with sub-rating definitions
  app.get('/', async (_request, reply) => {
    const categories = await cached(app.redis, 'categories:all', 3600, () =>
      app.prisma.category.findMany({
        where: { isActive: true, parentId: null },
        include: {
          subRatings: { orderBy: { sortOrder: 'asc' } },
          children: {
            where: { isActive: true },
            include: { subRatings: { orderBy: { sortOrder: 'asc' } } },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
    );
    return reply.send({ success: true, data: categories });
  });

  // GET /api/v1/categories/:slug
  app.get<{ Params: { slug: string } }>('/:slug', async (request, reply) => {
    const category = await app.prisma.category.findUnique({
      where: { slug: request.params.slug },
      include: { subRatings: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!category) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found' },
      });
    }

    return reply.send({ success: true, data: category });
  });
}
