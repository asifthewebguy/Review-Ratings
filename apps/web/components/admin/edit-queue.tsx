'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { StarRating } from '@/components/ui/star-rating';

const API_URL = '/api/v1';

export function EditQueue({ locale }: { locale: string }) {
  const t = useTranslations('admin');
  const { tokens } = useAuthStore();
  const [edits, setEdits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const isBn = locale === 'bn';

  useEffect(() => { fetchEdits(); }, []);

  async function fetchEdits() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/edit-queue?status=pending&limit=20`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      });
      const data = await res.json();
      setEdits(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(editId: string, action: 'approve' | 'reject') {
    setActionLoading(editId);
    try {
      await fetch(`${API_URL}/admin/edits/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
        body: JSON.stringify({ action }),
      });
      setEdits((prev) => prev.filter((e) => e.id !== editId));
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div className="text-center text-muted-foreground py-8">{isBn ? 'লোড হচ্ছে...' : 'Loading...'}</div>;

  if (edits.length === 0) {
    return (
      <div className="rounded-xl border bg-background p-10 text-center text-muted-foreground">
        <p className="text-3xl mb-2">✅</p>
        <p>{t('noEdits')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {edits.map((edit) => (
        <div key={edit.id} className="rounded-xl border bg-background p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-semibold text-sm">{edit.review?.business?.name}</p>
              <p className="text-xs text-muted-foreground">
                {isBn ? 'রিভিউয়ার' : 'Reviewer'}: {edit.review?.user?.displayName}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleAction(edit.id, 'reject')}
                disabled={actionLoading === edit.id}
                className="text-xs border rounded-lg px-3 py-1.5 hover:border-red-400 transition-colors disabled:opacity-50"
              >
                {t('rejectEdit')}
              </button>
              <button
                onClick={() => handleAction(edit.id, 'approve')}
                disabled={actionLoading === edit.id}
                className="text-xs bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {t('approveEdit')}
              </button>
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Current review */}
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                {isBn ? 'বর্তমান রিভিউ' : 'Current Review'}
              </p>
              <div className="flex items-center gap-2 mb-1">
                <StarRating value={edit.review?.rating ?? 0} size="sm" />
              </div>
              <p className="text-sm line-clamp-4">{edit.review?.body}</p>
            </div>

            {/* Proposed edit */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
                {isBn ? 'প্রস্তাবিত সম্পাদনা' : 'Proposed Edit'}
              </p>
              <div className="flex items-center gap-2 mb-1">
                <StarRating value={edit.rating ?? 0} size="sm" />
                {edit.rating !== edit.review?.rating && (
                  <span className="text-xs text-amber-600">
                    ({isBn ? 'রেটিং পরিবর্তন' : 'rating changed'})
                  </span>
                )}
              </div>
              <p className="text-sm line-clamp-4">{edit.body}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
