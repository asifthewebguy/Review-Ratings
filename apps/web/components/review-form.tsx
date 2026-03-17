'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { StarRating } from '@/components/ui/star-rating';
import { useAuthStore } from '@/lib/store';

interface ReviewFormProps {
  businessId: string;
  locale: string;
  onSuccess?: () => void;
  onLoginRequired?: () => void;
}

const API_URL = '/api/v1';

export function ReviewForm({
  businessId,
  locale,
  onSuccess,
  onLoginRequired,
}: ReviewFormProps) {
  const router = useRouter();
  const { isAuthenticated, tokens, user, openLoginModal } = useAuthStore();
  const t = useTranslations('review');
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (!user?.emailVerifiedAt || user?.nidStatus !== 'approved') {
      setError(
        locale === 'bn'
          ? 'রিভিউ জমা দিতে ইমেইল ও জাতীয় পরিচয়পত্র (NID) যাচাই করুন'
          : 'Please verify your email and National ID before submitting a review',
      );
      router.push(`/${locale}/profile`);
      return;
    }
    if (rating === 0) {
      setError(t('ratingRequired'));
      return;
    }
    if (body.length < 20) {
      setError(
        locale === 'bn'
          ? 'রিভিউ কমপক্ষে ২০ অক্ষরের হতে হবে'
          : 'Review must be at least 20 characters',
      );
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/businesses/${businessId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ rating, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? 'Error submitting review');
        return;
      }
      setSuccess(true);
      router.refresh();
      onSuccess?.();
    } catch {
      setError(locale === 'bn' ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center text-green-800">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-medium">{t('success')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-background p-6 space-y-4">
      <h3 className="text-lg font-bold">{t('title')}</h3>

      <div>
        <label className="block text-sm font-medium mb-2">{t('rating')}</label>
        <StarRating value={rating} onChange={setRating} size="lg" showLabel locale={locale} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">{t('body')}</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('bodyPlaceholder')}
          rows={5}
          maxLength={1000}
          className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{body.length}/1000</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-primary py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {submitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
