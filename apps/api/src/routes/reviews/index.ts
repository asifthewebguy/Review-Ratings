import type { FastifyInstance } from 'fastify';
import { ReviewService } from '../../services/review.service.js';

export async function reviewRoutes(app: FastifyInstance) {
  const svc = new ReviewService(app.prisma);

  // PATCH /reviews/:id — edit review (author only, within 48h)
  app.patch('/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.sub;
    const body = request.body as any;

    const review = await app.prisma.review.findUnique({ where: { id } });
    if (!review) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }
    if (review.userId !== userId) {
      return reply.code(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not your review' },
      });
    }

    const hoursSince = (Date.now() - review.createdAt.getTime()) / 3_600_000;
    if (hoursSince > 48) {
      return reply.code(422).send({
        success: false,
        error: {
          code: 'EDIT_WINDOW_EXPIRED',
          message: 'Reviews can only be edited within 48 hours',
        },
      });
    }

    // Validate body length if provided
    if (body.body !== undefined && (body.body.length < 20 || body.body.length > 1000)) {
      return reply.code(422).send({
        success: false,
        error: { code: 'INVALID_BODY', message: 'Review must be 20-1000 characters' },
      });
    }

    const updated = await app.prisma.review.update({
      where: { id },
      data: {
        rating: body.rating ?? review.rating,
        body: body.body ?? review.body,
        photoUrls: body.photoUrls ?? review.photoUrls,
        editedAt: new Date(),
      },
    });

    svc
      .recalculateBusinessRating(review.businessId)
      .catch((err) => app.log.error(err, 'Rating recalc failed'));

    return reply.send({ success: true, data: updated });
  });

  // DELETE /reviews/:id — soft delete (author or admin, within 48h for non-admin)
  app.delete('/:id', { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.sub;
    const isAdmin = ['admin', 'moderator'].includes(request.user.role);

    const review = await app.prisma.review.findUnique({ where: { id } });
    if (!review) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }
    if (review.userId !== userId && !isAdmin) {
      return reply.code(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized' },
      });
    }

    const hoursSince = (Date.now() - review.createdAt.getTime()) / 3_600_000;
    if (hoursSince > 48 && !isAdmin) {
      return reply.code(422).send({
        success: false,
        error: {
          code: 'DELETE_WINDOW_EXPIRED',
          message: 'Reviews can only be deleted within 48 hours',
        },
      });
    }

    await app.prisma.review.update({
      where: { id },
      data: { status: 'removed', removalReason: isAdmin ? 'admin_removed' : 'user_deleted' },
    });

    svc
      .recalculateBusinessRating(review.businessId)
      .catch((err) => app.log.error(err, 'Rating recalc failed'));

    return reply.send({ success: true });
  });

  // POST /reviews/:id/flag — flag a review
  app.post('/:id/flag', { preHandler: app.authenticate }, async (request, reply) => {
    const { id: reviewId } = request.params as { id: string };
    const reporterId = request.user.sub;
    const body = request.body as any;

    const review = await app.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    // Check duplicate flag from this reporter
    const existing = await app.prisma.flag.findUnique({
      where: { reviewId_reporterId: { reviewId, reporterId } },
    });
    if (existing) {
      return reply.code(409).send({
        success: false,
        error: { code: 'ALREADY_FLAGGED', message: 'Already flagged' },
      });
    }

    const validReasons = ['fake', 'offensive', 'irrelevant', 'conflict', 'other'];
    const reason = body.reason ?? 'other';
    if (!validReasons.includes(reason)) {
      return reply.code(422).send({
        success: false,
        error: { code: 'INVALID_REASON', message: `Reason must be one of: ${validReasons.join(', ')}` },
      });
    }

    const flag = await app.prisma.flag.create({
      data: {
        reviewId,
        reporterId,
        reason,
        detail: body.detail ?? null,
      },
    });

    // Auto-flag review if 3+ flags
    const flagCount = await app.prisma.flag.count({ where: { reviewId } });
    if (flagCount >= 3 && review.status === 'published') {
      await app.prisma.review.update({
        where: { id: reviewId },
        data: { status: 'flagged', flagCount },
      });
    } else {
      await app.prisma.review.update({
        where: { id: reviewId },
        data: { flagCount },
      });
    }

    return reply.code(201).send({ success: true, data: flag });
  });

  // POST /reviews/:id/response — business owner responds to a review
  app.post('/:id/response', { preHandler: app.authenticate }, async (request, reply) => {
    const { id: reviewId } = request.params as { id: string };
    const userId = request.user.sub;
    const body = request.body as any;

    const review = await app.prisma.review.findUnique({
      where: { id: reviewId },
      include: { business: true },
    });
    if (!review) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    // Only the business owner or admin can respond
    if (review.business.claimedBy !== userId && request.user.role !== 'admin') {
      return reply.code(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only the business owner can respond' },
      });
    }

    // One response per review
    const existing = await app.prisma.response.findUnique({ where: { reviewId } });
    if (existing) {
      return reply.code(409).send({
        success: false,
        error: { code: 'DUPLICATE_RESPONSE', message: 'Already responded' },
      });
    }

    if (!body.body || body.body.length > 500) {
      return reply.code(422).send({
        success: false,
        error: { code: 'INVALID_BODY', message: 'Response must be 1-500 characters' },
      });
    }

    const response = await app.prisma.response.create({
      data: {
        reviewId,
        businessId: review.businessId,
        body: body.body,
      },
    });

    return reply.code(201).send({ success: true, data: response });
  });

  // PATCH /reviews/:id/response — edit response (business owner, within 24h)
  app.patch('/:id/response', {
    preHandler: app.authenticate,
  }, async (request, reply) => {
    const { id: reviewId } = request.params as { id: string };
    const userId = request.user.sub;
    const body = request.body as any;

    const response = await app.prisma.response.findUnique({
      where: { reviewId },
      include: { business: true },
    });
    if (!response) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Response not found' } });
    }

    if (response.business.claimedBy !== userId && request.user.role !== 'admin') {
      return reply.code(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } });
    }

    // 24h edit lock
    const hoursSince = (Date.now() - response.createdAt.getTime()) / 3_600_000;
    if (hoursSince > 24) {
      return reply.code(422).send({ success: false, error: { code: 'EDIT_LOCKED', message: 'Response can only be edited within 24 hours' } });
    }

    if (body.body?.length > 500) {
      return reply.code(422).send({ success: false, error: { code: 'TOO_LONG', message: 'Response max 500 characters' } });
    }

    const updated = await app.prisma.response.update({
      where: { reviewId },
      data: { body: body.body, isEdited: true },
    });

    return reply.send({ success: true, data: updated });
  });
}
