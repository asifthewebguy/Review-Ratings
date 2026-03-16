'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { StarRating } from '@/components/ui/star-rating';

const API_URL = '/api/v1';

export function FlagQueue({ locale }: { locale: string }) {
  const t = useTranslations('admin');
  const { tokens } = useAuthStore();
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const isBn = locale === 'bn';

  useEffect(() => { fetchFlags(); }, []);

  async function fetchFlags() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/flags?status=pending&limit=20`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      });
      const data = await res.json();
      setFlags(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(flagId: string, action: 'remove_review' | 'dismiss') {
    setActionLoading(flagId);
    try {
      await fetch(`${API_URL}/admin/flags/${flagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
        body: JSON.stringify({ action }),
      });
      setFlags((prev) => prev.filter((f) => f.id !== flagId));
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div className="text-center text-muted-foreground py-8">{isBn ? 'লোড হচ্ছে...' : 'Loading...'}</div>;

  if (flags.length === 0) {
    return (
      <div className="rounded-xl border bg-background p-10 text-center text-muted-foreground">
        <p className="text-3xl mb-2">✅</p>
        <p>{t('noFlags')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {flags.map((flag) => (
        <div key={flag.id} className="rounded-xl border bg-background p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-semibold text-sm">{flag.review?.business?.name}</p>
              <p className="text-xs text-muted-foreground">
                {isBn ? 'রিপোর্টার' : 'Reporter'}: {flag.reporter?.displayName} · {isBn ? 'কারণ' : 'Reason'}: <span className="font-medium">{flag.reason}</span>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleAction(flag.id, 'dismiss')}
                disabled={actionLoading === flag.id}
                className="text-xs border rounded-lg px-3 py-1.5 hover:border-primary transition-colors disabled:opacity-50"
              >
                {t('dismissFlag')}
              </button>
              <button
                onClick={() => handleAction(flag.id, 'remove_review')}
                disabled={actionLoading === flag.id}
                className="text-xs bg-red-600 text-white rounded-lg px-3 py-1.5 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {t('removeReview')}
              </button>
            </div>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <StarRating value={flag.review?.rating ?? 0} size="sm" />
              <span className="text-xs text-muted-foreground">{flag.review?.user?.displayName}</span>
            </div>
            <p className="line-clamp-3">{flag.review?.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
