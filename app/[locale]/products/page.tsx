import { getTranslations } from 'next-intl/server';
import { PRODUCT_LIST } from '@/lib/products';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';

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
              className={`group bg-gradient-to-br ${product.from} ${product.to} border ${product.border} rounded-2xl overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all`}
            >
              {product.image ? (
                <div className={`relative w-full aspect-square ${product.fit === 'contain' ? 'p-5' : ''}`}>
                  <Image
                    src={product.image}
                    alt=""
                    fill
                    className={product.fit === 'contain' ? 'object-contain' : 'object-cover'}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center aspect-square">
                  <span className="text-5xl">{product.emoji}</span>
                </div>
              )}
              <div className="px-4 pb-4 pt-2">
                <h2 className={`font-bold text-sm ${product.text}`}>{t(`items.${product.id}`)}</h2>
                <p className="text-xs text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">→</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
