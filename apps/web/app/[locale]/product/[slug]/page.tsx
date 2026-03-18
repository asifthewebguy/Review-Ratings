import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ReviewCard } from '@/components/review-card';
import { StarRating, RatingBadge } from '@/components/ui/star-rating';
import { ProductReviewFormWrapper } from '@/components/product-review-form-wrapper';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`;

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

async function getProductReviews(slug: string, page = 1) {
  try {
    const res = await fetch(`${API_URL}/products/${slug}/reviews?page=${page}&limit=10`, {
      cache: 'no-store',
    });
    if (!res.ok) return { reviews: [], total: 0 };
    const data = await res.json();
    return { reviews: data.data?.items ?? [], total: data.data?.total ?? 0 };
  } catch {
    return { reviews: [], total: 0 };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description ?? `Reviews for ${product.name}`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr ?? '1', 10);
  const t = await getTranslations({ locale, namespace: 'products' });

  const product = await getProduct(slug);
  if (!product) notFound();

  const { reviews, total } = await getProductReviews(slug, page);

  const isBn = locale === 'bn';
  const displayName = isBn && product.nameBn ? product.nameBn : product.name;
  const avgRating = product.avgRating != null ? parseFloat(String(product.avgRating)) : null;
  const totalPages = Math.ceil(total / 10);

  // Build rating distribution from reviews
  const ratingDist: Record<number, number> = {};
  reviews.forEach((r: any) => {
    ratingDist[r.rating] = (ratingDist[r.rating] ?? 0) + 1;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description ?? undefined,
            image: product.imageUrl ?? undefined,
            aggregateRating: avgRating
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: avgRating.toFixed(1),
                  reviewCount: product.reviewCount,
                  bestRating: '5',
                  worstRating: '1',
                }
              : undefined,
          }),
        }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        {product.business && (
          <>
            <Link href={`/${locale}/business/${product.business.slug}`} className="hover:text-foreground">
              {product.business.name}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/business/${product.business.slug}/products`} className="hover:text-foreground">
              {t('title')}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground font-medium">{displayName}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product header */}
          <div className="rounded-xl border bg-background overflow-hidden">
            {product.imageUrl && (
              <div className="h-48 bg-muted overflow-hidden">
                <img src={product.imageUrl} alt={displayName} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start gap-4">
                {!product.imageUrl && (
                  <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center text-3xl shrink-0">
                    📦
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  {product.business && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('soldBy')}{' '}
                      <Link
                        href={`/${locale}/business/${product.business.slug}`}
                        className="text-primary hover:underline"
                      >
                        {product.business.name}
                      </Link>
                    </p>
                  )}
                  {product.category && (
                    <span className="inline-block mt-2 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                      {product.category.icon} {isBn ? product.category.nameBn : product.category.nameEn}
                    </span>
                  )}
                  {product.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {product.tags.map((tag: string) => (
                        <span key={tag} className="text-xs border rounded-full px-2 py-0.5 text-muted-foreground">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {avgRating && (
                    <div className="mt-3">
                      <RatingBadge value={avgRating} count={product.reviewCount} locale={locale} />
                    </div>
                  )}
                </div>
              </div>
              {product.description && (
                <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              {isBn ? 'রিভিউ' : 'Reviews'} ({total.toLocaleString(isBn ? 'bn-BD' : 'en-US')})
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
          {avgRating && product.reviewCount > 0 && (
            <div className="rounded-xl border bg-background p-5">
              <h3 className="font-bold mb-3">{t('ratingDistribution')}</h3>
              <div className="text-4xl font-bold text-center mb-1">{avgRating.toFixed(1)}</div>
              <div className="flex justify-center mb-4">
                <StarRating value={Math.round(avgRating)} size="sm" />
              </div>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDist[star] ?? 0;
                  const pct = product.reviewCount > 0 ? (count / product.reviewCount) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-4 text-right">{star}</span>
                      <span className="text-amber-400">★</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Write review */}
          <ProductReviewFormWrapper productSlug={slug} locale={locale} />
        </div>
      </div>
    </div>
  );
}
