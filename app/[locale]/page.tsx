import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ProductCategories from '@/components/ProductCategories';
import HowItWorks from '@/components/HowItWorks';
import WhyUs from '@/components/WhyUs';
import Footer from '@/components/Footer';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

function SupplierCTA() {
  const t = useTranslations('supplier');
  const locale = useLocale();
  return (
    <section className="py-20 bg-primary-700 text-white text-center">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-4xl mb-4">🌾</div>
        <h2 className="text-3xl font-bold mb-4">{t('registerTitle')}</h2>
        <p className="text-primary-100 mb-8">{t('registerSubtitle')}</p>
        <Link
          href={`/${locale}/suppliers/register`}
          className="inline-block bg-white text-primary-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
        >
          {t('submit')} →
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ProductCategories />
        <HowItWorks />
        <WhyUs />
        <SupplierCTA />
      </main>
      <Footer />
    </>
  );
}
