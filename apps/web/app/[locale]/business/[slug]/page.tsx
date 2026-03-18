import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ReviewCard } from '@/components/review-card';
import { ReviewFormWrapper } from '@/components/review-form-wrapper';
import { StarRating, RatingBadge } from '@/components/ui/star-rating';
import { ClaimButton } from '@/components/claim-button';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`;

async function getBusiness(slug: string) {
  try {
    const res = await fetch(`${API_URL}/businesses/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

async function getReviews(businessId: string, page = 1) {
  try {
    const res = await fetch(
      `${API_URL}/businesses/${businessId}/reviews?page=${page}&limit=10`,
      { cache: 'no-store' },
    );
    if (!res.ok) return { reviews: [], total: 0 };
    const data = await res.json();
    return { reviews: data.data, total: data.meta?.total ?? 0 };
  } catch {
    return { reviews: [], total: 0 };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const business = await getBusiness(slug);
  if (!business) return {};
  await getTranslations({ locale, namespace: 'common' });
  return {
    title: business.name,
    description: business.description ?? `Reviews and ratings for ${business.name}`,
    openGraph: {
      title: business.name,
      description: business.description ?? undefined,
      images: business.coverUrl ? [{ url: business.coverUrl }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: business.name,
    },
  };
}

export default async function BusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr ?? '1', 10);
  const t = await getTranslations({ locale, namespace: 'business' });

  const business = await getBusiness(slug);
  if (!business) notFound();

  const { reviews, total } = await getReviews(business.id, page);
  const productCount: number = business._count?.products ?? 0;

  const isBn = locale === 'bn';
  const categoryName = isBn ? business.category?.nameBn : business.category?.nameEn;
  const districtName = business.district
    ? isBn
      ? business.district.nameBn
      : business.district.nameEn
    : null;
  const avgRating = business.avgRating ? Number(business.avgRating) : null;
  const ratingDist: Record<number, number> = business.ratingDistribution ?? {};
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: business.name,
            description: business.description ?? undefined,
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://reviewbd.com'}/${locale}/business/${business.slug}`,
            telephone: business.phone ?? undefined,
            address: business.address
              ? { '@type': 'PostalAddress', streetAddress: business.address, addressCountry: 'BD' }
              : undefined,
            aggregateRating: avgRating
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: avgRating.toFixed(1),
                  reviewCount: business.reviewCount,
                  bestRating: '5',
                  worstRating: '1',
                }
              : undefined,
          }),
        }}
      />
      {/* Business Header */}
      <div className="rounded-xl border bg-background overflow-hidden mb-6">
        {business.coverUrl && (
          <div className="h-40 bg-muted overflow-hidden">
            <img src={business.coverUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center text-3xl shrink-0 overflow-hidden">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                '🏢'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{business.name}</h1>
                {business.isClaimed && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    ✓ {t('claimed')}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5">
                {categoryName}
                {districtName && ` · ${districtName}`}
              </p>
              {avgRating && (
                <div className="mt-2">
                  <RatingBadge value={avgRating} count={business.reviewCount} locale={locale} />
                </div>
              )}
            </div>
          </div>

          {business.description && (
            <p className="mt-4 text-sm text-muted-foreground">{business.description}</p>
          )}

          {/* Contact info */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary"
              >
                📞 {business.phone}
              </a>
            )}
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-muted-foreground hover:text-primary"
              >
                🌐 {t('website')}
              </a>
            )}
            {business.address && (
              <span className="flex items-center gap-1 text-muted-foreground">
                📍 {business.address}
              </span>
            )}
          </div>

          {!business.isClaimed && (
            <div className="mt-4">
              <ClaimButton businessId={business.id} businessName={business.name} locale={locale} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Products link */}
          {productCount > 0 && (
            <Link
              href={`/${locale}/business/${slug}/products`}
              className="flex items-center justify-between rounded-xl border bg-background px-5 py-4 hover:border-primary transition-colors"
            >
              <span className="flex items-center gap-2 font-medium">
                📦 {productCount} {isBn ? 'টি পণ্য' : productCount === 1 ? 'Product' : 'Products'}
              </span>
              <span className="text-sm text-primary">{isBn ? 'সব পণ্য দেখুন →' : 'View all products →'}</span>
            </Link>
          )}

          {/* Reviews section */}
          <div className="space-y-4">
          <h2 className="text-xl font-bold">
            {t('reviews')} ({total.toLocaleString(isBn ? 'bn-BD' : 'en-US')})
          </h2>

          {reviews.length === 0 ? (
            <div className="rounded-xl border bg-background p-8 text-center text-muted-foreground">
              <p className="text-4xl mb-3">💬</p>
              <p className="font-medium">{t('noReviews')}</p>
              <p className="text-sm mt-1">{t('beFirst')}</p>
            </div>
          ) : (
            reviews.map((review: any) => (
              <ReviewCard key={review.id} review={review} locale={locale} />
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`?page=${p}`}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    p === page
                      ? 'bg-primary text-primary-foreground'
                      : 'border hover:border-primary'
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Rating distribution */}
          {avgRating && (
            <div className="rounded-xl border bg-background p-5">
              <h3 className="font-bold mb-3">{t('ratingDistribution')}</h3>
              <div className="text-4xl font-bold text-center mb-1">{avgRating.toFixed(1)}</div>
              <div className="flex justify-center mb-4">
                <StarRating value={Math.round(avgRating)} size="sm" />
              </div>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDist[star] ?? 0;
                  const pct =
                    business.reviewCount > 0 ? (count / business.reviewCount) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-4 text-right">{star}</span>
                      <span className="text-amber-400">★</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Write review form */}
          <ReviewFormWrapper businessId={business.id} locale={locale} />
        </div>
      </div>
    </div>
  );
}
