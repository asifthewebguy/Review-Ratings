import { StarRating } from '@/components/ui/star-rating';
import { formatDistanceToNow } from 'date-fns';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    body: string;
    photoUrls: string[];
    editedAt?: string | null;
    isVerifiedPurchase: boolean;
    createdAt: string;
    user: { displayName: string; avatarUrl?: string | null; trustLevel: number };
    response?: {
      body: string;
      user: { displayName: string };
      createdAt: string;
    } | null;
  };
  locale: string;
}

export function ReviewCard({ review, locale }: ReviewCardProps) {
  const isBn = locale === 'bn';
  const timeAgo = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });

  return (
    <div className="rounded-xl border bg-background p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden">
            {review.user.avatarUrl ? (
              <img
                src={review.user.avatarUrl}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              review.user.displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{review.user.displayName}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StarRating value={review.rating} size="sm" />
          <div className="flex gap-2">
            {review.isVerifiedPurchase && (
              <span className="text-xs text-green-600">
                ✓ {isBn ? 'যাচাইকৃত' : 'Verified'}
              </span>
            )}
            {review.editedAt && (
              <span className="text-xs text-muted-foreground">
                {isBn ? 'সম্পাদিত' : 'Edited'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <p className="mt-3 text-sm leading-relaxed">{review.body}</p>

      {/* Photos */}
      {review.photoUrls?.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {review.photoUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="h-20 w-20 rounded-lg object-cover cursor-pointer hover:opacity-90"
            />
          ))}
        </div>
      )}

      {/* Business Response */}
      {review.response && (
        <div className="mt-4 rounded-lg bg-muted/50 p-4 border-l-2 border-primary">
          <p className="text-xs font-semibold text-primary mb-1">
            {isBn ? '📢 ব্যবসার প্রতিক্রিয়া' : '📢 Business Response'} —{' '}
            {review.response.user.displayName}
          </p>
          <p className="text-sm">{review.response.body}</p>
        </div>
      )}
    </div>
  );
}
