'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface BuyerProfile {
  id: string;
  companyName: string;
  country: string;
  registrationNumber: string;
  address: string;
  directorName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  hasCharter: boolean;
  hasRegistration: boolean;
  hasPassport: boolean;
  createdAt: string;
}

const STATUS_CONFIG = {
  pending:  { label: 'На проверке',  color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  approved: { label: 'Одобрен',      color: 'bg-green-100 text-green-800',   icon: '✅' },
  rejected: { label: 'Отклонён',     color: 'bg-red-100 text-red-800',       icon: '❌' },
};

export default function BuyerDashboardPage() {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/buyer/me')
      .then((r) => { if (r.status === 401) router.push(`/${locale}/buyer/login`); return r.ok ? r.json() : null; })
      .then((d) => { if (d) setBuyer(d); })
      .finally(() => setLoading(false));
  }, [locale, router]);

  async function handleLogout() {
    await fetch('/api/buyer/logout', { method: 'POST' });
    router.push(`/${locale}/buyer/login`);
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Загрузка...</div>
    </div>
  );

  if (!buyer) return null;

  const st = STATUS_CONFIG[buyer.status];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">KTZ</span>
          </div>
          <span className="font-bold text-gray-900">KTZ Export</span>
        </Link>
        <button onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors">
          Выйти
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Status card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{buyer.companyName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{buyer.country} · {buyer.registrationNumber}</p>
            </div>
            <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${st.color}`}>
              {st.icon} {st.label}
            </span>
          </div>

          {buyer.status === 'pending' && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              Ваша заявка находится на проверке. Мы уведомим вас по email после завершения верификации документов. Обычно это занимает 1–2 рабочих дня.
            </div>
          )}
          {buyer.status === 'rejected' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
              <span className="font-medium">Причина отклонения:</span> {buyer.rejectionReason || 'Не указана'}
              <br />Свяжитесь с нами: <a href="mailto:info@ktzexport.com" className="underline">info@ktzexport.com</a>
            </div>
          )}
          {buyer.status === 'approved' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
              Верификация пройдена. Вы можете просматривать поставщиков и связываться с ними через чат.
            </div>
          )}
        </div>

        {/* Company info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Данные компании</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              ['Директор', buyer.directorName],
              ['Контактное лицо', buyer.contactName],
              ['Email', buyer.email],
              ['Телефон', buyer.phone],
              ['Адрес', buyer.address],
              ...(buyer.website ? [['Сайт', buyer.website]] : []),
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-gray-400 text-xs">{label}</span>
                <p className="text-gray-900 font-medium mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Загруженные документы</h2>
          <div className="space-y-2">
            {[
              ['Устав компании', buyer.hasCharter],
              ['Справка о государственной регистрации', buyer.hasRegistration],
              ['Паспорт директора / учредителя', buyer.hasPassport],
            ].map(([label, has]) => (
              <div key={label as string} className="flex items-center gap-3 text-sm">
                <span className={has ? 'text-green-500' : 'text-gray-300'}>
                  {has ? '✓' : '○'}
                </span>
                <span className={has ? 'text-gray-800' : 'text-gray-400'}>{label as string}</span>
              </div>
            ))}
          </div>
        </div>

        {buyer.status === 'approved' && (
          <Link href={`/${locale}/products`}
            className="block w-full bg-primary-700 hover:bg-primary-800 text-white font-medium py-3 rounded-xl text-sm text-center transition-colors">
            Перейти к каталогу поставщиков →
          </Link>
        )}
      </main>
    </div>
  );
}
