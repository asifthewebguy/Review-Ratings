import type { FastifyInstance } from 'fastify';
import { FirebaseVerifySchema } from '@review-ratings/shared';

const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

function refreshTokenKey(token: string): string {
  return `refresh:${token}`;
}

function generateDisplayName(): string {
  const adj = ['সৎ', 'বিশ্বস্ত', 'সক্রিয়', 'নতুন'];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj[Math.floor(Math.random() * adj.length)]} ব্যবহারকারী ${num}`;
}

const USER_SELECT = {
  id: true,
  firebaseUid: true,
  phone: true,
  displayName: true,
  avatarUrl: true,
  trustLevel: true,
  role: true,
  email: true,
  emailVerifiedAt: true,
  nidStatus: true,
  nidVerifiedAt: true,
  nidRejectedReason: true,
  verifiedAt: true,
  createdAt: true,
} as const;

export async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/firebase/verify
  // Exchange a Firebase ID token (from any social provider) for a custom JWT
  app.post('/firebase/verify', async (request, reply) => {
    const result = FirebaseVerifySchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: result.error.issues[0]?.message ?? 'Invalid input' },
      });
    }

    const { idToken } = result.data;

    let decoded: { uid: string; email?: string; name?: string; picture?: string; email_verified?: boolean };
    try {
      decoded = await app.firebaseAdmin.verifyIdToken(idToken);
    } catch {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Invalid or expired Firebase token' },
      });
    }

    const { uid, email, name, picture, email_verified } = decoded;

    // Upsert user — match by firebaseUid first, then email (to merge existing accounts)
    let user = await app.prisma.user.findFirst({
      where: { OR: [{ firebaseUid: uid }, ...(email ? [{ email }] : [])] },
      select: USER_SELECT,
    });

    if (user) {
      // Update firebaseUid and profile info if not already set
      user = await app.prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: uid,
          ...(email && !user.email ? { email } : {}),
          ...(email && email_verified && !user.emailVerifiedAt ? { emailVerifiedAt: new Date() } : {}),
          ...(picture && !user.avatarUrl ? { avatarUrl: picture } : {}),
          ...(name && user.displayName.startsWith('সৎ ব্যবহারকারী') ||
          user.displayName.startsWith('বিশ্বস্ত ব্যবহারকারী') ||
          user.displayName.startsWith('সক্রিয় ব্যবহারকারী') ||
          user.displayName.startsWith('নতুন ব্যবহারকারী')
            ? { displayName: name }
            : {}),
        },
        select: USER_SELECT,
      });
    } else {
      user = await app.prisma.user.create({
        data: {
          firebaseUid: uid,
          displayName: name ?? generateDisplayName(),
          email: email ?? null,
          avatarUrl: picture ?? null,
          ...(email && email_verified ? { emailVerifiedAt: new Date() } : {}),
        },
        select: USER_SELECT,
      });
    }

    // Issue JWT access token
    const accessToken = app.jwt.sign({
      sub: user.id,
      phone: user.phone ?? '',
      role: user.role,
      trustLevel: user.trustLevel,
    });

    // Issue refresh token (random UUID stored in Redis)
    const refreshToken = crypto.randomUUID();
    await app.redis.setex(
      refreshTokenKey(refreshToken),
      REFRESH_TOKEN_TTL,
      JSON.stringify({ userId: user.id, phone: user.phone ?? null, role: user.role }),
    );

    return reply.status(200).send({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone ?? null,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
          trustLevel: user.trustLevel,
          role: user.role,
          email: user.email ?? null,
          emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
          nidStatus: user.nidStatus,
          nidVerifiedAt: user.nidVerifiedAt?.toISOString() ?? null,
          nidRejectedReason: user.nidRejectedReason ?? null,
          verifiedAt: user.verifiedAt?.toISOString() ?? null,
          createdAt: user.createdAt.toISOString(),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 15 * 60,
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
      phone: string | null;
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
      phone: phone ?? '',
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
