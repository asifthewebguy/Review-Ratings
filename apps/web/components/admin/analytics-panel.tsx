'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface AnalyticsData {
  totals: { users: number; businesses: number; reviews: number; claims: number };
  queues: { pendingFlags: number; pendingClaims: number; flaggedReviews: number };
  recent: { reviews: number; users: number };
  dailyTrend: Array<{ date: string; count: number }>;
}

export function AnalyticsPanel({ locale }: { locale: string }) {
  const t = useTranslations('admin');
  const { tokens } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const isBn = locale === 'bn';

  useEffect(() => {
    fetch(`${API_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${tokens?.accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => setData(d.data));
  }, [tokens]);

  if (!data) return <div className="text-center text-muted-foreground py-8">{isBn ? 'লোড হচ্ছে...' : 'Loading...'}</div>;

  const statCards = [
    { label: t('totalUsers'), value: data.totals.users, icon: '👤', color: 'bg-blue-50 border-blue-200' },
    { label: t('totalBusinesses'), value: data.totals.businesses, icon: '🏢', color: 'bg-purple-50 border-purple-200' },
    { label: t('totalReviews'), value: data.totals.reviews, icon: '💬', color: 'bg-green-50 border-green-200' },
    { label: t('flaggedReviews'), value: data.queues.flaggedReviews, icon: '🚩', color: 'bg-red-50 border-red-200' },
    { label: t('pendingFlags'), value: data.queues.pendingFlags, icon: '⚠️', color: 'bg-amber-50 border-amber-200' },
    { label: t('pendingClaims'), value: data.queues.pendingClaims, icon: '📋', color: 'bg-orange-50 border-orange-200' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.color}`}>
            <p className="text-xl mb-1">{card.icon}</p>
            <p className="text-2xl font-bold">{card.value.toLocaleString(isBn ? 'bn-BD' : 'en-US')}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {data.dailyTrend.length > 0 && (
        <div className="rounded-xl border bg-background p-6">
          <h3 className="font-bold mb-4">{t('dailyReviews')}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0] as any} name={isBn ? 'রিভিউ' : 'Reviews'} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
