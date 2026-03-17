import fp from 'fastify-plugin';
import { MeiliSearch } from 'meilisearch';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    meilisearch: MeiliSearch;
  }
}

export default fp(
  async (app: FastifyInstance) => {
    const client = new MeiliSearch({
      host: process.env.MEILISEARCH_URL ?? 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_MASTER_KEY,
    });

    // Configure businesses index (non-fatal — MeiliSearch may run without auth in dev)
    try {
      const index = client.index('businesses');
      await index.updateSettings({
        searchableAttributes: [
          'name',
          'description',
          'address',
          'categoryNameEn',
          'categoryNameBn',
        ],
        filterableAttributes: ['categorySlug', 'districtId', 'divisionId', 'isActive', 'isClaimed'],
        sortableAttributes: ['reviewCount', 'avgRating', 'trustScore', 'createdAt'],
        rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
      });
    } catch (err) {
      app.log.warn({ err }, 'MeiliSearch index configuration failed — search may be degraded');
    }

    app.decorate('meilisearch', client);
    app.addHook('onClose', async () => {});
  },
  { name: 'meilisearch' },
);
