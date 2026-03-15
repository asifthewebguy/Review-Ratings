'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';

interface ClaimModalProps {
  businessId: string;
  businessName: string;
  locale: string;
  onClose: () => void;
  onSuccess: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function ClaimModal({ businessId, businessName, locale, onClose, onSuccess }: ClaimModalProps) {
  const t = useTranslations('claim');
  const { tokens } = useAuthStore();
  const [docType, setDocType] = useState<'trade_license' | 'nid'>('trade_license');
  const [docUrl, setDocUrl] = useState('');
  const [docUrlBack, setDocUrlBack] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!docUrl.trim()) {
      setError(locale === 'bn' ? 'নথির URL দিন' : 'Please provide the document URL');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/businesses/${businessId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({ docType, docUrl: docUrl.trim(), docUrlBack: docUrlBack.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? 'Error submitting claim');
        return;
      }
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch {
      setError(locale === 'bn' ? 'সংযোগ ত্রুটি' : 'Connection error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t('title')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{businessName} · {t('subtitle')}</p>

        {success ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-800 text-sm">
            ✓ {t('success')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('docType')}</label>
              <div className="flex gap-3">
                {(['trade_license', 'nid'] as const).map((type) => (
                  <label key={type} className={`flex-1 border rounded-lg p-3 cursor-pointer text-sm text-center transition-colors ${docType === type ? 'border-primary bg-primary/5 text-primary font-medium' : 'hover:border-primary/50'}`}>
                    <input type="radio" name="docType" value={type} checked={docType === type} onChange={() => setDocType(type)} className="sr-only" />
                    {type === 'trade_license' ? t('tradeLicense') : t('nid')}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('docUrl')}</label>
              <input
                type="url"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('docUrlBack')}</label>
              <input
                type="url"
                value={docUrlBack}
                onChange={(e) => setDocUrlBack(e.target.value)}
                placeholder="https://... (optional)"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? t('submitting') : t('submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
