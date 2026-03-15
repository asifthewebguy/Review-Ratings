import type { FastifyInstance } from 'fastify';
import { OtpService } from '../../services/otp.service.js';
import { createSmsProvider, buildOtpMessage } from '../../lib/sms.js';
import { OtpRequestSchema, OtpVerifySchema } from '@review-ratings/shared';

const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

function refreshTokenKey(token: string): string {
  return `refresh:${token}`;
}

function generateDisplayName(): string {
  const adj = ['সৎ', 'বিশ্বস্ত', 'সক্রিয়', 'নতুন'];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj[Math.floor(Math.random() * adj.length)]} ব্যবহারকারী ${num}`;
}

export async function authRoutes(app: FastifyInstance) {
  const otpService = new OtpService(app.redis);
  const sms = createSmsProvider();

  // POST /api/v1/auth/otp/request
  app.post('/otp/request', async (request, reply) => {
    const result = OtpRequestSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid input' },
      });
    }

    const { phone } = result.data;

    const { allowed } = await otpService.checkRateLimit(phone);
    if (!allowed) {
      return reply.status(429).send({
        success: false,
        error: { code: 'OTP_RATE_LIMITED', message: 'Too many OTP requests. Try again in 1 hour.' },
      });
    }

    const code = await otpService.create(phone);

    // Store audit record
    await app.prisma.otpAttempt.create({
      data: {
        phone,
        codeHash: code, // Note: in production this should store the hash, not plaintext
        purpose: 'login',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await sms.send(phone, buildOtpMessage(code));

    return reply.status(200).send({
      success: true,
      data: { message: 'OTP sent successfully' },
    });
  });

  // POST /api/v1/auth/otp/verify
  app.post('/otp/verify', async (request, reply) => {
    const result = OtpVerifySchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid input' },
      });
    }

    const { phone, code } = result.data;

    const valid = await otpService.verify(phone, code);
    if (!valid) {
      return reply.status(401).send({
        success: false,
        error: { code: 'OTP_INVALID', message: 'Invalid or expired OTP code' },
      });
    }

    // Upsert user — create if first login
    const user = await app.prisma.user.upsert({
      where: { phone },
      update: { verifiedAt: new Date() },
      create: {
        phone,
        displayName: generateDisplayName(),
        verifiedAt: new Date(),
      },
    });

    // Issue JWT access token
    const accessToken = app.jwt.sign({
      sub: user.id,
      phone: user.phone,
      role: user.role,
      trustLevel: user.trustLevel,
    });

    // Issue refresh token (random UUID stored in Redis)
    const refreshToken = crypto.randomUUID();
    await app.redis.setex(
      refreshTokenKey(refreshToken),
      REFRESH_TOKEN_TTL,
      JSON.stringify({ userId: user.id, phone: user.phone, role: user.role }),
    );

    return reply.status(200).send({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          trustLevel: user.trustLevel,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 15 * 60, // 15 minutes in seconds
        },
      },
    });
  });

  // POST /api/v1/auth/token/refresh
  app.post('/token/refresh', async (request, reply) => {
    const body = request.body as { refreshToken?: string };
    const token = body?.refreshToken;

    if (!token) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'refreshToken is required' },
      });
    }

    const data = await app.redis.get(refreshTokenKey(token));
    if (!data) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Refresh token expired or invalid' },
      });
    }

    const { userId, phone, role } = JSON.parse(data) as {
      userId: string;
      phone: string;
      role: string;
    };

    const user = await app.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'User not found or inactive' },
      });
    }

    // Rotate refresh token
    await app.redis.del(refreshTokenKey(token));
    const newRefreshToken = crypto.randomUUID();
    await app.redis.setex(
      refreshTokenKey(newRefreshToken),
      REFRESH_TOKEN_TTL,
      JSON.stringify({ userId, phone, role }),
    );

    const accessToken = app.jwt.sign({
      sub: userId,
      phone,
      role,
      trustLevel: user.trustLevel,
    });

    return reply.status(200).send({
      success: true,
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: 15 * 60,
        },
      },
    });
  });

  // DELETE /api/v1/auth/session
  app.delete(
    '/session',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const body = request.body as { refreshToken?: string };
      const token = body?.refreshToken;

      if (token) {
        await app.redis.del(refreshTokenKey(token));
      }

      return reply.status(200).send({ success: true, data: { message: 'Logged out' } });
    },
  );
}
