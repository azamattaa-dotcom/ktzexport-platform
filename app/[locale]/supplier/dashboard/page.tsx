import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import SupplierProductManager from '@/components/SupplierProductManager';
import Link from 'next/link';

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
          <span className="text-sm text-gray-500">Кабинет поставщика</span>
        </div>
        <form action="/api/supplier/logout" method="POST">
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            Выйти
          </button>
        </form>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Company info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-primary-700 to-primary-800 px-6 py-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl">
              {supplier.companyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{supplier.companyName}</h1>
              <p className="text-primary-200 text-sm">{supplier.country}{supplier.elevatorName ? ` · ${supplier.elevatorName}` : ''}</p>
            </div>
            <span className="ml-auto bg-green-400 text-white text-xs font-semibold px-3 py-1 rounded-full">✓ Одобрен</span>
          </div>
          <div className="px-6 py-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Контакт</p>
              <p className="text-gray-800 font-medium">{supplier.contactName}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Email</p>
              <p className="text-gray-800 font-medium">{supplier.email}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Телефон</p>
              <p className="text-gray-800 font-medium">{supplier.phone}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Годовой объём</p>
              <p className="text-gray-800 font-medium">{supplier.annualVolume}</p>
            </div>
          </div>
        </div>

        {/* Letterhead */}
        {supplier.letterheadBase64 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Фирменный бланк</h2>
            {isImage ? (
              <img
                src={supplier.letterheadBase64}
                alt="Фирменный бланк"
                className="w-full max-h-64 object-contain rounded-xl border border-gray-100"
              />
            ) : (
              <a
                href={supplier.letterheadBase64}
                download={supplier.letterheadFileName ?? 'letterhead.pdf'}
                className="flex items-center gap-3 text-sm text-primary-700 border border-primary-200 rounded-xl px-4 py-3 hover:bg-primary-50 transition-colors"
              >
                <span className="text-2xl">📄</span>
                <span>{supplier.letterheadFileName ?? 'Скачать документ'}</span>
              </a>
            )}
          </div>
        )}

        {/* Product management */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Продукция и цены</h2>
          <SupplierProductManager supplier={supplier as any} />
        </div>

      </main>
    </div>
  );
}
