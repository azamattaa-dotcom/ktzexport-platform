import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LogisticsForm from '@/components/LogisticsForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'logistics' });
  return {
    title: t('pageTitle'),
    description: t('pageSubtitle'),
    alternates: { canonical: `/${locale}/logistics` },
  };
}

export default async function LogisticsPage() {
  const t = await getTranslations('logistics');

  return (
    <>
      <Header />
      <div className="bg-gradient-to-r from-primary-800 to-primary-700 text-white py-14 px-4 text-center">
        <h1 className="text-3xl font-bold mb-3">{t('pageTitle')}</h1>
        <p className="text-primary-200 max-w-xl mx-auto text-sm">{t('pageSubtitle')}</p>
      </div>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <LogisticsForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
