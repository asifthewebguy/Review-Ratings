// Load .env file in development only — Docker injects env vars in production
if (process.env.NODE_ENV !== 'production') {
  const { config } = await import('dotenv');
  const { resolve } = await import('path');
  const { fileURLToPath } = await import('url');
  const __dirname = fileURLToPath(new URL('.', import.meta.url));
  config({ path: resolve(__dirname, '../../../.env') });
}
import { buildApp } from './app.js';
import { createIntegrityJobs } from './jobs/integrity.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const app = await buildApp();

  // Start integrity jobs (only in non-test env)
  if (process.env.NODE_ENV !== 'test') {
    const jobs = createIntegrityJobs(app.redis, app.prisma);
    await jobs.scheduleJobs();
    app.log.info('Integrity jobs scheduled');
  }

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
