import type { FastifyInstance } from 'fastify';

export async function searchRoutes(app: FastifyInstance) {
  // GET /search/autocomplete?q=
  // Returns { businesses: [...], products: [...] }
  app.get('/autocomplete', async (request, reply) => {
    const { q } = request.query as { q?: string };
    if (!q || q.length < 2) {
      return reply.send({ success: true, data: { businesses: [], products: [] } });
    }

    try {
      const [businessResults, productResults] = await Promise.allSettled([
        (app as any).meilisearch?.index('businesses').search(q, {
          limit: 8,
          filter: 'isActive = true',
          attributesToRetrieve: ['id', 'slug', 'name', 'categoryNameEn', 'categoryNameBn', 'categorySlug'],
        }),
        (app as any).meilisearch?.index('products').search(q, {
          limit: 8,
          attributesToRetrieve: ['id', 'slug', 'name', 'nameBn', 'categoryNameEn', 'businessName', 'businessSlug', 'avgRating', 'reviewCount'],
        }),
      ]);

      const businesses = businessResults.status === 'fulfilled' ? (businessResults.value?.hits ?? []) : [];
      const products = productResults.status === 'fulfilled' ? (productResults.value?.hits ?? []) : [];

      // If both MeiliSearch queries failed, fall back to DB
      if (businessResults.status === 'rejected' && productResults.status === 'rejected') {
        throw new Error('MeiliSearch unavailable');
      }

      return reply.send({ success: true, data: { businesses, products } });
    } catch {
      // Fallback to DB for both
      const [businesses, products] = await Promise.all([
        app.prisma.business.findMany({
          where: { isActive: true, name: { contains: q, mode: 'insensitive' } },
          select: {
            id: true, slug: true, name: true,
            category: { select: { nameEn: true, nameBn: true, slug: true } },
          },
          take: 8,
        }),
        app.prisma.product.findMany({
          where: { isActive: true, name: { contains: q, mode: 'insensitive' } },
          select: {
            id: true, slug: true, name: true, nameBn: true, avgRating: true, reviewCount: true,
            business: { select: { name: true, slug: true } },
            category: { select: { nameEn: true, nameBn: true, slug: true } },
          },
          take: 8,
        }),
      ]);
      return reply.send({ success: true, data: { businesses, products } });
    }
  });
}
