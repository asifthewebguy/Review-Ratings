import fp from 'fastify-plugin';
import fjwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export interface JwtPayload {
  sub: string; // user id
  phone: string;
  role: string;
  trustLevel: number;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuthenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (role: string) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

async function plugin(app: FastifyInstance) {
  await app.register(fjwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production',
    sign: {
      expiresIn: (process.env.JWT_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`) || '15m',
    },
  });

  // Require valid JWT
  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        await request.jwtVerify();
      } catch {
        reply.status(401).send({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        });
      }
    },
  );

  // Attach JWT if present, don't require it
  app.decorate(
    'optionalAuthenticate',
    async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
      try {
        await request.jwtVerify();
      } catch {
        // user is not authenticated — that's fine
      }
    },
  );

  // Require a specific role
  app.decorate('requireRole', (requiredRole: string) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        await request.jwtVerify();
      } catch {
        reply.status(401).send({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        });
        return;
      }

      const roleHierarchy: Record<string, number> = {
        user: 0,
        business_owner: 1,
        moderator: 2,
        admin: 3,
      };

      const userLevel = roleHierarchy[request.user.role] ?? 0;
      const requiredLevel = roleHierarchy[requiredRole] ?? 99;

      if (userLevel < requiredLevel) {
        reply.status(403).send({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        });
      }
    };
  });
}

export const jwtPlugin = fp(plugin, { name: 'jwt' });
