'use client';

import { useTranslations } from 'next-intl';

interface StatsCardsProps {
  stats: {
    reviewCount: number;
    avgRating: number | null;
    responseRate: number;
  };
  locale: string;
}

export function StatsCards({ stats, locale }: StatsCardsProps) {
  const t = useTranslations('dashboard');
  const isBn = locale === 'bn';

  const cards = [
    {
      label: t('totalReviews'),
      value: stats.reviewCount.toLocaleString(isBn ? 'bn-BD' : 'en-US'),
      icon: '💬',
      color: 'bg-blue-50 border-blue-200',
    },
    {
      label: t('avgRating'),
      value: stats.avgRating ? `${stats.avgRating.toFixed(1)} ★` : '—',
      icon: '⭐',
      color: 'bg-amber-50 border-amber-200',
    },
    {
      label: t('responseRate'),
      value: `${stats.responseRate}%`,
      icon: '📢',
      color: 'bg-green-50 border-green-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border p-5 ${card.color}`}>
          <p className="text-2xl mb-1">{card.icon}</p>
          <p className="text-2xl font-bold">{card.value}</p>
          <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
