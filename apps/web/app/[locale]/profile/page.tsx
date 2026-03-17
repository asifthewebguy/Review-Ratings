import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { VerificationSection } from '@/components/verification/verification-section';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  return { title: `${t('verification')} — ReviewBD` };
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {locale === 'bn' ? 'প্রোফাইল ও যাচাই' : 'Profile & Verification'}
      </h1>
      <VerificationSection locale={locale} />
    </div>
  );
}
