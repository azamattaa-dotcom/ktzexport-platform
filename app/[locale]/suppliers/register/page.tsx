import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SupplierRegistrationForm from '@/components/SupplierRegistrationForm';
import { useTranslations } from 'next-intl';

function PageHeader() {
  const t = useTranslations('supplier');
  return (
    <div className="bg-gradient-to-r from-primary-800 to-primary-700 text-white py-14 px-4 text-center">
      <h1 className="text-3xl font-bold mb-3">{t('registerTitle')}</h1>
      <p className="text-primary-200 max-w-md mx-auto text-sm">{t('registerSubtitle')}</p>
    </div>
  );
}

export default function SupplierRegisterPage() {
  return (
    <>
      <Header />
      <PageHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <SupplierRegistrationForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
