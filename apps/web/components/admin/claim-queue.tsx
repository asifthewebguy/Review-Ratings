'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function ClaimQueue({ locale }: { locale: string }) {
  const t = useTranslations('admin');
  const { tokens } = useAuthStore();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const isBn = locale === 'bn';

  useEffect(() => { fetchClaims(); }, []);

  async function fetchClaims() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/claims?status=pending&limit=20`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      });
      const data = await res.json();
      setClaims(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(claimId: string, status: 'approved' | 'rejected') {
    setActionLoading(claimId);
    try {
      await fetch(`${API_URL}/admin/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
        body: JSON.stringify({ status, rejectionReason: rejectReason[claimId] }),
      });
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div className="text-center text-muted-foreground py-8">{isBn ? 'লোড হচ্ছে...' : 'Loading...'}</div>;

  if (claims.length === 0) {
    return (
      <div className="rounded-xl border bg-background p-10 text-center text-muted-foreground">
        <p className="text-3xl mb-2">✅</p>
        <p>{t('noClaims')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {claims.map((claim) => (
        <div key={claim.id} className="rounded-xl border bg-background p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="font-semibold">{claim.business?.name}</p>
              <p className="text-sm text-muted-foreground">
                {isBn ? 'আবেদনকারী' : 'Claimant'}: {claim.user?.displayName} ({claim.user?.phone})
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isBn ? 'নথির ধরন' : 'Doc type'}: <span className="font-medium">{claim.docType}</span>
              </p>
            </div>
          </div>

          {/* Document links */}
          <div className="flex gap-3 mb-3 text-sm">
            <a href={claim.docUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {isBn ? '📄 নথি দেখুন' : '📄 View Document'}
            </a>
            {claim.docUrlBack && (
              <a href={claim.docUrlBack} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {isBn ? '📄 পেছনের দিক' : '📄 Back Side'}
              </a>
            )}
          </div>

          {/* Rejection reason input */}
          <input
            type="text"
            placeholder={isBn ? 'প্রত্যাখ্যানের কারণ (ঐচ্ছিক)' : 'Rejection reason (optional)'}
            value={rejectReason[claim.id] ?? ''}
            onChange={(e) => setRejectReason((prev) => ({ ...prev, [claim.id]: e.target.value }))}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="flex gap-3">
            <button
              onClick={() => handleAction(claim.id, 'approved')}
              disabled={actionLoading === claim.id}
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {t('approveClaim')}
            </button>
            <button
              onClick={() => handleAction(claim.id, 'rejected')}
              disabled={actionLoading === claim.id}
              className="rounded-lg border border-red-300 text-red-600 px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {t('rejectClaim')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
