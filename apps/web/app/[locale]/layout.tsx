import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import '@/app/globals.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    title: {
      default: `${t('appName')} — ${t('tagline')}`,
      template: `%s | ${t('appName')}`,
    },
    description: t('tagline'),
    openGraph: {
      type: 'website',
      locale: locale === 'bn' ? 'bn_BD' : 'en_US',
      siteName: t('appName'),
      title: `${t('appName')} — ${t('tagline')}`,
      description: t('tagline'),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${t('appName')} — ${t('tagline')}`,
      description: t('tagline'),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'bn' | 'en')) {
    notFound();
  }

  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html lang={locale} dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://reviewbd.com'}/${locale}`} />
        <link rel="alternate" hrefLang="bn" href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://reviewbd.com'}/bn`} />
        <link rel="alternate" hrefLang="en" href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://reviewbd.com'}/en`} />
        <link rel="alternate" hrefLang="x-default" href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://reviewbd.com'}/bn`} />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <div className="relative flex min-h-screen flex-col">
              <Header locale={locale} />
              <main className="flex-1">{children}</main>
              <footer className="border-t py-8">
                <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
                  {locale === 'bn'
                    ? '© ২০২৬ ReviewBD। সর্বস্বত্ব সংরক্ষিত।'
                    : '© 2026 ReviewBD. All rights reserved.'}
                </div>
              </footer>
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
