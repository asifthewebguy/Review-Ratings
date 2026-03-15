'use client';

interface StarRatingProps {
  value: number; // 1-5
  onChange?: (value: number) => void; // if undefined, read-only
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  locale?: string;
}

const LABELS_BN = ['অত্যন্ত খারাপ', 'খারাপ', 'গড়', 'খুব ভালো', 'অসাধারণ'];
const LABELS_EN = ['Terrible', 'Bad', 'Average', 'Good', 'Excellent'];

export function StarRating({
  value,
  onChange,
  size = 'md',
  showLabel = false,
  locale = 'bn',
}: StarRatingProps) {
  const labels = locale === 'bn' ? LABELS_BN : LABELS_EN;
  const sizes = { sm: 'text-base', md: 'text-2xl', lg: 'text-4xl' };
  const isInteractive = !!onChange;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!isInteractive}
          className={`${sizes[size]} transition-transform ${isInteractive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
          aria-label={labels[star - 1]}
        >
          <span className={star <= value ? 'text-amber-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
      {showLabel && value > 0 && (
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {labels[value - 1]}
        </span>
      )}
    </div>
  );
}

// Display-only compact rating
export function RatingBadge({
  value,
  count,
  locale = 'bn',
}: {
  value: number;
  count: number;
  locale?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-amber-400">★</span>
      <span className="font-bold">{value.toFixed(1)}</span>
      <span className="text-muted-foreground text-sm">
        ({count.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')})
      </span>
    </div>
  );
}
