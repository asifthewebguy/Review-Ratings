import type { FastifyInstance } from 'fastify';
import { UpdateUserSchema } from '@review-ratings/shared';

export async function userRoutes(app: FastifyInstance) {
  // GET /api/v1/users/me
  app.get('/me', { preHandler: app.authenticate }, async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user.sub },
      select: {
        id: true,
        phone: true,
        displayName: true,
        avatarUrl: true,
        trustLevel: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    return reply.send({ success: true, data: user });
  });

  // PATCH /api/v1/users/me
  app.patch('/me', { preHandler: app.authenticate }, async (request, reply) => {
    const result = UpdateUserSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid input' },
      });
    }

    const { displayName, avatarUrl } = result.data;
    const user = await app.prisma.user.update({
      where: { id: request.user.sub },
      data: {
        ...(displayName && { displayName }),
        ...(avatarUrl && { avatarUrl }),
      },
      select: {
        id: true,
        phone: true,
        displayName: true,
        avatarUrl: true,
        trustLevel: true,
        role: true,
        createdAt: true,
      },
    });

    return reply.send({ success: true, data: user });
  });

  // GET /api/v1/users/me/reviews
  app.get('/me/reviews', { preHandler: app.authenticate }, async (request, reply) => {
    const page = Math.max(1, parseInt((request.query as { page?: string }).page ?? '1'));
    const limit = Math.min(20, parseInt((request.query as { limit?: string }).limit ?? '20'));

    const [reviews, total] = await Promise.all([
      app.prisma.review.findMany({
        where: { userId: request.user.sub, status: { not: 'removed' } },
        include: {
          business: { select: { id: true, name: true, slug: true, logoUrl: true } },
          response: { select: { body: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      app.prisma.review.count({
        where: { userId: request.user.sub, status: { not: 'removed' } },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        items: reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  // GET /users/me/businesses — get businesses claimed by current user
  app.get('/me/businesses', {
    preHandler: app.authenticate,
  }, async (request, reply) => {
    const userId = request.user.sub;

    const businesses = await app.prisma.business.findMany({
      where: { claimedBy: userId, isActive: true },
      include: {
        category: true,
        district: true,
        _count: { select: { reviews: { where: { status: 'published' } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: businesses });
  });

  // GET /users/me/claims — get claim submissions by current user
  app.get('/me/claims', {
    preHandler: app.authenticate,
  }, async (request, reply) => {
    const userId = request.user.sub;

    const claims = await app.prisma.claim.findMany({
      where: { userId },
      include: { business: { select: { id: true, name: true, slug: true, logoUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: claims });
  });
}
