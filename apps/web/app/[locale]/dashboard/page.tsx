import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  return { title: t('title') };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <DashboardClient locale={locale} />;
}
