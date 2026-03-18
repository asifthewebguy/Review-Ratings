'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { StarRating } from '@/components/ui/star-rating';
import { useAuthStore } from '@/lib/store';

interface ReviewEditFormProps {
  review: {
    id: string;
    rating: number;
    body: string;
  };
  locale: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const API_URL = '/api/v1';

export function ReviewEditForm({ review, locale, onSuccess, onCancel }: ReviewEditFormProps) {
  const t = useTranslations('review');
  const { tokens } = useAuthStore();
  const isBn = locale === 'bn';
  const [rating, setRating] = useState(review.rating);
  const [body, setBody] = useState(review.body);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError(t('ratingRequired'));
      return;
    }
    if (body.length < 20) {
      setError(
        isBn
          ? 'রিভিউ কমপক্ষে ২০ অক্ষরের হতে হবে'
          : 'Review must be at least 20 characters',
      );
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/reviews/${review.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ rating, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? 'Error submitting edit');
        return;
      }
      setSuccess(true);
      onSuccess?.();
    } catch {
      setError(isBn ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-green-800">
        <p className="text-sm font-medium">
          {isBn ? 'সম্পাদনা জমা হয়েছে, অ্যাডমিন পর্যালোচনার পর আপডেট হবে' : 'Edit submitted for admin review'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold">{isBn ? 'রিভিউ সম্পাদনা' : 'Edit Review'}</h4>
        <button type="button" onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
          {isBn ? 'বাতিল' : 'Cancel'}
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">{t('rating')}</label>
        <StarRating value={rating} onChange={setRating} size="lg" showLabel locale={locale} />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">{t('body')}</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={1000}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{body.length}/1000</p>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-primary py-2.5 text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {submitting
          ? (isBn ? 'জমা হচ্ছে...' : 'Submitting...')
          : (isBn ? 'সম্পাদনা জমা দিন' : 'Submit Edit for Review')}
      </button>
    </form>
  );
}
