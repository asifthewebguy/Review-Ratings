'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { ProductCard } from '@/components/product-card';
import { AddProductForm } from '@/components/add-product-form';

interface Product {
  id: string;
  name: string;
  nameBn: string | null;
  description: string | null;
  imageUrl: string | null;
  slug: string;
  avgRating: number | null;
  reviewCount: number;
  category?: { nameEn: string; nameBn: string; icon: string | null } | null;
  tags?: string[];
}

interface ProductsClientProps {
  businessId: string;
  businessSlug: string;
  initialProducts: Product[];
  locale: string;
}

export function ProductsClient({ businessId, businessSlug, initialProducts, locale }: ProductsClientProps) {
  const t = useTranslations('products');
  const isBn = locale === 'bn';
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showAddForm, setShowAddForm] = useState(false);

  function handleProductAdded(product: Product) {
    setProducts((prev) => [product, ...prev]);
    setShowAddForm(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products.length} {isBn ? 'টি পণ্য' : products.length === 1 ? 'product' : 'products'}
        </p>
        {isAuthenticated && (
          <button
            onClick={() => setShowAddForm(true)}
            className="text-sm text-primary border border-primary rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors"
          >
            + {t('addProduct')}
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border bg-background p-12 text-center text-muted-foreground">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-medium">{t('noProducts')}</p>
          <p className="text-sm mt-1">{t('noProductsHint')}</p>
          {isAuthenticated && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-sm text-primary underline"
            >
              {t('addProduct')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      )}

      {showAddForm && (
        <AddProductForm
          businessId={businessId}
          locale={locale}
          onSuccess={handleProductAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}
