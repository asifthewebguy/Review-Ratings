'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { ClaimModal } from '@/components/claim-modal';

interface ClaimButtonProps {
  businessId: string;
  businessName: string;
  locale: string;
  onLoginRequired?: () => void;
}

export function ClaimButton({ businessId, businessName, locale, onLoginRequired }: ClaimButtonProps) {
  const t = useTranslations('claim');
  const { isAuthenticated } = useAuthStore();
  const [showModal, setShowModal] = useState(false);

  function handleClick() {
    if (!isAuthenticated) {
      onLoginRequired?.();
      return;
    }
    setShowModal(true);
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="text-sm border border-dashed border-muted-foreground/50 text-muted-foreground hover:border-primary hover:text-primary px-4 py-2 rounded-lg transition-colors"
      >
        {locale === 'bn' ? '🏢 এই ব্যবসার মালিক?' : '🏢 Own this business?'} {t('title')}
      </button>
      {showModal && (
        <ClaimModal
          businessId={businessId}
          businessName={businessName}
          locale={locale}
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}
    </>
  );
}
