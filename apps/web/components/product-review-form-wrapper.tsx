'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { StarRating } from '@/components/ui/star-rating';
import { useAuthStore } from '@/lib/store';

interface ProductReviewFormWrapperProps {
  productSlug: string;
  locale: string;
}

const API_URL = '/api/v1';

export function ProductReviewFormWrapper({ productSlug, locale }: ProductReviewFormWrapperProps) {
  const t = useTranslations('products');
  const isBn = locale === 'bn';
  const { isAuthenticated, tokens } = useAuthStore();

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border bg-background p-5">
        <h3 className="font-bold mb-2">{t('reviewTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('loginRequired')}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-xl border bg-background p-5 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-medium text-sm">{t('reviewSuccess')}</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError(isBn ? 'রেটিং দিন' : 'Please select a rating'); return; }
    if (body.length < 20) { setError(isBn ? 'অন্তত ২০ অক্ষর লিখুন' : 'Write at least 20 characters'); return; }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/products/${productSlug}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ rating, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error?.code === 'REVIEW_EXISTS'
          ? (isBn ? 'আপনি ইতিমধ্যে রিভিউ দিয়েছেন' : t('alreadyReviewed'))
          : (data.error?.message ?? (isBn ? 'ত্রুটি হয়েছে' : 'An error occurred'));
        setError(msg);
        return;
      }
      setSubmitted(true);
    } catch {
      setError(isBn ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border bg-background p-5">
      <h3 className="font-bold mb-3">{t('reviewTitle')}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{isBn ? 'রেটিং' : 'Rating'}</p>
          <StarRating value={rating} size="md" onChange={setRating} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">{isBn ? 'আপনার অভিজ্ঞতা' : 'Your Experience'}</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder={isBn ? 'আপনার অভিজ্ঞতা লিখুন (২০-১০০০ অক্ষর)' : 'Describe your experience (20-1000 characters)'}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <p className="text-xs text-muted-foreground text-right mt-0.5">{body.length}/1000</p>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={submitting || rating === 0 || body.length < 20}
          className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {submitting ? (isBn ? 'জমা হচ্ছে...' : 'Submitting...') : (isBn ? 'রিভিউ জমা দিন' : 'Submit Review')}
        </button>
      </form>
    </div>
  );
}
