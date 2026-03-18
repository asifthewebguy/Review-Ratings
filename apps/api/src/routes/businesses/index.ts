import type { FastifyInstance } from 'fastify';
import { BusinessService } from '../../services/business.service.js';
import { ReviewService } from '../../services/review.service.js';
import { cached, invalidate } from '../../lib/cache.js';

export async function businessRoutes(app: FastifyInstance) {
  const svc = new BusinessService(app.prisma, app.meilisearch);
  const reviewSvc = new ReviewService(app.prisma);

  // POST /businesses — create business
  app.post('/', { preHandler: app.authenticate }, async (request, reply) => {
    const body = request.body as any;

    if (!body.name) {
      return reply.code(422).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'name is required' },
      });
    }

    const baseSlug = body.slug ?? svc.generateSlug(body.name);
    const slug = await svc.ensureUniqueSlug(baseSlug);

    const business = await app.prisma.business.create({
      data: {
        slug,
        name: body.name,
        description: body.description ?? null,
        address: body.address ?? null,
        phone: body.phone ?? null,
        website: body.website ?? null,
        facebookUrl: body.facebookUrl ?? null,
        categoryId: body.categoryId,
        districtId: body.districtId,
        upazilaId: body.upazilaId ?? null,
      },
      include: { category: true, district: true },
    });

    // Sync to search in background (don't await)
    svc
      .syncToSearch(business.id)
      .catch((err) => app.log.error(err, 'Failed to sync business to search'));

    return reply.code(201).send({ success: true, data: business });
  });

  // GET /businesses — list / search businesses
  app.get('/', async (request, reply) => {
    const query = request.query as any;
    const page = parseInt(query.page ?? '1', 10);
    const limit = Math.min(parseInt(query.limit ?? '20', 10), 50);
    const skip = (page - 1) * limit;

    // Try MeiliSearch first when full-text query is provided
    if (query.q) {
      try {
        const filters: string[] = ['isActive = true'];
        if (query.category) filters.push(`categorySlug = "${query.category}"`);
        if (query.district_id) filters.push(`districtId = "${query.district_id}"`);
        if (query.min_rating) filters.push(`avgRating >= ${query.min_rating}`);

        const results = await app.meilisearch.index('businesses').search(query.q, {
          filter: filters.join(' AND '),
          limit,
          offset: skip,
          sort: query.sort === 'reviews' ? ['reviewCount:desc'] : ['trustScore:desc'],
        });

        return reply.send({
          success: true,
          data: results.hits,
          meta: { total: results.estimatedTotalHits, page, limit },
        });
      } catch (err) {
        app.log.warn(err, 'MeiliSearch failed, falling back to DB');
      }
    }

    // Fallback: Prisma ILIKE search
    const where: any = { isActive: true };
    if (query.category) where.category = { slug: query.category };
    if (query.district_id) where.districtId = query.district_id;
    if (query.min_rating) where.avgRating = { gte: parseFloat(query.min_rating) };
    if (query.q) {
      where.OR = [{ name: { contains: query.q, mode: 'insensitive' } }];
    }

    const [businesses, total] = await Promise.all([
      app.prisma.business.findMany({
        where,
        include: { category: true, district: true },
        skip,
        take: limit,
        orderBy: query.sort === 'reviews' ? { reviewCount: 'desc' } : { trustScore: 'desc' },
      }),
      app.prisma.business.count({ where }),
    ]);

    return reply.send({ success: true, data: businesses, meta: { total, page, limit } });
  });

  // GET /businesses/:slug — single business profile
  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const business = await cached(app.redis, `business:slug:${slug}`, 300, () =>
      app.prisma.business.findUnique({
        where: { slug },
        include: {
          category: { include: { subRatings: true } },
          district: { include: { division: true } },
          upazila: true,
          _count: { select: { reviews: { where: { status: 'published' } }, products: { where: { isActive: true } } } },
        },
      }),
    );

    if (!business) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business not found' },
      });
    }

    // Rating distribution
    const distribution = await app.prisma.review.groupBy({
      by: ['rating'],
      where: { businessId: business.id, status: 'published' },
      _count: true,
    });

    return reply.send({
      success: true,
      data: {
        ...business,
        ratingDistribution: distribution.reduce(
          (acc, d) => {
            acc[d.rating] = d._count;
            return acc;
          },
          {} as Record<number, number>,
        ),
      },
    });
  });

  // PATCH /businesses/:id — update (claimed owner or admin)
  app.patch('/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user;
    const body = request.body as any;

    const business = await app.prisma.business.findUnique({ where: { id } });
    if (!business) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business not found' },
      });
    }

    const isOwner = business.claimedBy === user.sub;
    const isAdmin = ['admin', 'moderator'].includes(user.role);
    if (!isOwner && !isAdmin) {
      return reply.code(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized' },
      });
    }

    const updated = await app.prisma.business.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        address: body.address,
        phone: body.phone,
        website: body.website,
        facebookUrl: body.facebookUrl,
        logoUrl: body.logoUrl,
        coverUrl: body.coverUrl,
        hours: body.hours,
      },
    });

    svc.syncToSearch(id).catch((err) => app.log.error(err, 'sync failed'));
    await invalidate(app.redis, 'business:slug:*');

    return reply.send({ success: true, data: updated });
  });

  // GET /businesses/:id/products — list active products for a business
  app.get('/:id/products', async (request, reply) => {
    const { id: businessId } = request.params as { id: string };
    const query = request.query as any;
    const page = parseInt(query.page ?? '1', 10);
    const limit = Math.min(parseInt(query.limit ?? '20', 10), 50);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      app.prisma.product.findMany({
        where: { businessId, isActive: true },
        select: {
          id: true, name: true, nameBn: true, description: true,
          imageUrl: true, slug: true, categoryId: true, tags: true,
          avgRating: true, reviewCount: true, createdAt: true,
          category: { select: { id: true, nameEn: true, nameBn: true, slug: true, icon: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      app.prisma.product.count({ where: { businessId, isActive: true } }),
    ]);

    return reply.send({ success: true, data: { items: products, total, page } });
  });

  // GET /businesses/:id/reviews — paginated reviews for a business
  app.get('/:id/reviews', async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as any;
    const page = parseInt(query.page ?? '1', 10);
    const limit = Math.min(parseInt(query.limit ?? '10', 10), 50);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      app.prisma.review.findMany({
        where: { businessId: id, status: 'published', productId: null },
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true, trustLevel: true },
          },
          response: true,
          flags: { select: { id: true } },
          updates: { orderBy: { createdAt: 'asc' } },
          edits: { where: { status: 'pending' }, select: { id: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      app.prisma.review.count({ where: { businessId: id, status: 'published', productId: null } }),
    ]);

    return reply.send({ success: true, data: reviews, meta: { total, page, limit } });
  });

  // POST /businesses/:id/reviews — submit a review for this business
  app.post('/:id/reviews', { preHandler: app.authenticate }, async (request, reply) => {
    const { id: businessId } = request.params as { id: string };
    const userId = request.user.sub;
    const body = request.body as any;
    const ip = request.ip;

    // Check business exists
    const business = await app.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Business not found' },
      });
    }

    // Require phone + email verification before submitting a review
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

    // Prevent self-review: business owner can't review their own business
    if (business.claimedBy === userId) {
      return reply.code(422).send({
        success: false,
        error: { code: 'SELF_REVIEW', message: 'Cannot review your own business' },
      });
    }

    // Check uniqueness (user can only review each business once)
    const existing = await app.prisma.review.findFirst({ where: { businessId, userId } });
    if (existing) {
      return reply.code(409).send({
        success: false,
        error: {
          code: 'DUPLICATE_REVIEW',
          message: 'You have already reviewed this business',
        },
      });
    }

    // Validate rating
    const rating = body.rating;
    if (!rating || rating < 1 || rating > 5) {
      return reply.code(422).send({
        success: false,
        error: { code: 'INVALID_RATING', message: 'Rating must be between 1 and 5' },
      });
    }

    // Validate body length
    if (!body.body || body.body.length < 20 || body.body.length > 1000) {
      return reply.code(422).send({
        success: false,
        error: { code: 'INVALID_BODY', message: 'Review must be 20-1000 characters' },
      });
    }

    // Create review — subRatings stored as JSON field
    const review = await app.prisma.review.create({
      data: {
        businessId,
        userId,
        rating: body.rating,
        body: body.body,
        photoUrls: body.photoUrls ?? [],
        language: body.language ?? 'bn',
        subRatings: body.subRatings ?? undefined,
        ipAddress: ip,
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });

    // Recalculate rating in background
    reviewSvc
      .recalculateBusinessRating(businessId)
      .catch((err) => app.log.error(err, 'Rating recalc failed'));

    return reply.code(201).send({ success: true, data: review });
  });

  // GET /businesses/:id/stats — rating trend and breakdown (claimed owner or admin)
  app.get('/:id/stats', {
    preHandler: app.authenticate,
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user;

    const business = await app.prisma.business.findUnique({ where: { id } });
    if (!business) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Business not found' } });
    }

    const isOwner = business.claimedBy === user.sub;
    const isAdmin = ['admin', 'moderator'].includes(user.role);
    if (!isOwner && !isAdmin) {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } });
    }

    // Rating distribution
    const distribution = await app.prisma.review.groupBy({
      by: ['rating'],
      where: { businessId: id, status: 'published' },
      _count: true,
    });

    // 30-day trend: count reviews per day for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReviews = await app.prisma.review.findMany({
      where: { businessId: id, status: 'published', createdAt: { gte: thirtyDaysAgo } },
      select: { rating: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const trendMap: Record<string, { count: number; ratingSum: number }> = {};
    recentReviews.forEach((r) => {
      const date = r.createdAt.toISOString().split('T')[0]!;
      if (!trendMap[date]) trendMap[date] = { count: 0, ratingSum: 0 };
      trendMap[date]!.count++;
      trendMap[date]!.ratingSum += r.rating;
    });

    const trend = Object.entries(trendMap).map(([date, { count, ratingSum }]) => ({
      date,
      count,
      avgRating: count > 0 ? parseFloat((ratingSum / count).toFixed(2)) : 0,
    }));

    // Response rate
    const totalPublished = await app.prisma.review.count({ where: { businessId: id, status: 'published' } });
    const responded = await app.prisma.response.count({ where: { businessId: id } });
    const responseRate = totalPublished > 0 ? parseFloat(((responded / totalPublished) * 100).toFixed(1)) : 0;

    return reply.send({
      success: true,
      data: {
        avgRating: business.avgRating ? Number(business.avgRating) : null,
        reviewCount: business.reviewCount,
        responseRate,
        ratingDistribution: distribution.reduce((acc, d) => {
          acc[d.rating] = d._count;
          return acc;
        }, {} as Record<number, number>),
        trend,
      },
    });
  });
}
