import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ProductCard } from '@/components/product-card';
import { ProductsClient } from '@/components/products-client';

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

async function getProducts(businessId: string) {
  try {
    const res = await fetch(`${API_URL}/businesses/${businessId}/products?limit=50`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.items ?? [];
  } catch {
    return [];
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
  const isBn = locale === 'bn';
  return {
    title: isBn ? `${business.name} — পণ্যসমূহ` : `${business.name} — Products`,
  };
}

export default async function BusinessProductsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'products' });
  const isBn = locale === 'bn';

  const business = await getBusiness(slug);
  if (!business) notFound();

  const initialProducts = await getProducts(business.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href={`/${locale}/business/${slug}`} className="hover:text-foreground">
          {business.name}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{t('title')}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isBn ? `${business.name}-এর পণ্য` : `Products by ${business.name}`}
        </h1>
      </div>

      {/* Client component handles add-product + state */}
      <ProductsClient
        businessId={business.id}
        businessSlug={slug}
        initialProducts={initialProducts}
        locale={locale}
      />
    </div>
  );
}
