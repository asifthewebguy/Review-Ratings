import Link from 'next/link';
import { StarRating } from '@/components/ui/star-rating';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    nameBn: string | null;
    description: string | null;
    imageUrl: string | null;
    slug: string;
    avgRating: number | string | null;
    reviewCount: number;
    category?: { nameEn: string; nameBn: string; icon: string | null } | null;
    tags?: string[];
  };
  locale: string;
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const isBn = locale === 'bn';
  const displayName = isBn && product.nameBn ? product.nameBn : product.name;
  const avgRating = product.avgRating != null ? parseFloat(String(product.avgRating)) : null;
  const categoryName = product.category
    ? isBn
      ? product.category.nameBn
      : product.category.nameEn
    : null;

  return (
    <Link
      href={`/${locale}/product/${product.slug}`}
      className="flex gap-3 rounded-xl border bg-background p-4 hover:border-primary hover:shadow-sm transition-all"
    >
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

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {avgRating ? (
            <>
              <StarRating value={Math.round(avgRating)} size="sm" />
              <span className="text-xs text-muted-foreground">
                {avgRating.toFixed(1)} &middot; {product.reviewCount} {isBn ? 'রিভিউ' : 'reviews'}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">
              {product.reviewCount > 0
                ? `${product.reviewCount} ${isBn ? 'রিভিউ' : 'reviews'}`
                : isBn
                  ? 'এখনো রিভিউ নেই'
                  : 'No reviews yet'}
            </span>
          )}

          {categoryName && (
            <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
              {product.category?.icon} {categoryName}
            </span>
          )}
        </div>

        {product.tags && product.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground border rounded-full px-1.5 py-0.5">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 self-center text-muted-foreground text-sm">›</div>
    </Link>
  );
}
