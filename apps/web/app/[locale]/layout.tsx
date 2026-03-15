import type { Metadata } from 'next';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
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

  // Validate locale
  if (!routing.locales.includes(locale as 'bn' | 'en')) {
    notFound();
  }

  // Get messages for client components
  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <html lang={locale} dir="ltr">
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="relative flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
                <div className="flex items-center gap-6">
                  <a href={`/${locale}`} className="text-xl font-bold text-primary">
                    ReviewBD
                  </a>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href={locale === 'bn' ? '/en' : '/bn'}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {locale === 'bn' ? 'English' : 'বাংলা'}
                  </a>
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t py-8">
              <div className="container px-4 mx-auto max-w-7xl text-center text-sm text-muted-foreground">
                {locale === 'bn'
                  ? '© ২০২৬ ReviewBD। সর্বস্বত্ব সংরক্ষিত।'
                  : '© 2026 ReviewBD. All rights reserved.'}
              </div>
            </footer>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
