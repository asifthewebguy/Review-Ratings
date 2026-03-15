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

    // Configure businesses index
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

    app.decorate('meilisearch', client);
    app.addHook('onClose', async () => {});
  },
  { name: 'meilisearch' },
);
