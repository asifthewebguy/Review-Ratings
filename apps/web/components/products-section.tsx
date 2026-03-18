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
  avgRating: number | null;
  reviewCount: number;
}

interface ProductsSectionProps {
  businessId: string;
  initialProducts: Product[];
  locale: string;
}

export function ProductsSection({ businessId, initialProducts, locale }: ProductsSectionProps) {
  const t = useTranslations('products');
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
        <h2 className="text-xl font-bold">{t('title')} ({products.length})</h2>
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
        <div className="rounded-xl border bg-background p-8 text-center text-muted-foreground">
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
