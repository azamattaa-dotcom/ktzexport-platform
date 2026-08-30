import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/routing';
import { BRAND_NAME } from '@/lib/brand';
import AgentChatWidget from '@/components/AgentChatWidget';
import '../globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ktzexport.com';

const OG_LOCALE: Record<string, string> = {
  ru: 'ru_RU', kk: 'kk_KZ', en: 'en_US', zh: 'zh_CN', tr: 'tr_TR',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  const languages: Record<string, string> = { 'x-default': '/ru' };
  for (const loc of locales) languages[loc] = `/${loc}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('siteTitle'), template: `%s — ${BRAND_NAME}` },
    description: t('siteDescription'),
    keywords: [BRAND_NAME, 'ktzexport', 'KTZ Export', 'экспорт зерна Казахстан', 'агропродукция Казахстан B2B'],
    alternates: {
      canonical: `/${locale}`,
      languages,
    },
    openGraph: {
      type: 'website',
      siteName: BRAND_NAME,
      title: t('siteTitle'),
      description: t('siteDescription'),
      url: `/${locale}`,
      locale: OG_LOCALE[locale] ?? 'ru_RU',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('siteTitle'),
      description: t('siteDescription'),
    },
    robots: { index: true, follow: true },
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
  if (!locales.includes(locale as any)) notFound();

  const messages = await getMessages();
  const t = await getTranslations('meta');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND_NAME,
    alternateName: 'ktzexport',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    description: t('siteDescription'),
    address: { '@type': 'PostalAddress', addressCountry: 'KZ' },
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
