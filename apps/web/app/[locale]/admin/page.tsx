import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminClient } from '@/components/admin/admin-client';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return { title: t('title') };
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <AdminClient locale={locale} />;
}
