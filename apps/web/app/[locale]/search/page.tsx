import { getTranslations } from 'next-intl/server';
import { BusinessCard } from '@/components/business-card';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}): Promise<import('next').Metadata> {
  const { locale } = await params;
  const { q, category } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'search' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const title = q
    ? `"${q}" — ${t('title')} | ${tCommon('appName')}`
    : `${t('title')} | ${tCommon('appName')}`;

  return {
    title,
    description: `${t('title')} ${category ? `— ${category}` : ''} | ReviewBD`,
    robots: { index: !q, follow: true }, // Don't index search result pages with queries
  };
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`;

async function searchBusinesses(params: {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
}) {
  try {
    const url = new URL(`${API_URL}/businesses`);
    if (params.q) url.searchParams.set('q', params.q);
    if (params.category) url.searchParams.set('category', params.category);
    if (params.sort) url.searchParams.set('sort', params.sort);
    url.searchParams.set('page', String(params.page ?? 1));
    url.searchParams.set('limit', '20');

    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!res.ok) return { businesses: [], total: 0 };
    const data = await res.json();
    return { businesses: data.data ?? [], total: data.meta?.total ?? 0 };
  } catch {
    return { businesses: [], total: 0 };
  }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
    min_rating?: string;
  }>;
}) {
  const { locale } = await params;
  const { q, category, sort, page: pageStr } = await searchParams;
  const page = parseInt(pageStr ?? '1', 10);
  const t = await getTranslations({ locale, namespace: 'search' });

  const [{ businesses, total }, categories] = await Promise.all([
    searchBusinesses({ q, category, sort, page }),
    getCategories(),
  ]);

  const isBn = locale === 'bn';
  const totalPages = Math.ceil(total / 20);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const urlParams = new URLSearchParams();
    const merged = { q, category, sort, page: String(page), ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) urlParams.set(k, v);
    });
    return `/search?${urlParams.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filter sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-5">
          <div>
            <h3 className="font-semibold mb-3">{t('category')}</h3>
            <div className="space-y-1">
              <Link
                href={buildUrl({ category: undefined, page: '1' })}
                className={`block px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors ${
                  !category ? 'bg-primary/10 text-primary font-medium' : ''
                }`}
              >
                {t('allCategories')}
              </Link>
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={buildUrl({ category: cat.slug, page: '1' })}
                  className={`block px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors ${
                    category === cat.slug ? 'bg-primary/10 text-primary font-medium' : ''
                  }`}
                >
                  {cat.icon} {isBn ? cat.nameBn : cat.nameEn}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">{t('sortBy')}</h3>
            <div className="space-y-1">
              {[
                { value: undefined, label: t('sortRelevance') },
                { value: 'rating', label: t('sortRating') },
                { value: 'reviews', label: t('sortReviews') },
              ].map(({ value, label }) => (
                <Link
                  key={value ?? 'default'}
                  href={buildUrl({ sort: value, page: '1' })}
                  className={`block px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors ${
                    sort === value ? 'bg-primary/10 text-primary font-medium' : ''
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">
              {q ? `"${q}" — ` : ''}
              {t('title')}
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({total.toLocaleString(isBn ? 'bn-BD' : 'en-US')})
              </span>
            </h1>
          </div>

          {businesses.length === 0 ? (
            <div className="rounded-xl border bg-background p-12 text-center text-muted-foreground">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium text-lg">{t('noResults')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {businesses.map((business: any) => (
                <BusinessCard key={business.id} business={business} locale={locale} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="px-4 py-2 rounded-lg border hover:border-primary text-sm"
                >
                  {isBn ? '← আগের' : '← Prev'}
                </Link>
              )}
              <span className="px-4 py-2 text-sm text-muted-foreground">
                {isBn ? `${page} / ${totalPages}` : `${page} of ${totalPages}`}
              </span>
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="px-4 py-2 rounded-lg border hover:border-primary text-sm"
                >
                  {isBn ? 'পরের →' : 'Next →'}
                </Link>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
