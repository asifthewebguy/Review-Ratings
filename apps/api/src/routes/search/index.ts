import type { FastifyInstance } from 'fastify';

export async function searchRoutes(app: FastifyInstance) {
  // GET /search/autocomplete?q=
  app.get('/autocomplete', async (request, reply) => {
    const { q } = request.query as { q?: string };
    if (!q || q.length < 2) {
      return reply.send({ success: true, data: [] });
    }

    try {
      const results = await app.meilisearch.index('businesses').search(q, {
        limit: 8,
        filter: 'isActive = true',
        attributesToRetrieve: ['id', 'name', 'categoryNameEn', 'categoryNameBn', 'categorySlug'],
      });
      return reply.send({ success: true, data: results.hits });
    } catch {
      // Fallback to DB
      const businesses = await app.prisma.business.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: 'insensitive' },
        },
        select: { id: true, name: true, category: { select: { nameEn: true, nameBn: true, slug: true } } },
        take: 8,
      });
      return reply.send({ success: true, data: businesses });
    }
  });
}
