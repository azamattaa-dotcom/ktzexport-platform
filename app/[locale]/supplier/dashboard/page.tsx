import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import SupplierDashboardTabs from '@/components/SupplierDashboardTabs';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

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
  if (!supplier) redirect(`/${params.locale}/login`);

  const t = await getTranslations('supplierDashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${params.locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">KTZ</span>
            </div>
            <span className="font-semibold text-gray-900 hidden sm:block">KTZ Export</span>
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

      <main className="max-w-3xl mx-auto px-4 py-8">
        <SupplierDashboardTabs supplier={supplier} />
      </main>
    </div>
  );
}
