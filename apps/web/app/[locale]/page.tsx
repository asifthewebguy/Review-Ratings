import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { SearchBar } from '@/components/search-bar';
import { CategoryGrid } from '@/components/category-grid';
import { BusinessCard } from '@/components/business-card';
import { ProductCard } from '@/components/product-card';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<import('next').Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  return {
    title: `${tCommon('appName')} — ${tCommon('tagline')}`,
    description: t('heroSubtitle'),
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || 'https://reviewbd.com'}/${locale}`,
      languages: {
        'bn': `${process.env.NEXT_PUBLIC_APP_URL || 'https://reviewbd.com'}/bn`,
        'en': `${process.env.NEXT_PUBLIC_APP_URL || 'https://reviewbd.com'}/en`,
      },
    },
  };
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1`;

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

async function getFeaturedProducts() {
  try {
    const res = await fetch(`${API_URL}/products?limit=8`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.items ?? [];
  } catch {
    return [];
  }
}

async function getTopRated() {
  try {
    const res = await fetch(`${API_URL}/businesses?sort=rating&limit=6`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const [categories, topRated, featuredProducts] = await Promise.all([getCategories(), getTopRated(), getFeaturedProducts()]);

  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'ReviewBD',
            url: process.env.NEXT_PUBLIC_APP_URL || 'https://reviewbd.com',
            description: 'Bangladesh\'s trusted review and ratings platform',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || 'https://reviewbd.com'}/${locale}/search?q={search_term_string}`,
              },
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
      {/* Hero Section */}
      <section className="py-20 px-4 bg-linear-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
          <div className="mt-8">
            <SearchBar placeholder={tCommon('searchPlaceholder')} searchLabel={tCommon('search')} />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-center mb-10">{t('browseCategories')}</h2>
          <CategoryGrid categories={categories} locale={locale} />
        </div>
      </section>

      {/* Browse Products Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">{t('browseProducts')}</h2>
            <Link href={`/${locale}/search?tab=products`} className="text-sm text-primary hover:underline">
              {t('viewAllProducts')} →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
          {featuredProducts.length === 0 && (
            <p className="text-center text-muted-foreground py-8">{t('noProducts')}</p>
          )}
        </div>
      </section>

      {/* Top Rated Section */}
      <section className="py-16 px-4">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold mb-8">{t('topRated')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topRated.map((business: any) => (
              <BusinessCard key={business.id} business={business} locale={locale} />
            ))}
          </div>
          {topRated.length === 0 && (
            <p className="text-center text-muted-foreground py-8">{t('noBusinesses')}</p>
          )}
        </div>
      </section>
    </div>
  );
}
