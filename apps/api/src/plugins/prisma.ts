import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

async function prisma(app: FastifyInstance) {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query', 'warn', 'error'] : ['error'],
  });

  await prisma.$connect();
  app.log.info('Connected to PostgreSQL');

  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
    app.log.info('Disconnected from PostgreSQL');
  });
}

export const prismaPlugin = fp(prisma, {
  name: 'prisma',
});
