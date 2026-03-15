import { Queue, Worker } from 'bullmq';
import type { PrismaClient } from '@prisma/client';

// Use host/port connection opts to avoid ioredis version conflicts between BullMQ and our package
const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const redisUrlParsed = new URL(redisUrl);
const connection = {
  host: redisUrlParsed.hostname,
  port: parseInt(redisUrlParsed.port || '6379', 10),
};

export function createIntegrityJobs(_redis: unknown, prisma: PrismaClient) {

  const integrityQueue = new Queue('integrity', { connection });

  // ── Spike detection ──────────────────────────────────
  // Freeze a business if 24h review count > 3x the 90-day daily average
  const spikeWorker = new Worker(
    'integrity',
    async (job) => {
      if (job.name !== 'spike-check') return;

      const businesses = await prisma.business.findMany({
        where: { isActive: true, reviewCount: { gt: 0 } },
        select: { id: true, name: true, reviewCount: true },
      });

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      for (const biz of businesses) {
        const [recentCount, historicReviews] = await Promise.all([
          prisma.review.count({
            where: { businessId: biz.id, createdAt: { gte: oneDayAgo }, status: { not: 'removed' } },
          }),
          prisma.review.count({
            where: { businessId: biz.id, createdAt: { gte: ninetyDaysAgo }, status: { not: 'removed' } },
          }),
        ]);

        const dailyAvg = historicReviews / 90;
        if (dailyAvg > 0 && recentCount > dailyAvg * 3 && recentCount >= 5) {
          // Freeze: deactivate business temporarily
          await prisma.business.update({
            where: { id: biz.id },
            data: { isActive: false },
          });
          console.warn(`[integrity] Spike detected for business ${biz.id} (${biz.name}): ${recentCount} reviews in 24h vs ${dailyAvg.toFixed(1)}/day avg`);
        }
      }
    },
    { connection },
  );

  // ── IP clustering ─────────────────────────────────────
  // Flag reviews if 3+ come from same IP within 1h for the same business
  const ipWorker = new Worker(
    'integrity',
    async (job) => {
      if (job.name !== 'ip-check') return;

      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Group recent reviews by business + IP
      const recentReviews = await prisma.review.findMany({
        where: { createdAt: { gte: oneHourAgo }, status: 'published', ipAddress: { not: null } },
        select: { id: true, businessId: true, ipAddress: true },
      });

      const groups: Record<string, string[]> = {};
      for (const r of recentReviews) {
        const key = `${r.businessId}:${r.ipAddress}`;
        if (!groups[key]) groups[key] = [];
        groups[key]!.push(r.id);
      }

      for (const [, reviewIds] of Object.entries(groups)) {
        if (reviewIds.length >= 3) {
          await prisma.review.updateMany({
            where: { id: { in: reviewIds }, status: 'published' },
            data: { status: 'flagged' },
          });
          // Increment flag counts
          for (const reviewId of reviewIds) {
            await prisma.review.update({
              where: { id: reviewId },
              data: { flagCount: { increment: 1 } },
            });
          }
          console.warn(`[integrity] IP clustering: flagged ${reviewIds.length} reviews from same IP`);
        }
      }
    },
    { connection },
  );

  // ── NLP similarity (Jaccard trigrams) ─────────────────
  function trigrams(text: string): Set<string> {
    const clean = text.toLowerCase().replace(/\s+/g, ' ').trim();
    const grams = new Set<string>();
    for (let i = 0; i < clean.length - 2; i++) {
      grams.add(clean.slice(i, i + 3));
    }
    return grams;
  }

  function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0;
    const intersection = new Set([...a].filter((x) => b.has(x)));
    const union = new Set([...a, ...b]);
    return intersection.size / union.size;
  }

  const nlpWorker = new Worker(
    'integrity',
    async (job) => {
      if (job.name !== 'nlp-check') return;
      const { reviewId, businessId, body } = job.data as { reviewId: string; businessId: string; body: string };

      // Compare against recent reviews for the same business
      const recentReviews = await prisma.review.findMany({
        where: {
          businessId,
          id: { not: reviewId },
          status: 'published',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
        },
        select: { id: true, body: true },
      });

      const newGrams = trigrams(body);
      for (const existing of recentReviews) {
        const similarity = jaccardSimilarity(newGrams, trigrams(existing.body));
        if (similarity > 0.7) {
          await prisma.review.update({
            where: { id: reviewId },
            data: { status: 'flagged', flagCount: { increment: 1 } },
          });
          console.warn(`[integrity] NLP similarity ${(similarity * 100).toFixed(0)}% between review ${reviewId} and ${existing.id}`);
          break;
        }
      }
    },
    { connection },
  );

  // ── Trust score recalc ────────────────────────────────
  const trustWorker = new Worker(
    'integrity',
    async (job) => {
      if (job.name !== 'trust-recalc') return;

      // Recalculate trust level for all users based on:
      // - account age, review count, helpful votes, flag rate
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          createdAt: true,
          _count: { select: { reviews: true } },
        },
      });

      for (const user of users) {
        const reviewCount = user._count.reviews;
        const ageMonths = (Date.now() - user.createdAt.getTime()) / (1000 * 3600 * 24 * 30);
        const flaggedReviews = await prisma.review.count({
          where: { userId: user.id, status: 'flagged' },
        });
        const flagRate = reviewCount > 0 ? flaggedReviews / reviewCount : 0;

        // Trust level 1-5
        let trust = 1;
        if (ageMonths >= 1 && reviewCount >= 1) trust = 2;
        if (ageMonths >= 3 && reviewCount >= 5 && flagRate < 0.1) trust = 3;
        if (ageMonths >= 6 && reviewCount >= 15 && flagRate < 0.05) trust = 4;
        if (ageMonths >= 12 && reviewCount >= 30 && flagRate < 0.02) trust = 5;

        await prisma.user.update({ where: { id: user.id }, data: { trustLevel: trust } });
      }
    },
    { connection },
  );

  // Schedule recurring jobs
  async function scheduleJobs() {
    // Spike check: every hour
    await integrityQueue.add('spike-check', {}, { repeat: { every: 60 * 60 * 1000 } });
    // IP check: every 30 minutes
    await integrityQueue.add('ip-check', {}, { repeat: { every: 30 * 60 * 1000 } });
    // Trust recalc: daily at midnight (every 24h)
    await integrityQueue.add('trust-recalc', {}, { repeat: { every: 24 * 60 * 60 * 1000 } });
  }

  // Helper to trigger NLP check for a new review (called from routes)
  function queueNlpCheck(reviewId: string, businessId: string, body: string) {
    return integrityQueue.add('nlp-check', { reviewId, businessId, body });
  }

  return { integrityQueue, scheduleJobs, queueNlpCheck, spikeWorker, ipWorker, nlpWorker, trustWorker };
}
