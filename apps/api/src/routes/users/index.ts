import type { FastifyInstance } from 'fastify';
import { UpdateUserSchema, EmailVerifyRequestSchema, EmailVerifyConfirmSchema, PhoneVerifySchema } from '@review-ratings/shared';
import bcrypt from 'bcryptjs';

const EMAIL_OTP_TTL = 10 * 60; // 10 minutes

function emailOtpKey(userId: string): string {
  return `email_otp:${userId}`;
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const USER_SELECT = {
  id: true,
  phone: true,
  displayName: true,
  avatarUrl: true,
  trustLevel: true,
  role: true,
  email: true,
  emailVerifiedAt: true,
  createdAt: true,
  verifiedAt: true,
} as const;

export async function userRoutes(app: FastifyInstance) {
  // GET /api/v1/users/me
  app.get('/me', { preHandler: app.authenticate }, async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user.sub },
      select: USER_SELECT,
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
      select: USER_SELECT,
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

  // ── Email Verification ──────────────────────────────────

  // POST /users/me/verify/email/request — send OTP to email
  app.post('/me/verify/email/request', { preHandler: app.authenticate }, async (request, reply) => {
    const result = EmailVerifyRequestSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid input' },
      });
    }

    const userId = request.user.sub;
    const { email } = result.data;

    const current = await app.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });

    if (current?.emailVerifiedAt) {
      return reply.status(409).send({
        success: false,
        error: { code: 'EMAIL_ALREADY_VERIFIED', message: 'Email is already verified' },
      });
    }

    // Check email not taken by another user
    const taken = await app.prisma.user.findFirst({
      where: { email, NOT: { id: userId } },
    });
    if (taken) {
      return reply.status(409).send({
        success: false,
        error: { code: 'EMAIL_TAKEN', message: 'Email is already in use by another account' },
      });
    }

    const code = generateOtp();
    const hash = await bcrypt.hash(code, 10);
    await app.redis.setex(emailOtpKey(userId), EMAIL_OTP_TTL, JSON.stringify({ hash, email }));

    const from = process.env.SMTP_FROM || 'ReviewBD <noreply@reviewbd.com>';
    const info = await app.mailer.sendMail({
      from,
      to: email,
      subject: 'ReviewBD — Email Verification Code',
      text: `Your ReviewBD email verification code is: ${code}\n\nThis code expires in 10 minutes.`,
      html: `<p>Your <strong>ReviewBD</strong> email verification code is:</p><h2>${code}</h2><p>This code expires in 10 minutes.</p>`,
    });

    app.log.info({ messageId: info.messageId }, 'Email OTP sent');

    return reply.send({ success: true, data: { message: 'Verification code sent to email' } });
  });

  // POST /users/me/verify/email/confirm — verify OTP
  app.post('/me/verify/email/confirm', { preHandler: app.authenticate }, async (request, reply) => {
    const result = EmailVerifyConfirmSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid input' },
      });
    }

    const userId = request.user.sub;
    const { email, code } = result.data;

    const raw = await app.redis.get(emailOtpKey(userId));
    if (!raw) {
      return reply.status(410).send({
        success: false,
        error: { code: 'OTP_EXPIRED', message: 'Verification code expired or not found. Please request a new one.' },
      });
    }

    const { hash, email: storedEmail } = JSON.parse(raw) as { hash: string; email: string };

    if (storedEmail !== email) {
      return reply.status(400).send({
        success: false,
        error: { code: 'OTP_INVALID', message: 'Email does not match the one a code was sent to' },
      });
    }

    const valid = await bcrypt.compare(code, hash);
    if (!valid) {
      return reply.status(401).send({
        success: false,
        error: { code: 'OTP_INVALID', message: 'Invalid verification code' },
      });
    }

    await app.redis.del(emailOtpKey(userId));

    const user = await app.prisma.user.update({
      where: { id: userId },
      data: { email, emailVerifiedAt: new Date() },
      select: USER_SELECT,
    });

    return reply.send({ success: true, data: user });
  });

  // ── Phone Verification (KYC) ────────────────────────────
  // POST /users/me/verify/phone — verify phone via Firebase Phone Auth ID token
  app.post('/me/verify/phone', { preHandler: app.authenticate }, async (request, reply) => {
    const result = PhoneVerifySchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid input' },
      });
    }

    const userId = request.user.sub;
    const { idToken } = result.data;

    let phoneNumber: string;
    try {
      const decoded = await app.firebaseAdmin.verifyIdToken(idToken);
      if (!decoded.phone_number) {
        return reply.status(400).send({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Firebase token does not contain a phone number' },
        });
      }
      phoneNumber = decoded.phone_number;
    } catch {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Invalid or expired Firebase token' },
      });
    }

    // Check phone not already taken by another user
    const existing = await app.prisma.user.findFirst({
      where: { phone: phoneNumber, NOT: { id: userId } },
    });
    if (existing) {
      return reply.status(409).send({
        success: false,
        error: { code: 'PHONE_TAKEN', message: 'This phone number is already linked to another account' },
      });
    }

    const user = await app.prisma.user.update({
      where: { id: userId },
      data: {
        phone: phoneNumber,
        verifiedAt: new Date(),
      },
      select: USER_SELECT,
    });

    return reply.send({ success: true, data: user });
  });
}

