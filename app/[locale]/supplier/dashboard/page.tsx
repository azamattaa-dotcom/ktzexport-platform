import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-secret');

async function getSupplier() {
  const token = cookies().get('ktz_supplier_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const supplierId = payload.supplierId as string;
    return db.suppliers.findById(supplierId);
  } catch {
    return null;
  }
}

export default async function SupplierDashboard({ params }: { params: { locale: string } }) {
  const supplier = await getSupplier();
  if (!supplier) redirect(`/${params.locale}/supplier/login`);

  const productLabels: Record<string, string> = {
    flour_feed: 'Кормовая мука', flour_wheat: 'Пшеничная мука', wheat: 'Пшеница',
    barley: 'Ячмень', bran: 'Пшеничные отруби', flaxseed: 'Семена льна',
    sunflower: 'Семена подсолнечника', corn: 'Кукуруза',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">KTZ</span>
          </div>
          <span className="font-semibold text-gray-900">Кабинет поставщика</span>
        </div>
        <form action="/api/supplier/logout" method="POST">
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">Выйти</button>
        </form>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Информация о компании</h2>
          <dl className="space-y-3">
            <div className="flex gap-4">
              <dt className="text-sm text-gray-500 w-40 shrink-0">Компания</dt>
              <dd className="text-sm text-gray-900 font-medium">{supplier.companyName}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-sm text-gray-500 w-40 shrink-0">Страна</dt>
              <dd className="text-sm text-gray-900">{supplier.country}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-sm text-gray-500 w-40 shrink-0">Элеватор / склад</dt>
              <dd className="text-sm text-gray-900">{supplier.elevatorName || '—'}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-sm text-gray-500 w-40 shrink-0">Email</dt>
              <dd className="text-sm text-gray-900">{supplier.email}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-sm text-gray-500 w-40 shrink-0">Телефон</dt>
              <dd className="text-sm text-gray-900">{supplier.phone}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="text-sm text-gray-500 w-40 shrink-0">Статус</dt>
              <dd>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                  ✓ Одобрен
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Продукция</h2>
          <div className="flex flex-wrap gap-2">
            {supplier.products.map((p) => (
              <span key={p} className="text-sm bg-primary-50 text-primary-700 border border-primary-100 rounded-full px-3 py-1">
                {productLabels[p] ?? p}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="text-sm text-amber-800">
            Личный кабинет в разработке. Скоро здесь появится управление ценами, документами и запросами покупателей.
          </p>
        </div>
      </main>
    </div>
  );
}
