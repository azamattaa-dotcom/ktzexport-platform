import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/routing';
import AgentChatWidget from '@/components/AgentChatWidget';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as any)) notFound();

  const messages = await getMessages();
  const t = await getTranslations('meta');

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <title>{t('siteTitle')}</title>
        <meta name="description" content={t('siteDescription')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
          <AgentChatWidget />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
