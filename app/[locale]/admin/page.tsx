'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Supplier } from '@/lib/db';

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/suppliers')
      .then((r) => {
        if (r.status === 401) { router.push(`/${locale}/admin/login`); return null; }
        return r.json();
      })
      .then((data) => { if (data) { setSuppliers(data); setLoading(false); } });
  }, []);

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    const res = await fetch(`/api/admin/suppliers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setSuppliers((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push(`/${locale}/admin/login`);
  }

  const filtered = filter === 'all' ? suppliers : suppliers.filter((s) => s.status === filter);
  const counts = {
    all: suppliers.length,
    pending:  suppliers.filter((s) => s.status === 'pending').length,
    approved: suppliers.filter((s) => s.status === 'approved').length,
    rejected: suppliers.filter((s) => s.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">KTZ</span>
          </div>
          <span className="font-bold text-gray-900">KTZ Export</span>
          <span className="text-gray-400 text-sm ml-2">/ {t('dashboardTitle')}</span>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
          {t('logout')} →
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('suppliersTitle')}</h1>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all','pending','approved','rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
              }`}
            >
              {f === 'all' ? 'Все' : t(f as any)} ({counts[f]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Загружаем...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">{t('noApplications')}</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((supplier) => (
              <div key={supplier.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="font-bold text-gray-900">{supplier.companyName}</h2>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[supplier.status]}`}>
                        {t(`status.${supplier.status}` as any)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                      <span>🌍 {supplier.country}</span>
                      <span>👤 {supplier.contactName}</span>
                      <span>📧 {supplier.email}</span>
                      <span>📞 {supplier.phone}</span>
                      <span>📦 {supplier.products.join(', ')}</span>
                      <span>⚖️ {supplier.annualVolume}</span>
                    </div>
                    {supplier.description && (
                      <p className="mt-3 text-sm text-gray-500 border-t border-gray-50 pt-3">{supplier.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {t('submittedAt')}: {new Date(supplier.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>

                  {/* Actions */}
                  {supplier.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => updateStatus(supplier.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        {t('approve')} ✓
                      </button>
                      <button
                        onClick={() => updateStatus(supplier.id, 'rejected')}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                      >
                        {t('reject')} ✗
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
