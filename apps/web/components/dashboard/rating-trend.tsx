'use client';

import { useTranslations } from 'next-intl';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RatingTrendProps {
  trend: Array<{ date: string; count: number; avgRating: number }>;
  locale: string;
}

export function RatingTrend({ trend, locale }: RatingTrendProps) {
  const t = useTranslations('dashboard');

  if (trend.length === 0) {
    return (
      <div className="rounded-xl border bg-background p-6">
        <h3 className="font-bold mb-4">{t('ratingTrend')}</h3>
        <p className="text-center text-muted-foreground py-8 text-sm">
          {locale === 'bn' ? 'এখনো কোনো ডেটা নেই' : 'No data yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background p-6">
      <h3 className="font-bold mb-4">{t('ratingTrend')}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={trend}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
          />
          <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value, name) => [
              String(value),
              name === 'avgRating'
                ? locale === 'bn' ? 'গড় রেটিং' : 'Avg Rating'
                : locale === 'bn' ? 'রিভিউ' : 'Reviews',
            ]}
          />
          <Line type="monotone" dataKey="avgRating" stroke="#16a34a" strokeWidth={2} dot={false} name="avgRating" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
