import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import SupplierProductManager from '@/components/SupplierProductManager';
import SupplierMessagesPanel from '@/components/SupplierMessagesPanel';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BRAND_NAME, BRAND_MARK } from '@/lib/brand';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret');

async function getSupplier() {
  const token = cookies().get('ktz_supplier_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return db.suppliers.findById(payload.supplierId as string);
  } catch {
    return null;
  }
}

export default async function SupplierDashboard({ params }: { params: { locale: string } }) {
  const supplier = await getSupplier();
  if (!supplier) redirect(`/${params.locale}/supplier/login`);

  const isImage = supplier.letterheadBase64?.startsWith('data:image');

  const t = await getTranslations('supplierDashboard');
  const ts = await getTranslations('supplier');
  const KNOWN_COUNTRIES = ['Казахстан', 'Россия', 'Узбекистан', 'Кыргызстан', 'Таджикистан', 'Туркменистан', 'Афганистан', 'Китай', 'Турция', 'Другое'];
  const KNOWN_VOLUMES = ['lt1000', '1000_5000', '5000_20000', 'gt20000'];
  const countryLabel = KNOWN_COUNTRIES.includes(supplier.country) ? ts(`countries.${supplier.country}` as any) : supplier.country;
  const volumeLabel = KNOWN_VOLUMES.includes(supplier.annualVolume) ? ts(`volumes.${supplier.annualVolume}` as any) : supplier.annualVolume;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${params.locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">{BRAND_MARK}</span>
            </div>
            <span className="font-semibold text-gray-900 hidden sm:block">{BRAND_NAME}</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-500">{t('cabinet')}</span>
        </div>
        <form action="/api/supplier/logout" method="POST">
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            {t('logout')}
          </button>
        </form>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Company info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary-700 to-primary-800 px-6 py-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl">
              {supplier.companyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{supplier.companyName}</h1>
              <p className="text-primary-200 text-sm">{countryLabel}{supplier.elevatorName ? ` · ${supplier.elevatorName}` : ''}</p>
            </div>
            <span className="ml-auto bg-green-400 text-white text-xs font-semibold px-3 py-1 rounded-full">{t('approved')}</span>
          </div>
          <div className="px-6 py-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs">{t('contact')}</p>
              <p className="text-gray-800 font-medium">{supplier.contactName}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">{ts('email')}</p>
              <p className="text-gray-800 font-medium">{supplier.email}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">{ts('phone')}</p>
              <p className="text-gray-800 font-medium">{supplier.phone}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">{ts('annualVolume')}</p>
              <p className="text-gray-800 font-medium">{volumeLabel}</p>
            </div>
          </div>
        </div>

        {/* Letterhead */}
        {supplier.letterheadBase64 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">{t('letterheadTitle')}</h2>
            {isImage ? (
              <img
                src={supplier.letterheadBase64}
                alt={t('letterheadTitle')}
                className="w-full max-h-64 object-contain rounded-xl border border-gray-100"
              />
            ) : (
              <a
                href={supplier.letterheadBase64}
                download={supplier.letterheadFileName ?? 'letterhead.pdf'}
                className="flex items-center gap-3 text-sm text-primary-700 border border-primary-200 rounded-xl px-4 py-3 hover:bg-primary-50 transition-colors"
              >
                <span className="text-2xl">📄</span>
                <span>{supplier.letterheadFileName ?? t('downloadDocument')}</span>
              </a>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{t('messagesTitle')}</h2>
          <SupplierMessagesPanel />
        </div>

        {/* Product management */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('productsTitle')}</h2>
          <SupplierProductManager supplier={supplier as any} />
        </div>

      </main>
    </div>
  );
}
