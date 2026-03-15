'use client';

import { ReviewForm } from '@/components/review-form';

interface Props {
  businessId: string;
  locale: string;
}

export function ReviewFormWrapper({ businessId, locale }: Props) {
  return (
    <ReviewForm
      businessId={businessId}
      locale={locale}
    />
  );
}
