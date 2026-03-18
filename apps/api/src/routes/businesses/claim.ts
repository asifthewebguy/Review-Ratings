import type { FastifyInstance } from 'fastify';

export async function claimRoutes(app: FastifyInstance) {
  // POST /businesses/:id/claim — submit ownership claim
  app.post('/:id/claim', {
    preHandler: app.authenticate,
  }, async (request, reply) => {
    const { id: businessId } = request.params as { id: string };
    const userId = request.user.sub;
    const body = request.body as any;

    // Business must exist
    const business = await app.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return reply.code(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Business not found' } });
    }

    // Already claimed
    if (business.isClaimed) {
      return reply.code(409).send({ success: false, error: { code: 'ALREADY_CLAIMED', message: 'Business is already claimed' } });
    }

    // One pending/approved claim per user per business
    const existing = await app.prisma.claim.findFirst({
      where: { businessId, userId, status: { in: ['pending', 'approved'] } },
    });
    if (existing) {
      return reply.code(409).send({ success: false, error: { code: 'CLAIM_EXISTS', message: 'You already have a pending claim for this business' } });
    }

    // Validate required fields
    if (!body.docType || body.docType !== 'trade_license') {
      return reply.code(422).send({ success: false, error: { code: 'INVALID_DOC_TYPE', message: 'docType must be trade_license' } });
    }
    if (!body.docUrl) {
      return reply.code(422).send({ success: false, error: { code: 'MISSING_DOC', message: 'docUrl is required' } });
    }

    const claim = await app.prisma.claim.create({
      data: {
        businessId,
        userId,
        docType: body.docType,
        docUrl: body.docUrl,
        docUrlBack: body.docUrlBack ?? null,
        status: 'pending',
      },
    });

    return reply.code(201).send({ success: true, data: claim });
  });

  // GET /businesses/:id/claim-status — check claim status for current user
  app.get('/:id/claim-status', {
    preHandler: app.authenticate,
  }, async (request, reply) => {
    const { id: businessId } = request.params as { id: string };
    const userId = request.user.sub;

    const claim = await app.prisma.claim.findFirst({
      where: { businessId, userId },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ success: true, data: claim });
  });
}
