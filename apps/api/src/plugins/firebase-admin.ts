import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import admin from 'firebase-admin';

declare module 'fastify' {
  interface FastifyInstance {
    firebaseAdmin: admin.auth.Auth;
  }
}

export const firebaseAdminPlugin = fp(async (app: FastifyInstance) => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  app.decorate('firebaseAdmin', admin.auth());
  app.log.info('Firebase Admin SDK initialized');
});
