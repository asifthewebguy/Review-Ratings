import { getTranslations } from 'next-intl/server';
import { CreateBusinessForm } from '@/components/businesses/create-business-form';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'business' });
  return { title: t('createTitle') };
}

export default async function NewBusinessPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'business' });

  return (
    <main className="min-h-screen bg-background py-10">
      <div className="container mx-auto max-w-xl px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{t('createTitle')}</h1>
          <p className="mt-1 text-muted-foreground">{t('createSubtitle')}</p>
        </div>
        <div className="rounded-xl border bg-background p-6">
          <CreateBusinessForm locale={locale} />
        </div>
      </div>
    </main>
  );
}
