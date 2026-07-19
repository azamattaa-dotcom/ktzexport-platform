import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { PRODUCT_LIST } from '@/lib/products';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import SupplierCard from '@/components/SupplierCard';
import { isAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { locale, productId } = await params;

  const product = PRODUCT_LIST.find((p) => p.id === productId);
  if (!product) notFound();

  const [t, tc, allSuppliers, isAdmin] = await Promise.all([
    getTranslations({ locale, namespace: 'products' }),
    getTranslations({ locale, namespace: 'catalog' }),
    db.suppliers.findAll(),
    isAdminAuthenticated(),
  ]);
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
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
              <Image
                src={product.image}
                alt=""
                fill
                className="object-cover"
                priority
              />
            </div>
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
            {suppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                productId={productId}
                locale={locale}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
