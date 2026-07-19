'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Supplier } from '@/lib/db';
import { PRODUCT_LIST } from '@/lib/products';

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const PRODUCT_LABELS: Record<string, string> = {
  flour_feed: 'Кормовая мука', flour_wheat: 'Пшеничная мука', wheat: 'Пшеница',
  barley: 'Ячмень', bran: 'Пшеничные отруби', flaxseed: 'Семена льна',
  sunflower: 'Семена подсолнечника', corn: 'Кукуруза',
};

const LOADING_STATIONS = ['Костанай', 'Кокшетау', 'Петропавловск', 'Алматы', 'Павлодар', 'Астана', 'Актобе', 'Шымкент', 'Другая'];

const emptyForm = {
  companyName: '', country: 'Казахстан', contactName: '', email: '', phone: '',
  products: [] as string[], annualVolume: '', description: '', elevatorName: '',
  loadingStation: '', password: '',
};

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [createErr, setCreateErr] = useState('');

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

  async function deleteSupplier(id: string, companyName: string) {
    if (!confirm(`Удалить поставщика «${companyName}»? Это действие необратимо.`)) return;
    const res = await fetch(`/api/admin/suppliers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateErr('');
    setCreating(true);
    const res = await fetch('/api/admin/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    setCreating(false);
    if (res.ok) {
      const s = await res.json();
      setSuppliers((prev) => [s, ...prev]);
      setShowCreate(false);
      setCreateForm(emptyForm);
    } else {
      const data = await res.json();
      setCreateErr(data.error || 'Ошибка при создании');
    }
  }

  function toggleProduct(pid: string) {
    setCreateForm((prev) => ({
      ...prev,
      products: prev.products.includes(pid)
        ? prev.products.filter((p) => p !== pid)
        : [...prev.products, pid],
    }));
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('suppliersTitle')}</h1>
          <button
            onClick={() => { setShowCreate(!showCreate); setCreateErr(''); }}
            className="bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {showCreate ? '✕ Отмена' : '+ Создать поставщика'}
          </button>
        </div>

        {/* Create Supplier Form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-primary-200 shadow-sm p-6 mb-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Новый поставщик</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Компания *</label>
                <input required value={createForm.companyName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, companyName: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="ТОО Агрохолдинг" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Страна *</label>
                <input required value={createForm.country}
                  onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Казахстан" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Контактное лицо *</label>
                <input required value={createForm.contactName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, contactName: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Иванов Иван" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email *</label>
                <input required type="email" value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="info@company.kz" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Телефон *</label>
                <input required value={createForm.phone}
                  onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="+7 701 000 00 00" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Годовой объём</label>
                <input value={createForm.annualVolume}
                  onChange={(e) => setCreateForm((p) => ({ ...p, annualVolume: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="10 000 тонн/год" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Элеватор</label>
                <input value={createForm.elevatorName}
                  onChange={(e) => setCreateForm((p) => ({ ...p, elevatorName: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Элеватор г. Астана" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Станция погрузки</label>
                <select value={createForm.loadingStation}
                  onChange={(e) => setCreateForm((p) => ({ ...p, loadingStation: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">— Выберите —</option>
                  {LOADING_STATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Пароль * (мин. 8 символов)</label>
                <input required minLength={8} type="password" value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Минимум 8 символов" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Описание</label>
              <textarea rows={2} value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" placeholder="Краткое описание компании" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Продукты *</label>
              <div className="flex flex-wrap gap-2">
                {PRODUCT_LIST.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      createForm.products.includes(p.id)
                        ? `bg-gradient-to-r ${p.from} ${p.to} ${p.text} ${p.border} font-medium`
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                  >
                    {p.emoji} {PRODUCT_LABELS[p.id]}
                  </button>
                ))}
              </div>
            </div>

            {createErr && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{createErr}</p>}

            <button
              type="submit"
              disabled={creating}
              className="bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              {creating ? 'Создаём...' : 'Создать поставщика'}
            </button>
          </form>
        )}

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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="font-bold text-gray-900">{supplier.companyName}</h2>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[supplier.status]}`}>
                        {t(`status.${supplier.status}` as any)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                      <span>🌍 {supplier.country}</span>
                      <span>👤 {supplier.contactName}</span>
                      <span>📧 {supplier.email}</span>
                      <span>📞 {supplier.phone}</span>
                      <span>📦 {supplier.products.map((p) => PRODUCT_LABELS[p] ?? p).join(', ')}</span>
                      <span>⚖️ {supplier.annualVolume}</span>
                      {supplier.loadingStation && <span>🚉 {supplier.loadingStation}</span>}
                    </div>
                    {supplier.description && (
                      <p className="mt-3 text-sm text-gray-500 border-t border-gray-50 pt-3">{supplier.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {t('submittedAt')}: {new Date(supplier.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>

                  {/* Actions — always visible for all statuses */}
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {supplier.status !== 'approved' && (
                      <button
                        onClick={() => updateStatus(supplier.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                      >
                        {t('approve')} ✓
                      </button>
                    )}
                    {supplier.status !== 'rejected' && (
                      <button
                        onClick={() => updateStatus(supplier.id, 'rejected')}
                        className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                      >
                        {t('reject')} ✗
                      </button>
                    )}
                    <button
                      onClick={() => deleteSupplier(supplier.id, supplier.companyName)}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
