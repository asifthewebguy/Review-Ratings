'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { StarRating } from '@/components/ui/star-rating';
import { useAuthStore } from '@/lib/store';

interface ProductReviewFormProps {
  productId: string;
  locale: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const API_URL = '/api/v1';

export function ProductReviewForm({ productId, locale, onSuccess, onCancel }: ProductReviewFormProps) {
  const t = useTranslations('products');
  const isBn = locale === 'bn';
  const { tokens } = useAuthStore();

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError(isBn ? 'রেটিং দিন' : 'Please select a rating'); return; }
    if (body.length < 20) { setError(isBn ? 'অন্তত ২০ অক্ষর লিখুন' : 'Write at least 20 characters'); return; }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ rating, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? (isBn ? 'ত্রুটি হয়েছে' : 'An error occurred'));
        return;
      }
      onSuccess();
    } catch {
      setError(isBn ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-3 border-t pt-3">
      <p className="text-sm font-medium">{t('reviewTitle')}</p>
      <div>
        <StarRating value={rating} size="md" onChange={setRating} />
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder={isBn ? 'আপনার অভিজ্ঞতা লিখুন (২০-১০০০ অক্ষর)' : 'Describe your experience (20-1000 characters)'}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{body.length}/1000</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting || rating === 0 || body.length < 20}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? t('submitting') : (isBn ? 'জমা দিন' : 'Submit')}
          </button>
        </div>
      </div>
    </form>
  );
}
