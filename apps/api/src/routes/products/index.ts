import type { FastifyInstance } from 'fastify';

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

export async function productRoutes(app: FastifyInstance) {
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

    const product = await app.prisma.product.create({
      data: {
        businessId: body.businessId,
        createdById: userId,
        name: body.name,
        nameBn: body.nameBn ?? null,
        description: body.description ?? null,
        imageUrl: body.imageUrl ?? null,
      },
    });

    return reply.code(201).send({ success: true, data: product });
  });

  // GET /products/:id — single product
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const product = await app.prisma.product.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        _count: { select: { reviews: true } },
      },
    });

    if (!product || !product.isActive) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    return reply.send({ success: true, data: product });
  });

  // GET /products/:id/reviews — paginated reviews for a product
  app.get('/:id/reviews', async (request, reply) => {
    const { id: productId } = request.params as { id: string };
    const query = request.query as any;
    const page = parseInt(query.page ?? '1', 10);
    const limit = Math.min(parseInt(query.limit ?? '10', 10), 50);
    const skip = (page - 1) * limit;

    const product = await app.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    const [reviews, total] = await Promise.all([
      app.prisma.review.findMany({
        where: { productId, status: 'published' },
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
      app.prisma.review.count({ where: { productId, status: 'published' } }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return reply.send({ success: true, data: { items: reviews, total, page, totalPages } });
  });

  // POST /products/:id/reviews — submit a review for a product
  app.post('/:id/reviews', { preHandler: app.authenticate }, async (request, reply) => {
    const { id: productId } = request.params as { id: string };
    const userId = request.user.sub;
    const body = request.body as any;

    const product = await app.prisma.product.findUnique({ where: { id: productId } });
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
    const existing = await app.prisma.review.findFirst({ where: { productId, userId } });
    if (existing) {
      return reply.code(409).send({
        success: false,
        error: { code: 'REVIEW_EXISTS', message: 'You have already reviewed this product' },
      });
    }

    // Validate rating and body
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
        productId,
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

    recalculateProductRating(app, productId).catch((err) =>
      app.log.error(err, 'Product rating recalc failed'),
    );

    return reply.code(201).send({ success: true, data: review });
  });
}
