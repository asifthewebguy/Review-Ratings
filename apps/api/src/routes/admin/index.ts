import type { FastifyInstance } from 'fastify';
import { ReviewService } from '../../services/review.service.js';

export async function adminRoutes(app: FastifyInstance) {
  const svc = new ReviewService(app.prisma);

  // ── FLAG QUEUE ─────────────────────────────────────────

  // GET /admin/flags — list flagged reviews (pending flags, sorted by flag count)
  app.get('/flags', { preHandler: [app.authenticate, app.requireRole('moderator')] }, async (request, reply) => {
    const query = request.query as any;
    const status = query.status ?? 'pending';
    const page = parseInt(query.page ?? '1', 10);
    const limit = Math.min(parseInt(query.limit ?? '20', 10), 50);

    const [flags, total] = await Promise.all([
      app.prisma.flag.findMany({
        where: { status },
        include: {
          review: {
            include: {
              user: { select: { id: true, displayName: true, phone: true } },
              business: { select: { id: true, name: true, slug: true } },
            },
          },
          reporter: { select: { id: true, displayName: true } },
          resolver: { select: { id: true, displayName: true } },
        },
        orderBy: { review: { flagCount: 'desc' } },
        skip: (page - 1) * limit,
        take: limit,
      }),
      app.prisma.flag.count({ where: { status } }),
    ]);

    return reply.send({ success: true, data: flags, meta: { total, page, limit } });
  });

  // PATCH /admin/flags/:id — resolve a flag (approve removal, dismiss)
  app.patch('/flags/:id', { preHandler: [app.authenticate, app.requireRole('moderator')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const userId = request.user.sub;

    // action: 'remove_review' | 'dismiss'
    if (!['remove_review', 'dismiss'].includes(body.action)) {
      return reply.code(422).send({ success: false, error: { code: 'INVALID_ACTION', message: 'action must be remove_review or dismiss' } });
    }

    const flag = await app.prisma.flag.findUnique({ where: { id }, include: { review: true } });
    if (!flag) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Flag not found' } });
    }

    // Update flag status
    const updatedFlag = await app.prisma.flag.update({
      where: { id },
      data: { status: 'reviewed', resolvedBy: userId, resolvedAt: new Date() },
    });

    // If removing review, update its status
    if (body.action === 'remove_review') {
      await app.prisma.review.update({
        where: { id: flag.reviewId },
        data: { status: 'removed', removalReason: body.reason ?? 'Removed by moderator' },
      });
    }

    return reply.send({ success: true, data: updatedFlag });
  });

  // ── CLAIM QUEUE ────────────────────────────────────────

  // GET /admin/claims — list pending claims
  app.get('/claims', { preHandler: [app.authenticate, app.requireRole('moderator')] }, async (request, reply) => {
    const query = request.query as any;
    const status = query.status ?? 'pending';
    const page = parseInt(query.page ?? '1', 10);
    const limit = Math.min(parseInt(query.limit ?? '20', 10), 50);

    const [claims, total] = await Promise.all([
      app.prisma.claim.findMany({
        where: { status },
        include: {
          business: { select: { id: true, name: true, slug: true, isClaimed: true } },
          user: { select: { id: true, displayName: true, phone: true } },
          reviewer: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      app.prisma.claim.count({ where: { status } }),
    ]);

    return reply.send({ success: true, data: claims, meta: { total, page, limit } });
  });

  // PATCH /admin/claims/:id — approve or reject a claim
  app.patch('/claims/:id', { preHandler: [app.authenticate, app.requireRole('moderator')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const userId = request.user.sub;

    if (!['approved', 'rejected'].includes(body.status)) {
      return reply.code(422).send({ success: false, error: { code: 'INVALID_STATUS', message: 'status must be approved or rejected' } });
    }

    const claim = await app.prisma.claim.findUnique({ where: { id } });
    if (!claim) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Claim not found' } });
    }
    if (claim.status !== 'pending') {
      return reply.code(409).send({ success: false, error: { code: 'ALREADY_RESOLVED', message: 'Claim already resolved' } });
    }

    const updatedClaim = await app.prisma.claim.update({
      where: { id },
      data: {
        status: body.status,
        rejectionReason: body.rejectionReason ?? null,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });

    // On approval: mark business as claimed, set claimedBy, update user role
    if (body.status === 'approved') {
      await app.prisma.business.update({
        where: { id: claim.businessId },
        data: { isClaimed: true, claimedBy: claim.userId },
      });
      // Elevate user to business_owner role if still 'user'
      await app.prisma.user.updateMany({
        where: { id: claim.userId, role: 'user' },
        data: { role: 'business_owner' },
      });
    }

    return reply.send({ success: true, data: updatedClaim });
  });

  // ── EDIT QUEUE ───────────────────────────────────────

  // GET /admin/edit-queue — list pending review edits
  app.get('/edit-queue', { preHandler: [app.authenticate, app.requireRole('moderator')] }, async (request, reply) => {
    const query = request.query as any;
    const status = query.status ?? 'pending';
    const page = parseInt(query.page ?? '1', 10);
    const limit = Math.min(parseInt(query.limit ?? '20', 10), 50);

    const [edits, total] = await Promise.all([
      app.prisma.reviewEdit.findMany({
        where: { status },
        include: {
          review: {
            include: {
              user: { select: { id: true, displayName: true } },
              business: { select: { id: true, name: true, slug: true } },
            },
          },
          reviewer: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      app.prisma.reviewEdit.count({ where: { status } }),
    ]);

    return reply.send({ success: true, data: edits, meta: { total, page, limit } });
  });

  // PATCH /admin/edits/:id — approve or reject a review edit
  app.patch('/edits/:id', { preHandler: [app.authenticate, app.requireRole('moderator')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const userId = request.user.sub;

    if (!['approve', 'reject'].includes(body.action)) {
      return reply.code(422).send({ success: false, error: { code: 'INVALID_ACTION', message: 'action must be approve or reject' } });
    }

    const edit = await app.prisma.reviewEdit.findUnique({
      where: { id },
      include: { review: true },
    });
    if (!edit) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Edit not found' } });
    }
    if (edit.status !== 'pending') {
      return reply.code(409).send({ success: false, error: { code: 'ALREADY_RESOLVED', message: 'Edit already resolved' } });
    }

    if (body.action === 'approve') {
      // Preserve the original body/rating on first approved edit
      const updateData: any = {
        rating: edit.rating,
        body: edit.body,
        photoUrls: edit.photoUrls,
        editedAt: new Date(),
      };
      if (!edit.review.originalBody) {
        updateData.originalBody = edit.review.body;
        updateData.originalRating = edit.review.rating;
      }

      await app.prisma.review.update({
        where: { id: edit.reviewId },
        data: updateData,
      });

      await app.prisma.reviewEdit.update({
        where: { id },
        data: { status: 'approved', reviewedBy: userId, reviewedAt: new Date() },
      });

      svc
        .recalculateBusinessRating(edit.review.businessId)
        .catch((err) => app.log.error(err, 'Rating recalc failed'));
    } else {
      await app.prisma.reviewEdit.update({
        where: { id },
        data: { status: 'rejected', reviewedBy: userId, reviewedAt: new Date() },
      });
    }

    return reply.send({ success: true });
  });

  // ── ANALYTICS ─────────────────────────────────────────

  // GET /admin/analytics — platform overview stats
  app.get('/analytics', { preHandler: [app.authenticate, app.requireRole('moderator')] }, async (_request, reply) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      totalBusinesses,
      totalReviews,
      totalClaims,
      recentReviews,
      recentUsers,
      pendingFlags,
      pendingClaims,
      flaggedReviews,
      pendingEdits,
    ] = await Promise.all([
      app.prisma.user.count(),
      app.prisma.business.count({ where: { isActive: true } }),
      app.prisma.review.count({ where: { status: 'published' } }),
      app.prisma.claim.count(),
      app.prisma.review.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      app.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      app.prisma.flag.count({ where: { status: 'pending' } }),
      app.prisma.claim.count({ where: { status: 'pending' } }),
      app.prisma.review.count({ where: { status: 'flagged' } }),
      app.prisma.reviewEdit.count({ where: { status: 'pending' } }),
    ]);

    // Daily review counts for last 7 days
    const dailyReviews = await app.prisma.review.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    });
    const dailyMap: Record<string, number> = {};
    dailyReviews.forEach((r) => {
      const date = r.createdAt.toISOString().split('T')[0]!;
      dailyMap[date] = (dailyMap[date] ?? 0) + 1;
    });
    const dailyTrend = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return reply.send({
      success: true,
      data: {
        totals: { users: totalUsers, businesses: totalBusinesses, reviews: totalReviews, claims: totalClaims },
        queues: { pendingFlags, pendingClaims, flaggedReviews, pendingEdits },
        recent: { reviews: recentReviews, users: recentUsers },
        dailyTrend,
      },
    });
  });

  // ── USER MANAGEMENT ───────────────────────────────────

  // GET /admin/users?phone=&page= — search users
  app.get('/users', { preHandler: [app.authenticate, app.requireRole('admin')] }, async (request, reply) => {
    const query = request.query as any;
    const page = parseInt(query.page ?? '1', 10);
    const limit = 20;

    const where: any = {};
    if (query.phone) where.phone = { contains: query.phone };
    if (query.role) where.role = query.role;

    const [users, total] = await Promise.all([
      app.prisma.user.findMany({
        where,
        select: {
          id: true, phone: true, displayName: true, role: true,
          trustLevel: true, isActive: true, createdAt: true,
          _count: { select: { reviews: true, claims: { where: { status: 'approved' } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      app.prisma.user.count({ where }),
    ]);

    return reply.send({ success: true, data: users, meta: { total, page, limit } });
  });

  // PATCH /admin/users/:id — suspend or change role
  app.patch('/users/:id', { preHandler: [app.authenticate, app.requireRole('admin')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const allowedRoles = ['user', 'business_owner', 'moderator', 'admin'];
    if (body.role && !allowedRoles.includes(body.role)) {
      return reply.code(422).send({ success: false, error: { code: 'INVALID_ROLE', message: 'Invalid role' } });
    }

    const updated = await app.prisma.user.update({
      where: { id },
      data: {
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.role ? { role: body.role } : {}),
      },
      select: { id: true, phone: true, displayName: true, role: true, isActive: true },
    });

    return reply.send({ success: true, data: updated });
  });
}
