import { getTranslations } from 'next-intl/server';
import { PRODUCT_LIST } from '@/lib/products';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'products' });

  return (
    <>
      <Header />
      <div className="bg-gradient-to-br from-primary-900 to-primary-700 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href={`/${locale}#products`} className="text-primary-200 hover:text-white text-sm mb-4 inline-block">
            ← {t('title')}
          </Link>
          <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          <p className="text-primary-200 mt-2">{t('subtitle')}</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRODUCT_LIST.map((product) => (
            <Link
              key={product.id}
              href={`/${locale}/products/${product.id}`}
              className={`group bg-gradient-to-br ${product.from} ${product.to} border ${product.border} rounded-2xl p-5 hover:shadow-lg hover:scale-[1.02] transition-all`}
            >
              <span className="text-4xl block mb-3">{product.emoji}</span>
              <h2 className={`font-bold text-sm ${product.text}`}>{t(`items.${product.id}`)}</h2>
              <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
