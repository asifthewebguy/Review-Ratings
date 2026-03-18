'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { StarRating } from '@/components/ui/star-rating';
import { useAuthStore } from '@/lib/store';
import { ProductReviewForm } from '@/components/product-review-form';

interface SubmittedReview {
  rating: number;
  body: string;
}

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    nameBn: string | null;
    description: string | null;
    imageUrl: string | null;
    avgRating: number | string | null;
    reviewCount: number;
  };
  locale: string;
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const t = useTranslations('products');
  const isBn = locale === 'bn';
  const { isAuthenticated, user } = useAuthStore();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittedReview, setSubmittedReview] = useState<SubmittedReview | null>(null);
  const [localCount, setLocalCount] = useState(product.reviewCount);

  const displayName = isBn && product.nameBn ? product.nameBn : product.name;
  // Safely parse avgRating regardless of whether it comes as number, string, or Prisma Decimal
  const avgRating = product.avgRating != null ? parseFloat(String(product.avgRating)) : null;

  function handleReviewSuccess(rating: number, body: string) {
    setShowReviewForm(false);
    setSubmittedReview({ rating, body });
    setLocalCount((c) => c + 1);
  }

  return (
    <div className="rounded-xl border bg-background p-4 space-y-3">
      <div className="flex gap-3">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={displayName}
            className="h-16 w-16 rounded-lg object-cover shrink-0 border"
          />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-2xl shrink-0 border">
            📦
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-snug">{displayName}</p>
          {product.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {avgRating ? (
              <>
                <StarRating value={Math.round(avgRating)} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {avgRating.toFixed(1)} &middot; {localCount} {t('reviews')}
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                {localCount > 0
                  ? `${localCount} ${t('reviews')}`
                  : (isBn ? 'এখনো রিভিউ নেই' : 'No reviews yet')}
              </span>
            )}
          </div>
        </div>

        {!submittedReview && !showReviewForm && isAuthenticated && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="shrink-0 self-start text-xs text-primary hover:underline"
          >
            {t('writeReview')}
          </button>
        )}
      </div>

      {/* Show submitted review inline */}
      {submittedReview && (
        <div className="border-t pt-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{user?.displayName}</span>
            <StarRating value={submittedReview.rating} size="sm" />
          </div>
          <p className="text-sm text-muted-foreground">{submittedReview.body}</p>
          <p className="text-xs text-green-600">✓ {t('reviewSuccess')}</p>
        </div>
      )}

      {showReviewForm && (
        <ProductReviewForm
          productId={product.id}
          locale={locale}
          onSuccess={handleReviewSuccess}
          onCancel={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
}
