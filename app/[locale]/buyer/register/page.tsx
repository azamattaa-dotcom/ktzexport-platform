import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import BuyerRegistrationForm from '@/components/BuyerRegistrationForm';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default async function BuyerRegisterPage() {
  const t = await getTranslations('buyerRegister');
  const locale = await getLocale();

  return (
    <>
      <Header />
      <div className="bg-gradient-to-r from-primary-800 to-primary-700 text-white py-12 px-4 text-center">
        <h1 className="text-3xl font-bold mb-2">{t('pageTitle')}</h1>
        <p className="text-primary-200 text-sm max-w-lg mx-auto">{t('pageSubtitle')}</p>
      </div>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <BuyerRegistrationForm />
          <div className="border-t border-gray-100 mt-6 pt-5 text-center text-sm text-gray-500">
            {t('alreadyRegistered')}{' '}
            <Link href={`/${locale}/buyer/login`} className="text-primary-700 font-medium hover:underline">
              {t('loginLink')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
