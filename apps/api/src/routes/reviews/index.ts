import type { FastifyInstance } from 'fastify';
import { ReviewService } from '../../services/review.service.js';

export async function reviewRoutes(app: FastifyInstance) {
  const svc = new ReviewService(app.prisma);

  // PATCH /reviews/:id — submit an edit for admin approval (author only)
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

    // Check for existing pending edit
    const pendingEdit = await app.prisma.reviewEdit.findFirst({
      where: { reviewId: id, status: 'pending' },
    });
    if (pendingEdit) {
      return reply.code(409).send({
        success: false,
        error: { code: 'EDIT_PENDING', message: 'You already have a pending edit for this review' },
      });
    }

    // Validate rating if provided
    const newRating = body.rating ?? review.rating;
    if (newRating < 1 || newRating > 5) {
      return reply.code(422).send({
        success: false,
        error: { code: 'INVALID_RATING', message: 'Rating must be between 1 and 5' },
      });
    }

    // Validate body if provided
    const newBody = body.body ?? review.body;
    if (newBody.length < 20 || newBody.length > 1000) {
      return reply.code(422).send({
        success: false,
        error: { code: 'INVALID_BODY', message: 'Review must be 20-1000 characters' },
      });
    }

    // Create a pending edit record
    const edit = await app.prisma.reviewEdit.create({
      data: {
        reviewId: id,
        rating: newRating,
        body: newBody,
        photoUrls: body.photoUrls ?? review.photoUrls,
      },
    });

    return reply.code(201).send({ success: true, data: edit });
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

  // POST /reviews/:id/react — add or change reaction (helpful/unhelpful)
  app.post('/:id/react', { preHandler: app.authenticate }, async (request, reply) => {
    const { id: reviewId } = request.params as { id: string };
    const userId = request.user.sub;
    const body = request.body as any;

    const review = await app.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    const type = body.type;
    if (!['helpful', 'unhelpful'].includes(type)) {
      return reply.code(422).send({
        success: false,
        error: { code: 'INVALID_TYPE', message: 'Type must be helpful or unhelpful' },
      });
    }

    // Upsert: one reaction per user per review, can change type
    await app.prisma.reviewReaction.upsert({
      where: { reviewId_userId: { reviewId, userId } },
      create: { reviewId, userId, type },
      update: { type },
    });

    // Recalculate counts
    const [helpfulCount, unhelpfulCount] = await Promise.all([
      app.prisma.reviewReaction.count({ where: { reviewId, type: 'helpful' } }),
      app.prisma.reviewReaction.count({ where: { reviewId, type: 'unhelpful' } }),
    ]);
    await app.prisma.review.update({
      where: { id: reviewId },
      data: { helpfulCount, unhelpfulCount },
    });

    return reply.send({ success: true, data: { helpfulCount, unhelpfulCount } });
  });

  // DELETE /reviews/:id/react — remove reaction
  app.delete('/:id/react', { preHandler: app.authenticate }, async (request, reply) => {
    const { id: reviewId } = request.params as { id: string };
    const userId = request.user.sub;

    const existing = await app.prisma.reviewReaction.findUnique({
      where: { reviewId_userId: { reviewId, userId } },
    });
    if (!existing) {
      return reply.code(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No reaction found' },
      });
    }

    await app.prisma.reviewReaction.delete({
      where: { reviewId_userId: { reviewId, userId } },
    });

    // Recalculate counts
    const [helpfulCount, unhelpfulCount] = await Promise.all([
      app.prisma.reviewReaction.count({ where: { reviewId, type: 'helpful' } }),
      app.prisma.reviewReaction.count({ where: { reviewId, type: 'unhelpful' } }),
    ]);
    await app.prisma.review.update({
      where: { id: reviewId },
      data: { helpfulCount, unhelpfulCount },
    });

    return reply.send({ success: true, data: { helpfulCount, unhelpfulCount } });
  });

  // POST /reviews/:id/update — author adds a follow-up update
  app.post('/:id/update', { preHandler: app.authenticate }, async (request, reply) => {
    const { id: reviewId } = request.params as { id: string };
    const userId = request.user.sub;
    const body = request.body as any;

    const review = await app.prisma.review.findUnique({ where: { id: reviewId } });
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

    // Validate body
    if (!body.body || body.body.length < 20 || body.body.length > 500) {
      return reply.code(422).send({
        success: false,
        error: { code: 'INVALID_BODY', message: 'Update must be 20-500 characters' },
      });
    }

    // Max 5 updates per review
    const updateCount = await app.prisma.reviewUpdate.count({ where: { reviewId } });
    if (updateCount >= 5) {
      return reply.code(422).send({
        success: false,
        error: { code: 'MAX_UPDATES', message: 'Maximum 5 updates per review' },
      });
    }

    const update = await app.prisma.reviewUpdate.create({
      data: { reviewId, body: body.body },
    });

    return reply.code(201).send({ success: true, data: update });
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
