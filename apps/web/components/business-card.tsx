import { Link } from '@/i18n/navigation';
import { RatingBadge } from '@/components/ui/star-rating';

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    logoUrl?: string | null;
    avgRating?: number | null;
    reviewCount: number;
    isClaimed: boolean;
    category: { nameEn: string; nameBn: string; slug: string };
    district?: { nameEn: string; nameBn: string } | null;
  };
  locale: string;
}

export function BusinessCard({ business, locale }: BusinessCardProps) {
  const isBn = locale === 'bn';
  const categoryName = isBn ? business.category.nameBn : business.category.nameEn;
  const locationName = business.district
    ? isBn
      ? business.district.nameBn
      : business.district.nameEn
    : null;

  return (
    <Link
      href={`/business/${business.slug}`}
      className="flex gap-4 rounded-xl border bg-background p-4 hover:border-primary hover:shadow-md transition-all group"
    >
      {/* Logo */}
      <div className="h-16 w-16 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
        {business.logoUrl ? (
          <img
            src={business.logoUrl}
            alt={business.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xl">🏢</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors truncate">
            {business.name}
          </h3>
          {business.isClaimed && (
            <span className="shrink-0 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              ✓
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
          <span>{categoryName}</span>
          {locationName && (
            <>
              <span>·</span>
              <span>{locationName}</span>
            </>
          )}
        </div>
        {business.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {business.description}
          </p>
        )}
        <div className="mt-2">
          {business.avgRating ? (
            <RatingBadge
              value={Number(business.avgRating)}
              count={business.reviewCount}
              locale={locale}
            />
          ) : (
            <span className="text-sm text-muted-foreground">
              {locale === 'bn' ? 'এখনো কোনো রিভিউ নেই' : 'No reviews yet'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
