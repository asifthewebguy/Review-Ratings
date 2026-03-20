import type { FastifyInstance } from 'fastify';

// ── Slug helpers ────────────────────────────────────────────
function generateProductSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

async function ensureUniqueProductSlug(base: string, app: FastifyInstance, excludeId?: string): Promise<string> {
  let slug = base || 'product';
  let suffix = 1;
  while (true) {
    const existing = await app.prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

// ── Rating recalculation ────────────────────────────────────
async function recalculateProductRating(app: FastifyInstance, productId: string) {
  const agg = await app.prisma.review.aggregate({
    where: { productId, status: 'published' },
    _avg: { rating: true },
    _count: { id: true },
  });
  await app.prisma.product.update({
    where: { id: productId },
    data: {
      avgRating: agg._avg.rating ?? null,
      reviewCount: agg._count.id,
    },
  });
}

// ── MeiliSearch sync ────────────────────────────────────────
async function syncProductToSearch(app: FastifyInstance, productId: string) {
  try {
    const product = await app.prisma.product.findUnique({
      where: { id: productId },
      include: {
        business: { select: { name: true, slug: true } },
        category: { select: { slug: true, nameEn: true, nameBn: true } },
      },
    });
    if (!product) return;
    await (app as any).meilisearch?.index('products').addDocuments([{
      id: product.id,
      slug: product.slug,
      name: product.name,
      nameBn: product.nameBn,
      description: product.description,
      categorySlug: product.category?.slug ?? null,
      categoryNameEn: product.category?.nameEn ?? null,
      businessName: product.business.name,
      businessSlug: product.business.slug,
      avgRating: product.avgRating ? parseFloat(String(product.avgRating)) : null,
      reviewCount: product.reviewCount,
      tags: product.tags,
    }]);
  } catch (err) {
    app.log.warn(err, 'Product MeiliSearch sync failed (non-fatal)');
  }
}

// ── Product select helper ───────────────────────────────────
const productSelect = {
  id: true,
  name: true,
  nameBn: true,
  description: true,
  imageUrl: true,
  slug: true,
  categoryId: true,
  tags: true,
  avgRating: true,
  reviewCount: true,
  isActive: true,
  createdAt: true,
  businessId: true,
  business: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, nameEn: true, nameBn: true, slug: true, icon: true } },
};

export async function productRoutes(app: FastifyInstance) {

  // GET /product-categories — list all active product categories
  app.get('/product-categories', async (_request, reply) => {
    const categories = await app.prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, nameEn: true, nameBn: true, slug: true, icon: true },
    });
    return reply.send({ success: true, data: categories });
  });

  // GET /products — search/list products
  app.get('/', async (request, reply) => {
    const { q, category, page: pageStr = '1', limit: limitStr = '20' } = request.query as {
      q?: string; category?: string; page?: string; limit?: string;
    };
    const page = Math.max(1, parseInt(pageStr, 10));
    const limit = Math.min(50, Math.max(1, parseInt(limitStr, 10)));
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (category) {
      const cat = await app.prisma.productCategory.findUnique({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { nameBn: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    const [items, total] = await Promise.all([
      app.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ reviewCount: 'desc' }, { createdAt: 'desc' }],
        select: productSelect,
      }),
      app.prisma.product.count({ where }),
    ]);

    return reply.send({ success: true, data: { items, total, page, limit } });
  });

  // POST /products — create a product (any authenticated user)
  app.post('/', { preHandler: app.authenticate }, async (request, reply) => {
    const userId = request.user.sub;
    const body = request.body as any;

    if (!body.businessId || !body.name || body.name.length < 2) {
      return reply.code(422).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'businessId and name (min 2 chars) are required' },
      });
    }
    if (body.name.length > 200) {
      return reply.code(422).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name must be 200 characters or fewer' },
      });
    }

    const business = await app.prisma.business.findUnique({ where: { id: body.businessId } });
    if (!business || !business.isActive) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business not found' },
      });
    }

    const baseSlug = body.slug ? body.slug : generateProductSlug(body.name);
    const slug = await ensureUniqueProductSlug(baseSlug, app);

    const tags: string[] = Array.isArray(body.tags)
      ? body.tags.slice(0, 10).map((t: string) => String(t).slice(0, 50))
      : [];

    const product = await app.prisma.product.create({
      data: {
        businessId: body.businessId,
        createdById: userId,
        name: body.name,
        nameBn: body.nameBn ?? null,
        description: body.description ?? null,
        imageUrl: body.imageUrl ?? null,
        slug,
        categoryId: body.categoryId ?? null,
        tags,
      },
      select: productSelect,
    });

    syncProductToSearch(app, product.id).catch(() => {});

    return reply.code(201).send({ success: true, data: product });
  });

  // GET /products/:slug — single product by slug
  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const product = await app.prisma.product.findUnique({
      where: { slug },
      select: productSelect,
    });

    if (!product || !product.isActive) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    return reply.send({ success: true, data: product });
  });

  // GET /products/:slug/reviews — paginated reviews for a product
  app.get('/:slug/reviews', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const query = request.query as any;
    const page = parseInt(query.page ?? '1', 10);
    const limit = Math.min(parseInt(query.limit ?? '10', 10), 50);
    const skip = (page - 1) * limit;

    const product = await app.prisma.product.findUnique({ where: { slug }, select: { id: true, isActive: true } });
    if (!product || !product.isActive) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    const [reviews, total] = await Promise.all([
      app.prisma.review.findMany({
        where: { productId: product.id, status: 'published' },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true, trustLevel: true } },
          reactions: { select: { type: true } },
          updates: { orderBy: { createdAt: 'asc' } },
          edits: { where: { status: 'pending' }, select: { id: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      app.prisma.review.count({ where: { productId: product.id, status: 'published' } }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return reply.send({ success: true, data: { items: reviews, total, page, totalPages } });
  });

  // POST /products/:slug/reviews — submit a review for a product
  app.post('/:slug/reviews', { preHandler: app.authenticate }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const userId = request.user.sub;
    const body = request.body as any;

    const product = await app.prisma.product.findUnique({ where: { slug }, select: { id: true, isActive: true, businessId: true } });
    if (!product || !product.isActive) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    // Require phone + email verification
    const reviewer = await app.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, verifiedAt: true, emailVerifiedAt: true },
    });
    if (!reviewer?.phone || !reviewer?.verifiedAt) {
      return reply.code(403).send({
        success: false,
        error: { code: 'PHONE_NOT_VERIFIED', message: 'Please verify your phone number before submitting a review' },
      });
    }
    if (!reviewer?.emailVerifiedAt) {
      return reply.code(403).send({
        success: false,
        error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email address before submitting a review' },
      });
    }

    // One review per product per user
    const existing = await app.prisma.review.findFirst({ where: { productId: product.id, userId } });
    if (existing) {
      return reply.code(409).send({
        success: false,
        error: { code: 'REVIEW_EXISTS', message: 'You have already reviewed this product' },
      });
    }

    const rating = parseInt(body.rating, 10);
    if (!rating || rating < 1 || rating > 5) {
      return reply.code(422).send({
        success: false,
        error: { code: 'INVALID_RATING', message: 'Rating must be 1–5' },
      });
    }
    if (!body.body || body.body.length < 20 || body.body.length > 1000) {
      return reply.code(422).send({
        success: false,
        error: { code: 'INVALID_BODY', message: 'Review must be 20–1000 characters' },
      });
    }

    const review = await app.prisma.review.create({
      data: {
        businessId: product.businessId,
        productId: product.id,
        userId,
        rating,
        body: body.body,
        photoUrls: body.photoUrls ?? [],
        ipAddress: request.ip,
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true, trustLevel: true } },
      },
    });

    recalculateProductRating(app, product.id)
      .then(() => syncProductToSearch(app, product.id))
      .catch((err) => app.log.error(err, 'Product rating recalc/sync failed'));

    return reply.code(201).send({ success: true, data: review });
  });
}
