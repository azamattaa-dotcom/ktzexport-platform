import { useTranslations } from 'next-intl';
import { db } from '@/lib/db';
import { PRODUCT_LIST } from '@/lib/products';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

const PRICE_LABELS: Record<string, string> = { USD: '$', KZT: '₸' };

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { locale, productId } = await params;
  const t = useTranslations('products');
  const tc = useTranslations('catalog');

  const product = PRODUCT_LIST.find((p) => p.id === productId);
  if (!product) notFound();

  const allSuppliers = await db.suppliers.findAll();
  const suppliers = allSuppliers.filter(
    (s) => s.status === 'approved' && s.products.includes(productId)
  );

  return (
    <>
      <Header />
      <div className={`bg-gradient-to-r ${product.from} ${product.to} py-14 px-4`}>
        <div className="max-w-5xl mx-auto">
          <Link href={`/${locale}#products`} className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
            ← {tc('backToProducts')}
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-6xl">{product.emoji}</span>
            <div>
              <h1 className={`text-3xl font-bold ${product.text}`}>{t(`items.${productId}`)}</h1>
              <p className="text-gray-500 mt-1">
                {tc('suppliersCount', { count: suppliers.length })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {suppliers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-4">🔍</div>
            <p>{tc('noSuppliers')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suppliers.map((supplier) => {
              const price = supplier.productPrices?.[productId];
              return (
                <div key={supplier.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1">
                      {/* Company header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                          {supplier.companyName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="font-bold text-gray-900">{supplier.companyName}</h2>
                          <p className="text-xs text-gray-400">{supplier.country}{supplier.elevatorName ? ` · ${supplier.elevatorName}` : ''}</p>
                        </div>
                      </div>

                      {/* Products tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {supplier.products.map((pid) => {
                          const p = PRODUCT_LIST.find((x) => x.id === pid);
                          return (
                            <span key={pid} className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${p?.from ?? 'from-gray-100'} ${p?.to ?? 'to-gray-100'} ${p?.text ?? 'text-gray-700'} border ${p?.border ?? 'border-gray-200'}`}>
                              {p?.emoji} {t(`items.${pid}`)}
                            </span>
                          );
                        })}
                      </div>

                      {/* Volume */}
                      <p className="text-xs text-gray-500">{tc('volume')}: {supplier.annualVolume}</p>
                    </div>

                    {/* Price + letterhead */}
                    <div className="flex flex-col items-end justify-between gap-3 shrink-0">
                      <div className="text-right">
                        {price ? (
                          <div className="text-primary-700 font-bold text-lg">
                            {price.type === 'fixed'
                              ? `${PRICE_LABELS[price.currency] ?? ''}${price.fixed?.toLocaleString()} / ${price.unit}`
                              : `${PRICE_LABELS[price.currency] ?? ''}${price.min?.toLocaleString()} – ${price.max?.toLocaleString()} / ${price.unit}`}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm italic">{tc('priceOnRequest')}</div>
                        )}
                      </div>

                      {supplier.letterheadBase64 && (
                        <a
                          href={supplier.letterheadBase64}
                          download={supplier.letterheadFileName ?? 'letterhead'}
                          className="text-xs text-primary-600 hover:text-primary-800 border border-primary-200 hover:border-primary-400 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          📄 {tc('downloadLetterhead')}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
