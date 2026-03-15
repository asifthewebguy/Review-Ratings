import type { PrismaClient } from '@prisma/client';

export class ReviewService {
  constructor(private prisma: PrismaClient) {}

  // Bayesian average per PRD Section 5.2
  async recalculateBusinessRating(businessId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { businessId, status: 'published' },
      select: { rating: true },
    });

    const reviewCount = reviews.length;
    const globalAvg = 3.5; // Prior mean
    const minReviews = 10; // Confidence threshold

    let averageRating = 0;
    let trustScore = 0;

    if (reviewCount > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const rawAvg = sum / reviewCount;
      // Bayesian average: (m * C + n * x̄) / (m + n)
      averageRating =
        (minReviews * globalAvg + reviewCount * rawAvg) / (minReviews + reviewCount);
      // Trust score: weighted by review count (max 5.0)
      trustScore = parseFloat(averageRating.toFixed(4));
    }

    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        avgRating: parseFloat(averageRating.toFixed(2)),
        reviewCount,
        trustScore,
      },
    });
  }
}
