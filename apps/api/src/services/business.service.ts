import type { PrismaClient } from '@prisma/client';
import type { MeiliSearch } from 'meilisearch';

export class BusinessService {
  constructor(
    private prisma: PrismaClient,
    private meili: MeiliSearch,
  ) {}

  async syncToSearch(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { category: true, district: { include: { division: true } } },
    });
    if (!business) return;

    await this.meili.index('businesses').addDocuments([
      {
        id: business.id,
        name: business.name,
        description: business.description,
        address: business.address,
        categorySlug: business.category.slug,
        categoryNameEn: business.category.nameEn,
        categoryNameBn: business.category.nameBn,
        districtId: business.districtId,
        divisionId: business.district?.division?.id,
        avgRating: business.avgRating ? Number(business.avgRating) : null,
        reviewCount: business.reviewCount,
        trustScore: business.trustScore ? Number(business.trustScore) : null,
        isActive: business.isActive,
        isClaimed: business.isClaimed,
        createdAt: business.createdAt.toISOString(),
      },
    ]);
  }

  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }
    return slug;
  }
}
