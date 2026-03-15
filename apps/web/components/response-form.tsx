'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';

interface ResponseFormProps {
  reviewId: string;
  locale: string;
  existingResponse?: { body: string; isEdited: boolean } | null;
  onSuccess?: (response: { body: string }) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function ResponseForm({ reviewId, locale, existingResponse, onSuccess }: ResponseFormProps) {
  const t = useTranslations('dashboard');
  const { tokens } = useAuthStore();
  const [body, setBody] = useState(existingResponse?.body ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const isEdit = !!existingResponse;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || body.length > 500) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}/response`, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? 'Error');
        return;
      }
      setSuccess(true);
      onSuccess?.({ body: body.trim() });
    } catch {
      setError(locale === 'bn' ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return <p className="text-sm text-green-600 py-2">✓ {locale === 'bn' ? 'উত্তর সংরক্ষিত হয়েছে' : 'Response saved'}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('responsePlaceholder')}
        rows={3}
        maxLength={500}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{body.length}/500</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || body.length < 1}
          className="rounded-lg bg-primary px-4 py-1.5 text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {submitting ? t('saving') : t('submitResponse')}
        </button>
      </div>
    </form>
  );
}
