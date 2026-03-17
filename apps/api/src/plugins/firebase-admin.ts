import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import admin from 'firebase-admin';

declare module 'fastify' {
  interface FastifyInstance {
    firebaseAdmin: admin.auth.Auth;
  }
}

export const firebaseAdminPlugin = fp(async (app: FastifyInstance) => {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    app.log.warn('Firebase credentials not set — Firebase Auth disabled');
    app.decorate('firebaseAdmin', null as unknown as admin.auth.Auth);
    return;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }

  app.decorate('firebaseAdmin', admin.auth());
  app.log.info('Firebase Admin SDK initialized');
});
